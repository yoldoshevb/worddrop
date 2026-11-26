(() => {
  window.wdShowBlocked = () => {
    if(document.getElementById('wdBlocked')) return;
    const lock=document.createElement('dialog');
    lock.id='wdBlocked';
    lock.setAttribute('aria-labelledby','accessNoticeTitle');
    lock.innerHTML='<div class="ac-notice"><span class="ac-wordmark">WordDrop</span><h1 id="accessNoticeTitle">Kirish imkoni yo‘q</h1><p>Bu hisob bilan hozir WordDrop’ga kirish imkoni yo‘q.</p></div>';
    lock.oncancel=e=>e.preventDefault();
    document.body.append(lock);
    lock.showModal();
  };
  document.addEventListener('click', async e=>{
    if(!e.target.closest('#rAccessBlocks') || document.querySelector('#accessAdmin')) return;
    const panel=document.createElement('dialog');
    panel.id='accessAdmin';
    panel.setAttribute('aria-labelledby','acTitle');
    panel.innerHTML=`<header class="ac-head"><div><span class="ac-context">Sozlamalar</span><h2 id="acTitle">Telegram ID cheklovlari</h2></div><button class="ac-close" type="button" data-close aria-label="Yopish">×</button></header>
      <section class="ac-body"><form><label for="acId">Telegram ID</label><div class="ac-entry"><input id="acId" name="id" inputmode="numeric" pattern="[1-9][0-9]{0,15}" maxlength="16" placeholder="Raqamli ID kiriting" required><button class="ac-add">Bloklash</button></div></form>
      <p role="status" class="ac-status"></p><h3>Cheklangan hisoblar <span class="ac-count">…</span></h3><ul></ul></section>`;
    document.body.append(panel);
    panel.showModal();
    panel.onclose=()=>panel.remove();
    panel.querySelector('[data-close]').onclick=()=>panel.close();
    const form=panel.querySelector('form'), status=panel.querySelector('[role=status]'), list=panel.querySelector('ul');
    let busy=false;
    async function run(op,target=null){
      if(busy) return;
      busy=true;
      panel.setAttribute('aria-busy','true');
      form.querySelector('button').disabled=true;
      status.textContent=op==='list'?'Yuklanmoqda…':'Saqlanmoqda…';
      status.classList.remove('ac-error');
      try {
        const {data,error}=await window.__sb.rpc('wd_manage_access',{op,target});
        if(error) throw error;
        list.replaceChildren();
        panel.querySelector('.ac-count').textContent=data.length;
        for(const id of data){
          const row=document.createElement('li'), btn=document.createElement('button');
          btn.textContent='Blokdan chiqarish';
          btn.onclick=()=>run('unblock',id);
          const code=document.createElement('code');
          code.textContent=id;
          row.append(code,btn); list.append(row);
        }
        status.textContent=op==='block'?'ID bloklandi.':op==='unblock'?'Cheklov olib tashlandi.':data.length?'':'Hozircha cheklangan hisoblar yo‘q.';
        if(op==='block') form.reset();
      } catch(err){status.classList.add('ac-error');status.textContent=err.message||'Amal bajarilmadi.';}
      finally{busy=false;panel.removeAttribute('aria-busy');form.querySelector('button').disabled=false;}
    }
    form.onsubmit=e=>{e.preventDefault();run('block',form.elements.id.value.trim());};
    await run('list');
  });
})();
