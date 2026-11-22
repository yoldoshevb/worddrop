import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const sourceUrl = new URL('../../fronted/app.listening-tinglash.d2627127.js', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const dataBoundary = source.indexOf('window.__wdLessons=LESSONS;');
if (dataBoundary < 0) throw new Error('Cannot find the WordDrop Listening catalog.');

const lessons = runInNewContext(source.slice(0, dataBoundary) + '\nLESSONS', {}, { timeout: 1000 });
const catalog = lessons.map(({ title, subtitle, audioUrl, startAt, maxTime, lines }, index) => ({
  id: new URL(audioUrl).pathname.split('/').at(-1),
  title,
  collection: subtitle,
  audioUrl,
  durationSeconds: Math.ceil(maxTime - startAt),
  startAt,
  endAt: maxTime,
  suggestedLevel: index < 3 ? 'A2' : 'B1',
  mapLevel: index === 0 ? 1 : 10 * index,
  questions: lines.flatMap(({ toks }) => toks.flatMap((token, gap) => {
    if (typeof token === 'string') return [];
    if (!token.o.includes(token.a)) throw new Error(`Missing answer in ${title}`);
    return [{
      prompt: toks.map((part, i) => typeof part === 'string' ? part : i === gap ? '[?]' : '[…]')
        .join(' ').replace(/ +([,.!?])/g, '$1'),
      options: [...new Set(token.o)],
      answer: token.a,
    }];
  })),
}));

await build({
  entryPoints: ['worker.js'],
  outfile: 'dist/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'inline',
  define: { WORDDROP_LISTENING_CATALOG: JSON.stringify(catalog) },
});
