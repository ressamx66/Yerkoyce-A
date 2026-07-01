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
const SON_DEYISLER_KEY = "som:sonDeyisler";
const YEDI_GUN_MS = 7 * 86400000;
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
  if (!redis || DEYIS_LIST.length === 0) return;
  await redis.del(DEYISLER_KEY);
  await redis.sadd(DEYISLER_KEY, ...DEYIS_LIST);
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

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function checkMonthlyReset(user) {
  const currentMonth = monthKey();
  if (user.upgrade_ay !== currentMonth) {
    user.bonus_hak = 0;
    user.sohre_buyuklugu = 0;
    user.upgrade_ay = currentMonth;
  }
  return user;
}

function checkRainDailyReset(user) {
  const today = todayStr();
  if (user.yagmur_gun !== today) {
    user.yaprak_sayaci = 0;
    user.kitap_sayaci = 0;
    user.saat_indirim = 0;
    user.yagmur_tiklama = 0;
    user.yaprak_hak = 0;
    user.yagmur_gun = today;
  }
  return user;
}

function cleanupKazanilanDeyisler(user) {
  if (!Array.isArray(user.kazanilan_deyisler)) user.kazanilan_deyisler = [];
  const cutoff = Date.now() - YEDI_GUN_MS;
  user.kazanilan_deyisler = user.kazanilan_deyisler.filter(d => d.time > cutoff);
}

const BASE_COUNTDOWN = 300;
const COUNTDOWN_DISCOUNT = 0.95;
const MAX_TIMER_UPGRADES = 10;

function getCountdownDuration(upgrades) {
  const n = Math.min(upgrades || 0, MAX_TIMER_UPGRADES);
  return Math.round(BASE_COUNTDOWN * Math.pow(COUNTDOWN_DISCOUNT, n));
}

function getEffectiveCountdown(user) {
  const base = (user.ozel_gerisayim > 0) ? user.ozel_gerisayim : getCountdownDuration(user.sohre_buyuklugu || 0);
  return Math.max(10, base - (user.saat_indirim || 0));
}

function normalizeKazanimlar(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((e) => (typeof e === "string" ? { deyis: e, time: 0 } : e));
}

function countKazanimByTip(arr, tip) {
  const now = new Date();
  const yil = now.getFullYear();
  const ay = now.getMonth();
  const gun = now.getDate();
  let cutoff;
  if (tip === "gunluk") cutoff = new Date(yil, ay, gun).getTime();
  else if (tip === "haftalik") cutoff = new Date(yil, ay, gun - ((now.getDay() + 6) % 7)).getTime();
  else if (tip === "aylik") cutoff = new Date(yil, ay, 1).getTime();
  else cutoff = 0;
  const entries = normalizeKazanimlar(arr).filter((e) => e.time >= cutoff);
  return { adet: entries.length, enEski: entries.length > 0 ? Math.min(...entries.map(e => e.time)) : Infinity };
}

function kazanimDetayInRange(arr, start, end) {
  const entries = normalizeKazanimlar(arr).filter((e) => e.time >= start && e.time < end);
  return { adet: entries.length, enEski: entries.length > 0 ? Math.min(...entries.map(e => e.time)) : Infinity };
}

async function getDunyeninZirvesi(keys, start, end) {
  const redis = getRedis();
  if (!redis) return null;
  const users = await Promise.all(keys.map(async (k) => {
    const data = await redis.get(k);
    const name = k.replace(USERS_KEY_PREFIX, "");
    const detay = kazanimDetayInRange(data?.kazanilan, start, end);
    return { username: name, adet: detay.adet, enEski: detay.enEski };
  }));
  users.sort((a, b) => {
    if (b.adet !== a.adet) return b.adet - a.adet;
    return a.enEski - b.enEski;
  });
  if (users[0]?.adet > 0) return users[0];
  return null;
}

async function checkMedals(username, user) {
  const redis = getRedis();
  if (!redis) return user.madalyalar || { bronz: 0, gumus: 0, altin: 0 };

  const madalyalar = user.madalyalar || { bronz: 0, gumus: 0, altin: 0 };
  const son = user.son_madalya || {};
  const keys = await redis.keys(USERS_KEY_PREFIX + "*");

  const now = new Date();
  const yil = now.getFullYear();
  const ay = now.getMonth();
  const gun = now.getDate();

  const todayStart = new Date(yil, ay, gun).getTime();
  const gunKey = `${yil}-${String(ay + 1).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;

  const haftaGun = gun - ((now.getDay() + 6) % 7);
  const weekStart = new Date(yil, ay, haftaGun).getTime();
  const mondayStr = `${yil}-${String(ay + 1).padStart(2, "0")}-${String(haftaGun).padStart(2, "0")}`;

  const monthStart = new Date(yil, ay, 1).getTime();
  const ayKey = `${yil}-${String(ay + 1).padStart(2, "0")}`;

  /* BRONZ — her tamamlanan gün */
  if (son.gun !== gunKey) {
    const lastChecked = son.gun ? new Date(son.gun + "T00:00:00") : null;
    const checkBaslangic = lastChecked ? new Date(lastChecked.getTime() + 86400000) : new Date(yil, ay, gun - 1);
    let cursor = new Date(checkBaslangic);
    const yesterday = new Date(yil, ay, gun - 1);
    while (cursor <= yesterday) {
      const dayStart = cursor.getTime();
      const dayEnd = dayStart + 86400000;
      const winner = await getDunyeninZirvesi(keys, dayStart, dayEnd);
      if (winner && winner.username === username) {
        madalyalar.bronz = (madalyalar.bronz || 0) + 1;
      }
      cursor = new Date(cursor.getTime() + 86400000);
    }
    son.gun = gunKey;
  }

  /* GÜMÜŞ — bir önceki tam hafta */
  if (son.hafta !== mondayStr) {
    const lastWeekStart = weekStart - 604800000;
    const winner = await getDunyeninZirvesi(keys, lastWeekStart, weekStart);
    if (winner && winner.username === username) {
      madalyalar.gumus = (madalyalar.gumus || 0) + 1;
    }
    son.hafta = mondayStr;
  }

  /* ALTIN — bir önceki tam ay */
  if (son.ay !== ayKey) {
    const lastMonthStart = new Date(yil, ay - 1, 1).getTime();
    const winner = await getDunyeninZirvesi(keys, lastMonthStart, monthStart);
    if (winner && winner.username === username) {
      madalyalar.altin = (madalyalar.altin || 0) + 1;
    }
    son.ay = ayKey;
  }

  user.madalyalar = madalyalar;
  user.son_madalya = son;
  await saveUser(username, user);
  return madalyalar;
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

    if (path.length === 2 && path[0] === "admin" && path[1] === "aralik" && method === "POST") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (body.password !== pw) return json(res, 401, { error: "Yetkisiz" });
      const { username, aralik } = body;
      if (!username || typeof aralik !== "number" || isNaN(aralik) || aralik < 1)
        return json(res, 400, { error: "Gecersiz komut. Ornek: /aralik rmy 3" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi: " + username });
      user.yagmur_aralik = aralik;
      await saveUser(username, user);
      addLog("som_change", `Admin: ${username} → yagmur aralik ${aralik}s`);
      return json(res, 200, { username, aralik });
    }

    if (path.length === 2 && path[0] === "admin" && path[1] === "gerisayim" && method === "POST") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (body.password !== pw) return json(res, 401, { error: "Yetkisiz" });
      const { username, gerisayim } = body;
      if (!username || typeof gerisayim !== "number" || isNaN(gerisayim) || gerisayim < 1)
        return json(res, 400, { error: "Gecersiz komut. Ornek: /gerisayim Derya 10" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi: " + username });
      user.ozel_gerisayim = gerisayim;
      await saveUser(username, user);
      addLog("som_change", `Admin: ${username} → ozel gerisayim ${gerisayim}s`);
      return json(res, 200, { username, gerisayim });
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
      const user = { passwordHash: hashPassword(password), som: 0, kazanilan: [], madalyalar: { bronz: 0, gumus: 0, altin: 0 }, son_madalya: {}, created_at: new Date().toISOString(), yaprak_sayaci: 0, kitap_sayaci: 0, saat_indirim: 0, yagmur_tiklama: 0, yagmur_gun: "", yaprak_hak: 0, kazanilan_deyisler: [] };
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
      checkMonthlyReset(user);
      checkRainDailyReset(user);
      const today = new Date().toISOString().slice(0, 10);
      if (user.gun !== today) {
        user.gun = today;
        user.hak = Math.min(20, 10 + (user.bonus_hak || 0));
      }
      if ((user.hak ?? 10) <= 0) return json(res, 400, { error: "Bugunluk hakkınız kalmadi" });
      const valid = await redis.sismember(DEYISLER_KEY, normalized);
      let sonuc;
      if (!valid) sonuc = "liste_yok";
      else {
        const onceki = await redis.zscore(SON_DEYISLER_KEY, normalized);
        if (onceki !== null && Date.now() - onceki < YEDI_GUN_MS) sonuc = "son_7_gun";
        else sonuc = "kazanildi";
      }
      user.hak = (user.hak ?? 10) - 1;
      if (sonuc === "kazanildi") {
        user.kazanilan = user.kazanilan || [];
        user.kazanilan.push({ deyis: normalized, time: Date.now() });
        user.som = (user.som || 0) + 1;
        await redis.zadd(SON_DEYISLER_KEY, { score: Date.now(), member: normalized });
        await redis.zremrangebyscore(SON_DEYISLER_KEY, 0, Date.now() - YEDI_GUN_MS);
      }
      user.girilenler = user.girilenler || [];
      user.girilenler.push({ deyis: normalized, time: Date.now(), sonuc });
      if (user.girilenler.length > 100) user.girilenler = user.girilenler.slice(-100);
      user.pending = { deyis: normalized, sonuc, timestamp: Date.now() };
      await saveUser(username, user);
      const bekleme = getEffectiveCountdown(user);
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
      checkMonthlyReset(user);
      checkRainDailyReset(user);
      const today = new Date().toISOString().slice(0, 10);
      if (user.gun !== today) {
        user.gun = today;
        user.hak = Math.min(20, 10 + (user.bonus_hak || 0));
      }
      const madalyalar = await checkMedals(username, user);
      return json(res, 200, {
        username,
        som: user.som || 0,
        hak: user.hak ?? (10 + (user.bonus_hak || 0)),
        bonus_hak: user.bonus_hak || 0,
        sohre_buyuklugu: user.sohre_buyuklugu || 0,
        sure: getEffectiveCountdown(user),
        kazanilan: normalizeKazanimlar(user.kazanilan),
        girilenler: (user.girilenler || []).slice().reverse(),
        madalyalar,
        yaprak_sayaci: user.yaprak_sayaci || 0,
        kitap_sayaci: user.kitap_sayaci || 0,
        saat_indirim: user.saat_indirim || 0,
        yagmur_tiklama: user.yagmur_tiklama || 0,
        yagmur_aralik: user.yagmur_aralik || 0,
        ozel_gerisayim: user.ozel_gerisayim || 0,
        yaprak_hak: user.yaprak_hak || 0,
        kazanilan_deyisler: (user.kazanilan_deyisler || []).slice().reverse(),
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
        const detay = countKazanimByTip(data?.kazanilan, tip);
        return { username, adet: detay.adet, enEski: detay.enEski };
      }));
      users.sort((a, b) => {
        if (b.adet !== a.adet) return b.adet - a.adet;
        return a.enEski - b.enEski;
      });
      return json(res, 200, users.slice(0, 50));
    }

    if (path.length === 3 && path[0] === "som" && path[1] === "madalyalar" && method === "GET") {
      const redis = getRedis();
      if (!redis) return json(res, 200, []);
      const tip = url.searchParams.get("tip") || "bronz";
      const keys = await redis.keys(USERS_KEY_PREFIX + "*");
      const users = await Promise.all(keys.map(async (k) => {
        const data = await redis.get(k);
        const username = k.replace(USERS_KEY_PREFIX, "");
        const m = data?.madalyalar || {};
        return { username, adet: m[tip] || 0 };
      }));
      users.sort((a, b) => b.adet - a.adet);
      return json(res, 200, users.slice(0, 50));
    }

    if (path.length === 2 && path[0] === "som" && path[1] === "yukselt" && method === "POST") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      checkMonthlyReset(user);
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
      checkMonthlyReset(user);
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

    if (path.length === 2 && path[0] === "som" && path[1] === "takas" && method === "POST") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const { tur } = body;
      if (!["bronz", "gumus"].includes(tur)) return json(res, 400, { error: "Gecersiz takas turu (bronz/gumus)" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      const m = user.madalyalar || { bronz: 0, gumus: 0, altin: 0 };
      if ((m[tur] || 0) < 10) return json(res, 400, { error: `En az 10 ${tur === "bronz" ? "bronz" : "gumus"} madalyaniz olmali` });
      m[tur] -= 10;
      if (tur === "bronz") { m.gumus = (m.gumus || 0) + 1; }
      else { m.altin = (m.altin || 0) + 1; }
      user.madalyalar = m;
      await saveUser(username, user);
      addLog("som_change", `${username}: 10 ${tur} → 1 ${tur === "bronz" ? "gumus" : "altin"} takas`);
      return json(res, 200, { madalyalar: m, mesaj: "Takas basarili!" });
    }

    // --- Yağmur (Rain Drop) ---
    if (path.length === 2 && path[0] === "yagmur" && path[1] === "topla" && method === "POST") {
      const username = await requireAuth(req);
      if (!username) return json(res, 401, { error: "Giris yapilmamis" });
      const { tur } = body;
      if (!["som", "kitap", "yaprak", "saat"].includes(tur))
        return json(res, 400, { error: "Gecersiz tur" });
      const redis = getRedis();
      if (!redis) return json(res, 503, { error: "Redis baglantisi yok" });
      const user = await getUser(username);
      if (!user) return json(res, 404, { error: "Kullanici bulunamadi" });
      checkRainDailyReset(user);
      const today = todayStr();
      if (user.gun !== today) {
        user.gun = today;
        user.hak = Math.min(20, 10 + (user.bonus_hak || 0));
      }
      user.yagmur_tiklama = (user.yagmur_tiklama || 0) + 1;
      let extra = {};
      if (tur === "som") {
        user.som = (user.som || 0) + 0.01;
        extra = { artis: 0.01 };
      } else if (tur === "kitap") {
        user.kitap_sayaci = (user.kitap_sayaci || 0) + 1;
        let deyisKazandi = false;
        let deyis = "";
        if (user.kitap_sayaci % 3 === 0) {
          const idx = Math.floor(Math.random() * DEYIS_LIST.length);
          deyis = DEYIS_LIST[idx];
          deyisKazandi = true;
          cleanupKazanilanDeyisler(user);
          user.kazanilan_deyisler.push({ deyis, time: Date.now() });
        }
        extra = { kitap_sayaci: user.kitap_sayaci, deyis_kazandi: deyisKazandi, deyis };
      } else if (tur === "yaprak") {
        user.yaprak_sayaci = (user.yaprak_sayaci || 0) + 1;
        let hakKazandi = false;
        if (user.yaprak_sayaci % 10 === 0) {
          user.hak = (user.hak ?? 10) + 1;
          user.yaprak_hak = (user.yaprak_hak || 0) + 1;
          hakKazandi = true;
        }
        extra = { yaprak_sayaci: user.yaprak_sayaci, hak_kazandi: hakKazandi };
      } else if (tur === "saat") {
        user.saat_indirim = (user.saat_indirim || 0) + 1;
        extra = { saat_indirim: user.saat_indirim };
      }
      await saveUser(username, user);
      return json(res, 200, { som: user.som, hak: user.hak, yagmur_tiklama: user.yagmur_tiklama, ...extra });
    }

    // --- Messages ---
    if (path.length === 1 && path[0] === "messages" && method === "POST") {
      const { text, contact } = body;
      if (!text || !text.trim()) return json(res, 400, { error: "Mesaj gerekli" });
      const msgs = await readMessages();
      msgs.unshift({
        id: Date.now().toString(),
        text: text.trim(),
        contact: contact || "",
        date: new Date().toISOString()
      });
      if (msgs.length > 500) msgs.length = 500;
      await writeMessages(msgs);
      addLog("message", `Yeni mesaj: ${text.trim().slice(0, 50)}...`);
      return json(res, 200, { success: true });
    }

    if (path.length === 1 && path[0] === "messages" && method === "GET") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (url.searchParams.get("password") !== pw) return json(res, 401, { error: "Yetkisiz" });
      return json(res, 200, await readMessages());
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 500, { error: err.message || "Internal error" });
  }
}
