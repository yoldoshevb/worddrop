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
    panel.innerHTML=`<div class="ac-shell">
      <nav><button type="button" data-close autofocus><span aria-hidden="true">‹</span> Profil</button></nav>
      <header><h2 id="acTitle">Hisob cheklovlari</h2><p>WordDrop hisoblari va Telegram botiga kirishni boshqaring.</p></header>
      <main class="ac-body">
        <form><h3>Cheklov qo‘shish</h3><label for="acId">Email, WordDrop ID yoki Telegram ID</label>
          <div class="ac-entry"><input id="acId" name="id" autocapitalize="none" spellcheck="false" maxlength="320" placeholder="Email yoki ID kiriting" required><button class="ac-add">Cheklash</button></div>
        </form>
        <p role="status" class="ac-status"></p>
        <section><h3>Cheklangan hisoblar <span class="ac-count">…</span></h3><ul></ul><p class="ac-empty" hidden>Hozircha cheklangan hisoblar yo‘q.</p></section>
      </main></div>`;
    document.body.append(panel);
    panel.showModal();
    const back=window.Telegram?.WebApp?.BackButton;
    const wasVisible=back?.isVisible;
    const leave=()=>panel.close();
    back?.onClick(leave);
    back?.show();
    panel.onclose=()=>{
      back?.offClick(leave);
      if(!wasVisible) back?.hide();
      panel.remove();
      document.getElementById('rAccessBlocks')?.focus({preventScroll:true});
    };
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
        const {data,error}=await window.__sb.rpc('wd_manage_account_access',{op,target});
        if(error) throw error;
        list.replaceChildren();
        panel.querySelector('.ac-empty').hidden=data.length>0;
        panel.querySelector('.ac-count').textContent=data.length;
        for(const {id,label} of data){
          const row=document.createElement('li'), btn=document.createElement('button');
          btn.textContent='Cheklovni olish';
          btn.onclick=()=>run('unblock',id);
          const code=document.createElement('code');
          code.textContent=label;
          row.append(code,btn); list.append(row);
        }
        status.textContent=op==='block'?'Cheklov saqlandi.':op==='unblock'?'Cheklov olib tashlandi.':'';
        if(op==='block') form.reset();
      } catch(err){status.classList.add('ac-error');status.textContent=err.message||'Amal bajarilmadi.';}
      finally{busy=false;panel.removeAttribute('aria-busy');form.querySelector('button').disabled=false;}
    }
    form.onsubmit=e=>{e.preventDefault();run('block',form.elements.id.value.trim());};
    await run('list');
  });
})();
