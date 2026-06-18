import { WordEntry } from "./types";

const BASE = "/api";

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `API hatası: ${res.status}`;
    try { const body = await res.json(); if (body.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function fetchWords(): Promise<WordEntry[]> {
  return fetcher("/words");
}

export function fetchWord(id: string): Promise<WordEntry> {
  return fetcher(`/words/${id}`);
}

export function updateWord(id: string, data: Partial<WordEntry>) {
  return fetcher<{ word: WordEntry; previousVersion: WordEntry }>(`/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function createWord(data: { word: string; quote: string; story: string }) {
  return fetcher<WordEntry>("/words", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteWord(id: string) {
  return fetcher<{ success: boolean }>(`/words/${id}`, { method: "DELETE" });
}

export function fetchVersions(id: string) {
  return fetcher<{ id: string; data: WordEntry }[]>(`/words/${id}/versions`);
}

export function restoreVersion(id: string, versionId: string) {
  return fetcher<{ word: WordEntry }>(`/words/${id}/restore`, {
    method: "POST",
    body: JSON.stringify({ versionId }),
  });
}

export function adminAuth(password: string) {
  return fetcher<{ authenticated: boolean }>("/admin/auth", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function adminSom(password: string, amount: number, username: string) {
  return fetcher<{ username: string; som: number; eklenen: number }>("/admin/som", {
    method: "POST",
    body: JSON.stringify({ password, amount, username }),
  });
}

export function fetchLogs(password: string) {
  return fetcher<{ id: string; type: string; details: string; timestamp: string }[]>(
    `/admin/logs?password=${encodeURIComponent(password)}`
  );
}

export function sendMessage(text: string, contact?: string) {
  return fetcher<{ success: boolean }>("/messages", {
    method: "POST",
    body: JSON.stringify({ text, contact }),
  });
}

export function fetchMessages(password: string) {
  return fetcher<{ id: string; text: string; contact: string; date: string }[]>(
    `/messages?password=${encodeURIComponent(password)}`
  );
}

export function register(username: string, password: string) {
  return fetcher<{ token: string; username: string; som: number }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function login(username: string, password: string) {
  return fetcher<{ token: string; username: string; som: number }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function submitDeyis(token: string, deyis: string) {
  return fetcher<{ bekleme: number; hak_kaldi: number }>("/som", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ deyis }),
  });
}

export function getSonuc(token: string) {
  return fetcher<{ deyis: string; sonuc: "kazanildi" | "gecersiz" | "tekrar" | null }>("/som/sonuc", {
    headers: authHeaders(token),
  });
}

export function getCuzdan(token: string) {
  return fetcher<{ username: string; som: number; hak: number; bonus_hak: number; sohre_buyuklugu: number; sure: number; kazanilan: (string | { deyis: string; time: number })[]; madalyalar: { bronz: number; gumus: number; altin: number }; yaprak_sayaci: number; saat_indirim: number; created_at: string }>("/som", {
    headers: authHeaders(token),
  });
}

export function getSiralama(tip?: string) {
  const q = tip && tip !== "genel" ? `?tip=${tip}` : "";
  return fetcher<{ username: string; adet: number }[]>(`/som/siralama${q}`);
}

export function getMadalyonlar(tip?: string) {
  const q = tip ? `?tip=${tip}` : "";
  return fetcher<{ username: string; adet: number }[]>(`/som/madalyalar${q}`);
}

export function yukselt(token: string) {
  return fetcher<{ som: number; bonus_hak: number; mesaj: string }>("/som/yukselt", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function yukseltTimer(token: string) {
  return fetcher<{ som: number; sohre_buyuklugu: number; sure: number; mesaj: string }>("/som/yukselt-timer", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function yagmurTopla(token: string, tur: "som" | "deyis" | "yaprak" | "saat") {
  return fetcher<{ som: number; hak: number; artis?: number; deyis?: string; yaprak_sayaci?: number; hak_kazandi?: boolean; saat_indirim?: number }>("/yagmur/topla", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ tur }),
  });
}

export function takas(token: string, tur: "bronz" | "gumus") {
  return fetcher<{ madalyalar: { bronz: number; gumus: number; altin: number }; mesaj: string }>("/som/takas", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ tur }),
  });
}
