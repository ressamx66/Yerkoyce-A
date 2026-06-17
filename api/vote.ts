import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readVotes, writeVotes, todayStr } from "./lib/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { wordId, button } = req.body;
  if (!wordId || !button) return res.status(400).json({ error: "Eksik bilgi" });

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const data = await readVotes();

  if (!data.daily || data.daily.date !== todayStr()) {
    data.daily = { date: todayStr(), ips: {} };
  }
  if (!data.daily.ips[ip]) data.daily.ips[ip] = 0;
  if (data.daily.ips[ip] >= 3) {
    return res.status(429).json({ error: "Günlük oy hakkınız doldu (3/3)", remaining: 0 });
  }

  data.daily.ips[ip]++;
  if (!data.ratings[wordId]) data.ratings[wordId] = {};
  if (!data.ratings[wordId][button]) data.ratings[wordId][button] = 0;
  data.ratings[wordId][button]++;

  await writeVotes(data);
  return res.json({ remaining: 3 - data.daily.ips[ip], ratings: data.ratings });
}
