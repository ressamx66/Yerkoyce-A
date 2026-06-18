import { Redis } from "@upstash/redis";
import { readFileSync } from "fs";
import { join } from "path";

const WORDS_KEY = "yerkoyce:words";
const VOTES_KEY = "yerkoyce:votes";

let _redis;
function getRedis() {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

let _seed;
function getSeed() {
  if (!_seed) {
    _seed = JSON.parse(readFileSync(join(process.cwd(), "data", "words.json"), "utf-8"));
  }
  return _seed;
}

async function readWords() {
  try {
    const cached = await getRedis().get(WORDS_KEY);
    if (cached) return cached;
  } catch (e) {
    // Redis unavailable, use seed
  }
  return getSeed();
}

async function writeWords(words) {
  await getRedis().set(WORDS_KEY, words);
}

async function readVotes() {
  try {
    const cached = await getRedis().get(VOTES_KEY);
    if (cached) return cached;
  } catch (e) {
    // Redis unavailable
  }
  return { ratings: {} };
}

async function writeVotes(data) {
  await getRedis().set(VOTES_KEY, data);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return json(res, 200, {});

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;
  const body = ["POST", "PUT"].includes(method) ? await readBody(req) : {};

  try {
    // GET /api/words
    if (path.length === 1 && path[0] === "words" && method === "GET") {
      return json(res, 200, await readWords());
    }

    // POST /api/words
    if (path.length === 1 && path[0] === "words" && method === "POST") {
      const words = await readWords();
      const newWord = { id: Date.now().toString(), ...body };
      words.push(newWord);
      await writeWords(words);
      return json(res, 200, newWord);
    }

    // GET /api/words/:id/versions
    if (path.length === 3 && path[0] === "words" && path[2] === "versions" && method === "GET") {
      const versions = (await getRedis().get(`yerkoyce:versions:${path[1]}`)) || [];
      return json(res, 200, versions);
    }

    // POST /api/words/:id/restore
    if (path.length === 3 && path[0] === "words" && path[2] === "restore" && method === "POST") {
      const versions = (await getRedis().get(`yerkoyce:versions:${path[1]}`)) || [];
      const version = versions.find((v) => v.id === body.versionId);
      if (!version) return json(res, 404, { error: "Version not found" });
      const words = await readWords();
      const idx = words.findIndex((w) => w.id === path[1]);
      if (idx === -1) return json(res, 404, { error: "Not found" });
      words[idx] = { ...words[idx], ...version.data };
      await writeWords(words);
      return json(res, 200, { word: words[idx] });
    }

    // GET /api/words/:id
    if (path.length === 2 && path[0] === "words" && method === "GET") {
      const words = await readWords();
      const word = words.find((w) => w.id === path[1]);
      if (!word) return json(res, 404, { error: "Bulunamadı" });
      return json(res, 200, word);
    }

    // PUT /api/words/:id
    if (path.length === 2 && path[0] === "words" && method === "PUT") {
      const words = await readWords();
      const idx = words.findIndex((w) => w.id === path[1]);
      if (idx === -1) return json(res, 404, { error: "Bulunamadı" });
      const old = { ...words[idx] };
      const versions = (await getRedis().get(`yerkoyce:versions:${path[1]}`)) || [];
      versions.push({ id: Date.now().toString(), data: old });
      await getRedis().set(`yerkoyce:versions:${path[1]}`, versions);
      words[idx] = { ...words[idx], ...body };
      await writeWords(words);
      return json(res, 200, { word: words[idx], previousVersion: old });
    }

    // DELETE /api/words/:id
    if (path.length === 2 && path[0] === "words" && method === "DELETE") {
      const words = await readWords();
      const filtered = words.filter((w) => w.id !== path[1]);
      if (filtered.length === words.length) return json(res, 404, { error: "Bulunamadı" });
      await writeWords(filtered);
      return json(res, 200, { success: true });
    }

    // POST /api/vote
    if (path.length === 1 && path[0] === "vote" && method === "POST") {
      const { wordId, button } = body;
      if (!wordId || !button) return json(res, 400, { error: "Eksik bilgi" });
      const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.socket?.remoteAddress || "unknown";
      const data = await readVotes();
      if (!data.daily || data.daily.date !== todayStr()) {
        data.daily = { date: todayStr(), ips: {} };
      }
      if (!data.daily.ips[ip]) data.daily.ips[ip] = 0;
      if (data.daily.ips[ip] >= 3) {
        return json(res, 429, { error: "Gunluk oy hakkiniz doldu (3/3)", remaining: 0 });
      }
      data.daily.ips[ip]++;
      if (!data.ratings[wordId]) data.ratings[wordId] = {};
      if (!data.ratings[wordId][button]) data.ratings[wordId][button] = 0;
      data.ratings[wordId][button]++;
      await writeVotes(data);
      return json(res, 200, { remaining: 3 - data.daily.ips[ip], ratings: data.ratings });
    }

    // GET /api/votes/status
    if (path.length === 2 && path[0] === "votes" && path[1] === "status" && method === "GET") {
      const ip = req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.socket?.remoteAddress || "unknown";
      const data = await readVotes();
      let used = 0;
      if (data.daily && data.daily.date === todayStr()) {
        used = data.daily.ips[ip] || 0;
      }
      return json(res, 200, { remaining: 3 - used, ratings: data.ratings || {} });
    }

    // POST /api/admin/auth
    if (path.length === 2 && path[0] === "admin" && path[1] === "auth" && method === "POST") {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (body.password === adminPassword) return json(res, 200, { authenticated: true });
      return json(res, 401, { error: "Hatali sifre" });
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 500, { error: err.message || "Internal error" });
  }
}
