export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET required" });
  }

  try {
    const base = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!base || !token) throw new Error("Storage not configured");

    async function redis(command) {
      const response = await fetch(
        `${base.replace(/\/$/, "")}/${command}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error("Redis request failed");

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      return result.result;
    }

    const ids = await redis("smembers/envirolink%3AboxIds") || [];
    const boxes = [];

    for (const id of ids) {
      const key = `envirolink:box:${id}`;
      const value = await redis(`get/${encodeURIComponent(key)}`);

      if (!value) continue;

      const box = typeof value === "string"
        ? JSON.parse(value)
        : value;

      const age = Date.now() - new Date(box.updatedAt).getTime();
      box.online = Number.isFinite(age) && age >= 0 &&
        age < 10 * 60 * 1000;

      boxes.push(box);
    }

    boxes.sort((a, b) => a.id.localeCompare(b.id));

    return res.status(200).json({
      ok: true,
      count: boxes.length,
      boxes
    });
  } catch (error) {
    console.error("EnviroLink read failed:", error);

    return res.status(500).json({
      error: "Unable to retrieve cloud readings."
    });
  }
}
