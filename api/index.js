import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const WORDS_KEY = "yerkoyce:words";
const VOTES_KEY = "yerkoyce:votes";
const MESSAGES_KEY = "yerkoyce:messages";
const USERS_KEY_PREFIX = "som:users:";
const SESSIONS_KEY_PREFIX = "som:sessions:";
const DEYISLER_KEY = "som:deyisler";
const LOGS_KEY = "yerkoyce:logs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEYIS_LIST = readFileSync(join(__dirname, "..", "Y911_deyis.txt"), "utf-8")
  .split(/\r?\n/)
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const SEED = [
  { "id": "anahtar", "word": "Anahtar", "quote": "Dedemin Sakladığı Anahtar\" Eskiyerköy'deki kerpiç evimizin ardındaki ahırın loş köşesinde, ineklerin gölgeleri arasına gizlenmiş, fark edilmesi neredeyse imkânsız bir kapı vardı.", "story": "<p>Eskiyerköy'deki kerpiç evimizin ardındaki ahırın loş köşesinde, ineklerin gölgeleri arasına gizlenmiş, fark edilmesi neredeyse imkânsız bir kapı vardı. Sanki yıllardır kimsenin el sürmediği, unutulmak için yapılmış bir kapı… Dedeme o kapıyı sorduğumda gözleri uzaklara dalar, dudaklarının kenarında belli belirsiz bir gülümseme belirirdi. \"O kapı sadece kendi anahtarını bekler,\" derdi. Öldüğü gün, yastığının altından bana yazılmış ve içinde anahtar olan bir zarf çıktı. \"Artık hazırsın.\"</p><p>Ellerim titreyerek anahtarı kapının paslı kilidine soktum. Döndürdüğüm an, ahırın arkasındaki dar duvar yarığı genişledi. İçinden beklediğimden çok daha büyük bir kapının bulunduğu başka bir geçide adım attım. Aynı anahtarı kullanarak bu kapıyı da açtığımda, karşımda göz alabildiğine uzanan, güneşle yıkanmış bir yayla ve onun koynunda saklanan taş bir şehir belirdi.</p>", "isUpdated": true },
  { "id": "arkac", "word": "Arkaç", "quote": "Ay ışığı bozkırı gümüşe boyarken, sürü arkaçta sessizce kıvrıldı; yalnızca koyunların derinden gelen nefesleri gecenin türküsüne karışıyordu.", "story": "<p>Çoban Kenan, kavalını bir kenara bırakmış, sırtını toprağa yaslamıştı. Gözleri gökyüzünün sonsuz maviliğinde, parlayan dolunaydaydı; ama ruhu çoktan o tepenin ardına, suyun şırıltısının sevdiğinin sesiyle karıştığı o çeşme başına göç etmişti. Kalbi, göğüs kafesine dar gelen bir kuş gibi çarpıyordu. Aklı ne emanetindeki sürüde ne de kurtların pususundaydı; onun tek pusulası Elif'ti.</p><p>\"Sakin olun, sabredin kuzularım,\" diye fısıldadı geceye. Sesi, bir ninniden daha yumuşaktı. \"Sahibinizin gönlü bir yangın yeri, bırakın söndürmeye gitsin. O size tez dönecek.\"</p>" }
];

let _redis;
function getRedis() {
  if (!_redis) { try { _redis = Redis.fromEnv(); } catch { _redis = null; } }
  return _redis;
}

async function readWords() {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(WORDS_KEY);
      if (cached) return cached;
    } catch {}
  }
  return SEED;
}

async function writeWords(words) {
  const redis = getRedis();
  if (redis) await redis.set(WORDS_KEY, words);
}

async function readVotes() {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(VOTES_KEY);
      if (cached) return cached;
    } catch {}
  }
  return { ratings: {} };
}

async function writeVotes(data) {
  const redis = getRedis();
  if (redis) await redis.set(VOTES_KEY, data);
}

async function readMessages() {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(MESSAGES_KEY);
      if (cached) return cached;
    } catch {}
  }
  return [];
}

async function writeMessages(msgs) {
  const redis = getRedis();
  if (redis) await redis.set(MESSAGES_KEY, msgs);
}

async function readLogs() {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(LOGS_KEY);
      if (cached) return cached;
    } catch {}
  }
  return [];
}

async function addLog(type, details) {
  const redis = getRedis();
  if (!redis) return;
  const logs = await readLogs();
  logs.unshift({
    id: Date.now().toString(),
    type,
    details,
    timestamp: new Date().toISOString()
  });
  if (logs.length > 500) logs.length = 500;
  await redis.set(LOGS_KEY, logs);
}

async function seedDeyisler() {
  const redis = getRedis();
  if (!redis) return;
  const exists = await redis.exists(DEYISLER_KEY);
  if (!exists && DEYIS_LIST.length > 0) {
    await redis.sadd(DEYISLER_KEY, ...DEYIS_LIST);
  }
}

function getUserKey(username) {
  return USERS_KEY_PREFIX + username.toLowerCase().trim();
}

async function getUser(username) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get(getUserKey(username));
  } catch { return null; }
}

async function saveUser(username, data) {
  const redis = getRedis();
  if (redis) await redis.set(getUserKey(username), data);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verify;
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function fromToken(token) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const data = await redis.get(SESSIONS_KEY_PREFIX + token);
    return data ? data.username : null;
  } catch { return null; }
}

async function requireAuth(req) {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) return null;
  return fromToken(token);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const BASE_COUNTDOWN = 300;
const COUNTDOWN_DISCOUNT = 0.95;
const MAX_TIMER_UPGRADES = 10;

function getCountdownDuration(upgrades) {
  const n = Math.min(upgrades || 0, MAX_TIMER_UPGRADES);
  return Math.round(BASE_COUNTDOWN * Math.pow(COUNTDOWN_DISCOUNT, n));
}

function normalizeKazanimlar(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((e) => (typeof e === "string" ? { deyis: e, time: 0 } : e));
}

function countKazanimByTip(arr, tip) {
  const now = Date.now();
  let cutoff;
  if (tip === "gunluk") cutoff = now - 86400000;
  else if (tip === "haftalik") cutoff = now - 7 * 86400000;
  else if (tip === "aylik") cutoff = now - 30 * 86400000;
  else cutoff = 0;
  const normalized = normalizeKazanimlar(arr);
  return normalized.filter((e) => e.time >= cutoff).length;
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  try { return JSON.parse(body); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return json(res, 200, {});

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;
  const body = ["POST", "PUT"].includes(method) ? await readBody(req) : {};

  try {
    if (path.length === 1 && path[0] === "words" && method === "GET") {
      return json(res, 200, await readWords());
    }

    if (path.length === 1 && path[0] === "words" && method === "POST") {
      const words = await readWords();
      words.push({ id: Date.now().toString(), ...body });
      await writeWords(words);
      addLog("word_create", `Yeni yazı: ${body.word || "Adsız"}`);
      return json(res, 200, { id: words[words.length - 1].id });
    }

    if (path.length === 2 && path[0] === "words" && path[1] && method === "PUT") {
      const words = await readWords();
      const idx = words.findIndex((w) => w.id === path[1]);
      if (idx === -1) return json(res, 404, { error: "Bulunamadı" });
      words[idx] = { ...words[idx], ...body };
      await writeWords(words);
      addLog("word_edit", `Güncellendi: ${words[idx].word}`);
      return json(res, 200, { word: words[idx] });
    }

    if (path.length === 2 && path[0] === "words" && path[1] && method === "DELETE") {
      const words = await readWords();
      const target = words.find((w) => w.id === path[1]);
      const filtered = words.filter((w) => w.id !== path[1]);
      if (filtered.length === words.length) return json(res, 404, { error: "Bulunamadı" });
      await writeWords(filtered);
      addLog("word_delete", `Silindi: ${target?.word || path[1]}`);
      return json(res, 200, { success: true });
    }

    if (path.length === 3 && path[0] === "words" && path[1] && path[2] === "versions" && method === "GET") {
      return json(res, 200, []);
    }

    if (path.length === 3 && path[0] === "words" && path[1] && path[2] === "restore" && method === "POST") {
      return json(res, 404, { error: "Not found" });
    }

    if (path.length === 2 && path[0] === "admin" && path[1] === "auth" && method === "POST") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (body.password === pw) return json(res, 200, { authenticated: true });
      return json(res, 401, { error: "Hatali sifre" });
    }

    if (path.length === 2 && path[0] === "admin" && path[1] === "som" && method === "POST") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (body.password !== pw) return json(res, 401, { error: "Yetkisiz" });
      const { amount, username } = body;
      if (!username || typeof amount !== "number" || isNaN(amount))
        return json(res, 400, { error: "Gecersiz komut. Ornek: /som 20 Ahmet" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi: " + username });
      const newSom = Math.max(0, (user.som || 0) + amount);
      user.som = newSom;
      await saveUser(username, user);
      addLog("som_change", `Admin: ${username} → ${amount >= 0 ? "+" : ""}${amount} SOM (yeni: ${newSom})`);
      return json(res, 200, { username, som: newSom, eklenen: amount });
    }

    if (path.length === 2 && path[0] === "admin" && path[1] === "logs" && method === "GET") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (url.searchParams.get("password") !== pw) return json(res, 401, { error: "Yetkisiz" });
      return json(res, 200, await readLogs());
    }

    // --- SOM Cüzdan ---

    if (path.length === 2 && path[0] === "auth" && path[1] === "register" && method === "POST") {
      const { username, password } = body;
      if (!username || !password || username.length < 2 || password.length < 3)
        return json(res, 400, { error: "Kullanici adi (en az 2) ve sifre (en az 3) gerekli" });
      const existing = await getUser(username);
      if (existing) return json(res, 409, { error: "Bu kullanici adi zaten var" });
      const user = { passwordHash: hashPassword(password), som: 0, kazanilan: [], created_at: new Date().toISOString() };
      await saveUser(username, user);
      const token = generateToken();
      const redis = getRedis();
      if (redis) await redis.set(SESSIONS_KEY_PREFIX + token, { username: username.toLowerCase().trim() }, { ex: 86400 });
      return json(res, 200, { token, username: username.toLowerCase().trim(), som: 0 });
    }

    if (path.length === 2 && path[0] === "auth" && path[1] === "login" && method === "POST") {
      const { username, password } = body;
      if (!username || !password) return json(res, 400, { error: "Eksik bilgi" });
      const user = await getUser(username);
      if (!user) return json(res, 401, { error: "Kullanici bulunamadi" });
      if (!verifyPassword(password, user.passwordHash)) return json(res, 401, { error: "Hatali sifre" });
      const token = generateToken();
      const redis = getRedis();
      if (redis) await redis.set(SESSIONS_KEY_PREFIX + token, { username: username.toLowerCase().trim() }, { ex: 86400 });
      return json(res, 200, { token, username: username.toLowerCase().trim(), som: user.som || 0 });
    }

    if (path.length === 1 && path[0] === "som" && method === "POST") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const { deyis } = body;
      if (!deyis || !deyis.trim()) return json(res, 400, { error: "Deyis gerekli" });
      const normalized = deyis.trim().toLowerCase();
      const redis = getRedis();
      if (!redis) return json(res, 503, { error: "Redis baglantisi yok" });
      await seedDeyisler();
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      const today = new Date().toISOString().slice(0, 10);
      if (user.gun !== today) {
        user.gun = today;
        user.hak = Math.min(20, 10 + (user.bonus_hak || 0));
        user.bugunku = [];
      }
      if ((user.hak ?? 10) <= 0) return json(res, 400, { error: "Bugunluk hakkınız kalmadi" });
      const valid = await redis.sismember(DEYISLER_KEY, normalized);
      let sonuc;
      if (!valid) sonuc = "gecersiz";
      else if ((user.bugunku || []).includes(normalized)) sonuc = "tekrar";
      else sonuc = "kazanildi";
      user.hak = (user.hak ?? 10) - 1;
      user.bugunku = user.bugunku || [];
      user.bugunku.push(normalized);
      if (sonuc === "kazanildi") {
        user.kazanilan = user.kazanilan || [];
        user.kazanilan.push({ deyis: normalized, time: Date.now() });
        user.som = (user.som || 0) + 1;
      }
      user.pending = { deyis: normalized, sonuc, timestamp: Date.now() };
      await saveUser(username, user);
      const bekleme = getCountdownDuration(user.sohre_buyuklugu || 0);
      return json(res, 200, { bekleme, hak_kaldi: user.hak });
    }

    if (path.length === 2 && path[0] === "som" && path[1] === "sonuc" && method === "GET") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const user = await getUser(username);
      if (!user || !user.pending) return json(res, 200, { sonuc: null });
      const result = user.pending;
      delete user.pending;
      await saveUser(username, user);
      return json(res, 200, result);
    }

    if (path.length === 1 && path[0] === "som" && method === "GET") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      const today = new Date().toISOString().slice(0, 10);
      if (user.gun !== today) {
        user.gun = today;
        user.hak = Math.min(20, 10 + (user.bonus_hak || 0));
        user.bugunku = [];
      }
      return json(res, 200, {
        username,
        som: user.som || 0,
        hak: user.hak ?? (10 + (user.bonus_hak || 0)),
        bonus_hak: user.bonus_hak || 0,
        sohre_buyuklugu: user.sohre_buyuklugu || 0,
        sure: getCountdownDuration(user.sohre_buyuklugu || 0),
        kazanilan: normalizeKazanimlar(user.kazanilan),
        created_at: user.created_at
      });
    }

    if (path.length === 2 && path[0] === "som" && path[1] === "siralama" && method === "GET") {
      const redis = getRedis();
      if (!redis) return json(res, 200, []);
      await seedDeyisler();
      const tip = url.searchParams.get("tip") || "genel";
      const keys = await redis.keys(USERS_KEY_PREFIX + "*");
      const users = await Promise.all(keys.map(async (k) => {
        const data = await redis.get(k);
        const username = k.replace(USERS_KEY_PREFIX, "");
        const adet = countKazanimByTip(data?.kazanilan, tip);
        return { username, adet };
      }));
      users.sort((a, b) => b.adet - a.adet);
      return json(res, 200, users.slice(0, 50));
    }

    if (path.length === 2 && path[0] === "som" && path[1] === "yukselt" && method === "POST") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      if ((user.som || 0) < 10) return json(res, 400, { error: "Yetersiz SOM. 10 SOM gerekli." });
      if ((user.bonus_hak || 0) >= 10) return json(res, 400, { error: "Maksimum bonus hakka ulastiniz (10)." });
      user.som -= 10;
      user.bonus_hak = (user.bonus_hak || 0) + 1;
      await saveUser(username, user);
      return json(res, 200, { som: user.som, bonus_hak: user.bonus_hak, mesaj: "Gunluk hakkiniz 1 artti!" });
    }

    if (path.length === 2 && path[0] === "som" && path[1] === "yukselt-timer" && method === "POST") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      if ((user.som || 0) < 10) return json(res, 400, { error: "Yetersiz SOM. 10 SOM gerekli." });
      if ((user.sohre_buyuklugu || 0) >= MAX_TIMER_UPGRADES)
        return json(res, 400, { error: "Maksimum sure indirimine ulastiniz (10)." });
      user.som -= 10;
      user.sohre_buyuklugu = (user.sohre_buyuklugu || 0) + 1;
      await saveUser(username, user);
      const yeniSure = getCountdownDuration(user.sohre_buyuklugu);
      addLog("som_change", `Admin: ${username} → sure indirimi (${user.sohre_buyuklugu}/10, yeni: ${yeniSure}s)`);
      return json(res, 200, { som: user.som, sohre_buyuklugu: user.sohre_buyuklugu, sure: yeniSure, mesaj: `Geri sayım ${yeniSure}s'a dustu!` });
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 500, { error: err.message || "Internal error" });
  }
}
