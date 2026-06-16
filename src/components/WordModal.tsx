import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { X, Moon, Sun } from "lucide-react";
import { WordEntry, WordRatings, UserVotes, SCORE_MAP } from "../types";

const RATINGS_KEY = "yerkoyce_ratings";
const VOTES_KEY = "yerkoyce_votes";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* localStorage dolu olabilir */ }
}

export function WordModal({ word, onClose }: { word: WordEntry, onClose: () => void, key?: string }) {
  const [theme, setTheme] = useState<"cream" | "dark">("dark");
  const contentRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    container: contentRef
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  useEffect(() => {
    if (!word.isUpdated) return;
    const raw = localStorage.getItem("yerkoyce_read_updates");
    const readSet: Record<string, true> = raw ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : {};
    readSet[word.id] = true;
    localStorage.setItem("yerkoyce_read_updates", JSON.stringify(readSet));
  }, [word.id, word.isUpdated]);

  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [ratings, setRatings] = useState<WordRatings>({});
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null);

  useEffect(() => {
    setRatings(loadFromStorage<WordRatings>(RATINGS_KEY, {}));
    const votes = loadFromStorage<UserVotes>(VOTES_KEY, {});
    if (votes[word.id]) {
      setUserVote(votes[word.id]);
    }
    fetch("/api/votes/status")
      .then((r) => r.json())
      .then((d) => {
        setRemainingVotes(d.remaining);
        if (d.ratings) setRatings(d.ratings);
      })
      .catch(() => {
        setRemainingVotes(null);
      });
  }, [word.id]);

  const handleInteraction = useCallback((btn: string) => {
    setClickedButton(btn);
    setTimeout(() => setClickedButton(null), 3000);

    if (userVote) return;
    if (remainingVotes !== null && remainingVotes <= 0) return;

    fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, button: btn }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Oy limiti");
        return r.json();
      })
      .then((d) => {
        setRemainingVotes(d.remaining);
        setRatings(d.ratings);
        setUserVote(btn);
      })
      .catch(() => {
        const votes = loadFromStorage<UserVotes>(VOTES_KEY, {});
        votes[word.id] = btn;
        saveToStorage(VOTES_KEY, votes);
        setUserVote(btn);
        const current = loadFromStorage<WordRatings>(RATINGS_KEY, {});
        if (!current[word.id]) current[word.id] = {};
        if (!current[word.id][btn]) current[word.id][btn] = 0;
        current[word.id][btn]++;
        saveToStorage(RATINGS_KEY, current);
        setRatings(current);
      });
  }, [word.id, userVote, remainingVotes]);

  const buttons = [
    "Çok Beğendim",
    "Beğendim",
    "Başka Yazılarına Odaklan",
    "En İyisi Resimlerine Dön",
    "Kasaplık Yeteneğini Davarlarda Dene"
  ];

  const wordRatings: Record<string, number> = ratings[word.id] || {};
  const totalVotes = Object.values(wordRatings).reduce((a, b) => a + b, 0);
  const totalScore = Object.entries(wordRatings).reduce(
    (sum, [btn, count]) => sum + (SCORE_MAP[btn] || 0) * count, 0
  );
  const maxCount = Math.max(...Object.values(wordRatings), 1);

  const isDark = theme === "dark";

  const bgClass = isDark ? "bg-[#1f1b19]" : "bg-moon-cream";
  const textClass = isDark ? "text-moon-cream" : "text-steppe-dark";
  const dividerClass = isDark ? "border-moon-cream/10" : "border-steppe-dark/15";
  const quoteClass = isDark ? "text-moon-cream/50" : "text-steppe-dark/60";

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center ${bgClass} transition-colors duration-700`}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-copper origin-top z-50 hidden md:block"
        style={{ scaleY }}
      />

      <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
        <button
          onClick={() => setTheme(isDark ? "cream" : "dark")}
          className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer hover:bg-black/5 opacity-50 hover:opacity-100 transition-all ${textClass} ${isDark ? 'border-moon-cream/20' : 'border-steppe-dark/20'}`}
          title="Temayı Değiştir"
        >
          {isDark ? <Sun className="w-4 h-4 stroke-[2]" /> : <Moon className="w-4 h-4 stroke-[2]" />}
        </button>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer hover:bg-black/5 opacity-50 hover:opacity-100 transition-all text-[10px] font-bold ${textClass} ${isDark ? 'border-moon-cream/20' : 'border-steppe-dark/20'}`}
        >
          ✕
        </button>
      </div>

      <div ref={contentRef} className="w-full h-full overflow-y-auto px-6 py-24 md:py-32 scroll-smooth modal-scroll">
        <div className="max-w-4xl mx-auto pb-16">
          <motion.h2
            className={`font-serif text-5xl font-light mb-2 ${textClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {word.word}
            {word.isUpdated && (
              <span className={`ml-3 inline-block text-xs uppercase tracking-wider px-2 py-0.5 rounded-full border align-middle font-sans font-normal ${isDark ? 'border-copper/40 text-copper bg-copper/10' : 'border-copper/60 text-copper bg-copper/15'}`}>
                Güncellendi
              </span>
            )}
          </motion.h2>

          <motion.p
            className={`italic mb-8 border-b pb-4 ${quoteClass} ${isDark ? 'border-moon-cream/15' : 'border-steppe-dark/15'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            "{word.quote}"
          </motion.p>

          <motion.div
            className={`font-serif text-lg leading-relaxed font-light pr-4 story-content ${textClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
            dangerouslySetInnerHTML={{ __html: word.story }}
          />

          <motion.div
            className={`mt-12 pt-8 border-t ${dividerClass}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className={`text-xs uppercase tracking-wider ${quoteClass}`}>
                {userVote ? "Değerlendirmeniz kaydedildi:" : remainingVotes !== null && remainingVotes <= 0 ? "Bugünlük oy hakkınız doldu:" : "Devam etmesini istiyorsanız yazıyı beğenebilirsiniz:"}
              </p>
              {remainingVotes !== null && (
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${isDark ? 'border-moon-cream/20 text-moon-cream/60' : 'border-steppe-dark/20 text-steppe-dark/60'}`}>
                  Kalan oy: {remainingVotes}/3
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {buttons.map((btn) => {
                const isActive = clickedButton === btn;
                const isVoted = userVote === btn;
                const count = ratings[word.id]?.[btn] ?? 0;
                const scoreVal = SCORE_MAP[btn] ?? 0;
                const scoreStr = scoreVal >= 0 ? `+${scoreVal}` : `${scoreVal}`;
                const activeClass = `border-copper bg-copper/20 hover:bg-copper/40 ${textClass}`;
                const idleClass = `border-current ${textClass} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} opacity-80`;
                const votedClass = `border-copper bg-copper/30 text-copper`;

                return (
                  <button
                    key={btn}
                    onClick={() => handleInteraction(btn)}
                    disabled={!!userVote || (remainingVotes !== null && remainingVotes <= 0)}
                    className={`px-4 py-2 border text-xs font-medium rounded-full transition-all duration-300 cursor-pointer disabled:opacity-70 disabled:cursor-default
                      ${isActive ? activeClass : isVoted ? votedClass : idleClass}
                    `}
                  >
                    {isActive ? "Teşekkürler!" : `${btn} ${scoreStr}${count > 0 && !userVote ? ` (${count})` : ""}`}
                  </button>
                );
              })}
            </div>

            {/* Score Chart */}
            <div className={`mt-8 pt-6 border-t ${dividerClass}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs uppercase tracking-wider ${quoteClass}`}>
                  Yazı Puanı
                </p>
                <span className={`text-xl font-bold font-mono tracking-tight ${totalScore >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {totalScore >= 0 ? '+' : ''}{totalScore}
                </span>
              </div>

              {totalVotes > 0 && (
                <div className="space-y-1.5">
                  {buttons.map((btn) => {
                    const count = wordRatings[btn] ?? 0;
                    if (count === 0) return null;
                    const scoreVal = SCORE_MAP[btn] ?? 0;
                    const contribution = scoreVal * count;
                    const barPct = (count / maxCount) * 100;
                    return (
                      <div key={btn} className="flex items-center gap-2">
                        <span className={`text-[10px] w-36 truncate ${textClass} opacity-60`}>{btn}</span>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${scoreVal >= 0 ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] w-5 text-right font-mono ${textClass} opacity-60`}>{count}</span>
                        <span className={`text-[10px] w-8 text-right font-mono ${contribution >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {contribution >= 0 ? '+' : ''}{contribution}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
