import { endpoint, hashPassword, HttpError, json, method, readBody, readSettings, requireOwner, requireSameOrigin, supabase } from './common.mjs';

export const handler = endpoint(async event => {
  method(event, ['PATCH']); requireSameOrigin(event); await requireOwner(event, ['main']);
  const { visitorPassword } = readBody(event);
  if (typeof visitorPassword !== 'string' || visitorPassword.length < 5 || visitorPassword.length > 100) {
    throw new HttpError(400, 'Use a visitor password with at least 5 characters.', 'WEAK_VISITOR_PASSWORD');
  }
  const settings = await readSettings();
  const { salt, hash } = await hashPassword(visitorPassword);
  await supabase('nster_settings?id=eq.true', {
    method: 'PATCH', prefer: 'return=minimal',
    body: { visitor_salt: salt, visitor_hash: hash, visitor_version: settings.visitor_version + 1, setup_complete: true }
  });
  return json(200, { ok: true });
});

export default handler;
