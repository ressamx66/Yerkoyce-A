import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readVotes, todayStr } from "../lib/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const data = await readVotes();

  let used = 0;
  if (data.daily && data.daily.date === todayStr()) {
    used = data.daily.ips[ip] || 0;
  }

  return res.json({ remaining: 3 - used, ratings: data.ratings || {} });
}
