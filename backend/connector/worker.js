import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const appUrl = 'https://www.worddrop-app.uz/app.html';
const version = '0.2.0';
const catalog = WORDDROP_LISTENING_CATALOG;
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const dictionarySources = [
  { table: 'word_translations', columns: 'en,uz,pos,ipa,def,ex,level', kind: 'word' },
  { table: 'word_phrasal_verbs', columns: 'en,uz,meanings,examples,level', kind: 'phrasal_verb' },
];
const activities = {
  placement: {
    title: 'Daraja testi',
    url: appUrl + '#placement',
    nextStep: 'Testni oching va hozirgi darajangizni aniqlashdan boshlang.',
  },
  pronunciation: {
    title: 'Talaffuz studiyasi',
    url: appUrl,
    nextStep: 'Boshi → Barcha rejimlar → Talaffuz. Bitta so‘zni aytib, tahlilni tekshiring.',
    prerequisite: 'Ovoz yozish uchun mikrofon ruxsati kerak.',
  },
  vocabulary_review: {
    title: 'Takrorlash',
    url: appUrl,
    nextStep: 'Boshi → Barcha rejimlar → Takrorlash. Tayyor bo‘lgan kartalardan boshlang.',
    prerequisite: 'Shaxsiy takrorlash navbati o‘quvchining oldingi mashqlariga bog‘liq.',
  },
  multilevel: {
    title: 'Multilevel sinov imtihoni',
    url: appUrl + '#ml',
    nextStep: 'Tayyor variantni tanlang. Bitta ko‘nikmani mashq qilish uchun tegishli bo‘limni oching.',
    prerequisite: 'Mashq boshlash uchun tayyor variant mavjud bo‘lishi kerak.',
  },
  ielts: {
    title: 'IELTS Mock Test markazi',
    url: appUrl,
    nextStep: 'Boshi → Mock Test markazi. Mashq qilmoqchi bo‘lgan IELTS bo‘limini tanlang.',
  },
};

function listeningRoute(level) {
  const lesson = catalog.find(item => !level || item.suggestedLevel === level);
  if (!lesson) {
    return {
      title: 'Tinglash mashqlari',
      url: appUrl,
      nextStep: 'Boshi sahifasidagi bosqichlar xaritasidan Tinglash belgisini tanlang.',
      note: `${level} tavsiya darajasi bilan belgilangan mashq topilmadi.`,
    };
  }
  return {
    title: lesson.title,
    url: appUrl,
    audioUrl: lesson.audioUrl,
    suggestedLevel: lesson.suggestedLevel,
    nextStep: `Boshi sahifasidagi xaritada ${lesson.mapLevel}-bosqichdan keyingi Tinglash belgisini oching.`,
    prerequisite: `Tinglash belgisi qulflangan bo‘lsa, ${lesson.mapLevel}-bosqichni tugating.`,
  };
}

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
    version,
    title: 'WordDrop',
    websiteUrl: 'https://www.worddrop-app.uz/',
  });

  server.registerTool('choose_next_activity', {
    title: 'WordDrop’da keyingi mashqni tanlash',
    description: 'Start here when a learner asks where to begin, what to do next, or how to find a WordDrop feature. Returns one relevant activity, the real site path, and applicable prerequisites. Use placement when the learner wants to know their level. Use ielts and multilevel only for their respective exam formats. This tool does not read personal progress.',
    inputSchema: z.object({
      goal: z.enum(['placement', 'listening', 'pronunciation', 'vocabulary_review', 'multilevel', 'ielts']),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional().describe('The learner’s known CEFR level, used for Listening.'),
    }),
    annotations: readOnly,
  }, ({ goal, level }) => formatResult({
    activity: goal === 'listening' ? listeningRoute(level) : activities[goal],
  }));

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
      navigation: 'Boshi sahifasidagi xaritada mapLevel raqamidan keyingi Tinglash belgisini oching. Belgi qulflangan bo‘lsa, o‘sha bosqichni tugating.',
      levelNote: 'CEFR darajalari mashq tanlash uchun taxminiy tavsiya.',
    });
  });

  return server;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/health' && request.method === 'GET') {
      return Response.json({ service: 'worddrop', version });
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
