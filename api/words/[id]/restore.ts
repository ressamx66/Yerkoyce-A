import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { readWords, writeWords } from "../../lib/store";

const redis = Redis.fromEnv();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "Geçersiz ID" });

  const { versionId } = req.body;
  const versions = await redis.get<Record<string, unknown>[]>(`yerkoyce:versions:${id}`);
  const version = versions?.find((v: Record<string, unknown>) => v.id === versionId);

  if (!version) return res.status(404).json({ error: "Versiyon bulunamadı" });

  const words = await readWords();
  const idx = words.findIndex((w) => w.id === id);
  if (idx === -1) return res.status(404).json({ error: "Kelime bulunamadı" });

  words[idx] = { ...words[idx], ...version.data };
  await writeWords(words);
  return res.json({ word: words[idx] });
}
