import { Redis } from "@upstash/redis";
import wordsSeed from "../data/words.json";

const redis = Redis.fromEnv();

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
  const cached = await redis.get<WordEntry[]>(WORDS_KEY);
  if (cached) return cached;
  // Convert seed data to plain objects for Redis
  const seed = JSON.parse(JSON.stringify(wordsSeed)) as WordEntry[];
  await redis.set(WORDS_KEY, seed);
  return seed;
}

export async function writeWords(words: WordEntry[]): Promise<void> {
  await redis.set(WORDS_KEY, words);
}

export async function readVotes(): Promise<VotesData> {
  const cached = await redis.get<VotesData>(VOTES_KEY);
  if (cached) return cached;
  const initial: VotesData = { ratings: {} };
  await redis.set(VOTES_KEY, initial);
  return initial;
}

export async function writeVotes(data: VotesData): Promise<void> {
  await redis.set(VOTES_KEY, data);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
