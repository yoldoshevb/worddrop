// Supabase Edge Function: tg-v101  (WordDrop v101)
// Telegram webhook endi shu funksiyaga keladi. Yangi imkoniyatlarni shu yerning o'zida bajaradi,
// qolgan hamma yangilanishni (guruhlar, to'lovlar, admin, Drop AI…) o'zgartirmasdan tg-bot ga uzatadi.
//
// Yangi imkoniyatlar:
//   • Daraja testi chat ichida (/level, /start level, «📊 Darajamni aniqlash»), 16 savol, moslashuvchan;
//     natija wd_tg_chats.cefr, wd_placement va (hisob ulangan bo'lsa) wd_state.cefr ga yoziladi.
//   • Viktorina foydalanuvchi darajasiga mos so'zlardan.
//   • Do'st taklif qilish: t.me/WordDropUzBot?start=r_<uid> — yangi foydalanuvchi hisobini ulaganda ikkalasiga 7 kun Pro.
//   • /multilevel — Multilevel sinov imtihoni (ilovada #ml).
//   • Yangi asosiy menyu va buyruqlar ro'yxati (action: "setup", admin JWT yoki x-cron-secret).
//
// Sirlar: TELEGRAM_BOT_TOKEN (Supabase Secrets). webhook_secret / cron_secret — wd_tg_kv.
import { createClient } from "npm:@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const db = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const APP_URL = "https://www.worddrop-app.uz/app.html";
const OLD_URL = `${SB_URL}/functions/v1/tg-bot`;
const SELF_URL = `${SB_URL}/functions/v1/tg-v101`;
const BOT_NAME = "WordDropUzBot";
// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;
function bg(p: Promise<unknown>) { const q = p.catch((e) => console.error("[bg]", e)); try { EdgeRuntime.waitUntil(q); } catch { /* lokal */ } return q; }
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nowIso = () => new Date().toISOString();
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function tg(method: string, body: Record<string, unknown>): Promise<any> {
  if (!BOT_TOKEN) return { ok: false };
  for (let i = 0; i < 2; i++) {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false }));
    if (j.ok || j.error_code !== 429) return j;
    await new Promise((z) => setTimeout(z, Math.min(((j.parameters?.retry_after) || 1) * 1000, 5000)));
  }
  return { ok: false };
}
const send = (chat_id: number, text: string, extra: Record<string, unknown> = {}) => tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });
async function kv(key: string): Promise<any> { const { data } = await db.from("wd_tg_kv").select("val").eq("key", key).maybeSingle(); return data?.val ?? null; }
async function kvSet(key: string, val: unknown) { await db.from("wd_tg_kv").upsert({ key, val, updated_at: nowIso() }); }
let SECRET: string | null = null;
async function webhookSecret() { return SECRET ??= String(await kv("webhook_secret") ?? ""); }

/* ───────── Menyu (tg-bot dagidan kengaytirilgan) ───────── */
const KB_MAIN = { inline_keyboard: [
  [{ text: "☀️ Kun so'zi", callback_data: "w" }, { text: "🎯 Viktorina", callback_data: "q" }],
  [{ text: "🧠 Takrorim", callback_data: "r" }, { text: "🏆 Reyting", callback_data: "t" }],
  [{ text: "📊 Darajamni aniqlash", callback_data: "L" }, { text: "🎓 Multilevel", web_app: { url: APP_URL + "#ml" } }],
  [{ text: "⚙️ Sozlamalar", callback_data: "s" }, { text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }],
  [{ text: "⭐ WordDrop Pro", callback_data: "P" }, { text: "🎁 Do'st taklif qilish", callback_data: "I" }],
] };

/* ───────── Chat yozuvi ───────── */
async function getChat(from: any, chatId: number) {
  const { data } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) return data;
  await db.from("wd_tg_chats").insert({ chat_id: chatId, username: from?.username ?? null, first_name: from?.first_name ?? null });
  const { data: d2 } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
  return d2 ? { ...d2, _new: true } : null;
}

/* ───────── Viktorina (darajaga mos) ───────── */
const QUIZ_LV: Record<string, string[]> = { A1: ["A1", "A2"], A2: ["A1", "A2", "B1"], B1: ["A2", "B1", "B2"], B2: ["B1", "B2", "C1"], C1: ["B2", "C1", "C2"] };
async function sendQuiz(chatId: number, cefr: string) {
  const levels = QUIZ_LV[cefr];
  const { count } = await db.from("word_translations").select("id", { count: "exact", head: true }).in("level", levels).eq("verified", true);
  if (!count) return send(chatId, "Hozircha savol tayyor emas.");
  const off = Math.floor(Math.random() * count);
  const { data: wa } = await db.from("word_translations").select("id,en,uz,ipa,level").in("level", levels).eq("verified", true).order("id").range(off, off);
  const w = wa?.[0]; if (!w) return send(chatId, "Hozircha savol tayyor emas.");
  const { count: c2 } = await db.from("word_translations").select("id", { count: "exact", head: true }).eq("level", w.level).eq("verified", true);
  const o2 = Math.floor(Math.random() * Math.max(1, (c2 ?? 1) - 12));
  const { data: ds } = await db.from("word_translations").select("id,uz").eq("level", w.level).eq("verified", true).order("id").range(o2, o2 + 11);
  const opts: string[] = [];
  for (const x of (ds ?? []).sort(() => Math.random() - .5)) { if (opts.length >= 3) break; if (x.id !== w.id && x.uz && x.uz.toLowerCase() !== w.uz.toLowerCase() && !opts.includes(x.uz)) opts.push(x.uz); }
  opts.push(w.uz); opts.sort(() => Math.random() - .5);
  const correct = opts.indexOf(w.uz);
  // javob tugmalari "a:" formatida — tekshirishni tg-bot bajaradi
  return send(chatId, `🎯 <b>Tarjimasini toping</b>  <i>(${esc(w.level)})</i>\n\n<b>${esc(w.en)}</b>${w.ipa ? ` <i>${esc(w.ipa)}</i>` : ""}`,
    { reply_markup: { inline_keyboard: opts.map((o, i) => [{ text: o, callback_data: `a:${w.id}:${i}:${correct}` }]) } });
}

/* ───────── Daraja testi ───────── */
const PT_LV = ["A1", "A2", "B1", "B2", "C1"];
const PT_N = 16;
const PT_KIND: Record<string, string> = { grammar: "Grammatika", vocab: "Lug'at", reading: "Matn" };
const PT_INFO: Record<string, string> = {
  A1: "Boshlang'ich — oddiy so'z va iboralarni tushunasiz.", A2: "Elementar — kundalik vaziyatlarda qisqa gaplasha olasiz.",
  B1: "O'rta — tanish mavzularda erkin gaplashasiz.", B2: "O'rtadan yuqori — murakkab matnlarni tushunasiz.", C1: "Yuqori — erkin va aniq ifodalaysiz.",
};
let PT_BANK: any[] | null = null;
async function ptBank() { if (PT_BANK?.length) return PT_BANK; const { data } = await db.from("wd_placement_items").select("id,level,kind,q,opts,a").eq("active", true); PT_BANK = data ?? []; return PT_BANK; }
export function ptEstimate(hist: { l: string; ok: boolean }[]) {
  const by: Record<string, { n: number; ok: number }> = {};
  for (const h of hist) { (by[h.l] ??= { n: 0, ok: 0 }); by[h.l].n++; if (h.ok) by[h.l].ok++; }
  let best = 0; PT_LV.forEach((l, i) => { const x = by[l]; if (x && x.n >= 2 && x.ok / x.n >= 0.6) best = i; });
  return PT_LV[best];
}
function ptIntro(chat: any) {
  return send(chat.chat_id, `📊 <b>Daraja testi</b>\n\n${PT_N} ta savol, taxminan 5 daqiqa. Har javobingizdan keyin keyingi savol qiyinroq yoki osonroq bo'ladi. Bilmasangiz, taxmin qilmang — «Bilmayman» ni bosing.\n\nNatijaga ko'ra viktorinalar va ilovadagi darslar sizning darajangizdan boshlanadi.${chat.cefr ? `\n\nHozirgi darajangiz: <b>${esc(chat.cefr)}</b>` : ""}`,
    { reply_markup: { inline_keyboard: [[{ text: "▶️ Testni boshlash", callback_data: "Lg" }], [{ text: "Keyinroq", callback_data: "m" }]] } });
}
async function ptAsk(chat: any, st: any, msgId?: number) {
  const bank = await ptBank();
  let item: any = null; let idx = st.i;
  for (let d = 0; d < 5 && !item; d++) for (const j of [st.i + d, st.i - d]) {
    if (item || j < 0 || j >= PT_LV.length) continue;
    const cand = bank.filter((x) => x.level === PT_LV[j] && !st.used.includes(x.id));
    if (cand.length) { item = cand[Math.floor(Math.random() * cand.length)]; idx = j; }
  }
  if (!item) return ptFinish(chat, st, msgId);
  st.i = idx; st.cur = item.id; st.used.push(item.id); await kvSet("pt:" + chat.chat_id, st);
  const n = st.hist.length + 1, f = Math.round(n / PT_N * 10);
  const text = `<b>${n}/${PT_N}</b>  ${"▰".repeat(f)}${"▱".repeat(10 - f)}\n<i>${PT_KIND[item.kind] ?? ""}</i>\n\n${esc(item.q).replace(/___/g, "______")}`;
  const kb = { inline_keyboard: [...(item.opts as string[]).map((o, i) => [{ text: o, callback_data: `L:${item.id}:${i}` }]), [{ text: "🤷 Bilmayman", callback_data: `L:${item.id}:-1` }]] };
  return msgId ? tg("editMessageText", { chat_id: chat.chat_id, message_id: msgId, text, parse_mode: "HTML", reply_markup: kb }) : send(chat.chat_id, text, { reply_markup: kb });
}
function ptStart(chat: any, msgId?: number) {
  const i = Math.max(1, Math.min(2, PT_LV.indexOf(chat.cefr || "A2")));
  return ptAsk(chat, { i, hist: [], used: [], cur: 0, at: Date.now() }, msgId);
}
async function ptAnswer(chat: any, msgId: number | undefined, data: string) {
  const [, id, pick] = data.split(":");
  const st: any = await kv("pt:" + chat.chat_id);
  if (!st || Number(id) !== st.cur) return;   // eski tugma yoki ikki marta bosilgan
  const item = (await ptBank()).find((x) => x.id === Number(id)); if (!item) return;
  const ok = Number(pick) === item.a;
  st.hist.push({ l: item.level, k: item.kind, ok }); st.cur = 0;
  st.i = Math.max(0, Math.min(PT_LV.length - 1, st.i + (ok ? 1 : -1)));
  return st.hist.length >= PT_N ? ptFinish(chat, st, msgId) : ptAsk(chat, st, msgId);
}
async function ptFinish(chat: any, st: any, msgId?: number) {
  const level = ptEstimate(st.hist); const okN = st.hist.filter((h: any) => h.ok).length;
  await db.from("wd_tg_kv").delete().eq("key", "pt:" + chat.chat_id);
  await db.from("wd_tg_chats").update({ cefr: level }).eq("chat_id", chat.chat_id);
  await db.from("wd_placement").insert({ user_id: chat.user_id ?? null, tg_user: chat.chat_id, level, score: okN, answers: st.hist.length, source: "bot" });
  if (chat.user_id) await db.rpc("wd_set_cefr", { uid: chat.user_id, lvl: level });
  const k = PT_LV.indexOf(level);
  const ladder = PT_LV.map((l, i) => i === k ? `[<b>${l}</b>]` : i < k ? l : `<i>${l}</i>`).join(" ─ ");
  const sk = ["grammar", "vocab", "reading"].map((s) => { const h = st.hist.filter((x: any) => x.k === s); return h.length ? `${PT_KIND[s]} ${Math.round(h.filter((x: any) => x.ok).length / h.length * 100)}%` : ""; }).filter(Boolean).join("  ·  ");
  const text = `🎯 <b>Sizning darajangiz: ${level}</b>\n${PT_INFO[level]}\n\n${ladder}\n\n${sk}  (${okN}/${st.hist.length})\n\n${chat.user_id ? "✅ Ilovadagi darslar endi shu darajadan boshlanadi va siz o'sgan sari qiyinlashadi." : "WordDrop'ni shu yerdan oching — hisobingiz ulanadi va darslar ham shu darajadan boshlanadi."}`;
  const kb = { inline_keyboard: [[{ text: "📱 Darsni boshlash", web_app: { url: APP_URL } }], [{ text: "🎯 Viktorina", callback_data: "q" }, { text: "🔁 Qayta topshirish", callback_data: "Lg" }]] };
  return msgId ? tg("editMessageText", { chat_id: chat.chat_id, message_id: msgId, text, parse_mode: "HTML", reply_markup: kb }) : send(chat.chat_id, text, { reply_markup: kb });
}

/* ───────── Do'st taklif qilish ───────── */
const REF_DAYS = 7, REF_MAX = 10;
const refLink = (uid: string) => `https://t.me/${BOT_NAME}?start=r_${uid.replace(/-/g, "")}`;
const hexToUuid = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
async function addProDays(uid: string, days: number, tgUser?: number | null) {
  const { data: cur } = await db.from("wd_pro").select("until").eq("user_id", uid).maybeSingle();
  const until = new Date(Math.max(Date.now(), cur ? Date.parse(cur.until) || 0 : 0) + days * 86400_000).toISOString();
  if (cur) await db.from("wd_pro").update({ until, updated_at: nowIso() }).eq("user_id", uid);
  else await db.from("wd_pro").insert({ user_id: uid, until, plan: "referral", tg_user: tgUser ?? null, updated_at: nowIso() });
}
async function inviteMsg(chat: any) {
  if (!chat.user_id) return send(chat.chat_id, `🎁 Do'stingizni taklif qiling — ikkalangiz <b>${REF_DAYS} kun Pro</b> olasiz.\n\nAvval WordDrop'ni shu yerdan oching — hisobingiz Telegram orqali o'zi ulanadi. Keyin «Do'st taklif qilish» ni qayta bosing.`, { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }]] } });
  const { count } = await db.from("wd_referrals").select("id", { count: "exact", head: true }).eq("referrer", chat.user_id);
  const link = refLink(chat.user_id);
  const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`WordDrop'da ingliz tilini birga o'rganamiz! Shu havola orqali kirsang, ikkalamizga ${REF_DAYS} kun Pro beriladi 🎁`)}`;
  return send(chat.chat_id, `🎁 <b>Do'st taklif qilish</b>\n\nDo'stingiz havola orqali botga kirib, WordDrop'ni ochsa — <b>ikkalangizga ${REF_DAYS} kun Pro</b> qo'shiladi.\n\nSizning havolangiz:\n<code>${link}</code>\n\nTaklif qilganlaringiz: <b>${count ?? 0}</b> · mukofot ko'pi bilan ${REF_MAX} ta do'st uchun`, { reply_markup: { inline_keyboard: [[{ text: "📤 Do'stlarga yuborish", url: share }]] } });
}
async function onRefStart(chat: any, code: string, from: any) {
  const by = hexToUuid(code.slice(2));
  const { data: ok } = await db.from("wd_state").select("user_id").eq("user_id", by).maybeSingle();
  const hello = `Salom${from?.first_name ? ", " + esc(from.first_name) : ""}! 💧 Men <b>Drop</b> — WordDrop yordamchisiman.`;
  if (!ok || by === chat.user_id) { await send(chat.chat_id, hello, { reply_markup: KB_MAIN }); return chat.cefr ? null : ptIntro(chat); }
  if (chat._new) await db.from("wd_tg_chats").update({ ref_by: by }).eq("chat_id", chat.chat_id);
  await send(chat.chat_id, `${hello}\nSizni do'stingiz taklif qildi.\n\n${chat._new ? `🎁 WordDrop'ni ochsangiz, sizga va do'stingizga <b>${REF_DAYS} kun Pro</b> beriladi.` : "Taklif bonusi faqat botga birinchi marta kirganlarga beriladi."}`, { reply_markup: KB_MAIN });
  if (!chat.cefr) await ptIntro(chat);
}
async function claimRef(chatId: number) {
  const { data: chat } = await db.from("wd_tg_chats").select("chat_id,user_id,ref_by,ref_claimed").eq("chat_id", chatId).maybeSingle();
  if (!chat?.user_id || !chat.ref_by || chat.ref_claimed) return;
  await db.from("wd_tg_chats").update({ ref_claimed: true }).eq("chat_id", chatId);
  if (chat.ref_by === chat.user_id) return;
  const { error } = await db.from("wd_referrals").insert({ referrer: chat.ref_by, invitee: chat.user_id, tg_chat: chatId, days: REF_DAYS });
  if (error) return;   // bu hisob avval ham taklif orqali kelgan
  await addProDays(chat.user_id, REF_DAYS, chatId);
  const { count } = await db.from("wd_referrals").select("id", { count: "exact", head: true }).eq("referrer", chat.ref_by);
  const rewarded = (count ?? 0) <= REF_MAX;
  if (rewarded) await addProDays(chat.ref_by, REF_DAYS);
  await send(chatId, `🎁 Taklif bonusi: hisobingizga <b>${REF_DAYS} kun Pro</b> qo'shildi!`);
  const { data: rc } = await db.from("wd_tg_chats").select("chat_id").eq("user_id", chat.ref_by).limit(1).maybeSingle();
  if (rc) await send(rc.chat_id, rewarded ? `🎉 Do'stingiz WordDrop'ga qo'shildi — sizga ham <b>${REF_DAYS} kun Pro</b> qo'shildi!` : `🎉 Do'stingiz WordDrop'ga qo'shildi. Mukofot limiti (${REF_MAX} ta) to'lgan, lekin rahmat!`);
}

/* ───────── Eski botga uzatish ───────── */
async function forward(u: unknown) {
  const r = await fetch(OLD_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": await webhookSecret() }, body: JSON.stringify(u) }).catch((e) => { console.error("[fwd]", e); return null; });
  if (r && !r.ok) console.error("[fwd] status", r.status);
}

/* true — shu yerda bajarildi; false — tg-bot ga uzatish kerak */
async function handle(u: any): Promise<boolean> {
  const cq = u.callback_query;
  if (cq) {
    const chatId = cq.message?.chat?.id; const data = String(cq.data || "");
    if (!chatId || cq.message?.chat?.type !== "private") return false;
    if (!["L", "Lg", "I", "q", "m"].includes(data) && !data.startsWith("L:")) return false;
    tg("answerCallbackQuery", { callback_query_id: cq.id });
    const { data: chat } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
    if (!chat) return false;
    if (data === "m") { await send(chatId, "Nima qilamiz?", { reply_markup: KB_MAIN }); return true; }
    if (data === "q") { if (!chat.cefr) return false; await sendQuiz(chatId, chat.cefr); return true; }
    if (data === "L") await ptIntro(chat);
    else if (data === "Lg") await ptStart(chat, cq.message?.message_id);
    else if (data === "I") await inviteMsg(chat);
    else await ptAnswer(chat, cq.message?.message_id, data);
    return true;
  }
  const m = u.message;
  if (!m?.chat || m.chat.type !== "private" || !m.from || m.successful_payment || m.refunded_payment) return false;
  const text = String(m.text ?? "").trim();
  const cmd = text.split(/\s+/)[0].split("@")[0];
  const arg = text.split(/\s+/)[1] ?? "";
  const mine = (cmd === "/start" && (arg === "" || arg === "level" || /^r_[0-9a-f]{32}$/.test(arg))) || ["/level", "/daraja", "/invite", "/multilevel", "/menu", "/help", "/quiz"].includes(cmd);
  if (!mine) return false;
  const chat = await getChat(m.from, m.chat.id); if (!chat) return false;
  if (cmd === "/quiz") { if (!chat.cefr) return false; await sendQuiz(chat.chat_id, chat.cefr); return true; }
  if (cmd === "/menu" || cmd === "/help") { await send(chat.chat_id, "Nima qilamiz?", { reply_markup: KB_MAIN }); return true; }
  if (cmd === "/level" || cmd === "/daraja" || (cmd === "/start" && arg === "level")) { await ptIntro(chat); return true; }
  if (cmd === "/invite") { await inviteMsg(chat); return true; }
  if (cmd === "/multilevel") { await send(chat.chat_id, "🎓 <b>Multilevel sinov imtihoni</b>\n\nListening (6 qism), Reading (5 qism), Writing va Speaking — rasmiy formatdagi tartib va vaqt bilan. Natija 75 ballik shkalada va CEFR darajasida.", { reply_markup: { inline_keyboard: [[{ text: "🎓 Imtihonni ochish", web_app: { url: APP_URL + "#ml" } }]] } }); return true; }
  if (arg.startsWith("r_")) { await onRefStart(chat, arg, m.from); return true; }
  // oddiy /start
  await send(chat.chat_id, `Salom${m.from.first_name ? ", " + esc(m.from.first_name) : ""}! 💧 Men <b>Drop</b> — WordDrop yordamchisiman.\n\n• Har kuni ertalab yangi so'z yuboraman\n• Viktorina bilan bilimingizni sinaymiz\n• Inglizcha savolingizga javob beraman — shunchaki yozing\n• 🎓 Multilevel sinov imtihonini ilovada topshirasiz`, { reply_markup: KB_MAIN });
  if (!chat.cefr) await ptIntro(chat);
  return true;
}

/* ───────── Sozlash: webhook shu funksiyaga, yangi buyruqlar ───────── */
async function setup() {
  const r1 = await tg("setWebhook", { url: SELF_URL, secret_token: await webhookSecret(), allowed_updates: ["message", "callback_query", "my_chat_member", "pre_checkout_query"], drop_pending_updates: false });
  const r2 = await tg("setMyCommands", { scope: { type: "all_private_chats" }, commands: [
    { command: "word", description: "Kun so'zi" }, { command: "quiz", description: "Viktorina" },
    { command: "level", description: "Daraja testi" }, { command: "multilevel", description: "Multilevel sinov imtihoni" },
    { command: "review", description: "Takrorim" }, { command: "top", description: "Reyting" },
    { command: "invite", description: "Do'st taklif qilish — 7 kun Pro" }, { command: "settings", description: "Eslatmalar" },
    { command: "pro", description: "WordDrop Pro (Stars)" }, { command: "paysupport", description: "To'lov bo'yicha yordam" },
    { command: "terms", description: "Pro shartlari" }, { command: "menu", description: "Menyu" } ] });
  return { webhook: r1.ok, commands: r2.ok, desc: r1.description };
}
async function isAdminJwt(req: Request) {
  const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""); if (!t) return false;
  const { data } = await db.auth.getUser(t); const email = String(data?.user?.email ?? "").toLowerCase(); if (!email) return false;
  const list = await kv("admins");
  return Array.isArray(list) && list.map((x: unknown) => String(x).toLowerCase()).includes(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const tgSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (tgSecret !== null) {
      if (tgSecret !== (await webhookSecret())) return new Response("forbidden", { status: 403 });
      const u = await req.json().catch(() => null);
      if (!u) return new Response("ok");
      let done = false;
      try { done = await handle(u); } catch (e) { console.error("[v101]", e); }
      if (!done) bg(forward(u));
      // Hisob ulangan bo'lsa (har qanday shaxsiy xabardan keyin) taklif bonusini beramiz
      const pc = u.message?.chat ?? u.callback_query?.message?.chat;
      if (pc?.type === "private") bg((async () => { await new Promise((z) => setTimeout(z, done ? 0 : 4000)); await claimRef(pc.id); })());
      return new Response("ok");
    }
    const body = await req.json().catch(() => ({}));
    const cron = req.headers.get("x-cron-secret");
    const allowed = (cron && cron === String(await kv("cron_secret") ?? "")) || await isAdminJwt(req);
    if (!allowed) return json({ error: "Ruxsat yo'q" }, 403);
    if (body.action === "setup") return json(await setup());
    return json({ error: "Noma'lum amal" }, 400);
  } catch (e) {
    console.error("[tg-v101]", e);
    return new Response("ok");
  }
});
