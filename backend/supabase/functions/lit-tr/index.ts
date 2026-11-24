// lit-tr — «Adabiyot»: xatboshini o'zbekchaga tarjima qiladi (talab bo'yicha) va keshlaydi.
// POST {work_id, idx, i:[0,1,2]}  (Authorization: foydalanuvchi JWT yoki publishable key)
// Kirish: bepul bob — hammaga; qolganlari — Pro yoki admin. Tarjima wd_lit_tr'da bir marta saqlanadi.
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GROQ = Deno.env.get("GROQ_API_KEY") || "";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const DAY_LIMIT = 600; // yangi (keshda yo'q) tarjimalar, bitta foydalanuvchiga kuniga

function hash(s: string) { let h = 5381; for (let k = 0; k < s.length; k++) h = ((h << 5) + h + s.charCodeAt(k)) | 0; return (h >>> 0).toString(36) + ":" + s.length; }

async function translate(work: string, author: string, items: { i: number; en: string }[]): Promise<Record<number, string>> {
  const sys = `You are a literary translator from English into Uzbek (Latin script). Translate each paragraph of "${work}" by ${author} faithfully and naturally, keeping dialogue, names and tone. Use the apostrophe ' in o', g' and for tutuq belgisi. Do not add comments. Return JSON {"t":[{"i":number,"uz":string}]}.`;
  const user = JSON.stringify(items.map((x) => ({ i: x.i, en: x.en })));
  for (const model of ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]) {
    try {
      const extra = model.startsWith("qwen") ? { reasoning_effort: "none", reasoning_format: "hidden" } : { include_reasoning: false, reasoning_effort: "low" };
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ}` },
        body: JSON.stringify({ model, temperature: 0.3, max_completion_tokens: 6000, response_format: { type: "json_object" }, ...extra, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
      });
      if (!r.ok) continue;
      const d = await r.json();
      const raw = String(d?.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "");
      let j: any; try { j = JSON.parse(raw); } catch { const a = raw.indexOf("{"), b = raw.lastIndexOf("}"); try { j = JSON.parse(raw.slice(a, b + 1)); } catch { continue; } }
      const out: Record<number, string> = {};
      for (const t of (j?.t || [])) if (typeof t?.uz === "string" && t.uz.trim()) out[Number(t.i)] = t.uz.trim();
      if (Object.keys(out).length) return out;
    } catch { /* keyingi model */ }
  }
  return {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return J({ error: "POST" }, 405);
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  const work = String(b.work_id || ""), idx = Number(b.idx);
  const want = (Array.isArray(b.i) ? b.i : [b.i]).map(Number).filter((n: number) => Number.isInteger(n) && n >= 0).slice(0, 8);
  if (!/^[a-z0-9-]{2,60}$/.test(work) || !Number.isInteger(idx) || !want.length) return J({ error: "bad request" }, 400);

  const { data: ch } = await sb.from("wd_lit_chapters").select("free, body").eq("work_id", work).eq("idx", idx).maybeSingle();
  if (!ch) return J({ error: "not found" }, 404);

  // foydalanuvchi
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let uid: string | null = null;
  if (tok && tok.split(".").length === 3) { try { const { data } = await sb.auth.getUser(tok); uid = data?.user?.id ?? null; } catch { /* */ } }
  if (!ch.free) {
    if (!uid) return J({ error: "pro", pro: true }, 403);
    const [{ data: pro }, { data: adm }] = await Promise.all([sb.rpc("wd_is_pro", { uid }), sb.rpc("wd_uid_is_admin", { uid })]);
    if (!pro && !adm) return J({ error: "pro", pro: true }, 403);
  }

  const paras: any[] = ch.body?.paras || [];
  const res: Record<number, string> = {};
  const need: { i: number; en: string; h: string }[] = [];
  const { data: cached } = await sb.from("wd_lit_tr").select("i, uz, h").eq("work_id", work).eq("idx", idx).in("i", want);
  const cmap = new Map((cached || []).map((r: any) => [r.i, r]));
  for (const i of want) {
    const p = paras[i]; if (!p) continue;
    if (p.uz) { res[i] = p.uz; continue; }
    const h = hash(String(p.en || "")); const c: any = cmap.get(i);
    if (c && c.h === h) res[i] = c.uz; else need.push({ i, en: String(p.en || ""), h });
  }

  if (need.length) {
    const key = uid || ("ip:" + (req.headers.get("x-forwarded-for") || "").split(",")[0].trim());
    const day = new Date().toISOString().slice(0, 10);
    const { data: u } = await sb.from("wd_lit_tr_use").select("n").eq("user_key", key).eq("day", day).maybeSingle();
    if ((u?.n || 0) + need.length > DAY_LIMIT) return J({ t: res, limit: true });
    const { data: w } = await sb.from("wd_lit_works").select("title, author").eq("id", work).maybeSingle();
    const got = await translate(w?.title || work, w?.author || "", need);
    const rows = need.filter((x) => got[x.i]).map((x) => ({ work_id: work, idx, i: x.i, uz: got[x.i], h: x.h }));
    if (rows.length) {
      await sb.from("wd_lit_tr").upsert(rows);
      await sb.from("wd_lit_tr_use").upsert({ user_key: key, day, n: (u?.n || 0) + rows.length });
      rows.forEach((r) => (res[r.i] = r.uz));
    }
  }
  return J({ t: res });
});
