
/* ========== 5. PROFIL ========== */
/* ========== LIGA / REYTING TIZIMI ==========
   Ligalar foydalanuvchi DARAJASIGA qarab aniqlanadi. Yangi kirgan
   foydalanuvchi faqat o'z ligasidagilar bilan raqobatlashadi. Daraja
   oshgani sayin liga (va uning emblemasi) o'zgarib boradi.
   Ma'lumot REAL: hozircha faqat "Siz". Boshqa o'quvchilar Supabase
   ulangach shu ro'yxatga qo'shiladi (TODO: wdLeaderboardData). */
const LEAGUES=[
  {name:'Bronza', min:1,  c1:'#D9A273', c2:'#B77B49', c3:'#8A5526', mk:'#6B3D14'},
  {name:'Kumush', min:5,  c1:'#DCE3ED', c2:'#B9C4D3', c3:'#8A97A9', mk:'#5C6B80'},
  {name:'Oltin', min:10,  c1:'#FFD84D', c2:'#F5B301', c3:'#C98A00', mk:'#B36B00'},
  {name:'Zumrad', min:16,  c1:'#5FE0AE', c2:'#17BE86', c3:'#0E8F63', mk:'#06603F'},
  {name:'Sapfir', min:23, c1:'#7FB0FF', c2:'#3D7BF0', c3:'#2457BC', mk:'#173C87'},
  {name:'Yoqut', min:31, c1:'#FF8A90', c2:'#F04A55', c3:'#C22B36', mk:'#8E1620'},
  {name:'Ametist', min:40, c1:'#C89BFF', c2:'#9B5CF0', c3:'#7333C9', mk:'#4C1D95'},
  {name:'Olmos', min:50, c1:'#8FE8FB', c2:'#3FC5E8', c3:'#1E9AC0', mk:'#0B6B8C'}
];

function leagueFor(level){ let i=0; for(let k=0;k<LEAGUES.length;k++){ if(level>=LEAGUES[k].min) i=k; } return {...LEAGUES[i], index:i}; }
/* Har liga ichida 3 bo'linma: III -> II -> I. Eng yuqori ligada esa yulduzlar
   cheksiz o'sadi (Olmos ★1, ★2, ...) — shunda maqsad hech qachon tugamaydi. */
function leagueRank(level){
  const lg=leagueFor(level), next=LEAGUES[lg.index+1];
  if(!next){
    const star=1+Math.floor((level-lg.min)/5);
    const inStar=(level-lg.min)%5;
    return {...lg, star, div:0, label:`${lg.name} ★${star}`,
            pct:Math.round(inStar/5*100), needLv:lg.min+star*5, top:true};
  }
  const span=next.min-lg.min, done=Math.max(0,level-lg.min);
  const per=span/3;
  const dIdx=Math.min(2,Math.floor(done/per));          // 0,1,2
  const roman=['III','II','I'][dIdx];
  const inDiv=done-dIdx*per;
  return {...lg, star:0, div:dIdx+1, label:`${lg.name} ${roman}`,
          pct:Math.round(Math.min(1,inDiv/per)*100),
          needLv:Math.ceil(lg.min+(dIdx+1)*per), top:false, nextName:next.name};
}

function leagueEmblem(idx,size=72){
  const L=LEAGUES[idx]||LEAGUES[0];
  const id='lg'+idx+'_'+Math.round(size);

  /* Qalqon: tepasi yumaloq burchakli, pastki qismi markazga uchli.
     Duolingo uslubi — kontur yo'q, hajm faqat jilo va soya bilan beriladi. */
  const shield=(x,y,w,h,r)=>{
    const l=x-w/2, rr=x+w/2, t=y-h/2, b=y+h/2;
    const curve=h*0.34;             // pastki yoy chuqurligi
    return `M${l} ${t+r} Q${l} ${t} ${l+r} ${t} H${rr-r} Q${rr} ${t} ${rr} ${t+r} V${b-curve} Q${rr} ${b-curve*0.16} ${x} ${b} Q${l} ${b-curve*0.16} ${l} ${b-curve} Z`;
  };

  // yumshoq kvadrat uchqun (Duolingo'dagi kabi)
  const spark=(x,y,s,o)=>`<rect x="${x-s/2}" y="${y-s/2}" width="${s}" height="${s}" rx="${s*0.32}" fill="${L.c1}" opacity="${o}"/>`;

  /* Har liga uchun alohida belgi — faqat rang emas, ma'no ham farqlansin.
     Belgilar WordDrop ruhida: tomchi asos, daraja oshgani sari boyiydi. */
  const M=`url(#${id}m)`;

  /* Asl WordDrop tomchisi — o'lchangan nisbatlar (kenglik/balandlik 0.583,
     eng keng joy pastdan 0.72, pastki radius 0.287H). */
  function drop(cx,cy,H){
    const r=(0.287*H), Ty=(cy+0.110*H), Tx=(0.2635*H);
    return `M${cx} ${cy-0.5*H} L${(cx+Tx).toFixed(2)} ${Ty.toFixed(2)} A${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${(cx-Tx).toFixed(2)} ${Ty.toFixed(2)} Z`;
  }
  /* Tomchi ichidagi oq jilo — pastki-o'ngda yoy (asl belgidagidek) */
  function gloss(cx,cy,H){
    const r=0.287*H, Cy=cy+0.224*H, R=r*0.60;
    const a0=16*Math.PI/180, a1=76*Math.PI/180;
    return `<path d="M${(cx+R*Math.cos(a0)).toFixed(2)} ${(Cy+R*Math.sin(a0)).toFixed(2)} A${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${(cx+R*Math.cos(a1)).toFixed(2)} ${(Cy+R*Math.sin(a1)).toFixed(2)}" stroke="#fff" stroke-opacity=".55" stroke-width="${(H*0.055).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
  }
  const DR=(cx,cy,H)=>`<path d="${drop(cx,cy,H)}" fill="${M}"/>${gloss(cx,cy,H)}`;

  /* Tomchi — hamma ligada asosiy belgi. Daraja oshgani sari atrofi boyiydi. */
  function mark(){
    if(idx===0) return DR(50,50,44);
    if(idx===1) return DR(50,45,40)
      + `<ellipse cx="50" cy="76" rx="17" ry="3.4" fill="${M}" opacity=".55"/>`;
    if(idx===2) return DR(50,43,38)
      + `<path d="M30 72 Q40 65 50 72 Q60 79 70 72" stroke="${M}" stroke-width="4.8" fill="none" stroke-linecap="round"/>`;
    if(idx===3) return DR(50,46,40)
      + `<path d="${drop(26,34,17)}" fill="${M}" opacity=".85"/>`
      + `<path d="${drop(74,34,17)}" fill="${M}" opacity=".85"/>`;
    if(idx===4) return DR(50,42,36)
      + `<path d="M27 68 Q38.5 61 50 68 Q61.5 75 73 68" stroke="${M}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`
      + `<path d="M31 79 Q40.5 73 50 79 Q59.5 85 69 79" stroke="${M}" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".72"/>`;
    if(idx===5) return DR(50,40,34)
      + `<path d="M50 58 L54.4 67.6 L65 69 L57.1 76.1 L59.2 86.5 L50 81.3 L40.8 86.5 L42.9 76.1 L35 69 L45.6 67.6 Z" fill="${M}" opacity=".95"/>`;
    if(idx===6) return DR(50,48,42)
      + `<path d="M22 42 L27 32 L32 42 L27 53 Z" fill="${M}" opacity=".82"/>`
      + `<path d="M78 42 L73 32 L68 42 L73 53 Z" fill="${M}" opacity=".82"/>`;
    return `<path d="M30 33 L38 42 L50 25 L62 42 L70 33 L67 51 H33 Z" fill="${M}"/>`
      + `<circle cx="50" cy="26" r="3" fill="${M}"/>`
      + DR(50,70,34);
  }

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none">
  <defs>
    <linearGradient id="${id}o" x1=".15" y1="0" x2=".85" y2="1">
      <stop offset="0" stop-color="${L.c1}"/><stop offset="1" stop-color="${L.c2}"/></linearGradient>
    <linearGradient id="${id}i" x1=".15" y1="0" x2=".85" y2="1">
      <stop offset="0" stop-color="${L.c2}"/><stop offset="1" stop-color="${L.c3}"/></linearGradient>
    <linearGradient id="${id}m" x1=".2" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="${L.mk}"/><stop offset="1" stop-color="${L.c3}"/></linearGradient>
    <clipPath id="${id}c"><path d="${shield(50,52,74,80,17)}"/></clipPath>
  </defs>

  <!-- tashqi qalqon -->
  <path d="${shield(50,52,74,80,17)}" fill="url(#${id}o)"/>
  <!-- ichki qalqon (biroz to'qroq) -->
  <path d="${shield(50,52,60,66,13)}" fill="url(#${id}i)" opacity=".55"/>
  <!-- belgi -->
  <g clip-path="url(#${id}c)">${mark()}</g>
  <!-- diagonal jilo: butun hajm tuyg'usi shundan -->
  <g clip-path="url(#${id}c)">
    <path d="M-10 78 L58 -14 L88 -14 L20 78 Z" fill="#fff" opacity=".17"/>
    <path d="M64 -14 L96 -14 L28 78 L-4 78 Z" fill="#fff" opacity=".07"/>
  </g>
</svg>`;
}
function lbColor(name){ let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0;
  return ['#2F6FED','#7C5CFC','#12A594','#E0752D','#D6409F','#0EA5E9','#EF5DA8','#F2555A'][h%8]; }
/* ---- Bulut (Supabase) reyting keshi ---- */
let __boardCache=null;              // serverdan kelgan barcha profillar
function wdLeaderboardData(){
  const meXP=Math.round(window.__wdXP||0);
  const meName=(window.__wdName&&window.__wdName.trim())||'Siz';
  const meId=(window.__sbUser&&window.__sbUser.id)||'me';
  if(__boardCache && __boardCache.length){
    let found=false;
    const rows=__boardCache.map(r=>{
      if(r.me || r.id===meId){ found=true; return {...r, me:true, name:meName, xp:meXP, avatar:window.__wdAvatar||''}; }
      return {...r, me:false};
    });
    if(!found) rows.push({id:meId, name:meName, xp:meXP, me:true, avatar:window.__wdAvatar||''});
    return rows;
  }
  // Offline yoki hali ulanmagan — faqat "Siz"
  return [{id:meId, name:meName, xp:meXP, me:true, avatar:window.__wdAvatar||''}];
}
// Foydalanuvchining o'z qatorini bazaga yozish (debounce bilan)
let __syncTimer=null;
window.__wdSyncProfile=function(immediate){
  if(!window.__sb || !window.__sbUser) return;
  const doIt=async ()=>{
    try{
      const { error } = await window.__sb.from('profiles').upsert({
        id:window.__sbUser.id,
        name:(window.__wdName||'').slice(0,20),
        xp:Math.round(window.__wdXP||0),
        avatar:(window.__wdAvatar||''),
        title_id:(window.__wdTitleId||null),   // taqilgan titul — reytingda ko'rinadi
        updated_at:new Date().toISOString()
      });
      if(error){ window.__sbError='Yozish xatosi: '+error.message; }
      else if(window.__sbError && window.__sbError.indexOf('Yozish')===0){ window.__sbError=''; }
      if(window.__wdRefreshStatus) window.__wdRefreshStatus();
    }catch(e){ window.__sbError='Yozish xatosi: '+((e&&e.message)||e); if(window.__wdRefreshStatus) window.__wdRefreshStatus(); }
  };
  clearTimeout(__syncTimer);
  if(immediate) doIt(); else __syncTimer=setTimeout(doIt, 2000);
};
// Ligadagilar ro'yxatini bazadan olish va ekranni yangilash
let __boardBusy=false;
window.__wdRefreshBoard=async function(){
  if(!window.__sb || __boardBusy) return;
  __boardBusy=true;
  try{
    const { data, error } = await window.__sb
      .rpc('wd_leaderboard', { lim: 500 });   // faqat ro'yxatli (email) — mehmonlar reytingga kirmaydi
    if(error){ window.__sbError='O\'qish xatosi: '+error.message; if(window.__wdRefreshStatus) window.__wdRefreshStatus(); }
    else if(Array.isArray(data)){
      const meId=window.__sbUser&&window.__sbUser.id;
      // Takror "arvoh" profillarni ISM bo'yicha birlashtiramiz: eng yuqori XP li
      // qatorni qoldiramiz. Agar guruhda mening ID'im bor bo'lsa — "me" belgilanadi.
      // (Sinov paytida yaratilgan dublikatlar reytingda ikki marta ko'rinmasin.)
      const grp={};
      data.forEach(r=>{
        const nm=((r.name&&r.name.trim())||'Anonim');
        const key='n:'+nm.toLowerCase();
        const isMe=r.id===meId;
        const cur={id:r.id,name:nm,xp:r.xp||0,avatar:r.avatar||'',titleId:r.title_id||'',me:isMe};
        if(!grp[key]){ grp[key]=cur; }
        else {
          const ex=grp[key];
          const keep = (cur.xp>ex.xp) ? cur : ex;
          keep.me = ex.me || isMe;                 // guruhda men bo'lsam — belgilanadi
          if(keep.me && !keep._realMe && isMe){ keep.id=r.id; keep.avatar=r.avatar||keep.avatar; keep._realMe=true; }
          grp[key]=keep;
        }
      });
      const out=Object.values(grp).sort((a,b)=>b.xp-a.xp);
      __boardCache=out;
      if(window.__sbError && window.__sbError.indexOf('O\'qish')===0) window.__sbError='';
      if(screens.leaderboard && screens.leaderboard.classList.contains('active')) renderLeaderboardScreen();
    }
  }catch(e){ window.__sbError='O\'qish xatosi: '+((e&&e.message)||e); if(window.__wdRefreshStatus) window.__wdRefreshStatus(); }
  finally{ __boardBusy=false; }
};
// Bulut holati: faqat XATO bo'lganda ko'rinadi (normal holatda yashirin)
window.__wdRefreshStatus=function(){
  const el=document.getElementById('lbStatus'); if(!el) return;
  if(window.__sbError){ el.style.display='block'; el.className='lb-status err'; el.textContent='⚠ '+window.__sbError; }
  else { el.style.display='none'; el.textContent=''; }
};
// saveState har chaqirilganda profilni ham bulutga yozamiz (debounce ichkarida)
(function(){
  if(typeof saveState==='function' && !saveState.__wrapped){
    const _orig=saveState;
    saveState=function(){ _orig(); if(window.__wdSyncProfile) window.__wdSyncProfile(false); };
    saveState.__wrapped=true;
  }
})();
function userAvatar(size){
  const nm=(window.__wdName||'').trim();
  if(window.__wdAvatar){ const u=safeUrl(window.__wdAvatar); if(u) return `<img class="pf-img" src="${u}" style="width:${size}px;height:${size}px">`; }
  if(nm) return `<div class="pf-fallback" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.4)}px">${escapeHtml(nm[0].toUpperCase())}</div>`;
  return `<div class="pf-fallback empty" style="width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" style="width:${Math.round(size*0.5)}px;height:${Math.round(size*0.5)}px"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20 C5.5 15.8 8.4 14 12 14 C15.6 14 18.5 15.8 19.5 20"/></svg></div>`;
}
function rowAvatar(p,size){
  if(p.me) return userAvatar(size);
  if(p.avatar){ const u=safeUrl(p.avatar); if(u) return `<img class="pf-img" src="${u}" style="width:${size}px;height:${size}px">`; }
  const init=((p.name||'?').trim()[0]||'?').toUpperCase();
  return `<div class="pf-fallback" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.4)}px;background:${lbColor(p.name||'?')}">${escapeHtml(init)}</div>`;
}
function refreshUserViews(){
  if(screens.profile && screens.profile.classList.contains('active')) renderProfile();
  if(screens.leaderboard && screens.leaderboard.classList.contains('active')) renderLeaderboardScreen();
}
function openCEFRSheet(){
  const cur = window.__wdCEFR || '';
  const rows = Object.entries(CEFR_INFO).map(([code,info])=>`
    <button class="cefr-row ${cur===code?'sel':''}" data-cefr="${code}">
      <div class="cefr-code">${code}</div>
      <div class="cefr-txt"><b>${info.t}</b><span>${escapeHtml(info.d)}</span></div>
      <svg class="cefr-tick" viewBox="0 0 24 24"><path d="M5 12l5 5 9-11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`).join('');
  openSheet(`
    <div class="rules-icon" style="background:var(--b0)"><svg viewBox="0 0 24 24" class="ic" style="stroke:var(--b6)"><path d="M4 19V6l8-3 8 3v13" fill="none" stroke-width="2"/><path d="M8 12h8M8 16h5" stroke-width="2"/></svg></div>
    <h2>Ingliz tili darajam</h2>
    <p class="desc">Aniq bilmasangiz — taxminan tanlang. Keyin sozlaymiz.</p>
    <div class="cefr-list">${rows}</div>
    <button class="btn-primary" id="cefrTest" style="width:100%;margin-top:14px">${window.__wdPlaced?'Daraja testini qayta topshirish':'Daraja testini topshirish (5 daqiqa)'}</button>
  `);
  const ct=document.getElementById('cefrTest'); if(ct) ct.onclick=()=>{ closeSheet(); window.__wdOpenPT&&window.__wdOpenPT(); };
  document.querySelectorAll('.cefr-row').forEach(b=>{
    b.addEventListener('click',()=>{
      window.__wdCEFR = b.dataset.cefr;
      try{ saveState(); }catch(e){}
      closeSheet();
      try{ renderProfile(); }catch(e){}
      if(typeof showToast==='function') showToast('Daraja yangilandi: '+window.__wdCEFR, IC.check);
    });
  });
}
/* v101: Do'st taklif qilish — t.me/WordDropUzBot?start=r_<uid>. Bonusni bot beradi (do'st hisobini ulaganda). */
window.__wdOpenInvite=(...x)=>openInviteSheet(...x);   // v104: Pro oynasidan chaqiriladi
async function openInviteSheet(){
  const u=window.__sbUser;
  if(!u || !u.id){ showToast("Avval hisobga kiring",IC.info); return; }
  const link='https://t.me/WordDropUzBot?start=r_'+String(u.id).replace(/-/g,'');
  let n=0; try{ const {count}=await window.__sb.from('wd_referrals').select('id',{count:'exact',head:true}).eq('referrer',u.id); n=count||0; }catch(e){}
  const share='https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent("WordDrop'da ingliz tilini birga o'rganamiz! Shu havola orqali qo'shil 💧");
  const STEP=3, step=n%STEP, got=Math.min(10,Math.floor(n/STEP));   // v104: har 3 do'st = 7 kun Pro
  openSheet(`
    <h2>Do'st taklif qilish</h2>
    <p class="desc">Har <b>3 ta do'stingiz</b> havola orqali botga kirib, WordDrop'ni ochsa — sizga <b>7 kun Pro</b> qo'shiladi. Mukofot 10 martagacha beriladi.</p>
    <div class="inv-steps"><div><b>1</b><span>Havolani yuboring</span></div><div><b>2</b><span>Do'stingiz botda «Start» ni bosadi va ilovani ochadi</span></div><div><b>3</b><span>3 ta do'st qo'shilganda sizga 7 kun Pro yoziladi</span></div></div>
    <div class="inv-link"><code id="invLink">${escapeHtml(link)}</code></div>
    <div class="inv-row"><button class="btn-primary" id="invShare">Telegram orqali yuborish</button><button class="btn-sec" id="invCopy">Nusxa olish</button></div>
    <div class="inv-meter"><div class="inv-meter-t"><span>Keyingi 7 kun Pro'gacha</span><b>${step} / ${STEP}</b></div><div class="inv-bar"><i style="width:${Math.round(step/STEP*100)}%"></i></div><div class="inv-meter-t" style="margin-top:8px"><span>Jami do'stlar: ${n}</span><span>Olingan mukofot: ${got}</span></div></div>
  `);
  document.getElementById('invShare').onclick=()=>{ try{ if(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.openTelegramLink) Telegram.WebApp.openTelegramLink(share); else window.open(share,'_blank','noopener'); }catch(e){ window.open(share,'_blank','noopener'); } };
  document.getElementById('invCopy').onclick=async()=>{ try{ await navigator.clipboard.writeText(link); showToast('Havola nusxalandi',IC.check); }catch(e){ showToast("Nusxalab bo'lmadi — havolani bosib turing",IC.info); } };
}
function openDailyGoalSheet(){
  const opts = [5, 10, 20, 30];
  const cur = Number(window.__wdDailyMin || 0);
  const rows = opts.map(v=>`
    <button class="dgoal-row ${cur===v?'sel':''}" data-min="${v}">
      <b>${v}${v===30?'+':''}</b><span>daqiqa/kun</span>
      ${v===10?'<em class="dgoal-tag">tavsiya</em>':''}
    </button>`).join('');
  openSheet(`
    <div class="rules-icon" style="background:var(--b0)"><svg viewBox="0 0 24 24" class="ic" style="stroke:var(--b6)"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
    <h2>Kunlik maqsad</h2>
    <p class="desc">Kamroq — lekin har kuni. Keyinroq oshirasiz.</p>
    <div class="dgoal-list">${rows}</div>
  `);
  document.querySelectorAll('.dgoal-row').forEach(b=>{
    b.addEventListener('click',()=>{
      window.__wdDailyMin = Number(b.dataset.min);
      try{ saveState(); }catch(e){}
      closeSheet();
      try{ renderProfile(); }catch(e){}
      if(typeof showToast==='function') showToast('Kunlik maqsad: '+window.__wdDailyMin+' daq', IC.check);
    });
  });
}
function openNameSheet(){
  openSheet(`
    <div class="rules-icon" style="background:var(--b0)"><svg viewBox="0 0 24 24" class="ic" style="stroke:var(--b6)"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20 C5.5 15.8 8.4 14 12 14 C15.6 14 18.5 15.8 19.5 20"/></svg></div>
    <h2>Ismingiz</h2>
    <p class="desc">Reytingda boshqalar sizni shu ism orqali taniydi.</p>
    <input id="nameInput" class="wd-input" maxlength="20" placeholder="Masalan: Sardor" value="${escapeHtml(window.__wdName||'')}"/>
    <button class="btn btn-primary btn-block" id="nameSave" style="margin-top:16px">Saqlash</button>
  `);
  const inp=document.getElementById('nameInput'); if(inp) setTimeout(()=>inp.focus(),120);
  const save=()=>{ const v=(inp.value||'').trim().slice(0,20); window.__wdName=v; saveState(); closeSheet(); refreshUserViews(); };
  const sv=document.getElementById('nameSave'); if(sv) sv.addEventListener('click',save);
  if(inp) inp.addEventListener('keydown',e=>{ if(e.key==='Enter') save(); });
}
function triggerAvatarPick(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.addEventListener('change',()=>{ const f=inp.files&&inp.files[0]; if(f) processAvatarFile(f); });
  inp.click();
}
function processAvatarFile(file){
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const S=256, cv=document.createElement('canvas'); cv.width=S; cv.height=S;
      const ctx=cv.getContext('2d');
      const scale=Math.max(S/img.width, S/img.height);
      const w=img.width*scale, h=img.height*scale;
      ctx.drawImage(img,(S-w)/2,(S-h)/2,w,h);
      let data=''; try{ data=cv.toDataURL('image/jpeg',0.82); }catch(e){ data=''; }
      if(data){ window.__wdAvatar=data; saveState(); refreshUserViews(); if(typeof showToast==='function') showToast('Rasm yangilandi',IC.check); }
    };
    img.onerror=()=>{ if(typeof showToast==='function') showToast('Rasmni ochib bo\'lmadi',IC.cross); };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
/* ===== PREMIUM MEDAL SVG — Toza aylana, soyasiz, aniq chegaralarda ===== */
function wdMedalSVG(tier){
  // tier: 'g' | 's' | 'b'
  const C = {
    g: {c1:'#FFF3B8', c2:'#F6CB52', c3:'#C89000', c4:'#7A5500', num:'1', numC:'#5C4400'},
    s: {c1:'#FCFEFF', c2:'#E5EBF3', c3:'#98A3B6', c4:'#5C6879', num:'2', numC:'#3E4756'},
    b: {c1:'#FADBB8', c2:'#D9A273', c3:'#8B5628', c4:'#5C3818', num:'3', numC:'#3F2210'}
  }[tier] || {c1:'#eee',c2:'#ccc',c3:'#999',c4:'#666',num:'?',numC:'#333'};
  const id = 'md' + tier + Math.random().toString(36).slice(2,8);
  // viewBox 40x40, radius 19 — chetdan 1px marginli, hech qachon chiqmaydi
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <defs>
      <radialGradient id="${id}-face" cx="35%" cy="32%" r="65%">
        <stop offset="0%" stop-color="${C.c1}"/>
        <stop offset="60%" stop-color="${C.c2}"/>
        <stop offset="100%" stop-color="${C.c4}"/>
      </radialGradient>
    </defs>
    <!-- Face (yaxlit doira, viewBox chegarasidan 1px ichida) -->
    <circle cx="20" cy="20" r="19" fill="url(#${id}-face)"/>
    <!-- Nozik ichki halqa (accent) -->
    <circle cx="20" cy="20" r="15" fill="none" stroke="${C.c1}" stroke-width=".6" opacity=".55"/>
    <!-- Markazdagi raqam -->
    <text x="20" y="20.5" text-anchor="middle" dominant-baseline="central"
      font-family="Bricolage Grotesque, sans-serif" font-weight="900" font-size="18"
      fill="${C.numC}" letter-spacing="-.5">${C.num}</text>
  </svg>`;
}

/* Crown SVG for top-1 podium */
function wdCrownSVG(){
  return `<svg viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="crn-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFE380"/>
        <stop offset="55%" stop-color="#F6CB52"/>
        <stop offset="100%" stop-color="#D99A00"/>
      </linearGradient>
    </defs>
    <path d="M 3 20 L 5 8 L 11 14 L 16 4 L 21 14 L 27 8 L 29 20 Z" fill="url(#crn-g)" stroke="#8B5F00" stroke-width=".7" stroke-linejoin="round"/>
    <rect x="3" y="19" width="26" height="3" rx="1" fill="#D99A00" stroke="#8B5F00" stroke-width=".5"/>
    <circle cx="16" cy="9" r="1.4" fill="#FF6B6B" stroke="#8B0000" stroke-width=".3"/>
    <circle cx="6" cy="12" r="1" fill="#4C87FF" stroke="#1B4FCB" stroke-width=".3"/>
    <circle cx="26" cy="12" r="1" fill="#4C87FF" stroke="#1B4FCB" stroke-width=".3"/>
  </svg>`;
}

/* Podium avatar — silliq va sifatli.
   Foydalanuvchi rasmi bo'lsa — ishlatamiz. Aks holda ism bosh harflari + gradient. */
function podAvatar(p, sz){
  // Agar avatar URL bo'lsa (rasm)
  const url = p && (p.avatar_url || p.avatarUrl || p.photo || p.avatar);
  if(url){
    return `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:50%"/>`;
  }
  // Aks holda — initsiallar bilan chiroyli gradient
  const nm = String((p && p.name) || 'W');
  const clean = nm.replace(/[^\p{L}\p{N}\s]/gu,'').trim();
  const parts = clean.split(/\s+/).filter(Boolean).slice(0,2);
  let ini = parts.map(w=>w[0]||'').join('').toUpperCase();
  if(!ini) ini = nm[0] ? nm[0].toUpperCase() : 'W';
  // Ism bo'yicha deterministik gradient — bir xil user'ga bir xil rang
  let h = 0;
  for(let i=0;i<nm.length;i++) h = (h*31 + nm.charCodeAt(i)) & 0xFFFFFF;
  const palettes = [
    ['#4C87FF','#1B4FCB'], // ko'k
    ['#8B5CF6','#5B2FCB'], // binafsha
    ['#22D3EE','#0891B2'], // cyan
    ['#F97316','#C2410C'], // to'q sariq
    ['#EC4899','#BE185D'], // pushti
    ['#10B981','#047857'], // yashil
    ['#F59E0B','#B45309'], // amber
    ['#6366F1','#3730A3']  // indigo
  ];
  const pal = palettes[Math.abs(h) % palettes.length];
  return `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(160deg,${pal[0]},${pal[1]});color:#fff;font-weight:800;font-family:'Bricolage Grotesque',sans-serif;letter-spacing:-.5px;line-height:1">${ini}</span>`;
}

/* Jamoa Arena: bosh sahifa kartasi. Ma'lumot community.html bilan bir xil RPC'dan (jm_home), 5 daqiqa keshlanadi */
const JM_HOME_KEY='wd_jm_home_v1';
let __jmHomeBusy=false;
function jmHomeData(){
  try{ const u=window.__sbUser; const x=JSON.parse(sessionStorage.getItem(JM_HOME_KEY)||'null');
    return (x && u && x.uid===u.id) ? x : null; }catch(e){ return null; }
}
function jmTabloSvg(l, r){
  const W=132,H=92; let b='', n=0;
  const dot=(x,y)=>{ b+=`<circle class="bl${n++%2?' o':''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="#FFE9A0"/>`; };
  for(let i=0;i<=12;i++){ dot(4+124*i/12,4); dot(4+124*i/12,88); }
  for(let j=1;j<8;j++){ dot(4,4+84*j/8); dot(128,4+84*j/8); }
  const txt = (l===null)
    ? `<text x="66" y="55" text-anchor="middle" font-family="'Bricolage Grotesque',Inter,sans-serif" font-weight="800" font-size="22" fill="#fff" stroke="#0E0730" stroke-width="5" paint-order="stroke" letter-spacing="1">VS</text>`
    : `<text x="38" y="60" text-anchor="middle" font-family="'Bricolage Grotesque',Inter,sans-serif" font-weight="800" font-size="${String(l).length>2?24:32}" fill="#CDF564">${l}</text>
       <text x="96" y="60" text-anchor="middle" font-family="'Bricolage Grotesque',Inter,sans-serif" font-weight="800" font-size="${String(r).length>2?24:32}" fill="#18102B">${r}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><defs><clipPath id="jmhClip"><rect x="9" y="9" width="114" height="74" rx="9"/></clipPath></defs>
    <rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#0E0730"/>
    <g clip-path="url(#jmhClip)"><path d="M0 0H74L58 92H0Z" fill="#4100F5"/><path d="M74 0H132V92H58Z" fill="#FF4632"/>
      <circle cx="18" cy="84" r="30" fill="#6A3BFF" opacity=".4"/><circle cx="122" cy="8" r="26" fill="#FF8A6B" opacity=".4"/>
      <path d="M74 0L58 92" stroke="#0E0730" stroke-width="3"/></g>${b}${txt}</svg>`;
}
function jmHomeCard(){
  const signed = typeof window.__wdIsSignedIn==='function' && window.__wdIsSignedIn();
  const c=jmHomeData(), d=c&&c.d, t=d&&d.team, du=d&&d.duel;
  const f=v=>String(Math.round((+v||0)*10)/10).replace('.',',');
  const NEXT={relay_start:'Estafetani boshlash',relay_run:'Bosqichni yugurish',quiz:'Kvizga kirish',fort:"Qal'aga hujum",tug:'Arqon tortish'};
  let href='community.html#/jamoalar', title='Jamoa Arena', sub, chip, go='Jamoa topish', l=null, r=null, aria;
  if(!signed){
    href='community.html';
    sub="Har hafta yangi raqib jamoa: 4 ta o'yin, reyting va ligalar.";
    chip="Ro'yxatdan o'tganlar uchun"; go='Batafsil';
  } else if(t && du){
    const me=+du.me, op=+du.op, days=Math.max(0,Math.ceil((new Date(du.ends_at)-Date.now())/864e5));
    href='community.html#/arena'; title='Hafta dueli';
    sub=`<b>${escapeHtml(t.name)}</b> va ${escapeHtml(du.opp)} · ${days?days+' kun qoldi':'bugun tugaydi'}`;
    chip= me>op?'Siz oldindasiz':op>me?'Raqib oldinda':'Hisob teng';
    go=NEXT[du.next]||'Arenaga kirish'; l=f(me); r=f(op);
    aria=`Hafta dueli: ${t.name} ${l}, ${du.opp} ${r}. ${go}`;
  } else if(t){
    href='community.html#/arena'; title='Arena';
    sub=`<b>${escapeHtml(t.name)}</b> uchun raqib dushanba kuni aniqlanadi.`; chip='Hafta dueli'; go='Arenaga kirish';
  } else {
    sub="Har hafta yangi raqib jamoa: 4 ta o'yin, reyting va ligalar.";
    chip = d && d.open ? `${d.open} ta jamoada joy bor` : "Do'stlar yoki sinf bilan";
  }
  return `<a class="jm-home" id="jmHome" href="${href}" aria-label="${escapeHtml(aria||title+'. '+go)}">
      <div class="jmh-in">
        <span class="jmh-k">Jamoa rejimi</span>
        <div class="jmh-t">${title}</div>
        <div class="jmh-s">${sub}</div>
        <div class="jmh-f"><span class="jmh-c">${escapeHtml(chip)}</span><span class="jmh-go">${escapeHtml(go)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span></div>
      </div>
      <div class="jmh-tb">${jmTabloSvg(l, r)}</div>
    </a>`;
}
function jmHomeRefresh(){
  const sb=window.__sb, u=window.__sbUser;
  if(__jmHomeBusy || !sb || !u || !(typeof window.__wdIsSignedIn==='function' && window.__wdIsSignedIn())) return;
  const c=jmHomeData(); if(c && Date.now()-c.t < 5*60e3) return;
  __jmHomeBusy=true;
  let gid=null; try{ gid=JSON.parse(localStorage.getItem('wd_jm_cur')||'null'); }catch(e){}
  if(!(typeof gid==='string' && /^[0-9a-f-]{36}$/i.test(gid))) gid=null;
  Promise.resolve(sb.rpc('jm_home',{p_gid:gid})).then(({data,error})=>{
    __jmHomeBusy=false; if(error||!data||!data.auth) return;
    try{ sessionStorage.setItem(JM_HOME_KEY, JSON.stringify({uid:u.id,t:Date.now(),d:data})); }catch(e){}
    const el=document.getElementById('jmHome'); if(el) el.outerHTML=jmHomeCard();
  }).catch(()=>{ __jmHomeBusy=false; });
}

/* Jamoa rejimiga ko'prik: alohida sahifa (community.html), app.html ichiga yuklanmaydi */
function wdJamoaBridgeHtml(){
  return `<a class="jm-bridge" href="community.html" aria-label="Jamoa Arena: hafta dueli, jamoa reytingi va ligalar">
      <span class="jm-bridge-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.5 14.2c2.3.2 4.2 1.6 5 4.8"/></svg></span>
      <span class="jm-bridge-tx"><b>Jamoa Arena</b><span>Hafta dueli, jamoa reytingi va ligalar</span></span>
      <span class="jm-bridge-new">Yangi</span>
      <svg class="jm-bridge-ch" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
    </a>`;
}

/* Leaderboard state (search + pagination) */
window.__wdLbState = window.__wdLbState || { query:'', filter:'league', page:1, perPage:50 };

function renderLeaderboardScreen(){
  const sec=screens.leaderboard; if(!sec) return;
  const esc=x=>{try{return escapeHtml(x)}catch(e){return String(x)}};
  const fmtXP=n=>Math.round(n).toLocaleString('en-US').replace(/,/g,' ');
  const myLevel=levelInfo(window.__wdXP||0).level;
  const R=leagueRank(myLevel);
  const lg={...LEAGUES[R.index], index:R.index};

  const st = window.__wdLbState;
  const allData = wdLeaderboardData().slice().sort((a,b)=>b.xp-a.xp);
  const leagueOnly = allData.filter(p=>leagueFor(levelInfo(p.xp).level).index===lg.index);

  // Filter tanlash asosida ma'lumot
  let baseData;
  if(st.filter === 'global') baseData = allData;
  else baseData = leagueOnly;

  // Rank ni to'liq ro'yxatga qarab yozib olamiz (search'dan oldin)
  const dataWithRank = baseData.map((p,i)=>({...p,rank:i+1}));

  // Qidiruv
  const q = (st.query||'').trim().toLowerCase();
  const data = q ? dataWithRank.filter(p=>String(p.name||'').toLowerCase().includes(q)) : dataWithRank;

  const me=dataWithRank.find(p=>p.me)||{rank:1};
  const alone=data.length<2;

  /* Hero: emblema + bo'linma + keyingi pog'onagacha aylana progress */
  const C=2*Math.PI*46, off=C*(1-R.pct/100);
  // Keyingi pog'ona nomi: bo'linma ichida III->II->I, oxirgisidan keyin yangi liga
  const nextLabel = R.top
    ? `Olmos ★${R.star+1}`
    : (R.div<3 ? `${lg.name} ${['III','II','I'][R.div]}` : `${R.nextName} III`);

  const hero=`
    <div class="lgx-hero">
      <div class="lgx-glow"></div>
      <div class="lgx-ring">
        <svg viewBox="0 0 110 110" width="130" height="130">
          <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="7"/>
          <circle cx="55" cy="55" r="46" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 55 55)"/>
        </svg>
        <div class="lgx-em">${leagueEmblem(lg.index,86)}</div>
      </div>
      <div class="lgx-name">${esc(R.label)}</div>
      <div class="lgx-sub">Daraja ${myLevel} · reytingda #${me.rank}</div>
      <div class="lgx-next"><i style="width:${R.pct}%"></i></div>
      <div class="lgx-nexttxt">${R.pct}% &middot; keyingisi: <b>${esc(nextLabel)}</b></div>
    </div>`;

  /* Podium — top 3 (agar 3+ user bo'lsa va qidiruv aktiv emas) */
  const showPodium = !q && data.length >= 3;
  const top3 = data.slice(0,3);
  const buildPod = (p, pos) => {
    if(!p) return `<div class="lbx-pod p${pos}" style="visibility:hidden"></div>`;
    const isMe = p.me;
    const tier = pos===1?'g':pos===2?'s':'b';
    const sz = pos===1?76:62;
    return `<div class="lbx-pod p${pos} ${isMe?'me':''}">
      <div class="p-avwrap">
        ${pos===1 ? `<div class="p-crown">${wdCrownSVG()}</div>` : ''}
        <div class="p-av">${podAvatar(p, sz)}</div>
        <div class="p-medal">${wdMedalSVG(tier)}</div>
      </div>
      <div class="p-name">${isMe?'Siz':esc(p.name)}</div>
      <div class="p-xp">${IC.bolt}${fmtXP(p.xp)}</div>
    </div>`;
  };
  const podium = showPodium ? `
    <div class="lbx-podium">
      ${buildPod(top3[1], 2)}
      ${buildPod(top3[0], 1)}
      ${buildPod(top3[2], 3)}
    </div>` : '';

  /* Ro'yxat qatorlari (podium'dan tashqari, agar podium ko'rsatilgan bo'lsa 4-o'rindan boshlab) */
  const listStart = showPodium ? 3 : 0;
  const listData = data.slice(listStart);
  const shown = Math.min(listData.length, st.page * st.perPage);
  const visible = listData.slice(0, shown);
  const hasMore = shown < listData.length;

  const rows = visible.map(p=>{
    const isSiz=p.me&&p.name==='Siz';
    const nc=(p.me&&window.__wdNameColor)?(' nc-'+window.__wdNameColor):'';
    let ttl='';
    if(p.me && typeof titleChipHtml==='function') ttl=titleChipHtml();
    else if(p.titleId && typeof ACHIEVEMENTS!=='undefined' && ACHIEVEMENTS[p.titleId]){
      ttl=titleChip(p.titleId,esc);
    }
    // top-1/2/3 chizig'i faqat search rejimida
    const topCls = q && p.rank<=3 ? ('top'+p.rank) : '';
    return `<div class="lbx-row ${p.me?'me':''} ${topCls}">
      <span class="lbx-rk">${p.rank}</span>
      <span class="lb-av2">${rowAvatar(p,38)}</span>
      <div class="lbx-nm"><b class="${nc}">${isSiz?'Siz':esc(p.name)}</b>${ttl}<span>Daraja ${levelInfo(p.xp).level}</span></div>
      <div class="lbx-xp">${IC.bolt}${fmtXP(p.xp)}</div>
    </div>`;
  }).join('');

  /* Ligalar yo'li */
  const ladder=LEAGUES.map((L,i)=>{
    const cls=i<lg.index?'passed':(i===lg.index?'cur':'locked');
    return `<div class="lgx-step ${cls}">
      <div class="lgx-step-em">${leagueEmblem(i,48)}</div>
      <div class="lgx-step-nm">${L.name}</div>
      <div class="lgx-step-lv">${L.min}-daraja</div>
    </div>`;
  }).join('');

  /* Search + Filter controls */
  const controls = `
    <div class="lbx-controls">
      <div class="lbx-search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="lbSearch" type="text" placeholder="Ismni izlash..." value="${esc(st.query||'')}"/>
      </div>
      <div class="lbx-filter">
        <button data-f="league" class="${st.filter==='league'?'on':''}">Mening ligam</button>
        <button data-f="global" class="${st.filter==='global'?'on':''}">Global</button>
      </div>
    </div>`;

  /* Empty state */
  const emptyHtml = data.length === 0
    ? `<div class="lbx-empty">
        ${q ? `<b>"${esc(q)}"</b> bo'yicha hech kim topilmadi.` : `Bu ligada hozircha yolg'iz turibsiz. Ko'proq o'quvchi qo'shilganda reyting jonlanadi.`}
      </div>`
    : '';

  /* Sticky "Siz" bar — foydalanuvchi ro'yxatning ko'rinmas qismida bo'lsa */
  const meInVisible = visible.some(p=>p.me) || (data.length>=3 && top3.some(p=>p.me));
  const meStickyHtml = (!meInVisible && me && me.rank>0 && !q) ? `
    <div class="lbx-me-sticky">
      <div class="m-rk">#${me.rank}</div>
      <div class="m-info">
        <div class="m-lbl">Sizning o'rningiz</div>
        <div class="m-nm">${esc(me.name||'Siz')} · Daraja ${levelInfo(me.xp).level}</div>
      </div>
      <div class="m-xp">${IC.bolt}${fmtXP(me.xp)}</div>
    </div>` : '';

  sec.innerHTML=`
    <div class="shd"><div><h1>Liga</h1><p>${esc(R.label)}</p></div></div>
    <div class="sscroll">
      <div id="lbStatus" class="lb-status" style="display:none"></div>
      ${hero}
      <div class="lgx-info">
        <div class="lgx-info-it"><b>${LEAGUES.length*3}</b><span>Pog'ona</span></div>
        <div class="lgx-info-it"><b>${R.top?'*'+R.star:R.div===3?'I':R.div===2?'II':'III'}</b><span>Bo'linma</span></div>
        <div class="lgx-info-it"><b>${st.filter==='global'?allData.length:leagueOnly.length}</b><span>${st.filter==='global'?'Global':'Ligada'}</span></div>
      </div>
      ${wdJamoaBridgeHtml()}
      <div class="slbl" style="margin-left:20px">Reyting</div>
      ${controls}
      ${podium}
      <div class="card lbx-card">
        <div class="lbx-list">${rows}</div>
        ${emptyHtml}
        ${hasMore ? `<div class="lbx-more-wrap">
          <button class="lbx-more" id="lbMore">
            Yana ko'rsatish (+${Math.min(st.perPage, listData.length - shown)})
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>` : ''}
      </div>
      ${meStickyHtml}
      <div class="slbl" style="margin-left:20px">Ligalar yo'li</div>
      <div class="lgx-ladder">${ladder}</div>
      <div style="height:16px"></div>
    </div>`;

  // Event: search — DOM ni qayta chizmasdan, faqat ro'yxatni yangilaymiz
  const searchEl = sec.querySelector('#lbSearch');
  if(searchEl){
    searchEl.addEventListener('input', (e)=>{
      st.query = e.target.value;
      st.page = 1;
      clearTimeout(window.__lbSearchTO);
      window.__lbSearchTO = setTimeout(()=>{
        // Faqat ro'yxatni qayta chizamiz (search input DOMi tegilmaydi)
        wdLbRepaintList();
      }, 140);
    });
  }
  // Event: filter — bu DOM'ni to'liq qayta chizishi kerak (podium, hero ham o'zgaradi)
  sec.querySelectorAll('.lbx-filter button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      st.filter = btn.dataset.f;
      st.page = 1;
      st.query = ''; // filter almashganda search'ni tozalaymiz
      renderLeaderboardScreen();
    });
  });
  // Event: yana ko'rsatish
  const moreBtn = sec.querySelector('#lbMore');
  if(moreBtn){
    moreBtn.addEventListener('click', ()=>{
      st.page += 1;
      wdLbRepaintList();
    });
  }
  if(window.__wdRefreshStatus) window.__wdRefreshStatus();
}

/* Faqat ro'yxatni qayta chizadi (search input, podium, hero — hech biriga tegmaydi) */
function wdLbRepaintList(){
  const sec = screens.leaderboard; if(!sec) return;
  const listBox = sec.querySelector('.lbx-list');
  const cardBox = sec.querySelector('.lbx-card');
  if(!listBox || !cardBox) return;

  const esc = x=>{try{return escapeHtml(x)}catch(e){return String(x)}};
  const fmtXP = n=>Math.round(n).toLocaleString('en-US').replace(/,/g,' ');
  const myLevel = levelInfo(window.__wdXP||0).level;
  const R = leagueRank(myLevel);
  const lg = {...LEAGUES[R.index], index:R.index};
  const st = window.__wdLbState;

  const allData = wdLeaderboardData().slice().sort((a,b)=>b.xp-a.xp);
  const leagueOnly = allData.filter(p=>leagueFor(levelInfo(p.xp).level).index===lg.index);
  const baseData = st.filter==='global' ? allData : leagueOnly;
  const dataWithRank = baseData.map((p,i)=>({...p,rank:i+1}));
  const q = (st.query||'').trim().toLowerCase();
  const data = q ? dataWithRank.filter(p=>String(p.name||'').toLowerCase().includes(q)) : dataWithRank;

  const listStart = (!q && data.length >= 3) ? 3 : 0;  // qidiruvda podium yashiriladi (pastdagi HTML da ham) — faqat ro'yxat qismini qaytamiz
  const listData = data.slice(listStart);
  const shown = Math.min(listData.length, st.page * st.perPage);
  const visible = listData.slice(0, shown);
  const hasMore = shown < listData.length;

  const rows = visible.map(p=>{
    const isSiz = p.me && p.name==='Siz';
    const nc = (p.me && window.__wdNameColor) ? (' nc-'+window.__wdNameColor) : '';
    let ttl = '';
    if(p.me && typeof titleChipHtml==='function') ttl = titleChipHtml();
    else if(p.titleId && typeof ACHIEVEMENTS!=='undefined' && ACHIEVEMENTS[p.titleId]){
      ttl = titleChip(p.titleId, esc);
    }
    return `<div class="lbx-row ${p.me?'me':''}">
      <span class="lbx-rk">${p.rank}</span>
      <span class="lb-av2">${rowAvatar(p,38)}</span>
      <div class="lbx-nm"><b class="${nc}">${isSiz?'Siz':esc(p.name)}</b>${ttl}<span>Daraja ${levelInfo(p.xp).level}</span></div>
      <div class="lbx-xp">${IC.bolt}${fmtXP(p.xp)}</div>
    </div>`;
  }).join('');

  listBox.innerHTML = rows;

  // "Yana ko'rsatish" tugmasi — mavjud DOMdagi eskisini o'chirib, yangisini qo'yamiz
  let moreWrap = cardBox.querySelector('.lbx-more-wrap');
  if(moreWrap) moreWrap.remove();
  if(hasMore){
    const wrap = document.createElement('div');
    wrap.className = 'lbx-more-wrap';
    wrap.innerHTML = `<button class="lbx-more" id="lbMore">
      Yana ko'rsatish (+${Math.min(st.perPage, listData.length - shown)})
      <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    </button>`;
    cardBox.appendChild(wrap);
    wrap.querySelector('#lbMore').addEventListener('click', ()=>{
      st.page += 1;
      wdLbRepaintList();
    });
  }

  // Empty state
  let emptyEl = cardBox.querySelector('.lbx-empty');
  if(emptyEl) emptyEl.remove();
  if(data.length === 0){
    const em = document.createElement('div');
    em.className = 'lbx-empty';
    em.innerHTML = q
      ? `<b>"${esc(q)}"</b> bo'yicha hech kim topilmadi.`
      : `Bu ligada hozircha yolg'iz turibsiz. Ko'proq o'quvchi qo'shilganda reyting jonlanadi.`;
    listBox.after(em);
  }
}

/* ---------- IELTS PROGRESS GRAFIGI (tiklandi) ---------- */
const IPG_METRICS={ov:{k:'overall',lbl:'Umumiy',c:'#E8374A'},l:{k:'l',lbl:'L',c:'#2F6FED'},r:{k:'r',lbl:'R',c:'#8B5CF6'},w:{k:'w',lbl:'W',c:'#F59E0B'},s:{k:'s',lbl:'S',c:'#1FAE6B'}};
let ipgSel='ov';
function ipgData(){ return (window.__wdIelts||[]).filter(r=>r&&isFinite(r.overall)); }
function ipgDate(ts){ const d=new Date(ts||Date.now()); return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0'); }
function ipgSvg(){
  const M=IPG_METRICS[ipgSel], data=ipgData(), vals=data.map(r=>+r[M.k]||0);
  const W=320,H=152, L=27,R=10,T=14,B=22, iw=W-L-R, ih=H-T-B;
  let lo=Math.min(...vals), hi=Math.max(...vals);
  let ymin=Math.max(1,Math.floor(lo-0.5)), ymax=Math.min(9,Math.ceil(hi+0.5));
  if(ymax-ymin<2){ ymax=Math.min(9,ymin+2); if(ymax-ymin<2) ymin=Math.max(1,ymax-2); }
  const X=i=>data.length===1?L+iw/2:L+iw*(i/(data.length-1));
  const Y=v=>T+ih*(1-(v-ymin)/(ymax-ymin));
  let grid='';
  for(let b=ymin;b<=ymax;b++){
    const y=Y(b).toFixed(1);
    grid+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="var(--line,#E5E9F2)" stroke-width="1" stroke-dasharray="${b===ymin?'0':'3 4'}"/>`+
          `<text x="${L-6}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="8.5" fill="var(--i3,#A6ADBC)" font-weight="700">${b}.0</text>`;
  }
  const pts=vals.map((v,i)=>[X(i),Y(v)]);
  const line=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area=`M ${pts[0][0].toFixed(1)} ${(T+ih).toFixed(1)} L `+line.replace(/ /g,' L ')+` L ${pts[pts.length-1][0].toFixed(1)} ${(T+ih).toFixed(1)} Z`;
  const gid='ipgG'+ipgSel;
  let dots='';
  pts.forEach((p,i)=>{
    const last=i===pts.length-1;
    dots+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${last?4.4:3}" fill="${M.c}" stroke="var(--sur,#fff)" stroke-width="${last?2:1.5}"/>`;
    if(last||pts.length<=6){
      const ty=p[1]-9<T?p[1]+15:p[1]-9;
      dots+=`<text x="${p[0].toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-size="${last?10:8.5}" font-weight="800" fill="${last?M.c:'var(--i5,#6B7488)'}">${vals[i].toFixed(1)}</text>`;
    }
  });
  let xl=`<text x="${X(0).toFixed(1)}" y="${H-6}" text-anchor="${data.length===1?'middle':'start'}" font-size="8.5" fill="var(--i3,#A6ADBC)" font-weight="700">${ipgDate(data[0].date)}</text>`;
  if(data.length>1) xl+=`<text x="${X(data.length-1).toFixed(1)}" y="${H-6}" text-anchor="end" font-size="8.5" fill="var(--i3,#A6ADBC)" font-weight="700">${ipgDate(data[data.length-1].date)}</text>`;
  if(data.length>4){ const m=Math.floor((data.length-1)/2); xl+=`<text x="${X(m).toFixed(1)}" y="${H-6}" text-anchor="middle" font-size="8.5" fill="var(--i3,#A6ADBC)" font-weight="700">${ipgDate(data[m].date)}</text>`; }
  return `<svg class="ipg-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${M.c}" stop-opacity="0.20"/><stop offset="1" stop-color="${M.c}" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}
    ${data.length>1?`<path d="${area}" fill="url(#${gid})"/>`:''}
    ${data.length>1?`<polyline points="${line}" fill="none" stroke="${M.c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`:''}
    ${dots}${xl}</svg>`;
}
/* ========== STREAK KARTA — kunlik odat ========== */
function streakCardHtml(){
  const daily = Number(window.__wdDaily||0);
  const best  = Number(window.__wdBestStreak||0);
  const active = new Set(window.__wdActiveDays||[]);
  const coins = Number(window.__wdCoins||0);
  const xp = Number(window.__wdXP||0);
  const inf = (typeof levelInfo==='function') ? levelInfo(xp) : {level:1};
  const level = inf.level || 1;

  // Bu haftaning 7 kunini (Du-Ya) hisoblaymiz
  const now = new Date();
  const dow = (now.getDay()+6)%7; // Du=0, ..., Ya=6
  const monday = new Date(now); monday.setDate(now.getDate()-dow); monday.setHours(0,0,0,0);
  const labels = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    const iso = d.toISOString().slice(0,10);
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;
    const isFuture = d > now && !isToday;
    days.push({
      lbl: labels[i],
      iso,
      on: active.has(iso),
      now: isToday,
      future: isFuture,
      past: isPast,
    });
  }

  // Notification permission button holati
  const canNotify = (typeof Notification !== 'undefined');
  const notifState = canNotify ? Notification.permission : 'unsupported';
  const notifBtn = (notifState === 'granted')
    ? `<button class="stk-remind on" id="stkRemindBtn"><svg viewBox="0 0 24 24" class="ic"><path d="M4 12l5 5L20 6"/></svg>Eslatma yoqilgan</button>`
    : `<button class="stk-remind" id="stkRemindBtn"><svg viewBox="0 0 24 24" class="ic"><path d="M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>Streak yo'qolmasin — eslatib turay</button>`;

  return `<div class="card stk-card">
    <div class="stk-head">
      <div class="stk-title">
        <span class="stk-em">Streak</span>
        <span class="stk-em2"> — har kun kichik g'alaba</span>
      </div>
      <div class="stk-sub">${daily>0 ? "Bir kun ham qoldirmadingiz" : "Bugun boshlashga arziydi"}</div>
    </div>

    <div class="stk-big">
      <div class="stk-n">${daily}</div>
      <div class="stk-l">kun ketma-ket · qat'iyat qanotlari</div>
      ${best>0 ? `<div class="stk-best"><b>${best}</b> kun — eng ko'p natijangiz</div>` : ''}
    </div>

    <div class="stk-week-lbl">Bu hafta</div>
    <div class="stk-week">
      ${days.map(d=>`<div class="stk-d ${d.on?'on':''} ${d.now?'now':''} ${d.future?'future':''}"><span>${d.lbl}</span></div>`).join('')}
    </div>

    <div class="stk-stats">
      <div class="stk-st"><b>${fmtNum(coins)}</b><small>Coins</small></div>
      <div class="stk-st"><b>${fmtNum(xp)}</b><small>XP</small></div>
      <div class="stk-st"><b>${level}</b><small>Level</small></div>
    </div>

    ${notifBtn}
  </div>`;
}
function fmtNum(n){
  n = Number(n)||0;
  if(n<1000) return String(n);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
}

function ieltsProgressCard(){
  const data=ipgData();
  if(!data.length){
    return `<div class="card" id="ipgCard" style="padding:16px">
      <div class="ipg-head"><div><div class="ipg-kick">IELTS</div><div class="ipg-title">O'sish grafigi</div></div></div>
      <div class="ipg-empty">
        <svg viewBox="0 0 120 44" style="width:120px;opacity:.5"><polyline points="6,36 34,28 62,30 90,16 114,8" fill="none" stroke="#E8374A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 6"/><circle cx="114" cy="8" r="4" fill="#E8374A"/></svg>
        <p>Hali to'liq mock topshirilmagan.<br>Birinchi to'liq mock'dan so'ng bu yerda o'sish chizig'i paydo bo'ladi.</p>
        <button class="ep-go" id="ipgGo">Imtihon zaliga kirish</button>
      </div></div>`;
  }
  const M=IPG_METRICS[ipgSel], vals=data.map(r=>+r[M.k]||0);
  const best=Math.max(...data.map(r=>+r.overall||0));
  const last=vals[vals.length-1], delta=vals.length>1?last-vals[0]:0;
  const chips=Object.entries(IPG_METRICS).map(([id,m])=>
    `<button class="ipg-chip ${id===ipgSel?'on':''}" data-m="${id}" style="${id===ipgSel?`background:${m.c}`:''}">${m.lbl}</button>`).join('');
  const dsign=delta>0?'+':'', dcol=delta>0?'var(--ok,#1FAE6B)':(delta<0?'var(--bad,#E4484E)':'var(--i5)');
  return `<div class="card" id="ipgCard" style="padding:16px">
    <div class="ipg-head">
      <div><div class="ipg-kick">IELTS</div><div class="ipg-title">O'sish grafigi</div></div>
      <div class="ipg-best"><b>${best.toFixed(1)}</b><span>Eng yaxshi</span></div>
    </div>
    <div class="ipg-chips">${chips}</div>
    <div id="ipgChart">${ipgSvg()}</div>
    <div class="ipg-stats">
      <div class="ipg-st"><b>${last.toFixed(1)}</b><span>Oxirgi</span></div>
      <div class="ipg-st"><b style="color:${dcol}">${dsign}${delta.toFixed(1)}</b><span>O'sish</span></div>
      <div class="ipg-st"><b>${Math.max(...vals).toFixed(1)}</b><span>Cho'qqi</span></div>
      <div class="ipg-st"><b>${data.length}</b><span>Mocklar</span></div>
    </div></div>`;
}
function ipgWire(sec){
  const card=sec.querySelector('#ipgCard'); if(!card) return;
  const go=card.querySelector('#ipgGo');
  if(go) go.addEventListener('click',()=>{ if(window.__wdOpenExam) window.__wdOpenExam(); else showToast('Yuklanmoqda, bir oz kuting',IC.info); });
  card.querySelectorAll('.ipg-chip').forEach(ch=>ch.addEventListener('click',()=>{
    ipgSel=ch.dataset.m;
    const wrap=card.parentNode;
    const html=ieltsProgressCard();
    const tmp=document.createElement('div'); tmp.innerHTML=html;
    wrap.replaceChild(tmp.firstElementChild,card);
    ipgWire(sec);
  }));
}

/* ===== TITUL TIZIMI — olingan yutuqlardan bittasini profilga taqish ===== */
/* Titul chipi — ikonka + o'z kuchiga xos aura.
   Har titul o'z ohangida yonadi: oddiy yutuqlar sokin, nodir yutuqlar kuchli. */
const TT_AURA={
  // id -> [gradient, nur RGB, kuch darajasi 1-3, kichik belgi]
  det_detective:['#C9D3E3,#7C8698','150,165,190',1,'lens'],
  det_inspector:['#F3C969,#B7832F','230,180,80',2,'lens'],
  det_chief:    ['#9FC3EE,#3B5FA8','110,150,220',3,'lens'],
  det_master:   ['#2B3147,#0B0D14,#C8913A','200,145,58',3,'lens'],
  first_word:   ['#60A5FA,#3B82F6','96,165,250',1,'pen'],
  ten_words:    ['#34D399,#10B981','52,211,153',1,'book'],
  fifty_words:  ['#38BDF8,#0EA5E9','56,189,248',2,'book'],
  hundred_words:['#FBBF24,#F59E0B','251,191,36',3,'cup'],
  streak5:      ['#FB923C,#F97316','251,146,60',2,'flame'],
  streak10:     ['#F87171,#EF4444','248,113,113',3,'bolt'],
  perfect:      ['#22D3EE,#06B6D4','34,211,238',3,'gem'],
  daily3:       ['#A3E635,#84CC16','163,230,53',1,'cal'],
  daily7:       ['#4ADE80,#22C55E','74,222,128',2,'cal'],
  listener:     ['#C084FC,#A855F7','192,132,252',3,'ear'],
  _default:     ['#8B5CF6,#6366F1','139,92,246',2,'star']
};
/* Chip uchun SODDA bir rangli belgilar.
   MUHIM: yutuqlar bo'limidagi BADGE ikonkalari 40x40 va o'z gradientlari bilan —
   ular 14px chipga sig'maydi va buzilib ko'rinadi. Shuning uchun chipga
   soddalashtirilgan variant ishlatiladi (bir xil chiziq qalinligi, currentColor). */
const TT_MARK={
  lens:'<circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
  pen:  '<path d="M15.5 4.5l4 4L8 20l-4.5.5.5-4.5L15.5 4.5z"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H14v15h4.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
  cup:  '<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H4.5v1.5A3.5 3.5 0 0 0 8 10M17 5h2.5v1.5A3.5 3.5 0 0 1 16 10M10 13h4l.6 4H9.4zM7.5 19h9"/>',
  flame:'<path d="M12 3c3 3.5 5.5 6 5.5 9.5A5.5 5.5 0 0 1 6.5 12.5C6.5 10 8 8.5 9 7c.4 1.6 1.2 2.4 2 2.8C11 7.6 11.2 5.2 12 3z"/>',
  bolt: '<path d="M13.2 2.5 5 13.2h5.2l-.9 8.3L18.5 10h-5.6z"/>',
  gem:  '<path d="M7.5 3h9l4 5.5L12 21 3.5 8.5zM3.5 8.5h17M9 3l-1.5 5.5L12 21M15 3l1.5 5.5L12 21"/>',
  cal:  '<path d="M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5zM8 3v4M16 3v4M4.5 10h15"/>',
  ear:  '<path d="M8 9a4 4 0 0 1 8 0c0 2.5-2 3-3 4.5S12 17 12 18a2 2 0 0 1-4 0"/><path d="M11 9.2a1 1 0 0 1 2 0"/>',
  star: '<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.7l1.1-6L3.4 9.5l6-.8z"/>'
};
function ttMark(k){
  const p=TT_MARK[k]||TT_MARK.star;
  const stroked=(k==='cup'||k==='gem'||k==='cal'||k==='ear');
  return `<svg viewBox="0 0 24 24" class="tt-mk${stroked?' st':''}">${p}</svg>`;
}
function ttAura(id){ return TT_AURA[id]||TT_AURA._default; }
function titleChip(id,esc_){
  try{
    if(!id || typeof ACHIEVEMENTS==='undefined' || !ACHIEVEMENTS[id]) return '';
    const a=ttAura(id), A=ACHIEVEMENTS[id];
    const e=esc_||escapeHtml;
    return `<i class="pf-title lv${a[2]}" style="--tt-g:linear-gradient(120deg,${a[0]});--tt-rgb:${a[1]}">
      ${ttMark(a[3])}<span>${e(A.title)}</span></i>`;
  }catch(e){ return ''; }
}
function titleChipHtml(){
  try{
    const id=window.__wdTitleId;
    if(!id) return '';
    if(typeof ACHIEVEMENTS==='undefined' || !ACHIEVEMENTS[id]) return '';
    if(!window.__wdAch || typeof window.__wdAch.has!=='function' || !window.__wdAch.has(id)) return '';
    return titleChip(id);
  }catch(e){ return ''; }
}
/* Titul tugmasi yozuvi — xato bo'lsa ham profil ochilaversin */
function titleBtnLabel(){
  try{
    const id=window.__wdTitleId;
    if(id && typeof ACHIEVEMENTS!=='undefined' && ACHIEVEMENTS[id]) return escapeHtml(ACHIEVEMENTS[id].title);
  }catch(e){}
  return 'Titul tanlash';
}
function openTitlePicker(){
  const got=Object.entries(ACHIEVEMENTS).filter(([id])=>window.__wdAch.has(id));
  const cur=window.__wdTitleId||'';
  if(!got.length){
    openSheet(`<h2>Titul</h2><p class="desc">Hali birorta titul olinmagan. Yutuqlarni ochsangiz, ularni shu yerdan profilingizga taqishingiz mumkin.</p>`);
    return;
  }
  const layer=openSheet(`<h2>Titulni tanlang</h2>
    <p class="desc">Tanlangan titul ismingiz yonida ko'rinadi.</p>
    <div class="tt-grid">
      <button class="tt-opt ${cur===''?'on':''}" data-id="">
        <div class="tt-ic tt-none">—</div><span>Taqilmasin</span></button>
      ${got.map(([id,a])=>`
        <button class="tt-opt ${cur===id?'on':''}" data-id="${id}">
          <div class="tt-ic">${a.icon}</div><span>${escapeHtml(a.title)}</span></button>`).join('')}
    </div>`);
  layer.querySelectorAll('.tt-opt').forEach(b=>b.addEventListener('click',()=>{
    window.__wdTitleId=b.dataset.id||'';
    try{ saveState(); }catch(e){}
    closeSheet(); renderProfile();
    try{ showToast(window.__wdTitleId?"Titul taqildi":"Titul olib tashlandi", IC.star||IC.about); }catch(e){}
  }));
}
function renderProfile(){
  try{ renderProfileInner(); }
  catch(err){
    // Profil hech qachon oq ekran bo'lib qolmasin — xatoni ko'rsatamiz
    try{
      console.error('renderProfile xatosi:', err);
      const s2=screens.profile;
      if(s2) s2.innerHTML=`<div class="shd"><div><h1>Profil</h1><p>Yuklashda xato</p></div></div>
        <div class="sscroll"><div class="card" style="margin:0 20px;padding:18px">
        <b style="display:block;margin-bottom:6px">Profilni ko'rsatib bo'lmadi</b>
        <span style="font-size:13px;color:var(--i5)">${escapeHtml(String(err&&err.message||err))}</span>
        </div></div>`;
    }catch(e){}
  }
}
/* ====== Onboarding profil yordamchilari ====== */
const _onbSvg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="onb-emi">${d}</svg>`;
const ONB_IC = {
  cap:      _onbSvg('<path d="M22 10 L12 5 L2 10 L12 15 Z"/><path d="M6 12 V17 C6 18.5 8.5 20 12 20 C15.5 20 18 18.5 18 17 V12"/><path d="M22 10 V15"/>'),
  target:   _onbSvg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
  sparkle:  _onbSvg('<path d="M12 3 V8 M12 16 V21 M3 12 H8 M16 12 H21 M6 6 L9 9 M15 15 L18 18 M6 18 L9 15 M15 9 L18 6"/>'),
  cert:     _onbSvg('<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M8 7 H16 M8 10 H13"/><circle cx="12" cy="17" r="3"/>'),
  brief:    _onbSvg('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8 V5 H15 V8"/><path d="M3 13 H21"/>'),
  plane:    _onbSvg('<path d="M3 12 L10 14 L12 21 L14 14 L21 12 L14 10 L12 3 L10 10 Z"/>'),
  film:     _onbSvg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5 V19 M17 5 V19 M3 9 H7 M3 13 H7 M17 9 H21 M17 13 H21"/>'),
  chat:     _onbSvg('<path d="M4 12 C4 7.6 7.6 4 12 4 C16.4 4 20 7.6 20 12 C20 16.4 16.4 20 12 20 L4 20 L6 17.5 C4.8 16 4 14 4 12 Z"/>'),
  chip:     _onbSvg('<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 3 V6 M15 3 V6 M9 18 V21 M15 18 V21 M3 9 H6 M3 15 H6 M18 9 H21 M18 15 H21"/><rect x="9" y="9" width="6" height="6" rx=".5"/>'),
  ball:     _onbSvg('<circle cx="12" cy="12" r="9"/><path d="M12 3 L14.5 8 L20 9 L16 13 L17 19 L12 16 L7 19 L8 13 L4 9 L9.5 8 Z"/>'),
  music:    _onbSvg('<path d="M9 18 V5 L20 3 V16"/><circle cx="7" cy="18" r="2.2"/><circle cx="18" cy="16" r="2.2"/>'),
  book:     _onbSvg('<path d="M4 5 C4 4 5 3 6 3 H11 V20 H6 C5 20 4 19 4 18 Z"/><path d="M20 5 C20 4 19 3 18 3 H13 V20 H18 C19 20 20 19 20 18 Z"/>'),
  fork:     _onbSvg('<path d="M7 3 V11 C7 12.5 8 13.5 9.5 13.5 V21 M6 3 V8 M8 3 V8 M17 3 C15 3 14 5 14 8 C14 10 15 11 16 11 V21"/>'),
  game:     _onbSvg('<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 12 V15 M6.5 13.5 H9.5 M15 12 h.01 M17 14 h.01"/>'),
  brush:    _onbSvg('<path d="M14 3 L21 10 L11 20 C10 21 8 21 7 20 L4 17 C3 16 3 14 4 13 Z"/><path d="M8 15 L12 19"/>'),
  atom:     _onbSvg('<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>'),
  leaf:     _onbSvg('<path d="M4 20 C4 12 10 4 20 4 C20 14 14 20 4 20 Z"/><path d="M4 20 L14 10"/>')
};
const CEFR_INFO = {
  A1:{t:'Boshlovchi',      d:'Alifbo, oddiy so\'zlar'},
  A2:{t:'Elementary',      d:'Kundalik iboralar'},
  B1:{t:'O\'rta',          d:'Tanish mavzularda erkin'},
  B2:{t:'Upper-Int.',      d:'IELTS 5.5–6.5'},
  C1:{t:'Advanced',        d:'Aniq va tez'},
  C2:{t:'Mastery',         d:'Ona tilidek'}
};
const GOAL_INFO = {
  ielts:  {t:'IELTS / imtihon',  s:'6.5–7.5 ball uchun tayyorlov', ic:'cert'},
  work:   {t:'Ish va karera',    s:'Biznes yozishmalari, suhbat',  ic:'brief'},
  travel: {t:'Sayohat',          s:'Aeroport, mehmonxona',         ic:'plane'},
  movies: {t:'Film va musiqa',   s:'Subtitrsiz tushunish',         ic:'film'},
  general:{t:'Umumiy suhbat',    s:'Erkin gapirish va yozish',     ic:'chat'}
};
const INTEREST_INFO = {
  tech:{b:'Texnologiya',ic:'chip'}, sport:{b:'Sport',ic:'ball'}, music:{b:'Musiqa',ic:'music'},
  films:{b:'Kino',ic:'film'}, books:{b:'Kitob',ic:'book'}, travel:{b:'Sayohat',ic:'plane'},
  food:{b:'Ovqat',ic:'fork'}, games:{b:"O'yin",ic:'game'}, art:{b:"San'at",ic:'brush'},
  business:{b:'Biznes',ic:'brief'}, science:{b:'Ilm-fan',ic:'atom'}, nature:{b:'Tabiat',ic:'leaf'}
};
function onbLevelCardHtml(){
  const c = window.__wdCEFR || '';
  const info = CEFR_INFO[c];
  const val = info ? `<b class="onb-val">${c}</b><span class="onb-sub">${info.t} · ${info.d}</span>`
                   : `<b class="onb-val onb-empty">—</b><span class="onb-sub">Tanlang</span>`;
  return `<button class="card onb-card" id="onbLevelBtn">
    <div class="onb-ic bl">${ONB_IC.cap}</div>
    <div class="onb-t"><span class="onb-lbl">Ingliz tili darajam</span>${val}</div>
    <svg viewBox="0 0 24 24" class="onb-chev"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`;
}
function onbGoalCardHtml(){
  const g = window.__wdGoal || '';
  const info = GOAL_INFO[g];
  const val = info ? `<b class="onb-val"><span class="onb-inl">${ONB_IC[info.ic]||''}</span>${info.t}</b><span class="onb-sub">${info.s}</span>`
                   : `<b class="onb-val onb-empty">Belgilanmagan</b><span class="onb-sub">Onboarding'da tanlanadi</span>`;
  return `<div class="card onb-card onb-static">
    <div class="onb-ic gr">${ONB_IC.target}</div>
    <div class="onb-t"><span class="onb-lbl">Maqsadim</span>${val}</div>
  </div>`;
}
function onbInterestsCardHtml(){
  const list = Array.isArray(window.__wdInterests) ? window.__wdInterests : [];
  if(!list.length){
    return `<div class="card onb-card onb-static">
      <div class="onb-ic pk">${ONB_IC.sparkle}</div>
      <div class="onb-t"><span class="onb-lbl">Qiziqishlarim</span>
        <b class="onb-val onb-empty">Kiritilmagan</b>
        <span class="onb-sub">Onboarding'da tanlanadi</span>
      </div>
    </div>`;
  }
  const chips = list.map(id=>{
    const it = INTEREST_INFO[id];
    if(!it) return '';
    return `<span class="onb-chip">${ONB_IC[it.ic]||''}${it.b}</span>`;
  }).join('');
  return `<div class="card onb-card onb-static onb-chips-card">
    <div class="onb-t-row">
      <div class="onb-ic pk">${ONB_IC.sparkle}</div>
      <span class="onb-lbl">Qiziqishlarim</span>
    </div>
    <div class="onb-chips">${chips}</div>
  </div>`;
}
function renderProfileInner(){
  const sec=screens.profile;
  const inf=levelInfo(window.__wdXP||0);
  const pct=Math.round((inf.inLevel/inf.need)*100);
  // Yutuqlar to'plami
  let achHtml='';
  Object.entries(ACHIEVEMENTS).forEach(([id,a])=>{
    const got=window.__wdAch.has(id);
    achHtml+=`<div class="ach-item ${got?'got':'locked'}">
      <div class="ach-ic">${got?a.icon:BADGE.lockb}</div>
      <div class="ach-txt"><b>${a.title}</b><span>${a.desc}</span></div>
    </div>`;
  });
  const gotCount=[...window.__wdAch].filter(id=>ACHIEVEMENTS[id]).length;
  const totalAch=Object.keys(ACHIEVEMENTS).length;

  sec.innerHTML=`
    <div class="shd"><div><h1>Profil</h1><p>Shaxsiy statistika</p></div>
      <button class="theme-btn" id="themeBtn" title="Tema">${window.__wdDark?IC.star:IC.moon}</button>
    </div>
    <div class="sscroll">
      <div class="profile-head">
        <div class="pf-av-wrap" id="pfAvatar">
          <div class="fr-ring ${window.__wdFrame?("fr-"+window.__wdFrame):""}">${userAvatar(96)}</div>
          <div class="pf-league">${leagueEmblem(leagueFor(inf.level).index,36)}</div>
          <div class="pf-cam"><svg viewBox="0 0 24 24" class="ic"><path d="M4 8 H7 L8.5 6 H15.5 L17 8 H20 A1 1 0 0 1 21 9 V18 A1 1 0 0 1 20 19 H4 A1 1 0 0 1 3 18 V9 A1 1 0 0 1 4 8 Z"/><circle cx="12" cy="13" r="3.1"/></svg></div>
        </div>
        <button class="pf-name-btn" id="pfNameBtn">
          <span class="${window.__wdName?'':'ph'}">${window.__wdName?escapeHtml(window.__wdName):'Ismingizni kiriting'}</span>
          ${titleChipHtml()}${window.__wdProBadge?window.__wdProBadge():''}
          <svg viewBox="0 0 24 24" class="ic"><path d="M4 20 L4 16 L15 5 L19 9 L8 20 Z"/><path d="M13 7 L17 11"/></svg>
        </button>
        <p>${inf.title} · ${leagueFor(inf.level).name} ligasi</p>
      </div>
      ${(()=>{ try{ const C=detCareer(); return `<button class="pf-det" id="pfDet">${detMedal(C.idx,52)}<div><small>Ingliz detektivi</small><b>${C.rank.uz}</b><span>${C.solved} ta ish · o'rtacha ${C.avg||0} ball${detStore().cert?' · tasdiqnoma bor':''}</span></div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`; }catch(e){ return ''; } })()}
      <div class="card xp-card">
        <div class="xp-top"><span>Daraja ${inf.level}</span><span>${inf.inLevel} / ${inf.need} XP</span></div>
        <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
        <div class="xp-next">Keyingi darajagacha ${inf.need-inf.inLevel} XP</div>
      </div>
      ${onbLevelCardHtml()}
      <button class="card onb-card" id="pfInvite"><div class="onb-ic bl">${BADGE.trophy}</div><div class="onb-t"><span class="onb-lbl">Do'st taklif qilish</span><b class="onb-val">3 do'st = 7 kun Pro</b><span class="onb-sub">Har 3 ta do'stingiz qo'shilganda</span></div><svg viewBox="0 0 24 24" class="onb-chev"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      ${onbGoalCardHtml()}
      ${onbInterestsCardHtml()}
      <div class="stat-row">
        <div class="card stat-card"><div class="sc-ic bl">${BADGE.trophy}</div><b id="stLvl">0</b><span>Bosqichlar</span></div>
        <div class="card stat-card"><div class="sc-ic gr">${BADGE.books}</div><b id="stWords">0</b><span>So'zlar</span></div>
        <div class="card stat-card"><div class="sc-ic or">${BADGE.flame}</div><b id="stStreak">0</b><span>Streak</span></div>
      </div>
      <div class="stat-row">
        <div class="card stat-card"><div class="sc-ic pk">${BADGE.calendar}</div><b>${window.__wdDaily||0}</b><span>Kunlik streak</span></div>
        <div class="card stat-card"><div class="sc-ic yl">${BADGE.bolt}</div><b>${window.__wdXP||0}</b><span>Jami XP</span></div>
        <div class="card stat-card"><div class="sc-ic cy">${BADGE.diamond}</div><b>${window.__wdPerfect||0}</b><span>Mukammal</span></div>
      </div>
      ${streakCardHtml()}
      ${ieltsProgressCard()}
      <div id="weeklyReportWrap"></div>
      <div class="ach-head">
        <div class="slbl" style="margin:0">Yutuqlar (${gotCount}/${totalAch})</div>
        <button class="tt-btn" id="pfTitleBtn">${titleBtnLabel()}</button>
      </div>
      <div class="ach-grid">${achHtml}</div>
      <div class="slbl" style="margin-left:20px">Hisob</div>
      <div class="card settings-block">
        <div class="acc-row" id="accRow"></div>
      </div>
      ${window.__wdProProfileBlock?window.__wdProProfileBlock():''}
      ${window.__wdTgProfileBlock?window.__wdTgProfileBlock():''}
      <div class="slbl" style="margin-left:20px">Sozlamalar</div>
      <div class="card settings-block">
        <div class="srow"><div class="icw">${IC.moon}</div><div class="slabel">Qorong'i rejim</div><div class="sw ${window.__wdDark?'on':''}" id="sw3"><b></b></div></div>
        <div class="srow"><div class="icw">${IC.bell}</div><div class="slabel">Bildirishnomalar</div><div class="sw ${window.__wdNotifOn?'on':''}" id="sw1"><b></b></div></div>
        <div class="srow"><div class="icw">${IC.sound}</div><div class="slabel">Ovoz effektlari</div><div class="sw ${window.__wdSoundOn?'on':''}" id="sw2"><b></b></div></div>
        <div class="srow" id="rDaily"><div class="icw">${IC.bolt||IC.about}</div><div class="slabel">Kunlik maqsad</div><div class="sval">${window.__wdDailyMin?window.__wdDailyMin+' daq':'—'}</div><div class="schev">${IC.chevR}</div></div>
        <div class="srow" id="rLang"><div class="icw">${IC.globe}</div><div class="slabel">Til</div><div class="schev">${IC.chevR}</div></div>
        <div class="srow" id="rFrame"><div class="icw">${IC.star||IC.about}</div><div class="slabel">Profil ramkasi</div><div class="schev">${IC.chevR}</div></div>
        <div class="srow" id="rNameColor"><div class="icw">${IC.star||IC.about}</div><div class="slabel">Ism rangi</div><div class="schev">${IC.chevR}</div></div>
        <div class="srow" id="rFeedback"><div class="icw"><svg viewBox="0 0 24 24" class="ic"><path d="M21 14.5a2.5 2.5 0 0 1-2.5 2.5H8l-4.5 4V5.5A2.5 2.5 0 0 1 6 3h12.5A2.5 2.5 0 0 1 21 5.5z"/><path d="M8 9h8M8 12.5h5"/></svg></div><div class="slabel">Fikr bildirish</div><div class="schev">${(window.__wdFbReplyNew?'<i class="fb-dot"></i>':'')}${IC.chevR}</div></div>
        <div class="srow" id="rAbout"><div class="icw">${IC.about}</div><div class="slabel">WordDrop haqida</div><div class="schev">${IC.chevR}</div></div>
      </div>
    </div>`;
  const toggleDark=()=>{
    window.__wdDark=!window.__wdDark;
    document.body.classList.toggle('dark',window.__wdDark);
    saveState();
    renderProfile();
  };
  document.getElementById('themeBtn').addEventListener('click',toggleDark);
  // ===== Hisob satri: kirgan bo'lsa email + Chiqish, aks holda Kirish tugmasi =====
  (function(){
    const row=document.getElementById('accRow'); if(!row) return;
    const signed = (typeof window.__wdIsSignedIn==='function') && window.__wdIsSignedIn();
    if(signed){
      row.innerHTML=`
        <div class="ar-ic"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
        <div class="ar-t"><b>${window.__wdAuthEmail()}</b><span>Progress bulutga saqlanmoqda</span></div>
        <button class="ar-out" id="accOut">Chiqish</button>`;
      const ob=document.getElementById('accOut');
      if(ob) ob.addEventListener('click',()=>{
        openSheet(`<div class="auth-head"><div class="ah-ic" style="background:linear-gradient(135deg,#E4484E,#C61E31)"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg></div><h2>Chiqasizmi?</h2><p>Bu qurilmada mehmon rejimiga o'tasiz. Progressingiz bulutda saqlanadi — istalgan payt qayta kirsangiz qaytadi.</p></div>
          <div class="auth-f"><button class="auth-cta" id="accOutYes" style="background:linear-gradient(135deg,#E4484E,#C61E31)">Ha, chiqaman</button>
          <div class="auth-alt"><b id="accOutNo">Bekor qilish</b></div></div>`);
        document.getElementById('accOutNo').addEventListener('click',closeSheet);
        document.getElementById('accOutYes').addEventListener('click',async()=>{
          await window.__wdSignOut(); closeSheet();
          try{ showToast("Hisobdan chiqdingiz",IC.check); }catch(e){}
          setTimeout(()=>location.reload(), 700);
        });
      });
    }else{
      row.innerHTML=`
        <div class="ar-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/></svg></div>
        <div class="ar-t"><b>Mehmon rejimi</b><span>Progressni saqlash uchun hisob yarating</span></div>
        <button class="ar-cta" id="accIn">Kirish</button>`;
      const ib=document.getElementById('accIn');
      if(ib) ib.addEventListener('click',()=>openAuthSheet('signup'));
    }
  })();
  const pfAv=document.getElementById('pfAvatar'); if(pfAv) pfAv.addEventListener('click',triggerAvatarPick);
  const pfNm=document.getElementById('pfNameBtn'); if(pfNm) pfNm.addEventListener('click',openNameSheet);
  const pfDt=document.getElementById('pfDet'); if(pfDt) pfDt.addEventListener('click',()=>detOpen());
  // Onboarding profil handlerlari
  const onbLv=document.getElementById('onbLevelBtn');
  if(onbLv) onbLv.addEventListener('click',openCEFRSheet);
  const pfInv=document.getElementById('pfInvite'); if(pfInv) pfInv.addEventListener('click',openInviteSheet);
  const rDaily=document.getElementById('rDaily');
  if(rDaily) rDaily.addEventListener('click',openDailyGoalSheet);
  // Streak eslatma tugmasi
  const stkRemind=document.getElementById('stkRemindBtn');
  if(stkRemind){
    stkRemind.addEventListener('click', async ()=>{
      if(stkRemind.classList.contains('on')) return; // allaqachon yoqilgan
      if(typeof Notification==='undefined'){
        showToast('Bu qurilma bildirishnomalarni qoʻllab-quvvatlamaydi', IC.info);
        return;
      }
      try{
        const p = await Notification.requestPermission();
        if(p === 'granted'){
          window.__wdNotifOn = true;
          try{ saveState(); }catch(e){}
          stkRemind.classList.add('on');
          stkRemind.innerHTML = '<svg viewBox="0 0 24 24" class="ic"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Eslatma yoqilgan';
          showToast('Streak yo\'qolmasin — har kun eslataman', IC.check||IC.info);
        } else {
          showToast('Ruxsat berilmadi — sozlamalarda yoqing', IC.info);
        }
      }catch(e){
        showToast('Xatolik: '+((e&&e.message)||String(e)), IC.info);
      }
    });
  }
  document.getElementById('sw3').addEventListener('click',toggleDark);
  document.getElementById('sw1').addEventListener('click',async e=>{
    const el=e.currentTarget;
    if(!window.__wdNotifOn){
      // YOQISH: brauzerdan haqiqiy ruxsat so'raymiz. Ruxsat berilmasa — tugma yoqilmaydi
      const ok = await (window.__wdNotifEnable ? window.__wdNotifEnable() : Promise.resolve(false));
      window.__wdNotifOn = ok;
      el.classList.toggle('on', ok);
    }else{
      window.__wdNotifOn=false;
      el.classList.remove('on');
      try{ if(window.__wdNotifDisable) window.__wdNotifDisable(); }catch(err){}
      try{ showToast("Bildirishnomalar o'chirildi",IC.bell); }catch(err){}
    }
    saveState();
  });
  document.getElementById('sw2').addEventListener('click',e=>{
    window.__wdSoundOn=!window.__wdSoundOn;
    e.currentTarget.classList.toggle('on',window.__wdSoundOn);
    if(!window.__wdSoundOn && window.__wdStopBg) window.__wdStopBg();
    saveState();
  });
  ipgWire(sec);
  const ttBtn=sec.querySelector('#pfTitleBtn');
  if(ttBtn) ttBtn.addEventListener('click',openTitlePicker);
  const frRow=sec.querySelector('#rFrame');
  if(frRow) frRow.addEventListener('click',()=>{
    if(!premOwn('frames')&&!window.__wdIsPro){ showToast("Do'kondan 'Profil ramkalari'ni oling (15 WC) yoki Pro'ga o'ting",IC.info); return; }
    const cur=window.__wdFrame||'';
    const layer=openSheet(`<h2>Profil ramkasi</h2>
      <div class="fr-grid">
        ${[['','Yo\'q'],['gold','Oltin'],['fire','Olov'],['neon','Neon'],['aqua','Suv'],['royal','Shohona']].concat(window.__wdIsPro?[['pro','Pro tomchi']]:[]).map(([v,n])=>`
          <button class="fr-opt ${cur===v?'on':''}" data-v="${v}">
            <div class="fr-ring fr-${v||'none'}"><div class="fr-demo"></div></div><span>${n}</span>
          </button>`).join('')}
      </div>`);
    layer.querySelectorAll('.fr-opt').forEach(b=>b.addEventListener('click',()=>{
      window.__wdFrame=b.dataset.v||'';
      try{ saveState(); }catch(e){}
      closeSheet(); renderProfile();
    }));
  });
  const ncRow=sec.querySelector('#rNameColor');
  if(ncRow) ncRow.addEventListener('click',()=>{
    if(!premOwn('namecolor')&&!window.__wdIsPro){ showToast("Do'kondan 'Ism rangi'ni oling (120 WC)",IC.info); return; }
    const cur=window.__wdNameColor||'';
    const layer=openSheet(`<h2>Ism rangi</h2>
      <p class="desc">Reytingda ismingiz shu rangda ko'rinadi.</p>
      <div class="fr-grid">
        ${[['','Oddiy'],['gold','Oltin'],['fire','Olov'],['neon','Neon']].map(([v,n])=>`
          <button class="fr-opt ${cur===v?'on':''}" data-v="${v}">
            <span class="nc-demo ${v?('nc-'+v):''}">Aa</span><span>${n}</span>
          </button>`).join('')}
      </div>`);
    layer.querySelectorAll('.fr-opt').forEach(b=>b.addEventListener('click',()=>{
      window.__wdNameColor=b.dataset.v||'';
      try{ saveState(); }catch(e){}
      closeSheet(); showToast('Ism rangi yangilandi',IC.check||IC.info);
    }));
  });
  document.getElementById('rLang').addEventListener('click',()=>{
    const cur=window.__wdLang||'uz';
    const layer=openSheet(`
      <h2>Til / Language</h2>
      <p class="desc">Interfeys tilini tanlang · Choose the interface language</p>
      <button class="btn btn-block lang-opt" data-l="uz" style="margin-top:6px;${cur==='uz'?'outline:2px solid var(--b6,#2F6FED)':''}">O'zbekcha</button>
      <button class="btn btn-block lang-opt" data-l="en" style="margin-top:10px;${cur==='en'?'outline:2px solid var(--b6,#2F6FED)':''}">English</button>`);
    layer.querySelectorAll('.lang-opt').forEach(b=>b.addEventListener('click',()=>{
      const l=b.dataset.l; closeSheet();
      if(window.__wdSetLang) window.__wdSetLang(l);
    }));
  });
  const _rFb=document.getElementById('rFeedback');
  if(_rFb) _rFb.addEventListener('click',()=>{ try{ openFeedbackSheet(); }catch(e){} });
  document.getElementById('rAbout').addEventListener('click',openAboutSheet);
  updateProfileStats();
  try{ renderWeeklyReportCard(); }catch(e){}
}

/* ================= HAFTALIK HISOBOT (wd_weekly_reports) =================
   Har yakshanba serverda (pg_cron) generatsiya qilinadi, har dushanba
   o'chiriladi (wd_weekly_report.sql'ga qarang). Bu yerda faqat o'qiymiz
   va chiroyli kartochka + yuklab olinadigan rasm sifatida ko'rsatamiz. */
const WD_MOTIV_ICON = {
  excellent: BADGE.diamond, good: BADGE.trophy, okay: BADGE.bolt, inactive: BADGE.calendar
};
async function renderWeeklyReportCard(){
  const wrap = document.getElementById('weeklyReportWrap');
  if(!wrap) return;
  if(!window.__sb || !window.__sbUser){ wrap.innerHTML=''; return; }
  let report=null;
  try{
    const { data, error } = await window.__sb.from('wd_weekly_reports')
      .select('*').eq('user_id', window.__sbUser.id)
      .order('week_start', {ascending:false}).limit(1).maybeSingle();
    if(!error) report = data;
  }catch(e){ /* jim — pastda bo'sh holat ko'rsatamiz */ }

  if(!report){
    wrap.innerHTML = `
      <div class="slbl" style="margin-left:20px">Haftalik hisobot</div>
      <div class="card" style="margin:0 20px 20px;padding:18px;display:flex;align-items:center;gap:14px">
        <div class="sc-ic pk" style="width:40px;height:40px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center">${BADGE.calendar}</div>
        <div style="font-size:13px;color:var(--i5);line-height:1.5">Birinchi haftalik hisobotingiz <b style="color:var(--i9)">yakshanba kuni</b> shu yerda tayyor bo'ladi.</div>
      </div>`;
    return;
  }

  const streakArrow = report.streak_status==='up' ? '▲' : report.streak_status==='down' ? '▼' : report.streak_status==='broken' ? '✕' : '—';
  const streakColor = report.streak_status==='up' ? 'var(--ok,#16A870)' : report.streak_status==='down'||report.streak_status==='broken' ? '#E4484E' : 'var(--i5)';
  const wkFmt = (d)=>{ try{ const dt=new Date(d); return dt.toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'}); }catch(e){ return d; } };

  wrap.innerHTML = `
    <div class="slbl" style="margin-left:20px;display:flex;align-items:center;justify-content:space-between;padding-right:20px">
      <span>Haftalik hisobot</span>
      <span style="font-weight:600;color:var(--i5);font-size:12px">${wkFmt(report.week_start)} – ${wkFmt(report.week_end)}</span>
    </div>
    <div class="card" style="margin:0 20px 12px;padding:16px 18px;display:flex;align-items:center;gap:12px">
      <div class="sc-ic ${report.motivation_key==='inactive'?'or':'gr'}" style="width:38px;height:38px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center">${WD_MOTIV_ICON[report.motivation_key]||BADGE.bolt}</div>
      <div style="font-size:13px;color:var(--i7);line-height:1.5">${escapeHtml(report.motivation_text)}</div>
    </div>
    <div class="stat-row">
      <div class="card stat-card"><div class="sc-ic yl">${BADGE.bolt}</div><b>+${report.xp_gained}</b><span>XP</span></div>
      <div class="card stat-card"><div class="sc-ic gr">${BADGE.books}</div><b>${report.words_learned}</b><span>So'z</span></div>
      <div class="card stat-card"><div class="sc-ic bl">${BADGE.calendar}</div><b>${report.active_days}/7</b><span>Faol kun</span></div>
    </div>
    <div class="stat-row">
      <div class="card stat-card"><div class="sc-ic cy">${BADGE.diamond}</div><b>${report.perfect_levels}</b><span>Mukammal</span></div>
      <div class="card stat-card"><div class="sc-ic or">${BADGE.flame}</div><b>${report.streak_at_end}</b><span>Streak</span></div>
      <div class="card stat-card"><div class="sc-ic pk" style="color:${streakColor}"><span style="font-size:16px;font-weight:800">${streakArrow}</span></div><b style="color:${streakColor};font-size:13px">${report.streak_status==='up'?'Oshdi':report.streak_status==='down'?'Pasaydi':report.streak_status==='broken'?'Uzildi':'Barqaror'}</b><span>Holat</span></div>
    </div>
    <div style="margin:0 20px 20px">
      <button class="btn btn-block" id="wrDownloadBtn" style="background:var(--b6);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13M7 12l5 5 5-5"/><path d="M4 20h16"/></svg>
        Rasm sifatida yuklab olish
      </button>
    </div>`;

  const dlBtn = document.getElementById('wrDownloadBtn');
  if(dlBtn) dlBtn.addEventListener('click', ()=>wdDownloadWeeklyReportImage(report));
}

/* ===== Haftalik hisobot PNG — Editorial dizayn (900x~1130) =====
   Sertifikat bilan bir brend tilida: navy #0F1B3D + electric #2F6FED.
   Tashqi kutubxonasiz, faqat Canvas 2D. Header balandligi motivatsiya
   matniga, umumiy balandlik kontentga moslashadi (bo'sh joy qolmaydi). */
const WD_SITE_URL = 'https://www.worddrop-app.uz';
const WD_SITE_LABEL = 'worddrop-app.uz';

function wdRoundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}
/* hex -> rgba(...) — yumshoq fon/border uchun */
function wdHexA(hex,a){
  const h=String(hex).replace('#','');
  const n=h.length===3 ? h.split('').map(c=>c+c).join('') : h;
  const v=parseInt(n,16);
  return `rgba(${(v>>16)&255},${(v>>8)&255},${v&255},${a})`;
}
/* Kichik pill/chip — sana, teg va h.k. uchun */
function wdChip(ctx,{x,y,h=26,text,font,fg,bg,border=null,padX=12,align='left'}){
  ctx.font=font;
  const tw=ctx.measureText(text).width;
  const w=tw+padX*2;
  const cx = align==='right' ? x-w : align==='center' ? x-w/2 : x;
  ctx.fillStyle=bg; wdRoundRect(ctx,cx,y,w,h,h/2); ctx.fill();
  if(border){ ctx.strokeStyle=border; ctx.lineWidth=1; wdRoundRect(ctx,cx,y,w,h,h/2); ctx.stroke(); }
  ctx.fillStyle=fg; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(text,cx+padX,y+h/2+0.5);
  return {x:cx,w,h};
}
/* Matnni maxWidth ichiga sig'diradi (kerak bo'lsa uch nuqta bilan qisqartiradi) */
function wdWrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean);
  const lines=[]; let line='';
  for(const w of words){
    const test=line?line+' '+w:w;
    if(ctx.measureText(test).width>maxWidth && line){ lines.push(line); line=w; }
    else line=test;
  }
  if(line) lines.push(line);
  const lim=maxLines||lines.length;
  const out=lines.slice(0,lim);
  if(lines.length>lim && out.length){
    let last=out[out.length-1];
    while(last.length>1 && ctx.measureText(last+'…').width>maxWidth) last=last.slice(0,-1);
    out[out.length-1]=last+'…';
  }
  out.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));
  return out.length;
}
/* WordDrop tomchi logotipi */
function wdDropPath(ctx,cx,cy,scale,color){
  ctx.save();
  ctx.translate(cx,cy); ctx.scale(scale,scale); ctx.translate(-12,-12);
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(12,3);
  ctx.bezierCurveTo(16,8,19,12,19,15.5);
  ctx.bezierCurveTo(19,19.5,15.5,22,12,22);
  ctx.bezierCurveTo(8.5,22,5,19.5,5,15.5);
  ctx.bezierCurveTo(5,12,8,8,12,3);
  ctx.fill();
  ctx.restore();
}
/* Kichik uchburchak/chiziqcha — streak holati uchun (▲▼—) */
function wdTriPath(ctx,cx,cy,size,dir,color){
  ctx.fillStyle=color;
  if(dir==='flat'){ wdRoundRect(ctx,cx-size,cy-1.5,size*2,3,1.5); ctx.fill(); return; }
  ctx.beginPath();
  if(dir==='up'){ ctx.moveTo(cx,cy-size); ctx.lineTo(cx+size,cy+size); ctx.lineTo(cx-size,cy+size); }
  else { ctx.moveTo(cx,cy+size); ctx.lineTo(cx+size,cy-size); ctx.lineTo(cx-size,cy-size); }
  ctx.closePath(); ctx.fill();
}
/* App ichidagi BADGE ikonalarining soddalashtirilgan Canvas nusxasi —
   xuddi shu gradient ranglar bilan (bolt/books/calendar/diamond/flame/trophy).
   Chizish 0..40 koordinata makonida, so'ng size/40 nisbatida masshtablanadi. */
function wdBadgeIcon(ctx,key,x,y,size){
  ctx.save();
  ctx.translate(x,y);
  const s=size/40; ctx.scale(s,s);
  const lg=(x1,y1,x2,y2,c1,c2)=>{ const g=ctx.createLinearGradient(x1,y1,x2,y2); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; };
  if(key==='bolt'){
    ctx.fillStyle=lg(10,5,22,35,'#FCD34D','#F59E0B');
    ctx.beginPath(); ctx.moveTo(22,5); ctx.lineTo(10,22); ctx.lineTo(18,22); ctx.lineTo(16,35); ctx.lineTo(28,18); ctx.lineTo(20,18); ctx.closePath(); ctx.fill();
  } else if(key==='books'){
    ctx.fillStyle=lg(8,10,17,32,'#34D399','#059669'); wdRoundRect(ctx,8,10,9,22,2); ctx.fill();
    ctx.fillStyle='#10B981'; wdRoundRect(ctx,19,7,9,25,2); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(11,15); ctx.lineTo(14,15); ctx.moveTo(22,12); ctx.lineTo(25,12); ctx.stroke();
  } else if(key==='calendar'){
    ctx.fillStyle=lg(8,10,32,32,'#F472B6','#DB2777'); wdRoundRect(ctx,8,10,24,22,4); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(8,16); ctx.lineTo(32,16); ctx.stroke();
    ctx.strokeStyle='#DB2777'; ctx.lineWidth=2.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(14,7); ctx.lineTo(14,12); ctx.moveTo(26,7); ctx.lineTo(26,12); ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(16,23,2,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(24,23,2,0,7); ctx.fill();
  } else if(key==='diamond'){
    ctx.fillStyle=lg(6,8,34,32,'#67E8F9','#0891B2');
    ctx.beginPath(); ctx.moveTo(12,8); ctx.lineTo(28,8); ctx.lineTo(34,16); ctx.lineTo(20,32); ctx.lineTo(6,16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.65)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(6,16); ctx.lineTo(34,16); ctx.moveTo(20,32); ctx.lineTo(16,16); ctx.moveTo(20,32); ctx.lineTo(24,16); ctx.stroke();
  } else if(key==='flame'){
    ctx.fillStyle=lg(20,6,20,28,'#FB923C','#EA580C');
    ctx.beginPath();
    ctx.moveTo(20,6);
    ctx.bezierCurveTo(17,11,12,14,12,20);
    ctx.bezierCurveTo(12,24.5,15.5,28,20,28);
    ctx.bezierCurveTo(24.5,28,28,24.5,28,20);
    ctx.bezierCurveTo(28,17.5,27,15.5,25.5,13.5);
    ctx.bezierCurveTo(25.8,16.5,23.5,18,22,17);
    ctx.bezierCurveTo(23.5,13,21.5,9.5,20,6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#FFEDD5';
    ctx.beginPath();
    ctx.moveTo(20,20); ctx.bezierCurveTo(18.5,22,17.5,23.5,17.5,25.5);
    ctx.bezierCurveTo(17.5,26.9,18.6,28,20,28); ctx.bezierCurveTo(21.4,28,22.5,26.9,22.5,25.5);
    ctx.bezierCurveTo(22.5,23.5,21.5,22,20,20); ctx.closePath(); ctx.fill();
  } else if(key==='trophy'){
    ctx.fillStyle=lg(13,8,27,22,'#FBBF24','#D97706');
    wdRoundRect(ctx,13,8,14,10,2); ctx.fill();
    ctx.beginPath(); ctx.arc(20,17.5,7,0,Math.PI,false); ctx.fill();
    ctx.strokeStyle='#D97706'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(10.5,12,3,Math.PI*0.3,Math.PI*1.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(29.5,12,3,Math.PI*1.45,Math.PI*2.7); ctx.stroke();
    ctx.fillStyle='#D97706';
    wdRoundRect(ctx,18.5,24,3,6,1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14,35); ctx.lineTo(15,29); ctx.lineTo(25,29); ctx.lineTo(26,35); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function wdBuildWeeklyReportCanvas(report){
  const mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const W=900;
  let H=1400;
  const cv=mk(W,H), ctx=cv.getContext('2d');

  /* ---------- App bilan bir xil shrift — faqat Inter (app.html <head>dagi bilan bir xil) ---------- */
  const F=(w,s)=>`${w} ${s}px "Inter",-apple-system,BlinkMacSystemFont,sans-serif`;
  const track=(px)=>{ try{ ctx.letterSpacing=px; }catch(e){} };

  /* ---------- App'ning haqiqiy :root token'lari (app.html'dagi bilan bir xil) ---------- */
  const BG='#F6F8FC', SUR='#FFFFFF', LINE='#E5E9F2';
  const INK9='#12172B', INK7='#31384F', INK5='#6B7488', INK3='#A6ADBC';
  const B9='#0B2E8A', B7='#1B4FCB', B6='#2F6FED', B5='#4C87FF', B1='#E8F0FF', B0='#F4F8FF';
  const OK='#1FAE6B', OK_BG='#E7F8EF', BAD='#E4484E', BAD_BG='#FCEAEB';
  const RL=22;
  const shadowOn=(blur=20,dy=8,a=.07)=>{ ctx.shadowColor=`rgba(18,23,43,${a})`; ctx.shadowBlur=blur; ctx.shadowOffsetY=dy; };
  const shadowOff=()=>{ ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0; };
  const card=(x,y,w,h,r=RL)=>{ shadowOn(); ctx.fillStyle=SUR; wdRoundRect(ctx,x,y,w,h,r); ctx.fill(); shadowOff();
    ctx.strokeStyle=LINE; ctx.lineWidth=1.5; wdRoundRect(ctx,x,y,w,h,r); ctx.stroke(); };

  const num=v=>{ const x=Number(v); return isFinite(x)?x:0; };
  const r={
    week_start:report&&report.week_start, week_end:report&&report.week_end,
    motivation_text:(report&&report.motivation_text)||'',
    motivation_key:(report&&report.motivation_key)||'okay',
    xp_gained:num(report&&report.xp_gained),
    words_learned:num(report&&report.words_learned),
    active_days:Math.max(0,Math.min(7,num(report&&report.active_days))),
    perfect_levels:num(report&&report.perfect_levels),
    streak_at_end:num(report&&report.streak_at_end),
    streak_status:(report&&report.streak_status)||'flat'
  };
  const fmtD=(d)=>{ try{ return new Date(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'}); }catch(e){ return String(d||''); } };

  const MOTIV_ICON={excellent:'diamond',good:'trophy',okay:'bolt',inactive:'calendar'}[r.motivation_key]||'bolt';
  const MOTIV_LBL={excellent:'Ajoyib hafta',good:'Yaxshi hafta',okay:'Barqaror hafta',inactive:'Tinch hafta'}[r.motivation_key]||'Hafta yakuni';
  const MOTIV_TINT={excellent:'#E0F7FA',good:OK_BG,okay:B1,inactive:'#FFE8D9'}[r.motivation_key] || B1;

  const streakColor = r.streak_status==='up'?OK:(r.streak_status==='down'||r.streak_status==='broken')?BAD:INK5;
  const streakBg     = r.streak_status==='up'?OK_BG:(r.streak_status==='down'||r.streak_status==='broken')?BAD_BG:'#EEF0F5';
  const streakDir     = r.streak_status==='up'?'up':(r.streak_status==='down'||r.streak_status==='broken')?'down':'flat';
  const streakWord = r.streak_status==='up'?'Oshdi':r.streak_status==='down'?'Pasaydi':r.streak_status==='broken'?'Uzildi':'Barqaror';

  /* ---------- Fon — app'ning o'zidagi kabi tekis och-ko'k (--bg), teksturasiz ---------- */
  ctx.fillStyle=BG; ctx.fillRect(0,0,W,H);

  const M=32;                 // sahifa chekkasi (app ekranidagi 20px'ga mos, kattalashtirilgan)
  const CW=W-M*2;             // kontent kengligi

  /* ---------- HERO: brend banneri — sHERO gradienti splash ekrani bilan bir xil oilada ---------- */
  let y=M;
  const heroH=172;
  const hg=ctx.createLinearGradient(M,y,M+CW,y+heroH);
  hg.addColorStop(0,'#4C87FF'); hg.addColorStop(.55,'#3878F2'); hg.addColorStop(1,B7);
  shadowOn(28,12,.16);
  ctx.fillStyle=hg; wdRoundRect(ctx,M,y,CW,heroH,RL); ctx.fill();
  shadowOff();
  // yumshoq porlash — splash ekranidagi nur bilan bir uslubda
  ctx.save(); wdRoundRect(ctx,M,y,CW,heroH,RL); ctx.clip();
  const beam=ctx.createRadialGradient(M+CW*0.82,y-30,10,M+CW*0.82,y-30,260);
  beam.addColorStop(0,'rgba(255,255,255,.35)'); beam.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=beam; ctx.fillRect(M,y,CW,heroH);
  ctx.restore();

  ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,255,255,.16)'; wdRoundRect(ctx,M+24,y+24,56,56,17); ctx.fill();
  wdDropPath(ctx,M+52,y+52,1.65,'#fff');
  ctx.fillStyle='#fff'; ctx.font=F(800,25); track('-0.4px'); ctx.textAlign='left';
  ctx.fillText('WordDrop',M+96,y+42); track('0px');
  ctx.fillStyle='rgba(255,255,255,.82)'; ctx.font=F(500,14);
  ctx.fillText('Haftalik hisobot',M+96,y+68);

  wdChip(ctx,{x:M+CW-24,y:y+24,h:34,text:`${fmtD(r.week_start)} – ${fmtD(r.week_end)}`,
    font:F(700,13.5),fg:'#fff',bg:'rgba(255,255,255,.16)',border:'rgba(255,255,255,.28)',padX:15,align:'right'});

  ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(M+24,y+112); ctx.lineTo(M+CW-24,y+112); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font=F(800,34); track('-0.6px');
  ctx.fillText('+'+r.xp_gained+' XP',M+24,y+142); track('0px');
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=F(600,13.5); ctx.textAlign='right';
  ctx.fillText(`${r.active_days}/7 kun faol`,M+CW-24,y+142);
  ctx.textAlign='left';

  /* ---------- MOTIVATSIYA KARTASI — renderWeeklyReportCard bilan bir xil tuzilish ---------- */
  y+=heroH+16;
  ctx.font=F(600,17);
  const mLineH=25;
  const mLines=wdWrapText(ctx,r.motivation_text||'Yangi hafta — yangi imkoniyat.',-9999,-9999,CW-116,mLineH,3);
  const motivH=Math.max(96,40+mLines*mLineH+30);
  card(M,y,CW,motivH);
  ctx.fillStyle=MOTIV_TINT; wdRoundRect(ctx,M+20,y+(motivH-60)/2,60,60,18); ctx.fill();
  wdBadgeIcon(ctx,MOTIV_ICON,M+20+10,y+(motivH-60)/2+10,40);
  ctx.fillStyle=INK5; ctx.font=F(700,12); ctx.textBaseline='alphabetic';
  ctx.fillText(MOTIV_LBL.toUpperCase(),M+96,y+31);
  ctx.fillStyle=INK7; ctx.font=F(600,17);
  wdWrapText(ctx,r.motivation_text||'Yangi hafta — yangi imkoniyat.',M+96,y+54,CW-116,mLineH,3);

  /* ---------- STAT GRID — app ichidagi 6 ta stat-card bilan AYNAN bir xil (ikonka/label/tartib) ---------- */
  y+=motivH+16;
  const gap=16, cw=(CW-gap*2)/3, ch=150;
  const drawStat=(x,yy,{icon,tint,value,label,valueColor})=>{
    card(x,yy,cw,ch);
    ctx.fillStyle=tint; wdRoundRect(ctx,x+cw/2-26,yy+18,52,52,16); ctx.fill();
    wdBadgeIcon(ctx,icon,x+cw/2-18,yy+26,36);
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=valueColor||INK9; ctx.font=F(800,30); track('-0.4px');
    let vs=30, vt=String(value);
    while(ctx.measureText(vt).width>cw-24 && vs>16){ vs-=3; ctx.font=F(800,vs); }
    ctx.fillText(vt,x+cw/2,yy+108); track('0px');
    ctx.fillStyle=INK5; ctx.font=F(600,13);
    ctx.fillText(label,x+cw/2,yy+130);
    ctx.textAlign='left';
  };
  drawStat(M,           y, {icon:'bolt',    tint:'#FEF3C7', value:'+'+r.xp_gained,        label:'XP'});
  drawStat(M+cw+gap,     y, {icon:'books',   tint:OK_BG,      value:r.words_learned,        label:"So'z"});
  drawStat(M+2*(cw+gap), y, {icon:'calendar',tint:B1,         value:r.active_days+'/7',     label:'Faol kun'});
  y+=ch+gap;
  drawStat(M,           y, {icon:'diamond', tint:'#E0F7FA', value:r.perfect_levels,       label:'Mukammal'});
  drawStat(M+cw+gap,     y, {icon:'flame',   tint:'#FFE8D9', value:r.streak_at_end,         label:'Streak'});
  // Holat kartasi — ikonka o'rniga rangli status uchburchagi
  (()=>{
    const x=M+2*(cw+gap);
    card(x,y,cw,ch);
    ctx.fillStyle=streakBg; wdRoundRect(ctx,x+cw/2-26,y+18,52,52,16); ctx.fill();
    wdTriPath(ctx,x+cw/2,y+44,10,streakDir,streakColor);
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=streakColor; ctx.font=F(800,22);
    ctx.fillText(streakWord,x+cw/2,y+104);
    ctx.fillStyle=INK5; ctx.font=F(600,13);
    ctx.fillText('Holat',x+cw/2,y+130);
    ctx.textAlign='left';
  })();

  /* ---------- FOOTER — app'ning asosiy CTA tugmasi bilan bir xil (pill, var(--b6)) ---------- */
  y+=ch+24;
  const fh=96;
  H=y+fh+M;
  const fg=ctx.createLinearGradient(M,y,M+CW,y+fh);
  fg.addColorStop(0,B6); fg.addColorStop(1,B7);
  shadowOn(22,10,.18);
  ctx.fillStyle=fg; wdRoundRect(ctx,M,y,CW,fh,fh/2); ctx.fill();
  shadowOff();
  ctx.textBaseline='middle'; ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,.18)'; wdRoundRect(ctx,M+22,y+fh/2-24,48,48,15); ctx.fill();
  wdDropPath(ctx,M+46,y+fh/2,1.4,'#fff');
  ctx.fillStyle='#fff'; ctx.font=F(700,18);
  ctx.fillText("So'zni tomchilatishda davom eting",M+88,y+fh/2-11);
  ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=F(500,14);
  ctx.fillText(WD_SITE_LABEL,M+88,y+fh/2+15);

  if(H<1400){
    const out=mk(W,H), octx=out.getContext('2d');
    octx.drawImage(cv,0,0);
    return out;
  }
  return cv;
}

/* Ijtimoiy tarmoqqa ulashsa bo'ladigan brendlangan PNG — yuklab olish */
function wdDownloadWeeklyReportImage(report){
  try{
    const cv=wdBuildWeeklyReportCanvas(report);
    const fname=`worddrop-hisobot-${(report&&report.week_start)||'hafta'}.png`;
    const save=(href,revoke)=>{
      const a=document.createElement('a');
      a.href=href; a.download=fname; a.rel='noopener';
      document.body.appendChild(a); a.click(); a.remove();
      if(revoke) setTimeout(()=>URL.revokeObjectURL(href),4000);
    };
    if(cv.toBlob){
      cv.toBlob(blob=>{
        if(blob) save(URL.createObjectURL(blob),true);
        else save(cv.toDataURL('image/png'),false);
      },'image/png');
    }else{
      save(cv.toDataURL('image/png'),false);
    }
  }catch(e){
    console.error('[WeeklyReport] rasm xatosi:',e);
    try{ showToast("Rasm yaratib bo'lmadi",IC.info); }catch(_){}
  }
}

/* ================= FIKR-MULOHAZA (wd_feedback) =================
   Foydalanuvchi 1-5 yulduz baho va fikr qoldiradi; admin javob yozadi;
   javob shu oynada ko'rinadi. Jadval: wd_feedback (wd_feedback.sql). */
window.__wdFbReplyNew=false;

async function fbLoad(){
  try{
    try{ await window.__sbReady; }catch(e){}
    const sb=window.__sb, u=window.__sbUser;
    if(!sb||!u) return {err:'net'};
    const {data,error}=await sb.from('wd_feedback')
      .select('rating,message,reply,replied_at,reply_seen').eq('user_id',u.id).maybeSingle();
    if(error){
      const m=String(error.message||'');
      if(/relation|does not exist|schema/i.test(m)) return {err:'table'};
      return {err:'net'};
    }
    return {row:data||null};
  }catch(e){ return {err:'net'}; }
}

async function fbSave(rating,message,pub){
  try{
    try{ await window.__sbReady; }catch(e){}
    const sb=window.__sb, u=window.__sbUser;
    if(!sb||!u) return {ok:false,err:'net'};
    const row={
      user_id:u.id,
      name:((window.__wdName&&window.__wdName.trim())||'Foydalanuvchi').slice(0,24),
      rating:Math.max(1,Math.min(5,Number(rating)||5)),
      message:String(message||'').slice(0,600),
      is_public:(pub!==false),      // shubhali matn -> admin ko'rib chiqguncha yashirin
      app_version:'v104',
      updated_at:new Date().toISOString()
    };
    const {error}=await sb.from('wd_feedback').upsert(row,{onConflict:'user_id'});
    if(error){
      const m=String(error.message||'');
      if(/relation|does not exist|schema/i.test(m)) return {ok:false,err:'table'};
      return {ok:false,err:'net'};
    }
    return {ok:true};
  }catch(e){ return {ok:false,err:'net'}; }
}

/* Javobni "ko'rildi" deb belgilash */
async function fbMarkSeen(){
  try{
    const sb=window.__sb, u=window.__sbUser; if(!sb||!u) return;
    await sb.from('wd_feedback').update({reply_seen:true}).eq('user_id',u.id);
    window.__wdFbReplyNew=false;
  }catch(e){}
}

/* Ilova ochilganda: admin javob berganmi — tekshiramiz (belgi uchun) */
async function fbCheckReply(){
  const r=await fbLoad();
  if(r&&r.row&&r.row.reply&&!r.row.reply_seen){
    window.__wdFbReplyNew=true;
    try{ showToast("Fikringizga javob keldi",IC.bell); }catch(e){}
  }
}
setTimeout(()=>{ try{ fbCheckReply(); }catch(e){} }, 6000);

/* ================= FIKRLAR SAHIFASI (to'liq ekran) ================= */
/* Yarim oyna emas — alohida sahifa: fikrlar ko'p bo'lsa ham qotib qolmaydi. */

/* ---- Qo'pol so'zlar filtri ----
   Fikrlar ommaviy ko'rinadi, shuning uchun so'kinish yuborilmaydi.
   Harflar almashtirilishini ham hisobga olamiz (a->@, o->0, i->1 ...). */
/* ---- Qo'pol so'zlar filtri ----
   IKKI QATLAMLI:
   1) QAT'IY (BAD_HARD) — ma'nosi bir xil, chalkashlik yo'q -> darhol rad etiladi.
   2) SHUBHALI (BAD_SOFT) — so'zning o'zi qisqa va boshqa tilda oddiy so'z
      bo'lishi mumkin ("am" ingliz tilida "I am ..."). Bularni ko'r-ko'rona
      bloklamaymiz: kontekstga qaraymiz. Ingliz gapida bo'lsa — o'tkazamiz,
      o'zbekcha kontekstda yoki qo'shimchali shaklda bo'lsa — rad etamiz. */
const FB_BAD_HARD=[
  // ingliz
  'fuck','fuk','fck','shit','bitch','cunt','pussy','whore','slut','dick',
  'asshole','bastard','nigger','nigga','motherfuck','wanker','twat','prick',
  // o'zbek — qo'shimchali/aniq shakllar (chalkashmaydi)
  'sikaman','sikay','sikish','sikib','sikkan','sikdim','sikamiz','sikvoraman',
  'qotoq','qutoq','kotoq','kutoq','jalab','jalap','ambop','pashshaxur',
  'amini','amingni','aminga','amiga','amidan','amimni','ammul',
  'omini','omingni','ominga','omiga','omidan',
  'kotini','kotingni','kotiga','onangni','otangni','buynami','buyinami'
];
/* Qisqa va ko'p ma'noli — faqat kontekst bilan */
const FB_BAD_SOFT=['am','om','sik','kot','kut','qot'];
/* Ingliz kontekst belgilari: shular bo'lsa "am" oddiy fe'l hisoblanadi */
const EN_HINT=/\b(i|you|we|they|he|she|it|who|what|that|this|really|so|very|not|just|now|here|going|glad|happy|sure|still|also|already|the|and|but|with|for|from|have|has|will|would|can|could)\b/;
const EN_AM=/\b(i|you|we|they|who|what|that|and|but|so|now|still|also|really|just)\s+am\b|\bam\s+(a|an|the|not|so|very|really|too|going|glad|happy|sure|here|now|still|from|with|in|on|at|your|my)\b/;

function fbNormalize(s){
  return String(s||'').toLowerCase()
    .replace(/[\u2018\u2019\u02bb\u02bc']/g,'')
    .replace(/[@]/g,'a').replace(/[0]/g,'o')
    .replace(/[1!|]/g,'i').replace(/[3]/g,'e').replace(/[$5]/g,'s')
    .replace(/[4]/g,'a').replace(/[7]/g,'t')
    .replace(/[^a-z\u0400-\u04ff ]+/g,' ')
    .replace(/\s+/g,' ').trim();
}

/* Natija: 'ok' | 'bad' (rad etiladi) | 'review' (yuboriladi, lekin ommaga
   chiqmaydi — admin ko'rib chiqadi). */
function fbCheck(text){
  const n=fbNormalize(text);
  if(!n) return 'ok';
  const words=n.split(' ');

  // 1-qatlam: qat'iy
  for(const w of words){
    for(const b of FB_BAD_HARD){
      if(w===b || (b.length>=4 && w.indexOf(b)>=0)) return 'bad';
    }
  }
  // Bo'shliq/nuqta bilan yozilgan holat: "f u c k", "F.U.C.K"
  const glued=n.replace(/ /g,'');
  for(const b of FB_BAD_HARD){ if(b.length>=4 && glued.indexOf(b)>=0) return 'bad'; }

  // 2-qatlam: shubhali so'zlar — kontekstga qaraymiz
  const hasSoft=words.some(w=>FB_BAD_SOFT.indexOf(w)>=0);
  if(hasSoft){
    const isEnglish=EN_HINT.test(n);
    // "I am happy", "you am"... — ingliz fe'li: o'tkazamiz
    if((words.indexOf('am')>=0) && (EN_AM.test(n) || isEnglish)) {
      // faqat 'am' shubhali bo'lsa — toza
      const others=words.filter(w=>FB_BAD_SOFT.indexOf(w)>=0 && w!=='am');
      if(!others.length) return 'ok';
    }
    // Boshqa holatlarda — bloklamaymiz, lekin ADMIN KO'RIB CHIQADI
    return 'review';
  }
  return 'ok';
}
/* Eski nom — moslik uchun */
function fbHasBad(t){ return fbCheck(t)==='bad'; }

/* ---- 3 kunlik cheklov ---- */
async function fbCanPost(){
  try{
    try{ await window.__sbReady; }catch(e){}
    const sb=window.__sb; if(!sb) return {can_post:true,has_row:false};
    const {data,error}=await sb.rpc('wd_feedback_can_post');
    if(error||!data) return {can_post:true,has_row:false};
    return data;
  }catch(e){ return {can_post:true,has_row:false}; }
}
function fbWaitText(h){
  h=Number(h)||0;
  if(h>=24){ const d=Math.ceil(h/24); return d+' kundan keyin'; }
  if(h>1) return h+' soatdan keyin';
  return 'tez orada';
}

const FB_LABELS={1:'Yomon',2:'O\u2019rtacha',3:'Yaxshi',4:'Juda yaxshi',5:'Ajoyib'};

/* Baho — yulduzlar */
const FB_STAR='<svg viewBox="0 0 24 24"><path d="M12 2.6l2.85 6.06 6.65.83-4.9 4.6 1.28 6.6L12 17.5 6.12 20.7l1.28-6.6-4.9-4.6 6.65-.83Z"/></svg>';
function fbSegs(n,interactive){
  let h='<div class="fbx-segs'+(interactive?' act':'')+'">';
  for(let i=1;i<=5;i++){
    h+=`<button type="button" class="fbx-seg${i<=n?' on':''}" data-v="${i}" ${interactive?'':'disabled'}>${FB_STAR}</button>`;
  }
  return h+'</div>';
}
/* Ro'yxatdagi kichik yulduzlar */
function fbMiniBar(n){
  let h='<span class="fbx-mini">';
  for(let i=1;i<=5;i++) h+=`<i class="${i<=n?'on':''}">${FB_STAR}</i>`;
  return h+'</span>';
}

async function fbPublic(){
  try{
    try{ await window.__sbReady; }catch(e){}
    const sb=window.__sb; if(!sb) return [];
    const {data,error}=await sb.rpc('wd_feedback_public',{lim:60});
    if(error||!Array.isArray(data)) return [];
    return data;
  }catch(e){ return []; }
}

function fbCard(r){
  const ttl=(r.title_id && typeof ACHIEVEMENTS!=='undefined' && ACHIEVEMENTS[r.title_id])
    ? titleChip(r.title_id) : '';
  const d=r.created_at?new Date(r.created_at).toLocaleDateString('uz-UZ',{day:'numeric',month:'short'}):'';
  return `<div class="fbx-card">
    <div class="fbx-card-h">
      <b>${escapeHtml(r.name||'Foydalanuvchi')}</b>${ttl}
      <small>${d}</small>
    </div>
    ${fbMiniBar(r.rating)}
    <p>${escapeHtml(r.message||'')}</p>
    ${r.reply?`<div class="fbx-reply">
      <div class="fbx-reply-h"><span class="fbx-badge">WordDrop</span></div>
      <p>${escapeHtml(r.reply)}</p></div>`:''}
  </div>`;
}

/* ---- To'liq ekran ---- */
let FBX=null;
function fbxClose(){
  if(!FBX) return;
  FBX.classList.remove('show');
  setTimeout(()=>{ if(FBX && !FBX.classList.contains('show')){ FBX.remove(); FBX=null; } },320);
}

async function openFeedbackSheet(){
  if(FBX) return;
  FBX=document.createElement('div');
  FBX.className='fbx';
  FBX.innerHTML=`
    <div class="fbx-top">
      <button class="fbx-back" id="fbxBack" aria-label="Orqaga">${IC.chevL||IC.chevR}</button>
      <div class="fbx-ttl">Fikrlar</div>
    </div>
    <div class="fbx-body" id="fbxBody">
      <div class="fbx-load"><i></i><i></i><i></i></div>
    </div>`;
  document.body.appendChild(FBX);
  requestAnimationFrame(()=>FBX.classList.add('show'));
  FBX.querySelector('#fbxBack').addEventListener('click',fbxClose);

  const [res,pub,cp]=await Promise.all([fbLoad(),fbPublic(),fbCanPost()]);
  const body=FBX?FBX.querySelector('#fbxBody'):null;
  if(!body) return;

  if(res.err){
    body.innerHTML=`<div class="fbx-empty">${res.err==='table'
      ?'Xizmat vaqtincha mavjud emas. Birozdan keyin urinib ko\u2019ring.'
      :'Ulanishda xatolik. Internetni tekshiring.'}</div>`;
    return;
  }

  const row=res.row;
  let rating=row?row.rating:0;

  const locked = !!(row && cp && cp.has_row && cp.can_post===false);

  function draw(){
    // Fikr yuborilgan va 3 kun to'lmagan — faqat ko'rish rejimi
    const formHtml = locked ? `
      <div class="fbx-form">
        <h2>Fikringiz yuborildi</h2>
        <p class="fbx-sub">Keyingi fikrni ${fbWaitText(cp.hours_left)} qoldirishingiz mumkin</p>
        <div class="fbx-mine">
          ${fbSegs(row.rating,false)}
          ${row.message?`<p class="fbx-mine-msg">${escapeHtml(row.message)}</p>`:''}
          <div class="fbx-lock">${IC.lock||''}Fikr o\u2019zgartirilmaydi</div>
        </div>
        ${row.reply?`<div class="fbx-reply mine">
          <div class="fbx-reply-h"><span class="fbx-badge">WordDrop</span><small>sizga javob berdi</small></div>
          <p>${escapeHtml(row.reply)}</p></div>`:''}
      </div>` : `
      <div class="fbx-form">
        <h2>${row?'Yangi fikr':'Ilova sizga qanday?'}</h2>
        <p class="fbx-sub">${row?'Oldingi fikringiz yangisi bilan almashadi'
                               :'Bahoni tanlang va bir necha so\u2019z yozing'}</p>
        ${fbSegs(rating,true)}
        <div class="fbx-lbl" id="fbxLbl">${rating?FB_LABELS[rating]:'&nbsp;'}</div>
        <textarea class="fbx-ta" id="fbxMsg" maxlength="600" rows="4"
          placeholder="Nima yoqdi, nima yetishmadi?"></textarea>
        <div class="fbx-note">Yuborilgandan keyin 3 kun davomida o\u2019zgartirib bo\u2019lmaydi</div>
        <div class="fbx-err" id="fbxErr"></div>
        <button class="btn btn-primary btn-block" id="fbxGo">Yuborish</button>
        ${row&&row.reply?`<div class="fbx-reply mine">
          <div class="fbx-reply-h"><span class="fbx-badge">WordDrop</span><small>sizga javob berdi</small></div>
          <p>${escapeHtml(row.reply)}</p></div>`:''}
      </div>`;
    body.innerHTML=formHtml.replace('__X__','')
      + (pub.length?`<div class="fbx-sep"><span>Boshqalar nima deydi</span><b>${pub.length}</b></div>
        <div class="fbx-list">${pub.map(fbCard).join('')}</div>`
       :`<div class="fbx-empty sm">Hozircha boshqa fikrlar yo\u2019q \u2014 birinchi bo\u2019ling</div>`)
      + '<div style="height:28px"></div>';

    if(locked) return;    // qulf holatida tugma yo'q
    const lbl=body.querySelector('#fbxLbl');
    body.querySelectorAll('.fbx-seg').forEach(b=>b.addEventListener('click',()=>{
      rating=Number(b.dataset.v);
      body.querySelectorAll('.fbx-seg').forEach(x=>x.classList.toggle('on',Number(x.dataset.v)<=rating));
      if(lbl) lbl.textContent=FB_LABELS[rating]||'';
      try{ playS&&playS('tap'); }catch(e){}
    }));

    const go=body.querySelector('#fbxGo'), err=body.querySelector('#fbxErr');
    go.addEventListener('click',async()=>{
      if(!rating){ err.textContent='Bahoni tanlang'; return; }
      const msg=body.querySelector('#fbxMsg').value;
      const verdict=fbCheck(msg);
      if(verdict==='bad'){
        err.textContent='Fikrda qo\u2019pol so\u2019zlar bor \u2014 iltimos hurmat bilan yozing';
        return;
      }
      go.disabled=true; go.textContent='Yuborilmoqda\u2026';
      const r=await fbSave(rating,msg,verdict!=='review');
      if(!r.ok){
        err.textContent = /FB_TOO_SOON/.test(String(r.err||'')) ? 'Hali erta \u2014 3 kundan keyin urinib ko\u2019ring'
          : r.err==='table' ? 'Xizmat vaqtincha mavjud emas'
          : 'Yuborilmadi. Internetni tekshiring';
        go.disabled=false; go.textContent=row?'Saqlash':'Yuborish';
        return;
      }
      try{ fireConfetti(); }catch(e){}
      body.innerHTML=`<div class="fbx-done">
        <div class="fbx-done-ic"><svg viewBox="0 0 24 24"><path d="M20 6 L9 17 L4 12"/></svg></div>
        <h2>Rahmat!</h2>
        <p class="fbx-sub">${verdict==='review'
          ?'Fikringiz saqlandi. Tekshiruvdan o\u2019tgach ro\u2019yxatda ko\u2019rinadi.'
          :'Fikringiz saqlandi. Javob berilsa shu yerda ko\u2019rasiz.'}</p>
        <button class="btn btn-primary btn-block" id="fbxDone" style="margin-top:20px">Yopish</button>
      </div>`;
      const c=body.querySelector('#fbxDone');
      if(c) c.addEventListener('click',fbxClose);
    });
  }
  draw();

  if(row&&row.reply&&!row.reply_seen){ fbMarkSeen(); try{ renderProfile&&renderProfile(); }catch(e){} }
}

function openAboutSheet(){
  // Rasmiy domen. Havolalar shu yerdan boshqariladi.
  const SITE='https://www.worddrop-app.uz';
  const old=document.getElementById('aboutPg'); if(old) old.remove();
  const sv=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I={
    back:sv('<path d="M15 5l-7 7 7 7"/>'),
    words:sv('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13"/>'),
    ai:sv('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>'),
    duel:sv('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/>'),
    exam:sv('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'),
    voice:sv('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>'),
    shield:sv('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    free:sv('<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>'),
    lang:sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    real:sv('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
    globe:sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    help:sv('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5h.01"/>'),
    doc:sv('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
    lock:sv('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    tg:sv('<path d="m21.5 3.5-19 7.3 6 2.2 2.2 6.5 3.4-4.3 4.9 3.6z"/><path d="m8.5 13 13-9.5"/>'),
    mail:sv('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
    ch:sv('<path d="M9 6l6 6-6 6"/>')
  };
  const row=(ic,t,d)=>`<div class="ap-row"><div class="ic">${ic}</div><div class="tx"><b>${t}</b><span>${d}</span></div></div>`;
  const link=(href,ic,t,d)=>`<a class="ap-row" href="${href}" target="_blank" rel="noopener noreferrer"><div class="ic">${ic}</div><div class="tx"><b>${t}</b>${d?`<span>${d}</span>`:''}</div><div class="ch">${I.ch}</div></a>`;
  const pg=document.createElement('div'); pg.id='aboutPg'; pg.setAttribute('role','dialog'); pg.setAttribute('aria-modal','true'); pg.setAttribute('aria-labelledby','apTitle');
  pg.innerHTML=`
    <div class="ap-top"><button id="apBack" aria-label="Orqaga">${I.back}</button><b id="apTitle">WordDrop haqida</b></div>
    <div class="ap-body"><div class="ap-col">
      <div class="ap-head">
        <div class="ap-logo" aria-hidden="true"><b>W</b></div>
        <div><h1>WordDrop</h1><p>Ingliz tilini kundalik odatga aylantiruvchi ta'lim ilovasi</p><span class="ap-ver">Versiya 1.13 · 2026</span></div>
      </div>

      <div class="ap-sec">Ilova haqida</div>
      <div class="ap-text">
        <p>WordDrop — o'zbek tilida so'zlashuvchi o'quvchilar uchun ishlab chiqilgan ingliz tili ilovasi. Uning maqsadi — tilni qisqa, muntazam va natijasi ko'rinadigan mashg'ulotlar orqali o'rgatish.</p>
        <p>Ilova lug'at boyligi, grammatik shablonlar, tinglab tushunish va nutq ko'nikmalarini bitta muhitda birlashtiradi. Mashg'ulotlar foydalanuvchining darajasi va maqsadiga moslashadi.</p>
      </div>

      <div class="ap-sec">Asosiy imkoniyatlar</div>
      <div class="ap-list">
        ${row(I.words,"So'zlar va shablonlar","Mavzular bo'yicha lug'at, oraliqli takrorlash va 80 ta nutq shabloni")}
        ${row(I.ai,'Drop AI yordamchi',"Ilova, o'rganish usullari va motivatsiya bo'yicha savollarga javob beradi")}
        ${row(I.duel,'Jonli duel',"Boshqa o'quvchi yoki Drop bot bilan real vaqtdagi bellashuv")}
        ${row(I.exam,'IELTS mashq markazi',"Listening, Reading, Writing va Speaking bo'limlari bo'yicha mashqlar")}
        ${row(I.voice,'Talaffuz',"Nutqni aniqlash orqali talaffuzni tekshirish")}
      </div>

      <div class="ap-sec">Tamoyillarimiz</div>
      <div class="ap-list">
        ${row(I.real,'Haqiqiy natija',"Progress, ball va statistika faqat foydalanuvchining haqiqiy faoliyatiga asoslanadi")}
        ${row(I.free,'Bepul foydalanish',"Ilovaning barcha imkoniyatlari bepul, reklama va yashirin to'lovlar yo'q")}
        ${row(I.shield,"Ma'lumotlar himoyasi","Shaxsiy ma'lumotlar faqat ilova ishlashi uchun ishlatiladi. Batafsil — Maxfiylik siyosatida")}
        ${row(I.lang,"O'zbek tilida","Barcha izoh va ko'rsatmalar o'zbek tilida, mahalliy o'quvchi ehtiyojiga mos")}
      </div>

      <div class="ap-sec">Hujjatlar va aloqa</div>
      <div class="ap-list">
        ${link(SITE,I.globe,'Rasmiy sayt','worddrop-app.uz')}
        ${link(SITE+'/faq.html',I.help,"Yordam markazi","Ko'p beriladigan savollar")}
        ${link(SITE+'/privacy.html',I.lock,'Maxfiylik siyosati','')}
        ${link(SITE+'/terms.html',I.doc,'Foydalanish shartlari','')}
        ${link('https://t.me/worddrop_uz',I.tg,'Telegram kanal','@worddrop_uz')}
        ${link('mailto:hello@worddrop-app.uz',I.mail,'Elektron pochta','hello@worddrop-app.uz')}
      </div>

      <div class="ap-foot"><b>WordDrop Studio</b><br>Muallif: Bexruz Yo'ldoshev<br>© 2026 WordDrop. Barcha huquqlar himoyalangan.</div>
    </div></div>`;
  document.body.appendChild(pg);
  requestAnimationFrame(()=>pg.classList.add('on'));
  try{ history.pushState({wdAbout:true},'','#about'); }catch(e){}
  let gone=false;
  const hide=()=>{ if(gone) return; gone=true; window.removeEventListener('popstate',onPop); document.removeEventListener('keydown',esc); pg.classList.remove('on'); setTimeout(()=>pg.remove(),320); };
  const onPop=()=>hide();
  window.addEventListener('popstate',onPop);
  pg.querySelector('#apBack').addEventListener('click',()=>{ try{ if(history.state&&history.state.wdAbout){ history.back(); return; } }catch(e){} hide(); });
  const esc=e=>{ if(e.key==='Escape'&&!gone){ document.removeEventListener('keydown',esc); pg.querySelector('#apBack').click(); } };
  document.addEventListener('keydown',esc);
}
function updateProfileStats(){
  const e=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  e('stLvl',completedLevels.size);
  e('stWords',window.__wdTotalLearned||0);
  e('stStreak',window.__wdStreak||0);
}
renderProfile();
