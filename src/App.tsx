import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Hero } from "./components/Hero";
import { DictionaryGrid } from "./components/DictionaryGrid";
import { WordModal } from "./components/WordModal";
import { AdminPanel } from "./admin/AdminPanel";
import { words as staticWords } from "./data";
import { fetchWords } from "./api";
import { WordEntry } from "./types";

export default function App() {
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === "#/admin");
  const [words, setWords] = useState<WordEntry[]>(staticWords);
  const [usingApi, setUsingApi] = useState(false);

  useEffect(() => {
    fetchWords()
      .then((data) => { setWords(data); setUsingApi(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => {
      const isAdmin = window.location.hash === "#/admin";
      setShowAdmin(isAdmin);
      if (!isAdmin) {
        fetchWords()
          .then((data) => { setWords(data); setUsingApi(true); })
          .catch(() => {});
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const openAdmin = () => { window.location.hash = "#/admin"; };

  if (showAdmin) {
    return <AdminPanel onClose={() => { window.location.hash = ""; }} />;
  }

  return (
    <div className="min-h-screen bg-steppe-dark text-moon-cream overflow-x-hidden selection:bg-copper selection:text-white">
      <Hero />
      
      <main id="content">
        <DictionaryGrid words={words} onSelect={setSelectedWord} />
      </main>
      
      <footer className="relative z-10 px-6 md:px-12 py-6 border-t border-copper/10 flex flex-col md:flex-row justify-between items-center text-[10px] text-moon-cream/50 uppercase tracking-widest gap-4">
        <div>© {new Date().getFullYear()} Yazar Adı: MURAT YILDIRIM (RESSAM) • Tüm Hakları Bozkırın Kalbinde Saklıdır</div>
        <div className="flex gap-6 items-center">
          <span className="italic">Metinler: Yerköyce Arşivi</span>
          <span className="text-copper">{words.length} YAZI • Bir Anadolu Sesi</span>
          <button onClick={openAdmin} className="text-[8px] opacity-30 hover:opacity-100 transition-opacity cursor-pointer" title="Yönetici Paneli">
            ⚙️
          </button>
        </div>
      </footer>

      <AnimatePresence mode="wait">
        {selectedWord && (
          <WordModal
            key={selectedWord.id}
            word={selectedWord}
            onClose={() => setSelectedWord(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
