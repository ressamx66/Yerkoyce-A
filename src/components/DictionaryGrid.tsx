import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { WordEntry } from "../types";

interface Props {
  words: WordEntry[];
  onSelect: (word: WordEntry) => void;
}

export function DictionaryGrid({ words, onSelect }: Props) {
  let readUpdates: Record<string, true> = {};
  try { readUpdates = JSON.parse(localStorage.getItem("yerkoyce_read_updates") || "{}"); } catch {}

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-32 z-10 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {words.map((word, i) => (
          <motion.div
            key={word.id}
            className="bg-white/5 backdrop-blur-md border border-white/10 border-l-2 border-l-transparent p-6 md:p-8 rounded-sm hover:border-copper/40 hover:border-l-copper hover:shadow-xl cursor-pointer relative group overflow-hidden transition-all duration-300"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.15, ease: "easeOut" }}
            whileHover={{ y: -6 }}
            onClick={() => onSelect(word)}
          >
            <h3 className="font-serif text-2xl text-white/80 mb-3 font-medium group-hover:text-copper transition-colors duration-300 relative z-10">
              {word.word}
              {word.isUpdated && !readUpdates[word.id] && (
                <span className="ml-2 inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-copper/40 text-copper bg-copper/10 align-middle">
                  Güncellendi
                </span>
              )}
            </h3>
            
            <p className="font-sans text-sm md:text-base leading-relaxed italic text-moon-cream/50 line-clamp-3 relative z-10 transition-colors duration-300 group-hover:text-moon-cream/60">
              "{word.quote}"
            </p>
            
            <div className="absolute bottom-8 right-8 text-copper opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500 z-10">
              <ArrowRight className="w-6 h-6 stroke-[1.5]" />
            </div>

            {word.id === "iskele" && (
              <div className="absolute bottom-1 left-4 right-4 overflow-hidden h-7 opacity-25 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none z-10">
                <div className="absolute animate-train text-copper">
                  <svg viewBox="0 0 70 25" width="70" height="25" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <line x1="0" y1="22" x2="70" y2="22" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.4"/>
                    <rect x="12" y="6" width="30" height="12" rx="2"/>
                    <rect x="38" y="3" width="16" height="15" rx="1"/>
                    <line x1="36" y1="3" x2="56" y2="3" strokeWidth="1.5"/>
                    <rect x="14" y="1" width="5" height="5" rx="0.5" strokeWidth="1"/>
                    <polyline points="10,18 6,22 12,22" strokeWidth="1"/>
                    <circle cx="22" cy="20" r="3.5"/>
                    <circle cx="35" cy="20" r="3.5"/>
                    <circle cx="48" cy="20" r="3.5"/>
                    <line x1="19" y1="20" x2="51" y2="20" strokeWidth="0.8" opacity="0.5"/>
                    <line x1="22" y1="16.5" x2="22" y2="23" strokeWidth="0.6" opacity="0.5"/>
                    <line x1="35" y1="16.5" x2="35" y2="23" strokeWidth="0.6" opacity="0.5"/>
                    <line x1="48" y1="16.5" x2="48" y2="23" strokeWidth="0.6" opacity="0.5"/>
                    <circle cx="16" cy="-1" r="1.5" fill="currentColor" stroke="none" opacity="0.4">
                      <animate attributeName="cy" values="0;-6;-10" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="r" values="1.5;3;0" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.4;0.15;0" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="16" cy="-1" r="1.5" fill="currentColor" stroke="none" opacity="0.3">
                      <animate attributeName="cy" values="-2;-8;-12" dur="2s" begin="0.7s" repeatCount="indefinite"/>
                      <animate attributeName="r" values="1.5;2.5;0" dur="2s" begin="0.7s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.3;0.1;0" dur="2s" begin="0.7s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="16" cy="-1" r="1.5" fill="currentColor" stroke="none" opacity="0.3">
                      <animate attributeName="cy" values="-1;-7;-11" dur="2s" begin="1.4s" repeatCount="indefinite"/>
                      <animate attributeName="r" values="1.5;2.5;0" dur="2s" begin="1.4s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.3;0.1;0" dur="2s" begin="1.4s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                </div>
              </div>
            )}

            {word.id === "dervis_ali" && (
              <div
                className="absolute top-4 right-12 pointer-events-none z-10 opacity-25 group-hover:opacity-60 transition-opacity duration-500 animate-hourglass-drop"
                style={{ animationDelay: `${0.3 + (i % 3) * 0.15}s` }}
              >
                <div className="animate-hourglass-sway" style={{ animationDelay: `${1.8 + (i % 3) * 0.15}s` }}>
                  <svg viewBox="0 0 28 36" width="22" height="28" fill="none" stroke="currentColor" strokeWidth="1" className="text-copper">
                    <line x1="2" y1="2" x2="26" y2="2"/>
                    <line x1="2" y1="2" x2="14" y2="18"/>
                    <line x1="26" y1="2" x2="14" y2="18"/>
                    <line x1="14" y1="18" x2="2" y2="34"/>
                    <line x1="14" y1="18" x2="26" y2="34"/>
                    <line x1="2" y1="34" x2="26" y2="34"/>
                    <polygon points="14,18 8,8 8,2 20,2 20,8" fill="currentColor" opacity="0.15" stroke="none"/>
                    <polygon points="14,18 10,28 10,34 18,34 18,28" fill="currentColor" opacity="0.25" stroke="none"/>
                    <line x1="14" y1="16" x2="14" y2="20" strokeWidth="0.5" opacity="0.4"/>
                    <circle cx="14" cy="16" r="0.6" fill="currentColor" stroke="none">
                      <animate attributeName="cy" values="16;20" dur="0.8s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;0" dur="0.8s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="14" cy="4" r="0.7" fill="currentColor" stroke="none">
                      <animate attributeName="cx" values="14;4;-2" dur="2.5s" repeatCount="indefinite"/>
                      <animate attributeName="cy" values="4;2;0" dur="2.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.5;0.2;0" dur="2.5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="14" cy="6" r="0.5" fill="currentColor" stroke="none">
                      <animate attributeName="cx" values="14;8;4" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                      <animate attributeName="cy" values="6;3;1" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.4;0.15;0" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="14" cy="5" r="0.8" fill="currentColor" stroke="none">
                      <animate attributeName="cx" values="14;7;3" dur="3s" begin="1.2s" repeatCount="indefinite"/>
                      <animate attributeName="cy" values="5;2;-1" dur="3s" begin="1.2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.5;0.15;0" dur="3s" begin="1.2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="14" cy="7" r="0.6" fill="currentColor" stroke="none">
                      <animate attributeName="cx" values="14;10;6" dur="2.2s" begin="0.3s" repeatCount="indefinite"/>
                      <animate attributeName="cy" values="7;4;2" dur="2.2s" begin="0.3s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.4;0.1;0" dur="2.2s" begin="0.3s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                </div>
              </div>
            )}

            {word.id === "hazine_avi" && (
              <div
                className="absolute bottom-4 right-14 pointer-events-none z-10 opacity-25 group-hover:opacity-60 transition-opacity duration-500"
                style={{ animationDelay: `${0.3 + (i % 3) * 0.15}s` }}
              >
                <svg viewBox="0 0 40 32" width="30" height="24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-copper">
                  <rect x="6" y="14" width="28" height="14" rx="1"/>
                  <line x1="6" y1="18" x2="34" y2="18" opacity="0.2"/>
                  <line x1="6" y1="22" x2="34" y2="22" opacity="0.2"/>
                  <line x1="6" y1="26" x2="34" y2="26" opacity="0.2"/>
                  <rect x="17" y="14" width="6" height="14" opacity="0.4"/>
                  <circle cx="20" cy="21" r="2" opacity="0.4"/>
                  <g transform="translate(0 14)">
                    <g>
                      <animateTransform attributeName="transform" type="scale" values="1 1;1 0.08" dur="2s" begin="1s" fill="freeze"/>
                      <g transform="translate(0 -14)">
                        <path d="M 6,14 Q 20,2 34,14"/>
                      </g>
                    </g>
                  </g>
                  <circle cx="20" cy="14" r="6" fill="currentColor" opacity="0">
                    <animate attributeName="opacity" values="0;0.1;0" dur="2s" begin="2.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="4;10" dur="2s" begin="2.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="16" cy="14" r="2" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;2;14" dur="1.5s" begin="2.8s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="2.8s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="24" cy="14" r="2" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;0;14" dur="1.8s" begin="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="14" r="1.8" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;-2;14" dur="2s" begin="2.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="2s" begin="2.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="12" cy="14" r="1.5" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;4;14" dur="1.3s" begin="3.2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="1.3s" begin="3.2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="28" cy="14" r="1.5" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;3;14" dur="1.6s" begin="3.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="3.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="10" cy="14" r="1.2" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;5;14" dur="1.4s" begin="3.8s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;0.8;0" dur="1.4s" begin="3.8s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="30" cy="14" r="1.2" fill="currentColor" opacity="0">
                    <animate attributeName="cy" values="14;1;14" dur="1.7s" begin="4s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;0.8;0" dur="1.7s" begin="4s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
