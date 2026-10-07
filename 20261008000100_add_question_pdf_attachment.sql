ALTER TABLE "nster_library_questions"
  ADD COLUMN IF NOT EXISTS "pdf_path" text,
  ADD COLUMN IF NOT EXISTS "pdf_filename" varchar(128),
  ADD COLUMN IF NOT EXISTS "pdf_size" integer;

