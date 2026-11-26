import { Buffer } from "node:buffer";
import { PNG } from "npm:pngjs@7.0.0";
import { chars, widths, bitmap } from "./report-font.ts";

const font = PNG.sync.read(Buffer.from(bitmap, "base64"));
const glyph = (c:string) => chars.includes(c) ? chars.indexOf(c) : chars.indexOf("?");
export type Row = {text:string; style:"heading"|"label"|"body"|"quote"; gap?:number};
const palette = {heading:[15,49,88],label:[13,97,110],body:[32,45,60],quote:[69,79,106]};
export function scoreImage(rows:Row[]) {
  const lines:{s:string;y:number;style:Row["style"]}[]=[];
  let y=28;
  for(const row of rows){
    y+=row.gap||0;
    let line="",width=0;
    for(const word of row.text.trim().split(/\s+/)){
      const w=[...word].reduce((sum,c)=>sum+widths[glyph(c)],0);
      if(line && width+7+w>716){lines.push({s:line,y,style:row.style});y+=32;line="";width=0;}
      if(line){line+=" ";width+=7;}
      for(const c of word){
        const advance=widths[glyph(c)];
        if(width+advance>716){lines.push({s:line,y,style:row.style});y+=32;line="";width=0;}
        line+=c;width+=advance;
      }
    }
    if(line){lines.push({s:line,y,style:row.style});y+=34;}
  }
  const png=new PNG({width:796,height:y+28});
  png.data.fill(255);
  for(const {s,y,style} of lines){
    let x=40;
    for(const c of s){
      const k=glyph(c),gx=(k%16)*32,gy=Math.floor(k/16)*34;
      for(let j=0;j<34;j++)for(let i=0;i<32;i++){
        const a=font.data[((gy+j)*font.width+gx+i)*4]/255;
        if(!a)continue;
        const at=((y+j)*png.width+x+i)*4;
        for(let n=0;n<3;n++)png.data[at+n]=Math.round(255+(palette[style][n]-255)*a);
      }
      x+=widths[k];
    }
  }
  return new Uint8Array(PNG.sync.write(png));
}
