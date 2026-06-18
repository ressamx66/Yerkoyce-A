import { readVotes, todayStr, cors, json } from "../lib/data.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const data = await readVotes();

  let used = 0;
  if (data.daily && data.daily.date === todayStr()) {
    used = data.daily.ips[ip] || 0;
  }

  json(res, 200, { remaining: 3 - used, ratings: data.ratings || {} });
}
