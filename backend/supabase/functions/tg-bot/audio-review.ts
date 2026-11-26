export type Word = {word:string;start:number;end:number};
export type Finding = {kind:string;note:string;start?:number;end?:number};
const normal=(s:string)=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9']/g,"");
export function locate(words:Word[], quote:string){
  const tokens=quote.trim().split(/\s+/).map(normal).filter(Boolean);
  if(!tokens.length)return {};
  const hits=words.map((_,i)=>i).filter(i=>tokens.every((t,j)=>words[i+j] && normal(words[i+j].word)===t));
  if(hits.length!==1)return {};
  const i=hits[0];return {start:words[i].start,end:words[i+tokens.length-1].end};
}

// RFC 6716 section 3.1, Opus granules always use a 48 kHz clock.
function samples(p:Uint8Array){
  const config=p[0]>>3, code=p[0]&3;
  const frame=config<12?[480,960,1920,2880][config%4]:config<16?[480,960][config%2]:[120,240,480,960][config%4];
  return frame*(code===0?1:code===3?(p[1]&63):2);
}
function join(parts:Uint8Array[]){
  const bytes=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let pos=0;
  for(const p of parts){bytes.set(p,pos);pos+=p.length;}return bytes;
}
const crcTable=Array.from({length:256},(_,i)=>{let c=i<<24;for(let j=0;j<8;j++)c=c<0?(c<<1)^0x04c11db7:c<<1;return c>>>0;});
function page(packet:Uint8Array,seq:number,flags:number,granule:number){
  const count=Math.floor(packet.length/255)+1;
  if(count>255)throw Error("Oversized packet");
  const b=new Uint8Array(27+count+packet.length), v=new DataView(b.buffer);
  b.set([79,103,103,83,0,flags]);v.setBigUint64(6,BigInt(granule),true);v.setUint32(14,7834,true);v.setUint32(18,seq,true);
  b[26]=count;b.fill(255,27,26+count);b[26+count]=packet.length%255;b.set(packet,27+count);
  let crc=0;for(const x of b)crc=(crc<<8)^crcTable[((crc>>>24)^x)&255];v.setUint32(22,crc,true);return b;
}
export function opusClip(input:Uint8Array,from:number,to:number){
  if(!(from>=0&&to>from))throw Error("Invalid interval");
  const packets:Uint8Array[]=[], partial:Uint8Array[]=[];let pos=0,sourceEnd=0;
  while(pos<input.length){
    if(pos+27>input.length||String.fromCharCode(...input.subarray(pos,pos+4))!=="OggS")throw Error("Expected Ogg Opus");
    const n=input[pos+26];let at=pos+27+n;
    if(input[pos+5]&4)sourceEnd=Number(new DataView(input.buffer,input.byteOffset+pos,27).getBigUint64(6,true));
    for(let j=0;j<n;j++){
      const size=input[pos+27+j];if(at+size>input.length)throw Error("Truncated Ogg");
      partial.push(input.subarray(at,at+size));at+=size;
      if(size<255){packets.push(join(partial));partial.length=0;}
    }
    pos=at;
  }
  const head=packets[0]?.slice();
  if(!head||String.fromCharCode(...head.subarray(0,8))!=="OpusHead")throw Error("Expected Opus");
  const h=new DataView(head.buffer), skip=h.getUint16(10,true);
  const start=Math.round(from*48000)+skip,end=Math.min(sourceEnd||Infinity,Math.ceil(to*48000)+skip);
  let clock=0,base=-1;const selected:Uint8Array[]=[];
  for(const p of packets.slice(2)){
    const next=clock+samples(p);
    if(next>Math.max(0,start-3840)&&clock<end){if(base<0)base=clock;selected.push(p);}
    clock=next;if(clock>=end)break;
  }
  if(!selected.length||end<=start)throw Error("Empty clip");
  h.setUint16(10,start-base,true);
  const pages=[page(head,0,2,0),page(packets[1],1,0,0)];clock=0;
  selected.forEach((p,i)=>{clock+=samples(p);const last=i===selected.length-1;pages.push(page(p,i+2,last?4:0,Math.min(clock,end-base)));});
  return join(pages);
}
export async function pronounce(audio:Uint8Array,words:Word[],key:string,region:string){
  if(!key||!region)return {note:"Azure Speech hali sozlanmagan.",items:[] as Finding[]};
  const groups:Word[][]=[];
  for(const w of words){
    const g=groups[groups.length-1];
    if(!g||w.end-g[0].start>16||w.start-g[g.length-1].end>1)groups.push([w]);else g.push(w);
  }
  const items:Finding[]=[];let checked=0;

  const signal=AbortSignal.timeout(32000);
  async function assess(group:Word[]){
    const start=Math.max(0,group[0].start-.12),end=group[group.length-1].end+.12;
    const body=opusClip(audio,start,end);
    const args={ReferenceText:group.map(w=>w.word).join(" "),GradingSystem:"HundredMark",Granularity:"Phoneme",Dimension:"Comprehensive",PhonemeAlphabet:"IPA"};
    const settings=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(args))));
    const response=await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,{method:"POST",signal,headers:{"Ocp-Apim-Subscription-Key":key,"Content-Type":"audio/ogg; codecs=opus","Pronunciation-Assessment":settings},body});
    if(!response.ok)return;
    const best=(await response.json()).NBest?.[0];if(!best?.Words?.length)return;
    for(const w of best.Words){
      const score=w.PronunciationAssessment?.AccuracyScore??w.AccuracyScore;
      if(!Number.isFinite(score))continue;
      const offset=start+w.Offset/1e7, finish=offset+w.Duration/1e7;
      if(!Number.isFinite(offset)||!(finish>offset))continue;
      if(!group.some(g=>normal(g.word)===normal(w.Word)&&Math.abs(g.start-offset)<.8))continue;
      checked++;if(score>=70)continue;
      const phone=(w.Phonemes||[]).filter((p:any)=>Number.isFinite(p.PronunciationAssessment?.AccuracyScore??p.AccuracyScore)).sort((a:any,b:any)=>(a.PronunciationAssessment?.AccuracyScore??a.AccuracyScore)-(b.PronunciationAssessment?.AccuracyScore??b.AccuracyScore))[0];
      items.push({kind:"Talaffuz",note:`“${w.Word}” · aniqlik ${Math.round(score)}/100.${phone?" /"+phone.Phoneme+"/ tovushini qayta mashq qiling.":""}`,start:offset,end:Math.min(end,finish)});
    }
  }
  for(let i=0;i<groups.length&&!signal.aborted;i+=3)await Promise.allSettled(groups.slice(i,i+3).map(assess));
  items.sort((a,b)=>a.start!-b.start!);
  return {items,note:checked?`Audio bo‘yicha tekshirilgan so‘zlar: ${checked}. Qayta tinglash uchun belgilangan: ${items.length}.`:"Bu yozuv uchun talaffuz natijasi olinmadi."};
}
