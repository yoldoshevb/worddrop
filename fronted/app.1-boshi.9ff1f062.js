
/* ========== 1. BOSHI — MAP ========== */
const TOTAL_LEVELS=120;
const LEVELS=[];
for(let i=1;i<=TOTAL_LEVELS;i++) LEVELS.push({id:i,kind:'game'});
function levelTitle(id){
  if(id===1) return "So'z qutisi";
  const g=window.__wdGenLevels && window.__wdGenLevels[id];
  return (g && g.theme) ? g.theme : `${id}-bosqich`;
}
let completedLevels=new Set(SAVED_STATE.completedLevels||[]);
function isUnlocked(id){return id===1||completedLevels.has(id-1)}

/* ---------- TANGA IQTISODI + DO'KON ---------- */
const COIN_SVG=`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wdcg" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#FFD86B"/><stop offset="1" stop-color="#E09B1F"/></linearGradient></defs><circle cx="12" cy="12" r="10.2" fill="url(#wdcg)" stroke="#B8720E" stroke-width="1.1"/><circle cx="12" cy="12" r="7.6" fill="#FFC94D" stroke="#C97F12" stroke-width="0.9"/><path d="M7.6 9 L9.4 15.6 L12 10.9 L14.6 15.6 L16.4 9" fill="none" stroke="#7A4A08" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 1.8 A10.2 10.2 0 0 1 21 7 L18.4 8.4 A7.3 7.3 0 0 0 12 4.7 Z" fill="#FFFFFF" opacity="0.42"/><path d="M18.6 4.2 L19.1 5.3 L20.2 5.8 L19.1 6.3 L18.6 7.4 L18.1 6.3 L17 5.8 L18.1 5.3 Z" fill="#FFF6DC"/></svg>`;
const LOCK_SVG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5 V8 a4 4 0 0 1 8 0 v2.5"/></svg>`;
const HOME_SVG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 L12 4 L20 10.5 V19 a1.5 1.5 0 0 1 -1.5 1.5 H5.5 A1.5 1.5 0 0 1 4 19 Z"/><path d="M9.5 20.5 V14 h5 v6.5"/></svg>`;

const SHOP_LG=1; /* Kumush ligasi — 5-daraja (yangi liga chegaralariga moslangan) */
const SHOP_ITEMS=[]; /* v111: xona jihozlari olib tashlandi */
function shopItem(id){ return SHOP_ITEMS.find(x=>x.id===id); }
window.__wdShopItems=SHOP_ITEMS; window.__wdShopCoinSvg=COIN_SVG;
/* --- PREMIUM bo'lim: jihoz emas, imkoniyatlar --- */

const PREM_ITEMS=[
  {id:'freeze', nm:'Streak muzlatgich', price:200, lg:0, type:'stock', max:2,
   desc:"Bir kun kirolmasangiz streak o'zi saqlanadi. Zaxirada 2 tagacha.",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2 V22 M4 6 L20 18 M20 6 L4 18 M12 5 L9.5 7 M12 5 L14.5 7 M12 19 L9.5 17 M12 19 L14.5 17 M5.6 7.2 L8.6 8 M5.6 7.2 L5.9 10.2 M18.4 16.8 L15.4 16 M18.4 16.8 L18.1 13.8 M18.4 7.2 L15.4 8 M18.4 7.2 L18.1 10.2 M5.6 16.8 L8.6 16 M5.6 16.8 L5.9 13.8"/></svg>`},
  {id:'mbox', nm:'Sirli quti', price:100, lg:0, type:'action',
   desc:"Ichida nima borligini hech kim bilmaydi: 30–300 WC, detektiv kaliti yoki muzlatgich.",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7 H21 V10 H3 Z M12 7 V20 M12 7 C10 7 8 6 8 4.5 C8 3 10 3 12 5 C14 3 16 3 16 4.5 C16 6 14 7 12 7"/></svg>`},
  {id:'bet', nm:'Duel garovi', price:150, lg:0, type:'unlock',
   desc:"Duelda 20 WC tikish imkoni ochiladi — g'olib hammasini oladi (raqib ham yoqqan bo'lsa).",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="9" r="5.5"/><circle cx="15" cy="15" r="5.5"/><path d="M7 9 C7.5 7.5 10.5 7.5 11 9"/></svg>`},
  {id:'frames', nm:'Profil ramkalari', price:15, lg:0, type:'unlock',
   desc:"Avatar atrofiga oltin, olov yoki neon ramka (profilda tanlanadi).",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="6"/><path d="M12 2.5 L13 5 M21.5 12 L19 13 M12 21.5 L11 19 M2.5 12 L5 11 M18.7 5.3 L16.6 6.6 M18.7 18.7 L16.6 17.4 M5.3 18.7 L7.4 17.4 M5.3 5.3 L7.4 6.6"/></svg>`},
  {id:'fx', nm:'Duel kirish effekti', price:15, lg:0, type:'unlock',
   desc:"Duel boshlanishida ismingiz neon chaqnash bilan chiqadi.",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z"/></svg>`},
  {id:'boost', nm:'XP Booster (2x)', price:250, lg:0, type:'action',
   desc:"30 daqiqa davomida barcha XP ikki barobar. Darhol ishga tushadi.",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15 C5 9 8 4 12 3 C16 4 19 9 19 15 L15.5 17.5 H8.5 Z"/><circle cx="12" cy="10" r="2"/><path d="M8.5 17.5 L7 21 M15.5 17.5 L17 21 M12 17.5 V21"/></svg>`},
  {id:'wheel', nm:'Omad g\'ildiragi', price:60, lg:0, type:'action',
   desc:"Aylantirib mukofot yutib oling: 20–500 WC, 2x XP yoki detektiv kaliti. Har 6 soatda bir marta bepul.",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3 V12 M12 12 L18.4 8 M12 12 L18.4 16 M12 12 L5.6 16 M12 12 L5.6 8"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>`},
  {id:'namecolor', nm:'Ism rangi', price:120, lg:0, type:'unlock',
   desc:"Reytingda ismingiz oltin, olov yoki neon rangda tovlanadi (profilda tanlanadi).",
   ic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20 H18 M12 4 L7 16 H17 L12 4 Z M9 12 H15"/><circle cx="19" cy="7" r="2" fill="currentColor" stroke="none"/></svg>`}
];
function premOwn(id){ const R=window.__wdRoom||{inv:{}}; return (R.inv&&R.inv[id])||0; }
window.__wdPremOwn=premOwn;
/* Sirli quti mukofoti */
function mboxRoll(){
  const r=Math.random(), lg=shopLeague();
  if(r<0.44) return {t:'coins', n:30+Math.floor(Math.random()*51)};
  if(r<0.56) return {t:'dettok'};
  if(r<0.70) return {t:'coins', n:100+Math.floor(Math.random()*61)};
  if(r<0.80) return {t:'coins', n:200+Math.floor(Math.random()*101)};
  if(r<0.95) return {t:'coins', n:120+Math.floor(Math.random()*61)};
  if(premOwn('freeze')<2) return {t:'freeze'};
  return {t:'coins', n:150};
}

/* ===== MUKOFOT SAHNASI — do'kondagi barcha mukofotlar uchun yagona, sokin ko'rinish ===== */
const RW_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function rwFmt(n){ return String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' '); }
function rwBal(){ const b=document.getElementById('rwBal'); if(b) b.innerHTML=`${COIN_SVG}<span>${rwFmt(coinsView())}</span>`; }
/* Sahnani ochadi; onClose — yopilgandan keyin */
function rwScene(onClose){
  const old=document.getElementById('rwScene'); if(old) old.remove();
  document.querySelectorAll('.rvl,#fishRvl').forEach(e=>e.remove());
  const el=document.createElement('div'); el.id='rwScene'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.innerHTML=`<div class="rw-top"><button class="rw-x" id="rwX" aria-label="Yopish">${RW_X}</button><div class="rw-bal" id="rwBal"></div></div>
    <div class="rw-body"><div class="rw-col" id="rwCol"></div></div>`;
  document.body.appendChild(el);
  rwBal();
  requestAnimationFrame(()=>el.classList.add('on'));
  let closed=false;
  const close=()=>{ if(closed) return; closed=true; try{ SFX.stop('box'); }catch(e){} el.classList.remove('on');
    setTimeout(()=>{ el.remove(); if(typeof onClose==='function'){ try{ onClose(); }catch(e){} } },260); };
  el.querySelector('#rwX').addEventListener('click',close);
  return { el, col:el.querySelector('#rwCol'), close, set locked(v){ el.querySelector('#rwX').disabled=!!v; } };
}
/* Ochilish (kutish) bosqichi */
function rwOpening(sc, tone, icon, text){
  sc.col.innerHTML=`<div class="rw-open rw-tone-${tone}"><div class="rw-box">${icon}</div><div class="rw-ot">${text}</div><div class="rw-prog"><i></i></div></div>`;
}
/* Natija kartasi */
function rwCard(sc, o){
  const SP='<svg viewBox="0 0 24 24"><path d="M12 1.5c.6 4.6 2.4 7.8 10.5 10.5C14.4 14.7 12.6 17.4 12 22.5 11.4 17.4 9.6 14.7 1.5 12 9.6 9.3 11.4 6.1 12 1.5Z" fill="currentColor"/></svg>';
  const sparks = o.quiet ? '' : `<span class="sp">${SP}</span><span class="sp">${SP}</span><span class="sp">${SP}</span><span class="sp">${SP}</span>`;
  const media = `<div class="rw-hero">${sparks}${o.img ? `<div class="rw-ic img"><img src="${o.img}" alt=""></div>` : `<div class="rw-ic">${o.icon||''}</div>`}</div>`;
  const rar = {Oddiy:'r-common',Yaxshi:'r-good',Noyob:'r-rare',Jackpot:'r-jp'}[o.chip]||'';
  const head = o.amount!=null
    ? `<div class="rw-amt">${o.unit==='WC'||!o.unit?`<span class="coin">${COIN_SVG}</span>`:''}<b id="rwAmt">0</b><span>${o.unit||'WC'}</span></div>`
    : `<div class="rw-nm">${escapeHtml(o.title||'')}</div>`;
  const meta=(o.meta||[]).map(([k,v])=>`<div><span>${escapeHtml(k)}</span><b>${escapeHtml(String(v))}</b></div>`).join('');
  sc.col.innerHTML=`<div class="rw-card rw-tone-${o.tone||'blue'}">
      <div class="rw-kick">${escapeHtml(o.kicker||'')}</div>
      ${media}
      ${o.chip?`<div class="rw-chip ${rar}"><i></i>${escapeHtml(o.chip)}</div>`:''}
      ${head}
      ${o.sub?`<div class="rw-sub">${escapeHtml(o.sub)}</div>`:''}
      ${meta?`<div class="rw-meta">${meta}</div>`:''}
    </div>
    <div class="rw-btns">
      <button class="rw-btn" id="rwOk">${escapeHtml(o.ok||'Davom etish')}</button>
      ${o.alt?`<button class="rw-btn2" id="rwAlt" ${o.alt.disabled?'disabled':''}>${escapeHtml(o.alt.label)}</button>`:''}
    </div>`;
  rwBal();
  sc.el.style.setProperty('--tbg', getComputedStyle(sc.col.querySelector('.rw-card')).getPropertyValue('--t1'));
  if(o.amount!=null){ const a=document.getElementById('rwAmt'); const t0=performance.now(), to=o.amount;
    const st=t=>{ const k=Math.min(1,(t-t0)/650), e=1-Math.pow(1-k,3); a.textContent='+'+rwFmt(to*e); if(k<1) requestAnimationFrame(st); };
    setTimeout(()=>requestAnimationFrame(st),180); }
  document.getElementById('rwOk').addEventListener('click',()=>sc.close());
  if(o.alt){ const b=document.getElementById('rwAlt'); if(b) b.addEventListener('click',()=>o.alt.fn()); }
  try{ SFX.play('reward'); }catch(e){}
  try{ navigator.vibrate&&navigator.vibrate(30); }catch(e){}
}
function rwHomeRefresh(){
  try{
    const box=screens.home&&screens.home.querySelector('.sscroll'); const keep=box?box.scrollTop:0;
    renderHome();
    const nb=screens.home&&screens.home.querySelector('.sscroll'); if(nb) nb.scrollTop=keep;
  }catch(e){}
}
function rwTimeHM(ms){ const d=new Date(ms); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

/* Yumshoq ochilish ovozi (WebAudio): qog'oz shitirlashi + uch notali qo'ng'iroqcha */
function rwChime(){
  try{ if(window.__wdSoundOn===false) return; const A=window.__rwAC||(window.__rwAC=new (window.AudioContext||window.webkitAudioContext)()); if(A.state==='suspended') A.resume();
    const t0=A.currentTime+.05, out=A.createGain(); out.gain.value=.22; out.connect(A.destination);
    const len=A.sampleRate*.5, nb=A.createBuffer(1,len,A.sampleRate), d=nb.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2)*.35;
    const ns=A.createBufferSource(); ns.buffer=nb; const hp=A.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=2500; ns.connect(hp); hp.connect(out); ns.start(t0);
    [[1046.5,.55],[1318.5,.75],[1568,.95],[2093,1.2]].forEach(([f,dt],i)=>{ const o=A.createOscillator(), g=A.createGain(); o.type='sine'; o.frequency.value=f;
      const st=t0+dt; g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(i===3?.18:.3,st+.012); g.gain.exponentialRampToValueAtTime(.0008,st+(i===3?1.4:.7));
      o.connect(g); g.connect(out); o.start(st); o.stop(st+1.5); });
  }catch(e){}
}
/* ----- Sirli quti ----- */
function mboxOpen(){
  const sc=rwScene(rwHomeRefresh); sc.locked=true;
  const boxIc=PREM_ITEMS.find(x=>x.id==='mbox').ic;
  rwOpening(sc,'gold',boxIc,'Quti ochilmoqda…');
  rwChime();
  setTimeout(()=>{
    sc.locked=false;
    const rw=mboxRoll(); const o={kicker:'Sirli quti', ok:'Davom etish'};
    if(rw.t==='coins'){
      addCoins(rw.n,true);
      Object.assign(o,{tone:'gold', icon:COIN_SVG, amount:rw.n, unit:'WC', chip: rw.n>=200?'Noyob':(rw.n>=100?'Yaxshi':'Oddiy'), quiet:rw.n<100, sub:"Balansingizga qo'shildi"});
    } else if(rw.t==='dettok'){
      const n=detTokens(1);
      Object.assign(o,{tone:'blue', icon:detMascot(58), title:'Detektiv ishi kaliti', chip:'Noyob', sub:"Ingliz detektivida bitta AI tergov ishini bepul ochadi", meta:[['Kalitlaringiz',n+' ta']]});
    } else {
      window.__wdRoom.inv.freeze=(window.__wdRoom.inv.freeze||0)+1;
      Object.assign(o,{tone:'ice', icon:RWD_IC.freeze, title:'Streak muzlatgich', chip:'Noyob', sub:"Bir kun kirolmasangiz, streak saqlanib qoladi", meta:[['Zaxirada',premOwn('freeze')+' / 2']]});
    }
    try{ saveState(); }catch(e){}
    const price=PREM_ITEMS.find(x=>x.id==='mbox').price;
    o.meta=(o.meta||[]).concat([['Balans',rwFmt(coinsView())+' WC']]);
    o.alt={label:`Yana ochish · ${price} WC`, disabled:coinsView()<price, fn:()=>{
      if(coinsView()<price) return;
      window.__wdCoins=Math.max(0,(window.__wdCoins||0)-price); try{ saveState(); }catch(e){}
      mboxOpen();
    }};
    rwCard(sc,o);
  },1400);
}

/* ----- XP Booster — xarid tasdig'i ----- */
function rwBoost(){
  const sc=rwScene(rwHomeRefresh);
  rwCard(sc,{kicker:'XP Booster', tone:'coral', icon:RWD_IC.boost, title:'2x XP yoqildi', sub:'30 daqiqa davomida topgan barcha XP ikki barobar hisoblanadi',
    meta:[['Tugash vaqti',rwTimeHM(window.__wdBoostUntil||Date.now())]]});
}
/* ----- Omad g'ildiragi ----- */
const WHEEL_COOLDOWN=6*3600*1000; // 6 soat
function wheelFree(){ return (Date.now()-(window.__wdWheelLast||0)) >= WHEEL_COOLDOWN; }
window.__wdWheelFree=wheelFree;
/* Mukofot SVG ikonlari (emoji o'rniga) */
const RWD_IC={
  boost:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rwbst" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#FDA4AF"/><stop offset="1" stop-color="#E4484E"/></linearGradient></defs><path d="M13 2 L4 14 h6 l-1 8 l9-12 h-6 Z" fill="url(#rwbst)" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/></svg>`,
  jackpot:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rwjp" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><path d="M5 8 h14 l-1.5 11 a2 2 0 0 1-2 1.8 h-7 a2 2 0 0 1-2-1.8 Z" fill="url(#rwjp)" stroke="#B45309" stroke-width="1"/><path d="M4 5.5 h16 v2.5 h-16 Z" rx="1" fill="#FCD34D" stroke="#B45309" stroke-width="1"/><path d="M12 8 v12" stroke="#B45309" stroke-width="1" opacity="0.5"/><circle cx="12" cy="4" r="2" fill="#FCD34D" stroke="#B45309" stroke-width="1"/></svg>`,
  freeze:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M12 2 V22 M2 12 H22 M4.9 4.9 L19.1 19.1 M19.1 4.9 L4.9 19.1"/><path d="M12 6 l-2 2 M12 6 l2 2 M12 18 l-2-2 M12 18 l2-2 M6 12 l2-2 M6 12 l2 2 M18 12 l-2-2 M18 12 l-2 2"/></g></svg>`,
};
// Sektorlar teng burchakli, ehtimol og'irlik bilan (wheelPickIndex)
const WHEEL_SEGMENTS=[
  {t:'coins', n:20,  f:'#FFFFFF', tx:'#1B4FCB'},
  {t:'coins', n:80,  f:'#E8F0FF', tx:'#1B4FCB'},
  {t:'coins', n:40,  f:'#FFFFFF', tx:'#1B4FCB'},
  {t:'boost',        f:'#FFEBE5', tx:'#C2412D'},
  {t:'coins', n:150, f:'#FFF4DB', tx:'#9A5B00'},
  {t:'coins', n:30,  f:'#FFFFFF', tx:'#1B4FCB'},
  {t:'jackpot',n:500,f:'#F5B83D', tx:'#4A2A00'},
  {t:'coins', n:60,  f:'#E8F0FF', tx:'#1B4FCB'},
  {t:'dettok',       f:'#1E2A44', tx:'#F0B44C'},
];
function wheelPickIndex(){
  const w=[17,9,14,9,7,15,2,14,7];   // jackpot kam, kichik mukofotlar ko'p; detektiv kaliti — 7%
  let tot=w.reduce((a,b)=>a+b,0), r=Math.random()*tot;
  for(let i=0;i<w.length;i++){ if((r-=w[i])<0) return i; }
  return 0;
}
function wheelSvg(){
  const N=WHEEL_SEGMENTS.length, R=118, cx=130, cy=130, step=360/N;
  let paths='';
  for(let i=0;i<N;i++){
    const seg=WHEEL_SEGMENTS[i];
    const a0=(i*step-90)*Math.PI/180, a1=((i+1)*step-90)*Math.PI/180;
    const x0=cx+R*Math.cos(a0), y0=cy+R*Math.sin(a0), x1=cx+R*Math.cos(a1), y1=cy+R*Math.sin(a1);
    const am=((i+0.5)*step-90)*Math.PI/180, tx=cx+R*0.66*Math.cos(am), ty=cy+R*0.66*Math.sin(am), rot=(i+0.5)*step;
    paths+=`<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${seg.f}" stroke="#DCE3EE" stroke-width="1.5"/>`;
    const big=seg.t==='boost'?'2x':seg.t==='dettok'?'KALIT':String(seg.n), sub=seg.t==='boost'?'XP':seg.t==='dettok'?'DETEKTIV':(seg.t==='jackpot'?'JACKPOT':'WC');
    paths+=`<g transform="rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">
      <text x="${tx.toFixed(1)}" y="${(ty+1).toFixed(1)}" font-size="${seg.t==='jackpot'?17:seg.t==='dettok'?12:16}" font-weight="800" fill="${seg.tx}" text-anchor="middle" font-family="Inter,sans-serif">${big}</text>
      <text x="${tx.toFixed(1)}" y="${(ty+11).toFixed(1)}" font-size="6.5" font-weight="800" fill="${seg.tx}" opacity=".65" text-anchor="middle" letter-spacing=".6" font-family="Inter,sans-serif">${sub}</text></g>`;
  }
  let dots='';
  for(let i=0;i<N*2;i++){ const a=(i*step/2-90)*Math.PI/180;
    dots+=`<circle cx="${(cx+(R+6.5)*Math.cos(a)).toFixed(1)}" cy="${(cy+(R+6.5)*Math.sin(a)).toFixed(1)}" r="${i%2?1.6:2.3}" fill="#fff" opacity="${i%2?.55:.9}"/>`; }
  return `<svg viewBox="0 0 260 260" aria-hidden="true">
    <circle cx="130" cy="130" r="${R+12}" fill="#2F6FED"/>${dots}
    <circle cx="130" cy="130" r="${R+1}" fill="#DCE3EE"/>${paths}
    <circle cx="130" cy="130" r="24" fill="#fff" stroke="#DCE3EE" stroke-width="2"/>
    <circle cx="130" cy="130" r="8" fill="#2F6FED"/></svg>`;
}
function wheelOpen(wasFree){
  const sc=rwScene(rwHomeRefresh);
  const price=(PREM_ITEMS.find(x=>x.id==='wheel')||{}).price||60;
  sc.col.innerHTML=`<div class="rw-open">
      <div class="rw-kick">Omad g'ildiragi</div>
      <div class="rw-wh-h" style="margin-top:6px">${wasFree?'Bepul aylantirish':'Aylantirishga tayyor'}</div>
      <div class="rw-wh-p">20–500 WC, 2x XP yoki detektiv ishi kaliti</div>
      <div class="rw-wheel">
        <div class="rw-ptr"><svg viewBox="0 0 26 30"><path d="M13 29 2.5 6.5A11 11 0 0 1 13 1a11 11 0 0 1 10.5 5.5Z" fill="#12172B"/><circle cx="13" cy="10" r="3.6" fill="#fff"/></svg></div>
        <div class="disc" id="wheelSpin">${wheelSvg()}</div>
      </div>
      <button class="rw-btn" id="wheelGo">Aylantirish</button>
      <div class="rw-odds">${wasFree?'Keyingi bepul aylantirish — 6 soatdan keyin':`Narxi: ${price} WC`}</div>
    </div>`;
  const go=sc.el.querySelector('#wheelGo'), wheelEl=sc.el.querySelector('#wheelSpin svg');
  let spun=false;
  go.addEventListener('click',()=>{
    if(spun||!wheelEl) return; spun=true; go.disabled=true; sc.locked=true;
    try{ SFX.play('box'); }catch(e){}
    setTimeout(()=>{ try{ SFX.stop('box'); }catch(e){} },4200);
    const idx=wheelPickIndex(), N=WHEEL_SEGMENTS.length, step=360/N;
    const jitter=(Math.random()-0.5)*step*0.5;
    const rot=360*6 + (360-(idx*step+step/2)) + jitter;
    wheelEl.style.transition='transform 4.2s cubic-bezier(.12,.72,.12,1)';
    void wheelEl.getBoundingClientRect();
    requestAnimationFrame(()=>{ wheelEl.style.transform='rotate('+rot+'deg)'; });
    try{ navigator.vibrate&&navigator.vibrate(15); }catch(e){}
    setTimeout(()=>{
      sc.locked=false;
      const seg=WHEEL_SEGMENTS[idx];
      if(seg.t==='dettok'){
        const n=detTokens(1);
        rwCard(sc,{kicker:"Omad g'ildiragi", tone:'blue', icon:detMascot(58), title:'Detektiv ishi kaliti', chip:'Noyob', sub:"Ingliz detektivida bitta AI tergov ishini bepul ochadi", meta:[['Kalitlaringiz',n+' ta']]});
      } else if(seg.t==='boost'){
        const b=Math.max(Date.now(), window.__wdBoostUntil||0);
        window.__wdBoostUntil=b+30*60*1000;
        try{ saveState(); }catch(e){}
        rwCard(sc,{kicker:"Omad g'ildiragi", tone:'coral', icon:RWD_IC.boost, title:'2x XP yoqildi', sub:'30 daqiqa davomida topgan barcha XP ikki barobar', meta:[['Tugash vaqti',rwTimeHM(window.__wdBoostUntil)]]});
      } else {
        addCoins(seg.n,true);
        try{ saveState(); }catch(e){}
        const jp=seg.t==='jackpot';
        rwCard(sc,{kicker:"Omad g'ildiragi", tone:'gold', icon:jp?RWD_IC.jackpot:COIN_SVG, amount:seg.n, unit:'WC', chip:jp?'Jackpot':'',
          sub:"Balansingizga qo'shildi", meta:[['Balans',rwFmt(coinsView())+' WC']]});
        if(jp){ try{ setTimeout(fireConfetti,250); }catch(e){} }
      }
    },4300);
  });
}

/* ================= PROMOKOD: VAQTINCHALIK TADQIQOT REJIMI =================
   FIRSTUSER kodi 60 daqiqaga hamma narsani ochadi. MUHIM: haqiqiy holat
   (XP, coin, sotib olinganlar) O'ZGARTIRILMAYDI — faqat ustidan vaqtinchalik
   qoplama qo'yiladi. Shuning uchun vaqt tugagach hech narsa buzilmaydi va
   foydalanuvchida soxta yutuq qolmaydi. */
const PROMO_MS=60*60*1000;      // 60 daqiqa
const PROMO_COINS=2000;         // vaqtincha qo'shiladigan tanga
function promoActive(){ return (window.__wdPromoUntil||0) > Date.now(); }
function promoLeftMs(){ return Math.max(0,(window.__wdPromoUntil||0)-Date.now()); }
function promoLeftTxt(){
  const ms=promoLeftMs(); if(ms<=0) return '';
  const m=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000);
  return m>0?(m+' daq'):(s+' son');
}
/* Ko'rsatiladigan tanga: haqiqiy + vaqtinchalik bonus */
function coinsView(){ return (window.__wdCoins||0) + (promoActive()?PROMO_COINS:0); }
window.__wdCoinsView=coinsView;
function shopLeague(){ try{
  // Promokod faol bo'lsa — eng yuqori liga (barcha qulflar ochiq).
  // LEAGUES boshqa <script> blokida, shuning uchun typeof bilan himoyalanadi.
  if(promoActive() && typeof LEAGUES!=='undefined' && LEAGUES.length){
    const last=LEAGUES.length-1;
    return {...LEAGUES[last], index:last};
  }
  return leagueFor(levelInfo(window.__wdXP||0).level);
}catch(e){ return {index:0,name:'Bronza'}; } }

/* ---------- Promokod: oyna, tekshirish, mukofot ---------- */
const PROMO_CODE='FIRSTUSER';
const PROMO_IC=`<svg viewBox="0 0 24 24"><path d="M4 8 a2 2 0 0 0 2-2 h12 a2 2 0 0 0 2 2 v3 a2 2 0 0 0 0 2 v3 a2 2 0 0 0-2 2 H6 a2 2 0 0 0-2-2 v-3 a2 2 0 0 0 0-2 Z"/><path d="M12 7 v2 M12 11 v2 M12 15 v2" stroke-dasharray="2 2"/></svg>`;

/* Mukofot ovozi — WebAudio bilan chalinadi (fayl kerak emas, hamma qurilmada bir xil).
   Yumshoq ko'tariluvchi arpeggio + porlash: "ochildi" hissi. */
function promoFanfare(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    const ctx=new AC(); const t0=ctx.currentTime;
    const master=ctx.createGain(); master.gain.value=0.0001; master.connect(ctx.destination);
    master.gain.exponentialRampToValueAtTime(0.35,t0+0.05);
    // Arpeggio: C5 E5 G5 C6 (mayor — ochilish hissi)
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type='triangle'; o.frequency.value=f;
      const st=t0+i*0.11;
      g.gain.setValueAtTime(0.0001,st);
      g.gain.exponentialRampToValueAtTime(0.28,st+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001,st+0.62);
      o.connect(g); g.connect(master); o.start(st); o.stop(st+0.7);
    });
    // Porlash (shimmer) — yuqori registrda yengil quyruq
    const sh=ctx.createOscillator(), sg=ctx.createGain();
    sh.type='sine'; sh.frequency.setValueAtTime(1568,t0+0.4);
    sh.frequency.exponentialRampToValueAtTime(2093,t0+1.1);
    sg.gain.setValueAtTime(0.0001,t0+0.4);
    sg.gain.exponentialRampToValueAtTime(0.12,t0+0.5);
    sg.gain.exponentialRampToValueAtTime(0.0001,t0+1.4);
    sh.connect(sg); sg.connect(master); sh.start(t0+0.4); sh.stop(t0+1.5);
    setTimeout(()=>{ try{ctx.close();}catch(e){} },2200);
  }catch(e){}
}

function openPromoSheet(){
  if(promoActive()){
    openSheet(`<div class="pm-wrap">
      <div class="pm-ic">${PROMO_IC}</div>
      <h3 style="margin:0 0 6px">Tadqiqot rejimi faol</h3>
      <p class="pm-note" style="margin-top:0">Qolgan vaqt: <b>${promoLeftTxt()}</b><br>
        Vaqt tugagach hamma narsa odatdagi holatiga qaytadi \u2014 hech narsa yo\u2019qolmaydi.</p>
    </div>`);
    return;
  }
  const layer=openSheet(`<div class="pm-wrap">
    <div class="pm-ic">${PROMO_IC}</div>
    <h3 style="margin:0 0 6px">Promokod</h3>
    <p class="pm-note" style="margin-top:0">WordDrop Pro promokodini kiriting \u2014 Pro darhol hisobingizga qo\u2019shiladi.</p>
    <input class="pm-in" id="pmIn" placeholder="WD-XXXX-XXXX" maxlength="32" autocomplete="off"
      autocapitalize="characters" spellcheck="false">
    <div class="pm-err" id="pmErr"></div>
    <button class="btn btn-primary btn-block" id="pmGo" style="margin-top:6px">Faollashtirish</button>
  </div>`);
  const inp=layer.querySelector('#pmIn'), err=layer.querySelector('#pmErr'), go=layer.querySelector('#pmGo');
  if(inp) setTimeout(()=>inp.focus(),260);
  function submit(){
    const v=String(inp.value||'').trim().toUpperCase();
    if(!v){ err.textContent='Kodni kiriting'; return; }
    if(v===PROMO_CODE){
      if(window.__wdPromoUsed){ err.textContent='Bu qurilmada promokod allaqachon ishlatilgan.'; return; }
      promoActivate(); return;
    }
    // v106: Pro promokodi — serverda tekshiriladi
    go.disabled=true; go.textContent='Tekshirilmoqda\u2026'; err.textContent='';
    redeemPromo(v).then(r=>{
      go.disabled=false; go.textContent='Faollashtirish';
      if(!r.ok){ err.textContent=r.msg||'Promokod qabul qilinmadi'; return; }
      promoProWin(r);
    });
  }
  if(go) go.addEventListener('click',submit);
  if(inp) inp.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
}

/* Serverda kodni band qilish — GLOBAL bir martalik.
   promos jadvali: claimed_by null bo'lsa oladi, aks holda RLS rad etadi.
   Server javob bermasa ham ilova ishlaydi (faqat qurilma darajasida). */
async function promoClaimServer(){
  try{
    try{ await window.__sbReady; }catch(e){}
    const sb=window.__sb, u=window.__sbUser;
    if(!sb||!u) return {ok:true, offline:true};   // tarmoqsiz — mahalliy davom etamiz
    const {data,error}=await sb.from('promos')
      .update({claimed_by:u.id, claimed_at:new Date().toISOString(),
               claimed_nm:((window.__wdName&&window.__wdName.trim())||'').slice(0,24)})
      .eq('code',PROMO_CODE).is('claimed_by',null).select();
    if(error) return {ok:true, offline:true};      // jadval yo'q/xato — to'smaymiz
    if(!data || !data.length) return {ok:false};   // allaqachon olingan
    return {ok:true};
  }catch(e){ return {ok:true, offline:true}; }
}

async function promoActivate(){
  const btn=document.getElementById('pmGo');
  if(btn){ btn.disabled=true; btn.textContent='Tekshirilmoqda\u2026'; }
  const res=await promoClaimServer();
  if(!res.ok){
    const err=document.getElementById('pmErr');
    if(err) err.textContent='Bu kod allaqachon ishlatilgan.';
    if(btn){ btn.disabled=false; btn.textContent='Faollashtirish'; }
    window.__wdPromoUsed=true; try{ saveState(); }catch(e){}
    return;
  }
  window.__wdPromoUntil = Date.now()+PROMO_MS;
  window.__wdPromoUsed = true;
  try{ saveState(); }catch(e){}
  promoFanfare();
  try{ fireConfetti(); }catch(e){}
  // Mukofot ekrani
  openSheet(`<div class="pm-win">
    <div class="pm-halo">\u2728</div>
    <h3 style="margin:2px 0 2px">Tadqiqot rejimi ochildi</h3>
    <p class="pm-note" style="margin:0">60 daqiqa davomida platforma to\u2019liq ochiq</p>
    <div class="pm-rows">
      <div class="pm-row" style="animation-delay:.05s"><span class="e">\u26a1</span><div><b>XP to\u2019liq</b><span>Barcha darajalar ochiq</span></div></div>
      <div class="pm-row" style="animation-delay:.15s"><span class="e">\ud83e\ude99</span><div><b>+${PROMO_COINS} tanga</b><span>Do\u2019kondagi hamma narsani sinang</span></div></div>
      <div class="pm-row" style="animation-delay:.25s"><span class="e">\ud83d\udd13</span><div><b>Barcha qulflar ochiq</b><span>Do\u2019kon, ligalar, tinglash darslari</span></div></div>
      <div class="pm-row" style="animation-delay:.35s"><span class="e">\u23f1\ufe0f</span><div><b>60 daqiqa</b><span>Vaqt tugagach hech narsa yo\u2019qolmaydi</span></div></div>
    </div>
    <button class="btn btn-primary btn-block" id="pmDone" style="margin-top:14px">Boshlash</button>
  </div>`);
  const d=document.getElementById('pmDone');
  if(d) d.addEventListener('click',()=>{ closeSheet(); promoRefresh(); });
  promoTick();
}

/* v106: Pro promokodi (wd_promo_redeem_me). Ilova, Pro oynasi va promokod oynasi shu funksiyani ishlatadi. */
async function redeemPromo(code){
  try{ await window.__sbReady; }catch(e){}
  const sb=window.__sb; if(!sb||!window.__sbUser) return {ok:false,msg:'Avval WordDrop hisobingizga kiring'};
  const c=String(code||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!/^[A-Z0-9-]{4,32}$/.test(c)) return {ok:false,msg:'Promokod lotin harflari, raqam va «-» dan iborat bo\u2019ladi'};
  const {data,error}=await sb.rpc('wd_promo_redeem_me',{c});
  if(error||!data) return {ok:false,msg:"Tekshirib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring"};
  if(data.ok){ try{ if(window.__wdProRefresh) await window.__wdProRefresh(); }catch(e){} }
  return data;
}
window.__wdRedeemPromo=redeemPromo;
function promoProWin(r){
  promoFanfare(); try{ fireConfetti(); }catch(e){}
  const d=new Date(r.until); const MO=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  openSheet(`<div class="pm-win">
    <div class="pm-halo">\u2b50</div>
    <h3 style="margin:2px 0 2px">${r.days} kun WordDrop Pro!</h3>
    <p class="pm-note" style="margin:0">${d.getDate()}-${MO[d.getMonth()]} ${d.getFullYear()} gacha faol</p>
    <div class="pm-rows">
      <div class="pm-row" style="animation-delay:.05s"><span class="e">\ud83c\udf93</span><div><b>Multilevel imtihonlari</b><span>Cheksiz, to\u2019liq tahlil va shaxsiy reja bilan</span></div></div>
      <div class="pm-row" style="animation-delay:.15s"><span class="e">\ud83d\udcac</span><div><b>Drop AI \u2014 100 ta savol</b><span>Har kuni</span></div></div>
      <div class="pm-row" style="animation-delay:.25s"><span class="e">\ud83d\udcda</span><div><b>Pro kitobchalar</b><span>Va seriya himoyasi</span></div></div>
    </div>
    <button class="btn btn-primary btn-block" id="pmDone" style="margin-top:14px">Zo\u2019r!</button>
  </div>`);
  const b=document.getElementById('pmDone'); if(b) b.addEventListener('click',()=>closeSheet());
}
window.__wdPromoProWin=promoProWin;
window.__wdOpenPromo=()=>openPromoSheet();

/* Faol tasma + vaqt tugaganda avtomatik qaytish */
let _promoTimer=null;
function promoRefresh(){
  try{ render(); }catch(e){}
  try{ if(typeof renderHome==='function') renderHome(); }catch(e){}
}
function promoTick(){
  if(_promoTimer) clearInterval(_promoTimer);
  const draw=()=>{
    let bar=document.getElementById('pmBar');
    if(promoActive()){
      if(!bar){
        bar=document.createElement('div'); bar.className='pm-bar'; bar.id='pmBar';
        document.body.appendChild(bar);
      }
      bar.innerHTML=`<i class="d"></i>Tadqiqot rejimi \u00b7 ${promoLeftTxt()}`;
    }else{
      if(bar) bar.remove();
      if(_promoTimer){ clearInterval(_promoTimer); _promoTimer=null; }
      try{ saveState(); }catch(e){}
      promoRefresh();
      try{ showToast('Tadqiqot rejimi tugadi',IC.info); }catch(e){}
    }
  };
  draw();
  _promoTimer=setInterval(draw,1000);
}
try{ if(promoActive()) promoTick(); }catch(e){}
window.__wdOpenPromo=openPromoSheet;

/* ---------- XP Booster ko'rsatkichlari ---------- */
function boostLeftTxt(){
  const ms=(window.__wdBoostUntil||0)-Date.now();
  if(ms<=0) return '';
  const m=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000);
  return m>0?(m+' daq'):(s+' son');
}
/* ---------- Omad g'ildiragi ---------- */
window.__wdWheelOpen=wheelOpen;
function addCoins(n,silent){
  n=Math.round(n)||0; if(!n) return;
  window.__wdCoins=Math.max(0,(window.__wdCoins||0)+n);
  if(!silent&&n>0){ try{ showToast('+'+n+' WordCoin',IC.star||IC.info); }catch(e){} try{ SFX.play('coin'); }catch(e){} }
  try{ saveState(); }catch(e){}
}
window.__wdAddCoins=addCoins;

/* ===== Detektiv SVG to'plami: maskot, jinoyat turlari, unvon medallari ===== */
let __detUid=0; const detUid=p=>p+(++__detUid);
/* Detektiv tomchi — WordDrop tomchisi, shlyapa va lupa bilan */
function detMascot(size){
  const g=detUid('dm'), h=detUid('dh'), s=size||40;
  return `<svg class="det-mascot" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E94E8"/><stop offset=".55" stop-color="#2F5BC4"/><stop offset="1" stop-color="#1C3A86"/></linearGradient>
    <linearGradient id="${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3B32"/><stop offset="1" stop-color="#2A211C"/></linearGradient></defs>
    <path d="M32 9C32 9 12.5 30.5 12.5 42.5a19.5 19.5 0 0 0 39 0C51.5 30.5 32 9 32 9Z" fill="url(#${g})"/>
    <ellipse cx="23.5" cy="35" rx="3.2" ry="5.8" fill="#fff" opacity=".28" transform="rotate(-22 23.5 35)"/>
    <path d="M14 21.5c0-1.6 7.8-3 18-3s18 1.4 18 3-7.8 2.8-18 2.8-18-1.2-18-2.8Z" fill="url(#${h})"/>
    <path d="M20.5 20.8c.6-6.4 5.4-10.3 11.5-10.3s10.9 3.9 11.5 10.3c-3.4.8-7.3 1.1-11.5 1.1s-8.1-.3-11.5-1.1Z" fill="url(#${h})"/>
    <path d="M20.9 18.2c3.3.8 7 1.2 11.1 1.2s7.8-.4 11.1-1.2l.3 2.3c-3.4.8-7.3 1.2-11.4 1.2s-8-.4-11.4-1.2Z" fill="#C8913A"/>
    <ellipse cx="26" cy="38" rx="3.6" ry="4.3" fill="#fff"/><ellipse cx="38" cy="38" rx="3.6" ry="4.3" fill="#fff"/>
    <circle cx="27.2" cy="38.8" r="1.9" fill="#0E1A33"/><circle cx="39.2" cy="38.8" r="1.9" fill="#0E1A33"/>
    <path d="M22.4 32.6c1.6-1 3.6-1.3 5.6-.7M41.6 32.6c-1.6-1-3.6-1.3-5.6-.7" stroke="#0E1A33" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <g transform="translate(43 44) rotate(-35)"><rect x="-1.5" y="6" width="3" height="10" rx="1.5" fill="#3A2C22"/><circle r="7" fill="#E6F0FF" fill-opacity=".55" stroke="#C8913A" stroke-width="2.4"/><path d="M-3.5-2.5a4.5 4.5 0 0 1 3.5-2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none"/></g>
  </svg>`;
}
/* Jinoyat turlari — bir xil chiziq uslubi, rangli plitka ichida */
const DET_KINDS={
  murder:     {uz:'Qotillik',          en:'Murder',          c:['#E35D4F','#A92A22'], i:'<path d="M8 20c1.5-2.4 2-5 1.6-7.8M16 20c-1.5-2.4-2-5-1.6-7.8"/><circle cx="12" cy="5.6" r="2.4"/><path d="M9.6 12.2 6 15M14.4 12.2 18 15M9.6 12.2c.8-2.6 4-2.6 4.8 0"/><path d="M3 21.5h18" stroke-dasharray="2 2"/>'},
  poison:     {uz:'Zaharlanish',       en:'Poisoning',       c:['#3FB57A','#16794A'], i:'<path d="M9 3h6M10 3v5.5L5 17.8A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-3.2L14 8.5V3"/><path d="M7.8 15h8.4"/><circle cx="10.5" cy="17.8" r=".9" fill="currentColor"/><circle cx="13.8" cy="16.9" r=".7" fill="currentColor"/>'},
  theft:      {uz:"O'g'irlik",         en:'Theft',           c:['#F2B544','#B7791F'], i:'<path d="M6 3h12l3 5-9 13L3 8z"/><path d="M3 8h18M9.5 3 8 8l4 13 4-13-1.5-5"/>'},
  disappear:  {uz:"G'oyib bo'lish",    en:'Disappearance',   c:['#8D7CF0','#5B45C9'], i:'<circle cx="12" cy="7" r="3.4" stroke-dasharray="2.4 1.8"/><path d="M5.5 21c.8-4.2 3.4-6.6 6.5-6.6s5.7 2.4 6.5 6.6" stroke-dasharray="2.4 1.8"/><path d="M18 3.5a2.2 2.2 0 1 1 2.6 2.2c-.7.2-.9.6-.9 1.2M19.7 9.2h.01"/>'},
  fraud:      {uz:'Firibgarlik',       en:'Fraud',           c:['#4F8BF0','#1F55C0'], i:'<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16h3.5"/><circle cx="15.8" cy="16.6" r="2.2"/>'},
  blackmail:  {uz:'Shantaj',           en:'Blackmail',       c:['#5D6B86','#323C52'], i:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/><rect x="14.5" y="13.5" width="7" height="6" rx="1.2" fill="#fff" fill-opacity=".14"/><path d="M16.2 13.5v-1.3a1.8 1.8 0 0 1 3.6 0v1.3"/>'},
  arson:      {uz:"O't qo'yish",       en:'Arson',           c:['#FF8A4C','#D2461E'], i:'<path d="M12 21.5c3.9 0 6.8-2.6 6.8-6.6 0-3.4-2.4-5.9-4-7.8-.5 1.9-1.5 3.1-2.8 3.7.3-2.7-.7-5.4-3.2-7.5C8.4 6.3 5.2 9.3 5.2 14.9c0 4 2.9 6.6 6.8 6.6Z"/><path d="M12 21.5c-1.7 0-2.9-1.2-2.9-2.9 0-1.6 1.2-2.8 2.9-4.6 1.7 1.8 2.9 3 2.9 4.6 0 1.7-1.2 2.9-2.9 2.9Z"/>'},
  sabotage:   {uz:'Sabotaj',           en:'Sabotage',        c:['#2FB3B8','#167D86'], i:'<path d="M12 8.5a3.5 3.5 0 1 0 0 7"/><path d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6"/><path d="m15 4.5-2 4 3 2-2 4.5" stroke-width="2.2"/>'},
  smuggling:  {uz:'Kontrabanda',       en:'Smuggling',       c:['#C08A5B','#8A5A33'], i:'<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8M7.7 5.8l8.5 4.5"/>'},
  cyber:      {uz:'Kiberjinoyat',      en:'Cybercrime',      c:['#4D5BD6','#2A33A0'], i:'<rect x="3" y="4.5" width="18" height="12" rx="1.6"/><path d="M2 20h20M9.5 9.5 7.5 11l2 1.5M14.5 9.5l2 1.5-2 1.5M12.8 8.5l-1.6 5"/>'}
};
function detKindIcon(k,size){
  const K=DET_KINDS[k]||DET_KINDS.murder, id=detUid('dk'), s=size||44;
  return `<svg class="det-kind" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${K.c[0]}"/><stop offset="1" stop-color="${K.c[1]}"/></linearGradient></defs>
    <rect width="48" height="48" rx="14" fill="url(#${id})"/><rect x="1" y="1" width="46" height="23" rx="13" fill="#fff" opacity=".12"/>
    <g transform="translate(12 12)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${K.i}</g></svg>`;
}
/* Unvonlar — metall medallar (bronza → obsidian) */
const DET_RANKS=[
  {id:'trainee',  uz:'Stajyor',              en:'Trainee Investigator', need:{solved:0,avg:0},  m:['#E7C6A0','#B07A4A','#7A4E2A'], r:'#8E5B32'},
  {id:'detective',uz:'Detektiv',             en:'Detective',            need:{solved:1,avg:0},  m:['#F1F3F7','#B9C1CF','#7C8698'], r:'#3B4F7A'},
  {id:'inspector',uz:'Inspektor',            en:'Inspector',            need:{solved:3,avg:70}, m:['#FFE7A3','#E0A93A','#9C6A12'], r:'#1E2A44'},
  {id:'chief',    uz:'Bosh inspektor',       en:'Chief Inspector',      need:{solved:5,avg:80}, m:['#E8F4FF','#9FC3EE','#4F79B8'], r:'#7A1F1F'},
  {id:'master',   uz:'Afsonaviy tergovchi',  en:'Master Detective',     need:{solved:10,avg:85},m:['#3A3F52','#1B1F2B','#0B0D14'], r:'#C8913A'}
];
function detMedal(rankIdx,size,locked){
  const R=DET_RANKS[Math.max(0,Math.min(4,rankIdx))], s=size||64, m=detUid('mm'), e=detUid('me'), lvl=rankIdx;
  const stars=Array.from({length:lvl},(_,i)=>{ const a=(-90+(i-(lvl-1)/2)*24)*Math.PI/180; const x=32+Math.cos(a)*19.5, y=30+Math.sin(a)*19.5;
    return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(.36)" d="M0-6l1.8 3.9 4.2.5-3.1 2.9.8 4.2L0 3.4-3.7 5.5l.8-4.2-3.1-2.9 4.2-.5z" fill="${lvl===4?'#E9B95A':'#fff'}"/>`; }).join('');
  return `<svg class="det-medal${locked?' locked':''}" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><defs>
    <linearGradient id="${m}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${R.m[0]}"/><stop offset=".5" stop-color="${R.m[1]}"/><stop offset="1" stop-color="${R.m[2]}"/></linearGradient>
    <radialGradient id="${e}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <path d="M22 44 16 60l7-3.2 4 6 4.5-15.5zM42 44l6 16-7-3.2-4 6-4.5-15.5z" fill="${R.r}"/>
    <path d="M22 44 16 60l7-3.2 4 6 4.5-15.5z" fill="#000" opacity=".15"/>
    <circle cx="32" cy="30" r="24" fill="url(#${m})"/><circle cx="32" cy="30" r="24" fill="url(#${e})"/>
    <circle cx="32" cy="30" r="19.5" fill="none" stroke="${lvl===4?'#C8913A':'#fff'}" stroke-opacity="${lvl===4?.9:.55}" stroke-width="1.2" stroke-dasharray="1.5 2.2"/>
    <g transform="translate(32 31)" fill="none" stroke="${lvl===4?'#E9B95A':'#fff'}" stroke-width="2.4" stroke-linecap="round"><circle cx="-1.5" cy="-1.5" r="6.5"/><path d="m3.3 3.3 4.7 4.7"/></g>
    ${stars}</svg>`;
}
const DET_ACH=[
  {id:'clean',  uz:'Mustaqil tinglovchi', d:"So'roq matnini ochmasdan ishni yechish", i:'<path d="M6 9a6 6 0 1 1 12 0c0 3.5-3 4.5-3 7.5a3 3 0 0 1-5.6 1.5"/><path d="M9 9a3 3 0 0 1 6 0c0 1.5-1.5 2-1.5 3.5"/>'},
  {id:'perfect',uz:'Mukammal hukm',   d:'Ishni 100 ball bilan yechish',            i:'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'},
  {id:'rooms',  uz:'Uch sahna',       d:"3 xil joyda ish yechish",                 i:'<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>'},
  {id:'ai',     uz:'Yangi iz',        d:'AI tuzgan ishni yechish',                 i:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>'}
];
function detAchIcon(a,got){
  return `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="13" fill="${got?'#1E2A44':'var(--bg)'}"/>
    <g transform="translate(8 8)" fill="none" stroke="${got?'#F0B44C':'var(--i3)'}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${a.i}</g></svg>`;
}

/* ===== Ingliz detektivi — tayyor ishlar (AI ishlamasa ham o'ynaladi) =====
   Har ish: o'qish (ish papkasi), 3D sahnadagi dalillar, gumondorlarning ovozli
   so'roqlari, mantiqiy savollar va yechim. Javoblar faqat matnni diqqat bilan
   o'qib/tinglab, dalillarni solishtirganda topiladi. */
const DET_CASES=[
{
  id:'last-chapter', crime:'murder', scene:'study', level:'B1–B2',
  title:'The Last Chapter', title_uz:'Oxirgi bob',
  place:'Vale House, Richmond', time:'Thursday, 21:30–22:15',
  victim:{name:'Arthur Vale', role:'crime novelist, 64'},
  brief:[
    `At 22:40 on Thursday, the police were called to Vale House. The famous crime writer Arthur Vale was found dead at the desk in his study. The police doctor says he was hit on the head with a heavy object between 21:30 and 22:15. A bronze bookend is missing from the shelf.`,
    `Nothing valuable was taken. The front door was locked, but the side gate to the street was open. It had been raining since 20:00, and the garden was wet.`,
    `Three people were in or near the house that evening. Each of them has a story. Your job is to find out which story is not true.`
  ],
  suspects:[
    {id:'clara', name:'Clara Vale', role:"The writer's daughter, 30", voice:'hannah', pitch:1.15,
     bio:`Will inherit the house. She and her father argued about money last month.`,
     statement:`I left the house at about half past eight. I went to the Riverside Cinema for the nine ten film. My phone was on silent, but I sent Dad a message when the film started. I came home at eleven and saw the police cars. We argued last month, yes, but I loved him. I would never hurt him.`},
    {id:'daniel', name:'Daniel Price', role:'His editor and publisher, 45', voice:'daniel', pitch:0.85,
     bio:`Has published every Vale novel for twenty years.`,
     statement:`Arthur asked me to come and talk about the new book. We had a pleasant conversation. He was in a good mood, actually. I left just before nine, drove home and I was in bed by ten. It was raining heavily, so I wore my long grey coat. I have no idea who could do something like this.`},
    {id:'ruth', name:'Ruth Hale', role:'Housekeeper, 58', voice:'autumn', pitch:1.0,
     bio:`Has worked in the house for eleven years. Lives in a small room behind the kitchen.`,
     statement:`I was in the kitchen all evening, at the back of the house. At about a quarter to ten I heard two men shouting in the study. Then there was a heavy sound, like something falling. I thought Mr Vale had dropped a book. I didn't see anyone leave, because the kitchen has no window to the front.`}
  ],
  evidence:[
    {id:'e1', type:'manuscript', spot:'desk', title:'Manuscript, page 212',
     text:`Chapter 31. The detective put down the cheque and looked at the man across the table. "You signed the royalty cheques for twenty years," she said quietly. "And for twenty years you kept a part of every one for yourself."`,
     uz:"Yozuvchining yangi kitobidagi oxirgi sahifa."},
    {id:'e2', type:'letter', spot:'bin', title:'Torn letter, found in the bin',
     text:`Dear Mr Hollis,\nI will leave Price & Co. on Monday. I now have clear proof that money has been missing from my royalties since 2009. Please prepare the papers. I will tell Daniel myself this week.\n— Arthur Vale`,
     uz:"Vale advokatiga yozgan, yirtib tashlangan xat."},
    {id:'e3', type:'phone', spot:'table', title:"Arthur's phone",
     chat:[
       {from:'Clara', time:'21:31', text:`Film just started. I'll call you after. Love you x`},
       {from:'Arthur (draft, not sent)', time:'21:41', text:`Hollis — Daniel is here again. He knows about the letter. He is very angry.`}
     ], uz:"Vale telefonidagi xabarlar."},
    {id:'e4', type:'photo', spot:'window', title:'Neighbour’s doorbell camera',
     caption:`22:08 — A tall man in a long grey coat leaves through the side gate. His face is not visible. He is carrying something heavy under his arm.`,
     uz:"Qo'shni eshigidagi kamera surati."},
    {id:'e5', type:'ticket', spot:'door', title:'Cinema ticket',
     lines:['RIVERSIDE CINEMA','Screen 2 · "Northern Lights"','Thu · 21:10','Seat F12','PAID · CARD **** 4471'],
     uz:"Klaraning kino chiptasi."},
    {id:'e6', type:'report', spot:'floor', title:'Police report — footprints',
     rows:[['Location','Garden path to side gate'],['Shoe size','44 (men’s)'],['Direction','From the house to the street'],['Note','Deep prints: the person was carrying weight']],
     uz:"Bog'dagi oyoq izlari haqida politsiya xulosasi."}
  ],
  questions:[
    {q:`Daniel says he left the house "just before nine". Which piece of evidence shows that this is probably not true?`,
     options:[`The cinema ticket for 21:10`,`Arthur's unsent message at 21:41`,`The manuscript page`,`The torn letter in the bin`],
     answer:1, why:`At 21:41 Arthur wrote "Daniel is here again". So Daniel was still in the house long after nine.`},
    {q:`Ruth heard "two men shouting" at about 21:45. What does this suggest?`,
     options:[`Clara was in the study`,`Arthur was talking on the phone`,`Arthur was arguing with a man, not with his daughter`,`Ruth was not in the kitchen`],
     answer:2, why:`Clara is a woman and her message shows she was at the cinema at 21:31. The second voice was a man.`},
    {q:`Why could Arthur's death help Daniel?`,
     options:[`Daniel would get the house`,`Arthur had proof that Daniel took money, and planned to leave him`,`Arthur owed Daniel money`,`Daniel wanted to write the last chapter`],
     answer:1, why:`The letter says money was missing from the royalties, and the manuscript describes a publisher who stole from cheques.`}
  ],
  solution:{culprit:'daniel', key:['e3','e4'],
    how:`Daniel Price did not leave at nine. Arthur's unsent message at 21:41 says Daniel was still there, and Ruth heard two men shouting at 21:45. The doorbell camera shows a tall man in a long grey coat — the coat Daniel described himself — leaving at 22:08 with something heavy: the missing bookend.`,
    motive:`For years Daniel had kept part of Arthur's royalty money. Arthur found proof, wrote to his lawyer and even put the story into his new novel. If Arthur told anyone, Daniel would lose everything.`}
},
{
  id:'night-train', crime:'poison', scene:'train', level:'B2',
  title:'Night Train to Samarkand', title_uz:"Samarqandga tungi poyezd",
  place:'Tashkent – Samarkand night train, Carriage 7', time:'Tuesday, 22:50–00:20',
  victim:{name:'Timur Rakhimov', role:'carpet merchant, 52'},
  brief:[
    `At 00:20 the conductor found Timur Rakhimov dead in compartment 4 of the night train to Samarkand. There were no signs of a fight. A glass of tea with a slice of lemon stood on the small table by the window.`,
    `The train doctor suspects poisoning by a heart medicine. A large dose of this medicine slows the heart and can kill within an hour. The train did not stop between 22:30 and 01:00, so the killer is still on board.`,
    `Rakhimov shared the compartment with his business partner. Two other people talked to him that evening.`
  ],
  suspects:[
    {id:'nodira', name:'Nodira Karimova', role:'Business partner, 40', voice:'diana', pitch:1.05,
     bio:`Owns half of the carpet company. Shares compartment 4 with the victim.`,
     statement:`I was very tired, so I went to bed at eleven. I always sleep with earplugs on trains, because the noise keeps me awake. I didn't hear anything until the conductor knocked. And I never drink tea at night. Timur was like a brother to me. Why would I hurt him?`},
    {id:'sherzod', name:'Sherzod Aliev', role:'Train conductor, 35', voice:'troy', pitch:0.9,
     bio:`Has worked on this line for nine years. Serves tea in Carriage 7.`,
     statement:`At ten past eleven I brought two glasses of tea to compartment 4. I knocked, and the lady opened the door. She took both glasses from me and said Mister Rakhimov was washing his face. That's all. Later, at twenty past twelve, I came to check the tickets and found him.`},
    {id:'lena', name:'Lena Morris', role:'British journalist, 29', voice:'autumn', pitch:1.2,
     bio:`Travels in compartment 5. Is writing an article about smuggling in the carpet trade.`,
     statement:`Yes, I visited him at ten to eleven. He agreed to give me an interview, but he was nervous and kept looking at the door. He said he would explain everything in Samarkand. I left at about eleven and went to sleep. I didn't see his partner — she was in the corridor, I think.`}
  ],
  evidence:[
    {id:'e1', type:'report', spot:'table', title:'Train doctor — test of the tea',
     rows:[['Glass (victim)','Heart medicine: about 10× a normal dose'],['Teapot (kitchen)','Clean — no medicine'],['Second glass','Not found'],['Conclusion','The medicine was added after the tea was poured']],
     uz:"Choy tekshiruvi natijasi."},
    {id:'e2', type:'object', spot:'bin', title:'Empty pill bottle (corridor bin)',
     lines:['CARDIOX 0.25 mg — heart tablets','Patient: M. KARIMOVA','Take ONE tablet a day','Bottle: 30 tablets · now empty'],
     uz:"Yo'lak axlat qutisidan topilgan dori shishasi."},
    {id:'e3', type:'letter', spot:'shelf', title:'Company contract, page 6',
     text:`Section 14. If one partner dies, all of his or her shares in Silk Road Carpets will pass to the other partner. This rule cannot be changed without the signatures of both partners.`,
     uz:"Kompaniya shartnomasidan bir sahifa."},
    {id:'e4', type:'note', spot:'chair', title:"Lena's notebook",
     text:`T.R. — very nervous. "Somebody in my own company is moving goods without papers." Will go to the customs office in Samarkand on Friday with documents. Asked me: "Don't tell N. yet."`,
     uz:"Jurnalistning yozuvlari."},
    {id:'e5', type:'object', spot:'window', title:'Packet on the window ledge',
     lines:['SOFT-FOAM EARPLUGS','2 pairs','Packet: SEALED, never opened'],
     uz:"Deraza tokchasidagi quloq tiqinlari."},
    {id:'e6', type:'log', spot:'door', title:"Conductor's tea log",
     rows:[['22:40','Coupe 2','1 glass','man'],['23:10','Coupe 4','2 glasses','given to the lady'],['23:25','Coupe 6','1 glass','man']],
     uz:"Konduktorning choy daftari."}
  ],
  questions:[
    {q:`Nodira says she slept with earplugs from eleven o'clock. Which two facts contradict her story?`,
     options:[`The teapot was clean and the bottle was empty`,`The earplug packet was never opened, and the conductor gave the tea to "the lady" at 23:10`,`Lena left at eleven and the train did not stop`,`The contract has a Section 14`],
     answer:1, why:`She could not sleep with earplugs that were never opened, and at 23:10 she was awake and took the tea at the door.`},
    {q:`Why is it important that the teapot was clean?`,
     options:[`It shows the conductor is innocent of putting medicine in the tea he made`,`It proves Timur did not drink tea`,`It shows the tea was cold`,`It proves Lena made the tea`],
     answer:0, why:`The poison was only in the glass, so it was added after the tea left the kitchen — by the person who held the glasses.`},
    {q:`What did Timur plan to do in Samarkand, and why does it matter?`,
     options:[`Sell the company to Lena`,`Visit his family`,`Take documents about illegal goods to the customs office`,`Buy new carpets`],
     answer:2, why:`He planned to report the smuggling in his own company. Together with Section 14, this gives Nodira two reasons to stop him.`}
  ],
  solution:{culprit:'nodira', key:['e5','e6'],
    how:`Nodira said she was asleep with earplugs from eleven, but the earplugs were never opened, and the conductor's log shows that "the lady" took both glasses at 23:10. The poison was only in Timur's glass, not in the teapot, and the empty bottle in the bin carries her mother's name: M. Karimova.`,
    motive:`Timur was going to report the smuggling in their company to customs on Friday. And under Section 14 of the contract, his death gave Nodira the whole company.`}
},
{
  id:'silent-gallery', crime:'murder', scene:'gallery', level:'B2',
  title:'The Silent Gallery', title_uz:'Sokin galereya',
  place:'Old Town Gallery, Bukhara', time:'Wednesday night, 01:00–02:00',
  victim:{name:'Farrukh Usmonov', role:'gallery curator, 47'},
  brief:[
    `At 07:00 the cleaner found the curator Farrukh Usmonov dead in the main hall of the Old Town Gallery. He had been hit from behind between 01:00 and 02:00. A small but very valuable miniature, "The Blue Caravan", was missing from its frame on the east wall.`,
    `The gallery has an alarm system. Every member of staff has a personal four-digit code. The doors were not broken, so the thief knew the building — or someone who did.`,
    `Usmonov often worked late. Three people are connected to the night of the murder.`
  ],
  suspects:[
    {id:'kamila', name:'Kamila Saidova', role:'Night security guard, 26', voice:'hannah', pitch:1.1,
     bio:`Has worked at the gallery for eight months. On duty from 20:00 to 08:00.`,
     statement:`I did my rounds every hour, as always. At half past one I checked the main hall and everything was quiet. The alarm was on the whole night, I'm sure. Mister Usmonov must have stayed after I checked. Maybe somebody had a code. Aziz has keys and a code — ask him.`},
    {id:'aziz', name:'Aziz Karimov', role:'Picture restorer, 33', voice:'daniel', pitch:1.0,
     bio:`Repairs old paintings in the workshop. Has his own keys and alarm code.`,
     statement:`I left at ten o'clock, as usual. Look at my arm — I broke my right wrist on Monday, I can't even hold a brush. I went home and my sister made dinner for me. I know my code was used, the police told me. But I didn't give it to anybody.`},
    {id:'robert', name:'Robert Klein', role:'Art collector from Vienna, 55', voice:'troy', pitch:0.8,
     bio:`Offered 400,000 dollars for "The Blue Caravan". Usmonov refused to sell.`,
     statement:`I wanted that painting, everyone knows that. But I am a collector, not a criminal. Last night I was in the bar of my hotel until two in the morning. You can ask the barman. Usmonov was a stubborn man, but I respected him.`}
  ],
  evidence:[
    {id:'e1', type:'log', spot:'wall', title:'Alarm panel — night log',
     rows:[['22:02','ARMED','code 2290','K. Saidova'],['01:14','DISARMED','code 0418','A. Karimov'],['01:39','ARMED','code 0418','A. Karimov'],['07:01','DISARMED','code 7733','cleaner']],
     uz:"Signalizatsiya paneli yozuvlari."},
    {id:'e2', type:'note', spot:'desk', title:'Paper inside the guard’s desk',
     text:`STAFF CODES (do not remove!)\nUsmonov 1907 · Karimov 0418 · Saidova 2290 · Cleaner 7733`,
     uz:"Qorovul stoli ichidagi qog'oz."},
    {id:'e3', type:'log', spot:'table', title:"Guard's round book",
     rows:[['00:30','Main hall','all quiet','K.S.'],['01:30','Main hall','all quiet · alarm ON','K.S.'],['02:30','Main hall','all quiet','K.S.']],
     uz:"Qorovulning aylanish daftari."},
    {id:'e4', type:'report', spot:'chair', title:'Hospital note',
     rows:[['Patient','Aziz Karimov'],['Date','Monday'],['Injury','Fracture of the right wrist'],['Advice','No lifting, no climbing for 6 weeks']],
     uz:"Azizning shifoxona ma'lumotnomasi."},
    {id:'e5', type:'phone', spot:'shelf', title:"Kamila's phone (found in her bag)",
     chat:[
       {from:'Bank', time:'Mon 14:02', text:`Incoming transfer: 5,000 USD from R. KLEIN.`},
       {from:'Unknown number', time:'Wed 00:51', text:`Side door. 01:15. The ladder is in the store room.`}
     ], uz:"Qorovul telefonidagi xabarlar."},
    {id:'e6', type:'object', spot:'wall2', title:'Empty frame, east wall',
     lines:['"The Blue Caravan" — 16th century','Hung 2.8 m above the floor','Ladder marks on the wall below','Frame opened with a tool, not broken'],
     uz:"Bo'sh qolgan rom."}
  ],
  questions:[
    {q:`Kamila wrote that the alarm was ON at 01:30. What does the alarm panel show?`,
     options:[`The alarm was on all night`,`The alarm was off from 01:14 to 01:39, so her note is false`,`Only the cleaner used the alarm`,`Aziz armed the alarm at 22:02`],
     answer:1, why:`The panel was disarmed at 01:14 and armed again at 01:39. At 01:30 it was off — the round book does not tell the truth.`},
    {q:`Aziz's code was used. Why is Aziz probably not the person who took the painting?`,
     options:[`He has a sister`,`He left at ten`,`With a broken wrist he could not climb a ladder to a frame 2.8 m high, and his code was written in the guard's desk`,`He did not like the painting`],
     answer:2, why:`The hospital note forbids climbing, the painting hung 2.8 m high, and anyone at the guard's desk could read his code.`},
    {q:`How is Robert Klein connected to the crime?`,
     options:[`He was the barman`,`He sent Kamila 5,000 dollars two days before the night`,`He had a code`,`He found the body`],
     answer:1, why:`The bank message shows a transfer from R. Klein to Kamila on Monday. He has an alibi for the night, but he paid for the theft.`}
  ],
  solution:{culprit:'kamila', key:['e1','e5'],
    how:`Kamila used Aziz's code from the paper in her own desk to switch the alarm off at 01:14 and on again at 01:39, then wrote a false entry in her round book. The message at 00:51 told her where the ladder was. When the curator, working late, found her at the frame, she struck him.`,
    motive:`Robert Klein, who could not buy "The Blue Caravan", paid Kamila 5,000 dollars to steal it. He made sure he was seen in the hotel bar all night — the murder was not part of his plan, but the theft was.`}
}
];

/* =====================================================================
   INGLIZ DETEKTIVI — tergov rejimi
   Ish papkasi (o'qish) → 3D jinoyat joyi + 2D dalillar → so'roqlar (TTS)
   → mantiqiy savollar → ayblov → hukm. AI ishlamasa ham tayyor ishlar o'ynaladi.
   ===================================================================== */
const DET_LS='wd_det_v1';
const DET_SV=(p,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const DET_IC={
  back:DET_SV('<path d="M15 5l-7 7 7 7"/>',2.4),
  file:DET_SV('<path d="M4 5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 12h8M8 16h5"/>'),
  cube:DET_SV('<path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>'),
  ev:DET_SV('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  people:DET_SV('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5"/>'),
  gavel:DET_SV('<path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>'),
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  check:DET_SV('<path d="M5 12.5l4.5 4.5L19 7.5"/>',2.8),
  x:DET_SV('<path d="M6 6l12 12M18 6L6 18"/>',2.4),
  spark:DET_SV('<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'),
  skull:DET_SV('<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3Z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 20v-2M14 20v-2"/>'),
  flask:DET_SV('<path d="M9 3h6M10 3v6L4.5 18.5A1.6 1.6 0 0 0 5.9 21h12.2a1.6 1.6 0 0 0 1.4-2.5L14 9V3"/><path d="M7.5 15h9"/>'),
  frame:DET_SV('<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/>'),
  ai:DET_SV('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  ear:DET_SV('<path d="M6 9a6 6 0 1 1 12 0c0 3.5-3 4.5-3 7.5a3 3 0 0 1-5.6 1.5"/><path d="M9 9a3 3 0 0 1 6 0c0 1.5-1.5 2-1.5 3.5"/>'),
  txt:DET_SV('<path d="M4 6h16M4 12h16M4 18h10"/>')
};
function detStore(v){ try{ if(v===undefined) return JSON.parse(localStorage.getItem(DET_LS)||'{}')||{}; localStorage.setItem(DET_LS,JSON.stringify(v)); }catch(e){ return {}; } }
function detProg(id){ const s=detStore(); s.prog=s.prog||{}; return s.prog[id]||(s.prog[id]={found:[],heard:[],reveal:[]}); }
function detSaveProg(id,p){ const s=detStore(); s.prog=s.prog||{}; s.prog[id]=p; detStore(s); }
function detTokens(add){ const s=detStore(); s.tok=Math.max(0,(s.tok||0)+(add||0)); if(add) detStore(s); return s.tok; }
function detAllCases(){ const s=detStore(); return DET_CASES.concat(Array.isArray(s.ai)?s.ai:[]); }
/* Bitta ish bahosi (umumiy unvon — detCareer'da) */
function detRank(score){ return score>=90?"A'lo tergov":score>=70?'Yaxshi tergov':score>=50?'Qoniqarli tergov':'Dalillar yetmadi'; }
function detInitials(n){ return String(n||'?').split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase(); }
function detAvatar(s,i){ const hues=[214,22,152,280,340,45]; const h=hues[(i||0)%hues.length];
  return `<i class="dt-av" style="--h:${h}">${escapeHtml(detInitials(s.name))}</i>`; }

/* ---------- Ovoz profili: jins, yosh va holatga qarab ---------- */
const DET_VMALE=['daniel','troy','austin'], DET_VFEMALE=['hannah','autumn','diana'];
function detVoiceProfile(s){
  if(!s||typeof s!=='object') return {voice:'hannah',gender:'f',rate:.98,pitch:1};
  let voice=String(s.voice||'').toLowerCase(); let gender=DET_VMALE.includes(voice)?'m':DET_VFEMALE.includes(voice)?'f':null;
  const txt=((s.role||'')+' '+(s.bio||'')).toLowerCase();
  if(!gender) gender=/\b(she|her|mother|wife|daughter|sister|woman|lady|mrs|ms|miss)\b/.test(txt)?'f':'m';
  const age=+(((s.role||'').match(/\b(\d{2})\b/)||[])[1]||40);
  /* server ovozi: jinsga mos, yoshga qarab tanlanadi */
  if(gender==='m'&&!DET_VMALE.includes(voice)) voice=age>=50?'troy':age<=32?'austin':'daniel';
  if(gender==='f'&&!DET_VFEMALE.includes(voice)) voice=age>=50?'autumn':age<=32?'hannah':'diana';
  const st=((s.statement||'')+' '+(s.bio||'')).toLowerCase();
  const tense=/nervous|afraid|scared|worried|shocked|can't believe|panic|lost my/.test(st);
  const firm=/angry|stubborn|respected|never|not a criminal|no idea/.test(st);
  let rate=1, pitch=gender==='f'?1.12:.86;
  if(age>=55){ rate-=.09; pitch-=.08; } else if(age<=30){ rate+=.06; pitch+=.07; }
  if(tense){ rate+=.07; pitch+=.05; } else if(firm){ rate-=.03; pitch-=.03; }
  return {voice,gender,age,rate:Math.max(.82,Math.min(1.15,rate)),pitch:Math.max(.6,Math.min(1.4,pitch)),mood:tense?'tense':firm?'firm':'calm'};
}
function detPickBrowserVoice(gender){
  if(!('speechSynthesis' in window)) return null;
  const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)); if(!vs.length) return null;
  const F=/female|samantha|victoria|karen|moira|tessa|zira|aria|jenny|libby|sonia|hazel|susan|serena|fiona|kate|allison|ava|google us english|google uk english female/i;
  const M=/\bmale\b|daniel|alex|fred|david|mark|guy|ryan|george|james|thomas|rishi|oliver|arthur|aaron|google uk english male/i;
  const pick=vs.find(v=>gender==='f'?F.test(v.name)&&!/\bmale\b/i.test(v.name):M.test(v.name)&&!/female/i.test(v.name));
  return pick||null;
}
const DET_AUDIO={cache:new Map(), cur:null};
function detStopVoice(){ try{ if(DET_AUDIO.cur){ DET_AUDIO.cur.pause(); DET_AUDIO.cur=null; } }catch(e){} try{ speechSynthesis.cancel(); }catch(e){} }
/* prof: detVoiceProfile(...) natijasi yoki ovoz nomi (eski chaqiruvlar uchun) */
async function detSpeak(text,prof,_pitch,onEnd){
  detStopVoice();
  const P=(prof&&typeof prof==='object')?prof:{voice:prof||'hannah',gender:DET_VMALE.includes(prof)?'m':'f',rate:.98,pitch:_pitch||1};
  const key=P.voice+'|'+text;
  let url=DET_AUDIO.cache.get(key);
  if(!url && navigator.onLine && typeof aiRequest==='function'){
    try{
      const d=await aiRequest({mode:'tts',text:text.slice(0,1500),voice:P.voice});
      if(d && !d.__error && typeof d.audio==='string' && d.audio){
        const bin=atob(d.audio), buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
        url=URL.createObjectURL(new Blob([buf],{type:d.mime||'audio/wav'})); DET_AUDIO.cache.set(key,url);
      }
    }catch(e){}
  }
  if(url){
    const a=new Audio(url); DET_AUDIO.cur=a; try{ a.preservesPitch=true; a.playbackRate=P.rate||1; }catch(e){}
    a.onended=()=>{ if(DET_AUDIO.cur===a) DET_AUDIO.cur=null; onEnd&&onEnd(); };
    try{ await a.play(); return; }catch(e){ DET_AUDIO.cur=null; }
  }
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(text); const v=detPickBrowserVoice(P.gender)||((typeof pickEnglishVoice==='function')?pickEnglishVoice():null);
    if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-GB';
    u.rate=(P.rate||1)*.92; u.pitch=P.pitch||1;
    u.onend=()=>onEnd&&onEnd(); u.onerror=()=>onEnd&&onEnd();
    speechSynthesis.speak(u);
  } else { showToast("Bu qurilmada ovoz yo'q — matnni oching",IC.info); onEnd&&onEnd(); }
}

/* ---------- To'liq ekranli sahifa ---------- */
function detPage(id,title,sub){
  const old=document.getElementById(id); if(old) old.remove();
  const pg=document.createElement('div'); pg.className='dt'; pg.id=id; pg.setAttribute('role','dialog'); pg.setAttribute('aria-modal','true');
  pg.innerHTML=`<div class="dt-top"><button class="dt-ib" data-a="back" aria-label="Orqaga">${DET_IC.back}</button>
    <div class="dt-tt"><b></b><span></span></div><div class="dt-tr"></div></div><div class="dt-main"></div>`;
  pg.querySelector('.dt-tt b').textContent=title; pg.querySelector('.dt-tt span').textContent=sub||'';
  document.body.appendChild(pg); requestAnimationFrame(()=>pg.classList.add('on'));
  try{ history.pushState({wdDet:id},'','#'+id); }catch(e){}
  const api={pg, main:pg.querySelector('.dt-main'), right:pg.querySelector('.dt-tr'), closed:false, onClose:null};
  const hide=()=>{ if(api.closed) return; api.closed=true; window.removeEventListener('popstate',onPop); detStopVoice();
    if(typeof api.onClose==='function'){ try{ api.onClose(); }catch(e){} }
    pg.classList.remove('on'); setTimeout(()=>pg.remove(),320); };
  // Faqat brauzer tarixidagi joriy yozuv bu sahifaniki bo'lmasa yopiladi:
  // ichki sahifadan (ish) orqaga qaytilganda lobby ochiq qoladi.
  const onPop=()=>{ const st=history.state; if(st&&st.wdDet===id) return; hide(); };
  window.addEventListener('popstate',onPop);
  pg.querySelector('[data-a=back]').addEventListener('click',()=>{ try{ if(history.state&&history.state.wdDet===id){ history.back(); return; } }catch(e){} hide(); });
  api.close=()=>pg.querySelector('[data-a=back]').click();
  return api;
}

/* ---------- AI orqali yangi ish ---------- */
async function detGenerate(kind,P,rerender,price,useTok){
  const btn=P.main.querySelector('#dtGen'), note=P.main.querySelector('#dtGenN');
  if(btn.disabled) return; btn.disabled=true;
  const steps=["Jinoyat joyi tanlanmoqda…","Gumondorlar o'ylab topilmoqda…","Dalillar joylashtirilmoqda…","Ish papkasi yozilmoqda…"]; let si=0;
  btn.innerHTML=`<span class="dt-spin"></span><span>${steps[0]}</span>`;
  const iv=setInterval(()=>{ si=(si+1)%steps.length; const sp=btn.querySelector('span:last-child'); if(sp) sp.textContent=steps[si]; },4500);
  const url=String(typeof SUPABASE_FUNCTION_URL!=='undefined'?SUPABASE_FUNCTION_URL:'').replace(/check-sentence$/,'detective');
  let data=null;
  try{
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),70000);
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_PUBLISHABLE_KEY,'Authorization':'Bearer '+SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify({mode:'case',kind,level:(window.__wdCEFR||'B1')}),signal:ctrl.signal});
    clearTimeout(t); if(r.ok) data=await r.json();
  }catch(e){ data=null; }
  clearInterval(iv);
  const c=data&&data.case?detNormalize(data.case,kind):null;
  btn.disabled=false; btn.innerHTML=`${detMascot(24)}<span>${useTok?'Ish ochish · 1 kalit':`Ish ochish · ${price||50} WC`}</span>`;
  if(!c){ note.textContent="AI hozir ish tuza olmadi — WordCoin yechilmadi. Birozdan keyin urinib ko'ring yoki tayyor ishlardan birini o'ynang."; note.classList.add('err'); return; }
  if(useTok){ detTokens(-1); showToast('Yangi ish ochildi · 1 kalit ishlatildi',IC.info); }
  else if(price){ try{ addCoins(-price,true); saveState(); }catch(e){} showToast(`Yangi ish ochildi · −${price} WC`,IC.info); }
  const s=detStore(); s.ai=(Array.isArray(s.ai)?s.ai:[]); s.ai.unshift(c); s.ai=s.ai.slice(0,12); detStore(s);
  rerender(); detCase(c,rerender);
}
/* AI javobini tekshirib, o'yin tuzilmasiga keltiradi — buzuq ish o'yinga kirmaydi */
function detNormalize(x,kind){
  try{
    const scene=DET_ROOMS[x.scene]?x.scene:'study';
    const spots=DET_SPOT_KEYS.slice(); const used=new Set();
    const S=String, cut=(v,n)=>S(v==null?'':v).trim().slice(0,n);
    const suspects=(x.suspects||[]).slice(0,4).map((s,i)=>({id:cut(s.id||('s'+i),20).replace(/\W/g,'')||('s'+i),name:cut(s.name,40),role:cut(s.role,60),
      voice:['hannah','daniel','troy','autumn','diana','austin'].includes(s.voice)?s.voice:['daniel','hannah','troy','autumn'][i%4],pitch:[0.9,1.1,0.8,1.2][i%4],
      bio:cut(s.bio,160),statement:cut(s.statement,700)})).filter(s=>s.name&&s.statement);
    const types=['letter','note','phone','photo','ticket','report','log','object','manuscript'];
    const evidence=(x.evidence||[]).slice(0,7).map((e,i)=>{ let sp=spots.includes(e.spot)&&!used.has(e.spot)?e.spot:spots.find(k=>!used.has(k)); used.add(sp);
      const t=types.includes(e.type)?e.type:'note';
      const ev={id:'e'+(i+1),type:t,spot:sp,title:cut(e.title,70),uz:cut(e.uz,120)};
      if(Array.isArray(e.rows)) ev.rows=e.rows.slice(0,8).map(r=>(Array.isArray(r)?r:[r]).slice(0,4).map(c=>cut(c,80)));
      if(Array.isArray(e.lines)) ev.lines=e.lines.slice(0,8).map(l=>cut(l,80));
      if(Array.isArray(e.chat)) ev.chat=e.chat.slice(0,5).map(m=>({from:cut(m.from,40),time:cut(m.time,12),text:cut(m.text,220)}));
      ev.text=cut(e.text,700); ev.caption=cut(e.caption,300);
      ev._old=e.id; return ev; }).filter(e=>e.title&&(e.text||e.rows||e.lines||e.chat||e.caption));
    const idMap={}; evidence.forEach(e=>{ idMap[e._old]=e.id; delete e._old; });
    const questions=(x.questions||[]).slice(0,4).map(q=>({q:cut(q.q,300),options:(q.options||[]).slice(0,4).map(o=>cut(o,200)),answer:Math.max(0,Math.min(3,Number(q.answer)||0)),why:cut(q.why,300)}))
      .filter(q=>q.q&&q.options.length===4);
    const sol=x.solution||{};
    const culprit=suspects.find(s=>s.id===sol.culprit||s.name===sol.culprit);
    const key=(sol.key||[]).map(k=>idMap[k]||k).filter(k=>evidence.some(e=>e.id===k)).slice(0,2);
    if(suspects.length<3||evidence.length<4||questions.length<2||!culprit||key.length<2) return null;
    return {id:'ai-'+Date.now().toString(36), ai:true, crime:DET_KINDS[x.crime]?x.crime:kind, scene, level:cut(x.level||'B1–B2',10),
      title:cut(x.title,60)||'Untitled case', title_uz:cut(x.title_uz,60), place:cut(x.place,70), time:cut(x.time,60),
      victim:{name:cut(x.victim&&x.victim.name,40),role:cut(x.victim&&x.victim.role,60)},
      brief:(Array.isArray(x.brief)?x.brief:[x.brief]).slice(0,4).map(p=>cut(p,900)).filter(Boolean),
      suspects, evidence, questions, solution:{culprit:culprit.id,key,how:cut(sol.how,900),motive:cut(sol.motive,600)}};
  }catch(e){ return null; }
}

/* =================== ISH SAHIFASI =================== */
function detCase(c,onBack){
  const P=detPage('detCase',c.title,(c.title_uz?c.title_uz+' · ':'')+(DET_KINDS[c.crime]||DET_KINDS.murder).uz);
  const prog=detProg(c.id); const save=()=>detSaveProg(c.id,prog);
  let tab=prog.found.length?'scene':'brief', scene3d=null;
  P.main.innerHTML=`<div class="dt-view" id="dtView"></div>
    <nav class="dt-tabs" role="tablist">
      <button data-t="brief">${DET_IC.file}<span>Ish</span></button>
      <button data-t="scene">${DET_IC.cube}<span>Sahna</span></button>
      <button data-t="ev">${DET_IC.ev}<span>Dalillar</span><em id="dtEvN"></em></button>
      <button data-t="sus">${DET_IC.people}<span>So'roq</span></button>
      <button data-t="acc">${DET_IC.gavel}<span>Xulosa</span></button>
    </nav>`;
  const view=P.main.querySelector('#dtView');
  const setBadge=()=>{ const n=P.main.querySelector('#dtEvN'); n.textContent=prog.found.length+'/'+c.evidence.length; };
  P.onClose=()=>{ if(scene3d){ scene3d.dispose(); scene3d=null; } if(onBack) onBack(); };
  const found=(id)=>{ if(!prog.found.includes(id)){ prog.found.push(id); save(); setBadge(); try{ SFX.play('tap'); }catch(e){} } };
  const show=(t)=>{
    tab=t; detStopVoice();
    P.main.querySelectorAll('.dt-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
    if(t!=='scene'&&scene3d){ scene3d.pause(); }
    if(t==='brief') viewBrief(); else if(t==='scene') viewScene(); else if(t==='ev') viewEv(); else if(t==='sus') viewSus(); else viewAcc();
  };
  P.main.querySelectorAll('.dt-tabs button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.t)));
  setBadge();

  function viewBrief(){
    view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
      <article class="dt-dossier">
        <div class="dt-stamp">${(DET_KINDS[c.crime]||DET_KINDS.murder).en}</div>
        <div class="dt-dos-h"><span>CASE FILE</span><b>${escapeHtml(c.title)}</b></div>
        <dl class="dt-facts"><div><dt>Victim</dt><dd>${escapeHtml(c.victim.name)}, ${escapeHtml(c.victim.role)}</dd></div>
          <div><dt>Place</dt><dd>${escapeHtml(c.place)}</dd></div><div><dt>Time</dt><dd>${escapeHtml(c.time)}</dd></div></dl>
        ${c.brief.map(p=>`<p>${escapeHtml(p)}</p>`).join('')}
        <button class="dt-listen" id="dtBriefL">${DET_IC.ear}<span>Ish papkasini tinglash</span></button>
      </article>
      <div class="dt-tip">${DET_IC.spark}<span>Avval ish papkasini diqqat bilan o'qing: vaqt, joy va kim qayerda bo'lgani — keyin so'roqlardagi yolg'onni shu ma'lumotlar orqali topasiz.</span></div>
      <button class="dt-btn" id="dtGoScene">${DET_IC.cube}<span>Jinoyat joyiga o'tish</span></button>
    </div></div>`;
    const lb=view.querySelector('#dtBriefL'); let on=false;
    lb.addEventListener('click',()=>{ if(on){ detStopVoice(); on=false; lb.classList.remove('on'); return; } on=true; lb.classList.add('on');
      detSpeak(c.brief.join(' '),'hannah',1,()=>{ on=false; lb.classList.remove('on'); }); });
    view.querySelector('#dtGoScene').addEventListener('click',()=>show('scene'));
  }
  function viewScene(){
    view.innerHTML=`<div class="dt-stage"><div class="dt-canvas" id="dtCanvas"></div><div class="dt-pins" id="dtPins"></div>
      <div class="dt-stage-hud"><span id="dtHud">${DET_ROOMS[c.scene]||''} · ${prog.found.length}/${c.evidence.length} dalil</span></div>
      <div class="dt-stage-tip" id="dtStageTip">Barmoq bilan atrofga qarang · polni bosib yuring · belgilarni bosing</div>
      <div class="dt-loading" id="dtLoad"><span class="dt-spin dark"></span>Jinoyat joyi tayyorlanmoqda…</div></div>`;
    const hud=()=>{ const h=view.querySelector('#dtHud'); if(h) h.textContent=`${DET_ROOMS[c.scene]||''} · ${prog.found.length}/${c.evidence.length} dalil`; };
    const open=(ev)=>{ found(ev.id); detEvidenceModal(ev,c); if(scene3d) scene3d.mark(prog.found); hud(); const tip=view.querySelector('#dtStageTip'); if(tip) tip.remove(); };
    if(scene3d){ scene3d.mount(view.querySelector('#dtCanvas'),view.querySelector('#dtPins'),open); scene3d.mark(prog.found); const l=view.querySelector('#dtLoad'); if(l) l.remove(); return; }
    detScene3D(c,view.querySelector('#dtCanvas'),view.querySelector('#dtPins'),open).then(sc=>{
      if(P.closed){ sc&&sc.dispose(); return; }
      scene3d=sc; const l=view.querySelector('#dtLoad'); if(l) l.remove();
      if(sc) sc.mark(prog.found); else viewSceneFallback(open);
    });
  }
  /* 3D yuklanmasa (internet/WebGL yo'q) — 2D xarita */
  function viewSceneFallback(open){
    const st=view.querySelector('.dt-stage'); if(!st) return;
    st.innerHTML=`<div class="dt-scroll"><div class="dt-col"><div class="dt-tip">${DET_IC.cube}<span>3D sahna bu qurilmada ochilmadi — dalillar xaritada.</span></div>
      <div class="dt-map">${c.evidence.map((e,i)=>`<button class="dt-map-i ${prog.found.includes(e.id)?'got':''}" data-i="${i}"><b>${i+1}</b><span>${escapeHtml(e.title)}</span></button>`).join('')}</div></div></div>`;
    st.querySelectorAll('.dt-map-i').forEach(b=>b.addEventListener('click',()=>{ open(c.evidence[+b.dataset.i]); b.classList.add('got'); }));
  }
  function viewEv(){
    const got=c.evidence.filter(e=>prog.found.includes(e.id));
    view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
      ${got.length?`<div class="dt-evs">${got.map(e=>`<button class="dt-evc t-${e.type}" data-id="${e.id}"><i>${detEvIcon(e.type)}</i><div><b>${escapeHtml(e.title)}</b><span>${escapeHtml(e.uz||'')}</span></div></button>`).join('')}</div>`:''}
      ${got.length<c.evidence.length?`<div class="dt-empty">${DET_IC.ev}<b>${c.evidence.length-got.length} ta dalil hali topilmadi</b><span>Jinoyat joyini yana bir bor ko'zdan kechiring.</span><button class="dt-btn2" id="dtToScene">Sahnaga qaytish</button></div>`:''}
    </div></div>`;
    view.querySelectorAll('.dt-evc').forEach(b=>b.addEventListener('click',()=>detEvidenceModal(c.evidence.find(e=>e.id===b.dataset.id),c)));
    const ts=view.querySelector('#dtToScene'); if(ts) ts.addEventListener('click',()=>show('scene'));
  }
  function viewSus(){
    view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
      <div class="dt-tip">${DET_IC.ear}<span>Avval faqat tinglang. Tushunmasangiz, matnni ochishingiz mumkin — lekin bu yakuniy ballni biroz kamaytiradi.</span></div>
      ${c.suspects.map((s,i)=>{ const heard=prog.heard.includes(s.id), rev=prog.reveal.includes(s.id);
        return `<div class="dt-sus" data-id="${s.id}">
          <div class="dt-sus-h">${detAvatar(s,i)}<div><b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.role)}</span></div>${heard?'<em>tinglandi</em>':''}</div>
          <p class="dt-sus-bio">${escapeHtml(s.bio||'')}</p>
          <div class="dt-sus-a"><button class="dt-play" data-a="play">${DET_IC.play}<span>So'roqni tinglash</span></button>
            <button class="dt-btn2 sm" data-a="txt">${DET_IC.txt}${rev?'Matn':'Matnni ochish'}</button></div>
          <blockquote class="dt-quote" ${rev?'':'hidden'}>${escapeHtml(s.statement)}</blockquote>
        </div>`; }).join('')}
    </div></div>`;
    view.querySelectorAll('.dt-sus').forEach(card=>{
      const s=c.suspects.find(x=>x.id===card.dataset.id), pb=card.querySelector('[data-a=play]');
      pb.addEventListener('click',()=>{
        if(pb.classList.contains('on')){ detStopVoice(); pb.classList.remove('on'); pb.innerHTML=`${DET_IC.play}<span>So'roqni tinglash</span>`; return; }
        view.querySelectorAll('.dt-play.on').forEach(x=>{ x.classList.remove('on'); x.innerHTML=`${DET_IC.play}<span>So'roqni tinglash</span>`; });
        pb.classList.add('on'); pb.innerHTML=`${DET_IC.stop}<span>Gapirmoqda…</span><i class="dt-eq"><b></b><b></b><b></b></i>`;
        if(!prog.heard.includes(s.id)){ prog.heard.push(s.id); save(); }
        detSpeak(s.statement,detVoiceProfile(s),null,()=>{ pb.classList.remove('on'); pb.innerHTML=`${DET_IC.play}<span>Qayta tinglash</span>`; });
      });
      card.querySelector('[data-a=txt]').addEventListener('click',e=>{
        const q=card.querySelector('.dt-quote'); q.hidden=!q.hidden;
        if(!q.hidden&&!prog.reveal.includes(s.id)){ prog.reveal.push(s.id); save(); }
        e.currentTarget.lastChild.textContent=q.hidden?'Matnni ochish':'Matnni yopish';
      });
    });
  }
  function viewAcc(){
    const st=detStore(); const prev=(st.solved||{})[c.id];
    const miss=c.evidence.length-prog.found.length;
    view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
      <div class="dt-acc-h">${DET_IC.gavel}<div><b>Xulosa chiqarish</b><span>${c.questions.length} ta savol, keyin aybdorni va ikki asosiy dalilni tanlaysiz.</span></div></div>
      ${miss?`<div class="dt-tip warn">${DET_IC.ev}<span>Hali ${miss} ta dalil topilmagan. Ularsiz ham davom etish mumkin, lekin xato qilish ehtimoli yuqori.</span></div>`:''}
      ${prog.heard.length<c.suspects.length?`<div class="dt-tip warn">${DET_IC.ear}<span>Barcha gumondorlar tinglanmagan (${prog.heard.length}/${c.suspects.length}).</span></div>`:''}
      ${prev?`<div class="dt-tip">${DET_IC.check}<span>Bu ish oldin ochilgan: ${prev.score} ball · ${escapeHtml(prev.rank)}. Qayta yechish yangi ball beradi, lekin mukofot berilmaydi.</span></div>`:''}
      <button class="dt-btn" id="dtStartQ">${DET_IC.gavel}<span>Boshlash</span></button>
    </div></div>`;
    view.querySelector('#dtStartQ').addEventListener('click',()=>detDeduce(c,view,prog,(res)=>detVerdict(c,view,prog,res,show)));
  }
  show(tab);
}

function detEvIcon(t){ return ({letter:DET_IC.file,manuscript:DET_IC.file,note:DET_IC.txt,phone:DET_SV('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  photo:DET_IC.frame,ticket:DET_SV('<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z"/><path d="M13 4v12"/>'),report:DET_IC.file,log:DET_IC.txt,object:DET_IC.ev})[t]||DET_IC.ev; }

/* ---------- Dalil kartasi (har tur o'z ko'rinishida) ---------- */
function detEvidenceBody(e){
  const T=s=>escapeHtml(s||''), P=s=>T(s).replace(/\n/g,'<br>');
  const kw=re=>re.test(((e.title||'')+' '+(e.caption||'')+' '+(e.lines||[]).join(' ')).toLowerCase());
  const tm=((e.caption||e.text||'').match(/\b(\d{1,2}:\d{2})\b/)||[])[1]||'00:00';
  if(e.type==='letter'||e.type==='manuscript'){
    const torn=kw(/torn/), ms=e.type==='manuscript';
    return `<div class="ev-sheet ${ms?'ms':''} ${torn?'torn':''}"><i class="fold"></i>${ms?'':'<i class="stain"></i>'}<div class="ev-sheet-in">${P(e.text)}</div>${ms?'<div class="ev-pg">— 212 —</div>':''}</div>`;
  }
  if(e.type==='note') return `<div class="ev-sticky"><i class="tape"></i>${P(e.text)}</div>`;
  if(e.type==='phone') return `<div class="ev-phone2"><div class="ev-ph-bar"><span>${T(((e.chat||[])[0]||{}).time||'21:41')}</span><span class="ev-ph-ic"><i></i><i></i><i></i><b></b></span></div>
    <div class="ev-ph-head">${DET_SV('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0"/>')}<span>Unlocked by police · evidence copy</span></div>
    <div class="ev-ph-list">${(e.chat||[]).map(m=>`<div class="ev-bub ${/draft|not sent/i.test(m.from)?'out':''}"><small>${T(m.from)}</small><p>${T(m.text)}</p><em>${T(m.time)}${/draft|not sent/i.test(m.from)?' · not sent':''}</em></div>`).join('')}${e.text?`<div class="ev-bub"><p>${P(e.text)}</p></div>`:''}</div></div>`;
  if(e.type==='photo') return `<div class="ev-cctv"><div class="ev-cctv-scr"><svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="cvig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient></defs>
      <rect width="320" height="180" fill="#3A4236"/><path d="M0 128 L320 112 L320 180 L0 180Z" fill="#2C3229"/><rect x="26" y="34" width="84" height="98" fill="#454E40"/><rect x="34" y="44" width="30" height="40" fill="#5E6A57"/>
      <path d="M210 40h6v90h-6zM228 40h6v90h-6zM246 40h6v90h-6zM264 40h6v90h-6z" fill="#525C4C"/><path d="M200 40h80v5h-80z" fill="#5E6A57"/>
      <g fill="#151913" opacity=".92"><ellipse cx="168" cy="66" rx="11" ry="12"/><path d="M150 80q18-6 36 0l6 44-6 3-4 34h-9l-3-30-3 30h-9l-4-34-6-3z"/><rect x="186" y="98" width="16" height="12" rx="2"/></g>
      <rect width="320" height="180" fill="url(#cvig)"/></svg>
      <div class="ev-cctv-hud"><span><b class="rec"></b>REC</span><span>CAM 02 · EXT</span></div><div class="ev-cctv-ts">${T(tm)}:${String((tm.length*7)%60).padStart(2,'0')} · ${new Date().getFullYear()}</div></div>
      <p class="ev-cctv-cap">${P(e.caption||e.text)}</p></div>`;
  if(e.type==='ticket') return `<div class="ev-tkt"><div class="ev-tkt-main">${(e.lines||[]).map((l,i)=>`<div class="${i===0?'h':''}">${T(l)}</div>`).join('')}<div class="ev-bar"></div></div><div class="ev-tkt-stub"><span>ADMIT ONE</span></div></div>`;
  if(e.type==='object') return `<div class="ev-bag"><div class="ev-bag-h"><b>EVIDENCE</b><span>Item ${T(e.id).toUpperCase()}</span></div><div class="ev-bag-in">${(e.lines||[]).map((l,i)=>`<div class="${i===0?'h':''}">${T(l)}</div>`).join('')}${e.text?`<p>${P(e.text)}</p>`:''}</div><div class="ev-seal">SEALED</div></div>`;
  if(e.type==='report') return `<div class="ev-rep"><div class="ev-rep-h"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 34 8v11c0 9-6 15-14 18C12 34 6 28 6 19V8z" fill="#1E2A44"/><path d="M20 10l2.4 4.8 5.3.8-3.8 3.7.9 5.3L20 22.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" fill="#E6B54A"/></svg>
      <div><b>METROPOLITAN POLICE</b><span>Forensic &amp; Investigation Unit · Form F-12</span></div></div>
      ${(e.rows||[]).map(r=>`<div class="r"><span>${T(r[0])}</span><b>${T(r.slice(1).join(' · '))}</b></div>`).join('')}${e.text?`<p>${P(e.text)}</p>`:''}
      <div class="ev-rep-f"><span>Officer: D.S. Karimova</span><i class="ev-stamp">VERIFIED</i></div></div>`;
  if(e.type==='log'){ const term=kw(/alarm|panel|access|door|keycard|system|login/);
    if(term) return `<div class="ev-term"><div class="ev-term-h"><i></i><i></i><i></i><span>${T(e.title)}</span></div><pre>${(e.rows||[]).map(r=>`<span class="t">${T(r[0])}</span>  ${r.slice(1).map((x,j)=>`<span class="${/DISARM|DENIED|OFF|FAIL/i.test(x)?'bad':/ARMED|OK|GRANTED/i.test(x)?'ok':''}">${T(x)}</span>`).join('  ')}`).join('\n')}<span class="cur">_</span></pre></div>`;
    return `<div class="ev-book"><div class="ev-book-h">${T(e.title)}</div><table>${(e.rows||[]).map(r=>`<tr>${r.map(x=>`<td>${T(x)}</td>`).join('')}</tr>`).join('')}</table></div>`; }
  return `<div class="ev-sticky">${P(e.text||e.caption)}</div>`;
}
function detEvidenceModal(e,c){
  if(!e) return;
  const m=document.createElement('div'); m.className='dt-modal';
  m.innerHTML=`<div class="dt-sheet" role="dialog" aria-modal="true">
    <div class="dt-sheet-h"><span class="dt-evk t-${e.type}">${detEvIcon(e.type)}</span><div><small>Dalil · ${escapeHtml(DET_ROOMS[c.scene]||'')}</small><b>${escapeHtml(e.title)}</b></div>
      <button class="dt-ib" data-a="x" aria-label="Yopish">${DET_IC.x}</button></div>
    <div class="dt-sheet-b">${detEvidenceBody(e)}
      ${e.uz?`<div class="dt-uz">${DET_IC.spark}<span>${escapeHtml(e.uz)}</span></div>`:''}</div>
  </div>`;
  document.body.appendChild(m); requestAnimationFrame(()=>m.classList.add('on'));
  const close=()=>{ m.classList.remove('on'); setTimeout(()=>m.remove(),260); document.removeEventListener('keydown',k); };
  const k=ev=>{ if(ev.key==='Escape') close(); };
  document.addEventListener('keydown',k);
  m.addEventListener('click',ev=>{ if(ev.target===m) close(); });
  m.querySelector('[data-a=x]').addEventListener('click',close);
}

/* ---------- Xulosa: savollar → ayblov ---------- */
function detDeduce(c,view,prog,done){
  const ans=[]; let i=0;
  const q=()=>{
    const Q=c.questions[i];
    view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
      <div class="dt-qp">${c.questions.map((_,j)=>`<i class="${j<i?'d':j===i?'c':''}"></i>`).join('')}<i class="${i>=c.questions.length?'c':''}"></i></div>
      <div class="dt-qk">Savol ${i+1} / ${c.questions.length}</div>
      <div class="dt-q">${escapeHtml(Q.q)}</div>
      <div class="dt-opts">${Q.options.map((o,j)=>`<button class="dt-opt" data-j="${j}"><span class="k">${'ABCD'[j]}</span><span>${escapeHtml(o)}</span></button>`).join('')}</div>
      <p class="dt-qn">Javob ayblovdan keyin ochiladi. Kerak bo'lsa, dalillar va so'roqlarga qaytib, tekshirib oling.</p>
    </div></div>`;
    view.querySelectorAll('.dt-opt').forEach(b=>b.addEventListener('click',()=>{ ans[i]=+b.dataset.j; b.classList.add('sel'); setTimeout(()=>{ i++; i<c.questions.length?q():accuse(); },220); }));
  };
  const accuse=()=>{
    let who=null; const keys=new Set();
    const got=c.evidence.filter(e=>prog.found.includes(e.id));
    const paint=()=>{
      view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
        <div class="dt-qp">${c.questions.map(()=>'<i class="d"></i>').join('')}<i class="c"></i></div>
        <div class="dt-qk">Ayblov</div><div class="dt-q">Kim aybdor?</div>
        <div class="dt-pick">${c.suspects.map((s,j)=>`<button class="dt-pk ${who===s.id?'on':''}" data-s="${s.id}">${detAvatar(s,j)}<b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.role)}</span></button>`).join('')}</div>
        <div class="dt-q" style="font-size:17px;margin-top:22px">Qaysi ikki dalil buni isbotlaydi?</div>
        <div class="dt-evs pick">${(got.length?got:c.evidence).map(e=>`<button class="dt-evc t-${e.type} ${keys.has(e.id)?'on':''}" data-e="${e.id}"><i>${detEvIcon(e.type)}</i><div><b>${escapeHtml(e.title)}</b></div><em>${keys.has(e.id)?DET_IC.check:''}</em></button>`).join('')}</div>
        <div class="dt-sticky"><button class="dt-btn danger" id="dtAccuse" ${who&&keys.size===2?'':'disabled'}>${DET_IC.gavel}<span>Ayblov e'lon qilish</span></button></div>
      </div></div>`;
      view.querySelectorAll('.dt-pk').forEach(b=>b.addEventListener('click',()=>{ who=b.dataset.s; paint(); }));
      view.querySelectorAll('.dt-evc').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.e; if(keys.has(id)) keys.delete(id); else if(keys.size<2) keys.add(id); else showToast('Faqat ikkita dalil tanlang',IC.info); paint(); }));
      const ab=view.querySelector('#dtAccuse'); if(ab) ab.addEventListener('click',()=>done({ans,who,keys:[...keys]}));
    };
    paint();
  };
  q();
}
function detVerdict(c,view,prog,res,show){
  const qOk=c.questions.map((Q,j)=>res.ans[j]===Q.answer), qN=qOk.filter(Boolean).length;
  const right=res.who===c.solution.culprit, kOk=res.keys.filter(k=>c.solution.key.includes(k)).length;
  let score=Math.round(qN/c.questions.length*60 + (right?25:0) + kOk*7.5 - Math.min(9,prog.reveal.length*3));
  score=Math.max(0,Math.min(100,score)); const rank=detRank(score);
  const st=detStore(); st.solved=st.solved||{}; st.ach=st.ach||{}; const first=!st.solved[c.id];
  const before=detCareer().idx;
  if(right && (first || score>(st.solved[c.id].score||0))) st.solved[c.id]={score,rank,at:Date.now(),q:[qN,c.questions.length],k:kOk,rev:prog.reveal.length,sus:c.suspects.length,scene:c.scene,ai:!!c.ai};
  const newAch=[];
  if(right){ const give=id=>{ if(!st.ach[id]){ st.ach[id]=Date.now(); newAch.push(id); } };
    if(!prog.reveal.length) give('clean'); if(score>=100) give('perfect'); if(c.ai) give('ai');
    if(new Set(Object.values(st.solved).map(x=>x.scene)).size>=3) give('rooms'); }
  detStore(st);
  if(c.grand && right && score>=60){ st.cert={rank:detCareer().idx,score,at:Date.now(),no:st.certNo||('WD-DET-'+Date.now().toString(36).toUpperCase().slice(-6))}; st.certNo=st.cert.no; detStore(st); }
  const after=detCareer(); const promoted=after.idx>before;
  if(promoted){ try{ const id='det_'+after.rank.id; if(ACHIEVEMENTS[id]) unlockAch(id); }catch(e){} }
  detSyncTitles();
  let xp=0; if(first&&right){ xp=Math.max(8,Math.round(score/4)); try{ addXP(xp); }catch(e){} try{ addCoins(10,true); }catch(e){} }
  try{ SFX.play(right?'duelWin':'duelLose'); }catch(e){}
  const cul=c.suspects.find(s=>s.id===c.solution.culprit), ci=c.suspects.indexOf(cul);
  const ev=id=>c.evidence.find(e=>e.id===id);
  view.innerHTML=`<div class="dt-scroll"><div class="dt-col">
    <div class="dt-vd ${right?'ok':'bad'}">
      <div class="dt-vd-k">${right?'Ish ochildi':"Noto'g'ri ayblov"}</div>
      <div class="dt-vd-sc"><b>${score}</b><span>/ 100</span></div>
      <div class="dt-vd-r">${escapeHtml(rank)}</div>
      ${xp?`<div class="dt-vd-rw"><span>${DET_SV('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>')}+${xp} XP</span><span class="coin">${COIN_SVG}+10 WC</span></div>`:''}
    </div>
    ${c.grand?(right&&score>=60?`<div class="dt-promo">${detMedal(after.idx,58)}<div><small>Tasdiqnoma ochildi</small><b>Katta tergov yakunlandi</b><span>Lobbydagi "Tasdiqnomani olish" tugmasi faol</span></div></div>`:`<div class="dt-tip warn">${DET_IC.gavel}<span>Tasdiqnoma uchun katta tergovni 60+ ball bilan yechish kerak. Qayta urinib ko'ring.</span></div>`):''}
    ${promoted?`<div class="dt-promo">${detMedal(after.idx,58)}<div><small>Yangi unvon</small><b>${after.rank.uz}</b><span>${after.rank.en}</span></div></div>`:''}
    ${newAch.length?`<div class="dt-achs">${newAch.map(id=>{ const a=DET_ACH.find(x=>x.id===id); return `<div class="dt-ach got">${detAchIcon(a,true)}<div><b>${a.uz}</b><span>${a.d}</span></div></div>`; }).join('')}</div>`:''}
    <div class="dt-lbl">Aybdor</div>
    <div class="dt-culprit">${detAvatar(cul,ci)}<div><b>${escapeHtml(cul.name)}</b><span>${escapeHtml(cul.role)}</span></div>${right?`<em class="ok">${DET_IC.check}</em>`:`<em class="bad">${DET_IC.x}</em>`}</div>
    <div class="dt-lbl">Qanday sodir bo'ldi</div>
    <article class="dt-dossier sm"><p>${escapeHtml(c.solution.how)}</p><p><b>Motive.</b> ${escapeHtml(c.solution.motive)}</p>
      <button class="dt-listen" id="dtSolL">${DET_IC.ear}<span>Tinglash</span></button></article>
    <div class="dt-lbl">Asosiy dalillar</div>
    <div class="dt-evs">${c.solution.key.map(id=>{ const e=ev(id); const chosen=res.keys.includes(id); return e?`<div class="dt-evc t-${e.type} static"><i>${detEvIcon(e.type)}</i><div><b>${escapeHtml(e.title)}</b><span>${chosen?'Siz ham tanladingiz':'Siz tanlamadingiz'}</span></div><em class="${chosen?'ok':'bad'}">${chosen?DET_IC.check:DET_IC.x}</em></div>`:''; }).join('')}</div>
    <div class="dt-lbl">Savollar · ${qN}/${c.questions.length}</div>
    <div class="dt-rev">${c.questions.map((Q,j)=>`<div class="dt-rv ${qOk[j]?'ok':'bad'}"><b>${escapeHtml(Q.q)}</b><span>${qOk[j]?'To‘g‘ri':'Siz: '+escapeHtml(Q.options[res.ans[j]]||'—')}</span><p>${escapeHtml(Q.options[Q.answer])}. ${escapeHtml(Q.why||'')}</p></div>`).join('')}</div>
    ${prog.reveal.length?`<p class="dt-qn">So'roq matnlari ${prog.reveal.length} marta ochildi: −${Math.min(9,prog.reveal.length*3)} ball.</p>`:''}
    <div style="display:grid;gap:10px;margin-top:18px">
      <button class="dt-btn" id="dtAgain">${DET_IC.gavel}<span>Qayta tergov qilish</span></button>
    </div>
  </div></div>`;
  const sl=view.querySelector('#dtSolL'); let on=false;
  sl.addEventListener('click',()=>{ if(on){ detStopVoice(); on=false; sl.classList.remove('on'); return; } on=true; sl.classList.add('on'); detSpeak(c.solution.how+' '+c.solution.motive,'hannah',1,()=>{ on=false; sl.classList.remove('on'); }); });
  view.querySelector('#dtAgain').addEventListener('click',()=>show('acc'));
}

/* =================== 3D JINOYAT JOYI (birinchi shaxs, yopiq xona) ===================
   7 xil xona; dalil o'rinlari hammasida bir xil nomda: desk, table, chair, floor,
   door, window, wall, wall2, shelf, bin. Har dalil turi o'z 3D buyumi bilan
   chiqadi (qog'oz, telefon, devor kamerasi, oyoq izlari, shisha...) va yonida
   raqamli politsiya belgisi turadi. */
const DET_ROOMS={study:'Kabinet',office:'Ofis',hotel:'Mehmonxona xonasi',kitchen:'Oshxona',train:'Poyezd kupesi',gallery:'Galereya zali',library:'Kutubxona'};
const DET_SPOT_KEYS=['desk','table','chair','floor','door','window','wall','wall2','shelf','bin'];

function detTex(THREE,w,h,draw,rep){
  const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); draw(g,w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
  if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); } return t;
}
function detRand(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%10000)/10000; }; }
const DET_TEX={
  wood(g,w,h,base){ const r=detRand(7); g.fillStyle=base||'#7A5539'; g.fillRect(0,0,w,h); const pw=h/6;
    for(let i=0;i<6;i++){ const y=i*pw; g.fillStyle=`rgba(${r()>.5?'255,230,200':'40,20,8'},${.04+r()*.07})`; g.fillRect(0,y,w,pw);
      for(let k=0;k<14;k++){ g.strokeStyle=`rgba(30,15,5,${.08+r()*.12})`; g.lineWidth=1+r()*1.5; g.beginPath(); const yy=y+r()*pw; g.moveTo(0,yy); g.bezierCurveTo(w*.3,yy+(r()-.5)*8,w*.7,yy+(r()-.5)*8,w,yy+(r()-.5)*5); g.stroke(); }
      g.fillStyle='rgba(20,10,4,.55)'; g.fillRect(0,y,w,2); const off=r()*w; g.fillRect(off,y,2,pw); }},
  wallpaper(g,w,h,base,line){ g.fillStyle=base; g.fillRect(0,0,w,h); g.fillStyle=line;
    for(let x=0;x<w;x+=32){ g.fillRect(x,0,3,h); } for(let x=16;x<w;x+=32) for(let y=12;y<h;y+=40){ g.beginPath(); g.ellipse(x,y,3,5,0,0,7); g.fill(); } },
  plaster(g,w,h,base){ const r=detRand(3); g.fillStyle=base; g.fillRect(0,0,w,h); for(let i=0;i<900;i++){ g.fillStyle=`rgba(${r()>.5?255:0},${r()>.5?255:0},${r()>.5?255:0},.025)`; g.fillRect(r()*w,r()*h,2+r()*6,2+r()*6); } },
  tiles(g,w,h,a,b){ const n=8,s=w/n; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ g.fillStyle=(i+j)%2?a:b; g.fillRect(i*s,j*s,s,s); } g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=2; for(let i=0;i<=n;i++){ g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s,h); g.moveTo(0,i*s); g.lineTo(w,i*s); g.stroke(); } },
  carpet(g,w,h,base){ const r=detRand(11); g.fillStyle=base; g.fillRect(0,0,w,h); for(let i=0;i<4000;i++){ g.fillStyle=`rgba(0,0,0,${r()*.06})`; g.fillRect(r()*w,r()*h,1.5,1.5); } },
  rug(g,w,h){ g.fillStyle='#6E2626'; g.fillRect(0,0,w,h); g.strokeStyle='#C8913A'; g.lineWidth=10; g.strokeRect(18,18,w-36,h-36); g.lineWidth=3; g.strokeRect(40,40,w-80,h-80);
    g.fillStyle='rgba(200,145,58,.5)'; for(let x=70;x<w-60;x+=46) for(let y=70;y<h-60;y+=46){ g.beginPath(); g.moveTo(x,y-10); g.lineTo(x+10,y); g.lineTo(x,y+10); g.lineTo(x-10,y); g.fill(); } },
  stone(g,w,h,base){ const r=detRand(5); g.fillStyle=base; g.fillRect(0,0,w,h); const s=w/4; g.strokeStyle='rgba(0,0,0,.14)'; g.lineWidth=2;
    for(let i=0;i<4;i++) for(let j=0;j<4;j++){ g.fillStyle=`rgba(0,0,0,${r()*.05})`; g.fillRect(i*s,j*s,s,s); g.strokeRect(i*s,j*s,s,s); } },
  paper(g,w,h,tint,lines){ g.fillStyle=tint||'#F6F1E4'; g.fillRect(0,0,w,h); g.fillStyle='rgba(30,30,40,.55)'; const n=lines||9;
    for(let i=0;i<n;i++){ const y=h*.14+i*(h*.76/n); g.fillRect(w*.12,y,w*(.5+((i*37)%30)/100),Math.max(2,h/90)); } },
  marker(g,w,h,n){ g.fillStyle='#F5C518'; g.fillRect(0,0,w,h); g.fillStyle='#111'; g.font=`900 ${h*.62}px Inter,Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(n),w/2,h*.56); }
};

async function detScene3D(c,host,pins,onPick){
  let THREE;
  try{ THREE=await import('three'); }catch(e){ return null; }
  try{
    const dark=document.body.classList.contains('dark');
    const W=()=>host.clientWidth||360, H=()=>host.clientHeight||480;
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); renderer.setSize(W(),H());
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
    host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0E121B); scene.fog=new THREE.FogExp2(0x0E121B,.045);
    const cam=new THREE.PerspectiveCamera(62,W()/H(),.05,40); scene.add(cam);
    const T=(fn,...a)=>detTex(THREE,512,512,(g,w,h)=>fn(g,w,h,...a.slice(0,-1)),a[a.length-1]);
    const std=(o)=>new THREE.MeshStandardMaterial(Object.assign({roughness:.8,metalness:0},o));
    const add=(geo,mat,x,y,z,ry,par)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); if(ry) m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; (par||scene).add(m); return m; };
    const box=(w,h,d,mat,x,y,z,ry,par)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,ry,par);
    const cyl=(rt,rb,h,mat,x,y,z,seg)=>add(new THREE.CylinderGeometry(rt,rb,h,seg||24),mat,x,y,z);
    const picks=[];

    /* --- mebel to'plami --- */
    const woodDark=std({map:T(DET_TEX.wood,'#4A3223',[1,1]),roughness:.55});
    const woodMid=std({map:T(DET_TEX.wood,'#6B4A33',[1,1]),roughness:.6});
    const fabric=(col)=>std({color:col,roughness:.95});
    const metal=std({color:0x8A8F99,roughness:.35,metalness:.7});
    const K={
      desk(x,z,ry,mat){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
        box(1.5,.06,.75,mat||woodDark,0,.76,0,0,g); box(.5,.7,.7,mat||woodDark,-.48,.37,0,0,g); [[.7,-.33],[.7,.33]].forEach(([a,b])=>box(.05,.74,.05,mat||woodDark,a,.37,b,0,g));
        box(.42,.02,.1,metal,-.48,.55,.36,0,g); return g; },
      table(x,z,r){ cyl(r||.4,r||.4,.04,woodMid,x,.72,z); cyl(.04,.06,.7,woodDark,x,.36,z); cyl(.25,.28,.03,woodDark,x,.015,z); },
      chair(x,z,ry,col){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
        box(.5,.08,.5,fabric(col||0x2E3E57),0,.46,0,0,g); box(.5,.55,.07,fabric(col||0x2E3E57),0,.76,-.22,0,g);
        [[-.21,-.21],[.21,-.21],[-.21,.21],[.21,.21]].forEach(([a,b])=>box(.04,.44,.04,woodDark,a,.22,b,0,g)); return g; },
      shelf(x,z,ry,w){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g); const ww=w||1.3;
        box(ww,2.1,.34,woodDark,0,1.05,0,0,g); const bc=[0x7D3429,0x2F5D62,0xB58A3B,0x34466E,0x5E4331,0x8A7A5A]; const r=detRand(ww*100|0);
        for(let s=0;s<4;s++){ box(ww-.06,.03,.3,woodMid,0,.25+s*.48,.02,0,g); let px=-ww/2+.06;
          while(px<ww/2-.12){ const bw=.04+r()*.05, bh=.26+r()*.14; box(bw,bh,.22,std({color:bc[(r()*6)|0],roughness:.85}),px+bw/2,.27+s*.48+bh/2,.04,0,g); px+=bw+.008; } } return g; },
      bin(x,z){ return cyl(.16,.12,.36,std({color:0x5D636E,roughness:.5,metalness:.4}),x,.18,z); },
      lamp(x,y,z){ cyl(.08,.12,.03,metal,x,y+.015,z); cyl(.012,.012,.36,metal,x,y+.2,z); const sh=cyl(.1,.17,.18,std({color:0xE9D8B4,roughness:.7,emissive:0x6B4A1A,emissiveIntensity:.4}),x,y+.42,z);
        const L=new THREE.SpotLight(0xFFC98A,9,6,Math.PI/3.2,.6,1.6); L.position.set(x,y+.38,z); L.target.position.set(x,0,z); L.castShadow=true; L.shadow.mapSize.set(1024,1024); L.shadow.bias=-.0008; scene.add(L,L.target); return L; },
      bed(x,z,ry){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g); box(1.5,.35,2.0,woodDark,0,.18,0,0,g); box(1.42,.18,1.9,fabric(0xE8E2D6),0,.44,0,0,g);
        box(1.42,.06,1.1,fabric(0x7A2E2E),0,.55,.35,0,g); box(.5,.12,.32,fabric(0xF3EFE6),-.38,.6,-.72,0,g); box(.5,.12,.32,fabric(0xF3EFE6),.38,.6,-.72,0,g); box(1.5,.9,.06,woodDark,0,.6,-1.0,0,g); return g; },
      counter(x,z,w,ry){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g); box(w,.86,.6,std({color:0x3B4A5C,roughness:.6}),0,.43,0,0,g);
        box(w+.04,.04,.64,std({color:0xD9D4CA,roughness:.35}),0,.88,0,0,g); for(let i=0;i<Math.floor(w/.6);i++) box(.02,.6,.01,metal,-w/2+.3+i*.6,.5,.305,0,g); return g; },
      frame(x,y,z,ry,w,h,col){ const g=new THREE.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; scene.add(g); box(w+.1,h+.1,.05,std({color:0x4B3A26,roughness:.4,metalness:.3}),0,0,0,0,g);
        if(col!=null) box(w,h,.06,std({color:col,roughness:.9}),0,0,.005,0,g); return g; }
    };

    /* --- xona: devorlar, pol, ship, eshik, deraza --- */
    const R=(DET_ROOMS[c.scene]?c.scene:'study');
    const P={study:{w:5,d:5,h:2.9,floor:['wood','#6B4A33'],wall:['wallpaper','#5C4A3E','rgba(200,170,120,.12)']},
      office:{w:6,d:5,h:2.9,floor:['carpet','#3D4552'],wall:['plaster','#B9B4AA']},
      hotel:{w:5,d:5.5,h:2.8,floor:['carpet','#5A4636'],wall:['wallpaper','#8C7A63','rgba(255,255,255,.08)']},
      kitchen:{w:5,d:4.5,h:2.8,floor:['tiles','#D8D2C6','#3E4652'],wall:['plaster','#C9C2B4']},
      train:{w:2.5,d:3.4,h:2.4,floor:['carpet','#3A2E2A'],wall:['wood','#5A3A2B']},
      gallery:{w:8,d:7,h:4,floor:['stone','#BDB3A3'],wall:['plaster','#D9D3C8']},
      library:{w:6,d:6,h:3.3,floor:['wood','#5A3E2B'],wall:['wallpaper','#2F3B35','rgba(200,180,120,.1)']}}[R];
    const fT=P.floor[0]==='tiles'?T(DET_TEX.tiles,P.floor[1],P.floor[2],[P.w/2,P.d/2]):T(DET_TEX[P.floor[0]],P.floor[1],[P.w/1.5,P.d/1.5]);
    const wT=P.wall[0]==='wallpaper'?T(DET_TEX.wallpaper,P.wall[1],P.wall[2],[P.w/1.2,P.h/1.6]):T(DET_TEX[P.wall[0]],P.wall[1],[P.w/2,P.h/2]);
    const hw=P.w/2, hd=P.d/2;
    const floor=add(new THREE.PlaneGeometry(P.w,P.d),std({map:fT,roughness:.75}),0,0,0); floor.rotation.x=-Math.PI/2; floor.castShadow=false;
    const ceil=add(new THREE.PlaneGeometry(P.w,P.d),std({color:0x1A1C22,roughness:1}),0,P.h,0); ceil.rotation.x=Math.PI/2;
    const wm=std({map:wT,roughness:.92});
    const wall=(w,x,z,ry)=>{ const m=add(new THREE.PlaneGeometry(w,P.h),wm,x,P.h/2,z,ry); m.castShadow=false; return m; };
    wall(P.w,0,-hd,0); wall(P.w,0,hd,Math.PI); wall(P.d,-hw,0,Math.PI/2); wall(P.d,hw,0,-Math.PI/2);
    [[P.w,0,-hd+.02,0],[P.w,0,hd-.02,Math.PI],[P.d,-hw+.02,0,Math.PI/2],[P.d,hw-.02,0,-Math.PI/2]].forEach(([w,x,z,ry])=>box(w,.12,.03,woodDark,x,.06,z,ry));
    /* deraza (orqa devorda) — oy nuri */
    const winX=R==='train'?.25:hw*.45, winY=R==='train'?1.4:1.55;
    box(R==='train'?1.4:1.2,R==='train'?.8:1.3,.04,std({color:0x0A1428,roughness:.1,metalness:.2,emissive:0x0A1A3A,emissiveIntensity:.6}),winX,winY,-hd+.03);
    const wf=std({color:0x2B211A,roughness:.6}); box(R==='train'?1.5:1.3,.06,.1,wf,winX,winY-(R==='train'?.43:.68),-hd+.05); box(.05,R==='train'?.8:1.3,.06,wf,winX,winY,-hd+.05);
    const moon=new THREE.DirectionalLight(0x8FB0FF,dark?.55:.7); moon.position.set(winX,winY+1.5,-hd-2); moon.target.position.set(0,0,.5); moon.castShadow=true;
    moon.shadow.mapSize.set(1024,1024); moon.shadow.camera.left=-hw; moon.shadow.camera.right=hw; moon.shadow.camera.top=P.h; moon.shadow.camera.bottom=-1; scene.add(moon,moon.target);
    scene.add(new THREE.HemisphereLight(0xA8B4D0,0x2E241A,.55));
    const fill=new THREE.PointLight(0xFFE2C0,R==='library'?3.2:2,Math.max(P.w,P.d)*1.6,1.2); fill.position.set(0,P.h-.35,0); scene.add(fill);
    const shade=cyl(.22,.3,.12,std({color:0x2A2A2E,emissive:0x6B4A1A,emissiveIntensity:.35,roughness:.6}),0,P.h-.12,0); shade.castShadow=false;
    /* eshik (o'ng devorda) */
    const doorZ=R==='train'?.9:hd*.45;
    box(.06,2.05,.95,woodMid,hw-.04,1.03,doorZ); box(.08,2.15,.06,woodDark,hw-.05,1.07,doorZ-.5); box(.08,2.15,.06,woodDark,hw-.05,1.07,doorZ+.5); cyl(.03,.03,.06,metal,hw-.1,1.0,doorZ-.32,12).rotation.z=Math.PI/2;

    /* --- xona bo'yicha mebel va dalil o'rinlari (spot: [x,y,z, devor normali?]) --- */
    let S={}, lampL=null;
    if(R==='study'){
      K.desk(0,-hd+.75); K.chair(.1,-hd+1.45,Math.PI); lampL=K.lamp(-.5,.79,-hd+.6); K.shelf(-hw+.2,-.3,Math.PI/2,1.5); K.table(hw-.9,.3,.35); K.chair(hw-.9,1.05,Math.PI*1.1,0x5A2E2E); K.bin(-.95,-hd+.5);
      const rug=add(new THREE.PlaneGeometry(2.6,1.8),std({map:detTex(THREE,512,384,DET_TEX.rug),roughness:.95}),.1,.006,.2); rug.rotation.x=-Math.PI/2; rug.castShadow=false;
      K.frame(-hw+.03,1.65,1.3,Math.PI/2,.8,.6,0x3E5A4C); box(.9,.8,.4,woodDark,hw-.25,.4,doorZ+1.1);
      S={desk:[.25,.8,-hd+.7],table:[hw-.9,.75,.3],chair:[.1,.51,-hd+1.45],floor:[.3,.01,.6],door:[hw-.25,.81,doorZ+1.1],window:[winX+.75,1.9,-hd+.05,'z'],wall:[-hw+.05,1.65,1.3,'x'],wall2:[-1.2,1.7,-hd+.05,'z'],shelf:[-hw+.38,1.25,-.3],bin:[-.95,.37,-hd+.5]};
    } else if(R==='office'){
      K.desk(-.6,-hd+.8,0,std({color:0x2B2F38,roughness:.4})); K.chair(-.6,-hd+1.5,Math.PI,0x1F2937); lampL=K.lamp(-1.1,.79,-hd+.6);
      const cab=box(.6,1.3,.6,std({color:0x6B7280,roughness:.4,metalness:.5}),hw-.4,.65,-hd+.5); for(let i=0;i<3;i++) box(.5,.02,.01,metal,hw-.4,.35+i*.4,-hd+.81);
      K.table(1,.6,.45); K.chair(1.6,.9,-Math.PI/2.4,0x334155); K.chair(.4,.9,Math.PI/2.4,0x334155); K.shelf(-hw+.2,.6,Math.PI/2,1.6); K.bin(.4,-hd+.5);
      K.frame(-.6,1.9,-hd+.03,0,1.3,.75,0x1E2A44);
      S={desk:[-.3,.8,-hd+.75],table:[1,.75,.6],chair:[-.6,.51,-hd+1.5],floor:[.2,.01,.1],door:[hw-.05,1.3,doorZ-.9,'-x'],window:[winX-.8,1.6,-hd+.05,'z'],wall:[-.6,1.9,-hd+.06,'z'],wall2:[-hw+.05,1.7,-1.3,'x'],shelf:[hw-.4,1.31,-hd+.5],bin:[.4,.37,-hd+.5]};
    } else if(R==='hotel'){
      K.bed(-.6,-.6); const ns=box(.45,.5,.4,woodDark,.45,.25,-hd+.35); lampL=K.lamp(.45,.5,-hd+.35); K.desk(hw-.5,.9,-Math.PI/2); K.chair(hw-1.15,.9,Math.PI/2,0x6B4E3A);
      const tray=cyl(.3,.3,.03,metal,-.6,.62,.85); K.bin(hw-.4,1.85); box(.9,1.9,.55,woodMid,-hw+.3,.95,1.6);
      K.frame(-.6,1.6,-hd+.03,0,1.1,.6,0x7D6A4C);
      S={desk:[hw-.5,.8,.6],table:[.45,.51,-hd+.3],chair:[hw-1.15,.51,.9],floor:[.6,.01,1.1],door:[hw-.05,1.3,doorZ+.9,'-x'],window:[winX+.6,1.9,-hd+.05,'z'],wall:[-.6,1.6,-hd+.06,'z'],wall2:[-hw+.05,1.55,.3,'x'],shelf:[-.6,.65,.85],bin:[hw-.4,.37,1.85]};
    } else if(R==='kitchen'){
      K.counter(-.4,-hd+.32,3.2); box(.6,.04,.5,std({color:0x1F2328,roughness:.3,metalness:.6}),.7,.91,-hd+.32); [[.55,-hd+.2],[.85,-hd+.2],[.55,-hd+.45],[.85,-hd+.45]].forEach(([x,z])=>cyl(.08,.08,.012,metal,x,.93,z));
      K.table(.3,.6,.55); K.chair(.3,1.35,Math.PI,0x8A5A3A); K.chair(-.45,.6,Math.PI/2,0x8A5A3A); K.chair(1.05,.6,-Math.PI/2,0x8A5A3A);
      box(.7,1.9,.6,std({color:0xD8D4CC,roughness:.4,metalness:.3}),-hw+.4,.95,.5); K.bin(-hw+.35,1.4); lampL=new THREE.PointLight(0xFFD7A0,6,7,1.7); lampL.position.set(.3,2.3,.6); lampL.castShadow=true; scene.add(lampL);
      cyl(.18,.25,.15,std({color:0x1F2937,emissive:0x5A3A10,emissiveIntensity:.5}),.3,2.4,.6);
      S={desk:[-1.2,.91,-hd+.3],table:[.4,.75,.6],chair:[-.45,.51,.6],floor:[-.9,.01,1.3],door:[hw-.05,1.3,doorZ-.8,'-x'],window:[winX+.7,1.9,-hd+.05,'z'],wall:[-.9,1.5,-hd+.06,'z'],wall2:[-hw+.05,1.5,-.9,'x'],shelf:[-hw+.4,1.91,.5],bin:[-hw+.35,.37,1.4]};
    } else if(R==='train'){
      const seat=fabric(0x2F4A6B); box(.8,.42,2.4,seat,.82,.21,.1); box(.12,.75,2.4,seat,1.18,.75,.1); box(.8,.42,2.4,seat,-.82,.21,.1); box(.12,.75,2.4,seat,-1.18,.75,.1);
      box(.9,.04,.45,woodMid,.25,.74,-hd+.3); box(.05,.74,.05,metal,.25,.37,-hd+.4); box(.6,.04,1.8,metal,-.82,1.95,-.1); box(.45,.32,.6,std({color:0x5B3A28,roughness:.7}),-.82,2.13,-.3);
      K.bin(.95,1.4); lampL=new THREE.PointLight(0xFFD7A8,4,5,1.8); lampL.position.set(0,2.25,0); lampL.castShadow=true; scene.add(lampL);
      S={desk:[.4,.76,-hd+.28],table:[.05,.76,-hd+.32],chair:[.82,.43,.5],floor:[0,.01,.4],door:[hw-.05,1.3,doorZ-.15,'-x'],window:[winX-.55,1.05,-hd+.1],wall:[-hw+.05,1.5,.9,'x'],wall2:[hw-.05,1.6,-.6,'-x'],shelf:[-.82,1.98,.3],bin:[.95,.37,1.4]};
    } else if(R==='gallery'){
      [[-2.4,1.9,0x2F5D62],[-.6,1.8,0xB58A3B],[1.4,2.2,null]].forEach(([x,y,col])=>K.frame(x,y,-hd+.04,0,col==null?.9:1,col==null?.7:.75,col));
      const lad=std({color:0x8F7556,roughness:.7}); box(.05,2.6,.05,lad,1.15,1.3,-hd+.35); box(.05,2.6,.05,lad,1.65,1.3,-hd+.35); for(let k=0;k<6;k++) box(.55,.04,.04,lad,1.4,.3+k*.42,-hd+.35);
      box(.6,1,.6,std({color:0xE3DDD2,roughness:.9}),-1.6,.5,-1); box(1.8,.45,.45,woodDark,-.3,.25,.6); K.desk(hw-.8,1.4,-Math.PI/2); K.chair(hw-1.5,1.4,Math.PI/2,0x1F2937);
      box(.6,1.8,.45,std({color:0x6B7280,roughness:.4,metalness:.5}),-hw+.3,.9,1.9); lampL=K.lamp(hw-.8,.79,1.0);
      const sp=new THREE.SpotLight(0xFFE6C2,14,8,.5,.5,1.4); sp.position.set(1.4,3.8,-1.2); sp.target.position.set(1.4,2,-hd); sp.castShadow=true; scene.add(sp,sp.target);
      S={desk:[hw-.8,.8,1.6],table:[-1.6,1.01,-1],chair:[-.3,.48,.6],floor:[1.3,.01,-2.2],door:[hw-.05,1.3,doorZ-1.6,'-x'],window:[winX+.9,2.4,-hd+.06,'z'],wall:[-hw+.06,1.45,-.6,'x'],wall2:[1.4,2.2,-hd+.07,'z'],shelf:[-hw+.3,1.81,1.9],bin:[hw-.5,.37,2.6]};
      K.bin(hw-.5,2.6);
    } else { /* library */
      K.shelf(-hw+.2,-1.2,Math.PI/2,1.6); K.shelf(-hw+.2,.6,Math.PI/2,1.6); K.shelf(-1.2,-hd+.2,0,1.6); K.shelf(.6,-hd+.2,0,1.6);
      box(2.2,.06,.9,woodDark,.2,.76,.2); [[-.8,-.2],[1.2,-.2],[-.8,.6],[1.2,.6]].forEach(([x,z])=>box(.06,.74,.06,woodDark,x,.37,z));
      K.chair(.2,.95,Math.PI,0x3E5A4C); K.chair(.2,-.55,0,0x3E5A4C); lampL=K.lamp(-.4,.79,.1); K.lamp(.9,.79,.3); K.table(hw-.9,1.3,.35); K.bin(hw-.5,-hd+.5);
      S={desk:[.5,.8,.2],table:[hw-.9,.75,1.3],chair:[.2,.51,.95],floor:[-.6,.01,1.4],door:[hw-.05,1.3,doorZ-.9,'-x'],window:[winX+.8,1.95,-hd+.06,'z'],wall:[hw-.05,1.6,-.9,'-x'],wall2:[-1.2,2.3,-hd+.3],shelf:[.6,1.25,-hd+.4],bin:[hw-.5,.37,-hd+.5]};
    }

    /* --- qo'shimcha jihozlar: o'simlik, soat, ilgich, qutilar, parda, radiator, qog'ozlar, krujka --- */
    (function decor(){
      const used=Object.values(S).map(v=>[v[0],v[2]]); const free=(x,z,r)=>used.every(([a,b])=>Math.hypot(a-x,b-z)>(r||.6));
      const plant=(x,z)=>{ cyl(.16,.12,.3,std({color:0x8A5A3A,roughness:.8}),x,.15,z); for(let k=0;k<7;k++){ const l=add(new THREE.SphereGeometry(.13+((k*7)%3)*.03,10,8),std({color:[0x2F5D3A,0x3C6E45,0x264D30][k%3],roughness:.9}),x+Math.cos(k*.9)*.1,.42+(k%3)*.12,z+Math.sin(k*.9)*.1); l.scale.y=1.4; } };
      const crates=(x,z)=>{ const cm=std({color:0x9C7A52,roughness:.9}); box(.45,.35,.4,cm,x,.175,z,.2); box(.38,.3,.34,cm,x+.05,.5,z-.02,-.15); box(.3,.25,.3,std({color:0xB89466,roughness:.9}),x-.35,.125,z+.15,.5); };
      const clock=(x,y,z,ry)=>{ const g=new THREE.Group(); g.position.set(x,y,z); g.rotation.y=ry; scene.add(g); const f=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.04,32),std({color:0xF4EFE4})); f.rotation.x=Math.PI/2; g.add(f);
        const r=new THREE.Mesh(new THREE.TorusGeometry(.16,.015,8,32),std({color:0x3A2C22,metalness:.4,roughness:.4})); g.add(r); const h=new THREE.Mesh(new THREE.BoxGeometry(.01,.1,.01),std({color:0x111111})); h.position.set(0,.04,.025); g.add(h);
        const m=new THREE.Mesh(new THREE.BoxGeometry(.008,.13,.01),std({color:0x111111})); m.position.set(.04,.0,.025); m.rotation.z=-1.2; g.add(m); };
      const coat=(x,z)=>{ cyl(.02,.02,1.75,woodDark,x,.88,z); cyl(.2,.22,.03,woodDark,x,.015,z); const cm=fabric(0x3A3F4A); const c1=add(new THREE.CylinderGeometry(.08,.2,.9,12),cm,x+.1,1.15,z); c1.rotation.z=.12; };
      const radiator=(x,z)=>{ for(let k=0;k<10;k++) box(.05,.5,.12,std({color:0xE5E1D8,roughness:.5,metalness:.3}),x-.27+k*.06,.4,z); };
      const curtain=(x,y,z,w)=>{ const cm=fabric(R==='hotel'?0x7A2E2E:R==='library'?0x2F3B35:0x5A4A3A); [[-1,1]].flat().forEach(sd=>{ const cu=box(.32,P.h-.4,.05,cm,x+sd*(w/2+.18),(P.h-.4)/2+.2,z+.08); }); box(w+.9,.03,.03,metal,x,P.h-.18,z+.1); };
      const mug=(x,y,z)=>{ cyl(.04,.035,.09,std({color:0xEDE7DB,roughness:.4}),x,y+.045,z); const hnd=new THREE.Mesh(new THREE.TorusGeometry(.025,.007,6,12,Math.PI),std({color:0xEDE7DB})); hnd.position.set(x+.045,y+.05,z); hnd.rotation.z=-Math.PI/2; scene.add(hnd); };
      const stack=(x,y,z)=>{ for(let k=0;k<4;k++) box(.24-k*.01,.035,.17,std({color:[0x7D3429,0x2F5D62,0xB58A3B,0x34466E][k],roughness:.8}),x,y+.018+k*.036,z,k*.15); };
      const scattered=(x,y,z)=>{ for(let k=0;k<3;k++){ const pp=new THREE.Mesh(new THREE.PlaneGeometry(.21,.29),std({map:detTex(THREE,256,360,(g,w,h)=>DET_TEX.paper(g,w,h,'#F3EEE2',8)),roughness:.9})); pp.rotation.x=-Math.PI/2; pp.rotation.z=k*.7-.4; pp.position.set(x+k*.12,y+.003+k*.001,z+(k%2)*.08); scene.add(pp); } };
      if(R!=='train'){ if(free(-hw+.4,hd-.4)) plant(-hw+.4,hd-.4); if(free(hw-.4,-hd+.4,.5)) plant(hw-.45,-hd+.45);
        clock(-hw+.03,2.1,-.4,Math.PI/2); if(free(hw-.5,hd-.5)) coat(hw-.35,hd-.35); if(free(-hw+.5,-hd+.6)) crates(-hw+.5,-hd+.6);
        radiator(winX,-hd+.12); curtain(winX,winY,-hd,R==='train'?1.4:1.2); }
      else { box(.5,.35,.3,std({color:0x2B2F38,roughness:.6}),.82,.6,-.6); mug(-.15,.76,-hd+.3); }
      const dk=S.desk, tb=S.table; if(dk){ mug(dk[0]-.45,dk[1],dk[2]+.12); stack(dk[0]+.45,dk[1],dk[2]-.05); scattered(dk[0]-.2,dk[1],dk[2]-.15); }
      if(tb&&R!=='gallery') mug(tb[0]+.18,tb[1],tb[2]-.1);
    })();

    /* --- dalil buyumlari --- */
    const tags=[]; const sp=(k)=>S[k]||S.floor;
    const kw=(e,re)=>re.test(((e.title||'')+' '+(e.caption||'')+' '+(e.lines||[]).join(' ')).toLowerCase());
    const marker=(n,x,y,z,ry)=>{ const g=new THREE.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; scene.add(g);
      const mt=std({map:detTex(THREE,128,96,(gg,w,h)=>DET_TEX.marker(gg,w,h,n)),roughness:.5});
      const a=new THREE.Mesh(new THREE.PlaneGeometry(.12,.09),mt); a.position.set(0,.045,.025); a.rotation.x=-.45; a.castShadow=true; g.add(a);
      const b=new THREE.Mesh(new THREE.PlaneGeometry(.12,.09),std({color:0xF5C518})); b.position.set(0,.045,-.025); b.rotation.x=.45; b.rotation.y=Math.PI; g.add(b); return g; };
    const paper=(x,y,z,tint,ry,lines,w,h)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w||.21,h||.29),std({map:detTex(THREE,256,360,(g,ww,hh)=>DET_TEX.paper(g,ww,hh,tint,lines)),roughness:.9}));
      m.rotation.x=-Math.PI/2; m.rotation.z=ry||0; m.position.set(x,y+.004,z); m.receiveShadow=true; scene.add(m); return m; };
    const onWall=(p)=>{ const n=p[3]; return n==='z'?0:n==='-z'?Math.PI:n==='x'?Math.PI/2:n==='-x'?-Math.PI/2:null; };
    c.evidence.forEach((e,i)=>{
      const p=sp(e.spot), x=p[0], y=p[1], z=p[2], wr=onWall(p); let obj, at=[x,y+.05,z];
      if(wr!=null){ /* devordagi buyumlar */
        const g=new THREE.Group(); g.position.set(x,y,z); g.rotation.y=wr; scene.add(g);
        if(e.type==='photo'||kw(e,/camera|cctv|doorbell/)){ box(.12,.1,.16,std({color:0xE8E8E8,roughness:.4}),0,0,.08,0,g); const l=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.04,18),std({color:0x111111,roughness:.2,metalness:.5})); l.rotation.x=Math.PI/2; l.position.set(0,-.01,.17); g.add(l);
          const led=new THREE.Mesh(new THREE.SphereGeometry(.008,8,8),new THREE.MeshBasicMaterial({color:0xFF2A2A})); led.position.set(.04,.03,.165); g.add(led); led.userData.blink=true; }
        else if(kw(e,/panel|alarm|keypad/)){ box(.32,.42,.05,std({color:0x1F2937,roughness:.4,metalness:.3}),0,0,.025,0,g); const s=new THREE.Mesh(new THREE.PlaneGeometry(.24,.14),new THREE.MeshBasicMaterial({color:0x34D399}));
          s.position.set(0,.08,.052); g.add(s); for(let k=0;k<9;k++){ const b=new THREE.Mesh(new THREE.PlaneGeometry(.05,.035),std({color:0x9CA3AF})); b.position.set(-.07+(k%3)*.07,-.06-Math.floor(k/3)*.05,.052); g.add(b); } }
        else if(kw(e,/frame|painting|portrait/)){ /* bo'sh rom — mavjud ramka */ const f=new THREE.Mesh(new THREE.PlaneGeometry(.8,.6),std({color:0xEDE7DB})); f.position.set(0,0,.03); g.add(f); }
        else { const m=new THREE.Mesh(new THREE.PlaneGeometry(.21,.29),std({map:detTex(THREE,256,360,(gg,w,h)=>DET_TEX.paper(gg,w,h,e.type==='note'?'#FFF0A6':'#F6F1E4',6))})); m.position.set(0,0,.01); m.rotation.z=.05; g.add(m);
          const pin=new THREE.Mesh(new THREE.SphereGeometry(.012,8,8),std({color:0xB3261E})); pin.position.set(0,.13,.02); g.add(pin); }
        g.traverse(o=>{ if(o.isMesh){ o.userData.ev=e.id; picks.push(o); } }); obj=g; at=[x,y,z];
        const v=new THREE.Vector3(0,0,.3).applyAxisAngle(new THREE.Vector3(0,1,0),wr); at=[x+v.x*.3,y,z+v.z*.3];
      } else if(e.spot==='floor'||kw(e,/footprint|shoe|track/)){
        if(kw(e,/footprint|shoe|track/)){ const g=new THREE.Group(); scene.add(g); const fm=new THREE.MeshStandardMaterial({color:0x2A1C12,roughness:1,transparent:true,opacity:.75});
          for(let k=0;k<7;k++){ const f=new THREE.Mesh(new THREE.CircleGeometry(.055,16),fm); f.scale.set(1,2,1); f.rotation.x=-Math.PI/2; f.rotation.z=.15;
            f.position.set(x-.5+k*.22+(k%2?.06:-.06),.008,z-.3+k*.12); f.userData.ev=e.id; picks.push(f); g.add(f); } obj=g; }
        else { obj=paper(x,y,z,'#F6F1E4',.4); obj.userData.ev=e.id; picks.push(obj); }
      } else if(e.type==='phone'){ obj=box(.075,.01,.15,std({color:0x111318,roughness:.25,metalness:.5}),x,y+.005,z,.5);
        const s=new THREE.Mesh(new THREE.PlaneGeometry(.065,.135),new THREE.MeshBasicMaterial({color:0xBFD6FF})); s.rotation.x=-Math.PI/2; s.rotation.z=.5; s.position.set(x,y+.011,z); scene.add(s);
        const gl=new THREE.PointLight(0x9DB8FF,.35,.8); gl.position.set(x,y+.08,z); scene.add(gl); [obj,s].forEach(o=>{ o.userData.ev=e.id; picks.push(o); }); }
      else if(e.type==='ticket'){ obj=paper(x,y,z,'#FFFDF5',.3,5,.08,.18); obj.userData.ev=e.id; picks.push(obj); }
      else if(e.type==='object'&&kw(e,/bottle|pill|tablet|medicine/)){ obj=cyl(.028,.028,.09,std({color:0x9A5B12,roughness:.2,metalness:.1,transparent:true,opacity:.85}),x,y+.045,z);
        const cap=cyl(.03,.03,.02,std({color:0xF3F3F3}),x,y+.1,z); [obj,cap].forEach(o=>{ o.userData.ev=e.id; picks.push(o); }); obj.rotation.z=Math.PI/2; obj.position.y=y+.03; cap.rotation.z=Math.PI/2; cap.position.set(x+.055,y+.03,z); }
      else if(e.type==='object'&&kw(e,/earplug|packet|bag/)){ obj=box(.09,.02,.06,std({color:0xE85D9A,roughness:.6}),x,y+.01,z,.3); obj.userData.ev=e.id; picks.push(obj); }
      else if(e.type==='object'&&kw(e,/key/)){ obj=new THREE.Mesh(new THREE.TorusGeometry(.02,.006,8,20),metal); obj.rotation.x=-Math.PI/2; obj.position.set(x,y+.006,z); scene.add(obj); const s=box(.06,.008,.01,metal,x+.045,y+.006,z); [obj,s].forEach(o=>{ o.userData.ev=e.id; picks.push(o); }); }
      else if(e.type==='report'){ obj=box(.24,.01,.32,std({color:0x6B4A2B,roughness:.6}),x,y+.005,z,.2); const pp=paper(x,y+.01,z,'#FAFAF7',.2,11,.21,.28); box(.08,.02,.03,metal,x+Math.sin(.2)*-.14,y+.02,z-.14);
        [obj,pp].forEach(o=>{ o.userData.ev=e.id; picks.push(o); }); }
      else if(e.type==='log'){ obj=box(.2,.025,.28,std({color:0x1E2A44,roughness:.7}),x,y+.012,z,-.2); obj.userData.ev=e.id; picks.push(obj); const pp=paper(x+.01,y+.027,z,'#F3EEE2',-.2,8,.18,.26); pp.userData.ev=e.id; picks.push(pp); }
      else if(e.type==='manuscript'){ for(let k=0;k<4;k++){ const pp=paper(x+k*.01,y+k*.003,z-k*.008,'#F4EFE3',.1-k*.04,12); pp.userData.ev=e.id; picks.push(pp); } }
      else if(e.type==='note'){ obj=paper(x,y,z,'#FFF0A6',-.3,5,.12,.12); obj.userData.ev=e.id; picks.push(obj); }
      else { obj=paper(x,y,z,e.type==='letter'?'#F1EADB':'#F6F1E4',.25,10); obj.userData.ev=e.id; picks.push(obj);
        if(e.type==='letter'&&kw(e,/torn/)){ const p2=paper(x+.14,y,z+.05,'#F1EADB',-.6,5,.12,.15); p2.userData.ev=e.id; picks.push(p2); } }
      if(wr==null){ const mk=marker(i+1,x+.16,y,z+.1,-.4); mk.traverse(o=>{ if(o.isMesh){ o.userData.ev=e.id; picks.push(o); } }); }
      tags.push({e,v:new THREE.Vector3(...at)});
    });
    /* qotillik/zaharlanish — poldagi tana chizig'i (ochiq-oydin tafsilotsiz) */
    if(['murder','poison'].includes(c.crime)){ const fp=S.floor; const g=new THREE.Group(); g.position.set(fp[0]-.2,.009,fp[2]-.6); g.rotation.y=.6; scene.add(g);
      const tm=new THREE.MeshBasicMaterial({color:0xF2F2F2,transparent:true,opacity:.8});
      const shape=[[0,-.75],[.16,-.55],[.18,-.1],[.42,.05],[.2,.12],[.14,.38],[.08,.55],[0,.6],[-.08,.55],[-.14,.38],[-.2,.12],[-.42,-.1],[-.18,-.1],[-.16,-.55]];
      for(let k=0;k<shape.length;k++){ const a=shape[k], b=shape[(k+1)%shape.length]; const L=Math.hypot(b[0]-a[0],b[1]-a[1]); const s=new THREE.Mesh(new THREE.PlaneGeometry(L,.018),tm);
        s.rotation.x=-Math.PI/2; s.rotation.z=-Math.atan2(b[1]-a[1],b[0]-a[0]); s.position.set((a[0]+b[0])/2,0,(a[1]+b[1])/2); g.add(s); } }

    /* --- qo'l fonari (kameraga biriktirilgan) --- */
    const torch=new THREE.SpotLight(0xFFF4E0,0,8,.45,.75,2); torch.castShadow=false; cam.add(torch); torch.position.set(.08,-.05,0); torch.target.position.set(0,-.1,-1); cam.add(torch.target);

    /* --- birinchi shaxs kamera --- */
    const eye=R==='train'?[0,1.5,hd-.45]:R==='gallery'?[0,1.65,hd-1.0]:[0,1.6,hd-.7];
    cam.position.set(...eye);
    let yaw=0, pitch=-.12, tYaw=0, tPitch=-.12, fov=62, tFov=62, idleT=0, lastInput=performance.now(), intro=1, vYaw=0, vPitch=0;
    const YAW=1.35; const pos=new THREE.Vector3(...eye), tPos=pos.clone();
    const M=.45; const clampPos=v=>{ v.x=Math.max(-hw+M,Math.min(hw-M,v.x)); v.z=Math.max(-hd+M,Math.min(hd-M,v.z)); return v; };
    const look=()=>{ cam.rotation.order='YXZ'; cam.rotation.y=yaw; cam.rotation.x=pitch; };
    const dom=renderer.domElement; dom.style.touchAction='none';
    let drag=null;
    dom.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()}; intro=0; vYaw=vPitch=0; lastInput=performance.now(); try{ dom.setPointerCapture(e.pointerId); }catch(_){} });
    dom.addEventListener('pointermove',e=>{ if(!drag) return; const k=fov/62, dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY;
      /* barmoq o'ngga — nigoh o'ngga (to'liq 360°) */
      const ay=-dx*.0055*k, ap=-dy*.0045*k; tYaw+=ay; tPitch=Math.max(-1.05,Math.min(.6,tPitch+ap)); vYaw=ay; vPitch=ap; lastInput=performance.now(); });
    dom.addEventListener('pointercancel',()=>{ drag=null; });
    const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(); let pinsHost=pins, pickCb=onPick;
    dom.addEventListener('pointerup',e=>{ const d=drag; drag=null; if(!d) return; if(Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>6) return;
      const r=dom.getBoundingClientRect(); ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(ptr,cam);
      const hit=ray.intersectObjects(picks,false)[0]; if(hit){ const ev=c.evidence.find(x=>x.id===hit.object.userData.ev); if(ev) focus(ev); return; }
      /* polni bosish — o'sha joyga yurish */
      const fh=ray.intersectObject(floor,false)[0]; if(fh){ tPos.set(fh.point.x,eye[1],fh.point.z); clampPos(tPos); lastInput=performance.now(); } });
    /* dalilga burilish (dramatik yaqinlashish) */
    const focus=(ev)=>{ const t=tags.find(q=>q.e.id===ev.id); if(!t){ pickCb(ev); return; }
      /* dalilga yaqinlashib (1.1 m gacha), unga buriladi */
      const flat=new THREE.Vector3(t.v.x-pos.x,0,t.v.z-pos.z), dist=flat.length();
      if(dist>1.6){ tPos.copy(pos).add(flat.multiplyScalar((dist-1.1)/dist)); tPos.y=eye[1]; clampPos(tPos); }
      const d=t.v.clone().sub(tPos); let ty=Math.atan2(-d.x,-d.z); while(ty-tYaw>Math.PI) ty-=2*Math.PI; while(ty-tYaw<-Math.PI) ty+=2*Math.PI;
      tYaw=ty; tPitch=Math.max(-1.05,Math.min(.6,Math.atan2(d.y,Math.hypot(d.x,d.z))));
      tFov=Math.max(30,Math.min(44,d.length()*12)); intro=0; lastInput=performance.now();
      setTimeout(()=>{ pickCb(ev); setTimeout(()=>{ tFov=62; },300); },650); };

    /* 2D belgilar */
    let pinEls=[]; const buildPins=()=>{ pinsHost.innerHTML=''; pinEls=tags.map((t,i)=>{ const el=document.createElement('button'); el.className='dt-pin'; el.innerHTML=`<b>${i+1}</b>`;
      el.setAttribute('aria-label',t.e.title); el.addEventListener('click',ev=>{ ev.stopPropagation(); focus(t.e); }); pinsHost.appendChild(el); return {el,v:t.v,e:t.e}; }); };
    buildPins();
    const proj=new THREE.Vector3(), fwd=new THREE.Vector3();
    const placePins=()=>{ const w=W(), h=H(); cam.getWorldDirection(fwd); pinEls.forEach(p=>{ proj.copy(p.v); const toP=proj.clone().sub(cam.position); const front=toP.dot(fwd)>0;
      proj.project(cam); const vis=front&&Math.abs(proj.x)<1.05&&Math.abs(proj.y)<1.05; p.el.style.transform=`translate(${((proj.x+1)/2*w).toFixed(1)}px,${((1-proj.y)/2*h).toFixed(1)}px)`; p.el.style.opacity=vis?1:0; p.el.style.pointerEvents=vis?'auto':'none'; }); };

    /* kirish: qorong'ida fonar yonadi, kamera xonani sekin ko'zdan kechiradi */
    const baseLamp=lampL?lampL.intensity:0; if(lampL) lampL.intensity=0;
    const t0=performance.now(); tYaw=-YAW*.5; yaw=-YAW*.6; pitch=-.25; tPitch=-.18;
    let raf=null, running=true, last=t0;
    const blink=[]; scene.traverse(o=>{ if(o.userData&&o.userData.blink) blink.push(o); });
    const loop=(now)=>{ if(!running) return; const dt=Math.min(.05,(now-last)/1000); last=now; const el=(now-t0)/1000;
      if(intro){ const k=Math.min(1,el/3.6), e2=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; tYaw=-YAW*.5+YAW*.5*e2; tPitch=-.18+.06*e2; if(k>=1) intro=0;
        torch.intensity=Math.min(3.2,el*2.4); if(lampL) lampL.intensity=baseLamp*Math.min(1,Math.max(0,(el-.8)/1.6)); }
      else if(!drag&&(Math.abs(vYaw)>1e-4||Math.abs(vPitch)>1e-4)){ tYaw+=vYaw; tPitch=Math.max(-1.05,Math.min(.6,tPitch+vPitch)); vYaw*=.9; vPitch*=.9; }
      else if(now-lastInput>4500){ idleT+=dt; tYaw+=Math.sin(idleT*.25)*.0009; tPitch+=Math.cos(idleT*.31)*.0005; }
      yaw+=(tYaw-yaw)*Math.min(1,dt*8); pitch+=(tPitch-pitch)*Math.min(1,dt*8); fov+=(tFov-fov)*Math.min(1,dt*4);
      const step=pos.distanceTo(tPos); if(step>.005){ pos.lerp(tPos,Math.min(1,dt*2.6)); }
      cam.fov=fov; cam.updateProjectionMatrix(); cam.position.set(pos.x,eye[1]+Math.sin(el*1.1)*.006+(step>.02?Math.sin(el*9)*.012:0),pos.z); look();
      if(lampL&&!intro) lampL.intensity=baseLamp*(.97+Math.sin(el*9)*.015+Math.sin(el*23)*.01);
      blink.forEach(b=>b.visible=Math.floor(el*1.6)%2===0);
      renderer.render(scene,cam); placePins(); raf=requestAnimationFrame(loop); };
    const onResize=()=>{ renderer.setSize(W(),H()); cam.aspect=W()/H(); cam.updateProjectionMatrix(); };
    window.addEventListener('resize',onResize);
    raf=requestAnimationFrame(loop);
    return {
      mark(found){ pinEls.forEach((p,i)=>{ const g=found.includes(p.e.id); p.el.classList.toggle('got',g); p.el.innerHTML=g?DET_IC.check:`<b>${i+1}</b>`; }); },
      pause(){ running=false; if(raf) cancelAnimationFrame(raf); },
      mount(h2,p2,cb){ host=h2; pinsHost=p2; pickCb=cb; host.appendChild(renderer.domElement); buildPins(); onResize(); if(!running){ running=true; last=performance.now(); raf=requestAnimationFrame(loop); } },
      dispose(){ running=false; if(raf) cancelAnimationFrame(raf); window.removeEventListener('resize',onResize);
        scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); try{ renderer.forceContextLoss(); }catch(e){} }
    };
  }catch(e){ console.warn('[det3d]',e); return null; }
}

/* ===== KATTA TERGOV — Inspektor unvonidan keyin ochiladi; 60+ ball = tasdiqnoma ===== */
const DET_GRAND={
  id:'grand-ledger', grand:true, crime:'fraud', scene:'office', level:'B2–C1',
  title:'The Final Ledger', title_uz:'Oxirgi daftar',
  place:'Kumush Bank head office, Tashkent', time:'Sunday, 22:30–23:30',
  victim:{name:'Murod Saidov', role:'senior internal auditor, 58'},
  brief:[
    `At 06:40 on Monday a cleaner found Murod Saidov, the bank's senior internal auditor, dead on the floor of the ninth-floor archive office. The police doctor says he was struck once from behind between 22:30 and 23:30 on Sunday night. The archive safe was open. Eighteen pages had been cut out of the 2025 transfer ledger.`,
    `The building is closed on Sundays. Every door above the ground floor opens only with a personal keycard, and every card swipe is recorded. The underground garage has its own camera at the entrance ramp.`,
    `Saidov had spent three months checking unusual transfers. On Friday he told the board he would present "something serious" on Monday morning. Four people knew what he was working on.`
  ],
  suspects:[
    {id:'dilnoza', name:'Dilnoza Rahimova', role:'Deputy director, 46', voice:'diana', pitch:1.0,
     bio:`Approved most of the large transfers in 2025. Is expected to become director next year.`,
     statement:`On Sunday evening I was at home with my husband. We watched the Pakhtakor match on television — it finished just before eleven — and then we went to bed. I didn't go anywhere near the bank. Murod and I disagreed about his methods sometimes, but he was a careful, honest man. I can't believe anyone would do this to him.`},
    {id:'akmal', name:'Akmal Tursunov', role:'IT administrator, 34', voice:'austin', pitch:.95,
     bio:`Was called in on Sunday to fix the server. Has access to every floor.`,
     statement:`The server room alarm went off, so I came in at about ten past ten. I fixed the problem and left at twenty to eleven. On my way out I saw light under the archive door on the ninth floor. Mister Saidov was talking on the phone — I heard only his voice, nobody else. I didn't want to disturb him, so I just left.`},
    {id:'sevara', name:'Sevara Nazarova', role:"The auditor's assistant, 29", voice:'hannah', pitch:1.15,
     bio:`Prepared Saidov's documents. Was angry that he refused to recommend her for promotion.`,
     statement:`I worked until about seven on Sunday. Mister Saidov asked me to print three copies of his report, very carefully, for a meeting at nine on Monday. He said: "Not for the board — for the Central Bank." He looked worried. I left the copies on his desk and went home. My keycard will show that I left at five past seven.`},
    {id:'viktor', name:'Viktor Lenz', role:'External consultant, 51', voice:'troy', pitch:.8,
     bio:`Advised the bank on the same transfers. His keycard was reported lost on Friday.`,
     statement:`I lost my keycard on Friday afternoon, after the meeting in the deputy director's office. I reported it the same evening. On Sunday night I was in the bar of my hotel, the Lotte, from half past ten until almost midnight, talking with two colleagues from Germany. I have the receipt. I was not at the bank at all that night.`}
  ],
  evidence:[
    {id:'e1', type:'log', spot:'wall', title:'Keycard access system — floor 9',
     rows:[['19:05','EXIT','S. Nazarova'],['22:08','ENTRY','A. Tursunov'],['22:39','EXIT','A. Tursunov'],['22:47','ENTRY','V. Lenz (card #4471)'],['23:21','EXIT','V. Lenz (card #4471)']],
     uz:"9-qavat eshik kartalari jurnali."},
    {id:'e2', type:'photo', spot:'window', title:'Garage entrance camera',
     caption:`22:41 — A white Chevrolet Malibu, plate 01 A 777 RA, drives down the ramp. The driver is a woman in a dark coat. The car is registered to D. Rahimova.`,
     uz:"Yer osti garaji kirish kamerasi."},
    {id:'e3', type:'ticket', spot:'table', title:'Hotel bar receipt (Lotte)',
     lines:['LOTTE CITY HOTEL · LOBBY BAR','Table 6 · Guest: V. LENZ','Opened 22:28 · Closed 23:44','3 × Black tea, 2 × Water','Signed: V. Lenz'],
     uz:"Viktorning mehmonxona bar cheki."},
    {id:'e4', type:'phone', spot:'desk', title:"Murod Saidov's phone",
     chat:[{from:'Murod → D. Rahimova',time:'21:58',text:`I have the original transfer orders with your signature. Tomorrow at 9 I take them to the Central Bank. I am sorry.`},
           {from:'D. Rahimova',time:'22:03',text:`Please wait. Let me explain tonight. Don't call anyone.`}],
     uz:"Auditorning telefonidagi yozishma."},
    {id:'e5', type:'report', spot:'shelf', title:'Archive safe — inspection',
     rows:[['Safe','Opened with the correct code'],['Missing','2025 ledger, pages 41–58'],['On missing pages','Transfers approved by D. Rahimova (copy found in report)'],['Tool','Paper knife from the desk']],
     uz:"Ochiq seyf haqida ekspertiza."},
    {id:'e6', type:'note', spot:'door', title:"Sevara's note on the door",
     text:`Report printed 18:55 — 3 copies.\nFor the Central Bank, Mon 09:00.\nOriginals in the safe. — S.N.`,
     uz:"Sevaraning eshikdagi eslatmasi."},
    {id:'e7', type:'report', spot:'floor', title:'Footprints near the safe',
     rows:[['Surface','Polished floor, dust from cut paper'],['Shoe','Women\u2019s, size 38, narrow heel'],['Direction','From the door to the safe and back'],['Note','No second set of prints near the body']],
     uz:"Seyf yonidagi oyoq izlari."},
    {id:'e8', type:'object', spot:'bin', title:'Envelope in the bin',
     lines:['Brown envelope, empty','Printed: "ORIGINALS — DO NOT REMOVE"','Torn open, not cut','Traces of red lipstick on the flap'],
     uz:"Axlat qutisidagi bo'sh konvert."}
  ],
  questions:[
    {q:`Viktor's keycard opened the ninth floor at 22:47. Why is it unlikely that Viktor used it himself?`,
     options:[`The card was blocked on Friday`,`The hotel receipt shows he was in the bar from 22:28 to 23:44`,`Akmal saw him in the garage`,`He did not know the safe code`],
     answer:1, why:`The receipt places Viktor at the Lotte from 22:28 to 23:44, so someone else used the card he lost in the deputy director's office.`},
    {q:`Dilnoza says she watched the match at home until about 23:00. Which evidence shows this is false?`,
     options:[`Sevara's note`,`The footprints only`,`The garage camera at 22:41`,`The torn envelope`],
     answer:2, why:`Her car, with her registration, entered the bank garage at 22:41 — six minutes before Viktor's card was used on floor 9.`},
    {q:`Akmal says he heard only one voice at about 22:38. Is his story consistent with the other evidence?`,
     options:[`No — the access log shows he left at 23:21`,`Yes — he left at 22:39, before anyone else entered at 22:47`,`No — his shoes are size 38`,`Yes — because he fixed the server`],
     answer:1, why:`The log shows his exit at 22:39, and Saidov was on the phone then. The next entry is the stolen card at 22:47.`},
    {q:`Why did Saidov's death have to happen on Sunday night, from the killer's point of view?`,
     options:[`The building was empty on Mondays`,`He planned to take the original orders to the Central Bank at 09:00 on Monday`,`The safe code changed on Monday`,`Viktor was leaving the country`],
     answer:1, why:`His message at 21:58 and Sevara's note both say the meeting with the Central Bank was at 09:00 on Monday.`},
    {q:`What connects the missing ledger pages to one person?`,
     options:[`They were printed by Sevara`,`They contained transfers approved by Dilnoza Rahimova`,`They were in Viktor's handwriting`,`They were found in the garage`],
     answer:1, why:`The safe report says the cut pages showed transfers approved by D. Rahimova, the same orders Saidov mentioned in his message.`}
  ],
  solution:{culprit:'dilnoza', key:['e1','e2'],
    how:`At 21:58 Saidov told Dilnoza Rahimova he would take her signed transfer orders to the Central Bank at nine. She drove to the bank — the garage camera recorded her car at 22:41 — and entered floor 9 at 22:47 with Viktor Lenz's keycard, which had gone missing from her own office on Friday. Viktor was in his hotel bar at the time. She struck Saidov, cut out the pages with her signatures and left at 23:21, leaving her prints by the safe and lipstick on the torn envelope.`,
    motive:`The ledger proved that Rahimova had approved illegal transfers for more than a year. Saidov's report would have ended her career and sent her to prison the next morning.`}
};
const DET_PRICE={murder:80,poison:70,theft:60,disappear:90,fraud:60,blackmail:70,arson:70,sabotage:60,smuggling:50,cyber:50,random:50};
/* Unvonlarni ilovaning titul tizimiga (profil, liga) ulash */
function detSyncTitles(){
  try{ if(!window.__wdAch||typeof ACHIEVEMENTS==='undefined') return; const C=detCareer(); let changed=false;
    for(let i=1;i<=C.idx;i++){ const id='det_'+DET_RANKS[i].id; if(ACHIEVEMENTS[id]&&!window.__wdAch.has(id)){ window.__wdAch.add(id); changed=true; } }
    if(changed){ const top='det_'+DET_RANKS[C.idx].id; if(!window.__wdTitleId||/^det_/.test(window.__wdTitleId)){ window.__wdTitleId=top; try{ window.__wdSyncProfile&&window.__wdSyncProfile(); }catch(e){} } try{ saveState(); }catch(e){} }
  }catch(e){}
}

/* ---------- Martaba: unvon, yutuqlar ---------- */
function detCareer(){
  const st=detStore(), sv=Object.values(st.solved||{});
  const solved=sv.length, avg=solved?Math.round(sv.reduce((a,x)=>a+(x.score||0),0)/solved):0;
  let idx=0; DET_RANKS.forEach((r,i)=>{ if(solved>=r.need.solved&&avg>=r.need.avg) idx=i; });
  const next=DET_RANKS[idx+1]||null;
  const qa=sv.reduce((a,x)=>[a[0]+(x.q?x.q[0]:0),a[1]+(x.q?x.q[1]:0)],[0,0]);
  const ka=sv.reduce((a,x)=>a+(x.k||0),0);
  const listen=sv.length?Math.round(sv.reduce((a,x)=>a+Math.max(0,1-(x.rev||0)/Math.max(1,x.sus||3)),0)/sv.length*100):0;
  const best=sv.slice().sort((a,b)=>(b.score||0)-(a.score||0))[0]||null;
  const ach=st.ach||{};
  return {idx,rank:DET_RANKS[idx],next,solved,avg,best,ach,
    reading:qa[1]?Math.round(qa[0]/qa[1]*100):0, evidence:solved?Math.round(ka/(solved*2)*100):0, listening:listen};
}
function detNextText(C){
  if(!C.next) return 'Eng yuqori unvon';
  const need=[]; if(C.solved<C.next.need.solved) need.push(`${C.next.need.solved-C.solved} ta ish`);
  if(C.avg<C.next.need.avg) need.push(`o'rtacha ${C.next.need.avg}+ ball`);
  return `Keyingi: ${C.next.uz} — ${need.join(', ')||'tayyor'}`;
}

/* =================== LOBBY (yangilangan) =================== */
function detOpen(){
  const P=detPage('detLobby','Ingliz detektivi','Jinoyat ishlarini ingliz tilida tergov qiling');
  let kind='random';
  const render=()=>{
    const st=detStore(), solved=st.solved||{}, C=detCareer(), all=detAllCases();
    const card=(c)=>{ const s=solved[c.id], K=DET_KINDS[c.crime]||DET_KINDS.murder, pr=detProg(c.id);
      const pct=c.evidence&&c.evidence.length?Math.round((pr.found||[]).length/c.evidence.length*100):0;
      return `<button class="dt-case" data-id="${escapeHtml(c.id)}">${detKindIcon(c.crime,46)}
        <div class="dt-case-tx"><b>${escapeHtml(c.title)}</b><span>${escapeHtml(c.title_uz||'')} · ${escapeHtml(c.place||'')}</span>
          <div class="dt-tags"><i>${K.uz}</i><i>${escapeHtml(DET_ROOMS[c.scene]||'')}</i><i>${escapeHtml(c.level||'B1–B2')}</i>${c.ai?'<i class="ai">AI</i>':''}</div></div>
        <div class="dt-case-st">${s?`<b class="ok">${s.score}</b><span>${escapeHtml(s.rank)}</span>`:(pct?`<b>${pct}%</b><span>tergovda</span>`:`<span class="new">Yangi</span>`)}</div>
      </button>`; };
    const pct=C.next?Math.min(100,Math.round(((C.solved/Math.max(1,C.next.need.solved))*.6+(C.next.need.avg?Math.min(1,C.avg/C.next.need.avg):1)*.4)*100)):100;
    P.main.innerHTML=`<div class="dt-scroll"><div class="dt-col">
      <div class="dt-career">
        <div class="dt-career-m">${detMedal(C.idx,76)}</div>
        <div class="dt-career-t"><small>Sizning unvoningiz</small><b>${C.rank.uz}</b><span>${C.rank.en}</span>
          <div class="dt-bar"><i style="width:${pct}%"></i></div><em>${detNextText(C)}</em></div>
      </div>
      <div class="dt-stats"><div><b>${C.solved}</b><span>Ochilgan ish</span></div><div><b>${C.avg||'—'}</b><span>O'rtacha ball</span></div><div><b>${C.reading||'—'}${C.reading?'%':''}</b><span>Mantiq</span></div></div>
      ${(()=>{ const open=C.idx>=2, g=solved[DET_GRAND.id], cert=st.cert;
        return `<button class="dt-grand ${open?'':'locked'}" id="dtGrand" ${open?'':'aria-disabled="true"'}>
          <div class="dg-bg"></div>
          <div class="dg-in"><div class="dg-k">${open?(cert?'Tasdiqnoma olingan':'Katta tergov ochiq'):'Inspektor unvonidan keyin ochiladi'}</div>
            <div class="dg-t">${escapeHtml(DET_GRAND.title)}</div>
            <div class="dg-s">4 gumondor · 8 dalil · 5 savol · 60+ ball = tasdiqnoma</div>
            ${g?`<div class="dg-r">Eng yaxshi natija: <b>${g.score}</b></div>`:''}</div>
          <div class="dg-ic">${open?detMedal(Math.max(2,C.idx),58):DET_SV('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>')}</div>
        </button>
        <button class="dt-btn cert" id="dtCert" ${cert?'':'disabled'}>${DET_IC.file}<span>${cert?'Tasdiqnomani olish':(open?'Tasdiqnoma — katta tergovni 60+ ball bilan yeching':'Tasdiqnoma — Inspektor unvoni va katta tergovdan keyin')}</span></button>`; })()}
      <div class="dt-lbl">Ishlar</div>
      <div class="dt-cases">${all.map(card).join('')}</div>
      <div class="dt-lbl">Yangi ish</div>
      <div class="dt-gen">
        <div class="dt-gen-h">${detMascot(46)}<div><b>Drop detektiv yangi ish ochadi</b><span>Har safar boshqa joy, voqea, gumondor va dalillar</span></div></div>
        <div class="dt-kinds" id="dtKind">
          <button data-k="random" class="${kind==='random'?'on':''}"><span class="rnd">${DET_SV('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>')}</span><b>Tasodifiy</b><em>${COIN_SVG}${DET_PRICE.random}</em></button>
          ${Object.keys(DET_KINDS).map(k=>`<button data-k="${k}" class="${kind===k?'on':''}">${detKindIcon(k,34)}<b>${DET_KINDS[k].uz}</b><em>${COIN_SVG}${DET_PRICE[k]}</em></button>`).join('')}
        </div>
        ${detTokens()?`<div class="dt-tok">${detMascot(26)}<span>Sizda <b>${detTokens()} ta</b> detektiv kaliti bor — keyingi ish bepul ochiladi</span></div>`:''}
        <button class="dt-btn" id="dtGen">${detMascot(24)}<span>${detTokens()?'Ish ochish · 1 kalit':`Ish ochish · ${DET_PRICE[kind]} WC`}</span></button>
        <p class="dt-gen-n" id="dtGenN">Tayyorlash 20–40 soniya oladi. AI ishlamasa, tayyor ishlarni o'ynashingiz mumkin.</p>
      </div>
      <div class="dt-lbl">Unvonlar</div>
      <div class="dt-ranks">${DET_RANKS.map((r,i)=>`<div class="dt-rk ${i<=C.idx?'got':''}">${detMedal(i,52,i>C.idx)}<b>${r.uz}</b><span>${r.need.solved?`${r.need.solved} ish${r.need.avg?` · ${r.need.avg}+`:''}`:'Boshlanish'}</span></div>`).join('')}</div>
      <div class="dt-lbl">Yutuqlar</div>
      <div class="dt-achs">${DET_ACH.map(a=>`<div class="dt-ach ${C.ach[a.id]?'got':''}">${detAchIcon(a,!!C.ach[a.id])}<div><b>${a.uz}</b><span>${a.d}</span></div></div>`).join('')}</div>
    </div></div>`;
    P.main.querySelectorAll('.dt-case').forEach(b=>b.addEventListener('click',()=>{ const c=detAllCases().find(x=>x.id===b.dataset.id); if(c) detCase(c,render); }));
    P.main.querySelectorAll('#dtKind button').forEach(b=>b.addEventListener('click',()=>{ kind=b.dataset.k; P.main.querySelectorAll('#dtKind button').forEach(x=>x.classList.toggle('on',x===b));
      const gs=P.main.querySelector('#dtGen span'); if(gs) gs.textContent=detTokens()?'Ish ochish · 1 kalit':`Ish ochish · ${DET_PRICE[kind]} WC`; }));
    P.main.querySelector('#dtGen').addEventListener('click',()=>{ const useTok=detTokens()>0, price=useTok?0:(DET_PRICE[kind]||50);
      if(!useTok&&coinsView()<price){ showToast(`Bu ish uchun ${price} WordCoin kerak — sizda ${coinsView()}`,IC.info); return; }
      const ks=Object.keys(DET_KINDS); detGenerate(kind==='random'?ks[Math.floor(Math.random()*ks.length)]:kind,P,render,price,useTok); });
    P.main.querySelector('#dtCert').addEventListener('click',()=>detCertDialog());
    P.main.querySelector('#dtGrand').addEventListener('click',()=>{ if(detCareer().idx<2){ showToast("Katta tergov Inspektor unvonidan keyin ochiladi",IC.info); return; } detCase(DET_GRAND,render); });
  };
  render();
}

/* =================== TASDIQNOMA (PNG / PDF) =================== */
function detCertDialog(){
  const st0=detStore(); if(!st0.cert) return;
  const C=Object.assign({},detCareer()); C.idx=st0.cert.rank; C.rank=DET_RANKS[C.idx]; C.grandScore=st0.cert.score;
  const m=document.createElement('div'); m.className='dt-modal';
  const nm=(window.__wdName||'').trim();
  m.innerHTML=`<div class="dt-sheet" role="dialog" aria-modal="true">
    <div class="dt-sheet-h">${detMedal(C.idx,40)}<div><small>Tasdiqnoma</small><b>${C.rank.uz} · ${C.rank.en}</b></div><button class="dt-ib" data-a="x" aria-label="Yopish">${DET_IC.x}</button></div>
    <div class="dt-sheet-b">
      <label class="dt-fl"><span>Tasdiqnomadagi ism (lotin harflarida)</span><input id="dtCertName" maxlength="40" value="${escapeHtml(nm)}" placeholder="Ism Familiya" autocomplete="name"></label>
      <div class="dt-cprev"><canvas id="dtCertCv"></canvas></div>
      <div class="dt-row2"><button class="dt-btn2" id="dtPng">${DET_SV('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>')}PNG</button>
        <button class="dt-btn" id="dtPdf">${DET_IC.file}<span>PDF yuklab olish</span></button></div>
    </div></div>`;
  document.body.appendChild(m); requestAnimationFrame(()=>m.classList.add('on'));
  const close=()=>{ m.classList.remove('on'); setTimeout(()=>m.remove(),260); };
  m.addEventListener('click',e=>{ if(e.target===m) close(); }); m.querySelector('[data-a=x]').addEventListener('click',close);
  const inp=m.querySelector('#dtCertName'), cv=m.querySelector('#dtCertCv');
  const st=detStore();
  const nm0=()=>inp.value.trim()||'WordDrop Learner';
  let tm=null; const draw=()=>detCertDraw(cv,nm0(),C,detSerial(nm0(),st.cert.at),st.cert.at);
  inp.addEventListener('input',()=>{ clearTimeout(tm); tm=setTimeout(draw,200); });
  draw();
  const si=detSigImg(); if(si&&!si.complete) si.addEventListener('load',draw,{once:true});
  const fname=()=>'WordDrop-Detective-'+(inp.value.trim()||'certificate').replace(/[^A-Za-z0-9]+/g,'-');
  const ready=()=>new Promise(r=>{ const i=detSigImg(); if(!i||i.complete) return r(); i.addEventListener('load',r,{once:true}); i.addEventListener('error',r,{once:true}); setTimeout(r,2500); });
  m.querySelector('#dtPng').addEventListener('click',async()=>{ await ready(); draw(); cv.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=fname()+'.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); },'image/png'); });
  m.querySelector('#dtPdf').addEventListener('click',async()=>{ await ready(); draw(); const J=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
    if(!J){ showToast("PDF moduli yuklanmadi — PNG'ni yuklab oling",IC.info); return; }
    const pdf=new J({orientation:'landscape',unit:'mm',format:'a4'}); pdf.addImage(cv.toDataURL('image/jpeg',.95),'JPEG',0,0,297,210); pdf.save(fname()+'.pdf'); });
}
/* Sertifikat seriyasi — verify.html bilan bir xil algoritm (ism + sana xeshi) */
function detSerial(name,at){
  const ini=String(name||'X').split(/\s+/).map(w=>w[0]||'').join('').toUpperCase().slice(0,3).padEnd(3,'X');
  const y=new Date(at).getFullYear(); let h=2166136261>>>0; const s=(name||'X')+at;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return 'WD-DET-'+y+'-'+ini+'-'+String(h%999999).padStart(6,'0');
}
function detVerifyUrl(name,C,at){
  const p={t:'det',n:name,o:C.grandScore,g:C.grandScore,ri:C.idx,rk:C.rank.en,ru:C.rank.uz,c:C.solved,a:C.avg,re:C.reading,li:C.listening,ev:C.evidence,d:at};
  let enc=''; try{ enc=btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }catch(e){}
  return 'https://www.worddrop-app.uz/verify/'+detSerial(name,at)+(enc?'?d='+enc:'');
}
/* Medal — to'g'ridan-to'g'ri canvas'da (har brauzerda chiqadi) */
function detMedalCanvas(g,idx,cx,cy,r){
  const R=DET_RANKS[Math.max(0,Math.min(4,idx))];
  g.save(); g.translate(cx,cy);
  const rib=(dir)=>{ g.save(); g.rotate(dir*.32); g.fillStyle=R.r; g.beginPath(); g.moveTo(-r*.28,r*.55); g.lineTo(r*.28,r*.55); g.lineTo(r*.28,r*1.45); g.lineTo(0,r*1.22); g.lineTo(-r*.28,r*1.45); g.closePath(); g.fill();
    g.fillStyle='rgba(0,0,0,.15)'; g.fillRect(-r*.28,r*.55,r*.1,r*.85); g.restore(); };
  rib(-1); rib(1);
  const mg=g.createLinearGradient(-r,-r,r,r); mg.addColorStop(0,R.m[0]); mg.addColorStop(.5,R.m[1]); mg.addColorStop(1,R.m[2]);
  g.shadowColor='rgba(0,0,0,.25)'; g.shadowBlur=r*.25; g.shadowOffsetY=r*.08;
  g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.fillStyle=mg; g.fill(); g.shadowColor='transparent';
  const hl=g.createRadialGradient(-r*.35,-r*.4,0,-r*.35,-r*.4,r*1.1); hl.addColorStop(0,'rgba(255,255,255,.6)'); hl.addColorStop(.5,'rgba(255,255,255,0)');
  g.fillStyle=hl; g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.fill();
  const gold=idx===4?'#E9B95A':'#FFFFFF';
  g.setLineDash([r*.06,r*.09]); g.strokeStyle=idx===4?'rgba(200,145,58,.9)':'rgba(255,255,255,.6)'; g.lineWidth=r*.05; g.beginPath(); g.arc(0,0,r*.8,0,Math.PI*2); g.stroke(); g.setLineDash([]);
  g.strokeStyle=gold; g.lineWidth=r*.1; g.lineCap='round'; g.beginPath(); g.arc(-r*.06,-r*.02,r*.27,0,Math.PI*2); g.stroke();
  g.beginPath(); g.moveTo(r*.14,r*.18); g.lineTo(r*.36,r*.4); g.stroke();
  for(let i=0;i<idx;i++){ const a=(-90+(i-(idx-1)/2)*24)*Math.PI/180, x=Math.cos(a)*r*.8, y=Math.sin(a)*r*.8; g.save(); g.translate(x,y); g.fillStyle=gold; g.beginPath();
    for(let k=0;k<10;k++){ const rr=k%2?r*.045:r*.1, aa=-Math.PI/2+k*Math.PI/5; g[k?'lineTo':'moveTo'](Math.cos(aa)*rr,Math.sin(aa)*rr); } g.closePath(); g.fill(); g.restore(); }
  g.restore();
}
function detCertDraw(cv,name,C,no,at){
  const W=2480,H=1754; cv.width=W; cv.height=H; const g=cv.getContext('2d');
  const blue='#1F55D6', blueD='#123A9E', ink='#0F1B3D', mute='#5B6478';
  const F=(w,sz,fam)=>`${w} ${sz}px ${fam||'Inter,"Helvetica Neue",Arial,sans-serif'}`;
  const T=(t,x,y,f,c,al,ls)=>{ g.font=f; g.fillStyle=c||ink; g.textAlign=al||'left'; if('letterSpacing' in g) g.letterSpacing=(ls||0)+'px'; g.fillText(t,x,y); if('letterSpacing' in g) g.letterSpacing='0px'; };
  g.fillStyle='#FFFFFF'; g.fillRect(0,0,W,H);
  let gr=g.createLinearGradient(0,0,W*.6,0); gr.addColorStop(0,'rgba(47,111,237,.10)'); gr.addColorStop(1,'rgba(47,111,237,0)'); g.fillStyle=gr; g.fillRect(0,0,W*.6,H);
  /* yuqori o'ng: silliq ipak to'lqinlar + ingichka himoya chiziqlari */
  const sweep=(x0,y1,c1,c2,a)=>{ g.beginPath(); g.moveTo(x0,0); g.bezierCurveTo(x0+300,H*.08,W-500,y1-80,W,y1); g.lineTo(W,0); g.closePath();
    const lg=g.createLinearGradient(x0,0,W,y1); lg.addColorStop(0,c1); lg.addColorStop(1,c2); g.globalAlpha=a; g.fillStyle=lg; g.fill(); g.globalAlpha=1; };
  sweep(W*.52,H*.62,'#DCE8FF','#9DBBFF',.55); sweep(W*.62,H*.46,'#C9DAFF','#5B8CFF',.55); sweep(W*.72,H*.32,'#7FA6FF','#2F6FED',.75); sweep(W*.83,H*.19,'#2F6FED','#123A9E',.9);
  g.lineWidth=1.6; for(let k=0;k<26;k++){ const x0=W*.5+k*34, y1=H*.66-k*22; g.beginPath(); g.moveTo(x0,0); g.bezierCurveTo(x0+300,H*.08,W-500,y1-80,W,y1); g.strokeStyle=`rgba(255,255,255,${k%3?.18:.32})`; g.stroke(); }
  /* pastki chap: yupqa aks-sado */
  g.save(); g.translate(0,H); g.scale(1,-1); g.globalAlpha=.6; for(let k=0;k<10;k++){ g.beginPath(); g.moveTo(0,H*.06+k*14); g.bezierCurveTo(W*.08,H*.05+k*12,W*.14,H*.02+k*6,W*.24-k*20,0); g.strokeStyle='rgba(47,111,237,.35)'; g.lineWidth=1.6; g.stroke(); } g.restore();
  g.strokeStyle='rgba(15,27,61,.12)'; g.lineWidth=3; g.strokeRect(70,70,W-140,H-140);
  /* logotip */
  const lx=230, ly=210; const dp=new Path2D('M12 3 C16 8 19 12 19 15.5 C19 19.5 15.5 22 12 22 C8.5 22 5 19.5 5 15.5 C5 12 8 8 12 3 Z');
  g.save(); g.translate(lx-6,ly-70); g.scale(4.2,4.2); g.fillStyle='#2F6FED'; g.fill(dp); g.save(); g.clip(dp);
  g.fillStyle='#1B4FCB'; g.beginPath(); g.ellipse(16,17,7,9,.21,0,Math.PI*2); g.fill(); g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(9,8.5,1.9,2.8,-.31,0,Math.PI*2); g.fill(); g.restore(); g.restore();
  T('WordDrop',lx+100,ly-8,F(800,46),ink); T('ENGLISH DETECTIVE ACADEMY',lx+102,ly+32,F(700,22),blue,'left',4);
  const hx=230;
  gr=g.createLinearGradient(hx,0,hx+1100,0); gr.addColorStop(0,blueD); gr.addColorStop(1,'#3B7BFF');
  g.font=F(900,190); g.fillStyle=gr; g.textAlign='left'; g.fillText('Certificate',hx,560);
  T('OF INVESTIGATIVE EXCELLENCE',hx+6,640,F(800,40),ink,'left',3);
  T('THIS CERTIFICATE IS PROUDLY PRESENTED TO',hx+6,700,F(600,26),mute,'left',3);
  let fs=124; g.font=F(800,fs); while(g.measureText(name).width>1300&&fs>70){ fs-=6; g.font=F(800,fs); }
  T(name,hx,860,F(800,fs),blue); g.fillStyle='rgba(31,85,214,.22)'; g.fillRect(hx,895,1150,3);
  T(`Awarded the rank of ${C.rank.en} · ${C.rank.uz}`,hx,975,F(800,40),ink);
  [`for completing the Grand Investigation “The Final Ledger” with a score of ${C.grandScore}/100,`,`and for careful reading, attentive listening and precise use of evidence across`,`${C.solved} solved English-language cases in the WordDrop Detective programme.`]
    .forEach((l,i)=>T(l,hx,1035+i*50,F(500,32),mute));
  [['Cases solved',String(C.solved)],['Average score',String(C.avg)],['Reasoning',C.reading+'%'],['Listening',C.listening+'%'],['Evidence',C.evidence+'%']].forEach((s,i)=>{ const x=hx+i*232, y=1215;
    g.fillStyle='rgba(47,111,237,.07)'; g.beginPath(); g.roundRect?g.roundRect(x,y,212,112,22):g.rect(x,y,212,112); g.fill();
    T(s[1],x+106,y+60,F(800,46),blueD,'center'); T(s[0].toUpperCase(),x+106,y+94,F(700,17),mute,'center',2); });
  const by=1530;
  const line=(x,w,lab,val)=>{ T(val,x,by-22,F(700,32),ink); g.fillStyle='rgba(15,27,61,.3)'; g.fillRect(x,by,w,2.5); T(lab,x,by+42,F(700,20),mute,'left',3); };
  line(hx,360,'DATE',new Date(at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}).toUpperCase());
  line(hx+430,480,'CERTIFICATE NO.',no);
  /* QR — verify.html */
  try{ if(typeof qrcode!=='undefined'){ const qr=qrcode(0,'M'); qr.addData(detVerifyUrl(name,C,at)); qr.make(); const n=qr.getModuleCount(), qs=176, cs=qs/n, qx=hx+990, qy=by-150;
      g.fillStyle='#fff'; g.fillRect(qx-10,qy-10,qs+20,qs+20); g.fillStyle=ink; for(let r=0;r<n;r++) for(let c2=0;c2<n;c2++) if(qr.isDark(r,c2)) g.fillRect(qx+c2*cs,qy+r*cs,Math.ceil(cs),Math.ceil(cs));
      T('SCAN TO VERIFY',qx+qs+28,qy+70,F(800,20),ink,'left',3); T('worddrop-app.uz/verify',qx+qs+28,qy+104,F(500,22),mute); } }catch(e){}
  /* rozetka + medal */
  const rx=W-560, ry=720, R=230;
  const rib=(dx,c)=>{ g.save(); g.translate(rx+dx,ry+R*.55); g.rotate(dx<0?.32:-.32); g.fillStyle=c; g.beginPath(); g.moveTo(-58,0); g.lineTo(58,0); g.lineTo(58,300); g.lineTo(0,250); g.lineTo(-58,300); g.closePath(); g.fill(); g.restore(); };
  rib(-95,'#7FA8F2'); rib(95,'#5B8CFF');
  g.save(); g.translate(rx,ry); g.beginPath(); for(let i=0;i<=72;i++){ const a=i/72*Math.PI*2, r=R+(i%2?0:16); g[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r); } g.closePath();
  const sg=g.createLinearGradient(-R,-R,R,R); sg.addColorStop(0,'#BFD3FF'); sg.addColorStop(1,'#5B8CFF'); g.fillStyle=sg; g.shadowColor='rgba(27,79,203,.3)'; g.shadowBlur=40; g.shadowOffsetY=16; g.fill(); g.shadowColor='transparent';
  g.beginPath(); g.arc(0,0,R-32,0,Math.PI*2); g.fillStyle='#fff'; g.fill(); g.restore();
  detMedalCanvas(g,C.idx,rx,ry-12,118);
  T(C.rank.en.toUpperCase(),rx,ry+R+300,F(900,40),blueD,'center',3);
  T('DETECTIVE RANK · '+C.rank.uz.toUpperCase(),rx,ry+R+345,F(700,20),mute,'center',4);
  /* imzo — "WordDrop" qo'lyozma uslubida */
  const sx=W-800, sw=600; g.fillStyle='rgba(15,27,61,.3)'; g.fillRect(sx,by,sw,2.5);
  T('AUTHORISED SIGNATURE · WORDDROP',sx+sw/2,by+42,F(700,19),mute,'center',3);
  const si=detSigImg();
  if(si&&si.complete&&si.naturalWidth){ const h=170, w=Math.min(sw-40,h*si.naturalWidth/si.naturalHeight); g.drawImage(si,sx+(sw-w)/2,by-h+18,w,h); }
}
/* Imzo rasmi — signature-data.js (window.__WD_SIGNATURE__), bir marta yuklanadi */
function detSigImg(){ if(!window.__WD_SIGNATURE__) return null; if(!window.__detSig){ const i=new Image(); i.src=window.__WD_SIGNATURE__; window.__detSig=i; } return window.__detSig; }
/* ---------- Bosh sahifa: eksklyuziv karta ---------- */
function detHomeBanner(){
  detSyncTitles();
  const C=detCareer(), tot=detAllCases().length;
  const st=detStore(); const prog=st.prog||{};
  const cur=detAllCases().find(c=>prog[c.id]&&(prog[c.id].found||[]).length&&!(st.solved||{})[c.id]);
  return `<button class="det-home" id="detBanner" aria-label="Ingliz detektivi">
    <svg class="dh-scene" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
      <radialGradient id="dhL" cx=".72" cy=".05" r=".9"><stop offset="0" stop-color="#FFE3A8" stop-opacity=".55"/><stop offset=".5" stop-color="#FFE3A8" stop-opacity=".08"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></radialGradient>
      <linearGradient id="dhB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2740"/><stop offset="1" stop-color="#0E1424"/></linearGradient></defs>
      <rect width="360" height="150" fill="url(#dhB)"/><path d="M250 0h22l58 150H190z" fill="url(#dhL)"/>
      <rect x="22" y="22" width="56" height="70" rx="3" fill="#24324F"/><path d="M50 22v70M22 57h56" stroke="#0E1424" stroke-width="3"/><rect x="22" y="22" width="56" height="70" rx="3" fill="none" stroke="#33466E" stroke-width="2"/>
      <circle cx="40" cy="38" r="7" fill="#C9D6F2" opacity=".5"/>
      <rect x="0" y="120" width="360" height="30" fill="#0B1020"/>
      <g transform="translate(212 104)"><path d="M0 0h56l-6 16H6z" fill="#3A2C22"/><rect x="-6" y="-3" width="68" height="5" rx="2" fill="#4A3B2E"/></g>
      <rect x="236" y="96" width="20" height="5" fill="#F6F1E4" transform="rotate(-8 246 98)"/>
      <g fill="#F5C518"><path d="M300 122l7-14 7 14z"/><path d="M160 126l6-12 6 12z"/></g>
      <g fill="#0B1020" font-family="Inter,Arial" font-size="8" font-weight="900"><text x="304" y="120">1</text><text x="163" y="124">2</text></g>
      <path d="M118 134c3-2 8-2 10 0M138 130c3-2 8-2 10 0M158 136c3-2 8-2 10 0" stroke="#5A4630" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    </svg>
    <div class="dh-in">
      <div class="dh-top"><span class="dh-k">Eksklyuziv rejim</span>${detMedal(C.idx,34)}</div>
      <div class="dh-t">Ingliz detektivi</div>
      <div class="dh-s">${cur?`Davom ettiring: <b>${escapeHtml(cur.title)}</b>`:`3D jinoyat joyi · ovozli so'roqlar · ${C.solved}/${tot} ish`}</div>
      <div class="dh-f"><span class="dh-r">${C.rank.uz}</span><span class="dh-go">${cur?'Tergovga qaytish':'Tergovni boshlash'}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span></div>
    </div>
    <div class="dh-mascot">${detMascot(78)}</div>
  </button>`;
}

function shopHomeCard(){
  const lg=shopLeague(), open=lg.index>=SHOP_LG;
  const coins=coinsView();
  return `<button class="hubt ${open?'':'lk'}" id="shopHomeCard">
    <div class="hubt-ic shop">${open?COIN_SVG:LOCK_SVG}</div>
    <b>Do'kon</b>
    <span>${open?(coins+' WC'):"Oltin ligasida"}</span>
  </button>`;
}
function closeStore(keepHistory){
  const ov=document.getElementById('store-overlay');
  if(ov) ov.hidden=true;
  // keepHistory=true bo'lsa (boshqa oynaga o'tyapmiz) history'ga tegmaymiz —
  // aks holda history.back() ochilayotgan yangi oynani ham yopib qo'yadi.
  if(!keepHistory){ try{ if(history.state&&history.state.wdStore) history.back(); }catch(e){} }
}
window.__wdCloseStore=closeStore;
function shopOpenSheet(){
  const lg=shopLeague(), open=lg.index>=SHOP_LG;
  const ov=document.getElementById('store-overlay');
  const box=document.getElementById('storeBox');
  const coinEl=document.getElementById('storeCoin');
  ov.hidden=false;
  ov.scrollTop=0; box.scrollTop=0;
  try{ history.pushState({wdStore:true},''); }catch(e){}
  const bk=document.getElementById('storeBack');
  if(bk && !bk.__wired){ bk.__wired=true; bk.addEventListener('click',closeStore); }
  const render=()=>{
   try{
    const coins=coinsView();
    if(coinEl) coinEl.innerHTML=`${COIN_SVG}<b>${coins}</b>`;
    // v111: faqat imkoniyatlar (xona va jihozlar olib tashlandi)
    let h=`<div class="sh-sect">Premium</div><div class="sh-prem">`+PREM_ITEMS.map(it=>{
      if(it.hidden) return '';
      const own=premOwn(it.id);
      const itemOpen=lg.index>=(it.lg||0);
      let btn='';
      if(!itemOpen) btn=`<span class="sh-lg">${LOCK_SVG} ${(LEAGUES[it.lg]&&LEAGUES[it.lg].name)||"yuqori liga"}</span>`;
      else if(it.id==='wheel' && wheelFree()) btn=`<button class="sh-buy prem" data-pid="wheel" data-free="1">Bepul aylantirish ✨</button>`;
      else if(it.id==='boost' && boostActive()) btn=`<button class="sh-buy prem" data-pid="boost" ${coins>=it.price?'':'disabled'}>${it.price} WC · faol (${boostLeftTxt()})</button>`;
      else if(it.type==='unlock'&&own) btn=`<span class="sh-own">Sotib olingan ✓</span>`;
      else if(it.type==='stock'&&own>=it.max) btn=`<span class="sh-own">Zaxira to'la (${own}/${it.max})</span>`;
      else btn=`<button class="sh-buy prem" data-pid="${it.id}" ${coins>=it.price?'':'disabled'}>${it.price} WC${it.type==='stock'&&own?` · bor: ${own}`:''}</button>`;
      return `<div class="sh-pi"><div class="sh-it-ic prem">${it.ic}</div>
        <div class="sh-pi-t"><b>${it.nm}</b><span>${it.desc}</span></div>${btn}</div>`;
    }).join('')+`</div>`;
    box.innerHTML=h;
    box.querySelectorAll('.sh-buy.prem').forEach(bt=>bt.addEventListener('click',()=>{
      const it=PREM_ITEMS.find(x=>x.id===bt.dataset.pid); if(!it) return;
      if(it.id==='wheel' && bt.dataset.free==='1'){
        window.__wdWheelLast=Date.now();
        try{ saveState(); }catch(e){}
        closeStore(); wheelOpen(true); return;
      }
      if(coinsView()<it.price){ try{ showToast("Tanga yetarli emas",IC.info); }catch(e){} return; }
      if(it.type==='stock'&&premOwn(it.id)>=it.max){ try{ showToast("Zaxira to'la",IC.info); }catch(e){} return; }
      // Trial paytida bonus tangadan yechiladi — haqiqiy balans manfiy bo'lmaydi
      window.__wdCoins=Math.max(0,(window.__wdCoins||0)-it.price);
      if(it.type==='action'&&it.id==='mbox'){ try{ saveState(); }catch(e){} closeStore(); mboxOpen(); return; }
      if(it.type==='action'&&it.id==='boost'){
        const base=Math.max(Date.now(), window.__wdBoostUntil||0);
        window.__wdBoostUntil=base+30*60*1000;
        try{ saveState(); }catch(e){}
        render(); rwBoost(); return;
      }
      if(it.type==='action'&&it.id==='wheel'){ try{ saveState(); }catch(e){} closeStore(); wheelOpen(false); return; }
      window.__wdRoom.inv=window.__wdRoom.inv||{};
      window.__wdRoom.inv[it.id]=(window.__wdRoom.inv[it.id]||0)+1;
      try{ saveState(); }catch(e){}
      try{ showToast(it.nm+' sotib olindi',IC.check||IC.info); }catch(e){}
      render(); try{ renderHome(); }catch(e){}
    }));
   }catch(err){
    // Do'kon hech qachon bo'sh oq ekran bo'lib qolmasin
    if(box) box.innerHTML=`<div class="sh-lock"><p>Do'konni ochishda xatolik yuz berdi.<br><span style="font-size:11px;color:var(--i5)">${escapeHtml(String(err&&err.message||err).slice(0,120))}</span></p></div>`;
    console.warn('[WordDrop] shop render:',err);
   }
  };
  render();
}
// Telefon "orqaga" tugmasi do'konni yopadi
addEventListener('popstate',()=>{
  const ov=document.getElementById('store-overlay');
  if(ov && !ov.hidden){ ov.hidden=true; try{ renderHome(); }catch(e){} }
});

/* ---------- JONLI DUEL (1v1, Supabase Realtime broadcast) — v3 "Ikki tomchi" ----------
   Mantiq (savollar, ballar, kanal, garov) o'zgarmagan; ko'rinish ilova
   dizayn tizimida (yorug'/tungi tokenlar), animatsiyalar faqat transform/opacity. */
const DUEL_QN=10, DUEL_QSEC=10;
const DUEL_IC={
  swords:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 10"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></svg>`,
  trophy:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4 H17 V9 C17 12 14.8 14 12 14 C9.2 14 7 12 7 9 Z"/><path d="M7 5 H4 V7 C4 9 5.5 10.3 7 10.3"/><path d="M17 5 H20 V7 C20 9 18.5 10.3 17 10.3"/><path d="M12 14 V17.5 M9 20.5 H15 M9.5 17.5 H14.5 L15 20.5 H9 Z"/></svg>`,
  draw:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 10 H16 M8 14 H16"/></svg>`,
  power:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8.5" width="4.2" height="7" rx="1.3"/><rect x="17.8" y="8.5" width="4.2" height="7" rx="1.3"/><path d="M6.2 12 H17.8"/></svg>`
};
const DX_IC={
  words:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/></svg>`,
  listen:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
  sentence:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="4" width="7" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/></svg>`,
  pattern:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  copy:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
  share:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>`,
  again:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>`,
  hg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12"/><path d="M7 2v4l5 6 5-6V2M7 22v-4l5-6 5 6v4"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`,
  send:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`
};
const DX_MODES={
  words:   {n:"So'z jangi",     d:"Tarjima, ta'rif va bo'sh joy", sec:10},
  listen:  {n:"Eshitib yozish", d:"So'zni eshitib, to'g'ri yozing", sec:15},
  sentence:{n:"Gap tuzish",     d:"Aralash so'zlardan gap yasang", sec:35},
  pattern: {n:"Shablon jangi",  d:"Shablon bilan o'z gapingizni yozing", sec:45}
};
let duelCh=null, duelSt=null, duelQT=null, duelTick=null, duelSearchTick=null, duelLobbyMode='words';

function duelName(){ return ((window.__wdName&&window.__wdName.trim())||'Player').slice(0,16); }
function duelPool(){
  const seen=new Set(), pool=[];
  const add=(en,uz,def,ex)=>{ en=String(en||'').trim(); uz=String(uz||'').trim();
    const k=en.toLowerCase(); if(!en||!uz||seen.has(k)) return; seen.add(k);
    pool.push({en,uz,def:String(def||'').trim(),ex:String(ex||'').trim()}); };
  try{ WORD_CATS.forEach(c=>(c.words||[]).forEach(w=>add(w.term,w.tr,w.def,w.ex))); }catch(e){}
  try{ Object.values(window.__wdSrs||{}).forEach(it=>add(it.t,it.tr,'',it.ex)); }catch(e){}
  try{ (window.__wdWallWords||[]).forEach(w=>add(w.en,w.uz)); }catch(e){}
  try{ if(Array.isArray(window.__wdLevel1Backup)) window.__wdLevel1Backup.forEach(w=>add(w.term,w.tr,w.def,w.ex)); }catch(e){}
  return pool;
}
function duelBuildQs(){
  const pool=duelPool();
  if(pool.length<8) return null;
  const sh=pool.slice().sort(()=>Math.random()-0.5);
  const qs=[];
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const w of sh){
    if(qs.length>=DUEL_QN) break;
    const enDis=sh.filter(x=>x.en!==w.en).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.en);
    const uzDis=sh.filter(x=>x.en!==w.en&&x.uz!==w.uz).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.uz);
    const types=['t1','t2'];
    if(w.def&&w.def.length>14) types.push('t3');
    let rx=null;
    if(w.ex){ try{ rx=new RegExp('\\b'+esc(w.en)+'[a-z]*','i'); if(!rx.test(w.ex)) rx=null; }catch(e){ rx=null; } }
    if(rx) types.push('t4');
    const ty=types[Math.floor(Math.random()*types.length)];
    let prompt, opts, corr;
    if(ty==='t1'){ if(uzDis.length<3) continue; prompt=w.en; opts=uzDis.concat([w.uz]); corr=w.uz; }
    else if(ty==='t2'){ if(enDis.length<3) continue; prompt=w.uz; opts=enDis.concat([w.en]); corr=w.en; }
    else if(ty==='t3'){ if(enDis.length<3) continue; prompt=w.def; opts=enDis.concat([w.en]); corr=w.en; }
    else { if(enDis.length<3) continue; prompt=w.ex.replace(rx,'_____'); opts=enDis.concat([w.en]); corr=w.en; }
    opts=opts.sort(()=>Math.random()-0.5);
    qs.push({ty,q:prompt,o:opts,c:opts.indexOf(corr)});
  }
  return qs.length>=5?qs:null;
}
function duelCode(){ const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
const DUEL_TY_LBL={t1:'Tarjimasini toping',t2:'Inglizchasini toping',t3:"Ta'rifga mos so'z",t4:"Bo'sh joyni to'ldiring",listen:'Eshitib yozing',sentence:'Gapni to\'g\'ri tuzing',pattern:'Shablon bilan gap tuzing'};
/* Rejimga qarab har savol uchun vaqt (sekund) */
function duelSec(){ const m=duelSt&&duelSt.mode; return m==='listen'?15 : m==='sentence'?35 : m==='pattern'?45 : DUEL_QSEC; }
function duelNorm(s){ return String(s||'').toLowerCase().trim().replace(/[^a-z' ]/g,'').replace(/\s+/g,' ').trim(); }
function duelBuildQsListen(){
  const pool=duelPool();
  const good=pool.filter(w=>{ const en=w.en||''; return en.length>=2&&en.length<=18&&/^[A-Za-z][A-Za-z' ]*$/.test(en); });
  if(good.length<5) return null;
  const sh=good.slice().sort(()=>Math.random()-0.5);
  const qs=[];
  for(const w of sh){
    if(qs.length>=DUEL_QN) break;
    qs.push({ty:'listen',say:w.en,ans:w.en,uz:w.uz||''});
  }
  return qs.length>=5?qs:null;
}
function duelBuildFor(mode){
  if(mode==='listen') return duelBuildQsListen();
  return duelBuildQs();
}
async function duelSentencesAI(count){
  const data = await aiRequest({ mode:'duel_sentence', count:(count||8) });
  if(data && Array.isArray(data.items) && data.items.length>=5){
    const items=data.items.map(it=>({
      en:String((it&&it.en)||'').replace(/[.,!?;:]/g,'').trim(),
      uz:String((it&&it.uz)||'').trim()
    })).filter(it=>{ const w=it.en.split(/\s+/).filter(Boolean); return w.length>=4&&w.length<=11&&/^[A-Za-z][A-Za-z' ]*$/.test(it.en); });
    if(items.length>=5) return items;
  }
  return null;
}
function duelShuffleIdx(n){
  const a=Array.from({length:n},(_,i)=>i);
  for(let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
async function duelBuildQsSentence(){
  const items = await duelSentencesAI(DUEL_QN);
  if(!items) return null;
  const qs=[];
  for(const it of items){
    if(qs.length>=DUEL_QN) break;
    const words=it.en.split(/\s+/).filter(Boolean);
    if(words.length<3) continue;
    let order=duelShuffleIdx(words.length), tries=0;
    while(tries<8 && order.every((v,i)=>v===i)){ order=duelShuffleIdx(words.length); tries++; }
    qs.push({ ty:'sentence', words, order, uz:it.uz });
  }
  return qs.length>=5?qs:null;
}
function duelStartPayload(qs){
  const s=duelSt||{};
  return {qs,host:s.name,guest:s.oppName,mode:s.mode,hostAvatar:(window.__wdAvatar||''),guestAvatar:s.oppAvatar||''};
}
async function duelStartSentenceHost(){
  const s=duelSt; if(!s) return;
  duelScene(`<div class="dx-c"><div class="dx-spin"></div>
    <div class="dx-h" style="font-size:20px">Gaplar tayyorlanmoqda…</div>
    <div class="dx-p">Siz va ${escapeHtml(s.oppName||'raqib')} uchun bir xil gaplar tuzilmoqda</div></div>`);
  let qs=null;
  try{ qs=await duelBuildQsSentence(); }catch(e){ qs=null; }
  if(!duelSt||duelSt!==s) return;
  if(!qs){ duelFail("Gaplarni tuzib bo'lmadi — internetni tekshirib qayta urinib ko'ring"); return; }
  try{ duelCh.send({type:'broadcast',event:'start',payload:duelStartPayload(qs)}); }catch(e){}
  duelBegin(qs);
}

/* ================= DUEL v3: umumiy yordamchilar ================= */
function duelEl(id){ return document.getElementById(id); }
function duelShowOverlay(){
  const ov=duelEl('duel-overlay');
  if(!ov.hidden) return;
  ov.hidden=false;
  ov.classList.remove('dx-enter'); void ov.offsetWidth; ov.classList.add('dx-enter');
  try{ history.pushState({wdDuel:true},'','#duel'); }catch(e){}
}
function duelHideOverlay(){ duelEl('duel-overlay').hidden=true; }
function duelScene(html){
  const b=duelEl('duelBody'); if(!b) return;
  b.innerHTML=`<div class="dx-wrap dx-scene">${html}</div>`;
  b.scrollTop=0;
}
/* Brend tomchisi (404 va splash'dagi shakl) */
/* Drop bot: brend tomchisi shaklida, po'lat rangli, ko'zoynak-ekran va ikki ko'z */
function dxBotSVG(){
  const id='db'+Math.random().toString(36).slice(2,7);
  return `<svg class="dx-bot" viewBox="0 0 64 64" aria-hidden="true"><defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#97A3BD"/><stop offset=".55" stop-color="#5C6886"/><stop offset="1" stop-color="#36405C"/></linearGradient></defs>
    <path d="M32 4C32 4 10.5 27.5 10.5 40.5a21.5 21.5 0 0 0 43 0C53.5 27.5 32 4 32 4Z" fill="url(#${id})"/>
    <ellipse cx="22.5" cy="27" rx="3.6" ry="6.5" fill="#fff" opacity=".3" transform="rotate(-24 22.5 27)"/>
    <rect x="17" y="34" width="30" height="15" rx="7.5" fill="#111A2E"/>
    <rect x="17" y="34" width="30" height="15" rx="7.5" fill="none" stroke="#fff" stroke-opacity=".12"/>
    <rect class="eye" x="23.2" y="38" width="5.4" height="7" rx="2.7" fill="#7DD8FF"/>
    <rect class="eye" x="35.4" y="38" width="5.4" height="7" rx="2.7" fill="#7DD8FF"/>
  </svg>`;
}
function dxDropSVG(kind){
  const id='dd'+Math.random().toString(36).slice(2,7);
  const c = kind==='op' ? ['#FFA48E','#FF6B4A','#E2512F'] : ['#7FA6FF','#2F6FED','#1B4FCB'];
  return `<svg viewBox="0 0 100 122" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs>
    <path d="M50 4C50 4 8 52 8 80a42 42 0 0 0 84 0C92 52 50 4 50 4Z" fill="url(#${id})"/>
    <ellipse cx="34" cy="50" rx="7" ry="12" fill="#fff" opacity=".35" transform="rotate(-18 34 50)"/></svg>`;
}
/* Yuqori panel: 'none' | 'title' | 'hud' */
function duelTop(kind, title, sub){
  const v=duelEl('duelVs'), bars=duelEl('duelBars');
  if(kind==='hud'){ duelRefreshHud(); return; }
  bars.style.display='none'; bars.innerHTML='';
  v.innerHTML = kind==='title' ? `<div class="dx-title"><b>${escapeHtml(title||'')}</b>${sub?`<span>${escapeHtml(sub)}</span>`:''}</div>` : '';
}
function duelAvatarHtml(av, name, size){
  const s = size || 34;
  const initial = escapeHtml((name||'?').trim().charAt(0).toUpperCase());
  if(av==='bot') return `<span class="du-av du-av-bot" style="width:${s}px;height:${s}px">${dxBotSVG()}</span>`;
  if(av){
    const u = (typeof safeUrl==='function') ? safeUrl(av) : '';
    if(u) return `<span class="du-av"><img src="${u}" alt="" style="width:${s}px;height:${s}px"/></span>`;
    if(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(av) || av.length <= 3){
      return `<span class="du-av du-av-em" style="width:${s}px;height:${s}px;font-size:${Math.round(s*0.6)}px">${escapeHtml(av)}</span>`;
    }
  }
  return `<span class="du-av du-av-init" style="width:${s}px;height:${s}px;font-size:${Math.round(s*0.42)}px">${initial}</span>`;
}
/* HUD — bir marta quriladi, keyin faqat qiymatlar yangilanadi */
function duelVsHtml(){
  const s=duelSt||{};
  return `<div class="dx-hud" id="dxHud">
    <div class="dx-pl me">${duelAvatarHtml(window.__wdAvatar||'', s.name||duelName(), 38)}
      <div class="dx-pl-info"><span class="dx-pl-nm">${escapeHtml(s.name||duelName())}</span><span class="dx-pl-sc" id="duMySc">${s.score||0}</span></div></div>
    <div class="dx-mid"><div class="dx-qn" id="dxQn"></div><span id="dxCombo"></span></div>
    <div class="dx-pl op">${duelAvatarHtml(s.oppAvatar||'', s.oppName||'?', 38)}
      <div class="dx-pl-info"><span class="dx-pl-nm" id="dxOpNm">${escapeHtml(s.oppName||'Raqib')}</span><span class="dx-pl-sc" id="duOppSc">${s.oppScore||0}</span></div></div>
  </div>`;
}
function duelRefreshHud(){
  const s=duelSt; if(!s) return;
  const v=duelEl('duelVs'), bars=duelEl('duelBars');
  if(!duelEl('dxHud')){
    v.innerHTML=duelVsHtml();
    bars.innerHTML=`<div class="dx-race"><i id="dxRace"></i></div><div class="dx-dots"><div class="dx-dotrow me" id="dxDotMe"></div><div class="dx-dotrow op" id="dxDotOp"></div></div>`;
    s._shMy=s.score||0; s._shOp=s.oppScore||0;
  }
  bars.style.display='block';
  const n=(s.qs&&s.qs.length)||DUEL_QN;
  const my=duelEl('duMySc'), op=duelEl('duOppSc'), nm=duelEl('dxOpNm');
  if(nm && nm.textContent!==(s.oppName||'Raqib')) nm.textContent=s.oppName||'Raqib';
  if(my && s._shMy!==s.score){ dxCountTo(my, s._shMy||0, s.score||0); s._shMy=s.score; dxBumpEl(my); }
  if(op && s._shOp!==s.oppScore){ dxCountTo(op, s._shOp||0, s.oppScore||0); s._shOp=s.oppScore; dxBumpEl(op); }
  const qn=duelEl('dxQn'); if(qn) qn.innerHTML=`${Math.min(n,(s.idx||0)+(s.phase==='play'?1:0))}<small>/${n}</small>`;
  const dots=(el,res,idx,cur)=>{ if(!el) return; let h=''; for(let i=0;i<n;i++){ const r=res[i]; h+=`<i class="${r||(i<idx?'done':(cur&&i===idx?'cur':''))}"></i>`; } el.innerHTML=h; };
  dots(duelEl('dxDotMe'), s.res||[], s.idx||0, s.phase==='play');
  dots(duelEl('dxDotOp'), s.oppRes||[], s.oppIdx||0, !s.oppDone);
  const tot=(s.score||0)+(s.oppScore||0);
  const k= tot>0 ? Math.max(.06,Math.min(.94,(s.score||0)/tot)) : .5;
  const race=duelEl('dxRace'); if(race) race.style.transform=`scaleX(${k.toFixed(3)})`;
  const cb=duelEl('dxCombo');
  if(cb){ const st=s.streak||0; const want= st>=2 ? `🔥 ${st} ketma-ket` : ''; if(cb.dataset.v!==want){ cb.dataset.v=want; cb.innerHTML= want?`<span class="dx-combo">${want}</span>`:''; } }
}
function dxBumpEl(el){ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function dxCountTo(el, from, to){
  const t0=performance.now(), d=500;
  const step=t=>{ const k=Math.min(1,(t-t0)/d), e=1-Math.pow(1-k,3); el.textContent=Math.round(from+(to-from)*e); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
/* To'g'ri javob: bosilgan joydan halqa + ball pill'i */
function dxRipple(el, x, y){
  if(!el) return;
  const r=el.getBoundingClientRect(), d=document.createElement('span');
  d.className='dx-ripple';
  d.style.left=((x!=null?x:r.left+r.width/2)-r.left)+'px';
  d.style.top=((y!=null?y:r.top+r.height/2)-r.top)+'px';
  el.appendChild(d); setTimeout(()=>d.remove(),650);
}
function dxPlus(text){
  const sc=duelEl('duMySc'); if(!sc) return;
  const r=sc.getBoundingClientRect(), el=document.createElement('div');
  el.className='dx-plus'; el.textContent=text;
  el.style.left=(r.left+r.width/2+14)+'px'; el.style.top=(r.bottom+6)+'px';
  duelEl('duel-overlay').appendChild(el); setTimeout(()=>el.remove(),950);
}
let dxTapX=null, dxTapY=null;
document.addEventListener('pointerdown',e=>{ dxTapX=e.clientX; dxTapY=e.clientY; },{passive:true,capture:true});
/* Javobdan keyingi effekt. kind: ok | part | bad */
function duelFeedback(kind, pts, anchor){
  const s=duelSt; if(!s) return;
  s.res=s.res||[]; s.res[s.idx]=kind;
  s.times=s.times||[]; s.times[s.idx]=Math.max(0,Date.now()-(s.qStart||Date.now()));
  s.streak = kind==='ok' ? (s.streak||0)+1 : 0;
  if(kind==='ok'||kind==='part'){
    if(pts) dxPlus('+'+pts);
    try{ SFX.play('correct'); }catch(e){}
    try{ navigator.vibrate&&navigator.vibrate(15); }catch(e){}
  } else {
    try{ SFX.play('wrong'); }catch(e){}
    try{ navigator.vibrate&&navigator.vibrate([25,40,25]); }catch(e){}
  }
}
/* Taymer: bitta CSS transition (silliq), soniya matni 4 Hz da yangilanadi */
const DX_CLOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>';
function dxQCard(label, inner, extraStyle){
  return `<div class="dx-q" ${extraStyle?`style="${extraStyle}"`:''}>
    <div class="dx-tbar" id="dxTbar"><i id="dxTbarI"></i></div>
    <div class="dx-qhead"><span class="dx-chip">${escapeHtml(label)}</span><span class="dx-sec">${DX_CLOCK}<b id="dxSecN">${duelSec()}</b></span></div>
    ${inner}</div>`;
}
function duelStartTimer(SEC, onTimeout){
  const t0=Date.now();
  clearInterval(duelTick); clearTimeout(duelQT);
  const bar=duelEl('dxTbarI');
  if(bar){ bar.style.transition='none'; bar.style.transform='scaleX(1)'; void bar.offsetWidth;
    bar.style.transition=`transform ${SEC}s linear`; bar.style.transform='scaleX(0)'; }
  duelTick=setInterval(()=>{
    const n=duelEl('dxSecN'), tb=duelEl('dxTbar'); if(!n){ clearInterval(duelTick); return; }
    const left=Math.max(0,SEC*1000-(Date.now()-t0));
    n.textContent=Math.ceil(left/1000);
    if(tb) tb.classList.toggle('urgent', left<=Math.min(3000,SEC*300));
  },250);
  duelQT=setTimeout(onTimeout,SEC*1000);
}
function dxFreezeTimer(){
  const bar=duelEl('dxTbarI'); if(!bar) return;
  const m=getComputedStyle(bar).transform; bar.style.transition='none'; bar.style.transform=(m&&m!=='none')?m:'scaleX(0)';
}
function duelProg(){
  const s=duelSt; if(!s) return;
  try{ duelCh&&duelCh.send({type:'broadcast',event:'prog',payload:{idx:s.idx,score:s.score,role:s.role}}); }catch(e){}
  duelRefreshHud();
}

/* ================= ulanish ================= */
async function duelConnect(code, asHost){
  try{ await window.__sbReady; }catch(e){}
  const sb=window.__sb;
  if(!sb) return null;
  const key=((window.__sbUser&&window.__sbUser.id)||'u')+'-'+Math.random().toString(36).slice(2,7);
  const ch=sb.channel('wd-duel-'+code,{config:{broadcast:{self:false},presence:{key}}});
  return new Promise(res=>{
    let settled=false;
    ch.on('broadcast',{event:'start'},({payload})=>duelOnStart(payload));
    ch.on('broadcast',{event:'prog'},({payload})=>duelOnProg(payload));
    ch.on('broadcast',{event:'done'},({payload})=>duelOnDone(payload));
    ch.on('presence',{event:'sync'},()=>duelOnPresence(asHost));
    ch.subscribe(async(status)=>{
      if(status==='SUBSCRIBED'&&!settled){
        settled=true;
        try{ await ch.track({name:duelName(),role:asHost?'host':'guest',t:Date.now(),bet:!!(duelSt&&duelSt.myBet),fx:!!premOwn('fx'),avatar:(window.__wdAvatar||'')}); }catch(e){}
        res(ch);
      }else if((status==='CHANNEL_ERROR'||status==='TIMED_OUT')&&!settled){ settled=true; res(null); }
    });
  });
}
function duelMetas(){
  if(!duelCh) return [];
  const st=duelCh.presenceState(), out=[];
  Object.keys(st).forEach(k=>st[k].forEach(m=>out.push(m)));
  return out;
}
function duelOnPresence(asHost){
  const s=duelSt; if(!s) return;
  const metas=duelMetas();
  if(s.phase==='play'||s.phase==='waitend'){
    if(!metas.some(m=>m.role!==s.role)) duelOppLeft();
    return;
  }
  if(s.phase==='wait'&&asHost){
    const gm=metas.find(m=>m.role==='guest');
    if(gm){
      s.oppAvatar=gm.avatar||'';
      s.oppName=gm.name||'Raqib';
      if(s.mode==='sentence'){ s.phase='building'; duelStartSentenceHost(); }
      else if(s.mode==='pattern'){ s.phase='building'; duelStartPatternHost(); }
      else {
        const qs=duelBuildFor(s.mode);
        if(!qs){ duelFail("So'z zaxirasi yetarli emas — avval bir nechta bosqich o'ynang"); return; }
        try{ duelCh.send({type:'broadcast',event:'start',payload:duelStartPayload(qs)}); }catch(e){}
        duelBegin(qs);
      }
    }
  }
  if(s.phase==='join'){
    const hm=metas.find(m=>m.role==='host');
    if(hm){
      s.oppName=hm.name||'Raqib'; s.oppAvatar=hm.avatar||'';
      const w=duelEl('dxJoinOpp'); if(w) w.innerHTML=`<div style="display:inline-block">${duelAvatarHtml(s.oppAvatar,s.oppName,56)}</div><div class="dx-p" style="margin-top:8px"><b style="color:var(--i9)">${escapeHtml(s.oppName)}</b> xonasiga ulandingiz</div>`;
    }
    if(metas.filter(m=>m.role==='guest').length>1){ duelFail("Xona to'la"); }
  }
}
function duelOnStart(p){
  const s=duelSt; if(!s||s.role!=='guest'||!p||!Array.isArray(p.qs)) return;
  s.oppName=p.host||s.oppName||'Raqib';
  s.oppAvatar=p.hostAvatar||s.oppAvatar||'';
  s.mode=p.mode||'words';
  duelBegin(p.qs);
}
function duelOnProg(p){
  const s=duelSt; if(!s||!p||p.role===s.role) return;
  const ni=p.idx||0, ns=p.score||0, d=ns-(s.oppScore||0);
  s.oppRes=s.oppRes||[];
  for(let i=(s.oppIdx||0); i<ni; i++) s.oppRes[i]= d>=10?'ok':(d>0?'part':'bad');
  s.oppIdx=ni; s.oppScore=ns;
  duelRefreshHud();
  if(s.phase==='waitend') duelWaitendUpdate();
}
function duelOnDone(p){
  const s=duelSt; if(!s||!p||p.role===s.role) return;
  s.oppDone=true; s.oppScore=p.score||0; s.oppIdx=(s.qs&&s.qs.length)||DUEL_QN;
  if(s.myDone) duelResult();
  else duelRefreshHud();
}
function duelOppLeft(){
  const s=duelSt; if(!s||s.phase==='result') return;
  if(s.phase==='play'||s.phase==='waitend'){
    s.oppLeft=true; s.oppDone=true; s.myDone=true;
    duelResult(true);
  }else{
    duelFail("Raqib chiqib ketdi");
  }
}

/* ================= LOBBY ================= */
function duelHistHtml(){
  const h=(window.__wdDuels||[]).slice(0,5);
  if(!h.length) return '';
  const rows=h.map(x=>{
    const dt=new Date(x.d), ds=String(dt.getDate()).padStart(2,'0')+'.'+String(dt.getMonth()+1).padStart(2,'0');
    return `<div class="dx-hi"><span class="r ${x.r}">${x.r==='w'?'G':(x.r==='d'?'D':'M')}</span>
      <b>${escapeHtml(x.opp)}${x.bot?'<small class="dx-botc">bot</small>':''}</b><i>${x.my} : ${x.op}</i><em>${ds}</em></div>`;
  }).join('');
  return `<div class="dx-lbl">So'nggi o'yinlar</div><div class="dx-box" style="padding:4px 14px"><div class="dx-hist">${rows}</div></div>`;
}
function duelOpenSheet(preMode){
  if(typeof preMode==='string' && DX_MODES[preMode]) duelLobbyMode=preMode;
  duelTeardown();
  duelShowOverlay();
  duelTop('title','Jonli duel','1v1 bellashuv');
  const st={w:0,l:0,d:0}; (window.__wdDuels||[]).forEach(x=>{ if(!x.bot) st[x.r]=(st[x.r]||0)+1; });   // bot o'yinlari hisobga olinmaydi
  const tot=st.w+st.l+st.d, rate=tot?Math.round(st.w/tot*100):0;
  const betOwned=premOwn('bet'), canBet=coinsView()>=20;
  const modes=Object.keys(DX_MODES).map(k=>`<button type="button" class="dx-mode ${k===duelLobbyMode?'on':''}" data-mode="${k}" aria-pressed="${k===duelLobbyMode}">
      <em>${DX_MODES[k].sec} s</em><span class="tick">${DX_IC.check}</span><div class="ic">${DX_IC[k]}</div><b>${DX_MODES[k].n}</b><span>${DX_MODES[k].d}</span></button>`).join('');
  duelScene(`
    <div class="dx-hero">
      <div class="dx-hero-top">
        <div class="dx-drops"><span class="a">${dxDropSVG('me')}</span><span class="b">${dxDropSVG('op')}</span></div>
        <div><h2>Kim tezroq?</h2><p>Bir xil 10 savol, jonli raqib. To'g'ri va tez javob — ko'proq ball.</p></div>
      </div>
      <div class="dx-hstats"><div><b>${st.w}</b><span>G'alaba</span></div><div><b>${st.d}</b><span>Durrang</span></div><div><b>${st.l}</b><span>Mag'lub</span></div><div><b>${rate}%</b><span>Natija</span></div></div>
      <button class="dx-btn white" id="duAuto">${DX_IC.search}<span>Raqib topish</span></button>
    </div>
    <div class="dx-lbl">Rejim</div>
    <div class="dx-modes">${modes}</div>
    <div class="dx-lbl">Mashq</div>
    <div class="dx-box dx-botbox">
      <div class="bi" aria-hidden="true">${dxBotSVG()}</div>
      <div><b>Drop bot bilan o'ynash</b><span>Darajangiz: ${duelBotLevel()} · bot aniqligi ~${Math.round(duelBotAcc(duelLobbyMode)*100)}%</span></div>
      <button class="dx-btn" id="duBot" type="button">O'ynash</button>
    </div>
    <div class="dx-lbl">Do'st bilan</div>
    <div class="dx-box">
      <button class="dx-btn2" id="duCreate">${DX_IC.plus}Xona ochish</button>
      <div class="dx-join">
        <input class="dx-codein" id="duCode" maxlength="4" placeholder="KOD" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Xona kodi">
        <button class="dx-btn" id="duJoin">Kirish</button>
      </div>
      ${betOwned?`<label class="dx-switch"><input type="checkbox" id="duBetChk" ${canBet?'':'disabled'}><span class="tg"></span>
        <div><b>20 WC garov</b><small>${canBet?"G'olib hammasini oladi (raqib ham yoqsa)":"Balans yetarli emas"}</small></div></label>`:''}
    </div>
    ${duelHistHtml()}`);
  const body=duelEl('duelBody');
  body.querySelectorAll('.dx-mode').forEach(b=>b.addEventListener('click',()=>{
    duelLobbyMode=b.dataset.mode;
    body.querySelectorAll('.dx-mode').forEach(x=>{ const on=x===b; x.classList.toggle('on',on); x.setAttribute('aria-pressed',on); });
    const bs=body.querySelector('.dx-botbox span'); if(bs) bs.textContent=`Darajangiz: ${duelBotLevel()} · bot aniqligi ~${Math.round(duelBotAcc(duelLobbyMode)*100)}%`;
    try{ SFX.play('tap'); }catch(e){}
  }));
  const bet=()=>!!(duelEl('duBetChk')&&duelEl('duBetChk').checked);
  duelEl('duAuto').addEventListener('click',()=>duelAutoFind(duelLobbyMode));
  duelEl('duBot').addEventListener('click',()=>duelStartBot(duelLobbyMode));
  duelEl('duCreate').addEventListener('click',()=>duelCreate(bet(),duelLobbyMode));
  const codeIn=duelEl('duCode');
  codeIn.addEventListener('input',()=>{ codeIn.value=codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4); });
  const join=()=>{
    const code=String(codeIn.value||'').trim().toUpperCase();
    if(code.length!==4){ showToast('4 belgili kodni kiriting',IC.info); codeIn.focus(); return; }
    duelJoin(code,bet());
  };
  duelEl('duJoin').addEventListener('click',join);
  codeIn.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); join(); } });
}

/* ================= Kutish sahnasi: tomchi + halqalar ================= */
function dxPond(av,name){
  return `<div class="dx-pond"><i class="shd"></i>
    <div class="dp">${dxDropSVG('me')}${duelAvatarHtml(av,name,52)}</div></div>`;
}
function dxCodeTiles(code){ return `<div class="dx-code">${String(code).split('').map(c=>`<span>${escapeHtml(c)}</span>`).join('')}</div>`; }
async function duelCreate(myBet,mode){
  const code=duelCode();
  duelSt={phase:'wait',role:'host',name:duelName(),oppName:'',score:0,idx:0,oppScore:0,oppIdx:0,myDone:false,oppDone:false,code,myBet:!!myBet,mode:(mode||'words'),res:[],oppRes:[],streak:0};
  duelShowOverlay(); duelTop('title','Xona ochildi',DX_MODES[duelSt.mode].n);
  duelScene(`<div class="dx-c">
    <div class="dx-p" style="margin-top:0">Kodni do'stingizga yuboring</div>
    ${dxCodeTiles(code)}
    <div class="dx-row2" style="max-width:320px;margin:14px auto 6px">
      <button class="dx-btn2" id="dxCopy">${DX_IC.copy}Nusxa</button>
      <button class="dx-btn2" id="dxShare">${DX_IC.share}Ulashish</button>
    </div>
    ${dxPond(window.__wdAvatar||'',duelName())}
    <div class="dx-h" style="font-size:19px">Raqib kutilmoqda</div>
    <div class="dx-p">Do'stingiz «Jonli duel → Kirish» orqali shu kodni kiritadi</div>
  </div>`);
  duelEl('dxCopy').addEventListener('click',async()=>{
    try{ await navigator.clipboard.writeText(code); showToast('Kod nusxalandi',IC.info); }catch(e){ showToast('Kod: '+code,IC.info); }
  });
  duelEl('dxShare').addEventListener('click',async()=>{
    const txt=`WordDrop'da men bilan duel o'ynaysizmi? Xona kodi: ${code}`;
    try{ if(navigator.share){ await navigator.share({text:txt}); return; } }catch(e){ return; }
    try{ await navigator.clipboard.writeText(txt); showToast('Taklif matni nusxalandi',IC.info); }catch(e){}
  });
  duelCh=await duelConnect(code,true);
  if(!duelCh && duelSt && duelSt.code===code){ duelFail("Server ulanishi yo'q — internetni tekshiring"); }
}
async function duelJoin(code,myBet){
  duelSt={phase:'join',role:'guest',name:duelName(),oppName:'',score:0,idx:0,oppScore:0,oppIdx:0,myDone:false,oppDone:false,code,myBet:!!myBet,mode:'words',res:[],oppRes:[],streak:0};
  duelShowOverlay(); duelTop('title','Xonaga kirish');
  duelScene(`<div class="dx-c">${dxCodeTiles(code)}
    <div style="margin:28px 0 4px" id="dxJoinOpp"><div class="dx-spin"></div></div>
    <div class="dx-h" style="font-size:19px" id="dxJoinT">Ulanmoqda…</div>
    <div class="dx-p" id="dxJoinS">Xona tekshirilmoqda</div></div>`);
  duelCh=await duelConnect(code,false);
  if(!duelSt||duelSt.code!==code) return;
  if(!duelCh){ duelFail("Server ulanishi yo'q — internetni tekshiring"); return; }
  setTimeout(()=>{
    const s=duelSt;
    if(s&&s.code===code&&s.phase==='join'&&!duelMetas().some(m=>m.role==='host')) duelFail("Xona topilmadi — kodni tekshiring");
  },2500);
  const t=duelEl('dxJoinT'), sb=duelEl('dxJoinS');
  if(t) t.textContent='Ulandingiz!'; if(sb) sb.textContent="O'yin boshlanishi kutilmoqda…";
}

/* ================= AVTOMATIK QIDIRUV ================= */
let duelAutoState=null;
function duelAutoCleanup(){ try{ if(duelAutoState&&duelAutoState.qsub){ window.__sb&&window.__sb.removeChannel(duelAutoState.qsub); duelAutoState.qsub=null; } }catch(e){} }
async function duelAutoFind(mode){
  try{ await window.__sbReady; }catch(e){}
  const sb=window.__sb;
  if(!sb){ showToast("Server ulanishi yo'q — internetni tekshiring",IC.info); return; }
  const me=(window.__sbUser&&window.__sbUser.id);
  if(!me){ showToast("Avtomatik duel uchun avval tizimga kiring",IC.info); return; }
  duelAutoState={mode:(mode||'words'),me,qsub:null,active:true};
  duelShowSearch(mode);
  try{
    const { data, error } = await sb.rpc('duel_find_match',{p_mode:(mode||'words')});
    if(!duelAutoState||!duelAutoState.active) return;
    if(error){ duelAutoFail(error.message); return; }
    if(data && data.status==='matched'){
      const mid = data.match_id || data.id || await duelFindMyMatch(sb,me);
      await duelBridge(sb,me,mid,mode);
    } else {
      duelAutoState.qsub = sb.channel('duelq-'+me)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'duel_queue',filter:'user_id=eq.'+me},async payload=>{
          if(!duelAutoState||!duelAutoState.active) return;
          if(payload && payload.new && payload.new.match_id){ await duelBridge(sb,me,payload.new.match_id,mode); }
        }).subscribe();
    }
  }catch(e){ duelAutoFail(String((e&&e.message)||e)); }
}
async function duelFindMyMatch(sb,me){
  try{
    const { data } = await sb.from('duel_matches').select('id').or('a.eq.'+me+',b.eq.'+me).order('created_at',{ascending:false}).limit(1).maybeSingle();
    return data ? data.id : null;
  }catch(e){ return null; }
}

async function duelBridge(sb,me,mid,mode){
  if(!duelAutoState||!duelAutoState.active) return;
  if(!mid){ duelAutoFail("Raqib topildi, lekin xona aniqlanmadi"); return; }
  duelAutoState.active=false; duelAutoCleanup();
  clearInterval(duelSearchTick);
  let row=null;
  try{ const { data } = await sb.from('duel_matches').select('a,b,a_name,b_name').eq('id',mid).maybeSingle(); row=data; }catch(e){}
  const isHost = row ? (row.a===me) : true;
  const oppName = row ? (isHost ? (row.b_name||'Raqib') : (row.a_name||'Raqib')) : 'Raqib';
  const oppId   = row ? (isHost ? row.b : row.a) : null;
  let oppAvatar = '';
  if(oppId){
    try{
      const { data: p } = await sb.from('profiles').select('avatar').eq('id',oppId).maybeSingle();
      if(p && p.avatar) oppAvatar = p.avatar;
    }catch(e){}
  }
  duelSt={phase:isHost?'wait':'join',role:isHost?'host':'guest',name:duelName(),oppName,oppAvatar,score:0,idx:0,oppScore:0,oppIdx:0,myDone:false,oppDone:false,code:mid,myBet:false,mode:(mode||'words'),res:[],oppRes:[],streak:0};
  duelShowOverlay(); duelTop('title','Raqib topildi!');
  try{ SFX.play('reward'); }catch(e){}
  try{ navigator.vibrate&&navigator.vibrate([15,40,15]); }catch(e){}
  duelScene(`<div class="dx-c">
    <div class="dx-spin"></div>
    <div class="dx-h" style="font-size:20px">${escapeHtml(oppName)} bilan bellashuv</div>
    <div class="dx-p">Xona tayyorlanmoqda…</div></div>`);
  duelCh=await duelConnect(mid,isHost);
  if(!duelCh && duelSt && duelSt.code===mid){ duelFail("Server ulanishi yo'q — internetni tekshiring"); }
}
function duelShowSearch(mode){
  duelSt=null;
  duelShowOverlay(); duelTop('title','Raqib qidirilmoqda',(DX_MODES[mode]||DX_MODES.words).n);
  duelScene(`<div class="dx-c">
    ${dxPond(window.__wdAvatar||'',duelName())}
    <div class="dx-h">Raqib qidirilmoqda…</div>
    <div class="dx-time" id="dxSearchT">00:00</div>
    <div class="dx-p">Odatda bir necha soniya ichida topiladi</div>
    <div class="dx-offer" id="duBotOffer" hidden>
      <div class="dx-p">Hozir onlayn raqiblar kam. Kutishni davom ettirishingiz yoki bot bilan o'ynashingiz mumkin.</div>
      <button class="dx-btn" id="duBotGo" type="button" style="max-width:280px;margin:12px auto 0">${dxBotSVG()}<span>Drop bot bilan o'ynash</span></button>
    </div>
    <button class="dx-btn2" id="duAutoCancel" style="margin:16px auto 0;max-width:220px">Bekor qilish</button>
  </div>`);
  const c=duelEl('duAutoCancel'); if(c) c.addEventListener('click',()=>{ duelTeardown(); duelOpenSheet(); });
  const bg=duelEl('duBotGo'); if(bg) bg.addEventListener('click',()=>duelStartBot(mode));   // duelStartBot navbatdan chiqaradi (duel_cancel)
  const t0=Date.now(); clearInterval(duelSearchTick);
  duelSearchTick=setInterval(()=>{ const el=duelEl('dxSearchT'); if(!el){ clearInterval(duelSearchTick); return; }
    const s=Math.floor((Date.now()-t0)/1000); el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    const of=duelEl('duBotOffer'); if(of && of.hidden && s>=DUEL_BOT.wait){ of.hidden=false; try{ navigator.vibrate&&navigator.vibrate(12); }catch(e){} } },1000);
}
function duelAutoFail(msg){
  showToast(msg||"Xato",IC.info);
  duelTeardown(); duelOpenSheet();
}

/* ================= O'YIN: intro → countdown → savollar ================= */
function duelBegin(qs){
  const s=duelSt; if(!s) return;
  s.qs=qs; s.phase='play'; s.idx=0; s.score=0; s.res=[]; s.oppRes=s.oppRes||[]; s.streak=0;
  const om=duelMetas().find(m=>m.role!==s.role)||{};
  s.oppFx=!!om.fx;
  s.bet=!!(s.myBet&&om.bet);
  if(s.bet){ try{ addCoins(-20,true); }catch(e){} }
  clearInterval(duelSearchTick);
  duelTop('none');
  const myFx=!!premOwn('fx');
  const M=DX_MODES[s.mode]||DX_MODES.words;
  duelScene(`<div class="dx-intro">
    <div class="dx-face">
      <div class="dx-side me"><div class="dx-fall">${dxDropSVG('me')}${duelAvatarHtml(window.__wdAvatar||'', s.name, 54)}</div><div class="dx-shd"></div>
        <div class="nm ${myFx?'fxn':''}">${escapeHtml(s.name)}</div><div class="lv">Siz</div></div>
      <div class="dx-vs">vs</div>
      <div class="dx-side op"><div class="dx-fall">${s.isBot?dxBotSVG():dxDropSVG('op')+duelAvatarHtml(s.oppAvatar||'', s.oppName||'Raqib', 54)}</div><div class="dx-shd"></div>
        <div class="nm ${s.oppFx?'fxn':''}">${escapeHtml(s.oppName||'Raqib')}</div><div class="lv">${s.isBot?('Bot · '+duelBotLevel()):'Raqib'}</div></div>
    </div>
    <div class="dx-meta"><span class="dx-chip">${DX_IC[s.mode]||DX_IC.words}${escapeHtml(M.n)}</span><span class="dx-chip">${(s.qs||[]).length} savol · ${M.sec} s</span>${s.bet?`<span class="dx-chip dx-bet">Garov · 40 WC</span>`:''}</div>
  </div>`);
  setTimeout(()=>{ try{ navigator.vibrate&&navigator.vibrate(12); }catch(e){} }, 560);
  let c=3;
  const step=()=>{
    if(!duelSt||duelSt!==s) return;
    if(c>0){
      duelEl('duelBody').innerHTML=`<div class="dx-wrap"><div class="dx-count"><div class="ring"><b>${c}</b></div></div></div>`;
      try{ SFX.play('tap'); }catch(e){}
      c--; setTimeout(step,800);
    } else {
      duelEl('duelBody').innerHTML=`<div class="dx-wrap"><div class="dx-count"><div class="ring"><b class="go">Boshla!</b></div></div></div>`;
      try{ navigator.vibrate&&navigator.vibrate(25); }catch(e){}
      setTimeout(()=>{ if(duelSt===s){ duelTop('hud'); duelQ(); } },550);
    }
  };
  setTimeout(step,2000);
}
function duelQ(){
  const s=duelSt; if(!s) return;
  if(s.idx>=s.qs.length){ duelFinishMine(); return; }
  const q=s.qs[s.idx]; s.qStart=Date.now();
  if(s.isBot && !s.bot) duelBotStart(s);
  duelRefreshHud();
  if(q.ty==='pattern'){ duelQPattern(q); return; }
  if(q.ty==='sentence'){ duelQSentence(q); return; }
  if(q.ty==='listen'){ duelQListen(q); return; }
  const small=(q.ty==='t3'||q.ty==='t4');
  const short=q.o.every(o=>String(o).length<=22);
  const K=['A','B','C','D'];
  duelScene(`${dxQCard(DUEL_TY_LBL[q.ty]||'', `<div class="dx-term ${small?'small':''}">${escapeHtml(q.q)}</div>`)}
    <div class="dx-opts ${short?'g2':''}">${q.o.map((o,i)=>`<button class="dx-opt" data-i="${i}"><span class="k">${K[i]||i+1}</span><span class="t">${escapeHtml(o)}</span></button>`).join('')}</div>`);
  duelEl('duelBody').querySelectorAll('.dx-opt').forEach(b=>b.addEventListener('click',()=>duelAnswer(+b.dataset.i)));
  duelStartTimer(DUEL_QSEC,()=>duelAnswer(-1));
}
function duelAnswer(i){
  clearTimeout(duelQT); clearInterval(duelTick); dxFreezeTimer();
  const s=duelSt; if(!s||s.phase!=='play') return;
  const q=s.qs[s.idx], ok=(i===q.c);
  let pts=0;
  if(ok){
    const left=Math.max(0,DUEL_QSEC*1000-(Date.now()-s.qStart));
    pts=10+Math.round(left/(DUEL_QSEC*1000)*5);
    s.score+=pts;
  }
  const btns=duelEl('duelBody').querySelectorAll('.dx-opt');
  let anchor=null;
  btns.forEach((b,bi)=>{
    b.disabled=true;
    if(bi===q.c){ b.classList.add('ok'); b.querySelector('.k').textContent='✓'; if(ok) anchor=b; }
    else if(bi===i){ b.classList.add('bad'); b.querySelector('.k').textContent='✕'; }
    else b.classList.add('dim');
  });
  duelFeedback(ok?'ok':'bad', pts, anchor);
  s.idx++;
  duelProg();
  setTimeout(()=>{ if(duelSt===s) duelQ(); }, ok?800:1200);
}
window.addEventListener('keydown',e=>{
  if(!duelSt||duelSt.phase!=='play'||duelEl('duel-overlay').hidden) return;
  if(/input|textarea/i.test((e.target&&e.target.tagName)||'')) return;
  const map={'1':0,'2':1,'3':2,'4':3,'a':0,'b':1,'c':2,'d':3};
  const k=map[String(e.key).toLowerCase()]; if(k===undefined) return;
  const b=duelEl('duelBody').querySelectorAll('.dx-opt:not(:disabled)')[k];
  if(b){ e.preventDefault(); dxTapX=null; dxTapY=null; b.click(); }
});

/* ===== LISTEN ===== */
function duelSpeakWord(word,btn){
  try{ if(btn){ btn.classList.add('playing'); setTimeout(()=>{ try{ btn.classList.remove('playing'); }catch(e){} },1300); } }catch(e){}
  try{ (window.__wdSpeakNative||speakNative)(word); }catch(e){}
}
function duelQListen(q){
  const s=duelSt; if(!s) return;
  const SEC=duelSec();
  duelScene(`${dxQCard(DUEL_TY_LBL.listen, `
      <button type="button" class="dx-spk" id="duLsBtn" aria-label="Eshitish">${DX_IC.listen}</button>
      <button type="button" class="dx-replay" id="duLsReplay">&#8635; Qayta eshitish</button>
      <input class="dx-in" id="duLsIn" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Eshitgan so'zingizni yozing" enterkeyhint="done">`)}
    <button class="dx-btn" id="duLsGo" style="margin-top:14px">Tekshirish</button>
    <div class="dx-fb" id="duLsFb"></div>`);
  const btn=duelEl('duLsBtn'), inp=duelEl('duLsIn');
  const play=()=>duelSpeakWord(q.say,btn);
  if(btn) btn.addEventListener('click',play);
  const rep=duelEl('duLsReplay'); if(rep) rep.addEventListener('click',play);
  const submit=()=>duelAnswerListen(inp?inp.value:'');
  const go=duelEl('duLsGo'); if(go) go.addEventListener('click',submit);
  if(inp){ inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); submit(); } }); setTimeout(()=>{ try{ inp.focus(); }catch(e){} },60); }
  setTimeout(play,350);
  duelStartTimer(SEC,()=>duelAnswerListen(null));
}
function duelAnswerListen(val){
  clearTimeout(duelQT); clearInterval(duelTick); dxFreezeTimer();
  const s=duelSt; if(!s||s.phase!=='play') return;
  const q=s.qs[s.idx];
  const timedOut=(val===null);
  const ok=!timedOut && duelNorm(val)===duelNorm(q.ans);
  let pts=0;
  if(ok){ const SEC=duelSec(); const left=Math.max(0,SEC*1000-(Date.now()-s.qStart)); pts=10+Math.round(left/(SEC*1000)*5); s.score+=pts; }
  const inp=duelEl('duLsIn'), go=duelEl('duLsGo'), fb=duelEl('duLsFb');
  if(inp){ inp.disabled=true; inp.classList.add(ok?'ok':'bad'); }
  if(go) go.disabled=true;
  if(fb){ fb.className='dx-fb show';
    fb.innerHTML = ok ? `<span class="ok">To'g'ri! +${pts}</span>${q.uz?`<i>${escapeHtml(q.uz)}</i>`:''}`
                      : `<span class="bad">To'g'ri javob: ${escapeHtml(q.ans)}</span>${q.uz?`<i>${escapeHtml(q.uz)}</i>`:''}`; }
  duelFeedback(ok?'ok':'bad', pts, null);
  s.idx++;
  duelProg();
  setTimeout(()=>{ if(duelSt===s) duelQ(); },1300);
}

/* ===== SENTENCE ===== */
function duelTileText(w){ return (String(w).toLowerCase()==='i') ? 'I' : String(w).toLowerCase(); }
function duelCap(s){ s=String(s); return s.charAt(0).toUpperCase()+s.slice(1); }
function duelSentDisplay(words){ return (words||[]).map((w,i)=>{ const t=duelTileText(w); return i===0?duelCap(t):t; }).join(' '); }
function duelQSentence(q){
  const s=duelSt; if(!s) return;
  const SEC=duelSec();
  const tiles=q.order.map(oi=>({oi, w:q.words[oi]}));
  const picked=[];
  duelScene(`${dxQCard(DUEL_TY_LBL.sentence, q.uz?`<div class="dx-hint"><small>Tarjimasi</small>${escapeHtml(q.uz)}</div>`:'')}
    <div class="dx-build" id="duBuild"></div>
    <div class="dx-tiles" id="duTiles"></div>
    <button class="dx-btn" id="duSGo" style="margin-top:16px" disabled>Tekshirish</button>
    <div class="dx-fb" id="duSFb"></div>`);
  const buildEl=duelEl('duBuild'), tilesEl=duelEl('duTiles'), goEl=duelEl('duSGo');
  function render(){
    tilesEl.innerHTML='';
    tiles.forEach((t,ti)=>{
      if(picked.indexOf(ti)>=0) return;
      const b=document.createElement('button'); b.type='button'; b.className='dx-tile'; b.textContent=duelTileText(t.w);
      b.addEventListener('click',()=>{ picked.push(ti); try{ SFX.play('tap'); }catch(e){} render(); });
      tilesEl.appendChild(b);
    });
    buildEl.innerHTML='';
    if(picked.length===0){ const ph=document.createElement('div'); ph.className='dx-build-ph'; ph.textContent="So'zlarni tartib bilan bosing"; buildEl.appendChild(ph); }
    picked.forEach((ti,pos)=>{
      const b=document.createElement('button'); b.type='button'; b.className='dx-tile placed'; b.textContent=(pos===0?duelCap(duelTileText(tiles[ti].w)):duelTileText(tiles[ti].w));
      b.addEventListener('click',()=>{ picked.splice(pos,1); render(); });
      buildEl.appendChild(b);
    });
    buildEl.classList.toggle('full', picked.length===tiles.length);
    if(goEl) goEl.disabled = picked.length!==tiles.length;
  }
  render();
  if(goEl) goEl.addEventListener('click',()=>duelAnswerSentence(picked.map(ti=>tiles[ti].w)));
  duelStartTimer(SEC,()=>duelAnswerSentence(null));
}
function duelAnswerSentence(built){
  clearTimeout(duelQT); clearInterval(duelTick); dxFreezeTimer();
  const s=duelSt; if(!s||s.phase!=='play') return;
  const q=s.qs[s.idx];
  const norm=a=>(a||[]).map(w=>String(w).toLowerCase()).join(' ');
  const ok = !!built && norm(built)===norm(q.words);
  let pts=0;
  if(ok){ const SEC=duelSec(); const left=Math.max(0,SEC*1000-(Date.now()-s.qStart)); pts=10+Math.round(left/(SEC*1000)*5); s.score+=pts; }
  const go=duelEl('duSGo'), fb=duelEl('duSFb'), tilesEl=duelEl('duTiles'), buildEl=duelEl('duBuild');
  if(go) go.disabled=true;
  if(tilesEl) tilesEl.style.pointerEvents='none';
  if(buildEl){ buildEl.style.pointerEvents='none'; buildEl.classList.add(ok?'ok':'bad'); }
  if(fb){ fb.className='dx-fb show'; fb.innerHTML = ok ? `<span class="ok">To'g'ri! +${pts}</span>` : `<span class="bad">To'g'ri javob:</span><i>${escapeHtml(duelSentDisplay(q.words))}</i>`; }
  duelFeedback(ok?'ok':'bad', pts, null);
  s.idx++;
  duelProg();
  setTimeout(()=>{ if(duelSt===s) duelQ(); }, ok?1000:1700);
}

/* ===== PATTERN ===== */
function patAnchors(formula){
  const plain=String(formula||'')
    .replace(/<span class="slot">[^<]*<\/span>/g,'|')
    .replace(/<[^>]+>/g,'')
    .replace(/\[[^\]]*\]/g,'|');
  return plain.split('|')
    .map(s=>s.replace(/[.,;:!?]/g,' ').replace(/\s+/g,' ').trim().toLowerCase())
    .filter(s=>s.length>=2);
}
function duelBuildQsPattern(){
  const ALL = (typeof window!=='undefined' && window.PATTERNS) ? window.PATTERNS : null;
  if(!ALL || !ALL.length) return null;
  const unl = (typeof window!=='undefined' && typeof window.isPUnlocked==='function') ? window.isPUnlocked : null;
  let pool=ALL.filter(p=>p.formula && (!unl || unl(p.id)));
  if(pool.length<DUEL_QN) pool=ALL.filter(p=>p.formula);
  if(pool.length<3) return null;
  const sh=pool.slice().sort(()=>Math.random()-0.5).slice(0,DUEL_QN);
  return sh.map(p=>({
    ty:'pattern', pid:p.id, title:p.title,
    formula:p.formula, meaning:p.meaning||'',
    anchors:patAnchors(p.formula),
    sample:(p.examples&&p.examples[0])?String(p.examples[0]).replace(/<[^>]+>/g,''):''
  }));
}

function duelStartPatternHost(){
  const s=duelSt; if(!s) return;
  const qs=duelBuildQsPattern();
  if(!qs){ duelFail("Shablonlar yetarli emas — avval 'Shablonlar' bo'limidan bir nechtasini oching"); return; }
  try{ duelCh.send({type:'broadcast',event:'start',payload:duelStartPayload(qs)}); }catch(e){}
  duelBegin(qs);
}
function duelQPattern(q){
  const s=duelSt; if(!s) return;
  const SEC=duelSec();
  duelScene(`${dxQCard(DUEL_TY_LBL.pattern, `
      <div class="dx-pat-t">${escapeHtml(q.title)}</div>
      <div class="dx-pat-f">${q.formula}</div>
      ${q.meaning?`<div class="dx-pat-m">${escapeHtml(q.meaning.split('—')[0].trim())}</div>`:''}`)}
    <textarea class="dx-in" id="duPIn" rows="3" maxlength="200" style="margin-top:14px" placeholder="Shu shablon bilan gap yozing…" autocomplete="off" autocapitalize="sentences"></textarea>
    <button class="dx-btn" id="duPGo" style="margin-top:12px" disabled>Yuborish</button>
    <div class="dx-fb" id="duPFb"></div>`);
  const inp=duelEl('duPIn'), go=duelEl('duPGo');
  if(inp){
    setTimeout(()=>{ try{ inp.focus(); }catch(e){} },250);
    inp.addEventListener('input',()=>{ if(go) go.disabled = inp.value.trim().split(/\s+/).length<3; });
  }
  if(go) go.addEventListener('click',()=>duelAnswerPattern(inp?inp.value:''));
  duelStartTimer(SEC,()=>duelAnswerPattern(null));
}
function duelScorePattern(text,q){
  const t=String(text||'').toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').trim();
  if(!t) return {ok:false,part:false,words:0};
  const words=t.split(' ').filter(Boolean).length;
  let pos=0, found=0;
  for(const a of (q.anchors||[])){
    const at=t.indexOf(a,pos);
    if(at>=0){ found++; pos=at+a.length; }
  }
  const all=(q.anchors||[]).length>0 && found===q.anchors.length;
  return { ok: all && words>=5, part: all && words>=3, words, found, need:(q.anchors||[]).length };
}
async function duelPatternAI(text,q){
  try{
    if(typeof aiRequest!=='function') return null;
    const p=aiRequest({mode:'pattern_check',sentence:String(text||''),
      pattern:q.title+' \u2014 '+String(q.formula||'').replace(/<[^>]+>/g,''),
      rule:String(q.meaning||'').slice(0,300)});
    const to=new Promise(r=>setTimeout(()=>r(null),6000));
    const d=await Promise.race([p,to]);
    if(d && typeof d.score==='number') return d;
  }catch(e){}
  return null;
}

async function duelAnswerPattern(text){
  clearTimeout(duelQT); clearInterval(duelTick); dxFreezeTimer();
  const s=duelSt; if(!s||s.phase!=='play') return;
  const q=s.qs[s.idx], qi=s.idx;
  const go=duelEl('duPGo'), fb=duelEl('duPFb'), inp=duelEl('duPIn');
  if(go){ go.disabled=true; go.textContent='Tekshirilmoqda…'; }
  if(inp) inp.disabled=true;
  const loc=duelScorePattern(text,q);
  const elapsed=Date.now()-s.qStart;
  let pts=0, why='', verdict='bad';
  if(!loc.part){ verdict='bad'; why='Shablon qismlari yetishmadi'; }
  else{
    const ai=await duelPatternAI(text,q);
    if(ai){ if(ai.score>=3) verdict='ok'; else if(ai.score===2) verdict='part'; else verdict='bad'; why=ai.why||''; }
    else{ verdict = loc.ok ? 'part' : 'bad'; why='Tekshiruv ulanmadi'; }
  }
  if(duelSt!==s || s.idx!==qi) return;
  if(verdict==='ok'){ const SEC=duelSec(); const left=Math.max(0,SEC*1000-elapsed); pts=10+Math.round(left/(SEC*1000)*5); }
  else if(verdict==='part'){ pts=5; }
  if(pts) s.score+=pts;
  if(go) go.textContent='Yuborish';
  if(inp) inp.classList.add(verdict==='bad'?'bad':'ok');
  if(fb){ fb.className='dx-fb show';
    fb.innerHTML = verdict==='ok' ? `<span class="ok">Zo'r! +${pts}</span>${why?`<i>${escapeHtml(why)}</i>`:''}`
      : verdict==='part' ? `<span class="part">Qisman +${pts}</span>${why?`<i>${escapeHtml(why)}</i>`:''}`
      : `<span class="bad">${escapeHtml(why||'Shablon to\u2019g\u2019ri ishlatilmadi')}</span>${q.sample?`<i>Namuna: ${escapeHtml(q.sample)}</i>`:''}`; }
  duelFeedback(verdict, pts, null);
  s.idx++;
  duelProg();
  setTimeout(()=>{ if(duelSt===s) duelQ(); },2000);
}

/* ================= Yakun ================= */
function duelWaitendUpdate(){
  const s=duelSt; if(!s) return;
  const n=(s.qs&&s.qs.length)||DUEL_QN, k=Math.min(1,(s.oppIdx||0)/n);
  const t=duelEl('dxWaitT'), b=duelEl('dxWaitB');
  if(t) t.textContent=`${Math.min(s.oppIdx||0,n)}/${n} savol · ${s.oppScore||0} ball`;
  if(b) b.style.transform=`scaleX(${k.toFixed(3)})`;
}
function duelFinishMine(){
  const s=duelSt; if(!s) return;
  s.myDone=true;
  try{ duelCh&&duelCh.send({type:'broadcast',event:'done',payload:{score:s.score,role:s.role}}); }catch(e){}
  if(s.oppDone){ duelResult(); return; }
  s.phase='waitend';
  duelRefreshHud();
  const okN=(s.res||[]).filter(r=>r==='ok').length;
  duelScene(`<div class="dx-c">
    <div class="dx-p" style="margin:0 auto 8px">Siz yakunladingiz</div>
    <div class="dx-done">${s.score}</div>
    <div class="dx-p" style="margin-top:6px">ball · ${okN}/${(s.qs||[]).length} to'g'ri</div>
    <div class="dx-wait">${duelAvatarHtml(s.oppAvatar||'', s.oppName||'Raqib', 40)}
      <div><b>${escapeHtml(s.oppName||'Raqib')} hali o'ynamoqda</b><span id="dxWaitT"></span><div class="bar"><i id="dxWaitB" style="transform:scaleX(0)"></i></div></div></div>
  </div>`);
  duelWaitendUpdate();
}
function duelResult(forfeit){
  const s=duelSt; if(!s) return;
  s.phase='result';
  clearTimeout(duelQT); clearInterval(duelTick);
  const win=forfeit||s.score>s.oppScore, draw=!forfeit&&s.score===s.oppScore;
  // Botga qarshi: kam XP, tanga va garov yo'q, liga/statistikaga kirmaydi
  const xp=s.isBot?(win?15:(draw?8:5)):(win?30:(draw?18:10)), wc=s.isBot?0:(win?15:(draw?5:0));
  if(s.isBot) duelBotLearn(win,draw);
  try{ addXP(xp); }catch(e){}
  try{ if(wc) addCoins(wc,true); }catch(e){}
  let bet=0;
  if(s.bet){
    if(win){ try{ addCoins(40,true); }catch(e){} bet=20; }
    else if(draw){ try{ addCoins(20,true); }catch(e){} bet=0; }
    else bet=-20;
  }
  try{ if(win&&!s.isBot) setTimeout(fireConfetti,350); }catch(e){}
  try{ SFX.play(win?'duelWin':(draw?'coin':'duelLose')); }catch(e){}
  if(!s.isBot){ try{ dailyProgress('duel'); }catch(e){} }
  if(!s.isBot && win){ try{ dailyProgress('duelwin'); }catch(e){} }
  try{
    window.__wdDuels=window.__wdDuels||[];
    window.__wdDuels.unshift({d:Date.now(),opp:(s.oppName||'Raqib').slice(0,16),my:s.score,op:s.oppScore,r:win?'w':(draw?'d':'l'),mode:(s.mode||'words'),bot:!!s.isBot});
    if(window.__wdDuels.length>20) window.__wdDuels=window.__wdDuels.slice(0,20);
  }catch(e){}

  const n=(s.qs&&s.qs.length)||DUEL_QN;
  const res=s.res||[], ores=s.oppRes||[];
  const myOk=res.filter(r=>r==='ok').length, opOk=ores.filter(r=>r==='ok').length;
  const times=(s.times||[]).filter(t=>t>0);
  const avg=times.length?(times.reduce((a,b)=>a+b,0)/times.length/1000):0;
  let best=0,run=0; res.forEach(r=>{ run = r==='ok'?run+1:0; if(run>best) best=run; });
  const diff=Math.abs((s.score||0)-(s.oppScore||0));
  const kind=win?'win':(draw?'draw':'lose');
  const status=win?"G'alaba":(draw?"Durrang":"Mag'lubiyat");
  const sub=forfeit?"Raqib o'yinni tark etdi":(draw?"Hisob teng":(win?`${diff} ball farq bilan`:`${diff} ball yetmadi`));
  const myN=escapeHtml(s.name||duelName()), opN=escapeHtml(s.oppName||'Raqib');
  const flow=Array.from({length:n},(_,i)=>`<div class="c" style="animation-delay:${(.5+i*.04).toFixed(2)}s"><i class="${res[i]||'none'}"></i><i class="${ores[i]||'none'}"></i></div>`).join('');
  const rew=[`<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>+${xp} XP</span>`];
  if(wc) rew.push(`<span class="wc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M9.5 10.5h5" stroke-linecap="round"/></svg>+${wc} WC</span>`);
  if(s.bet) rew.push(`<span class="${bet<0?'neg':'wc'}">${bet>0?'+20 WC garov':(bet<0?'−20 WC garov':'Garov qaytdi')}</span>`);

  duelTop('title','Natija',(DX_MODES[s.mode]||DX_MODES.words).n+(s.isBot?' · mashq':''));
  duelScene(`<div class="dx-r ${kind}">
    <div class="dx-r-card">
      <div class="dx-r-st"><i></i>${status}</div>
      <div class="dx-r-sc"><b class="me" id="dxRMy">0</b><span>:</span><b class="op" id="dxROp">0</b></div>
      <div class="dx-r-sub">${sub}</div>
      <div class="dx-r-pl">
        <div class="p">${duelAvatarHtml(window.__wdAvatar||'', s.name, 36)}<div><b>${myN}</b><span>${myOk}/${n} to'g'ri</span></div></div>
        <div class="p op"><div><b>${opN}</b><span>${forfeit?'chiqib ketdi':opOk+'/'+n+" to'g'ri"}</span></div>${duelAvatarHtml(s.oppAvatar||'', s.oppName||'Raqib', 36)}</div>
      </div>
      <div class="dx-r-flow" aria-label="Savollar bo'yicha natija"><div class="cols">${flow}</div>
        <div class="leg"><span><i class="me"></i>Siz</span><span><i class="op"></i>${opN}</span></div></div>
    </div>
    <div class="dx-r-stats">
      <div><b>${Math.round(myOk/n*100)}%</b><span>Aniqlik</span></div>
      <div><b>${avg?avg.toFixed(1)+' s':'—'}</b><span>O'rtacha javob</span></div>
      <div><b>${best}</b><span>Eng uzun seriya</span></div>
    </div>
    <div class="dx-r-rew">${rew.join('')}</div>
    ${s.isBot?`<p class="dx-r-note">Mashq o'yini — reyting va statistikaga kirmaydi</p>`:''}
    <div class="dx-r-btns">
      <button class="dx-btn" id="duAgain">${DX_IC.again}<span>Yana o'ynash</span></button>
      <button class="dx-btn2" id="duClose">Yopish</button>
    </div>
    ${win?`<button class="dx-share" id="duShare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg><span>Story uchun rasm</span></button>`:''}
  </div>`);
  setTimeout(()=>{ const a=duelEl('dxRMy'), b=duelEl('dxROp'); if(a) dxCountTo(a,0,s.score||0); if(b) dxCountTo(b,0,s.oppScore||0); },250);
  const mode=s.mode||'words', wasBot=!!s.isBot;
  duelEl('duAgain').addEventListener('click',()=>{ if(wasBot) duelStartBot(mode); else { duelTeardown(); duelOpenSheet(mode); } });
  duelEl('duClose').addEventListener('click',duelClose);
  { const shB=duelEl('duShare'); if(shB){ const shD={my:s.score||0,op:s.oppScore||0,opp:s.oppName||'Raqib',acc:Math.round(myOk/n*100),best,avg:avg?avg.toFixed(1):0,mode:(DX_MODES[s.mode]||DX_MODES.words).n+(s.isBot?' · mashq':'')};
    shB.addEventListener('click',()=>{ try{ window.__wdStory.open('duel',shD); }catch(e){} }); } }
  try{ saveState(); }catch(e){}
}
function duelFail(msg){
  showToast(msg,IC.info);
  const ov=duelEl('duel-overlay');
  duelTeardown();
  if(ov && !ov.hidden) duelOpenSheet(); else duelClose();
}
function duelTeardown(){
  try{ if(duelAutoState&&duelAutoState.active){ duelAutoState.active=false; duelAutoCleanup(); const sb=window.__sb; if(sb){ Promise.resolve(sb.rpc('duel_cancel')).catch(()=>{}); } } }catch(e){}
  clearTimeout(duelQT); clearInterval(duelTick); clearInterval(duelSearchTick);
  if(duelSt&&duelSt.botT) clearTimeout(duelSt.botT);
  if(duelCh){ if(!duelCh.__bot){ try{ window.__sb&&window.__sb.removeChannel(duelCh); }catch(e){} } duelCh=null; }
  duelSt=null;
  const m=duelEl('dxModal'); if(m) m.remove();
}
function duelClose(){
  duelTeardown();
  duelHideOverlay();
  try{ if(history.state&&history.state.wdDuel) history.back(); }catch(e){}
  try{ renderHome(); }catch(e){}
}
window.addEventListener('popstate',()=>{
  if(!duelEl('duel-overlay').hidden){ duelTeardown(); duelHideOverlay(); try{ renderHome(); }catch(e){} }
});
function duelConfirmLeave(){
  if(duelEl('dxModal')) return;
  const m=document.createElement('div'); m.className='dx-modal'; m.id='dxModal';
  m.innerHTML=`<div class="dx-modal-box"><b>Duelni tark etasizmi?</b><p>${duelSt&&duelSt.isBot?"Mashq o'yini saqlanmaydi.":"Raqibingiz g'olib deb hisoblanadi."}</p>
    <div style="display:grid;gap:8px"><button class="dx-btn danger" id="duLv">Ha, chiqaman</button><button class="dx-btn2" id="duStay">Davom etish</button></div></div>`;
  duelEl('duel-overlay').appendChild(m);
  m.addEventListener('click',e=>{ if(e.target===m) m.remove(); });
  duelEl('duStay').addEventListener('click',()=>m.remove());
  duelEl('duLv').addEventListener('click',()=>{ m.remove(); duelClose(); });
}
document.getElementById('duelBack').addEventListener('click',()=>{
  const s=duelSt;
  if(s&&(s.phase==='play'||s.phase==='waitend')){ duelConfirmLeave(); return; }
  if(duelAutoState&&duelAutoState.active){ duelTeardown(); duelOpenSheet(); return; }
  if(s&&(s.phase==='wait'||s.phase==='join')){ duelTeardown(); duelOpenSheet(); return; }
  duelClose();
});

/* ================= DROP BOT — duelda odam topilmaganda raqib =================
   Bot telefonda ishlaydi (Supabase kanali yo'q). U foydalanuvchi javobini ko'rmaydi,
   o'z vaqtida mustaqil javob beradi va natijani oddiy raqib kabi yuboradi.
   "Juda aqlli bo'lmasligi" uchun: daraja → aniqlik, tasodifiy tezlik,
   yumshoq muvozanat va o'yinlar bo'yicha moslashuv. */
const DUEL_BOT={
  acc:{A1:.55,A2:.60,B1:.65,B2:.70,C1:.75,C2:.75},   // darajaga qarab to'g'ri javob ehtimoli
  mode:{words:0,listen:0,sentence:-.05,pattern:-.08},  // qiyinroq rejimlarda biroz past
  rmin:.35, rmax:.85,      // javob vaqti — savol vaqtining shu ulushida
  timeout:.06,             // ba'zan vaqti tugab qoladi
  lead:25, step:.05,       // 25+ ball farqda aniqlik ±5%
  amin:.45, amax:.85,      // jami aniqlik chegarasi
  adjMax:.15,              // o'yinlar bo'yicha moslashuv chegarasi
  wait:15,                 // odam kutish (s), keyin bot taklif qilinadi
  LS:'wd_duel_bot_adj'
};
function duelBotLevel(){ const c=String(window.__wdCEFR||'').toUpperCase().slice(0,2); return DUEL_BOT.acc[c]!==undefined?c:'A2'; }
function duelBotAdj(){ try{ const v=parseFloat(localStorage.getItem(DUEL_BOT.LS)); return isFinite(v)?Math.max(-DUEL_BOT.adjMax,Math.min(DUEL_BOT.adjMax,v)):0; }catch(e){ return 0; } }
function duelBotClamp(a){ return Math.max(DUEL_BOT.amin,Math.min(DUEL_BOT.amax,a)); }
function duelBotAcc(mode){ return duelBotClamp(DUEL_BOT.acc[duelBotLevel()]+(DUEL_BOT.mode[mode]||0)+duelBotAdj()); }
async function duelStartBot(mode){
  mode=DX_MODES[mode]?mode:'words';
  duelTeardown(); duelShowOverlay(); duelTop('title','Drop bot bilan mashq',DX_MODES[mode].n);
  const s={phase:'building',role:'host',name:duelName(),oppName:'Drop bot',oppAvatar:'bot',score:0,idx:0,oppScore:0,oppIdx:0,
           myDone:false,oppDone:false,code:'bot',myBet:false,mode,res:[],oppRes:[],streak:0,isBot:true};
  duelSt=s;
  duelCh={__bot:true,send(){},presenceState(){ return {}; }};   // tarmoqqa hech narsa ketmaydi
  let qs=null;
  if(mode==='sentence'){
    duelScene(`<div class="dx-c"><div class="dx-spin"></div><div class="dx-h" style="font-size:20px">Gaplar tayyorlanmoqda…</div><div class="dx-p">Bir necha soniya</div></div>`);
    try{ qs=await duelBuildQsSentence(); }catch(e){ qs=null; }
  } else if(mode==='pattern') qs=duelBuildQsPattern();
  else qs=duelBuildFor(mode);
  if(duelSt!==s) return;
  if(!qs){
    duelFail(mode==='sentence'?"Gaplarni tuzib bo'lmadi — internetni tekshiring":
             mode==='pattern'?"Shablonlar yetarli emas — avval bir nechtasini oching":
             "So'z zaxirasi yetarli emas — avval bir nechta bosqich o'ynang");
    return;
  }
  duelBegin(qs);
}
function duelBotStart(s){
  if(!s||!s.isBot||s.bot) return;
  s.bot={idx:0,score:0};
  duelBotNext(s,500);
}
function duelBotNext(s,extra){
  if(duelSt!==s||!s.bot||s.bot.idx>=s.qs.length) return;
  const SEC=duelSec()*1000;
  // Foydalanuvchi tugatgan bo'lsa — uzoq kuttirmaymiz
  if(s.myDone){ s.botT=setTimeout(()=>duelBotAnswer(s,DUEL_BOT.rmin+Math.random()*.3,false),400+Math.random()*500); return; }
  const to=Math.random()<DUEL_BOT.timeout;
  const frac=to?1:DUEL_BOT.rmin+Math.random()*(DUEL_BOT.rmax-DUEL_BOT.rmin);
  s.botT=setTimeout(()=>duelBotAnswer(s,frac,to),(extra||0)+frac*SEC);
}
function duelBotAnswer(s,frac,timedOut){
  if(duelSt!==s||!s.bot) return;
  const b=s.bot;
  let acc=duelBotAcc(s.mode);
  const lead=b.score-(s.score||0);                 // faqat ochiq ballga qaraydi
  if(lead>=DUEL_BOT.lead) acc-=DUEL_BOT.step; else if(lead<=-DUEL_BOT.lead) acc+=DUEL_BOT.step;
  acc=duelBotClamp(acc);
  let pts=0;
  if(!timedOut){
    if(Math.random()<acc) pts=10+Math.round((1-frac)*5);
    else if(s.mode==='pattern'&&Math.random()<.5) pts=5;   // shablonda qisman javob
  }
  b.idx++; b.score+=pts;
  duelOnProg({role:'bot',idx:b.idx,score:b.score});
  if(b.idx>=s.qs.length){ duelOnDone({role:'bot',score:b.score}); return; }
  duelBotNext(s,900+Math.random()*500);
}
/* O'yin natijasiga ko'ra bot keyingi safar ±5% kuchayadi/bo'shashadi */
function duelBotLearn(win,draw){
  if(draw) return;
  const v=duelBotAdj()+(win?DUEL_BOT.step:-DUEL_BOT.step);
  try{ localStorage.setItem(DUEL_BOT.LS,String(Math.max(-DUEL_BOT.adjMax,Math.min(DUEL_BOT.adjMax,v)).toFixed(2))); }catch(e){}
}

function duelHomeCard(){
  const st={w:0}; try{ (window.__wdDuels||[]).forEach(x=>{ if(x.r==='w'&&!x.bot) st.w++; }); }catch(e){}
  return `<button class="hubt" id="duelHomeCard">
    <div class="hubt-ic duel">${DUEL_IC.swords}</div>
    <b>Jonli duel</b><span>${st.w?st.w+" g'alaba":"1v1 bellashuv"}</span>
  </button>`;
}

/* ==================================================================
   XOTIRA MARKAZI — SRS v2 (v93)
   ------------------------------------------------------------------
   Algoritm: FSRS-4.5 (Free Spaced Repetition Scheduler) — Anki'ning
   zamonaviy algoritmi. Har bir so'z uchun:
     S — barqarorlik (kun): xotira 90% ehtimol bilan saqlanadigan muddat
     D — qiyinlik (1..10)
     R — hozirgi eslab qolish ehtimoli = (1 + F·t/S)^-0.5
   Holatlar: 0 yangi · 1 o'rganilmoqda · 2 takror · 3 qayta o'rganish
   Baholar: 1 Qayta · 2 Qiyin · 3 Yaxshi · 4 Oson
   Mashq turlari (aralash rejimda so'z yetukligiga qarab tanlanadi):
     tanlov (yangi so'z) · karta (eslash) · teskari tanlov · yozish ·
     eshitib yozish · bo'sh joy (misol gapda)
   Eski (v92) yozuvlar avtomatik ko'chiriladi — progress yo'qolmaydi.
   ================================================================== */
const SRS_DAY=86400000, SRS_MIN=60000, SRS_MAX=2000, SRS_SESSION=20;
const SRS_W=[0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0234,1.616,0.1544,1.0824,1.9813,0.0953,0.2975,2.2042,0.2407,2.9466];
const SRS_DECAY=-0.5, SRS_FACTOR=19/81, SRS_RET=0.9, SRS_MAXIV=1095;
const SRS_STEPS=[1,10];           // o'rganish bosqichlari (daqiqa)
const SRS_RELEARN=10;             // qayta o'rganish (daqiqa)

/* ---------- Holat: sozlamalar va kunlik jurnal ---------- */
window.__wdSrsCfg = Object.assign({newPerDay:10, maxRev:120, mode:'mix', autoSpeak:true},
  (SAVED_STATE.srsCfg && typeof SAVED_STATE.srsCfg==='object') ? SAVED_STATE.srsCfg : {});
window.__wdSrsLog = (SAVED_STATE.srsLog && typeof SAVED_STATE.srsLog==='object') ? SAVED_STATE.srsLog : {};
function srsDayKey(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function srsLogToday(){ const k=srsDayKey(); const L=window.__wdSrsLog; if(!L[k]) L[k]={r:0,c:0,n:0,t:0}; return L[k]; }
function srsLogTrim(){
  const keys=Object.keys(window.__wdSrsLog).sort();
  while(keys.length>200){ delete window.__wdSrsLog[keys.shift()]; }
}

/* ---------- FSRS matematikasi ---------- */
const srsClampD=d=>Math.min(10,Math.max(1,d));
function srsR(t,S){ return S>0 ? Math.pow(1+SRS_FACTOR*t/S, SRS_DECAY) : 0; }
function srsIvDays(S){ return Math.min(SRS_MAXIV, Math.max(1, Math.round(S/SRS_FACTOR*(Math.pow(SRS_RET,1/SRS_DECAY)-1)))); }
function srsInitS(g){ return Math.max(0.1, SRS_W[g-1]); }
function srsInitD(g){ return srsClampD(SRS_W[4]-Math.exp(SRS_W[5]*(g-1))+1); }
function srsNextD(D,g){ return srsClampD(SRS_W[7]*srsInitD(4)+(1-SRS_W[7])*(D-SRS_W[6]*(g-3))); }
function srsRecallS(D,S,R,g){
  return S*(1+Math.exp(SRS_W[8])*(11-D)*Math.pow(S,-SRS_W[9])*(Math.exp((1-R)*SRS_W[10])-1)*(g===2?SRS_W[15]:1)*(g===4?SRS_W[16]:1));
}
function srsForgetS(D,S,R){
  return Math.min(S, SRS_W[11]*Math.pow(D,-SRS_W[12])*(Math.pow(S+1,SRS_W[13])-1)*Math.exp((1-R)*SRS_W[14]));
}
function srsFuzz(days,seed){
  if(days<3) return days;
  const f=((Math.sin(seed*12.9898)*43758.5453)%1+1)%1;   // barqaror tasodif
  return Math.max(1,Math.round(days*(0.95+f*0.1)));
}
/* Kartani o'zgartirmasdan, berilgan baho natijasini hisoblaydi */
function srsSchedule(it,g,now){
  now=now||Date.now();
  const o={st:it.st||0,S:it.S||0,D:it.D||0,step:it.step||0,lapses:it.lapses||0,due:it.due};
  const elapsed=it.last ? Math.max(0,(now-it.last)/SRS_DAY) : 0;
  if(o.st===0 || o.st===1){
    if(o.st===0){ o.S=srsInitS(g); o.D=srsInitD(g); o.step=0; }
    else if(it.last && elapsed>=1){ const R=srsR(elapsed,o.S); o.S=srsRecallS(o.D,o.S,R,g); o.D=srsNextD(o.D,g); }
    if(g===1){ o.st=1; o.step=0; o.due=now+SRS_STEPS[0]*SRS_MIN; }
    else if(g===2){ o.st=1; o.due=now+Math.round((SRS_STEPS[0]+SRS_STEPS[1])/2*SRS_MIN); }
    else if(g===3){
      if(o.step+1<SRS_STEPS.length){ o.st=1; o.step++; o.due=now+SRS_STEPS[o.step]*SRS_MIN; }
      else { o.st=2; o.step=0; o.due=now+srsFuzz(srsIvDays(o.S),now)*SRS_DAY; }
    } else { o.st=2; o.step=0; o.S=Math.max(o.S,srsInitS(4)*0.6); o.due=now+srsFuzz(Math.max(2,srsIvDays(o.S)),now)*SRS_DAY; }
    return o;
  }
  const R=srsR(elapsed,o.S);
  if(o.st===3){
    if(g===1){ o.due=now+SRS_RELEARN*SRS_MIN; return o; }
    o.st=2; o.D=srsNextD(o.D,g);
    o.due=now+srsFuzz(Math.max(1,srsIvDays(o.S)*(g===4?1.5:1)),now)*SRS_DAY; return o;
  }
  // st===2 — oddiy takror
  o.D=srsNextD(o.D,g);
  if(g===1){ o.lapses++; o.S=srsForgetS(it.D||5,o.S,R); o.st=3; o.due=now+SRS_RELEARN*SRS_MIN; return o; }
  const sH=srsRecallS(it.D||5,o.S,R,2), sG=srsRecallS(it.D||5,o.S,R,3), sE=srsRecallS(it.D||5,o.S,R,4);
  let ivH=srsIvDays(sH), ivG=srsIvDays(sG), ivE=srsIvDays(sE);
  ivG=Math.max(ivG,ivH+1); ivE=Math.max(ivE,ivG+1);
  o.S = g===2?sH : g===3?sG : sE;
  o.due=now+srsFuzz(g===2?ivH:g===3?ivG:ivE, now)*SRS_DAY;
  return o;
}
function srsFmtIv(ms){
  const m=Math.round(ms/SRS_MIN);
  if(m<60) return Math.max(1,m)+' daq';
  const h=Math.round(m/60); if(h<24) return h+' soat';
  const d=Math.round(ms/SRS_DAY); if(d<31) return d+' kun';
  const mo=d/30.4; if(mo<12) return (mo<10?mo.toFixed(1).replace('.0',''):Math.round(mo))+' oy';
  return (d/365).toFixed(1).replace('.0','')+' yil';
}
function srsFmtWhen(ts){
  const d=ts-Date.now(); if(d<=0) return 'Hozir';
  return srsFmtIv(d)+'dan keyin';
}

/* ---------- Ma'lumotlar bazasi ---------- */
function srsMigrate(it){
  if(!it || it.st!==undefined) return it;
  const OLD=[1,2,4,7,14,30,60,120];
  if((it.reps||0)>0){
    it.st=2; it.S=OLD[Math.max(0,(it.iv||1)-1)]||1;
    it.D=srsClampD(5+((it.bad||0)-(it.ok||0))*0.4);
    it.last=it.due ? it.due-it.S*SRS_DAY : Date.now();
    it.lapses=it.bad||0;
  } else { it.st=0; it.S=0; it.D=0; it.lapses=0; }
  it.step=0; delete it.iv;
  return it;
}
(function(){ try{ Object.values(window.__wdSrs||{}).forEach(srsMigrate); }catch(e){} })();

function srsAdd(term,tr,extra){
  term=String(term||'').trim(); tr=String(tr||'').trim();
  if(!term||!tr) return false;
  window.__wdSrs=window.__wdSrs||{};
  const k=term.toLowerCase();
  if(window.__wdSrs[k]) return false;
  if(Object.keys(window.__wdSrs).length>=SRS_MAX) return false;
  window.__wdSrs[k]={t:term,tr:tr,ipa:(extra&&extra.ipa)||'',ex:(extra&&extra.ex)||'',
    st:0,S:0,D:0,step:0,lapses:0,due:Date.now(),last:0,reps:0,ok:0,bad:0,ts:Date.now(),src:(extra&&extra.src)||''};
  try{ dailyProgress('newword'); }catch(e){}
  return true;
}
window.__wdSrsAdd=srsAdd;
/* v111: So'z devori olib tashlandi — u yerdagi so'zlar bir marta Takrorimga ko'chiriladi */
(function(){ try{
  const W=SAVED_STATE.wallWords; if(!Array.isArray(W)||!W.length||localStorage.getItem('wd_wall_migrated')) return;
  let n=0; W.forEach(w=>{ if(w&&w.en&&w.uz&&srsAdd(w.en,w.uz,{src:"So'z devori"})) n++; });
  localStorage.setItem('wd_wall_migrated','1'); delete SAVED_STATE.wallWords; saveState();
  if(n) setTimeout(()=>{ try{ showToast(n+" ta so'z devordan Takrorimga ko'chirildi",IC.info); }catch(e){} },2500);
}catch(e){} })();
function srsAll(){ return Object.values(window.__wdSrs||{}).filter(Boolean); }
function srsNewToday(){ return srsLogToday().n||0; }
function srsNewLeft(){ return Math.max(0,(window.__wdSrsCfg.newPerDay||10)-srsNewToday()); }
function srsReviewDue(){ const n=Date.now(); return srsAll().filter(it=>it.st>0 && it.due<=n); }
function srsNewPool(){ return srsAll().filter(it=>it.st===0).sort((a,b)=>(a.ts||0)-(b.ts||0)); }
/* Bugungi navbat: takror + yangi (limit bilan) */
function srsDueList(){ return srsReviewDue().concat(srsNewPool().slice(0,srsNewLeft())); }
function srsDueCounts(){
  const rev=srsReviewDue(), nw=Math.min(srsNewPool().length,srsNewLeft());
  return {rev:rev.length, learn:rev.filter(it=>it.st===1||it.st===3).length, nw:nw, total:rev.length+nw};
}
window.__wdSrsDueCount=()=>srsDueCounts().total;
function srsNextDue(){ const f=srsAll().filter(it=>it.st>0&&it.due>Date.now()).sort((a,b)=>a.due-b.due)[0]; return f?f.due:0; }
function srsRetNow(it){ if(!it||it.st===0||!it.S) return 0; return srsR(Math.max(0,(Date.now()-(it.last||Date.now()))/SRS_DAY),it.S); }
function srsBucket(it){ if(it.st===0) return 'new'; if(it.st===1||it.st===3) return 'learn'; return it.S>=21?'mature':'young'; }
function srsIsLeech(it){ return (it.lapses||0)>=3 || ((it.bad||0)>=3 && (it.bad||0)>(it.ok||0)); }
function srsGradeItem(it,g){
  const o=srsSchedule(it,g);
  const wasNew=it.st===0;
  Object.assign(it,o);
  it.last=Date.now(); it.reps=(it.reps||0)+1;
  if(g>=2) it.ok=(it.ok||0)+1; else it.bad=(it.bad||0)+1;
  const L=srsLogToday(); L.r++; if(g>=2) L.c++; if(wasNew) L.n++;
  return wasNew;
}
function srsStats(){
  const all=srsAll(), b={new:0,learn:0,young:0,mature:0};
  all.forEach(it=>b[srsBucket(it)]++);
  const rev=all.filter(it=>it.st>0&&it.S>0);
  const avgR=rev.length ? rev.reduce((a,it)=>a+srsRetNow(it),0)/rev.length : 0;
  // So'nggi 30 kun aniqligi va seriya
  let r30=0,c30=0; const L=window.__wdSrsLog, d=new Date();
  for(let i=0;i<30;i++){ const x=new Date(d); x.setDate(d.getDate()-i); const e=L[srsDayKey(x)]; if(e){ r30+=e.r; c30+=e.c; } }
  let streak=0;
  for(let i=0;i<400;i++){ const x=new Date(d); x.setDate(d.getDate()-i); const e=L[srsDayKey(x)];
    if(e&&e.r>0) streak++; else if(i===0) continue; else break; }
  return {total:all.length,b,avgR,acc:r30?c30/r30:0,r30,streak,leeches:all.filter(srsIsLeech).length};
}
function srsForecast(days){
  const out=Array(days).fill(0), start=new Date(); start.setHours(0,0,0,0);
  srsAll().forEach(it=>{ if(it.st===0) return;
    let k=Math.floor((it.due-start.getTime())/SRS_DAY); if(k<0) k=0; if(k<days) out[k]++; });
  out[0]+=Math.min(srsNewPool().length,srsNewLeft());
  return out;
}

/* ---------- Bosh sahifa kartalari ---------- */
/* Asosiy "Bugungi takror" banneri — Boshi ekranida topshiriqlardan keyin */
function srsBindHome(sec){
  const a=sec.querySelector('#srsHero'); if(a) a.addEventListener('click',()=>{ const c=srsDueCounts(); if(c.total) srsStart(); else srsOpenHub(); });
  const b=sec.querySelector('#srsHomeCard'); if(b) b.addEventListener('click',()=>srsOpenHub());
}

/* ==================== XOTIRA MARKAZI (HUB) ==================== */
const XM_IC={
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3.5-1.6 5.3-1.6 8 0 1.4 1 2.4 2.2 2.4 1.5 0 2.3-1.2 2-3 2.2 1.6 3.4 4 3.4 6.4A6 6 0 0 1 12 22a6 6 0 0 1-6-6.2C6 10.4 10.6 7.6 12 2z"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  stack:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
};
let xmFilter='all', xmQuery='';
function srsOpenHub(){
  let el=document.getElementById('xmHub');
  if(!el){
    el=document.createElement('div'); el.id='xmHub'; el.className='xm';
    document.body.appendChild(el);
  }
  srsRenderHub();
  requestAnimationFrame(()=>el.classList.add('on'));
}
window.__wdOpenSrs=srsOpenHub;
function srsCloseHub(){
  const el=document.getElementById('xmHub'); if(!el) return;
  el.classList.remove('on'); setTimeout(()=>{ el.remove(); try{ renderHome(); }catch(e){} },320);
}
function srsOpenAdd(){
  const layer=openSheet(`
    <h2 style="margin:4px 0 6px">So'z qo'shish</h2>
    <p class="desc" style="margin-bottom:14px">So'z xotira markaziga tushadi va FSRS jadvali bo'yicha qaytadi.</p>
    <div class="xa"><label>Inglizcha</label><input id="xaT" placeholder="masalan: resilient" autocomplete="off" autocapitalize="off"></div>
    <div class="xa"><label>Tarjima</label><input id="xaR" placeholder="masalan: chidamli" autocomplete="off"></div>
    <div class="xa"><label>Misol gap <i>(ixtiyoriy)</i></label><input id="xaE" placeholder="She is a resilient learner." autocomplete="off"></div>
    <button class="btn btn-primary btn-block" id="xaGo" style="margin-top:6px">Qo'shish</button>`);
  const t=layer.querySelector('#xaT'); setTimeout(()=>{ try{ t.focus(); }catch(e){} },350);
  layer.querySelector('#xaGo').onclick=()=>{
    const term=t.value.trim(), tr=layer.querySelector('#xaR').value.trim(), ex=layer.querySelector('#xaE').value.trim();
    if(!term||!tr){ showToast("So'z va tarjimani yozing",IC.info); return; }
    if((window.__wdSrs||{})[term.toLowerCase()]){ showToast("Bu so'z allaqachon bor",IC.info); return; }
    srsAdd(term,tr,{ex,src:'manual'}); saveState(); closeSheet(); srsRenderHub();
    showToast(`"${term}" qo'shildi`,IC.check||IC.info);
  };
}
function srsOpenCfg(){
  const c=window.__wdSrsCfg;
  const chips=(name,vals,cur,lbl)=>`<div class="xc-chips" data-k="${name}">${vals.map((v,i)=>`<button data-v="${v}" class="${String(cur)===String(v)?'on':''}">${lbl?lbl[i]:v}</button>`).join('')}</div>`;
  const layer=openSheet(`
    <h2 style="margin:4px 0 14px">Takror sozlamalari</h2>
    <div class="xc"><b>Kuniga yangi so'zlar</b><span>Ko'p yangi so'z — ertangi takror ham ko'p bo'ladi</span>${chips('newPerDay',[5,10,15,20,30],c.newPerDay)}</div>
    <div class="xc"><b>Mashq turi</b><span>Aralash rejim so'z yetukligiga qarab mashqni o'zi tanlaydi</span>
      ${chips('mode',['mix','flip','type','listen'],c.mode,['Aralash','Kartalar','Yozish','Tinglash'])}</div>
    <div class="xc xc-row"><div><b>Avto-talaffuz</b><span>Javob ochilganda so'z o'qib beriladi</span></div>
      <button class="xc-tg ${c.autoSpeak?'on':''}" id="xcSpk"><i></i></button></div>
    <div class="xc-info">${IC.info||''}<p>WordDrop <b>FSRS</b> algoritmidan foydalanadi: har bir so'zning qiyinligi va xotirangiz barqarorligi alohida hisoblanadi, so'z esingizdan chiqishiga oz qolganda qaytadi. Maqsadli xotira darajasi — 90%.</p></div>
    <button class="btn btn-primary btn-block" id="xcOk">Saqlash</button>`);
  layer.querySelectorAll('.xc-chips').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    const k=g.dataset.k; c[k]= k==='mode'?b.dataset.v:Number(b.dataset.v);
  }));
  layer.querySelector('#xcSpk').onclick=e=>{ c.autoSpeak=!c.autoSpeak; e.currentTarget.classList.toggle('on',c.autoSpeak); };
  layer.querySelector('#xcOk').onclick=()=>{ saveState(); closeSheet(); srsRenderHub(); };
}

/* ==================== TAKROR SESSIYASI ==================== */
let SS=null;   // joriy sessiya
function srsBuildQueue(kind,list){
  const now=Date.now(), cfg=window.__wdSrsCfg;
  if(kind==='one') return list.slice();
  if(kind==='leech') return srsAll().filter(srsIsLeech).slice(0,SRS_SESSION);
  if(kind==='extra') return srsAll().filter(it=>it.st>0).sort((a,b)=>srsRetNow(a)-srsRetNow(b)).slice(0,SRS_SESSION);
  const rev=srsReviewDue().sort((a,b)=>{
    // avval o'rganilayotganlar, keyin esdan chiqish xavfi yuqorilari
    const la=(a.st===1||a.st===3)?0:1, lb=(b.st===1||b.st===3)?0:1;
    return la-lb || srsRetNow(a)-srsRetNow(b);
  }).slice(0,cfg.maxRev||120);
  const nw=srsNewPool().slice(0,srsNewLeft());
  // Yangi so'zlarni takrorlar orasiga aralashtiramiz (har 3-taga bittadan)
  const q=[]; let i=0,j=0;
  while(i<rev.length||j<nw.length){
    if(i<rev.length) q.push(rev[i++]);
    if(i<rev.length) q.push(rev[i++]);
    if(j<nw.length && (q.length%3===2||i>=rev.length)) q.push(nw[j++]);
  }
  return q.slice(0,Math.max(SRS_SESSION,Math.min(q.length,60)));
}
function srsQuit(){
  if(SS && SS.seen.size>0 && SS.idx<SS.q.length){ srsFinish(true); return; }
  srsCloseSes();
}
function srsCloseSes(){
  document.removeEventListener('keydown',srsKey);
  const el=document.getElementById('xmSes'); if(el){ el.classList.remove('on'); setTimeout(()=>el.remove(),300); }
  SS=null;
  try{ if(document.getElementById('xmHub')) srsRenderHub(); else renderHome(); }catch(e){}
}
function srsKey(e){
  if(!SS || e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.key!=='Enter') return;
  const f=document.getElementById('xsFoot'); if(!f) return;
  if(e.key===' '||e.key==='Enter'){ const b=f.querySelector('[data-main]'); if(b){ e.preventDefault(); b.click(); } }
  else if(/^[1-4]$/.test(e.key)){ const b=f.querySelector(`[data-g="${e.key}"]`)||f.querySelector(`[data-opt="${e.key}"]`)||document.querySelector(`#xsStage [data-opt="${e.key}"]`); if(b){ e.preventDefault(); b.click(); } }
}
function srsPickMode(it){
  const m=window.__wdSrsCfg.mode;
  const pool=srsAll().length;
  const canCloze=it.ex && new RegExp('\\b'+it.t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(it.ex);
  if(m==='flip') return 'flip';
  if(m==='type') return it.st===0&&pool>=4?'mcq':'type';
  if(m==='listen') return it.st===0&&pool>=4?'mcq':'listen';
  if(it.st===0) return pool>=4?'mcq':'flip';
  if(it.st===1||it.st===3) return 'flip';
  if(it.S<4) return Math.random()<.5&&pool>=4?'rmcq':'flip';
  const r=Math.random();
  if(canCloze && r<.3) return 'cloze';
  if(r<.6) return 'type';
  if(r<.8) return 'listen';
  return 'flip';
}
function srsOptions(it,field){
  const others=srsAll().filter(x=>x!==it && String(x[field]).toLowerCase()!==String(it[field]).toLowerCase());
  const pick=[]; const used=new Set([String(it[field]).toLowerCase()]);
  while(pick.length<3 && others.length){ const k=others.splice(Math.floor(Math.random()*others.length),1)[0];
    const v=String(k[field]); if(!used.has(v.toLowerCase())){ used.add(v.toLowerCase()); pick.push(v); } }
  const opts=pick.concat([String(it[field])]).sort(()=>Math.random()-.5);
  return opts;
}
function srsNorm(s){ return String(s).toLowerCase().replace(/[’'`]/g,"'").replace(/[^a-z0-9' -]/g,'').replace(/\s+/g,' ').trim(); }
function srsLev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){ const c=[i]; for(let j=1;j<=n;j++) c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); p=c; }
  return p[n]; }
function srsCompare(v,t){
  const a=srsNorm(v), b=srsNorm(t);
  if(a===b) return 'ok';
  const d=srsLev(a,b);
  if(b.length>=5 && d<=1) return 'near';
  if(b.length>=9 && d<=2) return 'near';
  return 'bad';
}
/* Avtomatik baholanadigan mashqlar: to'g'ri → Yaxshi (tez bo'lsa Oson), xato → Qayta */
function srsAnswer(it,g){
  if(!SS) return;
  const first=!SS.seen.has(it.t);
  const ok=g>=2;
  if(first){
    SS.seen.add(it.t);
    if(ok) SS.ok++; else SS.bad++;
    try{ dailyProgress('srs'); }catch(e){}
  }
  if(ok){ SS.combo++; if(SS.combo>SS.best) SS.best=SS.combo; try{ dailyProgress('combo',SS.combo,{max:true}); }catch(e){} }
  else SS.combo=0;
  if(ok && SS.combo>0 && SS.combo%5===0){ srsComboFx(SS.combo); }
  const wasNew=srsGradeItem(it,g);
  if(wasNew){ SS.newN++; try{ dailyProgress('srsnew'); }catch(e){} }
  SS.xp += ok ? (wasNew?3:2) : 0;
  SS.log.push({t:it.t,g});
  // O'rganish bosqichidagi so'z sessiya ichida yana chiqadi (eng ko'pi 3 marta)
  const soon=it.due-Date.now() < 20*SRS_MIN;
  SS.requeue[it.t]=(SS.requeue[it.t]||0);
  if(soon && SS.requeue[it.t]<3 && SS.kind!=='one'){
    SS.requeue[it.t]++;
    const pos=Math.min(SS.q.length, SS.idx+1+Math.max(3,Math.min(6,SS.q.length-SS.idx-1)));
    SS.q.splice(pos,0,it);
  }
  SS.idx++;
  try{ saveState(); }catch(e){}
  srsStep();
}

/* ---------- v93.1 ko'rinish qatlami: tomchi = xotira darajasi ---------- */
let __dropUid=0;
/* Tomchi ichidagi suv sathi — 0..1 */
function srsDropSvg(level,size,opts){
  opts=opts||{};
  const id='dl'+(++__dropUid), h=size, w=Math.round(size*0.8);
  const lv=Math.max(0,Math.min(1,level||0)), y=8+(1-lv)*52;
  const path='M32 4C32 4 9 30 9 43a23 23 0 0 0 46 0C55 30 32 4 32 4Z';
  return `<svg class="drop-meter${opts.cls?' '+opts.cls:''}" width="${w}" height="${h}" viewBox="0 0 64 70" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs>
    <path d="${path}" class="dm-bg"/>
    <g clip-path="url(#${id})"><path class="dm-water" d="M0 ${y} Q16 ${y-3} 32 ${y} T64 ${y} V72 H0Z"/></g>
    <path d="${path}" class="dm-line"/>
  </svg>`;
}
function srsHomeCard(){
  const total=srsAll().length, c=srsDueCounts();
  const badge = total ? (c.total>0?`<div class="hubt-bdg">${c.total}</div>`:`<div class="hubt-bdg ok">✓</div>`) : '';
  const sub = !total ? "So'z yo'q" : (c.total>0 ? `Bugun ${c.total}` : "Bajarildi");
  return `<button class="hubt" id="srsHomeCard">${badge}
    <div class="hubt-ic srs">${IC.brain||''}</div>
    <b>Takrorlash</b><span>${sub}</span>
  </button>`;
}
function srsHomeHero(){
  const total=srsAll().length;
  if(!total) return '';
  const c=srsDueCounts(), st=srsStats();
  const pct=Math.round(st.avgR*100);
  const mins=Math.max(1,Math.round(c.total*9/60));
  const parts=[]; if(c.rev) parts.push(c.rev+' ta takror'); if(c.nw) parts.push(c.nw+' ta yangi');
  return `<button class="rv-card" id="srsHero">
    <div class="rv-l">
      <div class="rv-k">Takrorlash</div>
      ${c.total
        ? `<div class="rv-n"><b>${c.total}</b><span>so'z kutmoqda</span></div><div class="rv-s">${parts.join(', ')}. Taxminan ${mins} daqiqa.</div>`
        : `<div class="rv-n done"><span>Bugungi takror bajarildi</span></div><div class="rv-s">Keyingi so'z ${srsNextDue()?srsFmtWhen(srsNextDue()):'hali yo\'q'}.</div>`}
    </div>
    <div class="rv-r">${srsDropSvg(st.avgR,58)}<span>${pct}% esda</span></div>
  </button>`;
}

function srsRenderHub(){
  const el=document.getElementById('xmHub'); if(!el) return;
  const keep=(el.querySelector('.xm-scroll')||{}).scrollTop||0;
  const st=srsStats(), c=srsDueCounts(), total=st.total;
  const pct=Math.round(st.avgR*100);
  const fc=srsForecast(7), fmax=Math.max(1,...fc);
  const wd=['Ya','Du','Se','Ch','Pa','Ju','Sh'];
  const fcHtml=fc.map((n,i)=>{ const d=new Date(); d.setDate(d.getDate()+i);
    return `<div class="fc-c${i===0?' now':''}"><b>${n||''}</b><i style="height:${n?Math.max(6,Math.round(n/fmax*100)):2}%"></i><span>${i===0?'Bugun':wd[d.getDay()]}</span></div>`; }).join('');
  const L=window.__wdSrsLog, today=new Date(); today.setHours(0,0,0,0);
  const startD=new Date(today); startD.setDate(today.getDate()-(14*7)-((today.getDay()+6)%7));
  let cells='', maxR=1;
  Object.values(L).forEach(e=>{ if(e.r>maxR) maxR=e.r; });
  for(let i=0;i<15*7;i++){ const d=new Date(startD); d.setDate(startD.getDate()+i);
    if(d>today){ cells+='<i class="f"></i>'; continue; }
    const e=L[srsDayKey(d)], r=e?e.r:0, lv=!r?0:r<maxR*.25?1:r<maxR*.5?2:r<maxR*.8?3:4;
    cells+=`<i class="l${lv}" title="${srsDayKey(d)}: ${r} ta"></i>`; }
  const B=st.b;
  const seg=(k,cls)=>B[k]?`<i class="${cls}" style="flex:${B[k]}"></i>`:'';
  const leeches=srsAll().filter(srsIsLeech).sort((a,b)=>(b.lapses||0)-(a.lapses||0)).slice(0,5);
  const mins=Math.max(1,Math.round(c.total*9/60));
  const learnOnly=c.learn, revOnly=c.rev-c.learn;
  el.innerHTML=`
    <div class="xm-head">
      <button class="xm-ib" id="xmBack" aria-label="Orqaga">${XM_IC.back}</button>
      <div class="xm-ht"><b>Takrorlash</b></div>
      <button class="xm-ib" id="xmAdd" aria-label="So'z qo'shish">${XM_IC.plus}</button>
      <button class="xm-ib" id="xmCfg" aria-label="Sozlamalar">${XM_IC.gear}</button>
    </div>
    <div class="xm-scroll">
      <section class="rv-top">
        <div class="rv-top-t">
          ${c.total
            ? `<div class="rv-big">${c.total}</div><p class="rv-lead">so'z bugun takrorlanadi</p>
               <ul class="rv-split">${c.nw?`<li><i class="k-new"></i>${c.nw} yangi</li>`:''}${learnOnly?`<li><i class="k-learn"></i>${learnOnly} o'rganilmoqda</li>`:''}${revOnly?`<li><i class="k-rev"></i>${revOnly} takror</li>`:''}</ul>`
            : total
              ? `<div class="rv-big sm">Bugun tayyor</div><p class="rv-lead">Keyingi so'z ${srsNextDue()?srsFmtWhen(srsNextDue()):'hali yo\'q'} qaytadi.</p>`
              : `<div class="rv-big sm">Lug'at bo'sh</div><p class="rv-lead">Bosqichlarda o'rgangan so'zlaringiz shu yerga tushadi. Xohlasangiz, o'zingiz qo'shing.</p>`}
        </div>
        <figure class="rv-drop">${srsDropSvg(st.avgR,112,{cls:'lg'})}<figcaption><b>${pct}%</b> xotirada</figcaption></figure>
      </section>
      ${c.total
        ? `<button class="rv-go" id="xmStart"><span>Takrorlashni boshlash</span><em>${mins} daq</em></button>`
        : total
          ? `<button class="rv-go ghost" id="xmExtra"><span>Qo'shimcha mashq</span><em>eng zaif so'zlar</em></button>`
          : `<button class="rv-go" id="xmAdd2"><span>So'z qo'shish</span></button>`}

      <div class="rv-facts">
        <div><b>${st.streak}</b><span>kun ketma-ket</span></div>
        <div><b>${st.r30?Math.round(st.acc*100)+'%':'—'}</b><span>aniqlik, 30 kun</span></div>
        <div><b>${total}</b><span>jami so'z</span></div>
        <div><b>${B.mature}</b><span>mustahkam</span></div>
      </div>

      <div class="rv-sheet">
        <section class="rv-sec">
          <h3>So'zlar qayerda</h3>
          <div class="rv-stack">${seg('new','k-new')}${seg('learn','k-learn')}${seg('young','k-rev')}${seg('mature','k-mat')}${total?'':'<i class="k-empty" style="flex:1"></i>'}</div>
          <dl class="rv-legend">
            <div><dt><i class="k-new"></i>Yangi</dt><dd>${B.new}</dd></div>
            <div><dt><i class="k-learn"></i>O'rganilmoqda</dt><dd>${B.learn}</dd></div>
            <div><dt><i class="k-rev"></i>Takrorda</dt><dd>${B.young}</dd></div>
            <div><dt><i class="k-mat"></i>Mustahkam</dt><dd>${B.mature}</dd></div>
          </dl>
          <p class="rv-note">Mustahkam so'z kamida 21 kun esda turadi.</p>
        </section>
        <section class="rv-sec">
          <h3>Keyingi 7 kun</h3>
          <div class="rv-fc">${fcHtml}</div>
        </section>
        <section class="rv-sec">
          <h3>So'nggi 15 hafta</h3>
          <div class="rv-heat">${cells}</div>
        </section>
        ${leeches.length?`<section class="rv-sec">
          <h3>Tez unutilayotgan so'zlar</h3>
          <p class="rv-note top">Har biriga o'zingiz misol gap tuzib ko'ring, shunda yaxshiroq esda qoladi.</p>
          ${leeches.map(it=>`<button class="rv-lw" data-w="${escapeHtml(it.t.toLowerCase())}"><b>${escapeHtml(it.t)}</b><span>${escapeHtml(it.tr)}</span><em>${it.lapses||it.bad||0} marta unutildi</em></button>`).join('')}
          <button class="rv-link" id="xmLeech">Faqat shularni mashq qilish</button>
        </section>`:''}
        <section class="rv-sec">
          <h3>Lug'at <span>${total}</span></h3>
          <label class="rv-search">${XM_IC.search}<input id="xmQ" type="search" placeholder="Qidirish" value="${escapeHtml(xmQuery)}" autocomplete="off"></label>
          <div class="rv-chips" role="tablist">
            ${[['all','Hammasi'],['due','Bugun'],['new','Yangi'],['weak','Zaif'],['mature','Mustahkam']].map(([k,n])=>`<button data-f="${k}" class="${xmFilter===k?'on':''}">${n}</button>`).join('')}
          </div>
          <div id="xmList"></div>
        </section>
      </div>
    </div>`;
  srsRenderList();
  const sc=el.querySelector('.xm-scroll'); if(sc&&keep) sc.scrollTop=keep;
  el.querySelector('#xmBack').onclick=srsCloseHub;
  el.querySelector('#xmCfg').onclick=srsOpenCfg;
  el.querySelector('#xmAdd').onclick=srsOpenAdd;
  const a2=el.querySelector('#xmAdd2'); if(a2) a2.onclick=srsOpenAdd;
  const s=el.querySelector('#xmStart'); if(s) s.onclick=()=>srsStart();
  const x=el.querySelector('#xmExtra'); if(x) x.onclick=()=>srsStart('extra');
  const lc=el.querySelector('#xmLeech'); if(lc) lc.onclick=()=>srsStart('leech');
  el.querySelectorAll('.rv-lw').forEach(r=>r.onclick=()=>srsOpenWord(r.dataset.w));
  el.querySelectorAll('.rv-chips button').forEach(b=>b.onclick=()=>{ xmFilter=b.dataset.f;
    el.querySelectorAll('.rv-chips button').forEach(x=>x.classList.toggle('on',x===b)); srsRenderList(); });
  const q=el.querySelector('#xmQ'); if(q) q.oninput=()=>{ xmQuery=q.value; srsRenderList(); };
}
function srsRenderList(){
  const box=document.getElementById('xmList'); if(!box) return;
  const now=Date.now(), q=xmQuery.trim().toLowerCase();
  let arr=srsAll();
  if(xmFilter==='due') arr=arr.filter(it=>it.st>0&&it.due<=now);
  else if(xmFilter==='new') arr=arr.filter(it=>it.st===0);
  else if(xmFilter==='weak') arr=arr.filter(srsIsLeech);
  else if(xmFilter==='mature') arr=arr.filter(it=>srsBucket(it)==='mature');
  if(q) arr=arr.filter(it=>it.t.toLowerCase().includes(q)||String(it.tr).toLowerCase().includes(q));
  arr.sort((a,b)=>(a.st===0)-(b.st===0) || a.due-b.due);
  const shown=arr.slice(0,80);
  if(!shown.length){ box.innerHTML=`<p class="rv-empty">${q?'Bu so\'z lug\'atda yo\'q.':'Bu ro\'yxat hozircha bo\'sh.'}</p>`; return; }
  box.innerHTML=shown.map(it=>{
    const r=srsRetNow(it), p=Math.round(r*100);
    const when= it.st===0?'yangi': it.due<=now?'bugun':srsFmtIv(it.due-now)+'dan keyin';
    return `<button class="rv-row" data-w="${escapeHtml(it.t.toLowerCase())}">
      <span class="rv-rw"><b>${escapeHtml(it.t)}</b><span>${escapeHtml(it.tr)}</span></span>
      <span class="rv-rm">${it.st===0?'':srsDropSvg(r,22)}<em class="${it.st===0?'n':it.due<=now?'d':''}">${it.st===0?when:p+'%, '+when}</em></span>
    </button>`; }).join('') + (arr.length>80?`<p class="rv-empty">Yana ${arr.length-80} ta. Qidiruvdan foydalaning.</p>`:'');
  box.querySelectorAll('.rv-row').forEach(r=>r.onclick=()=>srsOpenWord(r.dataset.w));
}
function srsOpenWord(k){
  const it=(window.__wdSrs||{})[k]; if(!it) return;
  const r=Math.round(srsRetNow(it)*100);
  const lbl={new:'Yangi',learn:"O'rganilmoqda",young:'Takrorda',mature:'Mustahkam'}[srsBucket(it)];
  const layer=openSheet(`
    <div class="rw">
      <div class="rw-h">
        <div><div class="rw-term">${escapeHtml(it.t)}</div>${it.ipa?`<div class="rw-ipa">/${escapeHtml(it.ipa)}/</div>`:''}</div>
        <button class="rw-spk" id="xwSpk" aria-label="Tinglash">${XM_IC.spk}</button>
      </div>
      <div class="rw-tr">${escapeHtml(it.tr)}</div>
      ${it.ex?`<p class="rw-ex">${escapeHtml(it.ex)}</p>`:''}
      <div id="xwMn">${it.mn?`<div class="rw-mn"><b>Eslab qolish</b><p>${escapeHtml(it.mn)}</p></div>`:`<button class="rw-mnbtn" id="xwMnGo"><span>Eslab qolish usulini yaratish</span><em>1 so'rov</em></button>`}</div>
      <dl class="rw-dl">
        <div><dt>Holati</dt><dd>${lbl}</dd></div>
        <div><dt>Hozir esda</dt><dd>${it.st===0?'—':r+'%'}</dd></div>
        <div><dt>Esda turish muddati</dt><dd>${it.S?srsFmtIv(it.S*SRS_DAY):'—'}</dd></div>
        <div><dt>Qiyinligi</dt><dd>${it.D?it.D.toFixed(1)+' / 10':'—'}</dd></div>
        <div><dt>Takrorlangan</dt><dd>${it.reps||0} marta</dd></div>
        <div><dt>Unutilgan</dt><dd>${it.lapses||0} marta</dd></div>
        <div><dt>Keyingi takror</dt><dd>${it.st===0?'navbatda':srsFmtWhen(it.due)}</dd></div>
      </dl>
      <button class="rv-go" id="xwNow"><span>Hozir takrorlash</span></button>
      <div class="rw-act"><button id="xwReset">Boshidan o'rganish</button><button class="del" id="xwDel">Lug'atdan o'chirish</button></div>
    </div>`);
  layer.querySelector('#xwSpk').onclick=()=>{ try{ speak(it.t); }catch(e){} };
  const mnGo=layer.querySelector('#xwMnGo');
  if(mnGo) mnGo.onclick=async()=>{ mnGo.disabled=true; mnGo.querySelector('span').textContent='Drop o\u2018ylayapti…';
    const mn=window.__wdMakeMnemonic?await window.__wdMakeMnemonic(it):null;
    const box=layer.querySelector('#xwMn'); if(box) box.innerHTML=mn?`<div class="rw-mn"><b>Eslab qolish</b><p>${escapeHtml(mn)}</p></div>`:''; };
  layer.querySelector('#xwNow').onclick=()=>{ closeSheet(); srsStart('one',[it]); };
  layer.querySelector('#xwReset').onclick=()=>{ Object.assign(it,{st:0,S:0,D:0,step:0,lapses:0,due:Date.now(),last:0}); saveState(); closeSheet(); srsRenderHub(); showToast("So'z boshidan o'rganiladi",IC.info); };
  layer.querySelector('#xwDel').onclick=()=>{ delete window.__wdSrs[k]; saveState(); closeSheet(); srsRenderHub(); showToast("Lug'atdan o'chirildi",IC.check||IC.info); };
}

/* Sessiya — ko'rinish */
function srsStart(kind,list){
  kind=kind||'due';
  const q=srsBuildQueue(kind,list||[]);
  if(!q.length){ showToast(srsAll().length?"Hozircha takrorlash kerak emas":"Avval so'z qo'shing",IC.info); return; }
  SS={kind,q,idx:0,total:q.length,seen:new Set(),ok:0,bad:0,combo:0,best:0,xp:0,newN:0,t0:Date.now(),requeue:{},log:[],cardT:0};
  let el=document.getElementById('xmSes');
  if(!el){ el=document.createElement('div'); el.id='xmSes'; el.className='xs'; document.body.appendChild(el); }
  el.innerHTML=`
    <div class="xs-top">
      <button class="xs-x" id="xsX" aria-label="Yopish">${XM_IC.x}</button>
      <div class="xs-prog" role="progressbar" aria-label="Sessiya"><i id="xsBar"></i></div>
      <div class="xs-cnt" id="xsCnt"></div>
    </div>
    <div class="xs-stage" id="xsStage"></div>
    <div class="xs-foot" id="xsFoot"></div>`;
  requestAnimationFrame(()=>el.classList.add('on'));
  el.querySelector('#xsX').onclick=()=>srsQuit();
  document.addEventListener('keydown',srsKey);
  srsStep();
}
function srsUpdateHud(){
  const it=SS.q[SS.idx];
  const bar=document.getElementById('xsBar');
  if(bar) bar.style.width=Math.round(SS.seen.size/Math.max(1,SS.total)*100)+'%';
  const rest=SS.q.slice(SS.idx);
  const nN=rest.filter(x=>x.st===0).length, nL=rest.filter(x=>x.st===1||x.st===3).length, nR=rest.length-nN-nL;
  const cnt=document.getElementById('xsCnt');
  if(cnt) cnt.innerHTML=`<span class="k-new ${it&&it.st===0?'cur':''}" title="Yangi">${nN}</span><span class="k-learn ${it&&(it.st===1||it.st===3)?'cur':''}" title="O'rganilmoqda">${nL}</span><span class="k-rev ${it&&it.st===2?'cur':''}" title="Takror">${nR}</span>`;
}
function srsStep(){
  const stage=document.getElementById('xsStage'), foot=document.getElementById('xsFoot');
  if(!SS||!stage) return;
  if(SS.idx>=SS.q.length){ srsFinish(); return; }
  const it=SS.q[SS.idx]; SS.cardT=Date.now();
  const mode=srsPickMode(it); SS.mode=mode;
  srsUpdateHud();
  const tag = it.st===0 ? "Yangi so'z" : {mcq:"Tarjimasini tanlang",rmcq:"Inglizchasini tanlang",flip:"Ma'nosini eslang",type:"Inglizchasini yozing",listen:"Eshitganingizni yozing",cloze:"Gapdagi bo'sh joyga mos so'z"}[mode];
  const spkB=`<button class="xs-spk" id="xsSpk" aria-label="Tinglash">${XM_IC.spk}</button>`;
  let inner='';
  if(mode==='mcq'||mode==='rmcq'){
    const field=mode==='mcq'?'tr':'t', q=mode==='mcq'?it.t:it.tr;
    const opts=srsOptions(it,field);
    inner=`<div class="xs-q${mode==='rmcq'?' uz':''}">${escapeHtml(q)}${mode==='mcq'?spkB:''}</div>
      ${mode==='mcq'&&it.ipa?`<div class="xs-ipa">/${escapeHtml(it.ipa)}/</div>`:''}
      <div class="xs-opts">${opts.map((o,i)=>`<button data-opt="${i+1}" data-v="${escapeHtml(o)}"><kbd>${i+1}</kbd><span>${escapeHtml(o)}</span></button>`).join('')}</div>`;
  } else if(mode==='flip'){
    inner=`<div class="xs-flip" id="xsFlip">
      <div class="xs-q">${escapeHtml(it.t)}${spkB}</div>${it.ipa?`<div class="xs-ipa">/${escapeHtml(it.ipa)}/</div>`:''}
      <div class="xs-back" id="xsBack" hidden><div class="xs-a">${escapeHtml(it.tr)}</div>${it.ex?`<p class="xs-ex">${escapeHtml(it.ex)}</p>`:''}${it.mn?`<p class="xs-mn"><b>Eslab qolish:</b> ${escapeHtml(it.mn)}</p>`:''}</div></div>`;
  } else if(mode==='type'){
    inner=`<div class="xs-q uz">${escapeHtml(it.tr)}</div><p class="xs-hint">${it.t.length} harf, «${escapeHtml(it.t[0])}» bilan boshlanadi</p>
      <input class="xs-in" id="xsIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Inglizcha yozing" aria-label="Javob">`;
  } else if(mode==='listen'){
    inner=`<button class="xs-play" id="xsSpk">${XM_IC.spk}<span>Yana eshitish</span></button>
      <input class="xs-in" id="xsIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Eshitgan so'zingiz" aria-label="Javob">`;
  } else if(mode==='cloze'){
    const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const html=escapeHtml(it.ex).replace(new RegExp(esc(escapeHtml(it.t)),'i'),'<u>&nbsp;</u>');
    inner=`<p class="xs-cloze">${html}</p><p class="xs-hint">${escapeHtml(it.tr)}, ${it.t.length} harf</p>
      <input class="xs-in" id="xsIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="So'zni yozing" aria-label="Javob">`;
  }
  stage.innerHTML=`<div class="xs-card m-${mode}${it.st===0?' is-new':''}" id="xsCard"><p class="xs-tag">${tag}</p>${inner}</div>`;
  const spk=stage.querySelector('#xsSpk');
  if(spk) spk.onclick=e=>{ e.stopPropagation(); try{ speak(it.t); }catch(err){} };
  if(mode==='listen') setTimeout(()=>{ try{ speak(it.t); }catch(e){} },250);
  if(mode==='mcq'||mode==='rmcq'){
    foot.innerHTML=`<button class="xs-ghost" id="xsDk">Bilmayman</button>`;
    foot.querySelector('#xsDk').onclick=()=>{ stage.querySelectorAll('[data-opt]').forEach(x=>{ x.disabled=true; if(x.dataset.v===String(mode==='mcq'?it.tr:it.t)) x.classList.add('ok'); }); srsAuto(it,false,null); };
    stage.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{
      const right=mode==='mcq'?it.tr:it.t;
      const ok=b.dataset.v===String(right);
      stage.querySelectorAll('[data-opt]').forEach(x=>{ x.disabled=true; if(x.dataset.v===String(right)) x.classList.add('ok'); });
      if(!ok) b.classList.add('bad');
      srsAuto(it,ok,null);
    });
  } else if(mode==='flip'){
    foot.innerHTML=`<button class="xs-main" data-main="1" id="xsShow">Javobni ochish<kbd>Space</kbd></button>`;
    const show=()=>{
      const bk=document.getElementById('xsBack'); if(bk) bk.hidden=false;
      const card=document.getElementById('xsCard'); if(card) card.classList.add('open');
      if(window.__wdSrsCfg.autoSpeak){ try{ speak(it.t); }catch(e){} }
      const now=Date.now();
      const g=[1,2,3,4].map(x=>srsFmtIv(srsSchedule(it,x,now).due-now));
      foot.innerHTML=`<p class="xs-ask">Qanchalik oson esladingiz?</p><div class="xs-grades">
        <button data-g="1" class="g1"><b>Eslay olmadim</b><span>${g[0]}</span></button>
        <button data-g="2" class="g2"><b>Qiynaldim</b><span>${g[1]}</span></button>
        <button data-g="3" class="g3"><b>Esladim</b><span>${g[2]}</span></button>
        <button data-g="4" class="g4"><b>Juda oson</b><span>${g[3]}</span></button></div>`;
      foot.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>srsAnswer(it,Number(b.dataset.g)));
    };
    foot.querySelector('#xsShow').onclick=show;
    const fl=document.getElementById('xsFlip'); if(fl) fl.onclick=()=>{ const bk=document.getElementById('xsBack'); if(bk&&bk.hidden) show(); };
  } else {
    const inp=stage.querySelector('#xsIn');
    foot.innerHTML=`<div class="xs-row2"><button class="xs-ghost" id="xsDk">Bilmayman</button><button class="xs-main" data-main="1" id="xsChk">Tekshirish</button></div>`;
    setTimeout(()=>{ try{ inp.focus(); }catch(e){} },320);
    const check=()=>{
      const v=inp.value.trim(); if(!v){ inp.classList.add('shake'); setTimeout(()=>inp.classList.remove('shake'),400); return; }
      const res=srsCompare(v,it.t);
      inp.disabled=true; inp.classList.add(res==='bad'?'bad':res==='near'?'near':'ok');
      srsAuto(it,res!=='bad',res==='near'?'near':null);
    };
    foot.querySelector('#xsChk').onclick=check;
    foot.querySelector('#xsDk').onclick=()=>{ inp.disabled=true; srsAuto(it,false,null); };
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } });
  }
}
function srsAuto(it,ok,flag){
  const ms=Date.now()-SS.cardT;
  let g = !ok?1 : flag==='near'?2 : (SS.mode!=='mcq'&&SS.mode!=='rmcq'&&ms<4500&&it.st===2)?4 : 3;
  const foot=document.getElementById('xsFoot'), card=document.getElementById('xsCard');
  if(card) card.classList.add(ok?(flag==='near'?'r-near':'r-ok'):'r-bad');
  try{ SFX.play(ok?'correct':'wrong'); }catch(e){}
  if(ok&&window.__wdSrsCfg.autoSpeak&&SS.mode!=='listen'){ try{ speak(it.t); }catch(e){} }
  const pair=`<b>${escapeHtml(it.t)}</b> — ${escapeHtml(it.tr)}`;
  const head= ok ? (flag==='near'?'Bir harf xato':(g===4?'To\'g\'ri, juda tez':'To\'g\'ri')) : 'To\'g\'ri javob';
  foot.innerHTML=`<div class="xs-fb ${ok?(flag==='near'?'near':'ok'):'bad'}">
    <div class="xs-fb-t"><strong>${head}</strong><span>${pair}</span>${it.ex&&!ok?`<i>${escapeHtml(it.ex)}</i>`:''}${!ok?(it.mn?`<i class="xs-mn"><b>Eslab qolish:</b> ${escapeHtml(it.mn)}</i>`:((it.lapses||0)>=1||(it.bad||0)>=1?`<button class="xs-mnbtn" id="xsMnGo">Eslab qolish usulini ko\u2018rsat</button>`:'')):''}</div>
    <button class="xs-main" data-main="1" id="xsNext">Keyingisi<kbd>Enter</kbd></button></div>`;
  foot.querySelector('#xsNext').onclick=()=>srsAnswer(it,g);
  const mg=foot.querySelector('#xsMnGo');
  if(mg) mg.onclick=async()=>{ mg.disabled=true; mg.textContent='Drop o\u2018ylayapti…'; const mn=window.__wdMakeMnemonic?await window.__wdMakeMnemonic(it):null;
    if(mn){ const i=document.createElement('i'); i.className='xs-mn'; i.innerHTML='<b>Eslab qolish:</b> '+escapeHtml(mn); mg.replaceWith(i); } else mg.remove(); };
}
function srsComboFx(n){
  const el=document.getElementById('xmSes'); if(!el) return;
  const old=el.querySelector('.xs-cfx'); if(old) old.remove();
  const fx=document.createElement('div'); fx.className='xs-cfx'; fx.textContent=`${n} ta ketma-ket to'g'ri`;
  el.appendChild(fx); setTimeout(()=>fx.remove(),1600);
}
function srsFinish(early){
  const s=SS; if(!s) return;
  const n=s.seen.size, acc=n?s.ok/n:0, secs=Math.round((Date.now()-s.t0)/1000);
  srsLogToday().t+=secs; srsLogTrim();
  let coins=0;
  if(n>=5) coins+=5;
  if(n>=5 && acc>=.9){ coins+=10; try{ dailyProgress('srsperfect'); }catch(e){} }
  if(s.best>=10) s.xp+=10;
  if(s.xp){ try{ addXP(s.xp); }catch(e){} }
  if(coins){ try{ addCoins(coins,true); }catch(e){} }
  try{ saveState(); }catch(e){}
  const st=srsStats(), c=srsDueCounts();
  const tom=srsForecast(2)[1];
  const pct=Math.round(acc*100);
  const verdict= !n?"Sessiya to'xtatildi": acc>=.95?'Deyarli hammasini esladingiz': acc>=.8?'Yaxshi natija': acc>=.6?'Yomon emas':'Bu so\'zlar tez orada yana chiqadi';
  const el=document.getElementById('xmSes'); if(!el) return;
  document.getElementById('xsCnt').innerHTML=''; document.getElementById('xsBar').style.width='100%';
  const rew=[`+${s.xp} XP`]; if(coins) rew.push(`+${coins} tanga`);
  el.querySelector('#xsStage').innerHTML=`<div class="xf">
    <div class="xf-head">
      ${srsDropSvg(acc,120,{cls:'lg'})}
      <div><div class="xf-pct">${pct}<small>%</small></div><p>to'g'ri esladingiz</p></div>
    </div>
    <h2>${verdict}</h2>
    <dl class="xf-dl">
      <div><dt>Takrorlangan so'zlar</dt><dd>${n}${s.newN?` <small>(${s.newN} yangi)</small>`:''}</dd></div>
      <div><dt>Esladingiz / qiynaldingiz</dt><dd>${s.ok} / ${s.bad}</dd></div>
      <div><dt>Eng uzun to'g'ri seriya</dt><dd>${s.best}</dd></div>
      <div><dt>Vaqt</dt><dd>${secs<60?secs+' soniya':Math.round(secs/60)+' daqiqa'}</dd></div>
      <div><dt>Mukofot</dt><dd>${rew.join(', ')}</dd></div>
    </dl>
    <p class="xf-tom">${c.total?`Yana ${c.total} ta so'z kutmoqda.`:`Ertaga ${tom} ta so'z qaytadi.`}</p>
  </div>`;
  const foot=el.querySelector('#xsFoot');
  foot.innerHTML=`<div class="xs-row2">
    ${n>=3?`<button class="xs-ghost" id="xfShare">${XM_IC.share}<span>Story uchun</span></button>`:''}
    ${c.total?`<button class="xs-main" id="xfMore">Davom etish</button>`:`<button class="xs-main" data-main="1" id="xfDone">Tugatish</button>`}
  </div>`;
  if(acc>=.8&&n>=5){ try{ SFX.play('victory'); }catch(e){} }
  const d=foot.querySelector('#xfDone'); if(d) d.onclick=srsCloseSes;
  const m=foot.querySelector('#xfMore'); if(m) m.onclick=()=>{ srsCloseSes(); setTimeout(()=>srsStart(),350); };
  const sh=foot.querySelector('#xfShare');
  if(sh) sh.onclick=()=>{ try{ window.__wdStory.open('srs',{n,acc:pct,best:s.best,streak:st.streak,mature:st.b.mature,total:st.total}); }catch(e){} };
  SS.idx=SS.q.length;
}

/* ==================================================================
   STORY RASMLARI (v93.1) — natijani Instagram / Telegram story'ga
   ------------------------------------------------------------------
   1080×1920 PNG, Canvas'da chiziladi. Uslub: sodda plakat — katta raqam,
   chap tomonga tekislangan matn va WordDrop tomchisi, uning ichidagi suv
   sathi natijani ko'rsatadi (aniqlik, band, ball).
   Ranglar: Siyoh · Qog'oz · Elektr · Signal (brend palitrasi).
   Har rasmda shaxsiy taklif havolasi (?ref=KOD) va QR kod bor.
   ================================================================== */
(function(){
const SW=1080, SH=1920, M=96;
const THEMES={
  ink:     {n:'Siyoh',  bg:'#0F1B3D', fg:'#FFFFFF', mute:'rgba(255,255,255,.62)', rule:'rgba(255,255,255,.18)', acc:'#5B8CFF', water:'#2F6FED', drop:'rgba(255,255,255,.10)', tile:'#FFFFFF'},
  paper:   {n:"Qog'oz", bg:'#F3F6FC', fg:'#0F1B3D', mute:'#5B6478', rule:'#D5DCEA', acc:'#2F6FED', water:'#2F6FED', drop:'#E1E8F6', tile:'#FFFFFF'},
  electric:{n:'Elektr', bg:'#2F6FED', fg:'#FFFFFF', mute:'rgba(255,255,255,.72)', rule:'rgba(255,255,255,.28)', acc:'#FFFFFF', water:'#0F1B3D', drop:'rgba(255,255,255,.16)', tile:'#FFFFFF'},
  signal:  {n:'Signal', bg:'#E8374A', fg:'#FFFFFF', mute:'rgba(255,255,255,.75)', rule:'rgba(255,255,255,.3)', acc:'#FFFFFF', water:'#0F1B3D', drop:'rgba(255,255,255,.16)', tile:'#FFFFFF'}
};
const DEF_THEME={duel:'ink',srs:'paper',ielts:'signal',level:'electric',weekly:'ink',streak:'electric'};
let cur={kind:'',data:{},theme:'ink',blob:null,url:''};

function refCode(){
  try{ const id=(window.__sbUser&&window.__sbUser.id)||''; if(id) return id.replace(/-/g,'').slice(0,8).toUpperCase(); }catch(e){}
  try{ let g=localStorage.getItem('wd_ref_local'); if(!g){ g=Math.random().toString(36).slice(2,10).toUpperCase(); localStorage.setItem('wd_ref_local',g); } return g; }catch(e){ return 'WORDDROP'; }
}
function shareUrl(kind){ return 'https://www.worddrop-app.uz/?ref='+refCode()+(kind==='duel'?'&duel=1':''); }
function nm(){ return ((window.__wdName||'').trim()||'Men').slice(0,22); }
const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));

/* Har bir tur: sarlavha, katta raqam, izoh, faktlar, tomchi sathi */
function spec(kind,d){
  const MO=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  const _d=new Date(), date=_d.getDate()+'-'+MO[_d.getMonth()];
  switch(kind){
    case 'duel': return {date,
      title:"Duelda yutdim", hero:`${d.my}:${d.op}`, sub:`${d.opp||'Raqib'} bilan ${(d.mode||"so'z jangi").toLowerCase()}`,
      facts:[["Aniqlik",d.acc+'%'],["Ketma-ket to'g'ri",d.best||0],["O'rtacha javob",d.avg?d.avg+' s':'—']],
      level:clamp01((d.acc||0)/100), cap:`${d.acc}% to'g'ri`,
      cta:"Meni yengib ko'r", ctaSub:"Kodni skaner qiling, 1v1 o'ynaymiz"};
    case 'srs': return {date,
      title:"Bugungi takror", hero:String(d.n), unit:"so'z", sub:`${d.acc}% to'g'ri esladim`,
      facts:[["Kun ketma-ket",d.streak||0],["Ketma-ket to'g'ri",d.best||0],["Mustahkam so'zlar",d.mature||0]],
      level:clamp01((d.acc||0)/100), cap:`${d.acc}% esda`,
      cta:"Sen ham yodla", ctaSub:"So'zlar esdan chiqishidan oldin qaytadi"};
    case 'ielts': return {date,
      title:"IELTS mock natijam", hero:Number(d.overall||0).toFixed(1), sub:'Umumiy band, to\'liq mock imtihon',
      facts:[["Listening",Number(d.l||0).toFixed(1)],["Reading",Number(d.r||0).toFixed(1)],["Writing",Number(d.w||0).toFixed(1)],["Speaking",Number(d.s||0).toFixed(1)]],
      level:clamp01((d.overall||0)/9), cap:`9 dan ${Number(d.overall||0).toFixed(1)}`,
      cta:"Sen nechchi olasan?", ctaSub:"Mock imtihon bepul, AI baholaydi"};
    case 'level': return {date,
      title:"Yangi daraja", hero:String(d.lv||1), unit:'daraja', sub:d.title||'',
      facts:[["Jami XP",d.xp||0],["Kun ketma-ket",d.streak||0],["O'rganilgan so'zlar",d.words||0]],
      level:clamp01(((d.lv||1)%10||10)/10), cap:`${d.lv||1}-daraja`,
      cta:"Ingliz tilini men bilan o'rgan", ctaSub:"O'zbek tilida, bepul"};
    case 'weekly': return {date,
      title:"Hafta yopildi", hero:String(d.vo||0), unit:'ball', sub:`${d.total||5} ta haftalik maqsaddan ${d.done||0} tasi bajarildi`,
      facts:[["Kun ketma-ket",window.__wdDaily||0],["Jami XP",window.__wdXP||0],["Tangalar",window.__wdCoins||0]],
      level:clamp01((d.vo||0)/300), cap:`${d.vo||0} / 300 ball`,
      cta:"Keyingi haftaga qo'shil", ctaSub:"Har hafta yangi maqsadlar"};
    default: return {date,
      title:"To'xtamayman", hero:String(d.days||window.__wdDaily||0), unit:'kun', sub:'ketma-ket ingliz tili',
      facts:[["XP",window.__wdXP||0],["So'zlar",window.__wdTotalLearned||0],["Rekord",window.__wdBestStreak||0]],
      level:clamp01((d.days||window.__wdDaily||0)/30), cap:'30 kunlik maqsad',
      cta:"Sen ham boshla", ctaSub:"Kuniga 10 daqiqa yetadi"};
  }
}

function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function fit(c,txt,maxW,size,weight,family,min){ let s=size; do{ c.font=`${weight} ${s}px ${family}`; if(c.measureText(txt).width<=maxW) break; s-=6; }while(s>(min||28)); return s; }
const FH='"Bricolage Grotesque","Inter",system-ui,sans-serif', FB='"Inter",system-ui,sans-serif';
/* Tomchi yo'li — 64x70 koordinatada */
function dropPath(c,x,y,s){
  const k=s/70; c.beginPath();
  c.moveTo(x+32*k,y+4*k);
  c.bezierCurveTo(x+32*k,y+4*k,x+9*k,y+30*k,x+9*k,y+43*k);
  c.bezierCurveTo(x+9*k,y+56*k,x+19*k,y+66*k,x+32*k,y+66*k);
  c.bezierCurveTo(x+45*k,y+66*k,x+55*k,y+56*k,x+55*k,y+43*k);
  c.bezierCurveTo(x+55*k,y+30*k,x+32*k,y+4*k,x+32*k,y+4*k);
  c.closePath();
}
function drawLevelDrop(c,x,y,s,level,T){
  dropPath(c,x,y,s); c.fillStyle=T.drop; c.fill();
  c.save(); dropPath(c,x,y,s); c.clip();
  const k=s/70, top=y+(4+(1-level)*62)*k;
  c.fillStyle=T.water; c.beginPath(); c.moveTo(x,top);
  for(let i=0;i<=8;i++){ const px=x+i*(64*k/8); c.lineTo(px, top+Math.sin(i*0.9)*5*k*0.3); }
  c.lineTo(x+64*k,y+s); c.lineTo(x,y+s); c.closePath(); c.fill();
  c.restore();
}
function logo(c,x,y,T){
  dropPath(c,x,y,64); c.fillStyle=T.fg; c.fill();
  c.fillStyle=T.fg; c.font=`700 46px ${FH}`; c.textBaseline='alphabetic'; c.textAlign='left'; c.fillText('WordDrop',x+70,y+50);
}
function drawQR(c,text,x,y,size,T){
  try{
    if(typeof qrcode!=='function') return false;
    const q=qrcode(0,'H'); q.addData(text); q.make();
    const n=q.getModuleCount(), pad=Math.round(size*0.08), cell=(size-pad*2)/n;
    c.fillStyle=T.tile; rr(c,x,y,size,size,24); c.fill();
    c.fillStyle='#0F1B3D';
    for(let r=0;r<n;r++) for(let k=0;k<n;k++) if(q.isDark(r,k)) c.fillRect(Math.floor(x+pad+k*cell),Math.floor(y+pad+r*cell),Math.ceil(cell),Math.ceil(cell));
    const m=size*0.16; c.fillStyle=T.tile; rr(c,x+size/2-m/2-8,y+size/2-m/2-8,m+16,m+16,14); c.fill();
    dropPath(c,x+size/2-m/2,y+size/2-m/2,m); c.fillStyle='#2F6FED'; c.fill();
    return true;
  }catch(e){ return false; }
}

async function render(kind,data,theme){
  const T=THEMES[theme]||THEMES.ink, S=spec(kind,data);
  try{ await Promise.race([Promise.all([document.fonts.load(`700 200px "Bricolage Grotesque"`),document.fonts.load(`600 40px "Inter"`)]),new Promise(r=>setTimeout(r,1500))]); }catch(e){}
  const cv=document.createElement('canvas'); cv.width=SW; cv.height=SH;
  const c=cv.getContext('2d');
  c.fillStyle=T.bg; c.fillRect(0,0,SW,SH);
  c.textBaseline='alphabetic'; c.textAlign='left';
  // Bosh qator
  logo(c,M,118,T);
  c.font=`500 34px ${FB}`; c.fillStyle=T.mute; c.textAlign='right'; c.fillText(S.date,SW-M,166); c.textAlign='left';
  // Sarlavha
  c.fillStyle=T.fg; c.font=`600 56px ${FB}`; c.fillText(S.title,M,372);
  // Katta raqam
  const heroMax=SW-M*2;
  const hs=fit(c,S.hero,S.unit?heroMax-220:heroMax,430,700,FH,160);
  c.font=`700 ${hs}px ${FH}`; c.fillStyle=T.fg;
  c.fillText(S.hero,M-10,370+hs*0.92);
  const heroBase=370+hs*0.92;
  if(S.unit){ const hw=c.measureText(S.hero).width; c.font=`600 64px ${FB}`; c.fillStyle=T.acc; c.fillText(S.unit,M-10+hw+24,heroBase); }
  // Izoh
  let y=heroBase+96;
  c.font=`500 44px ${FB}`; c.fillStyle=T.mute;
  const ss=fit(c,S.sub,heroMax,44,500,FB,28); c.font=`500 ${ss}px ${FB}`; c.fillText(S.sub,M,y);
  // Faktlar (chap) + tomchi (o'ng) — izoh va pastki blok orasida markazda
  const rowH=112, ds=400, blockH=Math.max(S.facts.length*rowH, ds+60);
  const freeTop=y+40, freeBot=SH-470-40;
  y=Math.round(freeTop+Math.max(0,(freeBot-freeTop-blockH)/2));
  const colW=540;
  c.strokeStyle=T.rule; c.lineWidth=2;
  const fy=y+Math.max(0,(ds-S.facts.length*rowH)/2);
  S.facts.forEach((f,i)=>{
    const ry=fy+i*rowH;
    c.beginPath(); c.moveTo(M,ry); c.lineTo(M+colW,ry); c.stroke();
    c.font=`500 36px ${FB}`; c.fillStyle=T.mute; c.textAlign='left'; c.fillText(String(f[0]),M,ry+70);
    c.font=`700 54px ${FH}`; c.fillStyle=T.fg; c.textAlign='right'; c.fillText(String(f[1]),M+colW,ry+73);
  });
  c.beginPath(); c.moveTo(M,fy+S.facts.length*rowH); c.lineTo(M+colW,fy+S.facts.length*rowH); c.stroke();
  c.textAlign='left';
  const dx=SW-M-ds*64/70+30, dy=y;
  drawLevelDrop(c,dx,dy,ds,S.level,T);
  c.font=`600 34px ${FB}`; c.fillStyle=T.fg; c.textAlign='center'; c.fillText(S.cap,dx+ds*32/70,dy+ds+52); c.textAlign='left';
  // Pastki blok: taklif
  const by=SH-470;
  c.strokeStyle=T.rule; c.beginPath(); c.moveTo(M,by); c.lineTo(SW-M,by); c.stroke();
  const qs=270, qx=SW-M-qs, qy=by+56;
  if(!drawQR(c,shareUrl(kind),qx,qy,qs,T)){
    c.fillStyle=T.tile; rr(c,qx,qy,qs,qs,24); c.fill();
    dropPath(c,qx+qs/2-60,qy+70,130); c.fillStyle='#2F6FED'; c.fill();
  }
  const tw=qx-M-40;
  c.fillStyle=T.fg; let cs=72, l1='', l2='';
  for(;cs>=44;cs-=4){ c.font=`700 ${cs}px ${FH}`; l1=''; l2='';
    S.cta.split(' ').forEach(w=>{ if(!l2 && c.measureText((l1+' '+w).trim()).width<=tw) l1=(l1+' '+w).trim(); else l2=(l2+' '+w).trim(); });
    if(!l2 || c.measureText(l2).width<=tw) break; }
  c.fillText(l1,M,qy+56); if(l2) c.fillText(l2,M,qy+56+cs*1.05);
  const ty=qy+56+(l2?cs*1.05:0)+56;
  c.font=`500 34px ${FB}`; c.fillStyle=T.mute; const s2=fit(c,S.ctaSub,tw,34,500,FB,24); c.font=`500 ${s2}px ${FB}`; c.fillText(S.ctaSub,M,ty);
  c.font=`700 38px ${FB}`; c.fillStyle=T.acc; c.fillText('worddrop-app.uz',M,Math.max(ty+62,qy+qs-8));
  c.font=`500 28px ${FB}`; c.fillStyle=T.mute; c.textAlign='left'; c.fillText(`Taklif kodi ${refCode()}`,M,SH-64);
  c.textAlign='right'; c.fillText('@worddrop_uz',SW-M,SH-64); c.textAlign='left';
  return cv;
}

async function paint(){
  const img=document.getElementById('stImg'), sp=document.getElementById('stSpin');
  if(sp) sp.hidden=false; if(img) img.classList.remove('on');
  const cv=await render(cur.kind,cur.data,cur.theme);
  await new Promise(r=>cv.toBlob(b=>{ cur.blob=b; r(); },'image/png'));
  if(cur.url) URL.revokeObjectURL(cur.url);
  cur.url=URL.createObjectURL(cur.blob);
  if(img){ img.src=cur.url; img.onload=()=>img.classList.add('on'); }
  if(sp) sp.hidden=true;
}
function rewardShare(){
  try{
    const d=window.__wdDaily2; if(!d) return;
    if(!d.shared){ d.shared=true; if(window.__wdAddCoins) window.__wdAddCoins(15); }
    if(window.__wdDailyProgress) window.__wdDailyProgress('share');
  }catch(e){}
}
function capText(){ const S=spec(cur.kind,cur.data); return `${S.title}: ${S.hero}${S.unit?' '+S.unit:''}. WordDrop'da ingliz tilini o'rganyapman, sen ham qo'shil.`; }
async function doShare(){
  if(!cur.blob) return;
  const file=new File([cur.blob],'worddrop-story.png',{type:'image/png'});
  try{
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:'WordDrop',text:capText()+' '+shareUrl(cur.kind)});
      rewardShare(); showToast("Ulashildi",IC.check||IC.info); return;
    }
  }catch(e){ if(e&&e.name==='AbortError') return; }
  doDownload(true);
}
function doDownload(fromShare){
  if(!cur.url) return;
  const a=document.createElement('a'); a.href=cur.url; a.download='worddrop-'+cur.kind+'.png';
  document.body.appendChild(a); a.click(); a.remove();
  rewardShare();
  showToast(fromShare?"Rasm saqlandi. Uni story'ga joylang.":"Rasm saqlandi",IC.check||IC.info);
}
function doTelegram(){
  window.open('https://t.me/share/url?url='+encodeURIComponent(shareUrl(cur.kind))+'&text='+encodeURIComponent(capText()),'_blank','noopener');
  rewardShare();
}
function open(kind,data){
  cur={kind:kind||'streak',data:data||{},theme:DEF_THEME[kind]||'ink',blob:null,url:''};
  const old=document.getElementById('stLayer'); if(old) old.remove();
  const el=document.createElement('div'); el.className='st-layer'; el.id='stLayer';
  const first=!(window.__wdDaily2&&window.__wdDaily2.shared);
  el.innerHTML=`<div class="st-bg"></div>
    <div class="st-wrap" role="dialog" aria-label="Story uchun rasm">
      <div class="stc-top"><b>Story uchun rasm</b><button class="st-x" id="stX" aria-label="Yopish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="st-prev"><img id="stImg" alt="Story rasmi"><div class="st-spin" id="stSpin"></div></div>
      <div class="st-themes" role="radiogroup" aria-label="Rang">${Object.entries(THEMES).map(([k,t])=>`<button role="radio" aria-checked="${k===cur.theme}" data-th="${k}" class="${k===cur.theme?'on':''}"><i style="background:${t.bg}"></i>${t.n}</button>`).join('')}</div>
      <button class="st-main" id="stShare">Ulashish</button>
      <div class="st-row"><button class="st-sec" id="stTg">Telegram</button><button class="st-sec" id="stDl">Rasmni saqlash</button></div>
      ${first?`<p class="st-note">Bugun birinchi ulashganingiz uchun 15 tanga beriladi.</p>`:''}
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('on'));
  const close=()=>{ el.classList.remove('on'); setTimeout(()=>{ el.remove(); if(cur.url){ URL.revokeObjectURL(cur.url); cur.url=''; } },250); };
  el.querySelector('#stX').onclick=close; el.querySelector('.st-bg').onclick=close;
  el.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{ cur.theme=b.dataset.th;
    el.querySelectorAll('[data-th]').forEach(x=>{ x.classList.toggle('on',x===b); x.setAttribute('aria-checked',x===b); }); paint(); });
  el.querySelector('#stShare').onclick=doShare;
  el.querySelector('#stDl').onclick=()=>doDownload(false);
  el.querySelector('#stTg').onclick=doTelegram;
  paint();
}
function offer(kind,data,label){
  const old=document.getElementById('stOffer'); if(old) old.remove();
  const el=document.createElement('div'); el.id='stOffer'; el.className='st-offer';
  el.innerHTML=`<button class="st-of-main">${label||"Natijani story'ga joylash"}</button><button class="st-of-x" aria-label="Yopish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg></button>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('on'));
  const kill=()=>{ el.classList.remove('on'); setTimeout(()=>el.remove(),250); };
  el.querySelector('.st-of-main').onclick=()=>{ kill(); open(kind,data); };
  el.querySelector('.st-of-x').onclick=kill;
  setTimeout(kill,10000);
}
window.__wdStory={open,offer,render};
window.__wdStoryOffer=offer;
})();

/* Talaffuz studiyasi */
function pronHomeCard(){
  const micIc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8 21h8"/></svg>';
  return `<button class="hubt" id="pronHomeCard">
    <div class="hubt-ic pron">${micIc}</div>
    <b>Talaffuz</b><span>AI tekshiruv</span>
  </button>`;
}
/* Tinglash darslari (map'dagi listen-node bilan bir xil, ammo bosh sahifadan darrov ochsa bo'ladi) */
function listenHomeCard(){
  const lessonCount = (window.__wdLessons||[]).length;
  const sub = lessonCount>0 ? `${lessonCount} dars` : 'Tez orada';
  const soundIc = IC.sound || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  return `<button class="hubt ${lessonCount?'':'lk'}" id="listenHomeCard">
    <div class="hubt-ic ${lessonCount?'':''}" style="${lessonCount?'background:#38BDF8':''}">${soundIc}</div>
    <b>Tinglash</b><span>${sub}</span>
  </button>`;
}
function renderHome(){
  const sec=screens.home;
  // Qayta chizishdan oldin scroll holatini eslab qolamiz (sahifa sakramasin)
  let __keepScroll=0;
  try{ const __b=sec&&sec.querySelector('.sscroll'); if(__b) __keepScroll=__b.scrollTop; }catch(e){}
  try{ if(sec) sec.classList.remove('anim-in'); }catch(e){}
  setTimeout(()=>{ try{ const __n=sec&&sec.querySelector('.sscroll');
    if(__n && __keepScroll) __n.scrollTop=__keepScroll; }catch(e){} },0);
  const done=completedLevels.size;
  const pct=Math.round((done/TOTAL_LEVELS)*100);
  const W=340,topPad=50,botPad=70,spY=96,amp=90;
  const pts=LEVELS.map((_,i)=>({x:W/2+amp*Math.sin(i*.62)+amp*.35*Math.sin(i*.21+1.3),y:topPad+i*spY}));
  // Yo'l oxiri — keyingi mavsum uchun "tez kunda" nuqtasi (121-o'rin)
  const iSoon=TOTAL_LEVELS;
  const soonPt={x:W/2+amp*Math.sin(iSoon*.62)+amp*.35*Math.sin(iSoon*.21+1.3), y:topPad+iSoon*spY};
  const svgH=topPad+iSoon*spY+botPad+18;
  function sp(ps){
    if(ps.length<2)return '';
    let d=`M ${ps[0].x} ${ps[0].y}`;
    for(let i=0;i<ps.length-1;i++){
      const p0=ps[i-1]||ps[i],p1=ps[i],p2=ps[i+1],p3=ps[i+2]||p2;
      const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6;
      const c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
      d+=` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }
  let nodes='';
  pts.forEach((p,i)=>{
    const lv=LEVELS[i];
    const ul=isUnlocked(lv.id),dn=completedLevels.has(lv.id);
    const cls=dn?'done':(ul?'unlocked':'locked');
    const big=lv.id===1?' big':'';
    nodes+=`<div class="lvl-node ${cls}${big}" style="left:${p.x}px;top:${p.y}px" data-level="${lv.id}">${dn?IC.check:(ul?lv.id:IC.lock)}${dn?`<div class="bstar">${IC.star}</div>`:''}</div>`;
  });
  // Tinglash nuqtalari — har 10 bosqichda bittadan (1-bosqichdan keyin ham bitta kirish darsi).
  // Dars hali qo'shilmagan bo'lsa — nuqta xira ko'rinadi va "tez orada" deydi (ilova buzilmaydi).
  const listenSpots=[0];
  for(let L=9; L<TOTAL_LEVELS-1; L+=10) listenSpots.push(L);
  const lessonCount=(window.__wdLessons||[]).length;
  listenSpots.forEach((li,k)=>{
    if(li+1<pts.length){
      const a=pts[li], b=pts[li+1];
      const lx=(a.x+b.x)/2, ly=(a.y+b.y)/2;
      const ready = k<lessonCount;                 // dars mavjudmi
      const need = li+1;                            // shu bosqich tugagach ochiladi
      const open = completedLevels.has(need) || (typeof promoActive==='function' && promoActive()); // qulf ochilganmi (promokodda hammasi ochiq)
      const cls = !ready ? ' soon' : (open ? '' : ' lockd');
      const icon = (ready && !open)
        ? `<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11 V8 a4 4 0 0 1 8 0 v3"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M5 13 V11 A7 7 0 0 1 19 11 V13"/><rect x="3.5" y="13" width="4" height="7" rx="1.6"/><rect x="16.5" y="13" width="4" height="7" rx="1.6"/></svg>`;
      nodes+=`<div class="listen-node${cls}" style="left:${lx}px;top:${ly}px" data-listen="${k}" data-need="${need}">${icon}</div>`;
    }
  });
  // "Tez kunda" tuguni — keyingi mavsum, yangi rejimlar
  const allDone=done>=TOTAL_LEVELS;
  nodes+=`<div class="soon-node${allDone?' ready':''}" style="left:${soonPt.x}px;top:${soonPt.y}px" id="soonNode">
      <svg viewBox="0 0 24 24"><path d="M12 3 L13.9 9.1 L20 11 L13.9 12.9 L12 19 L10.1 12.9 L4 11 L10.1 9.1 Z"/><circle cx="18.5" cy="5.5" r="1.6"/><circle cx="6" cy="17.5" r="1.2"/></svg>
      <i class="soon-lbl">Tez kunda</i>
    </div>`;
  sec.innerHTML=`
    <div class="shd"><div><h1>Boshi</h1><p>Bugungi 10 daqiqa — bir umrga qadam</p></div></div>
    <div class="sscroll">
      ${dailyCardHtml()}
      ${srsHomeHero()}
      ${boostActive()?`<div class="boost-banner">${PREM_ITEMS.find(x=>x.id==='boost').ic}<div><b>XP Booster faol</b><span>2x XP · ${boostLeftTxt()} qoldi</span></div></div>`:''}
      ${detHomeBanner()}
      ${typeof jmHomeCard==='function'?jmHomeCard():''}
      <div class="hub-lbl">Barcha rejimlar</div>
      <div class="hub3">${duelHomeCard()}${srsHomeCard()}${pronHomeCard()}${shopHomeCard()}</div>
      <button class="ielts-banner ml-banner" id="mlBanner">
        <div class="ib-mark">CEFR</div>
        <div class="ib-txt">
          <div class="ib-kicker">Multilevel</div>
          <div class="ib-title">Multilevel sinov imtihoni</div>
          <div class="ib-sub">4 bo'lim · rasmiy format va vaqt · B1–C1</div>
        </div>
        ${(()=>{ let b=null; try{ b=localStorage.getItem('wd_ml_best'); }catch(e){} return b?`<div class="ib-band"><b>${b}</b><span>Daraja</span></div>`:''; })()}
      </button>
      <button class="ielts-banner" id="audioDialogBanner" style="background:#11163e;border-color:#4d6cff;color:#fff">
        <div class="ib-mark" aria-hidden="true" style="background:#243deb;color:#fff">AD</div>
        <div class="ib-txt">
          <div class="ib-title" style="color:#fff">Audio Dialog</div>
          <div class="ib-sub" style="color:#ffc0e3">Podkast va dialoglar · Listening mashqlari</div>
        </div>
      </button>
      <button class="ielts-banner lit-banner" id="litBanner">
        <div class="ib-mark lit-mark" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="ib-txt">
          <div class="ib-kicker">Yangi · Adabiyot</div>
          <div class="ib-title">Kitob javoni</div>
          <div class="ib-sub">Jahon klassikasi ingliz tilida · tarjima va lug'at bilan</div>
        </div>
      </button>
      <button class="ielts-banner" id="ieltsBanner">
        <div class="ib-mark">IELTS</div>
        <div class="ib-txt">
          <div class="ib-kicker">Exam simulator</div>
          <div class="ib-title">Mock Test markazi</div>
          <div class="ib-sub">Listening · Reading · Writing · Speaking</div>
        </div>
        ${(()=>{const h=window.__wdIelts||[];if(!h.length)return '';const best=Math.max(...h.map(r=>r.overall||0));return `<div class="ib-band"><b>${best.toFixed(1)}</b><span>Eng ko'p</span></div>`;})()}
      </button>
      <div class="map-header-card card" style="--pct:${pct}%">
        <div class="map-ring"><b>${pct}%</b></div>
        <div class="map-txt"><h3>${done}/${TOTAL_LEVELS} bosqich</h3><p>Har bir quti — yangi so'zlar to'plami</p></div>
      </div>
      <div style="position:relative;width:${W}px;height:${svgH}px;margin:0 auto">
        <svg style="position:absolute;top:0;left:0;width:100%;height:${svgH}px" viewBox="0 0 ${W} ${svgH}">
          <path d="${sp(pts)}" fill="none" stroke="#DCE6F7" stroke-width="10" stroke-linecap="round"/>
          <path d="${sp([pts[pts.length-1],soonPt])}" fill="none" stroke="#DCE6F7" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 26" stroke-opacity=".9"/>
        </svg>
        <div style="position:relative;width:${W}px;height:${svgH}px;margin:0 auto">${nodes}</div>
      </div>
    </div>`;
  sec.querySelectorAll('.lvl-node').forEach(n=>{
    n.addEventListener('click',()=>onLevelTap(Number(n.dataset.level)));
  });
  // Yangi hub tugmalar
  const pronCard=sec.querySelector('#pronHomeCard');
  if(pronCard) pronCard.addEventListener('click',()=>{
    try{
      if(typeof window.__wdOpenStudio==='function'){
        // Foydalanuvchi lug'ati bo'lsa — o'sha bilan, aks holda 1-tayyor to'plam
        let src=[], title="Talaffuz studiyasi";
        try{
          const my=(typeof myWordsAll==='function' ? myWordsAll() : []).filter(w=>w.tr);
          if(my.length){
            src=my.map(w=>({term:w.term,tr:w.tr,ipa:w.ipa,ex:w.ex,def:''}));
            title="Mening so'zlarim";
          } else if(typeof WORD_CATS!=='undefined' && WORD_CATS[0] && WORD_CATS[0].words){
            src=WORD_CATS[0].words; title=WORD_CATS[0].title;
          }
        }catch(e){}
        if(src.length){ window.__wdOpenStudio(src,title); return; }
      }
      if(typeof openPronounceSheet==='function') openPronounceSheet();
      else if(typeof window.__wdOpenPronounce==='function') window.__wdOpenPronounce();
      else showToast("Talaffuz studiyasi tez orada",IC.info); }catch(e){}
  });
  const listenCard=sec.querySelector('#listenHomeCard');
  if(listenCard) listenCard.addEventListener('click',()=>{
    if(listenCard.classList.contains('lk')){ showToast("Tinglash darslari tez orada",IC.sound); return; }
    if(window.__wdOpenListening) window.__wdOpenListening(0);
  });
  const soonEl=sec.querySelector('#soonNode');
  if(soonEl) soonEl.addEventListener('click',()=>{ try{ if(typeof openSoonSheet==='function') openSoonSheet(); }catch(e){} });
  sec.querySelectorAll('.listen-node').forEach(n=>{
    n.addEventListener('click',()=>{
      if(n.classList.contains('soon')){ showToast("Bu tinglash darsi tez orada qo'shiladi",IC.sound); return; }
      if(n.classList.contains('lockd')){
        showToast(`${n.dataset.need}-bosqichni tugatsangiz ochiladi`,IC.sound); return;
      }
      if(window.__wdOpenListening) window.__wdOpenListening(Number(n.dataset.listen));
    });
  });
  srsBindHome(sec);
  const duB=sec.querySelector('#duelHomeCard');
  if(duB) duB.addEventListener('click',duelOpenSheet);
  const dtB=sec.querySelector('#detBanner'); if(dtB) dtB.addEventListener('click',detOpen);
  const shB=sec.querySelector('#shopHomeCard');
  if(shB) shB.addEventListener('click',shopOpenSheet);
  const mlb=sec.querySelector('#mlBanner'); if(mlb) mlb.addEventListener('click',()=>window.__wdOpenML&&window.__wdOpenML());
  const audioDialog=sec.querySelector('#audioDialogBanner');
  if(audioDialog) audioDialog.addEventListener('click',()=>window.__wdOpenAudioDialog?.());
  const litb=sec.querySelector('#litBanner'); if(litb) litb.addEventListener('click',()=>window.__wdOpenLit&&window.__wdOpenLit());
  const ibtn=sec.querySelector('#ieltsBanner');
  if(ibtn) ibtn.addEventListener('click',()=>{
    const layer=openSheet(`
      <div class="sh-intro-icon" style="background:linear-gradient(150deg,#141B28,#2A1218);border:1px solid #E8374A"><span style="color:#E8374A;font-weight:900;font-size:13px;letter-spacing:.5px">IELTS</span></div>
      <h2>IELTS Mock Test markazi</h2>
      <p class="desc">Haqiqiy imtihon markaziga kirasiz: 4 ta stansiya — <b>Listening</b> (audio + savollar), <b>Reading</b> (matn + savollar), <b>Writing</b> (Task 2 esse, AI 4 mezon bo'yicha baholaydi) va <b>Speaking</b> (AI examiner bilan mikrofon orqali suhbat). Har bir modul o'z taymeri bilan o'tadi, oxirida rasmiy qoidaga ko'ra umumiy <b>Band Score</b> hisoblanadi va sertifikatingiz natijalar devoriga osiladi.</p>
      <button class="btn btn-primary btn-block" id="startExam" style="background:linear-gradient(135deg,#E8374A,#C61E31);box-shadow:0 12px 30px rgba(232,55,74,.35)">
        <svg viewBox="0 0 24 24" width="18" height="18" class="ic" style="stroke:#fff"><path d="M6 4 L19 12 L6 20 Z"/></svg>
        Imtihon zaliga kirish
      </button>`);
    layer.querySelector('#startExam').addEventListener('click',()=>{
      closeSheet();
      if(window.__wdOpenExam) window.__wdOpenExam(); else showToast("Yuklanmoqda, bir oz kuting",IC.info);
    });
  });
  bindDailyCard();
  if(typeof jmHomeRefresh==='function') jmHomeRefresh();
}
/* Barcha oldingi bosqichlardagi so'zlar — AI takrorlamasligi uchun */
function knownTerms(){
  const t=[...(window.__wdBaseTerms||[])];
  const g=window.__wdGenLevels||{};
  Object.keys(g).forEach(k=>{ (g[k].words||[]).forEach(w=>t.push(w.term)); });
  return t;
}
function onLevelTap(id){
  if(!isUnlocked(id)){showToast("Avval oldingi bosqichni yakunlang",IC.lock);return}
  const cached=(id>1) ? (window.__wdGenLevels||{})[id] : null;
  const sub = id===1 ? '' : (cached ? `Mavzu: <b>${escapeHtml(cached.theme||'aralash')}</b>. ` : `AI ushbu bosqich uchun yangi 10 ta so'zni maxsus tuzib beradi. `);
  const layer=openSheet(`
    <div class="sh-intro-icon">${IC.book}</div>
    <h2>${id}-bosqich · ${escapeHtml(levelTitle(id))}</h2>
    <p class="desc">${sub}Osmondan tushayotgan qutini oching — ichidan chiqqan har bir so'z bilan grammatik to'g'ri gap tuzasiz, AI tekshiradi.</p>
    <button class="btn btn-primary btn-block" id="startLvl">
      <svg viewBox="0 0 24 24" width="18" height="18" class="ic" style="stroke:#fff"><path d="M6 4 L19 12 L6 20 Z"/></svg>
      Boshlash
    </button>`);
  layer.querySelector('#startLvl').addEventListener('click',async ()=>{
    if(id===1){
      if(window.__wdLevel1Backup) window.__wdSetWords(window.__wdLevel1Backup);
      closeSheet(); window.__wdStartGame(id); return;
    }
    let lvl=(window.__wdGenLevels||{})[id];
    if(!lvl){
      const btn=layer.querySelector('#startLvl');
      btn.disabled=true;
      btn.innerHTML='<span class="ai-spin"></span> AI darsni tayyorlamoqda...';
      lvl=await levelWordsAI(id, knownTerms());
      if(!lvl){
        btn.disabled=false;
        btn.innerHTML='Qayta urinish';
        showToast("AI darsni tuza olmadi — internet va serverni tekshirib, qayta urining",IC.info);
        return;
      }
      window.__wdGenLevels[id]=lvl;
      saveState();
    }
    window.__wdSetWords(lvl.words);
    closeSheet();
    window.__wdStartGame(id);
  });
}
// Ilova ochilganda: kunlik streak hisoblanadi, dark mode qo'llanadi
checkDailyStreak();
if(window.__wdDark) document.body.classList.add('dark');
renderHome();
