import { AsyncLocalStorage } from "node:async_hooks";

type Call = (method:string, payload:Record<string,unknown>)=>Promise<any>;
type Origin = {chat:number; message?:number; fresh?:boolean};
export function navigation(tg:Call, read:(key:string)=>Promise<any>, write:(key:string,value:unknown)=>Promise<void>){
  const origin = new AsyncLocalStorage<Origin>();
  function run<T>(update:any, handle:()=>Promise<T>){
    const command=update?.message;
    if(command?.chat?.type==="private" && /^\/[a-z][a-z0-9_]*(?:@\w+)?(?:\s|$)/i.test(command.text || ""))
      return origin.run({chat:command.chat.id,fresh:true},handle);
    const m=update?.callback_query?.message;
    return m?.chat?.type==="private" && m.from?.is_bot && !m.document && !m.photo && !m.voice && !m.invoice
      ? origin.run({chat:m.chat.id,message:m.message_id},handle) : handle();
  }
  async function show(chat:number,text:string,extra:any={},explicit?:number,rich?:string){
    const key="drop-panel:"+chat;
    const source=origin.getStore();
    const current=source?.chat===chat ? source : undefined;
    const message=current?.fresh ? undefined : explicit || current?.message || await read(key);
    const rows=extra.reply_markup?.inline_keyboard ?? [];
    const home=rows.some((row:any[])=>row.some(b=>b.callback_data==="m" || b.callback_data==="sp:0"));
    const buttons=home?rows:[...rows,[{text:"‹ Bosh menyu",callback_data:"m"}]];
    const payload=rich ? {chat_id:chat,rich_message:{html:rich}} :
      {chat_id:chat,text,parse_mode:"HTML",disable_web_page_preview:true,...extra,reply_markup:{inline_keyboard:buttons}};
    if(message){
      const r=await tg("editMessageText",{...payload,message_id:message});
      if(r.ok || /message is not modified/i.test(r.description || "")){
        if(explicit || source)await write(key,message);
        return {...r,ok:true,result:r.result || {message_id:message}};
      }
      if(r.error_code!==400)return r;
      console.warn("[navigation] edit rejected; opening a fresh panel",r.error_code);
    }
    const r=await tg(rich?"sendRichMessage":"sendMessage",payload);
    if(r.ok && r.result?.message_id){
      if(current){current.message=r.result.message_id;current.fresh=false;}
      await write(key,r.result.message_id);
    } else if(!r.ok){
      console.warn("[navigation] panel delivery failed",r.error_code);
    }
    return r;
  }
  return {show,run};
}
