// ============================================================
// Brief 从 PDF 导入 · 使用 pdf.js CDN
// ============================================================
window.BRIEF_IMPORT = (function () {
  let pdfJsReady = null;

  async function ensurePdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (pdfJsReady) return pdfJsReady;
    pdfJsReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('pdf.js CDN 加载失败'));
      document.head.appendChild(s);
    });
    return pdfJsReady;
  }

  async function extractText(file) {
    const pdfjs = await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      text += tc.items.map(it => it.str).join(' ') + '\n\n';
    }
    return { text, pages: pdf.numPages };
  }

  // ---------------- 启发式解析 ----------------
  // 从原始文本里抓出 slogan / 必带话题 / @ / 12 大功能 / 违禁项
  function parse(rawText, base) {
    const R = JSON.parse(JSON.stringify(base));
    R.__imported = true;
    R.__importAt = new Date().toISOString();

    const t = rawText.replace(/\s+/g, ' ').trim();

    // slogan
    const sloganMatch = t.match(/[「『"]([^「『"』」]{6,40})[」』"]/);
    if (sloganMatch) R.brand.slogan = sloganMatch[1];

    // 必带话题（找 #xxx）
    const tags = [...t.matchAll(/#([A-Za-z0-9\u4e00-\u9fa5]{2,15})/g)].map(m => m[1]);
    if (tags.length) {
      const uniq = [...new Set(tags)].slice(0, 6);
      R.mustHave.hashtags = uniq.map(x => '#' + x);
    }

    // @官方
    const atMatch = t.match(/@\s*([A-Za-z0-9\u4e00-\u9fa5]{2,15})/);
    if (atMatch) R.mustHave.mention = '@' + atMatch[1] + ' 官方账号';

    // 图文张数
    const imgCnt = t.match(/(\d+)\s*[-–—～~至到]\s*(\d+)\s*张/);
    if (imgCnt) R.rules.image.count = `${imgCnt[1]}–${imgCnt[2]} 张`;

    // 产品图占比
    const ratio = t.match(/[产品]图.*?([≥不少于大于超过]+)\s*(\d{1,3})\s*%/);
    if (ratio) R.rules.image.productRatio = `≥ ${ratio[2]}%`;

    // 视频时长
    const dur = t.match(/(\d+)\s*[-–—～~至到]\s*(\d+)\s*分钟/);
    if (dur) R.rules.video.duration = `${dur[1]}–${dur[2]} 分钟`;

    // 首现秒数
    const first = t.match(/(?:首次|第一次|不得晚于).*?(\d+)\s*秒/);
    if (first) R.rules.video.firstAppear = `≤ 视频第 ${first[1]} 秒`;

    // 字数
    const chars = t.match(/(?:不少于|≥|至少)\s*(\d+)\s*字/);
    if (chars) R.rules.copy.minChars = `≥ ${chars[1]} 字`;

    // 初始流量
    const imgFlow = t.match(/图文.*?(\d+)\s*w/i);
    if (imgFlow) R.rules.image.initialFlow = imgFlow[1] + 'w';
    const vFlow = t.match(/视频.*?(\d+)\s*w/i);
    if (vFlow) R.rules.video.initialFlow = vFlow[1] + 'w';

    // 12 大功能 — 从文本里提取（关键词命中即视为已被 brief 覆盖）
    // 保留 base 里的功能，但标注命中
    R.features = R.features.map(f => {
      const kw = f.name.split(/[\s（(]/)[0];
      return { ...f, __hit: t.includes(kw) };
    });

    // 天数：45 天内不得删除
    const noDelete = t.match(/(\d+)\s*天[内以].*?(?:删除|隐藏)/);
    if (noDelete) {
      R.forbid = R.forbid.map(f => f.key === 'delete'
        ? { ...f, text: `合作笔记 ${noDelete[1]} 天内不得删除、隐藏` }
        : f);
    }

    // 记录关键指标供 UI 展示
    R.__importStats = {
      pages: null,
      chars: t.length,
      tagsHit: tags.length,
      atFound: !!atMatch,
      featuresHit: R.features.filter(f => f.__hit).length,
      hadDurRule: !!dur,
      hadFirstRule: !!first,
    };
    return R;
  }

  async function importFromPdf(file, baseBrief) {
    const { text, pages } = await extractText(file);
    const parsed = parse(text, baseBrief);
    parsed.__importStats.pages = pages;
    parsed.__importStats.fileName = file.name;
    parsed.__rawText = text.slice(0, 800); // 存前 800 字给 UI 预览
    return parsed;
  }

  return { importFromPdf };
})();
