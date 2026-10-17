import { getUser, safeUser } from '../lib/auth.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in.' });
  return res.status(200).json({ ok: true, user: safeUser(user) });
}
