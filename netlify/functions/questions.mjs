import { endpoint, HttpError, json, method, readBody, requireOwner, requireQuestionsRead, requireSameOrigin, supabase } from './common.mjs';
import { createHash } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import { questions } from '../../db/schema.ts';
import { editableQuestion, importExistingQuestions, importRepositoryQuestions } from '../../lib/question-library.mjs';
import { questionRecords, QuestionValidationError, validateQuestion } from '../../lib/question-data.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = { id: questions.id, question: questions.question, answer: questions.answer, code: questions.code, language: questions.language, filename: questions.filename, created_at: questions.created_at };

function validated(callback) {
  try { return callback(); }
  catch (error) {
    if (error instanceof QuestionValidationError) throw new HttpError(400, error.message, 'INVALID_QUESTION_DATA');
    throw error;
  }
}

function questionId(event) {
  const id = event.queryStringParameters?.id || '';
  if (!UUID.test(id)) throw new HttpError(400, 'Choose a valid question.', 'INVALID_QUESTION_ID');
  return id;
}

export const handler = endpoint(async event => {
  method(event, ['GET', 'POST', 'PATCH', 'DELETE']);
  if (event.httpMethod === 'GET') {
    const account = await requireQuestionsRead(event);
    const db = getDb();
    await importRepositoryQuestions(db);
    try { await importExistingQuestions(db, supabase); }
    catch { console.warn('NSTER legacy import is pending; serving the saved question library.'); }
    const condition = account.role === 'uploader' ? and(isNull(questions.deleted_at), eq(questions.created_by, account.id)) : isNull(questions.deleted_at);
    const rows = await db.select(fields).from(questions).where(condition).orderBy(desc(questions.created_at), questions.id);
    return json(200, { questions: rows });
  }
  if (event.httpMethod === 'POST') {
    requireSameOrigin(event);
    const account = await requireOwner(event, ['main', 'uploader']);
    const body = readBody(event, 1_000_000);
    const db = getDb();
    if (body.action === 'import-repository') {
      if (account.role !== 'main') throw new HttpError(403, 'Only the main owner can import the included library.', 'OWNER_PERMISSION_DENIED');
      return json(200, await importRepositoryQuestions(db));
    }
    if (body.action === 'import') {
      const records = validated(() => questionRecords(body.data).map(validateQuestion));
      const fingerprint = row => createHash('sha256').update(JSON.stringify(validateQuestion(row))).digest('hex');
      const existing = await db.select(fields).from(questions).where(isNull(questions.deleted_at));
      const known = new Set(existing.map(fingerprint));
      const rows = records.flatMap(row => {
        const key = fingerprint(row);
        if (known.has(key)) return [];
        known.add(key);
        return [{ ...row, created_by: account.id, source_key: `upload:${account.id}:${key}` }];
      });
      const inserted = rows.length ? await db.insert(questions).values(rows).onConflictDoNothing({ target: questions.source_key }).returning({ id: questions.id }) : [];
      return json(201, { imported: inserted.length, skipped: records.length - inserted.length });
    }
    const row = validated(() => validateQuestion(body));
    const [question] = await db.insert(questions).values({ ...row, created_by: account.id }).returning(fields);
    return json(201, { question });
  }
  if (event.httpMethod === 'PATCH') {
    requireSameOrigin(event);
    const account = await requireOwner(event, ['main', 'uploader']);
    const id = questionId(event);
    const row = validated(() => validateQuestion(readBody(event)));
    const db = getDb();
    const [question] = await db.update(questions).set({ ...row, updated_at: new Date() }).where(and(editableQuestion(id, account), isNull(questions.deleted_at))).returning(fields);
    if (!question) throw new HttpError(404, 'This question is unavailable or you do not have permission to edit it.', 'QUESTION_NOT_FOUND');
    return json(200, { question });
  }
  if (event.httpMethod === 'DELETE') {
    requireSameOrigin(event);
    await requireOwner(event, ['main']);
    const id = questionId(event);
    const db = getDb();
    const removed = await db.update(questions).set({ deleted_at: new Date() }).where(and(eq(questions.id, id), isNull(questions.deleted_at))).returning({ id: questions.id });
    if (!removed.length) throw new HttpError(404, 'This question has already been removed.', 'QUESTION_NOT_FOUND');
    return json(200, { ok: true });
  }
});

export default handler;
