import { readWords, writeWords, cors, json } from "../lib/data.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const words = await readWords();
    json(res, 200, words);
    return;
  }

  if (req.method === "POST") {
    const words = await readWords();
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const data = JSON.parse(body);
      const newWord = { id: Date.now().toString(), ...data };
      words.push(newWord);
      await writeWords(words);
      json(res, 200, newWord);
    } catch {
      json(res, 400, { error: "Geçersiz JSON" });
    }
    return;
  }

  json(res, 405, { error: "Method not allowed" });
}
