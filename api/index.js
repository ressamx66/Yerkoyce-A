import { Redis } from "@upstash/redis";

const WORDS_KEY = "yerkoyce:words";
const VOTES_KEY = "yerkoyce:votes";
const MESSAGES_KEY = "yerkoyce:messages";

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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
      return json(res, 200, { id: words[words.length - 1].id });
    }

    if (path.length === 3 && path[0] === "words" && path[1] && path[2] === "versions" && method === "GET") {
      return json(res, 200, []);
    }

    if (path.length === 3 && path[0] === "words" && path[1] && path[2] === "restore" && method === "POST") {
      return json(res, 404, { error: "Not found" });
    }

    if (path.length === 2 && path[0] === "words" && method === "GET") {
      const words = await readWords();
      const word = words.find((w) => w.id === path[1]);
      if (!word) return json(res, 404, { error: "Bulunamadı" });
      return json(res, 200, word);
    }

    if (path.length === 2 && path[0] === "words" && method === "PUT") {
      const words = await readWords();
      const idx = words.findIndex((w) => w.id === path[1]);
      if (idx === -1) return json(res, 404, { error: "Bulunamadı" });
      words[idx] = { ...words[idx], ...body };
      await writeWords(words);
      return json(res, 200, { word: words[idx] });
    }

    if (path.length === 2 && path[0] === "words" && method === "DELETE") {
      const words = await readWords();
      const filtered = words.filter((w) => w.id !== path[1]);
      if (filtered.length === words.length) return json(res, 404, { error: "Bulunamadı" });
      await writeWords(filtered);
      return json(res, 200, { success: true });
    }

    if (path.length === 1 && path[0] === "vote" && method === "POST") {
      const { wordId, button } = body;
      if (!wordId || !button) return json(res, 400, { error: "Eksik bilgi" });
      return json(res, 200, { remaining: 3, ratings: {} });
    }

    if (path.length === 2 && path[0] === "votes" && path[1] === "status" && method === "GET") {
      return json(res, 200, { remaining: 3, ratings: {} });
    }

    if (path.length === 1 && path[0] === "messages" && method === "POST") {
      const { text, contact } = body;
      if (!text || !text.trim()) return json(res, 400, { error: "Mesaj gerekli" });
      const messages = await readMessages();
      messages.unshift({
        id: Date.now().toString(),
        text: text.trim(),
        contact: contact?.trim() || "",
        date: new Date().toISOString()
      });
      await writeMessages(messages);
      return json(res, 200, { success: true });
    }

    if (path.length === 1 && path[0] === "messages" && method === "GET") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (url.searchParams.get("password") !== pw) return json(res, 401, { error: "Yetkisiz" });
      return json(res, 200, await readMessages());
    }

    if (path.length === 2 && path[0] === "admin" && path[1] === "auth" && method === "POST") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json(res, 500, { error: "Admin sifresi ayarlanmamis" });
      if (body.password === pw) return json(res, 200, { authenticated: true });
      return json(res, 401, { error: "Hatali sifre" });
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 500, { error: err.message || "Internal error" });
  }
}
