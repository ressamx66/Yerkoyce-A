import { kv } from "@vercel/kv";
import wordsSeed from "../data/words.json";

const WORDS_KEY = "yerkoyce:words";
const VOTES_KEY = "yerkoyce:votes";

export interface WordEntry {
  id: string;
  word: string;
  quote: string;
  story: string;
  isUpdated?: boolean;
}

export interface VotesData {
  daily?: { date: string; ips: Record<string, number> };
  ratings: Record<string, Record<string, number>>;
}

export async function readWords(): Promise<WordEntry[]> {
  const cached = await kv.get<WordEntry[]>(WORDS_KEY);
  if (cached) return cached;
  await kv.set(WORDS_KEY, wordsSeed);
  return wordsSeed as WordEntry[];
}

export async function writeWords(words: WordEntry[]): Promise<void> {
  await kv.set(WORDS_KEY, words);
}

export async function readVotes(): Promise<VotesData> {
  const cached = await kv.get<VotesData>(VOTES_KEY);
  if (cached) return cached;
  const initial: VotesData = { ratings: {} };
  await kv.set(VOTES_KEY, initial);
  return initial;
}

export async function writeVotes(data: VotesData): Promise<void> {
  await kv.set(VOTES_KEY, data);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
