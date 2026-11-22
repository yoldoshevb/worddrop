
/* ========== SHAXSIY XONA — 3D MUHARRIR ==========
   Grid (6x6) asosida jihoz joylashtirish: inventardan tanla -> pol katagini bos.
   Joylashgan jihozni bossang: burish / yig'ishtirish. Hammasi localStorage'da. */
import * as THREE from 'three';

const RO=document.getElementById('room-overlay');
const RC=document.getElementById('room-canvas');
const RINV=document.getElementById('roomInv');
const RACT=document.getElementById('roomAct');
const RHINT=document.getElementById('roomHint');
const RCOIN=document.getElementById('roomCoin');

let rInited=false, rAnim=0, rr=null, rs=null, rcam=null;
const rray=new THREE.Raycaster(), rv2=new THREE.Vector2();
let yaw=Math.PI*0.25, pitch=0.66;
const DIST=10.2, LOOK=new THREE.Vector3(0,0.9,0);
const GRID_N=8, CELL=1.3, GOFF=(GRID_N*CELL)/2-CELL/2; // kattaroq, kengroq xona
/* Ikki rejim: 'edit' — yuqoridan, jihoz joylashtirish; 'view' — ichkaridan,
   first-person YURISH (sinfxona dvigateli). */
let roomMode='edit';
// First-person yurish holati (sinfxonadan)
let fpPos=new THREE.Vector3(0,1.5,0), fpYaw=Math.PI, fpPitch=0;
let fpCamY=1.7, fpCamYTarget=1.7;
let fpFwd=false, fpBack=false;
let fpSeated=false, fpSeatTarget=new THREE.Vector3(0,0,0), fpStandPos=new THREE.Vector3(0,0,0);
const ROOM_HALF=(GRID_N*CELL+1.4)/2; // devor yarim eni
const ROOM_CEIL=3.2;                 // shift balandligi (balandroq, keng his)
const RCOLLIDERS=[];                 // {minx,maxx,minz,maxz} — mebel to'qnashuvi
const RSEATS=[];                     // {x,z,sx,sz,camY,label} — o'tiriladigan joylar
const RPIANOS=[];                    // {x,z} — pianino nuqtalari (yaqinlashganda musiqa)
let __pianoAudio=null;               // pianino audio elementi (bir marta yuklanadi)
let floorMesh=null, itemsGroup=null, selRing=null;
let placeId=null, selKey=null; // selKey = "x:z"
let rGuest=null; // mehmon rejimi: {name, items, stats}
let winGlass=null, rAmb=null, rSun=null, rFill=null;
let wallBack=null, wallFront=null, wallLeft=null, wallRight=null;
let wallItemsGroup=null; // devorga ilingan jihozlar (TV, soat, neon, ramka)
let roomCeil=null;       // tom (edit rejimda yashirin)
let floorShell=null;     // pol mesh (mavzu uchun material almashtiriladi)
let shellGroup=null;     // butun qobiq (pol+devor+tom+deraza) — mavzuda qayta quriladi
let rainCtx=null, rainTex=null, rainDrops=null, rainBase=null;
function rDeco(){
  if(rGuest && rGuest.stats && rGuest.stats.deco) return rGuest.stats.deco;
  const R0=window.__wdRoom||{}; return R0.deco||{view:'day',night:false};
}
function viewTex(view,night){
  const cv=document.createElement('canvas'); cv.width=260; cv.height=190;
  const x=cv.getContext('2d');
  // MAGIC HEARTH — gotik manzara (mavzu yoqilganda deraza ortidagi olam)
  if(rDeco().theme==='magic'){
    const sk=x.createLinearGradient(0,0,0,190);
    sk.addColorStop(0,'#0A0713'); sk.addColorStop(0.45,'#241026'); sk.addColorStop(1,'#5B2A1E');
    x.fillStyle=sk; x.fillRect(0,0,260,190);
    x.fillStyle='rgba(255,238,210,.85)';
    for(let i=0;i<60;i++){ const sx=Math.random()*260, sy=Math.random()*120;
      x.globalAlpha=0.25+Math.random()*0.6; x.fillRect(sx,sy,1.4,1.4); }
    x.globalAlpha=1;
    // qonli oy
    const mg=x.createRadialGradient(198,36,4,198,36,26);
    mg.addColorStop(0,'#FFE9C4'); mg.addColorStop(0.55,'#F2A65A'); mg.addColorStop(1,'rgba(210,90,40,0)');
    x.fillStyle=mg; x.beginPath(); x.arc(198,36,26,0,7); x.fill();
    x.fillStyle='#FFF1D2'; x.beginPath(); x.arc(198,36,12,0,7); x.fill();
    // uzoq tog'lar
    x.fillStyle='#160B18';
    x.beginPath(); x.moveTo(0,140);
    [[24,112],[52,126],[82,98],[118,124],[150,104],[186,128],[220,110],[260,132]].forEach(p=>x.lineTo(p[0],p[1]));
    x.lineTo(260,190); x.lineTo(0,190); x.fill();
    // qasr silueti — minoralar va uchli tomlar
    x.fillStyle='#0C0610';
    function tower(bx,bw,bh){
      x.fillRect(bx,190-bh,bw,bh);
      x.beginPath(); x.moveTo(bx-3,190-bh); x.lineTo(bx+bw/2,190-bh-bw*0.95); x.lineTo(bx+bw+3,190-bh); x.fill();
      for(let cy=190-bh+8; cy<180; cy+=14){ x.fillStyle='rgba(255,170,80,.5)'; x.fillRect(bx+bw*0.34,cy,bw*0.3,5); x.fillStyle='#0C0610'; }
    }
    x.fillRect(40,120,150,70);
    tower(28,26,86); tower(96,22,66); tower(168,30,96); tower(214,18,54);
    // devor tishlari (parapet)
    x.fillStyle='#0C0610';
    for(let bx=40;bx<190;bx+=16) x.fillRect(bx,114,9,8);
    // tuman
    const fg=x.createLinearGradient(0,150,0,190);
    fg.addColorStop(0,'rgba(120,60,40,0)'); fg.addColorStop(1,'rgba(150,80,50,.4)');
    x.fillStyle=fg; x.fillRect(0,150,260,40);
    return {cv,ctx:x};
  }
  const sky=x.createLinearGradient(0,0,0,190);
  if(night){ sky.addColorStop(0,'#0E1430'); sky.addColorStop(1,'#25304F'); }
  else if(view==='sea'){ sky.addColorStop(0,'#FFB35C'); sky.addColorStop(1,'#FFE0A8'); }
  else { sky.addColorStop(0,'#8FC4F2'); sky.addColorStop(1,'#D7ECFF'); }
  x.fillStyle=sky; x.fillRect(0,0,260,190);
  if(night){ // yulduzlar + oy
    x.fillStyle='#F5F0DC';
    for(let i=0;i<26;i++){ x.globalAlpha=0.4+Math.random()*0.6; x.fillRect(Math.random()*260,Math.random()*100,1.6,1.6); }
    x.globalAlpha=1; x.beginPath(); x.arc(205,38,16,0,7); x.fill();
    x.fillStyle=night?'#0E1430':'#fff'; x.beginPath(); x.arc(198,33,13,0,7); x.fill();
  } else if(view!=='sea'){ x.fillStyle='#FFE28A'; x.beginPath(); x.arc(205,40,17,0,7); x.fill(); }
  if(view==='city'){
    const cols=['#1B2440','#232E52','#2B3862'];
    [[6,80,40],[52,58,46],[104,95,34],[144,48,52],[202,78,44]].forEach((bd,bi)=>{
      x.fillStyle=night?cols[bi%3]:'#5A6B94'; x.fillRect(bd[0],190-bd[1]-24,bd[2],bd[1]+24);
      x.fillStyle=night?'#FFD98A':'#EAF2FF';
      for(let wy=190-bd[1]-14;wy<180;wy+=13) for(let wx=bd[0]+5;wx<bd[0]+bd[2]-6;wx+=11)
        if(Math.random()<(night?0.55:0.3)) x.fillRect(wx,wy,5,7);
    });
  } else if(view==='sea'){
    const w=x.createLinearGradient(0,95,0,190);
    w.addColorStop(0,night?'#14335A':'#2E7AC0'); w.addColorStop(1,night?'#0C2038':'#1B5A96');
    x.fillStyle=w; x.fillRect(0,95,260,95);
    x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=2;
    for(let i=0;i<5;i++){ x.beginPath(); const yy=112+i*15;
      x.moveTo(0,yy); for(let px=0;px<=260;px+=20) x.lineTo(px,yy+Math.sin(px/22+i)*3); x.stroke(); }
    if(!night){ x.fillStyle='rgba(255,220,120,.5)'; x.fillRect(190,95,26,70); }
  } else if(view==='mount'){
    const mts=[[0,150,80,58],[60,160,110,88],[150,155,120,72]];
    mts.forEach((mm,mi)=>{
      x.fillStyle=night?['#2A3452','#222B46','#1C2438'][mi]:['#7E93B8','#5F7AA6','#4A6390'][mi];
      x.beginPath(); x.moveTo(mm[0],190); x.lineTo(mm[0]+mm[2]/2,190-mm[3]-30); x.lineTo(mm[0]+mm[2],190); x.fill();
      x.fillStyle=night?'#B8C4DC':'#F2F6FC';
      x.beginPath(); x.moveTo(mm[0]+mm[2]/2-11,190-mm[3]-8); x.lineTo(mm[0]+mm[2]/2,190-mm[3]-30); x.lineTo(mm[0]+mm[2]/2+11,190-mm[3]-8);
      x.lineTo(mm[0]+mm[2]/2+5,190-mm[3]-13); x.lineTo(mm[0]+mm[2]/2,190-mm[3]-7); x.lineTo(mm[0]+mm[2]/2-5,190-mm[3]-13); x.fill();
    });
    x.fillStyle=night?'#141B2E':'#3E5578'; x.fillRect(0,178,260,12);
  } else if(view==='rain'){
    x.fillStyle=night?'#151B2C':'#7C8AA5'; x.fillRect(0,0,260,190);
    x.fillStyle=night?'#1D2438':'#66748E';
    x.beginPath(); x.arc(60,200,70,0,7); x.fill(); x.beginPath(); x.arc(190,205,85,0,7); x.fill();
    x.fillStyle=night?'#2A3350':'#8E9CB5';
    [[20,26],[95,18],[175,30]].forEach(cl=>{ x.beginPath(); x.arc(cl[0],cl[1],20,0,7); x.arc(cl[0]+24,cl[1]+4,15,0,7); x.fill(); });
  } else {
    // oddiy kunduzgi manzara
    x.fillStyle=night?'#1B2338':'#79B26A'; x.beginPath(); x.arc(70,235,110,0,7); x.fill();
    x.fillStyle=night?'#151C2E':'#5F9A50'; x.beginPath(); x.arc(220,245,120,0,7); x.fill();
  }
  return {cv,ctx:x};
}
function applyDecor(){
  if(!rs||!winGlass) return;
  const d=rDeco(), night=!!d.night;
  const vt=viewTex(d.view||'day',night);
  if(d.view==='rain'){ rainCtx=vt.ctx; rainBase=vt.ctx.getImageData(0,0,260,190);
    rainDrops=Array.from({length:34},()=>({x:Math.random()*260,y:Math.random()*190,s:2.5+Math.random()*3}));
  } else { rainCtx=null; rainBase=null; }
  try{ if(winGlass.material.map) winGlass.material.map.dispose(); }catch(e){}
  rainTex=new THREE.CanvasTexture(vt.cv);
  winGlass.material.map=rainTex; winGlass.material.color.set(0xFFFFFF); winGlass.material.needsUpdate=true;
  // yorug'lik + atmosfera (mavzu ustuvor)
  const theme=d.theme;
  if(theme==='magic'){
    // Magic Hearth — tosh qasr: devor/pol/tom teksturalari + iliq mash'al yorug'ligi
    if(wallBack) setWallTex(wallBack,mkStoneWallTex());
    if(wallFront) setWallTex(wallFront,mkStoneWallTex());
    if(wallLeft) setWallTex(wallLeft,mkStoneWallTex());
    if(wallRight) setWallTex(wallRight,mkStoneWallTex());
    [wallBack,wallFront,wallLeft,wallRight].forEach(w=>{ if(w) w.material.color.set(0xFFFFFF); });
    if(floorShell){ setWallTex(floorShell,mkStoneFloorTex()); floorShell.material.color.set(0xFFFFFF); }
    if(roomCeil){ setWallTex(roomCeil,mkStoneCeilTex()); roomCeil.material.color.set(0xFFFFFF); }
    if(rAmb){ rAmb.intensity=0.55; rAmb.color.set(0xFFB27A); }
    if(rSun){ rSun.intensity=1.15; rSun.color.set(0xFF7A28); }
    if(rFill){ rFill.intensity=0.5; rFill.color.set(0xC8501E); }
    rs.background=new THREE.Color(0x140D07);
    RO.style.background='#140D07';
  } else {
    // ASL holat — devor/pol/tom asl teksturalari toza qaytadi
    if(wallBack) setWallTex(wallBack,mkRoomWallTex('#E9E2F2','#DAD0EC'));
    if(wallFront) setWallTex(wallFront,mkRoomWallTex('#E9E2F2','#DAD0EC'));
    if(wallLeft) setWallTex(wallLeft,mkRoomWallTex('#E4DBF4','#D2C6E8'));
    if(wallRight) setWallTex(wallRight,mkRoomWallTex('#E4DBF4','#D2C6E8'));
    [wallBack,wallFront,wallLeft,wallRight].forEach(w=>{ if(w) w.material.color.set(0xFFFFFF); });
    if(floorShell){ setWallTex(floorShell,woodTex()); floorShell.material.color.set(0xFFFFFF); }
    if(roomCeil){ setWallTex(roomCeil,null); roomCeil.material.color.set(0xF4ECE7); }
    if(rAmb){ rAmb.intensity=night?0.32:0.75; rAmb.color.set(0xFFFFFF); }
    if(rSun){ rSun.intensity=night?0.18:0.9; rSun.color.set(night?0x9FB4E8:0xFFF3DF); }
    if(rFill){ rFill.intensity=night?0.12:0.35; rFill.color.set(0xBFD4FF); }
    rs.background=new THREE.Color(night?0x1E2433:0xEDE6DA);
    RO.style.background=night?'#1E2433':'#EDE6DA';
  }
}
function updRain(){
  if(!rainCtx||!rainTex||!rainBase||!rainDrops) return;
  rainCtx.putImageData(rainBase,0,0);
  rainCtx.strokeStyle='rgba(210,228,255,.65)'; rainCtx.lineWidth=1.4;
  rainDrops.forEach(dp=>{
    rainCtx.beginPath(); rainCtx.moveTo(dp.x,dp.y); rainCtx.lineTo(dp.x-1.5,dp.y+dp.s*2.6); rainCtx.stroke();
    dp.y+=dp.s; dp.x-=0.5;
    if(dp.y>190){ dp.y=-6; dp.x=Math.random()*270; }
  });
  rainTex.needsUpdate=true;
}

const ROT_SVG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11 A8 8 0 1 0 18.5 15.5"/><path d="M20 6 V11 H15"/></svg>`;
const PICK_SVG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15 V19 a1.5 1.5 0 0 0 1.5 1.5 h13 A1.5 1.5 0 0 0 20 19 v-4"/><path d="M12 4 V14 M8 10 L12 14 L16 10"/></svg>`;

function R(){ return window.__wdRoom||{owned:false,inv:{},items:[]}; }
function rItemsData(){ return rGuest ? rGuest.items : R().items; }
function rStats(){
  if(rGuest) return { band:Number(rGuest.stats&&rGuest.stats.band)||0, wins:Number(rGuest.stats&&rGuest.stats.wins)||0, streak:Number(rGuest.stats&&rGuest.stats.streak)||0 };
  let band=0,wins=0;
  try{ band=Math.max(0,...(window.__wdIelts||[]).map(r=>r.overall||0),0); }catch(e){}
  try{ wins=(window.__wdDuels||[]).filter(d=>d.r==='w').length; }catch(e){}
  return { band, wins, streak:Number(window.__wdStreak||0) };
}
function rSave(){ try{ saveState(); }catch(e){} try{ if(!rGuest&&window.__wdRoomSync) window.__wdRoomSync(); }catch(e){} }
function rItems(){ return window.__wdShopItems||[]; }
function rHint(t,ms){ RHINT.textContent=t; RHINT.style.opacity='1'; clearTimeout(rHint._t); rHint._t=setTimeout(()=>RHINT.style.opacity='0',ms||2600); }
function cellXZ(ix,iz){ return [ix*CELL-GOFF, iz*CELL-GOFF]; }
function occupied(ix,iz){ return rItemsData().some(it=>it.x===ix&&it.z===iz); }

/* ---------- materiallar ---------- */
function mat(c,r=0.85,m=0){ return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}); }
function woodTex(){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=512;
  const x=cv.getContext('2d');
  x.fillStyle='#C8A576'; x.fillRect(0,0,512,512);
  for(let i=0;i<8;i++){
    x.fillStyle=i%2?'#C09B6C':'#CBAA7C'; x.fillRect(0,i*64,512,64);
    x.strokeStyle='rgba(120,84,48,.35)'; x.lineWidth=2;
    x.beginPath(); x.moveTo(0,i*64); x.lineTo(512,i*64); x.stroke();
    for(let k=0;k<3;k++){
      x.strokeStyle='rgba(120,84,48,.12)';
      x.beginPath(); const yy=i*64+10+Math.random()*44;
      x.moveTo(0,yy); x.bezierCurveTo(170,yy+6,340,yy-6,512,yy+3); x.stroke();
    }
  }
  // grid chiziqlari (muharrir katagi)
  x.strokeStyle='rgba(255,255,255,.28)'; x.lineWidth=3;
  for(let i=0;i<=GRID_N;i++){
    const p=Math.round(i*512/GRID_N);
    x.beginPath(); x.moveTo(p,0); x.lineTo(p,512); x.stroke();
    x.beginPath(); x.moveTo(0,p); x.lineTo(512,p); x.stroke();
  }
  const t=new THREE.CanvasTexture(cv); t.anisotropy=4; return t;
}

/* ---------- jihoz quruvchilar (har biri ~1 katak) ---------- */
// Shaxsiy xona jihoz modellari (Supabase public bucket)
const RUG_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/teascroll_clubhouse_-_rug_prop.glb';
const PLANT_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/potted_plant_mediterranean_flowering_low_poly.glb';
const TV_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/tv_table.glb';
const SOFA_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/sofa_low_poly.glb';
const PC_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/gamer_setup_pack.glb';
const DESK_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/teachers_desk.glb';
const CHAIR_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/gamer_chair_low_poly.glb';
const BOOK_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/nineteen_eighty-four_1984_by_george_orwell.glb';
const CLOCK_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/clock_low_poly.glb';
const PIANO_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/piano.glb';
/* Magic Hearth mavzusi kamini — mavzu yoqilganda xonaga chiqadi (do'konda yo'q) */
const FURNACE_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/low_poly_furnance.glb';
const PIANO_AUDIO_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/audio/Medium%20Piano%20Tutorial%20%20%20La%20Maritza%20(Sylvie%20Vartan)%20(1).m4a';
const CUSHION_GLB_URL='https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/models/japanese_cushion_zabuton_-__low-poly.glb';
function bRug(){
  const g=new THREE.Group();
  // Model kelguncha yupqa placeholder (bo'sh joy sezilmasin)
  const ph=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.02,24),mat(0xD8C4B0,1));
  ph.position.y=0.01; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(RUG_GLB_URL,m=>{
    if(!m) return; // yuklanmasa placeholder qoladi
    g.remove(ph);
    // Gilamni kattaroq — enini ~1.8m ga
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(1.8/w);
    g.add(m);
  },{keepColor:true});
  return g;
}
function bPlant(){
  const g=new THREE.Group();
  const ph=new THREE.Group();
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.12,0.24,14),mat(0xB35A3B,0.9));
  pot.position.y=0.12;
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.03,0.3,8),mat(0x6B4A2E,1)); st.position.y=0.38;
  const l1=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),mat(0x2E9E5B,0.95)); l1.position.y=0.62;
  const l2=new THREE.Mesh(new THREE.SphereGeometry(0.16,12,10),mat(0x37B268,0.95)); l2.position.set(0.14,0.5,0.06);
  const l3=new THREE.Mesh(new THREE.SphereGeometry(0.13,12,10),mat(0x2A8F52,0.95)); l3.position.set(-0.13,0.52,-0.05);
  ph.add(pot,st,l1,l2,l3); g.add(ph);
  // Model yuklansa — primitiv o'simlik o'rniga haqiqiy tuvakli gul qo'yiladi
  if(window.__wdLoadModel) window.__wdLoadModel(PLANT_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Balandligi bo'yicha ~0.75m ga keltiramiz (real xona o'simligi)
    let bb=new THREE.Box3().setFromObject(m);
    const hh=(bb.max.y-bb.min.y)||1;
    let s=0.75/hh;
    // Eni katakka sig'masa — kichraytiramiz
    const ww=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)*s;
    if(ww>CELL*0.95) s*=CELL*0.95/ww;
    m.scale.multiplyScalar(s);
    // Tuvak tagini polga aniq tekislaymiz
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    g.add(m);
  },{});
  return g;
}
function bDesk(){
  const g=new THREE.Group();
  const ph=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.5,0.55),mat(0x9C6B3F,0.75));
  ph.position.y=0.25; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(DESK_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(1.25/w);
    const bb2=new THREE.Box3().setFromObject(m);
    m.position.y-=bb2.min.y;
    // Bu model rangsiz eksport qilingan (lambert1 — 50% kulrang, teksturasiz).
    // Shuning uchun yog'och rangiga bo'yaymiz — placeholder bilan bir xil ton.
    m.traverse(o=>{ if(o.isMesh && o.material){
      (Array.isArray(o.material)?o.material:[o.material]).forEach(mm=>{
        if(!mm.map && mm.color) mm.color.setHex(0x9C6B3F);
      });
    }});
    g.add(m);
    // Parta ust balandligini saqlaymiz — kitob shu ustga qo'yiladi
    g.userData.deskTop=(bb2.max.y-bb2.min.y);
  },{});
  return g;
}
function bBook(){
  const g=new THREE.Group();
  const ph=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.04,0.15),mat(0x2F6FED,0.9));
  ph.position.y=0.02; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(BOOK_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // 1) Kitobni yassi yotqizamiz: eng YUPQA o'lcham (qalinlik) vertikal bo'lsin.
    let bb=new THREE.Box3().setFromObject(m);
    let dx=bb.max.x-bb.min.x, dy=bb.max.y-bb.min.y, dz=bb.max.z-bb.min.z;
    const thinnest=Math.min(dx,dy,dz);
    if(thinnest===dx){ m.rotation.z=Math.PI/2; }       // eng yupqa X'da -> Y'ga buramiz
    else if(thinnest===dz){ m.rotation.x=Math.PI/2; }  // eng yupqa Z'da -> Y'ga buramiz
    // (thinnest===dy bo'lsa allaqachon yassi — burash shart emas)
    // 2) Yassi holatdagi enini o'lchab, ~0.24m ga masshtablaymiz (real kitob eni)
    bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(0.24/w);
    // 3) Asosini y=0 ga aniq tekislaymiz
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    g.add(m);
  },{});
  return g;
}
function bChair(){
  const g=new THREE.Group();
  const ph=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.9,0.5),mat(0x2B2F3A,0.7));
  ph.position.y=0.45; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(CHAIR_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Stulni haqiqiy balandligiga qarab ~1.05m ga (real gaming stul), lekin katak enidan oshmasin
    let bb=new THREE.Box3().setFromObject(m);
    const hh=(bb.max.y-bb.min.y)||1;
    let s=1.05/hh;
    // Eni katakka (CELL) sig'masa — kichraytiramiz
    const ww=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)*s;
    if(ww>CELL*0.95) s*=CELL*0.95/ww;
    m.scale.multiplyScalar(s);
    // Asosini polga aniq tekislaymiz (havoda/yerga botib qolmasin)
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    g.add(m);
  },{});
  return g;
}
function bShelf(){
  const g=new THREE.Group(); const wm=mat(0x8A5E36,0.8);
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.5,0.3),wm); body.position.y=0.75; g.add(body);
  const inn=mat(0x6E4826,0.9);
  for(let i=0;i<3;i++){
    const sh=new THREE.Mesh(new THREE.BoxGeometry(0.68,0.36,0.24),inn);
    sh.position.set(0,0.33+i*0.44,0.04); g.add(sh);
    const cols=[0xE8374A,0x2F6FED,0x1FAE6B,0xF59E0B,0x8B5CF6];
    let bx=-0.26;
    for(let b=0;b<4;b++){
      const w=0.09+Math.random()*0.04, h=0.24+Math.random()*0.08;
      const bk=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.16),mat(cols[(i*4+b)%cols.length],0.95));
      bk.position.set(bx+w/2,0.33+i*0.44-0.18+h/2+0.02,0.05); bx+=w+0.025; g.add(bk);
    }
  }
  return g;
}
function bSofa(){
  const g=new THREE.Group();
  // Placeholder — model kelguncha
  const ph=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.5,0.5),mat(0x4A6FA5,0.95));
  ph.position.y=0.25; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(SOFA_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Divan enini ~1.4m ga moslaymiz (2 kishilik divan o'lchami)
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(1.4/w);
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y; // polga tekislash
    g.add(m);
  },{});
  return g;
}
function bLamp(){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,0.05,16),mat(0x3A404F,0.6,0.4)); base.position.y=0.025;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.1,10),mat(0x3A404F,0.6,0.4)); pole.position.y=0.6;
  const shade=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.28,18,1,true),
    new THREE.MeshStandardMaterial({color:0xFFE9B8,roughness:0.9,side:THREE.DoubleSide,emissive:0xFFD98A,emissiveIntensity:0.55}));
  shade.position.y=1.2;
  const lt=new THREE.PointLight(0xFFD98A,0.6,3.2); lt.position.y=1.12;
  g.add(base,pole,shade,lt); return g;
}
function bTv(){
  const g=new THREE.Group();
  // Placeholder — model kelguncha
  const ph=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.5,0.35),mat(0x8A5E36,0.8));
  ph.position.y=0.25; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(TV_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // TV+stol modeli — balandligini ~0.9m ga moslaymiz (katakka sig'sin)
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    if(w>1.5) m.scale.multiplyScalar(1.5/w); // juda katta bo'lsa cheklaymiz
    else if(w<1.2) m.scale.multiplyScalar(1.4/w); // kichik bo'lsa kattalaymiz
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    g.add(m);
  },{});
  return g;
}
function bCushion(){
  const g=new THREE.Group();
  const ph=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.5),mat(0xE8A0B4,1));
  ph.position.y=0.06; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(CUSHION_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Yostiq enini ~0.6m ga (real zabuton o'lchami — kichraytirmaymiz)
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(0.6/w);
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    // Gazlama juda to'q eksport qilingan (84,14,8 — deyarli qora) va qorayib ko'rinadi.
    // Faqat eng to'q ranglarni yorug'lantiramiz; tugun iplari (yorqinroq) o'z rangida qoladi.
    m.traverse(o=>{ if(o.isMesh && o.material){
      (Array.isArray(o.material)?o.material:[o.material]).forEach(mm=>{
        if(mm.map || !mm.color) return;
        const h={}; mm.color.getHSL(h);
        if(h.l<0.25) mm.color.setHSL(h.h, Math.min(1,h.s), 0.40);
      });
    }});
    g.add(m);
  },{});
  return g;
}
function bPouf(){
  const g=new THREE.Group();
  const c=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.32,0.32,16),mat(0x7FBFA0,1)); c.position.y=0.16;
  const t=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.05,16),mat(0x6AA88B,1)); t.position.y=0.34;
  g.add(c,t); return g;
}
function bVase(){
  const g=new THREE.Group();
  const v=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.14,0.34,12),mat(0x6D8FC9,0.5)); v.position.y=0.17;
  const cols=[0xE8374A,0xF59E0B,0xE879C9];
  cols.forEach((cc,i)=>{
    const st=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.32,6),mat(0x3E7A4C,1));
    st.position.set((i-1)*0.05,0.46,(i%2)*0.04-0.02); st.rotation.z=(i-1)*0.22; g.add(st);
    const fl=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),mat(cc,0.9));
    fl.position.set((i-1)*0.09,0.62,(i%2)*0.06-0.03); g.add(fl);
  });
  g.add(v); return g;
}
function bCtable(){
  const g=new THREE.Group(); const wm=mat(0x9C6B3F,0.75);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.05,20),wm); top.position.y=0.32;
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.3,8),wm); leg.position.y=0.15;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.03,16),wm); base.position.y=0.015;
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.035,0.07,10),mat(0xFFFFFF,0.9)); cup.position.set(0.15,0.38,0.05);
  g.add(top,leg,base,cup); return g;
}
function bChair2(){
  const g=new THREE.Group(); const fm=mat(0xC9744A,0.95), dm=mat(0xB05F38,0.95);
  const base=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.3,0.5),fm); base.position.y=0.2;
  const back=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.44,0.14),dm); back.position.set(0,0.48,-0.18);
  const a1=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.4,0.5),dm); a1.position.set(-0.22,0.36,0);
  const a2=a1.clone(); a2.position.x=0.22;
  const c=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.09,0.36),mat(0xD98D63,1)); c.position.set(0,0.38,0.02);
  g.add(base,back,a1,a2,c); return g;
}
function bRadio(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.28,0.2),mat(0x8A5E36,0.8)); body.position.y=0.14;
  const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.03,14),mat(0x2B2F3A,0.9));
  sp.rotation.x=Math.PI/2; sp.position.set(-0.12,0.14,0.105);
  const pan=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.02),mat(0xF3E4C8,0.9)); pan.position.set(0.13,0.14,0.1);
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.34,6),mat(0x9AA2B5,0.5,0.6));
  ant.position.set(0.2,0.42,0); ant.rotation.z=-0.5;
  g.add(body,sp,pan,ant); return g;
}
function bGlobe(){
  const g=new THREE.Group();
  const cv=document.createElement('canvas'); cv.width=128; cv.height=64;
  const x=cv.getContext('2d');
  x.fillStyle='#3B7BC9'; x.fillRect(0,0,128,64);
  x.fillStyle='#4CA45E';
  [[14,18,26,16],[52,10,30,20],[92,26,24,18],[30,42,20,12],[70,44,26,12]].forEach(b=>{
    x.beginPath(); x.ellipse(b[0],b[1],b[2]/2,b[3]/2,0.4,0,7); x.fill();
  });
  const tex=new THREE.CanvasTexture(cv);
  const sp=new THREE.Mesh(new THREE.SphereGeometry(0.22,18,14),new THREE.MeshStandardMaterial({map:tex,roughness:0.7}));
  sp.position.y=0.5; sp.rotation.z=0.35;
  const arc=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.012,8,20,Math.PI),mat(0xC9A227,0.4,0.6));
  arc.position.y=0.5; arc.rotation.z=Math.PI/2+0.35;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.03,0.24,8),mat(0x8A5E36,0.8)); pole.position.y=0.14;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.16,0.04,14),mat(0x8A5E36,0.8)); base.position.y=0.02;
  g.userData.tick=t=>{ sp.rotation.y=t*0.35; };
  g.add(sp,arc,pole,base); return g;
}
function bChest(){
  const g=new THREE.Group(); const wm=mat(0x8A5232,0.85), gm=mat(0xD9A93F,0.4,0.7);
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.3,0.4),wm); body.position.y=0.15;
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.62,12,1,false,0,Math.PI),wm);
  lid.rotation.z=Math.PI/2; lid.position.y=0.3;
  const b1=new THREE.Mesh(new THREE.BoxGeometry(0.64,0.05,0.42),gm); b1.position.y=0.3;
  const lock=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.1,0.03),gm); lock.position.set(0,0.26,0.21);
  g.add(body,lid,b1,lock); return g;
}
function bAqua(){
  const g=new THREE.Group();
  const stand=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.3,0.4),mat(0x4A4F5E,0.8)); stand.position.y=0.15;
  const water=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.34,0.32),
    new THREE.MeshStandardMaterial({color:0x59C4E8,transparent:true,opacity:0.5,roughness:0.15}));
  water.position.y=0.49;
  const glass=new THREE.Mesh(new THREE.BoxGeometry(0.66,0.4,0.36),
    new THREE.MeshStandardMaterial({color:0xCFEFFF,transparent:true,opacity:0.18,roughness:0.05}));
  glass.position.y=0.5;
  const sand=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.05,0.3),mat(0xE8D5A0,1)); sand.position.y=0.335;
  const lt=new THREE.PointLight(0x7FD4F2,0.4,2.2); lt.position.y=0.75;
  g.add(stand,sand,water,glass,lt); return g;
}
function aquaLocalBox(obj,root){
  const box=new THREE.Box3();
  root.updateMatrixWorld(true); obj.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();
  const tmp=new THREE.Matrix4();
  obj.traverse(o=>{
    if(o.isMesh && o.geometry){
      if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const b=o.geometry.boundingBox.clone();
      b.applyMatrix4(tmp.multiplyMatrices(inv,o.matrixWorld));
      box.union(b);
    }
  });
  return box;
}
/* Egasi bo'lgan baliqlarni akvarium ichiga qo'shadi va suzdiradi */
function aquaAddFish(g,box){
  const owned=(typeof fishOwnedList==='function')?fishOwnedList():[];
  if(!owned.length || !window.__wdLoadModel) return;
  const swim=[];
  owned.forEach(fid=>{
    const ft=(typeof FISH_TYPES!=='undefined')?FISH_TYPES.find(x=>x.id===fid):null;
    if(!ft || ft.off) return;   // vaqtincha o'chirilgan tur
    window.__wdLoadModel(ft.url,fm=>{
      if(!fm) return;
      /* Baliqlar skinned (suyakli): ularda Box3 o'lchovi suyaklar yangilanmaguncha
         noto'g'ri chiqadi va model ulkan bo'lib ketadi. Shuning uchun aniq
         konstanta ishlatamiz — ft.raw modelning xom uzunligi (birliklarda). */
      fm.position.set(0,0,0);            // prep()ning yerga tekislashini bekor qilamiz
      const base=(ft.len||0.13)/(ft.raw||1);
      fm.scale.setScalar(base);
      /* Qattiq chegara — o'lchamaymiz, hisoblaymiz: miqyoslangan uzunlik aynan ft.len.
         (Avvalgi versiyada bu joyda o'lchov ishlatilgandi va baliqni 100 barobar
          kichraytirib yuborardi — shuning uchun baliq umuman ko'rinmasdi.) */
      const Lm=(ft.len||0.13);
      const lim=Math.max(box.hx,box.hz)*1.7;
      if(lim>0 && Lm>lim) fm.scale.setScalar(base*lim/Lm);
      const pv=new THREE.Group(); pv.add(fm); g.add(pv);
      /* markazni nolga keltiramiz — endi pv fazosida, ya'ni miqyos hisobga olinadi */
      try{
        const c=aquaLocalBox(fm,pv).getCenter(new THREE.Vector3());
        if(isFinite(c.x)&&isFinite(c.y)&&isFinite(c.z)) fm.position.sub(c);
      }catch(e){}
      swim.push({o:pv, ph:Math.random()*6.283, sp:0.32+Math.random()*0.26,
                 r:0.7+Math.random()*0.3, ry:ft.ry||0, yo:Math.random()*6.283});
      /* tick har kadrda roomTick tomonidan chaqiriladi */
      g.userData.tick=t=>{
        for(let i=0;i<swim.length;i++){
          const s=swim[i], a=t*s.sp+s.ph;
          const px=(u)=>box.cx+Math.sin(u)*box.hx*s.r;
          const pz=(u)=>box.cz+Math.cos(u*0.8+s.ph)*box.hz*s.r;
          const x=px(a), z=pz(a);
          const y=box.y0+(box.y1-box.y0)*(0.5+0.42*Math.sin(a*0.55+s.yo));
          s.o.position.set(x,y,z);
          /* keyingi nuqtaga qarab buriladi (Z o'qi — baliqning old tomoni) */
          s.o.rotation.y=Math.atan2(px(a+0.06)-x, pz(a+0.06)-z)+s.ry;
        }
      };
    },{});
  });
}
function bScope(){
  const g=new THREE.Group(); const mm=mat(0x3A404F,0.5,0.5);
  [[0.14,0],[-0.07,0.12],[-0.07,-0.12]].forEach(p=>{
    const l=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.02,0.6,8),mm);
    l.position.set(p[0]*0.6,0.3,p[1]*0.6);
    l.rotation.z=-p[0]*0.9; l.rotation.x=p[1]*0.9; g.add(l);
  });
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.7,12),mat(0xE8E2D5,0.4));
  tube.position.y=0.72; tube.rotation.z=-0.7; g.add(tube);
  const eye=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.1,8),mm);
  eye.position.set(-0.28,0.52,0); eye.rotation.z=-0.7; g.add(eye);
  return g;
}
function bPiano(){
  const g=new THREE.Group();
  const ph=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.6,0.4),mat(0x14161C,0.35,0.35));
  ph.position.y=0.4; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(PIANO_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Pianino enini ~1.3m ga (real pianino o'lchami)
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(1.35/w);
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    g.add(m);
  },{});
  return g;
}
function bPc(){
  const g=new THREE.Group();
  // Placeholder — model kelguncha
  const ph=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.5,0.5),mat(0x2B2F3A,0.7));
  ph.position.y=0.42; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(PC_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Gaming setup (stol+monitorlar) enini ~1.3m ga moslaymiz
    const bb=new THREE.Box3().setFromObject(m);
    const w=Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z)||1;
    m.scale.multiplyScalar(1.3/w);
    m.position.y-=(new THREE.Box3().setFromObject(m)).min.y;
    g.add(m);
  },{});
  return g;
}
function bFlame(){
  const g=new THREE.Group();
  const streak=Math.max(0,rStats().streak);
  const h=0.25+Math.min(1.0,streak*0.045); // streak qancha uzun — alanga shuncha baland
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.1,12),mat(0x3A404F,0.5,0.5)); base.position.y=0.05;
  const fm=new THREE.MeshStandardMaterial({color:0xFF9B3D,emissive:0xFF6A00,emissiveIntensity:1.4,roughness:1});
  const f1=new THREE.Mesh(new THREE.ConeGeometry(0.14,h,10),fm); f1.position.y=0.1+h/2;
  const f2=new THREE.Mesh(new THREE.ConeGeometry(0.07,h*0.55,10),
    new THREE.MeshStandardMaterial({color:0xFFD98A,emissive:0xFFB300,emissiveIntensity:1.6,roughness:1}));
  f2.position.y=0.1+h*0.3;
  const lt=new THREE.PointLight(0xFF8A2A,0.6+Math.min(0.6,streak*0.03),3); lt.position.y=0.2+h;
  const cv=document.createElement('canvas'); cv.width=128; cv.height=64;
  const x=cv.getContext('2d'); x.fillStyle='#2B2F3A'; x.fillRect(0,0,128,64);
  x.fillStyle='#FFD98A'; x.font='bold 34px sans-serif'; x.textAlign='center';
  x.fillText(streak+' kun',64,42);
  const plq=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.15),
    new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv)}));
  plq.position.set(0,0.06,0.205);
  g.userData.tick=t=>{
    f1.scale.x=f1.scale.z=1+Math.sin(t*8)*0.12;
    f1.scale.y=1+Math.sin(t*12)*0.14;
    f2.scale.y=1+Math.cos(t*15)*0.2;
  };
  g.add(base,f1,f2,lt,plq); return g;
}
function bTrophyc(){
  const g=new THREE.Group(); const wm=mat(0x6E4826,0.8);
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.3,0.28),wm); body.position.y=0.65;
  const inn=new THREE.Mesh(new THREE.BoxGeometry(0.68,1.14,0.22),mat(0x59391E,0.9)); inn.position.set(0,0.65,0.03);
  const sh=new THREE.Mesh(new THREE.BoxGeometry(0.68,0.04,0.22),wm); sh.position.set(0,0.66,0.03);
  // haqiqiy yutuqlar
  const st=rStats(); const band=st.band, wins=st.wins;
  // kubok
  const gld=new THREE.MeshStandardMaterial({color:0xE8B33A,roughness:0.3,metalness:0.7});
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.045,0.1,10),gld); cup.position.set(-0.18,0.78,0.06);
  const cb=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.03,0.08),gld); cb.position.set(-0.18,0.71,0.06);
  // band plakati
  const cv=document.createElement('canvas'); cv.width=256; cv.height=128;
  const x=cv.getContext('2d');
  x.fillStyle='#F6F1E4'; x.fillRect(0,0,256,128);
  x.strokeStyle='#C9A96A'; x.lineWidth=8; x.strokeRect(6,6,244,116);
  x.fillStyle='#12172B'; x.textAlign='center';
  x.font='bold 15px sans-serif'; x.fillText('IELTS BEST',128,34);
  x.fillStyle='#E8374A'; x.font='900 46px sans-serif';
  x.fillText(band>0?band.toFixed(1):'—',128,84);
  x.fillStyle='#8B94A7'; x.font='bold 13px sans-serif';
  x.fillText(wins+' duel g`alabasi',128,112);
  const plq=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.21),
    new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv)}));
  plq.position.set(0.1,0.98,0.145);
  // duel medallari (g'alaba soniga qarab, max 5)
  for(let i=0;i<Math.min(5,wins);i++){
    const md=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.015,10),gld);
    md.rotation.x=Math.PI/2; md.position.set(-0.24+i*0.12,0.38,0.12); g.add(md);
  }
  g.add(body,inn,sh,cup,cb,plq); return g;
}
function bCat(){
  const g=new THREE.Group(); const fur=mat(0x8E8E93,0.95), dk=mat(0x707076,0.95);
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.17,12,10),fur); body.scale.set(1,1.15,0.9); body.position.y=0.2;
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.12,12,10),fur); head.position.y=0.44;
  const e1=new THREE.Mesh(new THREE.ConeGeometry(0.045,0.09,4),dk); e1.position.set(-0.07,0.56,0); e1.rotation.z=0.2;
  const e2=e1.clone(); e2.position.x=0.07; e2.rotation.z=-0.2;
  const tail=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.028,8,14,Math.PI*1.2),dk);
  tail.position.set(0.16,0.12,-0.02); tail.rotation.y=Math.PI/2;
  const p1=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),fur); p1.position.set(-0.08,0.05,0.1);
  const p2=p1.clone(); p2.position.x=0.08;
  const eye=mat(0x2ECC71,0.3);
  const y1=new THREE.Mesh(new THREE.SphereGeometry(0.018,6,6),eye); y1.position.set(-0.045,0.46,0.105);
  const y2=y1.clone(); y2.position.x=0.045;
  const nose=new THREE.Mesh(new THREE.ConeGeometry(0.014,0.02,4),mat(0xE88BA0,0.8));
  nose.position.set(0,0.42,0.115); nose.rotation.x=Math.PI/2;
  g.userData.tick=t=>{
    head.position.y=0.44+Math.sin(t*1.4)*0.008;   // yumshoq nafas
    tail.rotation.z=Math.sin(t*1.8)*0.35;          // dum tebranishi
  };
  g.add(body,head,e1,e2,tail,p1,p2,y1,y2,nose); return g;
}
const BUILDERS={rug:bRug,plant:bPlant,desk:bDesk,chair:bChair,shelf:bShelf,sofa:bSofa,lamp:bLamp,tv:bTv,
  cushion:bCushion,pouf:bPouf,vase:bVase,ctable:bCtable,chair2:bChair2,radio:bRadio,globe:bGlobe,chest:bChest,
  aqua:bAqua,scope:bScope,piano:bPiano,pc:bPc,flame:bFlame,trophyc:bTrophyc,cat:bCat,
  parrot:bParrot,clock:bClock,neon:bNeon,book:bBook};

/* ---------- To'tiqush: rangli, tebranadi, bosilganda so'z "aytadi" ---------- */
function bParrot(){
  const g=new THREE.Group();
  const green=mat(0x22B14C,0.7), yellow=mat(0xF7C948,0.6), red=mat(0xE4484E,0.6), beak=mat(0x2A2A2E,0.5);
  // gavda
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.15,14,12),green); body.scale.set(1,1.3,0.95); body.position.y=0.34;
  // ko'krak (sariq)
  const chest=new THREE.Mesh(new THREE.SphereGeometry(0.11,12,10),yellow); chest.scale.set(1,1.2,0.7); chest.position.set(0,0.32,0.07);
  // bosh
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.1,14,12),green); head.position.y=0.56;
  // tumshuq
  const bk=new THREE.Mesh(new THREE.ConeGeometry(0.045,0.1,8),beak); bk.position.set(0,0.53,0.11); bk.rotation.x=Math.PI/2.1;
  // ko'z
  const eye=mat(0x111111,0.3);
  const ey1=new THREE.Mesh(new THREE.SphereGeometry(0.018,8,8),eye); ey1.position.set(-0.05,0.58,0.075);
  const ey2=ey1.clone(); ey2.position.x=0.05;
  // dum (uzun, qizil)
  const tail=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.28,6),red); tail.position.set(0,0.18,-0.13); tail.rotation.x=-Math.PI/2.4;
  // qanotlar
  const wingGeo=new THREE.SphereGeometry(0.09,10,8);
  const w1=new THREE.Mesh(wingGeo,green); w1.scale.set(0.5,1.1,0.7); w1.position.set(-0.13,0.34,0);
  const w2=w1.clone(); w2.position.x=0.13;
  // shokhcha (o'tirg'ich)
  const perch=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.44,8),mat(0x8B5A2B,0.9)); perch.rotation.z=Math.PI/2; perch.position.y=0.16;
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.025,0.3,8),mat(0x8B5A2B,0.9)); post.position.y=0.02;
  g.userData.tick=t=>{
    head.rotation.z=Math.sin(t*1.6)*0.12;        // boshni burish
    g.rotation.z=Math.sin(t*2.2)*0.04;           // yengil tebranish
    w1.rotation.z=0.3+Math.sin(t*8)*0.06;        // qanot pirillashi
    w2.rotation.z=-0.3-Math.sin(t*8)*0.06;
  };
  // Bosilganda o'rgangan so'zlardan birini aytadi
  g.userData.onTap=()=>{
    let words=[];
    try{ words=(window.__wdWallWords||[]).map(w=>w.term||w.en).filter(Boolean); }catch(e){}
    const say=words.length?words[Math.floor(Math.random()*words.length)]:'Hello';
    try{ if(window.__wdSpeakNative) window.__wdSpeakNative(say); }catch(e){}
    try{ showToast(say,IC.sound||IC.info); }catch(e){}
    head.rotation.x=-0.25; setTimeout(()=>{ head.rotation.x=0; },350);
  };
  g.add(body,chest,head,bk,ey1,ey2,tail,w1,w2,perch,post);
  return g;
}
/* ---------- Devor soati: haqiqiy vaqtni ko'rsatadi ---------- */
function bClock(){
  const g=new THREE.Group();
  const face=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.05,32),mat(0xFFFFFF,0.4));
  face.rotation.x=Math.PI/2; face.position.y=0.7;
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.27,0.03,12,40),mat(0x31384F,0.5,0.3));
  rim.position.y=0.7;
  // markaz va millar
  const hub=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,10),mat(0x12172B,0.4));
  hub.position.set(0,0.7,0.03);
  const hourHand=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.13,0.01),mat(0x12172B,0.5));
  const minHand=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.2,0.01),mat(0x2F6FED,0.5));
  const hg=new THREE.Group(), mg=new THREE.Group();
  hourHand.position.y=0.055; minHand.position.y=0.09;
  hg.add(hourHand); mg.add(minHand);
  hg.position.set(0,0.7,0.032); mg.position.set(0,0.7,0.034);
  // soat belgilari (12 ta nuqta)
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const d=new THREE.Mesh(new THREE.SphereGeometry(i%3===0?0.02:0.012,8,8),mat(0x6B7488,0.5));
    d.position.set(Math.sin(a)*0.21,0.7+Math.cos(a)*0.21,0.03);
    g.add(d);
  }
  g.userData.tick=()=>{
    const now=new Date();
    const h=now.getHours()%12, m=now.getMinutes(), s=now.getSeconds();
    hg.rotation.z=-((h+m/60)/12)*Math.PI*2;
    mg.rotation.z=-((m+s/60)/60)*Math.PI*2;
  };
  g.add(face,rim,hub,hg,mg);
  return g;
}
/* ---------- Neon lavha: foydalanuvchi ismini yorug' harflar bilan ---------- */
function neonTex(text){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=256;
  const x=cv.getContext('2d');
  x.fillStyle='#0A0A12'; x.fillRect(0,0,512,256);
  const txt=(String(text||'').trim().toUpperCase().slice(0,10))||'WORDDROP';
  x.font='900 96px Inter, sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  x.shadowColor='#22D3EE'; x.shadowBlur=28;
  x.fillStyle='#BDF7FF'; x.fillText(txt,256,128);
  x.shadowBlur=14; x.fillText(txt,256,128);
  const tex=new THREE.CanvasTexture(cv); tex.needsUpdate=true; return tex;
}
function bNeon(){
  const g=new THREE.Group();
  const nm=(window.__wdName||'').trim()||'WORDDROP';
  const panel=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.35,0.04),new THREE.MeshBasicMaterial({map:neonTex(nm)}));
  panel.position.y=0.75;
  const frame=new THREE.Mesh(new THREE.BoxGeometry(0.76,0.41,0.03),mat(0x14151A,0.6,0.3));
  frame.position.set(0,0.75,-0.01);
  const glow=new THREE.PointLight(0x22D3EE,0.6,1.5); glow.position.set(0,0.75,0.3);
  let base=0.6;
  g.userData.tick=t=>{
    glow.intensity=base+Math.sin(t*3.5)*0.18+Math.random()*0.04; // neon pirillashi
  };
  g.add(frame,panel,glow);
  return g;
}

/* ---------- xona qobig'i ---------- */
function buildShell(){
  if(shellGroup){ rs.remove(shellGroup); disposeGroup(shellGroup); }
  shellGroup=new THREE.Group(); rs.add(shellGroup);
  const themeMagic=(rDeco().theme==='magic');
  const W=GRID_N*CELL+1.4, H=themeMagic?5.2:ROOM_CEIL;
  RCOLLIDERS.length=0; RSEATS.length=0; RPIANOS.length=0; // qayta qurishda tozalash
  // Pol
  const fl=new THREE.Mesh(new THREE.BoxGeometry(W,0.12,W),
    new THREE.MeshStandardMaterial({map:woodTex(),roughness:0.9}));
  fl.position.y=-0.06; shellGroup.add(fl); floorShell=fl;
  floorMesh=new THREE.Mesh(new THREE.PlaneGeometry(GRID_N*CELL,GRID_N*CELL),
    new THREE.MeshBasicMaterial({visible:false}));
  floorMesh.rotation.x=-Math.PI/2; floorMesh.position.y=0.01; shellGroup.add(floorMesh);
  // Shift (tom)
  roomCeil=new THREE.Mesh(new THREE.PlaneGeometry(W,W),new THREE.MeshStandardMaterial({color:0xF4ECE7,roughness:0.95,side:THREE.DoubleSide}));
  roomCeil.rotation.x=Math.PI/2; roomCeil.position.y=H; shellGroup.add(roomCeil);
  // 4 devor — ichkariga qaragan (BackSide), shu sabab tashqaridan (edit rejim)
  // ichi ko'rinadi, ichkaridan (view rejim) devorlar to'siq bo'lib turadi.
  const wallMat=new THREE.MeshStandardMaterial({map:mkRoomWallTex('#E9E2F2','#DAD0EC'),roughness:0.92,side:THREE.DoubleSide});
  const wallMat2=new THREE.MeshStandardMaterial({map:mkRoomWallTex('#E4DBF4','#D2C6E8'),roughness:0.92,side:THREE.DoubleSide});
  // orqa (-z), old (+z), chap (-x), o'ng (+x)
  wallBack=new THREE.Mesh(new THREE.PlaneGeometry(W,H),wallMat);
  wallBack.position.set(0,H/2,-W/2); shellGroup.add(wallBack);
  wallFront=new THREE.Mesh(new THREE.PlaneGeometry(W,H),wallMat);
  wallFront.position.set(0,H/2,W/2); wallFront.rotation.y=Math.PI; shellGroup.add(wallFront);
  wallLeft=new THREE.Mesh(new THREE.PlaneGeometry(W,H),wallMat2);
  wallLeft.position.set(-W/2,H/2,0); wallLeft.rotation.y=Math.PI/2; shellGroup.add(wallLeft);
  wallRight=new THREE.Mesh(new THREE.PlaneGeometry(W,H),wallMat2);
  wallRight.position.set(W/2,H/2,0); wallRight.rotation.y=-Math.PI/2; shellGroup.add(wallRight);
  // Plintus — 4 devor bo'ylab
  const pM=mat(0xFFFFFF,1);
  const p1=new THREE.Mesh(new THREE.BoxGeometry(W,0.16,0.05),pM); p1.position.set(0,0.08,-W/2+0.03); shellGroup.add(p1);
  const p2=new THREE.Mesh(new THREE.BoxGeometry(W,0.16,0.05),pM); p2.position.set(0,0.08,W/2-0.03); shellGroup.add(p2);
  const p3=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.16,W),pM); p3.position.set(-W/2+0.03,0.08,0); shellGroup.add(p3);
  const p4=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.16,W),pM); p4.position.set(W/2-0.03,0.08,0); shellGroup.add(p4);
  // Deraza (orqa devor) — mavzuda haybatli gotik ravoq
  if(themeMagic){
    const GW=2.4, GH=3.6, cy=2.3, cz=-W/2+0.05;
    const stone=new THREE.MeshStandardMaterial({color:0x6B6058,roughness:0.95});
    // uchli ravoq shakli (gotik arch): to'rtburchak + uchli tepa
    const arch=new THREE.Shape();
    arch.moveTo(-GW/2,-GH/2); arch.lineTo(-GW/2,GH*0.12);
    arch.quadraticCurveTo(-GW*0.42,GH*0.42, 0,GH/2);
    arch.quadraticCurveTo(GW*0.42,GH*0.42, GW/2,GH*0.12);
    arch.lineTo(GW/2,-GH/2); arch.lineTo(-GW/2,-GH/2);
    // ramka (tashqi kattaroq ravoq, ichi teshik)
    const outer=new THREE.Shape();
    const OW=GW+0.44, OH=GH+0.44;
    outer.moveTo(-OW/2,-OH/2); outer.lineTo(-OW/2,OH*0.12);
    outer.quadraticCurveTo(-OW*0.42,OH*0.42, 0,OH/2);
    outer.quadraticCurveTo(OW*0.42,OH*0.42, OW/2,OH*0.12);
    outer.lineTo(OW/2,-OH/2); outer.lineTo(-OW/2,-OH/2);
    outer.holes.push(arch);
    const frame=new THREE.Mesh(new THREE.ExtrudeGeometry(outer,{depth:0.16,bevelEnabled:true,bevelSize:0.03,bevelThickness:0.03,bevelSegments:2}),stone);
    frame.position.set(0.6,cy,cz-0.02); shellGroup.add(frame);
    // shisha — ravoq shaklida, manzara teksturasi bilan
    winGlass=new THREE.Mesh(new THREE.ShapeGeometry(arch),
      new THREE.MeshBasicMaterial({color:0xFFFFFF}));
    winGlass.position.set(0.6,cy,cz+0.10); shellGroup.add(winGlass);
    // gotik panjara (mullion): vertikal + uchli ravoqni bo'luvchi
    const barM=new THREE.MeshStandardMaterial({color:0x4A423C,roughness:0.9});
    const vb=new THREE.Mesh(new THREE.BoxGeometry(0.07,GH*0.94,0.06),barM);
    vb.position.set(0.6,cy-GH*0.02,cz+0.12); shellGroup.add(vb);
    [-0.72,0.16].forEach(dy=>{
      const hb=new THREE.Mesh(new THREE.BoxGeometry(GW*0.92,0.06,0.06),barM);
      hb.position.set(0.6,cy+dy,cz+0.12); shellGroup.add(hb);
    });
    // ravoq ichidagi uch bo'lakli gul (tracery) — yuqori qismda
    const tr=new THREE.Mesh(new THREE.TorusGeometry(0.30,0.035,10,26),barM);
    tr.position.set(0.6,cy+GH*0.30,cz+0.12); shellGroup.add(tr);
    // deraza tokchasi (sill)
    const sill=new THREE.Mesh(new THREE.BoxGeometry(OW+0.2,0.12,0.3),stone);
    sill.position.set(0.6,cy-GH/2-0.06,cz+0.12); shellGroup.add(sill);
  } else {
    const wf=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.15,0.06),mat(0xFFFFFF,0.8));
    wf.position.set(0.9,1.6,-W/2+0.05); shellGroup.add(wf);
    winGlass=new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.95),
      new THREE.MeshBasicMaterial({color:0xFFFFFF}));
    winGlass.position.set(0.9,1.6,-W/2+0.09); shellGroup.add(winGlass);
  }
  if(themeMagic) buildMagicDecor(W,H);
  applyDecor();
  // Devorga ilingan jihozlar guruhi
  rebuildWallItems();
  // tanlash halqasi
  selRing=new THREE.Mesh(new THREE.RingGeometry(0.5,0.6,28),
    new THREE.MeshBasicMaterial({color:0xF59E0B,transparent:true,opacity:0.9,side:THREE.DoubleSide}));
  selRing.rotation.x=-Math.PI/2; selRing.position.y=0.03; selRing.visible=false; shellGroup.add(selRing);
}
/* ===== MAGIC HEARTH: kamin (glb) + devor mash'allari ===== */
const MAGIC_TORCHES=[];  // {tick} — animatsiya uchun
function mkTorch(){
  const g=new THREE.Group();
  // devor kronshteyni + savat
  const brM=new THREE.MeshStandardMaterial({color:0x2A2320,roughness:0.85,metalness:0.35});
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.26),brM); arm.position.set(0,0,0.13); g.add(arm);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.06,0.18,10),brM); cup.position.set(0,0.11,0.25); g.add(cup);
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.3,8),new THREE.MeshStandardMaterial({color:0x4A3524,roughness:1}));
  rod.position.set(0,0.02,0.25); g.add(rod);
  // olov (ikki konus + yadro)
  const fm=new THREE.MeshStandardMaterial({color:0xFF9B3D,emissive:0xFF6A12,emissiveIntensity:1.7,roughness:1,transparent:true,opacity:0.95});
  const f1=new THREE.Mesh(new THREE.ConeGeometry(0.10,0.30,9),fm); f1.position.set(0,0.32,0.25); g.add(f1);
  const f2=new THREE.Mesh(new THREE.ConeGeometry(0.055,0.18,9),
    new THREE.MeshStandardMaterial({color:0xFFE0A0,emissive:0xFFC24A,emissiveIntensity:2.0,roughness:1}));
  f2.position.set(0,0.28,0.25); g.add(f2);
  const lt=new THREE.PointLight(0xFF8A2A,1.5,6.5); lt.position.set(0,0.42,0.32); g.add(lt);
  g.userData.tick=t=>{
    const k=1+Math.sin(t*9+g.position.x*3)*0.15+Math.sin(t*21)*0.07;
    f1.scale.set(k,1+Math.sin(t*12+g.position.z)*0.2,k);
    f2.scale.set(1,1+Math.cos(t*15)*0.24,1);
    lt.intensity=1.25+Math.sin(t*17+g.position.x)*0.35;
  };
  return g;
}
function buildMagicDecor(W,H){
  MAGIC_TORCHES.length=0;
  // --- Mash'allar: 4 devor bo'ylab, balandligi ~2.1m ---
  const ty=2.1, inset=0.14;
  const spots=[
    [-W*0.26, ty, -W/2+inset, 0],           [W*0.26, ty, -W/2+inset, 0],
    [-W*0.26, ty,  W/2-inset, Math.PI],     [W*0.26, ty,  W/2-inset, Math.PI],
    [-W/2+inset, ty, -W*0.22,  Math.PI/2],  [-W/2+inset, ty, W*0.22,  Math.PI/2],
    [ W/2-inset, ty, -W*0.22, -Math.PI/2],  [ W/2-inset, ty, W*0.22, -Math.PI/2],
  ];
  spots.forEach(s=>{
    const t=mkTorch(); t.position.set(s[0],s[1],s[2]); t.rotation.y=s[3];
    shellGroup.add(t); MAGIC_TORCHES.push(t);
  });
  // --- Kamin: orqa devorga MAHKAM yopishgan (chap tomonda, deraza o'ng tomonda) ---
  const fx=-W*0.24, fz=-W/2+0.06;
  const ph=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.4,0.5),new THREE.MeshStandardMaterial({color:0x3A322C,roughness:0.95}));
  ph.position.set(fx,0.7,fz+0.25); shellGroup.add(ph);
  // kamin nuri (model yuklanmasa ham xona iliq qoladi)
  const fireLt=new THREE.PointLight(0xFF7A20,2.2,8); fireLt.position.set(fx,1.0,fz+0.6); shellGroup.add(fireLt);
  const fireHolder=new THREE.Group(); shellGroup.add(fireHolder);
  fireHolder.userData.tick=t=>{ fireLt.intensity=1.9+Math.sin(t*7)*0.35+Math.sin(t*19)*0.15; };
  MAGIC_TORCHES.push(fireHolder);
  if(window.__wdLoadModel) window.__wdLoadModel(FURNACE_GLB_URL,m=>{
    if(!m) return;
    try{ shellGroup.remove(ph); }catch(e){}
    // Balandligini ~1.9m ga moslash
    let bb=new THREE.Box3().setFromObject(m);
    const hgt=(bb.max.y-bb.min.y)||1;
    m.scale.multiplyScalar(1.9/hgt);
    // polga qo'yish + devorga MAHKAM yopishtirish (orqa qirrasi devorga tegsin)
    bb=new THREE.Box3().setFromObject(m);
    m.position.y-=bb.min.y;
    bb=new THREE.Box3().setFromObject(m);
    m.position.z+=(fz-bb.min.z)+0.02;   // orqa yuzasi devor tekisligiga
    m.position.x+=(fx-(bb.min.x+bb.max.x)/2);
    m.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
    fireHolder.add(m);
  },{});
}
/* Devor teksturasi — yumshoq vertikal gradient + nozik chiziqlar */
function mkRoomWallTex(c1,c2){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=256;
  const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,c1); g.addColorStop(1,c2);
  x.fillStyle=g; x.fillRect(0,0,256,256);
  x.strokeStyle='rgba(255,255,255,.05)'; x.lineWidth=1;
  for(let i=0;i<256;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,256); x.stroke(); }
  return new THREE.CanvasTexture(cv);
}
/* ===== MAGIC HEARTH mavzusi teksturalari — tosh qasr ===== */
function setWallTex(m,tex){ try{ if(m.material.map) m.material.map.dispose(); }catch(e){}
  m.material.map=tex||null; if(tex){ tex.colorSpace=THREE.SRGBColorSpace; } m.material.needsUpdate=true; }
function mkStoneWallTex(){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=512; const x=cv.getContext('2d');
  x.fillStyle='#2E2824'; x.fillRect(0,0,512,512); // malta (oraliq) — to'q
  const bw=128,bh=64;
  for(let r=0;r<512/bh+1;r++){ const off=(r%2)?bw/2:0;
    for(let c=-1;c<512/bw+1;c++){ const px=c*bw+off, py=r*bh;
      const g=104+Math.floor(Math.random()*44);
      x.fillStyle='rgb('+g+','+(g-9)+','+(g-19)+')'; x.fillRect(px+3,py+3,bw-6,bh-6);
      x.fillStyle='rgba(255,244,230,0.10)'; x.fillRect(px+3,py+3,bw-6,5);         // yuqori yorug'
      x.fillStyle='rgba(0,0,0,0.28)'; x.fillRect(px+3,py+bh-9,bw-6,6);            // past soya
      x.fillStyle='rgba(0,0,0,0.14)'; x.fillRect(px+bw-9,py+3,6,bh-6);           // o'ng soya
    }
  }
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function mkStoneFloorTex(){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=512; const x=cv.getContext('2d');
  x.fillStyle='#211C18'; x.fillRect(0,0,512,512); const s=128;
  for(let r=0;r<512/s;r++)for(let c=0;c<512/s;c++){
    const g=80+Math.floor(Math.random()*30);
    x.fillStyle='rgb('+g+','+(g-7)+','+(g-16)+')'; x.fillRect(c*s+4,r*s+4,s-8,s-8);
    x.fillStyle='rgba(255,240,225,0.07)'; x.fillRect(c*s+4,r*s+4,s-8,5);
    x.fillStyle='rgba(0,0,0,0.30)'; x.fillRect(c*s+4,r*s+s-10,s-8,6);
  }
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function mkStoneCeilTex(){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=256; const x=cv.getContext('2d');
  x.fillStyle='#1E1814'; x.fillRect(0,0,256,256);
  for(let i=0;i<44;i++){ const g=34+Math.floor(Math.random()*22);
    x.fillStyle='rgb('+g+','+(g-3)+','+(g-7)+')';
    x.fillRect(Math.random()*256,Math.random()*256,44+Math.random()*44,22+Math.random()*22); }
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t;
}

/* ---------- jihozlarni qayta qurish ---------- */
function disposeGroup(g){
  g.traverse(o=>{ try{
    if(o.geometry) o.geometry.dispose();
    if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.map)m.map.dispose(); m.dispose(); }); }
  }catch(e){} });
}
function rebuildItems(){
  if(itemsGroup){ rs.remove(itemsGroup); disposeGroup(itemsGroup); }
  window.__wdRoomMixers=[]; // eski model animatsiyalarini tozalaymiz
  itemsGroup=new THREE.Group();
  RCOLLIDERS.length=0; RSEATS.length=0; RPIANOS.length=0;
  // O'tiriladigan mebel turlari va o'tirish balandligi
  const SITTABLE={sofa:{camY:1.0,depth:0.35},chair:{camY:1.1,depth:0.25},chair2:{camY:1.05,depth:0.25},pouf:{camY:0.75,depth:0.2}};
  const ON_TOP=['book','cushion']; // mebel ustiga qo'yiladigan jihozlar
  rItemsData().forEach(it=>{
    if(ON_TOP.indexOf(it.id)>=0) return; // ustiga qo'yiladiganlarni pastda alohida ishlaymiz
    const b=BUILDERS[it.id]; if(!b) return;
    const m=b();
    const [x,z]=cellXZ(it.x,it.z);
    m.position.set(x,0,z);
    m.rotation.y=(it.r||0)*Math.PI/2;
    m.userData.item=true;
    m.userData.key=it.x+':'+it.z;
    itemsGroup.add(m);
    // Kollayder — jihozdan o'tib ketmaslik (kichik narsalar bundan mustasno)
    if(it.id!=='rug')
      RCOLLIDERS.push({minx:x-CELL*0.4,maxx:x+CELL*0.4,minz:z-CELL*0.4,maxz:z+CELL*0.4});
    // O'tiriladigan mebel — old tomonida o'tirish nuqtasi
    const S=SITTABLE[it.id];
    if(S){
      const ry=(it.r||0)*Math.PI/2;
      RSEATS.push({ x:x, z:z, sx:x, sz:z, camY:S.camY, yaw:ry+Math.PI, label:'O\'tirish' });
    }
    // Pianino — yaqinlashganda musiqa yoqiladigan nuqta
    if(it.id==='piano') RPIANOS.push({x:x,z:z});
  });
  // Kitob/yostiq — har biri ostidagi mebelning HAQIQIY ust balandligiga o'tiradi
  rItemsData().filter(it=>ON_TOP.indexOf(it.id)>=0).forEach(it=>{
    const [x,z]=cellXZ(it.x,it.z);
    const topMesh=BUILDERS[it.id]();
    topMesh.rotation.y=(it.r||0)*Math.PI/2;
    topMesh.userData.item=true;
    topMesh.userData.key=it.x+':'+it.z;
    // Ostidagi mebel meshini topamiz (o'sha katakdagi mebel)
    const hostMesh=itemsGroup.children.find(c=>c.userData.key===(it.x+':'+it.z));
    const hostItem=rItemsData().find(o=>o.x===it.x&&o.z===it.z&&ON_TOP.indexOf(o.id)<0);
    itemsGroup.add(topMesh);
    placeBookOnHost(topMesh, hostMesh, x, z, it.id, hostItem?hostItem.id:null);
  });
  rs.add(itemsGroup);
  updateSel();
}
/* Kitobni ostidagi mebelning haqiqiy ust balandligiga qo'yadi.
   Mebel .glb asinxron kelgani uchun, tayyor bo'lguncha qisqa kutamiz. */
function placeBookOnHost(topMesh, hostMesh, x, z, topId, hostId){
  let tries=0;
  const tryPlace=()=>{
    tries++;
    let topY;
    // Yostiq divan/kreslo O'TIRGICHiga tushadi (suyanchiq tepasiga emas).
    // Kitob esa parta/stol tekis ustiga tushadi.
    if(topId==='cushion'){
      // Yostiq mebel o'tirgichiga tushadi. Har mebelning o'tirgich balandligi
      // turiga qarab (sinalgan qiymatlar) — modeldan hisoblash ichiga botiradi.
      const SEAT_Y={sofa:0.5, chair:0.52, chair2:0.5, pouf:0.42};
      topY = SEAT_Y[hostId] != null ? SEAT_Y[hostId] : 0.48;
    }else{
      topY=0.76; // kitob uchun zaxira
      if(hostMesh){
        const bb=new THREE.Box3().setFromObject(hostMesh);
        if(isFinite(bb.max.y) && bb.max.y>0.05) topY=bb.max.y;
        else if(tries<30){ requestAnimationFrame(tryPlace); return; }
      }
    }
    topMesh.position.set(x, topY, z);
  };
  tryPlace();
}
/* ===== DEVOR JIHOZLARI ===== */
const WALL_ITEM_IDS=['tv','clock','neon']; // devorga ilinadigan jihozlar
function isWallItem(id){ return WALL_ITEM_IDS.indexOf(id)>=0; }
function rWallData(){
  const arr = rGuest ? (rGuest.wallItems||[]) : (R().wallItems||(R().wallItems=[]));
  return Array.isArray(arr)?arr:[];
}
// Devor bo'yicha joylashuv -> dunyo koordinatasi va burilish
function wallXform(wall,u,h){
  const S=ROOM_HALF-0.06; // devor yuzasidan biroz ichkarida
  const span=(GRID_N*CELL+1.4)-1.4; // devor bo'ylab foydali eni
  const t=(u-0.5)*span;
  if(wall==='back')  return {x:t, y:h, z:-S, ry:0};
  if(wall==='front') return {x:-t, y:h, z:S, ry:Math.PI};
  if(wall==='left')  return {x:-S, y:h, z:-t, ry:Math.PI/2};
  return {x:S, y:h, z:t, ry:-Math.PI/2}; // right
}
// Devor bosilgan nuqtani {wall,u,h} ga aylantiradi (wallXform teskarisi)
function wallHitToUH(hit){
  const span=(GRID_N*CELL+1.4)-1.4;
  const p=hit.point;
  // Qaysi devor ekanini bosilgan mesh orqali aniqlaymiz
  let wall='back';
  if(hit.object===wallBack) wall='back';
  else if(hit.object===wallFront) wall='front';
  else if(hit.object===wallLeft) wall='left';
  else if(hit.object===wallRight) wall='right';
  let t;
  if(wall==='back') t=p.x;
  else if(wall==='front') t=-p.x;
  else if(wall==='left') t=-p.z;
  else t=p.z;
  let u=t/span+0.5;
  u=Math.max(0.08,Math.min(0.92,u));         // chetga chiqmasin
  let h=Math.max(0.6,Math.min(ROOM_CEIL-0.4,p.y)); // pol/shiftga urilmasin
  return {wall,u,h};
}
function rebuildWallItems(){
  if(wallItemsGroup){ rs.remove(wallItemsGroup); disposeGroup(wallItemsGroup); }
  wallItemsGroup=new THREE.Group();
  rWallData().forEach((it,idx)=>{
    const b=WALL_BUILDERS[it.id]; if(!b) return;
    const m=b();
    const xf=wallXform(it.wall||'back', it.u==null?0.5:it.u, it.h==null?1.6:it.h);
    m.position.set(xf.x,xf.y,xf.z);
    m.rotation.y=xf.ry;
    m.userData={wallItem:true, widx:idx};
    wallItemsGroup.add(m);
  });
  rs.add(wallItemsGroup);
}
/* Devor jihoz meshlari — devorga yassi ilinadi (old tomoni +z lokal) */
function wTv(){
  const g=new THREE.Group();
  const frame=new THREE.Mesh(new THREE.BoxGeometry(1.15,0.68,0.05),mat(0x14161A,0.4,0.3));
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.05,0.58),new THREE.MeshBasicMaterial({map:tvScreenTex()}));
  scr.position.z=0.03;
  g.add(frame,scr);
  return g;
}
function tvScreenTex(){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=144;
  const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,256,144); g.addColorStop(0,'#1B4FCB'); g.addColorStop(1,'#6FA2FF');
  x.fillStyle=g; x.fillRect(0,0,256,144);
  x.fillStyle='rgba(255,255,255,.9)'; x.font='700 26px Inter,sans-serif'; x.textAlign='center';
  x.fillText('WordDrop TV',128,80);
  return new THREE.CanvasTexture(cv);
}
function wClock(){
  const g=new THREE.Group();
  // Placeholder — model kelguncha kichik doira
  const ph=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.04,24),mat(0xFFFFFF,0.4));
  ph.rotation.x=Math.PI/2; g.add(ph);
  if(window.__wdLoadModel) window.__wdLoadModel(CLOCK_GLB_URL,m=>{
    if(!m) return;
    g.remove(ph);
    // Soat diametrini ~0.5m ga (real devor soati o'lchami)
    let bb=new THREE.Box3().setFromObject(m);
    const dx=bb.max.x-bb.min.x, dy=bb.max.y-bb.min.y, dz=bb.max.z-bb.min.z;
    const face=Math.max(dx,dy)||1; // yuz o'lchami (eng katta ikki o'lcham)
    m.scale.multiplyScalar(0.5/face);
    // Markazini (0,0,0) ga keltiramiz — devorda markazlashib ossin
    bb=new THREE.Box3().setFromObject(m);
    const c=bb.getCenter(new THREE.Vector3());
    m.position.sub(c);
    // Soat yuzi Z o'qi bo'ylab (old) qarashi kerak. Agar model yuzi Y'ga qarasa
    // (yassi yotgan soat), uni tikka buramiz.
    if(dz < dx*0.4 && dz < dy*0.4){ /* yuz allaqachon Z'da — OK */ }
    else if(dy < dx*0.4 && dy < dz*0.4){ m.rotation.x=-Math.PI/2; } // yuz Y'da -> tikka
    g.add(m);
  },{});
  return g;
}
function wNeon(){
  const g=new THREE.Group();
  const nm=(rGuest?rGuest.name:(window.__wdName||'')).trim()||'WORDDROP';
  const panel=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.35,0.04),new THREE.MeshBasicMaterial({map:neonTex(nm)}));
  const frame=new THREE.Mesh(new THREE.BoxGeometry(0.76,0.41,0.03),mat(0x14151A,0.6,0.3)); frame.position.z=-0.01;
  const glow=new THREE.PointLight(0x22D3EE,0.5,1.4); glow.position.z=0.3;
  let base=0.5;
  g.userData.tick=t=>{ glow.intensity=base+Math.sin(t*3.5)*0.16+Math.random()*0.03; };
  g.add(frame,panel,glow);
  return g;
}
const WALL_BUILDERS={tv:wTv,clock:wClock,neon:wNeon};
function updateSel(){
  if(!selKey){ selRing.visible=false; RACT.style.display='none'; return; }
  const [ix,iz]=selKey.split(':').map(Number);
  const it=R().items.find(t=>t.x===ix&&t.z===iz);
  if(!it){ selKey=null; selRing.visible=false; RACT.style.display='none'; return; }
  const [x,z]=cellXZ(ix,iz);
  selRing.position.set(x,0.03,z); selRing.visible=true;
  RACT.style.display='flex';
  RACT.innerHTML=`<button id="roRot">${ROT_SVG} Burish</button><button id="roPick" class="rm">${PICK_SVG} Yig'ishtirish</button>`;
  document.getElementById('roRot').addEventListener('click',()=>{
    it.r=((it.r||0)+1)%4; rSave(); rebuildItems();
  });
  document.getElementById('roPick').addEventListener('click',()=>{
    const idx=R().items.indexOf(it);
    if(idx>=0) R().items.splice(idx,1);
    R().inv[it.id]=(R().inv[it.id]||0)+1;
    // Ustidagi narsalar (kitob/yostiq) ham birga qaytariladi
    if(it.id==='desk'||it.id==='ctable'||it.id==='pc'||it.id==='sofa'||it.id==='chair'||it.id==='chair2'||it.id==='pouf'){
      ['book','cushion'].forEach(tid=>{
        const tIdx=R().items.findIndex(o=>o.x===ix&&o.z===iz&&o.id===tid);
        if(tIdx>=0){ R().items.splice(tIdx,1); R().inv[tid]=(R().inv[tid]||0)+1; }
      });
    }
    selKey=null; rSave(); rebuildItems(); renderInv();
  });
}

/* ---------- inventar paneli ---------- */
function renderInv(){
  RCOIN.innerHTML=(window.__wdShopCoinSvg||'')+' '+(window.__wdCoins||0);
  const inv=R().inv, items=rItems();
  const chips=items.filter(it=>(inv[it.id]||0)>0).map(it=>`
    <button class="ro-chip ${placeId===it.id?'on':''}" data-id="${it.id}">
      ${it.ic}<b>${it.nm}</b><i>${inv[it.id]} ta</i>
    </button>`).join('');
  RINV.innerHTML=chips||`<div style="margin:0 auto;background:#fff;border-radius:13px;padding:10px 16px;font-size:11.5px;font-weight:700;color:#8B94A7;box-shadow:0 4px 14px rgba(0,0,0,.08)">Inventar bo'sh — do'kondan jihoz oling</div>`;
  RINV.querySelectorAll('.ro-chip').forEach(ch=>ch.addEventListener('click',()=>{
    placeId=(placeId===ch.dataset.id)?null:ch.dataset.id;
    selKey=null; updateSel(); renderInv();
    if(placeId) rHint(isWallItem(placeId)?"Devorning bo'sh joyini bosing":(placeId==='book'?"Parta yoki stol ustini bosing 📖":placeId==='cushion'?"Divan yoki kreslo ustini bosing 🤍":"Endi poldagi bo'sh katakni bosing"));
  }));
}

/* ---------- sahna ---------- */
function updCam(){
  if(roomMode==='view'){
    // First-person: fpPos da turib fpYaw/fpPitch bo'yicha qaraydi
    fpPitch=Math.max(-0.9,Math.min(0.55,fpPitch));
    rcam.position.set(fpPos.x,fpCamY,fpPos.z);
    rcam.rotation.order='YXZ';
    rcam.rotation.set(fpPitch,fpYaw,0);
    return;
  }
  // Tahrir rejimi: yuqoridan orbital
  const p=Math.min(1.25,Math.max(0.3,pitch));
  rcam.position.set(
    LOOK.x+DIST*Math.cos(p)*Math.sin(yaw),
    LOOK.y+DIST*Math.sin(p),
    LOOK.z+DIST*Math.cos(p)*Math.cos(yaw));
  rcam.lookAt(LOOK);
}
/* First-person to'qnashuv: devor va mebeldan o'tib ketmaslik */
function fpCollide(){
  const R=0.32, lim=ROOM_HALF-0.4;
  fpPos.x=Math.max(-lim,Math.min(lim,fpPos.x));
  fpPos.z=Math.max(-lim,Math.min(lim,fpPos.z));
  RCOLLIDERS.forEach(c=>{
    if(fpPos.x>c.minx-R && fpPos.x<c.maxx+R && fpPos.z>c.minz-R && fpPos.z<c.maxz+R){
      const dl=fpPos.x-(c.minx-R), dr=(c.maxx+R)-fpPos.x;
      const dn=fpPos.z-(c.minz-R), df=(c.maxz+R)-fpPos.z;
      const m=Math.min(dl,dr,dn,df);
      if(m===dl) fpPos.x=c.minx-R; else if(m===dr) fpPos.x=c.maxx+R;
      else if(m===dn) fpPos.z=c.minz-R; else fpPos.z=c.maxz+R;
    }
  });
}
// O'tirish / turish
function fpSit(seat){
  fpSeated=true;
  fpStandPos.set(fpPos.x,0,fpPos.z);
  fpSeatTarget.set(seat.sx,0,seat.sz);
  fpCamYTarget=seat.camY||1.05;
  fpYaw=seat.yaw!=null?seat.yaw:fpYaw;
  const sb=document.getElementById('roomSeat');
  if(sb){ sb.innerHTML='Turish'; }
}
function fpStand(){
  fpSeated=false; fpCamYTarget=1.7;
  fpPos.set(fpStandPos.x,fpPos.y,fpStandPos.z);
}
window.__wdFpStand=fpStand;
// Rejim almashtirish
function setRoomMode(m){
  roomMode=m;
  const showAll=(m==='view');
  if(wallFront) wallFront.visible=showAll;
  if(wallRight) wallRight.visible=showAll;
  if(roomCeil) roomCeil.visible=showAll;
  const walk=document.getElementById('roomWalk');
  if(m==='view'){
    // Xona markaziga yaqin, eshik oldida turgandek
    fpPos.set(0,1.7,ROOM_HALF-1.2); fpYaw=Math.PI; fpPitch=-0.02;
    fpCamY=1.7; fpCamYTarget=1.7; fpSeated=false;
    if(walk) walk.style.display='flex';
    RINV.style.display='none';
    if(RACT) RACT.style.display='none';
    selKey=null; placeId=null; if(selRing) selRing.visible=false;
  }else{
    if(walk) walk.style.display='none';
    const sb=document.getElementById('roomSeat'); if(sb) sb.style.display='none';
    if(!rGuest) RINV.style.display='flex';
  }
  const btn=document.getElementById('roomModeBtn');
  if(btn) btn.innerHTML = m==='view' ? MODE_EDIT_SVG : MODE_VIEW_SVG;
  updCam();
}
window.__wdSetRoomMode=setRoomMode;
const MODE_VIEW_SVG='<svg viewBox="0 0 24 24"><path d="M2 12 C4 7 8 5 12 5 C16 5 20 7 22 12 C20 17 16 19 12 19 C8 19 4 17 2 12 Z" fill="none"/><circle cx="12" cy="12" r="3" fill="none"/></svg>';
const MODE_EDIT_SVG='<svg viewBox="0 0 24 24"><path d="M4 20 l1-4 L15 6 l3 3 L8 19 Z M14 7 l3 3" fill="none"/></svg>';
function initRoom(){
  rr=new THREE.WebGLRenderer({canvas:RC,antialias:true});
  /* WebGL KONTEKST HIMOYASI (v90): brauzer xotira siqilganda yoki ilova uzoq
     ochiq turganda WebGL kontekstini majburan yopadi -> sahna oq/qora bo'lib
     qolardi va faqat ilovadan chiqib kirgach tiklanardi. Endi hodisa ushlanadi:
     foydalanuvchi xabardor qilinadi va kontekst qaytganda sahna qayta chiziladi. */
  try{
    RC.addEventListener('webglcontextlost',ev=>{
      ev.preventDefault();
      try{ if(typeof showToast==='function') showToast('Grafika vaqtincha to\u2019xtadi \u2014 tiklanmoqda\u2026',IC&&IC.info); }catch(e){}
    },false);
    RC.addEventListener('webglcontextrestored',()=>{
      try{ if(typeof buildShell==='function') buildShell(); if(typeof rebuildItems==='function') rebuildItems(); }catch(e){}
      try{ if(typeof showToast==='function') showToast('Grafika tiklandi',IC&&IC.info); }catch(e){}
    },false);
  }catch(e){}
  rr.setPixelRatio(Math.min(devicePixelRatio,2));
  rs=new THREE.Scene();
  rs.background=new THREE.Color(0xEDE6DA);
  rcam=new THREE.PerspectiveCamera(50,1,0.1,60);
  rAmb=new THREE.AmbientLight(0xFFFFFF,0.75); rs.add(rAmb);
  rSun=new THREE.DirectionalLight(0xFFF3DF,0.9); rSun.position.set(5,8,4); rs.add(rSun);
  rFill=new THREE.DirectionalLight(0xBFD4FF,0.35); rFill.position.set(-4,5,-3); rs.add(rFill);
  buildShell(); rebuildItems();
  // boshqaruv
  let dn=false,mx=0,my=0,moved=0;
  RC.addEventListener('pointerdown',e=>{ dn=true; moved=0; mx=e.clientX; my=e.clientY; });
  RC.addEventListener('pointermove',e=>{
    if(!dn) return;
    const dx=e.clientX-mx, dy=e.clientY-my; mx=e.clientX; my=e.clientY;
    moved+=Math.abs(dx)+Math.abs(dy);
    if(roomMode==='view'){
      // First-person: atrofga qarab aylanish
      fpYaw-=dx*0.005; fpPitch-=dy*0.004; updCam();
    }else{
      yaw-=dx*0.0075; yaw=Math.min(Math.PI*0.72,Math.max(-0.15,yaw));
      pitch+=dy*0.005; updCam();
    }
  });
  RC.addEventListener('pointerup',e=>{
    dn=false;
    if(moved>9) return;
    // View rejim: faqat jonli jihozga (to'tiqush) tegish mumkin, joylashtirish yo'q
    if(roomMode==='view'){
      rv2.x=(e.clientX/innerWidth)*2-1; rv2.y=-(e.clientY/innerHeight)*2+1;
      rray.setFromCamera(rv2,rcam);
      const hv=rray.intersectObjects(itemsGroup.children,true)[0];
      if(hv){ let o=hv.object; while(o&&!o.userData.item) o=o.parent;
        if(o&&o.userData.onTap){ try{ o.userData.onTap(); }catch(err){} } }
      return;
    }
    if(rGuest) return; // mehmon edit rejimida o'zgartira olmaydi
    rv2.x=(e.clientX/innerWidth)*2-1; rv2.y=-(e.clientY/innerHeight)*2+1;
    rray.setFromCamera(rv2,rcam);
    // DEVOR JIHOZI joylashtirish: soat/tv/neon tanlangan bo'lsa, devorni bosib osamiz
    if(placeId && isWallItem(placeId)){
      const walls=[wallBack,wallLeft,wallFront,wallRight].filter(Boolean);
      const hitW=rray.intersectObjects(walls,false)[0];
      if(hitW){
        const info=wallHitToUH(hitW);
        if(info){
          R().wallItems=R().wallItems||[];
          R().wallItems.push({id:placeId, wall:info.wall, u:info.u, h:info.h});
          R().inv[placeId]--;
          if(R().inv[placeId]<=0){ delete R().inv[placeId]; placeId=null; }
          rSave(); rebuildWallItems(); renderInv();
          rHint("Devorga osildi");
        }
      }else{
        rHint("Devorning bo'sh joyini bosing");
      }
      return;
    }
    if(!placeId){
      const hitI=rray.intersectObjects(itemsGroup.children,true)[0];
      if(hitI){
        let o=hitI.object; while(o&&!o.userData.item) o=o.parent;
        if(o){
          if(o.userData.onTap){ try{ o.userData.onTap(); }catch(err){} }
          selKey=o.userData.key; updateSel(); renderInv(); return;
        }
      }
    }
    // Katakni aniqlash: avval jismdan (parta usti), bo'lmasa poldan
    let ix,iz,got=false;
    if(placeId){
      const hitAny=rray.intersectObjects(itemsGroup.children,true)[0];
      if(hitAny){
        let o=hitAny.object; while(o&&o.userData.key==null) o=o.parent;
        if(o&&o.userData.key!=null){ const p=o.userData.key.split(':').map(Number); ix=p[0]; iz=p[1]; got=true; }
      }
    }
    if(!got){
      const hitF=rray.intersectObject(floorMesh)[0];
      if(hitF){ ix=Math.round((hitF.point.x+GOFF)/CELL); iz=Math.round((hitF.point.z+GOFF)/CELL); got=true; }
    }
    if(got){
      if(ix<0||ix>=GRID_N||iz<0||iz>=GRID_N) return;
      if(placeId){
        // Kitob maxsus: faqat bo'sh parta/stol ustiga qo'yiladi (har partaga bitta)
        if(placeId==='book'){
          const host=R().items.find(o=>o.x===ix&&o.z===iz&&(o.id==='desk'||o.id==='ctable'||o.id==='pc'));
          if(!host){ rHint("Kitobni parta yoki stol ustiga qo'ying"); return; }
          if(R().items.some(o=>o.x===ix&&o.z===iz&&o.id==='book')){ rHint("Bu partada allaqachon kitob bor"); return; }
          R().items.push({id:'book',x:ix,z:iz,r:0});
          R().inv['book']--;
          if(R().inv['book']<=0){ delete R().inv['book']; placeId=null; }
          rSave(); rebuildItems(); renderInv();
          rHint("Kitob partaga qo'yildi");
          return;
        }
        // Yostiq divan/kreslo ustiga qo'yiladi (har mebelga bitta)
        if(placeId==='cushion'){
          const host=R().items.find(o=>o.x===ix&&o.z===iz&&(o.id==='sofa'||o.id==='chair'||o.id==='chair2'||o.id==='pouf'));
          if(!host){ rHint("Yostiqni divan yoki kreslo ustiga qo'ying"); return; }
          if(R().items.some(o=>o.x===ix&&o.z===iz&&o.id==='cushion')){ rHint("Bu mebelda allaqachon yostiq bor"); return; }
          R().items.push({id:'cushion',x:ix,z:iz,r:0});
          R().inv['cushion']--;
          if(R().inv['cushion']<=0){ delete R().inv['cushion']; placeId=null; }
          rSave(); rebuildItems(); renderInv();
          rHint("Yostiq qo'yildi");
          return;
        }
        if(occupied(ix,iz)){ rHint("Bu katak band"); return; }
        R().items.push({id:placeId,x:ix,z:iz,r:0});
        R().inv[placeId]--;
        if(R().inv[placeId]<=0){ delete R().inv[placeId]; placeId=null; }
        rSave(); rebuildItems(); renderInv();
      }else if(selKey){ selKey=null; updateSel(); }
    }
  });
  onRoomResize();
  rInited=true;
}
function onRoomResize(){
  if(!rr) return;
  rr.setSize(innerWidth,innerHeight,false);
  rcam.aspect=innerWidth/innerHeight; rcam.updateProjectionMatrix(); updCam();
}
addEventListener('resize',()=>{ if(!RO.hidden) onRoomResize(); });
const rClock=new THREE.Clock();
let __rPrevT=0;
function roomTick(){
  rAnim=requestAnimationFrame(roomTick);
  // Sahifa fonda bo'lsa GPU'ni yuklamaymiz (WebGL konteksti yo'qolishining
  // asosiy sababi shu edi: telefonda boshqa ilovaga o'tganda ham 3D ishlab
  // turardi -> xotira siqilib, brauzer kontekstni yopib qo'yardi).
  if(document.hidden) return;
  const t=rClock.getElapsedTime();
  const dt=Math.min(Math.max(t-__rPrevT,0),0.05); __rPrevT=t;
  if(itemsGroup) itemsGroup.children.forEach(c=>{ if(c.userData.tick) c.userData.tick(t); });
  if(wallItemsGroup) wallItemsGroup.children.forEach(c=>{ if(c.userData.tick) c.userData.tick(t); });
  if(typeof MAGIC_TORCHES!=='undefined') MAGIC_TORCHES.forEach(c=>{ if(c.userData&&c.userData.tick) c.userData.tick(t); });
  // GLB model animatsiyalari (gaming setup kabi)
  if(window.__wdRoomMixers) window.__wdRoomMixers.forEach(mx=>{ try{ mx.update(dt); }catch(e){} });
  // First-person yurish (faqat view rejimda)
  if(roomMode==='view'){
    fpCamY+=(fpCamYTarget-fpCamY)*Math.min(1,dt*6);
    if(fpSeated){
      // O'rindiqqa silliq cho'kish
      fpPos.x+=(fpSeatTarget.x-fpPos.x)*Math.min(1,dt*6);
      fpPos.z+=(fpSeatTarget.z-fpPos.z)*Math.min(1,dt*6);
    }else{
      const dir=(fpFwd?1:0)-(fpBack?1:0);
      if(dir!==0){
        fpPos.x+=-Math.sin(fpYaw)*dir*dt*2.8;
        fpPos.z+=-Math.cos(fpYaw)*dir*dt*2.8;
        fpCollide();
      }
    }
    updCam();
    updateSeatButton();
  }
  if(rainCtx && (Math.floor(t*20)%2===0)) updRain();
  rr.render(rs,rcam);
}
// Yaqin o'rindiqni topib, "O'tirish/Turish" tugmasini boshqaradi
function updateSeatButton(){
  const sb=document.getElementById('roomSeat');
  if(!sb) return;
  // Pianino — yaqinlashganda "Chalish/To'xtatish" (o'tirishdan ustun)
  let nearPiano=null, pd=1.7;
  RPIANOS.forEach(p=>{ const d=Math.hypot(fpPos.x-p.x,fpPos.z-p.z); if(d<pd){ pd=d; nearPiano=p; } });
  if(nearPiano && !fpSeated){
    sb.style.display='flex';
    const playing=__pianoAudio && !__pianoAudio.paused;
    sb.innerHTML=playing?'To\'xtatish':'Chalish';
    sb.__piano=nearPiano; sb.__seat=null;
    return;
  }
  sb.__piano=null;
  if(fpSeated){ sb.style.display='flex'; return; }
  let near=null, bd=1.6;
  RSEATS.forEach(s=>{ const d=Math.hypot(fpPos.x-s.x,fpPos.z-s.z); if(d<bd){ bd=d; near=s; } });
  if(near){
    sb.style.display='flex';
    sb.innerHTML=(near.label||'O\'tirish');
    sb.__seat=near;
  }else{ sb.style.display='none'; sb.__seat=null; }
}
// Pianino musiqasini yoqish/o'chirish
function pianoToggle(){
  if(!__pianoAudio){
    __pianoAudio=new Audio(PIANO_AUDIO_URL);
    __pianoAudio.loop=true;
    __pianoAudio.volume=0.7;
  }
  if(__pianoAudio.paused){
    __pianoAudio.play().then(()=>{ rHint("Pianino chalinmoqda"); })
      .catch(()=>{ rHint("Audio yuklanmadi"); });
  }else{
    __pianoAudio.pause();
    rHint("To'xtatildi");
  }
}
window.__wdPianoToggle=pianoToggle;
// Xonadan chiqqanda musiqani to'xtatamiz
function pianoStop(){ if(__pianoAudio){ try{ __pianoAudio.pause(); }catch(e){} } }
window.__wdPianoStop=pianoStop;

/* ---------- ochish/yopish ---------- */
function roomShow(){
  RO.hidden=false;
  try{ history.pushState({wdRoom:true},'','#room'); }catch(e){}
  if(!rInited) initRoom(); else { rebuildItems(); rebuildWallItems(); onRoomResize(); }
  placeId=null; selKey=null; updateSel();
  if(!rAnim) roomTick();
}
window.__wdOpenRoom=function(){
  if(!window.__wdRoom||!window.__wdRoom.owned){
    try{ showToast("Avval do'kondan xona sotib oling",IC.info); }catch(e){}
    return;
  }
  rGuest=null;
  window.__wdVersion='v113';   // ichki versiya markeri (UI'da ko'rsatilmaydi)
  document.getElementById('roomTitle').textContent='Mening xonam';
  document.getElementById('roomShare').style.display='flex';
  document.getElementById('roomDeco').style.display='flex';
  document.getElementById('roomBook').style.display='flex';
  document.getElementById('roomSign').style.display='none';
  document.getElementById('roomModeBtn').style.display='flex';
  RINV.style.display='flex';
  roomShow(); renderInv(); applyDecor();
  setRoomMode('edit');
  try{ if(window.__wdRoomSync) window.__wdRoomSync(); }catch(e){}
  rHint("Ko'z tugmasi bilan xonaga kiring · yoki jihoz joylashtiring",3600);
};
window.__wdVisitRoom=function(data){
  rGuest={name:data.name||"Do'st", items:Array.isArray(data.items)?data.items:[], wallItems:Array.isArray(data.wallItems)?data.wallItems:[], stats:data.stats||{}, code:data.code||''};
  document.getElementById('roomTitle').textContent=rGuest.name+"ning xonasi";
  document.getElementById('roomShare').style.display='none';
  document.getElementById('roomDeco').style.display='none';
  document.getElementById('roomBook').style.display='none';
  document.getElementById('roomSign').style.display=rGuest.code?'flex':'none';
  document.getElementById('roomModeBtn').style.display='flex';
  RINV.style.display='none'; RACT.style.display='none';
  roomShow(); applyDecor();
  setRoomMode('view'); // mehmon ichkaridan ko'radi
  rHint("Xona ichidasiz — ekranni surib atrofga qarang, imzo qoldiring",3400);
};
document.getElementById('roomDeco').addEventListener('click',()=>{
  if(rGuest) return;
  const inv=(window.__wdRoom&&window.__wdRoom.inv)||{};
  const views=[['day','Kunduz',true],['view_city','Shahar kechasi',!!inv.view_city],['view_sea','Dengiz',!!inv.view_sea],['view_mount',"Tog'lar",!!inv.view_mount],['view_rain',"Yomg'ir",!!inv.view_rain]];
  const cur=rDeco();
  const layer=openSheet(`<h2>Xona ko'rinishi</h2>
    <p class="desc">Deraza manzarasi va yorug'lik. Yangi manzaralar do'konda.</p>
    ${views.map(v=>`<button class="btn btn-block deco-v" data-v="${v[0]}" ${v[2]?'':'disabled'} style="margin-top:8px;${(cur.view||'day')===(v[0]==='day'?'day':v[0].replace('view_',''))?'outline:2px solid var(--b6)':''}">${v[1]}${v[2]?'':' 🔒'}</button>`).join('')}
    ${inv.night?`<label class="du-chkrow" style="margin-top:12px"><input type="checkbox" id="decoNight" ${cur.night?'checked':''}><span>Tun rejimi ◐</span></label>`:''}
    ${inv.theme_magic?`
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--b3)">
        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:10px">Xona mavzusi</div>
        <button class="btn btn-block theme-pick" data-th="" style="display:flex;align-items:center;gap:12px;text-align:left;padding:12px;${!cur.theme?'outline:2px solid var(--b6)':''}">
          <span style="width:44px;height:44px;border-radius:10px;flex:none;background:linear-gradient(145deg,#EDE6DA,#D2C6E8);border:1px solid rgba(0,0,0,.12)"></span>
          <span style="flex:1"><b style="display:block">Oddiy xona</b><small style="opacity:.7">Asl ko'rinish</small></span>
          ${!cur.theme?'<span style="color:var(--b6);font-size:18px">✓</span>':''}
        </button>
        <button class="btn btn-block theme-pick" data-th="magic" style="display:flex;align-items:center;gap:12px;text-align:left;padding:12px;margin-top:10px;${cur.theme==='magic'?'outline:2px solid #FF8A2A':''}">
          <span style="width:44px;height:44px;border-radius:10px;flex:none;background:radial-gradient(circle at 50% 78%,#FFB74A,#7A2E12 55%,#140D07);border:1px solid rgba(255,138,42,.5);box-shadow:0 0 14px rgba(255,138,42,.4) inset"></span>
          <span style="flex:1"><b style="display:block">Magic Hearth ✨</b><small style="opacity:.7">Tosh qasr · mash'allar · kamin</small></span>
          ${cur.theme==='magic'?'<span style="color:#FF8A2A;font-size:18px">✓</span>':''}
        </button>
      </div>`:''}`);
  layer.querySelectorAll('.deco-v').forEach(b=>b.addEventListener('click',()=>{
    const v=b.dataset.v;
    window.__wdRoom.deco=window.__wdRoom.deco||{};
    window.__wdRoom.deco.view=(v==='day')?'day':v.replace('view_','');
    rSave(); applyDecor(); closeSheet();
  }));
  const nt=layer.querySelector('#decoNight');
  if(nt) nt.addEventListener('change',()=>{
    window.__wdRoom.deco=window.__wdRoom.deco||{};
    window.__wdRoom.deco.night=nt.checked;
    rSave(); applyDecor();
  });
  layer.querySelectorAll('.theme-pick').forEach(b=>b.addEventListener('click',()=>{
    window.__wdRoom.deco=window.__wdRoom.deco||{};
    window.__wdRoom.deco.theme=b.dataset.th||null;
    rSave(); buildShell(); rebuildItems(); closeSheet();
    rHint(b.dataset.th==='magic'?"Magic Hearth yoqildi ✨":"Oddiy xona qaytarildi",2600);
  }));
});
document.getElementById('roomShare').addEventListener('click',()=>{
  if(window.__wdRoomShareSheet) window.__wdRoomShareSheet();
});
document.getElementById('roomBook').addEventListener('click',()=>{
  if(rGuest) return;
  if(window.__wdGuestbookViewSheet) window.__wdGuestbookViewSheet();
});
document.getElementById('roomSign').addEventListener('click',()=>{
  if(!rGuest||!rGuest.code) return;
  if(window.__wdGuestSignSheet) window.__wdGuestSignSheet(rGuest.code, rGuest.name);
});
function closeRoom(){
  if(rAnim){ cancelAnimationFrame(rAnim); rAnim=0; }
  try{ pianoStop(); }catch(e){} // musiqa to'xtasin
  rGuest=null;
  RO.hidden=true;
  try{ if(history.state&&history.state.wdRoom) history.back(); }catch(e){}
  try{ renderHome(); }catch(e){}
}
document.getElementById('roomBack').addEventListener('click',closeRoom);
document.getElementById('roomModeBtn').addEventListener('click',()=>{
  setRoomMode(roomMode==='view'?'edit':'view');
  rHint(roomMode==='view'?"Tugmalar bilan yuring · ekranni surib qarang":"Tahrir rejimi — jihoz joylashtiring",2800);
});
// First-person yurish tugmalari (bosib turiladi)
(function(){
  function hold(id,set){
    const b=document.getElementById(id); if(!b) return;
    const on=e=>{ e.preventDefault(); set(true); b.classList.add('hold'); };
    const off=()=>{ set(false); b.classList.remove('hold'); };
    b.addEventListener('pointerdown',on);
    b.addEventListener('pointerup',off);
    b.addEventListener('pointerleave',off);
    b.addEventListener('pointercancel',off);
  }
  hold('rWalkFwd',v=>fpFwd=v);
  hold('rWalkBack',v=>fpBack=v);
  const seat=document.getElementById('roomSeat');
  if(seat) seat.addEventListener('click',()=>{
    if(seat.__piano){ pianoToggle(); return; }
    if(fpSeated){ fpStand(); seat.innerHTML='O\'tirish'; }
    else if(seat.__seat){ fpSit(seat.__seat); }
  });
})();
addEventListener('popstate',()=>{
  if(!RO.hidden){
    if(rAnim){ cancelAnimationFrame(rAnim); rAnim=0; }
    rGuest=null;
    RO.hidden=true;
    try{ renderHome(); }catch(e){}
  }
});
