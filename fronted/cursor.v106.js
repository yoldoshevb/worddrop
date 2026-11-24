/* WordDrop v106 — kompyuter uchun maxsus kursor.
   Sichqoncha uchida kichik tomchi, ortidan yumshoq ergashuvchi halqa. Tugma/havola ustida halqa
   kattalashadi, bosilganda tomchi sachragandek to'lqin tarqaladi. Matn maydonlarida oddiy yozuv
   kursori qoladi. Faqat sichqonchali qurilmalarda (hover + aniq ko'rsatkich) ishlaydi.
   Harakat faqat transform orqali — sahifa og'ir bo'lsa ham silliq. */
(function(){
  'use strict';
  if(window.__wdCursor) return; window.__wdCursor=true;
  var mq=window.matchMedia&&matchMedia('(hover: hover) and (pointer: fine)');
  if(!mq||!mq.matches) return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOT='a,button,[role="button"],[role="tab"],[role="radio"],[role="switch"],label,select,summary,.card,[onclick],[data-go],[tabindex]:not([tabindex="-1"])';
  var TEXT='input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="color"]):not([type="file"]),textarea,[contenteditable=""],[contenteditable="true"]';
  var css=
    'html.wdc,html.wdc *{cursor:none!important}'+
    'html.wdc '+TEXT.split(',').join(',html.wdc ')+'{cursor:text!important}'+
    'html.wdc canvas{cursor:none!important}'+
    '.wdc-dot,.wdc-ring,.wdc-rip{position:fixed;left:0;top:0;pointer-events:none;z-index:2147483646;will-change:transform,opacity}'+
    '.wdc-dot{width:14px;height:18px;margin:-12px 0 0 -7px;opacity:0;transition:opacity .2s}'+
    '.wdc-dot svg{display:block;width:100%;height:100%;overflow:visible;transition:transform .18s cubic-bezier(.3,1.4,.5,1)}'+
    '.wdc-ring{width:38px;height:38px;margin:-19px 0 0 -19px;opacity:0;transition:opacity .25s}'+
    '.wdc-ring i{position:absolute;inset:0;border-radius:50%;border:1.6px solid rgba(47,111,237,.65);background:rgba(47,111,237,0);box-shadow:0 0 0 1px rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.35);'+
      'transition:transform .28s cubic-bezier(.3,1.3,.5,1),background-color .2s,border-color .2s}'+
    'html.wdc-on .wdc-dot,html.wdc-on .wdc-ring{opacity:1}'+
    'html.wdc-hot .wdc-ring i{transform:scale(1.55);background:rgba(47,111,237,.1);border-color:rgba(47,111,237,.35)}'+
    'html.wdc-hot .wdc-dot svg{transform:scale(.85)}'+
    'html.wdc-hot .wdc-dot path{fill:#fff;stroke:#2F6FED}html.wdc-hot .wdc-dot ellipse{fill:#2F6FED;opacity:.5}'+
    '.wdc-dot path,.wdc-dot ellipse{transition:fill .15s,stroke .15s}'+
    'html.wdc-down .wdc-ring i{transform:scale(.78)}'+
    'html.wdc-down.wdc-hot .wdc-ring i{transform:scale(1.25)}'+
    'html.wdc-text .wdc-dot,html.wdc-text .wdc-ring{opacity:0!important}'+
    '.wdc-rip{width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid rgba(47,111,237,.55);animation:wdcRip .55s cubic-bezier(.2,.7,.3,1) forwards}'+
    '@keyframes wdcRip{from{transform:var(--p) scale(.4);opacity:1}to{transform:var(--p) scale(4.2);opacity:0}}'+
    'body.dark .wdc-ring i,.wd-boot-dark .wdc-ring i{border-color:rgba(126,164,255,.7)}';
  var DROP='<svg viewBox="0 0 14 18"><path d="M7 1.2C9.6 4.6 12.2 7.6 12.2 10.9A5.2 5.2 0 0 1 1.8 10.9C1.8 7.6 4.4 4.6 7 1.2Z" fill="#2F6FED" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="5.2" cy="9.6" rx="1.1" ry="1.7" fill="#fff" opacity=".75" transform="rotate(-18 5.2 9.6)"/></svg>';
  function init(){
    var st=document.createElement('style'); st.id='wdcCss'; st.textContent=css; document.head.appendChild(st);
    var dot=document.createElement('div'); dot.className='wdc-dot'; dot.innerHTML=DROP;
    var ring=document.createElement('div'); ring.className='wdc-ring'; ring.innerHTML='<i></i>';
    document.body.appendChild(ring); document.body.appendChild(dot);
    var H=document.documentElement; H.classList.add('wdc');
    var mx=-100,my=-100,rx=-100,ry=-100,raf=0,seen=false;
    function loop(){
      // halqa sichqonchaga yumshoq yetib oladi (kadr tezligiga bog'liq emas)
      var k=reduce?1:0.2; rx+=(mx-rx)*k; ry+=(my-ry)*k;
      ring.style.transform='translate3d('+rx+'px,'+ry+'px,0)';
      if(Math.abs(mx-rx)>.1||Math.abs(my-ry)>.1) raf=requestAnimationFrame(loop); else raf=0;
    }
    function kick(){ if(!raf) raf=requestAnimationFrame(loop); }
    document.addEventListener('mousemove',function(e){
      mx=e.clientX; my=e.clientY;
      dot.style.transform='translate3d('+mx+'px,'+my+'px,0)';
      if(!seen){ seen=true; rx=mx; ry=my; H.classList.add('wdc-on'); }
      kick();
    },{passive:true});
    document.addEventListener('mouseover',function(e){
      var t=e.target; if(!t||!t.closest) return;
      var txt=!!t.closest(TEXT), hot=!txt&&!!t.closest(HOT);
      H.classList.toggle('wdc-text',txt); H.classList.toggle('wdc-hot',hot);
    },{passive:true});
    document.addEventListener('mousedown',function(e){
      H.classList.add('wdc-down');
      if(reduce||H.classList.contains('wdc-text')) return;
      var r=document.createElement('div'); r.className='wdc-rip';
      r.style.setProperty('--p','translate3d('+e.clientX+'px,'+e.clientY+'px,0)');
      document.body.appendChild(r); setTimeout(function(){ r.remove(); },600);
    },{passive:true});
    document.addEventListener('mouseup',function(){ H.classList.remove('wdc-down'); },{passive:true});
    document.documentElement.addEventListener('mouseleave',function(){ H.classList.remove('wdc-on'); seen=false; });
    window.addEventListener('blur',function(){ H.classList.remove('wdc-on'); seen=false; });
    // 3D o'yin sichqonchani "qulflasa" — maxsus kursor yashiriladi
    document.addEventListener('pointerlockchange',function(){ H.classList.toggle('wdc-text',!!document.pointerLockElement); });
    // Sensorli ekranga o'tilsa (planshet + sichqoncha) — oddiy kursorga qaytamiz
    document.addEventListener('touchstart',function(){ H.classList.remove('wdc','wdc-on'); dot.remove(); ring.remove(); },{once:true,passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
