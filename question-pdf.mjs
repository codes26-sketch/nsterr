import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import { questions } from '../../db/schema.ts';
import { editableQuestion } from '../../lib/question-library.mjs';
import {
  endpoint, HttpError, json, method, readBody, requireOwner, requireQuestionsRead,
  requireSameOrigin, supabaseStorageObject
} from './common.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PDF_BUCKET = 'nster-answer-pdfs';
const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_BODY_LENGTH = 5_700_000;

function questionId(event) {
  const id = event.queryStringParameters?.id || '';
  if (!UUID.test(id)) throw new HttpError(400, 'Choose a valid question.', 'INVALID_QUESTION_ID');
  return id;
}

function questionCondition(id, account) {
  return account.role === 'uploader'
    ? and(eq(questions.id, id), eq(questions.created_by, account.id), isNull(questions.deleted_at))
    : and(eq(questions.id, id), isNull(questions.deleted_at));
}

function cleanFilename(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'Choose a PDF file.', 'INVALID_PDF');
  const filename = value.trim().normalize('NFC').replace(/[\\/\u0000-\u001f\u007f:*?"<>|]/g, '_');
  if (!filename || filename.length > 128 || !filename.toLowerCase().endsWith('.pdf')) {
    throw new HttpError(400, 'Use a PDF filename up to 128 characters long.', 'INVALID_PDF');
  }
  return filename;
}

function parsePdf(body) {
  const filename = cleanFilename(body.filename);
  const encoded = body.data;
  const maxEncodedLength = Math.ceil(MAX_PDF_BYTES / 3) * 4;
  const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > maxEncodedLength || encoded.length % 4 !== 0 || !base64Pattern.test(encoded)) {
    throw new HttpError(400, 'Choose a valid PDF file.', 'INVALID_PDF');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_PDF_BYTES || bytes.toString('base64') !== encoded || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new HttpError(bytes.length > MAX_PDF_BYTES ? 413 : 400, bytes.length > MAX_PDF_BYTES ? 'PDF files can be up to 4 MB.' : 'The selected file is not a valid PDF.', bytes.length > MAX_PDF_BYTES ? 'PDF_TOO_LARGE' : 'INVALID_PDF');
  }
  return { filename, bytes };
}

function disposition(filename) {
  const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\;]/g, '_');
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
  return "inline; filename=\"" + fallback + "\"; filename*=UTF-8''" + encoded;
}

async function removeStoredPdf(path) {
  if (!path) return;
  try { await supabaseStorageObject(PDF_BUCKET + '/' + path, { method: 'DELETE' }); }
  catch { /* Cleanup is best-effort after the database points elsewhere. */ }
}

async function accessibleQuestion(db, id, account) {
  const [row] = await db.select({
    id: questions.id,
    created_by: questions.created_by,
    pdf_path: questions.pdf_path,
    pdf_filename: questions.pdf_filename,
    pdf_size: questions.pdf_size
  }).from(questions).where(questionCondition(id, account)).limit(1);
  return row;
}

export const handler = endpoint(async event => {
  method(event, ['GET', 'POST']);
  const id = questionId(event);
  const db = getDb();

  if (event.httpMethod === 'GET') {
    const account = await requireQuestionsRead(event);
    const question = await accessibleQuestion(db, id, account);
    if (!question?.pdf_path || !question.pdf_filename) throw new HttpError(404, 'This PDF attachment is unavailable.', 'PDF_NOT_FOUND');
    const expectedPath = new RegExp('^questions/' + id + '/[0-9a-f-]{36}\\.pdf
    const response = await supabaseStorageObject('authenticated/' + PDF_BUCKET + '/' + question.pdf_path);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_PDF_BYTES || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new HttpError(404, 'This PDF attachment is unavailable.', 'PDF_NOT_FOUND');
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition(question.pdf_filename),
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      },
      body: bytes.toString('base64'),
      isBase64Encoded: true
    };
  }

  requireSameOrigin(event);
  const account = await requireOwner(event, ['main', 'uploader']);
  const body = readBody(event, MAX_BODY_LENGTH);
  const { filename, bytes } = parsePdf(body);
  const current = await accessibleQuestion(db, id, account);
  if (!current) throw new HttpError(404, 'This question is unavailable or you do not have permission to edit it.', 'QUESTION_NOT_FOUND');

  const storagePath = 'questions/' + id + '/' + randomUUID() + '.pdf';
  await supabaseStorageObject(PDF_BUCKET + '/' + storagePath, {
    method: 'POST',
    body: bytes,
    contentType: 'application/pdf'
  });

  let updated;
  try {
    [updated] = await db.update(questions)
      .set({ pdf_path: storagePath, pdf_filename: filename, pdf_size: bytes.length, updated_at: new Date() })
      .where(and(editableQuestion(id, account), isNull(questions.deleted_at)))
      .returning({ id: questions.id, pdf_filename: questions.pdf_filename, pdf_size: questions.pdf_size });
    if (!updated) throw new HttpError(404, 'This question is unavailable or you do not have permission to edit it.', 'QUESTION_NOT_FOUND');
  } catch (error) {
    await removeStoredPdf(storagePath);
    throw error;
  }

  if (current.pdf_path) await removeStoredPdf(current.pdf_path);
  return json(200, { file: { filename: updated.pdf_filename, size: updated.pdf_size } });
});

export default handler;
, 'i');
    if (!expectedPath.test(question.pdf_path)) throw new HttpError(404, 'This PDF attachment is unavailable.', 'PDF_NOT_FOUND');
    const response = await supabaseStorageObject('authenticated/' + PDF_BUCKET + '/' + question.pdf_path);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_PDF_BYTES || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new HttpError(404, 'This PDF attachment is unavailable.', 'PDF_NOT_FOUND');
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition(question.pdf_filename),
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      },
      body: bytes.toString('base64'),
      isBase64Encoded: true
    };
  }

  requireSameOrigin(event);
  const account = await requireOwner(event, ['main', 'uploader']);
  const body = readBody(event, MAX_BODY_LENGTH);
  const { filename, bytes } = parsePdf(body);
  const current = await accessibleQuestion(db, id, account);
  if (!current) throw new HttpError(404, 'This question is unavailable or you do not have permission to edit it.', 'QUESTION_NOT_FOUND');

  const storagePath = 'questions/' + id + '/' + randomUUID() + '.pdf';
  await supabaseStorageObject(PDF_BUCKET + '/' + storagePath, {
    method: 'POST',
    body: bytes,
    contentType: 'application/pdf'
  });

  let updated;
  try {
    [updated] = await db.update(questions)
      .set({ pdf_path: storagePath, pdf_filename: filename, pdf_size: bytes.length, updated_at: new Date() })
      .where(and(editableQuestion(id, account), isNull(questions.deleted_at)))
      .returning({ id: questions.id, pdf_filename: questions.pdf_filename, pdf_size: questions.pdf_size });
    if (!updated) throw new HttpError(404, 'This question is unavailable or you do not have permission to edit it.', 'QUESTION_NOT_FOUND');
  } catch (error) {
    await removeStoredPdf(storagePath);
    throw error;
  }

  if (current.pdf_path) await removeStoredPdf(current.pdf_path);
  return json(200, { file: { filename: updated.pdf_filename, size: updated.pdf_size } });
});

export default handler;

