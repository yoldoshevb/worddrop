import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const appUrl = 'https://www.worddrop-app.uz/app.html';
const catalog = WORDDROP_LISTENING_CATALOG;
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const dictionarySources = [
  { table: 'word_translations', columns: 'en,uz,pos,ipa,def,ex,level', kind: 'word' },
  { table: 'word_phrasal_verbs', columns: 'en,uz,meanings,examples,level', kind: 'phrasal_verb' },
];

function formatResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data };
}

async function searchDictionary(env, term, source) {
  const url = new URL('/rest/v1/' + source.table, env.SUPABASE_URL);
  url.search = new URLSearchParams({
    select: source.columns,
    en: 'ilike.' + term,
    verified: 'eq.true',
    limit: '6',
    order: 'id.asc',
  });
  const response = await fetch(url, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Dictionary request failed.');
  return (await response.json()).map(entry => ({ kind: source.kind, ...entry }));
}

function createServer(env) {
  const server = new McpServer({
    name: 'worddrop',
    version: '0.1.0',
    title: 'WordDrop',
    websiteUrl: 'https://www.worddrop-app.uz/',
  });

  server.registerTool('lookup_word', {
    title: 'WordDrop lug‘atidan qidirish',
    description: 'Look up one English word or phrasal verb in the verified WordDrop dictionary. Returns Uzbek translations, CEFR level, and examples or pronunciation when available.',
    inputSchema: z.object({
      term: z.string().trim().min(1).max(80).transform(term => term.replace(/[’‘]/g, "'").replace(/\s+/g, ' ')).pipe(
        z.string().regex(/^[a-z]+(?:[ '\-][a-z]+)*$/i, 'Enter a single English word or phrase.'),
      ),
    }),
    annotations: readOnly,
  }, async ({ term }) => {
    const results = await Promise.allSettled(dictionarySources.map(source => searchDictionary(env, term, source)));
    const available = results.filter(result => result.status === 'fulfilled');
    if (!available.length) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'WordDrop lug‘atiga hozir ulanib bo‘lmadi. Birozdan keyin qayta urining.' }],
      };
    }
    return formatResult({
      term,
      entries: available.flatMap(result => result.value),
      ...(available.length < results.length && { partial: true }),
      source: 'WordDrop',
    });
  });

  server.registerTool('find_listening_lessons', {
    title: 'WordDrop Listening darslarini topish',
    description: 'Find existing WordDrop Listening lessons by title/topic or suggested CEFR level. Returns public recordings and where to open the exercises in WordDrop. CEFR suggestions are approximate.',
    inputSchema: z.object({
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
      query: z.string().trim().min(1).max(80).optional(),
      limit: z.number().int().min(1).max(12).default(5),
    }),
    annotations: readOnly,
  }, ({ level, query, limit }) => {
    const topic = query?.toLowerCase();
    const lessons = catalog.filter(lesson => {
      const keywords = lesson.suggestedLevel === 'A2'
        ? 'salomlashish tanishuv beginner kundalik suhbat'
        : 'intervyu suhbat talabalar maktab';
      return (!level || lesson.suggestedLevel === level) &&
        (!topic || `${lesson.title} ${lesson.collection} ${keywords}`.toLowerCase().includes(topic));
    }).slice(0, limit).map(lesson => ({ ...lesson, appUrl }));
    return formatResult({
      lessons,
      navigation: 'WordDrop ilovasidagi bosqichlar xaritasida mapLevel raqamidan keyingi Tinglash belgisini oching. Birinchi dars bosh sahifadagi Tinglash kartasida ham bor.',
      levelNote: 'CEFR darajalari mashq tanlash uchun taxminiy tavsiya.',
    });
  });

  return server;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/health' && request.method === 'GET') {
      return Response.json({ service: 'worddrop', version: '0.1.0' });
    }
    if (pathname !== '/mcp') return new Response('Not found', { status: 404 });

    const origin = request.headers.get('Origin');
    if (origin && !['https://chatgpt.com', 'https://www.worddrop-app.uz'].includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    return createMcpHandler(() => createServer(env), {
      maxRequestBytes: 16_384,
    }).fetch(request);
  },
};
