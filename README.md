# NSTER

NSTER is a password-protected Q&A site. Questions, answers, code examples, and import history are stored in Netlify Database. PDF answer attachments are stored in a private Supabase Storage bucket. The existing Supabase-backed owner accounts and shared visitor password are unchanged. Netlify Functions verify visitor and owner sessions before returning or changing data.

## Deploy to Netlify

Deploy the **contents of this `outputs` folder as the site repository root** and connect that repository to Netlify. If you keep `outputs/` inside a larger repository, set Netlify's base directory to `outputs`. The `netlify.toml` publishes `site/` and deploys the functions in `netlify/functions/`. Do not use Netlify's static drag-and-drop deploy for this project; the backend functions must be deployed too.

### 1. Configure the existing account database

1. Create a Supabase project.
2. Open **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Run [`supabase/setup-pdf-storage.sql`](supabase/setup-pdf-storage.sql) once to create the private PDF bucket.
3. From **Project Settings → API Keys** (or the project Connect dialog), copy the project URL and a server-side **Secret key** (`sb_secret_…`). Keep the secret key private.

### 2. Add Netlify environment variables

In your Netlify site's environment variables, add these four values. Make them available to **Functions**. Do not put these values in `site/`, `netlify.toml`, or browser code.

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | The Supabase project URL, such as `https://your-project.supabase.co` |
| `SUPABASE_SECRET_KEY` | The Supabase server-side secret key (`sb_secret_…`) |
| `NSTER_SETUP_KEY` | A unique random one-time key used to create the first main owner |
| `NSTER_SESSION_SECRET` | A separate random secret with at least 32 characters, used to sign sessions and rate-limit identifiers |
| `NSTER_INITIAL_OWNER_NAME` | Optional initial main-owner display name |
| `NSTER_INITIAL_OWNER_PASSWORD` | Optional initial main-owner password |
| `NSTER_INITIAL_VISITOR_PASSWORD` | Optional initial visitor password |
| `NSTER_INITIAL_UPLOADER_USERNAME` | Optional first uploader username |
| `NSTER_INITIAL_UPLOADER_DISPLAY_NAME` | Optional first uploader display name |
| `NSTER_INITIAL_UPLOADER_PASSWORD` | Optional first uploader password |

Generate a strong random value locally for each NSTER secret. For example, in PowerShell:

```powershell
$bytes = [byte[]]::new(48)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Generate two different values. Add them in Netlify's UI; do not commit them. After adding the variables, trigger a new deploy so Functions receive them.

### 3. Create the main owner account

After the first successful deploy, open your Netlify URL and select the small settings icon in the header. Complete **Set up your NSTER** with the `NSTER_SETUP_KEY`. If all `NSTER_INITIAL_*` password variables are configured, setup creates the main owner, visitor password, and uploader account from those server-only values. Otherwise, enter the main owner and visitor passwords in the setup form. The setup key is checked on the server and cannot create another main owner after setup is complete.

Share the visitor password with your visitors. The main owner can change that password, publish, edit, import, or remove Q&A, and create or remove question-uploader accounts. An uploader can publish and import questions and edit its own uploads, but cannot remove questions or manage access. Visitor and owner sessions use secure, HTTP-only cookies.

## Question library and JSON imports

Netlify installs the dependencies in `package.json`, provisions Netlify Database, and applies the migration in `netlify/database/migrations/` during deployment. The Drizzle schema lives in `db/schema.ts`. No additional database credentials are needed for the question library.

The deployment migration imports the 35 practicals from the supplied `java_practicals_1_to_35.json`, including answers, Java code, and filenames, before the site opens. The repository file is also bundled into the questions function as an idempotent fallback. The JSON file is seed content, not the storage location for edits. Existing accounts and passwords continue to work as before. Previously published Supabase questions are copied without changing their IDs; an unavailable legacy database no longer blocks viewing questions already saved in Netlify Database.

In the owner workspace, the **Upload questions from JSON** card has a visible file picker that accepts one or more JSON files. Select files, review the filename and question-count preview, then select **Upload all questions**. Nothing is uploaded until that button is pressed. A downloadable JSON example shows the format. Main owners can also use **Load included Java practicals (35)** without choosing a file.

Each file may be an array of question objects, an object containing a `questions` array, or an object containing a `practicals` array. Each object requires `question` and `answer`; `code`, `language`, and `filename` are optional. A combined upload supports up to 300 questions and 1 MB. Question titles support 3–160 characters, answers 2–4,000 characters, and code up to 3,000 characters. Java filenames automatically select the Java language when none is supplied. The whole import is validated before insertion. Duplicate questions, including reuploads of the included practicals, are skipped, and failed uploads retain the selection for retry.

Select **Edit** beside a published question to change its question, answer, filename, language, code, or PDF attachment, then select **Save changes**. **Cancel editing** leaves the published version untouched. Main owners can edit any question; uploaders only see and edit their own uploads. Removal requires confirmation. Stable import identifiers ensure later library loads and redeploys do not overwrite saved edits or restore removed questions. When extending the repository JSON, keep existing practical IDs stable and give new entries unique IDs.

## PDF answers

In the owner question form, choose an optional PDF before publishing or editing an answer. Files are limited to 4 MB. A new PDF replaces the current attachment; saving an edit without selecting a file keeps the existing one. Visitors see a **View attached PDF** link under the answer. The link streams the file through an authenticated Netlify Function, so visitors must have opened NSTER with the visitor password. PDF bytes are held in the private `nster-answer-pdfs` Supabase Storage bucket; filenames and storage keys are kept with the Netlify Database question row. The Netlify database migration adds the attachment fields automatically on deploy. Run `supabase/setup-pdf-storage.sql` once in the Supabase SQL Editor before using PDF uploads. No new Netlify environment variables are required.

The light palette and lime accents are retained. Dark mode uses pure-black page, card, input, dialog, and code backgrounds, with borders defining the layout. Theme selection remains local to each browser.

## Local preview

The static page alone is not a working site because `/api/*` routes are Netlify Functions. To run the integrated project locally, install the Netlify CLI and run `netlify dev` from this folder after setting the same environment variables in your local shell or Netlify CLI environment. Run the SQL schema against a Supabase project first.

## Security and data

- Only the public visitor-auth function can issue a visitor session. Questions are returned only after that check; the database is never queried directly from browser code.
- Owner permissions are enforced by each function, not just by hiding controls in the page.
- Passwords are salted and hashed on the server. The Supabase secret key, setup key, and session signing secret must stay in server-side environment variables.
- Login attempts are rate-limited by a keyed hash of the request IP. The raw IP is not stored in the database.
- Theme preference is saved in the visitor's browser. Q&A and import history are shared through Netlify Database; existing accounts and access settings remain in Supabase.

