import { WordEntry } from "./types";

const BASE = "/api";

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API hatası: ${res.status}`);
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
