// Decode provider SSE across arbitrary network chunks. Only learner-facing content is used.
export async function readCompletion(body: ReadableStream<Uint8Array>, preview: (text: string)=>Promise<void>) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "", answer = "", last = 0, complete = false;
  try {
    while (!complete) {
      const chunk = await reader.read();
      pending += chunk.value || "";
      const lines = pending.split("\n");
      pending = chunk.done ? "" : lines.pop()!;
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        if (data === "[DONE]") { complete = true; break; }
        const event = JSON.parse(data);
        if (event.error) throw Error("generation failed");
        const choice = event.choices?.[0];
        answer += choice?.delta?.content || "";
        if (choice?.finish_reason) complete = true;
        if (answer.trim() && Date.now() - last >= 950) {
          last = Date.now();
          await preview(answer.slice(0,3500));
        }
      }
      if (chunk.done) break;
    }
    if (!complete || !answer.trim()) throw Error("incomplete completion");
    return answer.trim().slice(0,3500);
  } finally { await reader.cancel().catch(()=>{}); }
}
