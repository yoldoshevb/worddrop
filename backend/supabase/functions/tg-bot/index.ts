import { navigation } from "../_shared/navigation.ts";
import { opusClip, locate, pronounce, whisperReview, type Word as TimedWord, type Finding } from "./audio-review.ts";
import { cards, type Card } from "./practice.ts";
import { scoreImage, type Row } from "./score-image.ts";
import { scoreSpeaking } from "../ml-exam/ml.ts";
import { groqJson } from "../ml-exam/examiner.ts";
import { readCompletion } from "./rich.ts";
// Supabase Edge Function: tg-bot  (WordDrop v99)
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
// v97: WordDrop Pro — Telegram Stars (XTR) to'lovlari: oylik obuna va bir martalik 3 oy / 1 yil,
//      /pro, /paysupport, /terms, pulni qaytarish (admin), Pro limiti 100/kun.
// v99: guruhlarga muntazam WordDrop reklamasi (har N soatda, foydali mazmun bilan; guruh adminlari /reklama_off),
//      send_pdf (kitobchani foydalanuvchi chatiga hujjat qilib yuborish), kanal postlari uchun illyustratsiya kalitlari.
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
const nav = navigation(tg,kv,kvSet);
const show = nav.show;

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
const CFG_DEF = { dm: "all", approve_groups: true, humor: 1, promo: true, promo_hours: 5 };
async function cfg(): Promise<{ dm: string; approve_groups: boolean; humor: number; promo: boolean; promo_hours: number }> { return { ...CFG_DEF, ...((await kv("bot_cfg")) ?? {}) }; }
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
async function isPro(uid: string | null | undefined) {
  if (!uid) return false;
  const { data } = await db.from("wd_pro").select("until").eq("user_id", uid).maybeSingle();
  return !!data && Date.parse(data.until) > Date.now();
}
async function askMax(chat: any) { return chat.user_id ? ((await isPro(chat.user_id)) ? 100 : 20) : 3; }
async function askAllowed(chat: any): Promise<{ ok: boolean; left: number }> {
  const t = tz();
  if (chat.user_id) {
    const max = await askMax(chat);
    const { data } = await db.from("wd_drop_usage").select("count").eq("user_id", chat.user_id).eq("day", utcDay()).maybeSingle();
    const c = data?.count ?? 0; return { ok: c < max, left: Math.max(0, max - c) };
  }
  const c = chat.ask_day === t.day ? chat.ask_count : 0; return { ok: c < 3, left: Math.max(0, 3 - c) };
}
async function askBump(chat: any) {
  const t = tz();
  if (chat.user_id) {
    const { data } = await db.from("wd_drop_usage").select("count,day").eq("user_id", chat.user_id).maybeSingle();
    const cur = data && data.day === utcDay() ? data.count : 0;
    await db.from("wd_drop_usage").upsert({ user_id: chat.user_id, day: utcDay(), count: Math.min(await askMax(chat), cur + 1), updated_at: new Date().toISOString() });
  } else {
    const c = chat.ask_day === t.day ? chat.ask_count + 1 : 1;
    await db.from("wd_tg_chats").update({ ask_day: t.day, ask_count: c }).eq("chat_id", chat.chat_id);
  }
}

/* ───────── Klaviaturalar ───────── */
const KB_MAIN = { inline_keyboard: [
  [{ text: "🎙 Speaking mashqi", callback_data: "sp:0" }],
  [{ text: "☀️ Kun so'zi", callback_data: "w" }, { text: "🎯 Viktorina", callback_data: "q" }],
  [{ text: "🧠 Takrorim", callback_data: "r" }, { text: "🏆 Reyting", callback_data: "t" }],
  [{ text: "⚙️ Sozlamalar", callback_data: "s" }, { text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }],
  [{ text: "⭐ WordDrop Pro", callback_data: "P" }],
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
  if (!w) return show(chatId, "Hozircha savol tayyor emas.");
  const opts = [...(await distractors(w)), w.uz].sort(() => Math.random() - .5);
  const correct = opts.indexOf(w.uz);
  const kb = { inline_keyboard: opts.map((o, i) => [{ text: o, callback_data: `a:${w.id}:${i}:${correct}` }]) };
  const text = `🎯 <b>Tarjimasini toping</b>\n\n<b>${esc(w.en)}</b>${w.ipa ? ` <i>${esc(w.ipa)}</i>` : ""}`;
  return editMsg ? tg("editMessageText", { chat_id: chatId, message_id: editMsg, text, parse_mode: "HTML", reply_markup: kb }) : show(chatId, text, { reply_markup: kb });
}

/* ───────── Webhook: xabarlar ───────── */
const cb = (data:string,label:string)=>`<tg-button type="callback_data" style="primary" data="${data}">${label}</tg-button>`;
const partMenu={inline_keyboard:[["1.1","1.2","2","3"].map(part=>({text:"Part "+part,callback_data:"sk:"+cards.findIndex(c=>c.part===part)}))]};
const sessionKey = (chatId:number) => "speaking-session:"+chatId;
async function speakingScreen(chatId:number, message:number|undefined, html:string, plain:string, buttons:any[][]) {
  const controls = buttons.map(row=>"<tg-button-row>"+row.map(b=>cb(b.callback_data,esc(b.text))).join("")+"</tg-button-row>").join("");
  const home="<tg-button-row>"+cb("m","Bosh menyu")+"</tg-button-row>";
  const r = await show(chatId,plain,{},message,html+controls+home);
  if (r.ok || String(r.description).includes("not modified")) return r.result?.message_id || message;
  const fallback = await panel(chatId,message||null,plain,buttons);
  return fallback.result?.message_id || (fallback.ok ? message : undefined);
}
async function speakingMenu(chatId:number, edit?:number, hint="Qaysi qismni mashq qilasiz?"){
  const old=await kv(sessionKey(chatId));
  if(old?.phase==="grading" && Date.now()-old.at<180000) return;
  const msg=await speakingScreen(chatId,edit||old?.message,"<h2>Multilevel Speaking</h2><p>"+esc(hint)+"</p>", "<b>Multilevel Speaking</b>\n"+esc(hint),partMenu.inline_keyboard);
  if(msg) await kvSet(sessionKey(chatId),{phase:"menu",message:msg,at:Date.now()});
}
async function freshCard(idx:number):Promise<Card>{
  const seed=cards[idx], topics=["a missed bus on the way to school","borrowing a book from a neighbour","choosing a gift on a small budget","repairing a broken bicycle","finding a quiet place to study","organising a class picnic","teaching a relative a phone shortcut","saving water in a school garden","planning a trip with a paper map","paying for a shared sports ground","preserving an old cinema","limiting phones during lessons","free entry to local museums","deciding how late libraries should stay open"];
  const choice=topics[Math.floor(Math.random()*topics.length)];
  const prompt = [
    "Create one original English Multilevel speaking practice. Return JSON: title, questions (exactly 3 English strings), help (3-5 useful English expressions).",
    "1.1: three everyday personal A1-A2 questions. 1.2: compare both pictured situations first; then two distinct B1 follow-ups requiring opinions and reasons about those pictures.",
    "2: use the supplied picture only as a theme, ask about personal experience, its impact, then an abstract B2 question. 3: one C1 debate motion as the title; give two arguments for, two against in help, and three planning prompts for a single balanced speech.",
    "For a pictured task stay faithful to the stated scene. Vary the questions and angle. No Markdown."
  ].join(" ");
  const v=await groq(prompt,JSON.stringify({part:seed.part,scene:seed.scene||null,inspiration:seed.scene?undefined:choice,variation:crypto.randomUUID().slice(0,6)}),520,.88);
  if(!v||typeof v.title!=="string"||!Array.isArray(v.questions)||v.questions.length!==3||!v.questions.every((x:any)=>typeof x==="string"&&x.trim().length>=8))return seed;
  const help=Array.isArray(v.help)?v.help.join(" · "):v.help;
  if(typeof help!=="string"||!help.trim())return seed;
  return {...seed,title:clip(v.title,100),questions:v.questions.map((x:string)=>clip(x,240)),help:clip(help,320)};
}
async function feedbackPage(chatId:number,messageId:number,page:number,screen?:number){
  const data=await kv("review:"+chatId+":"+messageId);if(!data)return send(chatId,"Tahlil topilmadi.");
  const items:Finding[]=data.items, first=page*5, visible=items.slice(first,first+5);
  if(!visible.length&&page)return;
  const buttons=visible.map((x,i)=>({text:(first+i+1)+". "+x.kind,callback_data:`rx:${messageId}:${first+i}`}));
  const nav=[];if(page)nav.push({text:"Oldingi",callback_data:`rp:${messageId}:${page-1}`});
  if(first+5<items.length)nav.push({text:"Davomi",callback_data:`rp:${messageId}:${page+1}`});
  const table="<table compact striped><tr><th>Mezon</th><th>Izoh</th></tr>"+visible.map((x,i)=>`<tr><td>${first+i+1}. ${esc(x.kind)}</td><td>${esc(x.note)}</td></tr>`).join("")+"</table>";
  const all=[...buttons,...nav,{text:"Yangi mashq",callback_data:"skmenu"}];
  const html="<h2>Javob tahlili</h2><p>"+esc(data.note)+"</p>"+(visible.length?table:"<p>Qo‘shimcha tuzatish topilmadi.</p>");
  return speakingScreen(chatId,screen,html,esc([data.note,...visible.map(x=>x.kind+" · "+x.note)].join("\n\n")),all.map(b=>[b]));
}
async function replayFinding(chatId:number,messageId:number,index:number){
  const data=await kv("review:"+chatId+":"+messageId), x:Finding=data?.items?.[index];
  if(!x)return send(chatId,"Tahlil topilmadi.");
  if(x.start==null||x.end==null)return send(chatId,esc(x.note)+"\nBu band uchun aniq audio parcha ajratilmadi.");
  try{
    const f=await tg("getFile",{file_id:data.fileId});if(!f.ok)throw Error();
    const r=await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.result.file_path}`);if(!r.ok)throw Error();
    const start=Math.max(0,x.start-.38),end=x.end+.45;
    const bytes=opusClip(new Uint8Array(await r.arrayBuffer()),start,end);
    const fd=new FormData();fd.append("chat_id",String(chatId));fd.append("voice",new Blob([bytes],{type:"audio/ogg"}),"parcha.ogg");
    fd.append("caption",`${x.kind} · ${x.start.toFixed(1)}–${x.end.toFixed(1)} s\n${x.note}`.slice(0,950));
    const sent=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`,{method:"POST",body:fd});if(!(await sent.json()).ok)throw Error();
  }catch{await send(chatId,esc(x.note)+`\nAsl yozuvda ${x.start.toFixed(1)}–${x.end.toFixed(1)} soniyani tinglang.`);}
}
async function taskScreen(chatId:number,state:any,started:boolean){
  const c:Card=state.card;
  const questions=c.questions.map((q,i)=>(i+1)+". "+esc(q));
  const hint=started?"Uch savolga bitta ovozli xabarda javob bering.":"Savollarni ko‘rib chiqing, so‘ng «Boshlash»ni bosing.";
  const buttons=started?[[{text:"Bekor qilish",callback_data:"skmenu"}]]:[
    [{text:"▶ Boshlash",callback_data:"sgo:"+state.token}],
    [{text:"Boshqa mavzu",callback_data:"snew:"+state.idx},{text:"Qismlar",callback_data:"skmenu"}]];
  const title="Part "+c.part+" · "+esc(c.title);
  const html="<h2>"+title+"</h2>"+(c.photo?'<img src="'+c.photo+'"/>':"")+"<p>"+esc(c.timing)+"</p>"+
    questions.map(q=>"<p>"+q+"</p>").join("")+"<details><summary>Yordam so‘zlari</summary><p>"+esc(c.help)+"</p></details><p>"+hint+"</p>";
  return speakingScreen(chatId,state.message,html,[title,c.photo,esc(c.timing),...questions,esc(c.help),hint].filter(Boolean).join("\n\n"),buttons);
}
async function sendPractice(chatId:number, idx:number, saved?:Card, message?:number) {
  if(!cards[idx]) return speakingMenu(chatId,message);
  const prior=await kv(sessionKey(chatId));
  if(prior?.phase==="grading" && Date.now()-prior.at<180000)return;
  const pool=cards.map((c,i)=>c.part===cards[idx].part?i:-1).filter(i=>i>=0 && i!==prior?.idx);
  if(!saved && pool.length)idx=pool[Math.floor(Math.random()*pool.length)];
  const state={idx,card:saved||await freshCard(idx),token:crypto.randomUUID().slice(0,12),at:Date.now(),message:message||prior?.message,phase:"ready"};
  state.message=await taskScreen(chatId,state,false);
  if(state.message)await kvSet(sessionKey(chatId),state);
}
async function gradePractice(chat:any, idx:number, transcript:string, seconds:number, messageId:number, card:Card, fileId:string, audio:Blob, words:TimedWord[]){
  const timing = whisperReview(words, seconds);
  const deadline = Date.now() + 80000;
  const gradeJson: typeof groqJson = (key, models, messages, tokens, temperature) =>
    groqJson(key, models, messages, tokens, temperature, deadline);
  const response=await scoreSpeaking({apiKey:GROQ,groqJson:gradeJson,json,clip,body:{items:[{part:card.part,q:card.title,text:transcript,sec:seconds,pauses:timing.pauses,limit:card.limit}]}},{questions:card.questions,scene:card.scene||card.title});
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const incomplete = error.code === "incomplete_report";
    console.warn("[speaking] practice grading failed", response.status, incomplete ? "incomplete_report" : "provider_or_request");
    const reason = incomplete ? "Savollar bo‘yicha baho to‘liq shakllanmadi." : "Baholash xizmatidan hozir natija olinmadi.";
    const text=esc("Ovozingiz matnga o‘girildi. "+reason+"\n"+timing.note+"\n\n"+transcript.slice(0,2200));
    return speakingScreen(chat.chat_id,(await kv(sessionKey(chat.chat_id)))?.message,"<p>"+text+"</p>",text,[[{text:"Qayta boshlash",callback_data:"skmenu"}]]);
  }
  const report=await response.json();
  const labels:Record<string,string>={missing:"Javob topilmadi",partial:"Qisman yoritilgan",sufficient:"Yetarli yoritilgan"};
  const caption=`Part ${card.part} · ${card.title}\nTaxminiy mashq bali: ${report.raw}/${report.max}\n${report.reason}`;
  const key = Deno.env.get("AZURE_SPEECH_KEY");
  const region = Deno.env.get("AZURE_SPEECH_REGION");
  const acoustic = key && region
    ? await pronounce(new Uint8Array(await audio.arrayBuffer()), words, key, region)
        .catch(() => ({items: [], note: "Bu yozuv uchun talaffuz bahosi olinmadi."}))
    : {items: [], note: "Alohida tovushlar talaffuziga ball berilmadi."};
  const audioNote = timing.note + " " + acoustic.note;
  const items:Finding[]=(report.corrections||[]).map((x:any)=>({kind:"Grammatika",note:x.wrong+" → "+x.right+". "+x.why,...locate(words,x.wrong)}));
  report.coverage.forEach((x:any,i:number)=>{if(x.status!=="sufficient")items.push({kind:"Vazifa "+(i+1),note:card.questions[i]+" · "+x.reason_uz+" "+x.next_uz,...locate(words,x.quote||"")});});
  items.push(...timing.items, ...acoustic.items);
  await kvSet("review:"+chat.chat_id+":"+messageId,{fileId,items,note:caption+"\n"+audioNote,idx,card});
  const rows:Row[]=[
    {text:"WORDDROP  /  SPEAKING",style:"label"},
    {text:`Part ${card.part}   ·   ${card.title}`,style:"heading"},
    {text:`Taxminiy mashq bali    ${report.raw} / ${report.max}`,style:"heading",gap:15},
    {text:report.reason,style:"body"},
    {text:`Yozuv: ${Math.round(seconds)} soniya   ·   Transkript: ${transcript.trim().split(/\s+/).length} so‘z`,style:"quote"},
  ];
  report.coverage.forEach((x:any,i:number)=>{
    rows.push({text:`${i+1}. ${card.questions[i]}`,style:"heading",gap:22},
      {text:labels[x.status],style:"label"});
    if(x.quote) rows.push({text:`Transkriptdan: “${x.quote}”`,style:"quote"});
    rows.push({text:x.reason_uz,style:"body"});
    if(x.next_uz) rows.push({text:"Mashq: "+x.next_uz,style:"body"});
  });
  if(report.correction){
    rows.push({text:"Nutqingizdan bir tuzatish",style:"heading",gap:22},
      {text:report.correction.wrong+"  →  "+report.correction.right,style:"quote"},
      {text:report.correction.why,style:"body"});
  }
  if(report.next) rows.push({text:"Keyingi urinish",style:"heading",gap:22},{text:report.next,style:"body"});
  if(report.better) rows.push({text:"Namunaviy jumla",style:"label",gap:8},{text:report.better,style:"quote"});
  rows.push({text:"Qism bali transkript va nutq vaqti asosida taxmin qilindi.",style:"quote",gap:20});
  const reply_markup={inline_keyboard:[[{text:"Qayta mashq",callback_data:"rr:"+messageId},{text:"Keyingi",callback_data:"sk:"+((idx+1)%cards.length)},{text:"Qismlar",callback_data:"skmenu"}]]};
  try{
    rows.push({text:audioNote,style:"body"});
    for (const item of timing.items) rows.push({text:item.note,style:"quote"});
    const bytes=await scoreImage(rows);
    const fd=new FormData();
    fd.append("chat_id",String(chat.chat_id));fd.append("document",new Blob([bytes],{type:"image/png"}),"WordDrop-Speaking-"+card.part+".png");
    fd.append("caption",caption);fd.append("reply_markup",JSON.stringify(reply_markup));
    fd.append("reply_parameters",JSON.stringify({message_id:messageId,allow_sending_without_reply:true}));
    const res=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,{method:"POST",body:fd});
    if(!(await res.json()).ok) throw Error("PNG delivery failed");
  }catch{
    const result=await send(chat.chat_id,esc(rows.map(r=>r.text).join("\n").slice(0,4000)),{reply_markup});
    if(!result.ok) return;
  }
  await askBump(chat);
  await feedbackPage(chat.chat_id,messageId,0,(await kv(sessionKey(chat.chat_id)))?.message);
}
async function richWord(chatId:number) {
  const w = await wordOfDay();
  if (!w) return send(chatId,"Hozircha so‘z tayyor emas.");
  const html = `<h2>${esc(w.en)}</h2><table compact><tr><td>Tarjima</td><td>${esc(w.uz)}</td></tr>${w.ipa?`<tr><td>Talaffuz</td><td>${esc(w.ipa)}</td></tr>`:""}</table>${w.ex?`<blockquote>${esc(w.ex)}</blockquote>`:""}${w.mn_uz?`<details><summary>Eslab qolish</summary><p>${esc(w.mn_uz)}</p></details>`:""}${w.ex2?`<p>${esc(w.ex2)} — ${esc(w.ex2_uz)}</p>`:""}${w.tip_uz?`<p>${esc(w.tip_uz)}</p>`:""}<tg-button-row>${cb("q","Viktorina")}<tg-button type="web_app" url="${APP_URL}">WordDrop</tg-button></tg-button-row>`;
  const r=await show(chatId,"",{},undefined,html.replace("</tg-button-row>",cb("m","Bosh menyu")+"</tg-button-row>"));
  if(!r.ok) return show(chatId,wodText(w),{reply_markup:KB_MAIN});
}
async function streamTutor(m:any, system:string, question:string) {
  const chat_id=m.chat.id, thread=m.message_thread_id?{message_thread_id:m.message_thread_id}:{};
  let previewEnabled=true;
  const paragraph=(s:string)=>s.split(/\n+/).filter(Boolean).map(line=>"<p>"+esc(line)+"</p>").join("");
  for(const model of ["openai/gpt-oss-120b","openai/gpt-oss-20b"]){
    let answer:string;
    try{
      const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",signal:AbortSignal.timeout(35000),
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+GROQ},
        body:JSON.stringify({model,stream:true,include_reasoning:false,reasoning_effort:"low",max_completion_tokens:700,
          messages:[{role:"system",content:system+" Oddiy matnda javob ber."},{role:"user",content:question}]})});
      if(!res.ok||!res.body){await res.body?.cancel();continue;}
      answer=await readCompletion(res.body,async partial=>{
        if(previewEnabled) previewEnabled=await tg("sendRichMessageDraft",{chat_id,...thread,draft_id:m.message_id,rich_message:{html:paragraph(partial)}}).then(r=>r.ok).catch(()=>false);
      });
    }catch{continue;}
    const r=await tg("sendRichMessage",{chat_id,...thread,rich_message:{html:paragraph(answer)}} );
    return r.ok || (await tg("sendMessage",{chat_id,...thread,text:answer})).ok;
  }
  return false;
}

async function onUpdate(u: any) {
  if (u.my_chat_member) return onMyChatMember(u.my_chat_member);
  if (u.callback_query) return onCallback(u.callback_query);
  if (u.pre_checkout_query) return onPreCheckout(u.pre_checkout_query);
  const m = u.message; if (!m || !m.chat) return;
  if (m.successful_payment) return onPaid(m);
  if (m.refunded_payment) return onRefunded(m);
  if (m.chat.type === "group" || m.chat.type === "supergroup") { bg(groupMessage(m)); return; }
  if (m.chat.type !== "private") return;
  const chat = await upsertChat(m.from, m.chat.id); if (!chat) return;
  const text = String(m.text ?? "").trim();
  if (text && m.reply_to_message && await supportReply(chat, m)) return;
  if (text && !text.startsWith("/") && await adminAwait(chat.chat_id, m.from.id, text)) return;
  if (text === "/admin") return adminPanel(chat.chat_id, m.from.id);
  if (text && !text.startsWith("/") && await supportAwait(chat, m)) return;
  if (text === "/pro" || text === "/start pro") return proOffer(chat);
  if (text === "/paysupport") return paySupport(chat);
  if (text === "/terms") return show(chat.chat_id, TERMS_TEXT, { reply_markup: { inline_keyboard: [[{ text: "To'liq shartlar", url: "https://worddrop-app.uz/terms.html#pro" }]] } });
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
  if (text === "/menu" || text === "/help") return show(chat.chat_id, "Nima qilamiz?", { reply_markup: KB_MAIN });
  if (text === "/word") return richWord(chat.chat_id);
  if (/^\/speaking(?:@WordDropUzBot)?$/i.test(text)) return speakingMenu(chat.chat_id);
  if (text === "/quiz") return sendQuiz(chat.chat_id);
  if (text === "/review") return onCallback({ data: "r", message: { chat: { id: chat.chat_id, type: "private" } }, id: "" });
  if (text === "/top") return onCallback({ data: "t", message: { chat: { id: chat.chat_id, type: "private" } }, id: "" });
  if (text === "/settings") return show(chat.chat_id, "⚙️ <b>Sozlamalar</b>\nEslatmalar Toshkent vaqti bo'yicha keladi.", { reply_markup: kbSettings(chat) });
  if (text === "/stop") { await db.from("wd_tg_chats").update({ morning: false, evening: false }).eq("chat_id", chat.chat_id); return show(chat.chat_id, "Eslatmalar o'chirildi. Qayta yoqish: /settings"); }
  if (text.startsWith("/")) return send(chat.chat_id, "Bunday buyruq yo'q. Menyu: /menu");

  // Oddiy matn → Drop AI (admin sozlamasiga ko'ra)
  const gate = await dmGate(chat); if (gate) return send(chat.chat_id, gate, { reply_markup: KB_MAIN });
  const q = await askAllowed(chat);
  if (!q.ok) return limitMsg(chat);
  await tg("sendChatAction", { chat_id: chat.chat_id, action: "typing" });
  const s = chat.user_id ? await userSummary(chat.user_id) : null;
  const delivered = await streamTutor(m,
    `Sen "Drop" — WordDrop ingliz tili ilovasining Telegram'dagi o'qituvchisisan. Til, san’at, fan, texnologiya va kundalik hayot haqida erkin suhbatlash. Suhbatdosh aytgan aniq detalga e’tibor ber, dalil bilan taxminni ajrat. Javob shakli va uzunligini savolga mosla. Oddiy savolga bevosita javob ber. Kerak bo‘lsa misol, nozik hazil yoki fikrni ochadigan savol ishlat. Har safar mashq yoki savol bilan tugatma. O‘z ovozingda gapir. ${UZ}
${s ? `O'quvchi: ${s.name || "—"}, XP ${s.xp}, seriya ${s.streak} kun, zaif so'zlari: ${s.weak.join("; ") || "yo'q"}.` : ""}
`,clip((m.reply_to_message?.from?.is_bot && m.reply_to_message?.text ? "Oldingi javob: "+clip(m.reply_to_message.text,650)+"\nSavol: " : "")+text,1850));
  if(delivered) await askBump(chat);
  else await send(chat.chat_id,"Hozir javob bera olmadim. Birozdan keyin qayta yozing.");
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
  if (data === "m") return show(chatId, "Nima qilamiz?", { reply_markup: KB_MAIN });
  if (data === "P") return proOffer(chat);
  if (data === "Pt") return show(chatId, TERMS_TEXT);
  if (data === "Pc") { const r = chat.user_id ? await cancelSub(chat.user_id) : { ok: false, error: "Hisob ulanmagan" }; return show(chatId, r.ok ? `Obuna bekor qilindi. Pro ${fmtDay(Date.parse((r as any).until))} gacha ishlashda davom etadi.` : "Bekor qilinmadi: " + esc((r as any).error)); }
  if (data === "w") return richWord(chatId);
  const review=/^(rx|rp|rr):(\d+)(?::(\d+))?$/.exec(data);
  if(review && cq.from?.id===chatId){
    const id=Number(review[2]), n=Number(review[3]||0);
    if(review[1]==="rp")return feedbackPage(chatId,id,n,cq.message.message_id);
    if(review[1]==="rx")return replayFinding(chatId,id,n);
    const prior=await kv("review:"+chatId+":"+id);
    return prior?sendPractice(chatId,prior.idx,prior.card,cq.message.message_id):speakingMenu(chatId,cq.message.message_id);
  }
  if(data.startsWith("sgo:")){
    const state=await kv(sessionKey(chatId));
    if(state?.phase!=="ready" || state.token!==data.slice(4) || state.message!==cq.message.message_id)return;
    const {data:changed}=await db.from("wd_tg_kv").update({val:{...state,phase:"active",at:Date.now()}})
      .eq("key",sessionKey(chatId)).eq("val->>phase","ready").eq("val->>token",state.token).select("key");
    if(changed?.length)await taskScreen(chatId,state,true);
    return;
  }
  if (data === "skmenu" || data === "sp:0") return speakingMenu(chatId,cq.message.message_id);
  if(data === "sp:1") return sendPractice(chatId,cards.findIndex(c=>c.part==="2"));
  if(/^(sk|snew):\d{1,2}$/.test(data)) return sendPractice(chatId,Number(data.split(":")[1]),undefined,cq.message.message_id);
  if (data === "q") return sendQuiz(chatId);
  if (data.startsWith("a:")) {
    const [, wid, pick, corr] = data.split(":"); const ok = pick === corr;
    const { data: w } = await db.from("word_translations").select("en,uz,ipa,ex").eq("id", Number(wid)).maybeSingle();
    const streak = ok ? chat.quiz_streak + 1 : 0;
    await db.from("wd_tg_chats").update({ quiz_total: chat.quiz_total + 1, quiz_ok: chat.quiz_ok + (ok ? 1 : 0), quiz_streak: streak }).eq("chat_id", chatId);
    const head = ok ? `✅ <b>To'g'ri!</b>${streak >= 3 ? `  🔥 ${streak} ketma-ket` : ""}` : `❌ <b>Afsus.</b>`;
    return show(chatId, `${head}\n\n<b>${esc(w?.en)}</b>${w?.ipa ? ` <i>${esc(w.ipa)}</i>` : ""} — ${esc(w?.uz)}${w?.ex ? `\n▸ ${esc(w.ex)}` : ""}\n\nNatija: ${chat.quiz_ok + (ok ? 1 : 0)}/${chat.quiz_total + 1}`,
      {reply_markup: { inline_keyboard: [[{ text: "Keyingi savol ➜", callback_data: "q" }]] } },cq.message.message_id);
  }
  if (data === "r") {
    if (!chat.user_id) return show(chatId, "Takrorni ko'rish uchun WordDrop hisobingizni ulang: ilovada Profil → Telegram.", { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop", url: APP_URL }]] } });
    const s = await userSummary(chat.user_id);
    return show(chatId, `🧠 <b>Takrorlash</b>\n\nBugun kutayotgan so'zlar: <b>${s.due}</b>\nLug'atingizda: ${s.words} ta so'z\n🔥 Seriya: ${s.streak} kun${s.weak.length ? `\n\n<b>Tez unutilayotganlar:</b>\n${s.weak.map((x) => "• " + esc(x)).join("\n")}` : ""}`, { reply_markup: { inline_keyboard: [[{ text: "Takrorlashni boshlash", url: APP_URL }]] } });
  }
  if (data === "t") {
    const { data: top } = await db.rpc("wd_tg_top", { n: 10 });
    const medals = ["🥇", "🥈", "🥉"];
    return show(chatId, `🏆 <b>WordDrop reytingi</b>\n\n${(top ?? []).map((r: any, i: number) => `${medals[i] ?? (i + 1) + "."} ${esc(r.name)} — <b>${r.xp}</b> XP`).join("\n") || "Hali ma'lumot yo'q."}`, { reply_markup: { inline_keyboard: [[{ text: "📱 Reytingga kirish", url: APP_URL }]] } });
  }
  if (data === "s") return show(chatId, "⚙️ <b>Sozlamalar</b>\nEslatmalar Toshkent vaqti bo'yicha keladi.", { reply_markup: kbSettings(chat) });
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
  if (cmd === "/reklama_off" || cmd === "/reklama_on") {
    if (!(await canModerate(chatId, f.id))) return;
    await db.from("wd_tg_groups").update({ promo: cmd === "/reklama_on" }).eq("chat_id", chatId);
    return send(chatId, cmd === "/reklama_on" ? "📣 WordDrop e'lonlari yana yoqildi." : "🔕 Tushunarli — bu guruhga WordDrop e'lonlarini yubormayman. Qayta yoqish: /reklama_on");
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

/* ───────── Guruhlarga muntazam e'lon (reklama) ─────────
   Har N soatda (bot_cfg.promo_hours) faol guruhga bitta foydali post: kun so'zi, viktorina yoki imkoniyat haqida.
   Jim soatlar, /jim va guruhning o'z sozlamasi (/reklama_off) hurmat qilinadi; 3 kundan beri jim guruhlarga yuborilmaydi. */
const PROMO_FEATS = [
  "🎙 <b>Inglizcha gapirishni mashq qilmoqchimisiz?</b>\nBotga ovozli xabar yuboring — Drop talaffuz va grammatikangizni tekshirib, tabiiyroq variantini aytadi.",
  "📘 <b>1 daqiqada shaxsiy kitobcha</b>\nDrop mavzu bo'yicha qoidalar, misollar, mashqlar va qirqiladigan kartochkalar bilan rangli PDF tuzadi va Telegram'ga yuboradi.",
  "🔥 <b>Kuniga 10 daqiqa yetarli</b>\nSo'zlar, aqlli takror (SRS), duel va haftalik liga — WordDrop o'zbeklar uchun bepul ingliz tili ilovasi.",
  "🧠 <b>So'zlar esdan chiqib ketyaptimi?</b>\nWordDrop har bir so'zni aynan unutishingizdan oldin takrorlatadi va o'zbekcha eslab qolish usulini beradi.",
  "💬 <b>Drop AI — cho'ntakdagi o'qituvchi</b>\nGrammatika, tarjima, IELTS savollari — botga yozing, tushunarli o'zbekcha javob oling.",
];
async function groupPromo(g: any) {
  const B = await me();
  const kb = { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", url: `https://t.me/${B.username}?start=g` }, { text: "🌐 Sayt", url: "https://worddrop-app.uz" }]] };
  const r = Math.random();
  let res: any;
  if (r < 0.34) { const v = await wordOfDay(); res = await send(g.chat_id, wodText(v ?? {}) + "\n\n💧 Har kuni shunday so'zlar, takror va Drop AI — WordDrop'da bepul.", { reply_markup: kb }); }
  else if (r < 0.55) { await sendGroupQuiz(g.chat_id); res = await send(g.chat_id, "🎯 Shunday savollar bilan har kuni mashq qilish — WordDrop'da.", { reply_markup: kb }); }
  else res = await send(g.chat_id, PROMO_FEATS[Math.floor(Math.random() * PROMO_FEATS.length)], { reply_markup: kb });
  if (res && !res.ok && res.error_code === 403) await db.from("wd_tg_groups").update({ status: "left" }).eq("chat_id", g.chat_id);
  return !!res?.ok;
}
async function promoTick(log: Record<string, unknown>) {
  const conf = await cfg(); if (conf.promo === false) return;
  const hrs = Math.max(1, Math.min(48, Number(conf.promo_hours) || 5));
  const cutoff = new Date(Date.now() - hrs * 3600_000).toISOString();
  const active = new Date(Date.now() - 3 * 86400_000).toISOString();
  const { data: gs } = await db.from("wd_tg_groups").select("*").eq("status", "on").eq("promo", true)
    .or(`last_promo_at.is.null,last_promo_at.lt.${cutoff}`).gte("updated_at", active).limit(15);
  let n = 0;
  for (const g of gs ?? []) {
    if (!g.last_promo_at) { await db.from("wd_tg_groups").update({ last_promo_at: nowIso() }).eq("chat_id", g.chat_id); continue; }   // birinchisi N soatdan keyin
    if (inQuiet(g) || (g.muted_until && Date.parse(g.muted_until) > Date.now())) continue;
    const h = tz().hour; if (h < 9 || h >= 22) continue;   // tunda yubormaymiz
    if (await groupPromo(g)) n++;
    await db.from("wd_tg_groups").update({ last_promo_at: nowIso() }).eq("chat_id", g.chat_id);
    await sleep(60);
  }
  if (n) log.promo = n;
}

/* ───────── Guruh viktorinasi ───────── */
async function sendGroupQuiz(chatId: number, message?:number) {
  const w = await randomWord(Math.floor(Math.random() * 1e9));
  if (!w) return;
  const opts = [...(await distractors(w)), w.uz].sort(() => Math.random() - .5);
  const correct = opts.indexOf(w.uz);
  const text= `🎯 <b>Kim birinchi topadi?</b>\n\n<b>${esc(w.en)}</b>${w.ipa ? ` <i>${esc(w.ipa)}</i>` : ""}`,
    extra={ reply_markup: { inline_keyboard: opts.map((o, i) => [{ text: o, callback_data: `a:${w.id}:${i}:${correct}` }]) } };
  return message?tg("editMessageText",{chat_id:chatId,message_id:message,text,parse_mode:"HTML",...extra}):send(chatId,text,extra);
}
async function groupCb(cq: any) {
  const data = String(cq.data || ""); const chatId = cq.message.chat.id;
  if (data === "q") { tg("answerCallbackQuery", { callback_query_id: cq.id }); return sendGroupQuiz(chatId,cq.message.message_id); }
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
async function transcribe(fileId: string, timing=false) {
  if (!GROQ || !BOT_TOKEN) return null;
  const f = await tg("getFile", { file_id: fileId }); if (!f.ok) return null;
  const audio = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${f.result.file_path}`);
  if (!audio.ok) return null;
  const blob = await audio.blob();
  const models = timing ? ["whisper-large-v3", "whisper-large-v3-turbo"] : ["whisper-large-v3-turbo", "whisper-large-v3"];
  for (const model of models) {
    const fd = new FormData();
    fd.append("file", blob, (f.result.file_path.split("/").pop() || "voice.ogg").replace(/\.oga$/, ".ogg"));
    if (timing) fd.append("timestamp_granularities[]", "word");
    fd.append("model", model); fd.append("response_format", "verbose_json"); fd.append("temperature", "0");
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${GROQ}` }, body: fd });
    if (!r.ok) { console.error("[whisper]", model, r.status, (await r.text()).slice(0, 200)); continue; }
    const j = await r.json();
    return { audio:blob,words:(Array.isArray(j.words)?j.words:[]).filter((w:any)=>typeof w.word==="string"&&Number.isFinite(w.start)&&w.end>w.start) as TimedWord[],seconds:Number(j.duration)||0, text: String(j.text || "").trim(), lang: String(j.language || "") };
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
  const key=sessionKey(chat.chat_id), state=await kv(key);
  if(state?.phase==="grading" && Date.now()-state.at<180000)return;
  if(state?.phase==="ready")return taskScreen(chat.chat_id,state,false);
  if(state?.phase!=="active" || Date.now()-state.at>30*60000)
    return speakingMenu(chat.chat_id,undefined,"Ovozni tekshirtirish uchun qismni tanlang va «Boshlash»ni bosing.");
  if((m.date && m.date < Math.floor(state.at/1000)) ||
     (m.reply_to_message && m.reply_to_message.message_id!==state.message)) return;
  const v=m.voice||m.audio||m.video_note;
  if((v.duration||0)>120)return send(chat.chat_id,"Javobni ikki daqiqagacha qisqartirib yuboring.");
  if(!(await askAllowed(chat)).ok)return limitMsg(chat);
  const {data:claim}=await db.from("wd_tg_kv").update({val:{...state,phase:"grading",at:Date.now()}})
    .eq("key",key).eq("val->>phase","active").eq("val->>token",state.token).select("key");
  if(!claim?.length)return;
  try{
    await speakingScreen(chat.chat_id,state.message,"<h2>Javob tekshirilmoqda…</h2>","Javob tekshirilmoqda…",[]);
    const t=await transcribe(v.file_id,true);
    if(!t?.text)throw Error("transcription");
    await gradePractice(chat,state.idx,t.text,t.seconds||v.duration,m.message_id,state.card,v.file_id,t.audio,t.words);
  } catch {
    await speakingScreen(chat.chat_id,state.message,"<p>Ovozli javobni tekshirish yakunlanmadi.</p>","Ovozli javobni tekshirish yakunlanmadi.",[[{text:"Qayta boshlash",callback_data:"skmenu"}]]);
  } finally {
    await db.from("wd_tg_kv").update({val:{...state,phase:"finished",at:Date.now()}}).eq("key",key).eq("val->>token",state.token).eq("val->>phase","grading");
  }
}

/* ═════════════════ BOTDAGI ADMIN PANELI (/admin) ═════════════════ */
async function panel(chatId: number, msgId: number | null, text: string, rows: any[][]) {
  return show(chatId,text,{reply_markup:{inline_keyboard:rows}},msgId||undefined);
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
    `📣 Guruhlarga e'lon: <b>${conf.promo ? `har ${conf.promo_hours} soatda` : "o'chiq"}</b>\n` +
    (B.can_read ? "" : `\n⚠️ <b>Privacy mode yoqilgan</b> — bot guruhlarda faqat buyruqlarni ko'radi. @BotFather → /setprivacy → @${esc(B.username)} → <b>Disable</b>, so'ng botni guruhdan chiqarib qayta qo'shing.\n`);
  return panel(chatId, msgId, text, [
    [{ text: `👥 Guruhlar (${on + pend})`, callback_data: "AG" }],
    [{ text: dot(conf.dm === "all") + "Hammaga", callback_data: "Ad:all" }, { text: dot(conf.dm === "linked") + "Ulanganlarga", callback_data: "Ad:linked" }, { text: dot(conf.dm === "none") + "Hech kimga", callback_data: "Ad:none" }],
    [{ text: `${conf.approve_groups ? "✅" : "⬜️"} Yangi guruhlarni men tasdiqlayman`, callback_data: "Aa" }],
    [{ text: `${conf.promo ? "📣" : "🔕"} Guruhlarga e'lon: ${conf.promo ? "yoqilgan" : "o'chiq"}`, callback_data: "Aq" }],
    [3, 5, 8, 12].map((h) => ({ text: dot(Number(conf.promo_hours) === h) + `har ${h} soat`, callback_data: `Ah:${h}` })),
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
    [{ text: g.promo ? "📣 E'lonlar: yoqilgan" : "🔕 E'lonlar: o'chiq", callback_data: `Agv:${G}` }],
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
    return show(chatId, prompt + "\n\n<i>Matnni shu yerga yozing. O'chirish uchun «-» yuboring. Bekor qilish: /admin</i>");
  };
  switch (k) {
    case "A": return adminPanel(chatId, cq.from.id, msgId);
    case "Ad": { const c = await cfg(); await kvSet("bot_cfg", { ...c, dm: a }); return adminPanel(chatId, cq.from.id, msgId); }
    case "Aa": { const c = await cfg(); await kvSet("bot_cfg", { ...c, approve_groups: !c.approve_groups }); return adminPanel(chatId, cq.from.id, msgId); }
    case "Aq": { const c = await cfg(); await kvSet("bot_cfg", { ...c, promo: !c.promo }); return adminPanel(chatId, cq.from.id, msgId); }
    case "Ah": { const c = await cfg(); await kvSet("bot_cfg", { ...c, promo_hours: Math.max(1, Math.min(48, Number(a) || 5)) }); return adminPanel(chatId, cq.from.id, msgId); }
    case "Agv": { const { data: g } = await db.from("wd_tg_groups").select("promo").eq("chat_id", gid).maybeSingle(); await setG({ promo: !g?.promo }); return groupPanel(chatId, msgId, gid); }
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
  if (w.kind === "rules" || w.kind === "jokes") { await db.from("wd_tg_groups").update({ [w.kind]: val, updated_at: nowIso() }).eq("chat_id", w.gid); await groupPanel(chatId, null, w.gid); return true; }
  if (w.kind === "secret" || w.kind === "public") { await db.from("wd_tg_people").update({ [w.kind === "secret" ? "secret_notes" : "public_notes"]: val, updated_at: nowIso() }).eq("user_id", w.uid); await personPanel(chatId, null, w.gid, w.uid); return true; }
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
  if(await blockedTelegram(u.id)) return json({code:"WD_BLOCKED",error:"Bu hisob bilan hozir WordDrop’ga kirish imkoni yo‘q."},403);
  if(body.action==="tg_access") return json({ok:true});
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
      if (typeof body.promo === "boolean") n.promo = body.promo;
      if (body.promo_hours !== undefined) n.promo_hours = Math.max(1, Math.min(48, Number(body.promo_hours) || 5));
      await kvSet("bot_cfg", n); return json({ ok: true, cfg: n });
    }
    case "groups": {
      ME = null; await db.from("wd_tg_kv").delete().eq("key", "me"); const B = await me();
      const { data } = await db.from("wd_tg_groups").select("chat_id,title,username,status,mode,humor,daily_limit,used,used_day,total_msgs,learned_at,muted_until,promo,last_promo_at").neq("status", "left").order("updated_at", { ascending: false });
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
      if (typeof P.promo === "boolean") n.promo = P.promo;
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

/* ═════════════════════════════════════════════════════════════════════
   v97: WORDDROP PRO — TELEGRAM STARS (XTR)
   ─ Raqamli xizmat: provider_token bo'sh, valyuta XTR.
   ─ Oylik — Stars obunasi (30 kunda avtomatik yangilanadi); 3 oy / 1 yil — bir martalik.
   ─ Pro faqat successful_payment kelgach yoqiladi; charge_id bo'yicha takrorlanmaydi.
   ═════════════════════════════════════════════════════════════════════ */
const DAY_MS = 86400_000;
const PLANS: Record<string, { title: string; desc: string; stars: number; days: number; sub?: boolean; label: string }> = {
  m1: { title: "WordDrop Pro — oylik", label: "1 oy", desc: "Drop AI 100/kun, Pro kitobchalar, haftalik shaxsiy kitobcha, oyiga 2 streak muzlatgich, Pro ramka. Har 30 kunda avtomatik yangilanadi, istalgan vaqt bekor qilish mumkin.", stars: 149, days: 30, sub: true },
  m3: { title: "WordDrop Pro — 3 oy", label: "3 oy", desc: "Drop AI 100/kun, Pro kitobchalar, haftalik shaxsiy kitobcha, oyiga 2 streak muzlatgich, Pro ramka — 90 kun. Bir martalik to'lov.", stars: 399, days: 90 },
  y1: { title: "WordDrop Pro — 1 yil", label: "1 yil", desc: "Drop AI 100/kun, Pro kitobchalar, haftalik shaxsiy kitobcha, oyiga 2 streak muzlatgich, Pro ramka — 365 kun. Bir martalik to'lov.", stars: 1290, days: 365 },
};
const PRO_PERKS = ["Drop AI — kuniga 100 ta so'rov (oddiy hisobda 20)", "Pro kitobchalar: muharrir tekshiruvi, Pro muqovalar, bosmaxona sifatidagi PDF", "Haftalik shaxsiy kitobcha — zaif so'zlaringizdan", "Har oy 2 ta streak muzlatgich", "Pro tomchi ramkasi va barcha ramka/ism ranglari", "Profilda Pro belgisi"];
const TERMS_TEXT = `📄 <b>WordDrop Pro shartlari</b>

• Pro — WordDrop'dagi raqamli xizmat: Drop AI kuniga 100 ta so'rov, Pro kitobchalar, haftalik shaxsiy kitobcha, har oy 2 ta streak muzlatgich, Pro ramka va ranglar, Pro belgisi. Asosiy darslar har doim bepul qoladi.
• To'lov faqat Telegram Stars orqali. Oylik obuna har 30 kunda avtomatik yangilanadi; 3 oylik va yillik — bir martalik.
• Obunani istalgan vaqt bekor qilish mumkin: /pro → «Obunani bekor qilish» yoki Telegram sozlamalari → Stars. Pro to'langan muddat oxirigacha ishlaydi.
• Qaytarish: xariddan keyin 7 kun ichida, Pro deyarli ishlatilmagan bo'lsa, Stars qaytariladi — /paysupport orqali yozing.
• Bot orqali qilingan xaridlar bo'yicha Telegram yordam xizmati yordam bera olmaydi — barcha savollar /paysupport ga.
• To'lov qilish orqali siz shu shartlarga rozilik bildirasiz.`;

async function proRow(uid: string) { const { data } = await db.from("wd_pro").select("*").eq("user_id", uid).maybeSingle(); return data; }
const fmtDay = (ms: number) => { const d = new Date(ms + 5 * 3600_000); const MO = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]; return `${d.getUTCDate()}-${MO[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

async function proInvoiceLink(plan: string, uid: string): Promise<string | null> {
  const P = PLANS[plan]; if (!P) return null;
  const r = await tg("createInvoiceLink", { title: P.title, description: P.desc, payload: `pro:${plan}:${uid}`, currency: "XTR", provider_token: "",
    prices: [{ label: P.title, amount: P.stars }], ...(P.sub ? { subscription_period: 30 * 86400 } : {}) });
  if (!r.ok) console.error("[invoice]", r.description);
  return r.ok ? r.result : null;
}
async function limitMsg(chat: any) {
  if (!chat.user_id) return send(chat.chat_id, "Bugungi 3 ta bepul so'rov tugadi. WordDrop'ni oching — hisobingiz Telegram orqali ulanadi va kuniga 20 ta bo'ladi.", { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop", web_app: { url: APP_URL } }]] } });
  if (await isPro(chat.user_id)) return send(chat.chat_id, "Bugungi 100 ta so'rov tugadi — ajoyib mehnat! Ertaga davom etamiz 🌙");
  return send(chat.chat_id, "Bugungi 20 ta so'rov tugadi. Ertaga davom etamiz 🌙\n\n⭐ <b>Pro</b> bilan kuniga 100 ta — oyiga 149 Stars.", { reply_markup: { inline_keyboard: [[{ text: "⭐ Pro haqida", callback_data: "P" }]] } });
}
async function proOffer(chat: any) {
  if (!chat?.user_id) return show(chat.chat_id, "⭐ <b>WordDrop Pro</b> hisobingizga yoziladi. Avval WordDrop'ni shu yerda oching — hisobingiz Telegram orqali o'zi ulanadi, keyin /pro ni qayta bosing.", { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }]] } });
  const row = await proRow(chat.user_id); const active = row && Date.parse(row.until) > Date.now();
  const head = active ? `⭐ <b>Siz Pro'dasiz</b> — ${fmtDay(Date.parse(row.until))} gacha${row.sub_active ? " (oylik obuna yoqilgan)" : ""}.\nMuddatni uzaytirish mumkin:` : "⭐ <b>WordDrop Pro</b>";
  const links = await Promise.all(Object.keys(PLANS).map((k) => proInvoiceLink(k, chat.user_id)));
  const rows: any[][] = Object.keys(PLANS).map((k, i) => links[i] ? [{ text: `${PLANS[k].label} — ${PLANS[k].stars} ⭐${k === "y1" ? "  (−28%)" : k === "m3" ? "  (−11%)" : ""}`, url: links[i] }] : []).filter((r) => r.length);
  if (active && row.sub_active) rows.push([{ text: "Obunani bekor qilish", callback_data: "Pc" }]);
  rows.push([{ text: "📄 Shartlar", callback_data: "Pt" }]);
  return show(chat.chat_id, `${head}\n\n${PRO_PERKS.map((x) => "✓ " + x).join("\n")}\n\nAsosiy darslar, so'zlar va takrorlash har doim bepul. To'lov — Telegram Stars orqali, xavfsiz.`, { reply_markup: { inline_keyboard: rows } });
}
async function onPreCheckout(q: any) {
  const [k, plan, uid] = String(q.invoice_payload || "").split(":");
  const P = PLANS[plan];
  let err = "";
  if (k !== "pro" || !P || !uid) err = "Bu to'lov eskirgan. /pro orqali qayta urinib ko'ring.";
  else if (q.currency !== "XTR" || Number(q.total_amount) !== P.stars) err = "Narx o'zgargan. /pro orqali yangi to'lovni oching.";
  else { const { data } = await db.auth.admin.getUserById(uid); if (!data?.user) err = "WordDrop hisobi topilmadi. Ilovani qayta oching."; }
  return tg("answerPreCheckoutQuery", err ? { pre_checkout_query_id: q.id, ok: false, error_message: err } : { pre_checkout_query_id: q.id, ok: true });
}
async function onPaid(m: any) {
  const sp = m.successful_payment; const [k, plan, uid] = String(sp.invoice_payload || "").split(":");
  const P = PLANS[plan]; if (k !== "pro" || !P || !uid) return;
  const ins = await db.from("wd_pro_payments").insert({ charge_id: sp.telegram_payment_charge_id, user_id: uid, tg_user: m.from.id, stars: sp.total_amount, plan,
    recurring: !!sp.is_recurring, first_recurring: !!sp.is_first_recurring });
  if (ins.error) { if (String(ins.error.code) === "23505") return; console.error("[pay]", ins.error); }
  const cur = await proRow(uid); const now = Date.now();
  const curUntil = cur ? Date.parse(cur.until) : 0;
  let until: number;
  if (P.sub && sp.subscription_expiration_date) until = curUntil > now + DAY_MS ? curUntil + P.days * DAY_MS : Math.max(sp.subscription_expiration_date * 1000, now + P.days * DAY_MS - DAY_MS);
  else until = Math.max(now, curUntil) + P.days * DAY_MS;
  await db.from("wd_pro").upsert({ user_id: uid, until: new Date(until).toISOString(), plan, tg_user: m.from.id, updated_at: nowIso(),
    sub_active: P.sub ? true : (cur?.sub_active ?? false), sub_charge_id: P.sub ? sp.telegram_payment_charge_id : (cur?.sub_charge_id ?? null) });
  const renew = sp.is_recurring && !sp.is_first_recurring;
  await send(m.chat.id, renew ? `⭐ Pro obunangiz yangilandi — ${fmtDay(until)} gacha. Rahmat!` :
    `🎉 <b>Xush kelibsiz, Pro'ga!</b>\n\nPro ${fmtDay(until)} gacha faol: Drop AI kuniga 100 ta so'rov, Pro kitobchalar, haftalik shaxsiy kitobcha, streak muzlatgichlar va Pro ramka.\n\nWordDrop'ni qayta ochsangiz, hammasi yoqilgan bo'ladi.`,
    { reply_markup: { inline_keyboard: [[{ text: "📱 WordDrop'ni ochish", web_app: { url: APP_URL } }]] } });
  for (const a of await adminChatIds()) await send(a, `💰 <b>Pro sotildi</b>: ${esc(P.label)} — ${sp.total_amount} ⭐${renew ? " (obuna yangilandi)" : ""}\n${esc(fromName(m.from))}${m.from.username ? " @" + esc(m.from.username) : ""}`);
}
async function revokeFor(charge: string) {
  const { data: p } = await db.from("wd_pro_payments").select("*").eq("charge_id", charge).maybeSingle();
  if (!p) return null;
  await db.from("wd_pro_payments").update({ refunded: true }).eq("charge_id", charge);
  if (p.user_id) {
    const cur = await proRow(p.user_id);
    if (cur) {
      const days = PLANS[p.plan]?.days ?? 30;
      const left = Math.max(Date.now(), Date.parse(cur.until) - days * DAY_MS);
      await db.from("wd_pro").update({ until: new Date(left).toISOString(), sub_active: cur.sub_charge_id === charge ? false : cur.sub_active, updated_at: nowIso() }).eq("user_id", p.user_id);
    }
  }
  return p;
}
async function onRefunded(m: any) { await revokeFor(m.refunded_payment.telegram_payment_charge_id); }
async function cancelSub(uid: string) {
  const cur = await proRow(uid); if (!cur?.sub_active || !cur.sub_charge_id || !cur.tg_user) return { ok: false, error: "Faol obuna topilmadi" };
  const r = await tg("editUserStarSubscription", { user_id: cur.tg_user, telegram_payment_charge_id: cur.sub_charge_id, is_canceled: true });
  if (!r.ok) return { ok: false, error: r.description };
  await db.from("wd_pro").update({ sub_active: false, updated_at: nowIso() }).eq("user_id", uid);
  return { ok: true, until: cur.until };
}
/* /paysupport — keyingi xabar adminlarga yetkaziladi */
async function paySupport(chat: any) {
  await kvSet("sup:" + chat.chat_id, { at: Date.now() });
  return show(chat.chat_id, "💬 <b>To'lov bo'yicha yordam</b>\n\nMuammoni bitta xabarda yozing (qaysi tarif, qachon to'lagansiz, nima bo'ldi). Xabaringiz WordDrop adminiga yetkaziladi va shu yerga javob keladi.\n\n<i>Eslatma: bot orqali xaridlar bo'yicha Telegram yordam xizmati yordam bera olmaydi.</i>");
}
async function supportAwait(chat: any, m: any): Promise<boolean> {
  const w = await kv("sup:" + chat.chat_id); if (!w || Date.now() - (w.at || 0) > 30 * 60_000) return false;
  await db.from("wd_tg_kv").delete().eq("key", "sup:" + chat.chat_id);
  const { data: pays } = chat.user_id ? await db.from("wd_pro_payments").select("plan,stars,created_at,refunded").eq("user_id", chat.user_id).order("created_at", { ascending: false }).limit(3) : { data: [] as any[] };
  const info = (pays ?? []).map((p: any) => `${PLANS[p.plan]?.label ?? p.plan} ${p.stars}⭐ ${String(p.created_at).slice(0, 10)}${p.refunded ? " (qaytarilgan)" : ""}`).join("; ");
  for (const a of await adminChatIds()) {
    await send(a, `🆘 <b>/paysupport</b> — ${esc(fromName(m.from))}${m.from.username ? " @" + esc(m.from.username) : ""} (id ${m.from.id})\n${info ? "To'lovlar: " + esc(info) + "\n" : ""}\n${esc(clip(m.text, 1500))}\n\n<i>Javob: shu xabarga «reply» qilib yozing.</i>`, { reply_markup: { inline_keyboard: [[{ text: "Ilovada ko'rish", web_app: { url: APP_URL + "#bot" } }]] } });
  }
  await show(chat.chat_id, "✅ Yuborildi. Admin tez orada shu yerga javob yozadi.");
  return true;
}
/* Admin /paysupport xabariga reply qilsa — javob foydalanuvchiga boradi */
async function supportReply(chat: any, m: any): Promise<boolean> {
  const t = String(m.reply_to_message?.text || ""); const mm = t.match(/^🆘 \/paysupport — .*\(id (\d+)\)/);
  if (!mm || !(await tgIsAdmin(m.from.id))) return false;
  const r = await send(Number(mm[1]), `💬 <b>WordDrop yordam:</b>\n\n${esc(clip(m.text, 3000))}`);
  await send(chat.chat_id, r.ok ? "✅ Javob yuborildi." : "Yuborilmadi: " + esc(r.description));
  return true;
}

/* Ilova va admin uchun API */
async function proUserApi(action: string, body: any, user: any): Promise<Response | null> {
  if (action === "pro_status") {
    const row = await proRow(user.id);
    return json({ pro: !!row && Date.parse(row.until) > Date.now(), until: row?.until ?? null, plan: row?.plan ?? null, sub_active: !!row?.sub_active,
      plans: Object.entries(PLANS).map(([id, p]) => ({ id, label: p.label, stars: p.stars, days: p.days, sub: !!p.sub })), perks: PRO_PERKS });
  }
  if (action === "pro_invoice") { const link = await proInvoiceLink(String(body.plan), user.id); return link ? json({ link }) : json({ error: "To'lov oynasi ochilmadi, birozdan keyin urining" }, 502); }
  if (action === "pro_cancel") { const r = await cancelSub(user.id); return json(r, r.ok ? 200 : 400); }
  if (action === "send_pdf") {
    const path = String(body.path || "");
    if (!path.startsWith(user.id + "/") || !/\.pdf$/.test(path) || path.includes("..")) return json({ error: "Noto'g'ri fayl" }, 400);
    const { data: ch } = await db.from("wd_tg_chats").select("chat_id").eq("user_id", user.id).maybeSingle();
    if (!ch) { await db.storage.from("booklets").remove([path]); return json({ error: "Avval Telegram'ni ulang: Profil → Telegram" }, 400); }
    const { data: file, error } = await db.storage.from("booklets").download(path);
    if (error || !file) return json({ error: "Fayl topilmadi" }, 404);
    const fd = new FormData();
    fd.append("chat_id", String(ch.chat_id));
    fd.append("document", file, (clip(body.name, 60).replace(/[^\w'ʻʼЀ-ӿ -]+/g, "") || "kitobcha") + ".pdf");
    fd.append("caption", `📘 <b>${esc(clip(body.title, 120) || "Kitobcha")}</b>\n${body.pro ? "WordDrop Pro kitobcha" : "WordDrop kitobcha"} — chop etishingiz yoki telefonda o'qishingiz mumkin.`);
    fd.append("parse_mode", "HTML");
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({ ok: false, description: "Telegram javob bermadi" }));
    await db.storage.from("booklets").remove([path]);
    return r.ok ? json({ ok: true }) : json({ error: r.description || "Yuborilmadi" }, 400);
  }
  return null;
}
async function proAdminApi(action: string, body: any): Promise<Response | null> {
  if (action === "pro_stats") {
    const nowS = nowIso(); const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
    const [{ count: active }, { count: subs }, { data: pays }] = await Promise.all([
      db.from("wd_pro").select("user_id", { count: "exact", head: true }).gt("until", nowS),
      db.from("wd_pro").select("user_id", { count: "exact", head: true }).gt("until", nowS).eq("sub_active", true),
      db.from("wd_pro_payments").select("*").order("created_at", { ascending: false }).limit(40),
    ]);
    const month = (pays ?? []).filter((p: any) => p.created_at >= since && !p.refunded).reduce((s: number, p: any) => s + p.stars, 0);
    const tgIds = [...new Set((pays ?? []).map((p: any) => p.tg_user).filter(Boolean))];
    const { data: ch } = await db.from("wd_tg_chats").select("chat_id,username,first_name").in("chat_id", tgIds.length ? tgIds : [0]);
    const who = new Map((ch ?? []).map((c: any) => [Number(c.chat_id), c.username ? "@" + c.username : c.first_name || String(c.chat_id)]));
    return json({ active: active ?? 0, subs: subs ?? 0, month_stars: month, payments: (pays ?? []).map((p: any) => ({ ...p, who: who.get(Number(p.tg_user)) ?? String(p.tg_user ?? "—"), label: PLANS[p.plan]?.label ?? p.plan })) });
  }
  if (action === "pro_refund") {
    const { data: p } = await db.from("wd_pro_payments").select("*").eq("charge_id", String(body.charge_id)).maybeSingle();
    if (!p) return json({ error: "To'lov topilmadi" }, 404);
    if (p.refunded) return json({ error: "Allaqachon qaytarilgan" }, 400);
    const r = await tg("refundStarPayment", { user_id: p.tg_user, telegram_payment_charge_id: p.charge_id });
    if (!r.ok) return json({ error: r.description || "Qaytarilmadi" }, 400);
    await revokeFor(p.charge_id);
    if (p.tg_user) await send(p.tg_user, `↩️ ${p.stars} ⭐ hisobingizga qaytarildi. Savollar bo'lsa — /paysupport.`);
    return json({ ok: true });
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
  const r1 = await tg("setWebhook", { url: FN_URL, secret_token: await kv("webhook_secret"), allowed_updates: ["message", "callback_query", "my_chat_member", "pre_checkout_query"], drop_pending_updates: false });
  if (r1.ok) {
    await tg("setMyCommands", { scope: { type: "all_private_chats" }, commands: [
      { command: "speaking", description: "Multilevel Speaking mashqi" }, { command: "word", description: "Kun so'zi" }, { command: "quiz", description: "Viktorina" },
      { command: "review", description: "Takrorim" }, { command: "top", description: "Reyting" },
      { command: "settings", description: "Eslatmalar" }, { command: "pro", description: "WordDrop Pro (Stars)" },
      { command: "paysupport", description: "To'lov bo'yicha yordam" }, { command: "terms", description: "Pro shartlari" }, { command: "menu", description: "Menyu" } ] });
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

const miniLessons = [
  ["Grammar", "since va for", "I’ve lived here since May. I’ve lived here for six months.", "Since boshlanish nuqtasini, for esa muddatni bildiradi."],
  ["Word partners", "make a decision", "We need to make a decision before Friday.", "Qaror qabul qilish uchun make a decision birikmasini ishlating."],
  ["Everyday English", "Navbatda turganda", "Excuse me, is this the end of the queue?", "Navbat qayerdan boshlanishini muloyim so‘rash usuli."],
  ["Speaking", "Tanlovni asoslash", "I’d rather take the train because I can read on the way.", "Tanlovingizni ayting va unga bitta aniq sabab keltiring."],
  ["Common mix-up", "borrow va lend", "Can I borrow your pen? Can you lend me your pen?", "Borrow — vaqtincha olmoq, lend — vaqtincha bermoq."],
  ["Grammar", "used to", "We used to play outside after school.", "O‘tmishda odat bo‘lgan, hozir o‘zgargan ish haqida gapiring."],
  ["Writing", "Tafsilot bilan yozish", "The café was quiet enough for us to hear the rain.", "Joyni tasvirlaganda sezgi orqali anglanadigan bitta detal qo‘shing."],
  ["Phrasal verbs", "turn down", "She turned down the offer because the hours were too long.", "Taklifni rad etish ma’nosida turn down ishlatiladi."],
  ["Listening", "Sonlarni aniqlashtirish", "Did you say thirteen or thirty?", "Sonni tushunmagan bo‘lsangiz, ikkala variantni aytib aniqlashtiring."],
  ["Word partners", "heavy rain", "Heavy rain delayed the match.", "Kuchli yomg‘ir uchun heavy rain birikmasi tabiiy eshitiladi."],
  ["Grammar", "a few va a little", "We have a few apples and a little milk.", "A few sanaladigan ko‘plik bilan, a little sanalmaydigan ot bilan keladi."],
  ["Everyday English", "Uchrashuv vaqtini ko‘chirish", "Could we move our meeting to Thursday?", "Vaqtni o‘zgartirganda muqobil kunni ham taklif qiling."],
];
async function channelMini(channel:string, day:string, slot:number){
  const serial=Math.floor(Date.parse(day+"T00:00:00Z")/86400000);
  const [kind,topic,example,why]=miniLessons[(serial*4+slot)%miniLessons.length];
  const contexts=["at a station","in a school library","during a team project","in a café","at a concert","on a family trip","at a market"];
  const context=contexts[(serial+slot)%contexts.length];
  const draft=await groq("Write a short, accurate English lesson for Uzbek learners. Keep the supplied teaching point, give a new natural English example for the situation, an idiomatic Uzbek translation and one specific practice question. Return JSON {example,uz,exercise}. No markup.",JSON.stringify({kind,topic,example,why,context}),300,.7);
  const ok=["example","uz","exercise"].every(k=>typeof draft?.[k]==="string" && draft[k].trim().length>4 && draft[k].length<=300);
  return send(channel,"<b>"+esc(kind+" · "+topic)+"</b>\n\n"+esc(why)+"\n\n<i>"+esc(ok?draft.example:example)+"</i>"+(ok?"\n"+esc(draft.uz)+"\n\n"+esc(draft.exercise):""));
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
  // Two additional lessons per enabled daily channel feature.
  const slots = [
    {on:ap.word,h:Number(ap.word_hour??9)+3}, {on:ap.word,h:Number(ap.word_hour??9)+6},
    {on:ap.quiz,h:Number(ap.quiz_hour??18)-1}, {on:ap.quiz,h:Number(ap.quiz_hour??18)+3}
  ];
  for(const [i,slot] of slots.entries()){
    if(!slot.on || (slot.h+24)%24!==t.hour)continue;
    const key="channel-lesson:"+t.day+":"+i;
    const {error}=await db.from("wd_tg_kv").insert({key,val:"sending"});
    if(error)continue;
    const sent=await channelMini(await kv("channel"),t.day,i);
    if(!sent.ok)await db.from("wd_tg_kv").delete().eq("key",key);
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
  // 6) Guruhlarga muntazam e'lon
  await promoTick(log);
  // 7) O'rganish navbati qolib ketgan guruhlar (bittadan)
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

/* Kanal rasmlari uchun illyustratsiyalar: Microsoft Fluent Emoji Flat (MIT), ilova Iconify orqali chizadi */
const POST_ICONS = new Set<string>(["books", "open-book", "notebook", "memo", "pencil", "writing-hand", "graduation-cap", "school", "teacher", "woman-teacher", "man-student", "woman-student", "brain", "light-bulb", "speech-balloon", "thought-balloon", "left-speech-bubble", "speaking-head", "ear", "eyes", "microphone", "headphone", "loudspeaker", "bell", "star", "glowing-star", "sparkles", "trophy", "1st-place-medal", "sports-medal", "party-popper", "confetti-ball", "fire", "rocket", "chart-increasing", "bar-chart", "hourglass-done", "alarm-clock", "stopwatch", "calendar", "spiral-calendar", "check-mark-button", "cross-mark", "warning", "red-question-mark", "key", "locked", "unlocked", "link", "pushpin", "round-pushpin", "magnifying-glass-tilted-left", "gear", "hammer-and-wrench", "puzzle-piece", "house", "house-with-garden", "office-building", "hospital", "bank", "hotel", "classical-building", "stadium", "shopping-cart", "shopping-bags", "convenience-store", "department-store", "airplane", "airplane-departure", "train", "bus", "automobile", "taxi", "bicycle", "ship", "world-map", "globe-showing-europe-africa", "globe-with-meridians", "compass", "luggage", "passport-control", "ticket", "hot-beverage", "teacup-without-handle", "bubble-tea", "fork-and-knife-with-plate", "fork-and-knife", "pizza", "hamburger", "red-apple", "green-apple", "banana", "grapes", "bread", "croissant", "birthday-cake", "cookie", "ice-cream", "cooking", "pot-of-food", "green-salad", "steaming-bowl", "spaghetti", "sushi", "taco", "watermelon", "carrot", "cheese-wedge", "egg", "dog", "cat", "cat-face", "dog-face", "rabbit-face", "panda", "bear", "lion", "tiger-face", "fox", "monkey", "owl", "penguin", "butterfly", "fish", "dolphin", "elephant", "horse", "unicorn", "sun", "sun-with-face", "cloud", "umbrella", "snowflake", "rainbow", "cloud-with-rain", "high-voltage", "tornado", "water-wave", "seedling", "deciduous-tree", "evergreen-tree", "palm-tree", "cactus", "tulip", "rose", "sunflower", "herb", "four-leaf-clover", "maple-leaf", "red-heart", "orange-heart", "yellow-heart", "green-heart", "blue-heart", "purple-heart", "sparkling-heart", "smiling-face-with-smiling-eyes", "grinning-face", "face-with-tears-of-joy", "thinking-face", "star-struck", "partying-face", "smiling-face-with-sunglasses", "nerd-face", "sleeping-face", "worried-face", "pleading-face", "angry-face", "face-with-monocle", "hugging-face", "winking-face", "thumbs-up", "clapping-hands", "waving-hand", "handshake", "raising-hands", "flexed-biceps", "folded-hands", "ok-hand", "victory-hand", "mobile-phone", "laptop", "desktop-computer", "keyboard", "camera", "camera-with-flash", "television", "radio", "video-game", "joystick", "robot", "battery", "electric-plug", "money-bag", "dollar-banknote", "credit-card", "coin", "gem-stone", "wrapped-gift", "briefcase", "soccer-ball", "basketball", "tennis", "volleyball", "running-shoe", "person-running", "man-running", "woman-running", "person-swimming", "guitar", "musical-note", "musical-notes", "artist-palette", "framed-picture", "performing-arts", "clapper-board", "movie-camera", "popcorn", "man-health-worker", "woman-health-worker", "police-officer", "man-cook", "woman-cook", "man-farmer", "woman-scientist", "man-technologist", "woman-technologist", "firefighter", "pilot", "astronaut", "detective", "people-hugging", "baby", "bed", "couch-and-lamp", "door", "window", "toilet", "shower", "bathtub", "broom", "basket", "soap", "toothbrush", "jeans", "dress", "t-shirt", "crown", "top-hat", "glasses", "sunglasses", "envelope", "incoming-envelope", "package", "newspaper", "scroll", "page-facing-up", "clipboard", "card-index", "bookmark", "label", "paperclip", "scissors", "straight-ruler", "triangular-ruler", "first-quarter-moon", "crescent-moon", "new-moon-face", "full-moon-face", "night-with-stars", "sunrise", "cityscape", "milky-way"]);
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
"card" — rasm uchun qisqa matnlar (rasm dasturda chiziladi): {"title":"rasm sarlavhasi (≤40 belgi)","big":"katta matn: so'z, qoida yoki raqam (≤28 belgi)","sub":"izoh (≤90 belgi)","lines":["2-4 qisqa qator (≤60 belgi)"],"cta":"chaqiruv (≤36 belgi)","icon":"illyustratsiya nomi"}
"icon" uchun FAQAT shu ro'yxatdan mavzuga eng mos nomni tanla: ${[...POST_ICONS].join(" ")}
"quiz" turida "poll": {"question":"...","options":["3-4 variant"],"correct":0,"explanation":"qisqa izoh"}
Agar "word" bo'lsa, quyidagi bazadagi so'zlardan foydalan: ${words.map((w) => `${w.en}=${w.uz}`).join(", ")}.
JSON: {"posts":[{"kind":"word|grammar|quiz|promo|motivation|tip","caption":"post matni (≤900 belgi)","card":{...},"poll":null|{...}}]}`,
    "Postlarni tayyorla.", 4000, 0.8);
  const posts = (Array.isArray(a?.posts) ? a.posts : []).slice(0, count).map((p: any) => ({
    kind: clip(p?.kind, 20) || "tip",
    caption: clip(p?.caption, 1000).replace(/<(?!\/?(b|i)>)[^>]*>/g, ""),
    card: { title: clip(p?.card?.title, 60), big: clip(p?.card?.big, 40), sub: clip(p?.card?.sub, 140), lines: (Array.isArray(p?.card?.lines) ? p.card.lines : []).slice(0, 4).map((x: unknown) => clip(x, 80)), cta: clip(p?.card?.cta, 50), icon: POST_ICONS.has(String(p?.card?.icon || "")) ? String(p.card.icon) : "" },
    poll: p?.poll && p.poll.question && Array.isArray(p.poll.options) ? { question: clip(p.poll.question, 280), options: p.poll.options.slice(0, 4).map((x: unknown) => clip(x, 90)), correct: Number(p.poll.correct) || 0, explanation: clip(p.poll.explanation, 190) } : null,
  }));
  return posts;
}

/* ───────── Server ───────── */
async function blockedTelegram(id: number) {
  const {data,error}=await db.from("wd_access_blocks").select("telegram_id").eq("telegram_id",id).maybeSingle();
  if(error) throw error;
  return !!data;
}
Deno.serve(async (req) => {
  if (req.method === "HEAD") return new Response(null,{headers:{"X-WordDrop-Pronunciation":Deno.env.get("AZURE_SPEECH_KEY")&&Deno.env.get("AZURE_SPEECH_REGION")?"configured":"unconfigured"}});
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    // 1) Telegram webhook
    const tgSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (tgSecret !== null) {
      if (tgSecret !== (await kv("webhook_secret"))) return new Response("forbidden", { status: 403 });
      const u = await req.json().catch(() => null);
      const sender=u?.message?.from?.id ?? u?.callback_query?.from?.id ?? u?.pre_checkout_query?.from?.id ?? u?.my_chat_member?.from?.id;
      if(sender && await blockedTelegram(sender)) return new Response("ok");
      if (u) { try { await nav.run(u,()=>onUpdate(u)); } catch (e) { console.error("[update]", e); } }
      return new Response("ok");
    }
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    // 2) Cron
    if (action === "cron") {
      if (req.headers.get("x-cron-secret") !== (await kv("cron_secret"))) return json({ error: "forbidden" }, 403);
      return json({ ok: true, ...(await cron()) });
    }
    if (action === "tg_login" || action === "tg_access") return await tgLogin(body);
    const user = await authUser(req);
    if (!user) return json({ error: "Avval WordDrop hisobingizga kiring" }, 401);

    const denied=await db.from("wd_access_blocks").select("telegram_id").contains("accounts",[user.id]).limit(1);
    if(denied.error) throw denied.error;
    if(denied.data?.length) return json({code:"WD_BLOCKED",error:"Bu hisob bilan hozir WordDrop’ga kirish imkoni yo‘q."},403);
    // 3) Foydalanuvchi
    { const r = await proUserApi(action, body, user); if (r) return r; }
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
    { const r = await proAdminApi(action, body); if (r) return r; }
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
