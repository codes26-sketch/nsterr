-- Run once in the Supabase SQL Editor for the project used by NSTER.
-- The bucket stays private; only authenticated Netlify Functions use the secret key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('nster-answer-pdfs', 'nster-answer-pdfs', false, 4194304, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

