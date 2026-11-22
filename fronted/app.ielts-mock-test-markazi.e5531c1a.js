
/* ========== IELTS MOCK TEST MARKAZI — 3D imtihon zali ==========
   Sinfxonadan mutlaqo alohida modul: sovuq grafit zal, 4 stansiya
   (Listening / Reading / Writing / Speaking), jonli sessiya taxtasi,
   natijalar devori. Har modul o'z taymeri bilan o'tadi; yakunda
   rasmiy IELTS qoidasiga ko'ra umumiy Band Score hisoblanadi.
   AI server (Supabase Edge Function) yangi rejimlarni qo'llamasa —
   sifatli zaxira test to'plami va evristik baholash ishga tushadi,
   ilova hech qachon "o'lik nuqtaga" bormaydi. */
import * as THREE from 'three';

/* ================= 0. AI REJIMLAR + ZAXIRA ================= */
async function ieltsListeningAI(){
  const d=await aiRequest({mode:'ielts_listening'});
  if(d && typeof d.script==='string' && Array.isArray(d.gaps) && d.gaps.length>=5){
    // 8 tagacha savol, uzunroq skript (yangi ko'p bo'limli format)
    const gaps=d.gaps.slice(0,8).map(g=>({label:String(g.label||'').slice(0,120),answer:String(g.answer||'').trim().slice(0,40)})).filter(g=>g.label&&g.answer);
    if(gaps.length>=5) return {topic:String(d.topic||'Listening').slice(0,60),
      section:Number(d.section)||null, qtype:String(d.qtype||''), qtypeLabel:String(d.qtypeLabel||'').slice(0,40),
      script:String(d.script).slice(0,2400),gaps};
  }
  return null;
}
async function ieltsReadingAI(){
  const d=await aiRequest({mode:'ielts_reading'});
  if(d && typeof d.passage==='string' && Array.isArray(d.tfng) && Array.isArray(d.mcq)){
    const tf=d.tfng.slice(0,4).map(q=>({s:String(q.s||'').slice(0,220),answer:['T','F','NG'].includes(q.answer)?q.answer:null})).filter(q=>q.s&&q.answer);
    const mc=d.mcq.slice(0,4).map(q=>({q:String(q.q||'').slice(0,220),options:(q.options||[]).slice(0,4).map(o=>String(o).slice(0,140)),answer:Number(q.answer)})).filter(q=>q.q&&q.options.length===4&&q.answer>=0&&q.answer<4);
    if(tf.length>=3 && mc.length>=3){
      // Matching Headings — paragraf soni bilan mos kelishi shart
      let hd=null;
      const paraN=String(d.passage).split(/\n\n+/).filter(p=>p.trim()).length;
      if(d.headings && Array.isArray(d.headings.options) && Array.isArray(d.headings.answers)
         && d.headings.options.length>=5 && d.headings.answers.length>=2){
        const ans=d.headings.answers.slice(0,paraN).map(a=>Number(a)).filter(a=>a>=0&&a<d.headings.options.length);
        if(ans.length>=2) hd={options:d.headings.options.slice(0,9).map(o=>String(o).slice(0,90)),answers:ans};
      }
      // Summary Completion — bo'shliqlar soni javoblar soniga mos bo'lsin
      let sum=null;
      if(d.summary && typeof d.summary.text==='string' && Array.isArray(d.summary.answers)){
        const ansS=d.summary.answers.slice(0,5).map(a=>String(a||'').trim()).filter(Boolean);
        const marks=(d.summary.text.match(/\[\d\]/g)||[]).length;
        if(ansS.length>=3 && marks>=ansS.length) sum={text:String(d.summary.text).slice(0,900),answers:ansS};
      }
      return {title:String(d.title||'Reading').slice(0,80),passage:String(d.passage).slice(0,5200),
              headings:hd,summary:sum,tfng:tf,mcq:mc};
    }
  }
  return null;
}
async function ieltsSpeakingSetAI(){
  const d=await aiRequest({mode:'ielts_speaking_set'});
  if(d && Array.isArray(d.p1) && Array.isArray(d.p3) && d.cue && typeof d.cue.topic==='string'){
    const p1=d.p1.slice(0,3).map(q=>String(q||'').trim().slice(0,160)).filter(Boolean);
    const p3=d.p3.slice(0,4).map(q=>String(q||'').trim().slice(0,200)).filter(Boolean);
    const pts=(Array.isArray(d.cue.points)?d.cue.points:[]).slice(0,4).map(p=>String(p||'').trim().slice(0,90)).filter(Boolean);
    if(p1.length>=2 && p3.length>=2 && pts.length>=3){
      return {p1,cue:{topic:String(d.cue.topic).trim().slice(0,140),points:pts},p3};
    }
  }
  return null;
}
async function ieltsWritingEvalAI(task,essay){
  const d=await aiRequest({mode:'ielts_writing_eval',task,essay});
  const ok=v=>typeof v==='number'&&v>=1&&v<=9;
  if(d && ok(d.ta)&&ok(d.cc)&&ok(d.lr)&&ok(d.gra)){
    const half=v=>Math.round(v*2)/2;
    const c={ta:half(d.ta),cc:half(d.cc),lr:half(d.lr),gra:half(d.gra)};
    const band=half((c.ta+c.cc+c.lr+c.gra)/4);
    return {...c,band,feedback:(Array.isArray(d.feedback)?d.feedback:[]).slice(0,5).map(f=>String(f).slice(0,240)),ai:true};
  }
  return null;
}
async function ieltsSpeakingEvalAI(items){
  // Har javobni tozalab yuboramiz — SpeechRecognition artefaktlarini kesamiz
  const cleanItems = (items||[]).map(it => ({
    q: it && it.q ? String(it.q) : '',
    a: (typeof normalizeSpeech==='function')
       ? normalizeSpeech(String(it && it.a || ''))
       : String(it && it.a || '')
  }));
  const d=await aiRequest({mode:'ielts_speaking_eval',items:cleanItems});
  const ok=v=>typeof v==='number'&&v>=1&&v<=9;
  if(d && ok(d.fc)&&ok(d.lr)&&ok(d.gra)&&ok(d.pron)){
    const half=v=>Math.round(v*2)/2;
    const c={fc:half(d.fc),lr:half(d.lr),gra:half(d.gra),pron:half(d.pron)};
    const band=half((c.fc+c.lr+c.gra+c.pron)/4);
    return {...c,band,feedback:(Array.isArray(d.feedback)?d.feedback:[]).slice(0,5).map(f=>String(f).slice(0,240)),ai:true};
  }
  return null;
}

/* ---- Zaxira Listening (server rejimni qo'llamasa) ---- */
const FB_LISTENING={
  topic:"City library membership",
  script:"Good morning, you've reached the Riverside City Library. I'd be happy to help you register. First, could I take your full name? ... Thank you, that's Daniel Harper — H-A-R-P-E-R. And your date of birth? The fourteenth of March, nineteen ninety-eight. Now, which membership would you like? We offer a standard card, which is free, and a premium card for thirty-five pounds a year, which includes access to our recording studio. You'd like the premium one, excellent. Could I have your address? Flat six, forty-two Mill Road. And finally, how did you hear about us? Through a friend — lovely. Your card will be ready for collection on Tuesday at the main desk, which opens at half past nine.",
  gaps:[
    {label:"Surname", answer:"Harper"},
    {label:"Date of birth: 14 …", answer:"March"},
    {label:"Membership type", answer:"premium"},
    {label:"Annual fee: £ …", answer:"35"},
    {label:"Address: Flat 6, 42 … Road", answer:"Mill"},
    {label:"Card ready on", answer:"Tuesday"},
  ]
};
/* ---- Zaxira Reading ---- */
const FB_READING={
  title:"The quiet return of urban beekeeping",
  passage:"Two decades ago, keeping bees in a city was widely considered eccentric, if not irresponsible. Today, rooftop hives hum above banks, hotels and railway stations across Europe. The change began partly as a response to alarming reports of declining bee populations in the countryside, where intensive farming had stripped away wildflowers and introduced harmful pesticides. Cities, paradoxically, turned out to be surprisingly hospitable: parks, gardens and tree-lined streets offer a diverse, pesticide-light diet for much of the year.\n\nUrban honey has developed a reputation of its own. Because city bees forage on a wider variety of plants than their rural cousins, their honey often carries a more complex flavour. Some London hotels now serve honey produced on their own roofs, and several studies have found that urban honey can contain fewer agricultural chemical residues than rural samples.\n\nYet enthusiasm has brought new problems. In some districts the density of hives has grown faster than the supply of flowers, meaning bees may compete with wild pollinators such as bumblebees and solitary bees for limited food. Several city councils now encourage residents to plant nectar-rich flowers before installing new hives, arguing that the priority should be feeding pollinators rather than simply owning them.",
  tfng:[
    {s:"Twenty years ago, urban beekeeping was generally seen as unusual.", answer:"T"},
    {s:"Rural bee populations declined mainly because of urban expansion.", answer:"F"},
    {s:"All London hotels produce their own honey.", answer:"NG"},
    {s:"In some areas, hive numbers have grown faster than food sources for bees.", answer:"T"},
  ],
  mcq:[
    {q:"Why did cities prove suitable for bees?", options:["They are warmer than the countryside","They provide varied plants with fewer pesticides","They have fewer wild pollinators","They ban intensive farming"], answer:1},
    {q:"Urban honey often has a more complex flavour because city bees…", options:["work longer hours","are a different species","feed on a wider range of plants","are fed by beekeepers"], answer:2},
    {q:"What risk does the article mention?", options:["Honey prices falling","Bees attacking residents","Diseases spreading from rural hives","Competition with wild pollinators"], answer:3},
    {q:"What do some councils recommend doing first?", options:["Planting nectar-rich flowers","Registering every hive","Buying rural honey","Limiting park access"], answer:0},
  ]
};
/* ---- Writing Task 2 savollar banki (haqiqiy IELTS'dagidek statik bank) ---- */
const WRITING_PROMPTS=[
  "Some people believe that university education should be free for everyone, while others think students should pay for it themselves. Discuss both views and give your own opinion.",
  "In many countries, people are spending more time at work and less time with their families. What are the causes of this? What solutions can you suggest?",
  "Some argue that technology has made our lives more complicated rather than simpler. To what extent do you agree or disagree?",
  "Many cities are becoming increasingly crowded. Some say governments should encourage people to move to smaller towns. Do the advantages of this outweigh the disadvantages?",
  "Nowadays children spend a lot of time playing computer games and little time on sports. Why is this happening? Is it a positive or negative development?",
  "Some people think international tourism damages local cultures, while others believe it protects them. Discuss both views and give your opinion.",
  "In some countries, young people are encouraged to work or travel for a year between finishing school and starting university. What are the advantages and disadvantages of this?",
  "Some believe that the best way to reduce crime is to give longer prison sentences, while others think there are better ways. Discuss both views and give your opinion."
];
/* ---- Speaking savollar banki (Part 1 / Cue card / Part 3) ---- */
const SPEAKING_SETS=[
  {p1:["Let's talk about your daily routine. What is the busiest part of your day?","Do you prefer mornings or evenings? Why?"],
   cue:{topic:"Describe a skill you would like to learn.",points:["what the skill is","why you want to learn it","how you would learn it","and explain how it would change your life"]},
   p3:["Do you think adults find it harder to learn new skills than children? Why?",
       "How has the way people learn new skills changed compared with the past?",
       "What causes some people to give up learning a skill halfway through?",
       "Do you think formal education will still be necessary in fifty years' time?"]},
  {p1:["Let's talk about your hometown. What do you like most about the place where you grew up?","Has your hometown changed much in recent years?"],
   cue:{topic:"Describe a place in your city you enjoy visiting.",points:["where it is","how often you go there","what you do there","and explain why you enjoy it"]},
   p3:["How do you think cities will change in the next twenty years?",
       "Is life in a small town better or worse than life in a large city?",
       "What effects does rapid urban growth have on local communities?",
       "Should governments limit how large a city is allowed to become?"]},
  {p1:["Let's talk about books and reading. Do you prefer reading books or watching films?","What kind of books did you read as a child?"],
   cue:{topic:"Describe a book that influenced you.",points:["what the book was","when you read it","what it was about","and explain how it influenced you"]},
   p3:["Do you think printed books will disappear in the future? Why or why not?",
       "How does reading on a screen differ from reading on paper?",
       "Why do some people read far less once they finish their studies?",
       "If children stopped reading fiction entirely, what might society lose?"]},
  {p1:["Let's talk about travel. Do you enjoy travelling to new places?","What is more important to you when travelling: comfort or adventure?"],
   cue:{topic:"Describe a memorable journey you have taken.",points:["where you went","who you went with","what happened during the journey","and explain why it was memorable"]},
   p3:["Some people say tourism harms the environment. What is your view?",
       "How has the experience of travelling changed over the last thirty years?",
       "What impact does mass tourism have on local traditions?",
       "Would the world be better off if international travel became far more expensive?"]},
];

/* ================= BALL JADVALLARI ================= */
/* Rasmiy 40-savollik jadvaldan ulushga o'tkazilgan konversiya */
function fractionToBand(f){
  const T=[[.97,9],[.92,8.5],[.87,8],[.80,7.5],[.74,7],[.65,6.5],[.57,6],[.45,5.5],[.39,5],[.32,4.5],[.25,4],[.17,3.5]];
  for(const [th,b] of T) if(f>=th) return b;
  return 3;
}
/* Rasmiy yaxlitlash: o'rtacha .25 → .5 ga, .75 → keyingi butunga ko'tariladi */
function roundOverall(mean){
  const base=Math.floor(mean*2)/2;
  return (mean-base)>=0.25 ? base+0.5 : base;
}
function bandVerdict(b){
  if(b>=8) return "Expert darajaga juda yaqin";
  if(b>=7) return "Kuchli natija — ko'p universitetlar talabi";
  if(b>=6) return "Yaxshi poydevor — barqarorlikni oshiring";
  if(b>=5) return "O'rta daraja — muntazam mashq kerak";
  return "Boshlang'ich — asoslardan mustahkamlang";
}
/* ---- Evristik Writing baholash (AI server ulanmaganda) ---- */
function heuristicWritingEval(essay){
  const words=essay.trim().split(/\s+/).filter(Boolean);
  const wc=words.length;
  const sents=essay.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.split(/\s+/).length>2);
  const paras=essay.split(/\n\s*\n|\n/).map(p=>p.trim()).filter(p=>p.length>40).length;
  const linkers=['however','moreover','furthermore','in addition','on the other hand','therefore','consequently','for example','for instance','in conclusion','firstly','secondly','although','whereas','while','despite','nevertheless'];
  const low=essay.toLowerCase();
  const linkCount=linkers.filter(l=>low.includes(l)).length;
  const uniq=new Set(words.map(w=>w.toLowerCase().replace(/[^a-z']/g,''))).size;
  const ttr=wc?uniq/wc:0;
  let base= wc<80?4.5 : wc<130?5.0 : wc<170?5.5 : 6.0;
  if(linkCount>=4) base+=0.5;
  if(paras>=3 && sents.length>=6) base+=0.5;
  if(ttr<0.42) base-=0.5;
  base=Math.max(3.5,Math.min(6.5,base));
  const half=v=>Math.max(3,Math.min(9,Math.round(v*2)/2));
  const c={ta:half(base),cc:half(base+(paras>=3?0.5:-0.5)),lr:half(base+(ttr>0.5?0.5:0)),gra:half(base)};
  const band=half((c.ta+c.cc+c.lr+c.gra)/4);
  const fb=[`So'zlar soni: ${wc} (Task 2 uchun kamida 250 tavsiya etiladi).`,
    linkCount<4?"Bog'lovchi so'zlarni ko'paytiring: however, moreover, in conclusion…":"Bog'lovchi so'zlar yaxshi ishlatilgan.",
    paras<3?"Esseni kirish, 2 ta asosiy paragraf va xulosaga bo'ling.":"Paragraf tuzilishi joyida.",
    "Bu taxminiy baho — aniq baholash uchun AI serverini ulang (edge function'ga ielts rejimlarini qo'shing)."];
  return {...c,band,feedback:fb,ai:false};
}
/* ---- Evristik Speaking baholash ---- */
function heuristicSpeakingEval(items){
  const texts=items.map(i=>i.a||'');
  const totalW=texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const avg=totalW/Math.max(1,items.length);
  let base= avg<8?4.0 : avg<18?4.5 : avg<30?5.0 : avg<45?5.5 : 6.0;
  const all=texts.join(' ').toLowerCase();
  const uniq=new Set(all.split(/\s+/).map(w=>w.replace(/[^a-z']/g,'')).filter(Boolean)).size;
  if(uniq>70) base+=0.5;
  base=Math.max(3.5,Math.min(6.5,base));
  const half=v=>Math.max(3,Math.min(9,Math.round(v*2)/2));
  const c={fc:half(base),lr:half(base),gra:half(base),pron:half(base+0.5)};
  const band=half((c.fc+c.lr+c.gra+c.pron)/4);
  return {...c,band,feedback:["Javoblaringizni kengaytiring — har savolga 3-4 gap bilan javob bering.","Bu taxminiy baho — aniq baholash uchun AI serverini ulang."],ai:false};
}
/* ---- Gap javobini tekshirish: normalizatsiya + 1 harf xatoga ruxsat ---- */
function normAns(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim(); }
function levSm(a,b){
  const m=a.length,n=b.length; if(Math.abs(m-n)>1) return 9;
  let prev=Array.from({length:n+1},(_,i)=>i),cur=new Array(n+1);
  for(let i=1;i<=m;i++){cur[0]=i;
    for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    [prev,cur]=[cur,prev];}
  return prev[n];
}
function gapCorrect(user,answer){
  const u=normAns(user),a=normAns(answer);
  if(!u) return false;
  if(u===a) return true;
  return a.length>=5 && levSm(u,a)<=1;
}

/* ================= 1. DOM + HOLAT ================= */
const XOV=document.getElementById('exam-overlay');
const XCV=document.getElementById('exam-canvas');
const XPANEL=document.getElementById('exam-panel');
const XACTION=document.getElementById('exAction');
const XHINT=document.getElementById('exam-hint');
const XHUDTIMER=document.getElementById('exHudTimer');
const XCAND=document.getElementById('exCandName');
const MODULE_META={
  L:{name:'Listening',uz:'Tinglash',dur:10*60},
  R:{name:'Reading',uz:"O'qish",dur:15*60},
  W:{name:'Writing',uz:'Yozish',dur:20*60},
  S:{name:'Speaking',uz:'Gapirish',dur:12*60},
};
let session=null;     // {mode:'full'|'single', plan:[], idx, bands:{}, detail:{}, startedAt}
let timerId=null, timerLeft=0, timerEnd=null;
let xInited=false, xRenderer=null, xScene=null, xCamera=null, xAnim=null, xClock=null;
let xPos=new THREE.Vector3(0,0,3.6), xYaw=Math.PI, xPitch=0;
let xFwd=false, xBack=false;
const XCOLL=[];
const ROOM_W=13, ROOM_D=11, ROOM_H=3.3;
let stations=[];      // {code,label,mesh,px,pz,signTex}
let certGroup=null, boardTex=null, boardCv=null, clockTex=null, clockCv=null;
let nearStation=null, lastBoardDraw=0;

function candName(){ return (window.__wdName&&window.__wdName.trim()) || 'Candidate 001'; }
function fmtT(s){ s=Math.max(0,Math.round(s)); const m=Math.floor(s/60),ss=s%60; return String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0'); }

/* ================= 2. OVOZ (imtihon ichida to'liq boshqariladigan TTS) ================= */
let exUtter=null, exSpeakEnd=null;
function exSpeak(text,opts={}){
  return (async()=>{
    // 1) Server ovozi (Groq TTS) — tabiiy, sekinlashtirish shart emas
    if(typeof window.__wdServerSpeak==='function'){
      try{ const ok=await window.__wdServerSpeak(text,{rate:opts.srvRate||1}); if(ok) return true; }catch(e){}
    }
    // 2) Zaxira: tizim ovozi (speechSynthesis)
    return await new Promise(res=>{
      if(!('speechSynthesis' in window)){ res(false); return; }
      try{ speechSynthesis.cancel(); }catch(e){}
      const u=new SpeechSynthesisUtterance(text);
      let v=null;
      try{ v=(typeof pickEnglishVoice==='function')?pickEnglishVoice():null; }catch(e){}
      if(v) u.voice=v;
      u.lang='en-US'; u.rate=opts.rate||0.92; u.pitch=1; u.volume=1;
      u.onend=()=>{ exUtter=null; res(true); };
      u.onerror=()=>{ exUtter=null; res(false); };
      exUtter=u;
      speechSynthesis.speak(u);
    });
  })();
}
function exStopSpeak(){
  try{ if(typeof window.__wdServerStop==='function') window.__wdServerStop(); }catch(e){}
  try{ speechSynthesis.cancel(); }catch(e){}
  exUtter=null;
}

/* ================= 3. CANVAS TEKSTURALAR ================= */
function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function rrx(x,px,py,pw,ph,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+pw,py,px+pw,py+ph,r);x.arcTo(px+pw,py+ph,px,py+ph,r);x.arcTo(px,py+ph,px,py,r);x.arcTo(px,py,px+pw,py,r);x.closePath();}

/* Jonli sessiya taxtasi — old devordagi katta LED panel */
function drawBoard(){
  if(!boardCv) return;
  const x=boardCv.getContext('2d'), W=1024, H=512;
  x.fillStyle='#07090D'; x.fillRect(0,0,W,H);
  // nozik LED panel to'ri
  x.strokeStyle='rgba(255,255,255,.028)'; x.lineWidth=1;
  for(let gx=0;gx<W;gx+=16){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx,H); x.stroke(); }
  for(let gy=0;gy<H;gy+=16){ x.beginPath(); x.moveTo(0,gy); x.lineTo(W,gy); x.stroke(); }
  x.textBaseline='middle';
  // yuqori qator: markaz nomi + qizil status nuqta
  x.fillStyle='#8B94A7'; x.font='700 26px Inter,sans-serif'; x.textAlign='left';
  x.fillText('WORDDROP EXAM CENTER',46,52);
  x.textAlign='right'; x.fillStyle='#E8374A'; x.font='800 24px Inter,sans-serif';
  const now=new Date();
  x.fillText(now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase(),W-46,52);
  x.strokeStyle='#1C2431'; x.lineWidth=2; x.beginPath(); x.moveTo(46,84); x.lineTo(W-46,84); x.stroke();
  x.textAlign='left';
  if(session){
    const meta=MODULE_META[session.plan[session.idx]]||{name:'—'};
    x.fillStyle='#8B94A7'; x.font='800 22px Inter,sans-serif';
    x.fillText('SESSION IN PROGRESS',46,132);
    x.fillStyle='#E8374A'; x.beginPath(); x.arc(316,132,9,0,7); x.fill();
    x.fillStyle='#EDF1F7'; x.font='800 64px Inter,sans-serif';
    x.fillText(meta.name.toUpperCase(),46,208);
    x.fillStyle='#8B94A7'; x.font='700 26px Inter,sans-serif';
    x.fillText('MODULE '+(session.idx+1)+' OF '+session.plan.length+'   ·   '+candName().toUpperCase(),46,266);
    // katta taymer
    x.fillStyle=timerLeft<60?'#E8374A':'#EDF1F7'; x.font='700 130px Inter,sans-serif'; x.textAlign='right';
    x.fillText(fmtT(timerLeft),W-46,206);
    x.textAlign='left';
  }else{
    x.fillStyle='#EDF1F7'; x.font='800 58px Inter,sans-serif';
    x.fillText('IELTS MOCK TEST',46,170);
    x.fillStyle='#8B94A7'; x.font='600 27px Inter,sans-serif';
    x.fillText('Listening · Reading · Writing · Speaking',46,228);
    x.fillStyle='#37D0A0'; x.font='800 24px Inter,sans-serif';
    x.fillText('● READY',46,282);
    x.fillStyle='#8B94A7';
    x.fillText('  —  taxtaga yaqinlashib, to\u2019liq mockni boshlang',158,282);
  }
  // pastki qator: modul chiplar
  const codes=['L','R','W','S'];
  codes.forEach((c,i)=>{
    const bx=46+i*242, by=340, bw=220, bh=118;
    const done=session&&session.bands&&(session.bands[c]!=null);
    const active=session&&session.plan[session.idx]===c;
    x.fillStyle=active?'rgba(232,55,74,.16)':'rgba(255,255,255,.04)';
    rrx(x,bx,by,bw,bh,16); x.fill();
    x.strokeStyle=active?'#E8374A':(done?'#37D0A0':'#232B3A'); x.lineWidth=3;
    rrx(x,bx,by,bw,bh,16); x.stroke();
    x.fillStyle='#8B94A7'; x.font='800 20px Inter,sans-serif'; x.textAlign='left';
    x.fillText(MODULE_META[c].name.toUpperCase(),bx+20,by+34);
    x.font='800 46px Inter,sans-serif';
    if(done){ x.fillStyle='#37D0A0'; x.fillText(session.bands[c].toFixed(1),bx+20,by+82); }
    else{ x.fillStyle=active?'#E8374A':'#3A4658'; x.fillText(active?'● LIVE':'—',bx+20,by+82); }
  });
  if(boardTex) boardTex.needsUpdate=true;
}
/* Devor soati — haqiqiy vaqt */
function drawClock(){
  if(!clockCv) return;
  const x=clockCv.getContext('2d'), S=256, c=S/2;
  x.clearRect(0,0,S,S);
  x.fillStyle='#F2F4F8'; x.beginPath(); x.arc(c,c,120,0,7); x.fill();
  x.strokeStyle='#1B2029'; x.lineWidth=10; x.beginPath(); x.arc(c,c,116,0,7); x.stroke();
  x.strokeStyle='#8B94A7'; x.lineWidth=4;
  for(let i=0;i<12;i++){ const a=i*Math.PI/6;
    x.beginPath(); x.moveTo(c+Math.sin(a)*100,c-Math.cos(a)*100); x.lineTo(c+Math.sin(a)*88,c-Math.cos(a)*88); x.stroke(); }
  const n=new Date(), hr=(n.getHours()%12+n.getMinutes()/60)*Math.PI/6, mn=n.getMinutes()*Math.PI/30;
  x.strokeStyle='#12161F'; x.lineCap='round';
  x.lineWidth=9; x.beginPath(); x.moveTo(c,c); x.lineTo(c+Math.sin(hr)*52,c-Math.cos(hr)*52); x.stroke();
  x.lineWidth=6; x.beginPath(); x.moveTo(c,c); x.lineTo(c+Math.sin(mn)*80,c-Math.cos(mn)*80); x.stroke();
  x.fillStyle='#E8374A'; x.beginPath(); x.arc(c,c,7,0,7); x.fill();
  if(clockTex) clockTex.needsUpdate=true;
}
/* Stansiya belgisi — shisha to'siq ustidagi plastina */
function mkSignTex(code){
  const cv=mkCanvas(512,192), x=cv.getContext('2d');
  x.fillStyle='#0D1119'; rrx(x,4,4,504,184,22); x.fill();
  x.strokeStyle='#2A3446'; x.lineWidth=3; rrx(x,4,4,504,184,22); x.stroke();
  x.fillStyle='#E8374A'; rrx(x,26,58,10,76,5); x.fill();
  x.textBaseline='middle'; x.textAlign='left';
  x.fillStyle='#8B94A7'; x.font='800 24px Inter,sans-serif';
  x.fillText('STATION '+(['L','R','W','S'].indexOf(code)+1),58,74);
  x.fillStyle='#EDF1F7'; x.font='800 52px Inter,sans-serif';
  x.fillText(MODULE_META[code].name.toUpperCase(),56,132);
  const t=new THREE.CanvasTexture(cv); t.anisotropy=4; return t;
}
/* QUIET PLEASE belgisi */
function mkQuietTex(){
  const cv=mkCanvas(512,256), x=cv.getContext('2d');
  x.fillStyle='#F2F4F8'; rrx(x,4,4,504,248,20); x.fill();
  x.strokeStyle='#D3D8E2'; x.lineWidth=3; rrx(x,4,4,504,248,20); x.stroke();
  x.textAlign='center'; x.textBaseline='middle';
  x.fillStyle='#E8374A'; x.font='900 68px Inter,sans-serif';
  x.fillText('QUIET',256,92);
  x.fillStyle='#12161F'; x.font='800 52px Inter,sans-serif';
  x.fillText('PLEASE',256,166);
  x.fillStyle='#8B94A7'; x.font='700 22px Inter,sans-serif';
  x.fillText('EXAMINATION IN PROGRESS',256,222);
  return new THREE.CanvasTexture(cv);
}
/* Sertifikat teksturasi — natijalar devori romi uchun (yangi Editorial dizayn) */
function mkCertTex(rec){
  // roundRect polyfill (agar bo'lmasa)
  if(!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
      if(w<2*r)r=w/2;if(h<2*r)r=h/2;this.beginPath();this.moveTo(x+r,y);
      this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);
      this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();
    };
  }
  const cv=mkCanvas(1024,720), x=cv.getContext('2d');
  /* TUZATISH: eski/buzilgan yozuvda overall yoki modul ballari bo'lmasa
     canvas'da "NaN" chizilardi. Endi har bir qiymat tekshiriladi. */
  const nb=v=>(typeof v==='number'&&isFinite(v))?v:0;
  rec={...rec, l:nb(rec.l), r:nb(rec.r), w:nb(rec.w), s:nb(rec.s)};
  const overall=(typeof rec.overall==='number'&&isFinite(rec.overall))
    ? rec.overall : ((rec.l+rec.r+rec.w+rec.s)/4);
  // LEFT (dark navy) — ~46%
  x.fillStyle='#0F1B3D'; x.fillRect(0,0,471,720);
  const g=x.createRadialGradient(420,100,20,420,100,240);
  g.addColorStop(0,'rgba(47,111,237,.35)'); g.addColorStop(1,'rgba(47,111,237,0)');
  x.fillStyle=g; x.fillRect(0,0,471,720);
  // Brand
  x.textAlign='left'; x.textBaseline='alphabetic';
  x.fillStyle='#fff'; x.font='800 26px Inter,sans-serif';
  x.fillText('Word',42,70);
  const wW=x.measureText('Word').width;
  x.fillStyle='#8FB4F8'; x.fillText('Drop',42+wW,70);
  x.fillStyle='#8791AF'; x.font='600 11px Inter,monospace';
  x.fillText('EXAM CENTER · RASMIY NATIJA',42,92);
  // Kicker pill
  x.fillStyle='rgba(255,255,255,.05)';
  x.strokeStyle='rgba(255,255,255,.14)'; x.lineWidth=1;
  x.beginPath(); x.roundRect(42,210,240,28,14); x.fill(); x.stroke();
  x.fillStyle='#2F6FED';
  x.beginPath(); x.arc(56,224,3.5,0,Math.PI*2); x.fill();
  x.fillStyle='#B7BFD3'; x.font='600 10px Inter,sans-serif';
  x.fillText('IELTS MOCK · YAKUNIY NATIJA',70,228);
  // Title
  x.fillStyle='#fff'; x.font='800 48px Inter,sans-serif';
  x.fillText('Certificate',42,300);
  x.fillStyle='#DDE3F0'; x.font='italic 400 42px Georgia,serif';
  x.fillText('of achievement',42,350);
  // Berildi
  x.fillStyle='#8791AF'; x.font='600 10px Inter,sans-serif';
  x.fillText('BERILDI · AWARDED TO',42,400);
  // Name
  x.fillStyle='#fff'; x.font='800 34px Inter,sans-serif';
  const nm=(rec.name||'Candidate');
  // Truncate long names to fit
  const maxNameW=390;
  let nameToDraw=nm;
  if(x.measureText(nameToDraw).width>maxNameW){
    while(nameToDraw.length>3 && x.measureText(nameToDraw+'…').width>maxNameW) nameToDraw=nameToDraw.slice(0,-1);
    nameToDraw+='…';
  }
  x.fillText(nameToDraw,42,442);
  x.strokeStyle='rgba(255,255,255,.16)'; x.lineWidth=1;
  x.beginPath(); x.moveTo(42,460); x.lineTo(430,460); x.stroke();
  // Sig
  x.strokeStyle='rgba(255,255,255,.1)';
  x.beginPath(); x.moveTo(42,620); x.lineTo(430,620); x.stroke();
  // Imzo — oq plate va chiziqcha bir xil kenglikda (204px)
  const plateX=36, plateW=204;
  if(window.__WD_SIG_IMG__ && window.__WD_SIG_IMG__.complete && window.__WD_SIG_IMG__.naturalWidth){
    const sig=window.__WD_SIG_IMG__;
    // Imzo balandligi max 44, kengligi max 180, aspect saqlansin
    const maxImgW=180, maxImgH=44;
    const aspect=sig.naturalWidth/sig.naturalHeight;
    let iw=maxImgW, ih=iw/aspect;
    if(ih>maxImgH){ ih=maxImgH; iw=ih*aspect; }
    const plateH=ih+10;
    const plateY=618-plateH;
    x.fillStyle='#FFFFFF';
    x.fillRect(plateX,plateY,plateW,plateH);
    // Rasm plate ichida markazga
    x.drawImage(sig,plateX+(plateW-iw)/2,plateY+5,iw,ih);
  }else{
    x.fillStyle='#FFFFFF';
    x.fillRect(plateX,570,plateW,48);
    x.fillStyle='#0F1B3D'; x.font='italic 400 22px Georgia,serif';
    x.textAlign='center';
    x.fillText("B. Yo'ldoshev",plateX+plateW/2,600);
    x.textAlign='left';
  }
  // Chiziqcha — plate bilan bir xil kenglikda (204px, 36 dan 240 gacha)
  x.strokeStyle='rgba(255,255,255,.55)'; x.lineWidth=1.5;
  x.beginPath(); x.moveTo(plateX,620); x.lineTo(plateX+plateW,620); x.stroke();
  x.fillStyle='#8791AF'; x.font='600 9px Inter,sans-serif';
  x.fillText('SIGNED · BOSH EXAMINER',plateX,640);
  // RIGHT (paper) — ~54%
  x.fillStyle='#FAFAF7'; x.fillRect(471,0,553,720);
  // Overall label
  x.fillStyle='#4A5578'; x.font='700 11px Inter,sans-serif';
  x.fillText('OVERALL BAND SCORE',512,70);
  // Date top-right
  x.textAlign='right';
  x.fillStyle='#4A5578'; x.font='500 10px Inter,monospace';
  x.fillText('Imtihon sanasi',992,58);
  x.fillStyle='#0F1B3D'; x.font='700 11px Inter,monospace';
  x.fillText(new Date(rec.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase(),992,74);
  x.textAlign='left';
  // Big number
  x.fillStyle='#0F1B3D'; x.font='italic 400 180px Georgia,serif';
  const s=overall.toFixed(1);
  const whole=s.split('.')[0], dec='.'+s.split('.')[1];
  const wholeW=x.measureText(whole).width;
  const startX=580;
  x.fillText(whole,startX,290);
  x.fillStyle='#2F6FED';
  x.fillText(dec,startX+wholeW,290);
  // "/ 9.0"
  x.fillStyle='#4A5578'; x.font='600 11px Inter,sans-serif';
  x.fillText('/ 9.0',startX+wholeW+x.measureText(dec).width+8,250);
  // CEFR pill
  const cefr=(function(b){ if(b>=8)return'C2';if(b>=7)return'C1';if(b>=5.5)return'B2';if(b>=4)return'B1';if(b>=3)return'A2';return'A1';})(overall);
  const cefrX=startX+wholeW+x.measureText(dec).width+8;
  x.fillStyle='#E8F0FE';
  x.beginPath(); x.roundRect(cefrX,262,58,32,6); x.fill();
  x.fillStyle='#2F6FED'; x.font='800 22px Inter,sans-serif';
  x.textAlign='center'; x.fillText(cefr,cefrX+29,286); x.textAlign='left';
  // Verdict
  const verd=(function(b){
    if(b>=8.5)return 'Expert user — mutlaqo erkin';
    if(b>=8)return 'Very good — expertga juda yaqin';
    if(b>=7.5)return 'Very good — kuchli barqarorlik';
    if(b>=7)return 'Good — universitet talabi';
    if(b>=6.5)return 'Competent — ishonchli poydevor';
    if(b>=6)return 'Competent — barqarorlikni oshiring';
    if(b>=5.5)return 'Modest — o\'rtacha barqarorlik';
    if(b>=5)return 'Modest — muntazam mashq kerak';
    return 'Limited — asoslarni mustahkamlang';
  })(overall);
  x.fillStyle='#1F2A50'; x.font='italic 400 20px Georgia,serif';
  x.textAlign='center';
  x.fillText('"'+verd+'"',748,340);
  x.textAlign='left';
  // Modules
  const mods=[['LISTENING',rec.l],['READING',rec.r],['WRITING',rec.w],['SPEAKING',rec.s]];
  mods.forEach((m,i)=>{
    const bx=512+i*128, by=400;
    x.fillStyle='#fff';
    x.strokeStyle='#EFEFE7'; x.lineWidth=1;
    x.beginPath(); x.roundRect(bx,by,116,88,12); x.fill(); x.stroke();
    x.fillStyle='#4A5578'; x.font='700 9px Inter,sans-serif';
    x.fillText(m[0],bx+12,by+22);
    x.fillStyle='#0F1B3D'; x.font='800 28px Inter,sans-serif';
    x.fillText((m[1]||0).toFixed(1),bx+12,by+62);
    x.fillStyle='#EFEFE7'; x.fillRect(bx+12,by+72,92,3);
    x.fillStyle='#0F1B3D'; x.fillRect(bx+12,by+72,92*((m[1]||0)/9),3);
  });
  // Bottom border + disclaimer
  x.strokeStyle='#E4E4DC'; x.lineWidth=1;
  x.setLineDash([4,4]);
  x.beginPath(); x.moveTo(512,530); x.lineTo(992,530); x.stroke();
  x.setLineDash([]);
  x.fillStyle='#8791AF'; x.font='500 11px Inter,sans-serif';
  x.fillText('Mock testi natijasi. Rasmiy IELTS emas — universitet va',512,568);
  x.fillText('muassasalarga qiymati yo\'q. Faqat shaxsiy tayyorgarlik uchun.',512,588);
  // Verify text
  x.fillStyle='#0F1B3D'; x.font='700 10px Inter,sans-serif';
  x.fillText('SKANERLAB TEKSHIRING',512,640);
  x.fillStyle='#2F6FED'; x.font='600 12px Inter,monospace';
  x.fillText('worddrop-app.uz',512,660);
  // Serial (right side)
  x.textAlign='right';
  x.fillStyle='#4A5578'; x.font='500 10px Inter,monospace';
  x.fillText('Seriya · Serial',992,640);
  const seed=(rec.name||'X')+rec.date;
  let h=2166136261>>>0;
  for(let i=0;i<seed.length;i++){ h^=seed.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  const initials=(rec.name||'X').split(/\s+/).map(w=>w[0]||'').join('').toUpperCase().slice(0,3).padEnd(3,'X');
  const serial='WD-'+new Date(rec.date).getFullYear()+'-'+initials+'-'+String(h%999999).padStart(6,'0');
  x.fillStyle='#0F1B3D'; x.font='700 11px Inter,monospace';
  x.fillText(serial,992,660);
  x.textAlign='left';
  const t=new THREE.CanvasTexture(cv); t.anisotropy=8; return t;
}
/* Gilam pol — karo plitkali, sovuq grafit */
function mkCarpetTex(){
  const cv=mkCanvas(512,512), x=cv.getContext('2d');
  x.fillStyle='#151920'; x.fillRect(0,0,512,512);
  for(let i=0;i<5200;i++){
    x.fillStyle=Math.random()<.5?'rgba(255,255,255,.022)':'rgba(0,0,0,.28)';
    x.fillRect(Math.random()*512,Math.random()*512,1.6,1.6);
  }
  x.strokeStyle='rgba(0,0,0,.4)'; x.lineWidth=3;
  for(let g=0;g<=512;g+=128){ x.beginPath();x.moveTo(g,0);x.lineTo(g,512);x.stroke(); x.beginPath();x.moveTo(0,g);x.lineTo(512,g);x.stroke(); }
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(5,4.2); return t;
}
/* AI examiner planshet ekrani */
function mkExaminerTex(){
  const cv=mkCanvas(256,384), x=cv.getContext('2d');
  x.fillStyle='#0A0D12'; x.fillRect(0,0,256,384);
  const g=x.createRadialGradient(128,140,10,128,140,140);
  g.addColorStop(0,'rgba(232,55,74,.4)'); g.addColorStop(1,'rgba(232,55,74,0)');
  x.fillStyle=g; x.fillRect(0,0,256,384);
  x.strokeStyle='#E8374A'; x.lineWidth=5;
  x.beginPath(); x.arc(128,128,52,0,7); x.stroke();
  x.fillStyle='#E8374A'; x.beginPath(); x.arc(128,112,17,0,7); x.fill();
  x.beginPath(); x.arc(128,166,30,Math.PI,0,true); x.fill();
  x.fillStyle='#EDF1F7'; x.textAlign='center'; x.font='800 24px Inter,sans-serif';
  x.fillText('AI EXAMINER',128,236);
  x.fillStyle='#8B94A7'; x.font='600 17px Inter,sans-serif';
  x.fillText('Speaking module',128,266);
  // ovoz to'lqini
  x.strokeStyle='#37D0A0'; x.lineWidth=4; x.lineCap='round';
  const bars=[10,26,44,30,14,34,50,26,12];
  bars.forEach((b,i)=>{ const bx=68+i*15; x.beginPath(); x.moveTo(bx,330-b/2); x.lineTo(bx,330+b/2); x.stroke(); });
  return new THREE.CanvasTexture(cv);
}

/* ================= 4. SAHNA ================= */
function xAddColl(cx,cz,hw,hd){ XCOLL.push({minx:cx-hw,maxx:cx+hw,minz:cz-hd,maxz:cz+hd}); }
function xBox(w,h,d,color,px,py,pz,ry=0,rough=.75,metal=0,emissive=null,ei=0){
  const mat=new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
  if(emissive){ mat.emissive=new THREE.Color(emissive); mat.emissiveIntensity=ei; }
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(px,py,pz); m.rotation.y=ry; xScene.add(m); return m;
}
function xCyl(r,h,color,px,py,pz,rz=0,rx=0,rough=.5){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),
    new THREE.MeshStandardMaterial({color,roughness:rough}));
  m.position.set(px,py,pz); m.rotation.z=rz; m.rotation.x=rx; xScene.add(m); return m;
}
/* Zamonaviy imtihon stoli: oq stol usti, grafit yon panellar, LED chiziq */
function buildExamDesk(px,pz,ry=0){
  const g=new THREE.Group(); g.position.set(px,0,pz); g.rotation.y=ry; xScene.add(g);
  const add=(mesh,ox,oy,oz)=>{ xScene.remove(mesh); mesh.position.set(ox,oy,oz); g.add(mesh); return mesh; };
  add(xBox(1.5,0.05,0.72,'#F4F6FA',0,0,0,0,.3),0,0.78,0);
  add(xBox(1.44,0.05,0.66,'#20262F',0,0,0,0,.6),0,0.735,0);
  add(xBox(0.06,0.76,0.68,'#20262F',0,0,0,0,.55),-0.71,0.38,0);
  add(xBox(0.06,0.76,0.68,'#20262F',0,0,0,0,.55),0.71,0.38,0);
  add(xBox(1.36,0.32,0.05,'#181D26',0,0,0,0,.6),0,0.56,-0.3);
  const led=add(xBox(1.34,0.015,0.015,'#E8374A',0,0,0,0,.4,0,'#E8374A',1.4),0,0.755,0.345);
  // Stul — minimal, grafit
  const cz=0.62;
  add(xBox(0.46,0.05,0.44,'#262D38',0,0,0,0,.45),0,0.47,cz);
  add(xBox(0.46,0.5,0.05,'#262D38',0,0,0,0,.45),0,0.74,cz+0.2);
  add(xCyl(0.035,0.44,'#4A5568',0,0,0),0,0.24,cz);
  add(xBox(0.4,0.035,0.4,'#4A5568',0,0,0,Math.PI/4,.4,.6),0,0.04,cz);
  return g;
}
/* Shisha to'siq (stansiyalar orasida) + belgi plastinasi */
function buildDivider(px,pz,ry,code){
  const glass=new THREE.Mesh(new THREE.BoxGeometry(0.04,1.5,1.7),
    new THREE.MeshStandardMaterial({color:'#AFC2D8',roughness:.08,metalness:.1,transparent:true,opacity:0.18}));
  glass.position.set(px,1.15,pz); glass.rotation.y=ry; xScene.add(glass);
  xBox(0.07,0.06,1.74,'#4A5568',px,0.42,pz,ry,.4,.6);
  const st=mkSignTex(code);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(0.92,0.345),
    new THREE.MeshBasicMaterial({map:st,transparent:false}));
  sign.position.set(px,1.62,pz); sign.rotation.y=ry+Math.PI/2; xScene.add(sign);
  const sign2=sign.clone(); sign2.rotation.y=ry-Math.PI/2; xScene.add(sign2);
}
/* Quloqchin (Listening) — sodda: kamon + ikki quloq */
function buildHeadphones(px,py,pz){
  const arc=new THREE.Mesh(new THREE.TorusGeometry(0.11,0.016,10,24,Math.PI),
    new THREE.MeshStandardMaterial({color:'#12161F',roughness:.4}));
  arc.position.set(px,py+0.1,pz); xScene.add(arc);
  [-0.108,0.108].forEach(ox=>{
    const cup=xCyl(0.045,0.05,'#12161F',px+ox,py+0.045,pz,Math.PI/2,0,.35);
    xCyl(0.03,0.054,'#E8374A',px+ox,py+0.045,pz,Math.PI/2,0,.35);
  });
}

/* Xonani qurish */
function buildRoom(){
  xScene.background=new THREE.Color('#07090D');
  xScene.fog=new THREE.Fog('#07090D',9,22);
  // Yorug'lik — sovuq oq, imtihon zali
  const hemi=new THREE.HemisphereLight(0xEAF0FA,0x0A0D14,0.85); xScene.add(hemi);
  const dir=new THREE.DirectionalLight(0xDCE8FF,0.55); dir.position.set(3,6,2); xScene.add(dir);
  const p1=new THREE.PointLight(0xE8F0FF,14,12); p1.position.set(-3,3,0); xScene.add(p1);
  const p2=new THREE.PointLight(0xE8F0FF,14,12); p2.position.set(3,3,-1); xScene.add(p2);
  // Pol — karo gilam
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W,ROOM_D),
    new THREE.MeshStandardMaterial({map:mkCarpetTex(),roughness:.95}));
  floor.rotation.x=-Math.PI/2; xScene.add(floor);
  // Shift — grafit + perimetr LED chizig'i
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W,ROOM_D),
    new THREE.MeshStandardMaterial({color:'#0E1218',roughness:.9}));
  ceil.rotation.x=Math.PI/2; ceil.position.y=ROOM_H; xScene.add(ceil);
  const ledMat=new THREE.MeshStandardMaterial({color:'#DCE8FF',emissive:'#DCE8FF',emissiveIntensity:1.6,roughness:.4});
  [[0,ROOM_H-0.06,-ROOM_D/2+0.25,ROOM_W-1,0.03,0.06],[0,ROOM_H-0.06,ROOM_D/2-0.25,ROOM_W-1,0.03,0.06],
   [-ROOM_W/2+0.25,ROOM_H-0.06,0,0.06,0.03,ROOM_D-1],[ROOM_W/2-0.25,ROOM_H-0.06,0,0.06,0.03,ROOM_D-1]].forEach(a=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(a[3],a[4],a[5]),ledMat);
    m.position.set(a[0],a[1],a[2]); xScene.add(m);
  });
  // Devorlar: pastki grafit vaynskot + ustki sovuq oq
  const mkWall=(w,px,pz,ry)=>{
    xBox(w,1.0,0.1,'#181E27',px,0.5,pz,ry,.8);
    xBox(w,ROOM_H-1.0,0.1,'#E7EAF0',px,1.0+(ROOM_H-1.0)/2,pz,ry,.9);
    xBox(w,0.05,0.12,'#3A4658',px,1.02,pz,ry,.5,.4);
  };
  mkWall(ROOM_W,0,-ROOM_D/2,0);         // old
  mkWall(ROOM_W,0,ROOM_D/2,0);          // orqa (natijalar devori)
  mkWall(ROOM_D,-ROOM_W/2,0,Math.PI/2); // chap
  mkWall(ROOM_D,ROOM_W/2,0,Math.PI/2);  // o'ng
  xAddColl(0,-ROOM_D/2,ROOM_W/2,0.3); xAddColl(0,ROOM_D/2,ROOM_W/2,0.3);
  xAddColl(-ROOM_W/2,0,0.3,ROOM_D/2); xAddColl(ROOM_W/2,0,0.3,ROOM_D/2);

  // Old devor: jonli sessiya taxtasi
  boardCv=mkCanvas(1024,512); boardTex=new THREE.CanvasTexture(boardCv); boardTex.anisotropy=4;
  const board=new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.3),
    new THREE.MeshBasicMaterial({map:boardTex}));
  board.position.set(0,1.95,-ROOM_D/2+0.09); xScene.add(board);
  xBox(4.78,2.46,0.06,'#12161F',0,1.95,-ROOM_D/2+0.05,0,.4,.3);
  drawBoard();
  window.__exBoardMesh=board;

  // Devor soati (o'ng devor markazi tepasida)
  clockCv=mkCanvas(256,256); clockTex=new THREE.CanvasTexture(clockCv);
  const clk=new THREE.Mesh(new THREE.CircleGeometry(0.42,40),
    new THREE.MeshBasicMaterial({map:clockTex,transparent:true}));
  clk.position.set(ROOM_W/2-0.09,2.5,0); clk.rotation.y=-Math.PI/2; xScene.add(clk);
  drawClock();

  // QUIET PLEASE (chap devor markazida)
  const q=new THREE.Mesh(new THREE.PlaneGeometry(1.15,0.575),
    new THREE.MeshBasicMaterial({map:mkQuietTex()}));
  q.position.set(-ROOM_W/2+0.09,2.35,0); q.rotation.y=Math.PI/2; xScene.add(q);

  // Eshik (orqa devor cheti)
  xBox(1.1,2.25,0.08,'#242B36',ROOM_W/2-1.6,1.125,ROOM_D/2-0.08,0,.6);
  xCyl(0.028,0.24,'#8B94A7',ROOM_W/2-2.02,1.1,ROOM_D/2-0.14,Math.PI/2,0,.3);

  /* ---- 4 STANSIYA ---- */
  stations=[];
  // Chap devor bo'ylab: Listening (old), Reading (orqa)
  const Ld={px:-ROOM_W/2+1.55, pz:-2.2}, Rd={px:-ROOM_W/2+1.55, pz:1.4};
  // O'ng devor bo'ylab: Writing (old), Speaking (orqa)
  const Wd={px:ROOM_W/2-1.55, pz:-2.2}, Sd={px:ROOM_W/2-1.55, pz:1.4};
  buildExamDesk(Ld.px,Ld.pz,Math.PI/2); buildHeadphones(Ld.px,0.805,Ld.pz-0.12);
  xAddColl(Ld.px,Ld.pz,0.95,0.95);
  buildDivider(Ld.px+0.35,(Ld.pz+Rd.pz)/2,0,'L');
  buildExamDesk(Rd.px,Rd.pz,Math.PI/2);
  // Reading: qog'oz dastasi + qalam
  xBox(0.42,0.012,0.3,'#F7F8FA',Rd.px+0.05,0.795,Rd.pz-0.05,0.12,.8);
  xBox(0.42,0.012,0.3,'#EDEFF4',Rd.px+0.02,0.782,Rd.pz-0.03,-0.06,.8);
  xCyl(0.011,0.17,'#E0A429',Rd.px-0.25,0.795,Rd.pz+0.1,Math.PI/2,0,.5).rotation.y=0.6;
  xAddColl(Rd.px,Rd.pz,0.95,0.95);
  buildDivider(Rd.px+0.35,Rd.pz+1.8,0,'R');
  buildExamDesk(Wd.px,Wd.pz,-Math.PI/2);
  // Writing: ochiq daftar + ruchka
  xBox(0.3,0.014,0.42,'#FBFBF6',Wd.px-0.16,0.795,Wd.pz,0,.85);
  xBox(0.3,0.014,0.42,'#F2F1EA',Wd.px+0.15,0.795,Wd.pz,0,.85);
  xBox(0.015,0.02,0.42,'#C9CFD8',Wd.px-0.005,0.797,Wd.pz,0,.5);
  xCyl(0.01,0.16,'#12161F',Wd.px+0.28,0.8,Wd.pz+0.08,Math.PI/2,0,.4).rotation.y=-0.5;
  xAddColl(Wd.px,Wd.pz,0.95,0.95);
  buildDivider(Wd.px-0.35,(Wd.pz+Sd.pz)/2,0,'W');
  buildExamDesk(Sd.px,Sd.pz,-Math.PI/2);
  // Speaking: AI examiner planshet stend + mikrofon
  xCyl(0.05,0.06,'#20262F',Sd.px-0.32,0.835,Sd.pz,0,0,.4);
  xCyl(0.018,0.3,'#2A3446',Sd.px-0.32,1.0,Sd.pz,0,0,.4);
  const tab=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.51),
    new THREE.MeshBasicMaterial({map:mkExaminerTex()}));
  tab.position.set(Sd.px-0.31,1.36,Sd.pz); tab.rotation.y=-Math.PI/2; xScene.add(tab);
  xBox(0.04,0.55,0.38,'#12161F',Sd.px-0.335,1.36,Sd.pz,0,.4);
  xCyl(0.012,0.14,'#12161F',Sd.px+0.05,0.87,Sd.pz+0.16,0.35,0,.4);
  const mic=new THREE.Mesh(new THREE.SphereGeometry(0.032,12,10),
    new THREE.MeshStandardMaterial({color:'#E8374A',roughness:.4}));
  mic.position.set(Sd.px+0.02,0.95,Sd.pz+0.14); xScene.add(mic);
  xAddColl(Sd.px,Sd.pz,0.95,0.95);
  buildDivider(Sd.px-0.35,Sd.pz+1.8,0,'S');

  // Stansiya nishonlari (yaqinlik + raycast uchun ko'rinmas plita)
  [['L',Ld],['R',Rd],['W',Wd],['S',Sd]].forEach(([code,p])=>{
    const hit=new THREE.Mesh(new THREE.BoxGeometry(1.9,2.0,1.9),
      new THREE.MeshBasicMaterial({visible:false}));
    hit.position.set(p.px,1,p.pz); hit.userData.station=code; xScene.add(hit);
    stations.push({code,px:p.px,pz:p.pz,mesh:hit});
  });

  // Kutish burchagi: 2 o'rindiq + suv kuler (orqa chap)
  const wx=-ROOM_W/2+1.4, wz=ROOM_D/2-1.3;
  [0,0.85].forEach(o=>{
    xBox(0.6,0.07,0.55,'#2A3446',wx+o,0.44,wz,0,.5);
    xBox(0.6,0.5,0.07,'#2A3446',wx+o,0.72,wz+0.24,0,.5);
    xBox(0.5,0.05,0.5,'#4A5568',wx+o,0.2,wz,0,.4,.5);
  });
  xAddColl(wx+0.4,wz,1.0,0.5);
  xCyl(0.16,0.9,'#E7EAF0',wx+1.9,0.45,wz,0,0,.6);
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.34,16),
    new THREE.MeshStandardMaterial({color:'#7FB4E8',roughness:.15,transparent:true,opacity:.7}));
  bottle.position.set(wx+1.9,1.08,wz); xScene.add(bottle);
  xAddColl(wx+1.9,wz,0.3,0.3);

  rebuildCerts();
}
/* Natijalar devori — orqa devorga sertifikat romlari */
function rebuildCerts(){
  if(!xScene) return;           // TUZATISH: 3D sahna ochilmagan holda chaqirilsa crash bo'lardi
  if(certGroup){ xScene.remove(certGroup); certGroup.traverse(o=>{ if(o.material&&o.material.map) o.material.map.dispose(); if(o.material) o.material.dispose(); if(o.geometry) o.geometry.dispose(); }); }
  certGroup=new THREE.Group(); xScene.add(certGroup);
  const hist=(window.__wdIelts||[]).slice(-6).reverse();
  // Sarlavha plitasi
  const hcv=mkCanvas(768,128), hx=hcv.getContext('2d');
  hx.fillStyle='rgba(0,0,0,0)'; hx.clearRect(0,0,768,128);
  hx.textAlign='center'; hx.textBaseline='middle';
  hx.fillStyle='#3A4658'; hx.font='800 58px Inter,sans-serif';
  hx.fillText('R E S U L T S',384,64);
  const hplane=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.43),
    new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(hcv),transparent:true}));
  hplane.position.set(-1.2,2.72,ROOM_D/2-0.09); hplane.rotation.y=Math.PI; certGroup.add(hplane);
  if(!hist.length){
    const ecv=mkCanvas(640,320), ex=ecv.getContext('2d');
    ex.fillStyle='#12161F'; rrx(ex,4,4,632,312,20); ex.fill();
    ex.setLineDash([14,10]); ex.strokeStyle='#2A3446'; ex.lineWidth=4; rrx(ex,10,10,620,300,16); ex.stroke();
    ex.textAlign='center'; ex.textBaseline='middle';
    ex.fillStyle='#8B94A7'; ex.font='700 30px Inter,sans-serif';
    ex.fillText('Birinchi mock natijangiz',320,130);
    ex.fillText('shu yerga osiladi',320,176);
    const ep=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.85),
      new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(ecv),transparent:true}));
    ep.position.set(-1.2,1.75,ROOM_D/2-0.1); ep.rotation.y=Math.PI; certGroup.add(ep);
    return;
  }
  hist.forEach((rec,i)=>{
    const col=i%3, row=Math.floor(i/3);
    const px=-2.6+col*1.42, py=2.05-row*1.05;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1.26,0.96,0.05),
      new THREE.MeshStandardMaterial({color:'#1B222D',roughness:.5,metalness:.2}));
    frame.position.set(px,py,ROOM_D/2-0.1); frame.rotation.y=Math.PI; certGroup.add(frame);
    const cert=new THREE.Mesh(new THREE.PlaneGeometry(1.14,0.855),
      new THREE.MeshBasicMaterial({map:mkCertTex(rec),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    cert.position.set(px,py,ROOM_D/2-0.15); cert.rotation.y=Math.PI;
    cert.userData.cert=rec; certGroup.add(cert);
  });
}

/* ================= 5. BOSHQARUV + TICK ================= */
function initExam(){
  xInited=true;
  xRenderer=new THREE.WebGLRenderer({canvas:XCV,antialias:true});
  /* WebGL KONTEKST HIMOYASI (v90): brauzer xotira siqilganda yoki ilova uzoq
     ochiq turganda WebGL kontekstini majburan yopadi -> sahna oq/qora bo'lib
     qolardi va faqat ilovadan chiqib kirgach tiklanardi. Endi hodisa ushlanadi:
     foydalanuvchi xabardor qilinadi va kontekst qaytganda sahna qayta chiziladi. */
  try{
    XCV.addEventListener('webglcontextlost',ev=>{
      ev.preventDefault();
      try{ if(typeof showToast==='function') showToast('Grafika vaqtincha to\u2019xtadi \u2014 tiklanmoqda\u2026',IC&&IC.info); }catch(e){}
    },false);
    XCV.addEventListener('webglcontextrestored',()=>{
      /* sahna keyingi kadrda o'zi chiziladi */
      try{ if(typeof showToast==='function') showToast('Grafika tiklandi',IC&&IC.info); }catch(e){}
    },false);
  }catch(e){}
  xRenderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  xCamera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,0.12,60);
  xScene=new THREE.Scene();
  xClock=new THREE.Clock();
  buildRoom();
  onExResize();
}
function onExResize(){
  if(!xRenderer) return;
  xRenderer.setSize(innerWidth,innerHeight,false);
  xCamera.aspect=innerWidth/innerHeight; xCamera.updateProjectionMatrix();
}
window.addEventListener('resize',()=>{ if(XOV && !XOV.hidden) onExResize(); });

let xDrag=null, xMoved=0, xDownT=0;
XCV.addEventListener('pointerdown',e=>{ xDrag=[e.clientX,e.clientY]; xMoved=0; xDownT=performance.now(); });
XCV.addEventListener('pointermove',e=>{
  if(!xDrag) return;
  const dx=e.clientX-xDrag[0], dy=e.clientY-xDrag[1];
  xDrag=[e.clientX,e.clientY]; xMoved+=Math.abs(dx)+Math.abs(dy);
  xYaw-=dx*0.0042;
  xPitch=Math.max(-0.7,Math.min(0.7,xPitch-dy*0.0032));
});
XCV.addEventListener('pointerup',e=>{
  const tap=xDrag && xMoved<8 && (performance.now()-xDownT)<350;
  xDrag=null;
  if(tap) exTap(e);
});
XCV.addEventListener('pointercancel',()=>{ xDrag=null; });
function holdBtn(el,set){
  el.addEventListener('pointerdown',ev=>{ ev.preventDefault(); set(true); el.classList.add('hold'); el.setPointerCapture&&el.setPointerCapture(ev.pointerId); });
  ['pointerup','pointercancel','pointerleave'].forEach(t=>el.addEventListener(t,()=>{ set(false); el.classList.remove('hold'); }));
}
holdBtn(document.getElementById('exFwd'),v=>xFwd=v);
holdBtn(document.getElementById('exBack2'),v=>xBack=v);
window.addEventListener('keydown',e=>{ if(XOV.hidden) return; if(e.key==='w'||e.key==='W')xFwd=true; if(e.key==='s'||e.key==='S')xBack=true; });
window.addEventListener('keyup',e=>{ if(e.key==='w'||e.key==='W')xFwd=false; if(e.key==='s'||e.key==='S')xBack=false; });

function exTap(e){
  const r=XCV.getBoundingClientRect();
  const nx=((e.clientX-r.left)/r.width)*2-1, ny=-((e.clientY-r.top)/r.height)*2+1;
  const rc=new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(nx,ny),xCamera);
  // Sertifikat romlari
  if(certGroup){
    const certs=[]; certGroup.traverse(o=>{ if(o.userData&&o.userData.cert) certs.push(o); });
    const ch=rc.intersectObjects(certs,false);
    if(ch.length && ch[0].distance<4.5){ showResultPanel(ch[0].object.userData.cert,true); return; }
  }
  // Sessiya taxtasi — to'liq mock
  if(window.__exBoardMesh){
    const bh=rc.intersectObject(window.__exBoardMesh,false);
    if(bh.length && bh[0].distance<5.5){ offerFullMock(); return; }
  }
  // Stansiyalar
  const hits=rc.intersectObjects(stations.map(s=>s.mesh),false);
  if(hits.length && hits[0].distance<3.4){
    offerStation(hits[0].object.userData.station);
  }
}
function tryMove(nx,nz){
  const RAD=0.34;
  let ok=true;
  for(const c of XCOLL){
    if(nx>c.minx-RAD&&nx<c.maxx+RAD&&nz>c.minz-RAD&&nz<c.maxz+RAD){ ok=false; break; }
  }
  if(ok){ xPos.x=nx; xPos.z=nz; return; }
  // devor bo'ylab sirpanish
  let okX=true;
  for(const c of XCOLL){ if(nx>c.minx-RAD&&nx<c.maxx+RAD&&xPos.z>c.minz-RAD&&xPos.z<c.maxz+RAD){ okX=false; break; } }
  if(okX){ xPos.x=nx; return; }
  let okZ=true;
  for(const c of XCOLL){ if(xPos.x>c.minx-RAD&&xPos.x<c.maxx+RAD&&nz>c.minz-RAD&&nz<c.maxz+RAD){ okZ=false; break; } }
  if(okZ) xPos.z=nz;
}
let lastClockMin=-1;
function exTick(){
  xAnim=requestAnimationFrame(exTick);
  if(document.hidden) return;   // fonda GPU yuklanmasin
  const dt=Math.min(0.05,xClock.getDelta());
  const sp=2.5*dt, dirv=(xFwd?1:0)-(xBack?1:0);
  if(dirv!==0){
    tryMove(xPos.x-Math.sin(xYaw)*sp*dirv, xPos.z-Math.cos(xYaw)*sp*dirv);
    const M=0.4;
    xPos.x=Math.max(-ROOM_W/2+M,Math.min(ROOM_W/2-M,xPos.x));
    xPos.z=Math.max(-ROOM_D/2+M,Math.min(ROOM_D/2-M,xPos.z));
  }
  xCamera.position.set(xPos.x,1.52,xPos.z);
  xCamera.rotation.set(0,0,0);
  xCamera.rotateY(xYaw); xCamera.rotateX(xPitch);
  // Yaqinlik: eng yaqin stansiya
  let best=null,bd=2.3;
  for(const s of stations){
    const d=Math.hypot(xPos.x-s.px,xPos.z-s.pz);
    if(d<bd){ bd=d; best=s; }
  }
  // Taxtaga yaqinlik
  const boardDist=Math.hypot(xPos.x-0,xPos.z-(-ROOM_D/2));
  if(!session && best){
    if(nearStation!==best.code){
      nearStation=best.code;
      XACTION.innerHTML=`<span class="ea-dot"></span><span><small>Station ${['L','R','W','S'].indexOf(best.code)+1}</small><br>${MODULE_META[best.code].name} — mashq boshlash</span>`;
      XACTION.classList.add('show');
      XACTION.onclick=()=>offerStation(best.code);
    }
  }else if(!session && boardDist<3.6){
    if(nearStation!=='BOARD'){
      nearStation='BOARD';
      XACTION.innerHTML=`<span class="ea-dot"></span><span><small>Full mock</small><br>To\u2019liq Mock Test boshlash</span>`;
      XACTION.classList.add('show');
      XACTION.onclick=()=>offerFullMock();
    }
  }else if(nearStation){
    nearStation=null;
    XACTION.classList.remove('show');
  }
  // Soat: har daqiqa
  const mn=new Date().getMinutes();
  if(mn!==lastClockMin){ lastClockMin=mn; drawClock(); }
  // Taxta: sekundiga bir
  const nowP=performance.now();
  if(nowP-lastBoardDraw>1000){ lastBoardDraw=nowP; drawBoard(); }
  xRenderer.render(xScene,xCamera);
}

/* ================= 6. TAYMER ================= */
function startTimer(sec,onEnd){
  stopTimer();
  timerLeft=sec;
  updTimerUI();
  timerEnd=onEnd;
  timerId=setInterval(()=>{
    timerLeft--;
    updTimerUI();
    if(timerLeft<=0){
      stopTimer();
      if(timerEnd){ const f=timerEnd; timerEnd=null; f(); }
    }
  },1000);
}
function stopTimer(){ if(timerId){ clearInterval(timerId); timerId=null; } }
function updTimerUI(){
  const t=fmtT(timerLeft), low=timerLeft<60&&timerLeft>0;
  XHUDTIMER.textContent=session?t:'--:--';
  XHUDTIMER.classList.toggle('low',!!session&&low);
  const pt=XPANEL.querySelector('#epTimer');
  if(pt){ pt.textContent=t; pt.classList.toggle('low',low); }
}

/* ================= 7. PANEL KARKASI ================= */
function panelFrame({kicker,title,timer=true,body,foot}){
  const steps=session&&session.plan.length>1
    ? `<div class="ep-steps">${session.plan.map((c,i)=>`<i class="${i<session.idx?'done':(i===session.idx?'on':'')}"></i>`).join('')}</div>`
    : '';
  XPANEL.innerHTML=`
    <div class="ep-head">
      <div class="ep-head-row">
        <div style="flex:1;min-width:0">
          <div class="ep-kicker">${kicker}</div>
          <div class="ep-title">${title}</div>
        </div>
        ${timer?`<div class="ep-timer"><b id="epTimer">${fmtT(timerLeft)}</b><span>Qolgan vaqt</span></div>`:''}
      </div>
      ${steps}
    </div>
    <div class="ep-body" id="epBody">${body}</div>
    ${foot?`<div class="ep-foot">${foot}</div>`:''}`;
  XPANEL.classList.add('show');
}
function panelHide(){ XPANEL.classList.remove('show'); setTimeout(()=>{ if(!XPANEL.classList.contains('show')) XPANEL.innerHTML=''; },320); }
function renderLoading(msg){
  panelFrame({kicker:'IELTS MOCK TEST',title:'Tayyorlanmoqda',timer:false,
    body:`<div class="ex-loading"><div class="xl-bar"><i></i></div><p>${msg}</p></div>`,foot:''});
}
const ICPLAY='<svg viewBox="0 0 24 24" class="ic"><path d="M7 4 L19 12 L7 20 Z"/></svg>';
const ICMIC='<svg viewBox="0 0 24 24" class="ic"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11 C5.5 14.6 8.4 17 12 17 C15.6 17 18.5 14.6 18.5 11"/><path d="M12 17 V21 M8.5 21 H15.5"/></svg>';
const ICSTOP='<svg viewBox="0 0 24 24" class="ic"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/></svg>';

/* ================= 8. SESSIYA OQIMI ================= */
function offerFullMock(){
  if(session){ showToast("Sessiya davom etmoqda",IC.info); return; }
  const layer=openSheet(`
    <div class="sh-intro-icon" style="background:linear-gradient(150deg,#141B28,#2A1218);border:1px solid #E8374A"><span style="color:#E8374A;font-weight:900;font-size:12px">MOCK</span></div>
    <h2>To\u2019liq Mock Test</h2>
    <p class="desc">4 modul ketma-ket o\u2019tadi: <b>Listening</b> (~10 daq) → <b>Reading</b> (15 daq) → <b>Writing</b> (20 daq) → <b>Speaking</b> (~10 daq). Har modul o\u2019z taymeriga ega — vaqt tugasa javoblar avtomatik topshiriladi. Yakunda rasmiy qoidaga ko\u2019ra umumiy Band Score chiqadi va sertifikat devorga osiladi. Tinch joy va quloqchin tavsiya etiladi.</p>
    <button class="btn btn-primary btn-block" id="goMock" style="background:linear-gradient(135deg,#E8374A,#C61E31)">Boshlash</button>`);
  layer.querySelector('#goMock').addEventListener('click',()=>{ closeSheet(); startSession(['L','R','W','S'],'full'); });
}
function offerStation(code){
  if(session){ showToast("Avval joriy sessiyani yakunlang",IC.info); return; }
  const m=MODULE_META[code];
  const layer=openSheet(`
    <div class="sh-intro-icon" style="background:linear-gradient(150deg,#141B28,#2A1218);border:1px solid #E8374A"><span style="color:#E8374A;font-weight:900;font-size:15px">${code}</span></div>
    <h2>${m.name} mashqi</h2>
    <p class="desc">Faqat <b>${m.name}</b> moduli, ${Math.round(m.dur/60)} daqiqalik taymer bilan. Yakunda shu modul uchun band ball chiqadi. Sertifikat faqat to\u2019liq mockda beriladi.</p>
    <button class="btn btn-primary btn-block" id="goSingle" style="background:linear-gradient(135deg,#E8374A,#C61E31)">Boshlash</button>`);
  layer.querySelector('#goSingle').addEventListener('click',()=>{ closeSheet(); startSession([code],'single'); });
}
function startSession(plan,mode){
  session={mode,plan,idx:0,bands:{},detail:{},startedAt:Date.now()};
  XCAND.textContent=candName();
  XACTION.classList.remove('show'); nearStation=null;
  drawBoard();
  runModule();
}
async function runModule(){
  const code=session.plan[session.idx];
  if(code==='L') await runListening();
  else if(code==='R') await runReading();
  else if(code==='W') await runWriting();
  else if(code==='S') await runSpeaking();
}
function moduleDone(code,band,detail){
  stopTimer(); exStopSpeak(); stopRec();
  if(!session) return;          // TUZATISH: null.bands[...] -> TypeError bo'lardi
  session.bands[code]=band;
  session.detail[code]=detail||null;
  drawBoard();
  if(session.idx+1<session.plan.length){
    const next=MODULE_META[session.plan[session.idx+1]];
    panelFrame({kicker:'MODUL YAKUNLANDI',title:MODULE_META[code].name,timer:false,
      body:`<div class="rz-hero">
        <div class="rz-ring" style="--p:${band/9*100}"><b>${band.toFixed(1)}</b><span>Band</span></div>
        <div class="rz-verdict">${MODULE_META[code].name} yakunlandi</div>
        <div class="rz-date">Keyingi modul: <b style="color:#EDF1F7">${next.name}</b> · ${Math.round(next.dur/60)} daqiqa</div>
      </div>
      ${detail&&detail.summary?`<div class="ep-card">${detail.summary}</div>`:''}`,
      foot:`<button class="ep-btn pri" id="nextMod">Keyingi modul — ${next.name}</button>`});
    XPANEL.querySelector('#nextMod').addEventListener('click',()=>{ session.idx++; drawBoard(); runModule(); });
  }else{
    finishSession();
  }
}
function finishSession(){
  const s=session;
  if(s.mode==='full'){
    const rec={
      date:Date.now(), name:candName(),
      l:s.bands.L, r:s.bands.R, w:s.bands.W, sp:s.bands.S,
    };
    rec.s=rec.sp; delete rec.sp;
    /* TUZATISH: modul band'i yetishmasa ilgari NaN chiqib, sertifikat va
       o'sish grafigi "NaN" bilan buzilardi. Endi 3.0 (eng past band) qo'yiladi. */
    ['l','r','w','s'].forEach(k=>{ if(typeof rec[k]!=='number' || !isFinite(rec[k])) rec[k]=3; });
    rec.overall=roundOverall((rec.l+rec.r+rec.w+rec.s)/4);
    window.__wdIelts=(window.__wdIelts||[]);
    window.__wdIelts.push(rec);
    if(window.__wdIelts.length>24) window.__wdIelts=window.__wdIelts.slice(-24);
    saveState();
    try{ if(typeof addXP==='function') addXP(Math.round(rec.overall*12)); }catch(e){}
    try{ if(window.__wdAddCoins) window.__wdAddCoins(25); }catch(e){}
    try{ if(typeof unlockAch==='function') unlockAch('ielts_first'); }catch(e){}
    try{ rebuildCerts(); }catch(e){}
    try{ fireConfetti(); }catch(e){}
    showResultPanel(rec,false);
    try{ if(window.__wdDailyProgress) window.__wdDailyProgress('ielts'); }catch(e){}
    try{ const sr=Object.assign({},rec); setTimeout(()=>{ if(window.__wdStoryOffer) window.__wdStoryOffer('ielts',sr,"Band "+Number(sr.overall).toFixed(1)+": story uchun rasm"); },1600); }catch(e){}
  }else{
    try{ if(window.__wdDailyProgress) window.__wdDailyProgress('ielts'); }catch(e){}
    const code=s.plan[0], band=s.bands[code], det=s.detail[code];
    try{ if(typeof addXP==='function') addXP(Math.round(band*6)); }catch(e){}
    panelFrame({kicker:'MASHQ NATIJASI',title:MODULE_META[code].name,timer:false,
      body:`<div class="rz-hero">
        <div class="rz-ring" style="--p:${band/9*100}"><b>${band.toFixed(1)}</b><span>Band</span></div>
        <div class="rz-verdict">${bandVerdict(band)}</div>
        <div class="rz-date">+${Math.round(band*6)} XP</div>
      </div>
      ${det&&det.critHtml?det.critHtml:''}
      ${det&&det.summary?`<div class="ep-card">${det.summary}</div>`:''}`,
      foot:`<button class="ep-btn sec" id="rzAgain">Yana</button><button class="ep-btn pri" id="rzHall">Zalga qaytish</button>`});
    const done=()=>{ session=null; drawBoard(); updTimerUI(); };
    XPANEL.querySelector('#rzHall').addEventListener('click',()=>{ done(); panelHide(); });
    XPANEL.querySelector('#rzAgain').addEventListener('click',()=>{ done(); startSession([code],'single'); });
  }
}
function showResultPanel(rec,fromWall){
  /* TUZATISH: natijalar devoridagi eski yozuvda ball bo'lmasa
     rec.l.toFixed(...) -> TypeError berib, panel umuman ochilmasdi. */
  const nb=v=>(typeof v==='number'&&isFinite(v))?v:0;
  rec={...rec, l:nb(rec.l), r:nb(rec.r), w:nb(rec.w), s:nb(rec.s),
       overall:(typeof rec.overall==='number'&&isFinite(rec.overall))?rec.overall:nb(rec.overall)};
  const s=fromWall?null:session;
  const wDet=s&&s.detail.W, sDet=s&&s.detail.S;
  const critRow=(lbl,v)=>`<div class="rz-crit"><span>${lbl}</span><b>${v.toFixed(1)}</b></div>`;
  panelFrame({kicker:'IELTS MOCK TEST · NATIJA',title:'Band Score',timer:false,
    body:`
    <div class="rz-hero">
      <div class="rz-ring" style="--p:${rec.overall/9*100}"><b>${rec.overall.toFixed(1)}</b><span>Overall</span></div>
      <div class="rz-verdict">${bandVerdict(rec.overall)}</div>
      <div class="rz-date">${escapeHtml(rec.name||'Candidate')} · ${new Date(rec.date).toLocaleDateString('uz-UZ')}</div>
    </div>
    <div class="rz-grid">
      <div class="rz-cell"><span>Listening</span><b>${rec.l.toFixed(1)}</b></div>
      <div class="rz-cell"><span>Reading</span><b>${rec.r.toFixed(1)}</b></div>
      <div class="rz-cell"><span>Writing</span><b>${rec.w.toFixed(1)}</b></div>
      <div class="rz-cell"><span>Speaking</span><b>${rec.s.toFixed(1)}</b></div>
    </div>
    ${wDet?`<div class="ep-card"><h4>Writing mezonlari</h4>
      ${critRow('Task Achievement',wDet.ta)}${critRow('Coherence & Cohesion',wDet.cc)}${critRow('Lexical Resource',wDet.lr)}${critRow('Grammatical Range',wDet.gra)}
      ${wDet.feedback&&wDet.feedback.length?`<ul class="rz-fb" style="margin-top:10px">${wDet.feedback.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>`:''}</div>`:''}
    ${sDet?`<div class="ep-card"><h4>Speaking mezonlari</h4>
      ${critRow('Fluency & Coherence',sDet.fc)}${critRow('Lexical Resource',sDet.lr)}${critRow('Grammatical Range',sDet.gra)}${critRow('Pronunciation',sDet.pron)}
      ${sDet.feedback&&sDet.feedback.length?`<ul class="rz-fb" style="margin-top:10px">${sDet.feedback.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>`:''}</div>`:''}
    ${!fromWall?`<div class="ep-card" style="text-align:center;color:#8B94A7;font-size:13px">Sertifikat natijalar devoriga osildi · +${Math.round(rec.overall*12)} XP</div>`:''}`,
    foot:`<button class="ep-btn sec" id="rzCert">Sertifikatni ko'rish</button><button class="ep-btn pri" id="rzClose">Zalga qaytish</button>`});
  const rzCert=XPANEL.querySelector('#rzCert');
  if(rzCert){
    rzCert.addEventListener('click',()=>{
      /* TUZATISH: ilgari WD_Cert yuklanmagan bo'lsa tugma HECH NIMA qilmasdi —
         foydalanuvchi "ilova qotdi" deb o'ylardi. Endi aniq xabar chiqadi. */
      if(window.WD_Cert && typeof window.WD_Cert.show==='function'){
        try{ window.WD_Cert.show(rec); }
        catch(err){
          console.error('[WD_Cert] show xatosi:',err);
          showToast('Sertifikatni ochib bo\'lmadi: '+String(err&&err.message||err).slice(0,60),IC.info);
        }
      }else{
        showToast(window.__wdCertLoadFailed
          ? "Sertifikat moduli yuklanmadi (cert.js) — sahifani yangilang"
          : "Sertifikat moduli hali yuklanmoqda — bir oz kuting", IC.info);
      }
    });
  }
  XPANEL.querySelector('#rzClose').addEventListener('click',()=>{
    if(!fromWall){ session=null; drawBoard(); updTimerUI(); }
    panelHide();
  });
}

/* ================= 9. LISTENING MODULI ================= */
let playsLeft=0, playing=false;
async function runListening(){
  renderLoading('AI Listening bo\u2019limini tuzmoqda…');
  let data=await ieltsListeningAI();
  if(!session) return;          // TUZATISH: foydalanuvchi AI kutilayotganda chiqib ketgan
  let sample=false;
  if(!data){ data=FB_LISTENING; sample=true; }
  session.data={L:data};
  playsLeft=3; playing=false;   // 3 marta eshitish (avval 2 edi)
  const gapsHtml=data.gaps.map((g,i)=>`
    <div class="ep-gap">
      <label>${escapeHtml(g.label)}</label>
      <input type="text" data-gi="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="…">
    </div>`).join('');
  panelFrame({kicker:`LISTENING${data.section?(' · SECTION '+data.section):''} · ${session.mode==='full'?('MODUL '+(session.idx+1)+'/'+session.plan.length):'MASHQ'}`,
    title:escapeHtml(data.topic),
    body:`
    ${sample?`<div class="ep-note">${IC.info||''}<span>AI serveri ielts rejimini qo\u2019llamadi — namunaviy test ishlatilmoqda.</span></div>`:''}
    <div class="ep-card">
      <h4>Audio · ${playsLeft} marta eshitish mumkin</h4>
      <div class="ep-audio">
        <button class="au-btn" id="auPlay">${ICPLAY}</button>
        <p id="auState">Tugmani bosing — audio bir marta to\u2019liq o\u2019qiladi.<br>Eshitish davomida javob maydonlarini to\u2019ldiring.</p>
      </div>
    </div>
    <div class="ep-card">
      <h4>${escapeHtml(data.qtypeLabel||'Form completion')} · javoblarni yozing (1-2 so\u2019z)</h4>
      ${gapsHtml}
    </div>`,
    foot:`<button class="ep-btn pri" id="lSubmit">Topshirish</button>`});
  startTimer(MODULE_META.L.dur,()=>submitListening(true));
  const playBtn=XPANEL.querySelector('#auPlay'), st=XPANEL.querySelector('#auState');
  playBtn.addEventListener('click',async ()=>{
    if(playing) return;
    if(playsLeft<=0){ showToast("Eshitish imkoniyati tugadi",IC.info); return; }
    playsLeft--; playing=true;
    playBtn.classList.add('playing');
    st.textContent='O\u2019qilmoqda… diqqat bilan tinglang.';
    // Dialog bo'lsa "A:"/"B:" belgilari ovozda o'qilmasin (tabiiyroq eshitiladi)
    const spoken=String(data.script||'')
      .replace(/^\s*[AB]\s*:\s*/gm,'')
      .replace(/\n{2,}/g,'\n')
      .replace(/\n/g,'. ')
      .replace(/\.\s*\./g,'.');
    const ok=await exSpeak(spoken,{rate:0.95});
    playing=false;
    playBtn.classList.remove('playing');
    if(!ok && !('speechSynthesis' in window)){
      st.textContent='Bu qurilmada ovoz qo\u2019llanmaydi — matnni ko\u2019rsatamiz:';
      const c=document.createElement('div'); c.className='ep-passage'; c.style.marginTop='10px';
      c.textContent=data.script; st.parentElement.appendChild(c);
    }else{
      st.textContent=playsLeft>0?`Yana ${playsLeft} marta eshitish mumkin.`:'Eshitish imkoniyati tugadi — javoblarni yakunlang.';
    }
  });
  XPANEL.querySelector('#lSubmit').addEventListener('click',()=>submitListening(false));
}
function submitListening(auto){
  if(!session || !session.data || !session.data.L) return;   // TUZATISH: qo'riqchi
  const data=session.data.L;
  const inputs=[...XPANEL.querySelectorAll('input[data-gi]')];
  const items=data.gaps.map((g,i)=>{
    const inp=inputs.find(x=>Number(x.dataset.gi)===i);
    const user=inp?inp.value:'';
    return {label:g.label,answer:g.answer,user,ok:gapCorrect(user,g.answer)};
  });
  const score=items.filter(i=>i.ok).length;
  const band=fractionToBand(score/items.length);
  const summary=`<h4>Javoblar · ${score}/${items.length} to\u2019g\u2019ri</h4>
    ${items.map(i=>`<div class="rz-crit"><span>${escapeHtml(i.label)} — <i style="color:${i.ok?'#37D0A0':'#E8374A'};font-style:normal">${escapeHtml(i.user||'—')}</i></span><b style="color:#8B94A7;font-weight:600">${i.ok?'✓':escapeHtml(i.answer)}</b></div>`).join('')}`;
  if(auto) showToast("Vaqt tugadi — javoblar topshirildi",IC.info);
  moduleDone('L',band,{score,total:items.length,summary});
}

/* ================= 10. READING MODULI ================= */
async function runReading(){
  renderLoading('AI Reading matnini tuzmoqda…');
  let data=await ieltsReadingAI();
  if(!session) return;          // TUZATISH: sessiya bekor qilingan
  let sample=false;
  if(!data){ data=FB_READING; sample=true; }
  session.data={...(session.data||{}),R:data};
  let qn=0;
  const tfHtml=data.tfng.map((q,i)=>{qn++;return `
    <div class="ep-q" data-kind="tf" data-i="${i}">
      <div class="q-txt"><span class="q-num">${qn}</span>${escapeHtml(q.s)}</div>
      <div class="ep-opts row">
        ${['T','F','NG'].map(v=>`<button class="ep-opt" data-v="${v}"><span class="o-dot"></span>${v==='T'?'True':v==='F'?'False':'Not Given'}</button>`).join('')}
      </div>
    </div>`;}).join('');
  const mcHtml=data.mcq.map((q,i)=>{qn++;return `
    <div class="ep-q" data-kind="mc" data-i="${i}">
      <div class="q-txt"><span class="q-num">${qn}</span>${escapeHtml(q.q)}</div>
      <div class="ep-opts">
        ${q.options.map((o,oi)=>`<button class="ep-opt" data-v="${oi}"><span class="o-dot"></span>${escapeHtml(o)}</button>`).join('')}
      </div>
    </div>`;}).join('');
  // Paragraflar A, B, C... bilan raqamlanadi (Matching Headings uchun kerak)
  const paras=String(data.passage||'').split(/\n\n+/).filter(p=>p.trim());
  const paraHtml=paras.map((p,i)=>
    `<div style="margin-bottom:14px"><b style="color:var(--b6);margin-right:6px">${String.fromCharCode(65+i)}</b>${escapeHtml(p)}</div>`
  ).join('');
  // Matching Headings
  let hdHtml='';
  if(data.headings && Array.isArray(data.headings.options) && Array.isArray(data.headings.answers)){
    const opts=data.headings.options;
    const listHtml=opts.map((o,i)=>`<div style="font-size:13px;color:#B7C0CF;padding:3px 0"><b style="color:#8B94A7;margin-right:8px">${i+1}</b>${escapeHtml(o)}</div>`).join('');
    const rowsHtml=data.headings.answers.map((a,i)=>{qn++;return `
      <div class="ep-q" data-kind="hd" data-i="${i}">
        <div class="q-txt"><span class="q-num">${qn}</span>Paragraph ${String.fromCharCode(65+i)}</div>
        <div class="ep-opts row" style="flex-wrap:wrap">
          ${opts.map((o,oi)=>`<button class="ep-opt" data-v="${oi}" style="flex:0 0 auto;min-width:44px;justify-content:center">${oi+1}</button>`).join('')}
        </div>
      </div>`;}).join('');
    hdHtml=`<div class="ep-card"><h4>Matching Headings</h4>
      <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px;margin-bottom:12px">
        <div style="font-size:12px;color:#8B94A7;margin-bottom:6px">List of Headings</div>${listHtml}</div>
      ${rowsHtml}</div>`;
  }
  // Summary Completion
  let sumHtml='';
  if(data.summary && typeof data.summary.text==='string' && Array.isArray(data.summary.answers)){
    const n=data.summary.answers.length;
    let txt=escapeHtml(data.summary.text);
    for(let i=1;i<=n;i++){
      txt=txt.replace(new RegExp('\\['+i+'\\]'),
        `<input type="text" data-si="${i-1}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${i}" style="display:inline-block;width:110px;padding:3px 8px;margin:0 3px;border-radius:6px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:inherit;font:inherit">`);
    }
    sumHtml=`<div class="ep-card"><h4>Summary Completion · ${n} ta bo\u2019shliq (1-2 so\u2019z)</h4>
      <div class="ep-passage" style="line-height:2.1">${txt}</div></div>`;
  }
  panelFrame({kicker:`READING · ${session.mode==='full'?('MODUL '+(session.idx+1)+'/'+session.plan.length):'MASHQ'}`,
    title:escapeHtml(data.title),
    body:`
    ${sample?`<div class="ep-note"><span>AI serveri ielts rejimini qo\u2019llamadi — namunaviy test ishlatilmoqda.</span></div>`:''}
    <div class="ep-card"><h4>Passage</h4><div class="ep-passage">${paraHtml}</div></div>
    ${hdHtml}
    <div class="ep-card"><h4>True / False / Not Given</h4>${tfHtml}</div>
    <div class="ep-card"><h4>Multiple choice</h4>${mcHtml}</div>
    ${sumHtml}`,
    foot:`<button class="ep-btn pri" id="rSubmit">Topshirish</button>`});
  startTimer(MODULE_META.R.dur,()=>submitReading(true));
  XPANEL.querySelectorAll('.ep-q').forEach(qEl=>{
    qEl.querySelectorAll('.ep-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        qEl.querySelectorAll('.ep-opt').forEach(b=>b.classList.remove('sel'));
        btn.classList.add('sel');
      });
    });
  });
  XPANEL.querySelector('#rSubmit').addEventListener('click',()=>submitReading(false));
}
function submitReading(auto){
  if(!session || !session.data || !session.data.R) return;   // TUZATISH: qo'riqchi
  const data=session.data.R;
  let score=0,total=0;
  const rows=[];
  XPANEL.querySelectorAll('.ep-q').forEach(qEl=>{
    total++;
    const kind=qEl.dataset.kind, i=Number(qEl.dataset.i);
    const sel=qEl.querySelector('.ep-opt.sel');
    const v=sel?sel.dataset.v:null;
    let ok=false, right='';
    if(kind==='hd'){                      // Matching Headings
      const a=data.headings.answers[i];
      ok=Number(v)===a; right=String(a+1);
    }else if(kind==='tf'){ ok=v===data.tfng[i].answer; right=data.tfng[i].answer; }
    else{ ok=Number(v)===data.mcq[i].answer; right=String.fromCharCode(65+data.mcq[i].answer); }
    if(ok) score++;
    rows.push(`<div class="rz-crit"><span>Savol ${total}</span><b style="color:${ok?'#37D0A0':'#E8374A'}">${ok?'✓':right}</b></div>`);
  });
  // Summary Completion — matnli javoblar (imlo/registrga bardoshli)
  const sInputs=[...XPANEL.querySelectorAll('input[data-si]')];
  if(sInputs.length && data.summary && Array.isArray(data.summary.answers)){
    const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
    sInputs.forEach(inp=>{
      const i=Number(inp.dataset.si);
      const right=data.summary.answers[i]||'';
      const ok=norm(inp.value)===norm(right);
      total++; if(ok) score++;
      rows.push(`<div class="rz-crit"><span>Savol ${total}</span><b style="color:${ok?'#37D0A0':'#E8374A'}">${ok?'✓':escapeHtml(right)}</b></div>`);
    });
  }
  const band=fractionToBand(score/Math.max(1,total));
  if(auto) showToast("Vaqt tugadi — javoblar topshirildi",IC.info);
  moduleDone('R',band,{score,total,summary:`<h4>Natija · ${score}/${total} to\u2019g\u2019ri</h4>${rows.join('')}`});
}

/* ================= 11. WRITING MODULI ================= */
async function runWriting(){
  const prompt=WRITING_PROMPTS[Math.floor(Math.random()*WRITING_PROMPTS.length)];
  session.data={...(session.data||{}),W:{prompt}};
  panelFrame({kicker:`WRITING · TASK 2 · ${session.mode==='full'?('MODUL '+(session.idx+1)+'/'+session.plan.length):'MASHQ'}`,
    title:'Essay',
    body:`
    <div class="ep-card"><h4>Topshiriq</h4><div class="ep-passage">${escapeHtml(prompt)}</div>
      <div style="margin-top:10px;font-size:12px;color:#8B94A7">Kamida 250 so\u2019z yozing. Fikringizni misollar bilan asoslang.</div></div>
    <textarea class="ep-write" id="wEssay" placeholder="Write your essay here…" autocapitalize="sentences"></textarea>
    <div class="ep-wc"><span>So\u2019zlar soni (min. 250)</span><b id="wCount">0</b></div>`,
    foot:`<button class="ep-btn pri" id="wSubmit">Baholashga yuborish</button>`});
  startTimer(MODULE_META.W.dur,()=>submitWriting(true));
  const ta=XPANEL.querySelector('#wEssay'), wc=XPANEL.querySelector('#wCount');
  ta.addEventListener('input',()=>{
    const n=ta.value.trim().split(/\s+/).filter(Boolean).length;
    wc.textContent=n;
    wc.classList.toggle('ok',n>=250);
  });
  XPANEL.querySelector('#wSubmit').addEventListener('click',()=>submitWriting(false));
}
async function submitWriting(auto){
  if(!session || !session.data || !session.data.W) return;   // TUZATISH: qo'riqchi
  const ta=XPANEL.querySelector('#wEssay');
  const essay=(ta?ta.value:'').trim();
  const prompt=session.data.W.prompt;
  stopTimer();
  if(!essay || essay.split(/\s+/).length<20){
    if(!auto){ showToast("Esse juda qisqa — kamida bir necha gap yozing",IC.info); startTimer(Math.max(30,timerLeft||60),()=>submitWriting(true)); return; }
  }
  if(auto) showToast("Vaqt tugadi — esse baholashga yuborildi",IC.info);
  renderLoading('AI examiner esseni 4 mezon bo\u2019yicha baholamoqda…');
  let ev=essay?await ieltsWritingEvalAI(prompt,essay):null;
  if(!session) return;          // TUZATISH: baholash paytida chiqib ketilgan
  if(!ev) ev=heuristicWritingEval(essay||'');
  const critHtml=`<div class="ep-card"><h4>Writing mezonlari ${ev.ai?'':'· taxminiy'}</h4>
    <div class="rz-crit"><span>Task Achievement</span><b>${ev.ta.toFixed(1)}</b></div>
    <div class="rz-crit"><span>Coherence & Cohesion</span><b>${ev.cc.toFixed(1)}</b></div>
    <div class="rz-crit"><span>Lexical Resource</span><b>${ev.lr.toFixed(1)}</b></div>
    <div class="rz-crit"><span>Grammatical Range & Accuracy</span><b>${ev.gra.toFixed(1)}</b></div></div>`;
  const summary=ev.feedback&&ev.feedback.length?`<h4>Examiner izohi</h4><ul class="rz-fb">${ev.feedback.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>`:'';
  moduleDone('W',ev.band,{...ev,summary,critHtml});
}

/* ================= 12. SPEAKING MODULI ================= */
const SRClass=window.SpeechRecognition||window.webkitSpeechRecognition||null;
let recObj=null, recTO=null, recTick=null, recSess=0;

/* Takrorlangan bo'laklarni olib tashlaydi.
   Chrome ba'zan bir xil final natijani qayta yuboradi yoki mikrofon qayta
   ishga tushganda oxirgi so'zni takrorlaydi. Natijada "I think I think
   I think..." kabi matn hosil bo'lardi — AI examiner esa uni haqiqiy javob
   deb hisoblab, adolatsiz past ball qo'yardi. Bu funksiya:
   (1) ketma-ket kelgan bir xil so'z guruhlarini (1..6 so'z) bittaga tushiradi,
   (2) bo'sh joylarni tartibga soladi. */
/* Speech-recognition artefaktlarini tozalash:
   - "helloooo" -> "helloo" (3+ takror harf -> 2 taga; "book","seed","need" saqlanadi)
   - "the the the" -> "the" (ketma-ket bir xil so'z) */
function normalizeSpeech(s){
  let t=String(s||'').replace(/\s+/g,' ').trim();
  if(!t) return '';
  t = t.replace(/([A-Za-z])\1{2,}/g, (m,c) => c + c);
  t = t.replace(/\b([A-Za-z']+)(\s+\1\b)+/gi, '$1');
  return t;
}
function dedupeSpeech(s){
  let t=normalizeSpeech(s);
  if(!t) return '';
  let w=t.split(' ');
  for(let n=6;n>=1;n--){
    let out=[], i=0;
    while(i<w.length){
      const blk=w.slice(i,i+n);
      if(blk.length<n){ out.push(...w.slice(i)); break; }
      out.push(...blk);
      let j=i+n;
      // Ketma-ket kelgan aynan shu blokni tashlab ketamiz
      while(j+n<=w.length){
        let same=true;
        for(let k=0;k<n;k++){
          const a=blk[k].toLowerCase().replace(/[^a-z0-9']/g,'');
          const b=w[j+k].toLowerCase().replace(/[^a-z0-9']/g,'');
          if(a!==b){ same=false; break; }
        }
        if(!same) break;
        j+=n;
      }
      i=j;
    }
    w=out;
  }
  return w.join(' ').trim();
}
window.__wdDedupeSpeech=dedupeSpeech;

function stopRec(){
  recSess++;                                   // eski sessiyani "o'lik" deb belgilaymiz
  if(recTO){ clearTimeout(recTO); recTO=null; }
  if(recTick){ clearInterval(recTick); recTick=null; }
  if(recObj){
    try{ recObj.onend=null; recObj.onerror=null; recObj.onresult=null; }catch(e){}
    try{ recObj.abort ? recObj.abort() : recObj.stop(); }catch(e){}
    recObj=null;
  }
}

/* Yozib olish: onText(joriy matn), onDone(yakuniy matn), maxSec — javob uchun
   ajratilgan vaqt, onTick(qolgan soniya) — ixtiyoriy sanoq.

   MUHIM TUZATISH:
   Ilgari recObj.onend darhol finish() ni chaqirardi. Chrome esa ~3-5 soniya
   sukunatdan keyin mikrofonni O'ZI to'xtatadi — natijada foydalanuvchi gapini
   tugatmasidan javob yopilib, keyingi savolga o'tib ketardi ("max 5s" hissi).
   Endi: onend bo'lsa va vaqt hali tugamagan bo'lsa — mikrofon QAYTA ishga
   tushadi. Javob faqat (a) vaqt tugaganda, (b) foydalanuvchi Stop bosganda,
   (c) mikrofonga ruxsat bo'lmasa yopiladi. */
function startRec(onText,onDone,maxSec,onTick){
  stopRec();
  if(!SRClass){ onDone(null); return; }
  const mySess=recSess;                        // bu chaqiruvning shaxsiy raqami
  const secs=Math.max(5,+maxSec||45);
  const deadline=Date.now()+secs*1000;
  let ended=false;
  let baseTxt='';                              // oldingi mikrofon seanslaridan yig'ilgan matn
  let finals=[];                               // JORIY seansning final natijalari — indeks bo'yicha
  let interim='';
  let restarts=0;

  const fullTxt=()=>dedupeSpeech([baseTxt, finals.filter(Boolean).join(' '), interim].filter(Boolean).join(' '));
  const alive=()=>!ended && mySess===recSess;

  const finish=()=>{
    if(ended) return; ended=true;
    const out=fullTxt();
    stopRec();
    onDone(out);
  };

  const spin=()=>{
    if(!alive()) return;
    let r;
    try{ r=new SRClass(); }catch(e){ finish(); return; }
    recObj=r;
    r.lang='en-US'; r.continuous=true; r.interimResults=true; r.maxAlternatives=1;

    r.onresult=ev=>{
      if(!alive() || recObj!==r) return;
      let itm='';
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const t=ev.results[i][0].transcript;
        // Indeks bo'yicha YOZAMIZ (qo'shmaymiz) — shuning uchun bir xil natija
        // qayta kelsa ham matn ko'paymaydi. Bu 10x takror muammosining yechimi.
        if(ev.results[i].isFinal) finals[i]=t;
        else itm+=t;
      }
      interim=itm;
      onText(fullTxt());
    };

    r.onerror=e=>{
      if(!alive() || recObj!==r) return;
      const code=(e&&e.error)||'';
      // Halokatli xatolar — davom etishning ma'nosi yo'q
      if(code==='not-allowed'||code==='service-not-allowed'||code==='audio-capture'){
        try{ if(typeof showToast==='function') showToast(
          code==='audio-capture' ? "Mikrofon topilmadi" : "Mikrofonga ruxsat berilmagan",
          IC.info); }catch(x){}
        finish(); return;
      }
      // no-speech / aborted / network — onend'da qayta ishga tushiriladi
    };

    r.onend=()=>{
      if(!alive() || recObj!==r) return;
      // Joriy seansda yig'ilganini bazaga ko'chiramiz va indekslarni tozalaymiz
      const chunk=finals.filter(Boolean).join(' ').trim();
      if(chunk) baseTxt=dedupeSpeech((baseTxt+' '+chunk).trim());
      finals=[]; interim='';
      recObj=null;
      // Vaqt bormi? — mikrofonni qayta yoqamiz (Chrome sukunatda o'zi to'xtatadi)
      if(Date.now() < deadline-300 && restarts<80){
        restarts++;
        setTimeout(()=>{ if(alive()) spin(); },180);
      }else{
        finish();
      }
    };

    try{ r.start(); }
    catch(e){
      // InvalidStateError: oldingi nusxa hali to'liq yopilmagan — biroz kutamiz
      recObj=null;
      if(Date.now()<deadline-300 && restarts<80){ restarts++; setTimeout(()=>{ if(alive()) spin(); },320); }
      else finish();
    }
  };

  spin();
  recTO=setTimeout(finish,secs*1000);
  if(typeof onTick==='function'){
    onTick(secs);
    recTick=setInterval(()=>{
      if(!alive()){ if(recTick){ clearInterval(recTick); recTick=null; } return; }
      onTick(Math.max(0,Math.ceil((deadline-Date.now())/1000)));
    },1000);
  }
}
async function runSpeaking(){
  // AI har safar YANGI to'plam tuzadi (Part 1: 3 savol, Part 3: 4 ta chuqur savol).
  // Server javob bermasa — statik to'plamlar zaxira bo'lib qoladi.
  renderLoading('AI examiner savollarni tayyorlamoqda\u2026');
  let set=await ieltsSpeakingSetAI();
  if(!session) return;          // TUZATISH: sessiya bekor qilingan
  if(!set) set=SPEAKING_SETS[Math.floor(Math.random()*SPEAKING_SETS.length)];
  const p1q=Array.isArray(set.p1)?set.p1:[set.p1];
  const p3q=Array.isArray(set.p3)?set.p3:[set.p3];
  session.data={...(session.data||{}),S:{set}};
  const flow=[
    ...p1q.slice(0,3).map(q=>({part:1,q,max:45})),
    {part:2,cue:set.cue,max:90,prep:60},
    ...p3q.slice(0,4).map(q=>({part:3,q,max:60})),
  ];
  const items=[];
  let fi=0;
  startTimer(MODULE_META.S.dur,()=>{ stopRec(); exStopSpeak(); finishSpeaking(items,true); });

  function stepUI(step,state){
    const isCue=!!step.cue;
    const qHtml=isCue
      ? `<div class="sp-cue"><h5>${escapeHtml(step.cue.topic)}</h5>You should say:<ul>${step.cue.points.map(p=>`<li>${escapeHtml(p)}</li>`).join('')}</ul></div>`
      : `<div class="sp-q">${escapeHtml(step.q)}</div>`;
    panelFrame({kicker:`SPEAKING · PART ${step.part} · ${session.mode==='full'?('MODUL '+(session.idx+1)+'/'+session.plan.length):'MASHQ'}`,
      title:'AI Examiner',
      body:`
      ${!SRClass?`<div class="ep-note"><span>Bu qurilmada nutqni aniqlash yo\u2019q — javobingizni yozma kiritasiz.</span></div>`:''}
      <div class="ep-card">${qHtml}</div>
      <div class="sp-stage" id="spStage"></div>`,
      foot:`<div style="flex:1"></div>`});
    return XPANEL.querySelector('#spStage');
  }
  async function askStep(step){
    const stage=stepUI(step);
    // Savolni examiner o'qiydi.
    // TUZATILDI: ilgari ovoz kelmasa/kechiksa ekran bo'sh turib, keyingiga
    // o'tib ketardi. Endi: (1) savol matni ekranda KO'RINIB turadi,
    // (2) ovoz tayyorlanayotgani aytiladi, (3) ovoz ishlamasa ham
    // foydalanuvchi savolni o'qib javob bera oladi (dars to'xtamaydi).
    const say=step.cue
      ? `Now, I'd like you to talk about a topic for one to two minutes. ${step.cue.topic} You have one minute to prepare.`
      : step.q;
    stage.innerHTML=`<div class="sp-state live">Examiner gapirmoqda…</div>
      <div class="sp-tr" style="margin-top:10px;font-style:italic;opacity:.9">${escapeHtml(say)}</div>`;
    const spoke=await exSpeak(say,{rate:0.95});
    if(!session) return; // sessiya bekor qilingan
    if(!spoke){
      // Ovoz umuman chiqmadi — foydalanuvchi o'qishga ulgursin (matn uzunligiga qarab)
      const ms=Math.min(9000,Math.max(2500,say.length*55));
      const st=XPANEL.querySelector('.sp-state');
      if(st){ st.textContent='Savolni o\u2019qing'; st.classList.remove('live'); }
      await new Promise(r=>setTimeout(r,ms));
      if(!session) return;
    }
    // Part 2 — 60 soniya tayyorgarlik
    if(step.prep){
      let left=step.prep;
      stage.innerHTML=`<div class="sp-state">Tayyorgarlik</div><div class="sp-prep" id="spPrep">${left}</div>
        <button class="ep-btn sec" id="spSkip" style="flex:0 0 auto">Tayyorman — boshlash</button>`;
      await new Promise(res=>{
        const iv=setInterval(()=>{
          left--; const el=XPANEL.querySelector('#spPrep');
          if(el) el.textContent=left;
          if(left<=0 || !session){ clearInterval(iv); res(); }
        },1000);
        const sk=XPANEL.querySelector('#spSkip');
        if(sk) sk.addEventListener('click',()=>{ left=0; });
      });
      if(!session) return;
    }
    // Javob: mikrofon yoki yozma
    const answer=await new Promise(res=>{
      if(SRClass){
        stage.innerHTML=`
          <button class="sp-rec" id="spRec">${ICMIC}</button>
          <div class="sp-state" id="spState">Mikrofonni bosib gapiring</div>
          <div class="sp-clock" id="spClock">Javob uchun ${step.max} soniya</div>
          <div class="sp-tr" id="spTr">…</div>`;
        const btn=XPANEL.querySelector('#spRec'), st=XPANEL.querySelector('#spState'),
              tr=XPANEL.querySelector('#spTr'), clk=XPANEL.querySelector('#spClock');
        let live=false, currentTxt='', done=false, startedAt=0;
        const settle=(txt)=>{ if(done) return; done=true; res(txt); };
        btn.addEventListener('click',()=>{
          if(!live){
            live=true; startedAt=Date.now();
            btn.classList.add('live'); btn.innerHTML=ICSTOP;
            st.textContent='Yozilmoqda… tugatgach to\u2019xtating'; st.classList.add('live');
            startRec(
              t=>{ currentTxt=t; if(tr) tr.textContent=t||'…'; },
              t=>{                                   // vaqt tugadi yoki mikrofon yopildi
                if(t!==null && t!==undefined) currentTxt=t;
                if(clk) clk.textContent='Vaqt tugadi';
                settle(currentTxt);
              },
              step.max,
              sec=>{                                  // sanoq — foydalanuvchi haqiqiy vaqtni ko'radi
                if(!clk) return;
                const mm=Math.floor(sec/60), ss=sec%60;
                clk.textContent='Qolgan vaqt: '+(mm?mm+':'+String(ss).padStart(2,'0'):sec+'s');
                clk.classList.toggle('warn',sec<=10);
              }
            );
          }else{
            // Tasodifiy ikkinchi bosishdan himoya (0.6s ichida javobni yopmaymiz)
            if(Date.now()-startedAt<600) return;
            live=false; stopRec();
            btn.classList.remove('live');
            if(clk) clk.textContent='Javob yuborildi';
            settle(currentTxt);
          }
        });
      }else{
        stage.innerHTML=`
          <textarea class="ep-write" id="spTyped" style="min-height:20vh" placeholder="Type your answer in English…"></textarea>
          <button class="ep-btn pri" id="spTypedOk" style="width:100%">Javobni yuborish</button>`;
        XPANEL.querySelector('#spTypedOk').addEventListener('click',()=>{
          res(XPANEL.querySelector('#spTyped').value.trim());
        });
      }
    });
    if(!session) return;
    // Baholashga yuborishdan oldin yana bir marta takrorlarni tozalaymiz —
    // AI examiner sun'iy takrorlar uchun ball tushirmasin.
    items.push({q:step.cue?step.cue.topic:step.q, a:dedupeSpeech(answer||'')});
  }
  for(fi=0; fi<flow.length; fi++){
    if(!session) return;
    await askStep(flow[fi]);
  }
  if(!session) return;
  exStopSpeak();
  await exSpeak("Thank you. That is the end of the speaking test.",{rate:0.95});
  finishSpeaking(items,false);
}
async function finishSpeaking(items,auto){
  if(!session) return;
  stopTimer(); stopRec(); exStopSpeak();
  if(auto) showToast("Vaqt tugadi — javoblar baholashga yuborildi",IC.info);
  renderLoading('AI examiner nutqingizni 4 mezon bo\u2019yicha baholamoqda…');
  const hasAns=items.some(i=>(i.a||'').trim().length>0);
  let ev=hasAns?await ieltsSpeakingEvalAI(items):null;
  if(!session) return;          // TUZATISH: baholash paytida chiqib ketilgan
  if(!ev) ev=hasAns?heuristicSpeakingEval(items):{fc:3,lr:3,gra:3,pron:3,band:3,feedback:["Javob yozilmadi — mikrofonga ruxsat berilganini tekshiring."],ai:false};
  const critHtml=`<div class="ep-card"><h4>Speaking mezonlari ${ev.ai?'':'· taxminiy'}</h4>
    <div class="rz-crit"><span>Fluency & Coherence</span><b>${ev.fc.toFixed(1)}</b></div>
    <div class="rz-crit"><span>Lexical Resource</span><b>${ev.lr.toFixed(1)}</b></div>
    <div class="rz-crit"><span>Grammatical Range & Accuracy</span><b>${ev.gra.toFixed(1)}</b></div>
    <div class="rz-crit"><span>Pronunciation</span><b>${ev.pron.toFixed(1)}</b></div></div>`;
  const trHtml=items.filter(i=>i.a).map(i=>`<div class="rz-crit" style="flex-direction:column;align-items:flex-start;gap:4px"><span style="color:#8B94A7;font-size:12px">${escapeHtml(i.q)}</span><b style="font-weight:600;color:#B7C0CF;font-style:italic">"${escapeHtml(i.a)}"</b></div>`).join('');
  const summary=`${ev.feedback&&ev.feedback.length?`<h4>Examiner izohi</h4><ul class="rz-fb">${ev.feedback.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>`:''}
    ${trHtml?`<h4 style="margin-top:14px">Transkript</h4>${trHtml}`:''}`;
  moduleDone('S',ev.band,{...ev,summary,critHtml});
}

/* ================= 13. OCHISH / YOPISH ================= */
function abortSession(){
  stopTimer(); stopRec(); exStopSpeak();
  session=null;
  panelHide();
  drawBoard(); updTimerUI();
}
function closeExam(){
  XOV.hidden=true;
  abortSession();
  if(xAnim){ cancelAnimationFrame(xAnim); xAnim=null; }
  xFwd=xBack=false; xDrag=null;
  XACTION.classList.remove('show'); nearStation=null;
  try{ renderHome(); }catch(e){}
  try{ if(typeof updateProfileStats==='function') updateProfileStats(); }catch(e){}
}
document.getElementById('exam-back').addEventListener('click',()=>{
  const doClose=()=>{
    if(history.state && history.state.wdExam){ history.back(); }
    else closeExam();
  };
  if(session){
    const layer=openSheet(`
      <div class="sh-intro-icon" style="background:linear-gradient(150deg,#2A1218,#141B28);border:1px solid #E8374A"><span style="color:#E8374A;font-weight:900;font-size:18px">!</span></div>
      <h2>Imtihonni tark etasizmi?</h2>
      <p class="desc">Joriy sessiya bekor qilinadi va jarayon <b>saqlanmaydi</b>. Haqiqiy imtihonda ham zalni tark etish — yakun degani.</p>
      <button class="btn btn-primary btn-block" id="exQuit" style="background:linear-gradient(135deg,#E8374A,#C61E31)">Ha, tark etaman</button>
      <button class="btn btn-block" id="exStay" style="margin-top:10px;background:var(--sur2,#EEF1F7)">Davom etaman</button>`);
    layer.querySelector('#exQuit').addEventListener('click',()=>{ closeSheet(); abortSession(); doClose(); });
    layer.querySelector('#exStay').addEventListener('click',()=>closeSheet());
  }else if(XPANEL.classList.contains('show')){
    panelHide();
  }else{
    doClose();
  }
});
window.addEventListener('popstate',()=>{
  if(XOV && !XOV.hidden){
    if(session) abortSession();
    closeExam();
  }
});
window.__wdOpenExam=function(){
  XOV.hidden=false;
  try{ history.pushState({wdExam:true},'','#exam'); }catch(e){}
  if(!xInited){
    try{ initExam(); }
    catch(err){ showToast('3D yuklash xatosi: '+String(err&&err.message||err).slice(0,80),IC.info); XOV.hidden=true; return; }
  }
  xPos.set(0,0,3.6); xYaw=Math.PI; xPitch=0;
  xFwd=xBack=false; xDrag=null;
  XCAND.textContent=candName();
  updTimerUI();
  onExResize();
  try{ drawBoard(); drawClock(); rebuildCerts(); }catch(e){}
  XHINT.style.opacity='1';
  setTimeout(()=>{ XHINT.style.opacity='0'; },5200);
  if(xClock) xClock.getDelta();
  if(!xAnim) exTick();
};
