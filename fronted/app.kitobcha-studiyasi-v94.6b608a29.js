
/* ==================================================================
   KITOBCHA STUDIYASI (v94)
   ------------------------------------------------------------------
   Drop AI kitobcha MAZMUNI va TUZILISHINI JSON hujjat sifatida beradi
   (drop-pro: booklet / booklet_edit). Sahifalash, dizayn, kartochka
   varaqlari, mundarija, javoblar kaliti va PDF — shu yerda, dasturda.
   Shuning uchun natija har doim tartibli chiqadi, AI esa faqat
   "nima yozilsin va qanday tuzilsin"ni boshqaradi va tahrirlaydi.
   ================================================================== */
(function(){
const DP_URL = SUPABASE_FUNCTION_URL.replace(/check-sentence$/,'drop-pro');
const LS_BK = 'wd_booklets_v1';
const SIZES = { A5:{w:559,h:794,mm:[148,210]}, B5:{w:665,h:945,mm:[176,250]}, A4:{w:794,h:1123,mm:[210,297]} };
const PALETTES = [
  {n:'Siyoh',     primary:'#2F6FED', accent:'#E8374A', paper:'#FFFFFF', ink:'#0F1B3D'},
  {n:'Olov',      primary:'#F0461E', accent:'#FFC21A', paper:'#FFFFFF', ink:'#1A1410'},
  {n:'Zumrad',    primary:'#0E8F60', accent:'#F2A900', paper:'#FBFAF5', ink:'#10231B'},
  {n:'Binafsha',  primary:'#6D3FE0', accent:'#16B3C7', paper:'#FFFFFF', ink:'#18123A'},
  {n:'Qahva',     primary:'#9A5B2A', accent:'#2F6FED', paper:'#FBF6EE', ink:'#2A1C12'},
  {n:'Dengiz',    primary:'#0A84A6', accent:'#FF6B4A', paper:'#F7FBFC', ink:'#0B2530'},
  {n:'Pushti',    primary:'#D6336C', accent:'#3B5BDB', paper:'#FFFFFF', ink:'#2B1020'},
  {n:'Grafit',    primary:'#2B2B2B', accent:'#E8374A', paper:'#FFFFFF', ink:'#111111'}
];
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md = s => esc(s).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/~~([^~]+)~~/g,'<s>$1</s>').replace(/\n/g,'<br>');

/* ---------- Umumiy so'rov (Drop AI limiti bilan) ---------- */
window.__wdDPAuth=(p,t)=>dpRequest(Object.assign({pro:true},p),t);   // foydalanuvchi tokeni bilan (ovoz → matn)
async function dpRequest(payload, timeoutMs){
  const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), timeoutMs||60000);
  let auth=SUPABASE_PUBLISHABLE_KEY;
  if(payload&&payload.pro){ try{ const { data } = await window.__sb.auth.getSession(); if(data&&data.session) auth=data.session.access_token; }catch(e){} }
  try{
    const r = await fetch(DP_URL,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json','apikey':SUPABASE_PUBLISHABLE_KEY,'Authorization':'Bearer '+auth},
      body:JSON.stringify(Object.assign({cefr:window.__wdCEFR||'B1'},payload))});
    clearTimeout(t);
    const txt = await r.text(); let j=null; try{ j=JSON.parse(txt); }catch(e){}
    if(!r.ok || !j) return {__error:true, msg:(j&&j.error)||"Drop AI hozir javob bermadi. Birozdan keyin qayta urining."};
    return j;
  }catch(e){ clearTimeout(t); return {__error:true, msg: e&&e.name==='AbortError' ? "Javob juda uzoq kechikdi. Qayta urining." : "Internet aloqasini tekshiring."}; }
}
function dpQuotaOk(){
  const D=window.__wdDropAI; if(!D||!D.remaining) return true;
  if(D.remaining()>0) return true;
  if(D.isRegistered && !D.isRegistered()){
    showToast("Bugungi bepul so'rovlar tugadi. Ro'yxatdan o'tsangiz, kuniga 20 ta.",IC.info);
    try{ if(typeof openAuthSheet==='function') openAuthSheet('signup'); }catch(e){}
  } else showToast("Bugungi 20 ta so'rov tugadi. Ertaga davom etamiz.",IC.info);
  return false;
}
async function dpBump(){ try{ if(window.__wdDropAI&&window.__wdDropAI.bump) await window.__wdDropAI.bump(); }catch(e){} }
window.__wdDP={request:dpRequest, quotaOk:dpQuotaOk, bump:dpBump};

/* ---------- Saqlash ---------- */
function bkAll(){ try{ const a=JSON.parse(localStorage.getItem(LS_BK)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function bkSaveAll(a){ try{ localStorage.setItem(LS_BK, JSON.stringify(a.slice(0,12))); }catch(e){ showToast("Xotira to'ldi: eski kitobchani o'chiring",IC.info); } }
function bkUpsert(item){ const a=bkAll().filter(x=>x.id!==item.id); a.unshift(item); bkSaveAll(a); }

/* ---------- Kitobcha uslublari (sahifalar ham, chop etish oynasi ham shuni ishlatadi) ---------- */
const BK_CSS = `
.bk-page{position:relative;overflow:hidden;background:var(--pp);color:var(--ik);font-family:'Inter',system-ui,sans-serif;font-size:10.5px;line-height:1.5;box-sizing:border-box}
.bk-page *{box-sizing:border-box;margin:0;padding:0}
.bk-page.f-serif .bk-h,.bk-page.f-serif .bk-sec-t,.bk-page.f-serif .bk-cov-t{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:0}
.bk-page.f-grotesk .bk-h,.bk-page.f-grotesk .bk-sec-t,.bk-page.f-grotesk .bk-cov-t{font-family:'Bricolage Grotesque','Inter',sans-serif;font-weight:700}
.bk-page.f-rounded .bk-h,.bk-page.f-rounded .bk-sec-t,.bk-page.f-rounded .bk-cov-t{font-family:'Inter',sans-serif;font-weight:800}
.bk-run{position:absolute;top:22px;left:40px;right:40px;display:flex;justify-content:space-between;font-size:7.5px;color:var(--mu);letter-spacing:.04em}
.bk-body{position:absolute;top:48px;left:40px;right:44px;bottom:44px;overflow:hidden}
.bk-foot{position:absolute;bottom:20px;left:40px;display:flex;align-items:center;gap:8px;font-size:8px;color:var(--mu)}
.bk-foot i{display:block;width:18px;height:2px;background:var(--sc)}
.bk-tab{position:absolute;right:0;top:64px;width:22px;padding:8px 0;background:var(--sc);color:#fff;font-weight:800;font-size:10px;text-align:center;border-radius:4px 0 0 4px}
.bk-h{font-size:15px;line-height:1.2;margin:14px 0 6px;color:var(--ik)}
.bk-sec-head{margin:0 0 14px;padding-bottom:12px;border-bottom:1.5px solid var(--sc)}
.bk-sec-code{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 8px;border-radius:7px;background:var(--sc);color:#fff;font-weight:800;font-size:15px;margin-bottom:10px}
.bk-sec-t{font-size:24px;line-height:1.1;color:var(--ik)}
.bk-sec-i{font-size:10.5px;color:var(--mu);margin-top:6px;max-width:92%}
.bk-p{margin:0 0 8px}
.bk-call{border-left:3px solid var(--sc);background:var(--tint);padding:8px 10px;margin:8px 0 10px;border-radius:0 6px 6px 0}
.bk-call.warn{border-color:var(--ac);background:var(--atint)}
.bk-call b.t{display:block;font-size:10.5px;margin-bottom:2px;color:var(--sc)}
.bk-call.warn b.t{color:var(--ik)}
.bk-list{margin:4px 0 10px 0;list-style:none}
.bk-list li{position:relative;padding-left:16px;margin:3px 0}
.bk-list li::before{content:'';position:absolute;left:3px;top:6px;width:5px;height:5px;border-radius:50%;background:var(--sc)}
.bk-list.number{counter-reset:n}
.bk-list.number li::before{counter-increment:n;content:counter(n);width:auto;height:auto;background:none;top:0;left:0;font-weight:800;color:var(--sc);font-size:10px}
.bk-list.check li::before{width:8px;height:8px;border-radius:2px;background:none;border:1.2px solid var(--ik);top:3px;left:1px}
.bk-tbl{width:100%;border-collapse:collapse;margin:6px 0 12px;font-size:9.5px}
.bk-tbl th{background:var(--sc);color:#fff;text-align:left;padding:5px 7px;font-weight:700}
.bk-tbl td{padding:5px 7px;border-bottom:.8px solid var(--rule);vertical-align:top}
.bk-voc{margin:6px 0 12px;border-top:1.2px solid var(--ik)}
.bk-voc .r{display:grid;grid-template-columns:30% 1fr;gap:2px 10px;padding:6px 0;border-bottom:.8px solid var(--rule)}
.bk-voc .en{font-weight:800;font-size:11.5px}
.bk-voc .ipa{color:var(--mu);font-size:8.5px;font-weight:400}
.bk-voc .uz{font-weight:600}
.bk-voc .ex{grid-column:2;color:var(--mu);font-style:italic;font-size:9.5px}
.bk-dlg{margin:6px 0 12px}
.bk-dlg .l{display:grid;grid-template-columns:22px 1fr;gap:8px;margin:5px 0}
.bk-dlg .w{width:22px;height:22px;border-radius:50%;background:var(--tint);color:var(--sc);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:9px}
.bk-dlg .uz{color:var(--mu);font-size:9px}
.bk-ex{margin:8px 0 12px;border:1px solid var(--rule);border-radius:8px;padding:9px 11px}
.bk-ex .t{display:flex;align-items:center;gap:6px;font-weight:800;margin-bottom:6px}
.bk-ex .t i{font-style:normal;font-size:8px;color:#fff;background:var(--sc);padding:2px 6px;border-radius:3px}
.bk-ex .q{display:grid;grid-template-columns:16px 1fr;gap:6px;margin:6px 0}
.bk-ex .q b{color:var(--sc)}
.bk-ex .ln{border-bottom:.8px solid var(--rule);height:20px;grid-column:2}
.bk-quiz .opt{display:flex;flex-wrap:wrap;gap:4px 14px;grid-column:2;color:var(--ik)}
.bk-quiz .opt span::before{content:'';display:inline-block;width:7px;height:7px;border:1px solid var(--ik);border-radius:50%;margin-right:4px;vertical-align:-1px}
.bk-lines{margin:8px 0 12px}
.bk-lines .lb{font-weight:700;margin-bottom:4px}
.bk-lines i{display:block;height:22px;border-bottom:.8px solid var(--rule)}
.bk-trk{margin:8px 0 12px}
.bk-trk .g{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:5px}
.bk-trk .g span{border:1px solid var(--rule);border-radius:4px;height:26px;font-size:7px;color:var(--mu);padding:2px 3px}
.bk-cardnote{display:flex;align-items:center;gap:8px;border:1px dashed var(--sc);border-radius:8px;padding:8px 10px;margin:8px 0 12px;color:var(--sc);font-weight:600}
.bk-cont{list-style:none;margin-top:8px}
.bk-cont li{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:.8px solid var(--rule)}
.bk-cont .c{width:26px;height:26px;border-radius:6px;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:10px}
.bk-cont .n{font-weight:700;font-size:11.5px}
.bk-cont .p{font-weight:700;color:var(--mu)}
/* Muqova */
.bk-cov{position:absolute;inset:0;padding:44px 40px;display:flex;flex-direction:column}
.bk-cov-t{font-size:46px;line-height:1;color:var(--sc);word-break:break-word}
.bk-cov.band{padding:0}
.bk-cov.band .top{background:var(--pr);color:#fff;padding:56px 40px 40px;min-height:58%}
.bk-cov.band .bk-cov-t{color:#fff}
.bk-cov.band .rest{padding:24px 40px;flex:1;display:flex;flex-direction:column}
.bk-cov.minimal .bk-cov-t{font-size:34px;color:var(--ik);margin-top:auto}
.bk-cov-s{font-size:13px;margin-top:14px;color:var(--ik);max-width:85%;line-height:1.4}
.bk-cov.band .bk-cov-s{color:rgba(255,255,255,.88)}
.bk-cov-a{margin-top:auto;font-size:9px;color:var(--mu)}
.bk-cov-badge{position:absolute;right:34px;bottom:120px;width:118px;height:118px;border-radius:50%;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;font-size:20px;line-height:1.05;padding:12px;transform:rotate(-8deg)}
.bk-cov-mark{display:flex;align-items:center;gap:6px;font-weight:700;font-size:9px;color:var(--mu)}
.bk-cov-mark svg{width:12px;height:12px}
/* v99: rangli, illyustratsiyali dizayn */
.bk-ill{display:inline-flex;flex-shrink:0}
.bk-ill svg{width:100%;height:100%;display:block}
.bk-run{top:0;left:0;right:0;height:30px;padding:0 40px;align-items:center;background:var(--sc);color:rgba(255,255,255,.92);font-weight:700;font-size:8px;letter-spacing:0}
.bk-body{top:46px}
.bk-tab{top:40px;background:var(--acd)}
.bk-foot{font-weight:700;color:var(--sc)}
.bk-foot i{height:3px;border-radius:2px}
.bk-sec-head{position:relative;background:var(--tint);border:none;border-radius:12px;padding:14px 74px 14px 14px;margin:0 0 14px;min-height:78px}
.bk-sec-head .sh{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:56px;height:56px}
.bk-call{display:flex;gap:9px;align-items:flex-start;border-left:none;border-radius:10px;padding:9px 11px;background:var(--tint)}
.bk-call .ci{width:22px;height:22px;margin-top:1px}
.bk-call.rule{background:var(--ptint)}
.bk-call.rule b.t{color:var(--pr)}
.bk-call.warn{background:var(--atint)}
.bk-voc{display:grid;grid-template-columns:1fr 1fr;gap:6px;border-top:none;margin:8px 0 12px}
.bk-voc .r{display:flex;gap:8px;align-items:flex-start;border:none;border-radius:9px;background:var(--tint);padding:7px 8px;grid-template-columns:none}
.bk-voc .r.alt{background:var(--atint)}
.bk-voc .vi{width:26px;height:26px;margin-top:1px}
.bk-voc .vi.let{align-items:center;justify-content:center;border-radius:7px;background:var(--sc);color:#fff;font-weight:800;font-size:12px}
.bk-voc .r.alt .vi.let{background:var(--acd)}
.bk-voc .tx{min-width:0}
.bk-voc .en{font-size:11px;line-height:1.2}
.bk-voc .uz{font-size:10px;color:var(--sc);font-weight:700;margin-top:1px}
.bk-voc .r.alt .uz{color:var(--acd)}
.bk-voc .ex{font-size:8.5px;line-height:1.35;margin-top:2px}
.bk-tbl{border-radius:8px;overflow:hidden}
.bk-tbl tr:nth-child(even) td{background:var(--tint)}
.bk-tbl td{border-bottom:none}
.bk-dlg .l{display:flex;gap:7px;align-items:flex-start}
.bk-dlg .l.b{flex-direction:row-reverse}
.bk-dlg .bb{background:var(--tint);border-radius:10px 10px 10px 3px;padding:6px 9px;max-width:80%}
.bk-dlg .l.b .bb{background:var(--atint);border-radius:10px 10px 3px 10px}
.bk-dlg .l.b .w{background:var(--atint);color:var(--acd)}
.bk-ex{border:none;box-shadow:inset 0 0 0 1px var(--rule);border-radius:10px;overflow:hidden;padding:0 11px 8px}
.bk-ex .t{margin:0 -11px 8px;padding:7px 11px;background:var(--sc);color:#fff}
.bk-ex .t i{background:rgba(255,255,255,.22)}
.bk-ex .t .ti{width:16px;height:16px}
.bk-ex .q b{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:var(--tint);font-size:8.5px}
.bk-quiz .opt span{border:1px solid var(--rule);border-radius:12px;padding:1px 8px}
.bk-quiz .opt span::before{display:none}
.bk-kp{position:relative;background:linear-gradient(135deg,var(--ik),var(--sc))}
.bk-kp .ki{position:absolute;right:10px;top:8px;width:22px;height:22px}
.bk-card .cd{width:34px;height:34px;margin-bottom:6px}
.bk-card{background:linear-gradient(180deg,var(--tint),transparent 60%)}
.bk-cov-ill{position:absolute;right:26px;bottom:70px;width:220px;height:200px;pointer-events:none}
.bk-cov.big-title{background:linear-gradient(180deg,transparent 72%,var(--ptint) 72%)}
.bk-cov.minimal{background:linear-gradient(180deg,transparent 62%,var(--ptint) 62%)}
.bk-cov-ill .bk-ill{position:absolute}
.bk-cov-ill .c0{width:150px;height:150px;right:0;bottom:0}
.bk-cov-ill .c1{width:92px;height:92px;left:0;bottom:60px;transform:rotate(-10deg)}
.bk-cov-ill .c2{width:74px;height:74px;right:120px;top:0;transform:rotate(8deg)}
.bk-cov.band .bk-cov-ill{bottom:40px}
.bk-cov-ill.poster{right:60px;top:70px;bottom:auto;width:170px;height:170px}
.bk-cov-ill.poster .c0{width:170px;height:170px}
.bk-open .oi{position:absolute;right:34px;top:48px;width:120px;height:120px}
/* v100: ma'lumot grafikasi */
.bk-li{display:inline-flex;flex-shrink:0;color:var(--sc)}
.bk-li svg{width:100%;height:100%}
.bk-call .bk-li.ci{width:16px;height:16px;margin-top:1px}
.bk-call.rule .bk-li{color:var(--pr)}.bk-call.warn .bk-li{color:var(--acd)}
.bk-ex .t .bk-li.ti{width:12px;height:12px;color:#fff;margin-right:2px}
.bk-sec-head{padding-right:70px}
.bk-sh-t,.bk-open-t{position:absolute;text-align:center;font-size:8px;font-weight:700;color:var(--mu);line-height:1.1}
.bk-sh-t{right:14px;top:14px;width:46px}
.bk-sh-t b,.bk-open-t b{display:block;font-family:'Bricolage Grotesque','Inter',sans-serif;font-weight:800;color:var(--sc)}
.bk-sh-t b{font-size:22px}
.bk-open-t{right:40px;top:56px}
.bk-open-t b{font-size:44px;line-height:.95}
.bk-comp{margin-top:10px}
.bk-comp .bar{display:flex;gap:2px;height:6px;border-radius:4px;overflow:hidden}
.bk-comp .bar i{display:block;min-width:4px}
.bk-comp .lg{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:5px;font-size:7.5px;font-weight:600;color:var(--mu)}
.bk-comp .lg span{display:inline-flex;align-items:center;gap:4px}
.bk-comp .lg i{width:7px;height:7px;border-radius:2px;display:inline-block}
.bk-open-c{margin-top:auto;margin-bottom:14px}
.bk-open-c .bk-comp .bar{height:12px;border-radius:6px}
.bk-open-c .bk-comp .lg{font-size:9px;margin-top:8px;gap:4px 14px}
.bk-open .inc{margin-top:0}
.bk-cov-foot{position:absolute;left:40px;right:34px;bottom:40px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
.bk-cov-foot .bk-cov-meta{margin-top:0;color:var(--ik)}
.bk-cov-foot .bk-lv{width:190px}
.bk-cov:has(.bk-cov-foot) .bk-cov-a{margin-bottom:84px}
.bk-cov.band .bk-cov-foot .bk-cov-meta{color:var(--ik)}
.bk-cov.band .bk-cov-lvw{bottom:36px}
.bk-lv .cap{font-size:8px;font-weight:700;color:var(--mu);margin-bottom:5px}
.bk-lv .seg{display:grid;grid-template-columns:repeat(6,1fr);gap:3px}
.bk-lv .seg i{height:22px;border-radius:4px;background:var(--rule);display:flex;align-items:center;justify-content:center}
.bk-lv .seg i span{font-style:normal;font-size:8px;font-weight:700;color:var(--mu)}
.bk-lv .seg i.d{background:var(--ptint)}
.bk-lv .seg i.d span{color:var(--pr)}
.bk-lv .seg i.on{background:var(--pr)}
.bk-lv .seg i.on span{color:#fff}
.bk-trk{width:100%;border-collapse:collapse;font-size:10px;margin-top:4px}
.bk-trk th{font-size:8px;font-weight:700;color:var(--mu);text-align:left;padding:0 4px 6px;border-bottom:1px solid var(--rule)}
.bk-trk th small{font-weight:600;opacity:.8;margin-left:3px}
.bk-trk td{padding:8px 4px;border-bottom:.8px solid var(--rule);vertical-align:middle}
.bk-trk .c,.bk-srs .c{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 3px;border-radius:4px;color:#fff;font-size:8px;font-weight:800;margin-right:6px;vertical-align:middle}
.bk-trk .n{font-weight:600;color:var(--ik)}
.bk-trk .sc{white-space:nowrap;color:var(--mu);font-size:9.5px;width:58px}
.ln{display:inline-block;width:22px;border-bottom:1px solid var(--ik);margin-right:3px;vertical-align:-1px}
.bk-trk .cf{white-space:nowrap;width:112px}
.bk-trk .cf i{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;border:1px solid var(--rule);font-style:normal;font-size:7.5px;color:var(--mu);margin-right:3px}
.bk-trk-sum{margin-top:14px;background:var(--tint);border-radius:10px;padding:10px 12px}
.bk-trk-sum>div:first-child{display:flex;justify-content:space-between;align-items:baseline;font-size:10.5px;color:var(--ik)}
.bk-trk-sum>div:first-child span{color:var(--mu);font-size:10px}
.bk-trk-sum .pc{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-top:9px}
.bk-trk-sum .pc i{height:20px;border-radius:3px;border:1px solid var(--rule);background:var(--pp);display:flex;align-items:flex-end;justify-content:center}
.bk-trk-sum .pc i:nth-child(n+8){border-color:var(--sc)}
.bk-trk-sum .pc span{font-style:normal;font-size:6px;color:var(--mu);padding-bottom:1px}
.bk-trk-sum p{font-size:8px;line-height:1.45;color:var(--mu);margin-top:7px}
.bk-trk-h{font-size:12px;font-weight:700;color:var(--ik);margin:18px 0 3px}
.bk-trk-p{font-size:8.5px;line-height:1.45;color:var(--mu);margin-bottom:6px}
.bk-srs{width:100%;border-collapse:collapse}
.bk-srs th{font-size:7.5px;font-weight:700;color:var(--mu);padding:0 0 5px;text-align:center}
.bk-srs td{padding:5px 0;border-top:.8px solid var(--rule);text-align:center}
.bk-srs td:first-child{text-align:left;width:34px}
.bk-srs td i{display:inline-block;width:13px;height:13px;border-radius:3px;border:1px solid var(--sc)}
/* v98: Pro bloklar */
.bk-kp{margin:10px 0 12px;background:var(--ik);color:var(--pp);border-radius:8px;padding:10px 12px 8px}
.bk-kp .t{display:block;font-size:10.5px;color:var(--pp);opacity:.75;margin-bottom:4px;letter-spacing:.02em}
.bk-kp ol{list-style:none;counter-reset:k}
.bk-kp li{position:relative;padding:4px 0 4px 22px;border-top:.8px solid rgba(255,255,255,.14)}
.bk-kp li:first-child{border-top:none}
.bk-kp li::before{counter-increment:k;content:counter(k);position:absolute;left:0;top:3px;font-weight:800;color:var(--sc);font-size:11px;filter:brightness(1.35)}
.bk-mis{margin:8px 0 12px}
.bk-mis .t{display:block;font-size:10.5px;color:var(--ac);margin-bottom:4px}
.bk-mis .r{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;padding:6px 0;border-bottom:.8px solid var(--rule)}
.bk-mis .w{color:var(--mu);text-decoration:line-through;text-decoration-color:var(--ac)}
.bk-mis .k{font-weight:700;color:var(--ik)}
.bk-mis i{font-style:normal;font-weight:800;margin-right:5px;text-decoration:none;display:inline-block}
.bk-mis .w i{color:var(--ac)} .bk-mis .k i{color:var(--sc)}
.bk-mis .u{grid-column:1/-1;font-size:9px;color:var(--mu)}
/* v98: Pro muqovalar */
.bk-cov.poster{padding:0;background:var(--pr);color:#fff}
.bk-cov.poster .in{position:absolute;inset:44px 74px 40px 40px;display:flex;flex-direction:column}
.bk-cov.poster .bk-cov-t{color:#fff;font-size:60px;line-height:.95;letter-spacing:-.02em;margin-top:auto}
.bk-cov.poster .bk-cov-s{color:rgba(255,255,255,.85)}
.bk-cov.poster .stripes{position:absolute;top:0;right:0;bottom:0;width:44px;display:flex;flex-direction:column}
.bk-cov.poster .stripes i{flex:1}
.bk-cov-meta{display:flex;gap:16px;margin-top:22px;font-size:9px;font-weight:700;letter-spacing:.02em}
.bk-cov-meta b{display:block;font-size:22px;line-height:1;margin-bottom:2px}
.bk-cov.poster .bk-cov-meta{color:rgba(255,255,255,.85)}
.bk-cov.poster .bk-cov-meta b{color:#fff}
.bk-cov.split{padding:0}
.bk-cov.split .top{position:relative;height:60%;padding:44px 40px 0}
.bk-cov.split .big{position:absolute;right:-30px;bottom:-24px;width:260px;opacity:.95}
.bk-cov.split .bk-cov-t{font-size:44px;color:var(--ik);max-width:72%;margin-top:40px;position:relative}
.bk-cov.split .bot{position:absolute;left:0;right:0;bottom:0;height:40%;background:var(--ik);color:var(--pp);padding:30px 40px}
.bk-cov.split .bk-cov-s{color:var(--pp);opacity:.85;margin-top:0}
.bk-cov.split .bk-cov-meta{color:var(--pp);opacity:.8}
.bk-cov.split .bk-cov-meta b{color:var(--pr);filter:brightness(1.3)}
.bk-cov.editorial{padding:40px 40px}
.bk-cov.editorial .hd{display:flex;justify-content:space-between;font-size:9px;font-weight:600;color:var(--mu);padding-bottom:10px;border-bottom:1.2px solid var(--ik)}
.bk-cov.editorial .bk-cov-t{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:58px;line-height:.98;color:var(--ik);margin-top:46px}
.bk-cov.editorial .bk-cov-s{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:17px;color:var(--pr)}
.bk-cov.editorial .toc{margin-top:auto;border-top:.8px solid var(--rule)}
.bk-cov.editorial .toc div{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:.8px solid var(--rule);font-size:10px;font-weight:600}
.bk-cov.editorial .toc span{width:20px;height:20px;border-radius:5px;color:#fff;font-weight:800;font-size:9px;display:flex;align-items:center;justify-content:center}
.bk-pro-mark{position:absolute;right:40px;bottom:20px;font-size:8px;font-weight:700;color:var(--mu);display:flex;align-items:center;gap:4px}
.bk-pro-mark i{width:6px;height:6px;border-radius:50%;background:#F2B400}
/* v98: bo'lim ochilish sahifasi (Pro) */
.bk-open{position:absolute;inset:0;padding:52px 40px 44px;display:flex;flex-direction:column;background:var(--tint)}
.bk-open .num{font-family:'Bricolage Grotesque','Inter',sans-serif;font-weight:800;font-size:150px;line-height:.85;color:var(--sc);letter-spacing:-.04em}
.bk-open .lb{font-size:11px;font-weight:800;color:var(--sc);margin-top:22px}
.bk-open h2{font-size:34px;line-height:1.05;color:var(--ik);margin-top:6px;max-width:90%}
.bk-page.f-serif .bk-open h2{font-family:'Instrument Serif',Georgia,serif;font-weight:400}
.bk-page.f-grotesk .bk-open h2{font-family:'Bricolage Grotesque','Inter',sans-serif;font-weight:700}
.bk-open p{font-size:12px;line-height:1.5;color:var(--mu);margin-top:12px;max-width:85%}
.bk-open .inc{margin-top:auto;border-top:1.5px solid var(--sc);padding-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bk-open .inc div{font-size:8.5px;color:var(--mu);font-weight:600}
.bk-open .inc b{display:block;font-size:20px;color:var(--ik);font-weight:800;line-height:1.1}
/* Kartochka varaqlari */
.bk-cards{position:absolute;inset:30px 26px 36px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,1fr)}
.bk-card{border:1px dashed #9AA3B5;margin:-.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px;position:relative}
.bk-card .k{position:absolute;top:6px;left:8px;font-size:7px;color:var(--mu)}
.bk-card .s{position:absolute;top:0;right:0;width:22px;height:5px;background:var(--sc)}
.bk-card .f{font-size:17px;font-weight:800;line-height:1.15;color:var(--ik)}
.bk-card .b{font-size:13px;font-weight:700;color:var(--sc);line-height:1.25}
.bk-card .h{font-size:8.5px;color:var(--mu);margin-top:5px}
.bk-cards-cap{position:absolute;top:12px;left:26px;right:26px;display:flex;justify-content:space-between;font-size:7.5px;color:var(--mu)}
`;
function injectCss(){ if(document.getElementById('bkCss')) return; const st=document.createElement('style'); st.id='bkCss'; st.textContent=BK_CSS; document.head.appendChild(st); }

/* ---------- Bloklar ---------- */
const SPLIT = {vocab:'items', list:'items', exercise:'items', quiz:'items', table:'rows', dialog:'lines', mistakes:'items'};
function blockHtml(b, cont){
  const cTag = cont ? ' <span style="font-weight:400;color:var(--mu)">(davomi)</span>' : '';
  switch(b.type){
    case 'text': return `<p class="bk-p">${md(b.text)}</p>`;
    case 'callout': return `<div class="bk-call ${b.tone||'tip'}">${li(b.tone||'tip','ci')}<div>${b.title?`<b class="t">${esc(b.title)}</b>`:''}${md(b.text)}</div></div>`;
    case 'list': return `<ul class="bk-list ${b.style}">${b.items.map(x=>`<li>${md(x)}</li>`).join('')}</ul>`;
    case 'table': return `<table class="bk-tbl">${b.head&&b.head.length?`<tr>${b.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>`:''}${b.rows.map(r=>`<tr>${r.map(c=>`<td>${md(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    case 'vocab': return `<div class="bk-voc">${b.items.map((v,i)=>`<div class="r ${((b._start||0)+i)%2?'alt':''}"><span class="bk-ill vi let">${esc((v.en||'?').slice(0,1).toUpperCase())}</span><div class="tx"><div class="en">${esc(v.en)}${v.ipa?` <span class="ipa">${esc(v.ipa)}</span>`:''}</div><div class="uz">${esc(v.uz)}</div>${v.ex?`<div class="ex">${esc(v.ex)}</div>`:''}</div></div>`).join('')}</div>`;
    case 'dialog': { const who=[...new Set(b.lines.map(l=>l.who))]; return `<div class="bk-dlg">${b.lines.map(l=>`<div class="l ${who.indexOf(l.who)%2?'b':'a'}"><span class="w">${esc((l.who||'?').slice(0,2))}</span><div class="bb">${esc(l.en)}${l.uz?`<div class="uz">${esc(l.uz)}</div>`:''}</div></div>`).join('')}</div>`; }
    case 'exercise': { const start=b._start||0;
      return `<div class="bk-ex">${b.title?`<div class="t">${li('ex','ti')}<i>Mashq</i>${esc(b.title)}${cTag}</div>`:''}${b.items.map((q,i)=>`<div class="q"><b>${start+i+1}</b><div>${md(q.q)}</div>${b.kind==='write'||b.kind==='translate'?'<span></span><div class="ln"></div>':''}</div>`).join('')}</div>`; }
    case 'quiz': { const start=b._start||0;
      return `<div class="bk-ex bk-quiz">${b.title?`<div class="t">${li('quiz','ti')}<i>Test</i>${esc(b.title)}${cTag}</div>`:''}${b.items.map((q,i)=>`<div class="q"><b>${start+i+1}</b><div>${md(q.q)}</div><span></span><div class="opt">${q.options.map((o,k)=>`<span>${'ABCD'[k]}) ${esc(o)}</span>`).join('')}</div></div>`).join('')}</div>`; }
    case 'lines': return `<div class="bk-lines">${b.label?`<div class="lb">${esc(b.label)}</div>`:''}${'<i></i>'.repeat(b.n)}</div>`;
    case 'tracker': return `<div class="bk-trk"><b>${esc(b.label||'Kuzatuv')}</b><div class="g">${Array.from({length:b.days},(_,i)=>`<span>${i+1}</span>`).join('')}</div></div>`;
    case 'keypoints': return `<div class="bk-kp"><b class="t">${esc(b.title||'Esda tuting')}</b><ol>${b.items.map(x=>`<li>${md(x)}</li>`).join('')}</ol></div>`;
    case 'mistakes': return `<div class="bk-mis"><b class="t">${esc(b.title||"Ko'p uchraydigan xatolar")}</b>${b.items.map(m=>`<div class="r"><div class="w"><i>✕</i>${esc(m.wrong)}</div><div class="k"><i>✓</i>${esc(m.right)}</div>${m.uz?`<div class="u">${esc(m.uz)}</div>`:''}</div>`).join('')}</div>`;
    case 'cards': return `<div class="bk-cardnote">${b.items.length} ta kartochka${b.title?`: ${esc(b.title)}`:''}. Kitobcha oxirida qirqib olinadigan varaqlarda.</div>`;
  }
  return '';
}

/* ---------- v100: illyustratsiyalar o'rniga ma'lumot grafikasi ----------
   Daraja shkalasi (CEFR), bo'lim tarkibi diagrammasi, o'qish vaqti va o'zlashtirish jadvali.
   Belgilar — bir rangli chiziqli piktogrammalar (bezak emas, blok turini bildiradi). */
const ico=()=>'';
const LI={
  tip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  rule:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 8h6M8 12h6"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  ex:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  quiz:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>'};
const li=(k,cls)=>`<span class="bk-li ${cls||''}">${LI[k]||''}</span>`;
const CEFR=['A1','A2','B1','B2','C1','C2'];
function docLevel(doc){ const s=[doc.level,doc.cover&&doc.cover.badge,doc.subtitle,doc.title].filter(Boolean).join(' '); const m=s.match(/\b([ABC][12])\b/i); return m?m[1].toUpperCase():''; }
function cefrScale(lv){ const k=CEFR.indexOf(lv); if(k<0) return '';
  return `<div class="bk-lv"><div class="cap">Daraja</div><div class="seg">${CEFR.map((c,i)=>`<i class="${i<k?'d':i===k?'on':''}"><span>${c}</span></i>`).join('')}</div></div>`; }
function secParts(sec){ let r=0,w=0,t=0,c=0;
  sec.blocks.forEach(b=>{ const n=(b.items&&b.items.length)||0;
    if(b.type==='vocab') w+=n; else if(b.type==='exercise'||b.type==='quiz') t+=n; else if(b.type==='cards') c+=n; else r+=2; });
  return [["Qoida va izoh",r,'var(--ik)'],["So'zlar",w,'var(--sc)'],["Mashqlar",t,'var(--acd)'],["Kartochkalar",c,'var(--mu)']].filter(x=>x[1]>0); }
function secMinutes(sec){ let m=0; sec.blocks.forEach(b=>{ const n=(b.items&&b.items.length)||0;
  if(b.type==='vocab') m+=n*.7; else if(b.type==='exercise'||b.type==='quiz') m+=n*1.1; else if(b.type==='cards') m+=n*.3; else if(b.type==='dialog') m+=2; else m+=1.2; });
  return Math.max(3,Math.round(m)); }
function compBar(sec){ const p=secParts(sec); const tot=p.reduce((s,x)=>s+x[1],0)||1;
  return `<div class="bk-comp"><div class="bar">${p.map(x=>`<i style="flex:${x[1]};background:${x[2]}"></i>`).join('')}</div><div class="lg">${p.map(x=>`<span><i style="background:${x[2]}"></i>${x[0]} ${Math.round(x[1]/tot*100)}%</span>`).join('')}</div></div>`; }
function docIcons(){ return []; }
async function loadIcons(){}

/* ---------- Statistika (muqova va bo'lim ochilishi uchun) ---------- */
function secStats(sec){
  let w=0,c=0,t=0,k=0; sec.blocks.forEach(b=>{ if(b.type==='vocab') w+=b.items.length; if(b.type==='cards') c+=b.items.length; if(b.type==='exercise'||b.type==='quiz') t+=b.items.length; if(b.type==='keypoints') k+=b.items.length; });
  const out=[]; if(w) out.push([w,"yangi so'z"]); if(t) out.push([t,'savol va mashq']); if(c) out.push([c,'kartochka']); if(out.length<3&&k) out.push([k,'asosiy xulosa']);
  if(!out.length) out.push([sec.blocks.length,'blok']); return out.slice(0,3);
}
function bkStats(doc){ let words=0,cards=0,tasks=0; doc.sections.forEach(s=>s.blocks.forEach(b=>{ if(b.type==='vocab') words+=b.items.length; if(b.type==='cards') cards+=b.items.length; if(b.type==='exercise'||b.type==='quiz') tasks+=b.items.length; })); return {words,cards,tasks}; }

/* ---------- Sahifalash ---------- */
function bkDeep(hex,ink){ // juda och rangni siyoh tomon aralashtirib to'qlashtiramiz
  const p=h=>{ const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; };
  const L=([r,g,b])=>{ const f=v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
  let c=p(hex), k=p(ink||'#0F1B3D'), i=0;
  while(L(c)>.3 && i<8){ c=c.map((v,j)=>Math.round(v*.8+k[j]*.2)); i++; }
  return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
}
function themeVars(doc, secColor){
  const t=doc.theme, sc=bkDeep(secColor||t.primary, t.ink);
  const hexA=(h,a)=>{ const n=parseInt(h.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; };
  return `--pp:${t.paper};--ik:${t.ink};--pr:${bkDeep(t.primary,t.ink)};--ac:${t.accent};--sc:${sc};--mu:${hexA(t.ink,.58)};--rule:${hexA(t.ink,.16)};--tint:${hexA(sc,.1)};--atint:${hexA(t.accent,.1)};--ptint:${hexA(t.primary,.1)};--acd:${bkDeep(t.accent,t.ink)}`;
}
function newPage(doc, S, opts){
  const p=document.createElement('div');
  p.className='bk-page f-'+doc.theme.font;
  p.style.cssText=`width:${S.w}px;height:${S.h}px;${themeVars(doc,opts&&opts.color)}`;
  return p;
}
async function paginate(doc, stage){
  injectCss();
  try{ await Promise.race([document.fonts.ready, new Promise(r=>setTimeout(r,1500))]); }catch(e){}
  const S=SIZES[doc.size]||SIZES.A5;
  try{ await loadIcons(docIcons(doc)); }catch(e){}
  stage.innerHTML='';
  const pages=[]; // {el, kind, sec}
  const push=(el,kind,sec)=>{ stage.appendChild(el); pages.push({el,kind,sec}); return el; };
  // 1) Muqova
  const cov=newPage(doc,S); const cs=doc.cover.style;
  const mark=`<div class="bk-cov-mark"><svg viewBox="0 0 64 70"><path d="M32 4C32 4 9 30 9 43a23 23 0 0 0 46 0C55 30 32 4 32 4Z" fill="currentColor"/></svg>WordDrop</div>`;
  cov.innerHTML = cs==='band'
    ? `<div class="bk-cov band"><div class="top">${mark.replace('bk-cov-mark','bk-cov-mark" style="color:rgba(255,255,255,.8)')}<div style="height:36px"></div><h1 class="bk-cov-t">${esc(doc.title)}</h1>${doc.subtitle?`<p class="bk-cov-s">${esc(doc.subtitle)}</p>`:''}</div><div class="rest"><div class="bk-cov-a">${esc(doc.author||window.__wdName||'')}</div></div></div>`
    : `<div class="bk-cov ${cs}">${mark}<div style="height:${cs==='minimal'?0:60}px"></div><h1 class="bk-cov-t">${esc(doc.title)}</h1>${doc.subtitle?`<p class="bk-cov-s">${esc(doc.subtitle)}</p>`:''}<div class="bk-cov-a">${esc(doc.author||window.__wdName||'')}</div></div>`;
  const cIc=[]; const lvHtml=cefrScale(docLevel(doc));
  const cluster=lvHtml?`<div class="bk-cov-lvw">${lvHtml}</div>`:'';
  const st=bkStats(doc);
  const meta=`<div class="bk-cov-meta"><div><b>${doc.sections.length}</b>bo'lim</div>${st.words?`<div><b>${st.words}</b>so'z</div>`:''}${st.cards?`<div><b>${st.cards}</b>kartochka</div>`:''}${st.tasks?`<div><b>${st.tasks}</b>mashq</div>`:''}</div>`;
  if(!['poster','split','editorial'].includes(cs)) cov.firstElementChild.insertAdjacentHTML('beforeend',`<div class="bk-cov-foot">${meta}${lvHtml}</div>`);
  if(cs==='poster'){
    cov.innerHTML=`<div class="bk-cov poster"><div class="stripes">${doc.sections.map((s,i)=>{ const c=s.color||doc.theme.accent; return `<i style="background:${c.toLowerCase()===doc.theme.primary.toLowerCase()?(i%2?'rgba(255,255,255,.12)':'rgba(255,255,255,.26)'):c}"></i>`; }).join('')}</div><div class="in">${mark.replace('bk-cov-mark','bk-cov-mark" style="color:rgba(255,255,255,.8)')}<h1 class="bk-cov-t">${esc(doc.title)}</h1>${doc.subtitle?`<p class="bk-cov-s">${esc(doc.subtitle)}</p>`:''}${meta}</div></div>`;
  } else if(cs==='split'){
    cov.innerHTML=`<div class="bk-cov split"><div class="top">${mark}<svg class="big" viewBox="0 0 64 70"><defs><clipPath id="bkcv"><path d="M32 4C32 4 9 30 9 43a23 23 0 0 0 46 0C55 30 32 4 32 4Z"/></clipPath></defs><path d="M32 4C32 4 9 30 9 43a23 23 0 0 0 46 0C55 30 32 4 32 4Z" fill="none" stroke="${doc.theme.primary}" stroke-width="1.6"/><g clip-path="url(#bkcv)"><path d="M0 30 Q16 27 32 30 T64 30 V72 H0Z" fill="${doc.theme.primary}"/></g></svg><h1 class="bk-cov-t">${esc(doc.title)}</h1></div><div class="bot">${doc.subtitle?`<p class="bk-cov-s">${esc(doc.subtitle)}</p>`:''}${meta}</div></div>`;
  } else if(cs==='editorial'){
    const dt=new Date(); const MO=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
    cov.innerHTML=`<div class="bk-cov editorial"><div class="hd"><span>WordDrop kitobchasi</span><span>${MO[dt.getMonth()]} ${dt.getFullYear()}</span></div><h1 class="bk-cov-t">${esc(doc.title)}</h1>${doc.subtitle?`<p class="bk-cov-s">${esc(doc.subtitle)}</p>`:''}<div class="toc">${doc.sections.slice(0,8).map((s,i)=>`<div><span style="background:${s.color||doc.theme.primary}">${esc(s.code||String(i+1))}</span>${esc(s.title)}</div>`).join('')}</div></div>`;
  }
  if(doc.cover.badge && !['poster','split','editorial'].includes(cs)){ const bd=document.createElement('div'); bd.className='bk-cov-badge'; bd.textContent=doc.cover.badge; cov.appendChild(bd); }
  push(cov,'cover');
  // 2) Mundarija (keyin to'ldiriladi)
  const toc=push(newPage(doc,S),'toc');
  // 3) Bo'limlar
  const secStart=[];
  let n=3;
  const mkContent=(sec)=>{
    const p=newPage(doc,S,{color:sec.color||doc.theme.primary});
    p.innerHTML=`<div class="bk-run"><span>${esc(doc.title)}</span><span>${esc(sec.title)}</span></div><div class="bk-body"></div><div class="bk-foot"><i></i>${n}</div><div class="bk-tab">${esc(sec.code||'')}</div>${doc.pro?'<div class="bk-pro-mark"><i></i>WordDrop Pro</div>':''}`;
    n++; return push(p,'content',sec);
  };
  const over=body=>body.scrollHeight>body.clientHeight+1;
  doc.sections.forEach((sec,si)=>{
    if(doc.pro){
      const o=newPage(doc,S,{color:sec.color||doc.theme.primary}); const c=secStats(sec);
      o.innerHTML=`<div class="bk-open"><div class="bk-open-t"><b>${secMinutes(sec)}</b>daqiqa</div><div class="num">${esc(sec.code||String(si+1))}</div><div class="lb">${si+1}-bo'lim</div><h2>${esc(sec.title)}</h2>${sec.intro?`<p>${esc(sec.intro)}</p>`:''}<div class="bk-open-c">${compBar(sec)}</div><div class="inc">${c.map(([n,l])=>`<div><b>${n}</b>${l}</div>`).join('')}</div></div><div class="bk-pro-mark"><i></i>WordDrop Pro</div>`;
      push(o,'opener',sec); n++;
    }
    let page=mkContent(sec); let body=page.querySelector('.bk-body');
    secStart.push(n-1);
    body.innerHTML=`<div class="bk-sec-head"><div class="bk-sh-t"><b>${secMinutes(sec)}</b>daqiqa</div><div class="bk-sec-code">${esc(sec.code||String(si+1))}</div><h2 class="bk-sec-t">${esc(sec.title)}</h2>${sec.intro?`<p class="bk-sec-i">${esc(sec.intro)}</p>`:''}${compBar(sec)}</div>`;
    sec.blocks.forEach(b=>{
      const add=(blk,cont)=>{ const w=document.createElement('div'); w.innerHTML=blockHtml(blk,cont); const el=w.firstElementChild; if(el) body.appendChild(el); return el; };
      let el=add(b,false);
      if(!el || !over(body)) return;
      el.remove();
      const key=SPLIT[b.type];
      if(!key){ // bo'linmaydigan blok — yangi sahifaga
        if(body.children.length){ page=mkContent(sec); body=page.querySelector('.bk-body'); }
        add(b,false); return;
      }
      let rest=b[key].slice(), start=0, first=true;
      while(rest.length){
        let take=[];
        for(const it of rest){
          const part=Object.assign({},b,{[key]:take.concat([it]),_start:start});
          if(!first) part.title=b.title;
          const tmp=add(part,!first);
          const ov=over(body); tmp.remove();
          if(ov) break; take.push(it);
        }
        if(!take.length){
          if(!body.children.length){ take=[rest[0]]; } // juda katta element — majburan
          else { page=mkContent(sec); body=page.querySelector('.bk-body'); continue; }
        }
        add(Object.assign({},b,{[key]:take,_start:start}),!first);
        rest=rest.slice(take.length); start+=take.length; first=false;
        if(rest.length){ page=mkContent(sec); body=page.querySelector('.bk-body'); }
      }
    });
  });
  // 4) Kartochka varaqlari (old tomoni + teskari tomoni, ikki tomonlama chop etish uchun ko'zgu tartibda)
  const cards=[]; doc.sections.forEach(sec=>sec.blocks.forEach(b=>{ if(b.type==='cards') b.items.forEach(c=>cards.push(Object.assign({sec},c))); }));
  let cardStart=0;
  if(cards.length){
    cardStart=n;
    for(let i=0;i<cards.length;i+=8){
      const chunk=cards.slice(i,i+8);
      const fr=newPage(doc,S); fr.innerHTML=`<div class="bk-cards-cap"><span>Kartochkalar · old tomoni</span><span>${n}</span></div><div class="bk-cards">${Array.from({length:8},(_,k)=>{ const c=chunk[k]; if(!c) return '<div class="bk-card"></div>';
        return `<div class="bk-card" style="--sc:${c.sec.color||doc.theme.primary}"><span class="k">${i+k+1}</span><span class="s"></span><div class="f">${esc(c.front)}</div></div>`; }).join('')}</div>`;
      push(fr,'cards'); n++;
      const bk=newPage(doc,S); bk.innerHTML=`<div class="bk-cards-cap"><span>Kartochkalar · orqa tomoni</span><span>${n}</span></div><div class="bk-cards">${Array.from({length:8},(_,k)=>{ const m=k%2===0?k+1:k-1; const c=chunk[m]; if(!c) return '<div class="bk-card"></div>';
        return `<div class="bk-card" style="--sc:${c.sec.color||doc.theme.primary}"><span class="k">${i+m+1}</span><div class="b">${esc(c.back)}</div>${c.hint?`<div class="h">${esc(c.hint)}</div>`:''}</div>`; }).join('')}</div>`;
      push(bk,'cards'); n++;
    }
  }
  // 4.5) Natijalarim: mashq natijasi, ishonch shkalasi va takrorlash jadvali (barcha kitobchalar uchun)
  {
    const tp=newPage(doc,S,{color:doc.theme.primary});
    const rows=doc.sections.map((sec,i)=>{ const t=sec.blocks.reduce((a,b)=>a+((b.type==='exercise'||b.type==='quiz')?b.items.length:0),0); return {sec,i,t}; });
    const total=rows.reduce((a,r)=>a+r.t,0); const st=bkStats(doc);
    const chip=(r)=>`<span class="c" style="background:${r.sec.color||doc.theme.primary}">${esc(r.sec.code||String(r.i+1))}</span>`;
    tp.innerHTML=`<div class="bk-run"><span>${esc(doc.title)}</span><span>Natijalarim</span></div><div class="bk-body">
      <div class="bk-sec-head"><h2 class="bk-sec-t">Natijalarim</h2><p class="bk-sec-i">Har bo'limdan keyin to'ldiring: nechta savolga to'g'ri javob berdingiz va mavzuni qanchalik ishonch bilan bilasiz.</p></div>
      <table class="bk-trk"><thead><tr><th>Bo'lim</th><th>To'g'ri</th><th>Ishonch <small>1 — 5</small></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${chip(r)}<span class="n">${esc(r.sec.title)}</span></td><td class="sc">${r.t?`<span class="ln"></span>/ ${r.t}`:'—'}</td><td class="cf">${[1,2,3,4,5].map(k=>`<i>${k}</i>`).join('')}</td></tr>`).join('')}</tbody></table>
      ${total?`<div class="bk-trk-sum"><div><b>Umumiy natija</b><span><span class="ln"></span>/ ${total}</span></div><div class="pc">${Array.from({length:10},(_,k)=>`<i><span>${(k+1)*10}</span></i>`).join('')}</div><p>To'g'ri javoblar foiziga qadar kataklarni bo'yang. 80% dan yuqori bo'lsa — mavzu o'zlashtirildi.</p></div>`:''}
      <h3 class="bk-trk-h">Takrorlash jadvali</h3><p class="bk-trk-p">${st.words?`${st.words} ta so'zni`:"Mavzuni"} uzoq eslab qolish uchun shu kunlarda qayta ko'rib chiqing va katakni belgilang.</p>
      <table class="bk-srs"><thead><tr><th></th>${['1-kun','3-kun','7-kun','14-kun','30-kun'].map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${chip(r)}</td>${'<td><i></i></td>'.repeat(5)}</tr>`).join('')}</tbody></table>
    </div><div class="bk-foot"><i></i>${n}</div>${doc.pro?'<div class="bk-pro-mark"><i></i>WordDrop Pro</div>':''}`;
    push(tp,'tracker'); n++;
  }
  // 5) Javoblar kaliti
  const keys=[]; doc.sections.forEach(sec=>sec.blocks.forEach(b=>{
    if(b.type==='exercise' && b.items.some(x=>x.a)) keys.push({sec, title:b.title||'Mashq', ans:b.items.map((x,i)=>`${i+1}) ${x.a||'—'}`)});
    if(b.type==='quiz') keys.push({sec, title:b.title||'Test', ans:b.items.map((x,i)=>`${i+1}) ${'ABCD'[x.answer]||'A'}`)});
  }));
  if(keys.length){
    const kp=newPage(doc,S,{color:doc.theme.ink});
    kp.innerHTML=`<div class="bk-run"><span>${esc(doc.title)}</span><span>Javoblar</span></div><div class="bk-body"><div class="bk-sec-head"><h2 class="bk-sec-t">Javoblar</h2></div>${keys.map(k=>`<div style="margin:0 0 9px"><b style="color:${k.sec.color||doc.theme.primary}">${esc(k.sec.code||'')} · ${esc(k.title)}</b><div style="color:var(--mu)">${k.ans.map(esc).join('   ')}</div></div>`).join('')}</div><div class="bk-foot"><i></i>${n}</div>`;
    push(kp,'keys'); n++;
  }
  // Mundarija
  toc.innerHTML=`<div class="bk-body" style="top:44px"><h2 class="bk-sec-t" style="font-size:26px;margin-bottom:6px">Mundarija</h2><ul class="bk-cont">${doc.sections.map((s,i)=>`<li><span class="c" style="background:${s.color||doc.theme.primary}">${esc(s.code||i+1)}</span><span class="n">${esc(s.title)}</span><span class="p">${secStart[i]}</span></li>`).join('')}${cards.length?`<li><span class="c" style="background:${doc.theme.ink}">K</span><span class="n">Kartochkalar (${cards.length} ta)</span><span class="p">${cardStart}</span></li>`:''}${keys.length?`<li><span class="c" style="background:${doc.theme.ink}">J</span><span class="n">Javoblar</span><span class="p">${n-1}</span></li>`:''}</ul></div><div class="bk-foot"><i></i>2</div>`;
  return pages;
}

/* ---------- PDF va chop etish ---------- */
async function buildPdf(doc, pages, onProg){
  const S=SIZES[doc.size]||SIZES.A5;
  if(!(window.jspdf&&window.jspdf.jsPDF) || typeof html2canvas!=='function') return null;
  const pdf=new window.jspdf.jsPDF({unit:'mm',format:S.mm,orientation:'portrait',compress:true});
  const off=document.createElement('div'); off.style.cssText='position:fixed;left:-20000px;top:0;z-index:-1';
  document.body.appendChild(off);
  // Pro: ~300 dpi; oddiy: ~200 dpi. Yuqori sifat va tezlik o'rtasidagi muvozanat.
  const hq=!!doc.pro && !!window.__wdIsPro;
  const scale=hq?(S.w>700?2.6:3.1):(S.w>700?1.9:2.2);
  try{
  for(let i=0;i<pages.length;i++){
    onProg&&onProg(i+1,pages.length);
    const c=pages[i].el.cloneNode(true); c.style.transform='none'; c.style.margin='0'; off.innerHTML=''; off.appendChild(c);
    const cv=await html2canvas(c,{scale,backgroundColor:doc.theme.paper,useCORS:true,logging:false,imageTimeout:0,removeContainer:true});
    if(i) pdf.addPage(S.mm,'portrait');
    pdf.addImage(cv.toDataURL('image/jpeg',hq?0.92:0.88),'JPEG',0,0,S.mm[0],S.mm[1],undefined,'FAST');
    cv.width=cv.height=0;
    await new Promise(r=>setTimeout(r,0));   // interfeys qotib qolmasin
  }
  } finally { off.remove(); }
  try{ pdf.setProperties({title:doc.title||'Kitobcha',subject:doc.subtitle||'',author:doc.author||'WordDrop',creator:'WordDrop'+(doc.pro?' Pro':''),keywords:'WordDrop, ingliz tili'}); }catch(e){}
  const name=(doc.title||'kitobcha').replace(/[^\wЀ-ӿ'ʻʼ -]+/g,'').trim().replace(/\s+/g,'-').slice(0,40)||'kitobcha';
  return {pdf,name};
}
async function exportPdf(doc, pages, onProg){
  const o=await buildPdf(doc,pages,onProg);
  if(!o){ printBook(doc,pages); return; }
  o.pdf.save(o.name+'.pdf');
}
/* Telegram'ga yuborish: PDF shaxsiy papkaga (Storage) yuklanadi, bot uni chatga hujjat qilib yuboradi */
async function sendPdfTg(doc, pages, onProg){
  if(!(window.__wdIsSignedIn&&window.__wdIsSignedIn())) throw new Error("Avval hisobingizga kiring");
  const o=await buildPdf(doc,pages,onProg); if(!o) throw new Error("PDF kutubxonasi yuklanmadi");
  const { data } = await window.__sb.auth.getSession(); const uid=data&&data.session&&data.session.user.id; if(!uid) throw new Error("Avval hisobingizga kiring");
  const path=`${uid}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}.pdf`;
  onProg&&onProg(-1);
  const up=await window.__sb.storage.from('booklets').upload(path,o.pdf.output('blob'),{contentType:'application/pdf'});
  if(up.error) throw new Error("Yuklab bo'lmadi: "+up.error.message);
  const r=await window.__wdTgApi('send_pdf',{path,name:o.name,title:doc.title,pro:!!doc.pro},90000);
  if(r.__error||r.ok===false) throw new Error(r.msg||r.error||"Bot yubora olmadi");
}
function printBook(doc,pages){
  const S=SIZES[doc.size]||SIZES.A5;
  const w=window.open('','_blank'); if(!w){ showToast("Brauzer yangi oynani to'sdi",IC.info); return; }
  const fonts=document.querySelector('link[href*="fonts.googleapis"]');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(doc.title)}</title>${fonts?fonts.outerHTML:''}<style>${BK_CSS}@page{size:${S.mm[0]}mm ${S.mm[1]}mm;margin:0}body{margin:0}.bk-page{page-break-after:always;transform:none!important;margin:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${pages.map(p=>p.el.outerHTML).join('')}</body></html>`);
  w.document.close(); setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} },900);
}

/* ==================== STUDIYA EKRANI ==================== */
let ST={doc:null,id:'',undo:[],log:[],pages:[],busy:false};
function openStudio(prefill){
  injectCss();
  let el=document.getElementById('bkView');
  if(!el){ el=document.createElement('div'); el.id='bkView'; el.className='xm bk dp'; document.body.appendChild(el); }
  if(prefill && prefill.doc){ ST={doc:prefill.doc,id:prefill.id,undo:[],log:prefill.log||[],pages:[],busy:false}; renderStudio(); }
  else { ST={doc:null,id:'',undo:[],log:[],pages:[],busy:false}; renderStart(prefill&&prefill.brief); }
  requestAnimationFrame(()=>el.classList.add('on'));
}
window.__wdOpenBooklet=openStudio;
function closeStudio(){ const el=document.getElementById('bkView'); if(!el) return; el.classList.remove('on'); setTimeout(()=>el.remove(),300); }
const IBACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';

function renderStart(brief){
  const el=document.getElementById('bkView');
  const list=bkAll();
  const srsN=(typeof srsAll==='function')?srsAll().length:0;
  el.innerHTML=`
    <div class="xm-head"><button class="xm-ib" id="bkBack" aria-label="Orqaga">${IBACK}</button><div class="xm-ht"><b>Kitobcha</b></div></div>
    <div class="xm-scroll">
      <p class="bk-lead">Nima haqida, qanday rangda va qanday tuzilishda bo'lishini yozing. Drop mazmunni tuzadi, kartochkalar, mashqlar va javoblar kalitini qo'shadi. Keyin uni so'z bilan tahrirlaysiz va PDF qilib olasiz.</p>
      <label class="bk-lbl" for="bkBrief">So'rov</label>
      <textarea id="bkBrief" class="bk-ta" rows="5" maxlength="1500" placeholder="Masalan: Present Perfect bo'yicha 4 bo'limli kitobcha. Qizil va sariq ranglar. Har bo'limda qoida, 5 ta misol, mashq va 8 ta kartochka bo'lsin.">${esc(brief||'')}</textarea>
      <div class="bk-ideas">${["IELTS Speaking uchun 40 ta foydali ibora, kartochkalar bilan","Mening zaif so'zlarim bo'yicha 7 kunlik takror daftari","Irregular verbs: jadval, mashq va 30 ta kartochka","Kafe va restoranda gaplashish: dialoglar va so'zlar"].map(t=>`<button>${esc(t)}</button>`).join('')}</div>
      <div class="bk-opts">
        <div><span class="bk-lbl">O'lcham</span><div class="xc-chips" id="bkSize">${['A5','B5','A4'].map((s,i)=>`<button data-v="${s}" class="${i===0?'on':''}">${s}</button>`).join('')}</div></div>
        <div><span class="bk-lbl">Ranglar</span><div class="bk-pal" id="bkPal"><button data-i="-1" class="on" title="Drop tanlasin"><i style="background:conic-gradient(#2F6FED 0 25%,#F0461E 0 50%,#0E8F60 0 75%,#6D3FE0 0)"></i>Drop tanlasin</button>${PALETTES.map((p,i)=>`<button data-i="${i}" title="${p.n}"><i style="background:linear-gradient(135deg,${p.primary} 50%,${p.accent} 50%)"></i>${p.n}</button>`).join('')}</div></div>
        ${srsN?`<label class="bk-chk"><input type="checkbox" id="bkMine"> Lug'atimdagi so'zlardan foydalanish <span>(${srsN} ta)</span></label>`:''}
      </div>
      ${window.__wdIsPro?`<div class="bk-pro on" id="bkProBox"><div class="bk-pro-h"><b>Pro sifat</b><button class="xc-tg on" id="bkPro" aria-label="Pro sifat"><i></i></button></div>
          <ul><li>Chuqurroq fikrlovchi AI va muharrir tekshiruvi (imlo, grammatika, javoblar)</li><li>Pro muqovalar, har bo'lim uchun ochilish sahifasi, "Esda tuting" va "Ko'p uchraydigan xatolar"</li><li>8 tagacha bo'lim va ~350 dpi bosmaxona sifatidagi PDF</li></ul></div>
        ${srsN?`<button class="bk-week" id="bkWeek"><b>Mening haftalik kitobcham</b><span>Drop zaif so'zlaringiz va xatolaringizdan shaxsiy takror kitobchasi tuzadi</span></button>`:''}`
      :`<button class="bk-pro lock" data-open-pro><div class="bk-pro-h"><b>Pro kitobcha</b><em>Pro</em></div><span>Muharrir tekshiruvi, Pro muqovalar, bo'lim sahifalari va bosmaxona sifatidagi PDF</span></button>`}
      <button class="rv-go" id="bkGo"><span>Kitobcha yaratish</span><em>1 so'rov</em></button>
      ${list.length?`<h3 class="qx-h">Mening kitobchalarim</h3><div class="qx-box">${list.map(b=>`<div class="bk-item"><button data-open="${b.id}"><b>${esc(b.doc.title)}</b><span>${b.doc.sections.length} bo'lim, ${b.doc.size}. ${new Date(b.updated).toLocaleDateString()}</span></button><button class="del" data-del="${b.id}" aria-label="O'chirish">×</button></div>`).join('')}</div>`:''}
    </div>`;
  el.querySelector('#bkBack').onclick=closeStudio;
  const ta=el.querySelector('#bkBrief');
  el.querySelectorAll('.bk-ideas button').forEach(b=>b.onclick=()=>{ ta.value=b.textContent; ta.focus(); });
  let size='A5', pal=-1;
  el.querySelectorAll('#bkSize button').forEach(b=>b.onclick=()=>{ size=b.dataset.v; el.querySelectorAll('#bkSize button').forEach(x=>x.classList.toggle('on',x===b)); });
  el.querySelectorAll('#bkPal button').forEach(b=>b.onclick=()=>{ pal=Number(b.dataset.i); el.querySelectorAll('#bkPal button').forEach(x=>x.classList.toggle('on',x===b)); });
  el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{ const it=bkAll().find(x=>x.id===b.dataset.open); if(it){ ST={doc:it.doc,id:it.id,undo:[],log:it.log||[],pages:[],busy:false}; renderStudio(); } });
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ bkSaveAll(bkAll().filter(x=>x.id!==b.dataset.del)); renderStart(ta.value); });
  let useProQ=!!window.__wdIsPro;
  const pt=el.querySelector('#bkPro'); if(pt) pt.onclick=()=>{ useProQ=!useProQ; pt.classList.toggle('on',useProQ); el.querySelector('#bkProBox').classList.toggle('on',useProQ); };
  const wk=el.querySelector('#bkWeek'); if(wk) wk.onclick=()=>{
    const all=(typeof srsAll==='function')?srsAll():[];
    const weak=all.filter(w=>(typeof srsIsLeech==='function'&&srsIsLeech(w))||(w.lapses||0)>=1||(w.bad||0)>=2).slice(0,30);
    const pick=(weak.length>=8?weak:all.slice().sort((a,b)=>(srsRetNow(a)||0)-(srsRetNow(b)||0)).slice(0,30));
    ta.value=`Mening shaxsiy haftalik takror kitobcham: 7 kunlik reja. Har kuni 4-5 ta so'z (quyidagi zaif so'zlarimdan), har biriga eslab qolish usuli, misol, kichik mashq va kartochkalar. Oxirida "Ko'p uchraydigan xatolar" va umumiy test. So'zlarim: ${pick.map(w=>w.t+' = '+w.tr).join('; ')}`;
    const mine=el.querySelector('#bkMine'); if(mine) mine.checked=false;
    ta.scrollIntoView({block:'center',behavior:'smooth'}); showToast("So'rov tayyor — «Kitobcha yaratish»ni bosing",IC.info);
  };
  el.querySelector('#bkGo').onclick=async()=>{
    let brief=ta.value.trim();
    if(brief.length<8){ showToast("Kitobcha nima haqida ekanini batafsilroq yozing",IC.info); ta.focus(); return; }
    if(!dpQuotaOk()) return;
    const extra=[]; extra.push(`O'lcham: ${size}.`);
    if(pal>=0){ const p=PALETTES[pal]; extra.push(`Ranglar: primary ${p.primary}, accent ${p.accent}, paper ${p.paper}, ink ${p.ink}.`); }
    let words=[];
    const mine=el.querySelector('#bkMine');
    if(mine&&mine.checked&&typeof srsAll==='function'){
      words=srsAll().slice().sort((a,b)=>(srsRetNow(a)||0)-(srsRetNow(b)||0)).slice(0,40).map(w=>({t:w.t,tr:w.tr}));
    }
    const pq=useProQ&&!!window.__wdIsPro;
    busyScreen(pq?"Drop Pro kitobcha tuzmoqda":"Drop kitobchani tuzmoqda", pq?"Avval mazmun tuziladi, keyin muharrir imlo, grammatika va javoblarni tekshiradi. Odatda 1–2 daqiqa.":"Bo'limlar, mashqlar va kartochkalar tayyorlanmoqda. Odatda 20–40 soniya.");
    const r=await dpRequest({mode:'booklet',brief:brief+'\n'+extra.join(' '),words,pro:pq},pq?200000:120000);
    if(r.__error||!r.doc){ renderStart(brief); showToast(r.msg||"Kitobcha tuzilmadi",IC.info); return; }
    if(pal>=0) Object.assign(r.doc.theme,{primary:PALETTES[pal].primary,accent:PALETTES[pal].accent,paper:PALETTES[pal].paper,ink:PALETTES[pal].ink});
    r.doc.size=size;
    await dpBump();
    ST={doc:r.doc,id:'bk'+Date.now().toString(36),undo:[],log:[{who:'me',t:brief},{who:'drop',t:(r.note_uz||"Kitobcha tayyor.")+(r.reviewed?" Muharrir tekshiruvidan o'tdi.":"")}],pages:[],busy:false};
    persist(); renderStudio();
  };
}
function busyScreen(t,s){
  const el=document.getElementById('bkView'); if(!el) return;
  const sc=el.querySelector('.xm-scroll'); if(!sc) return;
  sc.innerHTML=`<div class="bk-busy"><div class="bk-busy-d">${typeof srsDropSvg==='function'?srsDropSvg(.5,72,{cls:'lg bk-wave'}):''}</div><b>${esc(t)}</b><p>${esc(s)}</p></div>`;
}
function persist(){ if(ST.doc) bkUpsert({id:ST.id,doc:ST.doc,log:ST.log.slice(-20),updated:Date.now()}); }

async function renderStudio(){
  const el=document.getElementById('bkView'); if(!el||!ST.doc) return;
  const d=ST.doc;
  el.innerHTML=`
    <div class="xm-head"><button class="xm-ib" id="bkBack" aria-label="Orqaga">${IBACK}</button>
      <div class="xm-ht"><b>${esc(d.title)}</b></div>
      <button class="xm-ib" id="bkUndo" aria-label="Bekor qilish" ${ST.undo.length?'':'disabled'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg></button></div>
    <div class="bk-tools">
      <div class="bk-pal sm" id="bkPal2">${PALETTES.map((p,i)=>`<button data-i="${i}" title="${p.n}" class="${p.primary===d.theme.primary?'on':''}"><i style="background:linear-gradient(135deg,${p.primary} 50%,${p.accent} 50%)"></i></button>`).join('')}</div>
      <div class="xc-chips sm" id="bkSize2">${['A5','B5','A4'].map(s=>`<button data-v="${s}" class="${d.size===s?'on':''}">${s}</button>`).join('')}</div>
      <div class="xc-chips sm bk-cov2" id="bkCov2">${[['big-title','Klassik'],['band','Lenta'],['minimal','Sodda'],['poster','Poster',1],['split','Tomchi',1],['editorial','Jurnal',1]].map(([k,n,pro])=>`<button data-v="${k}" class="${d.cover.style===k?'on':''} ${pro&&!window.__wdIsPro?'lk':''}">${n}${pro?'<sup>Pro</sup>':''}</button>`).join('')}</div>
      <div class="xc-chips sm" id="bkFont2">${[['grotesk','Aa'],['serif','Ss'],['rounded','Rr']].map(([k,n])=>`<button data-v="${k}" class="${d.theme.font===k?'on':''}" title="${k}" style="font-family:${k==='serif'?"'Instrument Serif',serif":k==='grotesk'?"'Bricolage Grotesque'":'Inter'}">${n}</button>`).join('')}</div>
    </div>
    <div class="bk-prev" id="bkPrev"><div class="bk-stage" id="bkStage"></div></div>
    <div class="bk-dock">
      <div class="bk-log" id="bkLog">${ST.log.slice(-2).map(m=>`<p class="${m.who}">${m.who==='drop'?'<b>Drop:</b> ':''}${esc(m.t)}</p>`).join('')}</div>
      <div class="bk-ask"><input id="bkAsk" maxlength="800" placeholder="Drop'ga ayting: 2-bo'limga 10 ta kartochka qo'sh" autocomplete="off"><button id="bkAskGo" aria-label="Yuborish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></div>
      <div class="xs-row2 bk-out">${window.__wdInTelegram?`<button class="xs-ghost" id="bkPdf">Yuklab olish</button><button class="xs-main" id="bkTg">Telegram'ga yuborish</button>`:`<button class="xs-ghost" id="bkTg">Telegram'ga yuborish</button><button class="xs-main" id="bkPdf">PDF yuklab olish</button>`}</div>
      <button class="rv-link bk-printl" id="bkPrint">Chop etish</button>
    </div>`;
  el.querySelector('#bkBack').onclick=()=>{ renderStart(); };
  el.querySelector('#bkUndo').onclick=()=>{ if(!ST.undo.length) return; ST.doc=ST.undo.pop(); ST.log.push({who:'drop',t:"Oldingi holatga qaytarildi."}); persist(); renderStudio(); };
  const local=(fn,label)=>{ ST.undo.push(JSON.parse(JSON.stringify(ST.doc))); fn(ST.doc); persist(); renderStudio(); };
  el.querySelectorAll('#bkPal2 button').forEach(b=>b.onclick=()=>local(dd=>{ const p=PALETTES[+b.dataset.i]; Object.assign(dd.theme,{primary:p.primary,accent:p.accent,paper:p.paper,ink:p.ink}); dd.sections.forEach(s=>s.color=''); }));
  el.querySelectorAll('#bkSize2 button').forEach(b=>b.onclick=()=>local(dd=>{ dd.size=b.dataset.v; }));
  el.querySelectorAll('#bkFont2 button').forEach(b=>b.onclick=()=>local(dd=>{ dd.theme.font=b.dataset.v; }));
  el.querySelectorAll('#bkCov2 button').forEach(b=>b.onclick=()=>{ if(b.classList.contains('lk')){ if(window.__wdOpenPro) window.__wdOpenPro(); return; } local(dd=>{ dd.cover.style=b.dataset.v; if(['poster','split','editorial'].includes(b.dataset.v)) dd.pro=true; }); });
  const ask=el.querySelector('#bkAsk');
  const go=async()=>{
    const t=ask.value.trim(); if(!t||ST.busy) return;
    if(!dpQuotaOk()) return;
    ST.busy=true; ask.value=''; ask.disabled=true;
    ST.log.push({who:'me',t}); const lg=el.querySelector('#bkLog'); lg.innerHTML=`<p class="me">${esc(t)}</p><p class="drop wait"><b>Drop:</b> tahrirlayapman…</p>`;
    const pq=!!(ST.doc.pro&&window.__wdIsPro);
    const r=await dpRequest({mode:'booklet_edit',doc:ST.doc,instruction:t,pro:pq},pq?200000:120000);
    ST.busy=false;
    if(r.__error||!r.doc){ ST.log.push({who:'drop',t:r.msg||"Bu tahrirni bajara olmadim."}); renderStudio(); return; }
    await dpBump();
    ST.undo.push(ST.doc); ST.doc=r.doc; ST.log.push({who:'drop',t:r.note_uz||"Tayyor."}); persist(); renderStudio();
  };
  el.querySelector('#bkAskGo').onclick=go;
  ask.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } });
  el.querySelector('#bkPdf').onclick=async e=>{
    const b=e.currentTarget; if(b.disabled) return; b.disabled=true; const o=b.textContent;
    try{ await exportPdf(ST.doc,ST.pages,(i,n)=>{ b.textContent=`Tayyorlanmoqda ${i}/${n}`; }); showToast("PDF saqlandi",IC.check||IC.info); }
    catch(err){ showToast("PDF yaratilmadi, Chop etish orqali saqlang",IC.info); }
    b.disabled=false; b.textContent=o;
  };
  el.querySelector('#bkPrint').onclick=()=>printBook(ST.doc,ST.pages);
  el.querySelector('#bkTg').onclick=async e=>{
    const b=e.currentTarget; if(b.disabled) return; b.disabled=true; const o=b.textContent;
    try{ await sendPdfTg(ST.doc,ST.pages,(i,n)=>{ b.textContent= i<0?'Botga yuborilmoqda…':`Tayyorlanmoqda ${i}/${n}`; }); showToast("Kitobcha Telegram chatingizga yuborildi",IC.check||IC.info); }
    catch(err){ showToast(err&&err.message||"Yuborilmadi",IC.info); }
    b.disabled=false; b.textContent=o;
  };
  // Sahifalar
  const stage=el.querySelector('#bkStage'), prev=el.querySelector('#bkPrev');
  stage.classList.add('measuring');
  ST.pages=await paginate(ST.doc, stage);
  const S=SIZES[ST.doc.size]||SIZES.A5;
  const fit=()=>{ const w=Math.min(prev.clientWidth-32, 520); const k=Math.min(1,w/S.w);
    stage.style.setProperty('--k',k); stage.querySelectorAll('.bk-page').forEach(p=>{ p.style.transform=`scale(${k})`; p.style.marginBottom=`${-(S.h*(1-k))+16}px`; p.style.marginRight=`${-(S.w*(1-k))}px`; }); };
  stage.classList.remove('measuring'); fit();
  const pc=document.createElement('p'); pc.className='bk-count'; pc.textContent=`${ST.pages.length} sahifa`; prev.appendChild(pc);
}
})();

/* ==================================================================
   SUHBAT SHERIGI + RASMDAN SO'Z (v94)
   ------------------------------------------------------------------
   Suhbat: Drop rolga kiradi (barista, HR, IELTS examiner...). Siz
   mikrofon bilan javob berasiz (brauzer nutqni matnga o'giradi),
   Drop ovoz bilan javob qaytaradi, xatoni darhol tuzatadi, oxirida
   band, xatolar va foydali iboralarni beradi. Bir sessiya — 1 so'rov.
   Rasm: kamera yoki galereya → Drop rasmdagi narsalar va yozuvlardan
   o'rganishga arziydigan so'zlarni topadi → bir bosishda lug'atga.
   ================================================================== */
(function(){
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IBACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const IMIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>';
const IKB='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>';
const ISPK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
const ISEND='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const DP=()=>window.__wdDP;

function view(id){
  let el=document.getElementById(id);
  if(!el){ el=document.createElement('div'); el.id=id; el.className='xm dp'; document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on')); }
  return el;
}
function closeView(id,cb){ const el=document.getElementById(id); if(!el) return; el.classList.remove('on'); setTimeout(()=>{ el.remove(); cb&&cb(); },300); }
function say(text){
  try{ if(typeof window.__wdServerSpeak==='function'){ window.__wdServerSpeak(text).then(ok=>{ if(!ok) speakNative(text); }); return; } }catch(e){}
  try{ speakNative(text); }catch(e){}
}

/* ==================== SUHBAT SHERIGI ==================== */
const SCEN=[
  {id:'cafe',   t:"Kafeda buyurtma",       d:"Barista bilan gaplashib, ichimlik va shirinlik buyurtma qiling", role:"a friendly barista at a busy coffee shop in London", goal:"order a drink and a snack, ask about prices and pay", opener:"Hi there! What can I get for you today?"},
  {id:'airport',t:"Aeroportda",            d:"Ro'yxatdan o'tish: pasport, yuk, o'rindiq", role:"a check-in agent at an international airport", goal:"check in for a flight, ask about baggage and choose a seat", opener:"Good morning! Where are you flying to today?"},
  {id:'job',    t:"Ish suhbati",           d:"HR menejeri sizdan tajriba va maqsadlar haqida so'raydi", role:"an HR manager interviewing a candidate for a junior position", goal:"introduce yourself, talk about experience, strengths and plans", opener:"Thanks for coming in. Could you tell me a little about yourself?"},
  {id:'ielts',  t:"IELTS Speaking 1-qism", d:"Examiner uy, ish, sevimli mashg'ulotlar haqida so'raydi", role:"an IELTS speaking examiner conducting Part 1", goal:"answer everyday questions with extended, natural answers", opener:"Good afternoon. Can you tell me your full name, please?"},
  {id:'doctor', t:"Shifokor qabulida",     d:"Belgilaringizni tushuntiring, maslahat so'rang", role:"a calm family doctor", goal:"describe symptoms, answer questions and understand advice", opener:"Hello, please have a seat. What seems to be the problem?"},
  {id:'shop',   t:"Do'konda qaytarish",    d:"Mos kelmagan kiyimni almashtiring yoki pulini qaytaring", role:"a shop assistant in a clothing store", goal:"explain the problem, ask for an exchange or refund politely", opener:"Hi! How can I help you today?"},
  {id:'friend', t:"Yangi tanish",          d:"Xorijlik talaba bilan tanishib, suhbatni davom ettiring", role:"an international student you just met at a university event", goal:"make small talk, ask questions and find common interests", opener:"Hey! I don't think we've met. I'm Alex. Are you new here?"},
  {id:'hotel',  t:"Mehmonxonada",          d:"Xona band qilish va muammoni hal qilish", role:"a hotel receptionist", goal:"check in, ask about breakfast and Wi-Fi, report a problem with the room", opener:"Welcome to the Grand Hotel. Do you have a reservation?"}
];
const SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
let RP=null;
function openTalk(){
  RP=null;
  const el=view('rpView');
  el.innerHTML=`
    <div class="xm-head"><button class="xm-ib" id="rpBack" aria-label="Orqaga">${IBACK}</button><div class="xm-ht"><b>Suhbat mashqi</b></div></div>
    <div class="xm-scroll">
      <p class="bk-lead">Vaziyatni tanlang. Drop rolga kiradi va siz bilan inglizcha gaplashadi. Mikrofon bilan javob bering yoki yozing. Xatolaringizni yo'l-yo'lakay tuzatadi, oxirida natijani ko'rsatadi.</p>
      <div class="rp-list">${SCEN.map(s=>`<button class="rp-sc" data-id="${s.id}"><b>${esc(s.t)}</b><span>${esc(s.d)}</span></button>`).join('')}</div>
      <h3 class="qx-h">O'z vaziyatingiz</h3>
      <div class="bk-ask"><input id="rpOwn" maxlength="160" placeholder="Masalan: taksi haydovchisi bilan narx kelishish" autocomplete="off"><button id="rpOwnGo" aria-label="Boshlash">${ISEND}</button></div>
      <p class="rv-note">Bitta suhbat kunlik Drop AI so'rovlaridan 1 tasini oladi.${SR?'':' Brauzeringiz ovozni matnga o\'girmaydi, shuning uchun javoblarni yozasiz.'}</p>
    </div>`;
  el.querySelector('#rpBack').onclick=()=>closeView('rpView');
  el.querySelectorAll('.rp-sc').forEach(b=>b.onclick=()=>startTalk(SCEN.find(s=>s.id===b.dataset.id)));
  const own=el.querySelector('#rpOwn');
  const goOwn=()=>{ const t=own.value.trim(); if(t.length<4) return; startTalk({id:'own',t:t,d:'',role:`a person in this situation: ${t}`,goal:`handle this situation in English: ${t}`,opener:''}); };
  el.querySelector('#rpOwnGo').onclick=goOwn; own.addEventListener('keydown',e=>{ if(e.key==='Enter') goOwn(); });
}
window.__wdOpenTalk=openTalk;

async function startTalk(sc){
  if(!DP().quotaOk()) return;
  RP={sc,hist:[],turn:0,busy:false,charged:false,rec:null,listening:false,typed:!SR,done:false};
  const el=view('rpView');
  el.innerHTML=`
    <div class="xm-head"><button class="xm-ib" id="rpBack" aria-label="Orqaga">${IBACK}</button>
      <div class="xm-ht"><b>${esc(sc.t)}</b></div><button class="rp-end" id="rpEnd">Yakunlash</button></div>
    <div class="rp-chat" id="rpChat"></div>
    <div class="rp-dock">
      <p class="rp-hint" id="rpHint"></p>
      <div class="rp-live" id="rpLive" hidden></div>
      <div class="rp-ctl" id="rpCtl"></div>
    </div>`;
  el.querySelector('#rpBack').onclick=()=>{ stopRec(); closeView('rpView'); };
  el.querySelector('#rpEnd').onclick=()=>finishTalk();
  renderCtl();
  await partnerTurn('');
}
function chatEl(){ return document.getElementById('rpChat'); }
function addBubble(role,text,opts){
  const c=chatEl(); if(!c) return;
  const b=document.createElement('div'); b.className='rp-b '+role;
  b.innerHTML=`<p>${esc(text)}</p>${role==='ai'?`<button class="rp-spk" aria-label="Qayta tinglash">${ISPK}</button>`:''}`;
  if(role==='ai') b.querySelector('.rp-spk').onclick=()=>say(text);
  c.appendChild(b);
  if(opts&&opts.fix){ const f=document.createElement('div'); f.className='rp-fix';
    f.innerHTML=`<s>${esc(opts.fix.wrong)}</s><b>${esc(opts.fix.right)}</b>${opts.fix.uz?`<span>${esc(opts.fix.uz)}</span>`:''}`; c.insertBefore(f,b); }
  c.scrollTop=c.scrollHeight;
}
function typing(on){
  const c=chatEl(); if(!c) return; let t=c.querySelector('.rp-typing');
  if(on&&!t){ t=document.createElement('div'); t.className='rp-b ai rp-typing'; t.innerHTML='<p><i></i><i></i><i></i></p>'; c.appendChild(t); c.scrollTop=c.scrollHeight; }
  if(!on&&t) t.remove();
}
async function partnerTurn(msg){
  if(!RP) return;
  RP.busy=true; renderCtl(); typing(true);
  const r=await DP().request({mode:'roleplay',scenario:{title:RP.sc.t,role:RP.sc.role,goal:RP.sc.goal,opener:RP.sc.opener},history:RP.hist,message:msg,turn:RP.turn},45000);
  typing(false); if(!RP) return; RP.busy=false;
  if(r.__error){ const c=chatEl(); const e=document.createElement('div'); e.className='rp-err'; e.innerHTML=`${esc(r.msg)} <button>Qayta urinish</button>`;
    e.querySelector('button').onclick=()=>{ e.remove(); partnerTurn(msg); }; c&&c.appendChild(e); renderCtl(); return; }
  if(!RP.charged){ RP.charged=true; await DP().bump(); }
  if(msg){ RP.hist.push({role:'user',content:msg}); RP.turn++; }
  // xato tuzatishni foydalanuvchi pufagi ostiga qo'yamiz
  if(r.fix && msg){ const c=chatEl(); const last=c&&[...c.querySelectorAll('.rp-b.me')].pop();
    if(last){ const f=document.createElement('div'); f.className='rp-fix'; f.innerHTML=`<s>${esc(r.fix.wrong)}</s><b>${esc(r.fix.right)}</b>${r.fix.uz?`<span>${esc(r.fix.uz)}</span>`:''}`; last.after(f); }
    RP.fixes=(RP.fixes||[]).concat([r.fix]); }
  RP.hist.push({role:'assistant',content:r.reply});
  addBubble('ai',r.reply);
  say(r.reply);
  const h=document.getElementById('rpHint'); if(h) h.textContent=r.hint_uz?`Masalan: ${r.hint_uz}`:'';
  if(r.done||RP.turn>=10){ RP.done=true; }
  renderCtl();
}
function renderCtl(){
  const box=document.getElementById('rpCtl'); if(!box||!RP) return;
  if(RP.done){ box.innerHTML=`<button class="xs-main" id="rpFin">Natijani ko'rish</button>`; box.querySelector('#rpFin').onclick=()=>finishTalk(); return; }
  if(RP.typed){
    box.innerHTML=`<div class="bk-ask"><input id="rpIn" maxlength="500" placeholder="Inglizcha javob yozing" autocomplete="off" ${RP.busy?'disabled':''}><button id="rpSend" aria-label="Yuborish" ${RP.busy?'disabled':''}>${ISEND}</button></div>${SR?`<button class="rp-kb st" id="rpSw" aria-label="Ovoz bilan javob berish" title="Ovoz bilan">${IMIC}</button>`:''}`;
    const i=box.querySelector('#rpIn'), go=()=>{ const t=i.value.trim(); if(!t||RP.busy) return; i.value=''; userSays(t); };
    box.querySelector('#rpSend').onclick=go; i.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
    const sw=box.querySelector('#rpSw'); if(sw) sw.onclick=()=>{ RP.typed=false; renderCtl(); };
    if(!RP.busy) setTimeout(()=>{ try{ i.focus(); }catch(e){} },50);
  } else {
    box.innerHTML=`<button class="rp-kb" id="rpSw" aria-label="Yozish">${IKB}</button>
      <button class="rp-mic ${RP.listening?'on':''}" id="rpMic" ${RP.busy?'disabled':''} aria-label="${RP.listening?'Tugatish':'Gapirish'}">${IMIC}</button>
      <span class="rp-mic-l">${RP.busy?'Drop javob yozmoqda':RP.listening?'Gapiring, tugatgach bosing':'Bosing va gapiring'}</span>`;
    box.querySelector('#rpSw').onclick=()=>{ stopRec(); RP.typed=true; renderCtl(); };
    box.querySelector('#rpMic').onclick=()=>{ if(RP.listening) stopRec(true); else startRec(); };
  }
}
function startRec(){
  if(!SR||RP.busy) return;
  try{ speechSynthesis.cancel(); }catch(e){}
  const r=new SR(); r.lang='en-US'; r.interimResults=true; r.continuous=true; r.maxAlternatives=1;
  let finalT='';
  const live=document.getElementById('rpLive'); if(live){ live.hidden=false; live.textContent='…'; }
  r.onresult=ev=>{ // v101b: Android har natijada oldingi gapni ham qaytaradi — qo'shmaymiz, birlashtiramiz
    let t=window.__wdSRText?window.__wdSRText(ev.results):''; if(window.__wdDedupeSpeech) t=window.__wdDedupeSpeech(t);
    if(live) live.textContent=t||'…'; RP._said=t; };
  r.onerror=e=>{ if(e.error==='not-allowed'){ showToast("Mikrofonga ruxsat bering yoki yozib javob bering",IC.info); RP.typed=true; } stopRec(); };
  r.onend=()=>{ if(RP&&RP.listening&&RP._autoSend!==false){ stopRec(true); } };
  RP.rec=r; RP.listening=true; RP._said=''; RP._autoSend=true;
  try{ r.start(); }catch(e){}
  renderCtl();
}
function stopRec(send){
  if(!RP) return;
  const said=(RP._said||'').trim();
  RP._autoSend=false; RP.listening=false;
  try{ RP.rec&&RP.rec.stop(); }catch(e){}
  RP.rec=null;
  const live=document.getElementById('rpLive'); if(live) live.hidden=true;
  renderCtl();
  if(send){ if(said) userSays(said); else showToast("Ovoz eshitilmadi. Qaytadan urining.",IC.info); }
}
function userSays(t){ addBubble('me',t); partnerTurn(t); }
async function finishTalk(){
  if(!RP) return; stopRec();
  const userN=RP.hist.filter(h=>h.role==='user').length;
  if(userN<2){ closeView('rpView'); return; }
  const el=view('rpView');
  el.querySelector('.rp-chat').innerHTML=`<div class="bk-busy"><b>Natija tayyorlanmoqda</b><p>Drop suhbatingizni tahlil qilyapti.</p></div>`;
  el.querySelector('.rp-dock').innerHTML='';
  const r=await DP().request({mode:'roleplay_eval',scenario:{title:RP.sc.t},transcript:RP.hist},60000);
  if(r.__error){ el.querySelector('.rp-chat').innerHTML=`<div class="bk-busy"><b>Natijani olib bo'lmadi</b><p>${esc(r.msg)}</p></div>`; return; }
  try{ dailyProgress('speak',userN); }catch(e){}
  try{ addXP(10+userN*2); }catch(e){}
  const S=r.scores||{};
  const row=(k,n)=>`<div><dt>${n}</dt><dd>${S[k]!=null?Number(S[k]).toFixed(1):'—'}</dd></div>`;
  el.querySelector('.rp-chat').innerHTML=`<div class="rp-res">
    <div class="xf-head"><div><div class="xf-pct">${r.band!=null?Number(r.band).toFixed(1):'—'}</div><p>taxminiy band, ${userN} ta javob</p></div></div>
    ${r.summary_uz?`<p class="rp-sum">${esc(r.summary_uz)}</p>`:''}
    <dl class="xf-dl">${row('fluency','Ravonlik')}${row('vocabulary',"So'z boyligi")}${row('grammar','Grammatika')}${row('task','Vazifani bajarish')}</dl>
    ${r.strengths_uz&&r.strengths_uz.length?`<h3 class="qx-h">Yaxshi tomonlar</h3><ul class="rp-ul">${r.strengths_uz.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
    ${r.mistakes&&r.mistakes.length?`<h3 class="qx-h">Tuzatishlar</h3>${r.mistakes.map(m=>`<div class="rp-fix"><s>${esc(m.wrong)}</s><b>${esc(m.right)}</b>${m.uz?`<span>${esc(m.uz)}</span>`:''}</div>`).join('')}`:''}
    ${r.phrases&&r.phrases.length?`<h3 class="qx-h">Foydali iboralar</h3><div class="qx-box">${r.phrases.map(p=>`<div class="rp-ph"><b>${esc(p.en)}</b><span>${esc(p.uz)}</span></div>`).join('')}</div>
      <button class="rv-link" id="rpAdd">Iboralarni lug'atga qo'shish</button>`:''}
    ${r.next_uz?`<p class="rv-note">${esc(r.next_uz)}</p>`:''}
  </div>`;
  el.querySelector('.rp-dock').innerHTML=`<div class="xs-row2"><button class="xs-ghost" id="rpAgain">Yana bir marta</button><button class="xs-main" id="rpClose">Tugatish</button></div>`;
  const sc=RP.sc;
  el.querySelector('#rpAgain').onclick=()=>startTalk(sc);
  el.querySelector('#rpClose').onclick=()=>{ RP=null; closeView('rpView'); };
  const add=el.querySelector('#rpAdd');
  if(add) add.onclick=()=>{ let k=0; (r.phrases||[]).forEach(p=>{ if(srsAdd(p.en,p.uz,{src:'talk'})) k++; }); saveState(); add.textContent=k?`${k} ta ibora qo'shildi`:"Allaqachon lug'atda"; add.disabled=true; };
}

/* ==================== RASMDAN SO'Z ==================== */
function openVision(){
  const el=view('vwView');
  el.innerHTML=`
    <div class="xm-head"><button class="xm-ib" id="vwBack" aria-label="Orqaga">${IBACK}</button><div class="xm-ht"><b>Rasmdan so'z</b></div></div>
    <div class="xm-scroll" id="vwBody">
      <p class="bk-lead">Atrofingizdagi narsani, kitob sahifasini yoki menyuni suratga oling. Drop undagi o'rganishga arziydigan inglizcha so'zlarni topadi, siz tanlaganlarini lug'atga qo'shadi.</p>
      <div class="vw-pick">
        <label class="rv-go"><input type="file" accept="image/*" capture="environment" id="vwCam" hidden><span>Suratga olish</span></label>
        <label class="rv-go ghost"><input type="file" accept="image/*" id="vwGal" hidden><span>Galereyadan tanlash</span></label>
      </div>
      <p class="rv-note">Bitta rasm kunlik Drop AI so'rovlaridan 1 tasini oladi. Rasm saqlanmaydi.</p>
    </div>`;
  el.querySelector('#vwBack').onclick=()=>closeView('vwView');
  ['vwCam','vwGal'].forEach(id=>el.querySelector('#'+id).onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(f) analyze(f); });
}
window.__wdOpenVision=openVision;
function shrink(file){
  return new Promise((res,rej)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ const M=1280, k=Math.min(1,M/Math.max(img.width,img.height));
      const c=document.createElement('canvas'); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg',0.82)); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(); };
    img.src=url;
  });
}
async function analyze(file){
  if(!DP().quotaOk()) return;
  const body=document.getElementById('vwBody'); if(!body) return;
  let data; try{ data=await shrink(file); }catch(e){ showToast("Bu rasmni ochib bo'lmadi",IC.info); return; }
  body.innerHTML=`<img class="vw-img" src="${data}" alt="Tanlangan rasm"><div class="bk-busy"><b>Drop rasmni ko'rib chiqyapti</b><p>Odatda 5–15 soniya.</p></div>`;
  const known=(typeof srsAll==='function'?srsAll():[]).map(w=>w.t).slice(0,300);
  const r=await DP().request({mode:'vision_words',image:data,known},60000);
  if(r.__error){ body.innerHTML=`<img class="vw-img" src="${data}" alt=""><div class="bk-busy"><b>So'zlarni topib bo'lmadi</b><p>${esc(r.msg)}</p></div><button class="rv-go ghost" id="vwRetry"><span>Boshqa rasm</span></button>`;
    body.querySelector('#vwRetry').onclick=openVision; return; }
  await DP().bump();
  const W=r.words||[];
  body.innerHTML=`<img class="vw-img" src="${data}" alt="">
    ${r.scene_uz?`<p class="vw-scene">${esc(r.scene_uz)}</p>`:''}
    ${W.length?`<div class="qx-box vw-list">${W.map((w,i)=>`<label class="vw-w"><input type="checkbox" data-i="${i}" checked><span class="vw-t"><b>${esc(w.t)}</b>${w.ipa?` <i>${esc(w.ipa)}</i>`:''}<em>${esc(w.tr)}</em>${w.ex?`<small>${esc(w.ex)}</small>`:''}</span><span class="vw-m">${esc(w.lvl||'')}${w.where_uz?`<br>${esc(w.where_uz)}`:''}</span></label>`).join('')}</div>
      <button class="rv-go" id="vwAdd"><span>Tanlanganlarni lug'atga qo'shish</span><em id="vwN">${W.length} ta</em></button>`
    : `<div class="bk-busy"><b>Yangi so'z topilmadi</b><p>Rasmdagi so'zlar lug'atingizda bor yoki rasm juda xira. Boshqa rasm sinab ko'ring.</p></div>`}
    <button class="rv-link" id="vwMore">Yana rasm</button>`;
  body.querySelector('#vwMore').onclick=openVision;
  const upd=()=>{ const n=body.querySelectorAll('.vw-w input:checked').length; const e=body.querySelector('#vwN'); if(e) e.textContent=n+' ta'; };
  body.querySelectorAll('.vw-w input').forEach(c=>c.onchange=upd);
  const add=body.querySelector('#vwAdd');
  if(add) add.onclick=()=>{
    let k=0; body.querySelectorAll('.vw-w input:checked').forEach(c=>{ const w=W[+c.dataset.i]; if(w&&srsAdd(w.t,w.tr,{ipa:w.ipa,ex:w.ex,src:'photo'})) k++; });
    saveState();
    showToast(k?`${k} ta so'z lug'atga qo'shildi`:"Tanlangan so'zlar allaqachon lug'atda",IC.check||IC.info);
    add.disabled=true; add.querySelector('span').textContent=k?"Lug'atga qo'shildi":"Allaqachon bor";
  };
}
})();


/* ==================================================================
   v95: TELEGRAM (ulash + Kanal studiyasi) va ESLAB QOLISH USULI
   ------------------------------------------------------------------
   Server: tg-bot (Supabase Edge). Foydalanuvchi so'rovlari sessiya
   JWT bilan yuboriladi; Kanal studiyasi faqat adminlarga (server
   tekshiradi, ilova esa tugmani faqat admin hisobida ko'rsatadi).
   ================================================================== */
(function(){
const TG_URL = SUPABASE_FUNCTION_URL.replace(/check-sentence$/,'tg-bot');
const ADMIN_EMAILS = ['bexruzyoldoshev@yahoo.com'];
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IBACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const ITG='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.1 1.4 11.6c-1-.3-1-1 .2-1.5L20.6 2.8c.9-.3 1.6.2 1.3 1.5z"/></svg>';
const IMEGA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4h3l7 5V5L6 10z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13"/></svg>';
const isAdmin = () => { try{ const e=(window.__wdAuthEmail&&window.__wdAuthEmail()||'').toLowerCase(); return ADMIN_EMAILS.includes(e); }catch(e){ return false; } };

async function jwt(){ try{ const { data } = await window.__sb.auth.getSession(); return data&&data.session&&data.session.access_token||''; }catch(e){ return ''; } }
async function tgApi(action, extra, timeoutMs){
  const tok=await jwt();
  if(!tok) return {__error:true,msg:"Avval WordDrop hisobingizga kiring (email bilan)"};
  const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),timeoutMs||45000);
  try{
    const r=await fetch(TG_URL,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json','apikey':SUPABASE_PUBLISHABLE_KEY,'Authorization':'Bearer '+tok},body:JSON.stringify(Object.assign({action},extra||{}))});
    clearTimeout(t); const j=await r.json().catch(()=>null);
    if(!r.ok||!j) return {__error:true,msg:(j&&j.error)||"Server javob bermadi"};
    return j;
  }catch(e){ clearTimeout(t); return {__error:true,msg:e&&e.name==='AbortError'?"Javob kechikdi":"Internet aloqasini tekshiring"}; }
}
function view(id,cls){
  let el=document.getElementById(id);
  if(!el){ el=document.createElement('div'); el.id=id; el.className='xm dp '+(cls||''); document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on')); }
  return el;
}
function closeView(id){ const el=document.getElementById(id); if(!el) return; el.classList.remove('on'); setTimeout(()=>el.remove(),300); }
window.__wdTgApi=tgApi; window.__wdTgView=view; window.__wdTgCloseView=closeView;

/* ==================== Profil: Telegram bloki ==================== */
function profileBlock(){
  return `<div class="slbl" style="margin-left:20px">Telegram</div>
  <div class="card settings-block">
    <div class="srow" id="rTg"><div class="icw tg-ic">${ITG}</div><div class="slabel">Telegram bot</div><div class="sval" id="rTgVal">@WordDropUzBot</div><div class="schev">${IC.chevR}</div></div>
    ${isAdmin()?`<div class="srow" id="rChan"><div class="icw tg-ic">${IMEGA}</div><div class="slabel">Kanal studiyasi</div><div class="sval">admin</div><div class="schev">${IC.chevR}</div></div>
    <div class="srow" id="rBot"><div class="icw tg-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 8V4M9 13h.01M15 13h.01M9.5 17h5"/></svg></div><div class="slabel">Bot boshqaruvi</div><div class="sval">guruhlar</div><div class="schev">${IC.chevR}</div></div>
    <div class="srow" id="rStats"><div class="icw tg-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></div><div class="slabel">Statistika</div><div class="sval">admin</div><div class="schev">${IC.chevR}</div></div>`:''}
  </div>`;
}
window.__wdTgProfileBlock=profileBlock;
document.addEventListener('click',e=>{
  if(e.target.closest&&e.target.closest('#rTg')) openLink();
  if(e.target.closest&&e.target.closest('#rChan')) openStudio();
});

/* ==================== Hisobni ulash ==================== */
async function openLink(){
  const signed=(typeof window.__wdIsSignedIn==='function')&&window.__wdIsSignedIn();
  if(!signed){
    const l=openSheet(`<div class="tgl"><div class="tgl-ic">${ITG}</div><h2>Telegram'ni ulash</h2>
      <p>Ulash uchun avval WordDrop'ga email bilan kiring. Shunda bot progressingizni ko'radi va o'z vaqtida eslatadi.</p>
      <button class="rv-go" id="tglIn"><span>Kirish yoki ro'yxatdan o'tish</span></button>
      <a class="rv-link" href="https://t.me/WordDropUzBot" target="_blank" rel="noopener">Botni hisobsiz ochish</a></div>`);
    l.querySelector('#tglIn').onclick=()=>{ closeSheet(); try{ openAuthSheet('signup'); }catch(e){} };
    return;
  }
  const l=openSheet(`<div class="tgl" id="tglBox"><div class="bk-busy" style="padding:30px 0"><b>Tekshirilmoqda</b></div></div>`);
  const r=await tgApi('link_get');
  const box=l.querySelector('#tglBox'); if(!box) return;
  if(r.__error){ box.innerHTML=`<h2>Telegram</h2><p>${esc(r.msg)}</p>`; return; }
  if(!r.linked){
    box.innerHTML=`<div class="tgl-ic">${ITG}</div><h2>Telegram'ni ulash</h2>
      <ul class="tgl-ul"><li>Har kuni ertalab Kun so'zi va eslab qolish usuli</li><li>Kechqurun takror va seriya eslatmasi</li><li>Botda viktorina va Drop AI'ga savol (kunlik 20 ta limitdan)</li></ul>
      <button class="rv-go" id="tglGo"><span>Telegram'da ochish</span></button>
      <p class="rv-note">Botda "Start" tugmasini bosing. Ulangach bu oyna o'zi yangilanadi.</p>`;
    box.querySelector('#tglGo').onclick=async e=>{
      const b=e.currentTarget; b.disabled=true;
      const c=await tgApi('link_code'); b.disabled=false;
      if(c.__error){ showToast(c.msg,IC.info); return; }
      window.open(c.url,'_blank','noopener');
      let n=0; const iv=setInterval(async()=>{ n++; const s=await tgApi('link_get'); if(s.linked||n>40||!document.getElementById('tglBox')){ clearInterval(iv); if(s.linked&&document.getElementById('tglBox')){ closeSheet(); setTimeout(openLink,320); showToast("Telegram ulandi",IC.check||IC.info); } } },3000);
    };
    return;
  }
  const c=r.chat;
  const hours=[18,19,20,21,22];
  box.innerHTML=`<div class="tgl-ic on">${ITG}</div><h2>Telegram ulangan</h2>
    <p class="tgl-who">${c.username?'@'+esc(c.username):esc(c.first_name||'')}${c.quiz_total?` · viktorina: ${c.quiz_ok}/${c.quiz_total}`:''}</p>
    <div class="xc xc-row"><div><b>Ertalabki Kun so'zi</b><span>Har kuni 08:00 da</span></div><button class="xc-tg ${c.morning?'on':''}" id="tgM"><i></i></button></div>
    <div class="xc xc-row"><div><b>Kechki eslatma</b><span>Takror kutayotgan bo'lsa yoki seriya xavfda bo'lsa</span></div><button class="xc-tg ${c.evening?'on':''}" id="tgE"><i></i></button></div>
    <div class="xc"><b>Eslatma vaqti</b><div class="xc-chips" id="tgH">${hours.map(h=>`<button data-v="${h}" class="${c.remind_hour===h?'on':''}">${h}:00</button>`).join('')}</div></div>
    <a class="rv-go" href="https://t.me/WordDropUzBot" target="_blank" rel="noopener"><span>Botni ochish</span></a>
    <button class="rv-link danger" id="tgUn">Ulanishni uzish</button>`;
  const save=p=>tgApi('link_prefs',p);
  box.querySelector('#tgM').onclick=e=>{ c.morning=!c.morning; e.currentTarget.classList.toggle('on',c.morning); save({morning:c.morning}); };
  box.querySelector('#tgE').onclick=e=>{ c.evening=!c.evening; e.currentTarget.classList.toggle('on',c.evening); save({evening:c.evening}); };
  box.querySelectorAll('#tgH button').forEach(b=>b.onclick=()=>{ box.querySelectorAll('#tgH button').forEach(x=>x.classList.toggle('on',x===b)); save({remind_hour:Number(b.dataset.v)}); });
  box.querySelector('#tgUn').onclick=async()=>{ await tgApi('unlink'); closeSheet(); showToast("Telegram uzildi",IC.info); };
}
window.__wdOpenTgLink=openLink;

/* ==================== Kanal post rasmlari (1080×1350) ==================== */
const PW=1080, PH=1350, PM=88;
const PTHEMES={
  ink:{n:'Siyoh',bg:'#0F1B3D',fg:'#FFFFFF',mute:'rgba(255,255,255,.64)',rule:'rgba(255,255,255,.18)',acc:'#7EA4FF'},
  paper:{n:"Qog'oz",bg:'#F3F6FC',fg:'#0F1B3D',mute:'#5B6478',rule:'#D5DCEA',acc:'#2F6FED'},
  electric:{n:'Elektr',bg:'#2F6FED',fg:'#FFFFFF',mute:'rgba(255,255,255,.75)',rule:'rgba(255,255,255,.3)',acc:'#FFFFFF'},
  signal:{n:'Signal',bg:'#E8374A',fg:'#FFFFFF',mute:'rgba(255,255,255,.78)',rule:'rgba(255,255,255,.32)',acc:'#FFFFFF'}
};
const KIND_LBL={word:"Kun so'zi",grammar:'Grammatika',quiz:'Viktorina',promo:'WordDrop',motivation:'Motivatsiya',tip:'Maslahat',custom:'WordDrop'};
const KIND_THEME={word:'ink',grammar:'paper',quiz:'electric',promo:'signal',motivation:'electric',tip:'paper',custom:'ink'};
const FH='"Bricolage Grotesque","Inter",sans-serif', FB='"Inter",sans-serif';
function fitF(c,txt,maxW,size,w,fam,min){ let s=size; do{ c.font=`${w} ${s}px ${fam}`; if(c.measureText(txt).width<=maxW) break; s-=6; }while(s>(min||30)); return s; }
function wrap(c,txt,maxW){ const out=[]; let line=''; String(txt||'').split(/\s+/).forEach(w=>{ const t=(line?line+' ':'')+w; if(c.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; }); if(line) out.push(line); return out; }
function dropAt(c,x,y,s,col){ const k=s/70; c.beginPath(); c.moveTo(x+32*k,y+4*k); c.bezierCurveTo(x+32*k,y+4*k,x+9*k,y+30*k,x+9*k,y+43*k); c.bezierCurveTo(x+9*k,y+56*k,x+19*k,y+66*k,x+32*k,y+66*k); c.bezierCurveTo(x+45*k,y+66*k,x+55*k,y+56*k,x+55*k,y+43*k); c.bezierCurveTo(x+55*k,y+30*k,x+32*k,y+4*k,x+32*k,y+4*k); c.closePath(); c.fillStyle=col; c.fill(); }
/* v100: post rasmlarida illyustratsiya yo'q — toza tipografiya. Eski kesh tozalanadi. */
try{ Object.keys(localStorage).forEach(k=>{ if(k.indexOf('wd_ic_')===0) localStorage.removeItem(k); }); }catch(e){}
async function postIcon(){ return null; }
window.__wdPostIcon=postIcon;
async function renderPost(kind, card, theme){
  const T=PTHEMES[theme]||PTHEMES.ink; card=card||{};
  const ill=await postIcon(card.icon);
  const RW=ill?PW-PM*2-210:PW-PM*2;   // illyustratsiya bilan sarlavha torroq
  try{ await Promise.race([document.fonts.load(`700 120px "Bricolage Grotesque"`), new Promise(r=>setTimeout(r,1200))]); }catch(e){}
  const cv=document.createElement('canvas'); cv.width=PW; cv.height=PH; const c=cv.getContext('2d');
  c.fillStyle=T.bg; c.fillRect(0,0,PW,PH); c.textBaseline='alphabetic';
  dropAt(c,PM,82,56,T.fg); c.fillStyle=T.fg; c.font=`700 40px ${FH}`; c.textAlign='left'; c.fillText('WordDrop',PM+62,126);
  c.font=`600 32px ${FB}`; c.fillStyle=T.acc; c.textAlign='right'; c.fillText(KIND_LBL[kind]||'WordDrop',PW-PM,126); c.textAlign='left';
  // Mazmunni sarlavha va pastki qator orasida vertikal markazlaymiz (avval o'lchab olamiz)
  const body=(c,y)=>{
  if(card.title){ c.fillStyle=T.mute; c.font=`600 44px ${FB}`; wrap(c,card.title,RW).slice(0,2).forEach(l=>{ c.fillText(l,PM,y); y+=56; }); y+=10; }
  if(card.big){ const s=fitF(c,card.big,RW,250,700,FH,80); c.font=`700 ${s}px ${FH}`; c.fillStyle=T.fg; y+=s*0.85; c.fillText(card.big,PM-6,y); y+=s*0.3; }
  if(card.sub){ c.font=`500 42px ${FB}`; c.fillStyle=T.fg; wrap(c,card.sub,PW-PM*2).slice(0,3).forEach(l=>{ y+=56; c.fillText(l,PM,y); }); y+=30; }
  const lines=(card.lines||[]).filter(Boolean).slice(0,4);
  if(lines.length){ y+=20; c.strokeStyle=T.rule; c.lineWidth=2;
    lines.forEach(l=>{ c.beginPath(); c.moveTo(PM,y); c.lineTo(PW-PM,y); c.stroke(); c.font=`500 36px ${FB}`; c.fillStyle=T.fg; const ws=wrap(c,l,PW-PM*2-20); ws.slice(0,2).forEach((w,i)=>{ c.fillText(w,PM,y+54+i*44); }); y+=Math.min(2,ws.length)*44+34; });
    c.beginPath(); c.moveTo(PM,y); c.lineTo(PW-PM,y); c.stroke(); }
  return y; };
  const mc=document.createElement('canvas').getContext('2d');
  const top=200, bottom=PH-200, used=body(mc,top)-top;
  body(c, top+Math.max(0,Math.min(160,(bottom-top-used)/2)));
  // illyustratsiya — o'ng yuqorida, matn ustiga chiqmasdan
  if(ill){ c.save(); c.globalAlpha=1; c.drawImage(ill,PW-PM-190,170,190,190); c.restore(); }
  // pastki qator
  const by=PH-120; c.strokeStyle=T.rule; c.beginPath(); c.moveTo(PM,by-50); c.lineTo(PW-PM,by-50); c.stroke();
  c.font=`700 40px ${FH}`; c.fillStyle=T.fg; c.fillText(card.cta||"Bepul o'rganing",PM,by+10);
  c.font=`600 32px ${FB}`; c.fillStyle=T.acc; c.textAlign='right'; c.fillText('worddrop-app.uz',PW-PM,by+10); c.textAlign='left';
  c.font=`500 26px ${FB}`; c.fillStyle=T.mute; c.fillText('@worddrop_uz',PM,by+58);
  return cv;
}
window.__wdRenderPost=renderPost;

/* ==================== Kanal studiyasi (admin) ==================== */
let CS={tab:'new',drafts:[],status:null,posts:[]};
function openStudio(){
  if(!isAdmin()){ showToast("Bu bo'lim faqat admin uchun",IC.info); return; }
  view('tgStudio'); renderStudio();
}
window.__wdOpenChannelStudio=openStudio;
function renderStudio(){
  const el=document.getElementById('tgStudio'); if(!el) return;
  el.innerHTML=`<div class="xm-head"><button class="xm-ib" id="csBack" aria-label="Orqaga">${IBACK}</button><div class="xm-ht"><b>Kanal studiyasi</b></div></div>
    <div class="qx-tabs" role="tablist">${[['new','Yangi postlar'],['queue','Navbat'],['status','Holat']].map(([k,n])=>`<button data-t="${k}" class="${CS.tab===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="xm-scroll" id="csBody"></div>`;
  el.querySelector('#csBack').onclick=()=>closeView('tgStudio');
  el.querySelectorAll('.qx-tabs button').forEach(b=>b.onclick=()=>{ CS.tab=b.dataset.t; renderStudio(); });
  if(CS.tab==='new') renderNew(); else if(CS.tab==='queue') renderQueue(); else renderStatus();
}
function nextSlot(i){ const d=new Date(); d.setDate(d.getDate()+1+i); d.setHours(10,0,0,0); return d; }
function toLocalInput(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function renderNew(){
  const b=document.getElementById('csBody');
  b.innerHTML=`
    <p class="bk-lead">Drop kanal uchun postlar tayyorlaydi: matn, rasm va viktorina. Siz ko'rib chiqasiz, tahrirlaysiz, keyin darhol yoki belgilangan vaqtda kanalga chiqadi.</p>
    <label class="bk-lbl" for="csTheme">Mavzu yoki istak <i style="font-weight:400;color:var(--i5)">(ixtiyoriy)</i></label>
    <input id="csTheme" class="bk-in" maxlength="300" placeholder="Masalan: IELTS Speaking iboralari, yangi yil motivatsiyasi">
    <div class="bk-opts" style="margin-top:14px"><div><span class="bk-lbl">Nechta post</span><div class="xc-chips" id="csCnt">${[3,5,7].map((n,i)=>`<button data-v="${n}" class="${i===1?'on':''}">${n}</button>`).join('')}</div></div></div>
    <div class="xs-row2"><button class="xs-ghost" id="csBlank">Bo'sh post</button><button class="xs-main" id="csPlan">Drop bilan reja tuzish</button></div>
    <div id="csDrafts"></div>`;
  let cnt=5; b.querySelectorAll('#csCnt button').forEach(x=>x.onclick=()=>{ cnt=+x.dataset.v; b.querySelectorAll('#csCnt button').forEach(y=>y.classList.toggle('on',y===x)); });
  b.querySelector('#csBlank').onclick=()=>{ CS.drafts.unshift({kind:'custom',caption:'',card:{title:'',big:'WordDrop',sub:'',lines:[],cta:"Bepul o'rganing"},poll:null,theme:'ink',when:toLocalInput(nextSlot(0))}); drawDrafts(); };
  b.querySelector('#csPlan').onclick=async e=>{
    const btn=e.currentTarget; btn.disabled=true; btn.textContent='Drop yozmoqda…';
    const r=await tgApi('plan',{count:cnt,theme:b.querySelector('#csTheme').value.trim()},90000);
    btn.disabled=false; btn.textContent='Drop bilan reja tuzish';
    if(r.__error){ showToast(r.msg,IC.info); return; }
    CS.drafts=r.posts.map((p,i)=>Object.assign(p,{theme:KIND_THEME[p.kind]||'ink',when:toLocalInput(nextSlot(i))})).concat(CS.drafts);
    drawDrafts();
  };
  drawDrafts();
}
async function drawDrafts(){
  const box=document.getElementById('csDrafts'); if(!box) return;
  if(!CS.drafts.length){ box.innerHTML=''; return; }
  box.innerHTML=`<div class="cs-allrow"><b>${CS.drafts.length} ta qoralama</b><button class="rv-link" id="csAll">Hammasini rejalashtirish</button></div>`+CS.drafts.map((d,i)=>`
    <article class="cs-card" data-i="${i}">
      <div class="cs-img"><img alt="Post rasmi" data-img="${i}"></div>
      <div class="cs-th">${Object.entries(PTHEMES).map(([k,t])=>`<button data-th="${k}" class="${d.theme===k?'on':''}" title="${t.n}"><i style="background:${t.bg}"></i></button>`).join('')}
        <label class="cs-noimg"><input type="checkbox" data-noimg ${d.noimg?'checked':''}> Rasmsiz</label></div>
      <details class="cs-det"><summary>Rasmdagi matn</summary>
        <input data-f="title" placeholder="Sarlavha" value="${esc(d.card.title)}">
        <input data-f="big" placeholder="Katta matn" value="${esc(d.card.big)}">
        <input data-f="sub" placeholder="Izoh" value="${esc(d.card.sub)}">
        <textarea data-f="lines" rows="3" placeholder="Qatorlar (har biri yangi qatorda)">${esc((d.card.lines||[]).join('\n'))}</textarea>
        <input data-f="cta" placeholder="Chaqiruv" value="${esc(d.card.cta)}">
      </details>
      <label class="bk-lbl">Post matni</label>
      <textarea class="bk-ta cs-cap" data-cap rows="5" maxlength="1000">${esc(d.caption)}</textarea>
      ${d.poll?`<div class="cs-poll"><b>Viktorina:</b> ${esc(d.poll.question)}<ol>${d.poll.options.map((o,k)=>`<li class="${k===d.poll.correct?'ok':''}">${esc(o)}</li>`).join('')}</ol></div>`:''}
      <div class="cs-when"><label>Vaqt</label><input type="datetime-local" data-when value="${d.when}"></div>
      <div class="cs-acts"><button class="rv-link danger" data-del>O'chirish</button><button class="xs-ghost" data-now>Hozir yuborish</button><button class="xs-main" data-sch>Rejalashtirish</button></div>
    </article>`).join('');
  // rasmlar
  for(let i=0;i<CS.drafts.length;i++){ const d=CS.drafts[i]; const img=box.querySelector(`[data-img="${i}"]`); if(!img) continue;
    if(d.noimg){ img.parentElement.classList.add('off'); continue; }
    const cv=await renderPost(d.kind,d.card,d.theme); d._png=cv.toDataURL('image/png'); img.src=d._png; }
  box.querySelectorAll('.cs-card').forEach(card=>{
    const i=+card.dataset.i, d=CS.drafts[i];
    card.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{ d.theme=b.dataset.th; drawDrafts(); });
    card.querySelector('[data-noimg]').onchange=e=>{ d.noimg=e.target.checked; drawDrafts(); };
    card.querySelectorAll('[data-f]').forEach(inp=>inp.onchange=()=>{ const f=inp.dataset.f; d.card[f]= f==='lines'?inp.value.split('\n').map(s=>s.trim()).filter(Boolean):inp.value; drawDrafts(); });
    card.querySelector('[data-cap]').oninput=e=>{ d.caption=e.target.value; };
    card.querySelector('[data-when]').onchange=e=>{ d.when=e.target.value; };
    card.querySelector('[data-del]').onclick=()=>{ CS.drafts.splice(i,1); drawDrafts(); };
    card.querySelector('[data-now]').onclick=()=>submit(i,true);
    card.querySelector('[data-sch]').onclick=()=>submit(i,false);
  });
  const all=box.querySelector('#csAll'); if(all) all.onclick=async()=>{ for(let i=CS.drafts.length-1;i>=0;i--){ await submit(i,false,true); } drawDrafts(); showToast("Postlar navbatga qo'yildi",IC.check||IC.info); };
}
async function submit(i,now,silent){
  const d=CS.drafts[i]; if(!d) return;
  if(!d.caption.trim()&&d.noimg&&!d.poll){ showToast("Post bo'sh",IC.info); return; }
  if(!d.noimg && d.caption.length>1024){ showToast("Rasmli post matni 1024 belgidan oshmasin",IC.info); return; }
  const payload={kind:d.kind,caption:d.caption,card:d.card,poll:d.poll||null,image:d.noimg?null:d._png};
  if(now) payload.send_now=true; else payload.scheduled_at=new Date(d.when).toISOString();
  const r=await tgApi('post_save',payload,60000);
  if(r.__error||r.ok===false){ showToast((r.msg||r.error||"Yuborilmadi"),IC.info); return; }
  CS.drafts.splice(i,1);
  if(!silent){ showToast(now?"Kanalga yuborildi":"Rejalashtirildi",IC.check||IC.info); drawDrafts(); }
}
async function renderQueue(){
  const b=document.getElementById('csBody'); b.innerHTML=`<div class="bk-busy"><b>Yuklanmoqda</b></div>`;
  const r=await tgApi('posts'); if(r.__error){ b.innerHTML=`<div class="bk-busy"><b>${esc(r.msg)}</b></div>`; return; }
  const L={draft:'Qoralama',scheduled:'Rejada',sending:'Yuborilmoqda',sent:'Yuborildi',failed:'Xato'};
  const MO=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  const fmt=s=>{ if(!s) return ''; const d=new Date(s); return `${d.getDate()}-${MO[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  b.innerHTML=r.posts.length?`<div class="qx-box">${r.posts.map(p=>`<div class="cs-q">
      ${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:'<span class="cs-q-noimg"></span>'}
      <div class="cs-q-b"><span class="cs-st s-${p.status}">${L[p.status]||p.status}</span><b>${esc((p.caption||'').replace(/<[^>]+>/g,'').slice(0,90)||KIND_LBL[p.kind]||'Post')}</b>
        <em>${p.status==='sent'?fmt(p.sent_at):fmt(p.scheduled_at)}${p.error?` · ${esc(p.error)}`:''}</em></div>
      <div class="cs-q-a">${p.status!=='sent'?`<button data-send="${p.id}">Yuborish</button>`:''}<button class="danger" data-delq="${p.id}" data-sent="${p.status==='sent'?1:0}">O'chirish</button></div>
    </div>`).join('')}</div>`:`<div class="bk-busy"><b>Navbat bo'sh</b><p>"Yangi postlar" bo'limida post tayyorlang.</p></div>`;
  b.querySelectorAll('[data-send]').forEach(x=>x.onclick=async()=>{ x.disabled=true; const q=await tgApi('post_send',{id:x.dataset.send},60000); showToast(q.ok?"Yuborildi":(q.error||q.msg||"Xato"),IC.info); renderQueue(); });
  b.querySelectorAll('[data-delq]').forEach(x=>x.onclick=async()=>{ const fromCh=x.dataset.sent==='1'&&confirm("Kanaldagi postni ham o'chiraymi?"); await tgApi('post_delete',{id:x.dataset.delq,from_channel:fromCh}); renderQueue(); });
}
async function renderStatus(){
  const b=document.getElementById('csBody'); b.innerHTML=`<div class="bk-busy"><b>Tekshirilmoqda</b></div>`;
  const s=await tgApi('status'); if(s.__error){ b.innerHTML=`<div class="bk-busy"><b>${esc(s.msg)}</b></div>`; return; }
  const row=(ok,t,v)=>`<div><dt><i class="${ok?'ok':'bad'}"></i>${t}</dt><dd>${v}</dd></div>`;
  const ap=s.autopilot||{};
  b.innerHTML=`<dl class="cs-dl">
      ${row(s.token,'Bot kaliti',s.token?'qo\'shilgan':'yo\'q')}
      ${row(!!s.bot,'Bot',s.bot?'@'+esc(s.bot):esc(s.bot_error||'—'))}
      ${row(s.webhook,'Webhook',s.webhook?'ulangan':esc(s.webhook_error||'sozlanmagan'))}
      ${row(!!s.channel_title,'Kanal',s.channel_title?esc(s.channel_title)+(s.subs!=null?`, ${s.subs} obunachi`:''):esc(s.channel_error||String(s.channel)))}
      ${row(s.can_post,'Post huquqi',s.can_post?'bor':'botni kanalga admin qiling')}
      <div><dt>Botdagi foydalanuvchilar</dt><dd>${s.chats} (${s.linked} ta ulangan)</dd></div>
      <div><dt>Navbatdagi postlar</dt><dd>${s.queued}</dd></div>
    </dl>
    <h3 class="qx-h">Kanal manzili</h3>
    <div class="bk-ask"><input id="csCh" value="${esc(s.channel)}" placeholder="@kanal yoki -100…"><button id="csSetup" aria-label="Saqlash"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div>
    <h3 class="qx-h">Avtopilot</h3>
    <p class="rv-note top">Yoqilsa, kanalga har kuni o'zi post chiqaradi (rasmsiz, bazadagi tekshirilgan so'zlardan).</p>
    <div class="xc xc-row"><div><b>Kun so'zi</b><span>Har kuni ${ap.word_hour??9}:00 da</span></div><button class="xc-tg ${ap.word?'on':''}" id="apW"><i></i></button></div>
    <div class="xc xc-row"><div><b>Viktorina (so'rovnoma)</b><span>Har kuni ${ap.quiz_hour??18}:00 da</span></div><button class="xc-tg ${ap.quiz?'on':''}" id="apQ"><i></i></button></div>
    <button class="xs-ghost" id="csTest" style="margin-top:8px">O'zimga test xabar yuborish</button>`;
  b.querySelector('#csSetup').onclick=async()=>{ const r=await tgApi('setup',{channel:b.querySelector('#csCh').value.trim()}); showToast(r.ok?"Saqlandi va sozlandi":(r.error||r.msg),IC.info); renderStatus(); };
  b.querySelector('#apW').onclick=async e=>{ const on=!e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on',on); await tgApi('autopilot',{word:on}); };
  b.querySelector('#apQ').onclick=async e=>{ const on=!e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on',on); await tgApi('autopilot',{quiz:on}); };
  b.querySelector('#csTest').onclick=async()=>{ const r=await tgApi('test'); showToast(r.ok?"Telegram'ingizni tekshiring":(r.error||r.msg),IC.info); };
}

/* ==================== Eslab qolish usuli (SRS) ==================== */
async function makeMnemonic(it){
  const DP=window.__wdDP; if(!DP||!DP.quotaOk()) return null;
  // Bitta so'rovda shu so'z + mnemonikasi yo'q 5 ta zaif/yangi so'z
  const others=srsAll().filter(x=>x!==it&&!x.mn&&(srsIsLeech(x)||x.st===0)).slice(0,5);
  const items=[it].concat(others);
  const r=await DP.request({mode:'mnemonic',items:items.map(x=>({t:x.t,tr:x.tr}))},40000);
  if(r.__error||!r.items){ showToast(r.msg||"Eslab qolish usuli tuzilmadi",IC.info); return null; }
  await DP.bump();
  r.items.forEach(m=>{ const w=(window.__wdSrs||{})[String(m.t).toLowerCase()]; if(w) w.mn=m.mn_uz; });
  if(!it.mn && r.items[0]) it.mn=r.items[0].mn_uz;
  saveState();
  return it.mn||null;
}
window.__wdMakeMnemonic=makeMnemonic;
})();

