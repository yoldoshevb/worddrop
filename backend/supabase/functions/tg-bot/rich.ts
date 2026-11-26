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

// Render only the formatting the tutor is instructed to produce. Model text
// never becomes executable Telegram markup (links and buttons included).
export function tutorMessage(source: string, streaming = false) {
  const escape = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*([^*\n]+?)\*/g,"$1");
  const inline = (s: string) => escape(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\*([^*\n]+?)\*/g,"<i>$1</i>");
  const lines = source.trimStart().split(/\r?\n/);
  if (streaming && lines.at(-1)?.trimStart().startsWith("|")) lines.pop();
  const html: string[] = [], text: string[] = [];
  for (let i=0; i<lines.length;) {
    const line=lines[i++].trim();
    if (!line) continue;
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      const add = (s: string) => {
        const cells=s.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
        if (!cells.every(c=>/^:?-+:?$/.test(c))) rows.push(cells);
      };
      add(line);
      while(i<lines.length && (!lines[i].trim() || lines[i].trim().startsWith("|"))) {
        const row=lines[i++].trim();
        if(row) add(row);
      }
      if(!rows.length)continue;
      const [headers,...data]=rows;
      if(!data.length && streaming)continue;
      html.push("<table compact striped>"+rows.map((row,n)=>{
        const cell=n?"td":"th";
        return "<tr>"+row.map(c=>"<"+cell+">"+inline(c)+"</"+cell+">").join("")+"</tr>";
      }).join("")+"</table>");
      if(data.length) for(const row of data)text.push(row.map((c,j)=>plain(headers[j]||"")+" — "+plain(c)).join("\n"));
      else text.push(headers.map(plain).join(" · "));
      continue;
    }
    const heading=/^#{1,6}\s+/.test(line);
    const value=line.replace(/^#{1,6}\s+/,"").replace(/^[-*]\s+/,"• ");
    const tag=heading?"h2":"p";
    html.push("<"+tag+">"+inline(value)+"</"+tag+">");
    text.push(plain(value));
  }
  return {html:html.join(""),text:text.join("\n\n")};
}
