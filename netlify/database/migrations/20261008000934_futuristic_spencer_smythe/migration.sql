ALTER TABLE "nster_library_questions" ADD COLUMN IF NOT EXISTS "pdf_path" text;--> statement-breakpoint
ALTER TABLE "nster_library_questions" ADD COLUMN IF NOT EXISTS "pdf_filename" varchar(128);--> statement-breakpoint
ALTER TABLE "nster_library_questions" ADD COLUMN IF NOT EXISTS "pdf_size" integer;
