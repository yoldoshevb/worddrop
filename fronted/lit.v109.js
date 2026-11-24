/* =====================================================================
   WordDrop v108 — «Adabiyot» rejimi
   ---------------------------------------------------------------------
   Alohida fayl: ilova uni faqat Adabiyot ochilganda yuklaydi.
   Ma'lumot: Supabase wd_lit_works (katalog + mundarija) va
   wd_lit_chapters (bob matni; RLS — bepul bob yoki Pro).
   Manba fayllar: content/adabiyot/<id>.json → lit-sync.
   Progress: localStorage + wd_lit_progress (hisobga kirganda sinxron).
   ===================================================================== */
(function(){
'use strict';
if(window.WDLit) return;

const LS_P='wd_lit_prog_v1', LS_SET='wd_lit_set_v1', LS_TR='wd_lit_tr_v1';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(r,s)=>r.querySelector(s), $$=(r,s)=>[...r.querySelectorAll(s)];
const toast=m=>{ try{ window.showToast?showToast(m,(window.IC&&IC.info)||''):console.log(m); }catch(e){} };
const ls=(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } };
const lsSet=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const mins=w=>Math.max(1,Math.round((w||0)/170));
const sb=()=>window.__sb;
async function ready(){ try{ await window.__sbReady; }catch(e){} return sb(); }
async function uid(){ try{ const {data}=await sb().auth.getSession(); return data&&data.session?data.session.user.id:null; }catch(e){ return null; } }
const isPro=()=>!!(window.__wdIsPro||S.canAll);

/* ---------- ikonlar ---------- */
const I={
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  aa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19l5-13 5 13M4.8 14.5h6.4M14.5 19l3.2-8.5 3.3 8.5M15.6 16.3h4.3"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/></svg>',
  tr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h8M8 3v2M5.5 5c.8 3 3 5.5 6 7M10.5 5c-.8 3.2-3 6-6 7.5"/><path d="M13 21l3.5-9 3.5 9M14.2 18h4.6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
};

/* ---------- muqova (har asarning o'z rangi va belgisi) ---------- */
function motif(m,c){
  const a=c.accent||'#C8402B', k=c.ink||'#1D1B16';
  switch(m){
    case 'sun': return `<svg class="lc-art" viewBox="0 0 120 180" preserveAspectRatio="xMidYMid slice"><circle cx="86" cy="58" r="30" fill="${a}"/><path d="M0 132 Q30 120 60 132 T120 132 V180 H0Z" fill="${k}" opacity=".9"/><path d="M0 146 Q30 136 60 146 T120 146" stroke="${a}" stroke-width="2" fill="none" opacity=".7"/></svg>`;
    case 'eye': return `<svg class="lc-art" viewBox="0 0 120 180"><path d="M14 92 Q60 40 106 92 Q60 144 14 92Z" fill="none" stroke="${k}" stroke-width="3"/><circle cx="60" cy="92" r="17" fill="${a}"/><circle cx="60" cy="92" r="7" fill="${k}"/></svg>`;
    case 'bug': return `<svg class="lc-art" viewBox="0 0 120 180"><ellipse cx="60" cy="100" rx="24" ry="34" fill="${k}"/><path d="M36 84 L16 74M36 100 L12 100M36 116 L16 128M84 84 L104 74M84 100 L108 100M84 116 L104 128" stroke="${k}" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="62" r="11" fill="${a}"/></svg>`;
    case 'grid': return `<svg class="lc-art" viewBox="0 0 120 180">${Array.from({length:30},(_,i)=>`<rect x="${14+(i%5)*20}" y="${40+Math.floor(i/5)*20}" width="14" height="14" rx="2" fill="${i===17?a:k}" opacity="${i===17?1:.85}"/>`).join('')}</svg>`;
    default: return `<svg class="lc-art" viewBox="0 0 120 180"><rect x="20" y="60" width="80" height="80" rx="40" fill="${a}"/></svg>`;
  }
}
function cover(w,size){
  const c=w.cover||{};
  const long=Math.max(...String(w.title).split(/\s+/).map(x=>x.length))>=10;
  return `<div class="lc lc-${size||'m'}${long?' lc-long':''}" style="--cb:${esc(c.bg||'#E7E2D8')};--ci:${esc(c.ink||'#1D1B16')};--ca:${esc(c.accent||'#C8402B')}">
    ${motif(c.motif,c)}
    <div class="lc-t"><b>${esc(w.title)}</b><span>${esc(w.author)}</span></div>
  </div>`;
}

/* ---------- holat ---------- */
const S={canAll:false,loading:true,el:null,stack:[],works:[],work:null,ch:null,chIdx:0,prog:ls(LS_P,{}),set:Object.assign({fs:19,theme:'auto',uz:false,font:'serif'},ls(LS_SET,{})),filter:'all',q:'',saveT:0,scrollT:0};
function prog(id){ return S.prog[id]||(S.prog[id]={cur:0,pos:0,done:[],quiz:{},t:0}); }
function saveProg(id,remote){
  const p=prog(id); p.t=Date.now(); lsSet(LS_P,S.prog);
  if(!remote) return;
  clearTimeout(S.saveT);
  S.saveT=setTimeout(async()=>{ const u=await uid(); if(!u) return;
    try{ await sb().from('wd_lit_progress').upsert({user_id:u,work_id:id,data:p,updated_at:new Date().toISOString()}); }catch(e){} },1200);
}
async function pullProg(){
  const u=await uid(); if(!u) return;
  try{ const {data}=await sb().from('wd_lit_progress').select('work_id,data');
    (data||[]).forEach(r=>{ const l=S.prog[r.work_id]; if(!l||((r.data&&r.data.t)||0)>(l.t||0)) S.prog[r.work_id]=r.data; });
    lsSet(LS_P,S.prog);
  }catch(e){}
}
function pct(w){ const p=S.prog[w.id]; if(!p||!w.toc||!w.toc.length) return 0; return Math.round(100*(p.done||[]).length/w.toc.length); }

/* ---------- yo'naltirish (orqaga tugmasi bilan ishlaydi) ---------- */
function push(view,arg){ S.stack.push([view,arg]); try{ history.pushState({wdlit:S.stack.length},'','#adabiyot'); }catch(e){} render(); }
function onPop(){ if(S.sheet){ closeSheet(); try{ history.pushState({wdlit:S.stack.length},'','#adabiyot'); }catch(e){} return; }
  S.stack.pop(); if(!S.stack.length){ close(true); return; } render(); }
function back(){ try{ history.back(); }catch(e){ onPop(); } }
function render(){ const top=S.stack[S.stack.length-1]; if(!top) return; const [v,a]=top;
  stopScrollTrack(); S.el.dataset.view=v;
  if(v==='lib') renderLib(); else if(v==='work') renderWork(a); else if(v==='read') renderRead(a.id,a.idx); }

async function open(target){
  css();
  if(S.el) S.el.remove();
  const el=document.createElement('div'); el.className='ltz'; el.id='wdLit'; document.body.appendChild(el); S.el=el;
  applyTheme();
  el.innerHTML=`<div class="lt-wait"><span class="lt-spin"></span></div>`;
  window.addEventListener('popstate',onPop);
  document.addEventListener('keydown',onKey);
  document.body.classList.add('lit-open');
  S.loading=true; S.stack=[]; push('lib');
  await ready(); await Promise.all([loadWorks(),pullProg(),canRead()]); S.loading=false;
  if(S.stack.length===1) renderLib();
  if(target&&target.work) push('work',target.work);
}
function close(fromPop){
  window.removeEventListener('popstate',onPop); document.removeEventListener('keydown',onKey);
  stopScrollTrack(); closeSheet();
  if(S.el){ S.el.remove(); S.el=null; }
  if(!fromPop){ const n=S.stack.length; S.stack=[]; try{ if(n) history.go(-n); }catch(e){} }
  S.stack=[]; document.body.classList.remove('lit-open');
}
function onKey(e){
  if(!S.el||e.target.closest('input,textarea')) return;
  if(e.key==='Escape'){ if(S.sheet) closeSheet(); else back(); }
  const top=S.stack[S.stack.length-1]; if(!top||top[0]!=='read') return;
  if(e.key==='ArrowRight') goChap(S.chIdx+1); else if(e.key==='ArrowLeft') goChap(S.chIdx-1);
}

async function canRead(){ try{ const {data}=await sb().rpc('wd_lit_can_read'); S.canAll=!!data; }catch(e){} }
async function loadWorks(){
  try{ const {data,error}=await sb().from('wd_lit_works').select('id,title,author,year,edition,level,genres,cover,meta,toc,words,sort').eq('published',true).order('sort');
    if(!error) S.works=data||[]; }catch(e){}
}

/* =====================================================================
   KUTUBXONA
   ===================================================================== */
function renderLib(){
  const el=S.el;
  if(S.loading){ el.innerHTML=`<div class="lt-top"><button class="lt-ib" data-back aria-label="Orqaga">${I.back}</button><b>Adabiyot</b><span></span></div><div class="lt-wait"><span class="lt-spin"></span></div>`; $(el,'[data-back]').onclick=back; return; }
  const genres=[...new Set(S.works.flatMap(w=>w.genres||[]))];
  const q=S.q.trim().toLowerCase();
  const list=S.works.filter(w=>(S.filter==='all'||(w.genres||[]).includes(S.filter))&&(!q||(w.title+' '+w.author+' '+((w.meta&&w.meta.title_uz)||'')).toLowerCase().includes(q)));
  const last=S.works.map(w=>({w,p:S.prog[w.id]})).filter(x=>x.p&&x.p.t&&pct(x.w)<100).sort((a,b)=>b.p.t-a.p.t)[0];
  el.innerHTML=`
  <div class="lt-top"><button class="lt-ib" data-back aria-label="Orqaga">${I.back}</button><b>Adabiyot</b><span></span></div>
  <div class="lt-sc" id="ltSc"><div class="lt-col">
    <header class="ll-hd">
      <h1>Kitob javoni</h1>
      <p>Jahon adabiyoti ingliz tilida — har bobda tarjima, lug'at va savollar.</p>
    </header>
    ${last?`<button class="ll-cont" data-work="${esc(last.w.id)}">
      ${cover(last.w,'s')}
      <div class="ll-cont-t"><small>O'qishni davom ettirish</small><b>${esc(last.w.title)}</b>
        <span>${esc((last.w.toc[last.p.cur]||{}).title||'')} · ${pct(last.w)}% o'qildi</span>
        <i class="lt-bar"><i style="width:${Math.max(4,pct(last.w))}%"></i></i></div>
      <em>${I.next}</em></button>`:''}
    <div class="ll-tools">
      <label class="ll-q">${I.search}<input id="ltQ" type="search" placeholder="Asar yoki muallif" value="${esc(S.q)}"></label>
      <div class="ll-chips"><button class="ll-chip${S.filter==='all'?' on':''}" data-f="all">Hammasi</button>${genres.map(g=>`<button class="ll-chip${S.filter===g?' on':''}" data-f="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    </div>
    ${list.length?`<div class="ll-grid">${list.map(w=>`<button class="ll-book" data-work="${esc(w.id)}">
      ${cover(w,'m')}${pct(w)?`<i class="lt-bar"><i style="width:${pct(w)}%"></i></i>`:''}
      <b>${esc(w.title)}</b><span>${esc(w.author)}${w.year?' · '+w.year:''}</span>
      <em class="lt-tag ${w.edition}">${w.edition==='study'?"O'quv nashri":"To'liq matn"}</em>
    </button>`).join('')}</div>`
    :`<div class="ll-empty">${S.works.length?'Bu so\'rov bo\'yicha asar topilmadi.':'Kitoblar yuklanmadi. Internetni tekshirib, qayta oching.'}</div>`}
    <p class="ll-soon">Tez orada: Austen, Dostoyevskiy, Orwell, Zamyatin, Nitsshe, Huxley va boshqalar.</p>
  </div></div>`;
  $(el,'[data-back]').onclick=back;
  $$(el,'[data-work]').forEach(b=>b.onclick=()=>push('work',b.dataset.work));
  $$(el,'[data-f]').forEach(b=>b.onclick=()=>{ S.filter=b.dataset.f; renderLib(); });
  const qi=$(el,'#ltQ'); qi.oninput=()=>{ S.q=qi.value; const p=qi.selectionStart; renderLib(); const n=$(S.el,'#ltQ'); n.focus(); try{ n.setSelectionRange(p,p); }catch(e){} };
}

/* =====================================================================
   ASAR SAHIFASI
   ===================================================================== */
function renderWork(id){
  const w=S.works.find(x=>x.id===id); if(!w){ back(); return; }
  S.work=w; const m=w.meta||{}, p=prog(id), done=new Set(p.done||[]);
  const started=(p.done||[]).length||p.pos>0||p.cur>0;
  const parts=[...new Set(w.toc.map(c=>c.part).filter(x=>x!=null))];
  const chRow=c=>{ const lk=!c.free&&!isPro();
    return `<button class="lw-ch${done.has(c.idx)?' done':''}${lk?' lk':''}${p.cur===c.idx&&started?' cur':''}" data-ch="${c.idx}">
      <i class="lw-n">${done.has(c.idx)?I.check:c.idx+1}</i>
      <span><b>${esc(c.title)}</b><small>${esc(c.title_uz)} · ${mins(c.words)} daq</small></span>
      ${lk?`<em class="lw-lk">${I.lock}</em>`:(c.free&&!isPro()?'<em class="lw-free">Bepul</em>':'')}
    </button>`; };
  S.el.innerHTML=`
  <div class="lt-top"><button class="lt-ib" data-back aria-label="Orqaga">${I.back}</button><b>${esc(w.title)}</b><span></span></div>
  <div class="lt-sc" id="ltSc"><div class="lt-col">
    <section class="lw-hero">
      ${cover(w,'l')}
      <div class="lw-info">
        <h1>${esc(w.title)}</h1>
        ${m.title_uz?`<p class="lw-uz">${esc(m.title_uz)}${m.orig_title?` <span>(${esc(m.orig_title)})</span>`:''}</p>`:''}
        <p class="lw-by">${esc(w.author)}${w.year?', '+w.year:''}</p>
        <div class="lw-facts"><span class="lt-tag ${w.edition}">${w.edition==='study'?"O'quv nashri":"To'liq matn"}</span>${w.level?`<span>${esc(w.level)}</span>`:''}<span>${w.toc.length} bob</span><span>~${mins(w.words)} daqiqa</span></div>
        <button class="lt-cta" data-start>${started?`Davom ettirish: ${p.cur+1}-bob`:"O'qishni boshlash"}</button>
        ${pct(w)?`<div class="lw-pg"><i class="lt-bar"><i style="width:${pct(w)}%"></i></i><span>${pct(w)}% o'qildi</span></div>`:''}
      </div>
    </section>
    <nav class="lw-tabs"><button class="on" data-tab="toc">Boblar</button><button data-tab="about">Asar haqida</button></nav>
    <section class="lw-pane" data-pane="toc">
      ${parts.length>1?parts.map(pt=>`<h3 class="lw-part">${pt}-qism</h3>${w.toc.filter(c=>c.part===pt).map(chRow).join('')}`).join(''):w.toc.map(chRow).join('')}
      ${!isPro()?`<div class="lw-pro"><b>Barcha boblar — Pro'da</b><p>Birinchi bob hammaga ochiq. Pro bilan barcha asarlarning har bir bobi, tarjimasi, lug'ati va savollari ochiladi.</p><button data-pro>Pro'ni ko'rish</button></div>`:''}
    </section>
    <section class="lw-pane" data-pane="about" hidden>
      ${m.blurb_uz?`<p class="lw-lead">${esc(m.blurb_uz)}</p>`:''}
      ${m.why_uz?`<h3>Nega o'qish kerak</h3><p>${esc(m.why_uz)}</p>`:''}
      ${m.author_uz?`<h3>Muallif</h3><p>${esc(m.author_uz)}</p>`:''}
      ${(m.characters||[]).length?`<h3>Qahramonlar</h3><dl class="lw-dl">${m.characters.map(c=>`<dt>${esc(c.name)}</dt><dd>${esc(c.uz)}</dd>`).join('')}</dl>`:''}
      ${(m.themes||[]).length?`<h3>Asosiy mavzular</h3><dl class="lw-dl">${m.themes.map(c=>`<dt>${esc(c.t)}</dt><dd>${esc(c.uz)}</dd>`).join('')}</dl>`:''}
      ${m.edition_uz?`<div class="lw-note"><b>${w.edition==='study'?"O'quv nashri haqida":'Matn manbasi'}</b><p>${esc(m.edition_uz)}</p></div>`:''}
    </section>
  </div></div>`;
  const el=S.el;
  $(el,'[data-back]').onclick=back;
  $(el,'[data-start]').onclick=()=>openChap(id,started?p.cur:0);
  $$(el,'[data-ch]').forEach(b=>b.onclick=()=>openChap(id,+b.dataset.ch));
  const pb=$(el,'[data-pro]'); if(pb) pb.onclick=openPro;
  $$(el,'[data-tab]').forEach(b=>b.onclick=()=>{ $$(el,'[data-tab]').forEach(x=>x.classList.toggle('on',x===b)); $$(el,'[data-pane]').forEach(x=>x.hidden=x.dataset.pane!==b.dataset.tab); });
}
function openPro(){ if(window.__wdOpenPro) window.__wdOpenPro(); else toast("Pro bo'limi topilmadi"); }
function openChap(id,idx){
  const w=S.works.find(x=>x.id===id); const c=w&&w.toc[idx]; if(!c) return;
  if(!c.free&&!isPro()){ lockSheet(w,c); return; }
  push('read',{id,idx});
}
function lockSheet(w,c){
  sheet(`<div class="ls-lock"><div class="ls-li">${I.lock}</div><h3>${esc(c.title)} — Pro bobi</h3>
    <p>«${esc(w.title)}»ning birinchi bobi bepul. Davomini o'qish uchun WordDrop Pro kerak — barcha asarlar, tarjima, lug'at va savollar bilan.</p>
    <button class="lt-cta" data-pro>Pro'ni ko'rish</button>
    <button class="lt-ghost" data-promo>Promokodim bor</button></div>`, sh=>{
    $(sh,'[data-pro]').onclick=()=>{ closeSheet(); openPro(); };
    $(sh,'[data-promo]').onclick=()=>{ closeSheet(); if(window.__wdOpenPromo) window.__wdOpenPromo(); else openPro(); };
  });
}

/* =====================================================================
   O'QUVCHI
   ===================================================================== */
const chapCache={};
async function fetchChap(id,idx){
  const k=id+'#'+idx; if(chapCache[k]) return chapCache[k];
  const {data,error}=await sb().from('wd_lit_chapters').select('body,free').eq('work_id',id).eq('idx',idx).maybeSingle();
  if(error) throw error; if(!data) return null;
  return (chapCache[k]=data.body);
}
function goChap(i){ const w=S.work; if(!w||i<0||i>=w.toc.length) return;
  const c=w.toc[i]; if(!c.free&&!isPro()){ lockSheet(w,c); return; }
  S.stack[S.stack.length-1]=['read',{id:w.id,idx:i}]; render(); }

/* So'zlarni bosiladigan qilish; lug'atdagi iboralar belgilanadi */
const WRX=/([A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-z]+)*)/g;
function glossKeys(g){ return g.map((x,i)=>({i,parts:String(x.t).replace(/\(.*?\)/g,'').trim().toLowerCase().split(/\s+/).filter(Boolean)})); }
const near=(tok,base)=>tok===base||(tok.startsWith(base)&&tok.length-base.length<=3&&base.length>=3)||(base.endsWith('e')&&tok.startsWith(base.slice(0,-1))&&tok.length-base.length<=3);
function markup(text,keys){
  const toks=[]; let last=0; text.replace(WRX,(m,_,off)=>{ if(off>last) toks.push({s:text.slice(last,off)}); toks.push({w:m}); last=off+m.length; return m; });
  if(last<text.length) toks.push({s:text.slice(last)});
  let out='';
  for(let i=0;i<toks.length;i++){
    const t=toks[i];
    if(!t.w){ out+=esc(t.s); continue; }
    let hit=null;
    for(const k of keys){ let j=i,ok=true,end=i;
      for(let n=0;n<k.parts.length;n++){ while(j<toks.length&&!toks[j].w){ if(/\S/.test(toks[j].s.replace(/[’']/g,''))){ ok=false; break; } j++; }
        if(!ok||j>=toks.length||!near(toks[j].w.toLowerCase(),k.parts[n])){ ok=false; break; } end=j; j++; }
      if(ok){ hit={k,end}; break; } }
    if(hit){ let s=''; for(let n=i;n<=hit.end;n++) s+=toks[n].w?toks[n].w:esc(toks[n].s); out+=`<span class="lr-g" data-g="${hit.k.i}">${s}</span>`; i=hit.end; continue; }
    out+=`<span class="lr-w">${esc(t.w)}</span>`;
  }
  return out;
}

async function renderRead(id,idx){
  const w=S.works.find(x=>x.id===id); if(!w){ back(); return; }
  S.work=w; S.chIdx=idx; const c=w.toc[idx]; const p=prog(id);
  const sameChap=p.cur===idx; p.cur=idx; saveProg(id,true);
  S.el.innerHTML=`
  <div class="lt-top lr-top"><button class="lt-ib" data-back aria-label="Orqaga">${I.back}</button>
    <b><small>${esc(w.title)}</small>${esc(c.title)}</b>
    <span class="lr-acts"><button class="lt-ib${S.set.uz?' on':''}" data-uz aria-label="O'zbekcha tarjima" title="O'zbekcha tarjima">${I.tr}</button><button class="lt-ib" data-toc aria-label="Mundarija" title="Mundarija">${I.list}</button><button class="lt-ib" data-set aria-label="Ko'rinish" title="Ko'rinish">${I.aa}</button></span>
    <i class="lr-prog"><i id="lrBar"></i></i></div>
  <div class="lt-sc lr-sc" id="ltSc"><div class="lr-wait"><span class="lt-spin"></span></div></div>`;
  const el=S.el;
  $(el,'[data-back]').onclick=back;
  $(el,'[data-uz]').onclick=()=>{ S.set.uz=!S.set.uz; lsSet(LS_SET,S.set); $(el,'[data-uz]').classList.toggle('on',S.set.uz); el.classList.toggle('uz-on',S.set.uz); toast(S.set.uz?"Tarjima har xatboshi ostida ko'rinadi":"Tarjima yashirildi — kerakli xatboshini bosing"); };
  $(el,'[data-toc]').onclick=()=>tocSheet(w);
  $(el,'[data-set]').onclick=setSheet;
  el.classList.toggle('uz-on',S.set.uz);
  let body;
  try{ body=await fetchChap(id,idx); }catch(e){ body=undefined; }
  if(S.chIdx!==idx||!S.el) return;
  const sc=$(el,'#ltSc');
  if(!body){ sc.innerHTML=`<div class="lt-col"><div class="ll-empty">${body===null?"Bu bob Pro foydalanuvchilar uchun.":"Bob yuklanmadi. Internetni tekshiring."}<br><br>${body===null?`<button class="lt-cta" data-pro>Pro'ni ko'rish</button>`:`<button class="lt-cta" data-retry>Qayta urinish</button>`}</div></div>`;
    const b1=$(sc,'[data-pro]'); if(b1) b1.onclick=openPro; const b2=$(sc,'[data-retry]'); if(b2) b2.onclick=()=>renderRead(id,idx); return; }
  S.ch=body;
  const keys=glossKeys(body.gloss||[]);
  const qz=(p.quiz||{})[idx];
  const prev=w.toc[idx-1], next=w.toc[idx+1];
  sc.innerHTML=`<article class="lr-art f-${S.set.font}" style="--fs:${S.set.fs}px">
    <header class="lr-hd"><span>${c.part?c.part+'-qism · ':''}${idx+1}-bob</span><h1>${esc(c.title)}</h1><p>${esc(c.title_uz)} · ${mins(c.words)} daqiqa</p></header>
    ${w.edition==='study'&&idx===0?`<p class="lr-ed">O'quv nashri: asar mazmuni WordDrop qayta hikoyasida, asl matn emas.</p>`:''}
    <div class="lr-body">${(body.paras||[]).map((pp,i)=>`<div class="lr-p" data-i="${i}"><p class="lr-en">${markup(pp.en||'',keys)}</p>${pp.uz?`<p class="lr-uz">${esc(pp.uz)}</p><button class="lr-pt" data-pt="${i}" aria-label="Tarjima">${I.tr}</button>`:''}</div>`).join('')}</div>
    <p class="lr-hint">So'zni bosing — tarjimasi chiqadi. Belgilangan so'zlar bob lug'atida.</p>
    ${body.recap_uz?`<section class="lr-box"><h2>Qisqacha</h2><p>${esc(body.recap_uz)}</p></section>`:''}
    ${(body.gloss||[]).length?`<section class="lr-box"><div class="lr-bh"><h2>Bob lug'ati</h2><button class="lt-ghost sm" data-addall>${I.plus} Hammasini Takrorimga</button></div>
      <ul class="lr-gl">${body.gloss.map((g,i)=>`<li><button data-gi="${i}"><b>${esc(g.t)}</b><span>${esc(g.uz)}</span></button></li>`).join('')}</ul></section>`:''}
    ${(body.quiz||[]).length?`<section class="lr-box" id="lrQuiz"><div class="lr-bh"><h2>Tushunganingizni tekshiring</h2>${qz!=null?`<em class="lr-sc-b">${qz}/${body.quiz.length}</em>`:''}</div>
      ${body.quiz.map((q,qi)=>`<div class="lq" data-q="${qi}"><p>${qi+1}. ${esc(q.q)}</p><div class="lq-o">${q.o.map((o,oi)=>`<button data-o="${oi}">${esc(o)}</button>`).join('')}</div><p class="lq-why" hidden></p></div>`).join('')}</section>`:''}
    ${body.note_uz?`<section class="lr-box lr-note"><h2>Tahlil</h2><p>${esc(body.note_uz)}</p></section>`:''}
    <nav class="lr-nav">
      ${prev?`<button class="lr-nb" data-go="${idx-1}"><small>Oldingi bob</small><b>${esc(prev.title)}</b></button>`:'<span></span>'}
      ${next?`<button class="lr-nb nx" data-go="${idx+1}"><small>Keyingi bob${!next.free&&!isPro()?' · Pro':''}</small><b>${esc(next.title)}</b></button>`:`<button class="lr-nb nx" data-fin><small>Tamom</small><b>Asarni yakunlash</b></button>`}
    </nav>
  </article>`;
  // so'zlar
  sc.addEventListener('click',e=>{
    const g=e.target.closest('.lr-g'); if(g){ const it=body.gloss[+g.dataset.g]; wordSheet(g.textContent,it,sentenceOf(g)); return; }
    const wd=e.target.closest('.lr-w'); if(wd){ wordSheet(wd.textContent,null,sentenceOf(wd)); return; }
    const pt=e.target.closest('[data-pt]'); if(pt){ pt.parentElement.classList.toggle('show'); return; }
    const gi=e.target.closest('[data-gi]'); if(gi){ const it=body.gloss[+gi.dataset.gi]; wordSheet(it.t,it,it.ex||''); return; }
  });
  const aa=$(sc,'[data-addall]'); if(aa) aa.onclick=()=>{ let n=0; body.gloss.forEach(g=>{ if(addSrs(g.t,g.uz,g.ex,w,true)) n++; }); toast(n?`${n} ta so'z Takrorimga qo'shildi`:"Bu so'zlar Takrorimda allaqachon bor"); };
  // savollar
  const res=[];
  $$(sc,'.lq').forEach(box=>{ const qi=+box.dataset.q, q=body.quiz[qi];
    $$(box,'[data-o]').forEach(b=>b.onclick=()=>{ if(box.classList.contains('ans')) return; box.classList.add('ans');
      const oi=+b.dataset.o, ok=oi===q.a; res[qi]=ok;
      b.classList.add(ok?'ok':'bad'); if(!ok) $(box,`[data-o="${q.a}"]`).classList.add('ok');
      const why=$(box,'.lq-why'); why.hidden=false; why.innerHTML=`<b>${ok?"To'g'ri.":"Unday emas."}</b> ${esc(q.why_uz||'')}`;
      if(res.filter(x=>x!=null).length===body.quiz.length){ const s=res.filter(Boolean).length; p.quiz=p.quiz||{}; p.quiz[idx]=s; markDone(id,idx); saveProg(id,true);
        const h=$(sc,'#lrQuiz .lr-bh'); if(h&&!$(h,'.lr-sc-b')) h.insertAdjacentHTML('beforeend',`<em class="lr-sc-b">${s}/${body.quiz.length}</em>`);
        toast(s===body.quiz.length?"Barchasi to'g'ri — zo'r!":`${s}/${body.quiz.length} to'g'ri`); }
    }); });
  $$(sc,'[data-go]').forEach(b=>b.onclick=()=>{ markDone(id,idx); goChap(+b.dataset.go); });
  const fin=$(sc,'[data-fin]'); if(fin) fin.onclick=()=>{ markDone(id,idx); finishSheet(w); };
  // joyni tiklash va kuzatish
  const pos=sameChap?p.pos:0;
  requestAnimationFrame(()=>{ if(pos>0.02) sc.scrollTop=pos*(sc.scrollHeight-sc.clientHeight); trackScroll(sc,id); });
}
function sentenceOf(span){ const t=span.closest('.lr-en'); if(!t) return ''; const all=t.textContent, w=span.textContent;
  const parts=all.split(/(?<=[.!?])\s+/); return parts.find(s=>s.includes(w))||''; }
function markDone(id,idx){ const p=prog(id); p.done=p.done||[]; if(!p.done.includes(idx)) p.done.push(idx); saveProg(id,true); }
let scrollEl=null, scrollFn=null;
function trackScroll(sc,id){ stopScrollTrack(); scrollEl=sc;
  scrollFn=()=>{ const max=sc.scrollHeight-sc.clientHeight; const r=max>0?sc.scrollTop/max:1;
    const bar=S.el&&$(S.el,'#lrBar'); if(bar) bar.style.width=(r*100).toFixed(1)+'%';
    clearTimeout(S.scrollT); S.scrollT=setTimeout(()=>{ const p=prog(id); p.pos=r; if(r>0.97) markDone(id,S.chIdx); else saveProg(id,false); },400); };
  sc.addEventListener('scroll',scrollFn,{passive:true}); scrollFn(); }
function stopScrollTrack(){ if(scrollEl&&scrollFn) scrollEl.removeEventListener('scroll',scrollFn); scrollEl=null; scrollFn=null; }

/* ---------- so'z kartasi ---------- */
function addSrs(t,uz,ex,w,silent){
  if(!window.__wdSrsAdd){ if(!silent) toast("Takrorim hozircha mavjud emas"); return false; }
  const ok=window.__wdSrsAdd(t,uz,{ex:ex||'',src:'Adabiyot: '+w.title});
  try{ if(ok&&window.saveState) saveState(); }catch(e){}
  if(!silent) toast(ok?"Takrorimga qo'shildi":"Bu so'z Takrorimda allaqachon bor");
  return ok;
}
async function translate(word){
  const k=word.toLowerCase(), cache=ls(LS_TR,{});
  if(cache[k]) return cache[k];
  const fn=window.__wdTranslateWord||(typeof window.translateWordAI==='function'?window.translateWordAI:null);
  if(!fn) return null;
  try{ const r=await fn(k); if(r){ cache[k]=r; const ks=Object.keys(cache); if(ks.length>600) delete cache[ks[0]]; lsSet(LS_TR,cache); } return r; }catch(e){ return null; }
}
function wordSheet(word,item,sent){
  const w=S.work; const term=item?String(item.t).replace(/\s*\(.*?\)/g,''):word.replace(/[’]/g,"'");
  sheet(`<div class="ls-word"><div class="ls-wh"><b>${esc(term)}</b>${item&&item.t!==term?`<small>${esc(item.t)}</small>`:''}</div>
    <p class="ls-tr" id="lsTr">${item?esc(item.uz):'<span class="lt-spin sm"></span> Tarjima qilinmoqda…'}</p>
    ${sent?`<p class="ls-ex">${esc(sent)}</p>`:''}
    <div class="ls-row"><button class="lt-cta" data-add ${item?'':'disabled'}>${I.plus} Takrorimga qo'shish</button><button class="lt-ghost" data-ai>Drop AI'dan so'rash</button></div></div>`, async sh=>{
    let tr=item?item.uz:null;
    $(sh,'[data-add]').onclick=()=>{ if(tr){ addSrs(term,tr,sent,w); closeSheet(); } };
    $(sh,'[data-ai]').onclick=()=>{ closeSheet(); const q=`«${term}» so'zi quyidagi gapda nimani anglatadi? Gap: ${sent||term}`;
      askDrop(q); };
    if(!item){ tr=await translate(term); const el=$(sh,'#lsTr'); if(!el) return;
      if(tr){ el.textContent=tr; $(sh,'[data-add]').disabled=false; } else el.textContent="Tarjima topilmadi. Internetni tekshiring yoki Drop AI'dan so'rang."; }
  });
}

function askDrop(q){
  const D=window.__wdDropAI;
  if(!D||!D.open){ try{ navigator.clipboard.writeText(q); }catch(e){} toast("Savol nusxalandi — Drop AI'ga joylang"); return; }
  D.open(); setTimeout(()=>{ const inp=document.getElementById('drop-input'); if(inp){ inp.value=q; inp.dispatchEvent(new Event('input',{bubbles:true})); try{ inp.focus(); }catch(e){} } },350);
}
/* ---------- varaqlar (sheet) ---------- */
function sheet(html,bind){
  closeSheet();
  const sh=document.createElement('div'); sh.className='ls-wrap';
  sh.innerHTML=`<div class="ls-bg"></div><div class="ls" role="dialog"><i class="ls-grab"></i><button class="lt-ib ls-x" aria-label="Yopish">${I.x}</button>${html}</div>`;
  S.el.appendChild(sh); S.sheet=sh;
  requestAnimationFrame(()=>sh.classList.add('in'));
  $(sh,'.ls-bg').onclick=closeSheet; $(sh,'.ls-x').onclick=closeSheet;
  if(bind) bind(sh);
}
function closeSheet(){ const sh=S.sheet; if(!sh) return; S.sheet=null; sh.classList.remove('in'); setTimeout(()=>sh.remove(),220); }
function tocSheet(w){
  const p=prog(w.id), done=new Set(p.done||[]);
  sheet(`<h3 class="ls-h">${esc(w.title)}</h3><div class="ls-toc">${w.toc.map(c=>{ const lk=!c.free&&!isPro();
    return `<button class="lw-ch${done.has(c.idx)?' done':''}${lk?' lk':''}${c.idx===S.chIdx?' cur':''}" data-ch="${c.idx}"><i class="lw-n">${done.has(c.idx)?I.check:c.idx+1}</i><span><b>${esc(c.title)}</b><small>${esc(c.title_uz)}</small></span>${lk?`<em class="lw-lk">${I.lock}</em>`:''}</button>`; }).join('')}</div>`,
    sh=>$$(sh,'[data-ch]').forEach(b=>b.onclick=()=>{ closeSheet(); goChap(+b.dataset.ch); }));
}
function setSheet(){
  const s=S.set;
  sheet(`<h3 class="ls-h">Ko'rinish</h3>
    <div class="ls-set"><span>Matn o'lchami</span><div class="ls-fs"><button data-fs="-1" aria-label="Kichikroq">A</button><b id="lsFs">${s.fs}</b><button data-fs="1" aria-label="Kattaroq">A</button></div></div>
    <div class="ls-set"><span>Shrift</span><div class="ls-seg">${[['serif','Kitob'],['sans','Oddiy']].map(([k,l])=>`<button data-font="${k}" class="${s.font===k?'on':''}">${l}</button>`).join('')}</div></div>
    <div class="ls-set"><span>Fon</span><div class="ls-th">${[['auto','Ilova'],['light','Oq'],['paper',"Qog'oz"],['night','Tun']].map(([k,l])=>`<button data-th="${k}" class="t-${k}${s.theme===k?' on':''}"><i></i>${l}</button>`).join('')}</div></div>
    <div class="ls-set"><span>Tarjima</span><div class="ls-seg">${[[false,'Bosganda'],[true,'Doim']].map(([k,l])=>`<button data-uzm="${k}" class="${s.uz===k?'on':''}">${l}</button>`).join('')}</div></div>`, sh=>{
    const art=()=>S.el&&$(S.el,'.lr-art');
    $$(sh,'[data-fs]').forEach(b=>b.onclick=()=>{ s.fs=Math.max(15,Math.min(26,s.fs+(+b.dataset.fs))); $(sh,'#lsFs').textContent=s.fs; const a=art(); if(a) a.style.setProperty('--fs',s.fs+'px'); lsSet(LS_SET,s); });
    $$(sh,'[data-font]').forEach(b=>b.onclick=()=>{ s.font=b.dataset.font; $$(sh,'[data-font]').forEach(x=>x.classList.toggle('on',x===b)); const a=art(); if(a){ a.classList.remove('f-serif','f-sans'); a.classList.add('f-'+s.font); } lsSet(LS_SET,s); });
    $$(sh,'[data-th]').forEach(b=>b.onclick=()=>{ s.theme=b.dataset.th; $$(sh,'[data-th]').forEach(x=>x.classList.toggle('on',x===b)); applyTheme(); lsSet(LS_SET,s); });
    $$(sh,'[data-uzm]').forEach(b=>b.onclick=()=>{ s.uz=b.dataset.uzm==='true'; $$(sh,'[data-uzm]').forEach(x=>x.classList.toggle('on',x===b)); S.el.classList.toggle('uz-on',s.uz); const u=$(S.el,'[data-uz]'); if(u) u.classList.toggle('on',s.uz); lsSet(LS_SET,s); });
  });
}
function finishSheet(w){
  const p=prog(w.id); const qs=Object.values(p.quiz||{}); const ok=qs.reduce((a,b)=>a+b,0);
  sheet(`<div class="ls-lock">${cover(w,'s')}<h3>«${esc(w.title)}» tugadi</h3>
    <p>${(p.done||[]).length}/${w.toc.length} bob o'qildi${qs.length?`, savollarda ${ok} ta to'g'ri javob`:''}. Lug'atdagi so'zlar Takrorimda sizni kutadi.</p>
    <button class="lt-cta" data-lib>Kitob javoniga qaytish</button></div>`, sh=>{ $(sh,'[data-lib]').onclick=()=>{ closeSheet(); while(S.stack.length>1){ S.stack.pop(); try{ history.back(); }catch(e){} } }; });
}
function applyTheme(){ if(!S.el) return; let t=S.set.theme; if(t==='auto') t=document.body.classList.contains('dark')?'night':'light';
  S.el.classList.remove('th-light','th-paper','th-night'); S.el.classList.add('th-'+t); }

/* =====================================================================
   USLUBLAR
   ===================================================================== */
function css(){
  if(document.getElementById('ltCss')) return;
  const l=document.createElement('link'); l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;1,7..72,400&display=swap'; document.head.appendChild(l);
  const s=document.createElement('style'); s.id='ltCss'; s.textContent=`
.ltz{position:fixed;inset:0;z-index:3600;display:flex;flex-direction:column;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  --bg:#F4F4F1;--sur:#FFFFFF;--ink:#191A1C;--mut:#6B6E73;--line:#E3E3DE;--acc:#2F6FED;--accs:rgba(47,111,237,.1);--hl:rgba(242,179,61,.28);--uzc:#4C5A6A;
  background:var(--bg);color:var(--ink)}
.ltz.th-paper{--bg:#F3EBDD;--sur:#FBF6EC;--ink:#2B241B;--mut:#7A6D5B;--line:#E2D6C2;--hl:rgba(200,64,43,.16);--uzc:#6A5A45}
.ltz.th-night{--bg:#121417;--sur:#1A1D21;--ink:#E7E4DD;--mut:#9095A0;--line:#2A2E34;--acc:#7EA6FF;--accs:rgba(126,166,255,.14);--hl:rgba(242,179,61,.22);--uzc:#A9B4C2}
.ltz button{font-family:inherit;color:inherit;cursor:pointer}
.lt-top{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 10px 8px;background:var(--bg);border-bottom:1px solid var(--line);position:relative;z-index:2}
.lt-top>b{flex:1;min-width:0;font-size:16px;font-weight:700;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-top>b small{display:block;font-size:11px;font-weight:600;color:var(--mut);letter-spacing:0}
.lt-top>span{width:40px}
.lt-top .lr-acts{width:auto;display:flex;gap:2px}
.lt-ib{width:40px;height:40px;flex:0 0 auto;border:0;background:transparent;border-radius:12px;display:grid;place-items:center;color:var(--ink)}
.lt-ib svg{width:22px;height:22px}
.lt-ib:hover{background:var(--accs)}
.lt-ib.on{background:var(--accs);color:var(--acc)}
.lt-ib:focus-visible,.ltz button:focus-visible,.ltz input:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.lt-sc{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.lt-col{max-width:880px;margin:0 auto;padding:18px 18px calc(40px + env(safe-area-inset-bottom))}
.lt-wait,.lr-wait{flex:1;display:grid;place-items:center;min-height:50vh}
.lt-spin{width:28px;height:28px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--acc);animation:ltSpin .8s linear infinite;display:inline-block;vertical-align:middle}
.lt-spin.sm{width:15px;height:15px;border-width:2px;margin-right:6px}
@keyframes ltSpin{to{transform:rotate(360deg)}}
.lt-bar{display:block;height:4px;border-radius:4px;background:var(--line);overflow:hidden}
.lt-bar>i{display:block;height:100%;border-radius:4px;background:var(--acc)}
.lt-cta{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:14px;padding:13px 20px;font-size:15px;font-weight:700;background:var(--ink);color:var(--bg)!important;min-height:48px}
.lt-cta svg{width:18px;height:18px}
.lt-cta:disabled{opacity:.45;cursor:default}
.lt-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line);background:var(--sur);border-radius:14px;padding:12px 18px;font-size:14.5px;font-weight:600;min-height:46px}
.lt-ghost.sm{padding:7px 12px;min-height:34px;font-size:13px;border-radius:10px}
.lt-ghost svg{width:16px;height:16px}
.lt-tag{display:inline-block;font-style:normal;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--accs);color:var(--acc)}
.lt-tag.study{background:var(--hl);color:var(--ink)}
/* muqova */
.lc{position:relative;aspect-ratio:2/3;border-radius:6px 10px 10px 6px;background:var(--cb);color:var(--ci);overflow:hidden;box-shadow:inset 6px 0 0 rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.12),0 8px 22px -10px rgba(0,0,0,.35)}
.lc-art{position:absolute;inset:0;width:100%;height:100%}
.lc-t{position:absolute;left:10%;right:8%;top:8%;display:flex;flex-direction:column;gap:4px}
.lc-t b{font-family:'Instrument Serif',Georgia,serif;font-weight:400;line-height:.95;letter-spacing:-.5px}
.lc-t span{font-size:.62em;font-weight:700;letter-spacing:.3px;opacity:.8}
.lc-s{width:58px;font-size:9px}.lc-s .lc-t b{font-size:13px}.lc-s .lc-t span{display:none}
.lc-m{font-size:15px}
.lc-m .lc-t b{font-size:26px}
.lc-l{width:168px;font-size:17px}.lc-l .lc-t b{font-size:34px}
.lc-t b{overflow-wrap:break-word;hyphens:manual}.lc-m.lc-long .lc-t b{font-size:20px}.lc-l.lc-long .lc-t b{font-size:22px}.lc-s.lc-long .lc-t b{font-size:10px}
/* kutubxona */
.ll-hd{padding:10px 0 18px}
.ll-hd h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:46px;line-height:1;letter-spacing:-1px;margin:0 0 8px}
.ll-hd p{margin:0;color:var(--mut);font-size:15px;max-width:46ch}
.ll-cont{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1px solid var(--line);background:var(--sur);border-radius:18px;padding:12px 14px;margin-bottom:18px}
.ll-cont-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.ll-cont-t small{font-size:12px;font-weight:600;color:var(--acc)}
.ll-cont-t b{font-size:17px;font-weight:700}
.ll-cont-t span{font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-cont-t .lt-bar{margin-top:6px;max-width:240px}
.ll-cont em{color:var(--mut)}.ll-cont em svg{width:20px;height:20px}
.ll-tools{display:flex;flex-direction:column;gap:12px;margin-bottom:20px}
.ll-q{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--sur);border-radius:14px;padding:0 14px;height:46px;color:var(--mut)}
.ll-q svg{width:18px;height:18px;flex:0 0 auto}
.ll-q input{flex:1;border:0;background:transparent;font:inherit;font-size:15px;color:var(--ink);outline:0;min-width:0}
.ll-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.ll-chips::-webkit-scrollbar{display:none}
.ll-chip{flex:0 0 auto;border:1px solid var(--line);background:var(--sur);border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600}
.ll-chip.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.ll-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:26px 18px}
.ll-book{border:0;background:transparent;padding:0;text-align:left;display:flex;flex-direction:column;gap:6px;transition:transform .18s}
.ll-book:hover{transform:translateY(-3px)}
.ll-book>b{font-size:15px;font-weight:700;margin-top:6px;line-height:1.25}
.ll-book>span{font-size:12.5px;color:var(--mut)}
.ll-book>.lt-bar{margin-top:2px}
.ll-book>em{align-self:flex-start;margin-top:2px}
.ll-empty{padding:40px 10px;text-align:center;color:var(--mut);font-size:15px}
.ll-soon{margin:34px 0 0;padding-top:18px;border-top:1px dashed var(--line);font-size:13.5px;color:var(--mut)}
/* asar sahifasi */
.lw-hero{display:flex;gap:24px;align-items:flex-end;padding:8px 0 22px}
.lw-info{flex:1;min-width:0}
.lw-info h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:44px;line-height:1;letter-spacing:-1px;margin:0 0 6px}
.lw-uz{margin:0 0 4px;font-size:16px;font-weight:600}.lw-uz span{font-weight:400;color:var(--mut)}
.lw-by{margin:0 0 12px;color:var(--mut);font-size:14.5px}
.lw-facts{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.lw-facts>span:not(.lt-tag){font-size:12px;font-weight:600;color:var(--mut);padding:3px 8px;border:1px solid var(--line);border-radius:999px}
.lw-pg{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:12.5px;color:var(--mut)}.lw-pg .lt-bar{flex:1;max-width:200px}
.lw-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:14px}
.lw-tabs button{border:0;background:transparent;padding:12px 14px;font-size:15px;font-weight:600;color:var(--mut);border-bottom:2px solid transparent;margin-bottom:-1px}
.lw-tabs button.on{color:var(--ink);border-bottom-color:var(--ink)}
.lw-part{font-size:13px;font-weight:700;color:var(--mut);margin:18px 4px 6px}
.lw-ch{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:0;background:transparent;border-radius:14px;padding:10px 8px}
.lw-ch:hover{background:var(--sur)}
.lw-ch.cur{background:var(--sur);box-shadow:inset 3px 0 0 var(--acc)}
.lw-n{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:13px;font-weight:700;border:1px solid var(--line);background:var(--sur);font-variant-numeric:tabular-nums}
.lw-ch.done .lw-n{background:var(--acc);border-color:var(--acc);color:#fff}
.lw-n svg{width:16px;height:16px}
.lw-ch>span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lw-ch b{font-size:15px;font-weight:600}
.lw-ch small{font-size:12.5px;color:var(--mut)}
.lw-ch.lk b{color:var(--mut)}
.lw-lk{color:var(--mut)}.lw-lk svg{width:17px;height:17px}
.lw-free{font-style:normal;font-size:11px;font-weight:700;color:#1F8A4C;background:rgba(31,138,76,.1);padding:3px 8px;border-radius:999px}
.lw-pro{margin-top:18px;border-radius:18px;padding:18px;background:var(--ink);color:var(--bg)}
.lw-pro b{font-size:16px}.lw-pro p{margin:6px 0 14px;font-size:14px;opacity:.8;line-height:1.5}
.lw-pro button{border:0;border-radius:12px;padding:11px 18px;font-weight:700;background:var(--bg);color:var(--ink)!important}
.lw-pane h3{font-size:13px;font-weight:700;color:var(--mut);margin:22px 0 8px}
.lw-pane p{font-size:15.5px;line-height:1.65;margin:0}
.lw-lead{font-family:'Literata',Georgia,serif;font-size:17.5px!important;line-height:1.6!important}
.lw-dl{margin:0;display:grid;grid-template-columns:minmax(110px,max-content) 1fr;gap:10px 16px;font-size:14.5px;line-height:1.55}
.lw-dl dt{font-weight:700}.lw-dl dd{margin:0;color:var(--uzc)}
.lw-note{margin-top:24px;border:1px solid var(--line);border-radius:16px;padding:14px 16px;background:var(--sur)}
.lw-note b{font-size:14px}.lw-note p{font-size:14px!important;color:var(--mut);margin-top:4px!important}
/* o'quvchi */
.lr-top{padding-bottom:10px}
.lr-prog{position:absolute;left:0;right:0;bottom:-1px;height:2px;background:transparent}
.lr-prog>i{display:block;height:100%;width:0;background:var(--acc);transition:width .15s linear}
.lr-art{max-width:680px;margin:0 auto;padding:26px 22px calc(60px + env(safe-area-inset-bottom));--fs:19px}
.lr-hd{margin-bottom:26px}
.lr-hd span{font-size:12.5px;font-weight:700;color:var(--acc)}
.lr-hd h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:42px;line-height:1.02;letter-spacing:-.8px;margin:6px 0 6px}
.lr-hd p{margin:0;color:var(--mut);font-size:14px}
.lr-ed{font-size:13px;color:var(--mut);border-left:3px solid var(--hl);padding:2px 0 2px 10px;margin:-10px 0 22px}
.lr-body{font-size:var(--fs)}
.f-serif .lr-en{font-family:'Literata',Georgia,serif;line-height:1.72}
.f-sans .lr-en{font-family:'Inter',system-ui,sans-serif;line-height:1.66}
.lr-p{position:relative;margin:0 0 1.1em}
.lr-en{margin:0;font-size:1em;hyphens:auto;-webkit-hyphens:auto}
.lr-w{cursor:pointer;border-radius:3px}
.lr-w:hover{background:var(--accs)}
.lr-g{cursor:pointer;background:linear-gradient(transparent 62%,var(--hl) 62%);border-radius:2px}
.lr-uz{display:none;margin:.45em 0 0;font-family:'Inter',system-ui,sans-serif;font-size:.8em;line-height:1.6;color:var(--uzc);padding-left:12px;border-left:2px solid var(--line)}
.uz-on .lr-uz,.lr-p.show .lr-uz{display:block}
.lr-pt{position:absolute;right:-40px;top:2px;width:30px;height:30px;border:0;background:transparent;border-radius:8px;color:var(--mut);opacity:.55;display:grid;place-items:center}
.lr-pt svg{width:17px;height:17px}.lr-pt:hover{opacity:1;background:var(--accs);color:var(--acc)}
.uz-on .lr-pt{display:none}
.lr-hint{font-size:12.5px;color:var(--mut);text-align:center;margin:26px 0}
.lr-box{border-top:1px solid var(--line);padding:22px 0 6px;margin-top:8px}
.lr-box h2{font-size:17px;font-weight:700;margin:0 0 10px}
.lr-box>p{font-size:15.5px;line-height:1.65;margin:0;color:var(--uzc)}
.lr-bh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.lr-bh h2{margin:0}
.lr-gl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.lr-gl button{width:100%;text-align:left;border:1px solid var(--line);background:var(--sur);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.lr-gl b{font-size:15px}.lr-gl span{font-size:13px;color:var(--mut)}
.lr-sc-b{font-style:normal;font-weight:800;font-size:14px;color:var(--acc);background:var(--accs);padding:4px 10px;border-radius:999px}
.lq{margin:0 0 18px}.lq>p{font-size:15.5px;font-weight:600;margin:0 0 8px;line-height:1.45}
.lq-o{display:grid;gap:7px}
.lq-o button{text-align:left;border:1px solid var(--line);background:var(--sur);border-radius:12px;padding:11px 13px;font-size:14.5px;line-height:1.4;transition:border-color .15s,background .15s}
.lq-o button:hover{border-color:var(--mut)}
.lq.ans .lq-o button{cursor:default}
.lq-o button.ok{border-color:#1F8A4C;background:rgba(31,138,76,.1)}
.lq-o button.bad{border-color:#D23B3B;background:rgba(210,59,59,.09)}
.lq-why{font-weight:400!important;font-size:14px!important;line-height:1.55;color:var(--uzc);margin:8px 2px 0}
.lr-note p{font-family:'Literata',Georgia,serif;color:var(--ink)!important}
.lr-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:30px}
.lr-nb{border:1px solid var(--line);background:var(--sur);border-radius:16px;padding:13px 15px;text-align:left;display:flex;flex-direction:column;gap:3px;min-height:64px}
.lr-nb.nx{text-align:right;background:var(--ink);color:var(--bg)!important;border-color:var(--ink)}
.lr-nb small{font-size:12px;opacity:.7}.lr-nb b{font-size:14.5px}
/* varaqlar */
.ls-wrap{position:absolute;inset:0;z-index:5}
.ls-bg{position:absolute;inset:0;background:rgba(10,12,16,.38);opacity:0;transition:opacity .2s}
.ls{position:absolute;left:50%;bottom:0;width:min(560px,100%);max-height:86vh;overflow:auto;transform:translate(-50%,100%);transition:transform .26s cubic-bezier(.2,.8,.2,1);background:var(--sur);color:var(--ink);border-radius:22px 22px 0 0;padding:14px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px -10px rgba(0,0,0,.3)}
.ls-wrap.in .ls-bg{opacity:1}.ls-wrap.in .ls{transform:translate(-50%,0)}
.ls-grab{display:block;width:40px;height:4px;border-radius:4px;background:var(--line);margin:0 auto 6px}
.ls-x{position:absolute;right:10px;top:10px}
.ls-h{font-size:18px;font-weight:700;margin:6px 0 14px}
.ls-toc{display:flex;flex-direction:column}
.ls-word{padding-top:6px}
.ls-wh b{font-family:'Literata',Georgia,serif;font-size:30px;font-weight:600}
.ls-wh small{margin-left:8px;color:var(--mut);font-size:14px}
.ls-tr{font-size:19px;font-weight:600;color:var(--acc);margin:6px 0 10px}
.ls-ex{font-family:'Literata',Georgia,serif;font-size:15px;line-height:1.6;color:var(--mut);border-left:3px solid var(--hl);padding-left:10px;margin:0 0 16px}
.ls-row{display:flex;gap:8px;flex-wrap:wrap}.ls-row>*{flex:1 1 180px}
.ls-lock{text-align:center;padding:10px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:10px}
.ls-lock h3{font-size:20px;margin:4px 0 0}.ls-lock p{margin:0 0 6px;color:var(--mut);font-size:14.5px;line-height:1.55;max-width:40ch}
.ls-lock .lt-cta,.ls-lock .lt-ghost{width:100%;max-width:340px}
.ls-li{width:56px;height:56px;border-radius:18px;background:var(--hl);display:grid;place-items:center}.ls-li svg{width:26px;height:26px}
.ls-set{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
.ls-set>span{font-size:14.5px;font-weight:600}
.ls-fs{display:flex;align-items:center;gap:6px}
.ls-fs button{width:42px;height:38px;border:1px solid var(--line);background:var(--bg);border-radius:10px;font-weight:700}
.ls-fs button:first-child{font-size:13px}.ls-fs button:last-child{font-size:19px}
.ls-fs b{min-width:30px;text-align:center;font-variant-numeric:tabular-nums}
.ls-seg{display:flex;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:3px}
.ls-seg button{border:0;background:transparent;border-radius:9px;padding:7px 12px;font-size:13.5px;font-weight:600}
.ls-seg button.on{background:var(--sur);box-shadow:0 1px 3px rgba(0,0,0,.15)}
.ls-th{display:flex;gap:6px}
.ls-th button{border:1px solid var(--line);background:transparent;border-radius:12px;padding:6px 8px;font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:54px}
.ls-th button i{width:26px;height:26px;border-radius:50%;border:1px solid rgba(0,0,0,.15)}
.ls-th .t-auto i{background:linear-gradient(135deg,#fff 50%,#1A1D21 50%)}.ls-th .t-light i{background:#fff}.ls-th .t-paper i{background:#F3EBDD}.ls-th .t-night i{background:#1A1D21}
.ls-th button.on{border-color:var(--acc);color:var(--acc)}
@media (max-width:820px){ .lr-pt{position:static;display:inline-grid;width:auto;height:auto;padding:4px 0;opacity:.6;margin-top:2px} .lr-pt::after{content:'Tarjima';font-size:12.5px;font-weight:600;margin-left:5px} .lr-pt{grid-auto-flow:column;align-items:center} }
@media (max-width:560px){
  .ll-hd h1{font-size:38px}
  .ll-grid{grid-template-columns:repeat(2,1fr);gap:22px 14px}
  .lw-hero{flex-direction:column;align-items:flex-start;gap:16px}
  .lc-l{width:130px}.lc-l .lc-t b{font-size:27px}.lc-l.lc-long .lc-t b{font-size:17px}
  .lw-info h1{font-size:36px}
  .lw-info .lt-cta{width:100%}
  .lr-art{padding:20px 18px 60px}
  .lr-hd h1{font-size:34px}
  .lw-dl{grid-template-columns:1fr;gap:2px}.lw-dl dd{margin-bottom:10px}
  .lr-nav{grid-template-columns:1fr}
}
body.lit-open #drop-overlay{z-index:3700}
@media (prefers-reduced-motion:reduce){ .ltz *{transition:none!important;animation:none!important} }
`;
  document.head.appendChild(s);
}

window.WDLit={open,close};
})();
