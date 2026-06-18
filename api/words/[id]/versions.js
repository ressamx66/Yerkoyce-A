import { cors, json } from "../../lib/data.js";
import { readVersions } from "../../lib/versions.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const { id } = req.query;
  if (!id) return json(res, 400, { error: "Geçersiz ID" });

  const versions = await readVersions(id);
  json(res, 200, versions);
}
