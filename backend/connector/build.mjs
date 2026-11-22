import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const sourceUrl = new URL('../../fronted/app.listening-tinglash.d2627127.js', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const dataBoundary = source.indexOf('window.__wdLessons=LESSONS;');
if (dataBoundary < 0) throw new Error('Cannot find the WordDrop Listening catalog.');

const lessons = runInNewContext(source.slice(0, dataBoundary) + '\nLESSONS', {}, { timeout: 1000 });
const catalog = lessons.map(({ title, subtitle, audioUrl, startAt, maxTime }, index) => ({
  title,
  collection: subtitle,
  audioUrl,
  durationSeconds: Math.ceil(maxTime - startAt),
  suggestedLevel: index < 3 ? 'A2' : 'B1',
  mapLevel: index === 0 ? 1 : 10 * index,
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
