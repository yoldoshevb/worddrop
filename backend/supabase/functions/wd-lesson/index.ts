// Supabase Edge Function: wd-lesson (WordDrop v101)
// Daraja testidan keyin darslar foydalanuvchining CEFR darajasidan boshlanadi.
// Kirish: { cefr: "A1".."C1", lesson, avoid[], interests[], goal } → { theme, words:[{term,pos,tr,ipa,def,ex,forms}] }
// Tarjimalar tasdiqlangan lug'at (word_translations) bilan tekshiriladi.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001F]/g, " ").slice(0, n).trim();
const SB = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const LV = ["A1", "A2", "B1", "B2", "C1"];
const GUIDE: Record<string, string> = {
  A1: "A1 (beginner): the most frequent everyday words — family, food, home, colours, numbers, time, simple verbs and adjectives. Very short, simple example sentences in present simple.",
  A2: "A2 (elementary): common everyday words for travel, shopping, work, health, free time; simple phrasal verbs (get up, look for). Short examples, simple tenses.",
  B1: "B1 (intermediate): useful words for opinions, experiences, plans, study and work; common collocations and phrasal verbs.",
  B2: "B2 (upper-intermediate): less frequent, more precise words; abstract topics (society, environment, technology); collocations used in IELTS/Multilevel.",
  C1: "C1 (advanced): sophisticated, academic and idiomatic vocabulary; nuance, formal register; words useful for high Multilevel/IELTS scores.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const b = await req.json().catch(() => ({}));
    const key = Deno.env.get("GROQ_API_KEY"); if (!key) return json({ error: "Server xatosi" }, 500);
    const cefr = LV.includes(String(b.cefr)) ? String(b.cefr) : "B1";
    const lesson = Math.max(1, Math.min(2000, Number(b.lesson) || 1));
    const avoid = (Array.isArray(b.avoid) ? b.avoid : []).slice(-400).map((x: unknown) => clip(x, 40).toLowerCase()).filter(Boolean);
    const interests = (Array.isArray(b.interests) ? b.interests : []).slice(0, 12).map((x: unknown) => clip(x, 40)).filter(Boolean);
    const goal = clip(b.goal, 80);
    const system = `You design a vocabulary lesson for an Uzbek learner of English. Lesson #${lesson}. Target level: ${GUIDE[cefr]}
Pick ONE everyday theme${interests.length ? ` (prefer the learner's interests: ${interests.join(", ")})` : ""}${goal ? `; learner's goal: ${goal}` : ""}, then 10 words or short phrases on that theme at exactly this level.
Do NOT use any of these already-learned words: ${avoid.slice(-250).join(", ") || "(none)"}.
For each: "term" (English, lowercase unless proper noun), "pos" (noun/verb/adj/adv/phrase), "tr" (the most common, accurate Uzbek translation — standard literary Uzbek, Latin script, o' g'; not Russian, not word-for-word), "ipa" (British IPA in slashes), "def" (short simple English definition), "ex" (natural example sentence at this level), "forms" (all forms of the term that may appear in sentences, e.g. go, goes, went, gone, going).
Return ONLY JSON: {"theme":"short Uzbek theme name","words":[{...}]}`;
    let p: any = null;
    for (const m of [{ id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "low" } }, { id: "openai/gpt-oss-120b", extra: { include_reasoning: false, reasoning_effort: "low" } }, { id: "qwen/qwen3.8-27b", extra: { reasoning_effort: "none", reasoning_format: "hidden" } }]) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: m.id, temperature: 0.7, max_completion_tokens: 8000, response_format: { type: "json_object" }, ...m.extra, messages: [{ role: "system", content: system }, { role: "user", content: `Lesson ${lesson}, level ${cefr}.` }] }) }).catch(() => null);
      if (r && r.status === 429) { const w = Math.min(15, Number(r.headers.get("retry-after")) || 6); await new Promise((z) => setTimeout(z, w * 1000)); }
      if (!r || !r.ok) { console.error("[wd-lesson] groq", m.id, r?.status, (await r?.text().catch(() => ""))?.slice(0, 300)); continue; }
      const d = await r.json().catch(() => null); const raw = String(d?.choices?.[0]?.message?.content ?? "");
      try { p = JSON.parse(raw); } catch { const a = raw.indexOf("{"), z = raw.lastIndexOf("}"); if (a >= 0 && z > a) try { p = JSON.parse(raw.slice(a, z + 1)); } catch { /* */ } }
      if (p && Array.isArray(p.words)) break;
      console.error("[wd-lesson] parse", m.id, d?.choices?.[0]?.finish_reason, raw.slice(0, 200)); p = null;
    }
    if (!p || !Array.isArray(p.words)) return json({ error: "Dars tuzilmadi" }, 502);
    const av = new Set(avoid);
    let words = p.words.slice(0, 12).map((w: any) => ({
      term: clip(w?.term, 40), pos: clip(w?.pos, 12), tr: clip(w?.tr, 80), ipa: clip(w?.ipa, 40), def: clip(w?.def, 220), ex: clip(w?.ex, 180),
      forms: (Array.isArray(w?.forms) && w.forms.length ? w.forms : [w?.term]).map((f: unknown) => clip(f, 40)).filter(Boolean).slice(0, 8),
    })).filter((w: any) => w.term && w.tr && !av.has(w.term.toLowerCase()));
    // Tasdiqlangan lug'at bilan tarjima va IPA ni tekshiramiz
    const { data } = await SB.from("word_translations").select("en,uz,ipa").in("en", words.map((w: any) => w.term.toLowerCase())).eq("verified", true);
    const dict = new Map((data ?? []).map((r: any) => [String(r.en).toLowerCase(), r]));
    words = words.map((w: any) => { const r: any = dict.get(w.term.toLowerCase()); return r ? { ...w, tr: clip(r.uz, 80) || w.tr, ipa: w.ipa || clip(r.ipa, 40) } : w; }).slice(0, 10);
    if (words.length < 8) return json({ error: "So'zlar yetarli emas" }, 502);
    return json({ theme: clip(p.theme, 40), words, cefr });
  } catch (e) {
    console.error("[wd-lesson]", e);
    return json({ error: "Ichki xato" }, 500);
  }
});
