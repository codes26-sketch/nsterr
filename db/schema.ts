import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const questions = pgTable('nster_library_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  question: varchar('question', { length: 160 }).notNull(),
  answer: text('answer').notNull(),
  code: text('code').notNull().default(''),
  language: varchar('language', { length: 24 }).notNull().default(''),
  filename: varchar('filename', { length: 128 }).notNull().default(''),
  pdf_path: text('pdf_path'),
  pdf_filename: varchar('pdf_filename', { length: 128 }),
  pdf_size: integer('pdf_size'),
  created_by: uuid('created_by'),
  source_key: text('source_key').unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true })
});

export const imports = pgTable('nster_library_imports', {
  id: text('id').primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
