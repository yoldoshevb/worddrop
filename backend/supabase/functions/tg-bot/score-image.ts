import { Buffer } from "node:buffer";
import { PNG } from "npm:pngjs@7.0.0";
import { reportTemplate } from "./practice.ts";

let background: Uint8Array | undefined;
export async function scoreImage(scores:number[], coverage:number[]) {
  if (!background) {
    const response=await fetch(reportTemplate,{signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw Error("score template unavailable");
    background=new Uint8Array(await response.arrayBuffer());
  }
  const png=PNG.sync.read(Buffer.from(background));
  function fill(x:number,y:number,w:number,h:number,color:number[]){
    for(let row=y;row<y+h;row++) for(let col=x;col<x+w;col++){
      const i=4*(row*png.width+col);
      for(let ch=0;ch<3;ch++) png.data[i+ch]=color[ch];
    }
  }
  scores.forEach((score,i)=>{for(let j=0;j<score;j++) fill(398+69*j,228+61*i,57,20,[31,111,175]);});
  coverage.forEach((v,i)=>fill(385+166*v,601+54*i,15,15,[[168,57,67],[174,113,26],[30,132,99]][v]));
  return new Uint8Array(PNG.sync.write(png));
}
