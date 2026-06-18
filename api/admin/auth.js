import { cors, json } from "../lib/data.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  let body = "";
  for await (const chunk of req) body += chunk;
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return json(res, 400, { error: "Geçersiz JSON" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return json(res, 500, { error: "Admin şifresi ayarlanmamış" });
  }

  if (data.password === adminPassword) {
    return json(res, 200, { authenticated: true });
  }

  json(res, 401, { error: "Hatalı şifre" });
}
