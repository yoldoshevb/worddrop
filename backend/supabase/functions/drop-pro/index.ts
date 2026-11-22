// Supabase Edge Function: drop-pro
// Drop AI'ning kengaytirilgan imkoniyatlari (WordDrop v94; v98 — Pro kitobchalar).
// Mavjud check-sentence funksiyasiga tegmaydi — alohida ishlaydi.
// GROQ_API_KEY — loyiha Secrets'idan (check-sentence bilan bir xil kalit).
//
// Rejimlar:
//   roleplay       — jonli suhbat sherigi: rolda inglizcha javob + xato tuzatish
//   roleplay_eval  — suhbat yakuni: band, xatolar, foydali iboralar (o'zbekcha)
//   vision_words   — rasmdagi narsalar/matndan o'rganishga arziydigan so'zlar
//   booklet        — kitobcha (PDF) uchun tuzilgan JSON hujjat yaratish
//   booklet_edit   — mavjud kitobcha hujjatini ko'rsatma bo'yicha tahrirlash
//   mnemonic       — o'zbekcha eslab qolish usuli (tovush o'xshashligi + tasvir), 6 tagacha so'z
//
// v98: booklet / booklet_edit + {pro:true} — faqat Pro hisob (JWT + wd_is_pro). Kengroq hajm (8 bo'limgacha),
//      qo'shimcha bloklar (keypoints, mistakes), Pro muqovalar, chuqurroq fikrlovchi model va ikkinchi
//      "muharrir" bosqichi: o'zbekcha imlo, inglizcha to'g'rilik va javoblar kalitini tekshiradi.
// v99: barcha kitobchalarda muharrir bosqichi; so'z tarjimalari tasdiqlangan lug'atdan (word_translations)
//      tekshiriladi; illyustratsiya kalitlari (Fluent Emoji Flat, MIT) — bo'lim, muqova, so'z va kartochkalar uchun;
//      boyroq mazmun talablari.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const IS_DEV = Deno.env.get("ENV") === "development";
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
import { createClient } from "npm:@supabase/supabase-js@2";
const SB = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
/* So'rov egasi Pro'mi? (foydalanuvchi JWT + wd_is_pro) */
async function isProReq(req: Request): Promise<boolean> {
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!tok || tok.startsWith("sb_")) return false;
  try {
    const { data } = await SB.auth.getUser(tok); const uid = data?.user?.id; if (!uid) return false;
    const { data: ok } = await SB.rpc("wd_is_pro", { uid }); return !!ok;
  } catch { return false; }
}
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, n).trim();

type ModelCfg = { id: string; extra: Record<string, unknown> };
const TEXT_MODELS: ModelCfg[] = [
  { id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "low" } },
  { id: "qwen/qwen3.8-27b", extra: { reasoning_effort: "none", reasoning_format: "hidden" } },
  { id: "openai/gpt-oss-20b", extra: { include_reasoning: false, reasoning_effort: "low" } },
];
// Pro kitobchalar: chuqurroq o'ylaydigan sozlama
const PRO_MODELS: ModelCfg[] = [
  { id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "medium" } },
  ...TEXT_MODELS,
];
const VISION_MODELS: ModelCfg[] = [
  { id: "qwen/qwen3.8-27b", extra: { reasoning_effort: "none", reasoning_format: "hidden" } },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", extra: {} },
];

function extractJson(raw: string): any | null {
  const s = String(raw)
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "")
    .replace(/```json|```/g, "").trim();
  try { return JSON.parse(s); } catch { /* davom */ }
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch { /* */ } }
  return null;
}

async function groqJson(apiKey: string, models: ModelCfg[], messages: unknown[], maxTokens: number, temperature: number): Promise<any | Response> {
  const errs: string[] = [];
  for (const m of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let r: Response;
      try {
        r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: m.id,
            temperature: Math.max(0.01, Math.min(1.5, temperature)),
            max_completion_tokens: Math.min(16000, maxTokens),
            response_format: { type: "json_object" },
            ...m.extra,
            messages,
          }),
        });
      } catch (e) { errs.push(`${m.id}: tarmoq ${String(e).slice(0, 100)}`); break; }
      if (r.status === 429 && attempt === 0) {
        await sleep(Math.min((Number(r.headers.get("retry-after")) || 1) * 1000, 5000));
        continue;
      }
      if (!r.ok) { errs.push(`${m.id}: ${r.status} ${(await r.text()).slice(0, 200)}`); break; }
      let data: any;
      try { data = await r.json(); } catch { errs.push(`${m.id}: JSON emas`); break; }
      const parsed = extractJson(data?.choices?.[0]?.message?.content ?? "");
      if (parsed && typeof parsed === "object") return parsed;
      errs.push(`${m.id}: JSON o'qilmadi`);
      break;
    }
  }
  return json({ error: "AI vaqtincha javob bermadi", ...(IS_DEV ? { detail: errs.join(" || ") } : {}) }, 502);
}

const UZ = `O'zbekcha matnlar: standart adabiy o'zbek tili, lotin yozuvi, sodda va aniq. Sheva va arxaik so'z yo'q. O'zbek apostrofi: o', g'.`;

/* ───────────── Kitobcha hujjati: sxema va tozalash ───────────── */
const BOOKLET_SCHEMA = `
HUJJAT SXEMASI (faqat shu maydonlar; boshqa maydon qo'shma):
{
 "title": "qisqa sarlavha (o'zbekcha)",
 "subtitle": "bir jumla",
 "author": "ixtiyoriy",
 "size": "A5" | "B5" | "A4",
 "theme": { "primary": "#RRGGBB", "accent": "#RRGGBB", "paper": "#RRGGBB", "ink": "#RRGGBB", "font": "grotesk" | "serif" | "rounded" },
 "cover": { "style": "big-title" | "band" | "minimal", "badge": "ixtiyoriy qisqa yozuv, masalan '7 kun'", "icons": ["mavzuga mos 3 ta illyustratsiya nomi"] },
 "sections": [
   { "code": "1" (qisqa belgi: raqam yoki 1-2 harf), "title": "...", "color": "#RRGGBB (har bo'limga boshqa yorqin rang)", "icon": "illyustratsiya nomi", "intro": "1-2 jumla",
     "blocks": [ BLOK, ... ] }
 ]
}
BLOK turlari:
 {"type":"text","text":"paragraf; **qalin** mumkin"}
 {"type":"callout","tone":"tip"|"rule"|"warn","title":"...","text":"..."}
 {"type":"list","style":"bullet"|"number"|"check","items":["..."]}
 {"type":"table","head":["..",".."],"rows":[["..",".."]]}
 {"type":"vocab","items":[{"en":"word","ipa":"/.../","uz":"tarjima","ex":"English example sentence.","icon":"ixtiyoriy illyustratsiya (aniq narsa bo'lsa)"}]}
 {"type":"cards","title":"...","items":[{"front":"inglizcha so'z yoki savol","back":"o'zbekcha javob","hint":"ixtiyoriy","icon":"ixtiyoriy"}]}
 {"type":"dialog","lines":[{"who":"A","en":"...","uz":"..."}]}
 {"type":"exercise","title":"...","kind":"fill"|"translate"|"write"|"match","items":[{"q":"savol, bo'sh joy ____ bilan","a":"to'g'ri javob"}]}
 {"type":"quiz","title":"...","items":[{"q":"...","options":["a","b","c"],"answer":0}]}
 {"type":"lines","label":"yozish uchun","n":5}
 {"type":"tracker","label":"...","days":7}
QOIDALAR:
- Kartochkalar (cards) avtomatik ravishda alohida qirqiladigan sahifalarga chiqariladi; javoblar kaliti oxirida avtomatik yasaladi.
- Inglizcha misollar tabiiy va to'g'ri; o'zbekcha izohlar qisqa.
- Ranglar: kontrasti yetarli bo'lsin (paper ochiq, ink to'q). Foydalanuvchi rang aytsa — aynan shuni ishlat.
- Hajm: foydalanuvchi aytmasa 3-5 bo'lim. HAR bo'limda: 2-4 jumlali tushuntirish (text), qoida yoki maslahat (callout), kamida 6 ta so'z/ibora (vocab yoki table) misollari bilan, dialog yoki misollar ro'yxati, kamida 6 savolli mashq yoki test. Jami 16-40 ta kartochka.
- Mazmun bo'sh va umumiy bo'lmasin: aniq qoidalar, real hayotiy misollar, o'quvchi darajasiga mos.
- Tarjimalar: har so'zning eng keng tarqalgan, aniq o'zbekcha tarjimasi (ruscha yoki so'zma-so'z g'aliz tarjima emas).
- Ranglar: theme.primary va accent bir-biridan farqli, yorqin; har bo'lim "color" i boshqa-boshqa (masalan ko'k, qizil, yashil, binafsha, to'q sariq), lekin oq qog'ozda o'qiladigan darajada to'q.
`;
const PRO_SCHEMA = `
PRO KITOBCHA (shu hujjat Pro sifatda):
- Muqova uslubi qo'shimcha: "poster" | "split" | "editorial" (ulardan birini tanla, mavzuga mos).
- Qo'shimcha bloklar:
 {"type":"keypoints","title":"Esda tuting","items":["3-5 ta eng muhim qisqa xulosa"]}
 {"type":"mistakes","title":"Ko'p uchraydigan xatolar","items":[{"wrong":"noto'g'ri inglizcha","right":"to'g'ri inglizcha","uz":"nega — qisqa izoh"}]}
- Hajm: so'ralmasa 4-6 bo'lim (eng ko'pi 8), har bo'limda 4-8 blok. Har bo'lim oxirida "keypoints"; kerakli joyda "mistakes".
- Har bo'limda kamida bitta mashq yoki test va har birida javob ("a" yoki "answer") bo'lsin.
- Sifat: o'zbekcha matn — adabiy, imlosi to'g'ri, tushunarli; inglizcha misollar — tabiiy, grammatik jihatdan benuqson; IPA to'g'ri.
`;
/* Illyustratsiyalar: Microsoft Fluent Emoji (Flat), MIT litsenziya — ilova Iconify orqali SVG ko'rinishida chizadi */
const ICONS = new Set(["books", "open-book", "notebook", "memo", "pencil", "writing-hand", "graduation-cap", "school", "teacher", "woman-teacher", "man-student", "woman-student", "brain", "light-bulb", "speech-balloon", "thought-balloon", "left-speech-bubble", "speaking-head", "ear", "eyes", "microphone", "headphone", "loudspeaker", "bell", "star", "glowing-star", "sparkles", "trophy", "1st-place-medal", "sports-medal", "party-popper", "confetti-ball", "fire", "rocket", "chart-increasing", "bar-chart", "hourglass-done", "alarm-clock", "stopwatch", "calendar", "spiral-calendar", "check-mark-button", "cross-mark", "warning", "red-question-mark", "key", "locked", "unlocked", "link", "pushpin", "round-pushpin", "magnifying-glass-tilted-left", "gear", "hammer-and-wrench", "puzzle-piece", "house", "house-with-garden", "office-building", "hospital", "bank", "hotel", "classical-building", "stadium", "shopping-cart", "shopping-bags", "convenience-store", "department-store", "airplane", "airplane-departure", "train", "bus", "automobile", "taxi", "bicycle", "ship", "world-map", "globe-showing-europe-africa", "globe-with-meridians", "compass", "luggage", "passport-control", "ticket", "hot-beverage", "teacup-without-handle", "bubble-tea", "fork-and-knife-with-plate", "fork-and-knife", "pizza", "hamburger", "red-apple", "green-apple", "banana", "grapes", "bread", "croissant", "birthday-cake", "cookie", "ice-cream", "cooking", "pot-of-food", "green-salad", "steaming-bowl", "spaghetti", "sushi", "taco", "watermelon", "carrot", "cheese-wedge", "egg", "dog", "cat", "cat-face", "dog-face", "rabbit-face", "panda", "bear", "lion", "tiger-face", "fox", "monkey", "owl", "penguin", "butterfly", "fish", "dolphin", "elephant", "horse", "unicorn", "sun", "sun-with-face", "cloud", "umbrella", "snowflake", "rainbow", "cloud-with-rain", "high-voltage", "tornado", "water-wave", "seedling", "deciduous-tree", "evergreen-tree", "palm-tree", "cactus", "tulip", "rose", "sunflower", "herb", "four-leaf-clover", "maple-leaf", "red-heart", "orange-heart", "yellow-heart", "green-heart", "blue-heart", "purple-heart", "sparkling-heart", "smiling-face-with-smiling-eyes", "grinning-face", "face-with-tears-of-joy", "thinking-face", "star-struck", "partying-face", "smiling-face-with-sunglasses", "nerd-face", "sleeping-face", "worried-face", "pleading-face", "angry-face", "face-with-monocle", "hugging-face", "winking-face", "thumbs-up", "clapping-hands", "waving-hand", "handshake", "raising-hands", "flexed-biceps", "folded-hands", "ok-hand", "victory-hand", "mobile-phone", "laptop", "desktop-computer", "keyboard", "camera", "camera-with-flash", "television", "radio", "video-game", "joystick", "robot", "battery", "electric-plug", "money-bag", "dollar-banknote", "credit-card", "coin", "gem-stone", "wrapped-gift", "briefcase", "soccer-ball", "basketball", "tennis", "volleyball", "running-shoe", "person-running", "man-running", "woman-running", "person-swimming", "guitar", "musical-note", "musical-notes", "artist-palette", "framed-picture", "performing-arts", "clapper-board", "movie-camera", "popcorn", "man-health-worker", "woman-health-worker", "police-officer", "man-cook", "woman-cook", "man-farmer", "woman-scientist", "man-technologist", "woman-technologist", "firefighter", "pilot", "astronaut", "detective", "people-hugging", "baby", "bed", "couch-and-lamp", "door", "window", "toilet", "shower", "bathtub", "broom", "basket", "soap", "toothbrush", "jeans", "dress", "t-shirt", "crown", "top-hat", "glasses", "sunglasses", "envelope", "incoming-envelope", "package", "newspaper", "scroll", "page-facing-up", "clipboard", "card-index", "bookmark", "label", "paperclip", "scissors", "straight-ruler", "triangular-ruler", "first-quarter-moon", "crescent-moon", "new-moon-face", "full-moon-face", "night-with-stars", "sunrise", "cityscape", "milky-way"]);
const ICON_HINT = `ILLYUSTRATSIYALAR: "icon" maydonlari uchun FAQAT shu ro'yxatdagi nomlardan birini yoz (mos kelmasa — bo'sh qoldir): ${[...ICONS].join(" ")}`;
const icon = (v: unknown) => { const x = String(v ?? "").trim().toLowerCase(); return ICONS.has(x) ? x : ""; };
const HEX = /^#[0-9a-fA-F]{6}$/;
const BLOCK_TYPES = new Set(["text", "callout", "list", "table", "vocab", "cards", "dialog", "exercise", "quiz", "lines", "tracker", "keypoints", "mistakes"]);
function cleanDoc(d: any): any {
  if (!d || typeof d !== "object") return null;
  const th = d.theme && typeof d.theme === "object" ? d.theme : {};
  const col = (v: unknown, def: string) => (typeof v === "string" && HEX.test(v) ? v : def);
  const arr = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);
  const out: any = {
    title: clip(d.title, 90) || "Kitobcha",
    subtitle: clip(d.subtitle, 200),
    author: clip(d.author, 60),
    size: ["A5", "B5", "A4"].includes(d.size) ? d.size : "A5",
    theme: {
      primary: col(th.primary, "#2F6FED"), accent: col(th.accent, "#E8374A"),
      paper: col(th.paper, "#FFFFFF"), ink: col(th.ink, "#0F1B3D"),
      font: ["grotesk", "serif", "rounded"].includes(th.font) ? th.font : "grotesk",
    },
    cover: {
      style: ["big-title", "band", "minimal", "poster", "split", "editorial"].includes(d?.cover?.style) ? d.cover.style : "big-title",
      badge: clip(d?.cover?.badge, 24),
      icons: arr(d?.cover?.icons, 4).map(icon).filter(Boolean),
    },
    sections: [],
    ...(d.pro ? { pro: true } : {}),
  };
  for (const s of arr(d.sections, 12)) {
    if (!s || typeof s !== "object") continue;
    const sec: any = { code: clip(s.code, 3), title: clip(s.title, 80), color: col(s.color, ""), icon: icon(s.icon), intro: clip(s.intro, 400), blocks: [] };
    for (const b of arr(s.blocks, 16)) {
      if (!b || !BLOCK_TYPES.has(b.type)) continue;
      const t = b.type, o: any = { type: t };
      if (t === "text") o.text = clip(b.text, 1500);
      if (t === "callout") { o.tone = ["tip", "rule", "warn"].includes(b.tone) ? b.tone : "tip"; o.title = clip(b.title, 80); o.text = clip(b.text, 700); }
      if (t === "list") { o.style = ["bullet", "number", "check"].includes(b.style) ? b.style : "bullet"; o.items = arr(b.items, 14).map((x: unknown) => clip(x, 240)).filter(Boolean); }
      if (t === "table") { o.head = arr(b.head, 5).map((x: unknown) => clip(x, 40)); o.rows = arr(b.rows, 14).map((r: any) => arr(r, 5).map((x: unknown) => clip(x, 160))); }
      if (t === "vocab") o.items = arr(b.items, 30).map((x: any) => ({ en: clip(x?.en, 50), ipa: clip(x?.ipa, 40), uz: clip(x?.uz, 80), ex: clip(x?.ex, 160), icon: icon(x?.icon) })).filter((x: any) => x.en);
      if (t === "cards") { o.title = clip(b.title, 80); o.items = arr(b.items, 48).map((x: any) => ({ front: clip(x?.front, 80), back: clip(x?.back, 120), hint: clip(x?.hint, 80), icon: icon(x?.icon) })).filter((x: any) => x.front && x.back); }
      if (t === "dialog") o.lines = arr(b.lines, 16).map((x: any) => ({ who: clip(x?.who, 12), en: clip(x?.en, 200), uz: clip(x?.uz, 200) })).filter((x: any) => x.en);
      if (t === "exercise") { o.title = clip(b.title, 100); o.kind = ["fill", "translate", "write", "match"].includes(b.kind) ? b.kind : "fill"; o.items = arr(b.items, 14).map((x: any) => ({ q: clip(x?.q, 240), a: clip(x?.a, 200) })).filter((x: any) => x.q); }
      if (t === "quiz") { o.title = clip(b.title, 100); o.items = arr(b.items, 12).map((x: any) => { const opts = arr(x?.options, 4).map((y: unknown) => clip(y, 100)); const a = Number(x?.answer); return { q: clip(x?.q, 240), options: opts, answer: a >= 0 && a < opts.length ? a : 0 }; }).filter((x: any) => x.q && x.options.length >= 2); }
      if (t === "lines") { o.label = clip(b.label, 100); o.n = Math.max(1, Math.min(20, Number(b.n) || 5)); }
      if (t === "tracker") { o.label = clip(b.label, 100); o.days = Math.max(3, Math.min(31, Number(b.days) || 7)); }
      if (t === "keypoints") { o.title = clip(b.title, 80) || "Esda tuting"; o.items = arr(b.items, 8).map((x: unknown) => clip(x, 220)).filter(Boolean); if (!o.items.length) continue; }
      if (t === "mistakes") { o.title = clip(b.title, 80) || "Ko'p uchraydigan xatolar"; o.items = arr(b.items, 10).map((x: any) => ({ wrong: clip(x?.wrong, 160), right: clip(x?.right, 160), uz: clip(x?.uz, 200) })).filter((x: any) => x.wrong && x.right); if (!o.items.length) continue; }
      sec.blocks.push(o);
    }
    if (sec.title) out.sections.push(sec);
  }
  return out.sections.length ? out : null;
}

/* ───────────── Tasdiqlangan lug'at bilan tekshirish ─────────────
   AI bergan so'z tarjimalari word_translations (verified) bazasidagi tarjima bilan almashtiriladi. */
async function verifyWords(doc: any): Promise<number> {
  const keys = new Set<string>();
  doc.sections.forEach((s: any) => s.blocks.forEach((b: any) => {
    if (b.type === "vocab") b.items.forEach((x: any) => keys.add(x.en.toLowerCase()));
    if (b.type === "cards") b.items.forEach((x: any) => { if (x.front.split(/\s+/).length <= 3) keys.add(x.front.toLowerCase()); });
  }));
  if (!keys.size) return 0;
  const list = [...keys].slice(0, 300);
  const { data } = await SB.from("word_translations").select("en,uz,ipa").in("en", list).eq("verified", true);
  const dict = new Map<string, any>(); (data ?? []).forEach((r: any) => { const k = String(r.en).toLowerCase(); if (!dict.has(k)) dict.set(k, r); });
  let n = 0;
  doc.sections.forEach((s: any) => s.blocks.forEach((b: any) => {
    if (b.type === "vocab") b.items.forEach((x: any) => { const r = dict.get(x.en.toLowerCase()); if (r?.uz) { if (r.uz !== x.uz) n++; x.uz = clip(r.uz, 80); if (r.ipa && !x.ipa) x.ipa = clip(r.ipa, 40); x.ok = true; } });
    if (b.type === "cards") b.items.forEach((x: any) => { const r = dict.get(x.front.toLowerCase()); if (r?.uz) { if (r.uz !== x.back) n++; x.back = clip(r.uz, 120); } });
  }));
  return n;
}
/* Tarjimalarni alohida, chuqur o'ylab tekshirish (lug'atda yo'q so'zlar uchun) */
const CHECK_MODELS: ModelCfg[] = [{ id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "high" } }, ...TEXT_MODELS];
async function fixTranslations(apiKey: string, doc: any): Promise<number> {
  const items: any[] = [];
  doc.sections.forEach((s: any) => s.blocks.forEach((b: any) => {
    if (b.type === "vocab") b.items.forEach((x: any) => { if (!x.ok) items.push({ ref: x, k: "uz", en: x.en, uz: x.uz, ex: x.ex }); });
    if (b.type === "cards") b.items.forEach((x: any) => { if (x.front.split(/\s+/).length <= 3 && !/[?]/.test(x.front)) items.push({ ref: x, k: "back", en: x.front, uz: x.back, ex: x.hint }); });
  }));
  if (!items.length) return 0;
  const list = items.slice(0, 60);
  const r = await groqJson(apiKey, CHECK_MODELS, [{ role: "system", content:
`Sen ingliz-o'zbek lug'atchisisan. Har bir inglizcha so'z/ibora uchun berilgan o'zbekcha tarjimani tekshir.
Misol jumlasidagi ma'noga mos, o'zbek tilida eng keng tarqalgan, aniq tarjimani ber (ruscha so'z, so'zma-so'z yoki noaniq tarjima emas).
Masalan: gate (aeroportda) = chiqish joyi / "geyt"; boarding pass = bortga chiqish taloni; luggage = yuk, bagaj; check-in = ro'yxatdan o'tish.
Berilgan tarjima to'g'ri bo'lsa — o'zgartirmay qaytar. Qisqa yoz (1-4 so'z). ${UZ}
Faqat JSON: {"items":[{"i":raqam,"uz":"to'g'ri tarjima"}]}` },
    { role: "user", content: list.map((x, i) => `${i}. ${x.en} = ${x.uz}${x.ex ? ` | misol: ${x.ex}` : ""}`).join("\n") }], 3000, 0.1);
  if (r instanceof Response || !Array.isArray(r.items)) return 0;
  let n = 0;
  for (const it of r.items) {
    const x = list[Number(it?.i)]; const uz = clip(it?.uz, 80);
    if (!x || !uz || uz === x.uz) continue;
    x.ref[x.k] = uz; n++;
  }
  return n;
}
/* Model hujjatni turli kalit ostida qaytarishi mumkin */
function pickDoc(p: any): any {
  if (!p || typeof p !== "object") return null;
  for (const k of ["doc", "HUJJAT", "document", "booklet", "hujjat"]) if (p[k] && typeof p[k] === "object") return p[k];
  if (Array.isArray(p.sections)) return p;
  const v = Object.values(p).find((x: any) => x && typeof x === "object" && Array.isArray(x.sections)); return v ?? p;
}
const EDITOR_SYS = (pro: boolean) =>
`Sen tajribali muharrir va ingliz tili metodistisan. Senga o'quv kitobchasi hujjati (JSON) beriladi. Uni sinchiklab tekshir va TUZATILGAN TO'LIQ hujjatni qaytar:
- O'zbekcha matnlar: imlo (o', g', sh, ch), grammatika, tabiiylik; sheva, ruscha yoki so'zma-so'z g'aliz tarjima bo'lsa — tuzat.
- So'z tarjimalari: inglizcha so'zning shu kontekstdagi eng keng tarqalgan, aniq o'zbekcha tarjimasi bo'lsin.
- Inglizcha: grammatika, tabiiylik, IPA.
- Mashq va testlar: har savolda bitta aniq to'g'ri javob, "a"/"answer" haqiqatan to'g'ri bo'lsin; bo'sh joy (____) to'g'ri qo'yilgan bo'lsin.
- Kartochkalar: front inglizcha, back o'zbekcha, takrorlanmasin.
- Agar bo'limda mazmun juda kam bo'lsa (masalan 3 tadan kam so'z yoki 4 tadan kam savol) — shu bo'limga mos misol va savollar qo'shib boyit.
Tuzilma, ranglar, illyustratsiya nomlari va bloklar tartibini O'ZGARTIRMA.
${BOOKLET_SCHEMA}${pro ? PRO_SCHEMA : ""}
${UZ}
Faqat JSON: {"doc": TUZATILGAN_HUJJAT, "fixes": son}`;

/* ───────────── Server ───────────── */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const mode = String(body.mode || "");
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) return json({ error: "Server xatosi" }, 500);
    const level = clip(body.cefr, 4) || "B1";

    /* ═══ JONLI SUHBAT ═══ */
    if (mode === "roleplay") {
      const sc = body.scenario && typeof body.scenario === "object" ? body.scenario : {};
      const title = clip(sc.title, 80), role = clip(sc.role, 200), goal = clip(sc.goal, 200), opener = clip(sc.opener, 200);
      const hist = (Array.isArray(body.history) ? body.history : []).slice(-12)
        .map((h: any) => ({ role: h?.role === "assistant" ? "assistant" : "user", content: clip(h?.content, 400) })).filter((h: any) => h.content);
      const message = clip(body.message, 600);
      const turn = Number(body.turn) || hist.filter((h: any) => h.role === "user").length;
      const system =
`You are a friendly English conversation partner inside WordDrop, an app for Uzbek learners (level ${level}).
Scenario: ${title}. Your role: ${role}. Learner's goal: ${goal}.
Stay in character. Speak natural spoken English at ${level} level. Each reply: 1-2 short sentences, then ONE question or prompt that keeps the conversation going. Never lecture inside "reply".
After about 8 learner turns, wrap up politely and set "done": true.
If the learner's last message has a clear grammar or word-choice mistake, put ONE correction in "fix" (most important one only); otherwise "fix": null.
"hint_uz": a short Uzbek hint (max 12 words) on what the learner could say next.
${UZ}
Return ONLY JSON: {"reply":"...","fix":{"wrong":"...","right":"...","uz":"qisqa o'zbekcha izoh"} | null,"hint_uz":"...","done":false}`;
      const msgs: any[] = [{ role: "system", content: system }];
      if (!hist.length && !message) {
        msgs.push({ role: "user", content: `(Start the conversation in character.${opener ? " Suggested opener: " + opener : ""})` });
      } else {
        hist.forEach((h: any) => msgs.push(h.role === "assistant" ? { role: "assistant", content: JSON.stringify({ reply: h.content }) } : h));
        msgs.push({ role: "user", content: message + `\n(Learner turn ${turn + 1})` });
      }
      const p = await groqJson(apiKey, TEXT_MODELS, msgs, 500, 0.8);
      if (p instanceof Response) return p;
      const fix = p.fix && typeof p.fix === "object" && p.fix.wrong && p.fix.right
        ? { wrong: clip(p.fix.wrong, 200), right: clip(p.fix.right, 200), uz: clip(p.fix.uz, 200) } : null;
      const reply = clip(p.reply, 500);
      if (!reply) return json({ error: "AI javobini o'qib bo'lmadi" }, 502);
      return json({ reply, fix, hint_uz: clip(p.hint_uz, 140), done: !!p.done });
    }

    if (mode === "roleplay_eval") {
      const sc = body.scenario && typeof body.scenario === "object" ? body.scenario : {};
      const tr = (Array.isArray(body.transcript) ? body.transcript : []).slice(-30)
        .map((h: any) => `${h?.role === "assistant" ? "Partner" : "Learner"}: ${clip(h?.content, 400)}`).join("\n");
      if (!tr) return json({ error: "transcript kerak" }, 400);
      const system =
`You evaluate a short spoken English role-play by an Uzbek learner (level ${level}). Scenario: ${clip(sc.title, 80)}.
Judge only the Learner lines. Be fair: do not cap scores; strong answers can reach 8-9.
Return ONLY JSON:
{"band": number 1-9 step 0.5 (IELTS-like speaking estimate),
 "scores": {"fluency": 1-9, "vocabulary": 1-9, "grammar": 1-9, "task": 1-9},
 "summary_uz": "2 jumla o'zbekcha umumiy xulosa",
 "strengths_uz": ["...", "..."],
 "mistakes": [{"wrong":"learner's phrase","right":"corrected","uz":"qisqa sabab"}] (max 5),
 "phrases": [{"en":"useful phrase for this situation","uz":"tarjima"}] (4-6),
 "next_uz": "keyingi safar nima qilish kerak, 1 jumla"}
${UZ}`;
      const p = await groqJson(apiKey, TEXT_MODELS, [{ role: "system", content: system }, { role: "user", content: tr }], 1200, 0.3);
      if (p instanceof Response) return p;
      const b9 = (v: unknown) => { const n = Number(v); return isFinite(n) && n >= 1 && n <= 9 ? Math.round(n * 2) / 2 : null; };
      const sc2 = p.scores && typeof p.scores === "object" ? p.scores : {};
      return json({
        band: b9(p.band),
        scores: { fluency: b9(sc2.fluency), vocabulary: b9(sc2.vocabulary), grammar: b9(sc2.grammar), task: b9(sc2.task) },
        summary_uz: clip(p.summary_uz, 400),
        strengths_uz: (Array.isArray(p.strengths_uz) ? p.strengths_uz : []).slice(0, 3).map((x: unknown) => clip(x, 160)),
        mistakes: (Array.isArray(p.mistakes) ? p.mistakes : []).slice(0, 5).map((m: any) => ({ wrong: clip(m?.wrong, 200), right: clip(m?.right, 200), uz: clip(m?.uz, 200) })).filter((m: any) => m.wrong && m.right),
        phrases: (Array.isArray(p.phrases) ? p.phrases : []).slice(0, 6).map((x: any) => ({ en: clip(x?.en, 120), uz: clip(x?.uz, 120) })).filter((x: any) => x.en),
        next_uz: clip(p.next_uz, 200),
      });
    }

    /* ═══ RASMDAN SO'Z ═══ */
    if (mode === "vision_words") {
      const img = typeof body.image === "string" ? body.image : "";
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(img) || img.length > 4_500_000) return json({ error: "Rasm noto'g'ri yoki juda katta" }, 400);
      const known = (Array.isArray(body.known) ? body.known : []).slice(0, 300).map((x: unknown) => clip(x, 40).toLowerCase()).filter(Boolean);
      const system =
`You help an Uzbek learner of English (level ${level}) learn vocabulary from a photo.
Look at the photo: objects, actions, and any printed English text. Pick 6-12 useful English words or short phrases worth learning at ${level} level (prefer words slightly above the level; skip trivial words like "a", "the", "is").
Do NOT include these words the learner already knows: ${known.slice(0, 200).join(", ") || "(none)"}.
For each: "t" (English, lowercase unless proper noun), "pos" (noun/verb/adj/adv/phrase), "tr" (Uzbek translation), "ipa", "ex" (short natural English sentence about this photo), "where_uz" (rasmning qayerida, 2-4 so'z), "lvl" (A1-C2).
Also "scene_uz": one Uzbek sentence describing the photo, and "text_found": printed English text you can read (max 200 chars, or "").
${UZ}
Return ONLY JSON: {"scene_uz":"...","text_found":"...","words":[{...}]}`;
      const msgs = [{ role: "system", content: system }, { role: "user", content: [{ type: "text", text: "Here is the photo." }, { type: "image_url", image_url: { url: img } }] }];
      const p = await groqJson(apiKey, VISION_MODELS, msgs, 1500, 0.3);
      if (p instanceof Response) return p;
      const words = (Array.isArray(p.words) ? p.words : []).slice(0, 14).map((w: any) => ({
        t: clip(w?.t, 50), pos: clip(w?.pos, 12), tr: clip(w?.tr, 80), ipa: clip(w?.ipa, 40), ex: clip(w?.ex, 180), where_uz: clip(w?.where_uz, 60), lvl: clip(w?.lvl, 3),
      })).filter((w: any) => w.t && w.tr && !known.includes(w.t.toLowerCase()));
      return json({ scene_uz: clip(p.scene_uz, 240), text_found: clip(p.text_found, 220), words });
    }

    /* ═══ ESLAB QOLISH USULI (mnemonika) ═══ */
    if (mode === "mnemonic") {
      const items = (Array.isArray(body.items) ? body.items : []).slice(0, 6)
        .map((x: any) => ({ t: clip(x?.t, 50), tr: clip(x?.tr, 80) })).filter((x: any) => x.t && x.tr);
      if (!items.length) return json({ error: "items kerak" }, 400);
      const system =
`Sen o'zbek tilida so'zlashuvchilarga inglizcha so'zlarni eslab qolishga yordam beradigan mnemonika ustasisan.
Har bir so'z uchun bitta qisqa (1-2 jumla) eslab qolish usuli yoz:
1) Avval inglizcha so'zning TALAFFUZIGA o'xshash o'zbekcha so'z yoki ibora top (masalan: "abundant" → "a, bunda": "A, bunda hamma narsa mo'l-ko'l!").
2) Keyin shu tovushni so'zning MA'NOSI bilan bog'laydigan jonli, kulgili yoki yorqin tasvir yarat.
3) Agar yaxshi tovush o'xshashligi bo'lmasa — so'z qismlari (ildiz, qo'shimcha) yoki aniq tasvir orqali bog'la.
Qoidalar: qo'pol, haqoratli, siyosiy yoki diniy mazmun yo'q. Tasvir oddiy odam tasavvur qila oladigan bo'lsin. Tarjimani albatta eslat.
${UZ}
Faqat JSON: {"items":[{"t":"so'z","mn_uz":"eslab qolish usuli","hook":"tovush bog'lanishi, masalan 'a, bunda' (bo'lmasa bo'sh)"}]}`;
      const p = await groqJson(apiKey, TEXT_MODELS, [{ role: "system", content: system }, { role: "user", content: items.map((x: any) => `${x.t} = ${x.tr}`).join("\n") }], 1200, 0.8);
      if (p instanceof Response) return p;
      const out = (Array.isArray(p.items) ? p.items : []).map((x: any) => ({ t: clip(x?.t, 50), mn_uz: clip(x?.mn_uz, 260), hook: clip(x?.hook, 60) })).filter((x: any) => x.t && x.mn_uz);
      if (!out.length) return json({ error: "Eslab qolish usuli tuzilmadi" }, 502);
      return json({ items: out });
    }

    /* ═══ KITOBCHA ═══ */
    const pro = body.pro === true && (await isProReq(req));
    if (body.pro === true && !pro && (mode === "booklet" || mode === "booklet_edit")) return json({ error: "Pro kitobcha faqat WordDrop Pro'da. Oddiy kitobcha uchun Pro belgisini o'chiring." }, 403);

    if (mode === "booklet") {
      const brief = clip(body.brief, 1500);
      if (!brief) return json({ error: "Kitobcha nima haqida ekanini yozing" }, 400);
      const words = (Array.isArray(body.words) ? body.words : []).slice(0, 40)
        .map((w: any) => `${clip(w?.t, 40)} = ${clip(w?.tr, 60)}`).filter((s: string) => s.length > 3);
      const system =
`Sen "Drop" — WordDrop'ning kitobcha dizayneri va ingliz tili o'qituvchisisan. O'quvchi darajasi: ${level}.
Vazifang: o'quvchi so'roviga ko'ra chop etiladigan kichik o'quv kitobchasi uchun TUZILGAN HUJJAT (JSON) yaratish. Dizaynni dastur o'zi chizadi — sen faqat mazmun, tuzilish va ranglarni berasan.
Kitobcha xuddi tajribali o'qituvchi tuzgandek bo'lsin: mantiqiy ketma-ketlik (tushuntirish → misol → mashq → takror), esda qolish uchun kartochkalar, qisqa qoidalar.
${BOOKLET_SCHEMA}${pro ? PRO_SCHEMA : ""}
${ICON_HINT}
${UZ}
Faqat JSON qaytar: {"doc": HUJJAT, "note_uz": "o'quvchiga 1 jumla: nima tayyorlading"}`;
      const user = `So'rov: ${brief}${words.length ? `\nO'quvchining o'z so'zlari (kerak bo'lsa ishlat): ${words.join("; ")}` : ""}`;
      const t0 = Date.now();
      const p = await groqJson(apiKey, pro ? PRO_MODELS : TEXT_MODELS, [{ role: "system", content: system }, { role: "user", content: user }], pro ? 15000 : 12000, 0.6);
      if (p instanceof Response) return p;
      let doc = cleanDoc(pickDoc(p));
      if (!doc) { console.error("[booklet] shakl:", Object.keys(p || {}).join(","), JSON.stringify(p).slice(0, 300)); return json({ error: "Kitobcha tuzilmadi, qayta urinib ko'ring" }, 502); }
      let reviewed = false;
      if (pro) doc.pro = true;
      // Ikkinchi bosqich: muharrir tekshiruvi (vaqt yetsa) — barcha kitobchalar uchun
      if (Date.now() - t0 < 75_000) {
        const r = await groqJson(apiKey, TEXT_MODELS, [{ role: "system", content: EDITOR_SYS(pro) }, { role: "user", content: JSON.stringify(doc) }], pro ? 14000 : 9000, 0.2);
        if (!(r instanceof Response)) { const d2 = cleanDoc(pickDoc(r)); if (d2 && d2.sections.length >= doc.sections.length) { doc = pro ? { ...d2, pro: true } : d2; reviewed = true; } }
      }
      const verified = await verifyWords(doc);
      const fixed = await fixTranslations(apiKey, doc);
      return json({ doc, note_uz: clip(p.note_uz, 300), reviewed, verified, fixed });
    }

    if (mode === "booklet_edit") {
      const cur = cleanDoc(body.doc);
      const instr = clip(body.instruction, 800);
      if (!cur || !instr) return json({ error: "doc va instruction kerak" }, 400);
      const system =
`Sen "Drop" — kitobcha muharririsan. Senga mavjud kitobcha hujjati (JSON) va o'quvchining ko'rsatmasi beriladi.
Ko'rsatmani aniq bajar: faqat so'ralgan narsani o'zgartir, qolganini AYNAN saqla. Rang so'ralsa theme yoki bo'lim rangini o'zgartir; "qisqartir" — matnni qisqartir; "qo'sh" — yangi blok/bo'lim qo'sh.
${BOOKLET_SCHEMA}${pro ? PRO_SCHEMA : ""}
${ICON_HINT}
${UZ}
Faqat JSON qaytar: {"doc": YANGI_TO'LIQ_HUJJAT, "note_uz": "nimani o'zgartirganing, 1 jumla"}`;
      const user = `Ko'rsatma: ${instr}\n\nJoriy hujjat:\n${JSON.stringify(cur)}`;
      const p = await groqJson(apiKey, pro ? PRO_MODELS : TEXT_MODELS, [{ role: "system", content: system }, { role: "user", content: user }], pro ? 15000 : 12000, 0.3);
      if (p instanceof Response) return p;
      const doc = cleanDoc(pickDoc(p));
      if (!doc) return json({ error: "Tahrir bajarilmadi, boshqacha yozib ko'ring" }, 502);
      if (pro || cur.pro) doc.pro = true;
      await verifyWords(doc);
      return json({ doc, note_uz: clip(p.note_uz, 300) });
    }

    return json({ error: "Noma'lum rejim: " + mode }, 400);
  } catch (e) {
    console.error("[drop-pro]", e);
    return json({ error: "Ichki xato" }, 500);
  }
});
