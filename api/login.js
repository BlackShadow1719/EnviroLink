import { createSession, setSessionCookie, safeUser } from '../lib/auth.js';

const accounts = [
  { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, role: 'admin', council: null },
  { username: process.env.SUNSHINE_USERNAME, password: process.env.SUNSHINE_PASSWORD, role: 'council', council: 'sunshine' },
  { username: process.env.NOOSA_USERNAME, password: process.env.NOOSA_PASSWORD, role: 'council', council: 'noosa' }
].filter(a => a.username && a.password);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password || username.length > 100 || password.length > 200) return res.status(400).json({ error: 'Enter your username and password.' });
  const account = accounts.find(a => a.username === username && a.password === password);
  if (!account) return res.status(401).json({ error: 'Incorrect username or password.' });
  try {
    const token = createSession({ username: account.username, role: account.role, council: account.council });
    setSessionCookie(res, token);
    return res.status(200).json({ ok: true, user: safeUser(account) });
  } catch (error) {
    console.error('Login configuration error:', error.message);
    return res.status(500).json({ error: 'Login is not configured correctly. Check Vercel environment variables.' });
  }
}
