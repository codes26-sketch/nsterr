import { and, eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { imports, questions } from '../db/schema.ts';
import { questionRecords, validateQuestion } from './question-data.mjs';
import repositoryData from '../java_practicals_1_to_35.json' with { type: 'json' };

export async function importRepositoryQuestions(db) {
  const file = 'java_practicals_1_to_35.json';
  const marker = `repo:${file}:${createHash('sha256').update(JSON.stringify(repositoryData)).digest('hex')}`;
  const completed = await db.select({ id: imports.id }).from(imports).where(eq(imports.id, marker));
  if (completed.length) return;
  const timestamp = Date.now();
  const rows = questionRecords(repositoryData).map((record, index) => ({
    ...validateQuestion(record),
    source_key: `repo:${file}:${record.id ?? index + 1}`,
    created_at: new Date(timestamp - index)
  }));
  await db.insert(questions).values(rows).onConflictDoNothing({ target: questions.source_key });
  await db.insert(imports).values({ id: marker }).onConflictDoNothing();
}

export async function importExistingQuestions(db, readLegacy) {
  const marker = 'supabase-questions-v1';
  const completed = await db.select({ id: imports.id }).from(imports).where(eq(imports.id, marker));
  if (completed.length) return;
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const batch = await readLegacy(`nster_questions?select=id,question,answer,code,language,created_by,created_at&order=created_at.asc,id.asc&limit=500&offset=${offset}`);
    if (!Array.isArray(batch)) throw new Error('Invalid existing library response');
    rows.push(...batch);
    if (batch.length < 500) break;
  }
  for (let offset = 0; offset < rows.length; offset += 100) {
    await db.insert(questions).values(rows.slice(offset, offset + 100).map(row => ({
      ...validateQuestion(row),
      id: row.id,
      created_by: row.created_by,
      created_at: new Date(row.created_at),
      source_key: `legacy:${row.id}`
    }))).onConflictDoNothing();
  }
  await db.insert(imports).values({ id: marker }).onConflictDoNothing();
}

export function editableQuestion(id, account) {
  return account.role === 'main' ? eq(questions.id, id) : and(eq(questions.id, id), eq(questions.created_by, account.id));
}
