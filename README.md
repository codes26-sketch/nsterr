# NSTER

NSTER is a password-protected Q&A site. The public visitor password and every question are stored in Supabase Postgres. Netlify Functions verify visitor and owner sessions before returning or changing data.

## Deploy to Netlify

Deploy the **contents of this `outputs` folder as the site repository root** and connect that repository to Netlify. If you keep `outputs/` inside a larger repository, set Netlify's base directory to `outputs`. The `netlify.toml` publishes `site/` and deploys the functions in `netlify/functions/`. Do not use Netlify's static drag-and-drop deploy for this project; the backend functions must be deployed too.

### 1. Create the Supabase database

1. Create a Supabase project.
2. Open **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it.
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

Share the visitor password with your visitors. The main owner can change that password, publish or remove Q&A, and create or remove question-uploader accounts. An uploader can only publish new Q&A. Visitor and owner sessions use secure, HTTP-only cookies.

## Local preview

The static page alone is not a working site because `/api/*` routes are Netlify Functions. To run the integrated project locally, install the Netlify CLI and run `netlify dev` from this folder after setting the same environment variables in your local shell or Netlify CLI environment. Run the SQL schema against a Supabase project first.

## Security and data

- Only the public visitor-auth function can issue a visitor session. Questions are returned only after that check; the database is never queried directly from browser code.
- Owner permissions are enforced by each function, not just by hiding controls in the page.
- Passwords are salted and hashed on the server. The Supabase secret key, setup key, and session signing secret must stay in server-side environment variables.
- Login attempts are rate-limited by a keyed hash of the request IP. The raw IP is not stored in the database.
- Theme preference is saved in the visitor's browser. Accounts and Q&A are shared through Supabase.

