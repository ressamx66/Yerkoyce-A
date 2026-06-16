import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { words as seedWords } from "./src/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

const DATA_DIR = path.join(__dirname, "data");
const WORDS_FILE = path.join(DATA_DIR, "words.json");
const VERSIONS_DIR = path.join(DATA_DIR, "versions");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR, { recursive: true });

if (!fs.existsSync(WORDS_FILE)) {
  fs.writeFileSync(WORDS_FILE, JSON.stringify(seedWords, null, 2));
}

function readWords() {
  return JSON.parse(fs.readFileSync(WORDS_FILE, "utf-8"));
}

function writeWords(data: unknown) {
  fs.writeFileSync(WORDS_FILE, JSON.stringify(data, null, 2));
}

function saveVersion(wordId: string, data: unknown) {
  const dir = path.join(VERSIONS_DIR, wordId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const timestamp = Date.now();
  fs.writeFileSync(path.join(dir, `${timestamp}.json`), JSON.stringify(data, null, 2));
  return timestamp;
}

app.get("/api/words", (_req, res) => {
  const words = readWords();
  res.json(words);
});

app.get("/api/words/:id", (req, res) => {
  const words = readWords();
  const word = words.find((w: { id: string }) => w.id === req.params.id);
  if (!word) return res.status(404).json({ error: "Bulunamadı" });
  res.json(word);
});

app.put("/api/words/:id", (req, res) => {
  const words = readWords();
  const idx = words.findIndex((w: { id: string }) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Bulunamadı" });

  const old = { ...words[idx] };
  saveVersion(req.params.id, old);

  words[idx] = { ...words[idx], ...req.body };
  writeWords(words);
  res.json({ word: words[idx], previousVersion: old });
});

app.post("/api/words", (req, res) => {
  const words = readWords();
  const newWord = { id: Date.now().toString(), ...req.body };
  words.push(newWord);
  writeWords(words);
  res.json(newWord);
});

app.delete("/api/words/:id", (req, res) => {
  const words = readWords();
  const filtered = words.filter((w: { id: string }) => w.id !== req.params.id);
  if (filtered.length === words.length) return res.status(404).json({ error: "Bulunamadı" });
  writeWords(filtered);
  res.json({ success: true });
});

app.get("/api/words/:id/versions", (req, res) => {
  const dir = path.join(VERSIONS_DIR, req.params.id);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).sort().reverse();
  const versions = files.map((f) => ({
    id: f.replace(".json", ""),
    data: JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")),
  }));
  res.json(versions);
});

app.post("/api/words/:id/restore", (req, res) => {
  const { versionId } = req.body;
  const versionFile = path.join(VERSIONS_DIR, req.params.id, `${versionId}.json`);
  if (!fs.existsSync(versionFile)) return res.status(404).json({ error: "Versiyon bulunamadı" });

  const versionData = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
  const words = readWords();
  const idx = words.findIndex((w: { id: string }) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Kelime bulunamadı" });

  const current = { ...words[idx] };
  saveVersion(req.params.id, current);
  words[idx] = { ...words[idx], ...versionData };
  writeWords(words);
  res.json({ word: words[idx] });
});

const VOTES_FILE = path.join(DATA_DIR, "votes.json");

function readVotes(): { daily?: { date: string; ips: Record<string, number> }; ratings: Record<string, Record<string, number>> } {
  if (!fs.existsSync(VOTES_FILE)) return { ratings: {} };
  return JSON.parse(fs.readFileSync(VOTES_FILE, "utf-8"));
}

function writeVotes(data: unknown) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

app.post("/api/vote", (req, res) => {
  const { wordId, button } = req.body;
  if (!wordId || !button) return res.status(400).json({ error: "Eksik bilgi" });
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const data = readVotes();
  if (!data.daily || data.daily.date !== todayStr()) {
    data.daily = { date: todayStr(), ips: {} };
  }
  if (!data.daily.ips[ip]) data.daily.ips[ip] = 0;
  if (data.daily.ips[ip] >= 3) {
    return res.status(429).json({ error: "Günlük oy hakkınız doldu (3/3)", remaining: 0 });
  }
  data.daily.ips[ip]++;
  if (!data.ratings[wordId]) data.ratings[wordId] = {};
  if (!data.ratings[wordId][button]) data.ratings[wordId][button] = 0;
  data.ratings[wordId][button]++;
  writeVotes(data);
  res.json({ remaining: 3 - data.daily.ips[ip], ratings: data.ratings });
});

app.get("/api/votes/status", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const data = readVotes();
  let used = 0;
  if (data.daily && data.daily.date === todayStr()) {
    used = data.daily.ips[ip] || 0;
  }
  res.json({ remaining: 3 - used, ratings: data.ratings || {} });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = parseInt(process.env.PORT || "3001", 10);
app.listen(PORT, () => {
  console.log(`Yerköyce API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
