import { readWords, writeWords, cors, json } from "../../lib/data.js";
import { saveVersion } from "../../lib/versions.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (!id) return json(res, 400, { error: "Geçersiz ID" });

  const words = await readWords();
  const idx = words.findIndex((w) => w.id === id);

  if (req.method === "GET") {
    if (idx === -1) return json(res, 404, { error: "Bulunamadı" });
    return json(res, 200, words[idx]);
  }

  if (req.method === "PUT") {
    if (idx === -1) return json(res, 404, { error: "Bulunamadı" });
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const data = JSON.parse(body);
      const old = { ...words[idx] };
      await saveVersion(id, old);
      words[idx] = { ...words[idx], ...data };
      await writeWords(words);
      json(res, 200, { word: words[idx], previousVersion: old });
    } catch {
      json(res, 400, { error: "Geçersiz JSON" });
    }
    return;
  }

  if (req.method === "DELETE") {
    if (idx === -1) return json(res, 404, { error: "Bulunamadı" });
    const filtered = words.filter((w) => w.id !== id);
    await writeWords(filtered);
    json(res, 200, { success: true });
    return;
  }

  json(res, 405, { error: "Method not allowed" });
}
