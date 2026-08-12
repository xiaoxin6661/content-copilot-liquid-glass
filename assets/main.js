// ============================================================
// Content Copilot v3 · shared utilities
// ============================================================
(function () {
  // toast
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(stack));
  window.toast = function (msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = msg;
    stack.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };

  // mouse parallax
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.stat, .funnel, .glass.panel-hover').forEach(el => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        el.style.setProperty('--mx', `${x}%`);
        el.style.setProperty('--my', `${y}%`);
      }
    });
  });

  window.store = {
    get(k, def) {
      try { const v = localStorage.getItem('cc_' + k); return v ? JSON.parse(v) : def; }
      catch { return def; }
    },
    set(k, v) { localStorage.setItem('cc_' + k, JSON.stringify(v)); },
  };

  window.renderSidebar = function () {
    return `
    <aside class="sidebar glass" role="banner">
      <div class="brand">
        <div class="brand-mark">
          <span class="brand-dot"></span>
          <span class="brand-dot alt"></span>
        </div>
        <div class="brand-text">
          <div class="brand-name">Content Copilot</div>
          <div class="brand-tag">Sigma × 达人合作工作台</div>
        </div>
      </div>
      <nav class="nav" aria-label="主导航">
        <a class="nav-item glass-chip" href="./index.html">
          <span class="nav-ico">📋</span>
          <span class="nav-label">达人管理</span>
        </a>
        <a class="nav-item glass-chip" href="./creators.html">
          <span class="nav-ico">👥</span>
          <span class="nav-label">达人清单</span>
        </a>
        <a class="nav-item glass-chip" href="./review.html">
          <span class="nav-ico">✅</span>
          <span class="nav-label">内容审核</span>
        </a>
        <a class="nav-item glass-chip" href="./briefs.html">
          <span class="nav-ico">📄</span>
          <span class="nav-label">Brief 设置</span>
        </a>
      </nav>
      <div class="sidebar-foot">
        <div class="glass-chip" style="padding:12px 14px;font-size:11px;color:var(--text-soft);text-align:left;line-height:1.6;">
          <b style="color:var(--text);">达人合作全流程工作台</b><br>催稿提醒 · Brief 质检 · 好内容评估
        </div>
      </div>
    </aside>`;
  };

  window.renderBackdrop = function () {
    return `
    <div class="backdrop" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      <div class="grain"></div>
    </div>`;
  };

  // Brief drawer
  function activeBrief() {
    const stored = store.get('customBrief', null);
    return stored || window.CC_DATA.brief;
  }
  window.getActiveBrief = activeBrief;

  window.openBrief = function () {
    let d = document.getElementById('briefDrawer');
    if (d) { renderBriefDrawer(); d.classList.add('open'); return; }
    d = document.createElement('div');
    d.id = 'briefDrawer';
    d.className = 'brief-drawer open';
    document.body.appendChild(d);
    renderBriefDrawer();
  };

  function renderBriefDrawer() {
    const B = activeBrief();
    const imported = B.__imported;
    const stats = B.__importStats || {};
    const banner = imported ? `
      <div class="import-banner">
        <div>
          <div style="font-size:13px;font-weight:600;">📄 已导入自定义 Brief</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
            来源：${stats.fileName||'外部 PDF'} · ${stats.pages||'?'} 页 · 命中功能 ${stats.featuresHit||0}/12
            · 抽取话题 ${stats.tagsHit||0} 个
          </div>
        </div>
        <button class="btn-ghost" onclick="resetBrief()">↺ 恢复官方</button>
      </div>
    ` : '';

    const d = document.getElementById('briefDrawer');
    d.innerHTML = `
      <div class="brief-drawer-mask" onclick="closeBrief()"></div>
      <div class="brief-drawer-panel glass">
        <div class="drawer-head">
          <div>
            <div class="drawer-title">Sigma × 达人合作 Brief</div>
            <div class="drawer-sub">${B.brand.slogan}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <label class="btn-primary" style="cursor:pointer;">
              📄 从 PDF 导入
              <input type="file" accept="application/pdf" onchange="handleBriefPdf(event)" style="display:none;">
            </label>
            <button class="btn-ghost" onclick="closeBrief()">✕</button>
          </div>
        </div>
        <div class="drawer-body">
          ${banner}
          <div class="drawer-sec">
            <div class="drawer-sec-title">🎯 必带元素</div>
            <table class="rule-table">
              <tr><td>话题</td><td>${B.mustHave.hashtags.map(h => `<span class="case-tag hot">${h}</span>`).join(' ')}</td></tr>
              <tr><td>@ 官方</td><td>${B.mustHave.mention}</td></tr>
              <tr><td>强制功能</td><td>${B.mustHave.forceFeature}</td></tr>
              <tr><td>置顶评论</td><td>${B.mustHave.pin}</td></tr>
            </table>
          </div>
          <div class="drawer-sec">
            <div class="drawer-sec-title">📐 硬性规则</div>
            <table class="rule-table">
              <tr><td>图文</td><td>${B.rules.image.count} · 产品图 ${B.rules.image.productRatio} · 前 3 张含产品 · 非末 3 张</td></tr>
              <tr><td>视频</td><td>${B.rules.video.duration} · 产品占比 ${B.rules.video.productRatio} · 首现 ${B.rules.video.firstAppear} · ${B.rules.video.segmentMin} · ${B.rules.video.lastFifteen}</td></tr>
              <tr><td>文案</td><td>${B.rules.copy.minChars} · ${B.rules.copy.focus}</td></tr>
            </table>
          </div>
          <div class="drawer-sec">
            <div class="drawer-sec-title">💊 12 大功能</div>
            <div class="feature-grid">
              ${B.features.map(f => `
                <div class="feature-card ${f.must?'must':''}">
                  ${f.must ? '<div class="must-badge">必展示</div>' : ''}
                  <div class="fname">${f.name}${f.__hit?' <span style="font-size:10px;color:rgba(20,120,80,0.9);">✓</span>':''}</div>
                  <div class="fdesc">${f.desc}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="drawer-sec">
            <div class="drawer-sec-title">🎁 流量激励</div>
            <table class="rule-table">
              ${B.incentive.map(r => `<tr><td>${r.key}</td><td><b>${r.flow}</b></td><td style="color:var(--text-soft);">${r.hint}</td></tr>`).join('')}
            </table>
          </div>
          <div class="drawer-sec">
            <div class="drawer-sec-title">⊘ 违禁项</div>
            <div class="forbid-list">
              ${B.forbid.map(f => `<div class="forbid-item">${f.text}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.handleBriefPdf = async function (ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast('仅支持 PDF'); return; }
    if (!window.BRIEF_IMPORT) { toast('导入模块未加载'); return; }
    toast('正在解析 PDF…');
    try {
      const parsed = await window.BRIEF_IMPORT.importFromPdf(file, window.CC_DATA.brief);
      store.set('customBrief', parsed);
      toast(`✓ 导入完成 · ${parsed.__importStats.pages} 页 · 命中 ${parsed.__importStats.featuresHit}/12 功能`);
      renderBriefDrawer();
    } catch (e) {
      console.error(e);
      toast('✗ 解析失败：' + (e.message || e));
    }
  };

  window.resetBrief = function () {
    if (!confirm('确定恢复为官方 Brief？已导入的内容会被清除。')) return;
    store.set('customBrief', null);
    localStorage.removeItem('cc_customBrief');
    toast('已恢复为官方 Brief');
    renderBriefDrawer();
  };
  window.closeBrief = function () {
    const d = document.getElementById('briefDrawer');
    if (d) d.classList.remove('open');
  };

  // copy helper
  window.copyText = async function (text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg || '已复制到剪贴板');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      toast(msg || '已复制到剪贴板');
    }
  };

  window.mountShell = function (mainHTML) {
    document.body.innerHTML = renderBackdrop() + `<div class="shell">${renderSidebar()}<main class="content-scroll">${mainHTML || ''}</main></div>`;
    // active nav
    document.querySelectorAll('.nav-item').forEach(a => {
      const href = (a.getAttribute('href') || '').replace('./', '');
      const path = location.pathname.split('/').pop() || 'index.html';
      if (href === path) {
        a.classList.add('active');
        const ind = document.createElement('span');
        ind.className = 'nav-indicator';
        a.appendChild(ind);
      }
    });
  };
})();
