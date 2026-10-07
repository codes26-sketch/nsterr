export class QuestionValidationError extends Error {}

export function questionRecords(data) {
  const records = Array.isArray(data) ? data : data?.practicals || data?.questions;
  if (!Array.isArray(records) || !records.length || records.length > 300) {
    throw new QuestionValidationError('Use a JSON array, or an object with a practicals or questions array, containing 1–300 questions.');
  }
  return records;
}

export function validateQuestion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new QuestionValidationError('Each question must be a JSON object.');
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  const code = typeof body.code === 'string' ? body.code : '';
  const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
  const language = typeof body.language === 'string' ? body.language.trim() : (/\.java$/i.test(filename) ? 'Java' : '');
  if (question.length < 3 || question.length > 160) throw new QuestionValidationError('Questions must be 3–160 characters long.');
  if (answer.length < 2 || answer.length > 4000) throw new QuestionValidationError('Answers must be 2–4,000 characters long.');
  if (code.length > 3000) throw new QuestionValidationError('Code snippets can be up to 3,000 characters.');
  if (language.length > 24) throw new QuestionValidationError('Code language can be up to 24 characters.');
  if (filename.length > 128) throw new QuestionValidationError('Filenames can be up to 128 characters.');
  return { question, answer, code, language, filename };
}
