import { z } from 'zod';

const retentionMs = 30 * 24 * 60 * 60 * 1000;
const practiceCode = z.uuid().describe('Private code supplied by the learner or the previous Listening tool call.');
const writeHint = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

function fail(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

async function profileHash(code) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.toLowerCase()));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function shuffle(options) {
  const result = [...options];
  const draws = crypto.getRandomValues(new Uint32Array(result.length - 1));
  for (let i = result.length - 1; i > 0; i--) {
    const j = draws[i - 1] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function presentSession(attempt, resumeCode, formatResult) {
  const { title, audioUrl, startAt, endAt, questions, isReview } = JSON.parse(attempt.exercise);
  return formatResult({
    sessionId: attempt.id,
    resumeCode,
    title,
    level: attempt.level,
    audioUrl,
    startAt,
    endAt,
    isReview,
    questions: questions.map(({ prompt, options }, i) => ({ number: i + 1, prompt, options })),
    instruction: 'Give the audio link, the time range, and the numbered questions. Wait for the learner’s own answers before scoring. Offer the private resume code for later use and keep the session ID internal.',
  });
}

function exerciseFor(lesson, missed) {
  const { title, audioUrl, startAt, endAt } = lesson;
  return {
    title, audioUrl, startAt, endAt,
    isReview: missed.size > 0,
    questions: lesson.questions.flatMap(({ prompt, options, answer }, index) =>
      missed.size && !missed.has(index) ? [] : [{ index, prompt, options: shuffle(options), answer }]),
  };
}

export function registerPractice(server, db, catalog, formatResult) {
  server.registerTool('start_listening_practice', {
    title: 'WordDrop Listening mashg‘ulotini boshlash yoki davom ettirish',
    description: 'Start a complete A2 or B1 Listening exercise. Use a private resume code only if the learner supplied it or it came from this conversation’s previous practice tool. Resumes an unfinished exercise or selects a follow-up from saved results. Show the MP3 link and numbered options without guessing answers.',
    inputSchema: z.object({
      level: z.enum(['A2', 'B1']).optional().describe('Defaults to the previous level or A2 for a fresh practice.'),
      resumeCode: practiceCode.optional(),
    }),
    annotations: writeHint,
  }, async ({ level, resumeCode }) => {
    const code = resumeCode ?? crypto.randomUUID();
    const hash = await profileHash(code);
    const now = Date.now();
    const history = resumeCode ? await db.prepare(
      `SELECT id, level, lesson_id, exercise, result, graded_at FROM listening_attempts
       WHERE profile_hash = ? AND expires_at > ?
       ORDER BY created_at DESC, id DESC LIMIT 24`
    ).bind(hash, now).all() : { results: [] };
    if (resumeCode && !history.results.length) return fail('Davom ettirish kodi topilmadi yoki muddati tugagan.');
    const selectedLevel = level ?? history.results[0]?.level ?? 'A2';
    const attempts = history.results.filter(item => item.level === selectedLevel);
    const pending = attempts.find(item => item.graded_at === null);
    if (pending) return presentSession(pending, code, formatResult);
    const previous = attempts[0];
    const matching = catalog.filter(item => item.suggestedLevel === selectedLevel);
    const previousResult = previous && JSON.parse(previous.result);
    const previousLesson = matching.find(item => item.id === previous?.lesson_id);
    const missed = new Set(previousLesson && previousResult
      ? previousResult.corrections.map(item => item.index).filter(index => index < previousLesson.questions.length)
      : []);
    const nextIndex = (matching.indexOf(previousLesson) + 1) % matching.length;
    const lesson = missed.size ? previousLesson : matching[nextIndex];
    if (!lesson) return fail('Bu daraja uchun tayyor Listening mashqi topilmadi.');
    const attempt = {
      id: crypto.randomUUID(),
      level: selectedLevel,
      exercise: JSON.stringify(exerciseFor(lesson, missed)),
    };
    const [, created] = await db.batch([
      db.prepare(`DELETE FROM listening_attempts WHERE id IN
        (SELECT id FROM listening_attempts WHERE expires_at <= ? ORDER BY expires_at LIMIT 12)`).bind(now),
      db.prepare(`INSERT INTO listening_attempts
        (id, profile_hash, level, lesson_id, exercise, created_at, expires_at)
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM listening_attempts
          WHERE profile_hash = ? AND level = ? AND graded_at IS NULL AND expires_at > ?)`)
        .bind(attempt.id, hash, selectedLevel, lesson.id, attempt.exercise, now, now + retentionMs, hash, selectedLevel, now),
    ]);
    if (created.meta.changes) return presentSession(attempt, code, formatResult);
    const existing = await db.prepare(`SELECT id, level, exercise FROM listening_attempts
      WHERE profile_hash = ? AND level = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1`)
      .bind(hash, selectedLevel, now).first();
    return existing ? presentSession(existing, code, formatResult) : fail('Mashg‘ulotni ochib bo‘lmadi.');
  });

  server.registerTool('grade_listening_practice', {
    title: 'WordDrop Listening javoblarini tekshirish va natijani saqlash',
    description: 'Grade a started exercise using the exact option text for each numbered answer in order. Call after the learner has submitted their answers. Returns the saved score, mistakes and what to try next.',
    inputSchema: z.object({
      sessionId: z.uuid(),
      resumeCode: practiceCode,
      answers: z.array(z.string().trim().min(1).max(240)).min(1).max(24),
    }),
    annotations: { ...writeHint, idempotentHint: true },
  }, async ({ sessionId, resumeCode, answers }) => {
    const now = Date.now();
    const hash = await profileHash(resumeCode);
    const read = db.prepare(`SELECT exercise, result FROM listening_attempts
      WHERE id = ? AND profile_hash = ? AND expires_at > ?`).bind(sessionId, hash, now);
    const attempt = await read.first();
    if (!attempt) return fail('Mashg‘ulot topilmadi yoki muddati tugagan.');
    if (attempt.result) return formatResult(JSON.parse(attempt.result));
    const { questions } = JSON.parse(attempt.exercise);
    if (answers.length !== questions.length) {
      return fail(`Tekshirish uchun ${questions.length} ta javobni raqami bo‘yicha yuboring.`);
    }
    const corrections = [];
    const normalize = text => text.replace(/[’‘]/g, "'").toLowerCase();
    for (const [i, question] of questions.entries()) {
      const answer = question.options.find(option => normalize(option) === normalize(answers[i]));
      if (!answer) return fail(`${i + 1}-savol uchun berilgan variantlardan birini tanlang.`);
      if (answer !== question.answer) {
        corrections.push({
          number: i + 1, index: question.index, prompt: question.prompt,
          yourAnswer: answer, correctAnswer: question.answer,
        });
      }
    }
    const result = {
      correct: questions.length - corrections.length,
      total: questions.length,
      corrections,
      nextStep: corrections.length
        ? 'Keyingi mashg‘ulotda xato qilingan joylar qayta mashq qilinadi.'
        : 'Keyingi mashg‘ulotda shu darajadagi navbatdagi audio ishlatiladi.',
    };
    const updated = await db.prepare(`UPDATE listening_attempts SET result = ?, graded_at = ?, expires_at = ?
      WHERE id = ? AND profile_hash = ? AND expires_at > ? AND result IS NULL`)
      .bind(JSON.stringify(result), now, now + retentionMs, sessionId, hash, now).run();
    if (!updated.meta.changes) {
      const saved = await read.first();
      return saved?.result ? formatResult(JSON.parse(saved.result)) : fail('Natijani saqlab bo‘lmadi.');
    }
    return formatResult(result);
  });
}
