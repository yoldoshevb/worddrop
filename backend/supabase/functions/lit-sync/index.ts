// lit-sync — «Adabiyot» asarini GitHub'dagi content/adabiyot/<id>.json faylidan bazaga yozadi.
// Chaqirish: POST {id:"the-stranger"} + x-cron-secret sarlavhasi (wd_tg_kv.cron_secret).
// Faqat main tarmog'idagi fayl o'qiladi — "deploy faqat GitHub main'dan" qoidasiga mos.
import { createClient } from "npm:@supabase/supabase-js@2";

const RAW = "https://raw.githubusercontent.com/yoldoshevb/worddrop/main/content/adabiyot/";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const words = (s: string) => (String(s || "").match(/[A-Za-zÀ-ɏ'’-]+/g) || []).length;

Deno.serve(async (req) => {
  if (req.method !== "POST") return J({ error: "POST" }, 405);
  const { data: kv } = await sb.from("wd_tg_kv").select("val").eq("key", "cron_secret").maybeSingle();
  const secret = kv?.val;
  if (!secret || req.headers.get("x-cron-secret") !== String(secret)) return J({ error: "forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* */ }
  const id = String(body.id || "");
  if (!/^[a-z0-9-]{2,60}$/.test(id)) return J({ error: "bad id" }, 400);

  const r = await fetch(RAW + id + ".json?t=" + Date.now(), { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) return J({ error: "github " + r.status }, 404);
  let w: any;
  try { w = await r.json(); } catch { return J({ error: "json" }, 422); }
  if (w.id !== id || !w.title || !w.author || !Array.isArray(w.chapters) || !w.chapters.length) return J({ error: "schema" }, 422);

  const freeN = Math.max(0, Number(w.free_chapters ?? 1));
  let total = 0;
  const toc = w.chapters.map((c: any, i: number) => {
    const n = (c.paras || []).reduce((a: number, p: any) => a + words(p.en), 0);
    total += n;
    return { idx: i, title: String(c.title || ""), title_uz: String(c.title_uz || ""), part: c.part ?? null, words: n, free: i < freeN };
  });

  const work = {
    id, title: w.title, author: w.author, year: w.year ?? null, orig_lang: w.orig_lang ?? null,
    edition: w.edition === "study" ? "study" : "full", level: w.level ?? null, genres: w.genres ?? [],
    cover: w.cover ?? {}, meta: w.meta ?? {}, toc, words: total, sort: w.sort ?? 100,
    published: w.published !== false, updated_at: new Date().toISOString(),
  };
  const e1 = (await sb.from("wd_lit_works").upsert(work)).error;
  if (e1) return J({ error: e1.message }, 500);

  const rows = w.chapters.map((c: any, i: number) => ({
    work_id: id, idx: i, free: i < freeN, updated_at: work.updated_at,
    body: { paras: c.paras || [], gloss: c.gloss || [], quiz: c.quiz || [], note_uz: c.note_uz || "", recap_uz: c.recap_uz || "" },
  }));
  const e2 = (await sb.from("wd_lit_chapters").upsert(rows)).error;
  if (e2) return J({ error: e2.message }, 500);
  await sb.from("wd_lit_chapters").delete().eq("work_id", id).gte("idx", rows.length);
  return J({ ok: true, id, chapters: rows.length, words: total });
});
