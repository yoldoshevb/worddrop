// Supabase Edge Function: tg-bot  (WordDrop v95)
// @WordDropUzBot — foydalanuvchilar bilan suhbat, kanal postlari va eslatmalar.
//
// Kirish yo'llari (bitta URL):
//   1) Telegram webhook   — sarlavha: x-telegram-bot-api-secret-token
//   2) Cron (pg_cron)     — sarlavha: x-cron-secret, body {action:"cron"}
//   3) Ilova (foydalanuvchi JWT) — body {action: link_code | link_get | link_prefs | unlink}
//   4) Admin (JWT + admins ro'yxati) — body {action: status | setup | posts | post_save | post_delete | post_send | plan | autopilot | test}
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
  [{ text: "⚙️ Sozlamalar", callback_data: "s" }, { text: "📱 WordDrop'ni ochish", url: APP_URL }],
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
  if (u.my_chat_member) {
    const st = u.my_chat_member.new_chat_member?.status; const cid = u.my_chat_member.chat?.id;
    if (cid && (st === "kicked" || st === "left")) await db.from("wd_tg_chats").update({ active: false }).eq("chat_id", cid);
    return;
  }
  if (u.callback_query) return onCallback(u.callback_query);
  const m = u.message; if (!m || !m.chat || m.chat.type !== "private") return;
  const chat = await upsertChat(m.from, m.chat.id); if (!chat) return;
  const text = String(m.text ?? "").trim();
  if (!text) return send(chat.chat_id, "Hozircha faqat matnli xabarlarni tushunaman. Inglizcha savolingizni yozing yoki menyudan tanlang.", { reply_markup: KB_MAIN });

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
  if (text === "/review") return onCallback({ data: "r", message: { chat: { id: chat.chat_id } }, id: "" });
  if (text === "/top") return onCallback({ data: "t", message: { chat: { id: chat.chat_id } }, id: "" });
  if (text === "/settings") return send(chat.chat_id, "⚙️ <b>Sozlamalar</b>\nEslatmalar Toshkent vaqti bo'yicha keladi.", { reply_markup: kbSettings(chat) });
  if (text === "/stop") { await db.from("wd_tg_chats").update({ morning: false, evening: false }).eq("chat_id", chat.chat_id); return send(chat.chat_id, "Eslatmalar o'chirildi. Qayta yoqish: /settings"); }
  if (text.startsWith("/")) return send(chat.chat_id, "Bunday buyruq yo'q. Menyu: /menu");

  // Oddiy matn → Drop AI
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
  if (cq.id) tg("answerCallbackQuery", { callback_query_id: cq.id });
  if (!chatId) return;
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
    await tg("setMyCommands", { commands: [
      { command: "word", description: "Kun so'zi" }, { command: "quiz", description: "Viktorina" },
      { command: "review", description: "Takrorim" }, { command: "top", description: "Reyting" },
      { command: "settings", description: "Eslatmalar" }, { command: "menu", description: "Menyu" } ] });
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
  // 5) Eski ulash kodlarini tozalash
  await db.from("wd_tg_codes").delete().lt("created_at", new Date(Date.now() - 86400_000).toISOString());
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
