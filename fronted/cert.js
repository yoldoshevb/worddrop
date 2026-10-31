/* ============================================================
   WordDrop — Sertifikat moduli (cert.js)
   ------------------------------------------------------------
   Bu modul avval app.html ichida inline <script> sifatida turgan
   edi. Cloudflare/Designer beacon skriptlari template literal
   ichiga inject bo'lib, HTML parseri skriptni birinchi yopuvchi
   script tegida kesib tashlagan → butun modul SyntaxError bergan
   va show() / Export mutlaqo yuklanmagan.

   Alohida .js fayl ichiga hech qanday teg inject qilinmaydi va
   HTML parseri bu yerga umuman qaramaydi — muammo tubdan yo'q.

   Talab qilinadigan kutubxonalar (app.html <head> da mavjud):
     qrcode-generator, html2canvas, jspdf.umd, signature-data.js

   Tashqi API:
     WD_Cert.show(rec)        — sertifikatni ochadi
     WD_Cert.hide()           — yopadi
     WD_Cert.exportPNG()      — joriy sertifikatni PNG qilib yuklaydi
     WD_Cert.exportPDF()      — A4 landscape PDF qilib yuklaydi
     WD_Cert.setPhoto(url)    — nomzod rasmini o'rnatadi (null = o'chirish)
     WD_Cert.isOpen()
   ============================================================ */
window.WD_Cert = (function () {
  'use strict';

  /* ---------- 0. Konstantalar ---------- */
  var CERT_W = 1123, CERT_H = 794;
  var PHOTO_KEY = 'wd_cert_photo';
  var FONT_LINK =
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800' +
    '&family=Instrument+Serif:ital,wght@0,400;1,400' +
    '&family=Plus+Jakarta+Sans:wght@400;500;600;700' +
    '&family=JetBrains+Mono:wght@400;500;700&display=swap';
  var H2C_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  var CERT_STYLES = `
    *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    html,body{width:1123px;height:794px;overflow:hidden;background:#FEFDF9;font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;color:#0F1B3D}
    .wdc{width:1123px;height:794px;position:relative;display:grid;grid-template-columns:0.92fr 1.08fr}
    .wdc-l{position:relative;background:#0F1B3D;color:#F6F6F1;padding:52px 46px 44px;display:flex;flex-direction:column;overflow:hidden}
    .wdc-l::before{content:"";position:absolute;right:-160px;top:-140px;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(47,111,237,.28) 0%,transparent 65%);pointer-events:none}
    .wdc-l::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px);background-size:14px 14px;opacity:.55}
    .brand{display:flex;align-items:center;gap:12px;position:relative;z-index:2}
    .brand .mk{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .brand .mk svg{width:18px;height:18px;display:block}
    .brand-txt{display:flex;flex-direction:column;gap:2px}
    .brand .nm{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:19px;letter-spacing:-.4px;color:#fff;line-height:1}
    .brand .nm em{font-style:normal;color:#8FB4F8}
    .brand .tag{font-family:"JetBrains Mono",monospace;font-weight:500;font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:#8791AF;line-height:1}
    .mid{position:relative;z-index:2;margin:auto 0;padding:20px 0}
    .kicker{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:99px;font-weight:600;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#B7BFD3;margin-bottom:22px;line-height:1}
    .kicker .dt{width:5px;height:5px;border-radius:99px;background:#2F6FED;box-shadow:0 0 8px #2F6FED;flex-shrink:0}
    .title{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:52px;letter-spacing:-1.4px;line-height:1;color:#fff}
    .title .it{display:block;font-family:"Instrument Serif",serif;font-style:italic;font-weight:400;font-size:1.05em;letter-spacing:-.4px;color:#DDE3F0;line-height:1.05;margin-top:4px}
    .to{margin-top:22px;font-weight:600;font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;color:#8791AF;line-height:1}
    .cand{margin-top:6px;display:flex;align-items:flex-end;gap:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.16)}
    .name{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:40px;letter-spacing:-1.1px;line-height:1.05;color:#fff;flex:1;min-width:0}
    .photo{width:66px;height:88px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);overflow:hidden;flex-shrink:0;position:relative}
    .photo.empty{display:none}
    .photo .ph{position:absolute;inset:0;background-position:center;background-size:cover;background-repeat:no-repeat}
    .prog{margin-top:18px;font-size:12.5px;line-height:1.55;color:#B7BFD3;max-width:440px}
    .prog b{color:#fff;font-weight:600}
    .foot-l{position:relative;z-index:2;margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding-top:20px;border-top:1px solid rgba(255,255,255,.1)}
    .sig{display:flex;flex-direction:column;gap:0;align-items:flex-start}
    .sig-plate{
      background:#FFFFFF;
      width:180px;
      padding:4px 0 0 0;
      border-radius:3px 3px 0 0;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.18);
      margin:0;
      line-height:0;
    }
    .sig-plate .sn-img{
      height:44px;width:auto;max-width:160px;
      display:block;
    }
    .sig .sn-txt{font-family:"Instrument Serif",serif;font-style:italic;font-size:22px;color:#fff;line-height:1}
    .sig .ln{width:180px;height:1.5px;background:rgba(255,255,255,.55);margin:0}
    .sig .rl{font-weight:600;font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase;color:#8791AF;line-height:1.3;margin-top:6px}
    .sig .rl b{color:#fff;font-weight:700}
    .ser{text-align:right;font-family:"JetBrains Mono",monospace;font-size:10px;color:#8791AF;line-height:1.6;letter-spacing:.2px}
    .ser b{color:#fff;font-weight:700;font-size:10.5px;letter-spacing:.4px}
    .wdc-r{position:relative;background:#FAFAF7;padding:44px 46px 32px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}
    .wdc-r > .r-top{align-self:start}
    .wdc-r > .r-bot{align-self:end}
    .wdc-r-center{display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:0}
    .wdc-r::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(15,27,61,.03) 1px, transparent 1px);background-size:16px 16px;opacity:.7}
    .r-top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    .r-top .lbl{font-weight:700;font-size:10px;letter-spacing:2.2px;text-transform:uppercase;color:#4A5578;line-height:1.3}
    .r-top .date{text-align:right;font-family:"JetBrains Mono",monospace;font-size:10px;color:#4A5578;line-height:1.6}
    .r-top .date b{color:#0F1B3D;font-weight:700;font-size:11px;letter-spacing:.4px}
    .band{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0;width:100%}
    .band-row{display:flex;align-items:center;justify-content:center;gap:16px;width:auto}
    .band-num{font-family:"Instrument Serif",serif;font-style:italic;font-weight:400;font-size:170px;line-height:1;letter-spacing:0;color:#0F1B3D;font-variant-numeric:tabular-nums;padding:0;display:block}
    .band-num .dec{color:#2F6FED}
    .band-meta{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:12px}
    .band-of{font-weight:700;font-size:11px;letter-spacing:2px;color:#4A5578;text-transform:uppercase;line-height:1.2;white-space:nowrap}
    .band-of b{display:block;font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:24px;color:#0F1B3D;letter-spacing:-.5px;text-transform:none;line-height:1;margin-top:3px}
    .cefr{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:22px;color:#2F6FED;letter-spacing:-.3px;padding:6px 12px;background:#E8F0FE;border-radius:6px;line-height:1;white-space:nowrap;display:inline-block}
    .verdict{
      margin-top:18px;
      font-family:"Instrument Serif",serif;font-style:italic;font-size:19px;
      color:#1F2A50;line-height:1.4;
      max-width:100%;
      text-align:center;
      padding:0 20px;
      display:block;
      letter-spacing:0;
      word-spacing:0.05em;
      white-space:normal;
      overflow-wrap:break-word;
      word-break:normal;
      box-sizing:border-box;
      font-variant-ligatures:none;
      text-rendering:optimizeLegibility;
    }
    .mods{margin-top:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;position:relative;z-index:2;width:100%}
    .mod{padding:14px 14px 12px;background:#fff;border:1px solid #EFEFE7;border-radius:12px;display:flex;flex-direction:column;gap:6px}
    .mod .l{display:flex;align-items:center;gap:6px;font-weight:700;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#4A5578;line-height:1}
    .mod .l svg{width:12px;height:12px;color:#2F6FED;stroke:currentColor;stroke-width:2;fill:none;flex-shrink:0}
    .mod .v{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:26px;letter-spacing:-.8px;color:#0F1B3D;line-height:1;font-variant-numeric:tabular-nums}
    .mod .bar{height:3px;border-radius:3px;background:#EFEFE7;overflow:hidden;margin-top:2px}
    .mod .bar i{display:block;height:100%;background:#0F1B3D;border-radius:3px}
    .r-bot{position:relative;z-index:2;margin-top:auto;padding-top:16px;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:flex-start;border-top:1px dashed #E4E4DC}
    .qr-block{display:flex;align-items:center;gap:12px}
    .qr-code{width:74px;height:74px;padding:5px;background:#fff;border:1px solid #E4E4DC;border-radius:8px;flex-shrink:0}
    .qr-code svg{display:block;width:100%;height:100%}
    .qr-txt{font-family:"JetBrains Mono",monospace;font-size:9.5px;color:#4A5578;line-height:1.55;letter-spacing:.2px;display:flex;flex-direction:column;gap:1px}
    .qr-txt b{color:#0F1B3D;font-weight:700;font-size:10px;margin-bottom:3px;font-family:"Plus Jakarta Sans",sans-serif;text-transform:uppercase;letter-spacing:1.2px;line-height:1}
    .qr-txt .url{color:#2F6FED;font-weight:600}
    .disc{font-size:9.2px;line-height:1.55;color:#4A5578;text-align:right;padding-left:12px;border-left:1px solid #E4E4DC}
    .disc b{color:#0F1B3D;font-weight:700;font-size:9.5px}
  `;

  var IC = {
    L: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 18 0v6a3 3 0 0 1-3 3h-1v-8h4"/><path d="M3 18v-6h4v8H6a3 3 0 0 1-3-2z"/></svg>',
    R: '<svg viewBox="0 0 24 24"><path d="M2 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/></svg>',
    W: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>',
    S: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 18v4"/></svg>'
  };

  /* Toolbar ikonkalari */
  var TB = {
    png: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 18h4"/></svg>',
    photo: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>'
  };

  /* ---------- 1. Yordamchi funksiyalar ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function bandVerdict(b) {
    if (b >= 8.5) return "Expert user — mutlaqo erkin";
    if (b >= 8)   return "Very good — expertga juda yaqin";
    if (b >= 7.5) return "Very good — kuchli barqarorlik";
    if (b >= 7)   return "Good — universitet talabi";
    if (b >= 6.5) return "Competent — ishonchli poydevor";
    if (b >= 6)   return "Competent — barqarorlikni oshiring";
    if (b >= 5.5) return "Modest — o'rtacha barqarorlik";
    if (b >= 5)   return "Modest — muntazam mashq kerak";
    if (b >= 4.5) return "Limited — asoslarni mustahkamlang";
    return "Boshlang'ich daraja";
  }

  function bandCEFR(b) {
    if (b >= 8) return "C2";
    if (b >= 7) return "C1";
    if (b >= 5.5) return "B2";
    if (b >= 4) return "B1";
    if (b >= 3) return "A2";
    return "A1";
  }

  function fmtDate(d) {
    var dt = d instanceof Date ? d : new Date(d);
    var m = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
    return String(dt.getDate()).padStart(2, '0') + ' ' + m[dt.getMonth()] + ' ' + dt.getFullYear();
  }

  function makeSerial(name, dt) {
    var ini = (name || 'X').split(/\s+/).map(function (w) { return w[0] || ''; })
      .join('').toUpperCase().slice(0, 3).padEnd(3, 'X');
    var y = new Date(dt).getFullYear();
    var h = 2166136261 >>> 0;
    var s = name + dt;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 'WD-' + y + '-' + ini + '-' + String(h % 999999).padStart(6, '0');
  }

  function b64UrlEncode(obj) {
    try {
      var json = JSON.stringify(obj);
      var b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return ''; }
  }

  function verifyURL(serial, data) {
    var safeSerial = serial || (data ? makeSerial(data.name || 'X', data.date || Date.now()) : 'WD-UNKNOWN');
    var base = 'https://www.worddrop-app.uz/verify/' + safeSerial;
    if (data) {
      var payload = {
        n: data.name,
        l: data.l, r: data.r, w: data.w, s: data.s,
        o: data.overall,
        d: new Date(data.date).getTime()
      };
      var encoded = b64UrlEncode(payload);
      if (encoded) base += '?d=' + encoded;
    }
    return base;
  }

  function makeQR(text, size) {
    if (typeof qrcode === 'undefined') return '';
    try {
      var qr = qrcode(0, 'M'); qr.addData(text); qr.make();
      var N = qr.getModuleCount(); var cell = size / N;
      var rects = '';
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        if (qr.isDark(r, c)) {
          rects += '<rect x="' + (c * cell) + '" y="' + (r * cell) + '" width="' + (cell + 0.5) +
                   '" height="' + (cell + 0.5) + '" fill="#0F1B3D"/>';
        }
      }
      return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size +
             '" shape-rendering="crispEdges">' + rects + '</svg>';
    } catch (e) { return ''; }
  }

  function normalize(rec) {
    rec = rec || {};
    var l = rec.l != null ? rec.l : 0;
    var r = rec.r != null ? rec.r : 0;
    var w = rec.w != null ? rec.w : 0;
    var s = rec.s != null ? rec.s : 0;
    var overall = rec.overall != null ? rec.overall : ((l + r + w + s) / 4);
    var date = rec.date || Date.now();
    return {
      name: rec.name || 'Candidate',
      l: l, r: r, w: w, s: s,
      overall: overall,
      cefr: bandCEFR(overall),
      date: date,
      serial: makeSerial(rec.name || 'Candidate', date),
      signatoryName: "Bahromjon Yo'ldoshev",
      signatoryRole: "Bosh Examiner · WordDrop Studio",
      // Haqiqiy qo'l imzosi (base64 PNG, transparent) — signature-data.js dan
      signatureImg: (typeof window !== 'undefined' && window.__WD_SIGNATURE__) || null
    };
  }

  /* ---------- 2. Sertifikat HTML hujjati (iframe srcdoc uchun) ---------- */
  function certBody(data, photoUrl) {
    var dec = data.overall.toFixed(1).split('.')[1];
    var whole = data.overall.toFixed(1).split('.')[0];
    var vUrl = verifyURL(data.serial, data);
    var qrSvg = makeQR(vUrl, 200);
    var shortSerial = data.serial.split('-').slice(2).join('-');
    var photoBlock = photoUrl
      ? '<div class="photo"><div class="ph" style="background-image:url(\'' + photoUrl + '\')"></div></div>'
      : '<div class="photo empty"></div>';
    var mod = function (code, full, v) {
      return '<div class="mod"><div class="l">' + IC[code] + ' ' + full + '</div>' +
             '<div class="v">' + v.toFixed(1) + '</div>' +
             '<div class="bar"><i style="width:' + ((v / 9) * 100) + '%"></i></div></div>';
    };
    var sigBlock = data.signatureImg
      ? '<div class="sig-plate"><img class="sn-img" src="' + data.signatureImg + '" alt="Imzo"/></div>'
      : '<div class="sn-txt">' + esc(data.signatoryName.split(' ').slice(0, 2).join(' ')) + '</div>';

    return `
<div class="wdc">
  <div class="wdc-l">
    <div class="brand">
      <div class="mk"><svg viewBox="0 0 24 24"><path d="M12 3 C12 3 5 11 5 15.5 A7 7 0 0 0 19 15.5 C19 11 12 3 12 3 Z" fill="#F6F6F1"/></svg></div>
      <div class="brand-txt">
        <div class="nm">Word<em>Drop</em></div>
        <div class="tag">Exam Center · Rasmiy natija</div>
      </div>
    </div>
    <div class="mid">
      <div class="kicker"><span class="dt"></span> IELTS Mock · Yakuniy natija</div>
      <div class="title">Certificate<span class="it">of achievement</span></div>
      <div class="to">Berildi · Awarded to</div>
      <div class="cand">
        <div class="name">${esc(data.name)}</div>
        ${photoBlock}
      </div>
      <div class="prog">
        WordDrop IELTS Mock imtihonining <b>to'rt moduli</b> — Listening, Reading, Writing va Speaking — muvaffaqiyatli topshirilib, rasmiy qoidaga ko'ra <b>Overall Band Score</b> hisoblanganini tasdiqlaydi.
      </div>
    </div>
    <div class="foot-l">
      <div class="sig">
        ${sigBlock}
        <div class="ln"></div>
        <div class="rl">Signed <b>· ${esc(data.signatoryRole)}</b></div>
      </div>
      <div class="ser">Seriya · Serial<br/><b>${esc(data.serial)}</b></div>
    </div>
  </div>
  <div class="wdc-r">
    <div class="r-top">
      <div class="lbl">Overall Band Score</div>
      <div class="date">Imtihon sanasi<br/><b>${fmtDate(data.date)}</b></div>
    </div>
    <div class="wdc-r-center">
      <div class="band">
        <div class="band-row">
          <div class="band-num">${whole}<span class="dec">.${dec}</span></div>
          <div class="band-meta">
            <div class="band-of">/ <b>9.0</b></div>
            <div class="cefr">${data.cefr}</div>
          </div>
        </div>
        <div class="verdict">"${bandVerdict(data.overall)}"</div>
      </div>
      <div class="mods">
        ${mod('L', 'Listening', data.l)}${mod('R', 'Reading', data.r)}${mod('W', 'Writing', data.w)}${mod('S', 'Speaking', data.s)}
      </div>
    </div>
    <div class="r-bot">
      <div class="qr-block">
        <div class="qr-code">${qrSvg}</div>
        <div class="qr-txt">
          <b>Skanerlab tekshiring</b>
          <span class="url">worddrop-app.uz</span>
          <div>/verify/${shortSerial}</div>
        </div>
      </div>
      <div class="disc">
        <b>Muhim:</b> Ushbu sertifikat <b>WordDrop</b> platformasidagi <b>mashq (mock)</b> testi natijasidir. U <b>rasmiy IELTS sertifikati emas</b> va universitetlar, elchixonalar hamda ish beruvchilarga <b>hech qanday rasmiy qiymatga ega emas</b>. Faqat shaxsiy tayyorgarlikni baholash uchun mo'ljallangan.
      </div>
    </div>
  </div>
</div>`;
  }

  /* To'liq HTML hujjat. DIQQAT: bu yerda hech qachon literal yopuvchi
     script tegi bo'lmasligi kerak — shuning uchun umuman <script> ishlatmaymiz. */
  function certHTML(data, photoUrl) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"/>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="' + FONT_LINK + '" rel="stylesheet">' +
      '<style>' + CERT_STYLES + '</style>' +
      '</head><body>' + certBody(data, photoUrl) + '</body></html>';
  }

  /* ---------- 3. Holat ---------- */
  var state = {
    open: false,
    data: null,     // normalize() natijasi
    photo: null,    // dataURL yoki null
    veil: null,
    frameWrap: null,
    iframe: null,
    mask: null,
    busy: false
  };

  try { state.photo = localStorage.getItem(PHOTO_KEY) || null; } catch (e) {}

  /* ---------- 4. Yuklanish indikatori ---------- */
  function spinner(text) {
    var el = document.createElement('div');
    el.className = 'wdc-loading';
    el.innerHTML = '<div class="card"><div class="sp"></div><div>' + esc(text || 'Tayyorlanmoqda…') + '</div></div>';
    document.body.appendChild(el);
    /* Xavfsizlik chorasi: qanday xato bo'lsa ham spinner 30 soniyadan ko'p
       turmaydi (ilgari xatolik yutilib ketsa ekran butunlay qotib qolardi). */
    var guard = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 30000);
    return {
      set: function (t) {
        var c = el.querySelector('.card > div:last-child');
        if (c) c.textContent = t;
      },
      done: function () { clearTimeout(guard); if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }

  function toast(msg) {
    try {
      if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    } catch (e) {}
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:100002;' +
      'background:#0F1B3D;color:#fff;padding:12px 18px;border-radius:99px;font:600 13.5px/1 ' +
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.35)';
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  /* ---------- 5. DOM qurish ---------- */
  function buildVeil() {
    if (state.veil) return state.veil;

    var veil = document.createElement('div');
    veil.className = 'wdc-veil';
    veil.setAttribute('role', 'dialog');
    veil.setAttribute('aria-label', 'WordDrop sertifikati');

    var bar = document.createElement('div');
    bar.className = 'wdc-toolbar';
    bar.innerHTML =
      '<button type="button" class="wdc-btn pri" data-act="png">' + TB.png + ' PNG yuklab olish</button>' +
      '<button type="button" class="wdc-btn" data-act="pdf">' + TB.pdf + ' PDF</button>' +
      '<button type="button" class="wdc-btn" data-act="photo">' + TB.photo + ' Rasm</button>' +
      '<button type="button" class="wdc-btn" data-act="share">' + TB.share + ' Ulashish</button>' +
      '<button type="button" class="wdc-btn" data-act="close" aria-label="Yopish">' + TB.close + ' Yopish</button>';

    var wrap = document.createElement('div');
    wrap.className = 'wdc-frame-iso';
    var ifr = document.createElement('iframe');
    ifr.setAttribute('title', 'Sertifikat');
    // srcdoc iframe ota-sahifa origin'ini meros qiladi → contentDocument o'qiladi.
    /* TUZATISH: 'allow-scripts' bo'lmasa iframe ichida hech qanday skript
       ishlamaydi — html2canvas inject qilinsa ham yuklanmaydi va onload/onerror
       umuman otilmaydi. Natijada "PDF tayyorlanmoqda…" spinneri abadiy qotib
       qolardi. Hujjat o'zimiz yasagan srcdoc (ism esc() bilan) — xavfsiz. */
    ifr.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    wrap.appendChild(ifr);

    veil.appendChild(bar);
    veil.appendChild(wrap);
    document.body.appendChild(veil);

    /* Bitta delegatsiyalangan listener — har bir tugma uchun alohida emas */
    bar.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      var act = btn.getAttribute('data-act');
      if (state.busy && act !== 'close') return;
      if (act === 'png') exportPNG();
      else if (act === 'pdf') exportPDF();
      else if (act === 'photo') openPhotoModal();
      else if (act === 'share') shareCert();
      else if (act === 'close') hide();
    });

    /* Fon bosilsa yopiladi (sertifikat va toolbar bosilganda emas) */
    veil.addEventListener('click', function (ev) {
      if (ev.target === veil) hide();
    });

    state.veil = veil;
    state.frameWrap = wrap;
    state.iframe = ifr;
    return veil;
  }

  function onKey(ev) {
    if (ev.key === 'Escape' && state.open) { ev.stopPropagation(); hide(); }
  }

  /* ---------- 6. Render ---------- */
  function render() {
    if (!state.data) return Promise.resolve();
    buildVeil();
    var ifr = state.iframe;
    return new Promise(function (resolve) {
      var settled = false;
      var finish = function () { if (!settled) { settled = true; resolve(); } };
      ifr.onload = function () { waitReady(ifr).then(finish); };
      ifr.srcdoc = certHTML(state.data, state.photo);
      // onload otilmasa ham osilib qolmaymiz
      setTimeout(finish, 4000);
    });
  }

  /* Shriftlar + rasmlar yuklanguncha kutamiz — aks holda eksportda
     shriftsiz yoki imzosiz surat chiqadi. */
  function waitReady(ifr) {
    var doc;
    try { doc = ifr.contentDocument; } catch (e) { doc = null; }
    if (!doc) return Promise.resolve();

    var jobs = [];

    if (doc.fonts && doc.fonts.ready) {
      jobs.push(Promise.race([
        doc.fonts.ready,
        new Promise(function (r) { setTimeout(r, 3000); })
      ]));
    }

    var imgs = Array.prototype.slice.call(doc.images || []);
    imgs.forEach(function (img) {
      if (img.complete && img.naturalWidth) return;
      jobs.push(new Promise(function (r) {
        var t = setTimeout(r, 3000);
        var d = function () { clearTimeout(t); r(); };
        img.addEventListener('load', d, { once: true });
        img.addEventListener('error', d, { once: true });
      }));
    });

    // ikki rAF — layout to'liq o'tirishi uchun
    jobs.push(new Promise(function (r) {
      var w = ifr.contentWindow;
      if (w && w.requestAnimationFrame) w.requestAnimationFrame(function () { w.requestAnimationFrame(r); });
      else setTimeout(r, 60);
    }));

    return Promise.all(jobs);
  }

  /* ---------- 7. html2canvas: iframe ichida ishlatamiz ---------- */
  function ensureH2C(win) {
    // 1) Ota-sahifada bormi? (app.html <head> da allaqachon yuklangan)
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    // 2) iframe o'zida bormi?
    if (win && win.html2canvas) return Promise.resolve(win.html2canvas);
    // 3) Yuklaymiz — LEKIN har doim taymer bilan, aks holda osilib qolamiz
    return new Promise(function (resolve, reject) {
      var doc, done = false;
      try { doc = win.document; } catch (e) { doc = null; }
      var host = doc && doc.head ? doc : document;      // iframe bo'lmasa ota-sahifa
      var scope = (host === document) ? window : win;
      var settle = function (fn, arg) { if (done) return; done = true; fn(arg); };
      var to = setTimeout(function () {
        settle(reject, new Error('html2canvas yuklanmadi (vaqt tugadi) — internetni tekshiring'));
      }, 12000);
      var s = host.createElement('script');
      s.src = H2C_SRC;
      s.onload = function () {
        clearTimeout(to);
        var lib = scope.html2canvas || window.html2canvas;
        if (lib) settle(resolve, lib);
        else settle(reject, new Error('html2canvas yuklandi, lekin topilmadi'));
      };
      s.onerror = function () {
        clearTimeout(to);
        if (window.html2canvas) settle(resolve, window.html2canvas);
        else settle(reject, new Error('html2canvas yuklanmadi — internet aloqasini tekshiring'));
      };
      host.head.appendChild(s);
    });
  }

  /* Sertifikatni canvas'ga chizadi. scale=2 → 2246x1588 px (chop etishga yetarli) */
  function renderCanvas(scale) {
    var ifr = state.iframe;
    if (!ifr) return Promise.reject(new Error('Sertifikat ochilmagan'));
    var win, doc;
    try { win = ifr.contentWindow; doc = ifr.contentDocument; } catch (e) { win = doc = null; }
    if (!win || !doc || !doc.body) return Promise.reject(new Error('Sertifikat hali yuklanmagan'));

    var hardTimeout = new Promise(function (_, rej) {
      setTimeout(function () { rej(new Error('Rasm tayyorlash 25s ichida tugamadi')); }, 25000);
    });
    return Promise.race([hardTimeout, waitReady(ifr).then(function () {
      return ensureH2C(win);
    }).then(function (h2c) {
      var target = doc.querySelector('.wdc') || doc.body;
      return h2c(target, {
        backgroundColor: '#FEFDF9',
        scale: scale || 2,
        width: CERT_W,
        height: CERT_H,
        windowWidth: CERT_W,
        windowHeight: CERT_H,
        useCORS: true,
        allowTaint: false,
        logging: false,
        scrollX: 0,
        scrollY: 0
      });
    }).then(function (canvas) {
      if (!canvas || !canvas.width || !canvas.height) {
        throw new Error('Bo\'sh rasm hosil bo\'ldi — qaytadan urinib ko\'ring');
      }
      return canvas;
    })]);
  }

  function canvasToDataURL(canvas) {
    var url = canvas.toDataURL('image/png');
    if (!url || url === 'data:,' || url.length < 128) {
      throw new Error('Rasmni kodlashda xato');
    }
    return url;
  }

  function fileBase() {
    var d = state.data || {};
    var nm = String(d.name || 'Candidate').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
    return 'WordDrop_Sertifikat_' + (nm || 'Candidate') + '_' + (d.serial || '');
  }

  function triggerDownload(href, filename) {
    var a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 0);
  }

  /* ---------- 8. Eksport: PNG ---------- */
  function exportPNG() {
    if (state.busy) return Promise.resolve();
    state.busy = true;
    var sp = spinner('PNG tayyorlanmoqda…');
    return renderCanvas(2)
      .then(function (canvas) {
        // Blob → katta fayllarda dataURL'dan ancha barqaror
        return new Promise(function (resolve) {
          if (canvas.toBlob) {
            canvas.toBlob(function (blob) {
              if (blob) {
                var url = URL.createObjectURL(blob);
                triggerDownload(url, fileBase() + '.png');
                setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
                resolve();
                return;
              }
              triggerDownload(canvasToDataURL(canvas), fileBase() + '.png');
              resolve();
            }, 'image/png');
          } else {
            triggerDownload(canvasToDataURL(canvas), fileBase() + '.png');
            resolve();
          }
        });
      })
      .then(function () { toast('Sertifikat PNG sifatida yuklab olindi'); })
      .catch(function (err) {
        console.error('[WD_Cert] PNG export xatosi:', err);
        toast('PNG saqlanmadi: ' + (err && err.message ? err.message : 'noma\'lum xato'));
      })
      .then(function () { sp.done(); state.busy = false; });
  }

  /* ---------- 9. Eksport: PDF (A4 landscape) ---------- */
  function getJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    return null;
  }

  function exportPDF() {
    if (state.busy) return Promise.resolve();
    var JsPDF = getJsPDF();
    if (!JsPDF) {
      toast('PDF kutubxonasi yuklanmagan — internet aloqasini tekshiring');
      return Promise.resolve();
    }
    state.busy = true;
    var sp = spinner('PDF tayyorlanmoqda…');
    return renderCanvas(2)
      .then(function (canvas) {
        var img = canvasToDataURL(canvas);
        // A4 landscape: 297 x 210 mm. Sertifikat nisbati 1123:794 ≈ 1.414 = A4.
        var pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        var pw = pdf.internal.pageSize.getWidth();
        var ph = pdf.internal.pageSize.getHeight();
        var ratio = Math.min(pw / CERT_W, ph / CERT_H);
        var w = CERT_W * ratio, h = CERT_H * ratio;
        pdf.addImage(img, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h, undefined, 'FAST');
        pdf.save(fileBase() + '.pdf');
      })
      .then(function () { toast('Sertifikat PDF sifatida yuklab olindi'); })
      .catch(function (err) {
        console.error('[WD_Cert] PDF export xatosi:', err);
        toast('PDF saqlanmadi: ' + (err && err.message ? err.message : 'noma\'lum xato'));
      })
      .then(function () { sp.done(); state.busy = false; });
  }

  /* ---------- 10. Ulashish ---------- */
  function shareCert() {
    if (state.busy) return Promise.resolve();
    var vUrl = verifyURL(state.data && state.data.serial, state.data);

    // 1-variant: rasm bilan native share
    if (navigator.canShare && window.File) {
      state.busy = true;
      var sp = spinner('Ulashishga tayyorlanmoqda…');
      return renderCanvas(2)
        .then(function (canvas) {
          return new Promise(function (resolve, reject) {
            canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('blob yo\'q')); }, 'image/png');
          });
        })
        .then(function (blob) {
          var file = new File([blob], fileBase() + '.png', { type: 'image/png' });
          if (!navigator.canShare({ files: [file] })) throw new Error('fayl ulashish qo\'llanmaydi');
          return navigator.share({
            files: [file],
            title: 'WordDrop IELTS Mock sertifikati',
            text: 'Mening WordDrop IELTS Mock natijam — Overall ' +
                  (state.data ? state.data.overall.toFixed(1) : '') + '\n' + vUrl
          });
        })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          fallbackShare(vUrl);
        })
        .then(function () { sp.done(); state.busy = false; });
    }

    fallbackShare(vUrl);
    return Promise.resolve();
  }

  function fallbackShare(vUrl) {
    if (navigator.share) {
      navigator.share({ title: 'WordDrop sertifikati', url: vUrl }).catch(function () { copyLink(vUrl); });
    } else {
      copyLink(vUrl);
    }
  }

  function copyLink(vUrl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(vUrl)
        .then(function () { toast('Tekshirish havolasi nusxalandi'); })
        .catch(function () { toast(vUrl); });
    } else {
      toast(vUrl);
    }
  }

  /* ---------- 11. Rasm (foto) modali ---------- */
  function openPhotoModal() {
    if (state.mask) closePhotoModal();
    var pending = state.photo;

    var mask = document.createElement('div');
    mask.className = 'wdc-mask on';
    mask.innerHTML =
      '<div class="wdc-modal" role="dialog" aria-modal="true">' +
        '<h3>Sertifikatga rasm qo\'shish</h3>' +
        '<p>Ixtiyoriy. <b>Portret</b> (3×4) rasm eng chiroyli chiqadi. Rasm faqat shu qurilmada saqlanadi.</p>' +
        '<label class="wdc-up' + (pending ? ' has' : '') + '" id="wdcUp">' +
          (pending
            ? '<img src="' + pending + '" alt="Tanlangan rasm"/>'
            : '<div class="ic">' + TB.up + '</div>' +
              '<p class="t">Rasm tanlang yoki bu yerga tashlang</p>' +
              '<p class="s">JPG yoki PNG · 5 MB gacha</p>') +
          '<input type="file" accept="image/*" id="wdcFile" style="position:absolute;inset:0;opacity:0;cursor:pointer">' +
        '</label>' +
        '<div class="wdc-modal-act">' +
          '<button type="button" class="wdc-mbtn txt" data-m="clear">Rasmni olib tashlash</button>' +
          '<button type="button" class="wdc-mbtn sec" data-m="cancel">Bekor qilish</button>' +
          '<button type="button" class="wdc-mbtn pri" data-m="save">Saqlash</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(mask);
    state.mask = mask;

    var up = mask.querySelector('#wdcUp');
    var file = mask.querySelector('#wdcFile');

    function preview(url) {
      pending = url;
      up.classList.add('has');
      up.innerHTML = '<img src="' + url + '" alt="Tanlangan rasm"/>';
      up.appendChild(file);
    }

    function readFile(f) {
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Faqat rasm fayli qabul qilinadi'); return; }
      if (f.size > 5 * 1024 * 1024) { toast('Rasm 5 MB dan katta bo\'lmasin'); return; }
      var fr = new FileReader();
      fr.onload = function () { downscale(String(fr.result), 400, 540).then(preview); };
      fr.readAsDataURL(f);
    }

    file.addEventListener('change', function () { readFile(file.files && file.files[0]); });

    ['dragenter', 'dragover'].forEach(function (evn) {
      up.addEventListener(evn, function (e) { e.preventDefault(); up.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (evn) {
      up.addEventListener(evn, function (e) { e.preventDefault(); up.classList.remove('drag'); });
    });
    up.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      readFile(f);
    });

    mask.addEventListener('click', function (ev) {
      if (ev.target === mask) { closePhotoModal(); return; }
      var b = ev.target.closest ? ev.target.closest('[data-m]') : null;
      if (!b) return;
      var m = b.getAttribute('data-m');
      if (m === 'cancel') closePhotoModal();
      else if (m === 'clear') { setPhoto(null); closePhotoModal(); }
      else if (m === 'save') { setPhoto(pending || null); closePhotoModal(); }
    });
  }

  function closePhotoModal() {
    if (state.mask && state.mask.parentNode) state.mask.parentNode.removeChild(state.mask);
    state.mask = null;
  }

  /* Rasmni kichraytirish — 1.3 MB app.html'ni localStorage bilan bo'g'masin */
  function downscale(dataUrl, maxW, maxH) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var r = Math.min(maxW / img.width, maxH / img.height, 1);
        var w = Math.round(img.width * r), h = Math.round(img.height * r);
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL('image/jpeg', 0.88)); }
        catch (e) { resolve(dataUrl); }
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  function setPhoto(url) {
    state.photo = url || null;
    try {
      if (url) localStorage.setItem(PHOTO_KEY, url);
      else localStorage.removeItem(PHOTO_KEY);
    } catch (e) {}
    if (state.open) render();
    return state.photo;
  }

  /* ---------- 12. Ochish / yopish ---------- */
  function show(rec) {
    state.data = normalize(rec);
    buildVeil();
    state.veil.classList.add('on');
    state.open = true;
    document.addEventListener('keydown', onKey, true);
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    return render();
  }

  function hide() {
    closePhotoModal();
    if (state.veil) state.veil.classList.remove('on');
    state.open = false;
    document.removeEventListener('keydown', onKey, true);
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  /* ---------- 13. Tashqi API ---------- */
  return {
    show: show,
    hide: hide,
    isOpen: function () { return state.open; },
    exportPNG: exportPNG,
    exportPDF: exportPDF,
    setPhoto: setPhoto,
    getPhoto: function () { return state.photo; },
    // Yordamchilar — app.html va verify.html qayta ishlatishi mumkin
    certHTML: certHTML,
    normalize: normalize,
    makeSerial: makeSerial,
    verifyURL: verifyURL,
    bandVerdict: bandVerdict,
    bandCEFR: bandCEFR,
    _version: '2.0.0'
  };
})();
