import { useState, useEffect, useRef, useCallback } from "react";
import { yagmurTopla } from "../api";

interface YagmurProps {
  token: string;
  som: number;
  hak: number;
  yaprakSayaci: number;
  kitapSayaci: number;
  saatIndirim: number;
  onUpdate: (data: { som?: number; hak?: number; yaprak_sayaci?: number; kitap_sayaci?: number; saat_indirim?: number }) => void;
}

type DropTur = "som" | "kitap" | "yaprak" | "saat";

interface Drop {
  id: number;
  tur: DropTur;
  x: number;
  emoji: string;
}

interface Popup {
  id: number;
  text: string;
  x: number;
}

const DROP_INTERVAL = 10000;
const FALL_DURATION = 7000;

const EMOJI_MAP: Record<DropTur, string> = {
  som: "💰",
  kitap: "📖",
  yaprak: "🍂",
  saat: "⏱",
};

const PROBABILITIES: { tur: DropTur; weight: number }[] = [
  { tur: "som", weight: 40 },
  { tur: "kitap", weight: 25 },
  { tur: "yaprak", weight: 20 },
  { tur: "saat", weight: 15 },
];

function randomTur(): DropTur {
  const total = PROBABILITIES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PROBABILITIES) {
    r -= p.weight;
    if (r <= 0) return p.tur;
  }
  return "som";
}

export function Yagmur({ token, som, hak, yaprakSayaci: yaprak, kitapSayaci: kitap, saatIndirim, onUpdate }: YagmurProps) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const loadingRef = useRef(false);
  const idRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const tur = randomTur();
      const drop: Drop = {
        id: idRef.current++,
        tur,
        x: 10 + Math.random() * 70,
        emoji: EMOJI_MAP[tur],
      };
      setDrops(prev => [...prev, drop]);
      setTimeout(() => {
        setDrops(prev => prev.filter(d => d.id !== drop.id));
      }, FALL_DURATION);
    }, DROP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback(async (drop: Drop) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const data = await yagmurTopla(token, drop.tur);
      onUpdate(data);
      let text = "";
      if (drop.tur === "som") text = `+${(data.artis || 0).toFixed(2)} §`;
      else if (drop.tur === "kitap") text = data.deyis_kazandi ? `📖 ${data.deyis}` : "📖";
      else if (drop.tur === "yaprak") text = data.hak_kazandi ? "+1 HAK!" : "🍂";
      else if (drop.tur === "saat") text = "-1s";
      setPopups(prev => [...prev, { id: drop.id, text, x: drop.x }]);
      setTimeout(() => setPopups(prev => prev.filter(p => p.id !== drop.id)), 1500);
    } catch {}
    setDrops(prev => prev.filter(d => d.id !== drop.id));
    loadingRef.current = false;
  }, [token, onUpdate]);

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-sm">
      <div className="flex gap-4 mb-2 text-xs text-moon-cream/50 flex-wrap">
        <span>📖 <span className="text-copper">{kitap}</span>/10</span>
        <span>🍂 <span className="text-copper">{yaprak}</span>/10</span>
        <span>⏱ <span className="text-copper">-{saatIndirim}s</span></span>
      </div>

      <div className="text-[10px] text-moon-cream/30 mb-3 leading-relaxed">
        Üstten düşen emojilere tıkla, ödülleri topla! 10 kitap = 1 deyiş, 10 yaprak = 1 hak, saatler -1s.
      </div>

      {drops.map(drop => (
        <div
          key={drop.id}
          onClick={() => handleClick(drop)}
          className="absolute text-2xl cursor-pointer select-none hover:scale-125 transition-transform z-10"
          style={{
            left: `${drop.x}%`,
            animation: `yagmurFall ${FALL_DURATION}ms linear forwards`,
          }}
        >
          {drop.emoji}
        </div>
      ))}

      {popups.map(p => (
        <div
          key={p.id}
          className="absolute text-xs text-copper font-medium pointer-events-none z-20 whitespace-nowrap"
          style={{
            left: `${Math.min(p.x, 85)}%`,
            top: "40%",
            animation: "yagmurPopup 1.5s ease-out forwards",
          }}
        >
          {p.text}
        </div>
      ))}

      <style>{`
        @keyframes yagmurFall {
          0% { top: -40px; opacity: 1; }
          100% { top: 340px; opacity: 0.2; }
        }
        @keyframes yagmurPopup {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-40px); }
        }
      `}</style>
    </div>
  );
}
