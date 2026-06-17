export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: "Admin şifresi ayarlanmamış" });
  }
  if (password === adminPassword) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ error: "Hatalı şifre" });
}
