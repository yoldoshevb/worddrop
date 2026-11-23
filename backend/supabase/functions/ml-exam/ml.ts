// WordDrop v101 — Multilevel (CEFR) sinov imtihoni: test tuzish va baholash.
// Format (O'zbekiston, Bilim va malakalarni baholash agentligi, Multilevel ingliz tili):
//   Listening — 6 qism, 35 savol (1–8, 9–14, 15–18, 19–23, 24–29, 30–35), har yozuv 2 marta.
//   Reading   — 5 qism, 35 savol, 60 daqiqa (1–6, 7–14, 15–20, 21–29, 30–35).
//   Writing   — Task 1.1 (norasmiy xat, ~50 so'z), Task 1.2 (rasmiy xat, 120–150), Part 2 (forum post, 180–200), 60 daqiqa.
//   Speaking  — Part 1.1 (3 savol, 30 s), Part 1.2 (2 rasm, 45/30/30 s), Part 2 (rasm + 3 savol, 1 daq tayyorlanish, 2 daq),
//               Part 3 (mavzu + FOR/AGAINST, 1 daq tayyorlanish, 2 daq).
//   Har bo'lim 75 ballik shkalada; daraja — to'rt bo'lim o'rtachasi: B1 38–50, B2 51–64, C1 65–75.
// Testlar originaldir (real imtihon savollari ko'chirilmaydi). Natijalar taxminiy.

type Groq = (apiKey: string, models: any[], messages: unknown[], maxTokens: number, temperature: number) => Promise<any | Response>;
type Ctx = { apiKey: string; groqJson: Groq; SB: any; json: (b: unknown, s?: number) => Response; clip: (v: unknown, n: number) => string; req: Request; body: any; deadline: number };

const GEN_MODELS = [
  { id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "low" } },
  { id: "qwen/qwen3.8-27b", extra: { reasoning_effort: "none", reasoning_format: "hidden" } },
];
const CHECK_MODELS = [
  { id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "medium" } },
];
/* Groq TPM limiti: bir vaqtda ko'pi bilan 2 ta so'rov */
let ACTIVE = 0; const WAITQ: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (ACTIVE >= 2) await new Promise<void>((r) => WAITQ.push(r));
  ACTIVE++;
  try { return await fn(); } finally { ACTIVE--; const n = WAITQ.shift(); if (n) n(); }
}
const VOICES_F = ["autumn", "diana", "hannah"], VOICES_M = ["austin", "daniel", "troy"];
const VOICES = [...VOICES_F, ...VOICES_M];

const BASE = `You are a senior item writer for the Uzbekistan national Multilevel (CEFR) English exam (levels B1, B2, C1 in one paper).
Write ORIGINAL material (never copy real past papers). British or international English, natural, accurate, culturally neutral, suitable for young adults in Uzbekistan.
Difficulty must rise through the paper: early parts B1, middle B2, last parts C1.
Every question must have exactly ONE defensible correct answer that is clearly supported by the script/text; distractors must be plausible but clearly wrong.
Audio scripts are written as segments: {"v": voice, "t": text}. Voices: female ${VOICES_F.join("/")}, male ${VOICES_M.join("/")}. Use different voices for different speakers. Keep each segment under 220 characters (split long speech into several segments with the same voice).
Return ONLY valid JSON.`;

/* ───────── Writing / Speaking ───────── */
const W_SPEC = `${BASE}
Create the WRITING paper (60 minutes) as JSON:
{
 "situation":"an input text (60-110 words): a message, email or notice the candidate received, e.g. from a club, college, company or community group, describing a change/event/problem and asking for opinions",
 "from":"who sent it (e.g. 'Green City Sports Club')",
 "friend":"first name of a friend who is also affected",
 "t11":"Task 1.1 instruction: write an informal letter/email to the friend about the situation (feelings, what should happen). Write about 50 words.",
 "t12":"Task 1.2 instruction: write a formal letter/email to the sender (the problem, how it affects you, what you suggest/request). Write 120-150 words.",
 "t2":{"intro":"Part 2 instruction: you are taking part in an online discussion/forum ... Write 180-200 words.","q":"the discussion question (C1, abstract, e.g. society, education, technology, environment)"}
}`;
const S_SPEC = `${BASE}
Create the SPEAKING test as JSON:
{
 "p11":["3 short personal questions (A1-A2): home, family, hobbies, studies, daily life"],
 "p12":{"topic":"topic of two contrasting pictures","pics":[{"q":"2-4 word photo search query","desc":"one-sentence description of the photo"},{"q":"...","desc":"..."}],
        "qs":["Q4: compare the pictures (e.g. 'What do you see in these pictures?' / 'Compare...')","Q5: opinion question linked to the pictures","Q6: opinion question"]},
 "p2":{"pic":{"q":"2-4 word photo search query","desc":"description"},"qs":["3 questions (B2): personal experience -> impact -> general/abstract factors"]},
 "p3":{"topic":"a debatable statement (C1)","for":["3 short points FOR"],"against":["3 short points AGAINST"]}
}
Photo queries must be generic and easy to find in a free photo library (e.g. 'people cycling city', 'family dinner home').`;

/* ───────── yordamchilar ───────── */
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
/* Noma'lum ovoz nomi (masalan "Speaker A") — hammasi bitta ovozga tushmasin: nomdan barqaror ovoz tanlaymiz */
function voiceOf(raw: unknown) {
  const n = String(raw ?? "").trim();
  if (VOICES.includes(n)) return n;
  let h = 0; for (const ch of n.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return n ? VOICES[h % VOICES.length] : "hannah";
}
function segs(v: unknown, clip: Ctx["clip"]) {
  // v101e: 400 belgida gap o'rtasidan kesilib qolardi — 900 gacha ruxsat
  return arr(v).map((x: any) => ({ v: voiceOf(x?.v), t: clip(x?.t, 900) })).filter((x) => x.t);
}
/* v101e: avvalgi testlarda ishlatilgan mavzular — AI ularni takrorlamasin */
function usedTopics(c: Ctx): Promise<string> {
  const k = c as any;   // har so'rov uchun bir marta (ishchi nusxa so'rovlar orasida qayta ishlatiladi)
  return k._used ??= (async () => {
    try {
      const { data } = await c.SB.from("wd_ml_tests").select("listening,reading,writing,speaking").order("created_at", { ascending: false }).limit(25);
      const out = new Set<string>();
      for (const t of data ?? []) {
        const L = t.listening ?? {}, R = t.reading ?? {}, W = t.writing ?? {}, S = t.speaking ?? {};
        [L.p4?.title, L.p2?.title, L.p3?.intro, L.p6?.intro, ...(arr(L.p5).map((e: any) => e?.intro)), R.p1?.title, R.p2?.theme, R.p3?.title, R.p4?.title, R.p5?.title,
          W.from, W.t2?.q, S.p12?.topic, S.p3?.topic].forEach((x) => { const v = String(x ?? "").replace(/\s+/g, " ").trim().slice(0, 110); if (v) out.add(v); });
      }
      return [...out].slice(0, 120).join(" | ");
    } catch { return ""; }
  })();
}
async function baseFor(c: Ctx) {
  const u = await usedTopics(c);
  return u ? `${BASE}\nThese topics, places, titles and themes were ALREADY USED in earlier tests — choose clearly DIFFERENT ones (different place names, subjects and settings): ${u}` : BASE;
}
const words = (s: string) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/* Part 4 xaritasi: 4×3 to'r, 3 ta belgilangan joy, 8 ta harf (A–H); 5 ta joy har biri belgilangan joy bilan qo'shni */
function buildMap(landmarks: string[], places: string[]) {
  const COLS = 4, ROWS = 3;
  for (let attempt = 0; attempt < 400; attempt++) {
    const cells = [...Array(COLS * ROWS).keys()].sort(() => Math.random() - 0.5);
    const lm = cells.slice(0, 3); const rest = cells.slice(3);
    const free = rest.slice(0, 8).sort((a, b) => a - b); // A–H chapdan o'ngga, yuqoridan pastga
    const rc = (i: number) => [Math.floor(i / COLS), i % COLS];
    const rel = (c: number) => {
      const [r, cc] = rc(c); const out: string[] = [];
      lm.forEach((l, k) => {
        const [lr, lc] = rc(l);
        if (lr === r && lc === cc - 1) out.push(`immediately to the right (east) of the ${landmarks[k]}`);
        if (lr === r && lc === cc + 1) out.push(`immediately to the left (west) of the ${landmarks[k]}`);
        if (lc === cc && lr === r - 1) out.push(`directly below (south of) the ${landmarks[k]}`);
        if (lc === cc && lr === r + 1) out.push(`directly above (north of) the ${landmarks[k]}`);
      });
      return out;
    };
    const cand = free.filter((c) => rel(c).length > 0);
    if (cand.length < 5) continue;
    const targets = cand.sort(() => Math.random() - 0.5).slice(0, 5);
    const letters = "ABCDEFGH";
    return {
      cols: COLS, rows: ROWS,
      landmarks: lm.map((c, k) => ({ cell: c, name: landmarks[k] })),
      letters: free.map((c, i) => ({ cell: c, l: letters[i] })),
      items: targets.map((c, i) => ({ name: places[i], cell: c, a: letters[free.indexOf(c)], how: rel(c)[0] })),
    };
  }
  return null;
}

async function adminUser(c: Ctx) {
  const tok = (c.req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!tok || tok.startsWith("sb_")) return null;
  const { data } = await c.SB.auth.getUser(tok); const u = data?.user; if (!u) return null;
  const { data: kv } = await c.SB.from("wd_tg_kv").select("val").eq("key", "admins").maybeSingle();
  const list: string[] = Array.isArray(kv?.val) ? kv.val : [];
  const isAdmin = !!u.email && list.map((x) => x.toLowerCase()).includes(String(u.email).toLowerCase());
  return { user: u, isAdmin };
}

/* Mustaqil yechuvchi: kalit bilan mos kelmagan savollarni qaytaradi */
async function solveCheck(c: Ctx, kind: string, content: string, n: number): Promise<number[] | null> {
  const r = await c.groqJson(c.apiKey, CHECK_MODELS, [{ role: "system", content:
`You are an expert candidate taking a Multilevel ${kind} test. Answer every question using ONLY the given script/text.
Return JSON {"ans":[...]} with exactly ${n} answers in question order. For multiple choice give the option index (0-based). For gaps give the word. For True/False/No Information give "T","F" or "NI".` },
    { role: "user", content }], 8000, 0.1);
  if (r instanceof Response || !Array.isArray(r?.ans)) return null;
  return r.ans;
}


/* Reading Part 1: muallif to'liq matn beradi; 6 ta takrorlangan so'zning bittasini (birinchisidan keyingisini) bo'sh joyga aylantiramiz */
function makeGaps(title: string, text: string, rep: string[]) {
  const toks = text.split(/(\b)/);
  const pos: { w: string; i: number }[] = [];
  const low = (x: string) => x.toLowerCase();
  const seen = new Set<string>();
  for (const w of rep) {
    const lw = low(w); if (!/^[a-z]{3,}$/i.test(w) || seen.has(lw)) continue;
    const idx = toks.map((t, i) => (low(t) === lw ? i : -1)).filter((i) => i >= 0);
    if (idx.length < 2) continue;
    seen.add(lw); pos.push({ w: toks[idx[idx.length - 1]], i: idx[idx.length - 1] });   // oxirgisini bo'shatamiz, oldingisi matnda qoladi
  }
  if (pos.length < 6) return { err: `need 6 words that appear at least twice in the text (found ${pos.length}); repeat more of the listed words` } as any;
  const chosen = pos.sort(() => Math.random() - 0.5).slice(0, 6).sort((a, b) => a.i - b.i);
  const a: string[] = [];
  chosen.forEach((c, k) => { toks[c.i] = `[${k + 1}]`; a.push(c.w.toLowerCase()); });
  const out = toks.join("");
  const rest = " " + norm(out.replace(/\[[1-6]\]/g, " ")) + " ";
  if (a.some((w) => !rest.includes(" " + norm(w) + " "))) return { err: "gap check failed" } as any;
  return { title, text: out, a };
}

/* ═════════ Test tuzish: har qism alohida, o'z tekshiruvi va 3 tagacha qayta urinish bilan ═════════ */
async function part<T>(c: Ctx, spec: string, maxTok: number, build: (p: any) => T, check: (x: T) => string): Promise<T | string> {
  let why = String(c.body?.why || "").slice(0, 300);   // ilova oldingi urinishning sababini qaytarib yuborishi mumkin
  for (let i = 0; i < 3; i++) {
    if (i > 0 && c.deadline - Date.now() < 50_000) break;   // yana bir urinishga vaqt yetmaydi — ilova qayta chaqiradi
    const base = await baseFor(c);
    const p = await slot(() => c.groqJson(c.apiKey, GEN_MODELS, [{ role: "system", content: `${base}\n${spec}` }, { role: "user", content: `Original content please. ${why ? "Previous attempt was rejected: " + why + ". Fix it." : ""} Seed ${crypto.randomUUID().slice(0, 8)}` }], maxTok + 1200, 0.8));
    if (p instanceof Response) { why = "invalid JSON"; continue; }
    const x = build(p); why = check(x);
    if (!why) return x;
  }
  return why || "failed";
}
const sw = (s: any[]) => words(s.map((x) => x.t).join(" "));
/* "ONE word and/or a number": bitta so'z, yoki raqam, yoki so'z + raqam (masalan "12 May", "Room 5") */
const oneWord = (a: string) => { const w = String(a || "").trim().split(/\s+/).filter(Boolean); if (!w.length || w.length > 2) return false; if (/-[A-Za-z]-|^[A-Z](-[A-Z])+$/.test(a)) return false; return w.length === 1 || w.some((x) => /\d/.test(x)); };
const inScript = (s: any[], a: string) => { const t = " " + norm(s.map((x) => x.t).join(" ")) + " "; return !!norm(a) && t.includes(" " + norm(a) + " "); };

async function listeningPart(c: Ctx, id: string): Promise<any> {
  const C = c.clip;
  const mcq3 = (q: any) => ({ q: C(q?.q, 200), o: arr(q?.o).slice(0, 3).map((y) => C(y, 140)), a: Math.max(0, Math.min(2, Number(q?.a) || 0)) });
  void mcq3;
  if (id === "p4") {
    const n4: any = await listeningPart(c, "p4n"); if (typeof n4 === "string") return n4;
  const map = buildMap(n4.lms, n4.pls); if (!map) return "map failed";
  const t4 = await part(c, `Write a natural spoken talk (180-240 words) by a guide/organiser describing where things are at "${n4.title}" (${n4.setting}).
The map has these labelled landmarks: ${n4.lms.join(", ")}. Mention the places in the given order and describe each location using EXACTLY the given relation (rephrase naturally, e.g. 'just to the right of', 'directly north of', but do not change the meaning). Do not mention map letters or extra relations.
Places:
${map.items.map((x, i) => `${i + 1}. ${x.name}: ${x.how}`).join("\n")}
JSON: {"s":[{"v":"${n4.gv}","t":"..."}]}`, 2500, (p) => segs(p.s, C), (x) => sw(x) < 120 ? "talk too short" : map.items.filter((it) => !norm(x.map((y: any) => y.t).join(" ")).includes(norm(it.name))).map((it) => `place "${it.name}" not mentioned`).join("; "));
  if (typeof t4 === "string") return t4;
  return { title: n4.title, intro: `You will hear a talk about ${n4.title}. Label the map with the correct letter (A–H). There are THREE extra letters.`, s: t4, map };

  }
  switch (id) {
    case "p1": return await (
    part(c, `LISTENING PART 1 (Q1-8, B1). The candidate hears a sentence and chooses the most natural REPLY.
JSON: {"items":[ exactly 8 objects {"s":[{"v":voice,"t":"one short spoken sentence/question from everyday life"}],"o":["reply","reply","reply"],"a":index 0-2} ]}
Exactly ONE reply is appropriate. The two wrong replies are grammatical but clearly inappropriate (they answer a different question, use the wrong function or tense, or misunderstand a key word) — never merely a less detailed but still acceptable answer. Vary the correct index.`, 3000,
      (p) => arr(p.items).slice(0, 8).map((x: any) => ({ s: segs(x?.s, C), o: arr(x?.o).slice(0, 3).map((y) => C(y, 140)), a: Math.max(0, Math.min(2, Number(x?.a) || 0)) })),
      (x) => x.length !== 8 ? `need 8 items, got ${x.length}` : x.some((y: any) => y.o.length !== 3 || !y.s.length) ? "each item needs s and 3 options" : "")
    );
    case "p2": return await (
    part(c, `LISTENING PART 2 (Q9-14, B1): form / notes completion.
JSON: {"intro":"You will hear ... (one sentence)","title":"title of the notes/form","s":[segments: ONE speaker's monologue of 230-300 words (announcement, radio information, guide talk)],
"lines":[ exactly 6 objects {"pre":"label or words before the gap","post":"words after the gap or empty","a":"ONE word or a number"} ]}
Each answer is ONE word or a number (e.g. 'Tuesday', '45', '12 May') — never a phrase. It must be spoken EXACTLY in the monologue; answers in the order heard. If an answer is a name, the speaker says it and then spells it, but the answer is the normal word (e.g. 'Karimov').`, 4000,
      (p) => ({ intro: C(p.intro, 200), title: C(p.title, 80), s: segs(p.s, C), lines: arr(p.lines).slice(0, 6).map((x: any) => ({ pre: C(x?.pre, 120), post: C(x?.post, 120), a: C(x?.a, 30) })) }),
      (x) => x.lines.length !== 6 ? `need 6 lines, got ${x.lines.length}` : x.lines.filter((l: any) => !oneWord(l.a)).length ? `answers must be ONE word or a number (no phrases, no spelled letters): ${x.lines.filter((l: any) => !oneWord(l.a)).map((l: any) => l.a).join(", ")}` : sw(x.s) < 170 ? `monologue too short (${sw(x.s)} words)` : x.lines.filter((l: any) => !inScript(x.s, l.a)).map((l: any) => `answer "${l.a}" is not spoken in the monologue`).join("; "))
    );
    case "p3": return await (
    part(c, `LISTENING PART 3 (Q15-18, B2): four short monologues on one theme.
JSON: {"intro":"You will hear four people talking about ... For each speaker choose ... (A-F). There are TWO extra options.","opts":[exactly 6 short options],
"sp":[ exactly 4 objects {"s":[segments, ONE speaker, 60-90 words],"a":index 0-5} ]}
All four answers must be different. Speakers paraphrase; avoid repeating the option words. Use a different voice for each speaker.`, 3500,
      (p) => ({ intro: C(p.intro, 240), opts: arr(p.opts).slice(0, 6).map((y) => C(y, 100)), sp: arr(p.sp).slice(0, 4).map((x: any) => ({ s: segs(x?.s, C), a: Math.max(0, Math.min(5, Number(x?.a) || 0)) })) }),
      (x) => x.opts.length !== 6 ? "need 6 options" : x.sp.length !== 4 ? "need 4 speakers" : new Set(x.sp.map((y: any) => y.a)).size !== 4 ? "answers must all be different" : "")
    );
    case "p4n": return await (
    part(c, `LISTENING PART 4 (Q19-23, B2): map labelling. Give only names now.
JSON: {"title":"name of the place, e.g. Riverside Park","setting":"what kind of place","landmarks":[exactly 3 short names already labelled on the map],"places":[exactly 5 short names the candidate must find],"guide_voice":voice}`, 800,
      (p) => ({ title: C(p.title, 60), setting: C(p.setting, 80), lms: arr(p.landmarks).slice(0, 3).map((y) => C(y, 30)), pls: arr(p.places).slice(0, 5).map((y) => C(y, 30)), gv: VOICES.includes(String(p.guide_voice)) ? String(p.guide_voice) : "daniel" }),
      (x) => x.lms.length !== 3 || x.pls.length !== 5 ? "need 3 landmarks and 5 places" : "")
    );
    case "p5": return await (
    part(c, `LISTENING PART 5 (Q24-29, B2-C1): three extracts.
JSON: {"ex":[ exactly 3 objects {"intro":"Extract One. You will hear ...","s":[segments: dialogue (two voices) or monologue, 120-170 words],"qs":[ exactly 2 objects {"q":"question about attitude, opinion, purpose, gist or inference","o":["A","B","C"],"a":0-2} ]} ]}`, 4500,
      (p) => arr(p.ex).slice(0, 3).map((x: any) => ({ intro: C(x?.intro, 200), s: segs(x?.s, C), qs: arr(x?.qs).slice(0, 2).map(mcq3) })),
      (x) => x.length !== 3 ? "need 3 extracts" : x.some((e: any) => e.qs.length !== 2 || e.qs.some((q: any) => q.o.length !== 3) || sw(e.s) < 80) ? "each extract needs a script and 2 questions with 3 options" : "")
    );
    case "p6": return await (
    part(c, `LISTENING PART 6 (Q30-35, C1): lecture, sentence completion.
JSON: {"intro":"You will hear a lecture about ...","s":[segments: ONE speaker, 380-460 words, academic or semi-academic],
"lines":[ exactly 6 objects {"pre":"sentence start","post":"sentence end","a":"ONE word"} ]}
The sentences paraphrase the lecture, but each missing word is spoken EXACTLY in the lecture. Answers in the order heard.`, 5000,
      (p) => ({ intro: C(p.intro, 200), s: segs(p.s, C), lines: arr(p.lines).slice(0, 6).map((x: any) => ({ pre: C(x?.pre, 200), post: C(x?.post, 200), a: C(x?.a, 30) })) }),
      (x) => x.lines.length !== 6 ? "need 6 lines" : x.lines.some((l: any) => words(l.a) !== 1) ? "each answer must be exactly ONE word" : sw(x.s) < 300 ? `lecture too short (${sw(x.s)} words)` : x.lines.filter((l: any) => !inScript(x.s, l.a)).map((l: any) => `answer "${l.a}" is not spoken in the lecture`).join("; "))
    );
  }
  return "unknown part";
}
async function checkListening(c: Ctx, L: any) {
  const txt = (s: any[]) => s.map((x) => x.t).join(" ");
  const content = [
    ...L.p1.map((x: any, i: number) => `Q${i + 1}. Heard: "${txt(x.s)}" Replies: ${x.o.map((o: string, k: number) => `${k}) ${o}`).join(" ")}`),
    `Part 3 options: ${L.p3.opts.map((o: string, k: number) => `${k}) ${o}`).join("; ")}`,
    ...L.p3.sp.map((x: any, i: number) => `Q${15 + i}. Speaker ${i + 1}: ${txt(x.s)}`),
    ...L.p5.flatMap((e: any, ei: number) => [`Extract ${ei + 1}: ${txt(e.s)}`, ...e.qs.map((q: any, k: number) => `Q${24 + ei * 2 + k}. ${q.q} ${q.o.map((o: string, j: number) => `${j}) ${o}`).join(" ")}`)]),
  ].join("\n");
  const keys = [...L.p1.map((x: any) => x.a), ...L.p3.sp.map((x: any) => x.a), ...L.p5.flatMap((e: any) => e.qs.map((q: any) => q.a))];
  const got = await solveCheck(c, "Listening (Parts 1, 3, 5)", content, keys.length);
  const qn = [1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29];
  const mism = got ? keys.map((k, i) => (Number(got[i]) === k ? 0 : qn[i])).filter(Boolean) : [];
  return { solved: !!got, mism };
}

async function readingPart(c: Ctx, id: string): Promise<any> {
  const C = c.clip;
  const mcq4 = (q: any) => ({ q: C(q?.q, 240), o: arr(q?.o).slice(0, 4).map((y) => C(y, 200)), a: Math.max(0, Math.min(3, Number(q?.a) || 0)) });
  switch (id) {
    case "p1": return await (
    part(c, `READING PART 1 (Q1-6, B1): gap-fill text. Write the COMPLETE text (no gaps) — the program will remove words itself.
JSON: {"title":"short title","text":"a B1 text of 160-200 words on an everyday topic","rep":[8 different content words (nouns, verbs or adjectives, 3+ letters) that each appear AT LEAST TWICE in the text in exactly the same form]}`, 2000,
      (p) => makeGaps(C(p.title, 80), C(p.text, 2000), arr(p.rep).map((y) => C(y, 30))),
      (x: any) => x.err || "")
    );
    case "p2": return await (
    part(c, `READING PART 2 (Q7-14, B1-B2): matching.
JSON: {"theme":"common theme","texts":[exactly 8 short texts (adverts, notices, messages, course descriptions), 35-60 words each],"opts":[exactly 10 statements describing what a reader wants or needs],"a":[exactly 8 indices 0-9, the statement for each text, all different]}
Two statements are extra. Use paraphrase, not word matching.`, 3500,
      (p) => ({ theme: C(p.theme, 100), texts: arr(p.texts).slice(0, 8).map((y) => C(y, 500)), opts: arr(p.opts).slice(0, 10).map((y) => C(y, 200)), a: arr(p.a).slice(0, 8).map((y) => Number(y)) }),
      (x) => x.texts.length !== 8 || x.opts.length !== 10 || x.a.length !== 8 ? `need 8 texts, 10 statements, 8 answers (got ${x.texts.length}/${x.opts.length}/${x.a.length})` : new Set(x.a).size !== 8 || x.a.some((y: number) => !(y >= 0 && y <= 9)) ? "answers must be 8 different indices 0-9" : "")
    );
    case "p3": return await (
    part(c, `READING PART 3 (Q15-20, B2): headings.
JSON: {"title":"title","paras":[exactly 6 paragraphs, 60-90 words each],"heads":[exactly 8 headings],"a":[exactly 6 indices 0-7, the heading for each paragraph, all different]}
Two headings are extra and must be tempting but wrong.`, 3500,
      (p) => ({ title: C(p.title, 100), paras: arr(p.paras).slice(0, 6).map((y) => C(y, 900)), heads: arr(p.heads).slice(0, 8).map((y) => C(y, 120)), a: arr(p.a).slice(0, 6).map((y) => Number(y)) }),
      (x) => x.paras.length !== 6 || x.heads.length !== 8 || x.a.length !== 6 ? `need 6 paragraphs, 8 headings, 6 answers (got ${x.paras.length}/${x.heads.length}/${x.a.length})` : new Set(x.a).size !== 6 || x.a.some((y: number) => !(y >= 0 && y <= 7)) ? "answers must be 6 different indices 0-7" : "")
    );
    case "p4": return await (
    part(c, `READING PART 4 (Q21-29, B2-C1).
JSON: {"title":"title","paras":[5-7 paragraphs, total 550-700 words: a story, biography or feature article],
"mcq":[exactly 4 objects {"q":"question","o":["A","B","C","D"],"a":0-3}],"tfn":[exactly 5 objects {"s":"statement","a":"T"|"F"|"NI"}]}
MCQ in text order. True/False/No Information: at least one of each; NI = the text does not say.`, 5000,
      (p) => ({ title: C(p.title, 100), paras: arr(p.paras).slice(0, 8).map((y) => C(y, 1400)), mcq: arr(p.mcq).slice(0, 4).map(mcq4), tfn: arr(p.tfn).slice(0, 5).map((x: any) => ({ s: C(x?.s, 240), a: ["T", "F", "NI"].includes(String(x?.a).toUpperCase()) ? String(x.a).toUpperCase() : "NI" })) }),
      (x) => x.mcq.length !== 4 || x.tfn.length !== 5 ? "need 4 mcq and 5 tfn" : x.mcq.some((q: any) => q.o.length !== 4) ? "mcq need 4 options" : words(x.paras.join(" ")) < 420 ? `text too short (${words(x.paras.join(" "))} words)` : new Set(x.tfn.map((y: any) => y.a)).size < 3 ? "tfn needs at least one T, one F and one NI" : "")
    );
    case "p5": return await (
    part(c, `READING PART 5 (Q30-35, C1): academic text.
JSON: {"title":"title","paras":[5-7 paragraphs, total 550-700 words],"summary":"a summary of the text (70-110 words) with gaps [30] [31] [32] [33]","sa":[exactly 4 answers, NO MORE THAN ONE WORD and/or a number, copied exactly from the text],
"mcq":[exactly 2 objects {"q":"question (e.g. writer's purpose, inference)","o":["A","B","C","D"],"a":0-3}]}`, 5000,
      (p) => ({ title: C(p.title, 100), paras: arr(p.paras).slice(0, 8).map((y) => C(y, 1400)), summary: C(p.summary, 1200), sa: arr(p.sa).slice(0, 4).map((y) => C(y, 30)), mcq: arr(p.mcq).slice(0, 2).map(mcq4) }),
      (x) => { const g = (x.summary.match(/\[3[0-3]\]/g) || []).length; if (g !== 4 || x.sa.length !== 4) return `need gaps [30]-[33] and 4 answers (got ${g}/${x.sa.length})`;
        if (x.mcq.length !== 2 || x.mcq.some((q: any) => q.o.length !== 4)) return "need 2 mcq with 4 options"; if (words(x.paras.join(" ")) < 420) return "text too short";
        const body = " " + norm(x.paras.join(" ")) + " "; const m = x.sa.filter((w: string) => !body.includes(" " + norm(w) + " ")); return m.length ? `summary answers ${m.join(", ")} not found in the text` : ""; })
    );
  }
  return "unknown part";
}
async function checkReading(c: Ctx, R: any) {
  const content = [
    `PART 2 statements: ${R.p2.opts.map((o: string, k: number) => `${k}) ${o}`).join(" | ")}`,
    ...R.p2.texts.map((t: string, i: number) => `Q${7 + i}. Text: ${t} -> which statement index?`),
    `PART 3 headings: ${R.p3.heads.map((h: string, k: number) => `${k}) ${h}`).join(" | ")}`,
    ...R.p3.paras.map((t: string, i: number) => `Q${15 + i}. Paragraph: ${t} -> heading index?`),
    `PART 4 text: ${R.p4.paras.join("\n")}`,
    ...R.p4.mcq.map((q: any, i: number) => `Q${21 + i}. ${q.q} ${q.o.map((o: string, k: number) => `${k}) ${o}`).join(" ")}`),
    ...R.p4.tfn.map((x: any, i: number) => `Q${25 + i}. T/F/NI: ${x.s}`),
  ].join("\n");
  const keys = [...R.p2.a, ...R.p3.a, ...R.p4.mcq.map((q: any) => q.a), ...R.p4.tfn.map((x: any) => x.a)];
  const got = await solveCheck(c, "Reading (Parts 2, 3, 4)", content, keys.length);
  const mism = got ? keys.map((k, i) => (String(got[i]).toUpperCase() === String(k) ? 0 : 7 + i)).filter(Boolean) : [];
  return { solved: !!got, mism };
}

async function genWriting(c: Ctx) {
  const used = await usedTopics(c);
  const p = await c.groqJson(c.apiKey, GEN_MODELS, [{ role: "system", content: W_SPEC + (used ? `\nALREADY USED in earlier tests — choose a different situation, sender and Part 2 question: ${used}` : "") }, { role: "user", content: `Seed ${crypto.randomUUID().slice(0, 8)}` }], 3000, 0.9);
  if (p instanceof Response) return p;
  const C = c.clip;
  const W = { situation: C(p.situation, 900), from: C(p.from, 80), friend: C(p.friend, 30) || "Aziz", t11: C(p.t11, 400), t12: C(p.t12, 400), t2: { intro: C(p.t2?.intro, 400), q: C(p.t2?.q, 400) } };
  if (!W.situation || !W.t11 || !W.t12 || !W.t2.q) return c.json({ error: "Writing to'liq tuzilmadi" }, 502);
  return { W };
}
async function genSpeaking(c: Ctx) {
  const used = await usedTopics(c);
  const p = await c.groqJson(c.apiKey, GEN_MODELS, [{ role: "system", content: S_SPEC + (used ? `\nALREADY USED in earlier tests — choose different picture topics, questions and a different Part 3 debate statement: ${used}` : "") }, { role: "user", content: `Seed ${crypto.randomUUID().slice(0, 8)}` }], 3000, 0.9);
  if (p instanceof Response) return p;
  const C = c.clip;
  const pic = (x: any) => ({ q: C(x?.q, 60), desc: C(x?.desc, 200) });
  const S = {
    p11: arr(p.p11).slice(0, 3).map((y) => C(y, 200)),
    p12: { topic: C(p.p12?.topic, 120), pics: arr(p.p12?.pics).slice(0, 2).map(pic), qs: arr(p.p12?.qs).slice(0, 3).map((y) => C(y, 200)) },
    p2: { pic: pic(p.p2?.pic), qs: arr(p.p2?.qs).slice(0, 3).map((y) => C(y, 200)) },
    p3: { topic: C(p.p3?.topic, 200), for: arr(p.p3?.for).slice(0, 3).map((y) => C(y, 160)), against: arr(p.p3?.against).slice(0, 3).map((y) => C(y, 160)) },
  };
  if (S.p11.length !== 3 || S.p12.pics.length !== 2 || S.p12.qs.length !== 3 || S.p2.qs.length !== 3 || S.p3.for.length < 3 || S.p3.against.length < 3) return c.json({ error: "Speaking to'liq tuzilmadi" }, 502);
  return { S };
}

/* ═════════ Baholash ═════════ */
// 36 ballik ekspert balini 75 ballik shkalaga o'tkazish (agentlik jadvalidagi tayanch nuqtalar asosida chiziqli interpolyatsiya)
const W75: [number, number][] = [[0, 0], [10.1, 30], [14.1, 38], [17.1, 44], [20.6, 51], [25.1, 60], [28.1, 65], [35.1, 75], [36, 75]];
function to75(x: number) { for (let i = 1; i < W75.length; i++) { const [a, b] = W75[i - 1], [c2, d] = W75[i]; if (x <= c2) return Math.round(b + (d - b) * ((x - a) / (c2 - a || 1))); } return 75; }
export const level75 = (s: number) => (s >= 65 ? "C1" : s >= 51 ? "B2" : s >= 38 ? "B1" : "B1 dan past");

const W_RUBRIC = `You are a trained Multilevel (CEFR) writing examiner in Uzbekistan. Score fairly: do not cap strong answers, do not inflate weak ones.
Task 1.1 (B1 target, informal ~50 words), Task 1.2 (B2 target, formal 120-150 words), Part 2 (C1 target, forum post 180-200 words).
For EACH task give 0-6 for four criteria: task (task achievement, all points, word count, register), org (organisation, cohesion, paragraphing), lex (vocabulary range/accuracy), gram (grammar range/accuracy).
  6 = clearly above the target level, 5 = fully at target level, 4 = mostly at target level with minor problems, 3 = one level below target, 2 = two levels below, 1 = minimal, 0 = no answer/off-topic/memorised.
Penalise wrong register, missing points, word count far outside the range, copied input text. Under-length answers lose task points.
Feedback in Uzbek (standard literary Uzbek, Latin script, o' g'), concrete and kind. Corrections: real mistakes only, from the candidate's text.
Return JSON:
{"tasks":[{"id":"1.1"|"1.2"|"2","task":0-6,"org":0-6,"lex":0-6,"gram":0-6,"words":n,"good_uz":"what was good","fix_uz":"most important improvement","corr":[{"wrong":"...","right":"...","uz":"why"}],"model":"a short model answer at target level"}],"summary_uz":"2 sentences"}`;

const S_RUBRIC = `You are a trained Multilevel (CEFR) speaking examiner in Uzbekistan. You receive automatic transcripts (with timing/fluency data) of a candidate's answers.
Parts: 1.1 personal questions (A1-A2 target), 1.2 picture comparison + opinions (B1), 2 picture + experience/abstract questions (B2, 2 minutes), 3 balanced argument with for/against (C1, 2 minutes).
For EACH part give 0-6 for: flu (fluency & coherence, uses the timing data), lex (vocabulary), gram (grammar), task (relevance, development, length). Pronunciation cannot be judged from text — do not penalise it, but if the transcript is garbled note possible pronunciation issues.
  6 = clearly above the part's target level, 5 = at target, 4 = mostly at target, 3 = one level below, 2 = two levels below, 1 = minimal, 0 = no answer.
Very short or empty answers score low on task and fluency. Be fair and do not cap good performance.
Feedback in Uzbek (standard literary Uzbek, Latin script), concrete and kind.
Return JSON:
{"parts":[{"id":"1.1"|"1.2"|"2"|"3","flu":0-6,"lex":0-6,"gram":0-6,"task":0-6,"good_uz":"...","fix_uz":"...","corr":[{"wrong":"...","right":"...","uz":"..."}],"better":"one improved sample sentence or short answer"}],"summary_uz":"2 sentences"}`;

const clamp6 = (v: unknown) => Math.max(0, Math.min(6, Math.round(Number(v) || 0)));

async function scoreWriting(c: Ctx) {
  const t = c.body.test ?? {}, a = c.body.answers ?? {};
  const C = c.clip;
  const user = `INPUT (${C(t.from, 80)}): ${C(t.situation, 900)}
Task 1.1: ${C(t.t11, 400)}
Candidate (${words(a.t11)} words): """${C(a.t11, 1500)}"""
Task 1.2: ${C(t.t12, 400)}
Candidate (${words(a.t12)} words): """${C(a.t12, 3000)}"""
Part 2: ${C(t.t2?.intro, 400)} Question: ${C(t.t2?.q, 400)}
Candidate (${words(a.t2)} words): """${C(a.t2, 4000)}"""`;
  const r = await c.groqJson(c.apiKey, CHECK_MODELS, [{ role: "system", content: W_RUBRIC }, { role: "user", content: user }], 6000, 0.2);
  if (r instanceof Response) return r;
  const W = { "1.1": 6, "1.2": 12, "2": 18 } as Record<string, number>; // 36 ball: 1.1 — 6, 1.2 — 12, Part 2 — 18
  let expert = 0;
  const tasks = arr(r.tasks).slice(0, 3).map((x: any) => {
    const id = ["1.1", "1.2", "2"].includes(String(x?.id)) ? String(x.id) : "2";
    const k = { task: clamp6(x?.task), org: clamp6(x?.org), lex: clamp6(x?.lex), gram: clamp6(x?.gram) };
    const txt = id === "1.1" ? a.t11 : id === "1.2" ? a.t12 : a.t2;
    if (!String(txt || "").trim()) { k.task = k.org = k.lex = k.gram = 0; }
    const pts = ((k.task + k.org + k.lex + k.gram) / 24) * W[id]; expert += pts;
    return { id, ...k, pts: Math.round(pts * 10) / 10, max: W[id], words: words(txt), good_uz: C(x?.good_uz, 400), fix_uz: C(x?.fix_uz, 400),
      corr: arr(x?.corr).slice(0, 6).map((y: any) => ({ wrong: C(y?.wrong, 200), right: C(y?.right, 200), uz: C(y?.uz, 200) })).filter((y: any) => y.wrong && y.right), model: C(x?.model, 1600) };
  });
  const score = to75(expert);
  return c.json({ expert: Math.round(expert * 10) / 10, score, level: level75(score), tasks, summary_uz: C(r.summary_uz, 500) });
}

async function scoreSpeaking(c: Ctx) {
  const items = arr(c.body.items).slice(0, 12); const C = c.clip;
  const parts: Record<string, string[]> = {};
  for (const it of items) {
    const id = String(it?.part || ""); if (!["1.1", "1.2", "2", "3"].includes(id)) continue;
    const w = words(it?.text), sec = Math.max(1, Number(it?.sec) || 1);
    (parts[id] ||= []).push(`Q: ${C(it?.q, 300)}\nSpoken ${Math.round(sec)} s (limit ${Number(it?.limit) || 0} s), ${w} words, ${Math.round((w / sec) * 60)} words/min, long pauses: ${Number(it?.pauses) || 0}\nTranscript: """${C(it?.text, 2500)}"""`);
  }
  const user = Object.entries(parts).map(([k, v]) => `PART ${k}\n${v.join("\n\n")}`).join("\n\n---\n\n");
  if (!user) return c.json({ error: "Javoblar yo'q" }, 400);
  const r = await c.groqJson(c.apiKey, CHECK_MODELS, [{ role: "system", content: S_RUBRIC }, { role: "user", content: user }], 5000, 0.2);
  if (r instanceof Response) return r;
  const Wt = { "1.1": 6, "1.2": 8, "2": 10, "3": 12 } as Record<string, number>; // jami 36
  let expert = 0;
  const out = ["1.1", "1.2", "2", "3"].map((id) => {
    const x = arr(r.parts).find((y: any) => String(y?.id) === id) ?? {};
    const k = { flu: clamp6(x?.flu), lex: clamp6(x?.lex), gram: clamp6(x?.gram), task: clamp6(x?.task) };
    if (!parts[id]) { k.flu = k.lex = k.gram = k.task = 0; }
    const pts = ((k.flu + k.lex + k.gram + k.task) / 24) * Wt[id]; expert += pts;
    return { id, ...k, pts: Math.round(pts * 10) / 10, max: Wt[id], good_uz: C(x?.good_uz, 400), fix_uz: C(x?.fix_uz, 400),
      corr: arr(x?.corr).slice(0, 5).map((y: any) => ({ wrong: C(y?.wrong, 200), right: C(y?.right, 200), uz: C(y?.uz, 200) })).filter((y: any) => y.wrong && y.right), better: C(x?.better, 600) };
  });
  const score = to75(expert);
  return c.json({ expert: Math.round(expert * 10) / 10, score, level: level75(score), parts: out, summary_uz: C(r.summary_uz, 500) });
}

/* v105 ruxsat: admin/Pro — cheksiz va to'liq; bepul hisob — bitta urinish (wd_ml_free), cheklangan natija.
   Mantiq bazada: wd_ml_access, wd_ml_claim, wd_ml_gate, wd_ml_mark. */
async function canScore(c: Ctx, kind: string) {
  const au = await adminUser(c); if (!au) return { ok: false, msg: "Avval WordDrop hisobingizga kiring" };
  const { data, error } = await c.SB.rpc("wd_ml_gate", { uid: au.user.id, kind });
  if (error || !data) return { ok: false, msg: "Ruxsat tekshirilmadi, qayta urinib ko'ring" };
  return { ...data, uid: au.user.id };
}
/* Bepul urinish: faqat ball, daraja va qisqa xulosa — mezonlar, tuzatishlar va namunalar Pro'da */
async function limitResp(r: Response, kind: string): Promise<Response> {
  const j: any = await r.clone().json().catch(() => null);
  if (!j || j.error) return r;
  const list = (j.tasks || j.parts || []).map((x: any) => ({ id: x.id, pts: x.pts, max: x.max, words: x.words }));
  const out: any = { expert: j.expert, score: j.score, level: j.level, summary_uz: j.summary_uz, limited: true };
  if (kind === "writing") out.tasks = list; else out.parts = list;
  return new Response(JSON.stringify(out), { status: 200, headers: r.headers });
}

export async function mlHandle(mode: string, c: Ctx): Promise<Response> {
  if (mode === "ml_gen") {
    const cron = c.req.headers.get("x-cron-secret");
    let ok = false;
    if (cron) { const { data } = await c.SB.from("wd_tg_kv").select("val").eq("key", "cron_secret").maybeSingle(); ok = !!data?.val && cron === data.val; }
    if (!ok) { const au = await adminUser(c); ok = !!au?.isAdmin; }
    if (!ok) return c.json({ error: "Test yaratish faqat admin uchun" }, 403);
    const sec = String(c.body.section || ""); const level = c.clip(c.body.level, 10) || "B1-C1";
    void level;
    const part = String(c.body.part || "");
    if ((sec === "listening" || sec === "reading") && part) {
      const x = sec === "listening" ? await listeningPart(c, part) : await readingPart(c, part);
      return typeof x === "string" ? c.json({ error: `${sec} ${part}: ${x}`, why: x, retry: true }, 502) : c.json({ data: x });
    }
    const r: any = sec === "writing" ? await genWriting(c) : sec === "speaking" ? await genSpeaking(c) : c.json({ error: "section/part?" }, 400);
    if (r instanceof Response) return r;
    return c.json(r);
  }
  if (mode === "ml_check") {
    const au = await adminUser(c); if (!au?.isAdmin) return c.json({ error: "faqat admin" }, 403);
    const x = c.body.section === "listening" ? await checkListening(c, c.body.data) : await checkReading(c, c.body.data);
    return c.json(x);
  }
  if (mode === "ml_score_writing" || mode === "ml_score_speaking") {
    const kind = mode === "ml_score_writing" ? "writing" : "speaking";
    const g: any = await canScore(c, kind); if (!g.ok) return c.json({ error: g.msg, pro: !!g.pro }, 403);
    const r = kind === "writing" ? await scoreWriting(c) : await scoreSpeaking(c);
    if (r.status !== 200) return r;
    if (g.limited) { await c.SB.rpc("wd_ml_mark", { uid: g.uid, kind }); return await limitResp(r, kind); }
    return r;
  }
  if (mode === "ml_start") {
    const au = await adminUser(c); if (!au) return c.json({ error: "Avval WordDrop hisobingizga kiring" }, 401);
    const { data, error } = await c.SB.rpc("wd_ml_claim", { uid: au.user.id, m: String(c.body.exam || "full") });
    if (error || !data) return c.json({ error: "Boshlab bo'lmadi, qayta urinib ko'ring" }, 500);
    return data.ok ? c.json(data) : c.json({ error: data.msg, pro: !!data.pro }, 403);
  }
  if (mode === "ml_access") {
    const au = await adminUser(c); if (!au) return c.json({ admin: false, pro: false, free_left: 0, signed: false });
    const { data } = await c.SB.rpc("wd_ml_access", { uid: au.user.id });
    return c.json(data || { admin: !!au.isAdmin, pro: !!au.isAdmin, free_left: 0, signed: true });
  }
  return c.json({ error: "Noma'lum ml rejim" }, 400);
}
