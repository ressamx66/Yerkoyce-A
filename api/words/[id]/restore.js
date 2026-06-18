import { readWords, writeWords, cors, json } from "../../lib/data.js";
import { readVersions } from "../../lib/versions.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const { id } = req.query;
  if (!id) return json(res, 400, { error: "Geçersiz ID" });

  let body = "";
  for await (const chunk of req) body += chunk;
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return json(res, 400, { error: "Geçersiz JSON" });
  }

  const versions = await readVersions(id);
  const version = versions.find((v) => v.id === data.versionId);
  if (!version) return json(res, 404, { error: "Versiyon bulunamadı" });

  const words = await readWords();
  const idx = words.findIndex((w) => w.id === id);
  if (idx === -1) return json(res, 404, { error: "Kelime bulunamadı" });

  words[idx] = { ...words[idx], ...version.data };
  await writeWords(words);
  json(res, 200, { word: words[idx] });
}
