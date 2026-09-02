/* =====================================================================
   MASARU Branding Portal — boot guard
   โหลดเป็นไฟล์แรกของทุกหน้า: กัน "จอขาว" โดยแสดงสาเหตุที่แท้จริงเสมอ
   ===================================================================== */
(function () {
  'use strict';
  if (window.__boot) return;

  var CDN_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var mounted = false, done = false, killed = false;

  function mount() {
    // ok() อาจถูกเรียกก่อน DOMContentLoaded — ห้ามขึ้น overlay ย้อนหลัง
    if (killed || mounted || !document.body) return;
    var d = document.createElement('div');
    d.id = '__bootOverlay';
    d.setAttribute('style',
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
      'background:#0e1c38;color:#fff;padding:24px;text-align:center;' +
      "font-family:'IBM Plex Sans Thai',system-ui,sans-serif");
    d.innerHTML =
      '<div style="max-width:600px">' +
        '<div id="__bootIcon" style="font-size:34px;margin-bottom:10px">&#9203;</div>' +
        '<div id="__bootTitle" style="font-size:16px;font-weight:700">กำลังโหลดระบบ&hellip;</div>' +
        '<div id="__bootDetail" style="font-size:12.5px;opacity:.7;margin-top:8px;word-break:break-all"></div>' +
        '<div id="__bootHelp" style="font-size:13px;margin-top:14px;line-height:1.8;text-align:left"></div>' +
      '</div>';
    document.body.insertBefore(d, document.body.firstChild);
    mounted = true;
  }

  function el(id) { return document.getElementById(id); }

  var api = {
    fail: function (title, detail, help) {
      done = true; killed = false;
      mount();
      var box = el('__bootOverlay'); if (!box) { alert(title + '\n' + (detail || '')); return; }
      box.style.display = 'flex';
      el('__bootIcon').textContent = '⚠️';
      el('__bootTitle').textContent = title || 'เกิดข้อผิดพลาด';
      el('__bootDetail').textContent = detail || '';
      el('__bootHelp').innerHTML = (help || '') +
        '<div style="margin-top:16px;text-align:center">' +
          '<a style="color:#ffc9ce;font-weight:700;text-decoration:none" href="check.html">เปิดหน้าตรวจระบบ &rarr;</a>' +
          '<span style="opacity:.4"> &nbsp;·&nbsp; </span>' +
          '<a style="color:#ffc9ce;font-weight:700;text-decoration:none" href="javascript:location.reload()">ลองใหม่</a>' +
        '</div>';
    },
    ok: function () {
      done = true; killed = true;
      var box = el('__bootOverlay');
      if (box) { box.parentNode.removeChild(box); return; }
      // ok() ถูกเรียกก่อน DOM พร้อม — เก็บกวาดอีกรอบตอน DOM พร้อม
      document.addEventListener('DOMContentLoaded', function () {
        var b2 = el('__bootOverlay');
        if (b2) b2.parentNode.removeChild(b2);
      });
    }
  };
  window.__boot = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  /* ไฟล์สคริปต์โหลดไม่ขึ้น (404 / โดนบล็อก) */
  window.addEventListener('error', function (e) {
    var t = e && e.target;
    if (t && t.tagName === 'SCRIPT') {
      var src = t.src || '';
      if (src.indexOf('jsdelivr') >= 0 || src.indexOf('cdn') >= 0) {
        api.fail('โหลดไลบรารีจาก CDN ไม่สำเร็จ', src,
          'เน็ตในออฟฟิศอาจบล็อก cdn.jsdelivr.net &mdash; ลองเน็ตอื่น/มือถือ ' +
          'หรือโหลดไฟล์มาไว้ในโฟลเดอร์ <b>assets/</b> แล้วแก้ src ในไฟล์ HTML');
      } else {
        api.fail('โหลดไฟล์ในโปรเจกต์ไม่สำเร็จ', src,
          'ตรวจว่าอัปโหลดโฟลเดอร์ <b>assets/</b> ขึ้น repo แล้ว และชื่อไฟล์เป็น<b>ตัวพิมพ์เล็กทั้งหมด</b> ' +
          '(GitHub Pages แยกตัวพิมพ์เล็ก-ใหญ่)');
      }
      return;
    }
    if (t && t.tagName === 'LINK') return;                 // ฟอนต์โหลดไม่ขึ้นไม่เป็นไร
    if (done) return;
    api.fail('เกิดข้อผิดพลาดในหน้าเว็บ', (e && e.message) || '',
      'กด F12 &rarr; แท็บ Console เพื่อดูรายละเอียด');
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    if (done) return;
    var m = e && e.reason ? (e.reason.message || String(e.reason)) : '';
    api.fail('เชื่อมต่อฐานข้อมูลไม่สำเร็จ', m,
      'ตรวจว่ารัน <b>schema.sql</b> แล้วตามด้วย <b>schema2.sql</b> ใน Supabase &rarr; SQL Editor แล้ว');
  });

  /* ค้างเกิน 15 วิ = มีอะไรผิดแน่ ๆ */
  setTimeout(function () {
    if (done) return;
    api.fail('โหลดนานผิดปกติ', 'ระบบยังตอบกลับไม่ครบภายใน 15 วินาที',
      'สาเหตุที่พบบ่อย:<br>' +
      '1. ยังไม่ได้รัน <b>schema.sql</b> / <b>schema2.sql</b> ใน Supabase<br>' +
      '2. URL หรือ key ใน <b>assets/app.js</b> ไม่ตรงกับโปรเจกต์<br>' +
      '3. เน็ตเข้า supabase.co ไม่ได้');
  }, 15000);

  /* เผื่อไลบรารีหลักหาย (โหลดไม่ทัน/โดนบล็อกแบบเงียบ) */
  window.__bootCheckLibs = function () {
    if (!window.supabase || !window.supabase.createClient) {
      api.fail('โหลดไลบรารี Supabase ไม่สำเร็จ', CDN_LIB,
        'เน็ตอาจบล็อก cdn.jsdelivr.net &mdash; ลองเน็ตอื่น หรือดาวน์โหลดไฟล์มาไว้ใน <b>assets/</b>');
      return false;
    }
    if (!window.MB) {
      var base = location.origin + location.pathname.replace(/[^/]*$/, '');
      api.fail('โหลด assets/app.js ไม่สำเร็จ', base + 'assets/app.js',
        'ตรวจว่าอัปโหลดโฟลเดอร์ <b>assets/</b> ขึ้น repo แล้ว และชื่อไฟล์เป็น<b>ตัวพิมพ์เล็กทั้งหมด</b>');
      return false;
    }
    return true;
  };
})();
