import { readVotes, writeVotes, todayStr, cors, json } from "./lib/data.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  let body = "";
  for await (const chunk of req) body += chunk;
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return json(res, 400, { error: "Geçersiz JSON" });
  }

  const { wordId, button } = data;
  if (!wordId || !button) return json(res, 400, { error: "Eksik bilgi" });

  const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const votes = await readVotes();

  if (!votes.daily || votes.daily.date !== todayStr()) {
    votes.daily = { date: todayStr(), ips: {} };
  }
  if (!votes.daily.ips[ip]) votes.daily.ips[ip] = 0;
  if (votes.daily.ips[ip] >= 3) {
    return json(res, 429, { error: "Günlük oy hakkınız doldu (3/3)", remaining: 0 });
  }

  votes.daily.ips[ip]++;
  if (!votes.ratings[wordId]) votes.ratings[wordId] = {};
  if (!votes.ratings[wordId][button]) votes.ratings[wordId][button] = 0;
  votes.ratings[wordId][button]++;

  await writeVotes(votes);
  json(res, 200, { remaining: 3 - votes.daily.ips[ip], ratings: votes.ratings });
}
