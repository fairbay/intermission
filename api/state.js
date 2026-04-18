// Shared scene state for Intermission.
// v0: module-level global (resets on cold start, fine for demo).
// v1: swap to Upstash KV via @upstash/redis using env UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

let state = { mode: "black", payload: "", ts: 0 };

export default async function handler(req, res) {
  // CORS is unnecessary (same origin), but we set no-cache to be safe.
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "GET") {
    return res.status(200).json(state);
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const mode = body.mode;
    if (!["text", "countdown", "black"].includes(mode)) {
      return res.status(400).json({ error: "invalid mode" });
    }
    state = {
      mode,
      payload: body.payload == null ? "" : String(body.payload),
      ts: Date.now()
    };
    return res.status(200).json(state);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
