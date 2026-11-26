// Supabase Edge Function: ml-exam (WordDrop v101)
// Multilevel (CEFR) sinov imtihoni: testlarni tuzish (admin) va Writing/Speaking baholash. Mantiq — ml.ts.
import { createClient } from "npm:@supabase/supabase-js@2";
import { groqJson } from "./examiner.ts";
import { mlHandle } from "./ml.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, n).trim();
const SB = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = Deno.env.get("GROQ_API_KEY"); if (!apiKey) return json({ error: "Server xatosi" }, 500);
    const mode = String(body.mode || "");
    if (!mode.startsWith("ml_")) return json({ error: "Noma'lum rejim" }, 400);
    const deadline = Date.now() + 128_000;   // 150 s chegarasidan oldin javob qaytarish uchun
    const gj = (a: string, m: any[], msg: unknown[], t: number, temp: number) => groqJson(a, m, msg, t, temp, deadline);
    return await mlHandle(mode, { apiKey, groqJson: gj, SB, json, clip, req, body, deadline });
  } catch (e) {
    console.error("[ml-exam]", e);
    return json({ error: "Ichki xato" }, 500);
  }
});
