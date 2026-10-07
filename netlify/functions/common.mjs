import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SESSION_TTL = 12 * 60 * 60;
const HASH_BYTES = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export class HttpError extends Error {
  constructor(statusCode, message, code = 'REQUEST_FAILED') {
    super(message); this.statusCode = statusCode; this.code = code;
  }
}

export function endpoint(handler) {
  return async request => {
    const isWebRequest = request instanceof Request;
    let result;
    try {
      const event = isWebRequest ? {
        httpMethod: request.method,
        headers: Object.fromEntries(request.headers),
        queryStringParameters: Object.fromEntries(new URL(request.url).searchParams),
        body: await request.text(),
        isBase64Encoded: false
      } : request;
      result = await handler(event);
    }
    catch (error) {
      if (error instanceof HttpError) result = json(error.statusCode, { error: error.message, code: error.code }, error.headers || {});
      else if ((error.code || error.cause?.code) === '42501') {
        result = json(503, { error: 'Question storage cannot save changes because the database connection is read-only. Check the Netlify Database runtime permissions.', code: 'DATABASE_READ_ONLY' });
      }
      else if ((error.code || error.cause?.code) === '42P01') {
        result = json(503, { error: 'Question storage is not initialized yet. Complete the Netlify deployment to apply its database migrations.', code: 'DATABASE_NOT_INITIALIZED' });
      }
      else {
        console.error('NSTER function error');
        result = json(500, { error: 'NSTER could not complete that request. Please try again.', code: 'SERVER_ERROR' });
      }
    }
    if (!isWebRequest) return result;
    const headers = new Headers(result.headers);
    for (const [name, values] of Object.entries(result.multiValueHeaders || {})) {
      for (const value of values) headers.append(name, value);
    }
    return new Response(result.body, { status: result.statusCode, headers });
  };
}

export function json(statusCode, data, headers = {}) {
  const regularHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers };
  const multiValueHeaders = {};
  for (const [name, value] of Object.entries(regularHeaders)) {
    if (Array.isArray(value)) { multiValueHeaders[name] = value; delete regularHeaders[name]; }
  }
  return {
    statusCode,
    headers: regularHeaders,
    ...(Object.keys(multiValueHeaders).length ? { multiValueHeaders } : {}),
    body: JSON.stringify(data)
  };
}

export function method(event, allowed) {
  if (!allowed.includes(event.httpMethod)) throw new HttpError(405, 'That action is not available.', 'METHOD_NOT_ALLOWED');
}

export function requireSameOrigin(event) {
  const origin = event.headers?.origin;
  const host = (event.headers?.['x-forwarded-host'] || event.headers?.host || '').split(',')[0].trim().toLowerCase();
  if (!origin || !host) return;
  let originHost;
  try { originHost = new URL(origin).host.toLowerCase(); }
  catch { throw new HttpError(403, 'This request did not come from this site.', 'ORIGIN_DENIED'); }
  if (originHost !== host) throw new HttpError(403, 'This request did not come from this site.', 'ORIGIN_DENIED');
}

export function readBody(event, maxLength = 16_000) {
  if (!event.body) return {};
  if (event.body.length > maxLength) throw new HttpError(413, 'That request is too large.', 'BODY_TOO_LARGE');
  try {
    const value = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
    return value;
  } catch { throw new HttpError(400, 'Please send valid JSON.', 'INVALID_JSON'); }
}

function config() {
  const base = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const sessionSecret = process.env.NSTER_SESSION_SECRET;
  if (!base || !secret || !sessionSecret || sessionSecret.length < 32) {
    throw new HttpError(503, 'The NSTER backend is not configured yet. Check its Netlify environment variables.', 'BACKEND_NOT_CONFIGURED');
  }
  let parsed;
  try { parsed = new URL(base); } catch { throw new HttpError(503, 'The Supabase project URL is not valid.', 'BACKEND_NOT_CONFIGURED'); }
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new HttpError(503, 'The Supabase project URL must use HTTPS.', 'BACKEND_NOT_CONFIGURED');
  }
  return { base: parsed.origin, secret, sessionSecret };
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new HttpError(503, 'The NSTER backend is not configured yet. Check its Netlify environment variables.', 'BACKEND_NOT_CONFIGURED');
  return value;
}

export async function supabase(path, { method: httpMethod = 'GET', body, prefer } = {}) {
  const { base, secret } = config();
  const headers = { apikey: secret, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  let response;
  try {
    response = await fetch(`${base}/rest/v1/${path}`, {
      method: httpMethod, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12_000)
    });
  } catch {
    throw new HttpError(503, 'NSTER could not reach its database. Please try again shortly.', 'DATABASE_UNAVAILABLE');
  }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || data?.hint || `Supabase returned ${response.status}`);
    error.upstreamStatus = response.status; error.upstreamCode = data?.code;
    throw error;
  }
  return data;
}

export async function readSettings() {
  const rows = await supabase('nster_settings?id=eq.true&select=setup_complete,visitor_salt,visitor_hash,visitor_version');
  if (!Array.isArray(rows) || !rows.length) throw new HttpError(503, 'Run the NSTER database schema in Supabase before using the site.', 'DATABASE_NOT_INITIALIZED');
  return rows[0];
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, HASH_BYTES, SCRYPT_OPTIONS);
  return { salt: salt.toString('base64url'), hash: Buffer.from(derived).toString('base64url') };
}

export async function verifyPassword(password, saltValue, hashValue) {
  if (!saltValue || !hashValue) return false;
  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const expected = Buffer.from(hashValue, 'base64url');
    if (salt.length !== 16 || expected.length !== HASH_BYTES) return false;
    const actual = Buffer.from(await scrypt(password, salt, HASH_BYTES, SCRYPT_OPTIONS));
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}

function sessionKey() { return config().sessionSecret; }
function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', sessionKey()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}
function unsign(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length) return null;
  const expected = createHmac('sha256', sessionKey()).update(encoded).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export function makeSession(role, subject = '', version = 0) {
  return sign({ role, sub: subject, ver: version, exp: Math.floor(Date.now() / 1000) + SESSION_TTL });
}

function cookie(event, name) {
  // Browsers may send several Cookie headers over HTTP/2, which arrive joined with commas.
  const header = event.headers?.cookie || event.headers?.Cookie || '';
  const raw = [header, ...(event.multiValueHeaders?.cookie || event.multiValueHeaders?.Cookie || [])].join(';');
  for (const part of raw.split(/[;,]/)) {
    const chunk = part.trim();
    const split = chunk.indexOf('=');
    if (split < 0) continue;
    const value = chunk.slice(split + 1).trim();
    if (chunk.slice(0, split).trim() === name && value) return value;
  }
  return '';
}

const cookieOptions = `Path=/; Max-Age=${SESSION_TTL}; HttpOnly; Secure; SameSite=Lax`;
export function sessionCookie(name, token) { return `${name}=${token}; ${cookieOptions}`; }
export function clearCookie(name) { return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }

export async function readVisitorSession(event) {
  const session = unsign(cookie(event, 'nster_visitor'));
  if (session?.role !== 'visitor') return null;
  const settings = await readSettings();
  return settings.setup_complete && session.ver === settings.visitor_version ? session : null;
}

export async function readOwnerSession(event) {
  const session = unsign(cookie(event, 'nster_owner'));
  if (session?.role !== 'main' && session?.role !== 'uploader') return null;
  if (!/^[0-9a-f-]{36}$/i.test(session.sub || '')) return null;
  const rows = await supabase(`nster_owner_accounts?id=eq.${encodeURIComponent(session.sub)}&select=id,username,display_name,role`);
  if (!Array.isArray(rows) || !rows.length) return null;
  const account = rows[0];
  if (account.role !== session.role) return null;
  return { id: account.id, username: account.username, displayName: account.display_name, role: account.role };
}

export async function requireOwner(event, roles = ['main', 'uploader']) {
  const account = await readOwnerSession(event);
  if (!account) throw new HttpError(401, 'Please sign in to owner access again.', 'OWNER_SESSION_REQUIRED');
  if (!roles.includes(account.role)) throw new HttpError(403, 'Your owner account does not have permission for that action.', 'OWNER_PERMISSION_DENIED');
  return account;
}

export async function requireQuestionsRead(event) {
  const visitor = await readVisitorSession(event);
  if (visitor) return { role: 'visitor' };
  return requireOwner(event, ['main', 'uploader']);
}

export function idParam(event) { return event.queryStringParameters?.id || ''; }

function clientIp(event) {
  return event.headers?.['x-nf-client-connection-ip']
    || event.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || 'unknown';
}

export async function consumeRateLimit(event, purpose, limit = 10, windowSeconds = 900) {
  const { sessionSecret } = config();
  const key = createHmac('sha256', sessionSecret).update(`${purpose}:${clientIp(event)}`).digest('hex');
  const result = await supabase('rpc/nster_take_rate_limit', {
    method: 'POST', body: { p_key: key, p_limit: limit, p_window_seconds: windowSeconds }
  });
  if (result !== true) throw new HttpError(429, 'Too many tries. Wait a few minutes, then try again.', 'RATE_LIMITED');
}
