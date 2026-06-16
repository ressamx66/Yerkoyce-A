export interface WordEntry {
  id: string;
  word: string;
  quote: string;
  story: string;
  isUpdated?: boolean;
}

export interface WordRatings {
  [wordId: string]: {
    [buttonLabel: string]: number;
  };
}

export type UserVotes = Record<string, string>;

export const SCORE_MAP: Record<string, number> = {
  "Çok Beğendim": 5,
  "Beğendim": 2,
  "Başka Yazılarına Odaklan": -1,
  "En İyisi Resimlerine Dön": -2,
  "Kasaplık Yeteneğini Davarlarda Dene": -3,
};
