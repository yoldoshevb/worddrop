// Supabase Edge Function: drop-pro
// Drop AI'ning kengaytirilgan imkoniyatlari (WordDrop v94).
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
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, n).trim();

type ModelCfg = { id: string; extra: Record<string, unknown> };
const TEXT_MODELS: ModelCfg[] = [
  { id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "low" } },
  { id: "qwen/qwen3.8-27b", extra: { reasoning_effort: "none", reasoning_format: "hidden" } },
  { id: "openai/gpt-oss-20b", extra: { include_reasoning: false, reasoning_effort: "low" } },
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
            max_completion_tokens: Math.min(8000, maxTokens),
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
 "cover": { "style": "big-title" | "band" | "minimal", "badge": "ixtiyoriy qisqa yozuv, masalan '7 kun'" },
 "sections": [
   { "code": "1" (qisqa belgi: raqam yoki 1-2 harf), "title": "...", "color": "#RRGGBB (ixtiyoriy, bo'lim rangi)", "intro": "1-2 jumla",
     "blocks": [ BLOK, ... ] }
 ]
}
BLOK turlari:
 {"type":"text","text":"paragraf; **qalin** mumkin"}
 {"type":"callout","tone":"tip"|"rule"|"warn","title":"...","text":"..."}
 {"type":"list","style":"bullet"|"number"|"check","items":["..."]}
 {"type":"table","head":["..",".."],"rows":[["..",".."]]}
 {"type":"vocab","items":[{"en":"word","ipa":"/.../","uz":"tarjima","ex":"English example sentence."}]}
 {"type":"cards","title":"...","items":[{"front":"inglizcha so'z yoki savol","back":"o'zbekcha javob","hint":"ixtiyoriy"}]}
 {"type":"dialog","lines":[{"who":"A","en":"...","uz":"..."}]}
 {"type":"exercise","title":"...","kind":"fill"|"translate"|"write"|"match","items":[{"q":"savol, bo'sh joy ____ bilan","a":"to'g'ri javob"}]}
 {"type":"quiz","title":"...","items":[{"q":"...","options":["a","b","c"],"answer":0}]}
 {"type":"lines","label":"yozish uchun","n":5}
 {"type":"tracker","label":"...","days":7}
QOIDALAR:
- Kartochkalar (cards) avtomatik ravishda alohida qirqiladigan sahifalarga chiqariladi; javoblar kaliti oxirida avtomatik yasaladi.
- Inglizcha misollar tabiiy va to'g'ri; o'zbekcha izohlar qisqa.
- Ranglar: kontrasti yetarli bo'lsin (paper ochiq, ink to'q). Foydalanuvchi rang aytsa — aynan shuni ishlat.
- Hajm: foydalanuvchi aytmasa 3-5 bo'lim, har bo'limda 3-6 blok, jami 12-40 ta kartochka.
`;
const HEX = /^#[0-9a-fA-F]{6}$/;
const BLOCK_TYPES = new Set(["text", "callout", "list", "table", "vocab", "cards", "dialog", "exercise", "quiz", "lines", "tracker"]);
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
      style: ["big-title", "band", "minimal"].includes(d?.cover?.style) ? d.cover.style : "big-title",
      badge: clip(d?.cover?.badge, 24),
    },
    sections: [],
  };
  for (const s of arr(d.sections, 12)) {
    if (!s || typeof s !== "object") continue;
    const sec: any = { code: clip(s.code, 3), title: clip(s.title, 80), color: col(s.color, ""), intro: clip(s.intro, 400), blocks: [] };
    for (const b of arr(s.blocks, 16)) {
      if (!b || !BLOCK_TYPES.has(b.type)) continue;
      const t = b.type, o: any = { type: t };
      if (t === "text") o.text = clip(b.text, 1500);
      if (t === "callout") { o.tone = ["tip", "rule", "warn"].includes(b.tone) ? b.tone : "tip"; o.title = clip(b.title, 80); o.text = clip(b.text, 700); }
      if (t === "list") { o.style = ["bullet", "number", "check"].includes(b.style) ? b.style : "bullet"; o.items = arr(b.items, 14).map((x: unknown) => clip(x, 240)).filter(Boolean); }
      if (t === "table") { o.head = arr(b.head, 5).map((x: unknown) => clip(x, 40)); o.rows = arr(b.rows, 14).map((r: any) => arr(r, 5).map((x: unknown) => clip(x, 160))); }
      if (t === "vocab") o.items = arr(b.items, 30).map((x: any) => ({ en: clip(x?.en, 50), ipa: clip(x?.ipa, 40), uz: clip(x?.uz, 80), ex: clip(x?.ex, 160) })).filter((x: any) => x.en);
      if (t === "cards") { o.title = clip(b.title, 80); o.items = arr(b.items, 48).map((x: any) => ({ front: clip(x?.front, 80), back: clip(x?.back, 120), hint: clip(x?.hint, 80) })).filter((x: any) => x.front && x.back); }
      if (t === "dialog") o.lines = arr(b.lines, 16).map((x: any) => ({ who: clip(x?.who, 12), en: clip(x?.en, 200), uz: clip(x?.uz, 200) })).filter((x: any) => x.en);
      if (t === "exercise") { o.title = clip(b.title, 100); o.kind = ["fill", "translate", "write", "match"].includes(b.kind) ? b.kind : "fill"; o.items = arr(b.items, 14).map((x: any) => ({ q: clip(x?.q, 240), a: clip(x?.a, 200) })).filter((x: any) => x.q); }
      if (t === "quiz") { o.title = clip(b.title, 100); o.items = arr(b.items, 12).map((x: any) => { const opts = arr(x?.options, 4).map((y: unknown) => clip(y, 100)); const a = Number(x?.answer); return { q: clip(x?.q, 240), options: opts, answer: a >= 0 && a < opts.length ? a : 0 }; }).filter((x: any) => x.q && x.options.length >= 2); }
      if (t === "lines") { o.label = clip(b.label, 100); o.n = Math.max(1, Math.min(20, Number(b.n) || 5)); }
      if (t === "tracker") { o.label = clip(b.label, 100); o.days = Math.max(3, Math.min(31, Number(b.days) || 7)); }
      sec.blocks.push(o);
    }
    if (sec.title) out.sections.push(sec);
  }
  return out.sections.length ? out : null;
}

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
    if (mode === "booklet") {
      const brief = clip(body.brief, 1500);
      if (!brief) return json({ error: "Kitobcha nima haqida ekanini yozing" }, 400);
      const words = (Array.isArray(body.words) ? body.words : []).slice(0, 40)
        .map((w: any) => `${clip(w?.t, 40)} = ${clip(w?.tr, 60)}`).filter((s: string) => s.length > 3);
      const system =
`Sen "Drop" — WordDrop'ning kitobcha dizayneri va ingliz tili o'qituvchisisan. O'quvchi darajasi: ${level}.
Vazifang: o'quvchi so'roviga ko'ra chop etiladigan kichik o'quv kitobchasi uchun TUZILGAN HUJJAT (JSON) yaratish. Dizaynni dastur o'zi chizadi — sen faqat mazmun, tuzilish va ranglarni berasan.
Kitobcha xuddi tajribali o'qituvchi tuzgandek bo'lsin: mantiqiy ketma-ketlik (tushuntirish → misol → mashq → takror), esda qolish uchun kartochkalar, qisqa qoidalar.
${BOOKLET_SCHEMA}
${UZ}
Faqat JSON qaytar: {"doc": HUJJAT, "note_uz": "o'quvchiga 1 jumla: nima tayyorlading"}`;
      const user = `So'rov: ${brief}${words.length ? `\nO'quvchining o'z so'zlari (kerak bo'lsa ishlat): ${words.join("; ")}` : ""}`;
      const p = await groqJson(apiKey, TEXT_MODELS, [{ role: "system", content: system }, { role: "user", content: user }], 7500, 0.6);
      if (p instanceof Response) return p;
      const doc = cleanDoc(p.doc || p);
      if (!doc) return json({ error: "Kitobcha tuzilmadi, so'rovni aniqroq yozing" }, 502);
      return json({ doc, note_uz: clip(p.note_uz, 300) });
    }

    if (mode === "booklet_edit") {
      const cur = cleanDoc(body.doc);
      const instr = clip(body.instruction, 800);
      if (!cur || !instr) return json({ error: "doc va instruction kerak" }, 400);
      const system =
`Sen "Drop" — kitobcha muharririsan. Senga mavjud kitobcha hujjati (JSON) va o'quvchining ko'rsatmasi beriladi.
Ko'rsatmani aniq bajar: faqat so'ralgan narsani o'zgartir, qolganini AYNAN saqla. Rang so'ralsa theme yoki bo'lim rangini o'zgartir; "qisqartir" — matnni qisqartir; "qo'sh" — yangi blok/bo'lim qo'sh.
${BOOKLET_SCHEMA}
${UZ}
Faqat JSON qaytar: {"doc": YANGI_TO'LIQ_HUJJAT, "note_uz": "nimani o'zgartirganing, 1 jumla"}`;
      const user = `Ko'rsatma: ${instr}\n\nJoriy hujjat:\n${JSON.stringify(cur)}`;
      const p = await groqJson(apiKey, TEXT_MODELS, [{ role: "system", content: system }, { role: "user", content: user }], 7500, 0.3);
      if (p instanceof Response) return p;
      const doc = cleanDoc(p.doc || p);
      if (!doc) return json({ error: "Tahrir bajarilmadi, boshqacha yozib ko'ring" }, 502);
      return json({ doc, note_uz: clip(p.note_uz, 300) });
    }

    return json({ error: "Noma'lum rejim: " + mode }, 400);
  } catch (e) {
    console.error("[drop-pro]", e);
    return json({ error: "Ichki xato" }, 500);
  }
});
