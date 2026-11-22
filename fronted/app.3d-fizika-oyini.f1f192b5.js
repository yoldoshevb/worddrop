
/* ========== 3D FIZIKA O'YINI — v3 ========== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* 1-bosqich so'zlari — qo'lda yozilgan namuna; qolgan bosqichlarni AI tuzadi */
let WORDS=[
  {term:"crucial",pos:"adj",tr:"juda muhim, hal qiluvchi",ipa:"ˈkruːʃəl",def:"Natijaga katta ta'sir ko'rsatadigan darajada muhim.",ex:"Getting enough sleep is crucial for your health.",forms:["crucial"]},
  {term:"predicament",pos:"noun",tr:"qiyin vaziyat",ipa:"prɪˈdɪkəmənt",def:"Chiqish yo'li topilishi qiyin bo'lgan noqulay holat.",ex:"She found herself in a difficult predicament.",forms:["predicament","predicaments"]},
  {term:"transform",pos:"verb",tr:"o'zgartirmoq",ipa:"trænsˈfɔːm",def:"Biror narsaning shaklini yoki holatini tubdan o'zgartirish.",ex:"The city plans to transform the old factory into a museum.",forms:["transform","transforms","transformed","transforming","transformation"]},
  {term:"devastating",pos:"adj",tr:"halokatli",ipa:"ˈdevəsteɪtɪŋ",def:"Juda katta zarar yoki og'ir ta'sir keltiradigan.",ex:"The storm had a devastating effect on the town.",forms:["devastating","devastate","devastated","devastation"]},
  {term:"contemplate",pos:"verb",tr:"chuqur o'ylamoq",ipa:"ˈkɒntəmpleɪt",def:"Biror qaror haqida uzoq va diqqat bilan o'ylash.",ex:"He paused to contemplate his next move.",forms:["contemplate","contemplates","contemplated","contemplating","contemplation"]},
  {term:"meticulous",pos:"adj",tr:"puxta, sinchkov",ipa:"məˈtɪkjʊləs",def:"Har bir kichik detalga alohida e'tibor bilan yondashadigan.",ex:"The engineer was meticulous about every measurement.",forms:["meticulous","meticulously"]},
  {term:"phenomenal",pos:"adj",tr:"ajoyib, hayratlanarli",ipa:"fɪˈnɒmɪnəl",def:"Odatiy darajadan ancha yuqori, hayratlanarli darajada yaxshi.",ex:"The team achieved phenomenal results this quarter.",forms:["phenomenal","phenomenally"]},
  {term:"captivate",pos:"verb",tr:"maftun etmoq",ipa:"ˈkæptɪveɪt",def:"Kimningdir e'tiborini butunlay o'ziga tortish.",ex:"The documentary captivated audiences around the world.",forms:["captivate","captivates","captivated","captivating"]},
  {term:"elaborate",pos:"verb",tr:"batafsil tushuntirmoq",ipa:"ɪˈlæbəreɪt",def:"Biror fikrni qo'shimcha tafsilotlar bilan kengaytirib tushuntirish.",ex:"Could you elaborate on your last point?",forms:["elaborate","elaborates","elaborated","elaborating","elaboration"]},
  {term:"absurd",pos:"adj",tr:"mantiqsiz, kulgili",ipa:"əbˈsɜːd",def:"Mantiqqa mutlaqo zid, kulgili darajada g'ayritabiiy.",ex:"It seemed absurd to cancel the meeting at the last minute.",forms:["absurd","absurdly","absurdity"]},
];

/* Grammar check helpers */
function hasWordForm(sentence, forms){
  const lower=sentence.toLowerCase();
  return forms.some(f=>lower.includes(f.toLowerCase()));
}
function checkBasicGrammar(sentence, word){
  const issues=[];
  // Bosh harf
  if(sentence.trim().charAt(0)!==sentence.trim().charAt(0).toUpperCase()) issues.push("Gap bosh harf bilan boshlanishi kerak");
  // Tinish belgisi
  if(!/[.!?]$/.test(sentence.trim())) issues.push("Gap '. ? !' bilan tugashi kerak");
  // So'z shakli
  if(!hasWordForm(sentence, word.forms)) issues.push(`So'zni to'g'ri shaklda ishlating: ${word.forms.slice(0,4).join(' / ')}`);
  // Minimal uzunlik
  if(sentence.trim().split(/\s+/).length < 4) issues.push("Gap kamida 4 ta so'zdan iborat bo'lsin");
  return issues;
}

/* ===== SVG inline ===== */
const CHK=`<svg viewBox="0 0 24 24" class="ic"><path d="M5 13 L9.5 17.5 L19 6.5"/></svg>`;
const CRS=`<svg viewBox="0 0 24 24" class="ic"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>`;
const FLM=`<svg viewBox="0 0 24 24" class="ic"><path d="M12 3 C10 6 7 8 7 12.5 C7 16.6 9.6 19.5 12 19.5 C14.4 19.5 17 16.6 17 12.5 C17 11 16.4 10 15.6 9 C15.6 11 14.4 12 13.4 11.3 C14 9 13 6 12 3 Z"/></svg>`;
const BOK=`<svg viewBox="0 0 24 24" class="ic"><path d="M5 4.5 C7 3.4 10 3.4 12 4.5 C14 3.4 17 3.4 19 4.5 V18 C17 16.9 14 16.9 12 18 C10 16.9 7 16.9 5 18 Z"/><path d="M12 4.5 V18"/></svg>`;
const TRP=`<svg viewBox="0 0 24 24" class="ic"><path d="M7 4 H17 V9 C17 12 14.8 14 12 14 C9.2 14 7 12 7 9 Z"/><path d="M7 5 H4 V7 C4 9 5.5 10.3 7 10.3"/><path d="M17 5 H20 V7 C20 9 18.5 10.3 17 10.3"/><path d="M12 14 V17.5 M9 20 H15 M9.5 17.5 H14.5 L15 20 H9 Z"/></svg>`;
const SPK=`<svg viewBox="0 0 24 24" class="ic"><path d="M4 9.5 H7.5 L12.5 5 V19 L7.5 14.5 H4 Z"/><path d="M16 8.5 C17.2 9.7 17.2 14.3 16 15.5"/></svg>`;

/* ===== PHYSICS CONSTANTS ===== */
const G=-24, REST=0.34, FRIC=0.68, SDECAY=0.990;
const GROUND=0;
const BW=1.3, BD=1.3, BBASE=0.9, BLID=0.13;
const LID_OPEN=-Math.PI*0.72;

/* Qutining 8 ta burchagi (lokal koordinatada) — aylanib tushayotganda qaysi
   burchak yerga eng yaqinligini aniq hisoblash uchun. Eski versiyada faqat
   qutining markazi (pos.y) yerga tegishi tekshirilardi, shu sabab quti burchak
   bilan tushganda vizual ravishda polga "botib ketardi" yoki havoda muallaq
   qolardi — bu funksiya shu xatoni tuzatadi. */
const BOX_CORNERS=[
  new THREE.Vector3(-BW/2,0,-BD/2), new THREE.Vector3(BW/2,0,-BD/2),
  new THREE.Vector3(-BW/2,0, BD/2), new THREE.Vector3(BW/2,0, BD/2),
  new THREE.Vector3(-BW/2,BBASE,-BD/2), new THREE.Vector3(BW/2,BBASE,-BD/2),
  new THREE.Vector3(-BW/2,BBASE, BD/2), new THREE.Vector3(BW/2,BBASE, BD/2),
];
function lowestCornerY(q){
  let m=Infinity;
  for(const c of BOX_CORNERS){
    const y=c.clone().applyQuaternion(q).y;
    if(y<m)m=y;
  }
  return m;
}

/* ===== STATE ===== */
let renderer,scene,camera,controls,clock,audioCtx,bgGain;
let boxGroup,boxBaseMesh,lidPivot,cardGroup,cardMeshes=[];
let dropTarget=null; // drop-zone poldagi nishon
let innerWalls=[]; // visible inner faces
let raycaster,pointer;
let animId=null,initialized=false;
let physState='idle',pos=new THREE.Vector3(),vel=new THREE.Vector3(),angVel=new THREE.Vector3(),rotQ=new THREE.Quaternion();
let bounceCount=0,lidAngle=0,lidAngVel=0,settleT=0;
let introT=0, introCamFrom=null, introCamTo=null, introTgtFrom=null, introTgtTo=null, hatchShaft=null;
const HATCH_SPAWN_Y=7.0;
let currentLevelId=1,sessionLearned=[],currentWordIdx=0,sessionSkips=0;

/* ===== AUDIO ===== */
function initAudio(){if(audioCtx)return;audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function playBg(){
  if(!audioCtx||bgGain||!window.__wdSoundOn)return;
  // Yumshoq, filtrlangan ambient pad — beep-beep arpeggio o'rniga tinch akkordlar
  const master=audioCtx.createGain();
  master.gain.setValueAtTime(0,audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(0.4,audioCtx.currentTime+3);
  const lp=audioCtx.createBiquadFilter();
  lp.type='lowpass'; lp.frequency.value=1100; lp.Q.value=0.5;
  master.connect(lp); lp.connect(audioCtx.destination);
  bgGain=master; // stopBg shu tugunni pasaytiradi

  // Lo-fi akkord ketma-ketligi (Am7 – Fmaj7 – Cmaj7 – G6), sekin
  const chords=[
    { bass:110.00, notes:[220.00,261.63,329.63,392.00] }, // Am7
    { bass: 87.31, notes:[174.61,220.00,261.63,329.63] }, // Fmaj7
    { bass:130.81, notes:[261.63,329.63,392.00,493.88] }, // Cmaj7
    { bass: 98.00, notes:[196.00,246.94,293.66,329.63] }, // G6
  ];
  const DUR=6.5; let ci=0;
  function voice(freq,t,dur,gain,type){
    [-3,3].forEach(cents=>{                       // ikki detune qilingan ovoz — iliqlik uchun
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type=type; o.frequency.value=freq*Math.pow(2,cents/1200);
      const a=1.4, r=2.0;                         // sekin attack/release
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(gain,t+a);
      g.gain.setValueAtTime(gain,t+Math.max(a,dur-r));
      g.gain.linearRampToValueAtTime(0,t+dur);
      o.connect(g); g.connect(bgGain);
      o.start(t); o.stop(t+dur+0.1);
    });
  }
  function schedule(){
    if(!bgGain||!window.__wdSoundOn) return;      // stopBg'dan keyin to'xtaydi
    const t=audioCtx.currentTime+0.05, ch=chords[ci%chords.length];
    voice(ch.bass, t, DUR+1.2, 0.15, 'sine');                                    // bass drone
    ch.notes.forEach((f,i)=> voice(f, t, DUR+1.2, i===0?0.06:0.045, 'sine'));     // pad akkord
    voice(ch.notes[ch.notes.length-1]*2, t, DUR, 0.016, 'triangle');             // yumshoq shimmer
    ci++;
    setTimeout(schedule, DUR*1000);
  }
  schedule();
}
function stopBg(){if(!bgGain)return;bgGain.gain.linearRampToValueAtTime(0,audioCtx.currentTime+0.6);bgGain=null}
window.__wdStopBg=stopBg; // profil ekranidagi "Ovoz effektlari" tugmasi shu orqali fon musiqasini o'chiradi
function playBounce(v){
  if(!audioCtx||!window.__wdSoundOn)return;
  const g=Math.min(v/18,1)*0.45;if(g<0.04)return;
  const o=audioCtx.createOscillator(),gn=audioCtx.createGain();
  o.type='sine';o.frequency.setValueAtTime(200,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(65,audioCtx.currentTime+0.12);
  gn.gain.setValueAtTime(g,audioCtx.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.14);
  o.connect(gn);gn.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+0.16);
}
function playOpen(){
  if(!audioCtx||!window.__wdSoundOn)return;
  [[440,0],[554,0.09],[659,0.19],[880,0.32]].forEach(([f,d])=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,audioCtx.currentTime+d);g.gain.linearRampToValueAtTime(0.18,audioCtx.currentTime+d+0.04);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d+0.30);
    o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+d);o.stop(audioCtx.currentTime+d+0.35);
  });
}
function playWin(){
  if(!audioCtx||!window.__wdSoundOn)return;stopBg();
  [[523.3,0],[659.3,0.14],[784,0.28],[1046.5,0.42],[784,0.56],[1046.5,0.7]].forEach(([f,t])=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type='square';o.frequency.value=f;
    g.gain.setValueAtTime(0,audioCtx.currentTime+t);g.gain.linearRampToValueAtTime(0.09,audioCtx.currentTime+t+0.04);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+t+0.36);
    o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+t);o.stop(audioCtx.currentTime+t+0.38);
  });
}

/* ===== CANVAS TEXTURES ===== */
function mkWallTex(title,sub,accent){
  const c=document.createElement('canvas');c.width=2048;c.height=1024;
  const x=c.getContext('2d');
  // Toza ochiq gradient fon
  const g=x.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#EEF4FF');g.addColorStop(1,'#F9FBFF');
  x.fillStyle=g;x.fillRect(0,0,2048,1024);
  // Zamonaviy yumshoq blob bezaklar
  const blob=(cx,cy,r,col,a)=>{const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(255,255,255,0)');x.globalAlpha=a;x.fillStyle=rg;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();x.globalAlpha=1;};
  blob(300,780,440,accent,0.11); blob(1770,280,470,accent,0.09); blob(1520,830,320,'#8B5CF6',0.06);
  // Juda nozik panjara
  x.strokeStyle='rgba(47,111,237,0.03)';x.lineWidth=1.5;
  for(let i=0;i<2048;i+=112){x.beginPath();x.moveTo(i,0);x.lineTo(i,1024);x.stroke()}
  for(let i=0;i<1024;i+=112){x.beginPath();x.moveTo(0,i);x.lineTo(2048,i);x.stroke()}
  function rrect(rx,ry,rw,rh,rad){x.beginPath();x.moveTo(rx+rad,ry);x.arcTo(rx+rw,ry,rx+rw,ry+rh,rad);x.arcTo(rx+rw,ry+rh,rx,ry+rh,rad);x.arcTo(rx,ry+rh,rx,ry,rad);x.arcTo(rx,ry,rx+rw,ry,rad);x.closePath();}
  // === WordDrop emblemasi (tomchi ramzi) ===
  const ex=1024, ey=336, R=94;
  const bg2=x.createLinearGradient(ex-R,ey-R,ex+R,ey+R);bg2.addColorStop(0,accent);bg2.addColorStop(1,'#1B4FCB');
  x.save();x.shadowColor='rgba(27,79,203,0.28)';x.shadowBlur=44;x.shadowOffsetY=16;
  x.fillStyle=bg2;rrect(ex-R,ey-R,2*R,2*R,48);x.fill();x.restore();
  // oq tomchi (WordDrop = so'z + tomchi)
  x.fillStyle='#fff';
  const dx=ex, dy=ey+16, dr=42;
  x.beginPath();
  x.moveTo(dx,dy-62);
  x.bezierCurveTo(dx+dr,dy-14,dx+dr,dy+34,dx,dy+34);
  x.bezierCurveTo(dx-dr,dy+34,dx-dr,dy-14,dx,dy-62);
  x.fill();
  // ichki yorug'lik (tomchi jilosi)
  x.globalAlpha=0.5;x.fillStyle=accent;x.beginPath();x.arc(dx-12,dy+6,12,0,Math.PI*2);x.fill();x.globalAlpha=1;
  // wordmark
  x.fillStyle='#1B3A8F';x.font='800 100px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('WordDrop',ex,ey+196);
  // shior (sub)
  x.fillStyle='rgba(107,116,136,0.74)';x.font='500 48px Inter,sans-serif';x.fillText(sub,ex,ey+282);
  // kicker chip (title)
  x.font='700 32px Inter,sans-serif';
  const tw=x.measureText(title).width, cw=tw+76, chH=66, cxp=ex-cw/2, cyp=ey+338;
  x.fillStyle='rgba(47,111,237,0.10)';rrect(cxp,cyp,cw,chH,33);x.fill();
  x.fillStyle=accent;x.textBaseline='middle';x.fillText(title,ex,cyp+chH/2+1);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkFloorTex(){
  const c=document.createElement('canvas');c.width=1024;c.height=1024;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(512,512,60,512,512,540);
  g.addColorStop(0,'#FFFFFF');g.addColorStop(0.5,'#F0F7FF');g.addColorStop(1,'#D0E2F8');
  x.fillStyle=g;x.fillRect(0,0,1024,1024);
  x.strokeStyle='rgba(47,111,237,0.07)';x.lineWidth=1;
  for(let i=0;i<1024;i+=80){x.beginPath();x.moveTo(i,0);x.lineTo(i,1024);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(1024,i);x.stroke()}
  // Qirralarda yumshoq vinyet — pol va devor tutashgan joyni "notekis chiziq" his qildirmasdan yumshoq birlashtiradi
  const edge=x.createRadialGradient(512,512,420,512,512,512);
  edge.addColorStop(0,'rgba(8,18,42,0)');edge.addColorStop(1,'rgba(8,18,42,0.22)');
  x.fillStyle=edge;x.fillRect(0,0,1024,1024);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkContactShadowTex(){
  // Quti tagida "yerga tegish"ni ko'rsatuvchi yumshoq, xiralashgan soya — obyekt qachon
  // yerga yaqinlashayotganini ko'z bilan sezdiradi va tushish jarayonini tabiiyroq qiladi.
  // Chetlari to'liq shaffof bo'lgani uchun kvadrat ko'rinmaydi, yumaloq soya bo'lib chiqadi.
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const x=c.getContext('2d');
  x.clearRect(0,0,256,256);
  const g=x.createRadialGradient(128,128,0,128,128,120);
  g.addColorStop(0,'rgba(10,20,45,0.55)');
  g.addColorStop(0.4,'rgba(10,20,45,0.32)');
  g.addColorStop(0.72,'rgba(10,20,45,0.12)');
  g.addColorStop(1,'rgba(10,20,45,0)');
  x.fillStyle=g;x.beginPath();x.arc(128,128,120,0,Math.PI*2);x.fill();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkBoxFaceTex(){
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,512,512);g.addColorStop(0,'#4A85FF');g.addColorStop(1,'#1B4FCB');
  x.fillStyle=g;x.fillRect(0,0,512,512);
  const rd=x.createRadialGradient(256,180,20,256,256,290);rd.addColorStop(0,'rgba(255,255,255,0.22)');rd.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=rd;x.fillRect(0,0,512,512);
  x.strokeStyle='rgba(255,255,255,0.32)';x.lineWidth=14;x.strokeRect(18,18,476,476);
  x.strokeStyle='rgba(255,255,255,0.14)';x.lineWidth=4;x.strokeRect(32,32,448,448);
  // Diamond pattern
  x.save();x.globalAlpha=0.07;x.strokeStyle='#fff';x.lineWidth=2;
  for(let i=-200;i<700;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i+300,512);x.stroke()}
  x.restore();
  x.fillStyle='rgba(255,255,255,0.95)';x.font='bold 52px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('WordDrop',256,178);
  x.fillStyle='rgba(255,255,255,0.78)';x.font='bold 26px Inter,sans-serif';x.fillText('New Vocabularies',256,254);
  for(let i=0;i<7;i++){x.beginPath();x.arc(196+i*20,304,4,0,Math.PI*2);x.fillStyle='rgba(255,255,255,0.45)';x.fill()}
  x.fillStyle='rgba(255,255,255,0.46)';x.font='600 19px monospace';x.fillText('dev \u00b7 B. Yoldoshev',256,418);
  // nozik don (grain) — tekis "plastik" ko'rinishni kamaytiradi
  const _im=x.getImageData(0,0,512,512),_d=_im.data;
  for(let i=0;i<_d.length;i+=4){const nz=(Math.random()-0.5)*9;_d[i]+=nz;_d[i+1]+=nz;_d[i+2]+=nz;}
  x.putImageData(_im,0,0);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkBoxSideTex(){
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#3374EE');g.addColorStop(1,'#193EB8');
  x.fillStyle=g;x.fillRect(0,0,512,512);
  x.strokeStyle='rgba(255,255,255,0.22)';x.lineWidth=10;x.strokeRect(16,16,480,480);
  x.save();x.globalAlpha=0.07;x.strokeStyle='#fff';x.lineWidth=2.5;
  for(let i=-512;i<1024;i+=44){x.beginPath();x.moveTo(i,0);x.lineTo(i+512,512);x.stroke()}
  x.restore();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkBoxInnerTex(){
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,256,256);g.addColorStop(0,'#1836A0');g.addColorStop(1,'#0F2478');
  x.fillStyle=g;x.fillRect(0,0,256,256);
  x.fillStyle='rgba(255,255,255,0.08)';x.font='bold 36px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('WordDrop',128,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkLidTex(){
  const c=document.createElement('canvas');c.width=512;c.height=256;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,512,256);g.addColorStop(0,'#FFFFFF');g.addColorStop(1,'#D0E4FF');
  x.fillStyle=g;x.fillRect(0,0,512,256);
  x.strokeStyle='rgba(47,111,237,0.30)';x.lineWidth=8;x.strokeRect(8,8,496,240);
  x.fillStyle='rgba(47,111,237,0.22)';x.font='bold 32px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('New Vocabularies',256,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkCardTex(term,tr){
  const c=document.createElement('canvas');c.width=360;c.height=230;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,360,230);g.addColorStop(0,'#FFFFFF');g.addColorStop(1,'#E4EEFF');
  x.fillStyle=g;x.fillRect(0,0,360,230);
  x.strokeStyle='rgba(47,111,237,0.32)';x.lineWidth=4;x.strokeRect(4,4,352,222);
  x.fillStyle='rgba(47,111,237,0.09)';x.fillRect(0,0,360,52);
  x.fillStyle='rgba(47,111,237,0.65)';x.font='bold 15px monospace';x.textAlign='left';x.fillText('VOCAB CARD',14,34);
  x.fillStyle='#1B4FCB';x.font='bold 44px Inter,sans-serif';x.textAlign='center';x.fillText(term,180,130);
  x.fillStyle='#6B7488';x.font='600 20px Inter,sans-serif';x.fillText(tr,180,178);
  const shine=x.createLinearGradient(0,0,360,0);shine.addColorStop(0,'rgba(255,255,255,0.6)');shine.addColorStop(0.5,'rgba(255,255,255,0)');
  x.fillStyle=shine;x.fillRect(0,0,180,230);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/* ===== SCENE INIT ===== */
function initScene(){
  const canvas=document.getElementById('three-canvas');
  renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  /* WebGL KONTEKST HIMOYASI (v90): brauzer xotira siqilganda yoki ilova uzoq
     ochiq turganda WebGL kontekstini majburan yopadi -> sahna oq/qora bo'lib
     qolardi va faqat ilovadan chiqib kirgach tiklanardi. Endi hodisa ushlanadi:
     foydalanuvchi xabardor qilinadi va kontekst qaytganda sahna qayta chiziladi. */
  try{
    canvas.addEventListener('webglcontextlost',ev=>{
      ev.preventDefault();
      try{ if(typeof showToast==='function') showToast('Grafika vaqtincha to\u2019xtadi \u2014 tiklanmoqda\u2026',IC&&IC.info); }catch(e){}
    },false);
    canvas.addEventListener('webglcontextrestored',()=>{
      try{ if(typeof drawScene==='function') drawScene(); }catch(e){}
      try{ if(typeof showToast==='function') showToast('Grafika tiklandi',IC&&IC.info); }catch(e){}
    },false);
  }catch(e){}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;

  scene=new THREE.Scene();
  scene.background=new THREE.Color(0xE8F1FF);
  scene.fog=new THREE.FogExp2(0xE8F1FF,0.010);

  camera=new THREE.PerspectiveCamera(44,1,0.1,80);
  camera.position.set(4.2,4.0,5.5);

  const hemi=new THREE.HemisphereLight(0xFFFFFF,0xC2D2EC,0.68);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xFFFFFF,2.4);
  sun.position.set(5,10,4);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-5;
  sun.shadow.camera.far=24;sun.shadow.bias=-0.0008;sun.shadow.normalBias=0.03;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x8FB4E8,0.32);fill.position.set(-5,3,-3);scene.add(fill);
  const back=new THREE.DirectionalLight(0xCFDFF7,0.42);back.position.set(0,3,-8);scene.add(back);

  buildRoom();buildFloor();buildBox();buildContactShadow();buildCeilingHatch();

  controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,0.9,0);controls.enableDamping=true;controls.dampingFactor=0.07;
  controls.minDistance=2.8;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*0.48;controls.update();
  // Desktop (sichqoncha): pan o'chiriladi — foydalanuvchi xonani surib yo'qotmasin. Aylantirish + g'ildirak-zoom qoladi.
  try{if(window.matchMedia&&matchMedia('(min-width:1024px) and (pointer:fine)').matches){controls.enablePan=false;controls.rotateSpeed=0.9;camera.position.set(3.6,3.44,4.73);controls.update();}}catch(e){}

  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
  clock=new THREE.Clock();
  renderer.domElement.addEventListener('pointerdown',onPointerDown);
  window.addEventListener('resize',onResize);
  initialized=true;
}

function buildRoom(){
  const RW=11,RH=8,RD=11;
  const wm=(tex,side=THREE.FrontSide)=>new THREE.MeshStandardMaterial({map:tex,roughness:0.84,metalness:0,side});
  const backTex=mkWallTex('New Vocabularies','Ingliz tilini zamonaviy o\'rganing','#2F6FED');
  const sideTex=mkWallTex('B. Yoldoshev','WordDrop Studio \u00b7 2026','#1FAE6B');
  // Oldingi devor (kamera ortida, kamdan-kam ko'rinadi) — sodda, matnsiz, shunda teskari yozuv chiqmaydi
  const plainMat=new THREE.MeshStandardMaterial({map:mkPlainWallTex(),roughness:0.9,metalness:0});
  const makePlane=(w,h,mat,px,py,pz,ry=0)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
    m.position.set(px,py,pz);if(ry)m.rotation.y=ry;m.receiveShadow=true;scene.add(m);
  };
  makePlane(RW,RH,wm(backTex),0,RH/2,-RD/2);           // orqa devor (asosiy, matn to'g'ri)
  makePlane(RW,RH,plainMat,0,RH/2,RD/2,Math.PI);       // oldingi devor (sodda, matnsiz)
  makePlane(RD,RH,wm(sideTex),RW/2,RH/2,0,-Math.PI/2); // o'ng devor
  makePlane(RD,RH,plainMat,-RW/2,RH/2,0,Math.PI/2);    // chap devor (sodda — teskari matndan qochish)
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(RW,RD),new THREE.MeshStandardMaterial({color:0xF8FBFF,roughness:1}));
  ceil.position.set(0,RH,0);ceil.rotation.x=Math.PI/2;scene.add(ceil);

  // PLINTUS (baseboard) — devor va pol tutashgan joydagi "yalang'och notekis chiziq"ni
  // yashiradi va xonaga tugallangan, professional ko'rinish beradi
  const baseMat=new THREE.MeshStandardMaterial({color:0xD5E2F7,roughness:0.5,metalness:0.06});
  const bbH=0.24,bbD=0.06;
  function addBaseboard(w,h,d,px,py,pz){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),baseMat);
    m.position.set(px,py,pz);m.receiveShadow=true;m.castShadow=true;scene.add(m);
  }
  addBaseboard(RW,bbH,bbD, 0,bbH/2,-RD/2+bbD/2);
  addBaseboard(RW,bbH,bbD, 0,bbH/2, RD/2-bbD/2);
  addBaseboard(bbD,bbH,RD, RW/2-bbD/2,bbH/2,0);
  addBaseboard(bbD,bbH,RD,-RW/2+bbD/2,bbH/2,0);

  // BURCHAK USTUNCHALAR — xonaning 4 vertikal qirrasini yumshoq trim bilan yopadi,
  // shu bilan devorlar orasidagi tikilgan burchak "notekis" ko'rinmaydi
  const cornerMat=new THREE.MeshStandardMaterial({color:0xC8D8F2,roughness:0.42,metalness:0.10});
  function addCorner(px,pz){
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.14,RH,0.14),cornerMat);
    m.position.set(px,RH/2,pz);m.receiveShadow=true;scene.add(m);
  }
  addCorner(RW/2-0.07,RD/2-0.07); addCorner(-RW/2+0.07,RD/2-0.07);
  addCorner(RW/2-0.07,-RD/2+0.07); addCorner(-RW/2+0.07,-RD/2+0.07);
}

function mkPlainWallTex(){
  // Sodda, matnsiz devor teksturasi — nozik panjara bilan, toza va bezaksiz
  const c=document.createElement('canvas');c.width=1024;c.height=1024;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#EDF4FF');g.addColorStop(1,'#F8FBFF');
  x.fillStyle=g;x.fillRect(0,0,1024,1024);
  x.strokeStyle='rgba(47,111,237,0.045)';x.lineWidth=1.5;
  for(let i=0;i<1024;i+=80){x.beginPath();x.moveTo(i,0);x.lineTo(i,1024);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(1024,i);x.stroke()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

let contactShadow;
function buildContactShadow(){
  // Quti tagida yuruvchi yumshoq soya — tushish paytida balandlikka qarab kattalashadi/kichrayadi,
  // shu orqali foydalanuvchi qutining yerga qachon tegishini oldindan "his qiladi"
  const mat=new THREE.MeshBasicMaterial({map:mkContactShadowTex(),transparent:true,depthWrite:false});
  contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),mat);
  contactShadow.rotation.x=-Math.PI/2;
  contactShadow.position.y=0.012;
  scene.add(contactShadow);
}

function buildCeilingHatch(){
  const RH=8, HR=1.15;
  // Dumaloq "ochilish" — shiftga o'rnatilgan qorong'i disk (tuynuk tubi)
  const hole=new THREE.Mesh(new THREE.CircleGeometry(HR,48),
    new THREE.MeshBasicMaterial({color:0x0B1A3A,side:THREE.DoubleSide}));
  hole.rotation.x=Math.PI/2; hole.position.set(0,RH-0.02,0); scene.add(hole);
  // Yorug' WordDrop-ko'k halqa (rim)
  const rim=new THREE.Mesh(new THREE.TorusGeometry(HR+0.06,0.06,18,64),
    new THREE.MeshStandardMaterial({color:0x2F6FED,emissive:0x1B4FCB,emissiveIntensity:0.55,roughness:0.4,metalness:0.3}));
  rim.rotation.x=Math.PI/2; rim.position.set(0,RH-0.05,0); scene.add(rim);
  // Yumshoq yorug'lik shafti — faqat quti tushayotganda ko'rinadi
  hatchShaft=new THREE.Mesh(new THREE.ConeGeometry(1.35,RH,44,1,true),
    new THREE.MeshBasicMaterial({color:0xBFD6FF,transparent:true,opacity:0.07,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  hatchShaft.position.set(0,RH/2,0); hatchShaft.visible=false; scene.add(hatchShaft);
}

function buildFloor(){
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.MeshStandardMaterial({map:mkFloorTex(),roughness:0.88,metalness:0.02}));
  fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(fl);
}

/* ===== DROP-ZONE BEZAKLARI: poldagi nishon + shift lyuki + burchak qutilari ===== */
function mkTargetTex(){
  const c=document.createElement('canvas');c.width=1024;c.height=1024;
  const x=c.getContext('2d');x.clearRect(0,0,1024,1024);
  const cx=512,cy=512;
  // xavf shevronlari (sariq-qora) — tashqi halqa
  const R=460,n=28;
  for(let i=0;i<n;i++){
    const a0=i/n*Math.PI*2, a1=(i+1)/n*Math.PI*2;
    x.fillStyle=i%2?'#F2C037':'#141414';
    x.beginPath();x.arc(cx,cy,R,a0,a1);x.arc(cx,cy,R-46,a1,a0,true);x.closePath();x.fill();
  }
  // qizil halqalar
  x.strokeStyle='rgba(228,72,78,0.92)';x.lineWidth=24;
  x.beginPath();x.arc(cx,cy,350,0,Math.PI*2);x.stroke();
  x.strokeStyle='rgba(228,72,78,0.5)';x.lineWidth=14;
  x.beginPath();x.arc(cx,cy,250,0,Math.PI*2);x.stroke();
  // markaz nishoni (krest)
  x.strokeStyle='rgba(228,72,78,0.85)';x.lineWidth=12;
  x.beginPath();x.moveTo(cx-150,cy);x.lineTo(cx+150,cy);x.moveTo(cx,cy-150);x.lineTo(cx,cy+150);x.stroke();
  x.fillStyle='rgba(228,72,78,0.85)';x.beginPath();x.arc(cx,cy,26,0,Math.PI*2);x.fill();
  // matn
  x.fillStyle='rgba(20,30,52,0.55)';x.font='bold 62px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('DROP ZONE',cx,cy+180);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function mkCrateTex(){
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#C8A063');g.addColorStop(1,'#9E7A40');
  x.fillStyle=g;x.fillRect(0,0,512,512);
  x.strokeStyle='rgba(80,55,25,0.30)';x.lineWidth=3;
  for(let i=70;i<512;i+=92){x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();}
  x.strokeStyle='rgba(70,48,20,0.55)';x.lineWidth=24;x.strokeRect(12,12,488,488);
  x.strokeStyle='rgba(70,48,20,0.38)';x.lineWidth=16;
  x.beginPath();x.moveTo(30,30);x.lineTo(482,482);x.moveTo(482,30);x.lineTo(30,482);x.stroke();
  x.fillStyle='rgba(47,111,237,0.85)';x.font='bold 58px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('WD',256,232);
  x.fillStyle='rgba(180,60,60,0.9)';x.font='bold 34px Inter,sans-serif';x.fillText('FRAGILE',256,300);
  // don
  const img=x.getImageData(0,0,512,512),d=img.data;
  for(let i=0;i<d.length;i+=4){const nz=(Math.random()-0.5)*14;d[i]+=nz;d[i+1]+=nz;d[i+2]+=nz;}
  x.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function buildDropZoneDecor(){
  const RH2=8;
  // --- Poldagi nishon (sekin aylanadi) ---
  const tMat=new THREE.MeshBasicMaterial({map:mkTargetTex(),transparent:true,depthWrite:false});
  const target=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6),tMat);
  target.rotation.x=-Math.PI/2;target.position.y=0.016;
  dropTarget=new THREE.Group();dropTarget.add(target);scene.add(dropTarget);

  // --- Shift lyuki (quti shu teshikdan tushadi) ---
  const hatch=new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.7),
    new THREE.MeshBasicMaterial({color:0x0A1428,side:THREE.DoubleSide}));
  hatch.rotation.x=Math.PI/2;hatch.position.set(0,RH2-0.03,0);scene.add(hatch);
  const frameMat=new THREE.MeshStandardMaterial({color:0xF2C037,roughness:0.55,metalness:0.2});
  const ft=0.18;
  [[2.9,ft,0,1.35],[2.9,ft,0,-1.35],[ft,2.9,1.35,0],[ft,2.9,-1.35,0]].forEach(([w,d,px,pz])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.14,d),frameMat);
    m.position.set(px,RH2-0.07,pz);scene.add(m);
  });

  // --- Burchak qutilari + palletalar (soya tashlamaydi — mobil unumdorlik uchun) ---
  const crateMat=new THREE.MeshStandardMaterial({map:mkCrateTex(),roughness:0.72,metalness:0.04});
  const palMat=new THREE.MeshStandardMaterial({color:0x8F7043,roughness:0.85});
  function crate(px,pz,s,ry){
    const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),crateMat);
    m.position.set(px,s/2+0.13,pz);m.rotation.y=ry;m.receiveShadow=true;scene.add(m);
  }
  function pallet(px,pz,w,d){
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,0.14,d),palMat);
    b.position.set(px,0.07,pz);b.receiveShadow=true;scene.add(b);
  }
  // orqa-o'ng burchak
  pallet(4.0,-4.0,2.1,2.1); crate(3.8,-4.1,1.15,0.28); crate(4.3,-3.5,0.82,-0.18); crate(3.5,-3.5,0.7,0.5);
  // orqa-chap burchak
  pallet(-4.0,-4.0,2.1,2.1); crate(-3.9,-4.0,1.2,-0.22); crate(-3.4,-4.3,0.78,0.4); crate(-4.3,-3.5,0.66,0.1);
  // chap-o'rta (kamera qarshisida emas)
  crate(-4.6,0.2,0.95,0.15);
}

/* ========== AIRDROP QIZIL TUTUN — o'yinlardagi airdrop kabi ========== */
let smokeParticles=[], smokeActive=false;
function mkSmokeTex(){
  // Yumshoq, aylanma bulutli tutun donasi
  const c=document.createElement('canvas');c.width=128;c.height=128;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,0.95)');
  g.addColorStop(0.35,'rgba(255,235,235,0.6)');
  g.addColorStop(0.7,'rgba(255,200,200,0.22)');
  g.addColorStop(1,'rgba(255,180,180,0)');
  x.fillStyle=g;x.beginPath();x.arc(64,64,64,0,Math.PI*2);x.fill();
  return new THREE.CanvasTexture(c);
}
let _smokeTex=null;
function buildSmoke(){
  _smokeTex=mkSmokeTex();
  // 22 ta tutun donasi — oldindan yaratamiz, keyin qayta-qayta ishlatamiz (performance uchun)
  for(let i=0;i<22;i++){
    const mat=new THREE.SpriteMaterial({
      map:_smokeTex, color:0xff3b3b, transparent:true, opacity:0,
      depthWrite:false, blending:THREE.NormalBlending
    });
    const sp=new THREE.Sprite(mat);
    sp.scale.set(0.5,0.5,0.5);
    sp.visible=false;
    scene.add(sp);
    smokeParticles.push({sprite:sp, life:0, maxLife:0, vx:0, vy:0, vz:0, baseScale:1});
  }
}
// Qizil tutunni portlatib chiqarish — quti yerga tushganda chaqiriladi
function emitSmoke(x,z){
  smokeActive=true;
  let launched=0;
  for(const p of smokeParticles){
    if(p.life>0) continue;                 // hali faol donani qayta ishlatmaymiz
    if(launched>=18) break;
    const ang=Math.random()*Math.PI*2;
    const spd=0.6+Math.random()*1.1;
    p.vx=Math.cos(ang)*spd;
    p.vz=Math.sin(ang)*spd;
    p.vy=1.6+Math.random()*1.6;            // yuqoriga otiladi
    p.maxLife=1.1+Math.random()*0.9;
    p.life=p.maxLife;
    p.baseScale=0.6+Math.random()*0.7;
    p.sprite.position.set(x+(Math.random()-0.5)*0.4, 0.2, z+(Math.random()-0.5)*0.4);
    p.sprite.scale.setScalar(p.baseScale*0.4);
    p.sprite.material.opacity=0;
    p.sprite.material.rotation=Math.random()*Math.PI*2;
    p.sprite.visible=true;
    launched++;
  }
}
// Har kadrda tutunni yangilash (animate ichidan chaqiriladi)
function updateSmoke(dt){
  if(!smokeActive) return;
  let anyAlive=false;
  for(const p of smokeParticles){
    if(p.life<=0) continue;
    anyAlive=true;
    p.life-=dt;
    const t=1-(p.life/p.maxLife);          // 0 → 1 (umr davomida)
    p.vy-=1.4*dt;                          // sekin pasayuvchi ko'tarilish
    p.vx*=0.96; p.vz*=0.96;
    p.sprite.position.x+=p.vx*dt;
    p.sprite.position.y+=p.vy*dt;
    p.sprite.position.z+=p.vz*dt;
    // Kattalashib, tarqalib boradi
    p.sprite.scale.setScalar(p.baseScale*(0.4+t*1.9));
    // Paydo bo'lish → cho'qqi → yo'qolish
    const fadeIn=Math.min(t*4,1);
    const fadeOut=Math.min(p.life/0.5,1);
    p.sprite.material.opacity=0.85*fadeIn*fadeOut;
    // Rangi: yorqin qizildan to'qroq qizilga
    p.sprite.material.rotation+=dt*0.6;
    if(p.life<=0){ p.sprite.visible=false; }
  }
  if(!anyAlive) smokeActive=false;
}

function buildBox(){
  boxGroup=new THREE.Group();
  pos.set(0,6.4,0);rotQ.identity();

  const fTex=mkBoxFaceTex(),sTex=mkBoxSideTex(),iTex=mkBoxInnerTex(),lTex=mkLidTex();
  const trimM=new THREE.MeshStandardMaterial({color:0xE8F0FF,roughness:0.24,metalness:0.55});

  /* --- TANA: 5 ta alohida Plane (ochiq yuqori yuz) --- */
  const bMat=(tex,rough=0.35,metal=0.18,side=THREE.FrontSide)=>new THREE.MeshStandardMaterial({map:tex,roughness:rough,metalness:metal,side});
  const iMat=bMat(iTex,0.6,0.05); // ichki yuzlar: bir tomonlama — quti ichini yopmaydi, kartalar ko'rinadi
  const fM=bMat(fTex,0.30,0.16,THREE.DoubleSide),sM=bMat(sTex,0.32,0.18,THREE.DoubleSide); // tashqi yuzlar: ikki tomonlama — aylanganda yo'qolmaydi

  function addFace(w,h,mat,px,py,pz,rx=0,ry=0,cast=true){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
    m.position.set(px,py,pz);m.rotation.set(rx,ry,0);
    if(cast)m.castShadow=true;m.receiveShadow=true;boxGroup.add(m);return m;
  }
  // alt: yon yuzlar (4 ta) + pastki yuz (1 ta) = 5 ta. Yuqorisi OCHIQ.
  // old (+Z)
  addFace(BW,BBASE,fM,0,BBASE/2,BD/2, 0,0);
  // orqa (-Z)
  addFace(BW,BBASE,fM,0,BBASE/2,-BD/2,0,Math.PI);
  // o'ng (+X)
  addFace(BD,BBASE,sM,BW/2,BBASE/2,0, 0,-Math.PI/2);
  // chap (-X)
  addFace(BD,BBASE,sM,-BW/2,BBASE/2,0,0,Math.PI/2);
  // tub (pastki, -Y)
  addFace(BW,BD,sM,0,0,0, -Math.PI/2,0);

  // ICHKI YUZLAR (ko'rinadi qopqoq ochilganda)
  addFace(BW,BD,iMat,0,BBASE*0.99,0, Math.PI/2,0,false); // ichki top
  addFace(BW,BBASE,iMat,0,BBASE/2,BD/2-0.004, 0,Math.PI,false); // ichki old
  addFace(BW,BBASE,iMat,0,BBASE/2,-BD/2+0.004,0,0,false); // ichki orqa
  addFace(BD,BBASE,iMat,BW/2-0.004,BBASE/2,0, 0,Math.PI/2,false);
  addFace(BD,BBASE,iMat,-BW/2+0.004,BBASE/2,0,0,-Math.PI/2,false);

  // Raycasting uchun invisible bounding mesh
  const invisMat=new THREE.MeshBasicMaterial({visible:false});
  boxBaseMesh=new THREE.Mesh(new THREE.BoxGeometry(BW,BBASE,BD),invisMat);
  boxBaseMesh.position.y=BBASE/2;boxGroup.add(boxBaseMesh);

  // CHAMBARLAR (corner trim) — boxGroup ichida, to'g'ri koordinatlarda
  const e=0.055,H=BBASE;
  function addEdge(sx,sy,sz,px,py,pz){
    const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),trimM);
    m.position.set(px,py,pz);m.castShadow=true;boxGroup.add(m);
  }
  // pastki 4 horizontal
  addEdge(BW+e,e,e, 0,0,BD/2); addEdge(BW+e,e,e,0,0,-BD/2);
  addEdge(e,e,BD+e, BW/2,0,0); addEdge(e,e,BD+e,-BW/2,0,0);
  // yuqori 4 horizontal
  addEdge(BW+e,e,e, 0,H,BD/2); addEdge(BW+e,e,e,0,H,-BD/2);
  addEdge(e,e,BD+e, BW/2,H,0); addEdge(e,e,BD+e,-BW/2,H,0);
  // 4 vertikal ustun
  addEdge(e,H+e,e, BW/2,H/2,BD/2); addEdge(e,H+e,e,-BW/2,H/2,BD/2);
  addEdge(e,H+e,e, BW/2,H/2,-BD/2);addEdge(e,H+e,e,-BW/2,H/2,-BD/2);

  // QOPQOQ
  lidPivot=new THREE.Group();
  lidPivot.position.set(0,BBASE,-BD/2);
  boxGroup.add(lidPivot);
  const lidMats=[
    new THREE.MeshStandardMaterial({color:0xEEF5FF,roughness:0.38,metalness:0.16}),
    new THREE.MeshStandardMaterial({color:0xEEF5FF,roughness:0.38,metalness:0.16}),
    new THREE.MeshStandardMaterial({map:lTex,roughness:0.28,metalness:0.10}),
    new THREE.MeshStandardMaterial({color:0xDCEAFF,roughness:0.50}),
    new THREE.MeshStandardMaterial({color:0xEEF5FF,roughness:0.38}),
    new THREE.MeshStandardMaterial({color:0xEEF5FF,roughness:0.38}),
  ];
  const lidM=new THREE.Mesh(new THREE.BoxGeometry(BW,BLID,BD),lidMats);
  lidM.position.set(0,BLID/2,BD/2);lidM.castShadow=true;lidPivot.add(lidM);
  // lid chambar
  // (qopqoq chekka simlari olib tashlandi — "muallaq tayoqcha" yo'qoladi, qopqoq ingichka toza panel bo'ladi)

  // KARTALAR (ichida yotadi)
  cardGroup=new THREE.Group();
  cardGroup.position.set(0,BBASE*0.44,0);
  cardGroup.visible=false;
  boxGroup.add(cardGroup);
  WORDS.slice(0,5).forEach((w,i)=>{
    const ang=(i/5)*Math.PI*2,r=0.28;
    const cm=new THREE.Mesh(
      new THREE.BoxGeometry(0.68,0.018,0.44),
      new THREE.MeshStandardMaterial({map:mkCardTex(w.term,w.tr),roughness:0.18,metalness:0.04})
    );
    cm.position.set(Math.sin(ang)*r,i*0.022,Math.cos(ang)*r);
    cm.rotation.y=-ang+0.3;
    cardGroup.add(cm);cardMeshes.push(cm);
  });

  boxGroup.position.copy(pos);scene.add(boxGroup);
}

/* ===== PHYSICS ===== */
function resetDrop(){
  physState='intro'; introT=0;
  pos.set(0,HATCH_SPAWN_Y,0);
  vel.set(0,0,0); angVel.set(0,0,0);
  rotQ.setFromEuler(new THREE.Euler(0,Math.random()*Math.PI*2,0));
  bounceCount=0;settleT=0;lidAngle=0;lidAngVel=0;lidPivot.rotation.x=0;
  cardGroup.visible=false;
  // Kamera kinematikasi: dumaloq tuynuk tepasidan yerga qadar kuzatib tushadi
  if(controls) controls.enabled=false;
  introCamTo=camera.position.clone();
  introCamFrom=introCamTo.clone().add(new THREE.Vector3(0,1.7,0.9));
  introTgtTo=new THREE.Vector3(0,0.9,0);
  introTgtFrom=new THREE.Vector3(0,HATCH_SPAWN_Y-0.1,0);
  if(hatchShaft) hatchShaft.visible=true;
  // MUHIM: eski kartalarni GPU xotirasidan to'liq o'chiramiz — aks holda har
  // tashlashda 5 ta tekstura to'planib, uzoq sessiyada brauzer qulaydi (Aw, snap)
  cardMeshes.forEach(cm=>{ try{
    if(cm.material){ if(cm.material.map) cm.material.map.dispose(); cm.material.dispose(); }
    if(cm.geometry) cm.geometry.dispose();
  }catch(e){} });
  cardMeshes=[];cardGroup.clear();
  WORDS.slice(0,5).forEach((w,i)=>{
    const ang=(i/5)*Math.PI*2,r=0.28;
    const cm=new THREE.Mesh(new THREE.BoxGeometry(0.68,0.018,0.44),new THREE.MeshStandardMaterial({map:mkCardTex(w.term,w.tr),roughness:0.18,metalness:0.04}));
    cm.position.set(Math.sin(ang)*r,i*0.022,Math.cos(ang)*r);cm.rotation.y=-ang+0.3;
    cardGroup.add(cm);cardMeshes.push(cm);
  });
  document.getElementById('game-hint').style.opacity='0';
}

function onResize(){
  if(!renderer||!camera)return;
  const el=renderer.domElement;
  const w=el.clientWidth||innerWidth, h=el.clientHeight||innerHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function onPointerDown(ev){
  if(physState!=='landed')return;initAudio();
  const rc=renderer.domElement.getBoundingClientRect();
  pointer.x=((ev.clientX-rc.left)/rc.width)*2-1;
  pointer.y=-((ev.clientY-rc.top)/rc.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  if(raycaster.intersectObjects(boxGroup.children,true).length){openBox()}
}
function openBox(){physState='opening';lidAngVel=-3.5;document.getElementById('game-hint').style.opacity='0';playOpen()}

function animate(){
  animId=requestAnimationFrame(animate);
  // Sahifa fonda bo'lsa GPU yuklanmasin — WebGL konteksti yo'qolib, sahna
  // oq/qora bo'lib qolishining asosiy sababi shu edi.
  if(document.hidden){ try{ clock.getDelta(); }catch(e){} return; }
  const dt=Math.min(clock.getDelta(),0.030);

  // Drop-zone nishoni sekin aylanadi (arzon)
  if(dropTarget) dropTarget.rotation.y += dt*0.12;

  // === KINEMATIK TUSHISH: dumaloq tuynukdan sekin tushadi, kamera kuzatib turadi ===
  if(physState==='intro'){
    introT+=dt;
    const D=3.0, u=Math.min(introT/D,1);
    const eu = u<0.5 ? 2*u*u : 1-Math.pow(-2*u+2,2)/2;   // easeInOut — sekin boshlanadi, yumshoq to'xtaydi
    rotQ.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), dt*0.55));
    const endY=GROUND-lowestCornerY(rotQ);
    pos.set(0, HATCH_SPAWN_Y+(endY-HATCH_SPAWN_Y)*eu, 0);
    boxGroup.position.copy(pos); boxGroup.quaternion.copy(rotQ);
    if(introCamFrom&&introCamTo){
      camera.position.lerpVectors(introCamFrom,introCamTo,eu);
      const tgt=new THREE.Vector3().lerpVectors(introTgtFrom,introTgtTo,eu);
      camera.lookAt(tgt);
      if(controls) controls.target.copy(tgt);
    }
    if(u>=1){
      pos.set(0,GROUND-lowestCornerY(rotQ),0);
      boxGroup.position.copy(pos);
      try{ playBounce(2.5); }catch(e){}
      if(hatchShaft) hatchShaft.visible=false;
      if(controls){ controls.target.set(0,0.9,0); controls.enabled=true; controls.update(); }
      physState='landed';
      document.getElementById('game-hint').style.opacity='1';
    }
  }

  // Yerga tegish soyasi — barcha holatlarda qutining ostida yuradi (tushish paytida ham,
  // yerga qo'nganidan keyin ham), balandlikka qarab kattalashadi/kichrayadi va xiralashadi
  if(contactShadow){
    const heightAbove=Math.max(pos.y-GROUND,0);
    const t=Math.max(0,1-heightAbove/6);
    contactShadow.position.set(pos.x,0.012,pos.z);
    const s=0.7+0.55*t;
    contactShadow.scale.set(s,s,s);
    contactShadow.material.opacity=0.12+0.6*t;
  }

  if(physState==='falling'){
    vel.y+=G*dt;
    pos.addScaledVector(vel,dt);
    const wl=angVel.length();
    if(wl>0.001){const ax=angVel.clone().normalize();rotQ.premultiply(new THREE.Quaternion().setFromAxisAngle(ax,wl*dt))}
    angVel.multiplyScalar(SDECAY);

    // DEVOR KOLLIZIYASI — quti xona chegarasidan chiqib ketmasligi uchun.
    // Xona yarim-kengligi 5.5, qutining yarim-eni ~0.92 (diagonal hisobga olib) → limit 4.4.
    const WALL=4.4;
    if(pos.x> WALL){pos.x= WALL;vel.x=-Math.abs(vel.x)*0.5}
    if(pos.x<-WALL){pos.x=-WALL;vel.x= Math.abs(vel.x)*0.5}
    if(pos.z> WALL){pos.z= WALL;vel.z=-Math.abs(vel.z)*0.5}
    if(pos.z<-WALL){pos.z=-WALL;vel.z= Math.abs(vel.z)*0.5}

    // Qutining eng past burchagini hisoblaymiz — nafaqat markazini. Shu orqali quti
    // burchagi bilan tushganda polga botib ketmaydi yoki havoda osilib qolmaydi.
    const minCornerY=lowestCornerY(rotQ);
    if(pos.y+minCornerY<=GROUND){
      const spd=Math.abs(vel.y);
      // (airdrop qizil tutuni olib tashlandi — sof WordDrop dizayni)
      pos.y=GROUND-minCornerY; // quti aynan yer sathiga qadar tushadi, ortiqcha botmaydi
      vel.y=-vel.y*REST;vel.x*=0.72;vel.z*=0.72;
      angVel.x*=FRIC;angVel.z*=FRIC;
      playBounce(spd);bounceCount++;
      // Tekislanish — Euler burchaklarini qo'lda nolga yaqinlashtirish o'rniga kvaternion
      // slerp ishlatamiz. Bu tebranishni yumshoq va tabiiy qiladi ("notekis" siltanish yo'qoladi).
      const ef=new THREE.Euler().setFromQuaternion(rotQ,'YXZ');
      const uprightQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ef.y,0,'YXZ'));
      const factor=Math.min(bounceCount*0.28,0.92);
      rotQ.slerp(uprightQ,factor);
      // Tekislanishdan keyin eng past burchak o'zgaradi — pastga botib/ko'tarilib
      // qolmasligi uchun pozitsiyani qayta moslaymiz
      pos.y=GROUND-lowestCornerY(rotQ);
      if(bounceCount>=4||(Math.abs(vel.y)<0.55&&spd>0.1)){
        vel.set(0,0,0);angVel.set(0,0,0);
        // Yakuniy holatda qutini ANIQ tik qilamiz (base pastda, faqat Y aylanma qoladi) —
        // shunda hech qachon "yonboshlab" yoki "og'ib" qolmaydi.
        const ef2=new THREE.Euler().setFromQuaternion(rotQ,'YXZ');
        rotQ.setFromEuler(new THREE.Euler(0,ef2.y,0,'YXZ'));
        pos.y=GROUND-lowestCornerY(rotQ);
        physState='settling'; // yumshoq yakuniy joylashish
        settleT=0;
      }
    }
    boxGroup.position.copy(pos);boxGroup.quaternion.copy(rotQ);
  }

  // SETTLING — quti tik holatga yumshoq "cho'kadi", so'ng landed bo'ladi
  if(physState==='settling'){
    settleT+=dt;
    pos.y += (GROUND - lowestCornerY(rotQ) - pos.y) * Math.min(settleT*6,1);
    boxGroup.position.copy(pos);boxGroup.quaternion.copy(rotQ);
    if(settleT>0.35){
      pos.y=GROUND-lowestCornerY(rotQ);
      boxGroup.position.copy(pos);
      physState='landed';
      document.getElementById('game-hint').style.opacity='1';
    }
  }

  if(physState==='opening'){
    const stf=30,dmp=7.5;
    lidAngVel+=(-stf*(lidAngle-LID_OPEN)-dmp*lidAngVel)*dt;
    lidAngle+=lidAngVel*dt;lidPivot.rotation.x=lidAngle;
    if(Math.abs(lidAngle-LID_OPEN)<0.007&&Math.abs(lidAngVel)<0.012){
      lidAngle=LID_OPEN;lidPivot.rotation.x=lidAngle;
      physState='opened';cardGroup.visible=true;
      cardMeshes.forEach((m,i)=>setTimeout(()=>{
        const sy=m.position.y,st=performance.now();
        const rise=()=>{const t=(performance.now()-st)/420;if(t>=1){m.position.y=sy+0.22;return}m.position.y=sy+t*0.22;requestAnimationFrame(rise)};rise();
      },i*90));
      setTimeout(()=>document.getElementById('rules-sheet').classList.add('show'),750);
    }
  }

  if(physState==='opened'){
    cardGroup.rotation.y+=0.007;
    cardMeshes.forEach((m,i)=>{m.position.y=0.22+Math.sin(Date.now()*0.0018+i*1.3)*0.025});
  }

  if(physState!=='intro') controls.update();
  renderer.render(scene,camera);
}

/* ===== WORD GAME ===== */
document.getElementById('rules-start-btn').addEventListener('click',()=>{
  document.getElementById('rules-sheet').classList.remove('show');
  sessionLearned=[];sessionSkips=0;showWordSheet();
});

function pickNext(){
  const r=WORDS.map((_,i)=>i).filter(i=>!sessionLearned.includes(i));
  return r.length?r[Math.floor(Math.random()*r.length)]:-1;
}

function showWordSheet(){
  const idx=pickNext();
  if(idx===-1){showLevelComplete();return}
  currentWordIdx=idx;
  const w=WORDS[idx];
  document.getElementById('word-sheet-inner').innerHTML=`
    <div class="sh-handle"></div>
    <div class="wg-top">
      <div class="wg-stat">${FLM}<span id="wgS">${window.__wdStreak||0}</span></div>
      <div class="wg-stat">${BOK}<span>${sessionLearned.length}/${WORDS.length}</span></div>
    </div>
    <div class="wg-wordblk">
      <span class="wg-pos">${w.pos}</span>
      <button class="wg-spk" id="wgSpk">${SPK} Eshitish</button>
      <div class="wg-term">${w.term}</div>
      <div class="wg-tr">${w.tr} <span style="color:var(--i3);font-size:12px">/${w.ipa}/</span></div>
      <div class="wg-def">${w.def}</div>
      <button class="wg-examples-btn" id="wgEx">${IC.brain} AI'dan misol gaplar so'rash</button>
      <div class="wg-examples" id="wgExBox"></div>
    </div>
    <div class="sc-wrap">
      <div class="sc-title">Gap talablari</div>
      <div class="sc-chips">
        <span class="sc-chip req">"${w.term}" so'zini ishlating</span>
        <span class="sc-chip req">Bosh harf + tinish belgisi</span>
        <span class="sc-chip req">To'liq, grammatik to'g'ri gap</span>
        <span class="sc-chip">AI grammatikani tekshiradi</span>
      </div>
    </div>
    <textarea class="wg-input" id="wgIn" placeholder="${w.term} so'zini ishlatib, to'liq gap yozing..."></textarea>
    <div class="wg-btns">
      <button class="btn btn-ghost" id="wgSkp">O'tkazib yuborish</button>
      <button class="btn btn-primary" id="wgSav">Tekshirish</button>
    </div>
    <div class="wg-fb" id="wgFb"></div>
    <div class="ai-res" id="aiRes"></div>`;
  document.getElementById('word-sheet').classList.add('show');
  document.getElementById('wgSpk').addEventListener('click',()=>speak(w.term));
  document.getElementById('wgSav').addEventListener('click',onSave);
  document.getElementById('wgSkp').addEventListener('click',onSkip);
  document.getElementById('wgEx').addEventListener('click',()=>loadExamples(w.term));
}

async function loadExamples(term){
  const btn=document.getElementById('wgEx');
  const box=document.getElementById('wgExBox');
  if(!btn||!box) return;
  btn.disabled=true;
  btn.innerHTML=`${IC.brain} <span class="ai-spin"></span> Misollar so'ralmoqda...`;
  const examples=await getExamplesAI(term);
  btn.disabled=false;
  btn.innerHTML=`${IC.brain} AI'dan misol gaplar so'rash`;
  if(!examples){
    box.innerHTML=`<div class="wg-ex-err">Misollarni yuklab bo'lmadi. Internetni tekshiring.</div>`;
    return;
  }
  box.innerHTML=examples.map(ex=>`
    <div class="wg-ex-item">
      <div class="wg-ex-en">${escapeHtml(ex.en||'')} <button class="wg-ex-spk" data-t="${escapeHtml(ex.en||'')}">${SPK}</button></div>
      <div class="wg-ex-uz">${escapeHtml(ex.uz||'')}</div>
    </div>`).join('');
  box.querySelectorAll('.wg-ex-spk').forEach(b=>{
    b.addEventListener('click',()=>speak(b.dataset.t));
  });
}

function flash(ok,msg){
  const fb=document.getElementById('wgFb');
  fb.className='wg-fb show '+(ok?'ok':'bad');
  fb.innerHTML=(ok?CHK:CRS)+`<span>${msg}</span>`;
}

let _aiBusy=false;
async function onSave(){
  if(_aiBusy)return;
  const w=WORDS[currentWordIdx];
  const val=(document.getElementById('wgIn').value||'').trim();
  if(!val){flash(false,'Iltimos, gap yozing');return}

  // 1-bosqich: mahalliy asosiy tekshiruv (AI'ni bekorga chaqirmaslik uchun)
  const issues=checkBasicGrammar(val,w);
  if(issues.length>0){ flash(false,issues[0]); return; }

  const wordToken=currentWordIdx;
  const savBtn=document.getElementById('wgSav'), skpBtn=document.getElementById('wgSkp');
  const box=document.getElementById('aiRes');
  _aiBusy=true;
  if(savBtn){savBtn.disabled=true;savBtn.textContent='AI tekshirmoqda...'}
  if(skpBtn)skpBtn.disabled=true;
  flash(true,'AI grammatikani tekshirmoqda...');
  if(box){box.className='ai-res pend';box.innerHTML='<b>AI Tekshiruvi</b><span class="ai-spin"></span> Gap tahlil qilinmoqda...'}

  // AI javobini kutamiz (eng ko'pi 15s)
  const result = await Promise.race([
    checkSentenceAI(val,w.term),
    new Promise(res=>setTimeout(()=>res(undefined),15000))
  ]);

  // Foydalanuvchi shu vaqt ichida boshqa so'zga o'tib ketgan bo'lsa — hech narsa qilmaymiz
  if(currentWordIdx!==wordToken){ _aiBusy=false; return; }

  _aiBusy=false;
  if(savBtn){savBtn.disabled=false;savBtn.textContent='Tekshirish'}
  if(skpBtn)skpBtn.disabled=false;

  // ---- HOLAT A: AI to'g'ri deb topdi → o'tkazamiz ----
  if(result && result.correct===true){
    vaultSave(currentLevelId,w.term,val,'ok','');
    if(box){box.className='ai-res ok';box.innerHTML='<b>AI Tekshiruvi ✓</b>Gap grammatik jihatdan to\'g\'ri tuzilgan. Ajoyib!'}
    flash(true,'To\'g\'ri! Keyingi so\'zga o\'tamiz.');
    markLearnedAndAdvance(wordToken,true);
    return;
  }

  // ---- HOLAT B: AI xato deb topdi → tuzatishni ko'rsatamiz, O'TKAZMAYMIZ ----
  if(result && result.correct===false){
    const corr=result.correction||'';
    const tip=result.tip||'';
    if(box){
      box.className='ai-res fix';
      box.innerHTML=`<b>AI Tuzatishi</b>`+
        (corr?`<div class="ai-corr"><span class="ai-corr-lbl">To'g'ri variant:</span> ${escapeHtml(corr)}</div>`:'')+
        (tip?`<div class="ai-tip">${escapeHtml(tip)}</div>`:'')+
        `<div class="ai-hint">Gapni tuzatib qayta yuboring yoki "O'tkazib yuborish"ni bosing.</div>`;
    }
    flash(false,'Gapda xatolik bor — tuzatib ko\'ring.');
    // Foydalanuvchi tuzatib qayta bosishi mumkin. Xato gap ham Omborxonaga "bad" bo'lib saqlanadi (o'rganish tarixi uchun).
    vaultSave(currentLevelId,w.term,val,'bad',corr?('→ '+corr):'');
    return;
  }

  // ---- HOLAT C: AI javob bermadi (timeout/tarmoq/xato) → jarima yo'q, pending saqlaymiz ----
  vaultSave(currentLevelId,w.term,val,'pend','');
  if(result && result.__error){
    // Xatoning ANIQ sababini ko'rsatamiz (internet / limit / server yangilanmagan) —
    // shunda foydalanuvchi nima qilish kerakligini biladi va bekorga kutmaydi.
    const why = (window.__wdAiErrMsg ? window.__wdAiErrMsg(result) : 'AI vaqtincha javob bermadi.');
    if(box){box.className='ai-res fix';box.innerHTML=`<b>AI vaqtincha ishlamadi</b><div class="ai-hint">${why}<br>Gap saqlandi — keyin Omborxonadan qayta tekshirsangiz bo'ladi. Hozircha o'tkazamiz.</div>`}
    flash(true,'Gap saqlandi (AI ulanmadi). O\'tkazamiz.');
  } else {
    if(box){box.className='ai-res ok';box.innerHTML=`<b>Gap saqlandi</b><div class="ai-hint">AI javobi kechikdi. Omborxonada qayta tekshirsangiz bo'ladi.</div>`}
    flash(true,'Gap saqlandi. Keyingi so\'zga o\'tamiz.');
  }
  markLearnedAndAdvance(wordToken,false);
}

function markLearnedAndAdvance(wordToken, countStreak){
  if(!sessionLearned.includes(wordToken))sessionLearned.push(wordToken);
  if(countStreak){
    window.__wdStreak=(window.__wdStreak||0)+1;
    window.__wdTotalLearned=(window.__wdTotalLearned||0)+1;
    // XP: to'g'ri gap uchun 10 XP + streak bonusi
    const bonus=Math.min((window.__wdStreak||1)-1,10);
    addXP(10+bonus);
    fireConfetti();
    checkMilestones();
  }
  updateProfileStats();saveState();
  setTimeout(()=>{
    const sheet=document.getElementById('word-sheet');
    if(sheet)sheet.classList.remove('show');
    setTimeout(showWordSheet,300);
  },1600);
}

function onSkip(){
  if(_aiBusy)return;
  sessionSkips++;
  window.__wdStreak=0;updateProfileStats();saveState();
  document.getElementById('word-sheet').classList.remove('show');
  setTimeout(showWordSheet,300);
}

function showLevelComplete(){
  const wasNew=!completedLevels.has(currentLevelId);
  completedLevels.add(currentLevelId);
  // Xatosiz (skip qilmasdan) yakunlangan bo'lsa — mukammal bosqich
  const perfect = (sessionSkips===0);
  if(wasNew){
    addXP(50); // bosqich yakunlash bonusi
    if(perfect){ window.__wdPerfect=(window.__wdPerfect||0)+1; unlockAch('perfect'); }
    try{ dailyProgress('level'); }catch(e){}   // kunlik topshiriq: bosqich yakunlandi
    if(perfect){ try{ dailyProgress('perfect'); }catch(e){} }  // kunlik: xatosiz yakunlandi
  }
  try{ sessionLearned.forEach(i=>{ const w=WORDS[i]; if(w) srsAdd(w.term,w.tr,{ipa:w.ipa,ex:w.ex}); }); saveState(); }catch(e){}
  try{ addCoins(10); }catch(e){}
  saveState();playWin();
  setTimeout(fireConfetti,200);
  document.getElementById('word-sheet-inner').innerHTML=`
    <div class="sh-handle"></div>
    <div class="rules-icon">${TRP}</div>
    <h2>Bosqich yakunlandi!</h2>
    <p class="desc">Barcha so'zlarni muvaffaqiyatli o'rgandingiz.${perfect?' <b>Mukammal — xatosiz!</b>':''} Gaplar Omborxonada saqlanib qoldi. Keyingi bosqich xaritada ochildi.</p>
    <button class="story-btn" id="wgStory" style="width:100%;margin:0 0 12px">${IC.brain} AI shu so'zlardan hikoya yozsin</button>
    <div class="story-box" id="wgStoryBox"></div>
    <button class="btn btn-primary btn-block" id="wgBack">Xaritaga qaytish</button>`;
  document.getElementById('word-sheet').classList.add('show');
  document.getElementById('wgBack').addEventListener('click',closeGame);
  document.getElementById('wgStory').addEventListener('click',loadStory);
}

async function loadStory(){
  const btn=document.getElementById('wgStory');
  const box=document.getElementById('wgStoryBox');
  if(!btn||!box) return;
  const terms=sessionLearned.map(i=>WORDS[i]?.term).filter(Boolean);
  if(terms.length===0){ showToast("Hikoya uchun so'z yo'q",IC.info); return; }
  btn.disabled=true;
  btn.innerHTML=`${IC.brain} <span class="ai-spin"></span> Hikoya yozilmoqda...`;
  const story=await getStoryAI(terms);
  btn.disabled=false;
  btn.innerHTML=`${IC.brain} Boshqa hikoya yozsin`;
  if(!story){
    box.className='story-box show';
    box.innerHTML=`<div class="wg-ex-err">Hikoyani yuklab bo'lmadi. Internetni tekshiring.</div>`;
    return;
  }
  box.className='story-box show';
  box.innerHTML=`
    ${story.title?`<div class="story-title">${escapeHtml(story.title)}</div>`:''}
    <div class="story-en">${escapeHtml(story.story)} <button class="wg-ex-spk" id="storySpk">${SPK}</button></div>
    ${story.uz?`<div class="story-uz">${escapeHtml(story.uz)}</div>`:''}`;
  const sp=document.getElementById('storySpk');
  if(sp) sp.addEventListener('click',()=>speak(story.story));
}

function closeGame(){
  ['word-sheet','rules-sheet'].forEach(id=>document.getElementById(id).classList.remove('show'));
  document.getElementById('game-overlay').hidden=true;
  stopBg();if(animId){cancelAnimationFrame(animId);animId=null;}
  _aiBusy=false;
  renderHome();updateProfileStats();
}
document.getElementById('game-back').addEventListener('click',()=>{
  // Agar biz history state qo'ygan bo'lsak, back orqali yopamiz (popstate closeGame'ni chaqiradi).
  // Aks holda to'g'ridan-to'g'ri yopamiz.
  if(history.state && history.state.wdGame){ history.back(); }
  else { closeGame(); }
});
document.getElementById('rules-sheet').querySelector('.modal-backdrop').addEventListener('click',()=>{});

// Telefonning "orqaga" tugmasi butun ilovani yopib yubormasligi uchun:
// o'yin ochiq bo'lganda back tugmasi faqat o'yinni yopadi.
window.addEventListener('popstate',()=>{
  const overlay=document.getElementById('game-overlay');
  if(overlay && !overlay.hidden){ closeGame(); }
  const lo=document.getElementById('listen-overlay');
  if(lo && !lo.hidden && window.__wdCloseListening){ window.__wdCloseListening(); }
});

window.__wdSetWords=function(arr){ if(Array.isArray(arr)&&arr.length) WORDS=arr; };
window.__wdBaseTerms=WORDS.map(w=>w.term);
window.__wdLevel1Backup=WORDS;
window.__wdStartGame=function(levelId){
  currentLevelId=levelId;
  document.getElementById('game-overlay').hidden=false;
  // History qatlamini qo'shamiz — endi "orqaga" ilovadan emas, o'yindan chiqaradi
  try{ history.pushState({wdGame:true},'','#game'); }catch(e){}
  if(!initialized){initScene();onResize()}
  initAudio();playBg();resetDrop();
  if(!animId)animate();
};
