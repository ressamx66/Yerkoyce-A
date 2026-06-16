import { useRef, useCallback, useEffect, useState, type ClipboardEvent } from "react";
import { WordEntry } from "../types";

const FONTS = ["Cormorant Garamond", "Inter", "Georgia", "Times New Roman", "Arial"];
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
const COLORS = [
  { label: "Beyaz", value: "#f5f0e8" },
  { label: "Bakır", value: "#c2a27b" },
  { label: "Zeytin", value: "#7B8265" },
  { label: "Kırmızı", value: "#c0392b" },
  { label: "Mavi", value: "#2980b9" },
  { label: "Yeşil", value: "#27ae60" },
  { label: "Sarı", value: "#f1c40f" },
  { label: "Mor", value: "#8e44ad" },
];

interface Props {
  word: WordEntry;
  onChange: (updated: Partial<WordEntry>) => void;
}

export function WordEditor({ word, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFont, setActiveFont] = useState("Cormorant Garamond");
  const [activeSize, setActiveSize] = useState("18");

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = word.story;
    }
  }, [word.id]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange({ story: editorRef.current.innerHTML });
    }
  }, [onChange]);

  const handleFontChange = useCallback((font: string) => {
    setActiveFont(font);
    exec("fontName", font);
  }, [exec]);

  const handleSizeChange = useCallback((size: string) => {
    setActiveSize(size);
    if (!editorRef.current) return;
    try {
      document.execCommand("fontSize", false, "7");
      editorRef.current.querySelectorAll("font[size=\"7\"]").forEach((el) => {
        const span = document.createElement("span");
        span.style.fontSize = size + "px";
        span.innerHTML = el.innerHTML;
        el.replaceWith(span);
      });
    } catch { /* fallback */ }
    if (editorRef.current) {
      onChange({ story: editorRef.current.innerHTML });
    }
  }, [onChange]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain");
    if (text && editorRef.current) {
      document.execCommand("insertText", false, text);
      onChange({ story: editorRef.current.innerHTML });
    }
  }, [onChange]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      onChange({ story: editorRef.current.innerHTML });
    }
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 bg-steppe-dark border border-white/10 rounded-sm shadow-lg shadow-black/30">
        <select
          value={activeFont}
          onChange={(e) => handleFontChange(e.target.value)}
          className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm cursor-pointer"
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>

        <select
          value={activeSize}
          onChange={(e) => handleSizeChange(e.target.value)}
          className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm cursor-pointer"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <div className="flex items-center gap-0.5" title="Yazı Rengi">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => exec("foreColor", c.value)}
              className="w-5 h-5 rounded-full border border-white/20 cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <div className="flex items-center gap-0.5" title="Arka Plan Rengi">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => exec("hiliteColor", c.value)}
              className="w-5 h-5 border border-white/20 cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: c.value }}
              title={"Arka Plan: " + c.label}
            />
          ))}
          <button
            onClick={() => exec("hiliteColor", "transparent")}
            className="w-5 h-5 border border-dashed border-white/20 cursor-pointer hover:scale-125 transition-transform flex items-center justify-center text-[8px] text-moon-cream/40"
            title="Arka planı temizle"
          >
            ✕
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button onClick={() => exec("bold")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer font-bold" title="Kalın">B</button>
        <button onClick={() => exec("italic")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer italic" title="İtalik">I</button>
        <button onClick={() => exec("underline")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer underline" title="Altı Çizili">U</button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button onClick={() => exec("justifyLeft")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer" title="Sola Yasla">≡</button>
        <button onClick={() => exec("justifyCenter")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer" title="Ortala">≡</button>
        <button onClick={() => exec("justifyRight")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer" title="Sağa Yasla">≡</button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer" title="Liste">•</button>
        <button onClick={() => exec("formatBlock", "<blockquote>")} className="px-2 py-1 text-xs bg-steppe-dark text-moon-cream border border-white/10 rounded-sm hover:bg-copper/30 cursor-pointer" title="Alıntı">"</button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorInput}
        onPaste={handlePaste}
        className="min-h-[400px] p-4 bg-steppe-dark text-moon-cream border border-white/10 rounded-sm focus:border-copper/40 focus:outline-none font-serif text-lg leading-relaxed"
        style={{ fontFamily: "Cormorant Garamond", fontSize: "18px" }}
      />
    </div>
  );
}
