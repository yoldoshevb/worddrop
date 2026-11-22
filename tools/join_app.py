#!/usr/bin/env python3
"""split_app.py ning teskarisi: fronted/app.html + app.*.js|css -> bitta to'liq app.html (tahrirlash uchun).
Ishlatish: python3 tools/join_app.py fronted /tmp/app.full.html"""
import re, os, sys
d, out = sys.argv[1], sys.argv[2]
s = open(os.path.join(d, 'app.html'), encoding='utf-8').read()
rd = lambda fn: open(os.path.join(d, fn), encoding='utf-8').read()
s = re.sub(r'<link rel="stylesheet" href="(app\.[^"]+\.css)">', lambda m: '<style>' + rd(m.group(1)) + '</style>', s)
s = re.sub(r'<script([^>]*?) src="(app\.[^"]+\.js)"></script>', lambda m: f'<script{m.group(1)}>' + rd(m.group(2)) + '</script>', s)
open(out, 'w', encoding='utf-8').write(s)
