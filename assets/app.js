/* =====================================================================
   MASARU Branding Portal — shared runtime
   ต้องโหลด @supabase/supabase-js v2 ก่อนไฟล์นี้
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- 0) กันจอขาว ----------------
     ถ้าอะไรพังก่อนหน้าจะวาด ให้ขึ้นข้อความบอกสาเหตุแทนจอว่าง ๆ  */
  function paintFatal(title, detail, hint) {
    function draw() {
      var box = document.createElement('div');
      box.setAttribute('data-mb-fatal', '1');
      box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#f2f4f8;' +
        "font-family:'IBM Plex Sans Thai',system-ui,sans-serif;color:#16233f;padding:24px;overflow:auto;" +
        'display:flex;align-items:center;justify-content:center';
      box.innerHTML =
        '<div style="max-width:620px;width:100%;background:#fff;border:1px solid #e2e7ef;' +
        'border-radius:16px;padding:26px 28px;box-shadow:0 10px 40px rgba(24,35,56,.12)">' +
        '<div style="font-size:30px;line-height:1">⚠️</div>' +
        '<h2 style="margin:10px 0 6px;font-size:19px">' + title + '</h2>' +
        '<p style="margin:0 0 14px;color:#64708a;font-size:13.5px">' + (hint || '') + '</p>' +
        '<pre style="background:#FAFBFD;border:1px solid #eef1f7;border-radius:10px;padding:12px;' +
        'font-size:12px;white-space:pre-wrap;word-break:break-word;color:#d62030;margin:0 0 16px">' +
        String(detail || '').replace(/</g, '&lt;') + '</pre>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<a href="check.html" style="background:#16294d;color:#fff;padding:9px 15px;border-radius:9px;' +
        'text-decoration:none;font-size:13px;font-weight:600">เปิดหน้าตรวจสอบระบบ</a>' +
        '<a href="javascript:location.reload()" style="background:#fff;color:#16294d;border:1px solid #e2e7ef;' +
        'padding:9px 15px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600">ลองใหม่</a>' +
        '</div></div>';
      document.body.appendChild(box);
    }
    if (document.body) draw();
    else document.addEventListener('DOMContentLoaded', draw);
  }

  function fatalOnce(title, detail, hint) {
    if (document.querySelector('[data-mb-fatal]')) return;
    paintFatal(title, detail, hint);
  }

  window.addEventListener('error', function (e) {
    fatalOnce('หน้านี้โหลดไม่สำเร็จ', (e.message || 'unknown') +
      (e.filename ? '\n' + e.filename + ':' + e.lineno : ''),
      'เกิดข้อผิดพลาดใน JavaScript — ส่งข้อความด้านล่างให้ผู้ดูแลระบบได้เลย');
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason || {};
    fatalOnce('เชื่อมต่อฐานข้อมูลไม่สำเร็จ', (r.message || JSON.stringify(r)),
      'มักเกิดจาก URL/Key ของ Supabase ไม่ถูก หรือยังไม่ได้รัน schema.sql / schema2.sql');
  });

  /* ---------------- 1) CONFIG ---------------- */
  const CFG = {
    url: 'https://espxzszehvtcbiudwfit.supabase.co',
    key: 'sb_publishable_0I3vRvYoFE_8Fi6x_X2-CA_iGhN_JO7',
    version: 'v8',
    // รับได้หลายรหัส (กันกรณีเบราว์เซอร์ยังใช้ไฟล์เก่า / คนจำรหัสเดิม)
    inviteCode: 'MASARU-BRAND-2569',
    inviteCodes: ['MASARU-BRAND-2569', 'MASARU-BRAND'],
    brands: ['MASARU', 'KOSEN', 'FROGGER', 'TAITITECH', 'IKOMAX'],
    platforms: ['TIKTOK', 'LAZADA'],
    cancelThreshold: 70
  };

  // ไลบรารี Supabase ต้องโหลดมาก่อนไฟล์นี้ — ถ้าไม่มาให้บอกตรง ๆ
  if (!window.supabase || !window.supabase.createClient) {
    window.MB = { failed: true, reason: 'supabase-js not loaded' };
    paintFatal('โหลดไลบรารี Supabase ไม่ได้',
      'window.supabase is undefined',
      'เบราว์เซอร์เข้า cdn.jsdelivr.net ไม่ได้ (เน็ตบริษัทบล็อก หรือ CDN ล่ม)');
    return;
  }

  const sb = window.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'masaru-branding-auth' }
  });

  /* เมนูสำรอง — ใช้เมื่อยังไม่ได้รัน schema2.sql (กันพอร์ทัลว่างเปล่า)
     ผู้ดูแลรัน schema2.sql เมื่อไหร่ ระบบจะสลับไปใช้ข้อมูลจริงในตาราง brand_systems ทันที */
  const MENU_FALLBACK = [
    { code:'SALES', parent_code:null, name:'ระบบวิเคราะห์ยอดขาย', icon:'ti-chart-line', url:null, color:'c1', sort_order:10,
      description:'ภาพรวม GMV เป้า Achievement กราฟยอดขาย สัดส่วนแพลตฟอร์ม และสินค้าขายดี' },
    { code:'CREATOR', parent_code:null, name:'ระบบครีเอเตอร์ & KOL', icon:'ti-star', url:null, color:'c3', sort_order:20,
      description:'อันดับครีเอเตอร์ ยอดแยก VDO/LIVE สินค้าขายดีต่อคน และ Blacklist' },
    { code:'DATA', parent_code:null, name:'ระบบข้อมูล & ตั้งค่า', icon:'ti-database-cog', url:null, color:'c4', sort_order:30,
      description:'นำเข้าไฟล์จาก JST/TikTok/Lazada ผูกแบรนด์ ตั้งเป้า และจัดการสิทธิ์' },
    { code:'DASHBOARD', parent_code:'SALES', name:'Dashboard ภาพรวม', icon:'ti-layout-dashboard', url:'dashboard.html', color:'c1', sort_order:10,
      description:'KPI 6 ตัว กราฟรายวัน/สัปดาห์/เดือน เทียบเป้า และ AI Insights' },
    { code:'PRODUCTS', parent_code:'SALES', name:'สินค้า / Top SKU', icon:'ti-package', url:'products.html', color:'c2', sort_order:20,
      description:'จัดอันดับ SKU ขายดี Top 10/20/50 แยกแพลตฟอร์มและแบรนด์' },
    { code:'CREATORS', parent_code:'CREATOR', name:'อันดับครีเอเตอร์ & Blacklist', icon:'ti-users-group', url:'creators.html', color:'c3', sort_order:10,
      description:'อันดับ 10/20/50 ยอดแยก VDO vs LIVE และ Top 5 SKU ต่อคน' },
    { code:'IMPORT', parent_code:'DATA', name:'นำเข้าข้อมูล', icon:'ti-upload', url:'import.html', color:'c4', sort_order:10,
      description:'อัปโหลด JST / TikTok / Lazada / Creator / Ads' },
    { code:'SETTINGS', parent_code:'DATA', name:'ตั้งค่า & สิทธิ์', icon:'ti-settings', url:'settings.html', color:'c5', sort_order:20,
      description:'เป้ายอดขาย SKU Master Blacklist ผู้ใช้ และการมองเห็นระบบ' }
  ];

  /* ---------------- 1b) INVITE CODE ---------------- */
  // ตัดช่องว่าง/ขีด/ตัวพิมพ์ใหญ่-เล็กออกก่อนเทียบ กัน copy-paste เพี้ยน
  function normCode(s) {
    return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  function checkInvite(input) {
    const want = (CFG.inviteCodes && CFG.inviteCodes.length)
      ? CFG.inviteCodes : [CFG.inviteCode];
    const got = normCode(input);
    for (let i = 0; i < want.length; i++) {
      if (normCode(want[i]) === got) return true;
    }
    return false;
  }
  // ข้อความช่วยดีบัก: ไฟล์ app.js ที่เบราว์เซอร์โหลดอยู่ รับรหัสอะไรบ้าง
  function inviteHint() {
    const want = (CFG.inviteCodes && CFG.inviteCodes.length)
      ? CFG.inviteCodes : [CFG.inviteCode];
    return 'ไฟล์ที่เบราว์เซอร์โหลดอยู่ (' + CFG.version + ') รับรหัส: ' + want.join(' หรือ ');
  }

  /* ---------------- 2) ROLE LEVELS ---------------- */
  // ระดับสิทธิ์: 1 = ดูอย่างเดียว, 2 = ทำงานได้, 3 = ผู้ดูแล
  const ROLE_RANK = { viewer: 1, branding: 2, manager: 2, analyst: 2, creator: 2, admin: 3 };

  /* ---------------- 3) FORMATTERS ---------------- */
  const nf0 = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmt = {
    n: (v) => nf0.format(Number(v) || 0),
    m: (v) => nf2.format(Number(v) || 0),
    baht: (v) => '฿' + nf0.format(Math.round(Number(v) || 0)),
    short: (v) => {
      const n = Number(v) || 0, a = Math.abs(n);
      if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
      if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'K';
      return nf0.format(n);
    },
    pct: (v, d) => (Number(v) || 0).toFixed(d === undefined ? 1 : d) + '%',
    date: (d) => {
      if (!d) return '-';
      const x = new Date(d);
      return x.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
    },
    dt: (d) => {
      if (!d) return '-';
      return new Date(d).toLocaleString('th-TH', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    }
  };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------------- 4) DATE HELPERS ---------------- */
  const iso = (d) => {
    const x = new Date(d);
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  function presetRange(key) {
    const today = new Date();
    switch (key) {
      case 'today':  return [iso(today), iso(today)];
      case '7d':     return [iso(addDays(today, -6)), iso(today)];
      case '30d':    return [iso(addDays(today, -29)), iso(today)];
      case 'mtd':    return [iso(new Date(today.getFullYear(), today.getMonth(), 1)), iso(today)];
      case 'lastm': {
        const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const e = new Date(today.getFullYear(), today.getMonth(), 0);
        return [iso(s), iso(e)];
      }
      case 'ytd':    return [iso(new Date(today.getFullYear(), 0, 1)), iso(today)];
      default:       return [iso(addDays(today, -29)), iso(today)];
    }
  }

  /* ---------------- 5) SUPABASE HELPERS ---------------- */
  // Supabase REST อ่านได้สูงสุด ~1000 แถว/ครั้ง -> ต้องวนดึงเป็นหน้า ๆ
  async function pageAll(build, pageSize) {
    const size = pageSize || 1000;
    let from = 0, out = [];
    for (;;) {
      const { data, error } = await build().range(from, from + size - 1);
      if (error) throw error;
      out = out.concat(data || []);
      if (!data || data.length < size) break;
      from += size;
    }
    return out;
  }

  async function rpc(name, args) {
    const { data, error } = await sb.rpc(name, args || {});
    if (error) throw error;
    return data;
  }

  // insert เป็นก้อน ๆ กัน payload ใหญ่เกิน
  async function chunkUpsert(table, rows, opts) {
    const size = (opts && opts.size) || 400;
    let done = 0;
    for (let i = 0; i < rows.length; i += size) {
      const slice = rows.slice(i, i + size);
      let q = sb.from(table).upsert(slice, opts && opts.onConflict ? { onConflict: opts.onConflict } : undefined);
      const { error } = await q;
      if (error) throw error;
      done += slice.length;
      if (opts && opts.onProgress) opts.onProgress(done, rows.length);
    }
    return done;
  }

  /* ---------------- 6) AUTH + MENU ---------------- */
  const state = {
    user: null, profile: null,
    role: 'viewer', roleName: 'ดูอย่างเดียว', level: 1,
    menu: [], roots: [], childrenOf: {}
  };

  function indexMenu(rows) {
    state.menu = rows || [];
    state.roots = [];
    state.childrenOf = {};
    state.menu.forEach(function (r) {
      if (r.parent_code) {
        (state.childrenOf[r.parent_code] = state.childrenOf[r.parent_code] || []).push(r);
      } else {
        state.roots.push(r);
      }
    });
    const bySort = function (a, b) {
      return (a.sort_order - b.sort_order) || String(a.name).localeCompare(String(b.name), 'th');
    };
    state.roots.sort(bySort);
    Object.keys(state.childrenOf).forEach(function (k) { state.childrenOf[k].sort(bySort); });
  }

  /** URL ที่ควรเปิดของแถวเมนู: ถ้าไม่ระบุ url และมีเมนูย่อย -> ไปหน้า hub กลาง */
  function linkOf(row) {
    if (row.url) return row.url;
    return 'sys.html?code=' + encodeURIComponent(row.code);
  }

  function currentFile() {
    const f = location.pathname.split('/').pop() || 'index.html';
    return f === '' ? 'index.html' : f;
  }

  /** หาแถวเมนูของหน้าปัจจุบันจากชื่อไฟล์ */
  function rowForFile(file) {
    for (let i = 0; i < state.menu.length; i++) {
      const u = state.menu[i].url;
      if (u && u.split('?')[0] === file) return state.menu[i];
    }
    return null;
  }

  async function loadProfile(user) {
    state.user = user;
    // ค่าเริ่มต้นเผื่อ RPC ยังไม่ถูกสร้าง
    state.role = (user.app_metadata && user.app_metadata.role) ||
                 (user.user_metadata && user.user_metadata.role) || 'viewer';
    try {
      const info = await rpc('brand_my_role');
      if (info) {
        state.role = info.role || 'viewer';
        state.roleName = info.role_name || state.role;
        state.level = info.level || 1;
        state.profile = {
          full_name: info.full_name, email: info.email,
          role: info.role, approved: info.approved, active: info.active
        };
      }
    } catch (e) {
      try {
        const r = await sb.from('brand_profiles').select('*').eq('id', user.id).maybeSingle();
        if (r.data) { state.profile = r.data; state.role = r.data.role || 'viewer'; }
      } catch (e2) { /* ตารางอาจยังไม่ถูกสร้าง */ }
    }
    // เมนูจาก DB — ถ้ายังไม่ได้รัน schema2.sql ให้ใช้เมนูสำรอง (พอร์ทัลจะไม่ว่าง)
    state.menuFallback = false;
    try {
      const rows = await rpc('brand_my_menu');
      if (rows && rows.length) { indexMenu(rows); }
      else { indexMenu(MENU_FALLBACK); state.menuFallback = true; }
    } catch (e) {
      indexMenu(MENU_FALLBACK);
      state.menuFallback = true;
    }
    return state;
  }

  function can(min) {
    if (state.role === 'admin') return true;
    const lv = state.level || ROLE_RANK[state.role] || 1;
    return lv >= (ROLE_RANK[min] || 1);
  }

  /**
   * ใช้กับทุกหน้ายกเว้น index
   * - ไม่ล็อกอิน -> เด้งไปหน้า Portal
   * - ไม่มีสิทธิ์เห็นหน้านี้ (ไม่อยู่ในเมนูของ role) -> เด้งกลับ Portal
   */
  async function guard(_legacyId, opts) {
    const { data: { session } } = await sb.auth.getSession();
    const file = currentFile();
    if (!session) { location.replace('index.html?next=' + encodeURIComponent(file)); return null; }
    await loadProfile(session.user);

    if (state.profile && state.profile.active === false) {
      alert('บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
      await signOut(); return null;
    }
    // หน้ารวม (Portal / hub กลาง) ไม่ต้องอยู่ในเมนู — ตรวจสิทธิ์ด้วยตัวเอง
    const OPEN_PAGES = ['index.html', 'sys.html'];
    if (state.menu.length && OPEN_PAGES.indexOf(file) < 0 && !rowForFile(file)) {
      alert('ตำแหน่ง "' + state.roleName + '" ไม่มีสิทธิ์เข้าหน้านี้');
      location.replace('index.html'); return null;
    }
    if (opts && opts.role && !can(opts.role)) {
      alert('บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้');
      location.replace('index.html'); return null;
    }
    renderShell();
    if (window.__boot) window.__boot.ok();   // ผ่านด่านแล้ว — ปิดหน้าจอ "กำลังโหลด"
    return state;
  }

  async function signOut() {
    await sb.auth.signOut();
    location.replace('index.html');
  }

  /* ---------------- 7) SHELL RENDER ---------------- */
  /**
   * แถบข้างสร้างจากเมนูใน DB
   * @param {string} [systemCode] ระบุระบบหลักเอง (ใช้ในหน้า sys.html)
   */
  function renderShell(systemCode) {
    const el = document.getElementById('sidebar');
    if (!el) return;
    const file = currentFile();
    const here = rowForFile(file);
    const rootCode = systemCode || (here && here.parent_code) || null;
    const root = rootCode ? state.menu.find(function (r) { return r.code === rootCode; }) : null;
    const kids = rootCode ? (state.childrenOf[rootCode] || []) : [];

    let html = '';
    html += '<div class="brand"><div class="logo">M</div><div>' +
            '<b>' + esc(root ? root.name : 'MASARU Branding') + '</b>' +
            '<span>' + esc(root ? 'Branding Portal' : 'Brand Analytics') + '</span></div></div>';

    html += '<nav class="nav">';
    html += '<a href="index.html" class="back"><span class="ic"><i class="ti ti-arrow-back-up"></i></span>หน้าหลักทุกระบบ</a>';

    if (kids.length) {
      html += '<div class="grp">เมนูในระบบนี้</div>';
      kids.forEach(function (k) {
        const active = k.url && k.url.split('?')[0] === file;
        html += '<a href="' + esc(linkOf(k)) + '" class="' + (active ? 'active' : '') + '">' +
                '<span class="ic"><i class="ti ' + esc(k.icon || 'ti-point') + '"></i></span>' + esc(k.name) + '</a>';
      });
    }

    html += '</nav>';

    const name = (state.profile && state.profile.full_name) ||
                 (state.user && state.user.email) || '-';
    html += '<div class="foot"><div class="who">' + esc(name) + '</div>' +
            '<div class="role">' + esc(state.roleName || state.role) + '</div>' +
            '<button type="button" id="btnSignOut">ออกจากระบบ</button></div>';
    el.innerHTML = html;

    const btn = document.getElementById('btnSignOut');
    if (btn) btn.addEventListener('click', signOut);
    const mb = document.getElementById('mobileBtn');
    if (mb) mb.addEventListener('click', function () { el.classList.toggle('open'); });
  }

  /* ---------------- 8) UI HELPERS ---------------- */
  let toastTimer = null;
  function toast(msg, type) {
    let t = document.getElementById('__toast');
    if (!t) {
      t = document.createElement('div');
      t.id = '__toast'; t.className = 'toast';
      document.body.appendChild(t);
    }
    t.className = 'toast show' + (type ? ' ' + type : '');
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 3200);
  }

  function segment(container, onChange) {
    container.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      container.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      onChange(b.dataset.v);
    });
  }

  function modal(id, show) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.toggle('show', !!show);
  }

  function tableEmpty(tbody, cols, msg) {
    tbody.innerHTML = '<tr><td colspan="' + cols + '"><div class="empty">' +
                      esc(msg || 'ยังไม่มีข้อมูลในช่วงเวลานี้') + '</div></td></tr>';
  }

  function tableLoading(tbody, cols) {
    let r = '';
    for (let i = 0; i < 5; i++) {
      r += '<tr><td colspan="' + cols + '"><div class="skeleton">&nbsp;</div></td></tr>';
    }
    tbody.innerHTML = r;
  }

  function csv(filename, rows) {
    const body = rows.map(function (r) {
      return r.map(function (c) {
        const s = String(c == null ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\n');
    const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  /* ---------------- 9) CHART DEFAULTS ---------------- */
  const COLORS = {
    navy: '#16294d', blue: '#2E75B6', gold: '#C9A84C', red: '#d62030',
    green: '#1E8E5A', purple: '#6A2FA0', grey: '#9AA5B8', ink: '#182338'
  };

  function chartDefaults() {
    if (!window.Chart) return;
    window.Chart.defaults.font.family = "'IBM Plex Sans Thai',sans-serif";
    window.Chart.defaults.font.size = 12;
    window.Chart.defaults.color = '#64708a';
    window.Chart.defaults.plugins.legend.labels.usePointStyle = true;
    window.Chart.defaults.plugins.legend.labels.boxWidth = 8;
    window.Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(24,35,56,.94)';
    window.Chart.defaults.plugins.tooltip.padding = 10;
    window.Chart.defaults.plugins.tooltip.cornerRadius = 8;
    window.Chart.defaults.maintainAspectRatio = false;
  }

  /* ---------------- 10) EXPORT ---------------- */
  window.MB = {
    CFG: CFG, sb: sb, state: state, COLORS: COLORS, failed: false, fatal: fatalOnce,
    fmt: fmt, esc: esc, iso: iso, addDays: addDays, presetRange: presetRange,
    pageAll: pageAll, rpc: rpc, chunkUpsert: chunkUpsert,
    loadProfile: loadProfile, guard: guard, can: can, signOut: signOut,
    linkOf: linkOf, currentFile: currentFile, rowForFile: rowForFile,
    checkInvite: checkInvite, inviteHint: inviteHint, normCode: normCode,
    renderShell: renderShell, toast: toast, segment: segment, modal: modal,
    tableEmpty: tableEmpty, tableLoading: tableLoading, csv: csv,
    chartDefaults: chartDefaults
  };
})();
