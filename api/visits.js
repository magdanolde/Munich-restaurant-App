// Shared "we've been here" list for Tisch für 15.
// Runs as a Vercel serverless function at /api/visits.
// Storage: Upstash Redis (Vercel Marketplace). No npm packages needed.
//
// Environment variables (set automatically when you connect Upstash Redis in Vercel):
//   KV_REST_API_URL + KV_REST_API_TOKEN   or   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// Optional:
//   GROUP_CODE   if set, marking/unmarking needs this code (reading stays open)

const KEY = "tisch15:visits";
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || "Redis error " + r.status);
  return data.result;
}

async function readAll() {
  const flat = (await redis(["HGETALL", KEY])) || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) {
    res.status(503).json({ error: "storage_not_configured" });
    return;
  }
  try {
    if (req.method === "GET") {
      res.status(200).json({ visits: await readAll(), codeRequired: !!process.env.GROUP_CODE });
      return;
    }
    if (req.method === "POST") {
      const code = process.env.GROUP_CODE;
      if (code && req.headers["x-group-code"] !== code) {
        res.status(401).json({ error: "wrong_code" });
        return;
      }
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
      const id = body && body.id;
      const date = body && body.date;
      if (typeof id !== "string" || !/^[a-z0-9-]{1,40}$/.test(id)) {
        res.status(400).json({ error: "bad_id" });
        return;
      }
      if (date === null) await redis(["HDEL", KEY, id]);
      else if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) await redis(["HSET", KEY, id, date]);
      else { res.status(400).json({ error: "bad_date" }); return; }
      res.status(200).json({ visits: await readAll() });
      return;
    }
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    res.status(500).json({ error: "storage_error" });
  }
};
