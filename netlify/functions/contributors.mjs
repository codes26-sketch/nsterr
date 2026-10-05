import { endpoint, hashPassword, HttpError, json, method, readBody, requireOwner, requireSameOrigin, supabase } from './common.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export const handler = endpoint(async event => {
  if (event.httpMethod === 'GET') {
    await requireOwner(event, ['main']);
    const rows = await supabase('nster_owner_accounts?role=eq.uploader&select=id,username,display_name&order=created_at.asc');
    return json(200, { accounts: Array.isArray(rows) ? rows.map(row => ({ id: row.id, username: row.username, displayName: row.display_name })) : [] });
  }
  if (event.httpMethod === 'POST') {
    requireSameOrigin(event); await requireOwner(event, ['main']);
    const body = readBody(event);
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const password = body.password;
    if (!USERNAME.test(username)) throw new HttpError(400, 'Use 3–32 letters, numbers, dots, dashes, or underscores for the username.', 'INVALID_USERNAME');
    if (!displayName || displayName.length > 60) throw new HttpError(400, 'Enter a display name of up to 60 characters.', 'INVALID_DISPLAY_NAME');
    if (typeof password !== 'string' || password.length < 3 || password.length > 100) throw new HttpError(400, 'Use an account password with at least 3 characters.', 'WEAK_OWNER_PASSWORD');
    const existing = await supabase(`nster_owner_accounts?username=eq.${encodeURIComponent(username)}&select=id&limit=1`);
    if (Array.isArray(existing) && existing.length) throw new HttpError(409, 'That uploader username is already in use.', 'USERNAME_TAKEN');
    const credential = await hashPassword(password);
    const accounts = await supabase('nster_owner_accounts?select=id,username,display_name', {
      method: 'POST', prefer: 'return=representation',
      body: [{ username, display_name: displayName, role: 'uploader', password_salt: credential.salt, password_hash: credential.hash }]
    });
    return json(201, { account: accounts?.[0] ? { id: accounts[0].id, username: accounts[0].username, displayName: accounts[0].display_name } : null });
  }
  if (event.httpMethod === 'DELETE') {
    requireSameOrigin(event); await requireOwner(event, ['main']);
    const id = event.queryStringParameters?.id || '';
    if (!UUID.test(id)) throw new HttpError(400, 'Choose a valid uploader account.', 'INVALID_ACCOUNT_ID');
    await supabase(`nster_owner_accounts?id=eq.${encodeURIComponent(id)}&role=eq.uploader`, { method: 'DELETE', prefer: 'return=minimal' });
    return json(200, { ok: true });
  }
  method(event, ['GET', 'POST', 'DELETE']);
});
