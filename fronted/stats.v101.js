/* =====================================================================
   WordDrop v101 — Admin statistika paneli
   Ma'lumot: RPC wd_admin_stats(days) (faqat admin). Grafiklar qo'lda
   chizilgan SVG: bitta asosiy rang (ko'k), kulrang to'r, hover tooltip,
   har grafik ostida «Jadval» ko'rinishi.
   ===================================================================== */
(function(){
'use strict';
if(window.WDStats) return;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>{ n=Number(n)||0; return n>=10000?(n/1000).toFixed(n>=100000?0:1).replace('.0','')+'k':n.toLocaleString('ru-RU').replace(/ /g,' '); };
const MON=['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
const dlabel=d=>{ const x=new Date(d+'T00:00:00'); return x.getDate()+' '+MON[x.getMonth()]; };
const METRICS=[
  {k:'dau',t:'Faol foydalanuvchilar',s:'kunlik, kamida bitta harakat'},
  {k:'new_users',t:'Yangi foydalanuvchilar',s:'birinchi faol kuni'},
  {k:'signups',t:"Ro'yxatdan o'tganlar",s:'email hisobi yaratilgan'},
  {k:'ai',t:"Drop AI so'rovlari",s:'kunlik jami'},
  {k:'events',t:'Progress hodisalari',s:'dars, takror, XP'},
  {k:'views',t:'Sayt sahifalari',s:"ko'rishlar soni"},
];
const CSS=`
.stz{position:fixed;inset:0;z-index:3600;background:var(--bg,#F6F8FC);color:var(--i9,#12172B);display:flex;flex-direction:column;font-family:inherit;
  --s-1:#2a78d6;--s-1a:rgba(42,120,214,.14);--grid:rgba(18,23,43,.08);--ink2:var(--i5,#5E6678);--card:var(--sur,#fff);--ln:var(--line,#E5E9F2);--good:#1a8a4f;--bad:#c4382f}
body.dark .stz{--s-1:#3987e5;--s-1a:rgba(57,135,229,.2);--grid:rgba(255,255,255,.08)}
.stz *{box-sizing:border-box}
.st-top{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 10px;border-bottom:1px solid var(--ln);background:var(--card)}
.st-x{width:40px;height:40px;border:none;border-radius:12px;background:transparent;color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer}
.st-x svg{width:22px;height:22px}
.st-h{flex:1;min-width:0}.st-h b{display:block;font-size:17px}.st-h small{color:var(--ink2);font-size:12.5px}
.st-seg{display:flex;background:var(--bg,#F1F4F9);border:1px solid var(--ln);border-radius:11px;padding:3px}
.st-seg button{border:none;background:transparent;color:var(--ink2);font:inherit;font-size:13px;font-weight:600;padding:6px 10px;border-radius:8px;cursor:pointer}
.st-seg button.on{background:var(--card);color:var(--i9,#12172B);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.st-body{flex:1;overflow-y:auto;padding:16px 14px 40px}
.st-in{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.st-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.st-k{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:13px 14px;min-width:0}
.st-k span{display:block;font-size:12.5px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.st-k b{display:block;font-size:26px;line-height:1.15;margin-top:4px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.st-k em{display:block;font-style:normal;font-size:12px;margin-top:3px;color:var(--ink2);font-variant-numeric:tabular-nums}
.st-k em.up{color:var(--good)}.st-k em.dn{color:var(--bad)}
.st-card{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:16px}
.st-ch{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.st-ch h3{margin:0;font-size:15.5px}.st-ch p{margin:2px 0 0;font-size:12.5px;color:var(--ink2)}
.st-sel{font:inherit;font-size:13px;padding:7px 10px;border-radius:10px;border:1px solid var(--ln);background:var(--card);color:inherit}
.st-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.st-svg{display:block;width:100%;height:auto;overflow:visible}
.st-svg text{font-size:11px;fill:var(--ink2);font-family:inherit}
.st-tip{position:fixed;pointer-events:none;z-index:3700;background:var(--i9,#12172B);color:var(--bg,#fff);font-size:12.5px;line-height:1.4;padding:7px 10px;border-radius:9px;transform:translate(-50%,calc(-100% - 10px));white-space:nowrap;opacity:0;transition:opacity .1s}
.st-tip.on{opacity:1}
.st-tbl{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.st-tbl th{text-align:left;font-weight:600;color:var(--ink2);padding:7px 6px;border-bottom:1px solid var(--ln)}
.st-tbl td{padding:7px 6px;border-bottom:1px solid var(--ln)}
.st-tbl td.n,.st-tbl th.n{text-align:right}
.st-more{margin-top:8px}.st-more summary{cursor:pointer;font-size:12.5px;color:var(--ink2)}
.st-fun{display:flex;flex-direction:column;gap:9px}
.st-fr{display:grid;grid-template-columns:150px 1fr 74px;gap:10px;align-items:center;font-size:13.5px}
.st-fr .bar{height:22px;border-radius:0 4px 4px 0;background:var(--s-1);min-width:2px}
.st-fr .tr{height:22px;background:var(--s-1a);border-radius:0 4px 4px 0;position:relative}
.st-fr .tr .bar{position:absolute;left:0;top:0;bottom:0}
.st-fr .v{text-align:right;font-variant-numeric:tabular-nums}.st-fr .v small{display:block;color:var(--ink2);font-size:11.5px}
.st-heat{display:grid;gap:3px;font-size:12.5px;font-variant-numeric:tabular-nums}
.st-heat div{padding:8px 6px;border-radius:6px;text-align:center}
.st-heat .h{background:none;color:var(--ink2);text-align:left;padding-left:0}
.st-feat{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.st-f{border:1px solid var(--ln);border-radius:12px;padding:11px 12px}
.st-f span{display:block;font-size:12px;color:var(--ink2)}.st-f b{font-size:20px;font-variant-numeric:tabular-nums}
.st-f small{display:block;font-size:11.5px;color:var(--ink2)}
.st-err{padding:30px 10px;text-align:center;color:var(--ink2)}
.st-err button{margin-top:12px;border:1px solid var(--ln);background:var(--card);color:inherit;font:inherit;padding:9px 16px;border-radius:10px;cursor:pointer}
.st-sk{height:110px;border-radius:14px;background:linear-gradient(90deg,var(--ln),transparent,var(--ln));background-size:200% 100%;animation:stsk 1.2s linear infinite}
@keyframes stsk{to{background-position:-200% 0}}
@media (max-width:760px){.st-kpis{grid-template-columns:repeat(2,1fr)}.st-grid2{grid-template-columns:1fr}.st-feat{grid-template-columns:repeat(2,1fr)}.st-fr{grid-template-columns:110px 1fr 64px}.st-h small{display:none}}
@media (prefers-reduced-motion:reduce){.st-sk{animation:none}}
button:focus-visible,select:focus-visible{outline:2px solid var(--s-1);outline-offset:2px}
`;
const IX='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
let EL=null, TIP=null, DAYS=30, DATA=null, METRIC='dau';
function css(){ if(document.getElementById('stCss')) return; const s=document.createElement('style'); s.id='stCss'; s.textContent=CSS; document.head.appendChild(s); }
function tip(html,x,y){ if(!TIP){ TIP=document.createElement('div'); TIP.className='st-tip'; document.body.appendChild(TIP); } if(html==null){ TIP.classList.remove('on'); return; } TIP.innerHTML=html; TIP.style.left=x+'px'; TIP.style.top=y+'px'; TIP.classList.add('on'); }
function close(){ if(EL){ EL.remove(); EL=null; } tip(null); if(location.hash==='#stats') history.replaceState(null,'',location.pathname+location.search); }

function open(){
  css(); close();
  EL=document.createElement('div'); EL.className='stz'; EL.setAttribute('role','dialog'); EL.setAttribute('aria-label','Statistika');
  EL.innerHTML=`<div class="st-top"><button class="st-x" id="stX" aria-label="Yopish">${IX}</button>
    <div class="st-h"><b>Statistika</b><small id="stGen">Yuklanmoqda…</small></div>
    <div class="st-seg" role="group" aria-label="Davr">${[7,30,90].map(d=>`<button data-d="${d}" class="${d===DAYS?'on':''}">${d} kun</button>`).join('')}</div></div>
    <div class="st-body"><div class="st-in" id="stIn">${'<div class="st-sk"></div>'.repeat(4)}</div></div>`;
  document.body.appendChild(EL);
  EL.querySelector('#stX').onclick=close;
  EL.querySelectorAll('.st-seg button').forEach(b=>b.onclick=()=>{ DAYS=Number(b.dataset.d); EL.querySelectorAll('.st-seg button').forEach(x=>x.classList.toggle('on',x===b)); load(); });
  EL.querySelector('.st-body').addEventListener('scroll',()=>tip(null),{passive:true});
  load();
}
async function load(){
  const box=EL&&EL.querySelector('#stIn'); if(!box) return;
  try{
    const {data,error}=await window.__sb.rpc('wd_admin_stats',{days:DAYS});
    if(error) throw error;
    DATA=data; render();
  }catch(e){
    const forb=/forbidden|42501/.test(String(e&&(e.message||e.code)||''));
    box.innerHTML=`<div class="st-err">${forb?"Bu bo'lim faqat admin hisobida ochiladi.":"Statistika yuklanmadi. Internetni tekshiring."}<br><button id="stRetry">Qayta urinish</button></div>`;
    box.querySelector('#stRetry').onclick=load;
  }
}
function delta(cur,prev,label){
  if(prev==null) return '';
  if(!prev&&!cur) return `<em>${label}: 0</em>`;
  const d=cur-prev; const cls=d>0?'up':d<0?'dn':'';
  return `<em class="${cls}">${d>0?'▲':d<0?'▼':'•'} ${Math.abs(d)} ${label}</em>`;
}
function render(){
  const D=DATA, K=D.kpi, box=EL.querySelector('#stIn');
  EL.querySelector('#stGen').textContent=(()=>{ const t=new Date(D.generated_at); return 'Yangilandi: '+t.getDate()+' '+MON[t.getMonth()]+', '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'); })();
  const kp=[
    ['Bugun faol',K.dau,delta(K.dau,K.dau_prev,'kechagiga nisbatan')],
    ['7 kunda faol',K.wau,delta(K.wau,K.wau_prev,'oldingi haftaga')],
    ['30 kunda faol',K.mau,`<em>${K.users?Math.round(K.mau/K.users*100):0}% barcha foydalanuvchidan</em>`],
    ['Yangi (7 kun)',K.new7,delta(K.new7,K.new7_prev,'oldingi haftaga')],
    ['Jami foydalanuvchi',K.users,`<em>${fmt(K.accounts)} hisobli · ${fmt(K.guests)} mehmon</em>`],
    ['Pro faol',K.pro,`<em>${K.pro_paid} to'lagan · ${fmt(K.stars)} ⭐ jami</em>`],
    ["O'rganilgan so'zlar",K.words,`<em>${fmt(K.xp)} XP yig'ilgan</em>`],
    ['Telegram',K.tg,`<em>${K.tg_linked} ulangan · ${K.groups} guruh</em>`],
  ];
  box.innerHTML=`
    <div class="st-kpis">${kp.map(k=>`<div class="st-k"><span>${k[0]}</span><b>${fmt(k[1])}</b>${k[2]}</div>`).join('')}</div>
    <div class="st-card"><div class="st-ch"><div><h3 id="stMt"></h3><p id="stMs"></p></div>
      <select class="st-sel" id="stMetric" aria-label="Ko'rsatkich">${METRICS.map(m=>`<option value="${m.k}" ${m.k===METRIC?'selected':''}>${m.t}</option>`).join('')}</select></div>
      <div id="stLine"></div><details class="st-more"><summary>Jadval ko'rinishi</summary><div id="stLineT"></div></details></div>
    <div class="st-grid2">
      <div class="st-card"><div class="st-ch"><div><h3>Voronka</h3><p>So'nggi ${D.days} kun · har bosqich oldingisiga nisbatan</p></div></div><div id="stFun"></div></div>
      <div class="st-card"><div class="st-ch"><div><h3>Qaytish (haftalik kogortalar)</h3><p>Birinchi faol haftasidan keyin qaytganlar ulushi</p></div></div><div id="stCoh"></div></div>
    </div>
    <div class="st-grid2">
      <div class="st-card"><div class="st-ch"><div><h3>Ingliz tili darajalari</h3><p>Profildagi daraja · ${(D.cefr||{})['—']||0} kishida belgilanmagan · test ${D.placement.total} marta</p></div></div><div id="stCefr"></div></div>
      <div class="st-card"><div class="st-ch"><div><h3>O'rganilgan so'zlar bo'yicha</h3><p>Foydalanuvchilar soni</p></div></div><div id="stWords"></div></div>
    </div>
    <div class="st-card"><div class="st-ch"><div><h3>Imkoniyatlardan foydalanish</h3><p>Qaysi bo'limlar ishlatilyapti</p></div></div>
      <div class="st-feat">${[
        ["Drop AI (30 kun)",D.features.ai30,`${D.features.ai_users30} foydalanuvchi`],
        ['Multilevel urinishlari',D.features.ml_attempts,`${D.features.ml_users} kishi · ${D.features.ml_tests} tayyor test`],
        ['Daraja testi',D.placement.total,`ilova ${D.placement.app} · bot ${D.placement.bot}`],
        ["Do'st taklifi",D.features.referrals,'bonus berilgan'],
        ['Kunlik musobaqa',D.features.daily_results,'natija'],
        ['Fikrlar',D.features.feedback,'izoh va baho'],
        ['Pro (Stars, 30 kun)',K.stars30,'⭐ tushum'],
        ['Telegram ulangan',K.tg_linked,`${K.tg} faol chat`],
      ].map(f=>`<div class="st-f"><span>${f[0]}</span><b>${fmt(f[1])}</b><small>${f[2]}</small></div>`).join('')}</div></div>
    <div class="st-card"><div class="st-ch"><div><h3>Eng faol o'quvchilar</h3><p>XP bo'yicha top 10</p></div></div>
      <div style="overflow-x:auto"><table class="st-tbl"><thead><tr><th>#</th><th>Ism</th><th class="n">XP</th><th class="n">So'z</th><th class="n">Seriya</th><th>Daraja</th><th>Oxirgi kun</th></tr></thead>
      <tbody>${(D.top||[]).map((t,i)=>`<tr><td>${i+1}</td><td>${esc(t.name)}</td><td class="n">${fmt(t.xp)}</td><td class="n">${fmt(t.words)}</td><td class="n">${t.streak}</td><td>${esc(t.cefr||'—')}</td><td>${t.last?dlabel(t.last):'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  box.querySelector('#stMetric').onchange=e=>{ METRIC=e.target.value; line(); };
  line(); funnel(); cohorts(); bars('#stCefr',['A1','A2','B1','B2','C1','C2'].map(l=>({b:l,n:(D.cefr||{})[l]||0}))); bars('#stWords',D.words_hist||[]);
}

/* ── Chiziqli grafik: bitta ko'rsatkich, crosshair + tooltip ── */
function line(){
  const S=DATA.series||[], m=METRICS.find(x=>x.k===METRIC);
  EL.querySelector('#stMt').textContent=m.t;
  const tot=S.reduce((a,r)=>a+(Number(r[METRIC])||0),0);
  EL.querySelector('#stMs').textContent=`${m.s} · ${DATA.days} kunda jami ${fmt(tot)}`;
  const host=EL.querySelector('#stLine'); const W=Math.max(320,host.clientWidth||700), H=230, L=34, R=10, T=12, B=26;
  const vals=S.map(r=>Number(r[METRIC])||0); const max=Math.max(1,...vals);
  const step=niceStep(max); const top=Math.ceil(max/step)*step;
  const x=i=>L+(S.length<2?0:i*(W-L-R)/(S.length-1)), y=v=>T+(H-T-B)*(1-v/top);
  let g=''; for(let v=0;v<=top;v+=step){ g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)" stroke-width="1"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text>`; }
  const every=Math.ceil(S.length/(W<480?4:7));
  S.forEach((r,i)=>{ if((i%every===0&&S.length-1-i>=every)||i===S.length-1) g+=`<text x="${x(i)}" y="${H-6}" text-anchor="${i===0?'start':i===S.length-1?'end':'middle'}">${dlabel(r.day)}</text>`; });
  const pts=vals.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area=`M${x(0)},${y(0)} L${pts.split(' ').join(' L')} L${x(vals.length-1)},${y(0)} Z`;
  host.innerHTML=`<svg class="st-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(m.t)}: ${DATA.days} kunlik grafik">${g}
    <path d="${area}" fill="var(--s-1a)"/><polyline points="${pts}" fill="none" stroke="var(--s-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <line id="stCx" y1="${T}" y2="${H-B}" stroke="var(--ink2)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
    <circle id="stDot" r="4.5" fill="var(--s-1)" stroke="var(--card)" stroke-width="2" opacity="0"/>
    <rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent" id="stHit"/></svg>`;
  const svg=host.querySelector('svg'), hit=host.querySelector('#stHit'), cx=host.querySelector('#stCx'), dot=host.querySelector('#stDot');
  const move=ev=>{ const p=ev.touches?ev.touches[0]:ev; const r=svg.getBoundingClientRect(); const px=(p.clientX-r.left)*W/r.width;
    const i=Math.max(0,Math.min(S.length-1,Math.round((px-L)/((W-L-R)/Math.max(1,S.length-1)))));
    cx.setAttribute('x1',x(i)); cx.setAttribute('x2',x(i)); cx.setAttribute('opacity','.6'); dot.setAttribute('cx',x(i)); dot.setAttribute('cy',y(vals[i])); dot.setAttribute('opacity','1');
    tip(`<b>${dlabel(S[i].day)}</b> · ${esc(m.t)}: <b>${fmt(vals[i])}</b>`, r.left+x(i)*r.width/W, r.top+y(vals[i])*r.height/H); };
  const out=()=>{ cx.setAttribute('opacity','0'); dot.setAttribute('opacity','0'); tip(null); };
  hit.addEventListener('mousemove',move); hit.addEventListener('touchstart',move,{passive:true}); hit.addEventListener('touchmove',move,{passive:true}); hit.addEventListener('mouseleave',out); hit.addEventListener('touchend',()=>setTimeout(out,1200));
  EL.querySelector('#stLineT').innerHTML=`<table class="st-tbl"><thead><tr><th>Kun</th><th class="n">${esc(m.t)}</th></tr></thead><tbody>${S.slice().reverse().map(r=>`<tr><td>${dlabel(r.day)}</td><td class="n">${fmt(r[METRIC])}</td></tr>`).join('')}</tbody></table>`;
}
function niceStep(max){ const raw=max/4; const p=Math.pow(10,Math.floor(Math.log10(Math.max(1,raw)))); const n=raw/p; return Math.max(1,(n<=1?1:n<=2?2:n<=5?5:10)*p); }

/* ── Voronka: gorizontal ustunlar, oldingi bosqichga nisbatan % ── */
function funnel(){
  let F=(DATA.funnel||[]).slice(); while(F.length&&!F[0].n) F.shift();   // bo'sh boshlang'ich bosqichlarni tashlaymiz
  const max=Math.max(1,...F.map(f=>f.n));
  EL.querySelector('#stFun').innerHTML=F.length?`<div class="st-fun">${F.map((f,i)=>{ const prev=i?F[i-1].n:0; const pc=i&&prev?Math.round(f.n/prev*100):null;
    return `<div class="st-fr" title="${esc(f.label)}: ${f.n}"><span>${esc(f.label)}</span><div class="tr"><div class="bar" style="width:${f.n/max*100}%"></div></div><div class="v"><b>${fmt(f.n)}</b>${pc!=null?`<small>${pc}%</small>`:''}</div></div>`; }).join('')}</div>`
    :`<div class="st-err">Hali ma'lumot yo'q</div>`;
}
/* ── Kogorta jadvali: bitta rangdagi intensivlik ── */
function cohorts(){
  const C=DATA.cohorts||[]; const host=EL.querySelector('#stCoh');
  if(!C.length){ host.innerHTML=`<div class="st-err">Hali ma'lumot yo'q</div>`; return; }
  const cell=v=>{ const a=v==null?0:Math.max(.06,v/100); const dark=v>=55; return `<div style="background:rgba(42,120,214,${a.toFixed(2)});color:${dark?'#fff':'inherit'}">${v==null?'—':v+'%'}</div>`; };
  const d0=new Date(DATA.today+'T00:00:00');
  host.innerHTML=`<div class="st-heat" style="grid-template-columns:minmax(92px,1.3fr) .7fr repeat(4,1fr)">
    <div class="h">Hafta</div><div class="h">Soni</div>${[1,2,3,4].map(w=>`<div class="h" style="text-align:center">+${w}</div>`).join('')}
    ${C.map(c=>{ const wk=new Date(c.wk+'T00:00:00'); const age=Math.floor((d0-wk)/(7*864e5));
      return `<div class="h">${dlabel(c.wk)}</div><div class="h">${c.size}</div>${[1,2,3,4].map(w=>w<=age?cell(c['w'+w]):'<div class="h" style="text-align:center">·</div>').join('')}`; }).join('')}</div>
    <p style="font-size:12px;color:var(--ink2);margin:10px 0 0">«·» — bu hafta hali kelmagan. Kichik kogortalarda foiz keskin o'zgaradi.</p>`;
}
/* ── Vertikal ustunlar (bitta rang) ── */
function bars(sel,rows){
  const host=EL.querySelector(sel); const W=Math.max(300,host.clientWidth||460), H=190, L=8, R=8, T=18, B=24;
  const max=Math.max(1,...rows.map(r=>r.n)); const n=rows.length; const bw=Math.min(54,(W-L-R)/n-8);
  let s=`<line x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}" stroke="var(--grid)" stroke-width="1"/>`;
  rows.forEach((r,i)=>{ const cx=L+(i+.5)*(W-L-R)/n; const h=(H-T-B)*r.n/max; const y=H-B-h;
    s+=`<g class="st-b" data-t="${esc(r.b)}: ${r.n}">${h>0?`<path d="M${cx-bw/2},${H-B} V${y+4} q0,-4 4,-4 h${bw-8} q4,0 4,4 V${H-B} Z" fill="var(--s-1)"/>`:''}
      <rect x="${cx-bw/2-4}" y="${T}" width="${bw+8}" height="${H-T-B}" fill="transparent"/>
      <text x="${cx}" y="${y-5}" text-anchor="middle" style="fill:var(--i9,#12172B);font-weight:600">${r.n}</text>
      <text x="${cx}" y="${H-7}" text-anchor="middle">${esc(r.b.length>8&&W<420?r.b.slice(0,6)+'…':r.b)}</text></g>`; });
  host.innerHTML=`<svg class="st-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(rows.map(r=>r.b+' '+r.n).join(', '))}">${s}</svg>`;
  host.querySelectorAll('.st-b').forEach(g=>{ g.addEventListener('mousemove',e=>tip(esc(g.dataset.t),e.clientX,e.clientY)); g.addEventListener('mouseleave',()=>tip(null)); });
}
let rz=null; window.addEventListener('resize',()=>{ if(!EL||!DATA) return; clearTimeout(rz); rz=setTimeout(()=>{ line(); bars('#stCefr',['A1','A2','B1','B2','C1','C2'].map(l=>({b:l,n:(DATA.cefr||{})[l]||0}))); bars('#stWords',DATA.words_hist||[]); },150); });
window.WDStats={open,close};
})();
