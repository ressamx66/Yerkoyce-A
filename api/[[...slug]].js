import { Redis } from "@upstash/redis";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wordsSeed = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "words.json"), "utf-8")
);

const redis = Redis.fromEnv();
const WORDS_KEY = "yerkoyce:words";
const VOTES_KEY = "yerkoyce:votes";

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

async function readWords() {
  const cached = await redis.get(WORDS_KEY);
  if (cached) return cached;
  await redis.set(WORDS_KEY, wordsSeed);
  return wordsSeed;
}

async function writeWords(words) {
  await redis.set(WORDS_KEY, words);
}

async function readVotes() {
  const cached = await redis.get(VOTES_KEY);
  if (cached) return cached;
  const initial = { ratings: {} };
  await redis.set(VOTES_KEY, initial);
  return initial;
}

async function writeVotes(data) {
  await redis.set(VOTES_KEY, data);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const segments = req.query.slug || [];
  const path = segments.map((s) => decodeURIComponent(s));

  const body = ["POST", "PUT"].includes(req.method) ? await readBody(req) : {};

  // GET /api/words
  if (path.length === 1 && path[0] === "words" && req.method === "GET") {
    const words = await readWords();
    json(res, 200, words);
    return;
  }

  // POST /api/words
  if (path.length === 1 && path[0] === "words" && req.method === "POST") {
    const words = await readWords();
    const newWord = { id: Date.now().toString(), ...body };
    words.push(newWord);
    await writeWords(words);
    json(res, 200, newWord);
    return;
  }

  // GET /api/words/:id
  if (path.length === 2 && path[0] === "words" && req.method === "GET") {
    const words = await readWords();
    const word = words.find((w) => w.id === path[1]);
    if (!word) {
      json(res, 404, { error: "Bulunamadı" });
      return;
    }
    json(res, 200, word);
    return;
  }

  // PUT /api/words/:id
  if (path.length === 2 && path[0] === "words" && req.method === "PUT") {
    const words = await readWords();
    const idx = words.findIndex((w) => w.id === path[1]);
    if (idx === -1) {
      json(res, 404, { error: "Bulunamadı" });
      return;
    }
    const old = { ...words[idx] };
    const versionKey = `yerkoyce:versions:${path[1]}`;
    const versions = (await redis.get(versionKey)) || [];
    versions.push({ id: Date.now().toString(), data: old });
    await redis.set(versionKey, versions);
    words[idx] = { ...words[idx], ...body };
    await writeWords(words);
    json(res, 200, { word: words[idx], previousVersion: old });
    return;
  }

  // DELETE /api/words/:id
  if (path.length === 2 && path[0] === "words" && req.method === "DELETE") {
    const words = await readWords();
    const filtered = words.filter((w) => w.id !== path[1]);
    if (filtered.length === words.length) {
      json(res, 404, { error: "Bulunamadı" });
      return;
    }
    await writeWords(filtered);
    json(res, 200, { success: true });
    return;
  }

  // GET /api/words/:id/versions
  if (path.length === 3 && path[0] === "words" && path[2] === "versions" && req.method === "GET") {
    const versions = await redis.get(`yerkoyce:versions:${path[1]}`);
    json(res, 200, versions || []);
    return;
  }

  // POST /api/words/:id/restore
  if (path.length === 3 && path[0] === "words" && path[2] === "restore" && req.method === "POST") {
    const versions = await redis.get(`yerkoyce:versions:${path[1]}`);
    const version = versions?.find((v) => v.id === body.versionId);
    if (!version) {
      json(res, 404, { error: "Versiyon bulunamadı" });
      return;
    }
    const words = await readWords();
    const idx = words.findIndex((w) => w.id === path[1]);
    if (idx === -1) {
      json(res, 404, { error: "Kelime bulunamadı" });
      return;
    }
    words[idx] = { ...words[idx], ...version.data };
    await writeWords(words);
    json(res, 200, { word: words[idx] });
    return;
  }

  // POST /api/vote
  if (path.length === 1 && path[0] === "vote" && req.method === "POST") {
    const { wordId, button } = body;
    if (!wordId || !button) {
      json(res, 400, { error: "Eksik bilgi" });
      return;
    }
    const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.socket?.remoteAddress || "unknown";
    const data = await readVotes();
    if (!data.daily || data.daily.date !== todayStr()) {
      data.daily = { date: todayStr(), ips: {} };
    }
    if (!data.daily.ips[ip]) data.daily.ips[ip] = 0;
    if (data.daily.ips[ip] >= 3) {
      json(res, 429, { error: "Günlük oy hakkınız doldu (3/3)", remaining: 0 });
      return;
    }
    data.daily.ips[ip]++;
    if (!data.ratings[wordId]) data.ratings[wordId] = {};
    if (!data.ratings[wordId][button]) data.ratings[wordId][button] = 0;
    data.ratings[wordId][button]++;
    await writeVotes(data);
    json(res, 200, { remaining: 3 - data.daily.ips[ip], ratings: data.ratings });
    return;
  }

  // GET /api/votes/status
  if (path.length === 2 && path[0] === "votes" && path[1] === "status" && req.method === "GET") {
    const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.socket?.remoteAddress || "unknown";
    const data = await readVotes();
    let used = 0;
    if (data.daily && data.daily.date === todayStr()) {
      used = data.daily.ips[ip] || 0;
    }
    json(res, 200, { remaining: 3 - used, ratings: data.ratings || {} });
    return;
  }

  // POST /api/admin/auth
  if (path.length === 2 && path[0] === "admin" && path[1] === "auth" && req.method === "POST") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      json(res, 500, { error: "Admin şifresi ayarlanmamış" });
      return;
    }
    if (body.password === adminPassword) {
      json(res, 200, { authenticated: true });
      return;
    }
    json(res, 401, { error: "Hatalı şifre" });
    return;
  }

  json(res, 404, { error: "Endpoint bulunamadı" });
}
