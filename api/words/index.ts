import { readWords, writeWords } from "./lib/store";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const words = await readWords();
    return res.json(words);
  }

  if (req.method === "POST") {
    const words = await readWords();
    const newWord = { id: Date.now().toString(), ...req.body };
    words.push(newWord);
    await writeWords(words);
    return res.json(newWord);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
