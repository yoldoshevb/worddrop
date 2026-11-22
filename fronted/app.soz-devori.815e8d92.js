
/* ========== SO'Z DEVORI — 3D SINFXONA (v2) ==========
   Zamonaviy sinfxona: doska (Present Simple), o'qituvchi va 12 o'quvchi
   partasi, konditsioner. Harakat: chap-o'ngga/tepa-pastga qarash (drag),
   oldinga/orqaga yurish (tugmalar yoki W/S). 4 devor ham lug'at bloklari
   bilan to'ldiriladi. Blokka yaqinlashganda pastda "tekshirish" tugmasi
   chiqadi — qotib qolish muammosi shu orqali hal qilindi. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

/* ===== Global GLB yuklagich — shaxsiy xona jihozlari uchun =====
   Builderlar oddiy script blokda, GLTFLoader esa modulda. Shu ko'prik orqali
   builderlar model yuklay oladi. Har URL bir marta yuklanadi va keshlanadi. */
(function(){
  const _gltf=new GLTFLoader();
  const _draco=new DRACOLoader();
  _draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  _gltf.setDRACOLoader(_draco);
  const cache={};   // url -> yuklangan scene (klonlash uchun asl)
  const waiting={}; // url -> [callback,...] (yuklanayotgan paytda kutayotganlar)
  // opts: {height} — modelni shu balandlikka (metr) avtomatik masshtablaydi
  window.__wdLoadModel=function(url,onReady,opts){
    opts=opts||{};
    if(cache[url]){ onReady(prep(cache[url],opts)); return; }
    if(waiting[url]){ waiting[url].push({onReady,opts}); return; }
    waiting[url]=[{onReady,opts}];
    _gltf.load(url,g=>{
      cache[url]={scene:g.scene, anims:g.animations||[]};
      (waiting[url]||[]).forEach(w=>{ try{ w.onReady(prep(cache[url],w.opts)); }catch(e){} });
      delete waiting[url];
    },undefined,err=>{
      console.warn('[WordDrop] model yuklanmadi:',url,err);
      (waiting[url]||[]).forEach(w=>{ try{ w.onReady(null); }catch(e){} });
      delete waiting[url];
    });
  };
  function prep(entry,opts){
    const src=entry.scene, anims=entry.anims;
    const m=src.clone(true);
    // Ko'lankalar va material sozlamalari
    m.traverse(o=>{ if(o.isMesh && o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(mm=>{
        if(o.geometry && o.geometry.attributes && o.geometry.attributes.color) mm.vertexColors=true;
        if('metalness' in mm && mm.metalness>0.6) mm.metalness=0.4;
        // Teksturali model (Sketchfab): tekstura rangini to'g'ri ko'rsatish
        if(mm.map){
          try{ mm.map.colorSpace=THREE.SRGBColorSpace; }catch(e){}
          mm.map.needsUpdate=true;
          if(mm.color) mm.color.setRGB(1,1,1); // color tekstura rangini o'chirmasin
        }
        // Ba'zi Sketchfab eksportlarida rang emissiveMap'da bo'ladi
        if(mm.emissiveMap && mm.emissive){
          try{ mm.emissiveMap.colorSpace=THREE.SRGBColorSpace; }catch(e){}
          mm.emissive.setRGB(1,1,1); mm.emissiveIntensity=1;
        }
        mm.toneMapped=false;
        mm.side=THREE.DoubleSide;
        mm.needsUpdate=true;
      });
      o.castShadow=false; o.receiveShadow=false;
    }});
    const bb=new THREE.Box3().setFromObject(m);
    const h=(bb.max.y-bb.min.y)||1;
    if(opts.height){ m.scale.setScalar(opts.height/h); }
    bb.setFromObject(m);
    m.position.y-=bb.min.y;
    // Animatsiya bo'lsa — mixer yaratamiz va __wdRoomMixers ga qo'shamiz (roomTick yangilaydi)
    if(anims && anims.length){
      const mixer=new THREE.AnimationMixer(m);
      anims.forEach(cl=>mixer.clipAction(cl).play());
      m.userData.__mixer=mixer;
      (window.__wdRoomMixers=window.__wdRoomMixers||[]).push(mixer);
    }
    return m;
  }
})();

/* ===== O'QITUVCHI 3D MODELI (ixtiyoriy) =====
   Supabase Storage'dagi PUBLIC bucket'ga .glb faylini yuklang va uning
   ochiq havolasini quyidagi o'zgaruvchiga qo'ying, masalan:
   'https://SIZNING-LOYIHA.supabase.co/storage/v1/object/public/models/teacher.glb'
   Bo'sh qolsa — xona modelsiz, avvalgidek ishlayveradi. */
/* ===== DIVAN MUSHUGI (glb) — divan chetida yotadi ===== */
const CAT_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/cat_murdered_soul_suspect.glb';
let catMixer=null;
/* Deraza oldidagi ritsar (o'chirilgan) */
const KNIGHT_GLB_URL='';
let knightMixer=null;
const TEACHER_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/sign/models/executive_in_a_gray_suit.glb?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZDcwNTQ0NC1hYWU1LTQ3MTctODY1Zi00YmM1NWFiNWM2ZTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb2RlbHMvZXhlY3V0aXZlX2luX2FfZ3JheV9zdWl0LmdsYiIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODM1OTUwNzIsImV4cCI6MTgxNTEzMTA3Mn0.VKAjKVwMMob-H0NBxTUOlX8dH4P_c5dkicVwZg5dceg';
/* Yuqoridagi imzolangan (signed) URL tokeni muddatli — tugagach model yuklanmay
   qoladi. Bucket public bo'lsa, quyidagi zaxira manzil ishlaydi va xato bo'lganda
   avtomatik shu manzildan qayta urinib ko'riladi. */
const TEACHER_GLB_URL_PUBLIC='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/executive_in_a_gray_suit.glb';
let teacherMixer=null;

const OV=document.getElementById('wall-overlay');
// Eski mobil brauzerlar uchun roundRect polyfill
if(typeof CanvasRenderingContext2D!=='undefined' && !CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(px,py,pw,ph,rad){
    const r=Math.min(rad||0,pw/2,ph/2);
    this.moveTo(px+r,py);
    this.arcTo(px+pw,py,px+pw,py+ph,r);
    this.arcTo(px+pw,py+ph,px,py+ph,r);
    this.arcTo(px,py+ph,px,py,r);
    this.arcTo(px,py,px+pw,py,r);
    this.closePath();
    return this;
  };
}
const CV=document.getElementById('wall-canvas');
const HINT=document.getElementById('wall-hint');
const ADDBTN=document.getElementById('wlAdd');
const CHECKBTN=document.getElementById('wlCheck');
const MEAN=document.getElementById('wlMean');
const MEANTXT=document.getElementById('wlMeanTxt');

let inited=false, renderer, scene, camera, animId=null, clock=null;
let cssRenderer=null, cssScene=null;
/* Yorug'lik rejimlari: oddiy / to'q ko'k kino / o'chiq (faqat TV-bloklar nuri) */
let lightHemi=null, lightDir=null, lightP1=null, lightP2=null, stripMats=[];
let lightMode='normal';
const LIGHT_PRESETS={
  normal:{hi:0.95, hs:0xFFF6EC, hg:0x3A1A1E, di:0.75, pi:20, pc:0xFFE2B8, bg:0x26090D, strip:0xFFF7E8},
  blue:  {hi:0.32, hs:0x7E96E8, hg:0x0A0F26, di:0.10, pi:9,  pc:0x3D5BD9, bg:0x070B1C, strip:0x2A3C7A},
  off:   {hi:0.10, hs:0x40495E, hg:0x05060A, di:0.03, pi:1.5,pc:0x2A3450, bg:0x050508, strip:0x14151A}
};
const _lc={hs:new THREE.Color(0xFFF6EC), hg:new THREE.Color(0x3A1A1E), pc:new THREE.Color(0xFFE2B8), bg:new THREE.Color(0x26090D), strip:new THREE.Color(0xFFF7E8)};
function setLightMode(mode){
  lightMode=mode;
  const P=LIGHT_PRESETS[mode];
  _lc.hs.set(P.hs); _lc.hg.set(P.hg); _lc.pc.set(P.pc); _lc.bg.set(P.bg); _lc.strip.set(P.strip);
}
function lerpLights(dt){
  if(!lightHemi) return;
  const P=LIGHT_PRESETS[lightMode], k=Math.min(1,dt*2.5);
  lightHemi.intensity+=(P.hi-lightHemi.intensity)*k;
  lightHemi.color.lerp(_lc.hs,k); lightHemi.groundColor.lerp(_lc.hg,k);
  lightDir.intensity+=(P.di-lightDir.intensity)*k;
  lightP1.intensity+=(P.pi-lightP1.intensity)*k;
  lightP2.intensity+=(P.pi-lightP2.intensity)*k;
  lightP1.color.lerp(_lc.pc,k); lightP2.color.lerp(_lc.pc,k);
  scene.background.lerp(_lc.bg,k);
  if(scene.fog) scene.fog.color.copy(scene.background);
  stripMats.forEach(m=>m.color.lerp(_lc.strip,k));
  // Deraza nuri: kun fazasi x xona rejimi
  if(winLight){
    // Xona qorong'ilashgani sari deraza nuri sezilarliroq
    const mMul={normal:{l:0.8,fx:0.55}, blue:{l:1.0,fx:0.95}, off:{l:1.15,fx:1.3}}[lightMode];
    winLight.intensity+=(WIN_TARGET.i*mMul.l-winLight.intensity)*k;
    winLight.color.lerp(WIN_TARGET.col,k);
    const wp=shaftMats.__wp;
    if(wp){ wp.intensity+=(WIN_TARGET.i*9*mMul.l-wp.intensity)*k; wp.color.lerp(WIN_TARGET.col,k); }
    if(poolMat){
      poolMat.opacity+=(Math.min(0.55,WIN_TARGET.pool*mMul.fx)-poolMat.opacity)*k;
      poolMat.color.lerp(WIN_TARGET.col,k);
    }
    shaftMats.forEach(m=>{
      m.opacity+=(Math.min(0.3,WIN_TARGET.shaft*mMul.fx)-m.opacity)*k;
      m.color.lerp(WIN_TARGET.col,k);
    });
  }
}
let blocks=[];   // {grp, card, glow, data, enTex, uzTex, mode, flipping, revertTO, spawn}
let SLOTS=[];    // devorlardagi bo'sh joylar ro'yxati (tartib bilan to'ladi)
let pos=new THREE.Vector3(0,0,10.9), yaw=0, pitch=0;
let fwdHeld=false, backHeld=false;
let autoShown=false, quizBlock=null, targetBlock=null, meanFor=null, meanSince=0;
let camY=1.5, camYTarget=1.5, seated=false;
const ROOM_W=12, ROOM_D=12, ROOM_H=3.6;
const SOFA={x:2.35,z:2.3};            // divan markazi — TV ro'parasida, yaqinida
const SOFA_SEAT={x:2.42,z:2.3};       // o'tirish nuqtasi
const STAND_POS={x:2.75,z:3.95};      // divandan turgandagi joy
const DESK={x:-1.5,z:6.0};            // birinchi qatordagi "mening partam"
const DESK_SEAT={x:-1.5,z:6.58};      // partadagi o'tirish nuqtasi
const DESK_STAND={x:-0.4,z:7.25};     // partadan turgandagi joy (yo'lak)
let seatKind=null;                     // 'sofa' | 'desk'
const seatTarget={x:0,z:0};
const REACH=3.0;

/* ================= KARTA (BLOK) TEKSTURALARI — 2026 uslub ================= */
function rr(x,px,py,pw,ph,rad){x.beginPath();x.moveTo(px+rad,py);x.arcTo(px+pw,py,px+pw,py+ph,rad);x.arcTo(px+pw,py+ph,px,py+ph,rad);x.arcTo(px,py+ph,px,py,rad);x.arcTo(px,py,px+pw,py,rad);x.closePath();}
function wrap2(x,text,maxW){
  const words=text.split(/\s+/); const lines=[]; let cur='';
  words.forEach(w=>{ const t=cur?cur+' '+w:w;
    if(x.measureText(t).width>maxW && cur){lines.push(cur);cur=w;} else cur=t; });
  if(cur) lines.push(cur);
  return lines.slice(0,2);
}
function mkCardTex(text, mode, idx){
  const c=document.createElement('canvas'); c.width=512; c.height=288;
  const x=c.getContext('2d');
  // Yumshoq soya bilan dumaloq burchakli karta (fon shaffof — "sticker" effekti)
  x.save();
  x.shadowColor='rgba(20,8,0,.4)'; x.shadowBlur=26; x.shadowOffsetY=12;
  const g=x.createLinearGradient(0,20,0,258);
  if(mode==='en'){ g.addColorStop(0,'#FFE9A8'); g.addColorStop(.55,'#FFD24E'); g.addColorStop(1,'#F5B21A'); }
  else{ g.addColorStop(0,'#FFFBEE'); g.addColorStop(1,'#FFE9AE'); }
  x.fillStyle=g; rr(x,26,18,460,244,34); x.fill();
  x.restore();
  // Ust yaltiroq chizig'i + nozik hoshiya
  x.strokeStyle='rgba(255,255,255,.75)'; x.lineWidth=3; rr(x,30,22,452,236,30); x.stroke();
  x.strokeStyle='rgba(140,90,0,.22)'; x.lineWidth=2; rr(x,26,18,460,244,34); x.stroke();
  const hg=x.createLinearGradient(0,20,0,80);
  hg.addColorStop(0,'rgba(255,255,255,.5)'); hg.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=hg; rr(x,30,22,452,60,28); x.fill();
  // Tartib raqami — kichik chip
  x.fillStyle='rgba(255,255,255,.55)'; rr(x,44,34,64,34,17); x.fill();
  x.fillStyle='#7A5600'; x.font='800 21px Inter,sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  x.fillText('#'+(idx+1),76,52);
  // Til yorlig'i
  x.fillStyle=mode==='en'?'rgba(122,86,0,.85)':'rgba(31,174,107,.9)';
  x.font='800 19px Inter,sans-serif'; x.textAlign='right';
  x.fillText(mode==='en'?'EN':'UZ',462,52);
  // Asosiy matn
  x.fillStyle='#191410'; x.textAlign='center';
  let fs=76; x.font=`800 ${fs}px Inter,sans-serif`;
  while(x.measureText(text).width>404 && fs>38){ fs-=4; x.font=`800 ${fs}px Inter,sans-serif`; }
  if(x.measureText(text).width>404){
    fs=42; x.font=`800 ${fs}px Inter,sans-serif`;
    const lines=wrap2(x,text,404), lh=fs*1.14, y0=158-(lines.length-1)*lh/2;
    lines.forEach((l,i)=>x.fillText(l,256,y0+i*lh));
  } else x.fillText(text,256,158);
  // Pastki nozik chiziqcha — dekor
  x.fillStyle='rgba(122,86,0,.3)'; rr(x,216,228,80,7,3.5); x.fill();
  const t=new THREE.CanvasTexture(c);
  t.anisotropy=8; t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
function mkGlowTex(){
  const c=document.createElement('canvas'); c.width=256; c.height=160;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(128,80,10,128,80,120);
  g.addColorStop(0,'rgba(255,240,190,.85)'); g.addColorStop(1,'rgba(255,240,190,0)');
  x.fillStyle=g; x.fillRect(0,0,256,160);
  return new THREE.CanvasTexture(c);
}

/* ================= DEVOR / POL / DOSKA TEKSTURALARI ================= */
function mkWallGradTex(c1,c2,panels){
  const c=document.createElement('canvas'); c.width=512; c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,c1); g.addColorStop(1,c2);
  x.fillStyle=g; x.fillRect(0,0,512,512);
  if(panels){
    x.strokeStyle='rgba(255,255,255,.05)'; x.lineWidth=3;
    for(let i=1;i<5;i++){ x.beginPath(); x.moveTo(i*102,0); x.lineTo(i*102,512); x.stroke(); }
  }
  x.fillStyle='rgba(0,0,0,.16)'; x.fillRect(0,478,512,34);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function mkFloorTex2(){
  const c=document.createElement('canvas'); c.width=512; c.height=512;
  const x=c.getContext('2d');
  x.fillStyle='#E9DFD5'; x.fillRect(0,0,512,512);
  // Yog'och taxta chiziqlari
  x.strokeStyle='rgba(140,105,80,.18)'; x.lineWidth=2;
  for(let i=0;i<=8;i++){ x.beginPath();x.moveTo(0,i*64);x.lineTo(512,i*64);x.stroke(); }
  for(let r=0;r<8;r++){ const off=(r%2)*128;
    for(let cx=off;cx<512;cx+=256){ x.beginPath();x.moveTo(cx,r*64);x.lineTo(cx,r*64+64);x.stroke(); } }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,3); t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
/* ===== DOSKA — dinamik: AI istalgan mavzu qoidalarini yozadi ===== */
const BOARD_DEFAULT={title:'Present Simple',rules:[
  {sign:'+',rule:'I/You/We/They + V1  ·  He/She/It + V1+s',example:'"She works at a bank. They play chess."',note:"Doimiy odatlar, faktlar va jadval bo'yicha ishlar uchun"},
  {sign:'-',rule:"don't + V1  ·  doesn't + V1 (he/she/it)",example:'"He doesn\'t like coffee."',note:"Inkorda fe'lga -s qo'shilmaydi — doesn't o'zi ko'rsatadi"},
  {sign:'?',rule:'Do / Does + ega + V1 ?',example:'"Do you speak English? — Yes, I do."',note:"Qisqa javob: Yes, I do / No, she doesn't"},
  {sign:'*',rule:'Belgilar: always, usually, often, every day',example:'"I always get up at 7 o\'clock."',note:"Bu so'zlarni ko'rsangiz — Present Simple ishlating"}]};
const SIGN_COLORS={'+':'#1B7A46','-':'#C22B33','?':'#7A3FBF','*':'#1B4FCB'};
let boardCanvas=null, boardTex=null, boardMesh=null, boardAnimTO=null;
function fitFont(x,text,base,maxW,weight,fam,ital){
  let fs=base; x.font=`${ital?'italic ':''}${weight} ${fs}px ${fam}`;
  while(x.measureText(text).width>maxW && fs>16){ fs-=2; x.font=`${ital?'italic ':''}${weight} ${fs}px ${fam}`; }
}
function drawBoard(data, prog=1){
  if(!boardCanvas){ boardCanvas=document.createElement('canvas'); boardCanvas.width=1024; boardCanvas.height=560; }
  const x=boardCanvas.getContext('2d');
  x.clearRect(0,0,1024,560);
  x.fillStyle='#FCFDFE'; x.fillRect(0,0,1024,560);
  const sh=x.createLinearGradient(0,0,1024,560);
  sh.addColorStop(0,'rgba(210,225,245,.28)'); sh.addColorStop(.5,'rgba(255,255,255,0)'); sh.addColorStop(1,'rgba(200,215,235,.2)');
  x.fillStyle=sh; x.fillRect(0,0,1024,560);
  const F="'Chalkboard SE','Comic Sans MS','Segoe Print',cursive";
  const rules=(data.rules||[]).slice(0,4);
  // Nechta qator borligiga qarab vertikal masshtabni moslaymiz — doskadan chiqib ketmaydi
  let lineCount=0;
  rules.forEach(r=>{ lineCount+=1+(r.example?1:0)+(r.note?1:0); });
  const avail=560-140-24;
  const f=Math.max(0.62,Math.min(1,(avail/Math.max(1,lineCount))/44));
  // Yozish bosqichlari (marker animatsiyasi uchun)
  const units=1+lineCount;
  const show=Math.max(1,Math.ceil(prog*units));
  // Sarlavha — ko'k marker + qizil tagchiziq
  x.fillStyle='#1B4FCB'; x.textAlign='center';
  fitFont(x,'Theme: '+data.title,50,900,'700',F);
  x.fillText('Theme: '+data.title,512,76);
  const tw=x.measureText('Theme: '+data.title).width/2+18;
  x.strokeStyle='#D93438'; x.lineWidth=5; x.beginPath();
  x.moveTo(512-tw,96); x.quadraticCurveTo(512,108,512+tw,94); x.stroke();
  // Qoidalar
  x.textAlign='left';
  let y=138+34*f, u=1;
  rules.forEach(r=>{
    if(u<show){
      const col=SIGN_COLORS[r.sign]||'#20304A';
      x.fillStyle=col;
      const line=(r.sign?r.sign+'  ':'')+r.rule;
      fitFont(x,line,34*f,880,'700',F);
      x.fillText(line,70,y);
    }
    u++; y+=44*f;
    if(r.example){
      if(u<show){
        x.fillStyle='#5A6B85';
        fitFont(x,r.example,27*f,850,'600',F);
        x.fillText('      '+r.example,70,y);
      }
      u++; y+=40*f;
    }
    if(r.note){
      if(u<show){
        x.fillStyle='#B05A10';
        fitFont(x,'\u21b3 '+r.note,25*f,850,'600',F,true);
        x.fillText('      \u21b3 '+r.note,70,y);
      }
      u++; y+=42*f;
    }
    y+=14*f;
  });
  if(prog>=1){
    x.fillStyle='#D93438'; x.font='700 28px '+F; x.textAlign='right';
    x.fillText('*har kuni mashq!',965,540);
  }
  if(boardTex){ boardTex.needsUpdate=true; }
}
function mkBoardTex(){
  drawBoard(window.__wdWallBoard||BOARD_DEFAULT,1);
  boardTex=new THREE.CanvasTexture(boardCanvas);
  boardTex.anisotropy=8; boardTex.colorSpace=THREE.SRGBColorSpace;
  return boardTex;
}
/* "Marker bilan yozayotgan" animatsiya — qoidalar birma-bir paydo bo'ladi */
function animateBoardWrite(data){
  if(boardAnimTO){ clearInterval(boardAnimTO); boardAnimTO=null; }
  let p=0;
  drawBoard(data,0.01);
  boardAnimTO=setInterval(()=>{
    p+=0.055;
    drawBoard(data,Math.min(1,p));
    if(p>=1){ clearInterval(boardAnimTO); boardAnimTO=null; }
  },110);
}
function mkACTex(){
  const c=document.createElement('canvas'); c.width=512; c.height=128;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,128);
  g.addColorStop(0,'#FDFEFF'); g.addColorStop(1,'#E7ECF2');
  x.fillStyle=g; x.fillRect(0,0,512,128);
  // panjara chiziqlari
  x.strokeStyle='rgba(90,110,130,.35)'; x.lineWidth=3;
  for(let i=0;i<6;i++){ x.beginPath(); x.moveTo(30,86+i*6); x.lineTo(482,86+i*6); x.stroke(); }
  // displey + LED
  x.fillStyle='#22303E'; rr(x,388,26,86,34,8); x.fill();
  x.fillStyle='#5CF2B8'; x.font='700 24px Inter,sans-serif'; x.textAlign='center';
  x.fillText('22°',431,50);
  x.fillStyle='#1FAE6B'; x.beginPath(); x.arc(46,42,6,0,7); x.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

/* ================= SAHNA ================= */
const COLLIDERS=[]; // {minx,maxx,minz,maxz}
function addCollider(cx,cz,hw,hd){ COLLIDERS.push({minx:cx-hw,maxx:cx+hw,minz:cz-hd,maxz:cz+hd}); }
function box(w,h,d,color,px,py,pz,ry=0,rough=.8,metal=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}));
  m.position.set(px,py,pz); m.rotation.y=ry; scene.add(m); return m;
}
function cyl(r,h,color,px,py,pz,rz=0,rx=0){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),
    new THREE.MeshStandardMaterial({color,roughness:.5}));
  m.position.set(px,py,pz); m.rotation.z=rz; m.rotation.x=rx; scene.add(m); return m;
}

function buildStudentDesk(px,pz){
  // Parta: och yog'och stol + metall oyoqlar
  box(1.15,0.05,0.55,'#F1E3CE',px,0.72,pz);
  box(1.15,0.07,0.55,'#FFFFFF',px,0.665,pz,0,.6); // ostki oq panel
  [[-0.5,-0.22],[0.5,-0.22],[-0.5,0.22],[0.5,0.22]].forEach(([ox,oz])=>
    box(0.05,0.7,0.05,'#5A6470',px+ox,0.35,pz+oz,0,.4,.5));
  // Stul: ko'k plastik o'rindiq + suyanchiq
  const cz=pz+0.6;
  box(0.44,0.05,0.42,'#2F6FED',px,0.46,cz,0,.45);
  box(0.44,0.42,0.05,'#2F6FED',px,0.72,cz+0.19,0,.45);
  [[-0.17,-0.16],[0.17,-0.16],[-0.17,0.16],[0.17,0.16]].forEach(([ox,oz])=>
    box(0.04,0.45,0.04,'#5A6470',px+ox,0.225,cz+oz,0,.4,.5));
  addCollider(px,pz+0.25,0.68,0.65);
}
function buildTeacherZone(){
  // Doskaning chap tomonida, yuzi o'quvchilarga qaragan (doskani to'smaydi)
  const px=-2.9, pz=2.05;
  // Zamonaviy oq stol
  box(1.7,0.06,0.75,'#FBFBFD',px,0.76,pz,0,.35);
  box(1.6,0.6,0.06,'#E8ECF2',px,0.43,pz+0.3,0,.5); // old panel — o'quvchilar tomonda
  box(0.06,0.72,0.66,'#D7DDE6',px-0.78,0.38,pz,0,.5);
  box(0.06,0.72,0.66,'#D7DDE6',px+0.78,0.38,pz,0,.5);
  // O'qituvchi stuli — stol ortida (doska tomonda), o'quvchilarga qarab turadi
  const cz=pz-0.65;
  box(0.5,0.07,0.48,'#22262E',px,0.52,cz,0,.4);
  box(0.5,0.55,0.07,'#22262E',px,0.86,cz-0.19,0,.4); // suyanchiq doska tomonda
  cyl(0.04,0.42,'#5A6470',px,0.28,cz);
  box(0.42,0.04,0.42,'#5A6470',px,0.05,cz,Math.PI/4,.4,.6);
  // Stol ustida: qizil marker
  cyl(0.022,0.15,'#D93438',px-0.45,0.815,pz-0.1,Math.PI/2);
  cyl(0.024,0.03,'#33393F',px-0.53,0.815,pz-0.1,Math.PI/2); // qalpoq
  // Oq, bejirim ko'rsatkich tayoqcha — biroz diagonal yotibdi
  const stick=cyl(0.016,0.95,'#F7F8FA',px+0.25,0.81,pz+0.05,Math.PI/2);
  stick.rotation.y=0.5;
  cyl(0.022,0.09,'#C9CFD8',px+0.66,0.81,pz+0.27,Math.PI/2).rotation.y=0.5; // dastasi
  addCollider(px,pz-0.15,0.9,0.55);
}
/* ===== TELEVIZOR — o'ng devor tepasida, zamonaviy ===== */
let tvCanvas=null, tvTex=null, tvScreen=null, tvState='off', tvTO=null;
function drawTvOff(){
  const x=tvCanvas.getContext('2d');
  const g=x.createLinearGradient(0,0,640,360);
  g.addColorStop(0,'#0B0E13'); g.addColorStop(.5,'#12161D'); g.addColorStop(1,'#0A0C10');
  x.fillStyle=g; x.fillRect(0,0,640,360);
  // o'chiq ekrandagi xira aks
  const r=x.createLinearGradient(0,0,640,360);
  r.addColorStop(.28,'rgba(255,255,255,0)'); r.addColorStop(.42,'rgba(255,255,255,.05)'); r.addColorStop(.55,'rgba(255,255,255,0)');
  x.fillStyle=r; x.fillRect(0,0,640,360);
  x.fillStyle='#E0322E'; x.beginPath(); x.arc(612,338,6,0,7); x.fill(); // kutish LED
  if(tvTex) tvTex.needsUpdate=true;
}
function drawTvSplash(){
  const x=tvCanvas.getContext('2d');
  x.fillStyle='#04060A'; x.fillRect(0,0,640,360);
  const g=x.createRadialGradient(320,180,10,320,180,240);
  g.addColorStop(0,'rgba(47,111,237,.35)'); g.addColorStop(1,'rgba(47,111,237,0)');
  x.fillStyle=g; x.fillRect(0,0,640,360);
  x.fillStyle='#F4F7FF'; x.textAlign='center'; x.textBaseline='middle';
  x.font='800 54px Inter,sans-serif';
  x.fillText('SMART TV',320,168);
  x.fillStyle='rgba(200,215,240,.65)'; x.font='600 20px Inter,sans-serif';
  x.fillText('QLED · 4K',320,214);
  if(tvTex) tvTex.needsUpdate=true;
}
function drawTvOn(){
  const x=tvCanvas.getContext('2d');
  x.fillStyle='#101013'; x.fillRect(0,0,640,360);
  // yuqori qidiruv paneli
  x.fillStyle='#1E1F24'; x.beginPath(); x.roundRect(150,20,340,36,18); x.fill();
  x.strokeStyle='#3A3C44'; x.lineWidth=2; x.beginPath(); x.arc(176,38,8,0,7); x.stroke();
  x.beginPath(); x.moveTo(182,44); x.lineTo(188,50); x.stroke();
  x.fillStyle='#8A8D96'; x.font='600 17px Inter,sans-serif'; x.textAlign='left';
  x.fillText('Qidirish...',200,44);
  // chap panel ikonkalari
  x.fillStyle='#E0322E'; x.beginPath(); x.roundRect(22,22,34,34,10); x.fill();
  x.fillStyle='#fff'; x.beginPath(); x.moveTo(33,32); x.lineTo(33,46); x.lineTo(46,39); x.closePath(); x.fill();
  ['#26282E','#26282E','#26282E'].forEach((c,i)=>{ x.fillStyle=c; x.beginPath(); x.roundRect(22,74+i*50,34,34,10); x.fill(); });
  // video kartochkalari 3x2
  const cols=['#3E6FB8','#B84E3E','#3EA06B','#8C5AB8','#B89A3E','#4E9CB8'];
  for(let i=0;i<6;i++){
    const cx=84+(i%3)*186, cy=84+Math.floor(i/3)*136;
    const g=x.createLinearGradient(cx,cy,cx+166,cy+96);
    g.addColorStop(0,cols[i]); g.addColorStop(1,'#17181C');
    x.fillStyle=g; x.beginPath(); x.roundRect(cx,cy,166,96,10); x.fill();
    x.fillStyle='rgba(255,255,255,.9)';
    x.beginPath(); x.moveTo(cx+72,cy+34); x.lineTo(cx+72,cy+62); x.lineTo(cx+98,cy+48); x.closePath(); x.fill();
    x.fillStyle='rgba(0,0,0,.55)'; x.beginPath(); x.roundRect(cx+118,cy+72,40,18,5); x.fill();
    x.fillStyle='#fff'; x.font='600 12px Inter,sans-serif'; x.textAlign='center';
    x.fillText((3+i)+':'+(10+i*7),cx+138,cy+85);
    x.fillStyle='#C9CCD4'; x.font='600 13px Inter,sans-serif'; x.textAlign='left';
    x.fillText('Video dars '+(i+1),cx+2,cy+114);
  }
  if(tvTex) tvTex.needsUpdate=true;
}
function drawTvPrompt(){
  const x=tvCanvas.getContext('2d');
  x.fillStyle='#101013'; x.fillRect(0,0,640,360);
  const g=x.createRadialGradient(320,150,10,320,150,260);
  g.addColorStop(0,'rgba(224,50,46,.22)'); g.addColorStop(1,'rgba(224,50,46,0)');
  x.fillStyle=g; x.fillRect(0,0,640,360);
  x.fillStyle='#E0322E'; x.beginPath(); x.roundRect(276,110,88,62,16); x.fill();
  x.fillStyle='#fff'; x.beginPath(); x.moveTo(308,126); x.lineTo(308,156); x.lineTo(336,141); x.closePath(); x.fill();
  x.fillStyle='#F0F2F7'; x.font='700 26px Inter,sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  x.fillText('Video qo\'yish uchun',320,218);
  x.fillStyle='#9BA0AB'; x.font='600 20px Inter,sans-serif';
  x.fillText('pastdagi tugmani bosing',320,252);
  if(tvTex) tvTex.needsUpdate=true;
}
/* Haqiqiy YouTube pleer — CSS3D orqali ekranga joylanadi, boshqarish ishlaydi */
let tvCssObj=null;
function attachTvMedia(source){
  detachTvIframe();
  // Eski format (faqat YouTube ID satri) bilan moslik
  if(typeof source==='string') source={type:'yt', src:source};
  if(!source || !source.src) return;
  const wrap=document.createElement('div');
  wrap.style.width='640px'; wrap.style.height='360px';
  wrap.style.pointerEvents='auto';
  wrap.style.borderRadius='6px'; wrap.style.overflow='hidden';
  wrap.style.background='#000';
  if(source.type==='video'){
    // To'g'ridan-to'g'ri fayl — HTML5 video, hamma joyda ishlaydi
    const v=document.createElement('video');
    v.controls=true; v.playsInline=true; v.setAttribute('playsinline','');
    v.preload='auto';
    v.style.width='100%'; v.style.height='100%'; v.style.objectFit='contain';
    v.addEventListener('loadeddata',()=>showToast('Video tayyor — play bosing',IC.check),{once:true});
    v.addEventListener('error',()=>{
      const c=v.error?v.error.code:0;
      const m={1:'yuklash bekor qilindi',2:'tarmoq xatosi — havolani tekshiring',
               3:"kodek mos emas — videoni H.264 (mp4) qilib yuklang",
               4:"format qo'llanmaydi yoki havola ochilmadi (404/ruxsat)"}[c]||"noma'lum xato";
      showToast('Video xatosi: '+m,IC.info);
    });
    v.src=source.src;
    wrap.style.position='relative';
    wrap.appendChild(v);
    // Katta, aniq bosiladigan Play tugmasi — 3D burilgan pleerda mayda
    // boshqaruv tugmalari noaniq bosiladi, bu esa divandan ham bemalol ishlaydi
    const pl=document.createElement('div');
    pl.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,.22)';
    pl.innerHTML='<div style="width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 40px rgba(0,0,0,.5)"><div style="width:0;height:0;border-left:42px solid #C2333F;border-top:26px solid transparent;border-bottom:26px solid transparent;margin-left:12px"></div></div>';
    pl.addEventListener('click',ev=>{ ev.stopPropagation(); v.play().catch(err=>showToast('Ijro xatosi: '+String(err&&err.message||err).slice(0,60),IC.info)); });
    v.addEventListener('play',()=>{ pl.style.display='none'; });
    v.addEventListener('pause',()=>{ pl.style.display='flex'; });
    v.addEventListener('click',()=>{ if(!v.paused) v.pause(); });
    wrap.appendChild(pl);
    showToast('Video yuklanmoqda...',IC.info);
  } else {
    const ifr=document.createElement('iframe');
    ifr.width='640'; ifr.height='360';
    if(source.type==='vimeo')
      ifr.src='https://player.vimeo.com/video/'+encodeURIComponent(source.src)+'?playsinline=1';
    else
      ifr.src='https://www.youtube.com/embed/'+encodeURIComponent(source.src)+'?rel=0&playsinline=1&modestbranding=1';
    ifr.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
    ifr.referrerPolicy='strict-origin-when-cross-origin';
    ifr.allowFullscreen=true;
    wrap.appendChild(ifr);
  }
  try{
    tvCssObj=new CSS3DObject(wrap);
    const sc=1.62/640; // ekran kengligiga moslash
    tvCssObj.scale.set(sc,sc,sc);
    tvCssObj.position.copy(tvScreen.position);
    tvCssObj.position.x-=0.002;
    tvCssObj.rotation.y=-Math.PI/2;
    cssScene.add(tvCssObj);
  }catch(err){
    showToast('Ekranga ulashda xato: '+String(err&&err.message||err).slice(0,70),IC.info);
  }
}
function detachTvIframe(){
  if(tvCssObj){ cssScene.remove(tvCssObj); tvCssObj=null; }
}
function tvSet(state){
  tvState=state;
  if(tvTO){ clearTimeout(tvTO); tvTO=null; }
  if(state==='off'){ detachTvIframe(); drawTvOff(); }
  else if(state==='splash'){ detachTvIframe(); drawTvSplash(); tvTO=setTimeout(()=>tvSet('on'),1400); }
  else {
    // Manba doim bor: saqlangani yoki standart dars videosi
    const _src=window.__wdTvVideo||window.TV_DEFAULT;
    if(_src){ drawTvOn(); attachTvMedia(_src); }
    else drawTvPrompt();
  }
}
function tvToggle(){
  if(tvState==='off'){ tvSet('splash'); showToast('Televizor yoqildi',IC.check); }
  else { tvSet('off'); showToast("Televizor o'chirildi",IC.info); }
}
/* Havolani tahlil qilish: YouTube, Vimeo yoki to'g'ridan-to'g'ri video fayl (.mp4/.webm)
   To'g'ridan-to'g'ri fayl (masalan Supabase Storage'dagi .mp4) HAR QANDAY muhitda ishlaydi:
   file://, WebView, hosting — referrer talab qilmaydi. */
function parseTvSource(str){
  const t=String(str).trim();
  if(!t) return null;
  let m=t.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/)
      || t.match(/^([A-Za-z0-9_-]{11})$/);
  if(m) return {type:'yt', src:m[1]};
  m=t.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if(m) return {type:'vimeo', src:m[1]};
  if(/^https?:\/\/.+\.(mp4|webm|m4v|mov)(\?.*)?$/i.test(t) || (/supabase\.co\/storage/i.test(t) && /^https?:\/\//.test(t)))
    return {type:'video', src:t};
  return null;
}
function openTvSheet(){
  endQuiz();
  const el=openWallSheet(`
    <div class="rules-icon" style="background:#FFE3E1"><svg viewBox="0 0 24 24" class="ic" style="stroke:#E0322E"><rect x="2.5" y="6" width="19" height="12.5" rx="3"/><path d="M10 10 L14.5 12.2 L10 14.5 Z"/></svg></div>
    <h2 style="text-align:center">Televizor</h2>
    <p class="desc" style="text-align:center">Televizorda dars videosi ochiladi. Xohlasangiz o'z videongizni qo'yishingiz mumkin.</p>
    <input class="wl-input" id="wlTvIn" placeholder="Video havolasi" autocomplete="off">
    <p class="desc" style="text-align:center;font-size:11.5px;margin-top:8px">YouTube havolasini ham qo'yish mumkin — shunchaki nusxalab tashlang.</p>
    <div class="wl-fb" id="wlTvFb"></div>
    <div class="wg-btns" style="margin-top:14px">
      <button class="btn btn-ghost" id="wlTvReset">Dars videosi</button>
      <button class="btn btn-primary" id="wlTvGo">Ekranga qo'yish</button>
    </div>`);
  const fb=el.querySelector('#wlTvFb');
  const showFb=(cls,msg)=>{ fb.className='wl-fb show '+cls; fb.innerHTML=msg; };
  el.querySelector('#wlTvGo').addEventListener('click',()=>{
    const src=parseTvSource(el.querySelector('#wlTvIn').value);
    if(!src){ showFb('bad','Havola tanilmadi — tekshirib qayta urinib ko\u2019ring'); return; }
    window.__wdTvVideo=src; saveState();
    closeWallSheet();
    if(tvState!=='on') tvSet('splash'); else tvSet('on');
    const names={yt:'YouTube video', vimeo:'Vimeo video', video:'Video fayl'};
    showToast((names[src.type]||'Video')+" ekranga qo'yildi",IC.check);
  });
  const rs=el.querySelector('#wlTvReset');
  if(rs) rs.addEventListener('click',()=>{
    window.__wdTvVideo=window.TV_DEFAULT; saveState(); closeWallSheet();
    if(tvState!=='on') tvSet('splash'); else tvSet('on');
    showToast('Dars videosi qaytarildi',IC.check);
  });
}
function buildTV(){
  const cz=2.3, cy=2.5;
  // Ingichka ramka + orqa panel
  box(0.05,1.02,1.72,'#14161A',ROOM_W/2-0.055,cy,cz,0,.3,.4);
  box(0.03,0.06,0.5,'#2A2D33',ROOM_W/2-0.03,cy-0.56,cz,0,.4,.5); // pastki devor kronshteyni
  tvCanvas=document.createElement('canvas'); tvCanvas.width=640; tvCanvas.height=360;
  drawTvOff();
  tvTex=new THREE.CanvasTexture(tvCanvas);
  tvTex.anisotropy=8; tvTex.colorSpace=THREE.SRGBColorSpace;
  tvScreen=new THREE.Mesh(new THREE.PlaneGeometry(1.62,0.92),
    new THREE.MeshBasicMaterial({map:tvTex}));
  tvScreen.rotation.y=-Math.PI/2;
  tvScreen.position.set(ROOM_W/2-0.082,cy,cz);
  scene.add(tvScreen);
}
/* ===== KINOTEATR BURCHAGI: zamonaviy divan + stolcha (TV to'g'risida) ===== */
/* ===== "MENING PARTAM": daftar + kitob + ruchka, AI qo'lyozmasi ===== */
let paperMesh=null, paperCanvas=null, paperTex=null, paperAnimTO=null, nbIndex=0;
/* Har sahifa boshqa qo'lyozma shrifti — daftar tirikroq va turli-tuman ko'rinadi.
   Google Fonts orqali yuklanadi (yuqoridagi <link> ga qo'shilgan). */
const PAPER_FONTS = [
  "'Caveat', 'Segoe Script', cursive",              // yumshoq, zamonaviy
  "'Kalam', 'Segoe Script', cursive",               // aniq, o'qiladigan (tavsiya)
  "'Patrick Hand', 'Comic Sans MS', cursive",       // do'stona
  "'Shadows Into Light', 'Segoe Script', cursive",  // yorug', engil
  "'Architects Daughter', cursive",                 // chizmadek toza
  "'Homemade Apple', cursive"                       // klassik
];
function paperFontFor(pageIdx){
  return PAPER_FONTS[Math.abs(pageIdx|0) % PAPER_FONTS.length];
}
// Backward compatibility
const PAPER_FONT = PAPER_FONTS[0];
function wrapLines(x,text,maxW){
  const out=[];
  text.split(/\n+/).forEach((par,pi)=>{
    if(pi>0) out.push(''); // xatboshilar orasida bo'sh qator
    const words=par.split(/\s+/).filter(Boolean); let cur='';
    words.forEach(w=>{ const t=cur?cur+' '+w:w;
      if(x.measureText(t).width>maxW && cur){ out.push(cur); cur=w; } else cur=t; });
    if(cur) out.push(cur);
  });
  return out;
}
/* Daftar sahifasini chizish — prujinali daftar, katta va o'qiladigan matn */
function drawNotebook(page, prog=1){
  if(!paperCanvas){ paperCanvas=document.createElement('canvas'); paperCanvas.width=640; paperCanvas.height=860; }
  const x=paperCanvas.getContext('2d');
  // Har sahifa uchun boshqa qo'lyozma shrifti (nbIndex bo'yicha)
  const PF = paperFontFor(nbIndex);
  // Sahifa foni
  x.fillStyle='#FDFCF6'; x.fillRect(0,0,640,860);
  // Chap tomonda prujina (spiral) zonasi
  x.fillStyle='#F2EEE2'; x.fillRect(0,0,64,860);
  x.strokeStyle='rgba(120,110,90,.35)'; x.lineWidth=1.5;
  x.beginPath(); x.moveTo(64,0); x.lineTo(64,860); x.stroke();
  for(let ry=50;ry<860;ry+=72){
    x.fillStyle='#D8D2C2'; x.beginPath(); x.arc(32,ry,11,0,7); x.fill();       // teshik
    x.strokeStyle='#8E96A2'; x.lineWidth=5;
    x.beginPath(); x.arc(26,ry,14,Math.PI*0.65,Math.PI*1.75); x.stroke();      // sim halqa
  }
  // Qizil hoshiya va chiziqlar
  x.strokeStyle='rgba(217,52,56,.4)'; x.lineWidth=2.5;
  x.beginPath(); x.moveTo(100,24); x.lineTo(100,836); x.stroke();
  x.strokeStyle='rgba(90,130,200,.26)'; x.lineWidth=1.5;
  for(let y=130;y<816;y+=40){ x.beginPath(); x.moveTo(72,y); x.lineTo(616,y); x.stroke(); }
  const total=(window.__wdNotebook||[]).length;
  if(!page){
    x.fillStyle='rgba(70,80,110,.55)'; x.font='400 30px '+PF; x.textAlign='center';
    x.fillText("Yangi daftar",356,300);
    x.font='400 22px '+PF;
    x.fillText("Tegib, birinchi mavzuni bering",356,350);
  } else {
    // Sarlavha
    x.fillStyle='#1B2E7A'; x.textAlign='center';
    let ts=38; x.font='700 '+ts+'px '+PF;
    while(x.measureText(page.title).width>480 && ts>22){ ts-=2; x.font='700 '+ts+'px '+PF; }
    // Matn — imkon qadar YIRIK shrift bilan sig'diramiz
    x.textAlign='left';
    let fs=27, lines, lh;
    do{
      x.font='400 '+fs+'px '+PF;
      lines=wrapLines(x,page.text,496);
      lh=Math.max(fs*1.32,30);
      if(140+lines.length*lh<=812) break;
      fs-=1.5;
    }while(fs>16);
    const totalChars=page.title.length+page.text.length;
    let budget=Math.ceil(prog*totalChars);
    x.textAlign='center'; x.font='700 '+ts+'px '+PF; x.fillStyle='#1B2E7A';
    x.fillText(page.title.slice(0,Math.min(page.title.length,budget)),356,72);
    budget-=page.title.length;
    x.textAlign='left'; x.font='400 '+fs+'px '+PF; x.fillStyle='#25336B';
    let y=130+lh-10;
    for(const ln of lines){
      if(budget<=0) break;
      if(ln){ x.fillText(ln.slice(0,budget),112,y-8); budget-=ln.length+1; }
      y+=ln?lh:lh*0.55;
      if(y>824) break;
    }
    if(prog>=1){
      x.fillStyle='rgba(27,46,122,.55)'; x.font='400 21px '+PF; x.textAlign='right';
      x.fillText('~ AI ustoz',606,842);
      x.fillStyle='rgba(90,100,130,.6)'; x.font='600 19px Inter,sans-serif'; x.textAlign='center';
      x.fillText('— '+(nbIndex+1)+' / '+total+' —',356,848);
    }
  }
  if(paperTex) paperTex.needsUpdate=true;
}
function currentPage(){ const nb=window.__wdNotebook||[]; return nb[nbIndex]||null; }
function animatePaperWrite(page){
  if(paperAnimTO){ clearInterval(paperAnimTO); paperAnimTO=null; }
  let p=0;
  drawNotebook(page,0.001);
  paperAnimTO=setInterval(()=>{
    p+=0.01; // sekin, qo'lyozmadek
    drawNotebook(page,Math.min(1,p));
    if(p>=1){ clearInterval(paperAnimTO); paperAnimTO=null; }
  },70);
}
function buildDeskItems(){
  const dx=DESK.x, dz=DESK.z, topY=0.748;
  // Daftar — katta, tegiladigan (0.40 x 0.53 m)
  nbIndex=Math.max(0,(window.__wdNotebook||[]).length-1);
  drawNotebook(currentPage(),1);
  paperTex=new THREE.CanvasTexture(paperCanvas);
  paperTex.anisotropy=8; paperTex.colorSpace=THREE.SRGBColorSpace;
  // Daftar tagida qattiq muqova
  box(0.42,0.008,0.55,'#2A3550',dx-0.1,topY,dz,0.04,.6);
  paperMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.53),
    new THREE.MeshStandardMaterial({map:paperTex,roughness:.85}));
  paperMesh.rotation.x=-Math.PI/2; paperMesh.rotation.z=0.04;
  paperMesh.position.set(dx-0.1,topY+0.007,dz);
  scene.add(paperMesh);
  // Kitob — yopiq, to'q ko'k muqova (o'ng chetda)
  const bx=dx+0.38, bz=dz-0.06;
  box(0.2,0.028,0.27,'#F4EFE6',bx,topY+0.016,bz,0.3,.85);
  box(0.212,0.007,0.282,'#1F3C8C',bx,topY+0.033,bz,0.3,.55);
  // Ruchka — daftar yonida qiya
  const pen=cyl(0.0075,0.15,'#1B2E7A',dx+0.17,topY+0.012,dz+0.17,Math.PI/2);
  pen.rotation.y=0.7;
  const tip=cyl(0.005,0.02,'#C9CFD8',dx+0.235,topY+0.012,dz+0.222,Math.PI/2);
  tip.rotation.y=0.7;
}
/* ===== PANORAMA DERAZA — osmon haqiqiy vaqtga qarab o'zgaradi ===== */
let skyCanvas=null, skyTex=null, lastSkyDraw=0;
let winLight=null, poolMat=null, shaftMats=[], curtainMeshes=[], cloudTex=null;
let windowGlass=null, cloudsMesh=null, rainMesh=null, rainTex=null, rainMesh2=null, rainTex2=null, flashMat=null, flashLight=null;
let flashUntil=0, nextLightning=0, boltSeed=1, flashRedrawTO=null;
const WIN_TARGET={col:new THREE.Color(0xFFF2D8), i:1.0, pool:0.3, shaft:0.1, cloud:0.85};
function _sr(n){ const v=Math.sin(n*127.1+311.7)*43758.5453; return v-Math.floor(v); }
function drawSky(){
  if(!skyCanvas){ skyCanvas=document.createElement('canvas'); skyCanvas.width=640; skyCanvas.height=300; }
  if(window.__wdWindowScene==='fantasy'){ drawFantasy(); return; }
  const x=skyCanvas.getContext('2d');
  const d=new Date(), t=d.getHours()+d.getMinutes()/60;
  let phase,top,bot;
  if(t<5.5||t>=21){ phase='night'; top='#080F2C'; bot='#1B2C55'; }
  else if(t<8){ phase='dawn'; top='#6E9AD4'; bot='#F5B77E'; }
  else if(t<17){ phase='day'; top='#3E86D4'; bot='#BEE0F5'; }
  else if(t<19.5){ phase='sunset'; top='#5E5AA8'; bot='#F58B5C'; }
  else { phase='dusk'; top='#1E2756'; bot='#5E4A8C'; }
  const g=x.createLinearGradient(0,0,0,300);
  g.addColorStop(0,top); g.addColorStop(1,bot);
  x.fillStyle=g; x.fillRect(0,0,640,300);
  // Yulduzlar
  if(phase==='night'||phase==='dusk'){
    for(let i=0;i<70;i++){
      const sx=_sr(i)*640, sy=_sr(i+99)*200, r=0.7+_sr(i+7)*1.3;
      x.fillStyle='rgba(255,255,240,'+(0.35+_sr(i+3)*0.55)+')';
      x.beginPath(); x.arc(sx,sy,r,0,7); x.fill();
    }
  }
  // Quyosh (kunduzi yoy bo'ylab yuradi) yoki Oy
  if(phase==='day'||phase==='dawn'||phase==='sunset'){
    const f=Math.max(0,Math.min(1,(t-6)/14));
    const sx=60+f*520, sy=190-Math.sin(f*Math.PI)*130;
    const gl=x.createRadialGradient(sx,sy,4,sx,sy,70);
    gl.addColorStop(0,'rgba(255,240,190,.95)'); gl.addColorStop(1,'rgba(255,240,190,0)');
    x.fillStyle=gl; x.fillRect(sx-70,sy-70,140,140);
    x.fillStyle=phase==='sunset'?'#FFB25E':'#FFE9A8';
    x.beginPath(); x.arc(sx,sy,20,0,7); x.fill();
  } else {
    x.fillStyle='#EAEDF5'; x.beginPath(); x.arc(490,80,22,0,7); x.fill();
    x.fillStyle=top; x.beginPath(); x.arc(500,73,20,0,7); x.fill(); // o'roq oy
  }
  // Bulutlar
  if(phase!=='night'){
    x.fillStyle='rgba(255,255,255,'+(phase==='day'?0.75:0.35)+')';
    for(let i=0;i<3;i++){
      const cx0=80+_sr(i+21)*480, cy0=50+_sr(i+31)*90;
      for(let j=0;j<4;j++){
        x.beginPath(); x.ellipse(cx0+j*26-40,cy0+(_sr(i*4+j)*10-5),30,14,0,0,7); x.fill();
      }
    }
  }
  // Uzoqdagi shahar silueti
  x.fillStyle=phase==='day'?'#7FA0BC':'#0E1526';
  for(let i=0;i<14;i++){
    const bw=30+_sr(i+51)*36, bh=34+_sr(i+61)*72, bx=i*47-8;
    x.fillRect(bx,300-bh,bw,bh);
    if(phase!=='day'){
      x.fillStyle='rgba(255,214,120,.85)';
      for(let w=0;w<5;w++){ if(_sr(i*9+w)>0.45) x.fillRect(bx+5+(w%3)*9,300-bh+8+Math.floor(w/3)*16,4,6); }
      x.fillStyle='#0E1526';
    }
  }
  // Fazaga qarab derazadan tushadigan nur parametrlari
  const L={
    day:   {c:0xFFF2D8,i:1.15,p:0.30,sh:0.10,cl:0.9},
    dawn:  {c:0xFFC894,i:0.95,p:0.28,sh:0.13,cl:0.7},
    sunset:{c:0xFF9E6B,i:1.0, p:0.32,sh:0.15,cl:0.7},
    dusk:  {c:0x9FB4FF,i:0.55,p:0.20,sh:0.09,cl:0.4},
    night: {c:0x8FA8E8,i:0.45,p:0.18,sh:0.09,cl:0.25}
  }[phase];
  WIN_TARGET.col.set(L.c); WIN_TARGET.i=L.i; WIN_TARGET.pool=L.p; WIN_TARGET.shaft=L.sh; WIN_TARGET.cloud=L.cl;
  if(skyTex) skyTex.needsUpdate=true;
}
/* ===== FANTASY MANZARA: yomg'irli tunda ritsar qasri ===== */
function drawFantasy(flash){
  if(!skyCanvas){ skyCanvas=document.createElement('canvas'); skyCanvas.width=640; skyCanvas.height=300; }
  const x=skyCanvas.getContext('2d');
  // Bo'ronli osmon
  const g=x.createLinearGradient(0,0,0,300);
  g.addColorStop(0,'#141B36'); g.addColorStop(.55,'#2A3354'); g.addColorStop(1,'#3E4668');
  x.fillStyle=g; x.fillRect(0,0,640,300);
  // Bulut orasidagi xira oy
  const mg=x.createRadialGradient(120,58,6,120,58,80);
  mg.addColorStop(0,'rgba(220,228,255,.5)'); mg.addColorStop(1,'rgba(220,228,255,0)');
  x.fillStyle=mg; x.fillRect(30,-20,190,160);
  x.fillStyle='rgba(226,232,250,.85)'; x.beginPath(); x.arc(120,58,17,0,7); x.fill();
  // Og'ir bulutlar
  x.fillStyle='rgba(16,22,44,.75)';
  for(let i=0;i<4;i++){
    const bx=_sr(i+301)*640, by=20+_sr(i+311)*60;
    for(let j=0;j<5;j++){ x.beginPath(); x.ellipse((bx+j*44-88+640)%640,by+(_sr(i*5+j)*12-6),52,20,0,0,7); x.fill(); }
  }
  // Uzoq tog'lar
  x.fillStyle='#1B2240';
  x.beginPath(); x.moveTo(0,210); x.lineTo(90,150); x.lineTo(200,205); x.lineTo(330,160); x.lineTo(470,210); x.lineTo(640,175); x.lineTo(640,300); x.lineTo(0,300); x.closePath(); x.fill();
  // QASR — tepalik ustida
  const C='#10152B';
  x.fillStyle=C;
  x.beginPath(); x.moveTo(300,300); x.quadraticCurveTo(430,205,560,300); x.closePath(); x.fill(); // tepalik
  const tower=(tx,ty,tw,th)=>{
    x.fillStyle=C; x.fillRect(tx,ty,tw,th);
    for(let i=0;i<Math.floor(tw/10);i++) x.fillRect(tx+i*10,ty-6,6,6);   // tishlar
    x.beginPath(); x.moveTo(tx-4,ty-6); x.lineTo(tx+tw/2,ty-34); x.lineTo(tx+tw+4,ty-6); x.closePath(); x.fill(); // konus tom
  };
  x.fillStyle=C; x.fillRect(352,168,150,80); // asosiy devor
  for(let i=0;i<15;i++) x.fillRect(352+i*10,162,6,6);
  tower(330,140,34,110); tower(492,150,30,100); tower(410,96,40,155); // minoralar
  // Bayroq
  x.strokeStyle=C; x.lineWidth=3; x.beginPath(); x.moveTo(430,96); x.lineTo(430,70); x.stroke();
  x.fillStyle='#8C2F39'; x.beginPath(); x.moveTo(430,70); x.lineTo(452,76); x.lineTo(430,83); x.closePath(); x.fill();
  // Darvoza va yonayotgan derazalar
  x.fillStyle='#0A0E1E'; x.beginPath(); x.arc(427,248,16,Math.PI,0); x.fill(); x.fillRect(411,248,32,14);
  x.fillStyle='rgba(255,178,66,.95)';
  [[340,170],[344,196],[500,176],[503,200],[422,130],[436,130],[380,190],[398,182],[458,192],[470,178]].forEach(([wx,wy],i)=>{
    if(_sr(i+401)>0.15) x.fillRect(wx,wy,5,8);
  });
  x.fillStyle='rgba(255,178,66,.5)'; x.fillRect(419,252,16,10); // darvoza shu'lasi
  // Old plandagi qarag'aylar
  x.fillStyle='#0B0F20';
  [[40,300],[95,300],[610,300],[560,300]].forEach(([px2],i)=>{
    const h=55+_sr(i+501)*35;
    x.beginPath(); x.moveTo(px2-20,300); x.lineTo(px2,300-h); x.lineTo(px2+20,300); x.closePath(); x.fill();
  });
  // Tuman
  const fg=x.createLinearGradient(0,240,0,300);
  fg.addColorStop(0,'rgba(90,105,150,0)'); fg.addColorStop(1,'rgba(90,105,150,.35)');
  x.fillStyle=fg; x.fillRect(0,240,640,60);
  // CHAQMOQ chaqnashi: osmon oqarib, tarmoqlangan yashin uriladi
  if(flash){
    x.fillStyle='rgba(215,228,255,.38)'; x.fillRect(0,0,640,300);
    const bx0=180+_sr(boltSeed)*300;
    x.strokeStyle='rgba(255,255,255,.95)'; x.lineWidth=3.2;
    x.shadowColor='#BFD4FF'; x.shadowBlur=16;
    x.beginPath(); x.moveTo(bx0,10);
    let bx=bx0, by=10;
    for(let i=0;i<7;i++){
      bx+=(_sr(boltSeed*13+i)-0.5)*66; by+=26+_sr(boltSeed*7+i)*14;
      x.lineTo(bx,by);
      if(i===3){ // yon tarmoq
        x.moveTo(bx,by);
        x.lineTo(bx+(_sr(boltSeed+99)-0.5)*90, by+42);
        x.moveTo(bx,by);
      }
    }
    x.stroke();
    x.shadowBlur=0;
  }
  // Deraza nuri: sovuq bo'ron yorug'ligi
  WIN_TARGET.col.set(0x93A6D6); WIN_TARGET.i=0.6; WIN_TARGET.pool=0.2; WIN_TARGET.shaft=0.1; WIN_TARGET.cloud=0.3;
  if(skyTex) skyTex.needsUpdate=true;
}
function setWindowScene(mode){
  window.__wdWindowScene=mode;
  if(mode==='fantasy'){ drawFantasy(); }
  else { drawSky(); lastSkyDraw=performance.now(); }
  if(rainMesh) rainMesh.visible=(mode==='fantasy');
  if(rainMesh2) rainMesh2.visible=(mode==='fantasy');
  if(cloudsMesh) cloudsMesh.material.opacity=(mode==='fantasy')?0.3:0.85;
  saveState();
}
/* ===== KITOB JAVONI — katta, jonli: darsliklar, globus, kubok, suratlar ===== */
let bookGroup=null, shelfMesh=null;
const SHELF={x:-3.95, w:2.3, h:1.98, d:0.34};
function mkCurtainTex(){
  const c=document.createElement('canvas'); c.width=128; c.height=512;
  const x=c.getContext('2d');
  x.fillStyle='#EFE2CB'; x.fillRect(0,0,128,512);
  for(let i=0;i<128;i++){
    const sh=Math.sin(i*0.35)*0.5+0.5;
    x.fillStyle='rgba(120,95,60,'+(0.05+sh*0.16)+')';
    x.fillRect(i,0,1,512);
  }
  const g=x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'rgba(255,255,255,.18)'); g.addColorStop(1,'rgba(60,40,20,.14)');
  x.fillStyle=g; x.fillRect(0,0,128,512);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function mkGrammarCoverTex(){
  const c=document.createElement('canvas'); c.width=160; c.height=220;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,220);
  g.addColorStop(0,'#27447F'); g.addColorStop(1,'#16294F');
  x.fillStyle=g; x.fillRect(0,0,160,220);
  x.strokeStyle='#C8A445'; x.lineWidth=4; x.strokeRect(10,10,140,200);
  x.fillStyle='#F2E4B8'; x.textAlign='center'; x.font='800 26px Inter,sans-serif';
  x.fillText('ENGLISH',80,86);
  x.fillText('GRAMMAR',80,120);
  x.fillStyle='#C8A445'; x.font='600 15px Inter,sans-serif';
  x.fillText('B1 · B2',80,168);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function buildWindowAndShelf(){
  const WZ=ROOM_D; // orqa devor
  // ===== DERAZA: kichikroq, devor teshigiga mos, pardali =====
  drawSky();
  skyTex=new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace=THREE.SRGBColorSpace;
  // Osmon — teshik ORTIDA, chuqurroqda va kattaroq: kuchli parallaks
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.6),
    new THREE.MeshBasicMaterial({map:skyTex}));
  glass.rotation.y=Math.PI;
  glass.position.set(0,2.05,WZ+0.55);
  scene.add(glass);
  // Suzuvchi bulutlar — alohida shaffof qatlam, doim harakatda
  { const cc=document.createElement('canvas'); cc.width=512; cc.height=256;
    const cx2=cc.getContext('2d');
    for(let i=0;i<5;i++){
      const bx=_sr(i+201)*512, by=30+_sr(i+211)*120;
      cx2.fillStyle='rgba(255,255,255,'+(0.5+_sr(i+221)*0.35)+')';
      for(let j=0;j<5;j++){
        cx2.beginPath();
        cx2.ellipse((bx+j*30-60+512)%512, by+(_sr(i*7+j)*14-7), 36,15,0,0,7);
        cx2.fill();
      }
    }
    cloudTex=new THREE.CanvasTexture(cc);
    cloudTex.wrapS=THREE.RepeatWrapping;
    cloudsMesh=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.6),
      new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,opacity:0.85,depthWrite:false}));
    cloudsMesh.rotation.y=Math.PI; cloudsMesh.position.set(0,2.15,WZ+0.4);
    scene.add(cloudsMesh);
  }
  // YOMG'IR — ikki qatlam (parallaks): uzoqdagi mayda + yaqindagi yirik tomchilar
  const mkRainTex=(count,minLen,maxLen,alpha,width)=>{
    const rc2=document.createElement('canvas'); rc2.width=256; rc2.height=256;
    const rx=rc2.getContext('2d');
    rx.lineCap='round';
    for(let i=0;i<count;i++){
      const px2=_sr(i+601)*256, py2=_sr(i+611)*256, len=minLen+_sr(i+621)*(maxLen-minLen);
      const a=alpha*(0.5+_sr(i+631)*0.5);
      const gg=rx.createLinearGradient(px2,py2,px2-len*0.28,py2+len);
      gg.addColorStop(0,'rgba(210,226,255,0)');
      gg.addColorStop(0.5,'rgba(210,226,255,'+a+')');
      gg.addColorStop(1,'rgba(210,226,255,'+(a*0.3)+')');
      rx.strokeStyle=gg; rx.lineWidth=width;
      rx.beginPath(); rx.moveTo(px2,py2); rx.lineTo(px2-len*0.28,py2+len); rx.stroke();
    }
    const t=new THREE.CanvasTexture(rc2);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    return t;
  };
  rainTex2=mkRainTex(70,8,14,0.5,1);      // uzoq qatlam — mayda, zich
  rainTex2.repeat.set(1.8,1.8);
  rainMesh2=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.6),
    new THREE.MeshBasicMaterial({map:rainTex2,transparent:true,opacity:0.5,depthWrite:false}));
  rainMesh2.rotation.y=Math.PI; rainMesh2.position.set(0,2.05,WZ+0.36);
  rainMesh2.visible=false; scene.add(rainMesh2);
  rainTex=mkRainTex(34,22,38,0.75,1.8);   // yaqin qatlam — yirik, tez
  rainMesh=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.6),
    new THREE.MeshBasicMaterial({map:rainTex,transparent:true,opacity:0.7,depthWrite:false}));
  rainMesh.rotation.y=Math.PI; rainMesh.position.set(0,2.05,WZ+0.24);
  rainMesh.visible=false; scene.add(rainMesh);
  // Chaqmoq nuri — deraza ortida, faqat chaqnash paytida yonadi
  flashLight=new THREE.PointLight(0xCFDCFF,0,16);
  flashLight.position.set(0,2.9,WZ+1.1);
  scene.add(flashLight);
  windowGlass=glass;
  // DERAZADAN TUSHADIGAN NUR — xonaga haqiqiy yorug'lik kiradi
  winLight=new THREE.DirectionalLight(0xFFF2D8,1.0);
  winLight.position.set(0,3.4,WZ+2.2);
  winLight.target.position.set(0,0,6.2);
  scene.add(winLight); scene.add(winLight.target);
  const winPoint=new THREE.PointLight(0xFFF2D8,10,10);
  winPoint.position.set(0,2.1,WZ-0.6); scene.add(winPoint);
  shaftMats.__wp=winPoint; // lerp uchun saqlaymiz
  // Poldagi yorug'lik dog'i — deraza shaklidagi nur "ko'lmagi"
  { const pc=document.createElement('canvas'); pc.width=256; pc.height=256;
    const px2=pc.getContext('2d');
    const pg=px2.createLinearGradient(0,0,0,256);
    pg.addColorStop(0,'rgba(255,244,214,.95)'); pg.addColorStop(1,'rgba(255,244,214,0)');
    px2.fillStyle=pg;
    px2.beginPath(); px2.moveTo(70,0); px2.lineTo(186,0); px2.lineTo(246,256); px2.lineTo(10,256); px2.closePath(); px2.fill();
    // rom panjarasi soyasi — 2 vertikal qorong'i chiziq
    px2.clearRect(112,0,10,256); px2.clearRect(150,0,10,256);
    const pt=new THREE.CanvasTexture(pc);
    poolMat=new THREE.MeshBasicMaterial({map:pt,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending});
    const pool=new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.4),poolMat);
    pool.rotation.x=-Math.PI/2; pool.rotation.z=Math.PI;
    pool.position.set(0,0.015,WZ-2.1);
    scene.add(pool);
  }
  // Havodagi nur ustuni — derazadan polga qiya tushadi
  { const gc=document.createElement('canvas'); gc.width=64; gc.height=256;
    const gx=gc.getContext('2d');
    const gg=gx.createLinearGradient(0,0,0,256);
    gg.addColorStop(0,'rgba(255,244,214,.55)'); gg.addColorStop(1,'rgba(255,244,214,0)');
    gx.fillStyle=gg; gx.fillRect(0,0,64,256);
    const gt=new THREE.CanvasTexture(gc);
    [[-0.75],[0],[0.75]].forEach(([ox])=>{
      const sm=new THREE.MeshBasicMaterial({map:gt,transparent:true,opacity:0.1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
      shaftMats.push(sm);
      const shaft=new THREE.Mesh(new THREE.PlaneGeometry(0.86,3.9),sm);
      shaft.position.set(ox,1.35,WZ-1.55);
      shaft.rotation.x=-0.63; // derazadan polga qiya
      scene.add(shaft);
    });
  }
  // Ichki yon devorlar (otkos) — teshik chetlarini qoplaydi, chuqurlik beradi
  const jamb=new THREE.MeshStandardMaterial({color:'#FAF6EE',roughness:.6});
  const jT=new THREE.Mesh(new THREE.BoxGeometry(3.06,0.035,0.36),jamb);        jT.position.set(0,2.745,WZ+0.005); scene.add(jT);
  const jB=new THREE.Mesh(new THREE.BoxGeometry(3.06,0.035,0.36),jamb.clone());jB.position.set(0,1.355,WZ+0.005); scene.add(jB);
  const jL=new THREE.Mesh(new THREE.BoxGeometry(0.035,1.42,0.36),jamb.clone());jL.position.set(-1.495,2.05,WZ+0.005); scene.add(jL);
  const jR=new THREE.Mesh(new THREE.BoxGeometry(0.035,1.42,0.36),jamb.clone());jR.position.set(1.495,2.05,WZ+0.005); scene.add(jR);
  // Bo'rtgan tashqi rom
  box(3.4,0.13,0.09,'#F5F1E8',0,2.81,WZ-0.12,0,.55);
  box(3.4,0.13,0.09,'#F5F1E8',0,1.29,WZ-0.12,0,.55);
  box(0.13,1.66,0.09,'#F5F1E8',-1.585,2.05,WZ-0.12,0,.55);
  box(0.13,1.66,0.09,'#F5F1E8',1.585,2.05,WZ-0.12,0,.55);
  // Rom panjaralari — 3 bo'lak + gorizontal
  box(0.05,1.4,0.05,'#F5F1E8',-0.5,2.05,WZ+0.05,0,.55);
  box(0.05,1.4,0.05,'#F5F1E8',0.5,2.05,WZ+0.05,0,.55);
  box(3.0,0.045,0.05,'#F5F1E8',0,2.05,WZ+0.05,0,.55);
  // Podokonnik + kaktus
  box(3.6,0.075,0.32,'#EDE7DA',0,1.24,WZ-0.2,0,.55);
  cyl(0.05,0.085,'#C46A4A',1.15,1.32,WZ-0.22);
  const cactus=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,10),
    new THREE.MeshStandardMaterial({color:'#3E7D4E',roughness:.8}));
  cactus.position.set(1.15,1.4,WZ-0.22); cactus.scale.y=1.6; scene.add(cactus);
  // Oyna yaltirashi
  const shc=document.createElement('canvas'); shc.width=256; shc.height=128;
  const sx2=shc.getContext('2d');
  sx2.fillStyle='rgba(255,255,255,.15)';
  sx2.beginPath(); sx2.moveTo(30,128); sx2.lineTo(90,0); sx2.lineTo(126,0); sx2.lineTo(66,128); sx2.closePath(); sx2.fill();
  sx2.fillStyle='rgba(255,255,255,.08)';
  sx2.beginPath(); sx2.moveTo(150,128); sx2.lineTo(210,0); sx2.lineTo(226,0); sx2.lineTo(166,128); sx2.closePath(); sx2.fill();
  const shT=new THREE.CanvasTexture(shc);
  const shine=new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.4),
    new THREE.MeshBasicMaterial({map:shT,transparent:true,depthWrite:false}));
  shine.rotation.y=Math.PI; shine.position.set(0,2.05,WZ+0.1); scene.add(shine);
  // Karniz + pardalar
  cyl(0.026,4.5,'#8A7350',0,3.06,WZ-0.16,Math.PI/2);
  const fin1=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,10),new THREE.MeshStandardMaterial({color:'#8A7350',roughness:.5}));
  fin1.position.set(-2.25,3.06,WZ-0.16); scene.add(fin1);
  const fin2=fin1.clone(); fin2.position.x=2.25; scene.add(fin2);
  const curtTex=mkCurtainTex();
  const cm=new THREE.MeshStandardMaterial({map:curtTex,roughness:.9,side:THREE.DoubleSide});
  const c1=new THREE.Mesh(new THREE.PlaneGeometry(0.55,1.95),cm);
  c1.rotation.y=Math.PI; c1.position.set(-1.9,2.06,WZ-0.17); scene.add(c1);
  const c2=new THREE.Mesh(new THREE.PlaneGeometry(0.55,1.95),cm.clone());
  c2.rotation.y=Math.PI; c2.position.set(1.9,2.06,WZ-0.17); scene.add(c2);
  curtainMeshes=[c1,c2];

  // ===== KITOB JAVONI: katta, hajmli =====
  const SX=SHELF.x, SZ=WZ-SHELF.d/2-0.02, W=SHELF.w, H=SHELF.h, D=SHELF.d;
  const wood='#6E4F32', wood2='#7E5C3C', woodIn='#8C6A48';
  box(W+0.12,0.09,D+0.08,wood,SX,H-0.02,SZ,0,.55);         // tepa toj
  box(W,0.1,D,wood,SX,0.06,SZ,0,.55);                       // poydevor
  box(0.07,H,D,wood,SX-W/2+0.035,H/2,SZ,0,.55);
  box(0.07,H,D,wood,SX+W/2-0.035,H/2,SZ,0,.55);
  box(W-0.12,H-0.14,0.03,woodIn,SX,H/2,SZ+0.15,0,.7);       // ochroq orqa panel
  box(W-0.14,0.05,D-0.06,wood2,SX,0.68,SZ,0,.55);           // 1-tokcha
  box(W-0.14,0.05,D-0.06,wood2,SX,1.3,SZ,0,.55);            // 2-tokcha
  shelfMesh=new THREE.Mesh(new THREE.BoxGeometry(W+0.1,H,D),
    new THREE.MeshBasicMaterial({visible:false}));
  shelfMesh.position.set(SX,H/2,SZ); scene.add(shelfMesh);
  addCollider(SX,SZ+0.02,W/2+0.08,D/2+0.06);
  // Javon USTIDA: globus va oltin kubok
  cyl(0.055,0.025,wood,SX-0.75,H+0.045,SZ);
  cyl(0.016,0.07,'#9A8A70',SX-0.75,H+0.09,SZ);
  const globe=new THREE.Mesh(new THREE.SphereGeometry(0.105,14,12),
    new THREE.MeshStandardMaterial({color:'#2E86C1',roughness:.5}));
  globe.position.set(SX-0.75,H+0.21,SZ); globe.rotation.z=0.35; scene.add(globe);
  [[0.4,-0.25,0.05,'#3E9D5C'],[-0.2,0.3,0.045,'#3E9D5C'],[0.1,-0.5,0.04,'#E8D9A8']].forEach(([a,b2,r,col])=>{
    const cont=new THREE.Mesh(new THREE.SphereGeometry(0.106,10,10),
      new THREE.MeshStandardMaterial({color:col,roughness:.6}));
    cont.position.copy(globe.position); cont.scale.set(r*6,r*5,r*6);
    cont.position.x+=a*0.06; cont.position.y+=b2*0.06; scene.add(cont);
  });
  const gold=new THREE.MeshStandardMaterial({color:'#D4AF37',roughness:.3,metalness:.7});
  box(0.11,0.03,0.11,'#3A2E20',SX+0.8,H+0.05,SZ);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.02,0.07,10),gold); stem.position.set(SX+0.8,H+0.1,SZ); scene.add(stem);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.028,0.09,12),gold.clone()); cup.position.set(SX+0.8,H+0.18,SZ); scene.add(cup);
  rebuildBooks();
}
const BOOK_COLORS=['#B34038','#1F618D','#117A65','#B7950B','#6C3483','#A04000','#2E4053','#C2662D','#5D6D7E','#7D3C98','#148F77'];
const STARTER_BOOKS=['#7B241C','#1A5276','#145A32','#7D6608','#4A235A','#6E2C00','#212F3D']; // doimiy "darsliklar"
function rebuildBooks(){
  if(!inited) return;
  if(bookGroup){
    scene.remove(bookGroup);
    const dm=m=>{ if(!m) return; (Array.isArray(m)?m:[m]).forEach(mm=>{ if(mm.map) mm.map.dispose(); mm.dispose(); }); };
    bookGroup.traverse(o=>{ if(o.geometry) o.geometry.dispose(); dm(o.material); });
  }
  bookGroup=new THREE.Group();
  const SX=SHELF.x, SZ=ROOM_D-SHELF.d/2-0.02;
  const rowYs=[0.115,0.71,1.33];
  const nb=(window.__wdNotebook||[]);
  let vaultCount=0;
  try{ vaultCount=Object.values(sentenceVault||{}).reduce((a,arr)=>a+(arr?arr.length:0),0); }catch(e){}
  const items=[];
  STARTER_BOOKS.forEach(c=>items.push({c}));                       // doimiy darsliklar
  nb.forEach((p,i)=>items.push({c:['#1B2E7A','#1F3C8C','#27447F'][i%3]}));
  for(let i=0;i<Math.min(vaultCount,30);i++) items.push({c:BOOK_COLORS[i%BOOK_COLORS.length]});
  const maxPer=15;
  items.slice(0,maxPer*3).forEach((it,i)=>{
    const row=Math.floor(i/maxPer), col=i%maxPer;
    const bw=0.055+_sr(i)*0.03, bh=0.3+_sr(i+40)*0.1;
    const bx=SX-1.0+col*0.135+bw/2;
    const m=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,0.24),
      new THREE.MeshStandardMaterial({color:it.c,roughness:.65}));
    m.position.set(bx,rowYs[row]+bh/2,SZ-0.015);
    const lastInRow=(i===items.length-1)||(col===maxPer-1);
    if(lastInRow && _sr(i+5)>0.4){ m.rotation.z=-0.18; m.position.y-=0.01; }
    bookGroup.add(m);
    // Ba'zi kitoblarda oltin hoshiya
    if(_sr(i+77)>0.55){
      const band=new THREE.Mesh(new THREE.BoxGeometry(bw+0.004,0.022,0.242),
        new THREE.MeshStandardMaterial({color:'#C8A445',roughness:.4,metalness:.4}));
      band.position.set(bx,rowYs[row]+bh-0.05,SZ-0.015);
      band.rotation.z=m.rotation.z; bookGroup.add(band);
    }
  });
  // O'rta tokchada: yotiq kitoblar taxlami
  ['#8C4A3E','#2E5D8C','#8C7A2E'].forEach((c,i)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.045,0.2),
      new THREE.MeshStandardMaterial({color:c,roughness:.65}));
    m.position.set(SX+0.82,0.71+0.0225+i*0.047,SZ-0.02);
    m.rotation.y=(_sr(i+9)-0.5)*0.25;
    bookGroup.add(m);
  });
  // Yuqori tokchada: muqovasi bilan qo'yilgan "ENGLISH GRAMMAR"
  const cover=new THREE.Mesh(new THREE.BoxGeometry(0.17,0.23,0.028),
    [new THREE.MeshStandardMaterial({color:'#16294F'}),new THREE.MeshStandardMaterial({color:'#16294F'}),
     new THREE.MeshStandardMaterial({color:'#16294F'}),new THREE.MeshStandardMaterial({color:'#16294F'}),
     new THREE.MeshStandardMaterial({map:mkGrammarCoverTex(),roughness:.55}),new THREE.MeshStandardMaterial({color:'#F4EFE6'})]);
  cover.position.set(SX+0.82,1.33+0.118,SZ-0.02);
  cover.rotation.x=-0.09;
  bookGroup.add(cover);
  scene.add(bookGroup);
}
function buildSofaZone(){
  const cx=SOFA.x, cz=SOFA.z, L=2.15;
  const dark='#23262D', cush='#2E3340', amber='#F2B33D';
  // Asos va o'rindiq yostiqlari
  box(0.95,0.3,L,dark,cx,0.27,cz,0,.6);
  box(0.85,0.14,L*0.31,cush,cx+0.03,0.49,cz-L*0.315,0,.7);
  box(0.85,0.14,L*0.31,cush,cx+0.03,0.49,cz,0,.7);
  box(0.85,0.14,L*0.31,cush,cx+0.03,0.49,cz+L*0.315,0,.7);
  // Baland suyanchiq ("bo'yi balandroq")
  box(0.22,1.0,L,dark,cx-0.4,0.92,cz,0,.6);
  box(0.16,0.5,L*0.31,cush,cx-0.3,0.85,cz-L*0.315,0,.7);
  box(0.16,0.5,L*0.31,cush,cx-0.3,0.85,cz,0,.7);
  box(0.16,0.5,L*0.31,cush,cx-0.3,0.85,cz+L*0.315,0,.7);
  // Qo'ltiqlar
  box(0.9,0.36,0.18,dark,cx,0.6,cz-L/2-0.02,0,.6);
  box(0.9,0.36,0.18,dark,cx,0.6,cz+L/2+0.02,0,.6);
  // Ingichka metall oyoqlar
  [[-0.36,-L/2+0.12],[0.36,-L/2+0.12],[-0.36,L/2-0.12],[0.36,L/2-0.12]].forEach(([ox,oz])=>
    box(0.045,0.13,0.045,'#8A9099',cx+ox,0.065,cz+oz,0,.35,.7));
  // Do'mboq yumaloq yostiqchalar — suyanchiqqa yastanib turadi
  const mkPillow=(px,py,pz,col,r,rz)=>{
    const p=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),
      new THREE.MeshStandardMaterial({color:col,roughness:.85}));
    p.scale.set(1,0.92,0.48);           // sharni yostiq shakliga "bosamiz"
    p.rotation.y=Math.PI/2;             // yassiligi suyanchiq tomonga
    p.rotation.z=rz; p.rotation.x=0.22; // biroz yastangan
    p.position.set(px,py,pz);
    scene.add(p); return p;
  };
  mkPillow(cx-0.2,0.74,cz-0.55,amber,0.22,0.12);
  mkPillow(cx-0.2,0.74,cz+0.35,amber,0.22,-0.1);
  mkPillow(cx-0.17,0.7,cz-0.12,'#F3EBDD',0.18,0.05); // kichik krem yostiq
  addCollider(cx+0.05,cz,0.62,L/2+0.15);
  // Stolcha — divan oldida
  const tx=cx+1.05;
  box(0.8,0.05,0.55,'#3E3229',tx,0.42,cz,0,.4);
  box(0.72,0.04,0.06,'#17191D',tx,0.2,cz-0.2,0,.4,.5);
  box(0.72,0.04,0.06,'#17191D',tx,0.2,cz+0.2,0,.4,.5);
  [[-0.33,-0.2],[0.33,-0.2],[-0.33,0.2],[0.33,0.2]].forEach(([ox,oz])=>
    box(0.04,0.4,0.04,'#17191D',tx+ox,0.2,cz+oz,0,.4,.5));
  addCollider(tx,cz,0.48,0.36);
  // Kitoblar dastasi — stol ustida (popkorn o'rniga: sinfxonaga mos, sifatliroq)
  (function(){
    const bx=tx-0.18, bz=cz-0.1, y0=0.505;
    // Uchta kitob ustma-ust, har biri biroz burilgan
    const spines=[
      {w:0.20,d:0.145,h:0.035,c:'#2F5E8C',y:0,rot:0.06},   // to'q ko'k
      {w:0.19,d:0.135,h:0.030,c:'#9C3B34',y:0.035,rot:-0.09}, // g'ishtrang
      {w:0.175,d:0.125,h:0.026,c:'#4A6E4F',y:0.065,rot:0.14}, // to'q yashil
    ];
    spines.forEach(s=>{
      const g=new THREE.Group(); g.position.set(bx,y0+s.y+s.h/2,bz); g.rotation.y=s.rot;
      // Muqova (rangli quti)
      const cov=new THREE.Mesh(new THREE.BoxGeometry(s.w,s.h,s.d),
        new THREE.MeshStandardMaterial({color:s.c,roughness:.62,metalness:.04}));
      g.add(cov);
      // Sahifalar — muqovadan sal kichik, oq/krem (uch tomondan ko'rinadi)
      const pg=new THREE.Mesh(new THREE.BoxGeometry(s.w*0.955,s.h*0.72,s.d*0.94),
        new THREE.MeshStandardMaterial({color:'#F3EDE1',roughness:.95}));
      pg.position.x=0.004; g.add(pg);
      // Umurtqa bezagi — oltin chiziq
      const gold=new THREE.Mesh(new THREE.BoxGeometry(0.004,s.h*0.5,s.d*0.72),
        new THREE.MeshStandardMaterial({color:'#D8B45C',roughness:.35,metalness:.55}));
      gold.position.set(-s.w/2+0.006,0,0); g.add(gold);
      scene.add(g);
    });
    // Eng ustidagi ochiq daftar (yozuv chizig'i bilan)
    const nb=new THREE.Group(); nb.position.set(bx+0.015,y0+0.095,bz+0.01); nb.rotation.y=-0.22;
    const pad=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.008,0.105),
      new THREE.MeshStandardMaterial({color:'#FAF6EC',roughness:.95}));
    nb.add(pad);
    for(let i=0;i<3;i++){
      const ln=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.0012,0.0016),
        new THREE.MeshStandardMaterial({color:'#9BA6B8',roughness:1}));
      ln.position.set(0,0.0046,-0.022+i*0.022); nb.add(ln);
    }
    // Qalam — daftar yonida
    const pen=new THREE.Mesh(new THREE.CylinderGeometry(0.0035,0.0035,0.09,8),
      new THREE.MeshStandardMaterial({color:'#E8A33D',roughness:.5}));
    pen.rotation.set(0,0.5,Math.PI/2); pen.position.set(0.02,0.008,0.042); nb.add(pen);
    scene.add(nb);
  })();
  // Kofe — likopcha + oq finjon + qahva + dastak
  cyl(0.062,0.014,'#FBFBFD',tx+0.16,0.452,cz+0.08);
  cyl(0.043,0.075,'#FBFBFD',tx+0.16,0.497,cz+0.08);
  cyl(0.037,0.006,'#5A3A22',tx+0.16,0.536,cz+0.08);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(0.024,0.008,10,18),
    new THREE.MeshStandardMaterial({color:'#FBFBFD',roughness:.5}));
  handle.position.set(tx+0.213,0.5,cz+0.08); scene.add(handle);
}
function buildBoardAndAC(){
  // Doska — old devor markazida, o'quvchilarning to'g'risida
  box(3.9,2.0,0.06,'#8B929C',0,1.95,0.06,0,.5,.3); // ramka
  boardMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.7,1.8),
    new THREE.MeshStandardMaterial({map:mkBoardTex(),roughness:.35}));
  boardMesh.position.set(0,1.95,0.095); scene.add(boardMesh);
  // Marker tokchasi
  box(3.0,0.05,0.14,'#B9C0C9',0,0.9,0.14,0,.5,.4);
  cyl(0.02,0.13,'#1B4FCB',-0.6,0.945,0.15,Math.PI/2); // tokchada ko'k marker
  // Konditsioner — doska tepasida
  const ac=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.34,0.28),
    new THREE.MeshStandardMaterial({map:mkACTex(),roughness:.4}));
  ac.position.set(0,3.28,0.16); scene.add(ac);
}
function loadTeacherModel(){
  if(!TEACHER_GLB_URL) return;
  const loader=new GLTFLoader();
  // Sketchfab .glb'lari ko'pincha Draco bilan siqilgan bo'ladi — dekoder shart
  const draco=new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(draco);
  let lastPct=-20;
  const attempt=(url,isRetry)=>{
  loader.load(url, g=>{
    try{
      const m=g.scene;
      // Balandlikni odam bo'yiga (~1.72m) avtomatik moslaymiz
      const bb=new THREE.Box3().setFromObject(m);
      const h=(bb.max.y-bb.min.y)||1;
      m.scale.setScalar(1.72/h);
      bb.setFromObject(m);
      m.position.set(-1.75, -bb.min.y, 2.1); // stol yonida, doskaning chap chekkasida
      m.rotation.y=0; // model orqasi bilan tursa: Math.PI qiling
      scene.add(m);
      addCollider(-1.75,2.1,0.4,0.4);
      if(g.animations && g.animations.length){
        teacherMixer=new THREE.AnimationMixer(m);
        teacherMixer.clipAction(g.animations[0]).play(); // birinchi klip (idle)
      }
      showToast("O'qituvchi modeli yuklandi",IC.check);
    }catch(err){
      showToast('Model joylashda xato: '+String(err&&err.message||err).slice(0,80),IC.info);
    }
  }, ev=>{
    // Yuklanish jarayoni — katta fayllarda foydali
    if(ev && ev.total>0){
      const pct=Math.round(ev.loaded/ev.total*100);
      if(pct-lastPct>=25 && pct<100){ lastPct=pct; showToast('Model yuklanmoqda... '+pct+'%',IC.info); }
    }
  }, e=>{
    // Token muddati tugagan/ruxsat yo'q bo'lsa — public manzildan qayta urinamiz
    if(!isRetry && TEACHER_GLB_URL_PUBLIC && url!==TEACHER_GLB_URL_PUBLIC){
      attempt(TEACHER_GLB_URL_PUBLIC,true);
      return;
    }
    // Xato — ekranda ko'rsatamiz (mobil brauzerda konsol yo'qligi uchun)
    const msg=String(e&&(e.message||e.statusText||e.type)||e).slice(0,90);
    showToast('Model yuklanmadi: '+msg,IC.info);
    console.warn("O'qituvchi modeli yuklanmadi:",e);
  });
  };
  attempt(TEACHER_GLB_URL,false);
}
function loadCatModel(){
  if(!CAT_GLB_URL) return;
  const loader=new GLTFLoader();
  const draco=new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(draco);
  loader.load(CAT_GLB_URL, g=>{
    try{
      const m=g.scene;
      // Mushuk o'lchamiga moslash: eng katta tomoni ~0.6 m
      const bb=new THREE.Box3().setFromObject(m);
      const size=new THREE.Vector3(); bb.getSize(size);
      const maxDim=Math.max(size.x,size.y,size.z)||1;
      m.scale.setScalar(0.6/maxDim);
      bb.setFromObject(m);
      // Divan o'rindig'i ustiga, chekkaga — o'tirgan odamga xalaqit bermaydi
      const seatY=0.565;
      m.position.set(SOFA.x+0.17, seatY-bb.min.y, SOFA.z+0.7); // yostiqdan nariroq, o'rindiq oldida
      m.rotation.y=Math.PI/2+0.55; // egasiga qiyalab qaraydi; noto'g'ri bo'lsa shu sonni o'zgartiramiz
      scene.add(m);
      if(g.animations && g.animations.length){
        catMixer=new THREE.AnimationMixer(m);
        catMixer.clipAction(g.animations[0]).play();
      }
      showToast('Mushuk divanga joylashdi',IC.check);
    }catch(err){
      showToast('Mushukni joylashda xato: '+String(err&&err.message||err).slice(0,70),IC.info);
    }
  }, undefined, e=>{
    const msg=String(e&&(e.message||e.statusText||e.type)||e).slice(0,90);
    showToast('Mushuk yuklanmadi: '+msg,IC.info);
    console.warn('Mushuk modeli yuklanmadi:',e);
  });
}
function loadKnightModel(){
  if(!KNIGHT_GLB_URL) return;
  const loader=new GLTFLoader();
  const draco=new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(draco);
  const KNIGHT_TUNE=1; // hali ham noto'g'ri bo'lsa: 0.5 — ikki barobar kichik, 2 — katta
  loader.load(KNIGHT_GLB_URL, g=>{
    try{
      const m=g.scene;
      // 1-bosqich: balandlikni 1.8m ga moslash
      let bb=new THREE.Box3().setFromObject(m);
      let h=(bb.max.y-bb.min.y)||1;
      m.scale.setScalar((1.8/h)*KNIGHT_TUNE);
      m.updateMatrixWorld(true);
      // 2-bosqich: pivot qayerda bo'lishidan qat'i nazar, MARKAZIDAN joylashtiramiz
      bb=new THREE.Box3().setFromObject(m);
      const ctr=new THREE.Vector3(); bb.getCenter(ctr);
      m.position.x+=1.9-ctr.x;      // deraza yonidagi nuqta
      m.position.z+=11.05-ctr.z;
      m.position.y+=-bb.min.y;      // oyoqlari polda
      m.rotation.y=Math.PI; // derazaga qarab turadi; teskari chiqsa 0 qilamiz
      scene.add(m);
      addCollider(1.9,11.05,0.4,0.4);
      const sz=new THREE.Vector3(); bb.getSize(sz);
      showToast('Ritsar: '+sz.y.toFixed(2)+' m',IC.info); // o'lcham nazorati uchun
      if(g.animations && g.animations.length){
        knightMixer=new THREE.AnimationMixer(m);
        knightMixer.clipAction(g.animations[0]).play();
      }
    }catch(err){}
  }, undefined, e=>console.warn('Ritsar yuklanmadi',e));
}
function initWall(){
  renderer=new THREE.WebGLRenderer({canvas:CV,antialias:true});
  /* WebGL KONTEKST HIMOYASI (v90): brauzer xotira siqilganda yoki ilova uzoq
     ochiq turganda WebGL kontekstini majburan yopadi -> sahna oq/qora bo'lib
     qolardi va faqat ilovadan chiqib kirgach tiklanardi. Endi hodisa ushlanadi:
     foydalanuvchi xabardor qilinadi va kontekst qaytganda sahna qayta chiziladi. */
  try{
    CV.addEventListener('webglcontextlost',ev=>{
      ev.preventDefault();
      try{ if(typeof showToast==='function') showToast('Grafika vaqtincha to\u2019xtadi \u2014 tiklanmoqda\u2026',IC&&IC.info); }catch(e){}
    },false);
    CV.addEventListener('webglcontextrestored',()=>{
      /* sahna keyingi kadrda o'zi chiziladi */
      try{ if(typeof showToast==='function') showToast('Grafika tiklandi',IC&&IC.info); }catch(e){}
    },false);
  }catch(e){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  // CSS3D — televizordagi haqiqiy YouTube pleer uchun alohida qatlam
  cssScene=new THREE.Scene();
  cssRenderer=new CSS3DRenderer();
  cssRenderer.domElement.style.position='absolute';
  cssRenderer.domElement.style.inset='0';
  cssRenderer.domElement.style.pointerEvents='none';
  document.getElementById('wall-css3d').appendChild(cssRenderer.domElement);
  scene=new THREE.Scene();
  scene.background=new THREE.Color('#26090D');
  scene.fog=new THREE.Fog('#26090D',12,22);
  camera=new THREE.PerspectiveCamera(64,1,0.05,60);
  camera.rotation.order='YXZ';

  lightHemi=new THREE.HemisphereLight(0xFFF6EC,0x3A1A1E,0.95); scene.add(lightHemi);
  lightDir=new THREE.DirectionalLight(0xFFFFFF,0.75); lightDir.position.set(4,7,7); scene.add(lightDir);
  lightP1=new THREE.PointLight(0xFFE2B8,20,15); lightP1.position.set(0,3.2,2.5); scene.add(lightP1);
  lightP2=new THREE.PointLight(0xFFE2B8,18,15); lightP2.position.set(0,3.2,8.5); scene.add(lightP2);

  // Devorlar — zamonaviy to'q qizil (crimson), toza gradient
  const frontMat=new THREE.MeshStandardMaterial({map:mkWallGradTex('#C43844','#7E1E28',true),roughness:.85});
  const sideMat =new THREE.MeshStandardMaterial({map:mkWallGradTex('#A82C36','#661820',false),roughness:.9});
  const front=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W,ROOM_H),frontMat);
  front.position.set(0,ROOM_H/2,0); scene.add(front);
  // Orqa devor — deraza o'rni devordan KESIB olingan (teshikli geometriya)
  const wShape=new THREE.Shape();
  wShape.moveTo(-ROOM_W/2,0); wShape.lineTo(ROOM_W/2,0);
  wShape.lineTo(ROOM_W/2,ROOM_H); wShape.lineTo(-ROOM_W/2,ROOM_H); wShape.closePath();
  const wHole=new THREE.Path();
  wHole.moveTo(-1.5,1.35); wHole.lineTo(1.5,1.35);
  wHole.lineTo(1.5,2.75); wHole.lineTo(-1.5,2.75); wHole.closePath();
  wShape.holes.push(wHole);
  const wGeo=new THREE.ShapeGeometry(wShape);
  { const uv=wGeo.attributes.uv, ps=wGeo.attributes.position;
    for(let i=0;i<uv.count;i++) uv.setXY(i,(ps.getX(i)+ROOM_W/2)/ROOM_W, ps.getY(i)/ROOM_H); }
  const backW=new THREE.Mesh(wGeo,sideMat.clone());
  backW.rotation.y=Math.PI; backW.position.set(0,0,ROOM_D); scene.add(backW);
  const left=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D,ROOM_H),sideMat.clone());
  left.rotation.y=Math.PI/2; left.position.set(-ROOM_W/2,ROOM_H/2,ROOM_D/2); scene.add(left);
  const right=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D,ROOM_H),sideMat.clone());
  right.rotation.y=-Math.PI/2; right.position.set(ROOM_W/2,ROOM_H/2,ROOM_D/2); scene.add(right);
  // Pol va shift
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W,ROOM_D),
    new THREE.MeshStandardMaterial({map:mkFloorTex2(),roughness:.65}));
  floor.rotation.x=-Math.PI/2; floor.position.set(0,0,ROOM_D/2); scene.add(floor);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W,ROOM_D),
    new THREE.MeshStandardMaterial({color:'#F4ECE7',roughness:.95}));
  ceil.rotation.x=Math.PI/2; ceil.position.set(0,ROOM_H,ROOM_D/2); scene.add(ceil);
  // Shift chiroqlari
  for(let i=0;i<3;i++){
    const stripMat=new THREE.MeshBasicMaterial({color:'#FFF7E8'});
    stripMats.push(stripMat);
    const strip=new THREE.Mesh(new THREE.PlaneGeometry(0.35,8),stripMat);
    strip.rotation.x=Math.PI/2; strip.position.set(-3.6+i*3.6,ROOM_H-0.02,6); scene.add(strip);
  }
  // Oq plintus — to'rt devor bo'ylab
  box(ROOM_W,0.14,0.05,'#F5EFEA',0,0.07,0.03);
  box(ROOM_W,0.14,0.05,'#F5EFEA',0,0.07,ROOM_D-0.03);
  box(0.05,0.14,ROOM_D,'#F5EFEA',-ROOM_W/2+0.03,0.07,ROOM_D/2);
  box(0.05,0.14,ROOM_D,'#F5EFEA',ROOM_W/2-0.03,0.07,ROOM_D/2);

  // Sinfxona jihozlari
  buildBoardAndAC();
  buildTeacherZone();
  buildTV();
  buildSofaZone();
  buildDeskItems();
  buildWindowAndShelf();
  loadTeacherModel();
  loadCatModel();
  loadKnightModel();
  const cols=[-4.0,-1.5,1.5,4.0], rows=[6.0,7.8,9.6];
  cols.forEach(cx=>rows.forEach(cz=>buildStudentDesk(cx,cz))); // 12 ta parta

  // Devor slotlari — bloklar shu tartibda to'ladi
  buildSlots();
  clock=new THREE.Clock();
  inited=true;
}

/* ================= SLOTLAR — 4 devor ================= */
const CARD_W=0.85, CARD_H=0.46, SGAP=0.17;
function buildSlots(){
  SLOTS=[];
  const ys=[2.82,2.18,1.54];
  const step=CARD_W+SGAP;
  // 1) Old devor — doska yon panellari (chapdan boshlab)
  ys.forEach(y=>{ for(let X=-5.05;X<=-2.65;X+=step) SLOTS.push({x:X,y,z:0.045,ry:0}); });
  ys.forEach(y=>{ for(let X=2.65;X<=5.05;X+=step) SLOTS.push({x:X,y,z:0.045,ry:0}); });
  // 2) Chap devor
  ys.forEach(y=>{ for(let Z=1.3;Z<=10.9;Z+=step) SLOTS.push({x:-ROOM_W/2+0.045,y,z:Z,ry:Math.PI/2}); });
  // 3) O'ng devor (televizor turgan joy bo'sh qoldiriladi)
  ys.forEach(y=>{ for(let Z=1.3;Z<=10.9;Z+=step){
    if(y>2.0 && Z>1.25 && Z<3.35) continue; // TV zonasi
    SLOTS.push({x:ROOM_W/2-0.045,y,z:Z,ry:-Math.PI/2});
  }});
  // 4) Orqa devor (deraza markazda, javon chapda — o'sha zonalar bo'sh)
  ys.forEach(y=>{ for(let X=-5.05;X<=5.05;X+=step){
    if(Math.abs(X)<2.3) continue;                     // deraza + pardalar zonasi
    if(X<-2.6 && y<2.4) continue;                     // kitob javoni zonasi
    SLOTS.push({x:X,y,z:ROOM_D-0.045,ry:Math.PI});
  }});
}
window.__wdWallCapacity=()=>SLOTS.length||120;

/* ================= BLOKLAR ================= */
let glowTexShared=null;
function clearBlocks(){
  blocks.forEach(b=>{
    if(b.revertTO) clearTimeout(b.revertTO);
    scene.remove(b.grp);
    b.card.geometry.dispose(); b.card.material.map=null; b.card.material.dispose();
    b.enTex.dispose(); b.uzTex.dispose();
    b.glow.geometry.dispose(); b.glow.material.dispose();
  });
  blocks=[];
}
function rebuildWall(spawnLast){
  if(!inited) return;
  clearBlocks();
  if(!glowTexShared) glowTexShared=mkGlowTex();
  const words=window.__wdWallWords||[];
  words.slice(0,SLOTS.length).forEach((w,i)=>{
    const s=SLOTS[i];
    const grp=new THREE.Group();
    grp.position.set(s.x,s.y,s.z); grp.rotation.y=s.ry;
    const enTex=mkCardTex(w.en,'en',i), uzTex=mkCardTex(w.uz,'uz',i);
    const card=new THREE.Mesh(new THREE.PlaneGeometry(CARD_W,CARD_H),
      new THREE.MeshBasicMaterial({map:enTex,transparent:true}));
    card.position.z=0.012; card.userData.wi=i;
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(CARD_W*1.55,CARD_H*1.7),
      new THREE.MeshBasicMaterial({map:glowTexShared,transparent:true,opacity:0,depthWrite:false}));
    glow.position.z=0.004;
    grp.add(glow); grp.add(card); scene.add(grp);
    const b={grp,card,glow,data:w,enTex,uzTex,mode:'en',flipping:false,revertTO:null,spawn:1};
    if(spawnLast && i===words.length-1){ b.spawn=0.0001; card.scale.set(0.0001,0.0001,1); }
    blocks.push(b);
  });
}
function flipBlock(b, mode, revertMs){
  if(b.revertTO){ clearTimeout(b.revertTO); b.revertTO=null; }
  if(mode==='uz' && revertMs) b.revertTO=setTimeout(()=>flipBlock(b,'en'),revertMs);
  if(b.flipping || b.mode===mode) return;
  b.flipping=true;
  const m=b.card, dur=190, t0=performance.now();
  (function h1(){
    const t=(performance.now()-t0)/dur;
    m.scale.x=Math.max(0.0001,1-t);
    if(t<1) requestAnimationFrame(h1);
    else{
      m.material.map=(mode==='uz'?b.uzTex:b.enTex);
      m.material.needsUpdate=true;
      const t1=performance.now();
      (function h2(){
        const t2=(performance.now()-t1)/dur;
        m.scale.x=Math.min(1,t2);
        if(t2<1) requestAnimationFrame(h2);
        else{ m.scale.x=1; b.flipping=false; b.mode=mode; }
      })();
    }
  })();
}

/* ================= SHEET ================= */
const SHEET=document.getElementById('wall-sheet');
const SHEETIN=document.getElementById('wall-sheet-inner');
function openWallSheet(html){ SHEETIN.innerHTML='<div class="sh-handle"></div>'+html; SHEET.classList.add('show'); return SHEETIN; }
function closeWallSheet(){ SHEET.classList.remove('show'); }
SHEET.querySelector('.modal-backdrop').addEventListener('click',()=>{ closeWallSheet(); endQuiz(); });

/* ================= SO'Z QO'SHISH ================= */
function normUz(s){
  return String(s).toLowerCase()
    .replace(/[\u2018\u2019\u02BB\u02BC`']/g,"'")
    .replace(/[.,!?;:()"]/g,' ')
    .replace(/\s+/g,' ').trim();
}
function openAddSheet(){
  endQuiz();
  const used=(window.__wdWallWords||[]).length;
  if(used>=SLOTS.length){ showToast("Barcha 4 devor to'ldi — ajoyib natija!",IC.trophy); return; }
  const el=openWallSheet(`
    <div class="rules-icon" style="background:#FFF3D0"><svg viewBox="0 0 24 24" class="ic" style="stroke:#B8860B"><path d="M12 5 V19 M5 12 H19"/></svg></div>
    <h2 style="text-align:center">Devorga so'z qo'shish</h2>
    <p class="desc" style="text-align:center">Yodingizda qolmayotgan inglizcha so'zni kiriting. Devorlarda ${SLOTS.length-used} ta bo'sh joy qoldi.</p>
    <input class="wl-input" id="wlAddEn" placeholder="Inglizcha so'z, masalan: resilient" autocomplete="off" autocapitalize="off">
    <input class="wl-input" id="wlAddUz" placeholder="O'zbekcha tarjimasi (ixtiyoriy)" autocomplete="off" style="margin-top:10px">
    <p class="desc" style="font-size:12px;margin-top:8px">Tarjimani bo'sh qoldirsangiz — AI o'zi o'zbekchaga tarjima qiladi.</p>
    <div class="wl-fb" id="wlAddFb"></div>
    <button class="btn btn-primary btn-block" id="wlAddGo" style="margin-top:14px">Devorga yopishtirish</button>`);
  const fb=el.querySelector('#wlAddFb'), go=el.querySelector('#wlAddGo');
  const showFb=(cls,msg)=>{ fb.className='wl-fb show '+cls; fb.innerHTML=msg; };
  go.addEventListener('click',async ()=>{
    const en=el.querySelector('#wlAddEn').value.trim();
    let uz=el.querySelector('#wlAddUz').value.trim();
    if(!/^[A-Za-z][A-Za-z\s'\-]{1,40}$/.test(en)){ showFb('bad','Inglizcha so\'zni to\'g\'ri kiriting'); return; }
    const dup=(window.__wdWallWords||[]).some(w=>w.en.toLowerCase()===en.toLowerCase());
    if(dup){ showFb('bad','Bu so\'z devorda allaqachon bor'); return; }
    if(!uz){
      go.disabled=true; go.innerHTML='<span class="ai-spin"></span> AI tarjima qilmoqda...';
      uz=await translateWordAI(en);
      go.disabled=false; go.innerHTML='Devorga yopishtirish';
      if(!uz){ showFb('bad','AI hozir tarjima qila olmadi — tarjimani o\'zingiz kiriting'); return; }
    }
    window.__wdWallWords.push({en:en, uz:uz, ts:Date.now()});
    try{ if(window.__wdSrsAdd) window.__wdSrsAdd(en,uz); }catch(e){}
    saveState();
    rebuildWall(true);
    closeWallSheet();
    showToast(`"${en}" devorga yopishtirildi`,IC.check);
  });
}
ADDBTN.addEventListener('click',openAddSheet);

/* ================= DOSKA MAVZUSINI O'ZGARTIRISH ================= */
function openBoardSheet(){
  endQuiz();
  const cur=(window.__wdWallBoard||BOARD_DEFAULT).title;
  const el=openWallSheet(`
    <div class="rules-icon" style="background:#E8F0FF"><svg viewBox="0 0 24 24" class="ic" style="stroke:#1B4FCB"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21 L12 17 L16 21"/><path d="M7 9 H17 M7 12.5 H14"/></svg></div>
    <h2 style="text-align:center">Doska mavzusi</h2>
    <p class="desc" style="text-align:center">Hozirgi mavzu: <b>${escapeHtml(cur)}</b>. Yangi grammatik mavzuni kiriting — AI uni tekshirib, qoidalarini o'zbekcha izohlar bilan doskaga marker uslubida yozib beradi.</p>
    <input class="wl-input" id="wlBoardIn" placeholder="Masalan: First Conditional" autocomplete="off">
    <div class="wl-fb" id="wlBoardFb"></div>
    <button class="btn btn-primary btn-block" id="wlBoardGo" style="margin-top:14px">AI doskaga yozsin</button>`);
  const fb=el.querySelector('#wlBoardFb'), go=el.querySelector('#wlBoardGo');
  const showFb=(cls,msg)=>{ fb.className='wl-fb show '+cls; fb.innerHTML=msg; };
  go.addEventListener('click',async ()=>{
    const topic=el.querySelector('#wlBoardIn').value.trim();
    if(!/^[A-Za-z][A-Za-z0-9\s'\-\/]{2,50}$/.test(topic)){ showFb('bad','Mavzu nomini inglizcha kiriting, masalan: First Conditional'); return; }
    go.disabled=true; go.innerHTML='<span class="ai-spin"></span> AI qoidalarni tayyorlamoqda...';
    const data=await boardTopicAI(topic);
    go.disabled=false; go.innerHTML='AI doskaga yozsin';
    if(!data){ showFb('bad','AI mavzuni tayyorlab bera olmadi. Mavzu nomini tekshiring yoki keyinroq urinib ko\'ring.'); return; }
    // Qoidalarni tozalab olamiz
    data.rules=data.rules.filter(r=>r && typeof r.rule==='string').slice(0,4)
      .map(r=>({sign:String(r.sign||'*').slice(0,1), rule:String(r.rule).slice(0,110), example:String(r.example||'').slice(0,110), note:String(r.note||'').slice(0,110)}));
    if(!data.rules.length){ showFb('bad','AI javobi bo\'sh keldi — qayta urinib ko\'ring.'); return; }
    window.__wdWallBoard={title:String(data.title).slice(0,48), rules:data.rules, ts:Date.now()};
    saveState();
    closeWallSheet();
    animateBoardWrite(window.__wdWallBoard); // marker bilan yozayotgandek chiziladi
    showToast('Doska yangi mavzu bilan yozildi',IC.check);
  });
}

/* ================= VIKTORINA ================= */
function hideMean(){ MEAN.classList.remove('show'); }
function endQuiz(){ quizBlock=null; hideMean(); }
/* Ma'nolarni keshlaymiz — bir so'z uchun AI faqat bir marta chaqiriladi */
const meaningCache=new Map();
async function ensureMeaning(b){
  const key=b.data.en.toLowerCase();
  if(meaningCache.has(key)) return meaningCache.get(key);
  meaningCache.set(key,null); // yuklanmoqda belgisi
  const m=await meaningWordAI(b.data.en);
  meaningCache.set(key, m || false);
  return m || false;
}
function meaningText(v){
  if(v===null || v===undefined) return "AI o'ylayapti...";
  if(v===false) return "Ma'noni yuklab bo'lmadi — baribir tarjimani eslashga urinib ko'ring.";
  return v;
}
async function startQuiz(b){
  if(!b || b.flipping || b.mode!=='en') return;
  quizBlock=b;
  hideMean(); // oyna ochilganda xira qolmasligi uchun — izoh oynaning o'zida
  let attempts=0;
  const el=openWallSheet(`
    <div class="wl-sheet-word">${escapeHtml(b.data.en)}<small>Bu so'zning tarjimasini eslang</small></div>
    <div class="wl-mean-in"><div class="wm-lbl"><svg viewBox="0 0 24 24" class="ic"><path d="M12 3 C8 3 5 6 5 9.5 C5 12 6.5 13.5 8 15 L8 17 H16 L16 15 C17.5 13.5 19 12 19 9.5 C19 6 16 3 12 3 Z"/><path d="M9.5 20.5 H14.5"/></svg> AI ma'nosi</div><p id="wlQMean">${escapeHtml(meaningText(meaningCache.get(b.data.en.toLowerCase())))}</p></div>
    <input class="wl-input" id="wlQIn" placeholder="O'zbekcha tarjimasi..." autocomplete="off">
    <div class="wl-fb" id="wlQFb"></div>
    <div class="wg-btns">
      <button class="btn btn-ghost" id="wlQGive">Eslay olmadim</button>
      <button class="btn btn-primary" id="wlQChk">Tekshirish</button>
    </div>`);
  const fb=el.querySelector('#wlQFb');
  const showFb=(cls,msg)=>{ fb.className='wl-fb show '+cls; fb.innerHTML=msg; };
  const reveal=(msg)=>{
    showFb('bad',msg+` To'g'ri javob: <b>${escapeHtml(b.data.uz)}</b>`);
    flipBlock(b,'uz',30000); // 30 soniya ko'rsatib, keyin o'girilib oladi
    setTimeout(()=>{ closeWallSheet(); endQuiz(); },2200);
  };
  el.querySelector('#wlQChk').addEventListener('click',()=>{
    const ans=normUz(el.querySelector('#wlQIn').value);
    if(!ans){ showFb('bad','Avval javob yozing'); return; }
    const truth=normUz(b.data.uz);
    const parts=truth.split(/[,;\/]/).map(s=>s.trim()).filter(Boolean);
    const ok = ans===truth || parts.includes(ans) ||
      (ans.length>=3 && (truth.includes(ans)||ans.includes(truth))) ||
      parts.some(p=>p.length>=3 && (p.includes(ans)||ans.includes(p)));
    if(ok){
      showFb('ok',`To'g'ri! <b>${escapeHtml(b.data.uz)}</b> · +6 XP`);
      addXP(6);
      try{ if(window.__wdDailyProgress) window.__wdDailyProgress('wall'); }catch(e){}  // kunlik: devordagi so'z eslandi
      flipBlock(b,'uz',6000);
      setTimeout(()=>{ closeWallSheet(); endQuiz(); },1400);
    } else {
      attempts++;
      if(attempts<2) showFb('bad','Noto\'g\'ri — yana bir bor urinib ko\'ring');
      else reveal('Bo\'lmadi.');
    }
  });
  el.querySelector('#wlQGive').addEventListener('click',()=>reveal('Hechqisi yo\'q!'));
  const m=await ensureMeaning(b);
  const mp=el.querySelector('#wlQMean');
  if(mp && quizBlock===b) mp.textContent=meaningText(m);
}
let targetKind=null;
const MOVEBOX=document.querySelector('#wall-overlay .wl-move');
function sitDown(kind){
  seated=true; seatKind=kind;
  if(kind==='desk'){
    seatTarget.x=DESK_SEAT.x; seatTarget.z=DESK_SEAT.z;
    camYTarget=1.18;
    yaw=0; pitch=-0.3; // qog'ozga qarab o'tiramiz
    showToast("Qog'ozga tegib, mavzu bering",IC.check);
  } else {
    seatTarget.x=SOFA_SEAT.x; seatTarget.z=SOFA_SEAT.z;
    camYTarget=1.06;
    yaw=-Math.PI/2; pitch=0.03; // to'g'ri televizorga
    showToast('Marhamat, joylashib oling',IC.check);
  }
  if(MOVEBOX) MOVEBOX.style.display='none';
}
function standUp(){
  const sp=(seatKind==='desk')?DESK_STAND:STAND_POS;
  seated=false; seatKind=null; camYTarget=1.5; pitch=0;
  pos.set(sp.x,0,sp.z);
  if(MOVEBOX) MOVEBOX.style.display='flex';
}
const LIGHTS=document.getElementById('wlLights');
function updateLightIcons(){
  LIGHTS.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===lightMode));
}
LIGHTS.querySelectorAll('button').forEach(b=>{
  b.addEventListener('click',()=>{ setLightMode(b.dataset.m); updateLightIcons(); });
});
const WRITEBTN=document.getElementById('wlWrite');
WRITEBTN.addEventListener('click',()=>openWriteSheet());
/* Daftar oynasi: sahifalarni varaqlash, o'qish, yangi sahifa yozish */
function openWriteSheet(forceNew){
  endQuiz();
  const nb=window.__wdNotebook||[];
  if(nb.length && !forceNew){
    const render=()=>{
      const w=nb[nbIndex];
      const el=openWallSheet(`
        <h2 style="text-align:center">Daftar — ${nbIndex+1} / ${nb.length}-sahifa</h2>
        <div class="wl-paper-view"><h3>${escapeHtml(w.title)}</h3><p>${escapeHtml(w.text)}</p></div>
        <div class="wg-btns">
          <button class="btn btn-ghost" id="wlWrPrev" ${nbIndex<=0?'disabled style="opacity:.4"':''}>◀ Oldingi</button>
          <button class="btn btn-ghost" id="wlWrNext" ${nbIndex>=nb.length-1?'disabled style="opacity:.4"':''}>Keyingi ▶</button>
        </div>
        <button class="btn btn-primary btn-block" id="wlWrNew" style="margin-top:10px">Yangi sahifa</button>`);
      el.querySelector('#wlWrPrev').addEventListener('click',()=>{ if(nbIndex>0){ nbIndex--; drawNotebook(currentPage(),1); render(); } });
      el.querySelector('#wlWrNext').addEventListener('click',()=>{ if(nbIndex<nb.length-1){ nbIndex++; drawNotebook(currentPage(),1); render(); } });
      el.querySelector('#wlWrNew').addEventListener('click',()=>openWriteSheet(true));
    };
    render();
    return;
  }
  const el=openWallSheet(`
    <div class="rules-icon" style="background:#E8EDFF"><svg viewBox="0 0 24 24" class="ic" style="stroke:#1B2E7A"><path d="M4 20 L8 19 L19.5 7.5 C20.3 6.7 20.3 5.4 19.5 4.6 C18.7 3.8 17.4 3.8 16.6 4.6 L5 16 Z"/><path d="M14.5 6.5 L17.5 9.5"/></svg></div>
    <h2 style="text-align:center">Yangi sahifa</h2>
    <p class="desc" style="text-align:center">Mavzu bering — AI ustoz to'liq, formal inglizcha matnni daftarning yangi sahifasiga qo'lyozma shaklida yozadi. Oldingi sahifalar saqlanib qoladi.</p>
    <input class="wl-input" id="wlWrIn" placeholder="Masalan: A rainy day in Tashkent" autocomplete="off">
    <div class="wl-fb" id="wlWrFb"></div>
    <button class="btn btn-primary btn-block" id="wlWrGo" style="margin-top:14px">AI yozsin</button>`);
  const fb=el.querySelector('#wlWrFb'), go=el.querySelector('#wlWrGo');
  const showFb=(cls,msg)=>{ fb.className='wl-fb show '+cls; fb.innerHTML=msg; };
  go.addEventListener('click',async ()=>{
    const topic=el.querySelector('#wlWrIn').value.trim();
    if(topic.length<3 || topic.length>80){ showFb('bad','Mavzuni 3-80 belgi oralig\'ida kiriting'); return; }
    go.disabled=true; go.innerHTML='<span class="ai-spin"></span> AI o\'ylab yozmoqda...';
    const data=await writingAI(topic);
    go.disabled=false; go.innerHTML='AI yozsin';
    if(!data){ showFb('bad','AI hozir yoza olmadi — mavzuni tekshiring yoki keyinroq urinib ko\'ring'); return; }
    const page={topic, title:String(data.title).slice(0,60), text:String(data.text).slice(0,2200), ts:Date.now()};
    window.__wdNotebook.push(page);
    nbIndex=window.__wdNotebook.length-1;
    saveState();
    closeWallSheet();
    animatePaperWrite(page); // yangi sahifa jonli yozilib boradi
    rebuildBooks();          // javonga yangi kitob qo'shiladi
    showToast('Ustoz yangi sahifaga yozmoqda',IC.check);
  });
}
CHECKBTN.addEventListener('click',()=>{
  if(targetKind==='board') openBoardSheet();
  else if(targetKind==='tv'){
    if(tvState==='on') openTvSheet();
    else tvToggle();
  }
  else if(targetKind==='window'){
    const nm=(window.__wdWindowScene==='fantasy')?'real':'fantasy';
    setWindowScene(nm);
    showToast(nm==='fantasy'?"Deraza: yomg'irli qasr manzarasi":"Deraza: haqiqiy vaqt osmoni",IC.check);
  }
  else if(targetKind==='sofa') sitDown('sofa');
  else if(targetKind==='desk') sitDown('desk');
  else if(targetKind==='paper') openWriteSheet();
  else if(targetKind==='stand') standUp();
  else if(targetBlock) startQuiz(targetBlock);
});

/* ================= BOSHQARUV ================= */
let dragPrev=null, dragMoved=0;
let downT=0;
CV.addEventListener('pointerdown',e=>{ dragPrev=[e.clientX,e.clientY]; dragMoved=0; downT=performance.now(); });
CV.addEventListener('pointermove',e=>{
  if(!dragPrev) return;
  const dx=e.clientX-dragPrev[0], dy=e.clientY-dragPrev[1];
  dragPrev=[e.clientX,e.clientY]; dragMoved+=Math.abs(dx)+Math.abs(dy);
  yaw-=dx*0.0042;                                        // chap-o'ngga burilish
  pitch=Math.max(-0.7,Math.min(0.7,pitch-dy*0.0032));    // tepa-pastga qarash
});
function tryTap(e){
  const r=CV.getBoundingClientRect();
  const nx=((e.clientX-r.left)/r.width)*2-1, ny=-((e.clientY-r.top)/r.height)*2+1;
  const rc=new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(nx,ny),camera);
  const hits=rc.intersectObjects(blocks.map(b=>b.card),false);
  if(hits.length){
    const b=blocks[hits[0].object.userData.wi];
    if(!b) return;
    if(hits[0].distance>REACH+0.8){ showToast('Yaqinroq keling',IC.info); return; }
    startQuiz(b);
    return;
  }
  // Qog'ozga tegish — yozish/o'qish oynasi
  if(paperMesh){
    const ph=rc.intersectObject(paperMesh,false);
    if(ph.length && ph[0].distance<1.8){ openWriteSheet(); return; }
  }
  // Derazaga tegish — manzara almashadi (real vaqt <-> fantasy qasr)
  if(windowGlass){
    const wh=rc.intersectObject(windowGlass,false);
    if(wh.length && wh[0].distance<5.2){
      const nm=(window.__wdWindowScene==='fantasy')?'real':'fantasy';
      setWindowScene(nm);
      showToast(nm==='fantasy'?"Deraza: yomg'irli qasr manzarasi":"Deraza: haqiqiy vaqt osmoni",IC.check);
      return;
    }
  }
  // Kitob javoniga tegish — kutubxona
  if(shelfMesh){
    const sh=rc.intersectObject(shelfMesh,false);
    if(sh.length && sh[0].distance<3.2){
      if((window.__wdNotebook||[]).length) openWriteSheet();
      else showToast("Javon hozircha bo'sh — partada insho yozing, kitob paydo bo'ladi",IC.info);
      return;
    }
  }
  // Televizorga tegish — yoqish yoki boshqarish
  if(tvScreen){
    const th=rc.intersectObject(tvScreen,false);
    if(th.length && th[0].distance<4.8){
      if(tvState==='off') tvToggle();
      else if(tvState==='on' && !window.__wdTvVideo) openTvSheet();
      else if(tvState==='on') openTvSheet(); // video ustidan bo'sh ramkaga tegilsa
      return;
    }
  }
  // Doskaga tegish — mavzu o'zgartirish oynasi
  if(boardMesh){
    const bh=rc.intersectObject(boardMesh,false);
    if(bh.length && bh[0].distance<4.6) openBoardSheet();
  }
}
CV.addEventListener('pointerup',e=>{
  const wasTap=dragPrev && dragMoved<8 && (performance.now()-downT)<350;
  dragPrev=null;
  if(wasTap) tryTap(e);
});
CV.addEventListener('pointercancel',()=>{ dragPrev=null; });
function bindHold(id,setter){
  const btn=document.getElementById(id);
  const on=e=>{ e.preventDefault(); setter(true); btn.classList.add('hold'); };
  const off=()=>{ setter(false); btn.classList.remove('hold'); };
  btn.addEventListener('pointerdown',on);
  btn.addEventListener('pointerup',off);
  btn.addEventListener('pointerleave',off);
  btn.addEventListener('pointercancel',off);
}
bindHold('wlFwd',v=>fwdHeld=v);
bindHold('wlBack',v=>backHeld=v);
window.addEventListener('keydown',e=>{
  if(OV.hidden) return;
  if(e.key==='w'||e.key==='ArrowUp') fwdHeld=true;
  if(e.key==='s'||e.key==='ArrowDown') backHeld=true;
});
window.addEventListener('keyup',e=>{
  if(e.key==='w'||e.key==='ArrowUp') fwdHeld=false;
  if(e.key==='s'||e.key==='ArrowDown') backHeld=false;
});

/* To'qnashuv: parta-stullar ichidan o'tib ketmaslik */
function resolveCollisions(){
  const R=0.34;
  pos.x=Math.max(-ROOM_W/2+0.55,Math.min(ROOM_W/2-0.55,pos.x));
  pos.z=Math.max(0.8,Math.min(ROOM_D-0.6,pos.z));
  COLLIDERS.forEach(c=>{
    if(pos.x>c.minx-R && pos.x<c.maxx+R && pos.z>c.minz-R && pos.z<c.maxz+R){
      const dl=pos.x-(c.minx-R), dr=(c.maxx+R)-pos.x;
      const dn=pos.z-(c.minz-R), df=(c.maxz+R)-pos.z;
      const m=Math.min(dl,dr,dn,df);
      if(m===dl) pos.x=c.minx-R; else if(m===dr) pos.x=c.maxx+R;
      else if(m===dn) pos.z=c.minz-R; else pos.z=c.maxz+R;
    }
  });
}

/* ================= ANIMATSIYA ================= */
function onWallResize(){
  const w=OV.clientWidth||innerWidth, h=OV.clientHeight||innerHeight;
  renderer.setSize(w,h,false);
  if(cssRenderer) cssRenderer.setSize(w,h);
  camera.aspect=w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize',()=>{ if(!OV.hidden && inited) onWallResize(); });

function nearestWallDist(){
  return Math.min(pos.z, ROOM_D-pos.z, pos.x+ROOM_W/2, ROOM_W/2-pos.x);
}
function tick(){
  animId=requestAnimationFrame(tick);
  if(document.hidden){ try{ clock.getDelta(); }catch(e){} return; }  // fonda GPU yuklanmasin
  try{
  const dt=Math.min(clock.getDelta(),0.05);
  // Yurish — qaragan tomonga qarab oldinga/orqaga
  camY+=(camYTarget-camY)*Math.min(1,dt*5);
  lerpLights(dt);
  const _now=performance.now();
  if(window.__wdWindowScene==='fantasy'){
    if(_now-lastSkyDraw>2600 && _now>flashUntil){ lastSkyDraw=_now; drawFantasy(); } // mash'alalar lipillashi
    if(rainTex){ rainTex.offset.y-=dt*2.2; rainTex.offset.x-=dt*0.35; }   // yaqin yomg'ir — tez, shamolda og'gan
    if(rainTex2){ rainTex2.offset.y-=dt*1.1; rainTex2.offset.x-=dt*0.15; } // uzoq yomg'ir — sekinroq
    if(_now>nextLightning){
      boltSeed=Math.floor(_now%97)+3;
      flashUntil=_now+150;
      drawFantasy(true); // OSMONNING O'ZI chaqnaydi — yashin ko'rinadi
      if(flashRedrawTO) clearTimeout(flashRedrawTO);
      flashRedrawTO=setTimeout(()=>{
        if(window.__wdWindowScene!=='fantasy') return;
        drawFantasy(false);
        if(_sr(boltSeed*3)>0.55){ // qo'sh chaqnash
          setTimeout(()=>{ if(window.__wdWindowScene==='fantasy'){ boltSeed+=17; flashUntil=performance.now()+120; drawFantasy(true); setTimeout(()=>{ if(window.__wdWindowScene==='fantasy') drawFantasy(false); },130); } },160);
        }
      },170);
      nextLightning=_now+5000+_sr(_now*3)*10000;
    }
    if(flashLight) flashLight.intensity=(_now<flashUntil)?85:Math.max(0,flashLight.intensity-dt*300);
  } else {
    if(_now-lastSkyDraw>60000){ lastSkyDraw=_now; drawSky(); }
    if(flashLight && flashLight.intensity>0) flashLight.intensity=Math.max(0,flashLight.intensity-dt*260);
  }
  if(cloudTex){
    cloudTex.offset.x=(performance.now()*0.0000115)%1; // bulutlar sekin suzadi
    // bulut qatlami xiraligi fazaga qarab (materialga ulangan mesh orqali emas, to'g'ridan)
  }
  if(curtainMeshes.length){
    const tt=performance.now()*0.001;
    curtainMeshes[0].rotation.z=Math.sin(tt*0.8)*0.02;
    curtainMeshes[1].rotation.z=Math.sin(tt*0.8+1.7)*0.02;
  }
  const _shOpen=SHEET.classList.contains('show');
  const _showLight=seated && seatKind==='sofa' && !_shOpen;
  if(LIGHTS.classList.contains('show')!==_showLight){
    LIGHTS.classList.toggle('show',_showLight);
    if(_showLight) updateLightIcons();
  }
  WRITEBTN.classList.toggle('show', seated && seatKind==='desk' && !_shOpen);
  if(seated){
    // O'rindiqqa silliq "cho'kish"
    pos.x+=(seatTarget.x-pos.x)*Math.min(1,dt*5);
    pos.z+=(seatTarget.z-pos.z)*Math.min(1,dt*5);
  } else {
    const dir=(fwdHeld?1:0)-(backHeld?1:0);
    if(dir!==0){
      pos.x+=-Math.sin(yaw)*dir*dt*2.7;
      pos.z+=-Math.cos(yaw)*dir*dt*2.7;
      resolveCollisions();
    }
  }
  camera.position.set(pos.x,camY,pos.z);
  camera.rotation.set(pitch,yaw,0);
  // Yangi blok "o'sib chiqishi"
  blocks.forEach(b=>{
    if(b.spawn>0 && b.spawn<1){
      b.spawn=Math.min(1,b.spawn+dt*2.8);
      const s=1-Math.pow(1-b.spawn,3);
      b.card.scale.set(s,s,1);
      if(b.spawn>=1) b.card.scale.set(1,1,1);
    }
  });
  // Eng yaqin, qarab turilgan blok — yorqin belgilanadi
  const fwd2=[-Math.sin(yaw),-Math.cos(yaw)];
  let best=null, bestScore=0;
  blocks.forEach(b=>{
    b.glow.material.opacity=Math.max(0,b.glow.material.opacity-dt*4);
    if(b.mode!=='en'||b.flipping) return;
    const dx=b.grp.position.x-pos.x, dz=b.grp.position.z-pos.z;
    const dist=Math.hypot(dx,dz);
    if(dist>REACH) return;
    const dot=(dx*fwd2[0]+dz*fwd2[1])/(dist||1);
    if(dot<0.55) return; // taxminan qarab turilgan yo'nalishda bo'lsin
    const score=dot/(0.5+dist);
    if(score>bestScore){ bestScore=score; best=b; }
  });
  targetBlock=best;
  if(best) best.glow.material.opacity=Math.min(0.9,best.glow.material.opacity+dt*8);
  const sheetOpen=SHEET.classList.contains('show');
  // Doska nishonga olinganmi? (blok bo'lmasa, doskaga qarab, yaqin tursak)
  const facingBoard=(!seated && !best && fwd2[1]<-0.55 && pos.z<4.4 && Math.abs(pos.x)<3.2);
  const nearSofa=(!seated && !best && !facingBoard && Math.hypot(pos.x-SOFA.x,pos.z-SOFA.z)<1.8);
  const nearDesk=(!seated && !best && !facingBoard && !nearSofa && Math.hypot(pos.x-DESK.x,pos.z-(DESK.z+0.6))<1.5);
  const facingTv=(!best && !facingBoard && !nearSofa && !nearDesk && fwd2[0]>0.5 && pos.x>1.4 && Math.abs(pos.z-2.3)<2.8);
  if(seated && !sheetOpen){
    targetKind='stand';
    const slbl=(seatKind==='desk')?'__stand_d':'__stand_s';
    if(CHECKBTN.dataset.en!==slbl){
      CHECKBTN.dataset.en=slbl;
      CHECKBTN.innerHTML=(seatKind==='desk')?`<b>Parta</b>&nbsp;— turish`:`<b>Divan</b>&nbsp;— turish`;
    }
    CHECKBTN.classList.add('show');
  } else if(best && !sheetOpen){
    targetKind='block';
    if(CHECKBTN.dataset.en!==best.data.en){
      CHECKBTN.dataset.en=best.data.en;
      CHECKBTN.innerHTML=`<b>"${escapeHtml(best.data.en)}"</b>&nbsp;— tarjimasini eslang`;
    }
    CHECKBTN.classList.add('show');
  } else if(facingBoard && !sheetOpen){
    targetKind='board';
    if(CHECKBTN.dataset.en!=='__board'){
      CHECKBTN.dataset.en='__board';
      CHECKBTN.innerHTML=`<b>Doska</b>&nbsp;— mavzuni o'zgartirish`;
    }
    CHECKBTN.classList.add('show');
  } else if(facingTv && !sheetOpen){
    targetKind='tv';
    const lbl=tvState==='on'?'__tv_on':'__tv_off';
    if(CHECKBTN.dataset.en!==lbl){
      CHECKBTN.dataset.en=lbl;
      CHECKBTN.innerHTML=tvState==='on'
        ?`<b>Televizor</b>&nbsp;— video / o'chirish`
        :`<b>Televizor</b>&nbsp;— yoqish`;
    }
    CHECKBTN.classList.add('show');
  } else if(nearSofa && !sheetOpen){
    targetKind='sofa';
    if(CHECKBTN.dataset.en!=='__sofa'){
      CHECKBTN.dataset.en='__sofa';
      CHECKBTN.innerHTML=`<b>Divan</b>&nbsp;— o'tirish`;
    }
    CHECKBTN.classList.add('show');
  } else if(nearDesk && !sheetOpen){
    targetKind='desk';
    if(CHECKBTN.dataset.en!=='__desk'){
      CHECKBTN.dataset.en='__desk';
      CHECKBTN.innerHTML=`<b>Parta</b>&nbsp;— o'tirish`;
    }
    CHECKBTN.classList.add('show');
  } else if(!seated && !best && fwd2[1]>0.55 && pos.z>8.2 && Math.abs(pos.x)<2.9 && !sheetOpen){
    targetKind='window';
    const wl=window.__wdWindowScene==='fantasy'?'__win_f':'__win_r';
    if(CHECKBTN.dataset.en!==wl){
      CHECKBTN.dataset.en=wl;
      CHECKBTN.innerHTML=window.__wdWindowScene==='fantasy'
        ?`<b>Deraza</b>&nbsp;— real osmonga qaytarish`
        :`<b>Deraza</b>&nbsp;— qasr manzarasi`;
    }
    CHECKBTN.classList.add('show');
  } else { targetKind=null; CHECKBTN.classList.remove('show'); CHECKBTN.dataset.en=''; }
  if(teacherMixer) teacherMixer.update(dt);
  if(catMixer) catMixer.update(dt);
  if(knightMixer) knightMixer.update(dt);
  // Devorga yaqin — qo'shish tugmasi
  const nearWall=nearestWallDist()<3.0;
  ADDBTN.classList.toggle('show',nearWall && !sheetOpen && !seated);
  HINT.style.opacity=(nearWall||best)?'0':'1';
  if(nearWall && !autoShown && (window.__wdWallWords||[]).length===0 && !sheetOpen){
    autoShown=true; openAddSheet();
  }
  // Ma'no oynasi — blok TANLANGANDA (nishonga olinganda) uning tepasida ko'rinadi
  if(best && !sheetOpen){
    if(meanFor!==best){
      meanFor=best; meanSince=performance.now();
      hideMean();
    } else if(performance.now()-meanSince>450){
      // 0.45s qarab turilgach — AI ma'nosini yuklab, ko'rsatamiz
      const key=best.data.en.toLowerCase();
      if(!meaningCache.has(key)){
        ensureMeaning(best).then(()=>{
          if(meanFor===best && MEAN.classList.contains('show'))
            MEANTXT.textContent=meaningText(meaningCache.get(key));
        });
      }
      MEANTXT.textContent=meaningText(meaningCache.get(key));
      MEAN.classList.add('show');
    }
    const v=best.grp.position.clone(); v.y+=CARD_H/2+0.1;
    v.project(camera);
    const w=OV.clientWidth||innerWidth, h=OV.clientHeight||innerHeight;
    if(v.z<1){
      MEAN.style.left=((v.x+1)/2*w)+'px';
      MEAN.style.top=((-v.y+1)/2*h-10)+'px';
    }
  } else if(!sheetOpen){ meanFor=null; hideMean(); }
  else { hideMean(); }
  renderer.render(scene,camera);
  if(cssRenderer) cssRenderer.render(cssScene,camera);
  }catch(err){
    if(!window.__wdTickErr){ window.__wdTickErr=true;
      showToast('Xona xatosi: '+String(err&&err.message||err).slice(0,90),IC.info); }
  }
}

/* ================= OCHISH / YOPISH ================= */
function closeWall(){
  OV.hidden=true;
  tvSet('off');
  seated=false; camY=1.5; camYTarget=1.5;
  setLightMode('normal');
  if(MOVEBOX) MOVEBOX.style.display='flex';
  if(animId){ cancelAnimationFrame(animId); animId=null; }
  closeWallSheet(); endQuiz();
  fwdHeld=backHeld=false;
  CHECKBTN.classList.remove('show'); ADDBTN.classList.remove('show');
  renderHome(); updateProfileStats();
}
document.getElementById('wall-back').addEventListener('click',()=>{
  if(history.state && history.state.wdWall){ history.back(); }
  else closeWall();
});
window.addEventListener('popstate',()=>{
  if(OV && !OV.hidden) closeWall();
});
window.__wdOpenWall=function(){
  OV.hidden=false;
  try{ history.pushState({wdWall:true},'','#wall'); }catch(e){}
  if(!inited) initWall();
  pos.set(0,0,10.9); yaw=0; pitch=0; autoShown=false;
  window.__wdTickErr=false; fwdHeld=backHeld=false; dragPrev=null;
  try{ onWallResize(); rebuildWall(); }catch(err){ showToast('Yuklash xatosi: '+String(err&&err.message||err).slice(0,80),IC.info); }
  try{ drawSky(); rebuildBooks(); }catch(err){}
  lastSkyDraw=performance.now();
  if(rainMesh) rainMesh.visible=(window.__wdWindowScene==='fantasy');
  if(rainMesh2) rainMesh2.visible=(window.__wdWindowScene==='fantasy');
  if(cloudsMesh) cloudsMesh.material.opacity=(window.__wdWindowScene==='fantasy')?0.3:0.85;
  if(clock) clock.getDelta();
  if(!animId) tick();
};
