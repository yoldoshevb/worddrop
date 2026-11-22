#!/usr/bin/env python3
"""Multilevel testi uchun Listening/Speaking ovozlarini Kokoro (82M, ochiq neyron TTS) bilan yaratadi.

Ishlatish:
  pip install kokoro-onnx soundfile
  # model: github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/{kokoro-v1.0.int8.onnx,voices-v1.0.bin}
  python3 tools/ml_audio.py <clips.json> <model papkasi> <chiqish papkasi>

clips.json: {"l1_0": [["bf_emma","matn"], ...], "l2": [...], ...}  — kalitlar ml.v101*.js dagi clipList bilan bir xil.
Natija: <chiqish>/<kalit>.mp3 (mono, 64 kbit/s). Fayllar fronted/ml-audio/<test_id>/ ga qo'yiladi va
wd_ml_tests.audio ga https://www.worddrop-app.uz/ml-audio/<test_id>/<kalit>.mp3 manzillari yoziladi.
Bir xil spiker segmentlari orasida 0.35 s, spiker almashganda 0.7 s jimlik.
"""
import json, os, subprocess, sys, time
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

clips_path, model_dir, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)
clips = json.load(open(clips_path, encoding='utf-8'))
k = Kokoro(os.path.join(model_dir, 'kokoro-v1.0.int8.onnx'), os.path.join(model_dir, 'voices-v1.0.bin'))
SR = 24000
sil = lambda s: np.zeros(int(SR * s), dtype=np.float32)
t0 = time.time(); total = 0.0
for i, (key, segs) in enumerate(clips.items(), 1):
    mp3 = os.path.join(out_dir, f'{key}.mp3')
    if os.path.exists(mp3):
        continue
    parts, prev = [sil(0.3)], None
    for voice, text in segs:
        lang = 'en-gb' if voice.startswith('b') else 'en-us'
        audio, sr = k.create(text, voice=voice, speed=0.95, lang=lang)
        if prev is not None:
            parts.append(sil(0.35 if prev == voice else 0.7))
        parts.append(audio.astype(np.float32)); prev = voice
    parts.append(sil(0.4))
    pcm = np.concatenate(parts)
    wav = mp3[:-4] + '.wav'
    sf.write(wav, pcm, SR)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '64k', mp3], check=True)
    os.remove(wav)
    dur = len(pcm) / SR; total += dur
    print(f'[{i}/{len(clips)}] {key}: {dur:.1f} s audio, {time.time() - t0:.0f} s o\'tdi', flush=True)
print(f'TAYYOR: jami {total / 60:.1f} daqiqa audio, {time.time() - t0:.0f} s', flush=True)
