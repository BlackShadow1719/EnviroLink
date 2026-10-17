import crypto from 'node:crypto';

const COOKIE_NAME = 'envirolink_session';
const SESSION_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be set to a random secret at least 32 characters long');
  return value;
}
function b64url(value) {
  return Buffer.from(value).toString('base64url');
}
function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;
  try {
    const user = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) return null;
    return user;
  } catch { return null; }
}
export function createSession(user) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ ...user, iat: now, exp: now + SESSION_SECONDS });
}
export function getUser(req) {
  try {
    const raw = req.headers.cookie || '';
    const match = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    return verify(decodeURIComponent(match.slice(COOKIE_NAME.length + 1)));
  } catch { return null; }
}
export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`);
}
export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
export function requireUser(req, res) {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ error: 'Please log in.' });
    return null;
  }
  return user;
}
export function safeUser(user) {
  return { username: user.username, role: user.role, council: user.council || null };
}
