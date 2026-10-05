import { clearCookie, consumeRateLimit, endpoint, HttpError, json, makeSession, method, readBody, requireSameOrigin, sessionCookie, supabase, verifyPassword } from './common.mjs';

export const handler = endpoint(async event => {
  method(event, ['POST']); requireSameOrigin(event);
  const body = readBody(event);
  if (body.action === 'logout') return json(200, { ok: true }, { 'Set-Cookie': clearCookie('nster_owner') });
  if (body.action !== 'login') throw new HttpError(400, 'Choose an owner sign-in action.', 'INVALID_ACTION');
  const role = body.role;
  if (!['main', 'uploader'].includes(role)) throw new HttpError(400, 'Choose a valid owner account type.', 'INVALID_ROLE');
  const username = role === 'main' ? 'main' : String(body.username || '').trim().toLowerCase();
  const password = body.password;
  if (role === 'uploader' && !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) throw new HttpError(400, 'Enter the uploader username.', 'INVALID_USERNAME');
  if (typeof password !== 'string' || password.length < 1 || password.length > 100) throw new HttpError(400, 'Enter your owner password.', 'PASSWORD_REQUIRED');
  await consumeRateLimit(event, 'owner-login', 10, 900);
  const rows = await supabase(`nster_owner_accounts?username=eq.${encodeURIComponent(username)}&role=eq.${role}&select=id,username,display_name,role,password_salt,password_hash&limit=1`);
  const account = Array.isArray(rows) ? rows[0] : null;
  const valid = account && await verifyPassword(password, account.password_salt, account.password_hash);
  if (!valid) throw new HttpError(401, 'Those details did not match an owner account.', 'INVALID_OWNER_LOGIN');
  const token = makeSession(account.role, account.id);
  return json(200, { ok: true, owner: { id: account.id, displayName: account.display_name, role: account.role } }, {
    'Set-Cookie': [sessionCookie('nster_owner', token), clearCookie('nster_visitor')]
  });
});

export default handler;
