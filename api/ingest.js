export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const expected = process.env.DEVICE_API_KEY;
  const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!expected || supplied !== expected) return res.status(401).json({ error: 'Invalid device key' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !/^[A-Za-z0-9_-]{1,40}$/.test(String(body.id || ''))) return res.status(400).json({ error: 'Invalid box ID' });
    for (const field of ['soilMoisture', 'canopyCover', 'temperature', 'humidity']) {
      if (!Number.isFinite(Number(body[field]))) return res.status(400).json({ error: `Invalid ${field}` });
    }
    // Set BOX_COUNCIL_MAP in Vercel, e.g. {"ENV-001":"sunshine"}, to assign box ownership.
    let ownership = {};
    try { ownership = JSON.parse(process.env.BOX_COUNCIL_MAP || '{}'); } catch { throw new Error('BOX_COUNCIL_MAP must be valid JSON'); }
    const council = String(body.council || ownership[String(body.id)] || '').trim().toLowerCase();
    const box = {
      id: String(body.id), council,
      location: String(body.location || body.id).slice(0, 120),
      postcode: String(body.postcode || '').slice(0, 12),
      lat: Number(body.lat || 0), lon: Number(body.lon || 0),
      soilMoisture: Number(body.soilMoisture), canopyCover: Number(body.canopyCover),
      temperature: Number(body.temperature), humidity: Number(body.humidity),
      repairNeeded: Boolean(body.repairNeeded), simulated: Boolean(body.simulated),
      updatedAt: new Date().toISOString()
    };
    const base = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!base || !token) throw new Error('Upstash environment variables missing');
    async function redis(command) {
      const response = await fetch(`${base.replace(/\/$/, '')}/${command}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Redis request failed');
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      return result.result;
    }
    const key = `envirolink:box:${box.id}`;
    await redis(`set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(box))}`);
    await redis(`sadd/envirolink%3AboxIds/${encodeURIComponent(box.id)}`);
    return res.status(200).json({ ok: true, id: box.id, updatedAt: box.updatedAt });
  } catch (error) {
    console.error('EnviroLink upload failed:', error);
    return res.status(500).json({ error: 'Cloud storage failed. Check Vercel configuration.' });
  }
}
