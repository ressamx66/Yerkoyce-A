import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { sendMessage } from "../api";

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setStatus("sending");
    try {
      await sendMessage(text.trim(), contact.trim());
      setStatus("done");
      setText("");
      setContact("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
          >
            <motion.div
              className="bg-[#1f1b19] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-moon-cream">Yazar'a Mesaj Gönder</h2>
                <button
                  onClick={() => { onClose(); setStatus("idle"); }}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-moon-cream/50 hover:text-moon-cream cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {status === "done" ? (
                <div className="text-center py-8">
                  <p className="text-copper text-lg mb-2">✓</p>
                  <p className="text-moon-cream/80 text-sm">Mesajınız iletildi. Teşekkürler!</p>
                  <button
                    onClick={() => { onClose(); setStatus("idle"); }}
                    className="mt-4 px-4 py-2 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/20 cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-moon-cream/50 leading-relaxed">
                    Eleştiri, öneri, devam yazısı talebi veya kitap siparişiniz mi var?
                    Aşağıya mesajınızı yazın. Geri dönüş için email veya Instagram adresinizi bırakabilirsiniz (isteğe bağlı).
                  </p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Mesajınız..."
                    rows={5}
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 resize-none"
                    autoFocus
                  />
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email veya Instagram adresiniz (isteğe bağlı)"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40"
                  />
                  {status === "error" && (
                    <p className="text-red-400/80 text-xs">Gönderilemedi. Lütfen tekrar deneyin.</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || status === "sending"}
                    className="w-full py-3 bg-copper/20 border border-copper/40 text-copper text-sm rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {status === "sending" ? "Gönderiliyor..." : "Gönder"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
