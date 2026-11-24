
/* Ichki versiya belgisi — foydalanuvchiga ko'rinmaydi.
   Brauzer konsolida tekshirish: window.__wdVer  */
window.__wdVer='v108';
/* v95: Telegram bot (@WordDropUzBot) — ulash, Kanal studiyasi; eslab qolish usuli; ko'k topshiriqlar; onboarding qayta yoqildi */
/* v94: Drop AI — suhbat sherigi, rasmdan so'z, kitobcha studiyasi (drop-pro), kunlik limit 20 */
/* v93: Xotira markazi (FSRS SRS) + Kunlik/Haftalik vazifalar va sandiqlar + Story kartalari */  /* v92: Nutq tuzatildi — Speaking takror/vaqt + Studio mikrofon qotib qolishi */

/* ========== SVG IKONKALAR ========== */
const IC = {
  lock:`<svg viewBox="0 0 24 24" class="ic"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11 V7.5 C8 5 9.8 3.2 12 3.2 C14.2 3.2 16 5 16 7.5 V11"/></svg>`,
  check:`<svg viewBox="0 0 24 24" class="ic"><path d="M5 13 L9.5 17.5 L19 6.5"/></svg>`,
  cross:`<svg viewBox="0 0 24 24" class="ic"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>`,
  star:`<svg viewBox="0 0 24 24"><path d="M12 3 L14.6 9.2 L21.3 9.8 L16.2 14.1 L17.8 20.7 L12 17.1 L6.2 20.7 L7.8 14.1 L2.7 9.8 L9.4 9.2 Z"/></svg>`,
  info:`<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="12" r="9"/><path d="M12 11 V16.5 M12 7.6 V7.7"/></svg>`,
  flame:`<svg viewBox="0 0 24 24" class="ic"><path d="M12 3 C10 6 7 8 7 12.5 C7 16.6 9.6 19.5 12 19.5 C14.4 19.5 17 16.6 17 12.5 C17 11 16.4 10 15.6 9 C15.6 11 14.4 12 13.4 11.3 C14 9 13 6 12 3 Z"/></svg>`,
  book:`<svg viewBox="0 0 24 24" class="ic"><path d="M5 4.5 C7 3.4 10 3.4 12 4.5 C14 3.4 17 3.4 19 4.5 V18 C17 16.9 14 16.9 12 18 C10 16.9 7 16.9 5 18 Z"/><path d="M12 4.5 V18"/></svg>`,
  trophy:`<svg viewBox="0 0 24 24" class="ic"><path d="M7 4 H17 V9 C17 12 14.8 14 12 14 C9.2 14 7 12 7 9 Z"/><path d="M7 5 H4 V7 C4 9 5.5 10.3 7 10.3"/><path d="M17 5 H20 V7 C20 9 18.5 10.3 17 10.3"/><path d="M12 14 V17.5 M9 20 H15 M9.5 17.5 H14.5 L15 20 H9 Z"/></svg>`,
  chevR:`<svg viewBox="0 0 24 24" class="ic"><path d="M9 5 L16 12 L9 19"/></svg>`,
  close:`<svg viewBox="0 0 24 24" class="ic"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>`,
  dl:`<svg viewBox="0 0 24 24" class="ic"><path d="M12 3 V15 M7 10 L12 15 L17 10"/><path d="M3 18 H21 V20 H3 Z"/></svg>`,
  brain:`<svg viewBox="0 0 24 24" class="ic"><path d="M9.5 3 C7 3 5 5 5 7.5 C3.3 8 2 9.5 2 11.5 C2 13.8 3.8 15.5 6 15.5 C6.3 16.8 7.4 17.8 8.7 18 C8.9 19.6 10.3 21 12 21 C13.7 21 15.1 19.6 15.3 18 C16.6 17.8 17.7 16.8 18 15.5 C20.2 15.5 22 13.8 22 11.5 C22 9.5 20.7 8 19 7.5 C19 5 17 3 14.5 3 C13.2 3 12 3.6 11.2 4.5 C10.7 3.6 10.1 3 9.5 3 Z"/></svg>`,
  sound:`<svg viewBox="0 0 24 24" class="ic"><path d="M4 9.5 H7.5 L12.5 5 V19 L7.5 14.5 H4 Z"/><path d="M16 8.5 C17.2 9.7 17.2 14.3 16 15.5 M18.5 6 C21 8.5 21 15.5 18.5 18"/></svg>`,
  globe:`<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="12" r="9"/><path d="M3 12 H21 M12 3 C9 6.5 9 17.5 12 21 M12 3 C15 6.5 15 17.5 12 21"/></svg>`,
  about:`<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="12" r="9"/><path d="M12 8.3 V8.4 M12 11.2 V16"/></svg>`,
  bell:`<svg viewBox="0 0 24 24" class="ic"><path d="M6 10 C6 6.5 8.5 4 12 4 C15.5 4 18 6.5 18 10 C18 14 19 15.5 19.5 16.3 H4.5 C5 15.5 6 14 6 10 Z"/><path d="M10 19 C10 20.1 10.9 21 12 21 C13.1 21 14 20.1 14 19"/></svg>`,
  spk:`<svg viewBox="0 0 24 24" class="ic"><path d="M4 9.5 H7.5 L12.5 5 V19 L7.5 14.5 H4 Z"/><path d="M16 8.5 C17.2 9.7 17.2 14.3 16 15.5"/></svg>`,
  medal:`<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="14" r="6"/><path d="M9 8.5 L6.5 3 H10 L12 7 M15 8.5 L17.5 3 H14 L12 7"/><path d="M12 11.5 L13 13.5 L15 13.8 L13.5 15.2 L14 17.2 L12 16.2 L10 17.2 L10.5 15.2 L9 13.8 L11 13.5 Z"/></svg>`,
  bolt:`<svg viewBox="0 0 24 24" class="ic"><path d="M13 3 L5 13 H11 L10 21 L18 10 H12 Z"/></svg>`,
  target:`<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" class="ic"><path d="M20 14 A8 8 0 1 1 10 4 A6.5 6.5 0 0 0 20 14 Z"/></svg>`,
};

/* ========== AI TEKSHIRUV — endi Supabase Edge Function orqali (Gemini, bepul) ========== */
// MUHIM: quyidagi qiymatlar OCHIQ/PUBLIC (publishable) — bular maxfiy emas.
// Haqiqiy Gemini API kaliti Supabase serverida (Secrets) yashiringan.
const SUPABASE_FUNCTION_URL = 'https://jgeycbyaoiybpudakgmk.supabase.co/functions/v1/check-sentence';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_b_6vafUIGzOO9xJmFv2t9g_sQD3kQ1J';

/* Umumiy AI so'rov yuboruvchi — barcha rejimlar (check/examples/story...) shuni ishlatadi.

   2026-08-21 TUZATISH — nima uchun bu yerda timeout va qayta urinish bor:
   16-avgustda Groq `llama-3.3-70b-versatile` modelini o'chirdi va serverdagi
   AI butunlay javob bermay qoldi. Frontend esa hech qanday timeout qo'ymagani
   uchun foydalanuvchi soatlab "Tekshirilmoqda..." holatida qolib ketardi.
   Endi:
     - har so'rovga TIMEOUT qo'yiladi (AbortController) — muzlab qolmaydi;
     - vaqtinchalik xatolarda (429 limit / 502 / 503 / tarmoq) bir marta
       avtomatik qayta uriniladi;
     - xato turi aniqlanadi (`kind`), shuning uchun foydalanuvchiga to'g'ri
       xabar ko'rsatish mumkin — "internet yo'q" bilan "server yangilanmagan"
       bir xil emas.
*/
const AI_TIMEOUT_MS = 45000;   // 45s — IELTS matn tuzish ham shuncha vaqt olishi mumkin

function __wdAiErrKind(status, detail){
  const d=String(detail||'').toLowerCase();
  if(status===0) return 'network';
  if(status===429 || d.includes('rate limit')) return 'limit';
  if(d.includes('decommission') || d.includes('does not exist') || d.includes('model_not_found')) return 'model';
  if(d.includes("noma'lum rejim")) return 'oldserver';
  if(status>=500) return 'server';
  return 'other';
}

window.__wdAI=(p)=>aiRequest(p);
async function aiRequest(payload, _retry){
  const ctrl = (typeof AbortController!=='undefined') ? new AbortController() : null;
  const timer = ctrl ? setTimeout(()=>{ try{ ctrl.abort(); }catch(e){} }, AI_TIMEOUT_MS) : null;
  try{
    const r = await fetch(SUPABASE_FUNCTION_URL, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization':'Bearer '+SUPABASE_PUBLISHABLE_KEY
      },
      body: JSON.stringify(payload),
      ...(ctrl ? { signal: ctrl.signal } : {})
    });
    if(timer) clearTimeout(timer);
    const text = await r.text();
    if(!r.ok){
      const kind=__wdAiErrKind(r.status, text);
      // Vaqtinchalik xato — bir marta qayta urinamiz (limit uchun ozgina kutib)
      if(!_retry && (kind==='limit' || kind==='server')){
        await new Promise(res=>setTimeout(res, kind==='limit'?1200:600));
        return aiRequest(payload, true);
      }
      return { __error:true, status:r.status, kind, detail:text.slice(0,300) };
    }
    try{ return JSON.parse(text); }
    catch(e){ return { __error:true, status:r.status, kind:'other', detail:'JSON emas: '+text.slice(0,300) }; }
  }catch(e){
    if(timer) clearTimeout(timer);
    const aborted = e && (e.name==='AbortError');
    if(!_retry && !aborted){
      await new Promise(res=>setTimeout(res, 700));
      return aiRequest(payload, true);
    }
    return {
      __error:true, status:0, kind: aborted?'timeout':'network',
      detail: aborted ? ('AI '+Math.round(AI_TIMEOUT_MS/1000)+'s ichida javob bermadi') : ('Tarmoq xatosi: '+String(e))
    };
  }
}

/* Xato obyektidan foydalanuvchiga ko'rsatiladigan O'ZBEKCHA xabar yasaydi.
   Maqsad: foydalanuvchi "nima bo'ldi va nima qilishim kerak" ni tushunsin. */
function aiErrMsg(err){
  const k = (err && err.kind) || 'other';
  if(k==='network')   return "Internet aloqasi yo'q. Ulanishni tekshirib qayta urinib ko'ring.";
  if(k==='timeout')   return "AI javob berishga ulgurmadi. Bir oz kutib qayta urinib ko'ring.";
  if(k==='limit')     return "AI hozir juda band (kunlik limit). Bir necha daqiqadan keyin urinib ko'ring.";
  if(k==='model')     return "AI modeli yangilangan. Server yangilanishi kerak — tez orada tuzatiladi.";
  if(k==='oldserver') return "Serverdagi AI eski versiyada. Yangilanish kerak.";
  if(k==='server')    return "AI serveri vaqtincha ishlamayapti. Keyinroq urinib ko'ring.";
  return "AI vaqtincha javob bermadi. Keyinroq urinib ko'ring.";
}
window.__wdAiErrMsg = aiErrMsg;

/* Diagnostika — brauzer konsolida ishlatish uchun:
     await __wdAiHealth()
   Qaysi AI modeli tirik, qaysi biri o'chirilgan — darhol ko'rsatadi.
   AI to'xtaganda BIRINCHI shu buyruq ishlatiladi. */
window.__wdAiHealth = async function(){
  const r = await aiRequest({ mode:'health' });
  try{ console.table(r && r.models ? r.models : r); }catch(e){}
  if(r && r.healthy===false) console.warn('DIQQAT: hech qaysi AI modeli javob bermayapti!');
  return r;
};

/* AI o'zi taklif qilgan tuzatishni keyin "xato" deb rad etmasligi uchun:
   har term bo'yicha oxirgi tuzatish eslab qolinadi — foydalanuvchi aynan
   o'shani yozsa, AI'dan so'ramasdan to'g'ri deb qabul qilinadi.
   MUHIM: bu xotira localStorage'ga ham yoziladi (saveState -> corrMem),
   shuning uchun sahifa yangilangach ham saqlanib qoladi. Ilgari xotira
   faqat operativ edi va har yangilanishda nolga tushardi — natijada AI
   o'zining tuzatishini qaytadan "xato" deb belgilashi mumkin edi. */
const __wdCorrMem={};
const CORR_MEM_MAX=400; // xotira cheksiz o'smasligi uchun
function __wdNormSent(s){
  return String(s||'').toLowerCase().replace(/[\u2019\u2018]/g,"'")
    .replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'');
}
/* Xotiraga yozadi + hajmni cheklaydi + diskka saqlaydi */
function __wdCorrRemember(key, sent){
  __wdCorrMem[key]=sent;
  const keys=Object.keys(__wdCorrMem);
  if(keys.length>CORR_MEM_MAX){
    // eng qadimgilarini olib tashlaymiz (kalitlar kiritilish tartibida turadi)
    keys.slice(0, keys.length-CORR_MEM_MAX).forEach(k=>{ delete __wdCorrMem[k]; });
  }
  try{ saveState(); }catch(e){}
}
async function checkSentenceAI(sentence, term){
  const k=String(term||'').toLowerCase();
  if(__wdCorrMem[k] && __wdNormSent(sentence)===__wdCorrMem[k]){
    return { correct:true };
  }
  const data = await aiRequest({ mode:'check', sentence, term });
  if(data && typeof data.correct === 'boolean'){
    if(data.correct===false && typeof data.correction==='string' && data.correction.trim()){
      __wdCorrRemember(k, __wdNormSent(data.correction));
    }else if(data.correct===true){
      __wdCorrRemember(k, __wdNormSent(sentence)); // to'g'ri deb topilgan gap ham eslab qolinadi
    }
    return data;
  }
  if(data && data.__error) return data;
  if(data && data.error) return { __error:true, status:0, detail:JSON.stringify(data).slice(0,300) };
  return { __error:true, status:0, detail:'Kutilmagan javob' };
}

async function getExamplesAI(term){
  const data = await aiRequest({ mode:'examples', term });
  if(data && Array.isArray(data.examples)) return data.examples;
  return null;
}

async function getStoryAI(terms){
  const data = await aiRequest({ mode:'story', terms });
  if(data && typeof data.story==='string') return data;
  return null;
}

/* So'z devori uchun: inglizcha so'zni o'zbekchaga tarjima qilish */
async function translateWordAI(term){
  const data = await aiRequest({ mode:'translate', term });
  if(data && typeof data.uz==='string' && data.uz.trim()) return data.uz.trim();
  return null; // Edge Function 'translate' rejimini qo'llamasa — foydalanuvchi o'zi kiritadi
}
window.__wdTranslateWord=translateWordAI;
/* So'z devori uchun: so'zning ma'nosini o'zbekchada izohlash (tarjimasiz!) */
async function meaningWordAI(term){
  const data = await aiRequest({ mode:'meaning', term });
  if(data && typeof data.meaning==='string' && data.meaning.trim()) return data.meaning.trim();
  return null;
}
/* Doska uchun: grammatik mavzuni tekshirib, o'zbekcha qoidalarini qaytaradi.
   Kutilgan javob: { title:"First Conditional", rules:[{sign:"+",rule:"...",example:"..."}] } */
async function boardTopicAI(topic){
  const data = await aiRequest({ mode:'board', topic });
  if(data && typeof data.title==='string' && Array.isArray(data.rules) && data.rules.length) return data;
  return null;
}
/* Dars uchun: bosqich raqamiga mos 10 ta advanced so'z to'plamini tuzadi.
   Kutilgan javob: { theme:"...", words:[{term,pos,tr,ipa,def,ex,forms:[..]}] } */
async function levelWordsAI(level, avoid){
  // v12 server: qiziqish va maqsadni ham yuboramiz (mavzu shulardan tanlanadi)
  const interests = Array.isArray(window.__wdInterests) ? window.__wdInterests.slice(0,12) : [];
  const goal = (typeof window.__wdGoal==='string') ? window.__wdGoal : '';
  // v101: foydalanuvchi darajasi ma'lum bo'lsa — darslar o'sha darajadan boshlanadi va har 15 darsda bir pog'ona o'sadi
  let data=null;
  const LVS=['A1','A2','B1','B2','C1'];
  const base=LVS.indexOf(window.__wdCEFR||'');
  if(base>=0){
    const cefr=LVS[Math.min(LVS.length-1, base+Math.floor((Math.max(1,Number(level)||1)-1)/15))];
    try{
      const r=await fetch('https://jgeycbyaoiybpudakgmk.supabase.co/functions/v1/wd-lesson',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cefr,lesson:level,avoid:(avoid||[]).slice(-400),interests,goal})});
      if(r.ok) data=await r.json();
    }catch(e){}
  }
  if(!data || !Array.isArray(data.words)) data = await aiRequest({ mode:'level', level, avoid:(avoid||[]).slice(-400), interests, goal });
  if(data && Array.isArray(data.words) && data.words.length>=8){
    const words=data.words.slice(0,10).map(w=>({
      term:String(w.term||'').trim(),
      pos:String(w.pos||'').slice(0,12),
      tr:String(w.tr||'').slice(0,80),
      ipa:String(w.ipa||'').slice(0,40),
      def:String(w.def||'').slice(0,220),
      ex:String(w.ex||'').slice(0,180),
      forms:(Array.isArray(w.forms)&&w.forms.length?w.forms:[w.term]).map(f=>String(f)).slice(0,8)
    })).filter(w=>w.term && w.tr);
    if(words.length>=8) return { theme:String(data.theme||'').slice(0,40), words };
  }
  return null;
}
/* Parta qog'ozi uchun: mavzu bo'yicha chiroyli, formal inglizcha matn.
   Kutilgan javob: { title:"...", text:"..." } */
async function writingAI(topic){
  const data = await aiRequest({ mode:'writing', topic });
  if(data && typeof data.title==='string' && typeof data.text==='string' && data.text.trim()) return data;
  return null;
}

/* ========== LOCAL STORAGE — progress hech qachon yo'qolmasligi uchun ========== */
const LS_KEY='worddrop_state_v1';
function loadState(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    return raw?JSON.parse(raw):null;
  }catch(e){ return null; } // localStorage yo'q/bloklangan bo'lsa ham ilova ishlashda davom etadi
}
const SAVED_STATE = loadState() || {};
/* AI tuzatish xotirasini diskdan tiklaymiz (yuqorida e'lon qilingan __wdCorrMem) */
try{
  if(SAVED_STATE.corrMem && typeof SAVED_STATE.corrMem==='object'){
    Object.keys(SAVED_STATE.corrMem).slice(-CORR_MEM_MAX).forEach(k=>{
      const v=SAVED_STATE.corrMem[k];
      if(typeof v==='string' && v) __wdCorrMem[k]=v;
    });
  }
}catch(e){}
/* Haqiqiy yozuv alohida funksiyada: saveState juda ko'p joydan ketma-ket
   chaqiriladi, har safar katta JSON'ni sinxron yozish UI'ni sekinlashtiradi.
   Shu sabab yozuv 200ms ga kechiktiriladi (natija o'zgarmaydi), sahifa
   yashiringanda/yopilganda esa darhol diskka tushiriladi. */
let __wdSaveTimer=null;
function __wdWriteState(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify({
      completedLevels:[...(typeof completedLevels!=='undefined'?completedLevels:[])],
      completedPatterns:[...(typeof completedPatterns!=='undefined'?completedPatterns:[])],
      sentenceVault:sentenceVault,
      streak:window.__wdStreak||0,
      totalLearned:window.__wdTotalLearned||0,
      xp:window.__wdXP||0,
      achievements:[...(window.__wdAch||[])],
      dailyStreak:window.__wdDaily||0,
      daily2:(window.__wdDaily2||null),
      lastActiveDay:window.__wdLastDay||'',
      bestStreak:window.__wdBestStreak||0,
      activeDays:(window.__wdActiveDays||[]),
      perfectLevels:window.__wdPerfect||0,
      name:window.__wdName||'',
      cefr:window.__wdCEFR||'',
      placed:window.__wdPlaced||'',
      goal:window.__wdGoal||'',
      interests:(window.__wdInterests||[]),
      dailyMin:window.__wdDailyMin||0,
      avatar:window.__wdAvatar||'',
      darkMode:window.__wdDark===true,
      settings:{sound:window.__wdSoundOn!==false, notif:window.__wdNotifOn!==false},
      wallWords:(window.__wdWallWords||[]),
      listenPaid:(window.__wdListenPaid||{}),
      titleId:(window.__wdTitleId||''),
      genLevels:(window.__wdGenLevels||{}),
      wallBoard:(window.__wdWallBoard||null),
      tvVideo:(window.__wdTvVideo||null),
      notebook:(window.__wdNotebook||[]),
      windowScene:(window.__wdWindowScene||'real'),
      ielts:(window.__wdIelts||[]),
      lang:(window.__wdLang||'uz'),
      srs:(window.__wdSrs||{}),
      srsCfg:(window.__wdSrsCfg||null),
      srsLog:(window.__wdSrsLog||{}),
      weekly:(window.__wdWeekly||null),
      duels:(window.__wdDuels||[]),
      coins:(window.__wdCoins||0),
      room:(window.__wdRoom||null),
      roomCode:(window.__wdRoomCode||''),
      frame:(window.__wdFrame||''),
      boostUntil:(window.__wdBoostUntil||0),
      wheelLast:(window.__wdWheelLast||0),
      testCleared:!!window.__wdTestCleared,
      promoUntil:(window.__wdPromoUntil||0),
      promoUsed:!!window.__wdPromoUsed,
      nameColor:(window.__wdNameColor||''),
      corrMem:__wdCorrMem,            // AI tuzatish xotirasi — yangilanishdan keyin ham saqlanadi
      notifCfg:(window.__wdNotifCfg||null), // bildirishnoma sozlamalari (soat, oxirgi yuborilgan kun)
      savedAt:Date.now()
    }));
  }catch(e){ /* saqlash joyi to'lgan yoki mavjud emas — sekin davom etamiz */ }
  try{ if(window.__wdCloudSync) window.__wdCloudSync(); }catch(e){}
  try{ __wdTrackWeeklyEvents(); }catch(e){}
}
/* ========== HAFTALIK HISOBOT — hodisa jurnali (wd_events) ==========
   saveState() ilova ichida XP/so'z/streak o'zgargan HAR bir joydan chaqiriladi,
   shuning uchun buni yagona nuqta sifatida kuzatamiz: oldingi qiymatlar bilan
   solishtirib, farqni (delta) wd_events jadvaliga yozamiz. Bu — barcha
   o'yin rejimlari (bosqichlar, so'zlar, duel, IELTS...) uchun alohida hook
   yozishning o'rnini bosadi. */
let __wdEvXP, __wdEvWords, __wdEvPerfect, __wdEvDay;

window.__wdLogEvent = function(type, xpDelta, wordsDelta, payload){
  if(!window.__sb || !window.__sbUser) return; // ulanish yo'q — jim o'tkazib yuboramiz
  try{
    window.__sb.from('wd_events').insert({
      user_id: window.__sbUser.id,
      event_type: type,
      xp_delta: xpDelta||0,
      words_delta: wordsDelta||0,
      payload: payload||{}
    }).then(()=>{}, ()=>{});
  }catch(e){}
};

function __wdTrackWeeklyEvents(){
  try{
    if(__wdEvXP===undefined) return; // hali initsializatsiya bo'lmagan — birinchi saveState'dan oldin
    const xp = window.__wdXP||0, words = window.__wdTotalLearned||0,
          perfect = window.__wdPerfect||0, day = window.__wdLastDay||'';
    const dXp = xp - __wdEvXP, dWords = words - __wdEvWords, dPerfect = perfect - __wdEvPerfect;
    if(dXp>0 || dWords>0 || dPerfect>0){
      window.__wdLogEvent('progress', dXp, dWords, {perfectDelta: Math.max(0,dPerfect)});
    }
    if(day && day !== __wdEvDay){
      window.__wdLogEvent('streak_tick', 0, 0, {dailyStreak: window.__wdDaily||0, day});
      __wdEvDay = day;
    }
    __wdEvXP = xp; __wdEvWords = words; __wdEvPerfect = perfect;
  }catch(e){}
}
function saveState(){
  if(__wdSaveTimer) clearTimeout(__wdSaveTimer);
  __wdSaveTimer=setTimeout(()=>{ __wdSaveTimer=null; __wdWriteState(); },200);
}
/* ========== EMAIL + PAROL HISOBI ==========
   Anonim foydalanuvchini email+parolga BOG'LAYMIZ (updateUser) — ID o'zgarmaydi,
   shu sabab hozirgacha yig'ilgan progress (xona, tanga, daraja) saqlanib qoladi.
   Keyingi qurilmada esa signInWithPassword bilan kiradi va bulutdan tiklanadi. */
window.__wdIsSignedIn=function(){
  const u=window.__sbUser;
  return !!(u && u.email && u.is_anonymous!==true);
};
window.__wdAuthEmail=function(){ const u=window.__sbUser; return (u&&u.email)||''; };

/* ==============================================================
   ONBOARDING GATE — foydalanuvchini index.html'ga yo'naltirish
   ============================================================== */

/*
  Foydalanuvchi kirgan sessiyani tekshiradi:
  - wd_needs_onboarding RPC true qaytarsa → index.html'ga
  - Aks holda hech nima qilmaydi
  Qaytadi: true (redirect qilindi) yoki false (davom eting)
*/
/* Onboarding yo'naltirishi YOQILGAN. Tahrirlash paytida vaqtincha o'chirish
   kerak bo'lsa, quyidagini false qiling. */
window.WD_ONB_GATE_ENABLED = true;

window.__wdOnbGate = async function(){
  try{
    if(!window.__sb) return false;
    // Faqat sessiya bor bo'lsa gate ishlaydi
    const { data:{ user } } = await window.__sb.auth.getUser();
    if(!user) return false;

    // Mehmon UID qolgan bo'lsa — hozirgi hisobga bog'lash
    let guestUid = null;
    try{ guestUid = localStorage.getItem('wd_guest_uid'); }catch(_){}
    if(guestUid && guestUid !== user.id){
      try{
        const { data: linkRes } = await window.__sb.rpc('wd_link_guest_profile', { guest_uid: guestUid });
        if(linkRes && linkRes.ok){
          try{ localStorage.removeItem('wd_guest_uid'); }catch(_){}
        }
      }catch(_){}
    }

    // Onboarding kerakmi?
    const { data: needs, error } = await window.__sb.rpc('wd_needs_onboarding');
    if(error){
      // RPC hali yo'q bo'lsa — ilova ishini to'xtatmang
      console.warn('[WordDrop] wd_needs_onboarding yo\'q:', error.message);
      return false;
    }
    if(needs === true && !window.WD_ONB_GATE_ENABLED){
      console.info('[WordDrop] onboarding gate vaqtincha o\'chirilgan — yo\'naltirish o\'tkazib yuborildi');
      return false;
    }
    if(needs === true){
      // Root strukturasi (production zip'da barcha fayllar bir joyda):
      //   /index.html         → landing (marketing)
      //   /onboarding.html    → 6-savolli onboarding
      //   /app.html           → ilova (shu fayl)
      const ONB_URL     = 'onboarding.html';
      const BACK_TARGET = 'app.html';
      location.replace(ONB_URL + '?next=' + encodeURIComponent(BACK_TARGET));
      return true;
    }
    return false;
  }catch(e){
    console.warn('[WordDrop] onboarding gate error:', e);
    return false;
  }
};

/* Ro'yxatdan o'tish: anonim hisobga email+parol biriktiradi */
window.__wdSignUp=async function(email,password){
  if(!window.__sb) return {ok:false,err:'Ulanish yo\'q'};
  try{ await window.__sbReady; }catch(e){}
  try{
    const u=window.__sbUser;
    let res;
    // Tasdiqlash havolasi ilova ochilgan manzilga qaytadi (localhost'ga emas).
    // file:// bilan ochilsa redirect ishlamaydi — o'shanda undefined qoldiramiz.
    const origin=(location&&location.origin&&location.origin.indexOf('http')===0)?location.origin+location.pathname:undefined;
    const opts=origin?{emailRedirectTo:origin}:undefined;
    if(u && u.is_anonymous){
      // Anonim -> doimiy hisob (progress saqlanadi)
      // MUHIM: updateUser'ga ham emailRedirectTo beriladi, aks holda
      // Supabase tasdiqlash xatidagi havola default Site URL'ga (yoki
      // localhost'ga) qaytishi mumkin va foydalanuvchi tasdiqlay olmaydi.
      res = await window.__sb.auth.updateUser(
        { email, password },
        opts ? { emailRedirectTo: opts.emailRedirectTo } : undefined
      );
    }else{
      res=await window.__sb.auth.signUp({ email, password, options:opts });
    }
    if(res.error) return {ok:false,err:__wdAuthMsg(res.error.message)};
    // Email tasdiqlash yoqilgan bo'lsa — foydalanuvchi pochtasini tekshiradi
    if(res.data && res.data.user) window.__sbUser=res.data.user;
    try{ if(window.__wdCloudSync) window.__wdCloudSync(true); }catch(e){}
    try{ if(window.__wdSyncProfile) window.__wdSyncProfile(true); }catch(e){}
    // Anonim -> updateUser holatida sessiya saqlanib qoladi, lekin email hali
    // tasdiqlanmagan bo'ladi. Shuning uchun ochiq harf: agar email_confirmed_at yo'q bo'lsa,
    // foydalanuvchini tasdiqlashga chorlaymiz.
    const nowUser = (res.data && res.data.user) || null;
    const needVerify = !!(nowUser && !nowUser.email_confirmed_at) || !(res.data && res.data.session);
    return {ok:true, needVerify};
  }catch(e){ return {ok:false,err:__wdAuthMsg((e&&e.message)||String(e))}; }
};

/* Google OAuth orqali kirish.
   Foydalanuvchi Google'ga yo'naltiriladi, tanlagach shu sahifaga qaytadi.
   Qaytgan zahoti Supabase URL'dan sessiyani o'zi oladi (detectSessionInUrl:true).
   onAuthStateChange orqali __wdOnbGate() ishga tushadi va guest progress link qilinadi. */
window.__wdSignInWithGoogle=async function(){
  if(!window.__sb) return {ok:false,err:'Ulanish yo\'q'};
  try{ await window.__sbReady; }catch(e){}
  try{
    // Qaytish manzili — shu sahifa (query/hash'siz)
    const redirectTo =
      (location && location.origin && location.origin.indexOf('http')===0)
        ? (location.origin + location.pathname)
        : undefined;

    // Anonim UID'ni Google callback'da link qilish uchun eslab qolamiz
    try{
      const cu = window.__sbUser;
      if(cu && cu.is_anonymous){
        localStorage.setItem('wd_guest_uid', cu.id);
      }
    }catch(_){}

    const { data, error } = await window.__sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' }   // har safar hisob tanlash oynasi
      }
    });
    if(error) return {ok:false, err:__wdAuthMsg(error.message)};
    // Ishonchli holatda brauzer shu yerda Google sahifasiga o'tib ketadi
    return {ok:true, url: data && data.url};
  }catch(e){ return {ok:false, err:__wdAuthMsg((e&&e.message)||String(e))}; }
};

/* Kirilgan foydalanuvchi parolini yangilash (recovery link'idan qaytgach ishlatiladi) */
window.__wdUpdatePass=async function(newPassword){
  if(!window.__sb) return {ok:false,err:'Ulanish yo\'q'};
  if(!newPassword || newPassword.length<6){
    return {ok:false, err:'Parol kamida 6 belgidan iborat bo\'lsin.'};
  }
  try{
    const { data, error } = await window.__sb.auth.updateUser({ password: newPassword });
    if(error) return {ok:false, err:__wdAuthMsg(error.message)};
    if(data && data.user) window.__sbUser = data.user;
    return {ok:true};
  }catch(e){ return {ok:false, err:__wdAuthMsg((e&&e.message)||String(e))}; }
};

/* Kirish: mavjud hisobga email+parol bilan */
window.__wdSignIn=async function(email,password){
  if(!window.__sb) return {ok:false,err:'Ulanish yo\'q'};
  try{ await window.__sbReady; }catch(e){}
  try{
    const res=await window.__sb.auth.signInWithPassword({ email, password });
    if(res.error) return {ok:false,err:__wdAuthMsg(res.error.message)};
    if(res.data && res.data.user) window.__sbUser=res.data.user;
    // Boshqa hisobga o'tayapmiz: O'SHA hisobning progressini MAJBURAN tortamiz
    const restored=await __wdForceRestoreForUser();
    return {ok:true, restored};
  }catch(e){ return {ok:false,err:__wdAuthMsg((e&&e.message)||String(e))}; }
};
/* Kirilgan hisobning bulut nusxasini majburan localStorage'ga yozadi.
   Bulutda progress yo'q bo'lsa — hisob toza (0'dan) boshlanadi. */
async function __wdForceRestoreForUser(){
  try{
    const { data, error } = await window.__sb.from('wd_state')
      .select('state').eq('user_id', window.__sbUser.id).maybeSingle();
    if(error) return false;
    if(data && data.state){
      localStorage.setItem(LS_KEY, JSON.stringify(data.state));
      return true;
    }else{
      try{ localStorage.removeItem(LS_KEY); }catch(e){}
      return false;
    }
  }catch(e){ return false; }
}

/* Chiqish: hisobdan chiqib, yangi anonim seans ochadi */
window.__wdSignOut=async function(){
  if(!window.__sb) return;
  try{ await window.__sb.auth.signOut(); }catch(e){}
  // Chiqganda mahalliy nusxa ham tozalanadi — mehmon toza holatda boshlaydi.
  // (Progress bulutda saqlangan, qayta kirsa qaytadi.)
  try{ localStorage.removeItem(LS_KEY); }catch(e){}
  // Onboarding local flag'larini tozalash — chiqqan foydalanuvchi
  // yangi mehmon rejim uchun toza holatda bo'lishi kerak
  try{
    localStorage.removeItem('wd_guest_uid');
    localStorage.removeItem('wd_onb_done_v3');
    localStorage.removeItem('wd_onb_step_v3');
    localStorage.removeItem('wd_profile_v3');
    localStorage.removeItem('wd_ev_welcome');
  }catch(e){}
  try{
    const { data } = await window.__sb.auth.signInAnonymously();
    if(data && data.user) window.__sbUser=data.user;
  }catch(e){}
  __wdRestored=true;   // yangi anonim uchun bulutdan tiklashga urinmaymiz (u toza)
  if(window.__wdRefreshStatus) window.__wdRefreshStatus();
};

/* Parolni tiklash havolasini yuboradi.
   MUHIM: redirectTo — foydalanuvchi email'dagi havolani bosgach shu manzilga qaytadi,
   URL'da ?type=recovery yoki #type=recovery bo'ladi. Ilova init'da buni ushlab olib
   "Yangi parol o'rnatish" oynasini avtomatik ochadi. */
window.__wdResetPass=async function(email){
  if(!window.__sb) return {ok:false,err:'Ulanish yo\'q'};
  if(!email || email.indexOf('@')<0) return {ok:false, err:'Email manzil noto\'g\'ri.'};
  try{
    const origin =
      (location && location.origin && location.origin.indexOf('http')===0)
        ? (location.origin + location.pathname + '#type=recovery')
        : undefined;
    const opts = origin ? { redirectTo: origin } : undefined;
    const { error } = await window.__sb.auth.resetPasswordForEmail(email, opts);
    if(error) return {ok:false,err:__wdAuthMsg(error.message)};
    return {ok:true};
  }catch(e){ return {ok:false,err:__wdAuthMsg((e&&e.message)||String(e))}; }
};

/* Supabase xato xabarlarini o'zbekchaga o'giradi */
function __wdAuthMsg(m){
  m=String(m||'');
  if(/already registered|already been registered|already exists|user already/i.test(m)) return 'Bu email allaqachon ro\'yxatdan o\'tgan. Iltimos, kiring yoki parolni tiklang.';
  if(/email not confirmed|not.*confirm/i.test(m)) return 'Email hali tasdiqlanmagan. Pochtangizdagi havolani bosing.';
  if(/Invalid login|invalid credentials|invalid.*password/i.test(m)) return 'Email yoki parol noto\'g\'ri.';
  if(/at least 6|password.*6|weak|password should be/i.test(m)) return 'Parol kamida 6 belgidan iborat bo\'lsin.';
  if(/same.*password|new password.*same/i.test(m)) return 'Yangi parol eski paroldan farq qilishi kerak.';
  if(/valid email|invalid email|email.*invalid/i.test(m)) return 'Email manzil noto\'g\'ri.';
  if(/not authorized|not allowed|signup.*disabled|signups?.*not/i.test(m)) return 'Ro\'yxatdan o\'tish hozircha o\'chirilgan. Adminga murojaat qiling.';
  if(/rate|too many|for security purposes/i.test(m)) return 'Juda ko\'p urinish. Bir daqiqadan so\'ng qayta urinib ko\'ring.';
  if(/network|fetch|timeout/i.test(m)) return 'Internet aloqasi yo\'q. Aloqani tekshiring.';
  if(/oauth|provider|redirect/i.test(m)) return 'Google bilan kirishda xatolik. Biroz kutib qayta urinib ko\'ring.';
  if(/token|expired|invalid.*link/i.test(m)) return 'Havola muddati o\'tgan. Yangi havola so\'rang.';
  return m.slice(0,100);
}

function __wdFlushState(){
  if(__wdSaveTimer){ clearTimeout(__wdSaveTimer); __wdSaveTimer=null; __wdWriteState(); }
}

/* ========== BULUT SINXRONI (Supabase wd_state) ==========
   localStorage tez keshdek ishlaydi, Supabase esa asosiy nusxa.
   Qurilma almashsa yoki kesh tozalansa — progress bulutdan qaytariladi. */
let __wdCloudTimer=null, __wdCloudBusy=false, __wdRestored=false;
function __wdCurrentStateObj(){
  try{ const raw=localStorage.getItem(LS_KEY); return raw?JSON.parse(raw):null; }catch(e){ return null; }
}
window.__wdCloudSync=function(immediate){
  if(!window.__sb || !window.__sbUser) return;   // ulanmagan bo'lsa — faqat localStorage
  const doIt=async ()=>{
    if(__wdCloudBusy) return;
    __wdCloudBusy=true;
    try{
      const st=__wdCurrentStateObj();
      if(st){
        await window.__sb.from('wd_state').upsert({
          user_id: window.__sbUser.id,
          state: st,
          saved_at: st.savedAt || Date.now(),
          updated_at: new Date().toISOString()
        });
      }
    }catch(e){ /* tarmoq yo'q — keyingi safar yana urinadi, localStorage baribir saqlagan */ }
    __wdCloudBusy=false;
  };
  clearTimeout(__wdCloudTimer);
  if(immediate) doIt(); else __wdCloudTimer=setTimeout(doIt, 2500);
};
/* Ilova ochilganda bir marta: bulut nusxasi localStorage'dan yangiroq bo'lsa — tiklaymiz */
window.__wdCloudRestore=async function(){
  if(__wdRestored || !window.__sb || !window.__sbUser) return;
  __wdRestored=true;
  try{
    const { data, error } = await window.__sb.from('wd_state')
      .select('state,saved_at').eq('user_id', window.__sbUser.id).maybeSingle();
    if(error || !data || !data.state) return;   // bulutda hali yo'q — birinchi marta
    const local=__wdCurrentStateObj();
    const localAt=(local && local.savedAt) || 0;
    const cloudAt=data.saved_at || (data.state.savedAt) || 0;
    // Bulut yangiroq (yoki teng, lekin lokal bo'sh) bo'lsa — tiklaymiz
    if(cloudAt > localAt){
      localStorage.setItem(LS_KEY, JSON.stringify(data.state));
      // Sahifani yangilash — barcha holat SAVED_STATE'dan qayta o'qiladi
      if(window.__wdRefreshStatus) window.__wdRefreshStatus();
      __wdCloudNotify(cloudAt, localAt);
    }
  }catch(e){ /* jim — localStorage bilan davom etamiz */ }
};
/* Bulutdan yangiroq progress topilsa — foydalanuvchini ogohlantiramiz.
   Reload eng ishonchli yo'l, chunki holat butun ilova bo'ylab tarqalgan. */
function __wdCloudNotify(cloudAt, localAt){
  try{
    if(document.getElementById('wdCloudBar')) return;
    const bar=document.createElement('div'); bar.id='wdCloudBar';
    bar.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2000;'+
      'background:#12172B;color:#fff;padding:13px 18px;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.35);'+
      'font-family:inherit;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:12px;max-width:90vw';
    const fresh = localAt===0;
    bar.innerHTML='<span>'+(fresh?'Progressingiz tiklandi':'Boshqa qurilmadan yangiroq progress topildi')+
      '</span><button id="wdCloudBtn" style="border:none;background:#2F6FED;color:#fff;'+
      'padding:8px 16px;border-radius:11px;font-weight:800;cursor:pointer;font-family:inherit">Yangilash</button>';
    document.body.appendChild(bar);
    document.getElementById('wdCloudBtn').addEventListener('click',()=>location.reload());
    // Foydalanuvchi bosmasa ham, 6 soniyada avtomatik yangilaymiz (ma'lumot to'g'ri bo'lishi uchun)
    setTimeout(()=>{ if(document.getElementById('wdCloudBar')) location.reload(); }, 6000);
  }catch(e){ location.reload(); }
}
window.addEventListener('pagehide',()=>{ __wdFlushState(); try{ if(window.__wdCloudSync) window.__wdCloudSync(true); }catch(e){} });
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'){ __wdFlushState(); try{ if(window.__wdCloudSync) window.__wdCloudSync(true); }catch(e){} } });
window.__wdStreak = SAVED_STATE.streak || 0;
window.__wdTotalLearned = SAVED_STATE.totalLearned || 0;
window.__wdXP = SAVED_STATE.xp || 0;
window.__wdAch = new Set(SAVED_STATE.achievements || []);
window.__wdDaily = SAVED_STATE.dailyStreak || 0;
window.__wdLastDay = SAVED_STATE.lastActiveDay || '';
window.__wdBestStreak = Number(SAVED_STATE.bestStreak || 0);
window.__wdActiveDays = Array.isArray(SAVED_STATE.activeDays) ? SAVED_STATE.activeDays : [];
window.__wdPerfect = SAVED_STATE.perfectLevels || 0;
__wdEvXP = window.__wdXP; __wdEvWords = window.__wdTotalLearned; __wdEvPerfect = window.__wdPerfect; __wdEvDay = window.__wdLastDay;
// ==== Onboarding profilini o'qish (wd_profile_v3)
window.__wdOnbProfile = (function(){
  try{ return JSON.parse(localStorage.getItem('wd_profile_v3')||'null') || {}; }
  catch(e){ return {}; }
})();
const __ONB = window.__wdOnbProfile;
const __onbName = (__ONB.name && (__ONB.name.firstName || __ONB.name.lastName))
  ? [(__ONB.name.firstName||'').trim(), (__ONB.name.lastName||'').trim()].filter(Boolean).join(' ')
  : '';
window.__wdName      = SAVED_STATE.name || __onbName || '';
window.__wdCEFR      = SAVED_STATE.cefr || (__ONB.level && __ONB.level.value) || '';
window.__wdPlaced    = SAVED_STATE.placed || '';
window.__wdGoal      = SAVED_STATE.goal || (__ONB.goal && __ONB.goal.value)   || '';
window.__wdInterests = Array.isArray(SAVED_STATE.interests) ? SAVED_STATE.interests
                     : ((__ONB.interests && Array.isArray(__ONB.interests.values)) ? __ONB.interests.values.slice() : []);
window.__wdDailyMin  = Number(SAVED_STATE.dailyMin || (__ONB.daily && __ONB.daily.value) || 0);
window.__wdAvatar = SAVED_STATE.avatar || '';
window.__wdDark = SAVED_STATE.darkMode === true;
window.__wdSoundOn = SAVED_STATE.settings ? SAVED_STATE.settings.sound !== false : true;
window.__wdNotifOn = SAVED_STATE.settings ? SAVED_STATE.settings.notif !== false : true;
window.__wdWallWords = Array.isArray(SAVED_STATE.wallWords) ? SAVED_STATE.wallWords : []; // So'z devori lug'ati
window.__wdListenPaid = (SAVED_STATE.listenPaid && typeof SAVED_STATE.listenPaid==='object') ? SAVED_STATE.listenPaid : {}; // tinglash mukofoti hisobi
window.__wdTitleId = SAVED_STATE.titleId || ''; // profilga taqilgan titul (yutuq id)
window.__wdGenLevels = (SAVED_STATE.genLevels && typeof SAVED_STATE.genLevels==='object') ? SAVED_STATE.genLevels : {}; // AI tuzgan darslar keshi
window.__wdWallBoard = (SAVED_STATE.wallBoard && SAVED_STATE.wallBoard.title) ? SAVED_STATE.wallBoard : null; // Doskadagi mavzu
/* Televizordagi video. Foydalanuvchi o'zi havola qo'ymagan bo'lsa —
   standart video ko'rsatiladi (hammada bir xil, sozlash shart emas). */
window.TV_DEFAULT={type:'video', src:'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/videos/VID_20260806_060024_096.mp4'};
window.__wdTvVideo = (SAVED_STATE.tvVideo && SAVED_STATE.tvVideo.src) ? SAVED_STATE.tvVideo
  : (typeof SAVED_STATE.tvVideo==='string' && SAVED_STATE.tvVideo) ? {type:'yt', src:SAVED_STATE.tvVideo}
  : window.TV_DEFAULT;   // manba HECH QACHON bo'sh qolmaydi
window.__wdNotebook = Array.isArray(SAVED_STATE.notebook) ? SAVED_STATE.notebook : []; // Partadagi daftar sahifalari
window.__wdWindowScene = (SAVED_STATE.windowScene==='fantasy') ? 'fantasy' : 'real'; // Deraza manzarasi
window.__wdIelts = Array.isArray(SAVED_STATE.ielts) ? SAVED_STATE.ielts : []; // IELTS mock natijalar tarixi
window.__wdLang = (SAVED_STATE.lang==='en') ? 'en' : 'uz'; // interfeys tili
window.__wdSrs = (SAVED_STATE.srs && typeof SAVED_STATE.srs==='object' && !Array.isArray(SAVED_STATE.srs)) ? SAVED_STATE.srs : {}; // SRS takrorlash bazasi
window.__wdDuels = Array.isArray(SAVED_STATE.duels) ? SAVED_STATE.duels : []; // duel tarixi
window.__wdCoins = Math.max(0, Number(SAVED_STATE.coins)||0); // tanga balansi
/* BIR MARTALIK TOZALASH (2026-08-06): test rejimida 99999 tanga qo'yilgan edi.
   Kod olib tashlandi, lekin saqlangan holatda qolgan. Bir marta tozalaymiz. */
if(!SAVED_STATE.testCleared && window.__wdCoins>=50000) window.__wdCoins=0;
window.__wdTestCleared=true;
window.__wdRoom = (SAVED_STATE.room && typeof SAVED_STATE.room==='object')
  ? {owned:!!SAVED_STATE.room.owned, inv:(SAVED_STATE.room.inv&&typeof SAVED_STATE.room.inv==='object')?SAVED_STATE.room.inv:{}, items:Array.isArray(SAVED_STATE.room.items)?SAVED_STATE.room.items:[], wallItems:Array.isArray(SAVED_STATE.room.wallItems)?SAVED_STATE.room.wallItems:[], fish:Array.isArray(SAVED_STATE.room.fish)?SAVED_STATE.room.fish:[], deco:(SAVED_STATE.room.deco&&typeof SAVED_STATE.room.deco==='object')?SAVED_STATE.room.deco:{view:'day',night:false}}
  : {owned:false, inv:{}, items:[], wallItems:[], fish:[], deco:{view:'day',night:false}}; // shaxsiy xona
window.__wdRoomCode = (typeof SAVED_STATE.roomCode==='string')?SAVED_STATE.roomCode:''; // xona mehmon kodi
window.__wdFrame = (typeof SAVED_STATE.frame==='string')?SAVED_STATE.frame:''; // profil ramkasi
window.__wdBoostUntil = Number(SAVED_STATE.boostUntil)||0; // XP booster tugash vaqti (ms)
window.__wdWheelLast = Number(SAVED_STATE.wheelLast)||0;   // omad g'ildiragi oxirgi bepul aylantirilgan vaqt
window.__wdPromoUntil = Number(SAVED_STATE.promoUntil)||0; // promokod rejimi tugash vaqti (ms)
window.__wdPromoUsed = !!SAVED_STATE.promoUsed;             // promokod ishlatilganmi (bir marta)

/* ============================================================
   SFX — markaziy ovoz tizimi
   - Ovozlar Supabase storage'dan yuklanadi (havolalar SFX_URLS'da)
   - Keshlaydi, hajmni boshqaradi, mobilda overlap'ni kamaytiradi
   - Sozlamalardagi "Ovoz effektlari" tugmasi bilan o'chiriladi
   - Havola bo'sh bo'lsa — jimgina o'tkazib yuboradi (xato bermaydi)
   ============================================================ */
const SFX_URLS = {
  correct : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/select.ogg',           // to'g'ri javob (tanlov tasdiqlandi)
  wrong   : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/error_denied.mp3',      // xato javob
  victory : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/achieve_unlock.mp3',    // daraja oshdi / bosqich yakuni
  coin    : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/select.ogg',           // tanga (vaqtincha select bilan)
  duelWin : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/achieve_unlock.mp3',    // duel yutuq (vaqtincha victory bilan)
  duelLose: 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/error_denied.mp3',      // duel yutqazish (vaqtincha wrong bilan)
  box     : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/spin_wheel.wav',        // quti / charxpalak ochilishi
  reward  : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/question.ogg',          // sovrin chiqishi
  tap     : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/low_click.ogg',         // tugma bosish (yengil)
  streak  : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/achieve_unlock.mp3',    // kunlik streak / yutuq
  mic     : 'https://jgeycbyaoiybpudakgmk.supabase.co/storage/v1/object/public/ui_sounds/before_mic_speak.mp3'  // mikrofon oldidan (talaffuz)
};
const SFX = (function(){
  const cache = {};
  let enabled = (window.__wdSoundOn !== false);   // mavjud "Ovoz effektlari" sozlamasiga bog'liq
  function vol(key){
    // Har ovoz uchun mos balandlik (tap juda yengil, victory to'liq)
    if(key==='tap') return 0.35;
    if(key==='coin'||key==='correct') return 0.55;
    if(key==='wrong') return 0.5;
    return 0.7;
  }
  function get(key){
    const url = SFX_URLS[key];
    if(!url) return null;
    if(!cache[key]){
      try{ const a=new Audio(url); a.preload='auto'; a.volume=vol(key); cache[key]=a; }
      catch(e){ return null; }
    }
    return cache[key];
  }
  const lastAt = {};
  function play(key){
    if(window.__wdSoundOn===false) return;   // "Ovoz effektlari" o'chiq bo'lsa — jim
    const now=Date.now();
    // Bir XIL ovoz juda tez takrorlanmasin (turli ovozlar bir-birini bloklamaydi)
    if(key!=='tap' && lastAt[key] && now-lastAt[key] < 80) return;
    lastAt[key]=now;
    const a=get(key);
    if(!a) return;
    try{ a.currentTime=0; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
  }
  function stop(key){
    const a=cache[key];
    if(a){ try{ a.pause(); a.currentTime=0; }catch(e){} }
  }
  function setEnabled(on){
    enabled=!!on;
    try{ SAVED_STATE.sfx=enabled; if(window.saveState) saveState(); }catch(e){}
  }
  function isEnabled(){ return enabled; }
  // Ovozlarni oldindan yuklab qo'yish (birinchi foydalanuvchi ishlashida)
  function warm(){ Object.keys(SFX_URLS).forEach(k=>{ if(SFX_URLS[k]) get(k); }); }
  return { play, stop, setEnabled, isEnabled, warm };
})();
window.__wdSFX = SFX;
window.playSfx = function(key){ try{ SFX.play(key); }catch(e){} };
/* Global "tap" — tugma va asosiy interaktiv elementlar bosilganda yengil ovoz.
   Capture fazasida ishlaydi, shuning uchun har qanday tugmani qamrab oladi. */
document.addEventListener('click',(e)=>{
  const t=e.target && e.target.closest && e.target.closest(
    'button, .btn, .sh-buy, .wc-btn, .auth-cta, .nav-item, .rvl-ok, .rvl-spin-btn, [data-tap]');
  if(t && !t.disabled){ try{ SFX.play('tap'); }catch(e){} }
}, true);
window.__wdNameColor = (typeof SAVED_STATE.nameColor==='string')?SAVED_STATE.nameColor:''; // reyting ism rangi
// Eski bitta-varaq formatidan ko'chirish
if(window.__wdNotebook.length===0 && SAVED_STATE.deskWriting && SAVED_STATE.deskWriting.text){
  window.__wdNotebook.push(SAVED_STATE.deskWriting);
}

/* ========== XP / DARAJA / YUTUQLAR TIZIMI ========== */
// Daraja formulasi: har daraja uchun kerakli XP asta-sekin oshadi
const LEVEL_TITLES=['Yangi boshlovchi','Izlanuvchi','O\'quvchi','Bilimdon','Mohir','Ustoz','Bilimdon usta','Til jangchisi','Til ustasi','Afsona'];
function xpForLevel(lv){ return 50 + (lv-1)*40; } // 1→50, 2→90, 3→130...
function levelInfo(totalXp){
  let lv=1, rem=totalXp;
  while(rem>=xpForLevel(lv)){ rem-=xpForLevel(lv); lv++; }
  const need=xpForLevel(lv);
  return { level:lv, inLevel:rem, need, title:LEVEL_TITLES[Math.min(lv-1,LEVEL_TITLES.length-1)] };
}
// Daraja nishoni — har daraja oralig'iga o'z rangi (Duolingo uslubi: bronza→kumush→oltin→zumrad→olmos)
function levelTheme(lv){
  const themes=[
    {c1:'#CD7F32',c2:'#A0562B',ring:'#E8A56B'}, // bronza (1-2)
    {c1:'#B0BEC5',c2:'#78909C',ring:'#CFD8DC'}, // kumush (3-4)
    {c1:'#FFD54F',c2:'#F9A825',ring:'#FFE082'}, // oltin (5-6)
    {c1:'#4DD0A0',c2:'#1FAE6B',ring:'#8EE8C6'}, // zumrad (7-8)
    {c1:'#67E8F9',c2:'#0891B2',ring:'#A5F0FB'}, // olmos (9+)
  ];
  return themes[Math.min(Math.floor((lv-1)/2),themes.length-1)];
}
let __wdBadgeSeq=0;
function levelBadge(lv,size=72){
  const t=levelTheme(lv);
  const id='lb'+lv+'_'+(++__wdBadgeSeq);
  return `<svg viewBox="0 0 72 72" width="${size}" height="${size}" fill="none">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.c1}"/><stop offset="1" stop-color="${t.c2}"/></linearGradient>
      <radialGradient id="${id}g" cx="0.35" cy="0.3" r="0.7"><stop stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <path d="M36 4l8 5 9-1 3 9 8 5-3 9 3 9-8 5-3 9-9-1-8 5-8-5-9 1-3-9-8-5 3-9-3-9 8-5 3-9 9 1 8-5z" fill="${t.ring}" opacity=".55"/>
    <circle cx="36" cy="36" r="23" fill="url(#${id})"/>
    <circle cx="36" cy="36" r="23" fill="url(#${id}g)"/>
    <text x="36" y="45" font-size="22" font-weight="800" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif">${lv}</text>
  </svg>`;
}
function boostActive(){ return (window.__wdBoostUntil||0) > Date.now(); }
window.__wdBoostActive=boostActive;
function addXP(amount){
  if(boostActive()) amount=Math.round(amount*2); // XP Booster: 30 daqiqa davomida 2x
  const before=levelInfo(window.__wdXP||0).level;
  window.__wdXP=(window.__wdXP||0)+amount;
  try{ if(amount>0 && typeof dailyProgress==='function') dailyProgress('xp',amount); }catch(e){}  // v93: XP topshiriqlari
  const after=levelInfo(window.__wdXP).level;
  saveState();
  if(after>before){
    setTimeout(()=>{
      showLevelUpModal(after);
      fireConfetti();
      try{ SFX.play('victory'); }catch(e){}
      unlockAch('level'+after);
    },300);
  }
}

// Daraja ko'tarilganda katta, chiroyli nishonlash oynasi (Duolingo uslubi)
function showLevelUpModal(lv){
  const inf=levelInfo(window.__wdXP||0);
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="modal-layer levelup" id="luModal">
    <div class="modal-backdrop"></div>
    <div class="lu-card">
      <div class="lu-glow"></div>
      <div class="lu-badge">${levelBadge(lv,120)}</div>
      <div class="lu-lbl">YANGI DARAJA</div>
      <div class="lu-lv">Daraja ${lv}</div>
      <div class="lu-title">${inf.title}</div>
      <button class="btn btn-primary btn-block" id="luClose">Ajoyib!</button>
      <button class="lu-share" id="luShare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>Story uchun rasm</button>
    </div>
  </div>`;
  const layer=document.getElementById('luModal');
  document.getElementById('luShare').addEventListener('click',()=>{ try{ window.__wdStory.open('level',{lv,title:inf.title,xp:window.__wdXP||0,streak:window.__wdDaily||0,words:window.__wdTotalLearned||0}); }catch(e){} });
  requestAnimationFrame(()=>layer.classList.add('show'));
  const close=()=>{ layer.classList.remove('show'); setTimeout(()=>layer.remove(),300); };
  document.getElementById('luClose').addEventListener('click',close);
  layer.querySelector('.modal-backdrop').addEventListener('click',close);
}

// Yutuqlar ro'yxati
/* Yutuq nishonlari uchun zamonaviy, gradientli SVG ikonlar (Duolingo uslubi) */
const BADGE={
  headset:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgHs" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#A78BFA"/><stop offset="1" stop-color="#6D28D9"/></linearGradient><linearGradient id="bgHs2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#F5F3FF"/><stop offset="1" stop-color="#C4B5FD"/></linearGradient></defs><path d="M8 24v-4a12 12 0 0 1 24 0v4" stroke="url(#bgHs)" stroke-width="3.4" stroke-linecap="round"/><rect x="5" y="22" width="7.5" height="12" rx="3.2" fill="url(#bgHs)"/><rect x="27.5" y="22" width="7.5" height="12" rx="3.2" fill="url(#bgHs)"/><rect x="7" y="24.5" width="3.5" height="7" rx="1.7" fill="url(#bgHs2)" opacity=".85"/><path d="M20 6.5l1.5 3.4 3.7.4-2.8 2.5.8 3.6-3.2-1.9-3.2 1.9.8-3.6-2.8-2.5 3.7-.4z" fill="#FCD34D"/></svg>`,
  pen:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgPen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#60A5FA"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs><path d="M25.5 8.5l6 6L16 30l-7 1 1-7L25.5 8.5z" fill="url(#bgPen)"/><path d="M23 11l6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  books:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgBk" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#34D399"/><stop offset="1" stop-color="#059669"/></linearGradient></defs><rect x="8" y="10" width="9" height="22" rx="2" fill="url(#bgBk)"/><rect x="19" y="7" width="9" height="25" rx="2" fill="#10B981"/><path d="M11 15h3M22 12h3" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  cap:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgCap" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#A78BFA"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs><path d="M20 10l14 6-14 6-14-6 14-6z" fill="url(#bgCap)"/><path d="M30 19v6c0 2.5-4.5 4.5-10 4.5S10 27.5 10 25v-6" stroke="#7C3AED" stroke-width="2.5" fill="none"/><circle cx="34" cy="16" r="1.6" fill="#7C3AED"/><path d="M34 16v5" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/></svg>`,
  trophy:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgTr" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FBBF24"/><stop offset="1" stop-color="#D97706"/></linearGradient></defs><path d="M13 8h14v7a7 7 0 01-14 0V8z" fill="url(#bgTr)"/><path d="M13 10H9v2c0 2.5 2 4 4 4M27 10h4v2c0 2.5-2 4-4 4" stroke="#D97706" stroke-width="2" fill="none"/><path d="M20 22v5m-4 5h8m-7-5h6l.5 5h-7l.5-5z" fill="#D97706"/></svg>`,
  flame:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgFl" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FB923C"/><stop offset="1" stop-color="#EA580C"/></linearGradient></defs><path d="M20 6c-3 5-8 8-8 14a8 8 0 0016 0c0-2.5-1-4.5-2.5-6.5.3 3-2 4.5-3.5 3.5 1.5-4-0.5-9-2-15z" fill="url(#bgFl)"/><path d="M20 20c-1.5 2-2.5 3.5-2.5 5.5a2.5 2.5 0 005 0c0-2-1-3.5-2.5-5.5z" fill="#FFEDD5"/></svg>`,
  bolt:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgBo" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FCD34D"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><path d="M22 5L10 22h8l-2 13 12-17h-8l2-13z" fill="url(#bgBo)"/></svg>`,
  diamond:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgDi" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#67E8F9"/><stop offset="1" stop-color="#0891B2"/></linearGradient></defs><path d="M12 8h16l6 8-14 16L6 16l6-8z" fill="url(#bgDi)"/><path d="M12 8l4 8h8l4-8M6 16h28M20 32l-4-16m4 16l4-16" stroke="#fff" stroke-width="1.5" opacity=".7"/></svg>`,
  calendar:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgCa" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F472B6"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs><rect x="8" y="10" width="24" height="22" rx="4" fill="url(#bgCa)"/><path d="M8 16h24" stroke="#fff" stroke-width="2"/><path d="M14 7v5M26 7v5" stroke="#DB2777" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="23" r="2" fill="#fff"/><circle cx="24" cy="23" r="2" fill="#fff"/></svg>`,
  sparkle:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgSp" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FDE047"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><path d="M20 6l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" fill="url(#bgSp)"/><path d="M31 8l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2L31 8z" fill="#FCD34D"/></svg>`,
  rocket:`<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bgRk" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#818CF8"/><stop offset="1" stop-color="#4F46E5"/></linearGradient></defs><path d="M20 6c5 3 8 9 8 15l-4 4h-8l-4-4c0-6 3-12 8-15z" fill="url(#bgRk)"/><circle cx="20" cy="16" r="3" fill="#fff"/><path d="M16 25l-3 6 4-2m10-4l3 6-4-2" fill="#F97316"/></svg>`,
  lockb:`<svg viewBox="0 0 40 40" fill="none"><rect x="11" y="18" width="18" height="14" rx="3" fill="#CBD5E1"/><path d="M15 18v-3a5 5 0 0110 0v3" stroke="#94A3B8" stroke-width="2.5" fill="none"/><circle cx="20" cy="24" r="2" fill="#64748B"/></svg>`,
};

const ACHIEVEMENTS={
  first_word:   {icon:BADGE.pen, title:'Birinchi qadam', desc:'Birinchi to\'g\'ri gapni yozdingiz'},
  ten_words:    {icon:BADGE.books, title:'O\'nlik', desc:'10 ta to\'g\'ri gap'},
  fifty_words:  {icon:BADGE.cap, title:'Yarim yuzlik', desc:'50 ta to\'g\'ri gap'},
  hundred_words:{icon:BADGE.trophy, title:'Yuzlik', desc:'100 ta to\'g\'ri gap'},
  streak5:      {icon:BADGE.flame, title:'Qizib ketdi', desc:'5 marta ketma-ket to\'g\'ri'},
  streak10:     {icon:BADGE.bolt, title:'To\'xtovsiz', desc:'10 marta ketma-ket to\'g\'ri'},
  perfect:      {icon:BADGE.diamond, title:'Mukammallik', desc:'Bir bosqichni xatosiz yakunladingiz'},
  daily3:       {icon:BADGE.calendar, title:'Sadoqat', desc:'3 kun ketma-ket kirdingiz'},
  daily7:       {icon:BADGE.sparkle, title:'Bir hafta', desc:'7 kun ketma-ket kirdingiz'},
  level5:       {icon:BADGE.rocket, title:'Ko\'tarilish', desc:'5-darajaga yetdingiz'},
  ielts_first:  {icon:BADGE.trophy, title:'Kandidat', desc:'Birinchi to\'liq IELTS Mock Testni yakunladingiz'},
  listener:     {icon:BADGE.headset, title:'Tinglovchi', desc:'Tinglash darsini 60% dan yuqori yakunladingiz'},
  det_detective:{icon:BADGE.trophy, title:'Detektiv', desc:'Ingliz detektivi: birinchi ish ochildi'},
  det_inspector:{icon:BADGE.trophy, title:'Inspektor', desc:'Ingliz detektivi: 3 ta ish, o\'rtacha 70+ ball'},
  det_chief:    {icon:BADGE.trophy, title:'Bosh inspektor', desc:'Ingliz detektivi: 5 ta ish, o\'rtacha 80+ ball'},
  det_master:   {icon:BADGE.trophy, title:'Afsonaviy tergovchi', desc:'Ingliz detektivi: 10 ta ish, o\'rtacha 85+ ball'},
};
function unlockAch(id){
  if(!ACHIEVEMENTS[id]) return;
  if(window.__wdAch.has(id)) return;
  window.__wdAch.add(id);
  saveState();
  const a=ACHIEVEMENTS[id];
  setTimeout(()=>{ showToast(`Yutuq: ${a.title}`,IC.medal); fireConfetti(); },600);
}
function checkMilestones(){
  const t=window.__wdTotalLearned||0;
  if(t>=1) unlockAch('first_word');
  if(t>=10) unlockAch('ten_words');
  if(t>=50) unlockAch('fifty_words');
  if(t>=100) unlockAch('hundred_words');
  const s=window.__wdStreak||0;
  if(s>=5) unlockAch('streak5');
  if(s>=10) unlockAch('streak10');
  const d=window.__wdDaily||0;
  if(d>=3) unlockAch('daily3');
  if(d>=7) unlockAch('daily7');
  if(levelInfo(window.__wdXP||0).level>=5) unlockAch('level5');
}

// Kunlik streak — har kun kirilganda tekshiriladi
function checkDailyStreak(){
  const today=new Date().toDateString();
  const last=window.__wdLastDay||'';
  if(last===today) return; // bugun allaqachon hisoblangan
  const y=new Date(); y.setDate(y.getDate()-1);
  const yest=y.toDateString();
  if(last===yest){ window.__wdDaily=(window.__wdDaily||0)+1; } // ketma-ket kun
  else if(last && (window.__wdDaily||0)>0){
    // Necha kun o'tkazib yuborilgan?
    const gap=Math.round((new Date(today)-new Date(last))/86400000)-1;
    const R=window.__wdRoom||{inv:{}}; const have=(R.inv&&R.inv.freeze)||0;
    if(gap>0 && have>=gap){
      R.inv.freeze=have-gap;                       // muzlatgich(lar) ishlatildi
      window.__wdDaily=(window.__wdDaily||0)+1;    // streak saqlanib davom etadi
      try{ showToast('Streak muzlatgich ishlatildi. Streak saqlandi: '+window.__wdDaily+' kun',IC.star||IC.info); }catch(e){}
    } else { window.__wdDaily=1; }
  }
  else { window.__wdDaily=1; }                                 // birinchi kun
  window.__wdLastDay=today;
  // Faol kunlar ro'yxati — haftalik kalendar uchun (ISO YYYY-MM-DD)
  window.__wdActiveDays = window.__wdActiveDays || [];
  const iso = new Date().toISOString().slice(0,10);
  if(!window.__wdActiveDays.includes(iso)){
    window.__wdActiveDays.push(iso);
    // Faqat oxirgi 90 kunni saqlaymiz
    if(window.__wdActiveDays.length > 90) window.__wdActiveDays = window.__wdActiveDays.slice(-90);
  }
  // Eng uzun streak yozuvi
  window.__wdBestStreak = Math.max(Number(window.__wdBestStreak||0), Number(window.__wdDaily||0));
  saveState();
  checkMilestones();
}

/* ========== OMBORXONA — sentence storage (saqlangan holatdan tiklanadi) ========== */
let sentenceVault = SAVED_STATE.sentenceVault || {}; // { levelId: [{term, sentence, aiStatus:'ok'|'bad'|'pend', aiNote:'', ts}] }

/* ============================================================
   VAZIFALAR TIZIMI v2 (v93) — kunlik + haftalik + sandiqlar
   ------------------------------------------------------------
   Kunlik:  3 ta oddiy topshiriq + 1 ta "Kun chellenji" (qiyin, katta mukofot).
            Kuniga 1 marta bitta topshiriqni almashtirish (reroll) mumkin.
            3 ta oddiy bajarilsa — "Kun sandig'i" ochiladi (tasodifiy mukofot).
   Haftalik: 5 ta katta maqsad, dushanba 00:00 da yangilanadi.
   Vazifa ochkolari (VO): har bir olingan mukofot VO beradi; haftalik
            yo'lakda 4 ta sandiq bor (50 · 120 · 200 · 300 VO).
   Tanlash sanadan hisoblangan seed bilan — sahifa yangilansa ham o'zgarmaydi.
   API (eskisi bilan mos): dailyProgress(hook, amount, opts) · dailyCardHtml()
            renderDailyCard() · bindDailyCard() · DAILY_TASKS · __wdDaily2
   ============================================================ */
const Q_IC={
  draw:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  swords:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4M4 4h13l-2.5 4L17 12H4"/></svg>',
  brain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
  brick:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="5"/><rect x="3" y="14" width="18" height="5"/><path d="M12 5v5M8 14v5M16 14v5"/></svg>',
  sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2c1 3.5-1.6 5.3-1.6 8 0 1.4 1 2.4 2.2 2.4 1.5 0 2.3-1.2 2-3 2.2 1.6 3.4 4 3.4 6.4A6 6 0 0 1 12 22a6 6 0 0 1-6-6.2C6 10.4 10.6 7.6 12 2z"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  cap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 4 2 9l10 5 10-5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  dice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/></svg>',
  chest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v9H3z"/><path d="M3 11h18M10 11v3h4v-3"/></svg>',
  chevR:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
};
/* Kunlik oddiy topshiriqlar havzasi */
const DAILY_POOL = [
  {id:'sentences',  goal:3, xp:15, coin:20, icon:'draw',   verb:'3 ta gap tuzing'},
  {id:'sentences5', goal:5, xp:25, coin:35, icon:'draw',   verb:'5 ta gap tuzing', hook:'sentences'},
  {id:'duel',       goal:1, xp:20, coin:25, icon:'swords', verb:"Bitta duelda qatnashing"},
  {id:'duel2',      goal:2, xp:35, coin:45, icon:'swords', verb:"Ikki duelda qatnashing", hook:'duel'},
  {id:'duelwin',    goal:1, xp:30, coin:40, icon:'trophy', verb:"Duelda g'alaba qozoning"},
  {id:'level',      goal:1, xp:25, coin:30, icon:'flag',   verb:"Bitta bosqichni yakunlang"},
  {id:'srs',        goal:10,xp:20, coin:25, icon:'brain',  verb:"10 ta so'zni takrorlang"},
  {id:'srs20',      goal:20,xp:35, coin:40, icon:'brain',  verb:"20 ta so'zni takrorlang", hook:'srs'},
  {id:'srsnew',     goal:5, xp:20, coin:25, icon:'book',   verb:"5 ta yangi so'zni xotiraga joylang"},
  {id:'srsperfect', goal:1, xp:30, coin:35, icon:'target', verb:"Takrorni 90%+ aniqlik bilan tugating"},
  {id:'combo',      goal:10,xp:25, coin:30, icon:'flame',  verb:"Takrorda 10 ta ketma-ket to'g'ri javob", max:true},
  {id:'speak',      goal:3, xp:20, coin:25, icon:'mic',    verb:"3 so'z talaffuzini mashq qiling"},
  {id:'wall',       goal:2, xp:15, coin:20, icon:'brick',  verb:"Devordagi 2 so'zni eslang"},
  {id:'listen',     goal:1, xp:20, coin:25, icon:'sound',  verb:"Bitta tinglash mashqini bajaring"},
  {id:'pattern',    goal:1, xp:25, coin:30, icon:'grid',   verb:"Bitta shablonni o'rganing"},
  {id:'vault',      goal:1, xp:10, coin:15, icon:'lock',   verb:"Omborxonadagi gapni qayta tekshiring"},
  {id:'perfect',    goal:1, xp:40, coin:50, icon:'star',   verb:"Bosqichni xatosiz yakunlang"},
  {id:'newword',    goal:3, xp:15, coin:20, icon:'book',   verb:"3 yangi so'z o'rganing"},
  {id:'xp100',      goal:100,xp:0, coin:30, icon:'bolt',   verb:"100 XP to'plang", hook:'xp'},
  {id:'share',      goal:1, xp:15, coin:25, icon:'share',  verb:"Natijangizni story'ga ulashing"}
];
/* Kun chellenjlari — qiyin, mukofoti 2-3 barobar */
const DAILY_CHALLENGES = [
  {id:'ch_srs40',   goal:40, xp:60, coin:90,  icon:'brain',  verb:"40 ta so'zni takrorlang", hook:'srs'},
  {id:'ch_duel3',   goal:3,  xp:70, coin:100, icon:'trophy', verb:"3 ta duelda g'alaba qozoning", hook:'duelwin'},
  {id:'ch_xp300',   goal:300,xp:0,  coin:100, icon:'bolt',   verb:"Bugun 300 XP to'plang", hook:'xp'},
  {id:'ch_combo20', goal:20, xp:60, coin:90,  icon:'flame',  verb:"20 ta ketma-ket to'g'ri javob", hook:'combo', max:true},
  {id:'ch_level2',  goal:2,  xp:70, coin:90,  icon:'flag',   verb:"2 ta bosqichni yakunlang", hook:'level'},
  {id:'ch_sent10',  goal:10, xp:60, coin:90,  icon:'draw',   verb:"10 ta gap tuzing", hook:'sentences'},
  {id:'ch_ielts',   goal:1,  xp:80, coin:120, icon:'cap',    verb:"IELTS modulini topshiring", hook:'ielts'},
  {id:'ch_speak12', goal:12, xp:60, coin:90,  icon:'mic',    verb:"12 ta talaffuz mashqi", hook:'speak'}
];
/* Haftalik maqsadlar */
const WEEKLY_POOL = [
  {id:'w_xp',      goal:800, coin:150, vo:40, icon:'bolt',   verb:"Hafta davomida 800 XP to'plang", hook:'xp'},
  {id:'w_active',  goal:5,   coin:120, vo:40, icon:'cal',    verb:"5 kun faol bo'ling", hook:'activeday', max:true},
  {id:'w_srs',     goal:150, coin:150, vo:40, icon:'brain',  verb:"150 ta so'zni takrorlang", hook:'srs'},
  {id:'w_duelwin', goal:5,   coin:150, vo:40, icon:'trophy', verb:"5 ta duelda g'alaba qozoning", hook:'duelwin'},
  {id:'w_sent',    goal:25,  coin:120, vo:35, icon:'draw',   verb:"25 ta gap tuzing", hook:'sentences'},
  {id:'w_listen',  goal:3,   coin:120, vo:35, icon:'sound',  verb:"3 ta tinglash darsini bajaring", hook:'listen'},
  {id:'w_level',   goal:6,   coin:140, vo:40, icon:'flag',   verb:"6 ta bosqichni yakunlang", hook:'level'},
  {id:'w_speak',   goal:30,  coin:120, vo:35, icon:'mic',    verb:"30 ta talaffuz mashqi", hook:'speak'},
  {id:'w_full',    goal:4,   coin:180, vo:50, icon:'star',   verb:"4 kun barcha kunlik topshiriqlarni bajaring", hook:'dailyfull'},
  {id:'w_perfect', goal:3,   coin:140, vo:40, icon:'target', verb:"3 ta 90%+ takror sessiyasi", hook:'srsperfect'},
  {id:'w_ielts',   goal:2,   coin:160, vo:45, icon:'cap',    verb:"2 ta IELTS modulini topshiring", hook:'ielts'},
  {id:'w_new',     goal:40,  coin:140, vo:40, icon:'book',   verb:"40 ta yangi so'zni xotiraga joylang", hook:'srsnew'}
];
/* Haftalik sandiq yo'lagi (vazifa ochkolari bo'yicha) */
const WEEK_TIERS=[
  {vo:50,  coin:60,  label:'Bronza sandiq',  tone:'br'},
  {vo:120, coin:120, label:'Kumush sandiq',  tone:'si', boost:15},
  {vo:200, coin:200, label:'Oltin sandiq',   tone:'go'},
  {vo:300, coin:350, label:'Chempion sandig\'i', tone:'ch', boost:30, share:true}
];
const Q_VO={daily:10, challenge:30, chest:15};
function __wdDaySeed(d){ const s=(d||new Date()); return s.getFullYear()*10000+(s.getMonth()+1)*100+s.getDate(); }
function __qRng(seed){ let x=(seed*9301+49297)%233280; return ()=>{ x=(x*9301+49297)%233280; return x/233280; }; }
function __qWeekStart(d){ const x=new Date(d||new Date()); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
function __qWeekKey(d){ const s=__qWeekStart(d); return s.getFullYear()+'-'+String(s.getMonth()+1).padStart(2,'0')+'-'+String(s.getDate()).padStart(2,'0'); }
function __qPick(pool,n,rnd,exclude){
  const p=pool.slice(), out=[], used=new Set(exclude||[]);
  while(out.length<n && p.length){ const t=p.splice(Math.floor(rnd()*p.length),1)[0]; const h=t.hook||t.id;
    if(used.has(h)) continue; used.add(h); out.push(t); }
  return out;
}
function dailyPickTasks(day){
  const r=__qRng(__wdDaySeed(day));
  const t=__qPick(DAILY_POOL,3,r);
  return t.length===3?t:DAILY_POOL.slice(0,3);
}
function dailyPickChallenge(day,exclude){
  const r=__qRng(__wdDaySeed(day)*7+3);
  return __qPick(DAILY_CHALLENGES,1,r,exclude)[0]||DAILY_CHALLENGES[0];
}
function weeklyPick(){
  const s=__qWeekStart(); const r=__qRng(__wdDaySeed(s)*13+11);
  return __qPick(WEEKLY_POOL,5,r);
}
const __qFind=id=>DAILY_POOL.find(x=>x.id===id)||DAILY_CHALLENGES.find(x=>x.id===id)||WEEKLY_POOL.find(x=>x.id===id);

/* ---------- Holat ---------- */
function __qFreshDay(){
  const tasks=dailyPickTasks(), ch=dailyPickChallenge(null,tasks.map(t=>t.hook||t.id));
  return {day:new Date().toDateString(), done:{}, claimed:{}, bonusClaimed:false, ids:tasks.map(t=>t.id), ch:ch.id, rerolled:false, chest:null, full:false};
}
let __wdDaily2=(function(){
  const s=SAVED_STATE.daily2, today=new Date().toDateString();
  if(s && s.day===today){
    if(!Array.isArray(s.ids)){ const f=__qFreshDay(); s.ids=f.ids; s.ch=f.ch; }
    return s;
  }
  return __qFreshDay();
})();
window.__wdDaily2=__wdDaily2;
let DAILY_TASKS=__wdDaily2.ids.map(__qFind).filter(Boolean);
let DAILY_CH=__qFind(__wdDaily2.ch)||DAILY_CHALLENGES[0];
function __qFreshWeek(){ return {wk:__qWeekKey(), ids:weeklyPick().map(t=>t.id), done:{}, claimed:{}, vo:0, tiers:{}, days:[]}; }
let __wdWeekly=(function(){ const s=SAVED_STATE.weekly; if(s && s.wk===__qWeekKey() && Array.isArray(s.ids)) return s; return __qFreshWeek(); })();
window.__wdWeekly=__wdWeekly;
let WEEKLY_TASKS=__wdWeekly.ids.map(__qFind).filter(Boolean);
function __qSave(){ try{ SAVED_STATE.daily2=__wdDaily2; SAVED_STATE.weekly=__wdWeekly; saveState(); }catch(e){} }

function dailyEnsureToday(){
  const today=new Date().toDateString();
  if(__wdDaily2.day!==today){
    __wdDaily2=__qFreshDay(); window.__wdDaily2=__wdDaily2;
    DAILY_TASKS=__wdDaily2.ids.map(__qFind).filter(Boolean);
    DAILY_CH=__qFind(__wdDaily2.ch)||DAILY_CHALLENGES[0];
    __qSave();
  }
  if(__wdWeekly.wk!==__qWeekKey()){
    __wdWeekly=__qFreshWeek(); window.__wdWeekly=__wdWeekly;
    WEEKLY_TASKS=__wdWeekly.ids.map(__qFind).filter(Boolean);
    __qSave();
  }
}
function __qHookOf(t){ return t.hook||t.id; }
/* Progress: dailyProgress('sentences'), dailyProgress('xp',25), dailyProgress('combo',12,{max:true}) */
function dailyProgress(hook, amount, opts){
  dailyEnsureToday();
  amount=amount||1;
  const isMax=!!(opts&&opts.max);
  const bump=(store,t)=>{
    const before=store[t.id]||0;
    store[t.id]= (isMax||t.max) ? Math.max(before,amount) : before+amount;
    return before;
  };
  const fired=[];
  // Kunlik + chellenj
  const dlist=DAILY_TASKS.concat([DAILY_CH]).filter(t=>__qHookOf(t)===hook);
  dlist.forEach(t=>{ const b=bump(__wdDaily2.done,t); if(b<t.goal && __wdDaily2.done[t.id]>=t.goal) fired.push({t,w:false}); });
  if(!dlist.length && !isMax) __wdDaily2.done[hook]=(__wdDaily2.done[hook]||0)+amount;
  // Haftalik
  const tk=srsDayKeyQ();
  if(__wdWeekly.days.indexOf(tk)<0){ __wdWeekly.days.push(tk); }
  WEEKLY_TASKS.forEach(t=>{
    const h=__qHookOf(t); let b, now;
    if(h==='activeday'){ b=__wdWeekly.done[t.id]||0; __wdWeekly.done[t.id]=__wdWeekly.days.length; }
    else if(h===hook){ b=bump(__wdWeekly.done,t); }
    else return;
    now=__wdWeekly.done[t.id];
    if(b<t.goal && now>=t.goal) fired.push({t,w:true});
  });
  // Barcha kunlik bajarildi → haftalik "dailyfull"
  if(!__wdDaily2.full && dailyAllDone()){
    __wdDaily2.full=true;
    WEEKLY_TASKS.filter(t=>__qHookOf(t)==='dailyfull').forEach(t=>{ const b=__wdWeekly.done[t.id]||0; __wdWeekly.done[t.id]=b+1; if(b<t.goal&&b+1>=t.goal) fired.push({t,w:true}); });
  }
  fired.forEach(f=>{
    try{ showToast((f.w?'Haftalik maqsad bajarildi: ':(f.t.id.startsWith('ch_')?'Kun chellenji bajarildi: ':'Topshiriq bajarildi: '))+f.t.verb, Q_IC.check); }catch(e){}
    try{ SFX.play('correct'); }catch(e){}
  });
  __qSave();
  try{ if(document.getElementById('dailyCard')) renderDailyCard(); }catch(e){}
  try{ if(document.getElementById('qxView')) qxRender(); }catch(e){}
}
function srsDayKeyQ(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
window.__wdDailyProgress=dailyProgress;
function dailyAllDone(){ return DAILY_TASKS.every(t=>(__wdDaily2.done[t.id]||0)>=t.goal); }
function questReadyCount(){
  let n=0;
  DAILY_TASKS.concat([DAILY_CH]).forEach(t=>{ if((__wdDaily2.done[t.id]||0)>=t.goal && !__wdDaily2.claimed[t.id]) n++; });
  if(dailyAllDone() && !__wdDaily2.bonusClaimed) n++;
  WEEKLY_TASKS.forEach(t=>{ if((__wdWeekly.done[t.id]||0)>=t.goal && !__wdWeekly.claimed[t.id]) n++; });
  WEEK_TIERS.forEach((tr,i)=>{ if(__wdWeekly.vo>=tr.vo && !__wdWeekly.tiers[i]) n++; });
  return n;
}
function __qLeft(target){
  const ms=target-Date.now(); if(ms<=0) return '0 daq';
  const h=Math.floor(ms/3600000), m=Math.floor(ms%3600000/60000), d=Math.floor(h/24);
  if(d>=1) return d+' kun '+(h%24)+' soat';
  return h? h+' soat '+m+' daq' : m+' daq';
}
function __qDayEnd(){ const d=new Date(); d.setHours(24,0,0,0); return d.getTime(); }
function __qWeekEnd(){ const d=__qWeekStart(); d.setDate(d.getDate()+7); return d.getTime(); }

/* ---------- Mukofot berish ---------- */
function __qGiveVO(n){
  const before=__wdWeekly.vo||0; __wdWeekly.vo=before+n;
  WEEK_TIERS.forEach(t=>{ if(before<t.vo && __wdWeekly.vo>=t.vo){ try{ showToast(t.label+' ochildi!',Q_IC.chest); }catch(e){} } });
}
function questClaim(kind,id){
  dailyEnsureToday();
  if(kind==='d'||kind==='c'){
    const t=kind==='c'?DAILY_CH:DAILY_TASKS.find(x=>x.id===id); if(!t) return;
    if(__wdDaily2.claimed[t.id] || (__wdDaily2.done[t.id]||0)<t.goal) return;
    __wdDaily2.claimed[t.id]=true;
    try{ if(t.coin) addCoins(t.coin); }catch(e){}
    try{ if(t.xp) addXP(t.xp); }catch(e){}
    __qGiveVO(kind==='c'?Q_VO.challenge:Q_VO.daily);
    if(kind==='c'){ try{ fireConfetti(); }catch(e){} }
  } else if(kind==='w'){
    const t=WEEKLY_TASKS.find(x=>x.id===id); if(!t) return;
    if(__wdWeekly.claimed[t.id] || (__wdWeekly.done[t.id]||0)<t.goal) return;
    __wdWeekly.claimed[t.id]=true;
    try{ addCoins(t.coin); }catch(e){}
    __qGiveVO(t.vo||40);
    try{ fireConfetti(); }catch(e){}
  }
  try{ SFX.play('coin'); }catch(e){}
  __qSave();
  try{ renderDailyCard(); }catch(e){}
  try{ if(document.getElementById('qxView')) qxRender(); }catch(e){}
}
function questReroll(id){
  dailyEnsureToday();
  if(__wdDaily2.rerolled){ showToast("Bugun almashtirish ishlatilgan",IC.info); return; }
  const i=__wdDaily2.ids.indexOf(id); if(i<0) return;
  if((__wdDaily2.done[id]||0)>0){ showToast("Boshlangan topshiriqni almashtirib bo'lmaydi",IC.info); return; }
  const used=new Set(DAILY_TASKS.map(__qHookOf).concat([__qHookOf(DAILY_CH)]));
  const cand=DAILY_POOL.filter(t=>!used.has(__qHookOf(t)));
  if(!cand.length) return;
  const n=cand[Math.floor(Math.random()*cand.length)];
  __wdDaily2.ids[i]=n.id; __wdDaily2.rerolled=true;
  DAILY_TASKS=__wdDaily2.ids.map(__qFind).filter(Boolean);
  __qSave();
  try{ renderDailyCard(); }catch(e){}
  try{ if(document.getElementById('qxView')) qxRender(); }catch(e){}
  showToast("Yangi topshiriq: "+n.verb,Q_IC.dice);
}
/* Sandiq ochish — tasodifiy mukofot, animatsiya bilan */
/* ---------- Qator HTML'i ---------- */
/* Boshi ekranidagi karta */
function renderDailyCard(){
  const el=document.getElementById('dailyCard'); if(!el) return;
  const w=document.createElement('div'); w.innerHTML=dailyCardHtml();
  el.replaceWith(w.firstElementChild); bindDailyCard();
}
/* ---------- To'liq vazifalar ekrani ---------- */
let qxTab='day';
function qxOpen(tab){
  qxTab=tab||'day';
  let el=document.getElementById('qxView');
  if(!el){ el=document.createElement('div'); el.id='qxView'; el.className='xm qx'; document.body.appendChild(el); }
  qxRender(); requestAnimationFrame(()=>el.classList.add('on'));
}
window.__wdOpenQuests=qxOpen;
function qxClose(){ const el=document.getElementById('qxView'); if(!el) return; el.classList.remove('on'); setTimeout(()=>el.remove(),320); try{ renderDailyCard(); }catch(e){} }

/* ---------- v93.1 ko'rinish qatlami ---------- */
const __qChestSvg=`<svg viewBox="0 0 64 56" class="qc-svg" aria-hidden="true">
  <g class="qc-lid"><path d="M6 24V18a12 12 0 0 1 12-12h28a12 12 0 0 1 12 12v6z"/><path d="M6 24h52" class="qc-band"/></g>
  <path d="M6 26h52v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z"/><rect x="27" y="22" width="10" height="12" rx="2" class="qc-lock"/></svg>`;
function __qRow(t,store,claimed,kind){
  const done=Math.min(store[t.id]||0,t.goal), complete=done>=t.goal, isCl=claimed[t.id];
  const pct=Math.round(done/t.goal*100);
  let right;
  if(complete && !isCl) right=`<button class="qt-claim" data-qclaim="${kind}:${t.id}">Olish<b>+${t.coin}</b></button>`;
  else if(isCl) right=`<span class="qt-ok" aria-label="Olindi">${Q_IC.check}</span>`;
  else right=`<span class="qt-num">${done}<small>/${t.goal}</small></span>`;
  return `<div class="qt${complete?' done':''}${isCl?' cl':''}">
    <span class="qt-ic">${Q_IC[t.icon]||Q_IC.star}</span>
    <div class="qt-b"><p class="qt-l">${t.verb}</p><div class="qt-bar"><i style="width:${pct}%"></i></div></div>
    ${right}</div>`;
}
function dailyCardHtml(){
  dailyEnsureToday();
  const d=__wdDaily2, n=DAILY_TASKS.filter(t=>(d.done[t.id]||0)>=t.goal).length;
  const allDone=dailyAllDone();
  const ch=DAILY_CH;
  const W=__wdWeekly, wDone=WEEKLY_TASKS.filter(t=>(W.done[t.id]||0)>=t.goal).length;
  const ready=questReadyCount();
  const left=3-n;
  return `<section class="qcard" id="dailyCard">
    <header class="qcard-h">
      <h2>Bugungi topshiriqlar</h2>
      <span>${n} / 3</span>
    </header>
    <div class="qcard-list">${DAILY_TASKS.map(t=>__qRow(t,d.done,d.claimed,'d')).join('')}</div>
    <div class="qcard-ch">
      <p class="qcard-sub">${Q_IC.bolt}Kun chellenji, mukofoti uch barobar</p>
      ${__qRow(ch,d.done,d.claimed,'c')}
    </div>
    <div class="qcard-chest${allDone&&!d.bonusClaimed?' ready':''}${d.bonusClaimed?' got':''}">
      <span class="qcard-chest-ic">${__qChestSvg}</span>
      <div><b>Kun sandig'i</b><span>${d.bonusClaimed?'Ochildi. Ertaga yangisi.':allDone?'Ochishga tayyor':`Yana ${left} ta topshiriq bajaring`}</span></div>
      ${allDone&&!d.bonusClaimed?`<button data-qchest="day">Ochish</button>`:''}
    </div>
    <button class="qcard-week" id="qWeekBtn">
      <span><b>Haftalik maqsadlar</b><em>${wDone} / ${WEEKLY_TASKS.length} bajarildi${ready?`, ${ready} ta mukofot olinmagan`:''}</em></span>
      ${Q_IC.chevR}
    </button>
    <p class="qcard-foot">Topshiriqlar ${__qLeft(__qDayEnd())}dan keyin yangilanadi.</p>
  </section>`;
}
function bindDailyCard(){
  const card=document.getElementById('dailyCard'); if(!card) return;
  card.querySelectorAll('[data-qclaim]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); const [k,id]=b.dataset.qclaim.split(':'); questClaim(k,id); });
  const c=card.querySelector('[data-qchest]'); if(c) c.onclick=()=>questOpenChest('day');
  const w=card.querySelector('#qWeekBtn'); if(w) w.onclick=()=>qxOpen('week');
}
function qxRender(){
  const el=document.getElementById('qxView'); if(!el) return;
  dailyEnsureToday();
  const d=__wdDaily2, W=__wdWeekly, vo=W.vo||0, maxVo=WEEK_TIERS[WEEK_TIERS.length-1].vo;
  const nDone=DAILY_TASKS.filter(t=>(d.done[t.id]||0)>=t.goal).length;
  const nextT=WEEK_TIERS.find(t=>vo<t.vo);
  const dayBody=`
    <div class="qx-sum"><b>${nDone} / 3</b><p>topshiriq bajarildi. Yangilari ${__qLeft(__qDayEnd())}dan keyin.</p></div>
    <div class="qx-box">${DAILY_TASKS.map(t=>{
      const canRe=!d.rerolled && !(d.done[t.id]>0);
      return __qRow(t,d.done,d.claimed,'d')+(canRe?`<button class="qx-re" data-qre="${t.id}">${Q_IC.dice}Boshqasiga almashtirish</button>`:'');
    }).join('')}</div>
    <h3 class="qx-h">Kun chellenji</h3>
    <div class="qx-box">${__qRow(DAILY_CH,d.done,d.claimed,'c')}</div>
    <h3 class="qx-h">Kun sandig'i</h3>
    <div class="qx-box qx-chest${dailyAllDone()&&!d.bonusClaimed?' ready':''}">
      <span class="qcard-chest-ic">${__qChestSvg}</span>
      <p>${d.bonusClaimed?'Bugungi sandiq ochildi.':'Uchala topshiriq bajarilsa ochiladi. Ichida 40–100 tanga, ba\'zan XP yoki 2x XP.'}</p>
      ${dailyAllDone()&&!d.bonusClaimed?`<button data-qchest="day">Ochish</button>`:''}
    </div>
    <p class="qx-note">${d.rerolled?'Bugun topshiriq almashtirildi.':'Boshlanmagan bitta topshiriqni kuniga bir marta almashtirsa bo\'ladi.'} Har bir olingan mukofot haftalik hisobga ${Q_VO.daily} ball qo'shadi, chellenj ${Q_VO.challenge} ball.</p>`;
  const weekBody=`
    <div class="qx-sum"><b>${vo}</b><p>haftalik ball. ${nextT?`Keyingi sandiqqacha ${nextT.vo-vo} ball.`:'Barcha sandiqlar ochildi.'} Hafta ${__qLeft(__qWeekEnd())}dan keyin yangilanadi.</p></div>
    <ol class="qx-tiers">
      ${WEEK_TIERS.map((t,i)=>{ const open=vo>=t.vo, got=W.tiers[i];
        return `<li class="${open?'open':''}${got?' got':''}">
          <span class="qx-tier-mark">${got?Q_IC.check:__qChestSvg}</span>
          <div><b>${t.label}</b><span>${t.vo} ball: ${t.coin} tanga${t.boost?`, ${t.boost} daqiqa 2x XP`:''}${t.share?', story rasmi':''}</span></div>
          ${open&&!got?`<button data-qtier="${i}">Ochish</button>`:got?'<em>Olindi</em>':`<em>${t.vo-vo} ball qoldi</em>`}
        </li>`; }).join('')}
    </ol>
    <div class="qx-meter" aria-hidden="true"><i style="width:${Math.min(100,vo/maxVo*100)}%"></i>${WEEK_TIERS.map(t=>`<s style="left:${t.vo/maxVo*100}%"></s>`).join('')}</div>
    <h3 class="qx-h">Maqsadlar</h3>
    <div class="qx-box">${WEEKLY_TASKS.map(t=>__qRow(t,W.done,W.claimed,'w')).join('')}</div>
    <h3 class="qx-h">Faol kunlar</h3>
    <div class="qx-days">${['Du','Se','Ch','Pa','Ju','Sh','Ya'].map((n,i)=>{ const x=__qWeekStart(); x.setDate(x.getDate()+i);
      const k=x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate(); const on=W.days.indexOf(k)>=0; const td=x.toDateString()===new Date().toDateString();
      return `<div class="${on?'on':''}${td?' td':''}"><i>${on?Q_IC.check:''}</i><span>${n}</span></div>`; }).join('')}</div>`;
  el.innerHTML=`
    <div class="xm-head">
      <button class="xm-ib" id="qxBack" aria-label="Orqaga"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="xm-ht"><b>Topshiriqlar</b></div>
      <div class="qx-coins" title="Tangalar">${window.__wdCoins||0} tanga</div>
    </div>
    <div class="qx-tabs" role="tablist"><button data-tab="day" class="${qxTab==='day'?'on':''}">Bugun</button><button data-tab="week" class="${qxTab==='week'?'on':''}">Shu hafta</button></div>
    <div class="xm-scroll">${qxTab==='day'?dayBody:weekBody}</div>`;
  el.querySelector('#qxBack').onclick=qxClose;
  el.querySelectorAll('.qx-tabs button').forEach(b=>b.onclick=()=>{ qxTab=b.dataset.tab; qxRender(); });
  el.querySelectorAll('[data-qclaim]').forEach(b=>b.onclick=()=>{ const [k,id]=b.dataset.qclaim.split(':'); questClaim(k,id); });
  el.querySelectorAll('[data-qre]').forEach(b=>b.onclick=()=>questReroll(b.dataset.qre));
  el.querySelectorAll('[data-qtier]').forEach(b=>b.onclick=()=>questOpenChest('week',Number(b.dataset.qtier)));
  const c=el.querySelector('[data-qchest]'); if(c) c.onclick=()=>questOpenChest('day');
}
function questOpenChest(kind,tier){
  dailyEnsureToday();
  let coin=0,xp=0,boost=0,title='',share=false;
  if(kind==='day'){
    if(!dailyAllDone()||__wdDaily2.bonusClaimed) return;
    __wdDaily2.bonusClaimed=true;
    const r=Math.random();
    coin = 40+Math.floor(Math.random()*7)*10;
    if(r<.18) boost=15; else if(r<.45) xp=50;
    title="Kun sandig'i";
    __qGiveVO(Q_VO.chest);
  } else {
    const t=WEEK_TIERS[tier]; if(!t || __wdWeekly.tiers[tier] || (__wdWeekly.vo||0)<t.vo) return;
    __wdWeekly.tiers[tier]=true;
    coin=t.coin; boost=t.boost||0; title=t.label; share=!!t.share;
  }
  __qSave();
  const wrap=document.createElement('div');
  wrap.className='qc-layer'; wrap.innerHTML=`
    <div class="qc-bg"></div>
    <div class="qc-box" role="dialog" aria-label="${title}">
      <button class="qc-chest" id="qcChest" aria-label="Sandiqni ochish">${__qChestSvg}</button>
      <h2 class="qc-ttl">${title}</h2>
      <p class="qc-tap" id="qcTap">Ochish uchun sandiqni bosing</p>
      <div class="qc-out" id="qcOut" hidden>
        <dl>
          ${coin?`<div><dt>Tanga</dt><dd>+${coin}</dd></div>`:''}
          ${xp?`<div><dt>XP</dt><dd>+${xp}</dd></div>`:''}
          ${boost?`<div><dt>2x XP</dt><dd>${boost} daqiqa</dd></div>`:''}
        </dl>
        <button class="qc-btn" id="qcOk">Olish</button>
        ${share?`<button class="qc-btn2" id="qcShare">Story uchun rasm</button>`:''}
      </div>
    </div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(()=>wrap.classList.add('on'));
  let opened=false;
  const open=()=>{
    if(opened) return; opened=true;
    wrap.classList.add('opened');
    try{ SFX.play('reward'); }catch(e){}
    setTimeout(()=>{
      wrap.querySelector('#qcTap').hidden=true; wrap.querySelector('#qcOut').hidden=false;
      try{ if(coin) addCoins(coin,true); }catch(e){}
      try{ if(xp) addXP(xp); }catch(e){}
      if(boost){ try{ window.__wdBoostUntil=Math.max(Date.now(),window.__wdBoostUntil||0)+boost*60000; saveState(); }catch(e){} }
      try{ wrap.querySelector('#qcOk').focus(); }catch(e){}
    },420);
  };
  wrap.querySelector('#qcChest').onclick=open;
  const close=()=>{ if(!opened){ open(); return; } wrap.classList.remove('on'); setTimeout(()=>wrap.remove(),250);
    try{ renderDailyCard(); }catch(e){} try{ if(document.getElementById('qxView')) qxRender(); }catch(e){} };
  wrap.querySelector('.qc-bg').onclick=close;
  wrap.querySelector('#qcOk').onclick=close;
  const sh=wrap.querySelector('#qcShare');
  if(sh) sh.onclick=()=>{ close(); try{ window.__wdStory.open('weekly',{vo:__wdWeekly.vo,done:WEEKLY_TASKS.filter(t=>__wdWeekly.claimed[t.id]).length,total:WEEKLY_TASKS.length}); }catch(e){} };
}

function vaultSave(levelId, term, sentence, status='pend', note=''){
  if(!sentenceVault[levelId]) sentenceVault[levelId] = [];
  sentenceVault[levelId].push({ term, sentence, aiStatus:status, aiNote:note, ts:Date.now() });
  saveState();
  try{ dailyProgress('sentences'); }catch(e){}   // kunlik topshiriq: gap tuzildi
  return sentenceVault[levelId].length-1;
}
function vaultSetAI(levelId, idx, status, note){
  if(sentenceVault[levelId] && sentenceVault[levelId][idx]){
    sentenceVault[levelId][idx].aiStatus = status;
    sentenceVault[levelId][idx].aiNote = note;
    saveState();
  }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
/* URL'ni atributga qo'yishdan oldin tekshirish: faqat https va data:image ruxsat.
   Bulutdan (boshqa foydalanuvchilardan) kelgan avatar orqali XSS bo'lmasligi uchun. */
function safeUrl(u){
  const s=String(u||'').trim();
  if(/^https:\/\//i.test(s) || /^data:image\//i.test(s)) return escapeHtml(s);
  return '';
}

/* ========== OVOZLI O'QISH (Text-to-Speech) — yagona, yaxshilangan versiya ========== */
let __ttsVoices=[];
function __refreshVoices(){ if('speechSynthesis' in window) __ttsVoices=speechSynthesis.getVoices(); }
if('speechSynthesis' in window){
  __refreshVoices();
  speechSynthesis.onvoiceschanged = __refreshVoices; // ko'p brauzerlarda ovozlar asinxron yuklanadi
}
function pickEnglishVoice(){
  if(!__ttsVoices.length) return null;
  const preferred=[/Google US English/i,/Microsoft.*Aria/i,/Microsoft.*Guy/i,/Samantha/i,/Daniel/i,/Alex/i];
  for(const re of preferred){ const v=__ttsVoices.find(v=>re.test(v.name)); if(v) return v; }
  const enUS=__ttsVoices.find(v=>v.lang==='en-US');
  if(enUS) return enUS;
  return __ttsVoices.find(v=>/^en/i.test(v.lang)) || null;
}
function speakNative(term){
  if(!('speechSynthesis' in window)){ showToast("Bu qurilma ovozli o'qishni qo'llab-quvvatlamaydi",IC.info); return; }
  speechSynthesis.cancel(); // oldingi ovozni to'xtatib, ustma-ust chiqishning oldini oladi
  const u=new SpeechSynthesisUtterance(term);
  const v=pickEnglishVoice();
  if(v) u.voice=v;
  u.lang='en-US'; u.rate=0.86; u.pitch=1; u.volume=1;
  u.onerror=()=>{};
  speechSynthesis.speak(u);
}
window.__wdSpeakNative=speakNative;
/* Asosiy speak(): uzun matnlar (gap, hikoya) — server ovozida (Groq TTS);
   qisqa so'zlar tizim ovozida — bepul kvotani behuda sarflamaslik uchun. */
function speak(term){
  const txt=String(term||'').trim();
  if(typeof window.__wdServerSpeak==='function' && txt.length>=40){
    window.__wdServerSpeak(txt).then(ok=>{ if(!ok) speakNative(txt); });
    return;
  }
  speakNative(term);
}

/* ========== SPLASH ========== */
/* v102: splash ilova tayyor bo'lganda yopiladi (boshqaruvi splash ichidagi skriptda) */
window.__wdHideSplash=function(){
  if(window.__wdHideSplash.done) return; window.__wdHideSplash.done=true;
  const sp=document.getElementById('splash'); if(sp) sp.classList.add('leaving');
  document.getElementById('app').classList.add('visible');
  try{ const W=window.Telegram&&window.Telegram.WebApp; if(W&&window.__wdInTelegram!==false){ W.setHeaderColor('#0F1B3D'); try{ W.setBackgroundColor(getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0,3).reduce((h,x)=>h+(+x).toString(16).padStart(2,'0'),'#')); }catch(_){} } }catch(_){}
  setTimeout(()=>{ const x=document.getElementById('splash'); if(x) x.remove(); }, 580);
  // Splash tugagach: kirmagan mehmonga xush kelibsiz ekrani (Supabase javobini biroz kutamiz)
  setTimeout(maybeShowWelcome, 400);
  setTimeout(function(){ try{ maybeShowRegNudge(); }catch(e){} }, 1800);
};

/* Xush kelibsiz ekrani — faqat hisobga kirmagan va ilk marta ochgan mehmonga */
function maybeShowWelcome(){
  try{
    if(localStorage.getItem('wd_welcomed')==='1') return;   // bir marta ko'rsatiladi
  }catch(e){}
  const check=()=>{
    // Hisobga kirgan bo'lsa — umuman ko'rsatmaymiz
    if(typeof window.__wdIsSignedIn==='function' && window.__wdIsSignedIn()) return;
    showWelcome();
  };
  // Supabase tayyor bo'lguncha kutamiz (maksimum 1.5s), keyin qaror qilamiz
  if(window.__sbReady && window.__sbReady.then){
    let done=false;
    window.__sbReady.then(()=>{ if(!done){ done=true; check(); } });
    setTimeout(()=>{ if(!done){ done=true; check(); } }, 1500);
  } else check();
}

function showWelcome(){
  if(document.getElementById('welcome')) return;
  const SV=(p,sw)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||2.2}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I={
    cloud:SV('<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6 19z"/>'),
    flame:SV('<path d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.6-6.3-4.3-8.2-.5 2-1.6 3.2-2.9 3.8.3-2.8-.7-5.6-3.3-7.8C8 6.5 5 9.6 5 14.6 5 19 8 22 12 22z"/>'),
    sword:SV('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/>'),
    mail:SV('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',2),
    back:SV('<path d="M15 5l-7 7 7 7"/>',2.4),
    eye:SV('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',1.9),
    eyeOff:SV('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',1.9),
    warn:SV('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'),
    okc:SV('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    check:SV('<path d="M5 12.5l4.5 4.5L19 7.5"/>',2.8)
  };
  const w=document.createElement('div'); w.id='welcome';
  w.setAttribute('role','dialog'); w.setAttribute('aria-modal','true'); w.setAttribute('aria-label','WordDrop — xush kelibsiz');
  const bubs=[[46,9,18,-10,7],[34,82,22,12,6],[28,24,30,8,9],[40,70,62,-14,8],[24,90,8,10,10]]
    .map(([s,l,t,r,d])=>`<i class="wc-bub" style="width:${s}px;height:${s}px;left:${l}%;top:${t}%;font-size:${Math.round(s*.48)}px;--r:${r}deg;animation-duration:${d}s">W</i>`).join('');
  w.innerHTML=`
    <div class="wc-hero">${bubs}
      <div class="wc-hero-in">
        <div class="wc-tile"><div class="wc-tile-in"><b>W</b></div></div>
        <div class="wc-pool"><i></i><i></i><i></i></div>
        <div class="wc-word">WordDrop</div>
      </div>
      <div class="wc-mini" aria-hidden="true"><i>W</i>WordDrop</div>
    </div>
    <div class="wc-sheet" id="wcSheet"><div class="wc-views" id="wcViews">

      <section class="wc-v cur" id="wcIntro"><div class="wc-col">
        <h1 class="wc-h">Ingliz tili — har kuni, <em>tomchilab</em></h1>
        <p class="wc-p">Kuniga 10 daqiqa: so'zlar, shablonlar va jonli duellar. Hisob ochsangiz, hammasi saqlanib boradi.</p>
        <div class="wc-perks">
          <div class="wc-perk" style="--c:#2F6FED"><div class="ic">${I.cloud}</div><b>Bulutda saqlanadi</b><span>Istalgan qurilmada</span></div>
          <div class="wc-perk" style="--c:#F59E0B"><div class="ic">${I.flame}</div><b>Kunlik streak</b><span>Odatni ushlab turing</span></div>
          <div class="wc-perk" style="--c:#8B5CF6"><div class="ic">${I.sword}</div><b>Liga va duel</b><span>Do'stlar bilan bellashing</span></div>
        </div>
        <div class="wc-stack">
          <button class="wc-btn goo" id="wcGoogle" type="button">${(typeof GOOGLE_LOGO_SVG!=='undefined')?GOOGLE_LOGO_SVG:''}<span>Google bilan davom etish</span></button>
          <button class="wc-btn pri" id="wcEmail" type="button">${I.mail}<span>Email bilan ro'yxatdan o'tish</span></button>
        </div>
        <div class="wc-note" id="wcNoteIntro" style="margin:12px 0 0"></div>
        <div class="wc-links">
          <button class="wc-link" id="wcToSignin" type="button">Hisobingiz bormi? <b>Kirish</b></button>
          <button class="wc-link mute" id="wcGuest" type="button">Hozircha mehmon sifatida</button>
        </div>
      </div></section>

      <section class="wc-v off-r" id="wcForm"><div class="wc-col">
        <div class="wc-top">
          <button class="wc-back" id="wcBack" type="button" aria-label="Orqaga">${I.back}</button>
          <div class="wc-seg" id="wcSeg" role="tablist"><i></i>
            <button type="button" role="tab" data-m="signup" class="on">Ro'yxatdan o'tish</button>
            <button type="button" role="tab" data-m="signin">Kirish</button>
          </div>
        </div>
        <h2 class="wc-fh" id="wcFh">Hisob yarating</h2>
        <p class="wc-fp" id="wcFp">Hozirgi progressingiz, tangalar va darajangiz shu hisobga o'tadi.</p>
        <div class="wc-note" id="wcNote" role="alert"></div>
        <div class="wc-field" id="wcFEmail">
          <input class="wc-inp" id="wcEm" type="email" inputmode="email" autocomplete="email" placeholder=" " autocapitalize="off" spellcheck="false">
          <label for="wcEm">Email manzil</label>
          <div class="wc-err" id="wcEmErr"></div>
        </div>
        <div class="wc-field pw" id="wcFPass">
          <input class="wc-inp" id="wcPw" type="password" autocomplete="new-password" placeholder=" ">
          <label for="wcPw">Parol</label>
          <button class="wc-eye" id="wcEye" type="button" aria-label="Parolni ko'rsatish">${I.eye}</button>
          <div class="wc-err" id="wcPwErr"></div>
        </div>
        <div class="wc-meter" id="wcMeter" data-s="0"><div class="bars"><i></i><i></i><i></i><i></i></div><span id="wcMeterT">6+ belgi</span></div>
        <button class="wc-forgot" id="wcForgot" type="button" hidden>Parolni unutdingizmi?</button>
        <button class="wc-btn pri" id="wcGo" type="button"><span>Hisob yaratish</span></button>
        <div class="wc-or">yoki</div>
        <button class="wc-btn goo" id="wcGoogle2" type="button">${(typeof GOOGLE_LOGO_SVG!=='undefined')?GOOGLE_LOGO_SVG:''}<span>Google bilan</span></button>
        <p class="wc-legal">Davom etish orqali <a href="terms.html" target="_blank" rel="noopener">Foydalanish shartlari</a> va <a href="privacy.html" target="_blank" rel="noopener">Maxfiylik siyosati</a>ga rozilik bildirasiz.</p>
      </div></section>

      <section class="wc-v off-r" id="wcDone"><div class="wc-col wc-done" id="wcDoneIn"></div></section>
    </div></div>`;
  document.body.appendChild(w);
  requestAnimationFrame(()=>w.classList.add('on'));

  const $=id=>document.getElementById(id);
  const sheet=$('wcSheet'), views=$('wcViews');
  const V={intro:$('wcIntro'), form:$('wcForm'), done:$('wcDone')};
  const order=['intro','form','done'];
  let cur='intro', mode='signup', busy=false;

  /* Panel balandligi: kirish bosqichida faqat kontent ko'rinadi, formada panel yuqoriga chiqadi */
  const hero=w.querySelector('.wc-hero');
  const fit=()=>{
    if(window.matchMedia('(min-width:860px)').matches){ sheet.style.removeProperty('--off'); hero.style.removeProperty('--hh'); hero.style.removeProperty('--hs'); return; }
    const off = Math.max(0, sheet.offsetHeight - V.intro.offsetHeight - 4);
    if(cur==='intro'){
      // Hero panel ustidagi ko'rinadigan joyni egallaydi; joy kam bo'lsa plitka kichrayadi
      const hh=Math.max(150, innerHeight - (sheet.offsetHeight - off) + 26);
      hero.style.setProperty('--hh', hh+'px');
      hero.style.setProperty('--hs', Math.max(.55, Math.min(1, (hh-30)/300)).toFixed(3));
    }
    sheet.style.setProperty('--off', (cur==='intro'?off:0)+'px');
  };
  const go=(to)=>{
    if(to===cur) return;
    const a=order.indexOf(cur), b=order.indexOf(to);
    V[cur].classList.remove('cur'); V[cur].classList.add(b>a?'off-l':'off-r');
    V[to].classList.remove('off-l','off-r'); V[to].classList.add('cur');
    cur=to; w.classList.toggle('form', to!=='intro'); views.scrollTop=0;
    fit();
  };
  // Faol ko'rinish oqimda (relative), qolganlari ustma-ust (absolute) — scroll to'g'ri ishlaydi
  const st=document.createElement('style'); st.textContent='#welcome .wc-v.cur{position:relative}'; w.appendChild(st);
  requestAnimationFrame(fit); setTimeout(fit,80);
  window.addEventListener('resize',fit);

  const close=(after)=>{
    try{ localStorage.setItem('wd_welcomed','1'); }catch(e){}
    window.removeEventListener('resize',fit);
    w.classList.add('leaving');
    setTimeout(()=>{ w.remove(); if(typeof after==='function') after(); },420);
  };

  /* --- Forma holati --- */
  const em=$('wcEm'), pw=$('wcPw'), goBtn=$('wcGo'), note=$('wcNote'), meter=$('wcMeter'), forgot=$('wcForgot'), seg=$('wcSeg');
  const TXT={
    signup:{h:'Hisob yarating', p:"Hozirgi progressingiz, tangalar va darajangiz shu hisobga o'tadi.", cta:'Hisob yaratish', ac:'new-password'},
    signin:{h:'Qaytganingiz yaxshi', p:'Email va parolingiz bilan kiring — progressingiz qaytadi.', cta:'Kirish', ac:'current-password'}
  };
  const setNote=(kind,html)=>{ note.className='wc-note'+(html?' '+kind:''); note.innerHTML= html ? (kind==='ok'?I.okc:I.warn)+`<div>${html}</div>` : ''; };
  const fieldErr=(f,errEl,msg)=>{ f.classList.toggle('err',!!msg); errEl.textContent=msg||''; if(msg){ f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); } };
  const clearErrs=()=>{ fieldErr($('wcFEmail'),$('wcEmErr'),''); fieldErr($('wcFPass'),$('wcPwErr'),''); setNote('',''); };
  const setMode=(m)=>{
    mode=m; const T=TXT[m];
    seg.classList.toggle('in', m==='signin');
    seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.m===m));
    $('wcFh').textContent=T.h; $('wcFp').textContent=T.p; goBtn.querySelector('span').textContent=T.cta;
    pw.setAttribute('autocomplete',T.ac);
    meter.classList.toggle('hide', m!=='signup'); meter.style.display= m==='signup'?'':'none';
    forgot.hidden = m!=='signin';
    clearErrs(); strength();
  };
  const strength=()=>{
    const v=pw.value||''; let s=0;
    if(v.length>=6) s=1;
    if(v.length>=8 && /[a-zA-Z]/.test(v) && /\d/.test(v)) s=2;
    if(v.length>=10 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v)) s=3;
    if(v.length>=12 && /[^A-Za-z0-9]/.test(v) && s>=2) s=4;
    meter.dataset.s=v?String(Math.max(1,s)):'0';
    $('wcMeterT').textContent = !v ? '6+ belgi' : (v.length<6 ? 'Juda qisqa' : ['','Zaif',"O'rtacha",'Yaxshi','Kuchli'][s]);
  };
  const loading=(btn,on,label)=>{
    if(on){ btn.dataset.html=btn.innerHTML; btn.disabled=true; btn.innerHTML=`<span class="wc-spin"></span><span>${label||'Kutib turing…'}</span>`; }
    else if(btn.dataset.html){ btn.disabled=false; btn.innerHTML=btn.dataset.html; delete btn.dataset.html; }
  };
  const doneView=(kind, title, sub, extra)=>{
    $('wcDoneIn').innerHTML=`<div class="wc-badge ${kind==='ok'?'ok':''}">${kind==='ok'?I.check:I.mail}<i></i></div>
      <h2 class="wc-fh">${title}</h2><p class="wc-fp" style="margin-bottom:0">${sub||''}</p>${extra||''}`;
    go('done');
  };

  /* --- Hodisalar --- */
  $('wcEmail').addEventListener('click',()=>{ setMode('signup'); go('form'); setTimeout(()=>{ try{ em.focus({preventScroll:true}); }catch(e){} },420); });
  $('wcToSignin').addEventListener('click',()=>{ setMode('signin'); go('form'); setTimeout(()=>{ try{ em.focus({preventScroll:true}); }catch(e){} },420); });
  $('wcBack').addEventListener('click',()=>go('intro'));
  $('wcGuest').addEventListener('click',()=>close());
  seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));
  $('wcEye').addEventListener('click',()=>{ const sh=pw.type==='password'; pw.type=sh?'text':'password'; $('wcEye').innerHTML=sh?I.eyeOff:I.eye; $('wcEye').setAttribute('aria-label',sh?'Parolni yashirish':"Parolni ko'rsatish"); });
  em.addEventListener('input',()=>{ if($('wcFEmail').classList.contains('err')) fieldErr($('wcFEmail'),$('wcEmErr'),''); });
  pw.addEventListener('input',()=>{ strength(); if($('wcFPass').classList.contains('err')) fieldErr($('wcFPass'),$('wcPwErr'),''); });
  [em,pw].forEach(i=>i.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); if(i===em) pw.focus(); else goBtn.click(); } }));

  const google=async(btn,noteEl)=>{
    if(busy) return; busy=true;
    loading(btn,true,"Google'ga o'tilmoqda…");
    let r=null; try{ r=await window.__wdSignInWithGoogle(); }catch(e){ r={ok:false}; }
    if(!r||!r.ok){ busy=false; loading(btn,false);
      const msg=(r&&r.err)||"Google orqali kirish boshlanmadi. Qayta urinib ko'ring.";
      if(noteEl===note) setNote('err',escapeHtml(msg)); else { noteEl.className='wc-note err'; noteEl.innerHTML=I.warn+`<div>${escapeHtml(msg)}</div>`; requestAnimationFrame(fit); }
    }
  };
  $('wcGoogle').addEventListener('click',e=>google(e.currentTarget,$('wcNoteIntro')));
  $('wcGoogle2').addEventListener('click',e=>google(e.currentTarget,note));

  forgot.addEventListener('click',async()=>{
    const e=(em.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){ fieldErr($('wcFEmail'),$('wcEmErr'),'Avval email manzilingizni kiriting'); em.focus(); return; }
    forgot.disabled=true; forgot.textContent='Yuborilmoqda…';
    let r=null; try{ r=await window.__wdResetPass(e); }catch(_){ r={ok:false}; }
    forgot.disabled=false; forgot.textContent='Parolni unutdingizmi?';
    if(r&&r.ok) setNote('ok',`Tiklash havolasi <b>${escapeHtml(e)}</b> manziliga yuborildi. Spam papkasini ham tekshiring.`);
    else setNote('err',escapeHtml((r&&r.err)||"Havola yuborilmadi. Birozdan keyin urinib ko'ring."));
  });

  let fails=0;
  goBtn.addEventListener('click',async()=>{
    if(busy) return;
    clearErrs();
    const e=(em.value||'').trim(), p=pw.value||'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){ fieldErr($('wcFEmail'),$('wcEmErr'),"Email manzilni to'g'ri kiriting"); em.focus(); return; }
    if(p.length<6){ fieldErr($('wcFPass'),$('wcPwErr'),"Parol kamida 6 belgidan iborat bo'lsin"); pw.focus(); return; }
    busy=true; loading(goBtn,true, mode==='signup'?'Hisob yaratilmoqda…':'Kirilmoqda…');
    let r=null;
    try{ r = mode==='signup' ? await window.__wdSignUp(e,p) : await window.__wdSignIn(e,p); }catch(_){ r={ok:false}; }
    busy=false; loading(goBtn,false);
    if(!r||!r.ok){
      fails++;
      setNote('err',escapeHtml((r&&r.err)||"Nimadir xato ketdi. Internetni tekshirib qayta urining."));
      if(mode==='signin' && fails>=2){ forgot.style.animation='none'; void forgot.offsetWidth; forgot.style.animation='wcPop .4s var(--spring)'; }
      return;
    }
    try{ navigator.vibrate&&navigator.vibrate(25); }catch(_){}
    if(r.needVerify){
      doneView('mail','Pochtangizni tekshiring',"Hisobni faollashtirish uchun tasdiqlash havolasini yubordik:",
        `<div class="wc-mail">${escapeHtml(e)}</div>
         <ul class="wc-steps"><li>Pochtangizdagi WordDrop xatini oching</li><li>«Tasdiqlash» havolasini bosing</li><li>Xat ko'rinmasa, «Spam» papkasini tekshiring</li></ul>
         <button class="wc-btn pri" id="wcDoneGo" type="button">Tushunarli, davom etaman</button>`);
      const b=$('wcDoneGo'); if(b) b.addEventListener('click',()=>close(()=>{ try{ renderProfile&&renderProfile(); }catch(_){} try{ window.__wdRefreshStatus&&window.__wdRefreshStatus(); }catch(_){} }));
      return;
    }
    if(mode==='signin'){
      doneView('ok','Xush kelibsiz!', r.restored ? 'Progressingiz yuklanmoqda…' : 'Hisobingizga kirdingiz');
      setTimeout(()=>{ try{ localStorage.setItem('wd_welcomed','1'); }catch(_){} location.reload(); },1100);
      return;
    }
    doneView('ok','Hisob yaratildi!','Progressingiz endi bulutda saqlanadi');
    setTimeout(()=>close(()=>{
      try{ renderProfile&&renderProfile(); }catch(_){}
      try{ window.__wdRefreshStatus&&window.__wdRefreshStatus(); }catch(_){}
      try{ window.__wdOnbGate&&window.__wdOnbGate(); }catch(_){}
    }),1300);
  });
}

/* ========== RO'YXAT TAKLIFI (yumshoq banner — progressi bor mehmonga) ========== */
function maybeShowRegNudge(){
  try{
    if(document.getElementById('wd-regnudge')) return;                 // allaqachon ko'rinib turibdi
    if(document.getElementById('welcome')) return;                     // xush kelibsiz ekrani ochiq
    if(typeof window.__wdIsSignedIn==='function' && window.__wdIsSignedIn()) return; // ro'yxatdan o'tgan
    var hasProgress = (Number(window.__wdXP)||0) > 0 || (Number(window.__wdCoins)||0) >= 20;
    if(!hasProgress) return;                                           // yo'qotadigan narsasi yo'q — bezovta qilmaymiz
    var until=0; try{ until=Number(localStorage.getItem('wd_regnudge_until'))||0; }catch(e){}
    if(Date.now() < until) return;                                     // yaqinda yopilgan — jim turamiz
    showRegNudge();
  }catch(e){}
}
function showRegNudge(){
  if(document.getElementById('wd-regnudge')) return;
  if(!document.getElementById('wd-regnudge-css')){
    var st=document.createElement('style'); st.id='wd-regnudge-css';
    st.textContent=`
      #wd-regnudge{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translate(-50%,-160%);
        z-index:6000;width:calc(100% - 26px);max-width:440px;background:linear-gradient(180deg,#132038,#0E1626);
        border:1px solid rgba(107,160,255,.35);border-radius:16px;padding:12px 13px;display:flex;align-items:center;gap:11px;
        box-shadow:0 22px 50px -20px rgba(0,0,0,.7);transition:transform .45s cubic-bezier(.2,.9,.25,1);color:#EAF0FB}
      #wd-regnudge.on{transform:translate(-50%,0)}
      #wd-regnudge .rn-ic{width:34px;height:34px;flex:none;border-radius:10px;background:rgba(59,130,246,.18);
        display:flex;align-items:center;justify-content:center;color:#6BA0FF;font-weight:800}
      #wd-regnudge .rn-tx{flex:1;min-width:0}
      #wd-regnudge .rn-t{font-weight:700;font-size:13.5px;line-height:1.25}
      #wd-regnudge .rn-s{font-size:11.5px;color:#9DAAC6;margin-top:1px}
      #wd-regnudge .rn-go{flex:none;border:none;background:#3B82F6;color:#fff;font-family:inherit;font-weight:700;
        font-size:12.5px;padding:8px 12px;border-radius:10px;cursor:pointer}
      #wd-regnudge .rn-x{flex:none;border:none;background:transparent;color:#7E8CAB;font-size:19px;cursor:pointer;padding:2px 5px;line-height:1}`;
    document.head.appendChild(st);
  }
  var el=document.createElement('div'); el.id='wd-regnudge';
  el.innerHTML=`
    <div class="rn-ic">W</div>
    <div class="rn-tx">
      <div class="rn-t">Progressingni saqlab qol</div>
      <div class="rn-s">Email bilan ro'yxatdan o't — reytingga qo'shil va istalgan qurilmada davom et.</div>
    </div>
    <button class="rn-go" id="rnGo">Ro'yxatdan o'tish</button>
    <button class="rn-x" id="rnX" aria-label="Yopish">&times;</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('on'); });
  function close(days){
    try{ localStorage.setItem('wd_regnudge_until', String(Date.now()+(days||3)*86400000)); }catch(e){}
    el.classList.remove('on'); setTimeout(function(){ el.remove(); }, 460);
  }
  document.getElementById('rnX').addEventListener('click', function(){ close(3); });
  document.getElementById('rnGo').addEventListener('click', function(){
    close(7); setTimeout(function(){ try{ openAuthSheet('signup'); }catch(e){} }, 300);
  });
}

/* ========== TOAST ========== */
let _toastT=null;
function showToast(msg,icon){
  const el=document.getElementById('toast');
  el.innerHTML=(icon||IC.info)+`<span>${msg}</span>`;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT=setTimeout(()=>el.classList.remove('show'),2200);
}

/* ========== KONFETTI (nishonlash effekti) ========== */
function fireConfetti(){
  const cv=document.getElementById('confetti');
  if(!cv) return;
  const ctx=cv.getContext('2d');
  const W=cv.width=innerWidth, H=cv.height=innerHeight;
  const colors=['#2F6FED','#1FAE6B','#FFC93C','#FF5C7A','#8B5CF6','#22D3EE'];
  const N=90;
  const parts=[];
  for(let i=0;i<N;i++){
    parts.push({
      x:W/2+(Math.random()-0.5)*120,
      y:H*0.42+(Math.random()-0.5)*60,
      vx:(Math.random()-0.5)*11,
      vy:-6-Math.random()*9,
      s:5+Math.random()*7,
      c:colors[i%colors.length],
      rot:Math.random()*6.28,
      vr:(Math.random()-0.5)*0.4,
      shape:Math.random()<0.5?0:1
    });
  }
  cv.style.display='block';
  let frame=0;
  function tick(){
    frame++;
    ctx.clearRect(0,0,W,H);
    let alive=false;
    for(const p of parts){
      p.vy+=0.32; p.x+=p.vx; p.y+=p.vy; p.vx*=0.99; p.rot+=p.vr;
      if(p.y<H+30) alive=true;
      ctx.save();
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.c; ctx.globalAlpha=Math.max(0,1-frame/90);
      if(p.shape===0) ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);
      else { ctx.beginPath(); ctx.arc(0,0,p.s/2,0,6.28); ctx.fill(); }
      ctx.restore();
    }
    if(alive && frame<110) requestAnimationFrame(tick);
    else { ctx.clearRect(0,0,W,H); cv.style.display='none'; }
  }
  tick();
}

/* ========== TAB ========== */
const screens={home:document.getElementById('screen-home'),patterns:document.getElementById('screen-patterns'),words:document.getElementById('screen-words'),vault:document.getElementById('screen-vault'),leaderboard:document.getElementById('screen-leaderboard'),profile:document.getElementById('screen-profile')};
let __wdActiveTab='home';
const __wdScrollMem={};
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const tab=btn.dataset.tab;
    if(tab===__wdActiveTab) return;           // o'sha tabga qayta bosilsa — hech narsa qilmaymiz
    // chiqayotgan ekranning scroll holatini eslab qolamiz
    try{ const oldSc=screens[__wdActiveTab]&&screens[__wdActiveTab].querySelector('.sscroll');
         if(oldSc) __wdScrollMem[__wdActiveTab]=oldSc.scrollTop; }catch(e){}
    __wdActiveTab=tab;
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b===btn));
    Object.entries(screens).forEach(([k,s])=>{
      s.classList.toggle('active',k===tab);
      if(k!==tab) s.classList.remove('anim-in');
    });
    if(tab==='vault') renderVault();
    if(tab==='words') renderWords();
    if(tab==='leaderboard'){ renderLeaderboardScreen(); if(window.__wdRefreshBoard) window.__wdRefreshBoard(); }
    if(tab==='profile') renderProfile();
    // kirish animatsiyasi faqat ekran ALMASHGANDA (qayta chizilganda emas)
    const sc=screens[tab];
    if(sc){
      sc.classList.add('anim-in');
      setTimeout(()=>{ try{ sc.classList.remove('anim-in'); }catch(e){} },700);
      const box=sc.querySelector('.sscroll');
      if(box) box.scrollTop=__wdScrollMem[tab]||0;
    }
    try{ maybeShowRegNudge(); }catch(e){}
  });
});

/* ========== MODAL HELPER ========== */

/* ========== KIRISH / RO'YXATDAN O'TISH OYNASI ========== */
/* Google brend logotipi — rasmiy 4-rangli SVG (foydalanuvchi bergan) */
const GOOGLE_LOGO_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
<path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
<path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
</svg>`;

/*
  openAuthSheet(mode)
    mode: 'signup' | 'signin' | 'recovery'
  - 'recovery' — parolni yangilash oynasi (email link'i orqali qaytganda ochiladi)
*/
function openAuthSheet(mode){
  mode=mode||'signup';
  const T={
    signup:{ic:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
      h:"Hisob yarating", p:"Progressingiz saqlanadi va istalgan qurilmada davom etadi. Hozirgi xona, tanga va darajalaringiz shu hisobga bog'lanadi.",
      cta:"Ro'yxatdan o'tish", gCta:"Google bilan ro'yxatdan o'tish"},
    signin:{ic:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
      h:"Hisobga kirish", p:"Email va parolingiz bilan kiring — barcha progressingiz qaytariladi.",
      cta:"Kirish", gCta:"Google bilan kirish"},
    recovery:{ic:'<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      h:"Yangi parol o'rnating", p:"Havolangiz to'g'ri tekshirildi. Endi yangi parolingizni o'ylab qo'ying — kamida 6 belgi.",
      cta:"Parolni saqlash"}
  }[mode];

  const isRecovery = mode==='recovery';
  const showOAuth  = (mode==='signup' || mode==='signin');

  // Kichik SVG'lar (xato/ok/info uchun)
  const IC_WARN='<path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/>';
  const IC_INFO='<circle cx="12" cy="12" r="10"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/>';
  const IC_OK  ='<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>';
  const IC_FLD ='<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>';

  // === HTML markup ===
  const layer=openSheet(`
    <div class="auth-head">
      <div class="ah-ic"><svg viewBox="0 0 24 24">${T.ic}</svg></div>
      <h2>${T.h}</h2><p>${T.p}</p>
    </div>
    <div class="auth-f">

      ${showOAuth ? `
      <div class="auth-oauth">
        <button class="auth-gbtn" id="auGoogle" type="button">
          ${GOOGLE_LOGO_SVG}
          <span>${T.gCta}</span>
        </button>
      </div>
      <div class="auth-or">yoki email bilan</div>
      ` : ''}

      <div class="auth-banner" id="auBanner"></div>

      ${!isRecovery ? `
      <div class="auth-field">
        <input class="auth-inp" id="auEmail" type="email" inputmode="email" autocomplete="email" placeholder="Email manzilingiz">
        <div class="auth-fielderr" id="auEmailErr"><svg viewBox="0 0 24 24">${IC_FLD}</svg><span></span></div>
      </div>` : ''}

      <div class="auth-field">
        <div class="auth-pass-wrap" style="position:relative">
          <input class="auth-inp" id="auPass" type="password"
            autocomplete="${mode==='signin'?'current-password':'new-password'}"
            placeholder="${isRecovery?'Yangi parol (kamida 6 belgi)':'Parol (kamida 6 belgi)'}"
            style="padding-right:44px">
          <div class="auth-eye" id="auEye" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--i5)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
        <div class="auth-fielderr" id="auPassErr"><svg viewBox="0 0 24 24">${IC_FLD}</svg><span></span></div>
      </div>

      ${isRecovery ? `
      <div class="auth-field">
        <input class="auth-inp" id="auPass2" type="password" autocomplete="new-password" placeholder="Yangi parolni takrorlang">
        <div class="auth-fielderr" id="auPass2Err"><svg viewBox="0 0 24 24">${IC_FLD}</svg><span></span></div>
      </div>` : ''}

      <button class="auth-cta" id="auGo" type="button"><span class="lbl">${T.cta}</span></button>

      ${mode==='signin' ? '<div class="auth-mini"><span id="auReset">Parolni unutdingizmi?</span></div>' : ''}

      ${!isRecovery ? `
      <div class="auth-alt">${mode==='signup'
        ? "Hisobingiz bormi? <b id='auSwap'>Kiring</b>"
        : "Hisobingiz yo'qmi? <b id='auSwap'>Ro'yxatdan o'ting</b>"}</div>
      <p class="auth-note">Ro'yxatdan o'tmasangiz ham o'ynashda davom etishingiz mumkin — lekin progress faqat shu qurilmada saqlanadi.</p>
      ` : ''}
    </div>`);

  // === Helper'lar ===
  const $ = sel => layer.querySelector(sel);

  const banner = $('#auBanner');
  const setBanner=(kind, msg, iconHtml)=>{
    if(!msg){ banner.classList.remove('show'); return; }
    banner.className='auth-banner '+kind+' show';
    banner.innerHTML=`<svg viewBox="0 0 24 24">${iconHtml||IC_WARN}</svg><div>${msg}</div>`;
  };
  const clearBanner=()=>{ banner.classList.remove('show'); };

  const setFieldErr=(fieldEl, errEl, msg)=>{
    if(!errEl) return;
    const span=errEl.querySelector('span');
    if(msg){
      if(span) span.textContent=msg;
      errEl.classList.add('show');
      if(fieldEl) fieldEl.classList.add('err');
    }else{
      errEl.classList.remove('show');
      if(fieldEl) fieldEl.classList.remove('err');
    }
  };

  const shake=(inp)=>{
    if(!inp) return;
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
  };

  const clearAllErrs=()=>{
    clearBanner();
    ['#auEmail','#auPass','#auPass2'].forEach(sel=>{
      const el=$(sel); if(el) el.classList.remove('err');
    });
    ['#auEmailErr','#auPassErr','#auPass2Err'].forEach(sel=>{
      const el=$(sel); if(el){ el.classList.remove('show'); const s=el.querySelector('span'); if(s) s.textContent=''; }
    });
  };

  // Foydalanuvchi maydonga tegishi bilan xatoni yashirish
  ['auEmail','auPass','auPass2'].forEach(id=>{
    const inp=$('#'+id); if(!inp) return;
    inp.addEventListener('input',()=>{
      inp.classList.remove('err');
      const er=$('#'+id+'Err'); if(er) er.classList.remove('show');
      if(banner.classList.contains('err')) clearBanner();
    });
  });

  // === Elementlar ===
  const emailInp = $('#auEmail');
  const passInp  = $('#auPass');
  const pass2Inp = $('#auPass2');
  const go       = $('#auGo');
  const goLbl    = go.querySelector('.lbl');
  const goldCta  = T.cta;
  const gbtn     = $('#auGoogle');
  const reset    = $('#auReset');
  const swap     = $('#auSwap');
  const eye      = $('#auEye');

  let failCount=0;

  // Parolni ko'rish/yashirish
  if(eye) eye.addEventListener('click',()=>{
    const show=passInp.type==='password';
    passInp.type=show?'text':'password';
    eye.innerHTML = show
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  });

  // Swap: signin ⇄ signup
  if(swap) swap.addEventListener('click',()=>{ closeSheet(); openAuthSheet(mode==='signup'?'signin':'signup'); });

  // === Parolni tiklash (email yuborish) ===
  if(reset) reset.addEventListener('click', async ()=>{
    const em=(emailInp.value||'').trim();
    if(!em || em.indexOf('@')<0){
      setFieldErr(emailInp, $('#auEmailErr'), "Avval email manzilingizni kiriting");
      shake(emailInp); emailInp.focus();
      return;
    }
    reset.textContent='Yuborilmoqda…';
    reset.style.pointerEvents='none';
    const r = await window.__wdResetPass(em);
    reset.style.pointerEvents='';
    reset.textContent='Parolni unutdingizmi?';
    if(r.ok){
      setBanner('ok',
        `Tiklash havolasi <b>${em}</b> manziliga yuborildi. Pochtangizni tekshiring (spam papkasini ham).`,
        IC_OK);
      reset.classList.remove('glow');
    }else{
      setBanner('err', r.err || "Havola yuborilmadi. Biroz kutib qayta urinib ko'ring.", IC_WARN);
    }
  });

  // === Yuklanish holati (spinner) ===
  const setLoading=(loading, altLbl)=>{
    if(loading){
      go.disabled=true;
      if(gbtn) gbtn.disabled=true;
      go.innerHTML=`<span class="spin"></span><span class="lbl">${altLbl||'Kutib turing…'}</span>`;
    }else{
      go.disabled=false;
      if(gbtn) gbtn.disabled=false;
      go.innerHTML=`<span class="lbl">${goldCta}</span>`;
    }
  };

  // === Muvaffaqiyat ekrani ===
  const succeed=(msg, sub, after)=>{
    go.classList.add('ok-flash');
    const sheet=layer.querySelector('.sheet');
    const sc=document.createElement('div'); sc.className='auth-succ';
    sc.innerHTML=`<div class="as-ring"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div>
      <b>${msg}</b><span>${sub||''}</span>`;
    if(sheet){ sheet.style.position='relative'; sheet.appendChild(sc); }
    setTimeout(()=>{
      closeSheet();
      if(typeof renderProfile==='function') renderProfile();
      if(window.__wdRefreshStatus) window.__wdRefreshStatus();
      if(typeof after==='function') after();
    }, 1250);
  };

  // Yumshoq umumiy fail — inline field xatosi + banner
  const fail=(msg, targetInp)=>{
    if(targetInp){
      const errId = targetInp.id + 'Err';
      setFieldErr(targetInp, $('#'+errId), msg);
      shake(targetInp);
      targetInp.focus();
    }else{
      setBanner('err', msg, IC_WARN);
      shake(passInp || emailInp);
    }
    failCount++;
    // Signin oynasida 2-marta xato bo'lsa "Parolni unutdingizmi?" nurlantiramiz
    if(mode==='signin' && failCount>=2 && reset){
      reset.classList.add('glow');
      // qo'shimcha yordamchi banner (agar server xatosi bo'lsa)
      if(!banner.classList.contains('show') || banner.classList.contains('err')){
        setBanner('info',
          "Parolni eslay olmayapsizmi? Pastdan <b>Parolni unutdingizmi?</b> tugmasini bosing — pochtangizga tiklash havolasi keladi.",
          IC_INFO);
      }
    }
  };

  // === Google OAuth ===
  if(gbtn) gbtn.addEventListener('click', async ()=>{
    clearAllErrs();
    // spinner
    const origHtml=gbtn.innerHTML;
    gbtn.disabled=true;
    gbtn.innerHTML=`<span class="spin"></span><span>Google'ga yo'naltirilyapti…</span>`;
    const r = await window.__wdSignInWithGoogle();
    // Agar redirect boshlansa, sahifa allaqachon ketgan bo'ladi.
    if(!r || !r.ok){
      gbtn.disabled=false;
      gbtn.innerHTML=origHtml;
      setBanner('err', (r && r.err) || "Google orqali kirish boshlanmadi.", IC_WARN);
    }
  });

  // === Asosiy CTA (signup / signin / recovery) ===
  go.addEventListener('click', async ()=>{
    clearBanner();

    if(isRecovery){
      const p1=(passInp.value||''), p2=(pass2Inp.value||'');
      if(p1.length<6){ fail("Parol kamida 6 belgidan iborat bo'lsin", passInp); return; }
      if(p1!==p2){ fail("Parollar mos kelmadi", pass2Inp); return; }
      setLoading(true);
      const r = await window.__wdUpdatePass(p1);
      setLoading(false);
      if(!r.ok){ setBanner('err', r.err, IC_WARN); return; }
      // Muvaffaqiyat — URL'dan recovery bo'lagini o'chirib, sahifani yangilaymiz
      try{
        const clean = location.origin + location.pathname;
        history.replaceState(null,'',clean);
      }catch(_){}
      succeed("Parol yangilandi!", "Endi shu parol bilan kirishingiz mumkin", ()=>{
        setTimeout(()=>location.reload(), 200);
      });
      return;
    }

    const em=(emailInp.value||'').trim();
    const p =(passInp.value||'');
    if(!em || em.indexOf('@')<0 || em.length<5){
      fail("To'g'ri email manzil kiriting", emailInp); return;
    }
    if(p.length<6){ fail("Parol kamida 6 belgidan iborat bo'lsin", passInp); return; }

    setLoading(true);
    const r = mode==='signup'
      ? await window.__wdSignUp(em, p)
      : await window.__wdSignIn(em, p);
    setLoading(false);

    if(!r.ok){ fail(r.err); return; }

    if(r.needVerify){
      succeed("Deyarli tayyor!", `Tasdiqlash xati ${em} manziliga yuborildi`);
      return;
    }

    try{ if(navigator.vibrate) navigator.vibrate(30); }catch(_){}

    if(mode==='signin'){
      succeed("Xush kelibsiz!", r.restored ? "Progressingiz yuklandi ✓" : "Toza hisob — o'ynashni boshlang",
        ()=>{ setTimeout(()=>location.reload(), 200); });
      return;
    }

    // signup muvaffaqiyatli
    succeed("Hisob yaratildi!", "Progressingiz endi bulutga saqlanadi", ()=>{
      setTimeout(()=>{ if(window.__wdOnbGate) window.__wdOnbGate(); }, 150);
    });
  });

  // Enter tugmasi
  [emailInp, passInp, pass2Inp].forEach(inp=>{
    if(!inp) return;
    inp.addEventListener('keydown', ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); go.click(); } });
  });
}

function openSheet(html){
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="modal-layer" id="gModal"><div class="modal-backdrop"></div><div class="sheet"><div class="sh-handle"></div><button class="sh-close" id="gClose">${IC.close}</button>${html}</div></div>`;
  const layer=document.getElementById('gModal');
  requestAnimationFrame(()=>layer.classList.add('show'));
  layer.querySelector('.modal-backdrop').addEventListener('click',closeSheet);
  document.getElementById('gClose').addEventListener('click',closeSheet);
  return layer;
}
function closeSheet(){
  const l=document.getElementById('gModal');
  if(!l)return;
  l.classList.remove('show');
  setTimeout(()=>l.remove(),300);
}

/* ============================================================
   DROP AI CHAT — do'stona yordamchi
   ------------------------------------------------------------
   Personage: onboarding tomchisi (2 ko'zli), kayfiyat o'zgarib turadi
   Kayfiyatlar: happy | thinking | sleepy | error
   Limit: registered 20/kun (v94), mehmon 3/kun
   Limit FAQAT muvaffaqiyatli javobdan keyin oshadi
   Supabase: wd_drop_msg + wd_drop_bump/today
   ============================================================ */
(function DropAI(){
  let DAILY_MAX_REG = 20;     // v94: ro'yxatdan o'tganlarga kuniga 20 ta; v97: Pro — 100
  const DAILY_MAX_GUEST = 3;
  const CTX_MSGS = 6;
  const MAX_LEN  = 800;
  const LS_HIST  = 'wd_drop_hist_v1';
  const LS_USAGE = 'wd_drop_usage_v1';
  const LS_SEEN  = 'wd_drop_fab_seen_v1';
  // Yozishmalar 24 soatdan keyin avtomatik o'chadi (serverda pg_cron ham qiladi).
  const HIST_TTL_MS = 24 * 60 * 60 * 1000;
  // Sensorli qurilma: Enter yangi qator, yuborish — tugma orqali
  const TOUCH = (window.matchMedia && matchMedia('(pointer:coarse)').matches);

  /* ---------- Personage SVG (brend ko'k tomchi) ---------- */
  function dropSVG(mood){
    const uid = 'dg' + Math.random().toString(36).slice(2,8);
    return (
      '<svg viewBox="0 0 64 64" class="drop-mascot mood-'+(mood||'happy')+'" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<linearGradient id="'+uid+'" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#7FA6FF"/><stop offset=".55" stop-color="#2F6FED"/><stop offset="1" stop-color="#1B4FCB"/>' +
          '</linearGradient>' +
          '<radialGradient id="'+uid+'-sh" cx="35%" cy="28%" r="55%">' +
            '<stop offset="0" stop-color="rgba(255,255,255,.55)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<path d="M32 6 C32 6 12 28 12 40 A20 20 0 0 0 52 40 C52 28 32 6 32 6 Z" fill="url(#'+uid+')"/>' +
        '<path d="M32 6 C32 6 12 28 12 40 A20 20 0 0 0 52 40 C52 28 32 6 32 6 Z" fill="url(#'+uid+'-sh)"/>' +
        '<g class="eye-l">' +
          '<ellipse class="eye-white" cx="25" cy="37" rx="5" ry="6.5" fill="#FFFFFF"/>' +
          '<circle class="pupil" cx="25.5" cy="38" r="2.4" fill="#0B1B45"/>' +
          '<circle class="glint" cx="26.6" cy="36.3" r=".9" fill="#FFFFFF"/>' +
          '<ellipse class="eyelid" cx="25" cy="37" rx="5.2" ry="6.7" fill="#2F6FED"/>' +
        '</g>' +
        '<g class="eye-r">' +
          '<ellipse class="eye-white" cx="39" cy="37" rx="5" ry="6.5" fill="#FFFFFF"/>' +
          '<circle class="pupil" cx="39.5" cy="38" r="2.4" fill="#0B1B45"/>' +
          '<circle class="glint" cx="40.6" cy="36.3" r=".9" fill="#FFFFFF"/>' +
          '<ellipse class="eyelid" cx="39" cy="37" rx="5.2" ry="6.7" fill="#2F6FED"/>' +
        '</g>' +
      '</svg>'
    );
  }

  /* ---------- DOM ---------- */
  const $ = id => document.getElementById(id);
  const fab = $('drop-fab'), fabIc = $('drop-fab-ic'), fabDot = $('drop-fab-dot');
  const ov = $('drop-overlay'), body = $('drop-body'), list = $('drop-list');
  const qaBox = $('drop-qa'), inp = $('drop-input'), send = $('drop-send'), row = $('drop-input-row');
  const closeX = $('drop-hd-x'), clearBtn = $('drop-clear');
  const quota = $('drop-quota'), quotaN = $('drop-quota-n'), status = $('drop-status'), hdAv = $('drop-hd-av');
  const downBtn = $('drop-down'), hintL = $('drop-hint-l'), cnt = $('drop-cnt');
  const cf = $('drop-confirm'), cfNo = $('drop-cf-no'), cfYes = $('drop-cf-yes');
  if(!fab || !ov || !list) return;

  const state = {
    open:false, sending:false, loading:false, hist:[], usage:{day:'', count:0},
    historyLoaded:false, ctaShown:false, lastRole:null, lastDay:null, lastTs:0
  };

  /* Kayfiyat + holat (header nuqtasi va matni) */
  function setMood(m){
    fabIc.innerHTML = dropSVG(m === 'thinking' ? 'happy' : m);
    hdAv.innerHTML = dropSVG(m);
    hdAv.classList.toggle('busy', m === 'thinking');
    hdAv.classList.toggle('err',  m === 'error');
  }
  function setStatus(t){ if(status) status.textContent = t; }
  setMood('happy');

  const isRegistered = () => {
    const u = window.__sbUser;
    if(!u || !u.id) return false;
    if(u.is_anonymous === true) return false;
    return !!(u.email || u.phone || (u.app_metadata && u.app_metadata.provider !== 'anonymous'));
  };
  // v101b: admin uchun cheklovsiz (server wd_drop_today/bump "unlimited" qaytaradi; hisoblagich bazada o'smaydi)
  const isUnlimited = () => state.unlimited===true || (typeof window.__wdAuthEmail==='function' && String(window.__wdAuthEmail()).toLowerCase()==='bexruzyoldoshev@yahoo.com');
  const maxToday = () => isUnlimited() ? 9999 : isRegistered() ? DAILY_MAX_REG : DAILY_MAX_GUEST;
  const todayISO = () => new Date().toISOString().slice(0,10);

  /* ---------- Limit ---------- */
  async function fetchTodayCount(){
    if(window.__sb && isRegistered()){
      try{
        const r = await window.__sb.rpc('wd_drop_today');
        if(!r.error && r.data && typeof r.data.count === 'number'){
          state.unlimited = r.data.unlimited === true;
          state.usage = { day: r.data.day || todayISO(), count: r.data.count };
          return;
        }
      }catch(e){}
    }
    try{
      const raw = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
      if(raw.day === todayISO()) state.usage = { day: raw.day, count: raw.count||0 };
      else state.usage = { day: todayISO(), count: 0 };
    }catch(e){ state.usage = { day: todayISO(), count: 0 }; }
  }
  // Faqat MUVAFFAQIYATLI javobdan keyin chaqiriladi
  async function commitBump(){
    if(window.__sb && isRegistered()){
      try{
        const r = await window.__sb.rpc('wd_drop_bump', { p_max: DAILY_MAX_REG });
        if(!r.error && r.data && typeof r.data.count === 'number'){
          if(r.data.unlimited === true) state.unlimited = true;
          state.usage = { day: r.data.day || todayISO(), count: r.data.count };
          return;
        }
      }catch(e){}
    }
    if(state.usage.day !== todayISO()) state.usage = { day: todayISO(), count: 0 };
    state.usage.count = Math.min(maxToday(), state.usage.count + 1);
    try{ localStorage.setItem(LS_USAGE, JSON.stringify(state.usage)); }catch(e){}
  }
  function remaining(){
    if(state.usage.day !== todayISO()) return maxToday();
    return Math.max(0, maxToday() - state.usage.count);
  }
  function updateQuotaUI(){
    const r = remaining(), m = maxToday();
    if(quotaN) quotaN.textContent = isUnlimited() ? '∞' : (r + '/' + m);
    if(quota){
      quota.classList.toggle('out', r <= 0);
      quota.classList.toggle('low', r > 0 && r <= Math.ceil(m * 0.2));
      quota.title = isUnlimited() ? 'Admin: cheklovsiz' : r > 0 ? ('Bugun yana ' + r + ' ta savol berishingiz mumkin') : 'Bugungi savollar tugadi';
    }
    if(fabDot){
      if(isUnlimited()) fabDot.style.display = 'none';
      else if(r < m){ fabDot.style.display = 'grid'; fabDot.textContent = r; fabDot.classList.toggle('zero', r <= 0); }
      else fabDot.style.display = 'none';
    }
    updateComposer();
  }

  /* ---------- Tarix ---------- */
  function pruneHist(list){
    const cut = Date.now() - HIST_TTL_MS;
    return (Array.isArray(list) ? list : []).filter(h=>{
      if(!h || !h.ts) return false;
      const t = Date.parse(h.ts);
      return isFinite(t) && t >= cut;
    });
  }
  async function purgeRemote(all){
    if(!(window.__sb && isRegistered() && window.__sbUser)) return;
    try{
      let q = window.__sb.from('wd_drop_msg').delete().eq('user_id', window.__sbUser.id);
      if(!all) q = q.lt('created_at', new Date(Date.now() - HIST_TTL_MS).toISOString());
      await q;
    }catch(e){}
  }
  async function loadHistory(){
    if(state.historyLoaded) return;
    state.hist = [];
    if(window.__sb && isRegistered()){
      try{
        await purgeRemote(false);
        const cutISO = new Date(Date.now() - HIST_TTL_MS).toISOString();
        const { data, error } = await window.__sb
          .from('wd_drop_msg')
          .select('role,content,created_at')
          .gte('created_at', cutISO)
          .order('created_at', { ascending: true })
          .limit(60);
        if(!error && Array.isArray(data)){
          state.hist = data.map(r=>({ role:r.role, content:r.content, ts:r.created_at }));
          state.historyLoaded = true;
          return;
        }
      }catch(e){}
    }
    try{
      const raw = JSON.parse(localStorage.getItem(LS_HIST) || '[]');
      const kept = pruneHist(raw).slice(-50);
      state.hist = kept;
      if(kept.length !== (Array.isArray(raw) ? raw.length : 0)){
        try{ localStorage.setItem(LS_HIST, JSON.stringify(kept)); }catch(e){}
      }
    }catch(e){}
    state.historyLoaded = true;
  }
  async function saveMessage(role, content){
    const item = { role, content, ts:new Date().toISOString() };
    state.hist.push(item);
    try{ localStorage.setItem(LS_HIST, JSON.stringify(pruneHist(state.hist).slice(-50))); }catch(e){}
    if(window.__sb && isRegistered()){
      try{
        await window.__sb.from('wd_drop_msg').insert({
          user_id: window.__sbUser.id, role, content: String(content).slice(0,2000)
        });
      }catch(e){}
    }
    return item;
  }
  async function clearHistory(){
    state.hist = [];
    try{ localStorage.removeItem(LS_HIST); }catch(e){}
    await purgeRemote(true);
    state.ctaShown = false;
    renderAllHistory();
    renderAfterState();
    try{ if(typeof showToast === 'function') showToast("Suhbat tozalandi"); }catch(e){}
  }

  /* ---------- Yordamchilar ---------- */
  function fmtTime(iso){
    const d = iso ? new Date(iso) : new Date();
    if(isNaN(d)) return '';
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  function dayKey(iso){ const d = iso ? new Date(iso) : new Date(); return isNaN(d) ? '' : d.toDateString(); }
  function dayLabel(iso){
    const d = iso ? new Date(iso) : new Date();
    const t = new Date(); const y = new Date(Date.now() - 864e5);
    if(d.toDateString() === t.toDateString()) return 'Bugun';
    if(d.toDateString() === y.toDateString()) return 'Kecha';
    return d.toLocaleDateString('uz-UZ', { day:'numeric', month:'long' });
  }
  const atBottom = () => body.scrollHeight - body.scrollTop - body.clientHeight < 80;
  function scrollBottom(smooth){
    requestAnimationFrame(()=>{
      if(smooth && body.scrollTo) body.scrollTo({ top: body.scrollHeight, behavior:'smooth' });
      else body.scrollTop = body.scrollHeight;
    });
  }
  const ICO = {
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    warn:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'
  };

  /* Kichik markdown -> HTML (faqat AI javoblari uchun). XSS-xavfsiz:
     matn avval escape qilinadi, keyin ruxsat etilgan teglarga aylanadi.
     **bold**, *italic*, `code`, ```blok```, - / 1. ro'yxat, ### sarlavha,
     > iqtibos, --- chiziq, [havola](https://...) */
  function _mdEscape(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function mdInline(raw){
    let s = _mdEscape(raw);
    const codes = [];
    s = s.replace(/`([^`\n]+)`/g, (_,c)=>{ codes.push(c); return '\u0000'+(codes.length-1)+'\u0000'; });
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_,i)=>'<code>'+codes[+i]+'</code>');
    return s;
  }
  function mdRender(md){
    const lines = String(md||'').replace(/\r\n/g,'\n').split('\n');
    const out = []; let para = []; let listT = null; let inCode = false; let code = [];
    const flushP = () => { if(para.length){ out.push('<p>'+para.map(mdInline).join('<br>')+'</p>'); para = []; } };
    const closeL = () => { if(listT){ out.push('</'+listT+'>'); listT = null; } };
    for(const raw of lines){
      const t = raw.trim();
      if(/^```/.test(t)){
        if(inCode){ out.push('<pre><code>'+_mdEscape(code.join('\n'))+'</code></pre>'); code = []; inCode = false; }
        else { flushP(); closeL(); inCode = true; }
        continue;
      }
      if(inCode){ code.push(raw); continue; }
      if(!t){ flushP(); closeL(); continue; }
      let m;
      if((m = t.match(/^(#{1,3})\s+(.+)$/))){ flushP(); closeL(); const n = m[1].length + 2; out.push('<h'+n+'>'+mdInline(m[2])+'</h'+n+'>'); continue; }
      if(/^(-{3,}|\*{3,})$/.test(t)){ flushP(); closeL(); out.push('<hr>'); continue; }
      if((m = t.match(/^>\s?(.*)$/))){ flushP(); closeL(); out.push('<blockquote>'+mdInline(m[1])+'</blockquote>'); continue; }
      if((m = t.match(/^[-•*]\s+(.+)$/))){ flushP(); if(listT !== 'ul'){ closeL(); out.push('<ul>'); listT = 'ul'; } out.push('<li>'+mdInline(m[1])+'</li>'); continue; }
      if((m = t.match(/^(\d+)[.)]\s+(.+)$/))){ flushP(); if(listT !== 'ol'){ closeL(); out.push('<ol start="'+(+m[1]||1)+'">'); listT = 'ol'; } out.push('<li>'+mdInline(m[2])+'</li>'); continue; }
      closeL(); para.push(t);
    }
    if(inCode) out.push('<pre><code>'+_mdEscape(code.join('\n'))+'</code></pre>');
    flushP(); closeL();
    return out.join('');
  }

  async function copyText(txt, btn){
    let ok = false;
    try{ await navigator.clipboard.writeText(txt); ok = true; }
    catch(e){
      try{
        const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
      }catch(_){}
    }
    if(ok && btn){
      btn.classList.add('done'); btn.innerHTML = ICO.ok + 'Nusxalandi';
      setTimeout(()=>{ btn.classList.remove('done'); btn.innerHTML = ICO.copy + 'Nusxa'; }, 1600);
    }
  }

  /* ---------- Render ---------- */
  function clearTransient(){
    // Vaqtinchalik bloklar (xato, typing) — yangi xabar kelganda olib tashlanadi
    list.querySelectorAll('.drop-err,#drop-typing,.drop-welcome').forEach(n=>n.remove());
  }
  function renderMsg(role, content, ts, opts){
    opts = opts || {};
    const iso = ts || new Date().toISOString();
    const dk = dayKey(iso);
    if(dk && dk !== state.lastDay){
      const sep = document.createElement('div'); sep.className = 'drop-day'; sep.textContent = dayLabel(iso);
      list.appendChild(sep); state.lastDay = dk; state.lastRole = null;
    }
    const t = Date.parse(iso) || Date.now();
    // Bir xil yuboruvchidan 5 daqiqa ichidagi xabarlar bitta guruh
    const grouped = state.lastRole === role && (t - state.lastTs) < 5*60*1000;
    if(grouped){
      const prev = list.querySelector('.drop-row.last.' + role);
      if(prev){ prev.classList.remove('last'); const pa = prev.querySelector('.drop-av'); if(pa) pa.classList.add('ghost'); }
    }
    const r = document.createElement('div');
    r.className = 'drop-row ' + role + ' last' + (grouped ? '' : ' first');
    if(role === 'assistant'){
      const av = document.createElement('div'); av.className = 'drop-av'; av.innerHTML = dropSVG('happy');
      r.appendChild(av);
    }
    const st = document.createElement('div'); st.className = 'drop-stack';
    const msg = document.createElement('div'); msg.className = 'drop-msg';
    if(role === 'assistant'){ msg.classList.add('drop-md'); msg.innerHTML = mdRender(content); }
    else msg.textContent = content;
    st.appendChild(msg);
    const meta = document.createElement('div'); meta.className = 'drop-meta';
    const tm = document.createElement('span'); tm.textContent = fmtTime(iso); meta.appendChild(tm);
    if(role === 'assistant'){
      const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'drop-act';
      cb.innerHTML = ICO.copy + 'Nusxa'; cb.setAttribute('aria-label','Javobni nusxalash');
      cb.addEventListener('click', ()=>copyText(String(content), cb));
      meta.appendChild(cb);
    }
    st.appendChild(meta);
    r.appendChild(st);
    list.appendChild(r);
    state.lastRole = role; state.lastTs = t;
    if(!opts.silent) scrollBottom(true);
    return r;
  }
  function renderSys(html){
    const el = document.createElement('div'); el.className = 'drop-sys'; el.innerHTML = html;
    list.appendChild(el); state.lastRole = null; scrollBottom(true); return el;
  }
  function renderError(msg, onRetry){
    clearTransient();
    const el = document.createElement('div'); el.className = 'drop-err'; el.setAttribute('role','alert');
    el.innerHTML = ICO.warn + '<span></span>';
    el.querySelector('span').textContent = msg;
    if(onRetry){
      const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Qayta urinish';
      b.addEventListener('click', ()=>{ el.remove(); onRetry(); });
      el.appendChild(b);
    }
    list.appendChild(el); state.lastRole = null; scrollBottom(true);
  }
  function renderTyping(){
    removeTyping();
    const r = document.createElement('div'); r.className = 'drop-row assistant first last'; r.id = 'drop-typing';
    r.innerHTML = '<div class="drop-av">'+dropSVG('thinking')+'</div><div class="drop-stack"><div class="drop-typing" aria-label="Drop AI yozmoqda"><i></i><i></i><i></i></div></div>';
    list.appendChild(r); scrollBottom(true);
  }
  function removeTyping(){ const t = $('drop-typing'); if(t) t.remove(); }

  const QUICK_ACTIONS = [
    { t:"Bu ilovada nima qilishim mumkin?", ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>' },
    { t:"Qanday o\u2018rganishni boshlayman?", ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 L12 5 L2 10 L12 15 Z"/><path d="M6 12 V17 C6 18.5 8.5 20 12 20 C15.5 20 18 18.5 18 17 V12"/></svg>' },
    { t:"Motivatsiyam yo\u2018q \u2014 nima qilay?", ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 L4 14 h7 l-1 8 l9-12 h-7 z"/></svg>' },
    { t:"Bugungi progresim qanday?", ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>' }
  ];
  function askQuick(t){ if(state.sending || state.loading) return; inp.value = t; onInput(); sendMessage(); }

  function renderWelcomeEmpty(){
    const nm = (window.__wdName||'').trim();
    const w = document.createElement('div'); w.className = 'drop-welcome';
    w.innerHTML = '<div class="drop-welcome-av">'+dropSVG('happy')+'</div><h3></h3><p></p><div class="drop-sugg"></div>';
    w.querySelector('h3').textContent = nm ? ('Salom, ' + nm + '!') : 'Salom!';
    w.querySelector('p').textContent = "Men Drop AI — WordDrop'dagi yordamchingizman. Ilova, ingliz tilini o\u2018rganish yoki motivatsiya haqida so\u2018rang.";
    const g = w.querySelector('.drop-sugg');
    if(remaining() <= 0){ g.remove(); list.appendChild(w); return; }
    QUICK_ACTIONS.forEach(qa=>{
      const b = document.createElement('button'); b.type = 'button'; b.className = 'drop-sugg-btn';
      b.innerHTML = '<span class="ic">'+qa.ic+'</span><span></span>';
      b.lastChild.textContent = qa.t;
      b.addEventListener('click', ()=>askQuick(qa.t));
      g.appendChild(b);
    });
    list.appendChild(w);
  }
  function renderAllHistory(){
    list.innerHTML = '';
    state.lastRole = null; state.lastDay = null; state.lastTs = 0;
    if(!state.hist.length) renderWelcomeEmpty();
    else state.hist.forEach(h => renderMsg(h.role, h.content, h.ts, { silent:true }));
    scrollBottom(false);
  }
  function renderRegisterCTA(){
    if(state.ctaShown) return;
    state.ctaShown = true;
    const el = document.createElement('div'); el.className = 'drop-cta';
    el.innerHTML =
      '<div class="drop-cta-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg></div>' +
      '<b>Bugungi ' + DAILY_MAX_GUEST + ' ta bepul savol tugadi</b>' +
      '<p>Ro\u2018yxatdan o\u2018tsangiz, har kuni <b>' + DAILY_MAX_REG + ' ta savol</b> berasiz va suhbatlaringiz barcha qurilmalarda saqlanadi.</p>' +
      '<button class="drop-cta-btn" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>Ro\u2018yxatdan o\u2018tish</button>';
    el.querySelector('button').addEventListener('click', () => {
      closeChat();
      if(typeof openAuthSheet === 'function') openAuthSheet('signup');
    });
    list.appendChild(el); state.lastRole = null; scrollBottom(true);
  }
  function renderDailyDone(){
    if(list.querySelector('.drop-sys.daily')) return;
    setMood('sleepy');
    const el = renderSys("<b>Bugungi " + DAILY_MAX_REG + " ta savol tugadi.</b><br>Ertaga yana yordam beraman \ud83c\udf19" +
      (window.__wdIsPro ? "" : "<br><button type='button' class='drop-pro-btn' data-open-pro>\u2b50 Pro bilan kuniga 100 ta</button>"));
    el.classList.add('daily');
  }
  function renderQuickActions(){
    qaBox.innerHTML = '';
    // Bo'sh chatda takliflar welcome ichida turadi; javobdan keyin — chip ko'rinishida
    if(!state.hist.length || remaining() <= 0) return;
    if(state.hist[state.hist.length-1].role !== 'assistant') return;
    QUICK_ACTIONS.forEach(qa=>{
      const b = document.createElement('button'); b.type = 'button'; b.className = 'drop-qa-btn';
      b.textContent = qa.t; b.addEventListener('click', ()=>askQuick(qa.t));
      qaBox.appendChild(b);
    });
  }
  /* Limit / yuklanish holatiga qarab composer'ni sozlaydi */
  function updateComposer(){
    const out = remaining() <= 0;
    const busy = state.sending || state.loading;
    inp.disabled = out || state.loading;
    row.classList.toggle('locked', out);
    inp.placeholder = out ? (isRegistered() ? 'Bugungi savollar tugadi — ertaga qaytamiz' : 'Davom etish uchun ro\u2018yxatdan o\u2018ting')
                         : (state.loading ? 'Yuklanmoqda...' : 'Savolingizni yozing...');
    send.disabled = busy || out || !inp.value.trim();
    send.setAttribute('aria-label', state.sending ? 'Javob kutilmoqda' : 'Yuborish');
    if(hintL) hintL.textContent = (!TOUCH && !out) ? 'Enter — yuborish, Shift+Enter — yangi qator' : '';
  }
  function renderAfterState(){
    if(remaining() <= 0){ qaBox.innerHTML = ''; if(isRegistered()) renderDailyDone(); else renderRegisterCTA(); }
    else renderQuickActions();
    updateComposer();
  }

  function buildProfile(){
    return {
      name: window.__wdName || '',
      cefr: window.__wdCEFR || '',
      goal: window.__wdGoal || '',
      interests: Array.isArray(window.__wdInterests) ? window.__wdInterests : [],
      dailyMin: Number(window.__wdDailyMin||0),
      xp: Number(window.__wdXP||0),
      level: Number((window.__wdLevelReached!==undefined ? window.__wdLevelReached : (window.__wdLastLevel||0))||0),
      streak: Number(window.__wdDaily||0),
      perfect: Number(window.__wdPerfect||0)
    };
  }
  function errText(resp){
    if(resp && resp.__error){
      if(typeof aiErrMsg === 'function'){ try{ return aiErrMsg(resp); }catch(e){} }
      if(resp.kind === 'network') return "Internet aloqasi yo\u2018q. Ulanishni tekshirib qayta urining.";
      if(resp.kind === 'timeout') return "Javob juda uzoq kechikdi. Qayta urinib ko\u2018ring.";
    }
    return "Drop AI hozir javob bera olmadi. Birozdan keyin qayta urining.";
  }

  /* ---------- Yuborish ---------- */
  async function sendMessage(){
    if(state.sending || state.loading) return;
    const text = (inp.value||'').trim().slice(0, MAX_LEN);
    if(!text) return;
    if(remaining() <= 0){ renderAfterState(); return; }
    clearTransient();
    qaBox.innerHTML = '';
    inp.value = ''; onInput();
    renderMsg('user', text);
    saveMessage('user', text);      // fon rejimida — UI kutib qolmasin
    // v94: kitobcha/PDF so'rovi — to'g'ridan-to'g'ri studiyaga yo'naltiramiz
    if(/(kitobcha|kitobch|pdf|booklet|daftarcha|qo['ʻ‘]llanma)/i.test(text) && /(qil|yasa|tuz|ber|kerak|tayyorla|yarat|chiqar)/i.test(text) && window.__wdOpenBooklet){
      const off=document.createElement('div'); off.className='drop-offer';
      off.innerHTML='<p>Buni kitobcha studiyasida tayyorlayman: u yerda ranglarni, o\u2018lchamni tanlaysiz va PDF olasiz.</p><button type="button">Studiyani ochish</button>';
      off.querySelector('button').addEventListener('click',()=>window.__wdOpenBooklet({brief:text}));
      list.appendChild(off); state.lastRole=null; scrollBottom(true);
      return;
    }
    await requestReply(text);
  }
  /* AI'dan javob so'raydi. Qayta urinishda foydalanuvchi xabari takrorlanmaydi. */
  async function requestReply(text){
    if(state.sending) return;
    state.sending = true;
    updateComposer();
    setMood('thinking'); setStatus('Yozmoqda...');
    renderTyping();
    let reply = null, resp = null;
    try{
      // Oxirgi foydalanuvchi xabaridan oldingi kontekst
      let h = state.hist.slice();
      if(h.length && h[h.length-1].role === 'user') h = h.slice(0, -1);
      const history = h.slice(-CTX_MSGS).map(x=>({ role:x.role, content:x.content }));
      resp = await aiRequest({ mode:'assistant', message:text, history, profile:buildProfile() });
      if(resp && !resp.__error && typeof resp.reply === 'string' && resp.reply.trim()) reply = resp.reply.trim();
    }catch(e){ resp = { __error:true, kind:'network' }; }
    removeTyping();
    state.sending = false;

    if(reply){
      setMood('happy'); setStatus('Onlayn');
      renderMsg('assistant', reply);
      await saveMessage('assistant', reply);
      await commitBump();
      updateQuotaUI();
      renderAfterState();
    } else {
      setMood('error'); setStatus('Javob kelmadi');
      renderError(errText(resp), ()=>requestReply(text));
      updateComposer();
      setTimeout(()=>{ if(!state.sending){ setMood('happy'); setStatus('Onlayn'); } }, 2500);
    }
    if(state.open && !TOUCH) setTimeout(()=>inp.focus(), 30);
  }

  /* ---------- Viewport (mobil klaviatura) ---------- */
  let vvRAF = null;
  function updateViewportSize(){
    if(vvRAF) return;
    vvRAF = requestAnimationFrame(()=>{
      vvRAF = null;
      const keepBottom = atBottom();
      const vv = window.visualViewport;
      ov.style.setProperty('--drop-h', (vv ? vv.height : window.innerHeight) + 'px');
      ov.style.setProperty('--drop-top', (vv ? vv.offsetTop : 0) + 'px');
      if(keepBottom) body.scrollTop = body.scrollHeight;
    });
  }
  function attachViewportTracker(){
    updateViewportSize();
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', updateViewportSize);
      window.visualViewport.addEventListener('scroll', updateViewportSize);
    }
    window.addEventListener('resize', updateViewportSize);
    window.addEventListener('orientationchange', updateViewportSize);
  }
  function detachViewportTracker(){
    if(window.visualViewport){
      window.visualViewport.removeEventListener('resize', updateViewportSize);
      window.visualViewport.removeEventListener('scroll', updateViewportSize);
    }
    window.removeEventListener('resize', updateViewportSize);
    window.removeEventListener('orientationchange', updateViewportSize);
  }

  /* ---------- Ochish / yopish ---------- */
  let lastFocus = null;
  async function openChat(){
    if(state.open) return;
    state.open = true;
    lastFocus = document.activeElement;
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
    fab.classList.remove('pulse');
    try{ localStorage.setItem(LS_SEEN, '1'); }catch(e){}
    attachViewportTracker();

    // Tarix yuklanguncha yozish bloklanadi (aks holda yozilgan xabar o'chib ketardi)
    state.loading = true;
    if(!state.historyLoaded){ list.innerHTML = ''; renderTyping(); }
    updateComposer();
    try{ await Promise.all([fetchTodayCount(), loadHistory()]); }catch(e){}
    state.loading = false;
    if(!state.open) return;           // foydalanuvchi yuklanish paytida yopgan bo'lsa
    updateQuotaUI();
    renderAllHistory();
    renderAfterState();
    if(!TOUCH) setTimeout(()=>inp.focus(), 200);   // mobilda klaviatura o'zi ochilmasin
  }
  function closeChat(){
    if(!state.open) return;
    state.open = false;
    cf.classList.remove('on');
    ov.classList.remove('on');
    document.body.style.overflow = '';
    state.ctaShown = false;
    detachViewportTracker();
    try{ if(lastFocus && lastFocus.focus) lastFocus.focus(); }catch(e){}
  }

  /* TTL — chat uzoq ochiq tursa ham 24 soatlik chegara amal qiladi */
  setInterval(()=>{
    const before = state.hist.length;
    state.hist = pruneHist(state.hist);
    if(state.hist.length !== before){
      try{ localStorage.setItem(LS_HIST, JSON.stringify(state.hist)); }catch(e){}
      if(state.open && !state.sending){ renderAllHistory(); renderAfterState(); }
    }
  }, 10 * 60 * 1000);

  /* ---------- Hodisalar ---------- */
  function onInput(){
    const len = inp.value.length;
    inp.style.height = 'auto';
    inp.style.height = Math.min(132, Math.max(40, inp.scrollHeight)) + 'px';
    if(cnt){
      cnt.textContent = len >= MAX_LEN * 0.75 ? (len + '/' + MAX_LEN) : '';
      cnt.classList.toggle('warn', len >= MAX_LEN * 0.95);
    }
    updateComposer();
  }
  fab.addEventListener('click', openChat);
  closeX.addEventListener('click', closeChat);
  send.addEventListener('click', sendMessage);
  inp.addEventListener('input', onInput);
  inp.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey && !TOUCH && !e.isComposing){ e.preventDefault(); sendMessage(); }
  });
  inp.addEventListener('focus', () => setTimeout(()=>{ updateViewportSize(); scrollBottom(false); }, 250));
  body.addEventListener('scroll', () => { downBtn.classList.toggle('on', !atBottom()); }, { passive:true });
  downBtn.addEventListener('click', () => scrollBottom(true));

  clearBtn.addEventListener('click', () => {
    if(!state.hist.length){ try{ showToast("Suhbat allaqachon bo\u2018sh"); }catch(e){} return; }
    cf.classList.add('on'); setTimeout(()=>cfNo.focus(), 50);
  });
  cfNo.addEventListener('click', () => cf.classList.remove('on'));
  cf.addEventListener('click', e => { if(e.target === cf) cf.classList.remove('on'); });
  cfYes.addEventListener('click', async () => { cf.classList.remove('on'); if(!state.sending) await clearHistory(); });
  window.addEventListener('keydown', e => {
    if(e.key !== 'Escape' || !state.open) return;
    if(cf.classList.contains('on')) cf.classList.remove('on'); else closeChat();
  });

  /* ---------- Ishga tushirish ---------- */
  function init(){
    let shown = false;
    const showFab = ()=>{
      if(shown) return; shown = true;
      fab.style.display = 'grid';
      try{ if(!localStorage.getItem(LS_SEEN)) setTimeout(()=>fab.classList.add('pulse'), 800); }catch(e){}
      fetchTodayCount().then(updateQuotaUI).catch(()=>{});
    };
    if($('splash')){
      const iv = setInterval(()=>{
        const sp = $('splash');
        if(!sp || sp.classList.contains('leaving') || sp.style.display === 'none'){ clearInterval(iv); showFab(); }
      }, 500);
      setTimeout(()=>{ clearInterval(iv); showFab(); }, 4500);
    } else showFab();
  }
  updateComposer();
  init();

  /* v94: vositalar (suhbat, rasm, kitobcha) ham shu kunlik limitdan foydalanadi */
  async function extBump(){ await commitBump(); updateQuotaUI(); }
  document.querySelectorAll('#drop-tools [data-tool]').forEach(b=>b.addEventListener('click',()=>{
    const t=b.dataset.tool;
    if(t==='talk' && window.__wdOpenTalk) window.__wdOpenTalk();
    if(t==='vision' && window.__wdOpenVision) window.__wdOpenVision();
    if(t==='book' && window.__wdOpenBooklet) window.__wdOpenBooklet();
  }));
  window.__wdDropAI = { open: openChat, close: closeChat, setMood, remaining, isRegistered, bump: extBump, maxToday };
  window.__wdSetDropMax = function(n){ DAILY_MAX_REG = n; try{ updateQuotaUI(); }catch(e){} };
})();
