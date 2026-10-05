import { createHash, timingSafeEqual } from 'node:crypto';
import { clearCookie, consumeRateLimit, endpoint, hashPassword, HttpError, json, makeSession, method, readBody, readSettings, requiredEnv, requireSameOrigin, sessionCookie, supabase } from './common.mjs';

function sameSecret(actual, expected) {
  if (typeof actual !== 'string') return false;
  const a = createHash('sha256').update(actual).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export const handler = endpoint(async event => {
  method(event, ['POST']); requireSameOrigin(event);
  const body = readBody(event);
  const { setupKey } = body;
  await consumeRateLimit(event, 'main-owner-setup', 5, 900);
  const configuredKey = requiredEnv('NSTER_SETUP_KEY');
  if (!sameSecret(setupKey, configuredKey)) throw new HttpError(401, 'The one-time setup key is not correct.', 'INVALID_SETUP_KEY');
  const settings = await readSettings();
  if (settings.setup_complete) throw new HttpError(409, 'NSTER already has a main owner.', 'ALREADY_SETUP');
  const existing = await supabase('nster_owner_accounts?select=id&limit=1');
  if (Array.isArray(existing) && existing.length) throw new HttpError(409, 'NSTER already has a main owner.', 'ALREADY_SETUP');
  const seedNames = ['NSTER_INITIAL_OWNER_PASSWORD', 'NSTER_INITIAL_VISITOR_PASSWORD', 'NSTER_INITIAL_UPLOADER_USERNAME', 'NSTER_INITIAL_UPLOADER_PASSWORD'];
  const seedFlags = seedNames.map(name => Boolean(process.env[name]));
  if (seedFlags.some(Boolean) && !seedFlags.every(Boolean)) throw new HttpError(503, 'Initial account environment settings are incomplete.', 'INCOMPLETE_INITIAL_ACCOUNTS');
  const seeded = seedFlags.every(Boolean);
  const displayName = seeded ? (process.env.NSTER_INITIAL_OWNER_NAME || 'Main owner') : body.displayName;
  const ownerPassword = seeded ? process.env.NSTER_INITIAL_OWNER_PASSWORD : body.ownerPassword;
  const visitorPassword = seeded ? process.env.NSTER_INITIAL_VISITOR_PASSWORD : body.visitorPassword;
  const uploaderUsername = seeded ? process.env.NSTER_INITIAL_UPLOADER_USERNAME : '';
  const uploaderPassword = seeded ? process.env.NSTER_INITIAL_UPLOADER_PASSWORD : '';
  const uploaderDisplayName = seeded ? (process.env.NSTER_INITIAL_UPLOADER_DISPLAY_NAME || 'Question uploader') : '';
  if (typeof displayName !== 'string' || displayName.trim().length < 1 || displayName.trim().length > 60) throw new HttpError(400, 'Enter an owner name of up to 60 characters.', 'INVALID_OWNER_NAME');
  if (typeof ownerPassword !== 'string' || ownerPassword.length < 8 || ownerPassword.length > 100) throw new HttpError(400, 'Use a main owner password with at least 8 characters.', 'WEAK_OWNER_PASSWORD');
  if (typeof visitorPassword !== 'string' || visitorPassword.length < 5 || visitorPassword.length > 100) throw new HttpError(400, 'Use a visitor password with at least 5 characters.', 'WEAK_VISITOR_PASSWORD');
  if (seeded && (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(uploaderUsername) || uploaderPassword.length < 3 || uploaderPassword.length > 100 || !uploaderDisplayName || uploaderDisplayName.length > 60)) throw new HttpError(503, 'Initial uploader details are invalid.', 'INVALID_INITIAL_UPLOADER');

  const ownerSecret = await hashPassword(ownerPassword);
  const visitorSecret = await hashPassword(visitorPassword);
  const uploaderSecret = seeded ? await hashPassword(uploaderPassword) : null;
  const accountRows = [{ username: 'main', display_name: displayName.trim(), role: 'main', password_salt: ownerSecret.salt, password_hash: ownerSecret.hash }];
  if (seeded) accountRows.push({ username: uploaderUsername, display_name: uploaderDisplayName, role: 'uploader', password_salt: uploaderSecret.salt, password_hash: uploaderSecret.hash });
  const accounts = await supabase('nster_owner_accounts?select=id,username,display_name,role', {
    method: 'POST', prefer: 'return=representation',
    body: accountRows
  });
  const account = Array.isArray(accounts) ? accounts[0] : null;
  if (!account) throw new HttpError(503, 'NSTER could not create its owner account. Check the database schema and try again.', 'SETUP_FAILED');
  try {
    await supabase('nster_settings?id=eq.true', {
      method: 'PATCH', prefer: 'return=minimal',
      body: { setup_complete: true, visitor_salt: visitorSecret.salt, visitor_hash: visitorSecret.hash, visitor_version: 1 }
    });
  } catch (error) {
    try { await supabase(`nster_owner_accounts?role=in.(main,uploader)`, { method: 'DELETE' }); } catch (_) {}
    throw error;
  }
  const token = makeSession('main', account.id);
  return json(201, { ok: true, owner: { id: account.id, displayName: account.display_name, role: account.role } }, {
    'Set-Cookie': [sessionCookie('nster_owner', token), clearCookie('nster_visitor')]
  });
});
