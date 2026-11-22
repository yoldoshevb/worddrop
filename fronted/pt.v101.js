/* =====================================================================
   WordDrop v101 — Daraja (placement) testi
   ---------------------------------------------------------------------
   16 savol, moslashuvchan: to'g'ri javob — keyingi savol bir daraja
   yuqoriroq, xato — pastroq. Savollar banki: wd_placement_items
   (A1–C1, grammatika / lug'at / qisqa matn). Natija ilovadagi
   darajani (window.__wdCEFR) o'rnatadi: darslar, Drop AI, kitobchalar
   va suhbat shu darajadan boshlab moslashadi.
   ===================================================================== */
(function(){
'use strict';
if(window.WDPT) return;
const LV=['A1','A2','B1','B2','C1'];
const N=16;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KIND={grammar:'Grammatika',vocab:"Lug'at",reading:'Matn'};
const INFO={
  A1:["Boshlang'ich","Oddiy so'z va iboralarni tushunasiz. Darslar eng kerakli so'zlardan boshlanadi."],
  A2:["Elementar","Kundalik vaziyatlarda qisqa gaplashasiz. Endi ko'proq zamonlar va so'z boyligi kerak."],
  B1:["O'rta","Tanish mavzularda erkin gaplashasiz. Keyingi qadam — murakkab grammatika va IELTS/Multilevel so'zlari."],
  B2:["O'rtadan yuqori","Murakkab matnlarni tushunasiz. Endi akademik lug'at va ravon yozishga e'tibor beramiz."],
  C1:["Yuqori","Erkin va aniq ifodalaysiz. Nozik ma'nolar, idiomalar va akademik uslub ustida ishlaymiz."],
};
const CSS=`
.ptz{position:fixed;inset:0;z-index:3500;background:var(--bg,#F6F8FC);color:var(--i9,#12172B);display:flex;flex-direction:column;font-family:inherit}
.ptz *{box-sizing:border-box}
.pt-top{display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 10px}
.pt-x{width:40px;height:40px;border:none;border-radius:12px;background:transparent;color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer}
.pt-x svg{width:22px;height:22px}
.pt-bar{flex:1;height:8px;border-radius:6px;background:var(--line,#E5E9F2);overflow:hidden}
.pt-bar i{display:block;height:100%;width:0;background:#2F6FED;border-radius:6px;transition:width .35s ease}
.pt-n{font-size:13px;font-weight:600;color:var(--i5,#6B7488);font-variant-numeric:tabular-nums;min-width:44px;text-align:right}
.pt-body{flex:1;overflow-y:auto;padding:12px 20px 30px}
.pt-in{max-width:560px;margin:0 auto}
.pt-kind{font-size:13px;font-weight:600;color:var(--i5,#6B7488);margin:10px 0 10px}
.pt-q{font-size:21px;line-height:1.4;font-weight:600;margin-bottom:22px}
.pt-q .gap{display:inline-block;min-width:56px;border-bottom:2px solid currentColor;margin:0 2px}
.pt-opts{display:flex;flex-direction:column;gap:10px}
.pt-opt{display:block;width:100%;text-align:left;font:inherit;font-size:16px;padding:15px 16px;border-radius:14px;border:1.5px solid var(--line,#E5E9F2);background:var(--sur,#fff);color:inherit;cursor:pointer;transition:border-color .15s,background .15s}
.pt-opt:hover{border-color:#9AA6B4}
.pt-opt.ok{border-color:#1FAE6B;background:rgba(31,174,107,.08)}
.pt-opt.no{border-color:#E4484E;background:rgba(228,72,78,.07)}
.pt-opt:disabled{cursor:default}
.pt-opt:focus-visible{outline:2px solid #2F6FED;outline-offset:2px}
.pt-skip{display:block;margin:18px auto 0;border:none;background:none;color:var(--i5,#6B7488);font:inherit;font-size:14px;text-decoration:underline;cursor:pointer}
.pt-h1{font-size:27px;line-height:1.15;font-weight:800;letter-spacing:-.02em;margin:18px 0 10px}
.pt-p{font-size:15.5px;line-height:1.55;color:var(--i5,#6B7488)}
.pt-list{margin:18px 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.pt-list li{display:flex;gap:12px;font-size:15px;line-height:1.45}
.pt-list b{flex:0 0 26px;height:26px;border-radius:8px;background:var(--b0,#EEF3FF);color:#2F6FED;display:flex;align-items:center;justify-content:center;font-size:13px}
.pt-go{display:block;width:100%;margin-top:22px;border:none;border-radius:14px;background:#2F6FED;color:#fff;font:inherit;font-size:16px;font-weight:700;padding:16px;cursor:pointer}
.pt-go.sec{background:transparent;color:inherit;border:1.5px solid var(--line,#E5E9F2);margin-top:10px}
.pt-lv{font-size:64px;line-height:1;font-weight:800;letter-spacing:-.03em;color:#2F6FED;margin-top:14px}
.pt-lvn{font-size:18px;font-weight:700;margin-top:4px}
.pt-ladder{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:20px 0 6px}
.pt-ladder div{height:46px;border-radius:10px;background:var(--line,#E5E9F2);display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px;font-size:12px;font-weight:700;color:var(--i5,#6B7488)}
.pt-ladder div.d{background:rgba(47,111,237,.18);color:#2F6FED}
.pt-ladder div.on{background:#2F6FED;color:#fff;height:58px;margin-top:-12px}
.pt-skills{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}
.pt-skills div{background:var(--sur,#fff);border:1px solid var(--line,#E5E9F2);border-radius:12px;padding:10px 12px;font-size:12.5px;color:var(--i5,#6B7488)}
.pt-skills b{display:block;font-size:20px;color:var(--i9,#12172B);font-variant-numeric:tabular-nums}
.pt-skills i{display:block;height:5px;border-radius:3px;background:var(--line,#E5E9F2);margin-top:6px;position:relative;overflow:hidden}
.pt-skills i::after{content:'';position:absolute;inset:0 auto 0 0;width:var(--w);background:#2F6FED}
.pt-note{background:var(--sur,#fff);border:1px solid var(--line,#E5E9F2);border-radius:14px;padding:14px 16px;margin-top:16px;font-size:14.5px;line-height:1.55}
@media (prefers-reduced-motion:reduce){.pt-bar i{transition:none}}
`;
function css(){ if(document.getElementById('ptCss')) return; const s=document.createElement('style'); s.id='ptCss'; s.textContent=CSS; document.head.appendChild(s); }
const IX='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
let BANK=null;
async function bank(){
  if(BANK) return BANK;
  try{ const {data}=await window.__sb.from('wd_placement_items').select('id,level,kind,q,opts,a').eq('active',true); if(data&&data.length) BANK=data; }catch(e){}
  return BANK;
}
/* Yakuniy daraja: kamida 2 ta savol berilgan va 60% dan ko'p to'g'ri topilgan eng yuqori daraja */
function estimate(hist){
  const by={}; hist.forEach(h=>{ (by[h.l]=by[h.l]||{n:0,ok:0}); by[h.l].n++; if(h.ok) by[h.l].ok++; });
  let best=-1;
  LV.forEach((l,i)=>{ const x=by[l]; if(x&&x.n>=2&&x.ok/x.n>=0.6) best=i; });
  if(best<0){ const x=by.A1; best=0; if(x&&x.ok===0) best=0; }
  // yuqoriroq darajada bitta tasodifiy to'g'ri javob emas, balki barqarorlik muhim
  return LV[best];
}
let EL=null;
function close(){ if(EL){ EL.remove(); EL=null; } }
async function open(opts){
  opts=opts||{}; css(); close();
  EL=document.createElement('div'); EL.className='ptz'; EL.setAttribute('role','dialog'); EL.setAttribute('aria-modal','true'); document.body.appendChild(EL);
  const cur=window.__wdCEFR||'';
  EL.innerHTML=`<div class="pt-top"><button class="pt-x" id="ptX" aria-label="Yopish">${IX}</button><div style="flex:1"></div></div>
    <div class="pt-body"><div class="pt-in">
      <h1 class="pt-h1">Darajangizni 5 daqiqada aniqlaymiz</h1>
      <p class="pt-p">16 ta savol. Har bir javobingizdan keyin keyingi savol qiyinroq yoki osonroq bo'ladi — shuning uchun test qisqa, lekin aniq.</p>
      <ul class="pt-list"><li><b>1</b><span>Grammatika, so'z boyligi va qisqa matnlar — A1 dan C1 gacha.</span></li><li><b>2</b><span>Bilmasangiz, taxmin qilmang — «Bilmayman» tugmasini bosing. Natija aniqroq chiqadi.</span></li><li><b>3</b><span>Natijaga ko'ra darslar, so'zlar, Drop AI va kitobchalar sizning darajangizdan boshlanadi.</span></li></ul>
      ${cur?`<p class="pt-p">Hozirgi darajangiz: <b>${esc(cur)}</b></p>`:''}
      <button class="pt-go" id="ptGo">Testni boshlash</button>
      ${opts.skippable?`<button class="pt-go sec" id="ptLater">Keyinroq</button>`:''}
    </div></div>`;
  EL.querySelector('#ptX').onclick=close;
  const later=EL.querySelector('#ptLater'); if(later) later.onclick=close;
  EL.querySelector('#ptGo').onclick=()=>run(opts);
}
async function run(opts){
  const B=await bank(); if(!B){ try{ showToast("Savollar yuklanmadi. Internetni tekshiring.",IC.info); }catch(e){} return; }
  const pool={}; LV.forEach(l=>pool[l]=B.filter(x=>x.level===l).sort(()=>Math.random()-.5));
  const startIdx=Math.max(1,Math.min(2,LV.indexOf(window.__wdCEFR||'A2')));
  let idx=startIdx<0?1:startIdx; const hist=[];
  const body=EL.querySelector('.pt-body'); const top=EL.querySelector('.pt-top');
  top.innerHTML=`<button class="pt-x" id="ptX" aria-label="Yopish">${IX}</button><div class="pt-bar"><i id="ptB"></i></div><span class="pt-n" id="ptN">1 / ${N}</span>`;
  top.querySelector('#ptX').onclick=()=>{ if(!hist.length||confirm("Test to'xtatilsinmi? Natija saqlanmaydi.")) close(); };
  for(let k=0;k<N;k++){
    let lv=LV[idx]; let item=pool[lv].shift();
    if(!item){ const alt=LV.map((l,i)=>[i,pool[l].length]).filter(x=>x[1]).sort((a,b)=>Math.abs(a[0]-idx)-Math.abs(b[0]-idx))[0]; if(!alt) break; idx=alt[0]; lv=LV[idx]; item=pool[lv].shift(); }
    EL.querySelector('#ptB').style.width=Math.round(k/N*100)+'%'; EL.querySelector('#ptN').textContent=`${k+1} / ${N}`;
    const ok=await ask(body,item);
    hist.push({l:lv,k:item.kind,ok,id:item.id});
    idx=Math.max(0,Math.min(LV.length-1,idx+(ok?1:-1)));
  }
  EL.querySelector('#ptB').style.width='100%';
  if(hist.length<8){ body.innerHTML=`<div class="pt-in"><h1 class="pt-h1">Test yakunlanmadi</h1><p class="pt-p">Savollar to'liq yuklanmadi. Internetni tekshirib, qayta urinib ko'ring.</p><button class="pt-go" id="ptAgain">Qayta urinish</button></div>`; body.querySelector('#ptAgain').onclick=()=>{ BANK=null; open(opts); }; return; }
  const level=estimate(hist);
  await save(level,hist);
  result(body,top,level,hist,opts);
}
function ask(body,item){
  return new Promise(res=>{
    const q=esc(item.q).replace(/___/g,'<span class="gap"></span>');
    body.innerHTML=`<div class="pt-in"><div class="pt-kind">${KIND[item.kind]||''}</div><div class="pt-q">${q}</div>
      <div class="pt-opts">${item.opts.map((o,i)=>`<button class="pt-opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>
      <button class="pt-skip" id="ptSkip">Bilmayman</button></div>`;
    const done=(i)=>{ const ok=i===item.a; body.querySelectorAll('.pt-opt').forEach(b=>{ b.disabled=true; const j=Number(b.dataset.i); if(j===item.a) b.classList.add('ok'); else if(j===i) b.classList.add('no'); });
      setTimeout(()=>res(ok),ok?450:900); };
    body.querySelectorAll('.pt-opt').forEach(b=>b.onclick=()=>done(Number(b.dataset.i)));
    body.querySelector('#ptSkip').onclick=()=>done(-1);
    const f=body.querySelector('.pt-opt'); if(f) f.focus({preventScroll:true});
  });
}
async function save(level,hist){
  window.__wdCEFR=level;
  window.__wdPlaced=new Date().toISOString();
  try{ saveState(); }catch(e){}
  try{ localStorage.setItem('wd_placed',level); }catch(e){}
  try{ const {data}=await window.__sb.auth.getUser(); const u=data&&data.user; if(u){ const ok=hist.filter(h=>h.ok).length; await window.__sb.from('wd_placement').insert({user_id:u.id,level,score:ok,answers:hist.length,source:'app'}); } }catch(e){}
}
function result(body,top,level,hist,opts){
  top.innerHTML=`<button class="pt-x" id="ptX" aria-label="Yopish">${IX}</button>`; top.querySelector('#ptX').onclick=close;
  const k=LV.indexOf(level);
  const sk=['grammar','vocab','reading'].map(s=>{ const h=hist.filter(x=>x.k===s); const p=h.length?Math.round(h.filter(x=>x.ok).length/h.length*100):0; return `<div>${KIND[s]}<b>${p}%</b><i style="--w:${p}%"></i></div>`; }).join('');
  body.innerHTML=`<div class="pt-in">
    <div class="pt-p">Sizning darajangiz</div><div class="pt-lv">${level}</div><div class="pt-lvn">${INFO[level][0]}</div>
    <div class="pt-ladder" role="img" aria-label="Daraja shkalasi: ${level}">${LV.map((l,i)=>`<div class="${i<k?'d':i===k?'on':''}">${l}</div>`).join('')}</div>
    <p class="pt-p">${INFO[level][1]}</p>
    <div class="pt-skills">${sk}</div>
    <div class="pt-note"><b>Nima o'zgaradi:</b> yangi darslar va so'zlar ${level} darajasidan boshlanadi va siz o'sgan sari qiyinlashadi. Drop AI, kitobchalar va jonli suhbat ham ${level} darajasiga moslashadi. Darajani istalgan vaqt Profil → «Ingliz tili darajam» bo'limida o'zgartirish yoki testni qayta topshirish mumkin.</div>
    <button class="pt-go" id="ptDone">Davom etish</button>
    ${level==='B1'||level==='B2'||level==='C1'?`<button class="pt-go sec" id="ptMl">Multilevel sinov imtihonini topshirish</button>`:''}
  </div>`;
  body.querySelector('#ptDone').onclick=()=>{ close(); try{ renderProfile(); }catch(e){} try{ if(typeof renderHome==='function') renderHome(); }catch(e){} try{ showToast('Daraja: '+level,IC.check); }catch(e){} opts.onDone&&opts.onDone(level); };
  const ml=body.querySelector('#ptMl'); if(ml) ml.onclick=()=>{ close(); window.__wdOpenML&&window.__wdOpenML(); };
}
window.WDPT={open,estimate};
})();
