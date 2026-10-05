import { clearCookie, consumeRateLimit, endpoint, HttpError, json, makeSession, method, readBody, readSettings, requireSameOrigin, sessionCookie, verifyPassword } from './common.mjs';

export const handler = endpoint(async event => {
  method(event, ['POST']); requireSameOrigin(event);
  const body = readBody(event);
  if (typeof body.password !== 'string' || body.password.length > 100) throw new HttpError(400, 'Enter the visitor password shared by the owner.', 'PASSWORD_REQUIRED');
  const settings = await readSettings();
  if (!settings.setup_complete || !settings.visitor_hash) throw new HttpError(409, 'The main owner has not finished NSTER setup yet.', 'SETUP_REQUIRED');
  await consumeRateLimit(event, 'visitor-login', 10, 900);
  if (!await verifyPassword(body.password, settings.visitor_salt, settings.visitor_hash)) {
    throw new HttpError(401, 'That password didn’t match. Please check it with your NSTER owner.', 'INVALID_VISITOR_PASSWORD');
  }
  const token = makeSession('visitor', '', settings.visitor_version);
  return json(200, { ok: true }, { 'Set-Cookie': [sessionCookie('nster_visitor', token), clearCookie('nster_owner')] });
});
