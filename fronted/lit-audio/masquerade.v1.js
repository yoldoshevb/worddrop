const poster = '/lit-covers/masquerade-radio.v1.webp';
const transcript = '/lit-audio/masquerade.v1.json';
const archive = 'https://archive.org/details/OTRR_Dangerously_Yours_Singles';
const archivedAudio = 'https://archive.org/download/OTRR_Dangerously_Yours_Singles/Dangerously_Yours_44-06-20_Aud_1_Masquerade.mp3';
// The archive transfer runs slightly slower than the supplied MP3.
const archiveTime = time => time * 1.00122 - 0.045;
const suppliedTime = time => (time + 0.045) / 1.00122;
const positionKey = 'wd_masquerade_position_v1';
const clock = seconds => {
  const time = Math.floor(Math.max(0, seconds) || 0);
  return String(Math.floor(time / 60)).padStart(2, '0') + ':' + String(time % 60).padStart(2, '0');
};
function position() {
  try { return Number(localStorage.getItem(positionKey)) || 0; }
  catch { return 0; }
}

export function mount(slot) {
  if (!document.querySelector('link[data-wd-radio]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/lit-audio/masquerade.v1.css';
    style.dataset.wdRadio = '';
    document.head.append(style);
  }
  const view = document.createElement('div');
  view.className = 'lt-sc dy-radio';
  view.innerHTML = `
    <article class="dy-wrap" aria-labelledby="dy-title">
      <header class="dy-hero">
        <img class="dy-poster" src="${poster}" alt="Masquerade radio spektakli uchun to'q ko'k va pushti poster" width="640" height="960">
        <div class="dy-intro">
          <p class="dy-eyebrow">RADIO SPEKTAKL · 1944</p>
          <p class="dy-series">Dangerously Yours</p>
          <h1 id="dy-title">Masquerade</h1>
          <p class="dy-blurb">Budapesht, 1915. Maxfiy topshiriq bilan yo‘lga chiqqan grafinya kutilmagan uchrashuvdan so‘ng kimga ishonishni o‘zi hal qilishi kerak.</p>
          <p class="dy-meta">Inglizcha · <span data-length>18 daqiqa</span></p>
        </div>
      </header>
      <section class="dy-console" aria-label="Audio pleyer">
        <audio preload="none" src="${archivedAudio}"></audio>
        <div class="dy-controls">
          <button class="dy-play" type="button" data-play aria-label="Tinglash">▶</button>
          <div class="dy-timeline">
            <label class="dy-sr" for="dy-progress">Tinglash vaqti</label>
            <input id="dy-progress" type="range" min="0" max="1110" value="0" step="1">
            <div class="dy-time"><span data-now>00:00</span><span data-end>18:30</span></div>
          </div>
          <button class="dy-control" type="button" data-skip="-10" aria-label="10 soniya orqaga">−10</button>
          <button class="dy-control" type="button" data-skip="10" aria-label="10 soniya oldinga">+10</button>
          <label class="dy-sr" for="dy-speed">Ijro tezligi</label>
          <select id="dy-speed"><option value=".75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select>
        </div>
        <p class="dy-status" role="status" hidden></p>
        <div class="dy-source">
          <label class="dy-file">O‘z MP3 faylingizni ochish<input type="file" accept="audio/*,.mp3"></label>
          <a href="${archive}" target="_blank" rel="noopener">Arxivdagi yozuv ↗</a>
        </div>
      </section>
      <section class="dy-script" aria-labelledby="dy-script-title">
        <div class="dy-script-head">
          <div><h2 id="dy-script-title">Audioskript</h2><p>Satrni bossangiz, audio o‘sha joydan boshlanadi.</p></div>
          <label class="dy-follow"><input type="checkbox" checked> Ovozga ergashish</label>
          <button class="dy-control dy-toggle" type="button" aria-expanded="true" aria-controls="dy-lines">Yashirish</button>
        </div>
        <p class="dy-note">Audio asosida avtomatik tayyorlangan matn. Ismlar va xira eshitilgan so‘zlarda xatolar bo‘lishi mumkin.</p>
        <div id="dy-lines" class="dy-lines" aria-busy="true">
          <p class="dy-lines-status">Audioskript yuklanmoqda…</p>
        </div>
      </section>
    </article>`;
  slot.replaceWith(view);

  const get = query => view.querySelector(query);
  const audio = get('audio');
  const play = get('[data-play]');
  const slider = get('#dy-progress');
  const status = get('.dy-status');
  const lines = get('#dy-lines');
  const follow = get('.dy-follow input');
  const toggle = get('.dy-toggle');
  let cues = [];
  let buttons = [];
  let current = -1;
  let savedSecond = -1;
  let objectUrl;
  let pendingTime = position();
  let shouldSave = false;

  function message(text) {
    status.textContent = text;
    status.hidden = !text;
  }
  function duration() {
    return Number.isFinite(audio.duration) ? audio.duration : Number(slider.max);
  }
  function showTime(time) {
    slider.value = time;
    slider.setAttribute('aria-valuetext', clock(time));
    get('[data-now]').textContent = clock(time);
    const scriptTime = objectUrl ? time : suppliedTime(time);
    let index = -1;
    for (let i = 0; i < cues.length && cues[i].start <= scriptTime; i++) index = i;
    if (index >= 0 && scriptTime >= cues[index].end) index = -1;
    if (index === current) return;
    if (buttons[current]) buttons[current].removeAttribute('aria-current');
    current = index;
    if (buttons[current]) {
      buttons[current].setAttribute('aria-current', 'true');
      if (follow.checked && !lines.hidden && !audio.paused) {
        const row = buttons[current].getBoundingClientRect();
        const viewport = lines.getBoundingClientRect();
        if (row.top < viewport.top) lines.scrollTop += row.top - viewport.top;
        else if (row.bottom > viewport.bottom) lines.scrollTop += row.bottom - viewport.bottom;
      }
    }
  }
  function seek(time) {
    shouldSave = true;
    pendingTime = Math.max(0, Math.min(time, duration()));
    if (audio.readyState >= 1) audio.currentTime = pendingTime;
    else audio.preload = 'metadata';
    showTime(pendingTime);
  }
  async function start() {
    message('');
    try { await audio.play(); }
    catch (error) {
      if (error.name !== 'AbortError') message("Audio ochilmadi. Arxiv havolasidan tinglang yoki MP3 faylni tanlang.");
    }
  }
  play.onclick = () => audio.paused ? start() : audio.pause();
  slider.oninput = () => seek(Number(slider.value));
  get('#dy-speed').onchange = event => { audio.playbackRate = Number(event.target.value); };
  view.querySelectorAll('[data-skip]').forEach(button => {
    button.onclick = () => seek((audio.readyState ? audio.currentTime : pendingTime) + Number(button.dataset.skip));
  });
  showTime(pendingTime);

  audio.onloadedmetadata = () => {
    slider.max = Math.floor(duration());
    get('[data-end]').textContent = clock(duration());
    get('[data-length]').textContent = clock(duration());
    audio.currentTime = pendingTime < duration() - 1 ? pendingTime : 0;
    showTime(audio.currentTime);
  };
  audio.ontimeupdate = () => {
    showTime(audio.currentTime);
    const second = Math.floor(audio.currentTime);
    if (!shouldSave || second === savedSecond || objectUrl) return;
    savedSecond = second;
    try { localStorage.setItem(positionKey, String(second)); } catch {}
  };
  const updatePlay = () => {
    play.textContent = audio.paused ? '▶' : '❚❚';
    play.setAttribute('aria-label', audio.paused ? 'Tinglash' : 'Pauza');
  };
  audio.onplay = () => { shouldSave = true; updatePlay(); };
  audio.onpause = audio.onended = updatePlay;
  audio.onerror = () => message("Yozuvni yuklab bo‘lmadi. Arxiv havolasi yoki o‘z MP3 faylingizdan foydalaning.");
  get('input[type=file]').onchange = event => {
    const file = event.target.files[0];
    if (!file) return;
    const oldUrl = objectUrl;
    objectUrl = URL.createObjectURL(file);
    pendingTime = 0;
    audio.src = objectUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    audio.load();
    start();
  };
  toggle.onclick = () => {
    lines.hidden = !lines.hidden;
    toggle.setAttribute('aria-expanded', String(!lines.hidden));
    toggle.textContent = lines.hidden ? 'Ko‘rsatish' : 'Yashirish';
  };

  fetch(transcript).then(response => {
    if (!response.ok) throw Error('Transcript unavailable');
    return response.json();
  }).then(data => {
    if (!view.isConnected) return;
    cues = data.cues;
    buttons = cues.map(cue => {
      const button = document.createElement('button');
      button.className = 'dy-line';
      button.type = 'button';
      const time = document.createElement('span');
      time.className = 'dy-line-time';
      time.textContent = clock(cue.start);
      const line = document.createElement('span');
      line.className = 'dy-line-copy';
      line.lang = 'en';
      line.textContent = cue.text;
      if (cue.speaker) {
        const label = document.createElement('strong');
        label.className = 'dy-speaker';
        label.textContent = cue.speaker;
        line.prepend(label);
        if (cue.speaker === 'Catherine') button.classList.add('dy-catherine');
      }
      button.append(time, line);
      button.onclick = () => { seek(Math.max(0, objectUrl ? cue.start : archiveTime(cue.start)) + 0.02); start(); };
      return button;
    });
    lines.replaceChildren(...buttons);
    showTime(audio.readyState ? audio.currentTime : pendingTime);
  }).catch(() => {
    const note = document.createElement('p');
    note.textContent = 'Audioskript yuklanmadi. Sahifani qayta ochib ko‘ring.';
    lines.replaceChildren(note);
  }).finally(() => lines.setAttribute('aria-busy', 'false'));

  const lifecycle = new MutationObserver(() => {
    if (!view.isConnected) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      lifecycle.disconnect();
    }
  });
  lifecycle.observe(document.body, {childList:true, subtree:true});
}
