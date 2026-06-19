import { useEffect, useState, useCallback } from "react";
import { WordEntry } from "../types";
import { fetchWords, updateWord, createWord, deleteWord, fetchVersions, restoreVersion, adminAuth, fetchMessages, adminSom, adminAralik, adminGerisayim, fetchLogs } from "../api";
import { WordEditor } from "./WordEditor";

type View = "list" | "edit" | "new";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [view, setView] = useState<View>("list");
  const [current, setCurrent] = useState<WordEntry | null>(null);
  const [editData, setEditData] = useState<Partial<WordEntry>>({});
  const [versions, setVersions] = useState<{ id: string; data: WordEntry }[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("yerkoyce_admin") === "true");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<"words" | "messages" | "logs">("words");
  const [messages, setMessages] = useState<{ id: string; text: string; contact: string; date: string }[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [somCommand, setSomCommand] = useState("");
  const [somStatus, setSomStatus] = useState("");
  const [logs, setLogs] = useState<{ id: string; type: string; details: string; timestamp: string }[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await adminAuth(authPassword);
      sessionStorage.setItem("yerkoyce_admin", "true");
      sessionStorage.setItem("yerkoyce_admin_pw", authPassword);
      setAuthenticated(true);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Bağlantı hatası!");
    } finally {
      setAuthLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-steppe-dark flex items-center justify-center">
        <div className="text-center text-moon-cream/60 max-w-xs w-full px-6">
          <p className="text-2xl mb-2">⚙️</p>
          <p className="font-serif text-lg mb-6">Admin Paneli</p>
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Şifre"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm text-center placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 mb-3"
            autoFocus
          />
          {authError && <p className="text-red-400/80 text-xs mb-3">{authError}</p>}
          <button
            onClick={handleLogin}
            disabled={!authPassword || authLoading}
            className="w-full px-4 py-3 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {authLoading ? "Kontrol ediliyor..." : "Giriş"}
          </button>
          <button onClick={onClose} className="block mx-auto mt-6 text-[10px] text-moon-cream/30 hover:text-moon-cream/60 cursor-pointer">
            Siteye Dön
          </button>
        </div>
      </div>
    );
  }

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await fetchWords();
      setWords(data);
    } catch {
      setError("API sunucusuna bağlanılamadı. Önce `npm run server` çalıştırın.");
    }
  }, []);

  const loadMessages = useCallback(async () => {
    const pw = authPassword || sessionStorage.getItem("yerkoyce_admin_pw");
    if (!pw) return;
    setMessagesLoading(true);
    try {
      const data = await fetchMessages(pw);
      setMessages(data);
    } catch {}
    setMessagesLoading(false);
  }, [authPassword]);

  const loadLogs = useCallback(async () => {
    const pw = authPassword || sessionStorage.getItem("yerkoyce_admin_pw");
    if (!pw) return;
    setLogsLoading(true);
    try {
      const data = await fetchLogs(pw);
      setLogs(data);
    } catch {}
    setLogsLoading(false);
  }, [authPassword]);

  useEffect(() => { if (authenticated) load(); }, [authenticated, load]);
  useEffect(() => { if (authenticated && tab === "messages") loadMessages(); }, [authenticated, tab, loadMessages]);
  useEffect(() => { if (authenticated && tab === "logs") loadLogs(); }, [authenticated, tab, loadLogs]);

  const handleEdit = async (w: WordEntry) => {
    setCurrent(w);
    setEditData({ word: w.word, quote: w.quote, story: w.story });
    setView("edit");
    setStatus("");
    try {
      const v = await fetchVersions(w.id);
      setVersions(v);
    } catch { setVersions([]); }
  };

  const handleSave = async () => {
    if (!current || !editData.word?.trim()) return;
    try {
      setStatus("kaydediliyor...");
      await updateWord(current.id, {
        word: editData.word,
        quote: editData.quote,
        story: editData.story,
        isUpdated: editData.isUpdated,
      });
      setStatus("Kaydedildi ✓");
      await load();
    } catch {
      setStatus("Hata oluştu!");
    }
  };

  const handleCreate = async () => {
    if (!editData.word?.trim()) return;
    try {
      setStatus("oluşturuluyor...");
      await createWord({
        word: editData.word,
        quote: editData.quote || "",
        story: editData.story || "",
      });
      setStatus("Oluşturuldu ✓");
      setView("list");
      setEditData({});
      await load();
    } catch { setStatus("Hata!"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await deleteWord(id);
      await load();
    } catch { setError("Silme başarısız!"); }
  };

  const handleRestore = async (versionId: string) => {
    if (!current || !confirm("Bu versiyona geri dönülsün mü?")) return;
    try {
      await restoreVersion(current.id, versionId);
      setStatus("Geri alındı ✓");
      const data = await fetchWords();
      const updated = data.find((w) => w.id === current.id);
      if (updated) {
        setCurrent(updated);
        setEditData({ word: updated.word, quote: updated.quote, story: updated.story });
      }
    } catch { setStatus("Hata!"); }
  };

  const handleSomCommand = async () => {
    const pw = sessionStorage.getItem("yerkoyce_admin_pw");
    if (!pw) { setSomStatus("Sifre bulunamadi"); return; }

    const gerisayimMatch = somCommand.trim().match(/^\/gerisayim\s+(\S+)\s+(\d+)$/i);
    if (gerisayimMatch) {
      const username = gerisayimMatch[1];
      const gerisayim = parseInt(gerisayimMatch[2]);
      try {
        const data = await adminGerisayim(pw, gerisayim, username);
        setSomStatus(`${data.username}: geri sayim ${data.gerisayim}s`);
        setSomCommand("");
      } catch (e) {
        setSomStatus(e instanceof Error ? e.message : "Hata");
      }
      return;
    }

    const aralikMatch = somCommand.trim().match(/^\/aralik\s+(\S+)\s+(\d+)$/i);
    if (aralikMatch) {
      const username = aralikMatch[1];
      const aralik = parseInt(aralikMatch[2]);
      try {
        const data = await adminAralik(pw, aralik, username);
        setSomStatus(`${data.username}: yagmur araligi ${data.aralik}s`);
        setSomCommand("");
      } catch (e) {
        setSomStatus(e instanceof Error ? e.message : "Hata");
      }
      return;
    }

    const somMatch = somCommand.trim().match(/^\/som\s+(-?\d+)\s+(\S+)$/i);
    if (!somMatch) { setSomStatus("Gecersiz komut. Ornek: /som 20 Ahmet, /aralik rmy 3, /gerisayim Derya 10"); return; }
    const amount = parseInt(somMatch[1]);
    const username = somMatch[2];
    try {
      const data = await adminSom(pw, amount, username);
      setSomStatus(`${data.username}: ${data.som} § (${data.eklenen >= 0 ? "+" : ""}${data.eklenen})`);
      setSomCommand("");
    } catch (e) {
      setSomStatus(e instanceof Error ? e.message : "Hata");
    }
  };

  const inputClass = "w-full px-3 py-2 bg-steppe-dark text-moon-cream border border-white/10 rounded-sm focus:border-copper/40 focus:outline-none text-sm";

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-steppe-dark flex items-center justify-center">
        <div className="text-center text-moon-cream/60 max-w-md">
          <p className="text-2xl mb-4">⚙️ Admin Paneli</p>
          <p className="text-sm mb-6">{error}</p>
          <button onClick={onClose} className="px-4 py-2 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/20 cursor-pointer">
            Siteye Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-steppe-dark text-moon-cream overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h1 className="font-serif text-2xl text-copper">⚙️ Admin Paneli</h1>
          <div className="flex items-center gap-3">
            {status && <span className="text-xs text-copper">{status}</span>}
            <button onClick={onClose} className="px-4 py-1.5 border border-white/20 text-xs rounded-sm hover:bg-white/5 cursor-pointer">
              Siteye Dön
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setTab("words")}
            className={`pb-2 text-xs uppercase tracking-wider cursor-pointer transition-colors ${tab === "words" ? "text-copper border-b-2 border-copper" : "text-moon-cream/40 hover:text-moon-cream/60"}`}
          >
            Yazılar
          </button>
          <button
            onClick={() => setTab("messages")}
            className={`pb-2 text-xs uppercase tracking-wider cursor-pointer transition-colors ${tab === "messages" ? "text-copper border-b-2 border-copper" : "text-moon-cream/40 hover:text-moon-cream/60"}`}
          >
            Mesajlar {messages.length > 0 && `(${messages.length})`}
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`pb-2 text-xs uppercase tracking-wider cursor-pointer transition-colors ${tab === "logs" ? "text-copper border-b-2 border-copper" : "text-moon-cream/40 hover:text-moon-cream/60"}`}
          >
            LOG
          </button>
        </div>

        {/* SOM Komut Satırı */}
        <div className="flex gap-2 mb-6">
          <input
            value={somCommand}
            onChange={(e) => setSomCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSomCommand()}
            placeholder="/som 20 Ahmet | /aralik rmy 3 | /gerisayim Derya 10"
            className="flex-1 px-3 py-2 bg-steppe-dark text-moon-cream border border-white/10 rounded-sm text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 font-mono"
          />
          <button
            onClick={handleSomCommand}
            disabled={!somCommand.trim()}
            className="px-4 py-2 bg-copper/20 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all whitespace-nowrap"
          >
            Gönder
          </button>
        </div>
        {somStatus && <p className="text-xs text-copper mb-4">{somStatus}</p>}

        {tab === "words" && view === "list" && (
          <>
            <button
              onClick={() => { setEditData({ word: "", quote: "", story: "" }); setView("new"); setStatus(""); }}
              className="mb-6 px-4 py-2 bg-copper/20 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/30 cursor-pointer"
            >
              + Yeni Yazı Ekle
            </button>

            <div className="grid gap-3">
              {words.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-sm hover:border-copper/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg">{w.word}</p>
                    <p className="text-xs text-moon-cream/40 truncate mt-1">{w.quote}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <button onClick={() => handleEdit(w)} className="px-3 py-1 text-xs border border-white/20 rounded-sm hover:bg-white/5 cursor-pointer">
                      Düzenle
                    </button>
                    <button onClick={() => handleDelete(w.id)} className="px-3 py-1 text-xs border border-red-400/30 text-red-400/70 rounded-sm hover:bg-red-400/10 cursor-pointer">
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "messages" && (
          <div className="space-y-3">
            {messagesLoading && <p className="text-xs text-moon-cream/40">Yükleniyor...</p>}
            {!messagesLoading && messages.length === 0 && (
              <p className="text-xs text-moon-cream/40">Henüz mesaj yok.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-sm">
                <p className="text-sm text-moon-cream whitespace-pre-wrap">{m.text}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-moon-cream/40">
                  {m.contact && <span>{m.contact}</span>}
                  <span>{new Date(m.date).toLocaleString("tr-TR")}</span>
                </div>
              </div>
            ))}
            <button
              onClick={loadMessages}
              className="mt-4 px-4 py-2 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/20 cursor-pointer"
            >
              Yenile
            </button>
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-3">
            {logsLoading && <p className="text-xs text-moon-cream/40">Yükleniyor...</p>}
            {!logsLoading && logs.length === 0 && (
              <p className="text-xs text-moon-cream/40">Henüz log yok.</p>
            )}
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-sm">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm shrink-0 ${
                  l.type === "word_edit" ? "bg-blue-500/20 text-blue-400" :
                  l.type === "word_create" ? "bg-green-500/20 text-green-400" :
                  l.type === "word_delete" ? "bg-red-500/20 text-red-400" :
                  l.type === "som_change" ? "bg-copper/20 text-copper" :
                  "bg-white/10 text-moon-cream/60"
                }`}>
                  {l.type === "word_edit" ? "DÜZENLE" :
                   l.type === "word_create" ? "YENİ" :
                   l.type === "word_delete" ? "SİL" :
                   l.type === "som_change" ? "SOM" : l.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-moon-cream/80">{l.details}</p>
                  <p className="text-[10px] text-moon-cream/40 mt-1">{new Date(l.timestamp).toLocaleString("tr-TR")}</p>
                </div>
              </div>
            ))}
            <button
              onClick={loadLogs}
              className="mt-4 px-4 py-2 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/20 cursor-pointer"
            >
              Yenile
            </button>
          </div>
        )}

        {(view === "edit" || view === "new") && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => { setView("list"); setStatus(""); }} className="text-xs text-moon-cream/40 hover:text-moon-cream cursor-pointer">
                ← Listeye Dön
              </button>
              <p className="font-serif text-xl text-copper">
                {view === "new" ? "Yeni Yazı" : current?.word}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-moon-cream/40 block mb-1">Kelime / Başlık</label>
                <input
                  value={editData.word || ""}
                  onChange={(e) => setEditData({ ...editData, word: e.target.value })}
                  className={inputClass}
                  placeholder="Örn: Anahtar"
                />
              </div>

              <div>
                <label className="text-xs text-moon-cream/40 block mb-1">Alıntı (quote)</label>
                <input
                  value={editData.quote || ""}
                  onChange={(e) => setEditData({ ...editData, quote: e.target.value })}
                  className={inputClass}
                  placeholder="Kısa bir alıntı..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-moon-cream/40 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.isUpdated || false}
                    onChange={(e) => setEditData({ ...editData, isUpdated: e.target.checked })}
                    className="accent-copper"
                  />
                  Okurlar görsün: bu yazıya önemli ekleme/güncelleme yapıldı
                </label>
              </div>

              <div>
                <label className="text-xs text-moon-cream/40 block mb-1">Yazı İçeriği</label>
                <WordEditor
                  word={{ id: current?.id || "", word: editData.word || "", quote: editData.quote || "", story: editData.story || "" }}
                  onChange={(d) => setEditData((prev) => ({ ...prev, story: d.story }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={view === "new" ? handleCreate : handleSave}
                className="px-6 py-2 bg-copper/20 border border-copper/40 text-copper text-sm rounded-sm hover:bg-copper/30 cursor-pointer"
              >
                {view === "new" ? "Oluştur" : "Kaydet"}
              </button>
              <button onClick={() => { setView("list"); setStatus(""); }} className="px-4 py-2 text-xs text-moon-cream/40 hover:text-moon-cream cursor-pointer">
                İptal
              </button>
            </div>

            {/* Versiyon geçmişi */}
            {view === "edit" && versions.length > 0 && (
              <div className="mt-8 pt-4 border-t border-white/10">
                <p className="text-xs text-moon-cream/40 mb-3 uppercase tracking-wider">Versiyon Geçmişi</p>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                      <span className="text-xs text-moon-cream/40">
                        {new Date(parseInt(v.id)).toLocaleString("tr-TR")}
                      </span>
                      <button
                        onClick={() => handleRestore(v.id)}
                        className="px-3 py-1 text-xs border border-copper/20 text-copper/60 rounded-sm hover:bg-copper/20 cursor-pointer"
                      >
                        Geri Al
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
