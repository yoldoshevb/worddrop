// Supabase Edge Function: tg-bot  (WordDrop v96)
// @WordDropUzBot — foydalanuvchilar bilan suhbat, kanal postlari va eslatmalar.
//
// Kirish yo'llari (bitta URL):
//   1) Telegram webhook   — sarlavha: x-telegram-bot-api-secret-token
//   2) Cron (pg_cron)     — sarlavha: x-cron-secret, body {action:"cron"}
//   3) Ilova (foydalanuvchi JWT) — body {action: link_code | link_get | link_prefs | unlink}
//   4) Admin (JWT + admins ro'yxati) — body {action: status | setup | posts | post_save | post_delete | post_send | plan | autopilot | test
//        | bot_cfg | bot_cfg_set | groups | group_get | group_set | person_set | group_learn | group_import | group_forget | group_leave}
//   5) Telegram Mini App — body {action: tg_login, init} (initData imzosi bot kaliti bilan tekshiriladi)
//
// v96: guruhlarda "aqlli" Drop (guruh muhiti va a'zolar haqida xotira, hazil darajasi, rejimlar),
//      botdagi /admin boshqaruv paneli, ovozli xabarlar (Groq Whisper), Telegram ichida ilova.
//
// Sirlar: TELEGRAM_BOT_TOKEN, GROQ_API_KEY (Supabase Secrets); webhook/cron sirlari — wd_tg_kv jadvalida.

import { createClient } from "npm:@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const GROQ = Deno.env.get("GROQ_API_KEY") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://www.worddrop-app.uz/app.html";
const FN_URL = `${SB_URL}/functions/v1/tg-bot`;
const db = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n).trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;
/* Javobni Telegram'ga darhol qaytarib, og'ir ishni fonda davom ettiramiz */
function bg(p: Promise<unknown>) { const q = p.catch((e) => console.error("[bg]", e)); try { EdgeRuntime.waitUntil(q); } catch { /* lokal */ } return q; }

/* ───────── Vaqt (Toshkent, UTC+5) ───────── */
function tz() { const d = new Date(Date.now() + 5 * 3600_000); return { day: d.toISOString().slice(0, 10), hour: d.getUTCHours(), minute: d.getUTCMinutes(), dateStr: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toDateString() }; }
function daySeed(day: string) { let h = 0; for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

/* ───────── Telegram API ───────── */
async function tg(method: string, body: Record<string, unknown>): Promise<any> {
  if (!BOT_TOKEN) return { ok: false, description: "TELEGRAM_BOT_TOKEN o'rnatilmagan" };
  for (let i = 0; i < 2; i++) {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false, description: "javob o'qilmadi" }));
    if (j.ok || j.error_code !== 429) return j;
    await sleep(Math.min(((j.parameters?.retry_after) || 1) * 1000, 5000));
  }
  return { ok: false, description: "429" };
}
const send = (chat_id: number | string, text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

/* ───────── KV ───────── */
async function kv(key: string): Promise<any> { const { data } = await db.from("wd_tg_kv").select("val").eq("key", key).maybeSingle(); return data?.val ?? null; }
async function kvSet(key: string, val: unknown) { await db.from("wd_tg_kv").upsert({ key, val, updated_at: new Date().toISOString() }); }

/* ───────── Groq (JSON) ───────── */
async function groq(system: string, user: string, maxTokens = 600, temp = 0.6): Promise<any | null> {
  if (!GROQ) return null;
  for (const model of ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]) {
    try {
      const extra = model.startsWith("qwen") ? { reasoning_effort: "none", reasoning_format: "hidden" } : { include_reasoning: false, reasoning_effort: "low" };
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ}` },
        body: JSON.stringify({ model, temperature: temp, max_completion_tokens: maxTokens, response_format: { type: "json_object" }, ...extra, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
      });
      if (!r.ok) continue;
      const d = await r.json(); const raw = String(d?.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "");
      try { return JSON.parse(raw); } catch { const a = raw.indexOf("{"), b = raw.lastIndexOf("}"); if (a >= 0 && b > a) try { return JSON.parse(raw.slice(a, b + 1)); } catch { /* */ } }
    } catch { /* keyingi model */ }
  }
  return null;
}
/* Bot haqida (id, username) — keshda */
let ME: { id: number; username: string; can_read: boolean } | null = null;
async function me() {
  if (ME) return ME;
  const c = await kv("me"); if (c?.id && Date.now() - (c.at || 0) < 6 * 3600_000) return (ME = c);
  const r = await tg("getMe", {});
  if (r.ok) { ME = { id: r.result.id, username: r.result.username, can_read: !!r.result.can_read_all_group_messages }; await kvSet("me", { ...ME, at: Date.now() }); }
  return ME ?? { id: 0, username: "WordDropUzBot", can_read: false };
}
/* Umumiy bot sozlamalari */
const CFG_DEF = { dm: "all", approve_groups: true, humor: 1 };
async function cfg(): Promise<{ dm: string; approve_groups: boolean; humor: number }> { return { ...CFG_DEF, ...((await kv("bot_cfg")) ?? {}) }; }
const UZ = "O'zbekcha matn: standart adabiy o'zbek tili, lotin yozuvi, sodda. O'zbek apostrofi: o', g'.";

/* ───────── So'zlar bazasi ───────── */
type Word = { id: number; en: string; uz: string; ipa: string | null; ex: string | null; level: string | null; pos: string | null };
async function randomWord(seed: number, levels = ["A2", "B1", "B2"]): Promise<Word | null> {
  const { count } = await db.from("word_translations").select("id", { count: "exact", head: true }).in("level", levels).eq("verified", true);
  if (!count) return null;
  const { data } = await db.from("word_translations").select("id,en,uz,ipa,ex,level,pos").in("level", levels).eq("verified", true).order("id").range(seed % count, seed % count);
  return (data && data[0]) as Word ?? null;
}
async function distractors(w: Word, n = 3): Promise<string[]> {
  const lv = w.level ?? "B1";
  const { count } = await db.from("word_translations").select("id", { count: "exact", head: true }).eq("level", lv).eq("verified", true);
  const total = Math.max(1, count ?? 1), off = Math.floor(Math.random() * Math.max(1, total - 12));
  const { data } = await db.from("word_translations").select("id,uz").eq("level", lv).eq("verified", true).order("id").range(off, off + 11);
  const out: string[] = [];
  for (const x of (data ?? []).sort(() => Math.random() - .5)) {
    if (out.length >= n) break;
    if (x.id !== w.id && x.uz && x.uz.toLowerCase() !== w.uz.toLowerCase() && !out.includes(x.uz)) out.push(x.uz);
  }
  return out;
}
/* Kun so'zi — kuniga bitta, AI izohi (eslab qolish usuli) bilan keshlanadi */
async function wordOfDay(): Promise<any> {
  const t = tz(); const key = "wod:" + t.day;
  const cached = await kv(key); if (cached) return cached;
  const w = await randomWord(daySeed(t.day));
  if (!w) return null;
  const ai = await groq(
    `You write a short "word of the day" note for Uzbek learners of English. ${UZ}
Return JSON: {"mn_uz":"o'zbekcha eslab qolish usuli: so'zning tovushiga o'xshash o'zbekcha so'z yoki qisqa tasvir orqali bog'lanish, 1 jumla","ex2":"one more natural English example","ex2_uz":"uning tarjimasi","tip_uz":"qisqa ishlatish maslahati, 1 jumla"}`,
    `Word: ${w.en} (${w.pos ?? ""}) = ${w.uz}. Example: ${w.ex ?? ""}`, 400, 0.7);
  const v = { ...w, mn_uz: clip(ai?.mn_uz, 240), ex2: clip(ai?.ex2, 200), ex2_uz: clip(ai?.ex2_uz, 200), tip_uz: clip(ai?.tip_uz, 200) };
  await kvSet(key, v);
  return v;
}
function wodText(v: any) {
  return `☀️ <b>Kun so'zi</b>\n\n<b>${esc(v.en)}</b>${v.ipa ? ` <i>${esc(v.ipa)}</i>` : ""} — ${esc(v.uz)}\n` +
    (v.ex ? `\n▸ ${esc(v.ex)}` : "") + (v.ex2 ? `\n▸ ${esc(v.ex2)}${v.ex2_uz ? `\n   <i>${esc(v.ex2_uz)}</i>` : ""}` : "") +
    (v.mn_uz ? `\n\n🧠 <b>Eslab qolish:</b> ${esc(v.mn_uz)}` : "") + (v.tip_uz ? `\n💡 ${esc(v.tip_uz)}` : "");
}

/* ───────── Foydalanuvchi holati (wd_state) ───────── */
async function userSummary(uid: string) {
  const { data } = await db.from("wd_state").select("state").eq("user_id", uid).maybeSingle();
  const s: any = data?.state ?? {};
  const now = Date.now(); let due = 0; const weak: string[] = [];
  const srs = s.srs && typeof s.srs === "object" ? Object.values(s.srs) as any[] : [];
  for (const it of srs) {
    if (!it || typeof it !== "object") continue;
    const st = it.st; const isDue = (st === undefined ? (it.reps || 0) > 0 : st > 0) && Number(it.due) <= now;
    if (isDue) due++;
    if ((it.lapses || 0) >= 2 || (it.bad || 0) >= 3) weak.push(`${it.t} — ${it.tr}`);
  }
  return { name: s.name || "", xp: Number(s.xp) || 0, streak: Number(s.dailyStreak) || 0, words: srs.length, due, weak: weak.slice(0, 5), lastDay: String(s.lastActiveDay || ""), coins: Number(s.coins) || 0 };
}

/* ───────── Drop AI limiti (ilova bilan umumiy) ───────── */
const utcDay = () => new Date().toISOString().slice(0, 10);   // wd_drop_bump bilan bir xil (current_date, UTC)
async function askAllowed(chat: any): Promise<{ ok: boolean; left: number }> {
  const t = tz();
  if (chat.user_id) {
    const { data } = await db.from("wd_drop_usage").select("count").eq("user_id", chat.user_id).eq("day", utcDay()).maybeSingle();
    const c = data?.count ?? 0; return { ok: c < 20, left: Math.max(0, 20 - c) };
  }
  const c = chat.ask_day === t.day ? chat.ask_count : 0; return { ok: c < 3, left: Math.max(0, 3 - c) };
}
async function askBump(chat: any) {
  const t = tz();
  if (chat.user_id) {
    const { data } = await db.from("wd_drop_usage").select("count,day").eq("user_id", chat.user_id).maybeSingle();
    const cur = data && data.day === utcDay() ? data.count : 0;
    await db.from("wd_drop_usage").upsert({ user_id: chat.user_id, day: utcDay(), count: Math.min(20, cur + 1), updated_at: new Date().toISOString() });
  } else {
    const c = chat.ask_day === t.day ? chat.ask_count + 1 : 1;
    await db.from("wd_tg_chats").update({ ask_day: t.day, ask_count: c }).eq("chat_id", chat.chat_id);
  }
}

/* ───────── Klaviaturalar ───────── */
const KB_MAIN = { inline_keyboard: [
  [{ text: "☀️ Kun so'zi", callback_data: "w" }, { text: "🎯 Viktorina", callback_data: "q" }],
  [{ text: "🧠 Takrorim", callback_data: "r" }, { text: "🏆 Reyting", callback_data: "t" }],
  [{ text: "⚙️ Sozlamalar", callback_data: "s" }, { text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }],
] };
function kbSettings(c: any) {
  return { inline_keyboard: [
    [{ text: `${c.morning ? "✅" : "⬜️"} Ertalabki Kun so'zi (08:00)`, callback_data: "s:m" }],
    [{ text: `${c.evening ? "✅" : "⬜️"} Kechki takror eslatmasi`, callback_data: "s:e" }],
    [18, 19, 20, 21, 22].map((h) => ({ text: (c.remind_hour === h ? "• " : "") + h + ":00", callback_data: "s:h" + h })),
    [{ text: "⬅️ Menyu", callback_data: "m" }],
  ] };
}

/* ───────── Chat yozuvi ───────── */
async function upsertChat(from: any, chatId: number) {
  const { data } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) { await db.from("wd_tg_chats").update({ last_seen: new Date().toISOString(), active: true, username: from?.username ?? data.username, first_name: from?.first_name ?? data.first_name }).eq("chat_id", chatId); return { ...data, active: true }; }
  const row = { chat_id: chatId, username: from?.username ?? null, first_name: from?.first_name ?? null };
  await db.from("wd_tg_chats").insert(row);
  const { data: d2 } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
  return d2;
}

/* ───────── Viktorina ───────── */
async function sendQuiz(chatId: number, editMsg?: number) {
  const w = await randomWord(Math.floor(Math.random() * 1e9));
  if (!w) return send(chatId, "Hozircha savol tayyor emas.");
  const opts = [...(await distractors(w)), w.uz].sort(() => Math.random() - .5);
  const correct = opts.indexOf(w.uz);
  const kb = { inline_keyboard: opts.map((o, i) => [{ text: o, callback_data: `a:${w.id}:${i}:${correct}` }]) };
  const text = `🎯 <b>Tarjimasini toping</b>\n\n<b>${esc(w.en)}</b>${w.ipa ? ` <i>${esc(w.ipa)}</i>` : ""}`;
  return editMsg ? tg("editMessageText", { chat_id: chatId, message_id: editMsg, text, parse_mode: "HTML", reply_markup: kb }) : send(chatId, text, { reply_markup: kb });
}

/* ───────── Webhook: xabarlar ───────── */
async function onUpdate(u: any) {
  if (u.my_chat_member) return onMyChatMember(u.my_chat_member);
  if (u.callback_query) return onCallback(u.callback_query);
  const m = u.message; if (!m || !m.chat) return;
  if (m.chat.type === "group" || m.chat.type === "supergroup") { bg(groupMessage(m)); return; }
  if (m.chat.type !== "private") return;
  const chat = await upsertChat(m.from, m.chat.id); if (!chat) return;
  const text = String(m.text ?? "").trim();
  if (text && !text.startsWith("/") && await adminAwait(chat.chat_id, m.from.id, text)) return;
  if (text === "/admin") return adminPanel(chat.chat_id, m.from.id);
  const { data: person } = await db.from("wd_tg_people").select("ignore").eq("user_id", m.from.id).maybeSingle();
  if (person?.ignore) return;   // admin "javob bermasin" degan odam
  if (!text && (m.voice || m.audio || m.video_note)) { bg(privateVoice(chat, m)); return; }
  if (!text) return send(chat.chat_id, "Matn yoki ovozli xabar yuboring 🙂 Inglizcha gapirsangiz, talaffuz va grammatikangizni tekshirib beraman.", { reply_markup: KB_MAIN });

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (code && /^[A-Za-z0-9_-]{6,40}$/.test(code)) {
      const { data: c } = await db.from("wd_tg_codes").select("*").eq("code", code).maybeSingle();
      if (c && !c.used_at && Date.now() - Date.parse(c.created_at) < 30 * 60_000) {
        await db.from("wd_tg_chats").update({ user_id: null }).eq("user_id", c.user_id);
        await db.from("wd_tg_chats").update({ user_id: c.user_id }).eq("chat_id", chat.chat_id);
        await db.from("wd_tg_codes").update({ used_at: new Date().toISOString() }).eq("code", code);
        const s = await userSummary(c.user_id);
        return send(chat.chat_id, `✅ <b>WordDrop hisobingiz ulandi${s.name ? ", " + esc(s.name) : ""}!</b>\n\nEndi har kuni ertalab Kun so'zini, kechqurun esa takror eslatmasini yuboraman. Savollaringizni shu yerga yozsangiz, Drop AI javob beradi.\n\n🔥 Seriya: <b>${s.streak} kun</b>  ·  ⭐ XP: <b>${s.xp}</b>  ·  🧠 Bugun takror: <b>${s.due}</b>`, { reply_markup: KB_MAIN });
      }
      await send(chat.chat_id, "Bu ulash havolasi eskirgan. Ilovada Profil → Telegram bo'limidan yangisini oling.");
    }
    return send(chat.chat_id, `Salom${m.from?.first_name ? ", " + esc(m.from.first_name) : ""}! 💧 Men <b>Drop</b> — WordDrop yordamchisiman.\n\n• Har kuni ertalab yangi so'z yuboraman\n• Viktorina bilan bilimingizni sinaymiz\n• Inglizcha savolingizga javob beraman — shunchaki yozing\n\nIlovadagi progress bilan bog'lash uchun WordDrop'da Profil → Telegram tugmasini bosing.`, { reply_markup: KB_MAIN });
  }
  if (text === "/menu" || text === "/help") return send(chat.chat_id, "Nima qilamiz?", { reply_markup: KB_MAIN });
  if (text === "/word") return send(chat.chat_id, wodText(await wordOfDay() ?? {}), { reply_markup: { inline_keyboard: [[{ text: "🎯 Viktorina", callback_data: "q" }, { text: "📱 Ilovada o'rganish", url: APP_URL }]] } });
  if (text === "/quiz") return sendQuiz(chat.chat_id);
  if (text === "/review") return onCallback({ data: "r", message: { chat: { id: chat.chat_id, type: "private" } }, id: "" });
  if (text === "/top") return onCallback({ data: "t", message: { chat: { id: chat.chat_id, type: "private" } }, id: "" });
  if (text === "/settings") return send(chat.chat_id, "⚙️ <b>Sozlamalar</b>\nEslatmalar Toshkent vaqti bo'yicha keladi.", { reply_markup: kbSettings(chat) });
  if (text === "/stop") { await db.from("wd_tg_chats").update({ morning: false, evening: false }).eq("chat_id", chat.chat_id); return send(chat.chat_id, "Eslatmalar o'chirildi. Qayta yoqish: /settings"); }
  if (text.startsWith("/")) return send(chat.chat_id, "Bunday buyruq yo'q. Menyu: /menu");

  // Oddiy matn → Drop AI (admin sozlamasiga ko'ra)
  const gate = await dmGate(chat); if (gate) return send(chat.chat_id, gate, { reply_markup: KB_MAIN });
  const q = await askAllowed(chat);
  if (!q.ok) return send(chat.chat_id, chat.user_id ? "Bugungi 20 ta savol tugadi. Ertaga davom etamiz 🌙" : "Bugungi 3 ta bepul savol tugadi. WordDrop'da ro'yxatdan o'tib, hisobni ulasangiz — kuniga 20 ta.", { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop", url: APP_URL }]] } });
  await tg("sendChatAction", { chat_id: chat.chat_id, action: "typing" });
  const s = chat.user_id ? await userSummary(chat.user_id) : null;
  const a = await groq(
    `Sen "Drop" — WordDrop ingliz tili ilovasining Telegram'dagi o'qituvchisisan. Qisqa (3-6 jumla), aniq, misol bilan javob ber; oxirida bitta amaliy topshiriq yoki savol. Faqat ingliz tili, o'qish va motivatsiya mavzusida. Uy vazifasini tayyor qilib berma. ${UZ}
${s ? `O'quvchi: ${s.name || "—"}, XP ${s.xp}, seriya ${s.streak} kun, zaif so'zlari: ${s.weak.join("; ") || "yo'q"}.` : ""}
Telegram HTML ishlatsang bo'ladi: <b>, <i> faqat. Markdown ishlatma.
JSON qaytar: {"reply":"..."}`, clip(text, 1200), 700, 0.6);
  const reply = clip(a?.reply, 3500);
  if (!reply) return send(chat.chat_id, "Hozir javob bera olmadim. Birozdan keyin qayta yozing.");
  await askBump(chat);
  const safe = reply.replace(/<(?!\/?(b|i)>)[^>]*>/g, "");
  const r = await send(chat.chat_id, safe);
  if (!r.ok) await tg("sendMessage", { chat_id: chat.chat_id, text: safe.replace(/<[^>]+>/g, "") });
}

async function onCallback(cq: any) {
  const chatId = cq.message?.chat?.id; const data = String(cq.data || "");
  if (data.startsWith("A")) return adminCb(cq);
  if (cq.id && !data.startsWith("a:")) tg("answerCallbackQuery", { callback_query_id: cq.id });
  if (!chatId) return;
  if (cq.message?.chat?.type !== "private") return groupCb(cq);
  if (cq.id && data.startsWith("a:")) tg("answerCallbackQuery", { callback_query_id: cq.id });
  const { data: chat } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
  if (!chat) return;
  if (data === "m") return send(chatId, "Nima qilamiz?", { reply_markup: KB_MAIN });
  if (data === "w") return send(chatId, wodText(await wordOfDay() ?? {}), { reply_markup: { inline_keyboard: [[{ text: "🎯 Viktorina", callback_data: "q" }]] } });
  if (data === "q") return sendQuiz(chatId);
  if (data.startsWith("a:")) {
    const [, wid, pick, corr] = data.split(":"); const ok = pick === corr;
    const { data: w } = await db.from("word_translations").select("en,uz,ipa,ex").eq("id", Number(wid)).maybeSingle();
    const streak = ok ? chat.quiz_streak + 1 : 0;
    await db.from("wd_tg_chats").update({ quiz_total: chat.quiz_total + 1, quiz_ok: chat.quiz_ok + (ok ? 1 : 0), quiz_streak: streak }).eq("chat_id", chatId);
    const head = ok ? `✅ <b>To'g'ri!</b>${streak >= 3 ? `  🔥 ${streak} ketma-ket` : ""}` : `❌ <b>Afsus.</b>`;
    return tg("editMessageText", { chat_id: chatId, message_id: cq.message.message_id, parse_mode: "HTML",
      text: `${head}\n\n<b>${esc(w?.en)}</b>${w?.ipa ? ` <i>${esc(w.ipa)}</i>` : ""} — ${esc(w?.uz)}${w?.ex ? `\n▸ ${esc(w.ex)}` : ""}\n\nNatija: ${chat.quiz_ok + (ok ? 1 : 0)}/${chat.quiz_total + 1}`,
      reply_markup: { inline_keyboard: [[{ text: "Keyingi savol ➜", callback_data: "q" }]] } });
  }
  if (data === "r") {
    if (!chat.user_id) return send(chatId, "Takrorni ko'rish uchun WordDrop hisobingizni ulang: ilovada Profil → Telegram.", { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop", url: APP_URL }]] } });
    const s = await userSummary(chat.user_id);
    return send(chatId, `🧠 <b>Takrorlash</b>\n\nBugun kutayotgan so'zlar: <b>${s.due}</b>\nLug'atingizda: ${s.words} ta so'z\n🔥 Seriya: ${s.streak} kun${s.weak.length ? `\n\n<b>Tez unutilayotganlar:</b>\n${s.weak.map((x) => "• " + esc(x)).join("\n")}` : ""}`, { reply_markup: { inline_keyboard: [[{ text: "Takrorlashni boshlash", url: APP_URL }]] } });
  }
  if (data === "t") {
    const { data: top } = await db.rpc("wd_tg_top", { n: 10 });
    const medals = ["🥇", "🥈", "🥉"];
    return send(chatId, `🏆 <b>WordDrop reytingi</b>\n\n${(top ?? []).map((r: any, i: number) => `${medals[i] ?? (i + 1) + "."} ${esc(r.name)} — <b>${r.xp}</b> XP`).join("\n") || "Hali ma'lumot yo'q."}`, { reply_markup: { inline_keyboard: [[{ text: "📱 Reytingga kirish", url: APP_URL }]] } });
  }
  if (data === "s") return send(chatId, "⚙️ <b>Sozlamalar</b>\nEslatmalar Toshkent vaqti bo'yicha keladi.", { reply_markup: kbSettings(chat) });
  if (data.startsWith("s:")) {
    const p: any = {};
    if (data === "s:m") p.morning = !chat.morning;
    if (data === "s:e") p.evening = !chat.evening;
    if (data.startsWith("s:h")) p.remind_hour = Math.max(0, Math.min(23, Number(data.slice(3)) || 20));
    await db.from("wd_tg_chats").update(p).eq("chat_id", chatId);
    return tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: kbSettings({ ...chat, ...p }) });
  }
}

/* ═════════════════════════════════════════════════════════════════════
   v96: GURUHLARDAGI DROP
   ─ Bot faqat qo'shilganidan keyingi xabarlarni ko'radi (Telegram cheklovi).
     Eski tarixni admin ilovada "Export chat history" fayli orqali yuklaydi.
   ─ Har ~40 xabarda Drop guruh muhiti va a'zolar haqidagi xotirasini yangilaydi.
   ─ Adminning yashirin eslatmalari faqat tushunish uchun; guruhda oshkor qilinmaydi.
   ═════════════════════════════════════════════════════════════════════ */
const nowIso = () => new Date().toISOString();
const MODE_LBL: Record<string, string> = { mention: "Chaqirganda", smart: "Aqlli", active: "Faol" };
const HUMOR_LBL = ["😐 Jiddiy", "🙂 O'rtacha", "😜 Sho'x"];
const personName = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(" ") || (p?.username ? "@" + p.username : "—");
const fromName = (f: any) => [f?.first_name, f?.last_name].filter(Boolean).join(" ") || f?.username || "—";
const isGroupType = (t: string) => t === "group" || t === "supergroup";

async function adminChatIds(): Promise<number[]> {
  const { data } = await db.rpc("wd_tg_admin_chats");
  return (data ?? []).map((r: any) => Number(r.chat_id)).filter(Boolean);
}
async function tgIsAdmin(tgUserId: number): Promise<boolean> {
  return (await adminChatIds()).includes(Number(tgUserId));   // shaxsiy chat id = foydalanuvchi id
}

/* ───────── Bot guruhga qo'shildi / chiqarildi ───────── */
async function onMyChatMember(u: any) {
  const c = u.chat; const st = u.new_chat_member?.status;
  if (!c) return;
  if (c.type === "private") { if (st === "kicked" || st === "left") await db.from("wd_tg_chats").update({ active: false }).eq("chat_id", c.id); return; }
  if (!isGroupType(c.type)) return;
  if (st === "kicked" || st === "left") { await db.from("wd_tg_groups").update({ status: "left", updated_at: nowIso() }).eq("chat_id", c.id); return; }
  if (st !== "member" && st !== "administrator") return;
  const { data: old } = await db.from("wd_tg_groups").select("status").eq("chat_id", c.id).maybeSingle();
  if (old && old.status !== "left") { await db.from("wd_tg_groups").update({ title: c.title, username: c.username ?? null, updated_at: nowIso() }).eq("chat_id", c.id); return; }
  const conf = await cfg();
  const byAdmin = u.from?.id ? await tgIsAdmin(u.from.id) : false;
  const status = byAdmin || !conf.approve_groups ? "on" : "pending";
  await db.from("wd_tg_groups").upsert({ chat_id: c.id, title: c.title, username: c.username ?? null, status, humor: conf.humor ?? 1, added_by: u.from?.id ?? null, updated_at: nowIso() });
  await groupHello(c.id, status);
  if (status === "pending") {
    for (const a of await adminChatIds()) {
      await send(a, `👥 <b>Bot yangi guruhga qo'shildi</b>\n\n<b>${esc(c.title)}</b>${c.username ? " (@" + esc(c.username) + ")" : ""}\nQo'shgan: ${esc(fromName(u.from))}${u.from?.username ? " @" + esc(u.from.username) : ""}\n\nDrop bu guruhda gapirsinmi?`,
        { reply_markup: { inline_keyboard: [[{ text: "✅ Ruxsat berish", callback_data: `Ags:${c.id}:on` }, { text: "🚪 Guruhdan chiqish", callback_data: `Agk:${c.id}` }], [{ text: "⚙️ Sozlash", callback_data: `Ag:${c.id}` }]] } });
    }
  }
}
async function groupHello(chatId: number, status: string) {
  const B = await me();
  if (status === "pending") return send(chatId, "Salom! 💧 Men <b>Drop</b> — WordDrop'ning ingliz tili yordamchisiman.\nMeni ishga tushirish uchun WordDrop admini ruxsat berishi kerak — tez orada qaytaman.");
  return send(chatId, `Salom hammaga! 💧 Men <b>Drop</b> — WordDrop'ning ingliz tili yordamchisi va endi shu guruh a'zosiman.\n\n• Meni chaqirish: @${esc(B.username)} yoki xabarimga javob yozing\n• /quiz — guruh bilan viktorina, /word — kun so'zi\n• /unut — men siz haqingizda eslab qolganlarimni o'chiradi\n\nAvval biroz tinglayman, keyin suhbatga qo'shilaman 🙂`);
}

/* ───────── Guruh xabari ───────── */
async function groupMessage(m: any) {
  const chatId = m.chat.id; const f = m.from;
  if (m.migrate_to_chat_id) { await db.from("wd_tg_groups").update({ chat_id: m.migrate_to_chat_id }).eq("chat_id", chatId); return; }
  if (!f || f.is_bot) return;
  const B = await me();
  let text = String(m.text ?? m.caption ?? "").trim();
  const replyToBot = m.reply_to_message?.from?.id === B.id;
  const { data: g0 } = await db.from("wd_tg_groups").select("status,mode").eq("chat_id", chatId).maybeSingle();
  if (!g0) {   // bot avvalroq qo'shilgan (v96 dan oldin) — ro'yxatga olamiz
    await db.from("wd_tg_groups").upsert({ chat_id: chatId, title: m.chat.title, username: m.chat.username ?? null, status: (await cfg()).approve_groups ? "pending" : "on" });
    return;
  }
  // Ovozli xabar: guruh yoqilgan bo'lsa va (bot chaqirilgan yoki rejim "chaqirganda" emas)
  let voice = false;
  if (!text && (m.voice || m.video_note) && g0.status === "on" && (replyToBot || g0.mode !== "mention")) {
    const v = m.voice || m.video_note;
    if ((v.duration || 0) <= 90) { const t = await transcribe(v.file_id); if (t?.text) { text = t.text.trim(); voice = true; } }
  }
  const cmd = text.startsWith("/") ? text.split(/\s+/)[0].split("@")[0].toLowerCase() : "";
  const cmdForOther = text.startsWith("/") && text.split(/\s+/)[0].includes("@") && !text.split(/\s+/)[0].toLowerCase().endsWith("@" + B.username.toLowerCase());
  if (cmdForOther) return;
  const { data: ing } = await db.rpc("wd_tg_ingest", { p: {
    chat_id: chatId, title: m.chat.title, msg_id: m.message_id, user_id: f.id, first_name: f.first_name ?? "", last_name: f.last_name ?? "", username: f.username ?? "",
    name: fromName(f), text: cmd ? "" : (voice ? "🎙 " : "") + text, reply_to: m.reply_to_message?.message_id ?? null } });
  const g = ing?.group; const p = ing?.person;
  if (!g) return;

  // Buyruqlar
  if (cmd === "/unut") {
    await db.from("wd_tg_people").update({ optout: true, ai_notes: null, bio: null, secret_notes: null, public_notes: null, updated_at: nowIso() }).eq("user_id", f.id);
    await db.from("wd_tg_msgs").delete().eq("user_id", f.id);
    return send(chatId, `Tayyor, ${esc(f.first_name || "do'stim")} — siz haqingizda eslab qolganlarimni o'chirdim va endi sizga shaxsan gap otmayman. Qaytarish: /qayt`, { reply_parameters: { message_id: m.message_id, allow_sending_without_reply: true } });
  }
  if (cmd === "/qayt") {
    await db.from("wd_tg_people").update({ optout: false, updated_at: nowIso() }).eq("user_id", f.id);
    return send(chatId, `Xush kelibsiz qaytib, ${esc(f.first_name || "do'stim")} 🙂`, { reply_parameters: { message_id: m.message_id, allow_sending_without_reply: true } });
  }
  if (cmd === "/jim" || cmd === "/gapir") {
    if (!(await canModerate(chatId, f.id))) return;
    const h = Math.max(1, Math.min(72, Number(text.split(/\s+/)[1]) || 1));
    await db.from("wd_tg_groups").update({ muted_until: cmd === "/jim" ? new Date(Date.now() + h * 3600_000).toISOString() : null }).eq("chat_id", chatId);
    return send(chatId, cmd === "/jim" ? `🤐 Mayli, ${h} soat jim turaman.` : "🙂 Yana shu yerdaman!");
  }
  if (g.status !== "on") return;
  if (cmd === "/quiz") return sendGroupQuiz(chatId);
  if (cmd === "/word") return send(chatId, wodText(await wordOfDay() ?? {}));
  if (cmd) return;

  // Javob berish kerakmi?
  const lower = text.toLowerCase();
  const addressed = replyToBot || lower.includes("@" + B.username.toLowerCase()) || /^(drop|дроп)\b/i.test(text);
  const allowed = await shouldConsider(g, p, addressed, text);
  if (allowed) await groupReply(g, m, p, addressed, voice);
  // Har ~40 yangi xabarda xotirani yangilaymiz
  if (g.new_msgs >= 40 || (!g.learned_at && g.total_msgs >= 15)) await learnGroup(chatId);
}

async function canModerate(chatId: number, userId: number) {
  if (await tgIsAdmin(userId)) return true;
  const r = await tg("getChatMember", { chat_id: chatId, user_id: userId });
  return r.ok && (r.result.status === "creator" || r.result.status === "administrator");
}

function inQuiet(g: any) {
  if (g.quiet_from == null || g.quiet_to == null) return false;
  const h = tz().hour; const a = g.quiet_from, b = g.quiet_to;
  return a <= b ? h >= a && h < b : h >= a || h < b;
}
async function shouldConsider(g: any, p: any, addressed: boolean, text: string) {
  if (!text || p?.ignore) return false;
  if (g.muted_until && Date.parse(g.muted_until) > Date.now()) return false;
  const day = tz().day; const used = g.used_day === day ? g.used : 0;
  if (used >= g.daily_limit) return false;
  if (addressed) return true;
  if (p?.optout) return false;
  if (inQuiet(g) || g.mode === "mention") return false;
  const since = g.since_bot ?? 0; const gapMs = g.last_bot_at ? Date.now() - Date.parse(g.last_bot_at) : 1e12;
  const english = /\b(english|inglizcha|ingliz tili|tarjima|translate|qanday deyiladi|nima degani|what does|how do you say)\b/i.test(text);
  if (g.mode === "smart") {
    if (gapMs < 3 * 60_000) return false;
    if (english) return Math.random() < 0.7;
    if (/\?\s*$/.test(text) && since >= 4) return Math.random() < 0.25;
    return since >= 10 && Math.random() < 0.18;
  }
  // active
  if (gapMs < 45_000) return false;
  if (english) return true;
  if (/\?\s*$/.test(text)) return Math.random() < 0.5;
  return since >= 3 && Math.random() < 0.35;
}

/* Guruh suhbati uchun Drop'ning shaxsiyati */
function personaPrompt(g: any, humor: number) {
  const tone = ["Ohang: jiddiy va muloyim, hazil qilma.", "Ohang: iliq, do'stona, ora-sira yengil hazil.", "Ohang: sho'x va hazilkash — do'stona chimchilaydi, o'ynoqi kinoya, lekin hech qachon ranjitmaydi."][humor] ?? "";
  return `Sen "Drop" — WordDrop (o'zbeklar uchun ingliz tili ilovasi) ning Telegram guruhidagi a'zosisan. Sen botsan, lekin guruhning o'z odamidek gaplashasan.
${tone}
Qoidalar:
- Guruhning tili va uslubiga moslash (asosan o'zbekcha; guruh ruscha yoki inglizcha aralashtirsa, sen ham). Chat uslubi: 1-3 qisqa jumla, emoji kam (0-2).
- Odamlarga ismi bilan murojaat qil, ularning qiziqishlari va guruhdagi gaplariga ishora qil — ular seni "bizni tushunadi" deb his qilsin.
- O'rni kelsa ingliz tilidan kichik foydali narsa qo'sh (so'z, ibora, xatoni yumshoq tuzatish), lekin o'qituvchilik qilib zeriktirma.
- TAQIQ: tashqi ko'rinish, vazn, sog'liq, din, millat, oila, pul, siyosat yoki jinsiy mavzularda hazil yoki gap; haqorat, kamsitish, birovni guruh oldida sharmanda qilish.
- "MAXFIY" deb belgilangan ma'lumotni hech qachon aytma, ishora ham qilma, bilishingni sezdirma — u faqat odamni tushunishing uchun.
- "/unut qilgan" deb belgilangan odamga shaxsiy gap otma, u haqida taxmin qilma.
- Kimdir xafa, kasal yoki jiddiy muammo haqida yozsa — hazil qilma, qisqa va iliq qo'llab-quvvatla.
- Janjal yoki shaxsiy jiddiy suhbatga aralashma.
- Seni hech kim chaqirmagan bo'lsa va gap qo'shish o'rinsiz bo'lsa — "reply" ni bo'sh qoldir.
${g.rules ? "Admin ko'rsatmalari (bajar): " + clip(g.rules, 800) : ""}
${g.jokes ? "Guruhning hammaga ma'lum ichki hazillari (ishlatsang bo'ladi): " + clip(g.jokes, 800) : ""}
${g.vibe ? "Guruh muhiti haqida bilganlaring: " + clip(g.vibe, 1200) : "Guruhni hali yaxshi bilmaysan — ehtiyotkor bo'l."}
${UZ}`;
}
function peopleBlock(people: any[]) {
  return people.map((p) => {
    const parts = [`id ${p.user_id}: ${personName(p)}${p.username ? " @" + p.username : ""}`];
    if (p.optout) { parts.push("(/unut qilgan — shaxsiy gap otma)"); return parts.join(" "); }
    if (p.bio) parts.push(`bio: "${clip(p.bio, 140)}"`);
    if (p.ai_notes) parts.push(`kuzatuv: ${clip(p.ai_notes, 300)}`);
    if (p.public_notes) parts.push(`ochiq hazil (ishlatish mumkin): ${clip(p.public_notes, 240)}`);
    if (p.secret_notes) parts.push(`MAXFIY (aytma!): ${clip(p.secret_notes, 300)}`);
    return parts.join(" · ");
  }).join("\n");
}
async function refreshBios(people: any[]) {
  const stale = people.filter((p) => !p.optout && (!p.bio_at || Date.now() - Date.parse(p.bio_at) > 7 * 86400_000)).slice(0, 3);
  for (const p of stale) {
    const r = await tg("getChat", { chat_id: p.user_id });
    const bio = r.ok ? clip(r.result.bio, 200) || null : p.bio ?? null;
    await db.from("wd_tg_people").update({ bio, bio_at: nowIso() }).eq("user_id", p.user_id);
    p.bio = bio;
  }
}
async function recentHistory(chatId: number, n: number) {
  const { data } = await db.from("wd_tg_msgs").select("msg_id,user_id,name,text,is_bot,created_at").eq("chat_id", chatId).order("id", { ascending: false }).limit(n);
  return (data ?? []).reverse();
}
const histLine = (x: any) => `[${x.msg_id ?? "-"}] ${x.is_bot ? "Drop (sen)" : `${x.name} (id ${x.user_id})`}: ${clip(x.text, 400)}`;

async function groupReply(g: any, m: any, p: any, addressed: boolean, voice: boolean) {
  const hist = await recentHistory(g.chat_id, 30);
  const ids = [...new Set(hist.map((x: any) => x.user_id).filter(Boolean))].slice(0, 25);
  const { data: people } = await db.from("wd_tg_people").select("*").in("user_id", ids.length ? ids : [0]);
  await refreshBios(people ?? []);
  const a = await groq(personaPrompt(g, g.humor),
    `Guruh: ${g.title}\nA'zolar haqida:\n${peopleBlock(people ?? [])}\n\nOxirgi xabarlar:\n${hist.map(histLine).join("\n")}\n\n` +
    (addressed ? `Seni ${fromName(m.from)} chaqirdi (xabar ${m.message_id}${voice ? ", ovozli xabardan matn" : ""}). Albatta javob ber.` : `Hech kim chaqirmadi. Gap qo'shish o'rinli va qiziq bo'lsagina yoz, aks holda reply bo'sh.`) +
    `\nJSON: {"reply":"...","reply_to":xabar_raqami_yoki_null}`, 450, g.humor === 2 ? 0.95 : 0.8);
  const reply = clip(a?.reply, 1500).replace(/<[^>]+>/g, "");
  if (!reply) return;
  const replyTo = addressed ? m.message_id : (Number(a?.reply_to) || null);
  await tg("sendChatAction", { chat_id: g.chat_id, action: "typing" });
  await sleep(Math.min(2500, 600 + reply.length * 15));
  const r = await tg("sendMessage", { chat_id: g.chat_id, text: reply, ...(replyTo ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {}) });
  if (!r.ok) { if (r.error_code === 403) await db.from("wd_tg_groups").update({ status: "left" }).eq("chat_id", g.chat_id); return; }
  const day = tz().day;
  await db.from("wd_tg_msgs").insert({ chat_id: g.chat_id, msg_id: r.result.message_id, user_id: (await me()).id, name: "Drop", text: reply, is_bot: true, reply_to: replyTo });
  await db.from("wd_tg_groups").update({ used_day: day, used: (g.used_day === day ? g.used : 0) + 1, since_bot: 0, last_bot_at: nowIso() }).eq("chat_id", g.chat_id);
}

/* ───────── O'rganish: guruh muhiti va a'zolar portreti ───────── */
const LEARN_SYS = `Sen Telegram guruhini kuzatib, uning muhitini tushunadigan yordamchisan. ${UZ}
Vazifa: berilgan xabarlardan (va avvalgi xulosadan) yangilangan xulosa yoz.
"vibe": guruh muhiti 4-8 jumlada — asosiy mavzular, ohang, til aralashmasi, ichki hazillar va iboralar, kim kim bilan qanday munosabatda, guruh nima uchun mavjud.
"people": har bir faol a'zo uchun 1-3 jumlalik portret — qiziqishlari, gapirish uslubi, guruhdagi roli, ingliz tili darajasi taxmini (agar ko'rinsa), unga qanday hazil yoqishi. Avvalgi portret bilan birlashtir, eskisini yo'qotma.
YOZMA: sog'liq, din, siyosiy qarash, oila muammolari, manzil, telefon, pul — bunday ma'lumotni portretga kiritma.
JSON: {"vibe":"...","people":[{"id":123,"notes":"..."}]}`;
async function learnFrom(g: any, lines: string[], people: any[]) {
  const prev = people.filter((p) => !p.optout).map((p) => `id ${p.user_id} (${personName(p)}): ${clip(p.ai_notes, 300) || "—"}`).join("\n");
  const a = await groq(LEARN_SYS, `Guruh: ${g.title}\nAvvalgi muhit xulosasi: ${clip(g.vibe, 1500) || "yo'q"}\nAvvalgi portretlar:\n${prev || "yo'q"}\n\nXabarlar:\n${lines.join("\n")}`, 1800, 0.4);
  if (!a?.vibe) return null;
  const optout = new Set(people.filter((p) => p.optout).map((p) => Number(p.user_id)));
  const known = new Set(people.map((p) => Number(p.user_id)));
  for (const x of Array.isArray(a.people) ? a.people.slice(0, 40) : []) {
    const id = Number(x?.id); if (!id || optout.has(id) || !known.has(id)) continue;
    await db.from("wd_tg_people").update({ ai_notes: clip(x.notes, 600), updated_at: nowIso() }).eq("user_id", id);
  }
  await db.from("wd_tg_groups").update({ vibe: clip(a.vibe, 2000), new_msgs: 0, learned_at: nowIso(), updated_at: nowIso() }).eq("chat_id", g.chat_id);
  return a;
}
async function learnGroup(chatId: number) {
  const { data: g } = await db.from("wd_tg_groups").select("*").eq("chat_id", chatId).maybeSingle();
  if (!g) return null;
  await db.from("wd_tg_groups").update({ new_msgs: 0 }).eq("chat_id", chatId);   // parallel qayta ishga tushmasin
  const hist = await recentHistory(chatId, 120);
  const ids = [...new Set(hist.map((x: any) => x.user_id).filter(Boolean))];
  const { data: people } = await db.from("wd_tg_people").select("*").in("user_id", ids.length ? ids : [0]);
  return learnFrom(g, hist.map(histLine), people ?? []);
}

/* Telegram Desktop eksport fayli (ilovada o'qilib, qisqartirilgan holda keladi) */
async function runImport(chatId: number, lines: { uid: number; name: string; text: string }[]) {
  const key = "import:" + chatId;
  const { data: g } = await db.from("wd_tg_groups").select("*").eq("chat_id", chatId).maybeSingle();
  if (!g) return;
  // Odamlar va a'zolik
  const names = new Map<number, string>();
  for (const l of lines) if (l.uid && !names.has(l.uid)) names.set(l.uid, l.name);
  const ids = [...names.keys()];
  const { data: existing } = await db.from("wd_tg_people").select("user_id").in("user_id", ids.length ? ids : [0]);
  const have = new Set((existing ?? []).map((r: any) => Number(r.user_id)));
  const fresh = ids.filter((id) => !have.has(id)).map((id) => ({ user_id: id, first_name: clip(names.get(id), 64), last_seen: nowIso() }));
  if (fresh.length) await db.from("wd_tg_people").insert(fresh);
  if (ids.length) await db.from("wd_tg_members").upsert(ids.map((id) => ({ chat_id: chatId, user_id: id })), { onConflict: "chat_id,user_id", ignoreDuplicates: true });
  // Bo'laklab o'rganamiz (har biri ~10 ming belgi), eng oxirgi xabarlar ustuvor
  const all = lines.map((l) => `${l.name} (id ${l.uid}): ${clip(l.text, 220)}`);
  const chunks: string[][] = []; let cur: string[] = [], size = 0;
  for (const s of all) { if (size + s.length > 10000 && cur.length) { chunks.push(cur); cur = []; size = 0; } cur.push(s); size += s.length + 1; }
  if (cur.length) chunks.push(cur);
  const use = chunks.slice(-5); let done = 0;
  await kvSet(key, { state: "run", done, total: use.length, at: Date.now() });
  let gg = g;
  for (const ch of use) {
    const { data: people } = await db.from("wd_tg_people").select("*").in("user_id", ids.length ? ids : [0]);
    const r = await learnFrom(gg, ch, people ?? []);
    done++;
    if (r) gg = { ...gg, vibe: r.vibe };
    await kvSet(key, { state: done < use.length ? "run" : "done", done, total: use.length, ok: !!r, at: Date.now() });
    if (!r) await sleep(8000);
  }
}

/* ───────── Guruh viktorinasi ───────── */
async function sendGroupQuiz(chatId: number) {
  const w = await randomWord(Math.floor(Math.random() * 1e9));
  if (!w) return;
  const opts = [...(await distractors(w)), w.uz].sort(() => Math.random() - .5);
  const correct = opts.indexOf(w.uz);
  return send(chatId, `🎯 <b>Kim birinchi topadi?</b>\n\n<b>${esc(w.en)}</b>${w.ipa ? ` <i>${esc(w.ipa)}</i>` : ""}`,
    { reply_markup: { inline_keyboard: opts.map((o, i) => [{ text: o, callback_data: `a:${w.id}:${i}:${correct}` }]) } });
}
async function groupCb(cq: any) {
  const data = String(cq.data || ""); const chatId = cq.message.chat.id;
  if (data === "q") { tg("answerCallbackQuery", { callback_query_id: cq.id }); return sendGroupQuiz(chatId); }
  if (!data.startsWith("a:")) return tg("answerCallbackQuery", { callback_query_id: cq.id });
  const [, wid, pick, corr] = data.split(":");
  if (pick !== corr) return tg("answerCallbackQuery", { callback_query_id: cq.id, text: "❌ Yo'q, yana urinib ko'ring!" });
  tg("answerCallbackQuery", { callback_query_id: cq.id, text: "✅ To'g'ri!" });
  const { data: w } = await db.from("word_translations").select("en,uz,ipa,ex").eq("id", Number(wid)).maybeSingle();
  return tg("editMessageText", { chat_id: chatId, message_id: cq.message.message_id, parse_mode: "HTML",
    text: `🏆 <b>${esc(fromName(cq.from))}</b> birinchi topdi!\n\n<b>${esc(w?.en)}</b>${w?.ipa ? ` <i>${esc(w.ipa)}</i>` : ""} — ${esc(w?.uz)}${w?.ex ? `\n▸ ${esc(w.ex)}` : ""}`,
    reply_markup: { inline_keyboard: [[{ text: "Yana bitta ➜", callback_data: "q" }]] } });
}

/* ═════════════════ OVOZ (Groq Whisper) ═════════════════ */
async function transcribe(fileId: string): Promise<{ text: string; lang: string } | null> {
  if (!GROQ || !BOT_TOKEN) return null;
  const f = await tg("getFile", { file_id: fileId }); if (!f.ok) return null;
  const audio = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.result.file_path}`);
  if (!audio.ok) return null;
  const blob = await audio.blob();
  for (const model of ["whisper-large-v3-turbo", "whisper-large-v3"]) {
    const fd = new FormData();
    fd.append("file", blob, (f.result.file_path.split("/").pop() || "voice.ogg").replace(/\.oga$/, ".ogg"));
    fd.append("model", model); fd.append("response_format", "verbose_json"); fd.append("temperature", "0");
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${GROQ}` }, body: fd });
    if (!r.ok) { console.error("[whisper]", model, r.status, (await r.text()).slice(0, 200)); continue; }
    const j = await r.json(); return { text: String(j.text || "").trim(), lang: String(j.language || "") };
  }
  return null;
}
async function dmGate(chat: any): Promise<string | null> {
  const conf = await cfg();
  if (conf.dm === "none") return "Drop hozir shaxsiy suhbatlarga javob bermayapti. Kun so'zi va viktorina menyuda 👇";
  if (conf.dm === "linked" && !chat.user_id) return "Drop AI bilan suhbatlashish uchun WordDrop hisobingizni ulang: ilovada Profil → Telegram.";
  return null;
}
async function privateVoice(chat: any, m: any) {
  const gate = await dmGate(chat); if (gate) return send(chat.chat_id, gate, { reply_markup: KB_MAIN });
  const v = m.voice || m.audio || m.video_note;
  if ((v.duration || 0) > 120) return send(chat.chat_id, "Ovozli xabar 2 daqiqadan oshmasin 🙂");
  const q = await askAllowed(chat);
  if (!q.ok) return send(chat.chat_id, chat.user_id ? "Bugungi 20 ta so'rov tugadi. Ertaga davom etamiz 🌙" : "Bugungi 3 ta bepul so'rov tugadi. Hisobingizni ulasangiz — kuniga 20 ta.", { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop", web_app: { url: APP_URL } }]] } });
  await tg("sendChatAction", { chat_id: chat.chat_id, action: "typing" });
  const t = await transcribe(v.file_id);
  if (!t?.text) return send(chat.chat_id, "Ovozni tushuna olmadim. Tinchroq joyda, aniqroq qilib qayta yuboring.");
  const s = chat.user_id ? await userSummary(chat.user_id) : null;
  const a = await groq(
    `Sen "Drop" — WordDrop'ning Speaking murabbiyisan. O'quvchi ovozli xabar yubordi, quyida uning matni (Whisper, til: ${t.lang || "?"}). ${UZ}
Agar o'quvchi inglizcha gapirgan bo'lsa: grammatika va so'z tanlovini tekshir, yumshoq tuzat, tabiiyroq variant ber, va suhbatni inglizcha davom ettir (savol bilan tugat).
Agar o'zbekcha (yoki boshqa tilda) gapirgan bo'lsa: savoliga o'zbekcha qisqa javob ber, oxirida inglizcha gapirib ko'rishga undab, bitta oddiy inglizcha savol ber.
${s ? `O'quvchi: ${s.name || "—"}, XP ${s.xp}.` : ""}
JSON: {"lang":"en|uz|other","heard":"matn (tinish belgilari bilan)","fixed":"to'g'rilangan inglizcha (faqat en, xato bo'lmasa bo'sh)","better":"tabiiyroq inglizcha variant (faqat en)","notes":["o'zbekcha 1-3 qisqa izoh xatolar haqida"],"score":0-100 (faqat en: ravonlik va to'g'rilik),"reply":"suhbatni davom ettiruvchi javob"}`,
    clip(t.text, 2000), 900, 0.5);
  if (!a) return send(chat.chat_id, "Hozir javob bera olmadim. Birozdan keyin qayta yuboring.");
  await askBump(chat);
  const en = a.lang === "en";
  const parts = [`🎙 <b>Eshitdim:</b> <i>${esc(clip(a.heard || t.text, 800))}</i>`];
  if (en && a.fixed && clip(a.fixed, 800).toLowerCase() !== clip(a.heard, 800).toLowerCase()) parts.push(`✍️ <b>To'g'ri:</b> ${esc(clip(a.fixed, 800))}`);
  if (en && a.better) parts.push(`✨ <b>Tabiiyroq:</b> ${esc(clip(a.better, 800))}`);
  if (en && Number.isFinite(Number(a.score))) parts.push(`📊 <b>Ravonlik:</b> ${Math.max(0, Math.min(100, Math.round(Number(a.score))))}/100`);
  const notes = (Array.isArray(a.notes) ? a.notes : []).slice(0, 3).map((x: unknown) => clip(x, 200)).filter(Boolean);
  if (en && notes.length) parts.push(notes.map((x: string) => "💡 " + esc(x)).join("\n"));
  if (a.reply) parts.push(`💬 ${esc(clip(a.reply, 1200))}`);
  return send(chat.chat_id, parts.join("\n\n"));
}

/* ═════════════════ BOTDAGI ADMIN PANELI (/admin) ═════════════════ */
async function panel(chatId: number, msgId: number | null, text: string, rows: any[][]) {
  const extra = { parse_mode: "HTML", disable_web_page_preview: true, reply_markup: { inline_keyboard: rows } };
  if (msgId) { const r = await tg("editMessageText", { chat_id: chatId, message_id: msgId, text, ...extra }); if (r.ok || String(r.description || "").includes("not modified")) return r; }
  return tg("sendMessage", { chat_id: chatId, text, ...extra });
}
const dot = (on: boolean) => (on ? "• " : "");
async function adminPanel(chatId: number, fromId: number, msgId: number | null = null) {
  if (!(await tgIsAdmin(fromId))) return send(chatId, "Bu buyruq faqat WordDrop admini uchun. (Admin hisobingiz botga ulangan bo'lishi kerak: ilovada Profil → Telegram.)");
  const conf = await cfg(); const B = await me();
  const { data: gs } = await db.from("wd_tg_groups").select("status").neq("status", "left");
  const on = (gs ?? []).filter((x: any) => x.status === "on").length, pend = (gs ?? []).filter((x: any) => x.status === "pending").length;
  const { count: users } = await db.from("wd_tg_chats").select("chat_id", { count: "exact", head: true }).eq("active", true);
  const text = `🤖 <b>Drop boshqaruvi</b>\n\n👥 Guruhlar: <b>${on}</b> faol${pend ? `, <b>${pend}</b> ruxsat kutmoqda` : ""}\n💬 Shaxsiy chatlar: <b>${users ?? 0}</b>\n` +
    `🗣 Shaxsiy xabarlarga javob: <b>${{ all: "hammaga", linked: "faqat ulanganlarga", none: "hech kimga" }[conf.dm] ?? conf.dm}</b>\n` +
    `✅ Yangi guruhlar: <b>${conf.approve_groups ? "siz ruxsat berasiz" : "darhol ishlaydi"}</b>\n` +
    (B.can_read ? "" : `\n⚠️ <b>Privacy mode yoqilgan</b> — bot guruhlarda faqat buyruqlarni ko'radi. @BotFather → /setprivacy → @${esc(B.username)} → <b>Disable</b>, so'ng botni guruhdan chiqarib qayta qo'shing.\n`);
  return panel(chatId, msgId, text, [
    [{ text: `👥 Guruhlar (${on + pend})`, callback_data: "AG" }],
    [{ text: dot(conf.dm === "all") + "Hammaga", callback_data: "Ad:all" }, { text: dot(conf.dm === "linked") + "Ulanganlarga", callback_data: "Ad:linked" }, { text: dot(conf.dm === "none") + "Hech kimga", callback_data: "Ad:none" }],
    [{ text: `${conf.approve_groups ? "✅" : "⬜️"} Yangi guruhlarni men tasdiqlayman`, callback_data: "Aa" }],
    [{ text: "📱 Ilovada boshqarish", web_app: { url: APP_URL + "#bot" } }],
  ]);
}
async function groupPanel(chatId: number, msgId: number | null, gid: number) {
  const { data: g } = await db.from("wd_tg_groups").select("*").eq("chat_id", gid).maybeSingle();
  if (!g) return panel(chatId, msgId, "Guruh topilmadi.", [[{ text: "⬅️ Guruhlar", callback_data: "AG" }]]);
  const { count: mem } = await db.from("wd_tg_members").select("user_id", { count: "exact", head: true }).eq("chat_id", gid);
  const day = tz().day; const used = g.used_day === day ? g.used : 0;
  const muted = g.muted_until && Date.parse(g.muted_until) > Date.now();
  const st = { on: "🟢 faol", off: "⚪️ o'chirilgan", pending: "🟡 ruxsat kutmoqda", left: "🚪 chiqib ketgan" }[g.status as string] ?? g.status;
  const text = `👥 <b>${esc(g.title)}</b>\n${st}${muted ? " · 🔇 jim" : ""}\n\nRejim: <b>${MODE_LBL[g.mode]}</b> · Hazil: <b>${HUMOR_LBL[g.humor]}</b>\nBugun: <b>${used}/${g.daily_limit}</b> javob · A'zolar: <b>${mem ?? 0}</b> · Xabarlar: ${g.total_msgs}\n` +
    (g.vibe ? `\n🧠 <i>${esc(clip(g.vibe, 420))}${String(g.vibe).length > 420 ? "…" : ""}</i>` : "\n🧠 Hali o'rganilmagan.");
  const G = gid;
  return panel(chatId, msgId, text, [
    g.status === "on" ? [{ text: "⚪️ O'chirish", callback_data: `Ags:${G}:off` }] : [{ text: "🟢 Yoqish", callback_data: `Ags:${G}:on` }],
    ["mention", "smart", "active"].map((k) => ({ text: dot(g.mode === k) + MODE_LBL[k], callback_data: `Agm:${G}:${k}` })),
    [0, 1, 2].map((k) => ({ text: dot(g.humor === k) + HUMOR_LBL[k], callback_data: `Agh:${G}:${k}` })),
    [20, 50, 100, 200].map((k) => ({ text: dot(g.daily_limit === k) + k + "/kun", callback_data: `Agl:${G}:${k}` })),
    [muted ? { text: "🔊 Gapirsin", callback_data: `Agq:${G}:0` } : { text: "🔇 1 soat jim", callback_data: `Agq:${G}:1` }, { text: "🔄 Hozir o'rgan", callback_data: `Agx:${G}` }],
    [{ text: "👤 A'zolar", callback_data: `Agp:${G}:0` }, { text: "📝 Ko'rsatma", callback_data: `Agr:${G}` }, { text: "😂 Ichki hazillar", callback_data: `Agj:${G}` }],
    [{ text: "🚪 Guruhdan chiqish", callback_data: `Agk:${G}` }, { text: "⬅️ Guruhlar", callback_data: "AG" }],
  ]);
}
async function personPanel(chatId: number, msgId: number | null, gid: number, uid: number) {
  const { data: p } = await db.from("wd_tg_people").select("*").eq("user_id", uid).maybeSingle();
  if (!p) return panel(chatId, msgId, "Topilmadi.", [[{ text: "⬅️", callback_data: `Agp:${gid}:0` }]]);
  const text = `👤 <b>${esc(personName(p))}</b>${p.username ? " @" + esc(p.username) : ""}\n${p.ignore ? "🙈 Bot javob bermaydi\n" : ""}${p.optout ? "🚫 /unut qilgan\n" : ""}Xabarlar: ${p.msg_count}\n` +
    (p.bio ? `\n📇 Bio: <i>${esc(p.bio)}</i>` : "") +
    `\n\n🧠 <b>Drop kuzatuvi:</b> ${esc(clip(p.ai_notes, 600)) || "—"}` +
    `\n🔒 <b>Yashirin eslatma:</b> ${esc(clip(p.secret_notes, 400)) || "—"}` +
    `\n📣 <b>Ochiq hazil:</b> ${esc(clip(p.public_notes, 400)) || "—"}`;
  return panel(chatId, msgId, text, [
    [{ text: p.ignore ? "🗣 Javob bersin" : "🙈 Javob bermasin", callback_data: `Api:${gid}:${uid}` }],
    [{ text: "🔒 Yashirin eslatma", callback_data: `Aps:${gid}:${uid}` }, { text: "📣 Ochiq hazil", callback_data: `Apo:${gid}:${uid}` }],
    [{ text: "🧹 Kuzatuvni tozalash", callback_data: `Apc:${gid}:${uid}` }, { text: "⬅️ A'zolar", callback_data: `Agp:${gid}:0` }],
  ]);
}
async function adminCb(cq: any) {
  const chatId = cq.message?.chat?.id; const msgId = cq.message?.message_id; const d = String(cq.data);
  if (!(await tgIsAdmin(cq.from.id))) return tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Faqat admin uchun", show_alert: true });
  tg("answerCallbackQuery", { callback_query_id: cq.id });
  const [k, a, b] = d.split(":"); const gid = Number(a), uid = Number(b);
  const setG = (patch: any) => db.from("wd_tg_groups").update({ ...patch, updated_at: nowIso() }).eq("chat_id", gid);
  const ask = async (kind: string, prompt: string) => {
    await kvSet("await:" + chatId, { kind, gid, uid, at: Date.now() });
    return send(chatId, prompt + "\n\n<i>Matnni shu yerga yozing. O'chirish uchun «-» yuboring. Bekor qilish: /admin</i>");
  };
  switch (k) {
    case "A": return adminPanel(chatId, cq.from.id, msgId);
    case "Ad": { const c = await cfg(); await kvSet("bot_cfg", { ...c, dm: a }); return adminPanel(chatId, cq.from.id, msgId); }
    case "Aa": { const c = await cfg(); await kvSet("bot_cfg", { ...c, approve_groups: !c.approve_groups }); return adminPanel(chatId, cq.from.id, msgId); }
    case "AG": {
      const { data: gs } = await db.from("wd_tg_groups").select("chat_id,title,status").neq("status", "left").order("updated_at", { ascending: false }).limit(30);
      const ic: Record<string, string> = { on: "🟢", off: "⚪️", pending: "🟡" };
      return panel(chatId, msgId, gs?.length ? "👥 <b>Guruhlar</b>\nSozlash uchun tanlang:" : "👥 Bot hali hech qaysi guruhda yo'q.\n\nGuruh sozlamalari → A'zo qo'shish → @" + esc((await me()).username),
        [...(gs ?? []).map((g: any) => [{ text: `${ic[g.status] ?? ""} ${clip(g.title, 40)}`, callback_data: `Ag:${g.chat_id}` }]), [{ text: "⬅️ Boshqaruv", callback_data: "A" }]]);
    }
    case "Ag": return groupPanel(chatId, msgId, gid);
    case "Ags": {
      const { data: g } = await db.from("wd_tg_groups").select("status").eq("chat_id", gid).maybeSingle();
      await setG({ status: b === "on" ? "on" : "off" });
      if (b === "on" && g?.status === "pending") await groupHello(gid, "on");
      return groupPanel(chatId, msgId, gid);
    }
    case "Agm": await setG({ mode: b }); return groupPanel(chatId, msgId, gid);
    case "Agh": await setG({ humor: Number(b) }); return groupPanel(chatId, msgId, gid);
    case "Agl": await setG({ daily_limit: Number(b) }); return groupPanel(chatId, msgId, gid);
    case "Agq": await setG({ muted_until: b === "1" ? new Date(Date.now() + 3600_000).toISOString() : null }); return groupPanel(chatId, msgId, gid);
    case "Agx": {
      await panel(chatId, msgId, "🧠 Drop guruhni o'rganmoqda…", []);
      const r = await learnGroup(gid);
      if (!r) await send(chatId, "Hozircha o'rganish uchun xabarlar kam yoki AI javob bermadi.");
      return groupPanel(chatId, null, gid);
    }
    case "Agr": return ask("rules", "📝 <b>Drop uchun ko'rsatma</b> — shu guruhda o'zini qanday tutsin? Masalan: «Hammaga sen deb murojaat qil, futbol haqida ko'p hazillash, ertalab motivatsiya ber».");
    case "Agj": return ask("jokes", "😂 <b>Guruhning ichki hazillari</b> — hammaga ma'lum laqablar, voqealar. Drop ularni hazilida ishlatadi.");
    case "Agk": return panel(chatId, msgId, "🚪 Drop shu guruhdan chiqsinmi? Qayta qo'shish uchun guruhga yana qo'shasiz.", [[{ text: "Ha, chiqsin", callback_data: `Agk2:${gid}` }, { text: "Yo'q", callback_data: `Ag:${gid}` }]]);
    case "Agk2": await tg("leaveChat", { chat_id: gid }); await setG({ status: "left" }); return panel(chatId, msgId, "Drop guruhdan chiqdi.", [[{ text: "⬅️ Guruhlar", callback_data: "AG" }]]);
    case "Agp": {
      const page = Number(b) || 0;
      const { data: ms } = await db.from("wd_tg_members").select("user_id,msg_count").eq("chat_id", gid).order("msg_count", { ascending: false }).range(page * 8, page * 8 + 8);
      const ids = (ms ?? []).slice(0, 8).map((x: any) => x.user_id);
      const { data: ps } = await db.from("wd_tg_people").select("user_id,first_name,last_name,username,ignore,optout,secret_notes,public_notes").in("user_id", ids.length ? ids : [0]);
      const byId = new Map((ps ?? []).map((p: any) => [Number(p.user_id), p]));
      const rows = ids.map((id: number) => { const p: any = byId.get(Number(id)) ?? {}; return [{ text: `${p.ignore ? "🙈 " : p.optout ? "🚫 " : ""}${clip(personName(p), 30)}${p.secret_notes || p.public_notes ? " ✍️" : ""}`, callback_data: `Ap:${gid}:${id}` }]; });
      const nav = []; if (page > 0) nav.push({ text: "◀️", callback_data: `Agp:${gid}:${page - 1}` }); if ((ms ?? []).length > 8) nav.push({ text: "▶️", callback_data: `Agp:${gid}:${page + 1}` });
      nav.push({ text: "⬅️ Guruh", callback_data: `Ag:${gid}` });
      return panel(chatId, msgId, ids.length ? "👤 <b>A'zolar</b> (eng faollari)\nTanlang — eslatma yozish yoki javobni o'chirish:" : "👤 Hali a'zolar ko'rinmadi — guruhda yozishgach paydo bo'ladi.", [...rows, nav]);
    }
    case "Ap": return personPanel(chatId, msgId, gid, uid);
    case "Api": { const { data: p } = await db.from("wd_tg_people").select("ignore").eq("user_id", uid).maybeSingle(); await db.from("wd_tg_people").update({ ignore: !p?.ignore }).eq("user_id", uid); return personPanel(chatId, msgId, gid, uid); }
    case "Apc": await db.from("wd_tg_people").update({ ai_notes: null }).eq("user_id", uid); return personPanel(chatId, msgId, gid, uid);
    case "Aps": return ask("secret", "🔒 <b>Yashirin eslatma</b> — Drop bu odamni yaxshiroq tushunishi uchun. Guruhda hech qachon aytilmaydi.");
    case "Apo": return ask("public", "📣 <b>Ochiq hazil</b> — guruhda hammaga ma'lum narsa (laqab, mashhur voqea). Drop hazilida ishlatishi mumkin.");
  }
}
/* Admin keyingi xabarda eslatma/ko'rsatma matnini yuboradi */
async function adminAwait(chatId: number, fromId: number, text: string): Promise<boolean> {
  const w = await kv("await:" + chatId);
  if (!w || Date.now() - (w.at || 0) > 15 * 60_000) return false;
  await db.from("wd_tg_kv").delete().eq("key", "await:" + chatId);
  if (!(await tgIsAdmin(fromId))) return false;
  const val = text.trim() === "-" ? null : clip(text, 1500);
  if (w.kind === "rules" || w.kind === "jokes") { await db.from("wd_tg_groups").update({ [w.kind]: val, updated_at: nowIso() }).eq("chat_id", w.gid); await send(chatId, val ? "✅ Saqlandi." : "🗑 O'chirildi."); await groupPanel(chatId, null, w.gid); return true; }
  if (w.kind === "secret" || w.kind === "public") { await db.from("wd_tg_people").update({ [w.kind === "secret" ? "secret_notes" : "public_notes"]: val, updated_at: nowIso() }).eq("user_id", w.uid); await send(chatId, val ? "✅ Saqlandi." : "🗑 O'chirildi."); await personPanel(chatId, null, w.gid, w.uid); return true; }
  return false;
}

/* ═════════════════ TELEGRAM MINI APP: KIRISH ═════════════════ */
async function hmac(key: Uint8Array, msg: string) {
  const k = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
}
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
async function verifyInit(init: string): Promise<any | null> {
  const p = new URLSearchParams(init); const hash = p.get("hash"); if (!hash || !BOT_TOKEN) return null;
  p.delete("hash");
  const dcs = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = await hmac(new TextEncoder().encode("WebAppData"), BOT_TOKEN);
  if (hex(await hmac(secret, dcs)) !== hash) return null;
  if (Date.now() / 1000 - Number(p.get("auth_date") || 0) > 86400) return null;
  try { return JSON.parse(p.get("user") || "null"); } catch { return null; }
}
async function tgLogin(body: any) {
  const u = await verifyInit(String(body.init || ""));
  if (!u?.id) return json({ error: "Telegram ma'lumoti tasdiqlanmadi" }, 401);
  const { data: chat } = await db.from("wd_tg_chats").select("user_id").eq("chat_id", u.id).maybeSingle();
  let uid: string | null = chat?.user_id ?? null; let email = "";
  if (uid) {
    const { data } = await db.auth.admin.getUserById(uid);
    email = data?.user?.email ?? "";
    if (!email) { email = `tg${u.id}@tg.worddrop-app.uz`; await db.auth.admin.updateUserById(uid, { email, email_confirm: true }); }
  } else {
    email = `tg${u.id}@tg.worddrop-app.uz`;
    await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: { tg_id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(" "), via: "telegram" } });
  }
  const { data: link, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !link?.properties?.hashed_token) return json({ error: "Kirish havolasi yaratilmadi" }, 500);
  uid = link.user?.id ?? uid;
  if (uid && !chat?.user_id) {
    await db.from("wd_tg_chats").update({ user_id: null }).eq("user_id", uid);
    await db.from("wd_tg_chats").upsert({ chat_id: u.id, user_id: uid, username: u.username ?? null, first_name: u.first_name ?? null });
  }
  return json({ token_hash: link.properties.hashed_token, tg_id: u.id, name: u.first_name ?? "", fresh: !chat?.user_id });
}

/* ═════════════════ ILOVA: BOT BOSHQARUVI API (admin) ═════════════════ */
async function adminApi(action: string, body: any): Promise<Response | null> {
  const gid = Number(body.chat_id);
  switch (action) {
    case "bot_cfg": { const B = await me(); return json({ cfg: await cfg(), bot: B.username, can_read: B.can_read }); }
    case "bot_cfg_set": {
      const c = await cfg(); const n: any = { ...c };
      if (["all", "linked", "none"].includes(body.dm)) n.dm = body.dm;
      if (typeof body.approve_groups === "boolean") n.approve_groups = body.approve_groups;
      if ([0, 1, 2].includes(Number(body.humor))) n.humor = Number(body.humor);
      await kvSet("bot_cfg", n); return json({ ok: true, cfg: n });
    }
    case "groups": {
      ME = null; await db.from("wd_tg_kv").delete().eq("key", "me"); const B = await me();
      const { data } = await db.from("wd_tg_groups").select("chat_id,title,username,status,mode,humor,daily_limit,used,used_day,total_msgs,learned_at,muted_until").neq("status", "left").order("updated_at", { ascending: false });
      return json({ groups: data ?? [], can_read: B.can_read, bot: B.username });
    }
    case "group_get": {
      const { data: g } = await db.from("wd_tg_groups").select("*").eq("chat_id", gid).maybeSingle();
      if (!g) return json({ error: "Guruh topilmadi" }, 404);
      const { data: ms } = await db.from("wd_tg_members").select("user_id,msg_count,last_seen").eq("chat_id", gid).order("msg_count", { ascending: false }).limit(200);
      const ids = (ms ?? []).map((x: any) => x.user_id);
      const { data: ps } = await db.from("wd_tg_people").select("*").in("user_id", ids.length ? ids : [0]);
      const byId = new Map((ps ?? []).map((p: any) => [Number(p.user_id), p]));
      return json({ group: g, members: (ms ?? []).map((m: any) => ({ ...(byId.get(Number(m.user_id)) as any), msg_count_group: m.msg_count })), import: await kv("import:" + gid) });
    }
    case "group_set": {
      const P = body.patch ?? {}; const n: any = { updated_at: nowIso() };
      if (["on", "off"].includes(P.status)) n.status = P.status;
      if (["mention", "smart", "active"].includes(P.mode)) n.mode = P.mode;
      if ([0, 1, 2].includes(Number(P.humor)) && P.humor !== undefined) n.humor = Number(P.humor);
      if (P.daily_limit !== undefined) n.daily_limit = Math.max(0, Math.min(1000, Number(P.daily_limit) || 0));
      for (const k of ["quiet_from", "quiet_to"]) if (k in P) n[k] = P[k] === null || P[k] === "" ? null : Math.max(0, Math.min(23, Number(P[k])));
      if ("muted_until" in P) n.muted_until = P.muted_until || null;
      for (const k of ["vibe", "rules", "jokes"]) if (k in P) n[k] = P[k] ? clip(P[k], 2000) : null;
      const { data: old } = await db.from("wd_tg_groups").select("status").eq("chat_id", gid).maybeSingle();
      await db.from("wd_tg_groups").update(n).eq("chat_id", gid);
      if (n.status === "on" && old?.status === "pending") await groupHello(gid, "on");
      return json({ ok: true });
    }
    case "person_set": {
      const P = body.patch ?? {}; const n: any = { updated_at: nowIso() };
      for (const k of ["secret_notes", "public_notes", "ai_notes"]) if (k in P) n[k] = P[k] ? clip(P[k], 1500) : null;
      if (typeof P.ignore === "boolean") n.ignore = P.ignore;
      await db.from("wd_tg_people").update(n).eq("user_id", Number(body.user_id));
      return json({ ok: true });
    }
    case "group_learn": { const r = await learnGroup(gid); return r ? json({ ok: true }) : json({ error: "O'rganish uchun xabarlar kam yoki AI javob bermadi" }, 400); }
    case "group_import": {
      const lines = (Array.isArray(body.lines) ? body.lines : []).slice(-3000).map((l: any) => ({ uid: Number(l.uid) || 0, name: clip(l.name, 64) || "—", text: clip(l.text, 400) })).filter((l: any) => l.text);
      if (lines.length < 5) return json({ error: "Faylda yetarli xabar topilmadi" }, 400);
      const { data: g } = await db.from("wd_tg_groups").select("chat_id").eq("chat_id", gid).maybeSingle();
      if (!g) return json({ error: "Guruh topilmadi" }, 404);
      await kvSet("import:" + gid, { state: "run", done: 0, total: 1, at: Date.now() });
      bg(runImport(gid, lines));
      return json({ ok: true, lines: lines.length });
    }
    case "group_forget": {
      await db.from("wd_tg_msgs").delete().eq("chat_id", gid);
      await db.from("wd_tg_groups").update({ vibe: null, learned_at: null, new_msgs: 0 }).eq("chat_id", gid);
      return json({ ok: true });
    }
    case "group_leave": { await tg("leaveChat", { chat_id: gid }); await db.from("wd_tg_groups").update({ status: "left" }).eq("chat_id", gid); return json({ ok: true }); }
  }
  return null;
}

/* ───────── Kanal ───────── */
function publicUrl(path: string) { return `${SB_URL}/storage/v1/object/public/tg-posts/${path}`; }
async function publishPost(p: any): Promise<{ ok: boolean; error?: string; id?: number }> {
  const channel = await kv("channel");
  let r: any;
  if (p.image_path) r = await tg("sendPhoto", { chat_id: channel, photo: publicUrl(p.image_path), caption: clip(p.caption, 1024), parse_mode: "HTML" });
  else if (p.caption) r = await send(channel, clip(p.caption, 4096), { disable_web_page_preview: false });
  if (r && !r.ok) return { ok: false, error: r.description };
  if (p.poll && p.poll.question && Array.isArray(p.poll.options) && p.poll.options.length >= 2) {
    const pr = await tg("sendPoll", { chat_id: channel, question: clip(p.poll.question, 300), options: p.poll.options.slice(0, 10).map((o: string) => clip(o, 100)),
      type: "quiz", correct_option_id: Math.max(0, Math.min(p.poll.options.length - 1, Number(p.poll.correct) || 0)), explanation: clip(p.poll.explanation, 200) || undefined, is_anonymous: true });
    if (!pr.ok) return { ok: false, error: "So'rovnoma: " + pr.description };
    r = r ?? pr;
  }
  return { ok: true, id: r?.result?.message_id };
}
async function sendPostRow(p: any) {
  await db.from("wd_tg_posts").update({ status: "sending" }).eq("id", p.id);
  const res = await publishPost(p);
  await db.from("wd_tg_posts").update(res.ok
    ? { status: "sent", sent_at: new Date().toISOString(), tg_message_id: res.id ?? null, error: null, updated_at: new Date().toISOString() }
    : { status: "failed", error: clip(res.error, 400), updated_at: new Date().toISOString() }).eq("id", p.id);
  return res;
}

/* ───────── Botni sozlash (webhook, buyruqlar, tavsif) ───────── */
async function setupBot() {
  const r1 = await tg("setWebhook", { url: FN_URL, secret_token: await kv("webhook_secret"), allowed_updates: ["message", "callback_query", "my_chat_member"], drop_pending_updates: false });
  if (r1.ok) {
    await tg("setMyCommands", { scope: { type: "all_private_chats" }, commands: [
      { command: "word", description: "Kun so'zi" }, { command: "quiz", description: "Viktorina" },
      { command: "review", description: "Takrorim" }, { command: "top", description: "Reyting" },
      { command: "settings", description: "Eslatmalar" }, { command: "menu", description: "Menyu" } ] });
    await tg("setMyCommands", { scope: { type: "all_group_chats" }, commands: [
      { command: "quiz", description: "Guruh viktorinasi" }, { command: "word", description: "Kun so'zi" },
      { command: "unut", description: "Drop men haqimdagi xotirani o'chirsin" }, { command: "qayt", description: "Drop yana menga gapirsin" },
      { command: "jim", description: "Drop 1 soat jim tursin (adminlar)" }, { command: "gapir", description: "Drop yana gapirsin (adminlar)" } ] });
    await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "WordDrop", web_app: { url: APP_URL } } });
    ME = null; await db.from("wd_tg_kv").delete().eq("key", "me");
    await tg("setMyDescription", { description: "Drop — WordDrop'ning ingliz tili yordamchisi. Har kuni yangi so'z, viktorinalar, takror eslatmalari va savollaringizga javob." });
    await tg("setMyShortDescription", { short_description: "Kun so'zi, viktorina va Drop AI — WordDrop yordamchisi" });
    await kvSet("webhook_ok", true);
  }
  return r1;
}

/* ───────── Cron (har 5 daqiqa) ───────── */
async function cron() {
  const t = tz(); const log: Record<string, unknown> = { token: !!BOT_TOKEN };
  // 0) Bot kaliti qo'shilgach — webhook'ni bir marta avtomatik sozlaymiz
  if (BOT_TOKEN && !(await kv("webhook_ok"))) { const r = await setupBot(); log.setup = r.ok ? "ok" : String(r.description || "xato"); }
  // 1) Rejalashtirilgan kanal postlari
  const { data: due } = await db.from("wd_tg_posts").select("*").eq("status", "scheduled").lte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(5);
  for (const p of due ?? []) { await sendPostRow(p); log.posts = Number(log.posts || 0) + 1; }
  // 2) Avtopilot (kanal)
  const ap = await kv("autopilot") ?? {};
  const apDone = await kv("autopilot_done") ?? {};
  if (ap.word && t.hour === Number(ap.word_hour ?? 9) && apDone.word !== t.day) {
    const v = await wordOfDay(); if (v) await send(await kv("channel"), wodText(v) + `\n\n📱 <a href="${APP_URL}">WordDrop'da o'rganing</a>`);
    apDone.word = t.day; await kvSet("autopilot_done", apDone); log.ap_word = 1;
  }
  if (ap.quiz && t.hour === Number(ap.quiz_hour ?? 18) && apDone.quiz !== t.day) {
    const w = await randomWord(Math.floor(Math.random() * 1e9));
    if (w) { const opts = [...(await distractors(w)), w.uz].sort(() => Math.random() - .5);
      await tg("sendPoll", { chat_id: await kv("channel"), question: `"${w.en}" so'zining tarjimasi qaysi?`, options: opts, type: "quiz", correct_option_id: opts.indexOf(w.uz), explanation: w.ex ? clip(w.ex, 200) : undefined }); }
    apDone.quiz = t.day; await kvSet("autopilot_done", apDone); log.ap_quiz = 1;
  }
  // 3) Ertalabki Kun so'zi — 08:00 dan boshlab, har chatga kuniga bir marta (bir martada 200 ta)
  if (t.hour >= 8 && t.hour < 12) {
    const { data: rows } = await db.from("wd_tg_chats").select("chat_id").eq("active", true).eq("morning", true).or(`last_morning.is.null,last_morning.lt.${t.day}`).limit(200);
    if (rows?.length) {
      const v = await wordOfDay(); const txt = wodText(v ?? {});
      for (const r of rows) {
        const res = await send(r.chat_id, txt, { reply_markup: { inline_keyboard: [[{ text: "🎯 Viktorina", callback_data: "q" }, { text: "📱 O'rganish", url: APP_URL }]] } });
        await db.from("wd_tg_chats").update(res.ok ? { last_morning: t.day } : (res.error_code === 403 ? { active: false } : { last_morning: t.day })).eq("chat_id", r.chat_id);
        await sleep(40);
      }
      log.morning = rows.length;
    }
  }
  // 4) Kechki eslatma — tanlangan soatda, faqat ulangan hisoblarga
  const { data: ev } = await db.from("wd_tg_chats").select("chat_id,user_id").eq("active", true).eq("evening", true).not("user_id", "is", null).eq("remind_hour", t.hour).or(`last_evening.is.null,last_evening.lt.${t.day}`).limit(200);
  for (const r of ev ?? []) {
    const s = await userSummary(r.user_id);
    const activeToday = s.lastDay === t.dateStr;
    let msg = "";
    if (!activeToday && s.streak > 0) msg = `🔥 <b>${s.streak} kunlik seriyangiz bugun tugab qolishi mumkin!</b>\n\nBor-yo'g'i 5 daqiqa: ${s.due ? `${s.due} ta so'z takror kutmoqda.` : "bitta topshiriq bajaring."}`;
    else if (s.due > 0) msg = `🧠 <b>${s.due} ta so'z takror kutmoqda.</b>\n\nHozir takrorlasangiz, ular uzoqroq esda qoladi.`;
    if (msg) await send(r.chat_id, msg, { reply_markup: { inline_keyboard: [[{ text: "Takrorlashni boshlash", url: APP_URL }]] } });
    await db.from("wd_tg_chats").update({ last_evening: t.day }).eq("chat_id", r.chat_id);
    await sleep(40);
  }
  log.evening = ev?.length ?? 0;
  // 5) Eski ulash kodlari va guruh xabarlari (21 kundan eski) — tozalash
  await db.from("wd_tg_codes").delete().lt("created_at", new Date(Date.now() - 86400_000).toISOString());
  await db.from("wd_tg_msgs").delete().lt("created_at", new Date(Date.now() - 21 * 86400_000).toISOString());
  // 6) O'rganish navbati qolib ketgan guruhlar (bittadan)
  const { data: lg } = await db.from("wd_tg_groups").select("chat_id").eq("status", "on").gte("new_msgs", 40).limit(1);
  for (const r of lg ?? []) { await learnGroup(r.chat_id); log.learned = r.chat_id; }
  return log;
}

/* ───────── Autentifikatsiya ───────── */
async function authUser(req: Request) {
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!tok || tok.startsWith("sb_")) return null;
  const { data } = await db.auth.getUser(tok);
  return data?.user ?? null;
}
async function isAdmin(user: any) { const list: string[] = (await kv("admins")) ?? []; return !!user?.email && list.map((x) => x.toLowerCase()).includes(String(user.email).toLowerCase()); }

/* ───────── Admin: AI kontent rejasi ───────── */
async function plan(body: any) {
  const count = Math.max(1, Math.min(10, Number(body.count) || 5));
  const kinds = Array.isArray(body.kinds) && body.kinds.length ? body.kinds : ["word", "grammar", "quiz", "promo", "motivation"];
  const words: Word[] = [];
  for (let i = 0; i < count; i++) { const w = await randomWord(Math.floor(Math.random() * 1e9)); if (w) words.push(w); }
  const a = await groq(
    `Sen WordDrop (o'zbeklar uchun bepul ingliz tili ilovasi, worddrop-app.uz) Telegram kanalining kontent muharririsan. ${UZ}
${count} ta post tayyorla. Turlar (aralashtir): ${kinds.join(", ")}. Mavzu yoki istak: ${clip(body.theme, 300) || "umumiy"}.
Har post: kanal uchun jonli, foydali, qisqa. Emoji kam (1-3). Telegram HTML: faqat <b>, <i>. Oxirida ilovaga chaqiruv bo'lishi mumkin.
"card" — rasm uchun qisqa matnlar (rasm dasturda chiziladi): {"title":"rasm sarlavhasi (≤40 belgi)","big":"katta matn: so'z, qoida yoki raqam (≤28 belgi)","sub":"izoh (≤90 belgi)","lines":["2-4 qisqa qator (≤60 belgi)"],"cta":"chaqiruv (≤36 belgi)"}
"quiz" turida "poll": {"question":"...","options":["3-4 variant"],"correct":0,"explanation":"qisqa izoh"}
Agar "word" bo'lsa, quyidagi bazadagi so'zlardan foydalan: ${words.map((w) => `${w.en}=${w.uz}`).join(", ")}.
JSON: {"posts":[{"kind":"word|grammar|quiz|promo|motivation|tip","caption":"post matni (≤900 belgi)","card":{...},"poll":null|{...}}]}`,
    "Postlarni tayyorla.", 4000, 0.8);
  const posts = (Array.isArray(a?.posts) ? a.posts : []).slice(0, count).map((p: any) => ({
    kind: clip(p?.kind, 20) || "tip",
    caption: clip(p?.caption, 1000).replace(/<(?!\/?(b|i)>)[^>]*>/g, ""),
    card: { title: clip(p?.card?.title, 60), big: clip(p?.card?.big, 40), sub: clip(p?.card?.sub, 140), lines: (Array.isArray(p?.card?.lines) ? p.card.lines : []).slice(0, 4).map((x: unknown) => clip(x, 80)), cta: clip(p?.card?.cta, 50) },
    poll: p?.poll && p.poll.question && Array.isArray(p.poll.options) ? { question: clip(p.poll.question, 280), options: p.poll.options.slice(0, 4).map((x: unknown) => clip(x, 90)), correct: Number(p.poll.correct) || 0, explanation: clip(p.poll.explanation, 190) } : null,
  }));
  return posts;
}

/* ───────── Server ───────── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    // 1) Telegram webhook
    const tgSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (tgSecret !== null) {
      if (tgSecret !== (await kv("webhook_secret"))) return new Response("forbidden", { status: 403 });
      const u = await req.json().catch(() => null);
      if (u) { try { await onUpdate(u); } catch (e) { console.error("[update]", e); } }
      return new Response("ok");
    }
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    // 2) Cron
    if (action === "cron") {
      if (req.headers.get("x-cron-secret") !== (await kv("cron_secret"))) return json({ error: "forbidden" }, 403);
      return json({ ok: true, ...(await cron()) });
    }
    if (action === "tg_login") return await tgLogin(body);
    const user = await authUser(req);
    if (!user) return json({ error: "Avval WordDrop hisobingizga kiring" }, 401);

    // 3) Foydalanuvchi
    if (action === "link_code") {
      const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      await db.from("wd_tg_codes").insert({ code, user_id: user.id });
      const me = await tg("getMe", {});
      const bot = me?.result?.username || "WordDropUzBot";
      return json({ code, bot, url: `https://t.me/${bot}?start=${code}` });
    }
    if (action === "link_get") {
      const { data } = await db.from("wd_tg_chats").select("username,first_name,morning,evening,remind_hour,active,quiz_ok,quiz_total").eq("user_id", user.id).maybeSingle();
      return json({ linked: !!data, chat: data ?? null });
    }
    if (action === "link_prefs") {
      const p: any = {};
      if (typeof body.morning === "boolean") p.morning = body.morning;
      if (typeof body.evening === "boolean") p.evening = body.evening;
      if (body.remind_hour !== undefined) p.remind_hour = Math.max(0, Math.min(23, Number(body.remind_hour) || 20));
      await db.from("wd_tg_chats").update(p).eq("user_id", user.id);
      return json({ ok: true });
    }
    if (action === "unlink") {
      const { data } = await db.from("wd_tg_chats").select("chat_id").eq("user_id", user.id).maybeSingle();
      await db.from("wd_tg_chats").update({ user_id: null }).eq("user_id", user.id);
      if (data) await send(data.chat_id, "WordDrop hisobingiz bu chatdan uzildi. Kun so'zi va viktorina ishlashda davom etadi.");
      return json({ ok: true });
    }

    // 4) Admin
    if (!(await isAdmin(user))) return json({ error: "Ruxsat yo'q" }, 403);
    if (action === "status") {
      const channel = await kv("channel");
      const me = await tg("getMe", {});
      const wh = await tg("getWebhookInfo", {});
      let ch: any = null, member: any = null;
      if (me.ok) { ch = await tg("getChat", { chat_id: channel }); member = ch.ok ? await tg("getChatMember", { chat_id: channel, user_id: me.result.id }) : null; }
      const [{ count: chats }, { count: linked }, { count: queued }] = await Promise.all([
        db.from("wd_tg_chats").select("chat_id", { count: "exact", head: true }).eq("active", true),
        db.from("wd_tg_chats").select("chat_id", { count: "exact", head: true }).not("user_id", "is", null),
        db.from("wd_tg_posts").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      ]);
      let subs: number | null = null; if (ch?.ok) { const mc = await tg("getChatMemberCount", { chat_id: channel }); subs = mc.ok ? mc.result : null; }
      return json({
        token: !!BOT_TOKEN, bot: me.ok ? me.result.username : null, bot_error: me.ok ? null : me.description,
        webhook: wh.ok ? (wh.result.url === FN_URL) : false, webhook_error: wh.ok ? (wh.result.last_error_message || null) : null,
        channel, channel_title: ch?.ok ? ch.result.title : null, channel_error: ch && !ch.ok ? ch.description : null,
        can_post: !!(member?.ok && (member.result.status === "creator" || member.result.can_post_messages)), subs,
        chats: chats ?? 0, linked: linked ?? 0, queued: queued ?? 0, autopilot: await kv("autopilot"),
      });
    }
    if (action === "setup") {
      if (body.channel) { const c = clip(body.channel, 64); await kvSet("channel", /^-?\d+$/.test(c) ? Number(c) : (c.startsWith("@") ? c : "@" + c)); }
      const r1 = await setupBot();
      return json({ ok: !!r1.ok, error: r1.ok ? null : r1.description });
    }
    if (action === "autopilot") {
      const cur = (await kv("autopilot")) ?? {};
      const nx = { ...cur, ...(typeof body.word === "boolean" ? { word: body.word } : {}), ...(typeof body.quiz === "boolean" ? { quiz: body.quiz } : {}),
        ...(body.word_hour !== undefined ? { word_hour: Math.max(0, Math.min(23, Number(body.word_hour))) } : {}), ...(body.quiz_hour !== undefined ? { quiz_hour: Math.max(0, Math.min(23, Number(body.quiz_hour))) } : {}) };
      await kvSet("autopilot", nx); return json({ ok: true, autopilot: nx });
    }
    if (action === "posts") {
      const { data } = await db.from("wd_tg_posts").select("id,kind,status,caption,image_path,poll,scheduled_at,sent_at,error,created_at").order("created_at", { ascending: false }).limit(40);
      return json({ posts: (data ?? []).map((p: any) => ({ ...p, image_url: p.image_path ? publicUrl(p.image_path) : null })) });
    }
    if (action === "post_save") {
      let image_path: string | null = body.keep_image || null;
      if (typeof body.image === "string" && body.image.startsWith("data:image/png;base64,")) {
        const bin = Uint8Array.from(atob(body.image.split(",")[1]), (c) => c.charCodeAt(0));
        if (bin.length > 4_000_000) return json({ error: "Rasm juda katta" }, 400);
        image_path = `${tz().day}/${crypto.randomUUID()}.png`;
        const up = await db.storage.from("tg-posts").upload(image_path, bin, { contentType: "image/png", upsert: false });
        if (up.error) return json({ error: "Rasm yuklanmadi: " + up.error.message }, 500);
      }
      const row: any = { kind: clip(body.kind, 20) || "custom", caption: clip(body.caption, 4000), image_path, poll: body.poll ?? null, card: body.card ?? null,
        status: body.send_now ? "sending" : (body.scheduled_at ? "scheduled" : "draft"), scheduled_at: body.scheduled_at || null, created_by: user.id, updated_at: new Date().toISOString() };
      if (row.image_path && row.caption.length > 1024) return json({ error: "Rasmli post matni 1024 belgidan oshmasin" }, 400);
      let id = body.id;
      if (id) await db.from("wd_tg_posts").update(row).eq("id", id);
      else { const { data } = await db.from("wd_tg_posts").insert(row).select("id").single(); id = data?.id; }
      if (body.send_now) { const { data: p } = await db.from("wd_tg_posts").select("*").eq("id", id).single(); const res = await sendPostRow(p); return json({ ok: res.ok, id, error: res.error ?? null }); }
      return json({ ok: true, id });
    }
    if (action === "post_send") { const { data: p } = await db.from("wd_tg_posts").select("*").eq("id", body.id).single(); if (!p) return json({ error: "Topilmadi" }, 404); const r = await sendPostRow(p); return json({ ok: r.ok, error: r.error ?? null }); }
    if (action === "post_delete") {
      const { data: p } = await db.from("wd_tg_posts").select("image_path,status,tg_message_id").eq("id", body.id).maybeSingle();
      if (p?.status === "sent" && p.tg_message_id && body.from_channel) await tg("deleteMessage", { chat_id: await kv("channel"), message_id: p.tg_message_id });
      if (p?.image_path) await db.storage.from("tg-posts").remove([p.image_path]);
      await db.from("wd_tg_posts").delete().eq("id", body.id);
      return json({ ok: true });
    }
    { const r = await adminApi(action, body); if (r) return r; }
    if (action === "plan") { const posts = await plan(body); if (!posts.length) return json({ error: "Drop reja tuza olmadi, qayta urining" }, 502); return json({ posts }); }
    if (action === "test") {
      const { data } = await db.from("wd_tg_chats").select("chat_id").eq("user_id", user.id).maybeSingle();
      if (!data) return json({ error: "Avval o'z Telegram'ingizni ulang (Profil → Telegram)" }, 400);
      const r = await send(data.chat_id, "✅ Test: bot ishlayapti. " + wodText(await wordOfDay() ?? {}));
      return json({ ok: !!r.ok, error: r.ok ? null : r.description });
    }
    return json({ error: "Noma'lum amal" }, 400);
  } catch (e) {
    console.error("[tg-bot]", e);
    return json({ error: "Ichki xato" }, 500);
  }
});
