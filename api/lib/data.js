import { Redis } from "@upstash/redis";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_KEY = "yerkoyce:words";
const VOTES_KEY = "yerkoyce:votes";

let _redis;
export function getRedis() {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

let _seed;
function getSeed() {
  if (!_seed) {
    _seed = JSON.parse(
      readFileSync(join(__dirname, "..", "..", "data", "words.json"), "utf-8")
    );
  }
  return _seed;
}

export async function readWords() {
  const redis = getRedis();
  const cached = await redis.get(WORDS_KEY);
  if (cached) return cached;
  const seed = getSeed();
  await redis.set(WORDS_KEY, seed);
  return seed;
}

export async function writeWords(words) {
  await getRedis().set(WORDS_KEY, words);
}

export async function readVotes() {
  const redis = getRedis();
  const cached = await redis.get(VOTES_KEY);
  if (cached) return cached;
  const initial = { ratings: {} };
  await redis.set(VOTES_KEY, initial);
  return initial;
}

export async function writeVotes(data) {
  await getRedis().set(VOTES_KEY, data);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
