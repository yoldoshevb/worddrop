// Supabase Edge Function: tg-v101  (WordDrop v101)
// Telegram webhook endi shu funksiyaga keladi. Yangi imkoniyatlarni shu yerning o'zida bajaradi,
// qolgan hamma yangilanishni (guruhlar, to'lovlar, admin, Drop AI…) o'zgartirmasdan tg-bot ga uzatadi.
//
// Yangi imkoniyatlar:
//   • Daraja testi chat ichida (/level, /start level, «📊 Darajamni aniqlash»), 16 savol, moslashuvchan;
//     natija wd_tg_chats.cefr, wd_placement va (hisob ulangan bo'lsa) wd_state.cefr ga yoziladi.
//   • Viktorina foydalanuvchi darajasiga mos so'zlardan.
//   • Do'st taklif qilish: t.me/WordDropUzBot?start=r_<uid> — har 3 ta do'st hisobini ulaganda taklif qilganga 7 kun Pro (v104).
//   • /multilevel — Multilevel sinov imtihoni (ilovada #ml).
//   • /promo KOD yoki «🎟 Promokod» tugmasi — Pro promokodini faollashtirish (v106, wd_promo_redeem).
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
  [{ text: "🎙 Speaking mashqi", callback_data: "sp:0" }],
  [{ text: "☀️ Kun so'zi", callback_data: "w" }, { text: "🎯 Viktorina", callback_data: "q" }],
  [{ text: "🧠 Takrorim", callback_data: "r" }, { text: "🏆 Reyting", callback_data: "t" }],
  [{ text: "📊 Darajamni aniqlash", callback_data: "L" }, { text: "🎓 Multilevel", web_app: { url: APP_URL + "#ml" } }],
  [{ text: "⚙️ Sozlamalar", callback_data: "s" }, { text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }],
  [{ text: "⭐ WordDrop Pro", callback_data: "P" }, { text: "🎁 Do'st taklif qilish", callback_data: "I" }],
  [{ text: "🎟 Promokod", callback_data: "PR" }],
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
const REF_DAYS = 7, REF_STEP = 3, REF_MAX_REWARDS = 10;   // v104: har 3 do'st = 7 kun Pro, ko'pi bilan 10 marta
const refLink = (uid: string) => `https://t.me/${BOT_NAME}?start=r_${uid.replace(/-/g, "")}`;
const hexToUuid = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
async function addProDays(uid: string, days: number, tgUser?: number | null) {
  const { data: cur } = await db.from("wd_pro").select("until").eq("user_id", uid).maybeSingle();
  const until = new Date(Math.max(Date.now(), cur ? Date.parse(cur.until) || 0 : 0) + days * 86400_000).toISOString();
  if (cur) await db.from("wd_pro").update({ until, updated_at: nowIso() }).eq("user_id", uid);
  else await db.from("wd_pro").insert({ user_id: uid, until, plan: "referral", tg_user: tgUser ?? null, updated_at: nowIso() });
}
async function inviteMsg(chat: any) {
  if (!chat.user_id) return send(chat.chat_id, `🎁 <b>${REF_STEP} ta do'stingizni</b> taklif qiling — <b>${REF_DAYS} kun Pro</b> olasiz.\n\nAvval WordDrop'ni shu yerdan oching — hisobingiz Telegram orqali o'zi ulanadi. Keyin «Do'st taklif qilish» ni qayta bosing.`, { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }]] } });
  const { count } = await db.from("wd_referrals").select("id", { count: "exact", head: true }).eq("referrer", chat.user_id);
  const link = refLink(chat.user_id);
  const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`WordDrop'da ingliz tilini birga o'rganamiz! Shu havola orqali qo'shil 💧`)}`;
  const n = count ?? 0, step = n % REF_STEP, got = Math.min(REF_MAX_REWARDS, Math.floor(n / REF_STEP));
  const bar = "●".repeat(step) + "○".repeat(REF_STEP - step);
  return send(chat.chat_id, `🎁 <b>Do'st taklif qilish</b>\n\nHar <b>${REF_STEP} ta do'stingiz</b> havola orqali botga kirib, WordDrop'ni ochsa — sizga <b>${REF_DAYS} kun Pro</b> qo'shiladi.\n\nSizning havolangiz:\n<code>${link}</code>\n\nKeyingi mukofotgacha: ${bar} <b>${step}/${REF_STEP}</b>\nJami do'stlar: <b>${n}</b> · olingan mukofot: <b>${got}</b> (ko'pi bilan ${REF_MAX_REWARDS})`, { reply_markup: { inline_keyboard: [[{ text: "📤 Do'stlarga yuborish", url: share }]] } });
}
async function onRefStart(chat: any, code: string, from: any) {
  const by = hexToUuid(code.slice(2));
  const { data: ok } = await db.from("wd_state").select("user_id").eq("user_id", by).maybeSingle();
  const hello = `Salom${from?.first_name ? ", " + esc(from.first_name) : ""}! 💧 Men <b>Drop</b> — WordDrop yordamchisiman.`;
  if (!ok || by === chat.user_id) { await send(chat.chat_id, hello, { reply_markup: KB_MAIN }); return chat.cefr ? null : ptIntro(chat); }
  if (chat._new) await db.from("wd_tg_chats").update({ ref_by: by }).eq("chat_id", chat.chat_id);
  await send(chat.chat_id, `${hello}\nSizni do'stingiz taklif qildi.\n\n${chat._new ? `📱 WordDrop'ni shu yerdan oching — hisobingiz ulanadi va do'stingiz mukofotga bir qadam yaqinlashadi.\n🎁 Siz ham <b>${REF_STEP} ta do'stingizni</b> taklif qilsangiz, <b>${REF_DAYS} kun Pro</b> olasiz.` : "Taklif faqat botga birinchi marta kirganlar uchun hisoblanadi."}`, { reply_markup: KB_MAIN });
  if (!chat.cefr) await ptIntro(chat);
}
async function claimRef(chatId: number) {
  const { data: chat } = await db.from("wd_tg_chats").select("chat_id,user_id,ref_by,ref_claimed").eq("chat_id", chatId).maybeSingle();
  if (!chat?.user_id || !chat.ref_by || chat.ref_claimed) return;
  await db.from("wd_tg_chats").update({ ref_claimed: true }).eq("chat_id", chatId);
  if (chat.ref_by === chat.user_id) return;
  const { error } = await db.from("wd_referrals").insert({ referrer: chat.ref_by, invitee: chat.user_id, tg_chat: chatId, days: 0 });
  if (error) return;   // bu hisob avval ham taklif orqali kelgan
  const { count } = await db.from("wd_referrals").select("id", { count: "exact", head: true }).eq("referrer", chat.ref_by);
  const n = count ?? 0, step = n % REF_STEP;
  const rewarded = step === 0 && n / REF_STEP <= REF_MAX_REWARDS;
  if (rewarded) { await addProDays(chat.ref_by, REF_DAYS); await db.from("wd_referrals").update({ days: REF_DAYS }).eq("invitee", chat.user_id); }
  await send(chatId, `✅ Hisobingiz ulandi. 🎁 Siz ham <b>${REF_STEP} ta do'stingizni</b> taklif qilib, <b>${REF_DAYS} kun Pro</b> olishingiz mumkin — /invite`);
  const { data: rc } = await db.from("wd_tg_chats").select("chat_id").eq("user_id", chat.ref_by).limit(1).maybeSingle();
  if (rc) {
    const left = (REF_STEP - step) % REF_STEP || REF_STEP;
    const bar = "●".repeat(step || REF_STEP) + "○".repeat(step ? REF_STEP - step : 0);
    await send(rc.chat_id, rewarded ? `🎉 Do'stingiz WordDrop'ga qo'shildi — ${bar} <b>${REF_STEP}/${REF_STEP}</b>!\nSizga <b>${REF_DAYS} kun Pro</b> qo'shildi 💧`
      : step === 0 ? `🎉 Do'stingiz WordDrop'ga qo'shildi. Mukofot limiti (${REF_MAX_REWARDS} marta) to'lgan, lekin rahmat!`
      : `🎉 Do'stingiz WordDrop'ga qo'shildi — ${bar} <b>${step}/${REF_STEP}</b>\nYana <b>${left} ta</b> do'st — va sizga <b>${REF_DAYS} kun Pro</b>.`);
  }
}

/* ───────── Promokod (v106) ───────── */
const MO = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const fmtDay = (s: string) => { const d = new Date(s); return `${d.getUTCDate()}-${MO[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const PROMO_RE = /^[A-Za-z0-9-]{4,32}$/;
async function promoAsk(chat: any, code = "") {
  if (!chat.user_id) return send(chat.chat_id, `🎟 Promokodni ishlatish uchun avval WordDrop'ni shu yerdan oching — hisobingiz Telegram orqali o'zi ulanadi.${code ? `\n\nKeyin shu xabarni yuboring:\n<code>/promo ${esc(code)}</code>` : " Keyin promokodni yuboring."}`, { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }]] } });
  await kvSet("promo:" + chat.chat_id, { at: Date.now() });
  return send(chat.chat_id, "🎟 <b>Promokodni yuboring</b>\n\nMasalan: <code>WD-AB12-CD34</code>", { reply_markup: { inline_keyboard: [[{ text: "Bekor qilish", callback_data: "m" }]] } });
}
async function promoRedeem(chat: any, code: string, from: any) {
  await db.from("wd_tg_kv").delete().eq("key", "promo:" + chat.chat_id);
  if (!chat.user_id) return promoAsk(chat, code);
  const { data, error } = await db.rpc("wd_promo_redeem", { uid: chat.user_id, c: code, tg: from?.id ?? chat.chat_id, via: "bot" });
  if (error || !data) return send(chat.chat_id, "Promokodni tekshirib bo'lmadi. Birozdan keyin qayta urinib ko'ring.");
  if (!data.ok) return send(chat.chat_id, `❌ ${esc(data.msg)}`, { reply_markup: { inline_keyboard: [[{ text: "🎟 Boshqa kod", callback_data: "PR" }, { text: "⭐ Pro tariflari", callback_data: "P" }]] } });
  return send(chat.chat_id, `🎉 <b>Promokod faollashdi!</b>\n\nSizga <b>${data.days} kun WordDrop Pro</b> qo'shildi — ${fmtDay(data.until)} gacha.\nDrop AI 100 ta savol, Multilevel imtihonlari va chuqur tahlil endi ochiq.`, { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }]] } });
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
    if (!["L", "Lg", "I", "q", "m", "PR"].includes(data) && !data.startsWith("L:")) return false;
    tg("answerCallbackQuery", { callback_query_id: cq.id });
    const { data: chat } = await db.from("wd_tg_chats").select("*").eq("chat_id", chatId).maybeSingle();
    if (!chat) return false;
    if (data === "m") { await db.from("wd_tg_kv").delete().eq("key", "promo:" + chatId); await send(chatId, "Nima qilamiz?", { reply_markup: KB_MAIN }); return true; }
    if (data === "PR") { await promoAsk(chat); return true; }
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
  // Promokod kutilyapti: keyingi oddiy xabar — kod
  if (!text.startsWith("/")) {
    const w = await kv("promo:" + m.chat.id);
    if (w && Date.now() - (w.at || 0) < 10 * 60_000) {
      if (PROMO_RE.test(text.replace(/\s+/g, ""))) { const chat = await getChat(m.from, m.chat.id); if (chat) { await promoRedeem(chat, text, m.from); return true; } }
      await db.from("wd_tg_kv").delete().eq("key", "promo:" + m.chat.id);
    }
  }
  const mine = (cmd === "/start" && (arg === "" || arg === "level" || /^r_[0-9a-f]{32}$/.test(arg) || /^promo_[A-Za-z0-9-]{4,32}$/.test(arg))) || ["/level", "/daraja", "/invite", "/multilevel", "/menu", "/help", "/quiz", "/promo", "/promokod"].includes(cmd);
  if (!mine) return false;
  const chat = await getChat(m.from, m.chat.id); if (!chat) return false;
  if (cmd === "/promo" || cmd === "/promokod") { if (arg && PROMO_RE.test(arg)) await promoRedeem(chat, arg, m.from); else await promoAsk(chat); return true; }
  if (cmd === "/quiz") { if (!chat.cefr) return false; await sendQuiz(chat.chat_id, chat.cefr); return true; }
  if (cmd === "/menu" || cmd === "/help") { await send(chat.chat_id, "Nima qilamiz?", { reply_markup: KB_MAIN }); return true; }
  if (cmd === "/level" || cmd === "/daraja" || (cmd === "/start" && arg === "level")) { await ptIntro(chat); return true; }
  if (cmd === "/invite") { await inviteMsg(chat); return true; }
  if (cmd === "/multilevel") { await send(chat.chat_id, "🎓 <b>Multilevel sinov imtihoni</b>\n\nListening (6 qism), Reading (5 qism), Writing va Speaking — rasmiy formatdagi tartib va vaqt bilan. Natija 75 ballik shkalada va CEFR darajasida.", { reply_markup: { inline_keyboard: [[{ text: "🎓 Imtihonni ochish", web_app: { url: APP_URL + "#ml" } }]] } }); return true; }
  if (arg.startsWith("r_")) { await onRefStart(chat, arg, m.from); return true; }
  if (arg.startsWith("promo_")) { await promoRedeem(chat, arg.slice(6), m.from); return true; }
  // oddiy /start
  await send(chat.chat_id, `Salom${m.from.first_name ? ", " + esc(m.from.first_name) : ""}! 💧 Men <b>Drop</b> — WordDrop yordamchisiman.\n\n• Har kuni ertalab yangi so'z yuboraman\n• Viktorina bilan bilimingizni sinaymiz\n• Inglizcha savolingizga javob beraman — shunchaki yozing\n• 🎓 Multilevel sinov imtihonini ilovada topshirasiz`, { reply_markup: KB_MAIN });
  if (!chat.cefr) await ptIntro(chat);
  return true;
}

/* ───────── Sozlash: webhook shu funksiyaga, yangi buyruqlar ───────── */
async function setup() {
  const r1 = await tg("setWebhook", { url: SELF_URL, secret_token: await webhookSecret(), allowed_updates: ["message", "callback_query", "my_chat_member", "pre_checkout_query"], drop_pending_updates: false });
  const r2 = await tg("setMyCommands", { scope: { type: "all_private_chats" }, commands: [
    { command: "speaking", description: "Rasmli Speaking mashqi" }, { command: "word", description: "Kun so'zi" }, { command: "quiz", description: "Viktorina" },
    { command: "level", description: "Daraja testi" }, { command: "multilevel", description: "Multilevel sinov imtihoni" },
    { command: "review", description: "Takrorim" }, { command: "top", description: "Reyting" },
    { command: "invite", description: "3 do'st taklif qiling — 7 kun Pro" }, { command: "settings", description: "Eslatmalar" },
    { command: "pro", description: "WordDrop Pro (Stars)" }, { command: "paysupport", description: "To'lov bo'yicha yordam" },
    { command: "promo", description: "Promokodni faollashtirish" },
    { command: "terms", description: "Pro shartlari" }, { command: "menu", description: "Menyu" } ] });
  return { webhook: r1.ok, commands: r2.ok, desc: r1.description };
}
async function isAdminJwt(req: Request) {
  const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""); if (!t) return false;
  const { data } = await db.auth.getUser(t); const email = String(data?.user?.email ?? "").toLowerCase(); if (!email) return false;
  const list = await kv("admins");
  return Array.isArray(list) && list.map((x: unknown) => String(x).toLowerCase()).includes(email);
}

/* v104: kanal profil rasmi — joriy rasmni ko'rish (info) yoki saytdagi PNG bilan almashtirish (url).
   Token hech qachon javobga chiqmaydi: fayl shu funksiya ichida yuklanadi. */
async function channelPhoto(body: any) {
  const channel = await kv("channel");
  const me = await tg("getMe", {});
  const ch = await tg("getChat", { chat_id: channel });
  if (!ch.ok) return { ok: false, error: ch.description, channel };
  const mem = await tg("getChatMember", { chat_id: channel, user_id: me.result?.id });
  const can = !!(mem.ok && (mem.result.status === "creator" || mem.result.can_change_info));
  const info: any = { channel, title: ch.result.title, username: ch.result.username ?? null, bot_status: mem.ok ? mem.result.status : null, can_change_info: can, has_photo: !!ch.result.photo };
  if (body.info) {
    if (ch.result.photo?.big_file_id) {
      const f = await tg("getFile", { file_id: ch.result.photo.big_file_id });
      if (f.ok) {
        const r = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.result.file_path}`);
        const b = new Uint8Array(await r.arrayBuffer()); let bin = ""; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
        info.photo_b64 = btoa(bin);
      }
    }
    return { ok: true, ...info };
  }
  const url = String(body.url ?? "");
  if (!/^https:\/\/(www\.)?worddrop-app\.uz\/[\w./-]+\.(png|jpg)(\?[\w=.-]*)?$/.test(url)) return { ok: false, error: "url faqat worddrop-app.uz dagi png/jpg bo'lishi kerak" };
  if (!can) return { ok: false, error: "Botda kanal ma'lumotini o'zgartirish huquqi yo'q", ...info };
  const img = await fetch(url);
  const ct = img.headers.get("content-type") ?? "";
  if (!img.ok || !ct.startsWith("image/")) return { ok: false, error: `Rasm olinmadi: ${img.status} ${ct}` };
  const fd = new FormData(); fd.append("chat_id", String(channel)); fd.append("photo", new Blob([await img.arrayBuffer()], { type: ct }), "photo.png");
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatPhoto`, { method: "POST", body: fd }).then((x) => x.json()).catch((e) => ({ ok: false, description: String(e) }));
  return { ok: !!r.ok, error: r.ok ? null : r.description, title: info.title };
}

async function blockedTelegram(id: number) {
  const {data,error}=await db.from("wd_access_blocks").select("telegram_id").eq("telegram_id",id).maybeSingle();
  if(error) throw error;
  return !!data;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const tgSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (tgSecret !== null) {
      if (tgSecret !== (await webhookSecret())) return new Response("forbidden", { status: 403 });
      const u = await req.json().catch(() => null);
      const sender=u?.message?.from?.id ?? u?.callback_query?.from?.id ?? u?.pre_checkout_query?.from?.id ?? u?.my_chat_member?.from?.id;
      if(sender && await blockedTelegram(sender)) return new Response("ok");
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
    if (body.action === "channel_photo") return json(await channelPhoto(body));
    return json({ error: "Noma'lum amal" }, 400);
  } catch (e) {
    console.error("[tg-v101]", e);
    return new Response("ok");
  }
});
