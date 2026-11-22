/* =====================================================================
   WordDrop v101 — Multilevel (CEFR) sinov imtihoni
   ---------------------------------------------------------------------
   Alohida fayl: ilova uni faqat Multilevel ochilganda yuklaydi.
   Format: Listening 6 qism / 35 savol (~35 daq + 10 daq tekshirish),
           Reading 5 qism / 35 savol / 60 daq,
           Writing Task 1.1 + 1.2 + Part 2 / 60 daq,
           Speaking Part 1.1, 1.2, 2, 3 (~15 daq).
   Ballar 75 lik shkalada, daraja — to'rt bo'lim o'rtachasi
   (B1 38–50, B2 51–64, C1 65–75). Natija taxminiy, rasmiy emas.
   ===================================================================== */
(function(){
'use strict';
if(window.WDML) return;
const SB_URL='https://jgeycbyaoiybpudakgmk.supabase.co';
const SB_KEY='sb_publishable_b_6vafUIGzOO9xJmFv2t9g_sQD3kQ1J';
const ML_URL=SB_URL+'/functions/v1/ml-exam';
const LS_RUN='wd_ml_run_v1';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(r,s)=>r.querySelector(s), $$=(r,s)=>[...r.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const toast=(m)=>{ try{ window.showToast?showToast(m,(window.IC&&IC.info)||''):alert(m); }catch(e){ console.log(m); } };
const fmt=s=>{ s=Math.max(0,Math.ceil(s)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(x).padStart(2,'0'); };
const LET='ABCDEFGHIJ';
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;

/* ---------- ballar ---------- */
const RAW75=[[0,0],[10,38],[18,51],[28,65],[35,75]];
function raw75(n){ for(let i=1;i<RAW75.length;i++){ const [a,b]=RAW75[i-1],[c,d]=RAW75[i]; if(n<=c) return Math.round(b+(d-b)*(n-a)/(c-a)); } return 75; }
const lvl=s=>s>=65?'C1':s>=51?'B2':s>=38?'B1':'B1 dan past';
const NUMW={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100};
function nrm(s){ return String(s||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim().split(' ').map(w=>NUMW[w]!=null?String(NUMW[w]):w).join(' '); }
const same=(u,a)=>!!nrm(u)&&nrm(u)===nrm(a);

/* ---------- tarmoq ---------- */
async function token(){ try{ await window.__sbReady; }catch(e){} try{ const {data}=await window.__sb.auth.getSession(); return data&&data.session?data.session.access_token:null; }catch(e){ return null; } }
async function mlApi(payload,ms){
  const tk=await token(); const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),ms||60000);
  try{
    const r=await fetch(ML_URL,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json',apikey:SB_KEY,Authorization:'Bearer '+(tk||SB_KEY)},body:JSON.stringify(payload)});
    clearTimeout(t); const j=await r.json().catch(()=>null);
    if(!r.ok||!j) return {__error:true,msg:(j&&j.error)||'Server javob bermadi',pro:j&&j.pro};
    return j;
  }catch(e){ clearTimeout(t); return {__error:true,msg:e&&e.name==='AbortError'?'Javob kechikdi':'Internet aloqasini tekshiring'}; }
}
const sb=()=>window.__sb;
async function uid(){ try{ const {data}=await sb().auth.getUser(); return data&&data.user?data.user.id:null; }catch(e){ return null; } }

/* ---------- ovoz ---------- */
let AC=null;
function ac(){ if(!AC){ const C=window.AudioContext||window.webkitAudioContext; AC=C?new C():null; } if(AC&&AC.state==='suspended') AC.resume().catch(()=>{}); return AC; }
function chime(){ const a=ac(); if(!a) return; const t=a.currentTime; [[880,0],[1320,.16]].forEach(([f,d])=>{ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0,t+d); g.gain.linearRampToValueAtTime(.22,t+d+.02); g.gain.exponentialRampToValueAtTime(.001,t+d+.7); o.connect(g).connect(a.destination); o.start(t+d); o.stop(t+d+.75); }); }
let CUR=null, VOL=1, audioRun=0, cancelPlayback=null;
function stopAudio(){
  audioRun++;
  if(cancelPlayback) cancelPlayback();
  try{ if(SS) SS.cancel(); }catch(e){}
}
function playUrl(url,audio=new Audio()){
  return new Promise(resolve=>{
    let timeout;
    const watch=()=>{
      clearTimeout(timeout);
      timeout=setTimeout(()=>finish(false),12000);
    };
    const finish=ok=>{
      if(cancelPlayback!==cancel) return;
      clearTimeout(timeout);
      audio.onended=audio.onerror=audio.ontimeupdate=null;
      CUR=null;
      cancelPlayback=null;
      if(!ok) audio.pause();
      resolve(ok);
    };
    const cancel=()=>finish(false);
    CUR=audio;
    cancelPlayback=cancel;
    audio.volume=VOL;
    audio.onended=()=>finish(true);
    audio.onerror=()=>finish(false);
    audio.ontimeupdate=watch;
    watch();
    audio.src=url;
    audio.play().catch(()=>finish(false));
  });
}
/* Speaking savollari uchun qurilma ovozi. */
const SS=('speechSynthesis' in window)?window.speechSynthesis:null;
const FEM=/female|woman|samantha|victoria|karen|serena|moira|tessa|fiona|susan|hazel|libby|sonia|jenny|aria|zira|kate|emma|amy|olivia|natasha|catherine/i;
const MAL=/\bmale\b|man\b|daniel|arthur|george|ryan|guy|alex\b|fred|oliver|thomas|david|mark|james|william|rishi|gordon|aaron|lee\b/i;
const VF=['autumn','diana','hannah'], VM=['austin','daniel','troy'];
let VOX=null;
function loadVoices(){
  if(!SS) return Promise.resolve([]);
  const voices=SS.getVoices();
  if(voices.length) return Promise.resolve(voices);
  return new Promise(resolve=>{
    const finish=()=>{
      clearTimeout(timeout);
      SS.removeEventListener('voiceschanged',finish);
      resolve(SS.getVoices());
    };
    const timeout=setTimeout(finish,1800);
    SS.addEventListener('voiceschanged',finish);
  });
}
function voicePlan(voices){
  const all=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));
  const rank=v=>(/en[-_]GB/i.test(v.lang)?0:/en[-_]US/i.test(v.lang)?1:2)+(v.localService?0:.5);
  const sorted=all.slice().sort((a,b)=>rank(a)-rank(b));
  const fem=sorted.filter(v=>FEM.test(v.name)), mal=sorted.filter(v=>MAL.test(v.name)&&!FEM.test(v.name));
  const plan={all:sorted,fem,mal};
  if(sorted.length) VOX=plan;
  return plan;
}
/* Spiker nomidan (diana, troy...) qurilma ovozi + ohang */
function pickVoice(P,name){
  const f=VF.indexOf(name), m=VM.indexOf(name), female=f>=0||m<0, i=Math.max(f,m,0);
  const pool=female?P.fem:P.mal;
  let voice=pool.length?pool[i%pool.length]:(P.all.length?P.all[(female?0:1)%P.all.length]:null);
  // jinsga ajratib bo'lmasa — ohang (pitch) bilan farqlaymiz
  const pitch=pool.length?1:(female?[1.12,1.2,1.05][i]:[.82,.9,.76][i]);
  return {voice,pitch};
}
function speakOne(text,name,P){
  return new Promise(res=>{
    if(!SS||!window.SpeechSynthesisUtterance||!text){ res(false); return; }
    const u=new SpeechSynthesisUtterance(text); const {voice,pitch}=pickVoice(P,name);
    if(voice) u.voice=voice; u.lang=voice?voice.lang:'en-GB'; u.rate=.93; u.pitch=pitch; u.volume=VOL;
    let fin=false; const end=ok=>{ if(fin) return; fin=true; clearInterval(ka); clearTimeout(to); cancelPlayback=null; res(ok); };
    let started=false;
    u.onstart=()=>{ started=true; };
    u.onend=()=>end(true); u.onerror=()=>end(false);
    // Android'da onend ba'zan kelmaydi — matn uzunligiga qarab xavfsizlik muddati
    const est=(text.split(/\s+/).length*0.48+3)*1000/u.rate;
    const to=setTimeout(()=>{ end(started); SS.cancel(); },est/(window.__mlSpeed||1));
    // Chrome uzun o'qishda ~15 s dan keyin o'zi pauza qiladi — uyg'otib turamiz
    const ka=setInterval(()=>{ try{ if(SS.paused) SS.resume(); }catch(e){} },4000);
    cancelPlayback=()=>end(false);
    try{ SS.speak(u); }catch(e){ end(false); }
  });
}
async function playSegs(segs,run=audioRun){
  if(!segs?.length) return false;
  const P=VOX||voicePlan(SS?SS.getVoices():[]);
  for(const [index,segment] of segs.entries()){
    if(index) await sleep(250);
    if(run!==audioRun||ABORT||!(await speakOne(segment.t,segment.v,P))) return false;
  }
  return run===audioRun;
}
function unlockAudio(){
  try{ ac(); }catch(e){}
  if(SS&&!VOX) loadVoices().then(voicePlan).catch(()=>{});
}
/* Bitta audio elementi foydalanuvchi bosishidan keyin butun Listening bo'ylab ishlatiladi. */
function listeningAudioPrompt(sh,signal,play,{sample=false}={}){
  return new Promise(resolve=>{
    const box=document.createElement('div');
    box.className='mlx-snd';
    box.innerHTML=`<div class="mlx-snd-in" role="dialog" aria-modal="true" aria-labelledby="sndTitle">
      <b id="sndTitle">${sample?'Ovozni tekshiring':'Yozuvni qayta eshittiring'}</b>
      <p>${sample?'Quloqchin taqing yoki ovozni balandlating, keyin namunani tinglang.':"Listening yozuvi ijro etilmadi. Shu yozuvni qayta boshlash uchun tugmani bosing."}</p>
      <p role="status" id="sndStatus"></p>
      <div class="mlx-snd-row"><button class="mlx-btn" id="sndPlay">${sample?'▶ Eshittirish':'▶ Qayta eshittirish'}</button><button class="mlx-btn" id="sndExit">Chiqish</button></div>
      <div class="mlx-snd-row" id="sndAsk" hidden><button class="mlx-btn pri" id="sndOk">Eshitdim — boshlash</button><button class="mlx-btn" id="sndNo">Eshitmadim</button></div>
      </div>`;
    const trigger=$(sh.x,'#mlxQ');
    const close=ok=>{
      signal.removeEventListener('abort',abort);
      box.remove();
      resolve(ok);
    };
    const abort=()=>close(false);
    if(signal.aborted){ resolve(false); return; }
    signal.addEventListener('abort',abort,{once:true});
    sh.body.appendChild(box);
    const button=$(box,'#sndPlay'), ask=$(box,'#sndAsk'), status=$(box,'#sndStatus');
    button.disabled=!play;
    if(!play) status.textContent="Bu variantning Listening audio fayllari hali to'liq tayyor emas.";
    button.onclick=async()=>{
      button.disabled=true;
      ask.hidden=true;
      status.textContent='Eshittirilmoqda…';
      const ok=await play();
      if(signal.aborted) return;
      if(ok&&!sample){ close(true); return; }
      button.disabled=false;
      button.textContent='▶ Qayta eshittirish';
      ask.hidden=!ok;
      status.textContent=ok?'':"Yozuv ijro etilmadi. Internet aloqasini tekshirib, qayta urining.";
      if(ok) $(box,'#sndOk').focus();
    };
    $(box,'#sndExit').onclick=()=>trigger.click();
    $(box,'#sndOk').onclick=()=>close(true);
    $(box,'#sndNo').onclick=()=>{
      ask.hidden=true;
      status.textContent="Qurilmaning media ovozi va audio chiqishini tekshirib, qayta eshittiring.";
      button.focus();
    };
    (play?button:$(box,'#sndExit')).focus();
  });
}
function b64blob(b64,type){ const bin=atob(b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new Blob([u],{type}); }
async function playClip(T,key,segs){
  if(ABORT) return false;
  stopAudio();
  const run=audioRun;
  const url=T?.audio?.[key];
  if(url&&await playUrl(url)) return run===audioRun;
  return run===audioRun&&playSegs(segs,run);
}

/* ---------- uslublar ---------- */
const CSS=`
.mlz{position:fixed;inset:0;z-index:3600;background:#F2F4F7;color:#141B24;font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
.mlz *{box-sizing:border-box}
.mlz [hidden]{display:none!important}
/* ovoz tekshiruvi */
.mlx-snd{position:fixed;inset:0;z-index:5;background:rgba(20,27,36,.55);display:flex;align-items:center;justify-content:center;padding:20px}
.mlx-snd-in{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:22px 20px;box-shadow:0 20px 50px rgba(0,0,0,.25)}
.mlx-snd-in b{display:block;font-size:19px;margin-bottom:8px}
.mlx-snd-in p{margin:0 0 14px;font-size:14.5px;line-height:1.5;color:#46505C}
.mlx-snd-row{display:flex;gap:8px;margin-top:10px}
.mlx-btn{flex:1;border:1.5px solid #D9DFE6;background:#fff;color:#141B24;border-radius:12px;padding:13px 14px;font-size:15px;font-weight:700;cursor:pointer}
.mlx-btn.pri{background:#1F2A37;border-color:#1F2A37;color:#fff}
.mlx-btn:disabled{opacity:.6}
.mlx-snd-in p:empty{display:none}
.mlx-snd-tip{background:#FFF7E6;border-radius:10px;padding:10px 12px;font-size:13.5px!important}
.mlz button{font-family:inherit}
.mlz :focus-visible{outline:2px solid #2F6FED;outline-offset:2px}
/* lobby */
.mll-top{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px;background:#fff;border-bottom:1px solid #D9DFE6}
.mll-top b{font-size:15px}
.mll-ib{width:40px;height:40px;border:none;border-radius:10px;background:transparent;color:#141B24;display:flex;align-items:center;justify-content:center;cursor:pointer}
.mll-ib:hover{background:#EEF1F5}.mll-ib svg{width:22px;height:22px}
.mll-sc{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:22px 18px calc(40px + env(safe-area-inset-bottom,0px))}
.mll-in{max-width:760px;margin:0 auto}
.mll-h1{font-size:28px;line-height:1.12;font-weight:800;letter-spacing:-.02em;max-width:18ch}
.mll-p{font-size:15px;line-height:1.55;color:#5E6B7A;margin-top:10px;max-width:58ch}
.mll-h2{font-size:17px;font-weight:700;margin:30px 0 12px}
.mll-fmt{width:100%;border-collapse:collapse;background:#fff;border:1px solid #D9DFE6;border-radius:14px;overflow:hidden;font-size:14px}
.mll-fmt th,.mll-fmt td{padding:12px 14px;text-align:left;border-bottom:1px solid #E6EAF0}
.mll-fmt tr:last-child td{border-bottom:none}
.mll-fmt th{font-size:12px;font-weight:600;color:#5E6B7A;background:#F7F9FB}
.mll-fmt td.n{font-variant-numeric:tabular-nums;white-space:nowrap}
.mll-fmt td b{font-weight:700}
.mll-fmt td small{display:block;color:#5E6B7A;font-size:12.5px;margin-top:2px}
.mll-go{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:20px;border:none;border-radius:14px;background:#1F2A37;color:#fff;font-size:16px;font-weight:700;padding:16px 18px;cursor:pointer}
.mll-go span{font-weight:500;opacity:.75;font-size:13.5px}
.mll-go:disabled{opacity:.55;cursor:default}
.mll-secs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.mll-sec{border:1px solid #D9DFE6;background:#fff;border-radius:12px;padding:12px 10px;text-align:left;cursor:pointer;color:#141B24}
.mll-sec:hover{border-color:#9AA6B4}
.mll-sec b{display:block;font-size:14px}.mll-sec small{font-size:12px;color:#5E6B7A}
.mll-note{font-size:13px;line-height:1.5;color:#5E6B7A;margin-top:12px}
.mll-note a,.mll-link{color:#2F6FED;cursor:pointer;background:none;border:none;padding:0;font-size:inherit;text-decoration:underline}
.mll-card{background:#fff;border:1px solid #D9DFE6;border-radius:14px;padding:16px}
.mll-resume{display:flex;align-items:center;gap:12px;margin-top:18px;border-color:#2F6FED}
.mll-resume div{flex:1}.mll-resume b{display:block;font-size:15px}.mll-resume small{color:#5E6B7A;font-size:13px}
.mll-btn{border:1px solid #D9DFE6;background:#fff;color:#141B24;border-radius:10px;padding:9px 14px;font-size:14px;font-weight:600;cursor:pointer}
.mll-btn.pri{background:#1F2A37;border-color:#1F2A37;color:#fff}
.mll-btn.bad{color:#C62828}
.mll-btn:disabled{opacity:.5;cursor:default}
.mll-hist{display:flex;flex-direction:column;gap:8px}
.mll-hrow{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;background:#fff;border:1px solid #D9DFE6;border-radius:12px;padding:12px 14px;cursor:pointer;text-align:left;color:#141B24;width:100%}
.mll-hrow .d{font-size:13px;color:#5E6B7A}
.mll-hrow .lv{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
.mll-hrow .bars{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.mll-hrow .bars span{font-size:11px;color:#5E6B7A}
.mll-hrow .bars i{display:block;height:5px;border-radius:3px;background:#E6EAF0;margin-top:3px;position:relative;overflow:hidden}
.mll-hrow .bars i::after{content:'';position:absolute;inset:0 auto 0 0;width:var(--w);background:#2F6FED}
.mll-bank{display:flex;flex-direction:column;gap:8px}
.mll-trow{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #D9DFE6;border-radius:12px;padding:10px 12px;flex-wrap:wrap}
.mll-trow .t{flex:1;min-width:150px}.mll-trow .t b{display:block;font-size:14px}.mll-trow .t small{color:#5E6B7A;font-size:12px}
.mll-st{font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:6px;background:#EEF1F5;color:#5E6B7A}
.mll-st.ready{background:#E3F4EA;color:#1E7A4C}.mll-st.draft{background:#FFF3DC;color:#8A5A00}
.mll-gen{margin-top:10px}
.mll-steps{list-style:none;margin:8px 0 0;padding:0;font-size:14px}
.mll-steps li{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #EEF1F5;color:#5E6B7A}
.mll-steps li.on{color:#141B24;font-weight:600}.mll-steps li.ok{color:#1E7A4C}.mll-steps li.err{color:#C62828}
.mll-steps li i{width:18px;text-align:center;font-style:normal}
.mll-prog{height:6px;border-radius:4px;background:#E6EAF0;margin-top:10px;overflow:hidden}.mll-prog i{display:block;height:100%;width:0;background:#2F6FED;transition:width .3s}
/* imtihon qobig'i */
.mlx-bar{display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 8px) 14px 8px;background:#1F2A37;color:#fff;min-height:52px}
.mlx-sec{display:flex;flex-direction:column;line-height:1.15;min-width:0;flex:1}
.mlx-sec b{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mlx-sec small{font-size:12px;color:#AEB8C4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mlx-cand{font-size:12px;color:#AEB8C4;font-variant-numeric:tabular-nums}
.mlx-time{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;padding:5px 10px;border-radius:8px;background:rgba(255,255,255,.08);min-width:76px;text-align:center}
.mlx-time.warn{background:#B45309}.mlx-time.crit{background:#C62828;animation:mlxBlink 1s steps(2) infinite}
@keyframes mlxBlink{50%{opacity:.6}}
@media (prefers-reduced-motion:reduce){.mlx-time.crit{animation:none}}
.mlx-x{border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer}
.mlx-strip{display:flex;align-items:center;gap:12px;padding:8px 16px;background:#E8EDF3;border-bottom:1px solid #D9DFE6;font-size:13.5px;color:#2A3644;min-height:40px}
.mlx-strip .dot{width:8px;height:8px;border-radius:50%;background:#9AA6B4;flex-shrink:0}
.mlx-strip .dot.live{background:#C62828;box-shadow:0 0 0 4px rgba(198,40,40,.18)}
.mlx-strip .grow{flex:1}
.mlx-strip input[type=range]{width:90px}
.mlx-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mlx-wrap{max-width:900px;margin:0 auto;padding:20px 18px 40px}
.mlx-nav{display:flex;align-items:center;gap:8px;padding:8px 10px calc(env(safe-area-inset-bottom,0px) + 8px);background:#fff;border-top:1px solid #D9DFE6}
.mlx-pal{flex:1;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:2px}
.mlx-pal::-webkit-scrollbar{display:none}
.mlx-pal button{flex:0 0 auto;min-width:32px;height:32px;border-radius:7px;border:1px solid #C9D1DB;background:#fff;color:#2A3644;font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;cursor:pointer}
.mlx-pal button.ans{background:#2F6FED;border-color:#2F6FED;color:#fff}
.mlx-pal button.cur{box-shadow:0 0 0 2px #1F2A37}
.mlx-pal .sep{flex:0 0 auto;width:1px;background:#D9DFE6;margin:4px 3px}
.mlx-nb{border:1px solid #C9D1DB;background:#fff;border-radius:8px;height:34px;padding:0 12px;font-size:13.5px;font-weight:600;cursor:pointer;color:#141B24;flex-shrink:0}
.mlx-nb.pri{background:#1F2A37;border-color:#1F2A37;color:#fff}
.mlx-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.mlx-tabs button{border:1px solid #C9D1DB;background:#fff;border-radius:999px;padding:7px 14px;font-size:13.5px;font-weight:600;cursor:pointer;color:#2A3644}
.mlx-tabs button.on{background:#1F2A37;border-color:#1F2A37;color:#fff}
.mlx-part{background:#fff;border:1px solid #D9DFE6;border-radius:12px;padding:18px 18px 8px;margin-bottom:16px}
.mlx-ph{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.mlx-ph b{font-size:17px}.mlx-ph span{font-size:13px;color:#5E6B7A}
.mlx-ins{font-size:14.5px;line-height:1.55;color:#2A3644;margin-bottom:14px;padding:10px 12px;background:#F7F9FB;border-left:3px solid #1F2A37;border-radius:0 8px 8px 0}
.mlx-q{display:flex;gap:10px;padding:10px 0;border-top:1px solid #EEF1F5;scroll-margin-top:12px}
.mlx-q:first-of-type{border-top:none}
.mlx-qn{flex:0 0 30px;height:26px;border-radius:6px;background:#EEF1F5;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.mlx-q.ans .mlx-qn{background:#2F6FED;color:#fff}
.mlx-qb{flex:1;min-width:0;font-size:15px;line-height:1.5}
.mlx-opts{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.mlx-opt{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid #D9DFE6;border-radius:8px;cursor:pointer;background:#fff;font-size:14.5px;line-height:1.4}
.mlx-opt:hover{border-color:#9AA6B4}
.mlx-opt input{margin-top:3px;accent-color:#2F6FED}
.mlx-opt.sel{border-color:#2F6FED;background:#F1F6FF}
.mlx-opt b{flex:0 0 auto;font-weight:700}
.mlx-in{border:1px solid #9AA6B4;border-radius:6px;padding:5px 8px;font-size:15px;width:150px;max-width:100%;font-family:inherit;background:#fff;color:#141B24}
.mlx-in.wide{width:200px}
.mlx-in:focus{border-color:#2F6FED;outline:none;box-shadow:0 0 0 3px rgba(47,111,237,.15)}
.mlx-sel{border:1px solid #9AA6B4;border-radius:6px;padding:5px 8px;font-size:15px;font-family:inherit;background:#fff;color:#141B24}
.mlx-form{border:1px solid #D9DFE6;border-radius:10px;overflow:hidden}
.mlx-form .ft{background:#F7F9FB;padding:10px 12px;font-weight:700;border-bottom:1px solid #D9DFE6}
.mlx-list{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:14.5px;line-height:1.45;padding:10px 12px;background:#F7F9FB;border-radius:8px;margin-bottom:10px}
.mlx-list b{font-weight:700}
.mlx-map{width:100%;max-width:560px;display:block;margin:4px auto 12px;border:1px solid #D9DFE6;border-radius:10px;background:#FBFCF8}
.mlx-pass{font-family:Georgia,'Times New Roman',serif;font-size:16.5px;line-height:1.7;color:#1B2330}
.mlx-pass h3{font-family:'Inter',sans-serif;font-size:17px;margin:0 0 10px}
.mlx-pass p{margin:0 0 12px}
.mlx-pass .pn{font-family:'Inter',sans-serif;font-weight:700;font-size:13px;background:#1F2A37;color:#fff;border-radius:5px;padding:1px 7px;margin-right:6px}
.mlx-gap{display:inline-block;margin:0 2px;vertical-align:baseline}
.mlx-gap .mlx-in{width:120px;padding:2px 6px;font-family:'Inter',sans-serif;font-size:14.5px}
.mlx-gap sup{font-family:'Inter',sans-serif;font-weight:700;font-size:11px;margin-right:2px}
.mlx-split{display:grid;grid-template-columns:1fr;gap:16px}
@media (min-width:980px){.mlx-wrap.wide{max-width:1280px}.mlx-split{grid-template-columns:1.1fr 1fr}.mlx-split>.mlx-pane{max-height:calc(100vh - 210px);overflow-y:auto}}
.mlx-pane{background:#fff;border:1px solid #D9DFE6;border-radius:12px;padding:18px}
.mlx-ad{border:1px solid #D9DFE6;border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:14.5px;line-height:1.5;background:#fff}
.mlx-ad .row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}
.mlx-ad .row b{font-size:13px}
.mlx-w-in{background:#F7F9FB;border:1px solid #D9DFE6;border-radius:10px;padding:14px;font-size:15px;line-height:1.6;margin-bottom:12px;white-space:pre-wrap}
.mlx-w-in small{display:block;color:#5E6B7A;font-size:12.5px;margin-bottom:6px}
.mlx-ta{width:100%;min-height:260px;border:1px solid #9AA6B4;border-radius:10px;padding:14px;font-size:16px;line-height:1.6;font-family:Georgia,serif;resize:vertical;background:#fff;color:#141B24}
.mlx-ta:focus{outline:none;border-color:#2F6FED;box-shadow:0 0 0 3px rgba(47,111,237,.15)}
.mlx-wc{display:flex;justify-content:space-between;font-size:13px;color:#5E6B7A;margin-top:6px;font-variant-numeric:tabular-nums}
.mlx-wc b.ok{color:#1E7A4C}.mlx-wc b.lo{color:#B45309}.mlx-wc b.hi{color:#C62828}
/* speaking */
.mls{max-width:820px;margin:0 auto;padding:22px 18px 40px;text-align:center}
.mls-q{font-size:22px;line-height:1.35;font-weight:700;margin:12px auto 0;max-width:30ch}
.mls-sub{font-size:14px;color:#5E6B7A;margin-top:8px}
.mls-ring{position:relative;width:150px;height:150px;margin:24px auto 8px}
.mls-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.mls-ring .bg{stroke:#E1E6EC}.mls-ring .fg{stroke:#1F2A37;transition:stroke-dashoffset .25s linear}
.mls-ring.rec .fg{stroke:#C62828}
.mls-ring div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.mls-ring b{font-size:30px;font-variant-numeric:tabular-nums}
.mls-ring small{font-size:12px;color:#5E6B7A;font-weight:600}
.mls-lvl{height:6px;max-width:220px;margin:6px auto 0;border-radius:4px;background:#E1E6EC;overflow:hidden}.mls-lvl i{display:block;height:100%;width:0;background:#1E8E5A;transition:width .08s}
.mls-pics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px auto 0;max-width:720px}
.mls-pics.one{grid-template-columns:1fr;max-width:520px}
.mls-pics figure{margin:0;background:#fff;border:1px solid #D9DFE6;border-radius:10px;overflow:hidden}
.mls-pics img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#E8EDF3}
.mls-pics .ph{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;padding:14px;font-size:14px;color:#2A3644;background:#E8EDF3}
.mls-pics figcaption{font-size:10.5px;color:#7A8594;padding:4px 8px;text-align:left}
.mls-qs{text-align:left;max-width:560px;margin:14px auto 0;font-size:15.5px;line-height:1.5}
.mls-qs li{margin:4px 0}
.mls-arg{display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left;max-width:720px;margin:14px auto 0}
.mls-arg>div{background:#fff;border:1px solid #D9DFE6;border-radius:10px;padding:12px}
.mls-arg b{display:block;margin-bottom:6px;font-size:13px}
.mls-arg ul{margin:0;padding-left:18px;font-size:14.5px;line-height:1.5}
.mls-topic{font-size:21px;font-weight:700;line-height:1.35;max-width:32ch;margin:10px auto 0}
.mls-stop{margin-top:10px}
/* natija */
.mlr-hero{background:#fff;border:1px solid #D9DFE6;border-radius:16px;padding:22px}
.mlr-big{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.mlr-big b{font-size:52px;line-height:1;font-weight:800;letter-spacing:-.03em}
.mlr-big span{font-size:15px;color:#5E6B7A}
.mlr-scale{position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg,#E6EAF0 0 50.6%,#DCE7FB 50.6% 68%,#C9DAFA 68% 86.6%,#B7CDF8 86.6%);margin:22px 0 26px}
.mlr-scale .m{position:absolute;top:-6px;width:3px;height:24px;background:#1F2A37;border-radius:2px;transform:translateX(-1px)}
.mlr-scale .t{position:absolute;top:16px;font-size:11px;color:#5E6B7A;transform:translateX(-50%)}
.mlr-secs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.mlr-sec{border:1px solid #E1E6EC;border-radius:12px;padding:12px}
.mlr-sec small{display:block;font-size:12px;color:#5E6B7A}
.mlr-sec b{display:block;font-size:24px;font-variant-numeric:tabular-nums;margin-top:2px}
.mlr-sec span{font-size:12px;color:#5E6B7A}
.mlr-sec i{display:block;height:5px;border-radius:3px;background:#E6EAF0;margin-top:8px;position:relative;overflow:hidden}
.mlr-sec i::after{content:'';position:absolute;inset:0 auto 0 0;width:var(--w);background:#2F6FED}
.mlr-note{font-size:12.5px;color:#5E6B7A;margin-top:14px;line-height:1.5}
.mlr-rev{width:100%;border-collapse:collapse;font-size:14px;background:#fff}
.mlr-rev td,.mlr-rev th{padding:8px 10px;border-bottom:1px solid #EEF1F5;text-align:left;vertical-align:top}
.mlr-rev th{font-size:12px;color:#5E6B7A;font-weight:600}
.mlr-rev .ok{color:#1E7A4C;font-weight:700}.mlr-rev .no{color:#C62828;font-weight:700}
.mlr-fb{background:#fff;border:1px solid #D9DFE6;border-radius:12px;padding:14px 16px;margin-bottom:10px;font-size:14.5px;line-height:1.55}
.mlr-fb h4{margin:0 0 6px;font-size:15px;display:flex;justify-content:space-between;gap:10px}
.mlr-crit{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}
.mlr-crit div{background:#F7F9FB;border-radius:8px;padding:6px 8px;font-size:12px;color:#5E6B7A}
.mlr-crit div b{display:block;font-size:16px;color:#141B24}
.mlr-corr{margin:6px 0 0;padding:0;list-style:none}
.mlr-corr li{padding:5px 0;border-top:1px dashed #E1E6EC;font-size:14px}
.mlr-corr s{color:#C62828}.mlr-corr ins{color:#1E7A4C;text-decoration:none;font-weight:600}
.mlr-model{background:#F7F9FB;border-radius:8px;padding:10px 12px;margin-top:8px;font-family:Georgia,serif;white-space:pre-wrap}
.mlr-scr{font-size:13.5px;color:#2A3644;background:#F7F9FB;border-radius:8px;padding:10px 12px;margin:6px 0 12px;white-space:pre-wrap}
.mlz details summary{cursor:pointer;font-weight:600;font-size:14px;padding:6px 0}
.mlr-wait{display:flex;gap:10px;align-items:center;color:#5E6B7A;font-size:14px;padding:14px 0}
.mlr-spin{width:18px;height:18px;border:2px solid #D9DFE6;border-top-color:#1F2A37;border-radius:50%;animation:mlrS 1s linear infinite}
@keyframes mlrS{to{transform:rotate(360deg)}}
.mlx-center{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}
.mlx-center h2{font-size:24px;margin:0 0 8px}.mlx-center p{color:#5E6B7A;max-width:46ch;line-height:1.55;margin:0 0 6px}
.mlx-count{font-size:72px;font-weight:800;font-variant-numeric:tabular-nums;color:#1F2A37}
.mlx-rules{text-align:left;max-width:560px;margin:14px auto;padding:0 0 0 20px;line-height:1.6;font-size:14.5px;color:#2A3644}
@media (max-width:640px){.mll-secs,.mlr-secs{grid-template-columns:1fr 1fr}.mlr-crit{grid-template-columns:1fr 1fr}.mls-arg{grid-template-columns:1fr}.mlx-cand{display:none}.mll-h1{font-size:24px}}
`;
function css(){ if(document.getElementById('mlzCss')) return; const s=document.createElement('style'); s.id='mlzCss'; s.textContent=CSS; document.head.appendChild(s); }
const IBACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';

/* =====================================================================
   LOBBY
   ===================================================================== */
const S={access:null,tests:[],attempts:[],el:null};
async function open(){
  css();
  if(S.el) S.el.remove();
  const el=document.createElement('div'); el.className='mlz'; el.id='mlLobby'; document.body.appendChild(el); S.el=el;
  el.innerHTML=`<div class="mll-top"><button class="mll-ib" id="mlBack" aria-label="Orqaga">${IBACK}</button><b>Multilevel sinov imtihoni</b></div><div class="mll-sc" id="mlSc"><div class="mlr-wait"><span class="mlr-spin"></span>Yuklanmoqda…</div></div>`;
  $(el,'#mlBack').onclick=close;
  try{ history.pushState({wdml:1},'','#ml'); }catch(e){}
  window.addEventListener('popstate',onPop);
  await refresh(); renderLobby();
}
function onPop(){ if(document.getElementById('mlx')) return; close(true); }
function close(fromPop){ window.removeEventListener('popstate',onPop); stopAudio(); if(S.el){ S.el.remove(); S.el=null; } if(!fromPop){ try{ if(location.hash==='#ml') history.back(); }catch(e){} } }
async function refresh(){
  const signed=!!(await token());
  S.access=signed?await mlApi({mode:'ml_access'},20000):{signed:false};
  if(S.access.__error) S.access={signed,admin:false,pro:false,free_left:0};
  S.tests=[]; S.attempts=[];
  if(signed){
    try{ const {data}=await sb().from('wd_ml_tests').select('id,title,status,created_at,uses,audio').order('created_at',{ascending:false}).limit(60); S.tests=data||[]; }catch(e){}
    try{ const {data}=await sb().from('wd_ml_attempts').select('id,test_id,mode,scores,created_at').order('created_at',{ascending:false}).limit(30); S.attempts=data||[]; }catch(e){}
  }
}
function run(){ try{ return JSON.parse(localStorage.getItem(LS_RUN)||'null'); }catch(e){ return null; } }
function saveRun(r){ try{ if(r) localStorage.setItem(LS_RUN,JSON.stringify(r)); else localStorage.removeItem(LS_RUN); }catch(e){} }
function renderLobby(){
  const sc=$(S.el,'#mlSc'); const A=S.access||{};
  const ready=S.tests.filter(t=>t.status==='ready');
  const r=run();
  const canFull=A.signed&&(A.admin||A.pro||A.free_left>0);
  const access=!A.signed?`Imtihon topshirish uchun WordDrop hisobingizga kiring.`
    :A.admin?`Siz administratorsiz — barcha imtihonlar va AI baholash siz uchun doim bepul.`
    :A.pro?`Pro: cheksiz sinov va Writing/Speaking bo'yicha AI baholash.`
    :A.free_left>0?`Bitta to'liq sinov bepul. Keyingilari uchun — <button class="mll-link" id="mlPro">WordDrop Pro</button>. Listening va Reading mashqi doim bepul.`
    :`Bepul to'liq sinov ishlatilgan. Listening va Reading mashqi bepul; Writing va Speaking baholash — <button class="mll-link" id="mlPro">WordDrop Pro</button>'da.`;
  sc.innerHTML=`<div class="mll-in">
    <h1 class="mll-h1">Haqiqiy imtihon sharoitida o'zingizni sinang</h1>
    <p class="mll-p">Multilevel (CEFR) imtihonining to'liq formati: 4 bo'lim, rasmiy vaqt va savollar soni. Audio ikki marta eshittiriladi, to'xtatib bo'lmaydi. Oxirida 75 ballik shkalada natija va har bir javob tahlili.</p>
    ${r?`<div class="mll-card mll-resume"><div><b>Tugallanmagan imtihon</b><small>${esc(r.title||'')} · ${esc(SECN[r.sec]||'')} bo'limidan davom etasiz</small></div><button class="mll-btn pri" id="mlRes">Davom ettirish</button><button class="mll-btn bad" id="mlDrop">Bekor</button></div>`:''}
    <h2 class="mll-h2">Imtihon tuzilishi</h2>
    <table class="mll-fmt"><thead><tr><th>Bo'lim</th><th>Tarkibi</th><th>Vaqt</th></tr></thead><tbody>
      <tr><td><b>Listening</b></td><td>6 qism · 35 savol<small>Javob tanlash, forma to'ldirish, xarita, ma'ruza</small></td><td class="n">≈ 35 daq + 10</td></tr>
      <tr><td><b>Reading</b></td><td>5 qism · 35 savol<small>Bo'sh joy, moslashtirish, sarlavhalar, T/F/NI, akademik matn</small></td><td class="n">60 daq</td></tr>
      <tr><td><b>Writing</b></td><td>Task 1.1 · 1.2 · Part 2<small>Norasmiy xat (~50), rasmiy xat (120–150), forum post (180–200)</small></td><td class="n">60 daq</td></tr>
      <tr><td><b>Speaking</b></td><td>Part 1.1 · 1.2 · 2 · 3<small>Savollar, rasmlarni solishtirish, rasm + 3 savol, munozara</small></td><td class="n">≈ 15 daq</td></tr>
    </tbody></table>
    <button class="mll-go" id="mlFull" ${!canFull||!ready.length?'disabled':''}>To'liq imtihonni boshlash<span>≈ 3 soat</span></button>
    <div class="mll-secs">${['listening','reading','writing','speaking'].map(k=>`<button class="mll-sec" data-sec="${k}" ${!A.signed||!ready.length?'disabled':''}><b>${SECN[k]}</b><small>${SECT[k]}</small></button>`).join('')}</div>
    <p class="mll-note">${access}${!ready.length?' Hozircha imtihon variantlari tayyorlanmoqda.':''}</p>
    ${S.attempts.length?`<h2 class="mll-h2">Natijalarim</h2><div class="mll-hist">${S.attempts.map(histRow).join('')}</div>`:''}
    ${A.admin?adminHtml():''}
    <p class="mll-note">Sinov materiallari original, real imtihon savollari ko'chirilmagan. Natija taxminiy va rasmiy sertifikat o'rnini bosmaydi.</p></div>`;
  const pro=$(sc,'#mlPro'); if(pro) pro.onclick=()=>{ if(window.__wdOpenPro) window.__wdOpenPro(); };
  const full=$(sc,'#mlFull'); if(full) full.onclick=()=>startNew('full');
  $$(sc,'[data-sec]').forEach(b=>b.onclick=()=>startNew(b.dataset.sec));
  const res=$(sc,'#mlRes'); if(res) res.onclick=()=>resume();
  const dr=$(sc,'#mlDrop'); if(dr) dr.onclick=()=>{ if(confirm("Tugallanmagan imtihon o'chirilsinmi?")){ saveRun(null); renderLobby(); } };
  $$(sc,'[data-att]').forEach(b=>b.onclick=()=>{ const a=S.attempts.find(x=>x.id===b.dataset.att); if(a) showStored(a); });
  if(A.admin) bindAdmin(sc);
}
const SECN={listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking',full:"To'liq"};
const SECT={listening:'35 savol · ≈45 daq',reading:'35 savol · 60 daq',writing:'3 topshiriq · 60 daq',speaking:'4 qism · ≈15 daq'};
function histRow(a){
  const s=a.scores||{}; const d=new Date(a.created_at);
  const b=['listening','reading','writing','speaking'].map(k=>{ const v=s[k]&&s[k].score; return `<span>${SECN[k]} ${v!=null?v:'—'}<i style="--w:${v!=null?Math.round(v/75*100):0}%"></i></span>`; }).join('');
  return `<button class="mll-hrow" data-att="${a.id}"><div><b>${a.mode==='full'?"To'liq imtihon":SECN[a.mode]||a.mode}</b><div class="d">${d.toLocaleDateString('uz-UZ')} · ${d.toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'})}</div></div><div class="lv">${s.level?esc(s.level):s.overall!=null?s.overall:'—'}</div><div class="bars">${b}</div></button>`;
}

/* =====================================================================
   IMTIHONNI BOSHLASH / DAVOM ETTIRISH
   ===================================================================== */
async function pickTest(){
  const ready=S.tests.filter(t=>t.status==='ready'); if(!ready.length) return null;
  const done=new Set(S.attempts.map(a=>a.test_id));
  const fresh=ready.filter(t=>!done.has(t.id));
  const pick=(fresh.length?fresh:ready)[Math.floor(Math.random()*(fresh.length?fresh:ready).length)];
  return loadTest(pick.id);
}
async function loadTest(id){ try{ const {data}=await sb().from('wd_ml_tests').select('*').eq('id',id).single(); return data; }catch(e){ return null; } }
async function startNew(mode,testId){
  const T=testId?await loadTest(testId):await pickTest(); if(!T){ toast("Imtihon varianti topilmadi"); return; }
  const secs=mode==='full'?['listening','reading','writing','speaking']:[mode];
  const u=await uid();
  const r={id:'r'+Date.now(),testId:T.id,title:T.title,mode,secs,sec:secs[0],cand:'WD-'+String(u||'000000').replace(/-/g,'').slice(-6).toUpperCase(),ans:{listening:{},reading:{},writing:{t11:'',t12:'',t2:''}},deadline:{},scores:{},detail:{}};
  saveRun(r); try{ sb().rpc('wd_ml_use',{tid:T.id}); }catch(e){}
  examFlow(T,r);
}
async function resume(){ const r=run(); if(!r) return; const T=await loadTest(r.testId); if(!T){ toast('Test topilmadi'); saveRun(null); return; } examFlow(T,r); }

/* Imtihon qobig'i */
function shell(r,title,sub){
  stopAudio();
  const x=document.createElement('div'); x.className='mlz'; x.id='mlx';
  x.innerHTML=`<div class="mlx-bar"><div class="mlx-sec"><b>${esc(title)}</b><small>${esc(sub||'')}</small></div><span class="mlx-cand">${esc(r.cand)}</span><span class="mlx-time" id="mlxT" hidden>--:--</span><button class="mlx-x" id="mlxQ">Chiqish</button></div>
    <div class="mlx-strip" id="mlxS" hidden></div><div class="mlx-body" id="mlxB"></div><div class="mlx-nav" id="mlxN" hidden></div>`;
  document.body.appendChild(x);
  const api={x,body:$(x,'#mlxB'),strip:$(x,'#mlxS'),nav:$(x,'#mlxN'),tm:null,
    timer(sec,onEnd){ clearInterval(this.tm); const t=$(x,'#mlxT'); t.hidden=false; const end=Date.now()+sec*1000; const tick=()=>{ const left=(end-Date.now())/1000; t.textContent=fmt(left); t.classList.toggle('warn',left<=300&&left>60); t.classList.toggle('crit',left<=60); if(left<=0){ clearInterval(this.tm); onEnd&&onEnd(); } }; tick(); this.tm=setInterval(tick,500); return end; },
    stopTimer(){ clearInterval(this.tm); },
    close(){ clearInterval(this.tm); stopAudio(); x.remove(); }};
  $(x,'#mlxQ').onclick=()=>{ if(confirm("Imtihondan chiqasizmi? Javoblaringiz saqlanadi, keyin davom ettirishingiz mumkin (Listening va Speaking qaytadan boshlanadi).")){ api.close(); ABORT=true; releaseWake(); if(S.el){ refresh().then(renderLobby); } } };
  return api;
}
let ABORT=false, WAKE=null;
async function wake(){ try{ WAKE=await navigator.wakeLock.request('screen'); }catch(e){} }
function releaseWake(){ try{ WAKE&&WAKE.release(); }catch(e){} WAKE=null; }
function beforeUnload(e){ e.preventDefault(); e.returnValue=''; }

async function examFlow(T,r){
  ABORT=false; wake(); window.addEventListener('beforeunload',beforeUnload);
  const idx=Math.max(0,r.secs.indexOf(r.sec));
  for(let i=idx;i<r.secs.length;i++){
    r.sec=r.secs[i]; saveRun(r);
    const ok=await intro(T,r,r.sec); if(!ok||ABORT) return cleanup();
    let res=null;
    if(r.sec==='listening') res=await runListening(T,r);
    else if(r.sec==='reading') res=await runReading(T,r);
    else if(r.sec==='writing') res=await runWriting(T,r);
    else if(r.sec==='speaking') res=await runSpeaking(T,r);
    if(ABORT||!res) return cleanup();
    r.done=(r.done||[]).concat(r.sec); saveRun(r);
  }
  window.removeEventListener('beforeunload',beforeUnload); releaseWake();
  await finish(T,r);
}
function cleanup(){ window.removeEventListener('beforeunload',beforeUnload); releaseWake(); }

/* Bo'lim oldidan: qoidalar + 3-2-1 */
function intro(T,r,sec){
  return new Promise(res=>{
    const sh=shell(r,SECN[sec],T.title);
    const rules={
      listening:['Audio har qismda ikki marta eshittiriladi va to\'xtatib bo\'lmaydi.','Har qism oldidan savollarni o\'qishga vaqt beriladi.','Oxirida javoblarni tekshirish uchun 10 daqiqa beriladi.','Quloqchindan foydalaning va ovoz balandligini hozir sozlang.'],
      reading:['5 qism, 35 savol, 60 daqiqa.','Qismlar orasida erkin o\'tishingiz mumkin.','Vaqt tugaganda javoblar avtomatik topshiriladi.'],
      writing:['3 topshiriq, jami 60 daqiqa: Task 1.1 (~50 so\'z), Task 1.2 (120–150), Part 2 (180–200).','So\'zlar soni pastda ko\'rinib turadi.','Vaqt tugaganda yozganlaringiz avtomatik topshiriladi.'],
      speaking:['Mikrofonga ruxsat bering; tinch joyda bo\'ling.','Signaldan keyin gapira boshlang. Javob vaqti tugaganda yozib olish o\'zi to\'xtaydi.','Part 2 va Part 3 da 1 daqiqa tayyorlanish vaqti beriladi.'],
    }[sec];
    sh.body.innerHTML=`<div class="mlx-center"><h2>${SECN[sec]}</h2><p>Nomzod raqami: <b>${esc(r.cand)}</b></p><ul class="mlx-rules">${rules.map(x=>`<li>${x}</li>`).join('')}</ul>
      ${sec==='listening'?`<p><input type="range" min="0" max="1" step="0.05" value="${VOL}" id="mlVol" aria-label="Ovoz balandligi"></p>`:''}
      ${sec==='speaking'?`<div class="mls-lvl" style="width:220px"><i id="mlMicL"></i></div><p style="margin-top:8px"><button class="mll-btn" id="mlMic">Mikrofonni sinash</button></p>`:''}
      <button class="mll-go" style="max-width:360px" id="mlStart">Boshlash</button></div>`;
    const vol=$(sh.body,'#mlVol'); if(vol) vol.oninput=()=>{ VOL=Number(vol.value); if(CUR) CUR.volume=VOL; };
    const mic=$(sh.body,'#mlMic'); if(mic) mic.onclick=async()=>{ const st=await getMic(); if(!st){ toast("Mikrofonga ruxsat berilmadi"); return; } const lv=$(sh.body,'#mlMicL'); const a=ac(); const an=a.createAnalyser(); a.createMediaStreamSource(st).connect(an); const buf=new Uint8Array(512); const t0=Date.now(); (function loop(){ an.getByteTimeDomainData(buf); let s=0; for(const v of buf){ const d=(v-128)/128; s+=d*d; } lv.style.width=Math.min(100,Math.sqrt(s/buf.length)*400)+'%'; if(Date.now()-t0<6000&&document.body.contains(lv)) requestAnimationFrame(loop); })(); };
    $(sh.body,'#mlStart').onclick=async()=>{
      if(sec==='speaking'){ unlockAudio(); const st=await getMic(); if(!st){ toast("Speaking uchun mikrofon kerak. Brauzer sozlamalarida ruxsat bering."); return; } }
      sh.body.innerHTML=`<div class="mlx-center"><div class="mlx-count" id="mlC">3</div><p>${SECN[sec]} boshlanmoqda</p></div>`;
      for(let k=3;k>0;k--){ $(sh.body,'#mlC').textContent=k; await sleep(800); }
      sh.close(); res(true);
    };
    $(sh.x,'#mlxQ').onclick=()=>{ sh.close(); res(false); if(S.el) renderLobby(); };
  });
}

/* =====================================================================
   LISTENING
   ===================================================================== */
const LQ={p1:[1,8],p2:[9,14],p3:[15,18],p4:[19,23],p5:[24,29],p6:[30,35]};
function mapSvg(map){
  const W=560,H=360,cw=W/map.cols,ch=(H-40)/map.rows;
  const cell=i=>({x:(i%map.cols)*cw,y:20+Math.floor(i/map.cols)*ch});
  let s=`<svg class="mlx-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Xarita"><rect x="0" y="0" width="${W}" height="${H}" fill="#FBFCF8"/>`;
  for(let r=1;r<map.rows;r++) s+=`<rect x="0" y="${20+r*ch-7}" width="${W}" height="14" fill="#E7E2D3"/>`;
  for(let c=1;c<map.cols;c++) s+=`<rect x="${c*cw-7}" y="20" width="14" height="${H-40}" fill="#E7E2D3"/>`;
  s+=`<text x="${W-18}" y="16" font-size="12" font-weight="700" fill="#5E6B7A" text-anchor="middle">N ↑</text>`;
  map.landmarks.forEach(l=>{ const p=cell(l.cell); s+=`<rect x="${p.x+14}" y="${p.y+14}" width="${cw-28}" height="${ch-28}" rx="8" fill="#DDE6D2" stroke="#9DB08A"/><text x="${p.x+cw/2}" y="${p.y+ch/2+5}" font-size="13" font-weight="700" fill="#2F3B22" text-anchor="middle">${esc(l.name)}</text>`; });
  map.letters.forEach(l=>{ const p=cell(l.cell); s+=`<rect x="${p.x+cw/2-34}" y="${p.y+ch/2-24}" width="68" height="48" rx="6" fill="#fff" stroke="#9AA6B4" stroke-dasharray="4 3"/><text x="${p.x+cw/2}" y="${p.y+ch/2+7}" font-size="20" font-weight="800" fill="#1F2A37" text-anchor="middle">${l.l}</text>`; });
  return s+'</svg>';
}
function opt(name,i,label,txt,cur){ return `<label class="mlx-opt ${cur===i?'sel':''}"><input type="radio" name="${name}" value="${i}" ${cur===i?'checked':''}><b>${label}</b><span>${esc(txt)}</span></label>`; }
function renderListening(L,A){
  const p=[];
  p.push(partHtml('p1','Part 1','Savollar 1–8',`You will hear some sentences. You will hear each sentence twice. Choose the correct reply to each sentence (A, B or C).`,
    L.p1.map((it,i)=>qHtml(1+i,'',`<div class="mlx-opts">${it.o.map((o,k)=>opt('L'+(1+i),k,LET[k],o,A[1+i])).join('')}</div>`,A[1+i]!=null)).join('')));
  p.push(partHtml('p2','Part 2','Savollar 9–14',`${esc(L.p2.intro)} For questions 9–14, write ONE word and/or a number in each gap.`,
    `<div class="mlx-form"><div class="ft">${esc(L.p2.title)}</div>${L.p2.lines.map((l,i)=>qHtml(9+i,'',`${esc(l.pre)} <input class="mlx-in" data-q="${9+i}" value="${esc(A[9+i]||'')}" autocomplete="off" autocapitalize="off" spellcheck="false"> ${esc(l.post)}`,!!A[9+i])).join('')}</div>`));
  p.push(partHtml('p3','Part 3','Savollar 15–18',esc(L.p3.intro),
    `<div class="mlx-list">${L.p3.opts.map((o,k)=>`<b>${LET[k]}</b><span>${esc(o)}</span>`).join('')}</div>${L.p3.sp.map((s,i)=>qHtml(15+i,'',`Speaker ${i+1} ${sel('L'+(15+i),'ABCDEF',A[15+i])}`,A[15+i]!=null)).join('')}`));
  p.push(partHtml('p4','Part 4','Savollar 19–23',esc(L.p4.intro),
    mapSvg(L.p4.map)+L.p4.map.items.map((it,i)=>qHtml(19+i,'',`${esc(it.name)} ${sel('L'+(19+i),'ABCDEFGH',A[19+i])}`,A[19+i]!=null)).join('')));
  p.push(partHtml('p5','Part 5','Savollar 24–29',`You will hear three extracts. Choose the answer (A, B or C) which fits best according to what you hear. There are two questions for each extract.`,
    L.p5.map((e,ei)=>`<div style="margin:10px 0 2px;font-weight:700">${esc(e.intro)}</div>`+e.qs.map((q,k)=>{ const n=24+ei*2+k; return qHtml(n,esc(q.q),`<div class="mlx-opts">${q.o.map((o,j)=>opt('L'+n,j,LET[j],o,A[n])).join('')}</div>`,A[n]!=null); }).join('')).join('')));
  p.push(partHtml('p6','Part 6','Savollar 30–35',`${esc(L.p6.intro)} For questions 30–35, complete the sentences with ONE word.`,
    L.p6.lines.map((l,i)=>qHtml(30+i,'',`${esc(l.pre)} <input class="mlx-in" data-q="${30+i}" value="${esc(A[30+i]||'')}" autocomplete="off" autocapitalize="off" spellcheck="false"> ${esc(l.post)}`,!!A[30+i])).join('')));
  return p.join('');
}
function sel(name,letters,cur){ return `<select class="mlx-sel" name="${name}" data-q="${name.slice(1)}"><option value="">—</option>${letters.split('').map((l,i)=>`<option value="${i}" ${cur===i?'selected':''}>${l}</option>`).join('')}</select>`; }
function partHtml(id,t,qs,ins,body){ return `<section class="mlx-part" id="part-${id}"><div class="mlx-ph"><b>${t}</b><span>${qs}</span></div><div class="mlx-ins">${ins}</div>${body}</section>`; }
function qHtml(n,q,body,ans){ return `<div class="mlx-q ${ans?'ans':''}" id="q${n}"><span class="mlx-qn">${n}</span><div class="mlx-qb">${q?`<div>${q}</div>`:''}${body}</div></div>`; }
/* Javob maydonlarini bog'lash: radio (indeks), select (indeks), input (matn) */
function bindAnswers(root,A,onChange){
  root.addEventListener('change',e=>{ const t=e.target; let n,v;
    if(t.type==='radio'){ n=Number(t.name.slice(1)); v=Number(t.value); $$(root,`input[name="${t.name}"]`).forEach(x=>x.closest('.mlx-opt').classList.toggle('sel',x.checked)); }
    else if(t.tagName==='SELECT'){ n=Number(t.dataset.q); v=t.value===''?null:Number(t.value); }
    else return;
    if(v==null) delete A[n]; else A[n]=v; mark(root,n,v!=null); onChange&&onChange(); });
  root.addEventListener('input',e=>{ const t=e.target; if(!t.matches('input.mlx-in,input[data-q]')) return; const n=Number(t.dataset.q); const v=t.value.trim(); if(v) A[n]=t.value; else delete A[n]; mark(root,n,!!v); onChange&&onChange(); });
}
function mark(root,n,on){ const q=$(root,'#q'+n); if(q) q.classList.toggle('ans',on); const b=document.querySelector(`#mlxN [data-go="${n}"]`); if(b) b.classList.toggle('ans',on); }
function palette(sh,A,groups,onSubmit,submitLabel){
  sh.nav.hidden=false;
  sh.nav.innerHTML=`<div class="mlx-pal">${groups.map(([a,b])=>{ let s=''; for(let n=a;n<=b;n++) s+=`<button data-go="${n}" class="${A[n]!=null&&A[n]!==''?'ans':''}" aria-label="Savol ${n}">${n}</button>`; return s; }).join('<span class="sep"></span>')}</div><button class="mlx-nb pri" id="mlxSub">${submitLabel||'Topshirish'}</button>`;
  sh.nav.addEventListener('click',e=>{ const b=e.target.closest('[data-go]'); if(!b) return; const n=b.dataset.go; const q=document.getElementById('q'+n); if(q){ const tab=q.closest('[data-pane]'); if(tab&&tab.hidden&&sh.showPart) sh.showPart(tab.dataset.pane); setTimeout(()=>{ const qq=document.getElementById('q'+n); qq&&qq.scrollIntoView({behavior:'smooth',block:'center'}); const f=qq&&qq.querySelector('input,select'); f&&f.focus({preventScroll:true}); },30); } });
  $(sh.nav,'#mlxSub').onclick=onSubmit;
}

async function runListening(T,r){
  const L=T.listening; const A=r.ans.listening;
  const sh=shell(r,'Listening',T.title);
  sh.strip.hidden=false;
  sh.body.innerHTML=`<div class="mlx-wrap">${renderListening(L,A)}</div>`;
  const persist=()=>saveRun(r);
  bindAnswers(sh.body,A,persist);
  let submitted=false, resolve;
  const done=new Promise(res=>resolve=res);
  const lifetime=new AbortController();
  const close=sh.close.bind(sh);
  sh.close=()=>{
    lifetime.abort();
    close();
    resolve(submitted);
  };
  const active=()=>!lifetime.signal.aborted;
  const submit=(auto)=>{ if(submitted) return; if(!auto&&!confirm('Listening javoblarini topshirasizmi?')) return; submitted=true; sh.close(); };
  palette(sh,A,Object.values(LQ),()=>submit(false),'Topshirish');
  const status=(txt,live)=>{ sh.strip.innerHTML=`<span class="dot ${live?'live':''}"></span><span class="grow">${txt}</span><label style="display:flex;align-items:center;gap:6px;font-size:12px">Ovoz <input type="range" min="0" max="1" step="0.05" value="${VOL}" id="mlxV"></label>`; const v=$(sh.strip,'#mlxV'); v.oninput=()=>{ VOL=Number(v.value); if(CUR) CUR.volume=VOL; }; };
  const goPart=id=>{ const s=document.getElementById('part-'+id); s&&s.scrollIntoView({behavior:'smooth',block:'start'}); };
  const audio=new Audio();
  const available=key=>typeof T.audio?.[key]==='string'&&T.audio[key].trim()!=='';
  const needed=[
    ...L.p1.map((_,i)=>'l1_'+i),'l2',
    ...L.p3.sp.map((_,i)=>'l3_'+i),'l4',
    ...L.p5.map((_,i)=>'l5_'+i),'l6',
  ];
  const wait=async(sec,label)=>{
    const end=Date.now()+sec*1000/(window.__mlSpeed||1);
    while(active()&&Date.now()<end){
      status(`${label} · ${fmt((end-Date.now())/1000)}`,false);
      await sleep(500);
    }
  };
  const record=async key=>{
    if(!active()) return false;
    const play=()=>playUrl(T.audio[key],audio);
    if(await play()) return active();
    if(!active()) return false;
    return listeningAudioPrompt(sh,lifetime.signal,play);
  };
  const twice=async(label,keys,gap=5)=>{
    for(let k=1;k<=2&&active();k++){
      for(const key of keys){
        if(!active()) return;
        status(`${label} · ${k}-eshittirish`,true);
        if(!await record(key)) return;
        if(keys.length>1) await sleep(1500);
      }
      if(k===1) await wait(gap,'Yana bir marta eshitasiz');
    }
  };
  (async()=>{
    const sample=['s11i','l1_0','l2'].find(available);
    const playSample=sample&&needed.every(available)?()=>playUrl(T.audio[sample],audio):null;
    if(!await listeningAudioPrompt(sh,lifetime.signal,playSample,{sample:true})||!active()) return;
    goPart('p1'); await wait(10,"Part 1 · savollarni o'qing");
    for(let i=0;i<L.p1.length&&active();i++){
      const n=1+i;
      document.getElementById('q'+n)?.scrollIntoView({behavior:'smooth',block:'center'});
      for(let k=1;k<=2&&active();k++){
        status(`Part 1 · Savol ${n} · ${k}-eshittirish`,true);
        if(!await record('l1_'+i)) return;
        await sleep((k===1?1500:4000)/(window.__mlSpeed||1));
      }
    }
    if(!active()) return;
    goPart('p2'); await wait(30,"Part 2 · savollarni o'qing (30 s)");
    await twice('Part 2',['l2']); await wait(8,'Part 2 · javoblarni tekshiring');
    if(!active()) return;
    goPart('p3'); await wait(30,"Part 3 · variantlarni o'qing (30 s)");
    await twice('Part 3',L.p3.sp.map((_,i)=>'l3_'+i));
    if(!active()) return;
    goPart('p4'); await wait(30,'Part 4 · xaritaga qarang (30 s)'); await twice('Part 4',['l4']);
    if(!active()) return;
    goPart('p5');
    for(let e=0;e<L.p5.length&&active();e++){
      document.getElementById('q'+(24+e*2))?.scrollIntoView({behavior:'smooth',block:'center'});
      await wait(20,`Part 5 · Extract ${e+1} · savollarni o'qing`);
      await twice(`Part 5 · Extract ${e+1}`,['l5_'+e]);
    }
    if(!active()) return;
    goPart('p6'); await wait(40,"Part 6 · gaplarni o'qing (40 s)"); await twice('Part 6',['l6']);
    if(!active()) return;
    status('Yozuv tugadi. Javoblarni tekshirish uchun 10 daqiqa.',false);
    sh.timer(600,()=>submit(true));
  })();
  return done;
}

/* =====================================================================
   READING
   ===================================================================== */
function gapText(text,base,A){ return esc(text).replace(/\[(\d+)\]/g,(m,k)=>{ const n=base+Number(k)-(base===1?1:30); return `<span class="mlx-gap" id="q${n}"><sup>${n}</sup><input class="mlx-in" data-q="${n}" value="${esc(A[n]||'')}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Savol ${n}"></span>`; }); }
function renderReading(R,A){
  const pane=(id,html)=>`<div data-pane="${id}" hidden>${html}</div>`;
  const out=[];
  out.push(pane('1',`<div class="mlx-part"><div class="mlx-ph"><b>Part 1</b><span>Savollar 1–6</span></div><div class="mlx-ins">Read the text. Fill in each gap with ONE word. You must use a word which is somewhere in the rest of the text.</div>
    <div class="mlx-pass"><h3>${esc(R.p1.title)}</h3><p>${gapText(R.p1.text,1,A)}</p></div></div>`));
  out.push(pane('2',`<div class="mlx-part"><div class="mlx-ph"><b>Part 2</b><span>Savollar 7–14</span></div><div class="mlx-ins">Read the texts 7–14 and the statements A–J. Which statement matches each text? There are TWO extra statements.</div>
    <div class="mlx-list">${R.p2.opts.map((o,k)=>`<b>${LET[k]}</b><span>${esc(o)}</span>`).join('')}</div>
    ${R.p2.texts.map((t,i)=>{ const n=7+i; return `<div class="mlx-ad mlx-q ${A[n]!=null?'ans':''}" id="q${n}"><div class="row"><b>${n}</b>${sel('R'+n,'ABCDEFGHIJ',A[n])}</div><div class="mlx-pass" style="font-size:15.5px">${esc(t)}</div></div>`; }).join('')}</div>`));
  out.push(pane('3',`<div class="mlx-part"><div class="mlx-ph"><b>Part 3</b><span>Savollar 15–20</span></div><div class="mlx-ins">Read the text and choose the correct heading for each paragraph from the list of headings below. There are more headings than paragraphs, so you will not use all of them. You cannot use any heading more than once.</div>
    <div class="mlx-list">${R.p3.heads.map((o,k)=>`<b>${LET[k]}</b><span>${esc(o)}</span>`).join('')}</div>
    <div class="mlx-pass"><h3>${esc(R.p3.title)}</h3>${R.p3.paras.map((p,i)=>{ const n=15+i; return `<div class="mlx-q ${A[n]!=null?'ans':''}" id="q${n}" style="display:block"><p><span class="pn">${n}</span>${sel('R'+n,'ABCDEFGH',A[n])}</p><p>${esc(p)}</p></div>`; }).join('')}</div></div>`));
  const mcq=(q,n,letters)=>qHtml(n,esc(q.q),`<div class="mlx-opts">${q.o.map((o,k)=>opt('R'+n,k,letters[k],o,A[n])).join('')}</div>`,A[n]!=null);
  out.push(pane('4',`<div class="mlx-split"><div class="mlx-pane mlx-pass"><h3>${esc(R.p4.title)}</h3>${R.p4.paras.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
    <div class="mlx-pane"><div class="mlx-ph"><b>Part 4</b><span>Savollar 21–29</span></div><div class="mlx-ins">For questions 21–24, choose the correct answer A, B, C or D.</div>${R.p4.mcq.map((q,i)=>mcq(q,21+i,'ABCD')).join('')}
    <div class="mlx-ins" style="margin-top:14px">For questions 25–29, decide if the statements agree with the information in the text. Choose TRUE, FALSE or NO INFORMATION.</div>
    ${R.p4.tfn.map((x,i)=>{ const n=25+i, cur=A[n]; return qHtml(n,esc(x.s),`<div class="mlx-opts" style="flex-direction:row;flex-wrap:wrap">${['T','F','NI'].map((v,k)=>`<label class="mlx-opt ${cur===k?'sel':''}"><input type="radio" name="R${n}" value="${k}" ${cur===k?'checked':''}><span>${['True','False','No Information'][k]}</span></label>`).join('')}</div>`,cur!=null); }).join('')}</div></div>`));
  out.push(pane('5',`<div class="mlx-split"><div class="mlx-pane mlx-pass"><h3>${esc(R.p5.title)}</h3>${R.p5.paras.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
    <div class="mlx-pane"><div class="mlx-ph"><b>Part 5</b><span>Savollar 30–35</span></div><div class="mlx-ins">For questions 30–33, complete the summary. Write NO MORE THAN ONE WORD and/or a number from the text.</div>
    <div class="mlx-pass" style="font-size:15.5px">${gapText(R.p5.summary,30,A)}</div>
    <div class="mlx-ins" style="margin-top:14px">For questions 34–35, choose the correct answer A, B, C or D.</div>${R.p5.mcq.map((q,i)=>mcq(q,34+i,'ABCD')).join('')}</div></div>`));
  return out.join('');
}
async function runReading(T,r){
  const R=T.reading, A=r.ans.reading;
  const sh=shell(r,'Reading',T.title);
  sh.body.innerHTML=`<div class="mlx-wrap wide"><div class="mlx-tabs" role="tablist">${[1,2,3,4,5].map(k=>`<button data-tab="${k}" role="tab">Part ${k}</button>`).join('')}</div>${renderReading(R,A)}</div>`;
  sh.showPart=k=>{ $$(sh.body,'[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==String(k)); $$(sh.body,'[data-tab]').forEach(b=>{ b.classList.toggle('on',b.dataset.tab===String(k)); b.setAttribute('aria-selected',b.dataset.tab===String(k)); }); sh.body.scrollTop=0; r.rpart=k; saveRun(r); };
  $$(sh.body,'[data-tab]').forEach(b=>b.onclick=()=>sh.showPart(b.dataset.tab));
  sh.showPart(r.rpart||1);
  bindAnswers(sh.body,A,()=>saveRun(r));
  // T/F/NI javoblari indeksdan harfga saqlanadi (0 T, 1 F, 2 NI)
  return new Promise(res=>{
    let done=false; const submit=auto=>{ if(done) return; if(!auto&&!confirm('Reading javoblarini topshirasizmi?')) return; done=true; sh.close(); r.deadline.reading=null; saveRun(r); res(true); };
    palette(sh,A,[[1,6],[7,14],[15,20],[21,29],[30,35]],()=>submit(false));
    if(!r.deadline.reading){ r.deadline.reading=Date.now()+3600e3; saveRun(r); }
    sh.timer((r.deadline.reading-Date.now())/1000,()=>{ toast('Vaqt tugadi — javoblar topshirildi'); submit(true); });
  });
}

/* =====================================================================
   WRITING
   ===================================================================== */
async function runWriting(T,r){
  const W=T.writing, A=r.ans.writing;
  const sh=shell(r,'Writing',T.title);
  const tasks=[
    {k:'t11',t:'Task 1.1',rng:[40,65],target:'≈ 50 so\'z',ins:W.t11},
    {k:'t12',t:'Task 1.2',rng:[120,150],target:'120–150 so\'z',ins:W.t12},
    {k:'t2',t:'Part 2',rng:[180,200],target:'180–200 so\'z',ins:(W.t2.intro||'')+'\n\n'+W.t2.q},
  ];
  sh.body.innerHTML=`<div class="mlx-wrap"><div class="mlx-tabs">${tasks.map((x,i)=>`<button data-tab="${i}">${x.t}</button>`).join('')}</div>
    ${tasks.map((x,i)=>`<div data-pane="${i}" hidden>
      ${i<2?`<div class="mlx-w-in"><small>${esc(W.from)} — xabar</small>${esc(W.situation)}</div>`:''}
      <div class="mlx-ins">${esc(x.ins)}</div>
      <textarea class="mlx-ta" data-k="${x.k}" spellcheck="false" autocapitalize="sentences" aria-label="${x.t} javobi">${esc(A[x.k]||'')}</textarea>
      <div class="mlx-wc"><span>Maqsad: ${x.target}</span><span>So'zlar: <b data-wc="${x.k}">0</b></span></div></div>`).join('')}</div>`;
  const upd=k=>{ const n=words(A[k]); const t=tasks.find(x=>x.k===k); const b=$(sh.body,`[data-wc="${k}"]`); b.textContent=n; b.className=n<t.rng[0]?'lo':n>t.rng[1]+30?'hi':'ok'; };
  tasks.forEach(x=>upd(x.k));
  sh.body.addEventListener('input',e=>{ const ta=e.target.closest('textarea[data-k]'); if(!ta) return; A[ta.dataset.k]=ta.value; upd(ta.dataset.k); clearTimeout(sh.sv); sh.sv=setTimeout(()=>saveRun(r),600); });
  sh.showPart=k=>{ $$(sh.body,'[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==String(k)); $$(sh.body,'[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===String(k))); };
  $$(sh.body,'[data-tab]').forEach(b=>b.onclick=()=>sh.showPart(b.dataset.tab)); sh.showPart(0);
  return new Promise(res=>{
    let done=false; const submit=auto=>{ if(done) return; if(!auto&&!confirm('Writing javoblarini topshirasizmi?')) return; done=true; saveRun(r); sh.close(); res(true); };
    sh.nav.hidden=false; sh.nav.innerHTML=`<div class="mlx-pal" style="font-size:13px;color:#5E6B7A;align-items:center">Javoblar avtomatik saqlanadi</div><button class="mlx-nb pri" id="mlxSub">Topshirish</button>`;
    $(sh.nav,'#mlxSub').onclick=()=>submit(false);
    if(!r.deadline.writing){ r.deadline.writing=Date.now()+3600e3; saveRun(r); }
    sh.timer((r.deadline.writing-Date.now())/1000,()=>{ toast('Vaqt tugadi — javoblar topshirildi'); submit(true); });
  });
}

/* =====================================================================
   SPEAKING
   ===================================================================== */
let MIC=null;
async function getMic(){ if(MIC&&MIC.active) return MIC; try{ MIC=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}); return MIC; }catch(e){ return null; } }
const EX={
  s11i:"Part one. In this part, I'm going to ask you three short questions about yourself and your interests. Begin speaking when you hear the signal.",
  s12i:"Now, I'm going to ask you to compare two pictures, and I will ask you some questions about them. Look at the photographs.",
  s2i:"Part two. In this part, I'm going to show you a picture and ask you three questions. You will have one minute to think about your answers before you start speaking. You will then have two minutes to answer all three questions. Look at the photograph.",
  s3i:"Part three. In this part, you are going to speak on a topic for two minutes. You will have one minute to think about what you are going to say. Look at the statement and the arguments for and against.",
  end:"That is the end of the speaking test. Thank you.",
};
const EXV='diana';
function speakingClips(Sp){ return [['s11i',EX.s11i],...Sp.p11.map((q,i)=>['s11_'+i,q]),['s12i',EX.s12i],...Sp.p12.qs.map((q,i)=>['s12_'+i,q]),['s2i',EX.s2i],['s2q',Sp.p2.qs.join(' ')],['s3i',EX.s3i],['s3t',Sp.p3.topic],['end',EX.end]]; }
function picHtml(p){ return p&&p.url?`<figure><img src="${esc(p.url)}" alt="${esc(p.desc||'')}" loading="eager" referrerpolicy="no-referrer"><figcaption>${esc(p.credit||'')}</figcaption></figure>`:`<figure><div class="ph">${esc(p&&p.desc||'Rasm')}</div></figure>`; }
async function record(sec,ui){
  const st=await getMic(); if(!st) return null;
  const mt=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(m=>{ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } })||'';
  const rec=mt?new MediaRecorder(st,{mimeType:mt}):new MediaRecorder(st); const ch=[];
  rec.ondataavailable=e=>{ if(e.data&&e.data.size) ch.push(e.data); };
  const a=ac(); const an=a.createAnalyser(); an.fftSize=1024; const srcN=a.createMediaStreamSource(st); srcN.connect(an); const buf=new Uint8Array(an.fftSize);
  let pauses=0, quiet=0, spoke=false, stopped=false; const t0=Date.now();
  rec.start(250);
  const end=new Promise(res=>{ rec.onstop=()=>res(); });
  const stop=()=>{ if(stopped) return; stopped=true; try{ rec.stop(); }catch(e){} };
  ui.stop=stop;
  while(!stopped&&!ABORT){
    const left=sec-(Date.now()-t0)/1000; if(left<=0){ stop(); break; }
    an.getByteTimeDomainData(buf); let s=0; for(const v of buf){ const d=(v-128)/128; s+=d*d; } const rms=Math.sqrt(s/buf.length);
    if(rms>.03){ spoke=true; if(quiet>=2000) pauses++; quiet=0; } else quiet+=100;
    ui.tick&&ui.tick(left,sec,rms);
    await sleep(100);
  }
  if(!stopped) stop();
  await end; try{ srcN.disconnect(); }catch(e){}
  return {blob:new Blob(ch,{type:rec.mimeType||mt||'audio/webm'}),sec:Math.min(sec,(Date.now()-t0)/1000),pauses,spoke};
}
async function runSpeaking(T,r){
  const Sp=T.speaking; const sh=shell(r,'Speaking',T.title);
  const items=[]; r.speak=null;
  const ring=(label,cls)=>`<div class="mls-ring ${cls||''}"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52" fill="none" stroke-width="8"/><circle class="fg" cx="60" cy="60" r="52" fill="none" stroke-width="8" stroke-dasharray="326.7" stroke-dashoffset="0" stroke-linecap="round"/></svg><div><b>--</b><small>${label}</small></div></div><div class="mls-lvl"><i></i></div>`;
  const setRing=(left,total)=>{ const fg=$(sh.body,'.fg'), b=$(sh.body,'.mls-ring b'); if(fg) fg.style.strokeDashoffset=String(326.7*(1-left/total)); if(b) b.textContent=Math.ceil(left); };
  const prep=async(sec,extra)=>{ const el=$(sh.body,'#mlsR'); el.innerHTML=ring('Tayyorlanish'); const t0=Date.now(); while(!ABORT){ const left=sec-(Date.now()-t0)/1000; if(left<=0) break; setRing(left,sec); await sleep(200); } };
  const answer=async(part,q,sec)=>{
    chime(); await sleep(400);
    const el=$(sh.body,'#mlsR'); el.innerHTML=ring('Gapiring','rec')+`<button class="mll-btn mls-stop" id="mlsStop">Javobni tugatish</button>`;
    const ui={tick:(left,total,rms)=>{ setRing(left,total); const l=$(sh.body,'.mls-lvl i'); if(l) l.style.width=Math.min(100,rms*400)+'%'; }};
    $(sh.body,'#mlsStop').onclick=()=>ui.stop&&ui.stop();
    const rec=await record(sec,ui);
    el.innerHTML=`<p class="mls-sub">Javob yozib olindi</p>`;
    if(rec) items.push({part,q,limit:sec,...rec});
  };
  const view=(html)=>{ sh.body.innerHTML=`<div class="mls">${html}<div id="mlsR"></div></div>`; };
  const say=(key,text,label)=>{ const el=$(sh.body,'#mlsR'); if(el) el.innerHTML=`<p class="mls-sub">${label||'Imtihonchi gapirmoqda…'}</p>`; return playClip(T,key,[{v:EXV,t:text}]); };
  // Part 1.1
  view(`<div class="mls-sub">Part 1.1</div><div class="mls-q">About you</div>`); await say('s11i',EX.s11i);
  for(let i=0;i<3&&!ABORT;i++){ view(`<div class="mls-sub">Part 1.1 · Savol ${i+1} / 3</div><div class="mls-q">${esc(Sp.p11[i])}</div>`); await say('s11_'+i,Sp.p11[i]); await answer('1.1',Sp.p11[i],30); }
  // Part 1.2
  const pics12=`<div class="mls-pics">${(Sp.p12.pics||[]).map(picHtml).join('')}</div>`;
  if(!ABORT){ view(`<div class="mls-sub">Part 1.2 · ${esc(Sp.p12.topic)}</div>${pics12}`); await say('s12i',EX.s12i); }
  const lim12=[45,30,30];
  for(let i=0;i<3&&!ABORT;i++){ view(`<div class="mls-sub">Part 1.2 · Savol ${i+4}</div>${pics12}<div class="mls-q" style="font-size:19px">${esc(Sp.p12.qs[i])}</div>`); await say('s12_'+i,Sp.p12.qs[i]); await answer('1.2',Sp.p12.qs[i],lim12[i]); }
  // Part 2
  if(!ABORT){ const html=`<div class="mls-sub">Part 2</div><div class="mls-pics one">${picHtml(Sp.p2.pic)}</div><ol class="mls-qs">${Sp.p2.qs.map(q=>`<li>${esc(q)}</li>`).join('')}</ol>`;
    view(html); await say('s2i',EX.s2i); await say('s2q',Sp.p2.qs.join(' ')); await prep(60); await answer('2',Sp.p2.qs.join(' / '),120); }
  // Part 3
  if(!ABORT){ const html=`<div class="mls-sub">Part 3</div><div class="mls-topic">${esc(Sp.p3.topic)}</div><div class="mls-arg"><div><b>FOR</b><ul>${Sp.p3.for.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><b>AGAINST</b><ul>${Sp.p3.against.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>`;
    view(html); await say('s3i',EX.s3i); await say('s3t',Sp.p3.topic); await prep(60); await answer('3',Sp.p3.topic,120); }
  if(ABORT) return null;
  view(`<div class="mls-q">Speaking tugadi</div>`); await say('end',EX.end,' ');
  sh.close();
  r.speakItems=items; // blob'lar faqat xotirada
  return true;
}

/* =====================================================================
   BAHOLASH VA NATIJA
   ===================================================================== */
function scoreL(L,A){
  const rows=[]; let ok=0;
  const add=(n,u,a,uTxt,aTxt)=>{ const c=typeof a==='string'?same(u,a):Number(u)===a&&u!=null; if(c) ok++; rows.push({n,u:uTxt,a:aTxt,c}); };
  L.p1.forEach((x,i)=>add(1+i,A[1+i],x.a,A[1+i]!=null?LET[A[1+i]]:'',LET[x.a]));
  L.p2.lines.forEach((x,i)=>add(9+i,A[9+i]||'',x.a,A[9+i]||'',x.a));
  L.p3.sp.forEach((x,i)=>add(15+i,A[15+i],x.a,A[15+i]!=null?LET[A[15+i]]:'',LET[x.a]));
  L.p4.map.items.forEach((x,i)=>add(19+i,A[19+i],'ABCDEFGH'.indexOf(x.a),A[19+i]!=null?'ABCDEFGH'[A[19+i]]:'',x.a));
  L.p5.forEach((e,ei)=>e.qs.forEach((q,k)=>{ const n=24+ei*2+k; add(n,A[n],q.a,A[n]!=null?LET[A[n]]:'',LET[q.a]); }));
  L.p6.lines.forEach((x,i)=>add(30+i,A[30+i]||'',x.a,A[30+i]||'',x.a));
  const score=raw75(ok); return {raw:ok,score,level:lvl(score),rows};
}
function scoreR(R,A){
  const rows=[]; let ok=0; const TF=['T','F','NI'], TFN=['True','False','No Information'];
  const add=(n,c,u,a)=>{ if(c) ok++; rows.push({n,u,a,c}); };
  R.p1.a.forEach((w,i)=>{ const n=1+i; add(n,same(A[n],w),A[n]||'',w); });
  R.p2.a.forEach((x,i)=>{ const n=7+i; add(n,A[n]===x,A[n]!=null?LET[A[n]]:'',LET[x]); });
  R.p3.a.forEach((x,i)=>{ const n=15+i; add(n,A[n]===x,A[n]!=null?LET[A[n]]:'',LET[x]); });
  R.p4.mcq.forEach((q,i)=>{ const n=21+i; add(n,A[n]===q.a,A[n]!=null?LET[A[n]]:'',LET[q.a]); });
  R.p4.tfn.forEach((x,i)=>{ const n=25+i; add(n,A[n]!=null&&TF[A[n]]===x.a,A[n]!=null?TFN[A[n]]:'',TFN[TF.indexOf(x.a)]); });
  R.p5.sa.forEach((w,i)=>{ const n=30+i; add(n,same(A[n],w),A[n]||'',w); });
  R.p5.mcq.forEach((q,i)=>{ const n=34+i; add(n,A[n]===q.a,A[n]!=null?LET[A[n]]:'',LET[q.a]); });
  const score=raw75(ok); return {raw:ok,score,level:lvl(score),rows};
}
async function transcribe(it){
  const b64=await new Promise(res=>{ const fr=new FileReader(); fr.onload=()=>res(String(fr.result).split(',')[1]||''); fr.readAsDataURL(it.blob); });
  if(!window.__wdDPAuth) return '';
  const j=await window.__wdDPAuth({mode:'stt',audio:b64,mime:it.blob.type,lang:'en'},60000);
  return j&&!j.__error?String(j.text||''):'';
}
async function finish(T,r){
  const sh=shell(r,'Natijalar',T.title);
  sh.body.innerHTML=`<div class="mlx-wrap"><div class="mlr-wait"><span class="mlr-spin"></span><span id="mlW">Natijalar hisoblanmoqda…</span></div></div>`;
  const W=t=>{ const e=$(sh.body,'#mlW'); if(e) e.textContent=t; };
  const sc=r.scores||{}, det=r.detail||{};
  if(r.secs.includes('listening')){ const x=scoreL(T.listening,r.ans.listening); sc.listening={raw:x.raw,score:x.score,level:x.level}; det.listening=x.rows; }
  if(r.secs.includes('reading')){ const x=scoreR(T.reading,r.ans.reading); sc.reading={raw:x.raw,score:x.score,level:x.level}; det.reading=x.rows; }
  if(r.secs.includes('writing')&&!sc.writing){
    W('Writing AI imtihonchi tomonidan baholanmoqda…');
    const j=await mlApi({mode:'ml_score_writing',test:T.writing,answers:r.ans.writing},150000);
    if(j.__error){ det.writingErr=j.msg; det.writingPro=!!j.pro; } else { sc.writing={score:j.score,level:j.level,expert:j.expert}; det.writing=j; }
  }
  if(r.secs.includes('speaking')&&!sc.speaking){
    const items=r.speakItems||[];
    if(!items.length){ det.speakingErr="Speaking yozuvlari topilmadi (sahifa yangilangan bo'lishi mumkin). Speaking bo'limini qayta topshiring."; }
    else{
      W(`Nutqingiz matnga o'girilmoqda (${items.length} ta javob)…`);
      const out=[]; for(let i=0;i<items.length;i+=3){ const part=await Promise.all(items.slice(i,i+3).map(transcribe)); out.push(...part); W(`Matnga o'girildi: ${Math.min(items.length,i+3)} / ${items.length}`); }
      const payload=items.map((it,i)=>({part:it.part,q:it.q,limit:it.limit,sec:Math.round(it.sec),pauses:it.pauses,text:out[i]}));
      W('Speaking AI imtihonchi tomonidan baholanmoqda…');
      const j=await mlApi({mode:'ml_score_speaking',items:payload},150000);
      if(j.__error){ det.speakingErr=j.msg; det.speakingPro=!!j.pro; } else { sc.speaking={score:j.score,level:j.level,expert:j.expert}; det.speaking={...j,items:payload}; }
      det.speakAudio=items.map(it=>URL.createObjectURL(it.blob));
    }
  }
  const vals=['listening','reading','writing','speaking'].filter(k=>r.secs.includes(k)).map(k=>sc[k]&&sc[k].score).filter(v=>v!=null);
  if(vals.length){ sc.overall=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length); sc.level=r.mode==='full'&&vals.length===4?lvl(sc.overall):(vals.length===1?lvl(vals[0]):lvl(sc.overall)); }
  r.scores=sc; r.detail=det;
  try{ if(r.mode==='full'&&sc.level){ const ord=['B1 dan past','B1','B2','C1']; const prev=localStorage.getItem('wd_ml_best'); if(!prev||ord.indexOf(sc.level)>ord.indexOf(prev)) localStorage.setItem('wd_ml_best',sc.level); } }catch(e){}
  // saqlash
  try{ const u=await uid(); if(u){ const {speakAudio,...dd}=det; await sb().from('wd_ml_attempts').insert({user_id:u,test_id:T.id,mode:r.mode,scores:sc,detail:dd}); } }catch(e){ console.warn(e); }
  saveRun(null);
  renderResult(sh,T,r.mode,sc,det);
}
async function showStored(a){
  const T=await loadTest(a.test_id); if(!T){ toast('Test topilmadi'); return; }
  const sh=shell({cand:''},'Natija',T.title); renderResult(sh,T,a.mode,a.scores||{},a.detail||{});
}
function renderResult(sh,T,mode,sc,det){
  const secs=['listening','reading','writing','speaking'];
  const ov=sc.overall;
  const pct=v=>Math.round(Math.max(0,Math.min(75,v))/75*100);
  const h=[];
  h.push(`<div class="mlr-hero"><div class="mlr-big"><b>${esc(sc.level||'—')}</b><span>${ov!=null?`${ov} / 75 ball${mode==='full'?' · to\'rt bo\'lim o\'rtachasi':''}`:''}</span></div>
    ${ov!=null?`<div class="mlr-scale" role="img" aria-label="Ball shkalasi: ${ov} dan 75"><span class="m" style="left:${pct(ov)}%"></span>${[[38,'B1'],[51,'B2'],[65,'C1']].map(([v,l])=>`<span class="t" style="left:${pct(v)}%">${l} ${v}</span>`).join('')}</div>`:''}
    <div class="mlr-secs">${secs.map(k=>{ const s=sc[k]; return `<div class="mlr-sec"><small>${SECN[k]}</small><b>${s?s.score:'—'}</b><span>${s?esc(s.level)+(s.raw!=null?` · ${s.raw}/35`:''):(det[k+'Err']?'baholanmadi':'topshirilmagan')}</span><i style="--w:${s?pct(s.score):0}%"></i></div>`; }).join('')}</div>
    <p class="mlr-note">Listening va Reading: to'g'ri javoblar soni 75 ballik shkalaga taxminiy o'tkazildi (rasmiy imtihonda Rasch modeli ishlatiladi). Writing va Speaking: AI imtihonchi baholadi. Natija taxminiy — rasmiy sertifikat emas.</p></div>`);
  ['listening','reading'].forEach(k=>{ if(!det[k]) return;
    h.push(`<details class="mlx-part" ${mode===k?'open':''}><summary>${SECN[k]} — javoblar tahlili (${sc[k].raw}/35)</summary><table class="mlr-rev"><thead><tr><th>#</th><th>Sizning javobingiz</th><th>To'g'ri javob</th><th></th></tr></thead><tbody>${det[k].map(x=>`<tr><td>${x.n}</td><td>${esc(x.u)||'<span style="color:#9AA6B4">—</span>'}</td><td>${esc(x.a)}</td><td class="${x.c?'ok':'no'}">${x.c?'✓':'✗'}</td></tr>`).join('')}</tbody></table>
    ${k==='listening'?listeningScripts(T.listening):''}</details>`); });
  if(det.writing){ const w=det.writing;
    h.push(`<details class="mlx-part" open><summary>Writing — AI imtihonchi xulosasi (${sc.writing.score}/75)</summary><p class="mll-p" style="margin:6px 0 12px">${esc(w.summary_uz)}</p>${(w.tasks||[]).map(t=>fbTask(t,{task:'Topshiriq',org:'Tuzilish',lex:'Lug\'at',gram:'Grammatika'},`Task ${t.id==='2'?'Part 2':t.id} · ${t.words} so'z`,t.model)).join('')}</details>`); }
  else if(det.writingErr) h.push(errCard('Writing',det.writingErr,det.writingPro));
  if(det.speaking){ const s=det.speaking;
    h.push(`<details class="mlx-part" open><summary>Speaking — AI imtihonchi xulosasi (${sc.speaking.score}/75)</summary><p class="mll-p" style="margin:6px 0 12px">${esc(s.summary_uz)}</p>${(s.parts||[]).map(p=>fbTask(p,{flu:'Ravonlik',lex:'Lug\'at',gram:'Grammatika',task:'Mazmun'},`Part ${p.id}`,p.better)).join('')}
      <h4 style="margin:12px 0 6px">Javoblaringiz</h4>${(s.items||[]).map((it,i)=>`<div class="mlr-fb"><b>Part ${esc(it.part)}</b> — ${esc(it.q)}<div class="mlr-scr">${esc(it.text||'(nutq aniqlanmadi)')}</div>${det.speakAudio&&det.speakAudio[i]?`<audio controls src="${det.speakAudio[i]}" style="width:100%"></audio>`:''}<small style="color:#5E6B7A">${it.sec} s · ${words(it.text)} so'z</small></div>`).join('')}</details>`); }
  else if(det.speakingErr) h.push(errCard('Speaking',det.speakingErr,det.speakingPro));
  sh.body.innerHTML=`<div class="mlx-wrap">${h.join('')}<button class="mll-go" id="mlrBack">Imtihon markaziga qaytish</button></div>`;
  $(sh.x,'#mlxQ').textContent='Yopish';
  const back=()=>{ sh.close(); if(S.el) refresh().then(renderLobby); };
  $(sh.x,'#mlxQ').onclick=back; $(sh.body,'#mlrBack').onclick=back;
  const pb=$(sh.body,'[data-pro]'); if(pb) pb.onclick=()=>{ if(window.__wdOpenPro) window.__wdOpenPro(); };
}
function fbTask(t,crit,title,model){
  return `<div class="mlr-fb"><h4><span>${esc(title)}</span><span>${t.pts} / ${t.max}</span></h4><div class="mlr-crit">${Object.entries(crit).map(([k,l])=>`<div><b>${t[k]}/6</b>${l}</div>`).join('')}</div>
    ${t.good_uz?`<p><b>Yaxshi:</b> ${esc(t.good_uz)}</p>`:''}${t.fix_uz?`<p><b>Yaxshilash:</b> ${esc(t.fix_uz)}</p>`:''}
    ${(t.corr||[]).length?`<ul class="mlr-corr">${t.corr.map(c=>`<li><s>${esc(c.wrong)}</s> → <ins>${esc(c.right)}</ins><br><small style="color:#5E6B7A">${esc(c.uz)}</small></li>`).join('')}</ul>`:''}
    ${model?`<details><summary>Namunaviy javob</summary><div class="mlr-model">${esc(model)}</div></details>`:''}</div>`;
}
function errCard(sec,msg,pro){ return `<div class="mlr-fb"><h4>${sec} baholanmadi</h4><p>${esc(msg)}</p>${pro?`<button class="mll-btn pri" data-pro>WordDrop Pro</button>`:''}</div>`; }
function listeningScripts(L){
  const t=s=>(s||[]).map(x=>x.t).join(' ');
  return `<details><summary>Audio matnlari</summary>
    <div class="mlr-scr"><b>Part 1</b>\n${L.p1.map((x,i)=>`${i+1}. ${t(x.s)}`).join('\n')}</div>
    <div class="mlr-scr"><b>Part 2</b>\n${esc(t(L.p2.s))}</div>
    <div class="mlr-scr"><b>Part 3</b>\n${L.p3.sp.map((x,i)=>`Speaker ${i+1}: ${t(x.s)}`).join('\n\n')}</div>
    <div class="mlr-scr"><b>Part 4</b>\n${esc(t(L.p4.s))}</div>
    <div class="mlr-scr"><b>Part 5</b>\n${L.p5.map((e,i)=>`Extract ${i+1}: ${t(e.s)}`).join('\n\n')}</div>
    <div class="mlr-scr"><b>Part 6</b>\n${esc(t(L.p6.s))}</div></details>`;
}

/* =====================================================================
   ADMIN: TESTLAR BANKI VA YANGI TEST YARATISH
   ===================================================================== */
function adminHtml(){
  return `<h2 class="mll-h2">Testlar banki <span class="mll-st" style="vertical-align:3px">admin</span></h2>
    <div class="mll-card"><p class="mll-note" style="margin:0 0 10px">Yangi variant: AI har bir qismni alohida tuzadi va tekshiradi, keyin barcha audio yozuvlar va rasmlar tayyorlanadi (≈ 5–10 daqiqa). Sahifani yopmang.</p>
    <button class="mll-btn pri" id="mlNew">+ Yangi test yaratish</button><div class="mll-gen" id="mlGen"></div></div>
    <div class="mll-bank" style="margin-top:10px">${S.tests.map(t=>`<div class="mll-trow"><div class="t"><b>${esc(t.title)}</b><small>${new Date(t.created_at).toLocaleDateString('uz-UZ')} · ${t.uses||0} marta ishlatilgan · audio ${Object.keys(t.audio||{}).length} ta</small></div><span class="mll-st ${t.status}">${{ready:'Tayyor',draft:'Qoralama',hidden:'Yashirin'}[t.status]||t.status}</span>
      <button class="mll-btn" data-try="${t.id}">Sinab ko'rish</button>${t.status!=='ready'?`<button class="mll-btn" data-pub="${t.id}">Nashr qilish</button>`:`<button class="mll-btn" data-hide="${t.id}">Yashirish</button>`}${t.status==='draft'?`<button class="mll-btn" data-audio="${t.id}">Audio tayyorlash</button>`:''}<button class="mll-btn bad" data-del="${t.id}">O'chirish</button></div>`).join('')||'<p class="mll-note">Hali test yo\'q.</p>'}</div>`;
}
function bindAdmin(sc){
  $(sc,'#mlNew').onclick=()=>generate($(sc,'#mlGen'));
  $$(sc,'[data-try]').forEach(b=>b.onclick=()=>{ const m=prompt("Qaysi bo'lim? full / listening / reading / writing / speaking",'full'); if(m&&['full','listening','reading','writing','speaking'].includes(m.trim())) startNew(m.trim(),b.dataset.try); });
  $$(sc,'[data-pub]').forEach(b=>b.onclick=async()=>{ await sb().from('wd_ml_tests').update({status:'ready'}).eq('id',b.dataset.pub); await refresh(); renderLobby(); });
  $$(sc,'[data-hide]').forEach(b=>b.onclick=async()=>{ await sb().from('wd_ml_tests').update({status:'hidden'}).eq('id',b.dataset.hide); await refresh(); renderLobby(); });
  $$(sc,'[data-del]').forEach(b=>b.onclick=async()=>{ if(!confirm("Test o'chirilsinmi? Bu qaytarib bo'lmaydi.")) return; await sb().from('wd_ml_tests').delete().eq('id',b.dataset.del); await refresh(); renderLobby(); });
  $$(sc,'[data-audio]').forEach(b=>b.onclick=async()=>{ const T=await loadTest(b.dataset.audio); if(T) buildAudio(T,$(sc,'#mlGen')); });
}
/* Openverse (ochiq litsenziyali rasmlar) */
async function photo(q){
  try{ const r=await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=12&license_type=commercial&mature=false`); const j=await r.json();
    const ok=(j.results||[]).filter(x=>!x.width||x.width>=x.height*1.1);
    const x=ok[0]||(j.results||[])[0]; if(!x) return null;
    return {url:x.thumbnail||x.url,credit:`${x.creator?x.creator+' · ':''}${String(x.license||'').toUpperCase()} ${x.license_version||''} · Openverse`.trim(),link:x.foreign_landing_url||''};
  }catch(e){ return null; }
}
async function generate(box){
  const steps=[['txt',"Matnlar: Listening, Reading, Writing, Speaking"],['pic','Rasmlar (Openverse)'],['save','Saqlash'],['aud','Audio yozuvlar (TTS → MP3)'],['pub','Nashr']];
  box.innerHTML=`<ul class="mll-steps">${steps.map(([k,t])=>`<li data-st="${k}"><i>·</i><span>${t}</span></li>`).join('')}</ul><div class="mll-prog"><i id="mlPg"></i></div><p class="mll-note" id="mlLog"></p>`;
  const st=(k,cls,txt)=>{ const li=$(box,`[data-st="${k}"]`); li.className=cls; li.querySelector('i').textContent={on:'…',ok:'✓',err:'✗'}[cls]||'·'; if(txt) li.querySelector('span').textContent=txt; };
  const log=t=>{ $(box,'#mlLog').textContent=t; };
  const btn=document.getElementById('mlNew'); if(btn) btn.disabled=true;
  try{
    st('txt','on');
    // Tayyor qismlar brauzerda saqlanadi: xato bo'lsa, keyingi safar boshidan emas, qolgan joydan davom etadi
    const GK='wd_ml_gen_v1';
    let saved=null; try{ saved=JSON.parse(localStorage.getItem(GK)||'null'); }catch(e){}
    if(saved&&Date.now()-(saved.at||0)>3*864e5) saved=null;
    const res=saved&&saved.res||{listening:{},reading:{}}; let Wr=saved&&saved.Wr||null, SpS=saved&&saved.SpS||null;
    const persist=()=>{ try{ localStorage.setItem(GK,JSON.stringify({at:Date.now(),res,Wr,SpS})); }catch(e){} };
    const allJobs=[...['p1','p2','p3','p4','p5','p6'].map(p=>['listening',p]),...['p1','p2','p3','p4','p5'].map(p=>['reading',p]),['writing'],['speaking']];
    const isDone=([sec,p])=>p?!!res[sec][p]:sec==='writing'?!!Wr:!!SpS;
    const jobs=allJobs.filter(j=>!isDone(j));
    let jd=allJobs.length-jobs.length; const total=allJobs.length;
    const prog=()=>{ st('txt','on',`Matnlar: ${jd} / ${total} qism tayyor`); $(box,'#mlPg').style.width=Math.round(jd/total*100)+'%'; };
    if(jd) log(`Avvalgi urinishdan ${jd} ta qism saqlangan — davom ettirilmoqda.`);
    prog();
    const runJob=async([sec,p],force)=>{ let why='';
      for(let k=0;k<5;k++){ const j=await mlApi(Object.assign({mode:'ml_gen',section:sec},p?{part:p}:{},why?{why}:{}),145000);
        if(!j.__error){ if(p) res[sec][p]=j.data; else if(sec==='writing') Wr=j.W; else SpS=j.S; persist(); if(!force) jd++; prog(); return true; }
        why=j.why||''; log(`${SECN[sec]} ${p||''}: ${j.msg} — ${k<4?'qayta urinilmoqda ('+(k+2)+'/5)':"to'xtadi"}`); await sleep(4000*(k+1)); }
      return false; };
    const pool=async(list,n,force)=>{ const q=list.slice(); let ok=true; await Promise.all(Array.from({length:n},async()=>{ while(q.length){ if(!(await runJob(q.shift(),force))) ok=false; } })); return ok; };
    if(!(await pool(jobs,2))){ st('txt','err',`${jd} / ${total} qism tayyor va saqlandi. Qolganlari tuzilmadi — «Yangi test yaratish» ni qayta bosing, tayyorlari qayta tuzilmaydi.`); return; }
    // Mustaqil yechuvchi bilan tekshiruv; mos kelmagan qismlar bir marta qayta tuziladi
    const PARTQ={listening:[['p1',1,8],['p3',15,18],['p5',24,29]],reading:[['p2',7,14],['p3',15,20],['p4',21,29]]};
    const checks={};
    for(const sec of ['listening','reading']){
      for(let round=0;round<2;round++){
        st('txt','on',`${SECN[sec]}: javoblar mustaqil tekshirilmoqda…`);
        const c=await mlApi({mode:'ml_check',section:sec,data:res[sec]},150000); checks[sec]=c;
        if(c.__error||!c.solved||!(c.mism||[]).length) break;
        const bad=PARTQ[sec].filter(([p,a,b])=>c.mism.some(n=>n>=a&&n<=b)).map(([p])=>[sec,p]);
        if(round===1||!bad.length) break;
        log(`${SECN[sec]}: ${c.mism.join(', ')}-savollar shubhali — ${bad.map(x=>x[1]).join(', ')} qayta tuzilmoqda`);
        await pool(bad,2,true);
      }
    }
    const L={L:res.listening}, R={R:res.reading};
    const mm=[...((checks.listening||{}).mism||[]).map(n=>'L'+n),...((checks.reading||{}).mism||[]).map(n=>'R'+n)];
    st('txt','ok',`Matnlar tayyor · ${mm.length?'tekshiruvda shubhali: '+mm.join(', ')+' (sinab ko\'rib, kerak bo\'lsa yashiring)':'mustaqil tekshiruvdan o\'tdi'}`);
    const Sp={S:SpS}; Wr={W:Wr};
    st('pic','on'); const S2=Sp.S;
    const pics=await Promise.all([...S2.p12.pics.map(p=>photo(p.q)),photo(S2.p2.pic.q)]);
    S2.p12.pics=S2.p12.pics.map((p,i)=>({...p,...(pics[i]||{})})); S2.p2.pic={...S2.p2.pic,...(pics[2]||{})};
    st('pic','ok',`Rasmlar: ${pics.filter(Boolean).length} / 3`);
    st('save','on');
    const n=S.tests.length+1; const title=`Multilevel sinov #${n} — ${L.L.p4.title||''}`.slice(0,80);
    const {data,error}=await sb().from('wd_ml_tests').insert({title,status:'draft',listening:L.L,reading:R.R,writing:Wr.W,speaking:S2,created_by:await uid()}).select('*').single();
    if(error||!data){ st('save','err','Saqlanmadi: '+(error&&error.message)); return; }
    try{ localStorage.removeItem(GK); }catch(e){}
    st('save','ok');
    st('aud','on'); const okA=await buildAudio(data,box,(d,t)=>{ $(box,'#mlPg').style.width=Math.round(d/t*100)+'%'; st('aud','on',`Audio yozuvlar: ${d} / ${t}`); });
    if(!okA) st('aud','err',"MP3 yozuvlar to'liq tayyorlanmadi (Groq bepul ovoz limiti: kuniga ~3600 token). Test qurilma ovozi bilan ishlaydi; «Audio tayyorlash» keyinroq yetishmaganlarini qo'shadi.");
    else st('aud','ok');
    await sb().from('wd_ml_tests').update({status:'ready'}).eq('id',data.id); st('pub','ok','Nashr qilindi');
    log('Tayyor! Yangi variant foydalanuvchilarga ochildi.');
  }finally{ if(btn) btn.disabled=false; await refresh(); const keep=box.innerHTML; renderLobby(); const nb=document.getElementById('mlGen'); if(nb) nb.innerHTML=keep; }
}
/* ---- TTS → PCM → MP3 → Storage ---- */
function clipList(T){
  const L=T.listening, out=[];
  if(L){ L.p1.forEach((x,i)=>out.push(['l1_'+i,x.s])); out.push(['l2',L.p2.s]); L.p3.sp.forEach((x,i)=>out.push(['l3_'+i,x.s])); out.push(['l4',L.p4.s]); L.p5.forEach((e,i)=>out.push(['l5_'+i,e.s])); out.push(['l6',L.p6.s]); }
  if(T.speaking) speakingClips(T.speaking).forEach(([k,t])=>out.push([k,[{v:EXV,t}]]));
  return out;
}
function parseWav(buf){
  const dv=new DataView(buf); let p=12, sr=24000, bits=16, ch=1, data=null;
  while(p+8<=dv.byteLength){ const id=String.fromCharCode(dv.getUint8(p),dv.getUint8(p+1),dv.getUint8(p+2),dv.getUint8(p+3)); let len=dv.getUint32(p+4,true);
    if(id==='fmt '){ ch=dv.getUint16(p+10,true); sr=dv.getUint32(p+12,true); bits=dv.getUint16(p+22,true); }
    if(id==='data'){ if(len===0||len>dv.byteLength-p-8) len=dv.byteLength-p-8; data=new Int16Array(buf.slice(p+8,p+8+(len-len%2))); break; }
    p+=8+len+(len%2); }
  if(!data||bits!==16) return null;
  if(ch>1){ const m=new Int16Array(data.length/ch); for(let i=0;i<m.length;i++) m[i]=data[i*ch]; data=m; }
  return {sr,pcm:data};
}
async function ttsSeg(s){
  for(let k=0;k<2;k++){
    const d=window.__wdAI?await window.__wdAI({mode:'tts',text:s.t,voice:s.v}):null;
    if(d&&!d.__error&&d.audio){ const bin=atob(d.audio), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); const w=parseWav(u.buffer); if(w) return w; }
    await sleep(1500*(k+1));
  }
  return null;
}
let WORKER=null;
function encoder(){
  if(WORKER) return WORKER;
  const src=`importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');onmessage=function(e){var d=e.data;try{var enc=new lamejs.Mp3Encoder(1,d.sr,48),out=[],B=1152;for(var i=0;i<d.pcm.length;i+=B){var b=enc.encodeBuffer(d.pcm.subarray(i,i+B));if(b.length)out.push(b);}var f=enc.flush();if(f.length)out.push(f);postMessage({id:d.id,blob:new Blob(out,{type:'audio/mpeg'})});}catch(err){postMessage({id:d.id,err:String(err)});}};`;
  try{ WORKER=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'}))); }catch(e){ WORKER=null; }
  return WORKER;
}
function toMp3(pcm,sr){ const w=encoder(); if(!w) return Promise.resolve(null); const id=Math.random().toString(36).slice(2);
  return new Promise(res=>{ const h=e=>{ if(e.data.id!==id) return; w.removeEventListener('message',h); res(e.data.blob||null); }; w.addEventListener('message',h); w.postMessage({id,pcm,sr}); setTimeout(()=>res(null),120000); }); }
function wavBlob(pcm,sr){ const b=new ArrayBuffer(44+pcm.length*2), v=new DataView(b); const w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF'); v.setUint32(4,36+pcm.length*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,pcm.length*2,true); new Int16Array(b,44).set(pcm); return new Blob([b],{type:'audio/wav'}); }
async function buildAudio(T,box,prog){
  const clips=clipList(T).filter(([k])=>!(T.audio||{})[k]);
  const audio={...(T.audio||{})}; let done=0; const total=clips.length; const pg=prog||((d,t)=>{ const e=box&&box.querySelector('#mlPg'); if(e) e.style.width=Math.round(d/t*100)+'%'; });
  if(box&&!prog) box.innerHTML=`<p class="mll-note">Audio tayyorlanmoqda…</p><div class="mll-prog"><i id="mlPg"></i></div>`;
  let fail=0, streak=0, quota=false;
  const work=async([key,segs])=>{
    if(quota){ fail++; return; }
    const parts=[]; let sr=24000, prev=null;
    for(const s of segs){ const w=await ttsSeg(s); if(!w){ fail++; if(++streak>=3) quota=true; return; } streak=0; sr=w.sr; if(prev!==null) parts.push(new Int16Array(Math.round(sr*(prev===s.v?.35:.7)))); parts.push(w.pcm); prev=s.v; }
    parts.unshift(new Int16Array(Math.round(sr*.3))); parts.push(new Int16Array(Math.round(sr*.3)));
    const len=parts.reduce((a,p)=>a+p.length,0), pcm=new Int16Array(len); let o=0; for(const p of parts){ pcm.set(p,o); o+=p.length; }
    let blob=await toMp3(pcm,sr), ext='mp3';
    if(!blob){ blob=wavBlob(pcm,sr); ext='wav'; }
    const path=`${T.id}/${key}.${ext}`;
    const up=await sb().storage.from('ml-audio').upload(path,blob,{contentType:blob.type,upsert:true});
    if(up.error){ fail++; return; }
    audio[key]=sb().storage.from('ml-audio').getPublicUrl(path).data.publicUrl+'?v='+Date.now().toString(36);
    done++; pg(done,total);
    if(done%5===0) await sb().from('wd_ml_tests').update({audio}).eq('id',T.id);
  };
  const q=clips.slice(); const runners=Array.from({length:3},async()=>{ while(q.length){ await work(q.shift()); } });
  await Promise.all(runners);
  await sb().from('wd_ml_tests').update({audio}).eq('id',T.id);
  T.audio=audio;
  if(box&&!prog) box.innerHTML=`<p class="mll-note">${quota?`Audio: ${done}/${total} tayyor. Groq bepul ovoz limiti tugadi (kuniga ~3600 token) — ertaga yana «Audio tayyorlash» ni bosing. Shu orada test qurilma ovozi bilan ishlaydi.`:fail?`Audio: ${done}/${total} tayyor, ${fail} ta xato — «Audio tayyorlash»ni qayta bosing.`:'Audio tayyor.'}</p>`;
  return !fail;
}

window.WDML={open,close};
})();
