import {scenes} from './masquerade.v1.js';

const id = 'wdAudioDialog';
const path = '/audio-dialog/';
const names = {Estefan:'estefan', Catherine:'catherine', Elbert:'elbert'};
const format = value => {
  const seconds = Math.floor(Number.isFinite(value) ? value : 0);
  return Math.floor(seconds/60) + ':' + String(seconds%60).padStart(2,'0');
};
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => value.toLowerCase().trim().replace(/[.!?]+$/, '').replace(/\s+/g,' ');

export function open() {
  if (document.getElementById(id)) return;
  if (!document.querySelector('link[data-audio-dialog]')) {
    const link=document.createElement('link');
    link.dataset.audioDialog='';
    link.rel='stylesheet';
    link.href=path+'dialog.v1.css';
    document.head.append(link);
  }
  const previous=document.activeElement;
  const panel=document.createElement('dialog');
  panel.id=id;
  panel.setAttribute('aria-labelledby','ad-title');
  document.body.append(panel);
  panel.showModal();
  panel.addEventListener('close', ()=>{
    panel.querySelector('audio')?.pause();
    panel.remove();
    if(previous instanceof HTMLElement && previous.isConnected) previous.focus();
  }, {once:true});
  const body = () => panel.querySelector('main');
  const nav = (text, action) => {
    panel.querySelector('audio')?.pause();
    panel.innerHTML=`<header class="ad-bar"><button type="button" data-back aria-label="${text}">←</button><button data-close type="button">Yopish</button></header><main></main>`;
    panel.querySelector('[data-back]').onclick=action;
    panel.querySelector('[data-close]').onclick=()=>panel.close();
  };
  const focusTitle = () => panel.querySelector('h1').focus();

  function catalog() {
    nav('Orqaga',()=>panel.close());
    body().innerHTML=`<div class="ad-intro"><h1 id="ad-title" tabindex="-1">Audio Dialog</h1>
      <p>Podkast va dialoglar asosida tinglab tushunish mashqlari.</p></div>
      <h2 class="ad-series">Dangerously Yours <span>Masquerade</span></h2>
      <div class="ad-scenes">${scenes.map((scene,i)=>`<button type="button" class="ad-card" data-scene="${i}">
        <span class="ad-pair ${scene.id}">${scene.pair}</span><strong lang="en">${escape(scene.title)}</strong>
        <span>B2 · ${scene.duration} · 4 savol</span></button>`).join('')}</div>`;
    body().querySelectorAll('[data-scene]').forEach(button=>{button.onclick=()=>lesson(scenes[+button.dataset.scene]);});
    focusTitle();
  }

  function lesson(scene) {
    nav("Mashqlar ro'yxatiga",catalog);
    body().innerHTML=`
      <header class="ad-lesson"><p class="ad-pair ${scene.id}">${scene.pair} · B2</p>
      <h1 id="ad-title" tabindex="-1" lang="en">${escape(scene.title)}</h1>
      <p lang="en">${escape(scene.intro)}</p></header>
      <section class="ad-player" aria-label="Audio">
        <audio controls preload="metadata" src="${path}${scene.id}.v1.mp3"></audio>
        <span role="status" class="ad-audio-error"></span>
      </section>
      <form class="ad-test" lang="en">
        <p class="ad-instructions">Read the questions. Listen twice, then submit your answers.</p>
        ${scene.questions.map((q,i)=>`<fieldset>
          <legend>${i+1}. ${escape(q.text)}</legend>
          ${q.options?q.options.map((item,j)=>`<label class="ad-option">
            <input type="radio" name="q${i}" value="${j}" required><span>${escape(item)}</span></label>`).join(''):
            `<input class="ad-answer" type="text" name="q${i}" required maxlength="28" autocomplete="off" aria-label="Your answer">`}
          <div class="ad-feedback" hidden></div>
        </fieldset>`).join('')}
        <div class="ad-submit"><button type="submit">Tekshirish</button><p class="ad-score" role="status"></p></div>
      </form>
      <details class="ad-transcript" hidden><summary>Audioskript</summary><div class="ad-turns">
        ${scene.turns.map(([at,name,text])=>`<button type="button" data-at="${at}" class="ad-turn ${names[name]}">
          <span class="ad-stamp">${format(at)}</span><span><b>${name}</b><span lang="en">${escape(text)}</span></span></button>`).join('')}
      </div></details>`;
    focusTitle();
    const audio=panel.querySelector('audio');
    const form=panel.querySelector('form');
    const transcript=panel.querySelector('details');
    const turnButtons=[...panel.querySelectorAll('.ad-turn')];
    let current;
    let stopAt;
    function playAt(at,end){
      stopAt=end;
      audio.currentTime=at;
      audio.play().catch(()=>{});
    }
    audio.onerror=()=>{panel.querySelector('.ad-audio-error').textContent="Audio yuklanmadi. Sahifani qayta oching.";};
    audio.ontimeupdate=()=>{
      if(stopAt!==undefined && audio.currentTime>=stopAt){
        stopAt=undefined;
        audio.pause();
        return;
      }
      const next=turnButtons.findLast(button=>Number(button.dataset.at)<=audio.currentTime);
      if(next===current) return;
      current?.removeAttribute('aria-current');
      current=next;
      current?.setAttribute('aria-current','true');
    };
    turnButtons.forEach((button,i)=>{
      const next=turnButtons[i+1];
      button.onclick=()=>playAt(Number(button.dataset.at),next?Number(next.dataset.at):undefined);
    });
    form.onsubmit=event=>{
      event.preventDefault();
      const answers=new FormData(form);
      let correct=0;
      [...form.querySelectorAll('fieldset')].forEach((field,i)=>{
        const question=scene.questions[i];
        const value=answers.get('q'+i) || '';
        const valid=question.options ? value===String(question.answer) : question.acceptable.includes(normalize(value));
        if(valid) correct++;
        const feedback=field.querySelector('.ad-feedback');
        const expected=question.options?.[question.answer] ?? question.display;
        feedback.innerHTML=`<p data-correct="${valid}"><b>${valid?"To‘g‘ri":"To‘g‘ri javob: "+escape(expected)}</b>
          <span lang="en">${escape(question.why)}</span></p><button type="button" lang="uz">${format(question.at)} dan eshitish</button>`;
        feedback.hidden=false;
        feedback.querySelector('button').onclick=()=>playAt(question.at);
        field.disabled=true;
        // Fieldset disables form input; play evidence goes outside it.
        field.after(feedback);
      });
      transcript.hidden=false;
      form.querySelector('.ad-score').textContent=`${correct} / ${scene.questions.length} to‘g‘ri`;
      const retry=form.querySelector('button[type=submit]');
      retry.type='button';
      retry.textContent='Qayta urinish';
      retry.onclick=()=>lesson(scene);
    };
  }
  panel.addEventListener('click',event=>{
    if(event.target===panel) panel.close();
  });
  catalog();
}
