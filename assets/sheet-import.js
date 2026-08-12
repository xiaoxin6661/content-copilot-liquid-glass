// ============================================================
// 从登记表导入 · 粘贴 TSV/CSV 解析
// ============================================================
window.SHEET_IMPORT = (function () {
  // 解析口语化日期："7/30初"、"7.30"、"8.6&8.10"、"周五或周日未发布"
  function parseDate(raw) {
    if (!raw) return { ok: false, raw: '', hint: '空' };
    const s = raw.trim().replace(/^初稿[:：]?\s*/, '').trim();

    // 8.6&8.10 → 取第一个
    const multi = s.match(/(\d{1,2})[.\/](\d{1,2}).*?[&+、,，]\s*(\d{1,2})[.\/](\d{1,2})/);
    if (multi) {
      const m1 = +multi[1], d1 = +multi[2], m2 = +multi[3], d2 = +multi[4];
      return { ok: true, date: buildISO(m1, d1), hint: `双日期 ${m1}/${d1} & ${m2}/${d2}`, raw };
    }

    // 7/30初 or 7.30 or 8.13
    const single = s.match(/(\d{1,2})[.\/](\d{1,2})/);
    if (single) {
      const m = +single[1], d = +single[2];
      const suffix = s.replace(single[0], '').trim();
      return { ok: true, date: buildISO(m, d), hint: suffix ? `${m}/${d}（${suffix}）` : `${m}/${d}`, raw };
    }

    // 8月xx日
    const cn = s.match(/(\d{1,2})月(\d{1,2})日?/);
    if (cn) return { ok: true, date: buildISO(+cn[1], +cn[2]), hint: `${cn[1]}/${cn[2]}`, raw };

    return { ok: false, date: null, hint: raw, raw };
  }

  function buildISO(month, day) {
    const y = new Date('2026-07-30').getFullYear();
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  // 解析笔记类型
  function parseNoteType(raw) {
    if (!raw) return 'image';
    return raw.includes('视频') ? 'video' : 'image';
  }

  // 状态映射
  function parseStatus(raw) {
    if (!raw) return '未发布';
    if (raw.includes('推流')) return '推流中';
    if (raw.includes('已发布')) return '已发布';
    if (raw.includes('归档')) return '已归档';
    return '未发布';
  }

  // 粘贴的表格文本 → 结构化行
  // 支持：制表符分隔（复制自表格默认格式）
  function parsePaste(text) {
    const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l);
    if (!lines.length) return { rows: [], warnings: ['粘贴内容为空'] };

    // 检测分隔符
    const firstLine = lines[0];
    const sep = firstLine.includes('\t') ? '\t' : (firstLine.split(',').length >= 4 ? ',' : '\t');

    // 检测表头（首行有"发布日期"或类似关键字则跳过）
    let headers = null;
    let startIdx = 0;
    const firstCells = firstLine.split(sep).map(c => c.trim());
    if (/日期|名称|owner|状态|链接|形式/.test(firstLine)) {
      headers = firstCells;
      startIdx = 1;
    }

    const rows = [];
    const warnings = [];

    // 列位置识别
    let idxDate = 0, idxName = 1, idxType = 2, idxOwner = 3, idxStatus = 4, idxUrl = 5;
    if (headers) {
      headers.forEach((h, i) => {
        if (/日期/.test(h)) idxDate = i;
        else if (/名称|昵称|达人/.test(h)) idxName = i;
        else if (/形式|类型/.test(h)) idxType = i;
        else if (/owner|负责|运营/i.test(h)) idxOwner = i;
        else if (/状态/.test(h)) idxStatus = i;
        else if (/链接|url|主页/i.test(h)) idxUrl = i;
      });
    }

    for (let i = startIdx; i < lines.length; i++) {
      const cells = lines[i].split(sep).map(c => c.trim());
      if (cells.length < 2) continue;

      const nameRaw = cells[idxName] || '';
      if (!nameRaw) continue;

      const dateParsed = parseDate(cells[idxDate] || '');
      const row = {
        rowIndex: i + 1,
        name: nameRaw,
        noteType: parseNoteType(cells[idxType] || ''),
        noteTypeRaw: cells[idxType] || '',
        owner: cells[idxOwner] || '',
        status: parseStatus(cells[idxStatus] || ''),
        statusRaw: cells[idxStatus] || '',
        xhsUrl: cells[idxUrl] || '',
        expectPublishAt: dateParsed.date,
        dateHint: dateParsed.hint,
        dateOk: dateParsed.ok,
        raw: lines[i],
      };
      rows.push(row);
    }

    return { rows, warnings, sep, hadHeader: !!headers };
  }

  // 与现有 collabs 做去重（按 name + expectDate 生成 syncKey）
  function reconcile(rows, existingCollabs) {
    const existingKeys = new Set(
      existingCollabs.filter(c => c.syncKey).map(c => c.syncKey)
    );
    let toAdd = 0, toUpdate = 0, unchanged = 0;
    const enriched = rows.map(r => {
      const key = `${r.name}__${r.expectPublishAt || r.dateHint || 'nodate'}`;
      const exists = existingKeys.has(key);
      if (exists) {
        // 简化：认为已存在的就是不变（如果实际状态不同再更新）
        unchanged++;
      } else {
        toAdd++;
      }
      return { ...r, syncKey: key, exists };
    });
    return { rows: enriched, toAdd, toUpdate, unchanged };
  }

  // 把导入行转为 collab
  function toCollab(row, defaultOwner) {
    // status 映射到 stage
    let stage = 'invited';
    if (row.status === '推流中') stage = 'promoting';
    else if (row.status === '已发布') stage = 'published';
    else stage = 'invited'; // 未发布聚合态，默认 invited

    return {
      id: 'im_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      name: row.name,
      fans: '-',
      direction: 'runner',
      tag: row.noteType === 'video' ? '视频' : '图文',
      stage,
      stageAt: new Date().toISOString(),
      expectPublishAt: row.expectPublishAt,
      dateHint: row.dateHint,
      dateOk: row.dateOk,
      publishStatus: row.status,
      owner: row.owner || defaultOwner || '',
      xhsUrl: row.xhsUrl,
      note: row.dateOk ? '' : `⚠️ 日期需人工确认："${row.dateHint}"`,
      source: 'imported',
      syncKey: row.syncKey,
      syncedAt: new Date().toISOString(),
    };
  }

  return { parsePaste, reconcile, toCollab };
})();
