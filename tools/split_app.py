#!/usr/bin/env python3
"""app.html dagi katta inline <style>/<script> bloklarini alohida fayllarga ajratadi.

Ishlatish:  python3 tools/split_app.py <to'liq app.html> <chiqish papkasi>
Har fayl nomida mazmun xeshi bor (app.<nom>.<xesh>.js|css) — _headers dagi
"immutable" kesh bilan mos: mazmun o'zgarsa, nom ham o'zgaradi.
Bloklar o'sha joyda, o'sha tartibda qoladi (classic -> <script src>, module ->
<script type="module" src>, style -> <link rel="stylesheet">), shuning uchun
bajarilish tartibi o'zgarmaydi. 30 KB dan kichik bloklar inline qoladi.
"""
import re, hashlib, os, sys
src_path, out_dir = sys.argv[1], sys.argv[2]
src = open(src_path, encoding='utf-8').read()
os.makedirs(out_dir, exist_ok=True)
pat = re.compile(r'<(script|style)((?:(?!src=)[^>])*)>([\s\S]*?)</\1>')
def slug(body, kind):
    m = re.search(r'/\*\s*=+\s*([^=*]{3,40}?)\s*[=—-]', body)
    t = (m.group(1) if m else kind).lower()
    return re.sub(r"[^a-z0-9]+", "-", t.replace("'", "")).strip('-')[:24] or kind
res, last = [], 0
for m in pat.finditer(src):
    tag, attrs, body = m.group(1), m.group(2), m.group(3)
    if len(m.group(0)) < 30000 or 'importmap' in attrs or 'ld+json' in attrs:
        continue
    h = hashlib.sha256(body.encode()).hexdigest()[:8]
    if tag == 'style':
        fn = f'app.{slug(body, "css")}.{h}.css'; rep = f'<link rel="stylesheet" href="{fn}">'
    else:
        fn = f'app.{slug(body, "js")}.{h}.js'; rep = f'<script{attrs} src="{fn}"></script>'
    open(os.path.join(out_dir, fn), 'w', encoding='utf-8').write(body)
    res += [src[last:m.start()], rep]; last = m.end()
    print(f'{len(body):>8}  {fn}')
res.append(src[last:])
open(os.path.join(out_dir, 'app.html'), 'w', encoding='utf-8').write(''.join(res))
