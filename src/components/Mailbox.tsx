import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, ArrowLeft, Plus } from "lucide-react";
import { pmSend, pmInbox, pmConversation } from "../api";
import pkBos from "../assets/pk-bos.png";
import pkDolu from "../assets/pk-dolu.png";

interface Conversation {
  partner: string;
  last_id: string;
  last_at: string;
  unread_count: number;
}

interface PMMessage {
  id: string;
  sender: string;
  receiver: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function Mailbox() {
  const [open, setOpen] = useState(false);
  const [myUsername, setMyUsername] = useState<string | null>(() => sessionStorage.getItem("som_user"));
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const [messages, setMessages] = useState<PMMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [composeMode, setComposeMode] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeText, setComposeText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function sync() {
      setMyUsername(sessionStorage.getItem("som_user"));
    }
    window.addEventListener("storage", sync);
    const interval = setInterval(sync, 2000);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!myUsername) { setUnreadCount(0); return; }
    refreshUnread();
    const interval = setInterval(refreshUnread, 30000);
    return () => clearInterval(interval);
  }, [myUsername]);

  async function refreshUnread() {
    try {
      const res = await fetch("/api/unread-count", {
        headers: { Authorization: "Bearer " + sessionStorage.getItem("som_token") },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }

  async function loadInbox() {
    try {
      const data = await pmInbox();
      setConversations(data.data || []);
    } catch {}
  }

  async function loadConversation(partner: string) {
    setLoading(true);
    try {
      const data = await pmConversation(partner);
      setMessages(data.data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {}
    setLoading(false);
    refreshUnread();
  }

  async function handleSendReply() {
    if (!activePartner || !replyText.trim()) return;
    try {
      await pmSend(activePartner, replyText.trim());
      setReplyText("");
      await loadConversation(activePartner);
    } catch {}
  }

  async function handleSendCompose() {
    if (!composeTo.trim() || !composeText.trim()) return;
    try {
      await pmSend(composeTo.trim(), composeText.trim());
      setComposeMode(false);
      setComposeTo("");
      setComposeText("");
      await loadInbox();
      setActivePartner(composeTo.trim());
      await loadConversation(composeTo.trim());
    } catch {}
  }

  function handleOpen() {
    setOpen(true);
    if (myUsername) loadInbox();
  }

  function handleBack() {
    if (activePartner) {
      setActivePartner(null);
      setMessages([]);
    } else if (composeMode) {
      setComposeMode(false);
    } else {
      setOpen(false);
    }
  }

  function formatTime(iso: string) {
    try {
      let d: Date;
      if (iso.length === 19 && !iso.includes("T")) {
        d = new Date(iso.replace(" ", "T") + "Z");
      } else {
        d = new Date(iso);
      }
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }) + " " +
        d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  if (!myUsername) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full bg-copper/90 text-moon-cream shadow-xl hover:bg-copper hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
          title="Posta Kutusu"
        >
          <img src={pkBos} alt="Posta Kutusu" className="w-8 h-8 object-contain" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="bg-[#1f1b19] border border-white/10 rounded-xl w-full max-w-md p-8 shadow-2xl text-center"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-moon-cream/60 text-sm mb-4">Mesajlaşmak için önce SOM Cüzdan'a giriş yapmalısınız.</p>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/20 cursor-pointer"
                >
                  Kapat
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full bg-copper/90 text-moon-cream shadow-xl hover:bg-copper hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
        title="Posta Kutusu"
      >
        <img
          src={unreadCount > 0 ? pkDolu : pkBos}
          alt="Posta Kutusu"
          className="w-8 h-8 object-contain"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="bg-[#1f1b19] border border-white/10 rounded-xl w-full max-w-md h-[500px] flex flex-col shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-moon-cream/50 hover:text-moon-cream cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <h2 className="font-serif text-sm text-moon-cream">
                    {activePartner ? activePartner : composeMode ? "Yeni Mesaj" : "Posta Kutusu"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!activePartner && !composeMode && (
                    <button
                      onClick={() => setComposeMode(true)}
                      className="w-7 h-7 rounded-full border border-copper/40 flex items-center justify-center text-copper hover:bg-copper/20 cursor-pointer"
                      title="Yeni Mesaj"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-moon-cream/50 hover:text-moon-cream cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {composeMode ? (
                  <div className="p-4 space-y-3">
                    <input
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="Kullanıcı adı..."
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40"
                      autoFocus
                    />
                    <textarea
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      placeholder="Mesajınız..."
                      rows={4}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 resize-none"
                    />
                    <button
                      onClick={handleSendCompose}
                      disabled={!composeTo.trim() || !composeText.trim()}
                      className="w-full py-2.5 bg-copper/20 border border-copper/40 text-copper text-sm rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      Gönder
                    </button>
                  </div>
                ) : activePartner ? (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {loading ? (
                        <div className="text-center text-moon-cream/40 text-xs py-8">Yükleniyor...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-moon-cream/40 text-xs py-8">Henüz mesaj yok</div>
                      ) : (
                        messages.map((msg) => {
                          const isSent = msg.sender.toLowerCase() === myUsername.toLowerCase();
                          return (
                            <div
                              key={msg.id}
                              className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                                isSent
                                  ? "ml-auto bg-copper/20 border border-copper/30 text-moon-cream"
                                  : "mr-auto bg-white/5 border border-white/10 text-moon-cream/80"
                              }`}
                            >
                              {msg.message.startsWith("[IMG]") ? (
                                <img
                                  src={msg.message.replace("[IMG]", "")}
                                  alt="Resim"
                                  className="max-w-full rounded cursor-pointer"
                                  onClick={() => window.open(msg.message.replace("[IMG]", ""))}
                                />
                              ) : (
                                <p className="break-words">{msg.message}</p>
                              )}
                              <p className="text-[9px] text-moon-cream/30 mt-1 text-right">
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex items-center gap-2 p-3 border-t border-white/10">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                        placeholder="Mesaj yaz..."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className="w-9 h-9 flex items-center justify-center bg-copper/20 border border-copper/40 text-copper rounded-sm hover:bg-copper/30 disabled:opacity-40 cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {conversations.length === 0 ? (
                      <div className="text-center text-moon-cream/40 text-xs py-8">
                        Henüz konuşmanız yok
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.partner}
                          onClick={() => {
                            setActivePartner(conv.partner);
                            loadConversation(conv.partner);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer text-left"
                        >
                          <div>
                            <p className="text-sm text-moon-cream">{conv.partner}</p>
                            <p className="text-[10px] text-moon-cream/40">{formatTime(conv.last_at)}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                              {conv.unread_count}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
