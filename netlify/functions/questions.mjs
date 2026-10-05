import { endpoint, HttpError, json, method, readBody, requireOwner, requireQuestionsRead, requireSameOrigin, supabase } from './common.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = 'id,question,answer,code,language,created_at';

export const handler = endpoint(async event => {
  if (event.httpMethod === 'GET') {
    await requireQuestionsRead(event);
    const rows = await supabase(`nster_questions?select=${fields}&order=created_at.desc&limit=300`);
    return json(200, { questions: Array.isArray(rows) ? rows : [] });
  }
  if (event.httpMethod === 'POST') {
    requireSameOrigin(event);
    const account = await requireOwner(event, ['main', 'uploader']);
    const body = readBody(event);
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
    const code = typeof body.code === 'string' ? body.code : '';
    const language = typeof body.language === 'string' ? body.language.trim() : '';
    if (question.length < 3 || question.length > 160) throw new HttpError(400, 'Questions must be 3–160 characters long.', 'INVALID_QUESTION');
    if (answer.length < 2 || answer.length > 4000) throw new HttpError(400, 'Answers must be 2–4,000 characters long.', 'INVALID_ANSWER');
    if (code.length > 3000) throw new HttpError(400, 'Code snippets can be up to 3,000 characters.', 'CODE_TOO_LONG');
    if (language.length > 24) throw new HttpError(400, 'Code language can be up to 24 characters.', 'LANGUAGE_TOO_LONG');
    const rows = await supabase(`nster_questions?select=${fields}`, {
      method: 'POST', prefer: 'return=representation',
      body: [{ question, answer, code, language, created_by: account.id }]
    });
    return json(201, { question: rows?.[0] || null });
  }
  if (event.httpMethod === 'DELETE') {
    requireSameOrigin(event);
    await requireOwner(event, ['main']);
    const id = event.queryStringParameters?.id || '';
    if (!UUID.test(id)) throw new HttpError(400, 'Choose a valid question to remove.', 'INVALID_QUESTION_ID');
    await supabase(`nster_questions?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' });
    return json(200, { ok: true });
  }
  method(event, ['GET', 'POST', 'DELETE']);
});
