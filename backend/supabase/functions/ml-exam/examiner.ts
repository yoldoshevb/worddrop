const json = (body: unknown, status:number) => Response.json(body,{status});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function extractJson(raw: string): any | null {
  const s = String(raw).replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(s); } catch { /* */ }
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch { /* */ } }
  return null;
}
/* deadline: shu so'rov uchun oxirgi muddat (ms). Supabase 150 s da ishchini o'ldiradi —
   shuning uchun har chaqiruv qolgan vaqtga sig'adi, sig'masa tezda "qayta urining" deb qaytamiz. */
export async function groqJson(apiKey: string, models: any[], messages: unknown[], maxTokens: number, temperature: number, deadline = Date.now() + 120_000): Promise<any | Response> {
  const errs: string[] = [];
  const left = () => deadline - Date.now();
  for (const m of models) {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (left() < 12_000) { errs.push("vaqt tugadi"); console.error("[groq]", errs.join(" || ")); return json({ error: "AI band — qayta urinilmoqda", retry: true }, 503); }
      let r: Response;
      try {
        r = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(Math.min(95_000, left() - 5_000)), headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: m.id, temperature: Math.max(0.01, Math.min(1.5, temperature)), max_completion_tokens: Math.min(32000, maxTokens), response_format: { type: "json_object" }, ...m.extra, messages }) });
      } catch (e) { errs.push(`${m.id}: ${String(e).slice(0, 100)}`); break; }
      if (r.status === 429 && attempt < 3) { const w = Math.min((Number(r.headers.get("retry-after")) || 3) * 1000 + 500, 20000); if (left() - w < 30_000) { errs.push("429"); break; } await sleep(w); continue; }
      if (!r.ok) { errs.push(`${m.id}: ${r.status} ${(await r.text()).slice(0, 160)}`); break; }
      const d = await r.json().catch(() => null);
      const p = extractJson(d?.choices?.[0]?.message?.content ?? "");
      if (p && typeof p === "object") return p;
      errs.push(`${m.id}: JSON o'qilmadi`); break;
    }
  }
  console.error("[groq]", errs.join(" || "));
  return json({ error: "AI vaqtincha javob bermadi" }, 502);
}

