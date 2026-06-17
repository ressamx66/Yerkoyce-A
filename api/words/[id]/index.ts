import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";
import { readWords, writeWords } from "../../lib/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "Geçersiz ID" });

  const words = await readWords();
  const idx = words.findIndex((w) => w.id === id);

  if (req.method === "GET") {
    if (idx === -1) return res.status(404).json({ error: "Bulunamadı" });
    return res.json(words[idx]);
  }

  if (req.method === "PUT") {
    if (idx === -1) return res.status(404).json({ error: "Bulunamadı" });
    const old = { ...words[idx] };
    const versionKey = `yerkoyce:versions:${id}`;
    const versions = (await kv.get<Record<string, unknown>[]>(versionKey)) || [];
    versions.push({ id: Date.now().toString(), data: old });
    await kv.set(versionKey, versions);
    words[idx] = { ...words[idx], ...req.body };
    await writeWords(words);
    return res.json({ word: words[idx], previousVersion: old });
  }

  if (req.method === "DELETE") {
    if (idx === -1) return res.status(404).json({ error: "Bulunamadı" });
    const filtered = words.filter((w) => w.id !== id);
    await writeWords(filtered);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
