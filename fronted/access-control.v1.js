(() => {
  window.wdShowBlocked = () => {
    if(document.getElementById('wdBlocked')) return;
    const lock=document.createElement('dialog');
    lock.id='wdBlocked';
    lock.style.cssText='position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;border:0;background:#101526;color:white;text-align:center;padding:30vh 16px 0';
    lock.innerHTML='<h1>Siz bloklangansiz</h1><p>Bu hisob uchun WordDrop xizmatiga kirish cheklangan.</p>';
    lock.oncancel=e=>e.preventDefault();
    document.body.append(lock);
    lock.showModal();
  };
  document.addEventListener('click', async e=>{
    if(!e.target.closest('#rAccessBlocks') || document.querySelector('#accessAdmin')) return;
    const panel=document.createElement('dialog');
    panel.id='accessAdmin';
    panel.style.cssText='width:min(90vw,440px);border:0;border-radius:16px;padding:22px;max-height:80vh;overflow:auto';
    panel.innerHTML='<h2>Telegram ID cheklovlari</h2><form><label>Telegram ID <input name="id" inputmode="numeric" pattern="[1-9][0-9]{0,15}" maxlength="16" required></label> <button>Bloklash</button></form><p role="status"></p><ul></ul><button data-close>Yopish</button>';
    document.body.append(panel);
    panel.showModal();
    panel.onclose=()=>panel.remove();
    panel.querySelector('[data-close]').onclick=()=>panel.close();
    const form=panel.querySelector('form'), status=panel.querySelector('[role=status]'), list=panel.querySelector('ul');
    let busy=false;
    async function run(op,target=null){
      if(busy) return;
      busy=true;
      try {
        const {data,error}=await window.__sb.rpc('wd_manage_access',{op,target});
        if(error) throw error;
        list.replaceChildren();
        for(const id of data){
          const row=document.createElement('li'), btn=document.createElement('button');
          btn.textContent='Blokdan chiqarish';
          btn.onclick=()=>run('unblock',id);
          row.append(id+' ',btn); list.append(row);
        }
        status.textContent=op==='block'?'ID bloklandi.':op==='unblock'?'Cheklov olib tashlandi.':data.length?'Bloklangan ID lar':'Ro‘yxat bo‘sh.';
        if(op==='block') form.reset();
      } catch(err){status.textContent=err.message||'Amal bajarilmadi.';}
      finally{busy=false;}
    }
    form.onsubmit=e=>{e.preventDefault();run('block',form.elements.id.value.trim());};
    await run('list');
  });
})();
