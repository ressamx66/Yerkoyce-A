import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogOut, ArrowUp } from "lucide-react";
import { login, register, submitDeyis, getSonuc, getCuzdan, getSiralama, getMadalyonlar, yukselt, yukseltTimer, takas } from "../api";
import { Yagmur } from "./Yagmur";

type Tab = "login" | "register" | "cuzdan" | "siralama" | "madalya" | "yagmur";
type SonucTuru = "kazanildi" | "gecersiz" | null;

export function SomCuzdan() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => sessionStorage.getItem("som_token"));
  const [somUser, setSomUser] = useState<string | null>(() => sessionStorage.getItem("som_user"));
  const [cuzdan, setCuzdan] = useState<{ username: string; som: number; hak: number; bonus_hak: number; sohre_buyuklugu: number; sure: number; kazanilan: (string | { deyis: string; time: number })[]; madalyalar: { bronz: number; gumus: number; altin: number }; yaprak_sayaci: number; kitap_sayaci: number; saat_indirim: number } | null>(null);
  const [siralama, setSiralama] = useState<{ username: string; adet: number }[]>([]);
  const [siralamaTip, setSiralamaTip] = useState("genel");
  const [showInfo, setShowInfo] = useState(false);
  const [madalyalarListe, setMadalyonlarListe] = useState<{ username: string; adet: number }[]>([]);
  const [madalyaTip, setMadalyaTip] = useState("bronz");
  const [deyis, setDeyis] = useState("");
  const [hata, setHata] = useState("");
  const [loading, setLoading] = useState(false);
  const [hakKaldi, setHakKaldi] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sonuc, setSonuc] = useState<SonucTuru>(null);
  const [bekleyenDeyis, setBekleyenDeyis] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const loadCuzdan = async () => {
    if (!token) return;
    try {
      const data = await getCuzdan(token);
      setCuzdan(data);
    } catch { setCuzdan(null); }
  };

  const loadSiralama = async (tip?: string) => {
    try { setSiralama(await getSiralama(tip || siralamaTip)); } catch {}
  };
  const loadMadalyonlar = async (tip?: string) => {
    try { setMadalyonlarListe(await getMadalyonlar(tip || madalyaTip)); } catch {}
  };

  useEffect(() => { if (open && token) { loadCuzdan(); loadSiralama(siralamaTip); loadMadalyonlar(madalyaTip); } }, [open, token, siralamaTip, madalyaTip]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const countdownLoop = () => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (countdown === 0 && sonuc !== null) return;
    if (countdown === 0 && bekleyenDeyis && !sonuc) {
      (async () => {
        if (!token) return;
        try {
          const data = await getSonuc(token);
          if (data?.sonuc) setSonuc(data.sonuc);
        } catch {}
        await loadCuzdan();
      })();
    }
  }, [countdown, bekleyenDeyis, sonuc, token]);

  const handleAuth = async (type: "login" | "register") => {
    setLoading(true);
    setHata("");
    try {
      const fn = type === "login" ? login : register;
      const data = await fn(username.trim(), password);
      sessionStorage.setItem("som_token", data.token);
      sessionStorage.setItem("som_user", data.username);
      setToken(data.token);
      setSomUser(data.username);
      setTab("cuzdan");
      setUsername("");
      setPassword("");
      await loadCuzdan();
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Hata");
    }
    setLoading(false);
  };

  const handleSubmitDeyis = async () => {
    if (!token || !deyis.trim() || countdown > 0) return;
    setLoading(true);
    setHata("");
    setSonuc(null);
    setBekleyenDeyis(deyis.trim().toLowerCase());
    try {
      const data = await submitDeyis(token, deyis.trim());
      setHakKaldi(data.hak_kaldi);
      setDeyis("");
      setCountdown(data.bekleme);
      countdownLoop();
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Hata");
      setBekleyenDeyis("");
    }
    setLoading(false);
  };

  const handleYukselt = async () => {
    if (!token) return;
    setLoading(true);
    setHata("");
    try {
      const data = await yukselt(token);
      await loadCuzdan();
      setHata(data.mesaj);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Hata");
    }
    setLoading(false);
  };

  const handleYukseltTimer = async () => {
    if (!token) return;
    setLoading(true);
    setHata("");
    try {
      const data = await yukseltTimer(token);
      await loadCuzdan();
      setHata(data.mesaj);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Hata");
    }
    setLoading(false);
  };

  const handleYagmurUpdate = (data: { som?: number; hak?: number; yaprak_sayaci?: number; kitap_sayaci?: number; saat_indirim?: number }) => {
    setCuzdan(prev => prev ? {
      ...prev,
      som: data.som ?? prev.som,
      hak: data.hak ?? prev.hak,
      yaprak_sayaci: data.yaprak_sayaci ?? prev.yaprak_sayaci,
      kitap_sayaci: data.kitap_sayaci ?? prev.kitap_sayaci,
      saat_indirim: data.saat_indirim ?? prev.saat_indirim,
    } : prev);
  };

  const handleTakas = async (tur: "bronz" | "gumus") => {
    if (!token) return;
    setLoading(true);
    setHata("");
    try {
      const data = await takas(token, tur);
      setCuzdan((prev) => prev ? { ...prev, madalyalar: data.madalyalar } : prev);
      setHata(data.mesaj);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Hata");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("som_token");
    sessionStorage.removeItem("som_user");
    setToken(null);
    setSomUser(null);
    setCuzdan(null);
    setTab("login");
    setHata("");
    setSonuc(null);
    setCountdown(0);
    setBekleyenDeyis("");
    clearInterval(timerRef.current);
  };

  const handleOpen = () => {
    setOpen(true);
    if (token) { setTab("cuzdan"); loadSiralama(siralamaTip); }
    else setTab("login");
    setHata("");
  };

  const sonucMesaji = (s: SonucTuru) => {
    switch (s) {
      case "kazanildi": return { text: "✅ Geçerli deyiş! 1 § kazandınız.", renk: "text-green-400/90" };
      case "gecersiz": return { text: "❌ Geçersiz deyiş (Y911 listesinde yok veya son 7 gün içinde girilmiş)", renk: "text-red-400/80" };
      default: return { text: "", renk: "" };
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-[152px] z-40 w-14 h-14 rounded-full bg-copper/90 text-moon-cream shadow-xl hover:bg-copper hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-xl font-serif"
        title={somUser ? `${somUser} - ${(cuzdan?.som || 0).toFixed(2)} §` : "SOM Cüzdan"}
      >
        <span className="text-lg">{somUser ? "§" : "§"}</span>
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
              className="bg-[#1f1b19] border border-white/10 rounded-xl w-full max-w-lg p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-moon-cream">
                  {token ? `§ ${somUser}` : "§ SOM Cüzdan"}
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-moon-cream/50 hover:text-moon-cream cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!token ? (
                <div className="space-y-4">
                  <div className="flex gap-2 border-b border-white/10 mb-4">
                    <button
                      onClick={() => setTab("login")}
                      className={`pb-2 text-xs tracking-wider cursor-pointer ${tab === "login" ? "text-copper border-b-2 border-copper" : "text-moon-cream/40"}`}
                    >
                      Giriş
                    </button>
                    <button
                      onClick={() => setTab("register")}
                      className={`pb-2 text-xs tracking-wider cursor-pointer ${tab === "register" ? "text-copper border-b-2 border-copper" : "text-moon-cream/40"}`}
                    >
                      Kayıt
                    </button>
                  </div>
                  <p className="text-xs text-moon-cream/50 leading-relaxed">
                    Gizli deyişleri bularak § kazan, cüzdanında biriktir!
                  </p>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kullanıcı adı"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40"
                  />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Şifre"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40"
                    onKeyDown={(e) => e.key === "Enter" && handleAuth(tab === "login" ? "login" : "register")}
                  />
                  {hata && <p className="text-red-400/80 text-xs">{hata}</p>}
                  <button
                    onClick={() => handleAuth(tab === "login" ? "login" : "register")}
                    disabled={loading || !username.trim() || !password.trim()}
                    className="w-full py-3 bg-copper/20 border border-copper/40 text-copper text-sm rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {loading ? "..." : tab === "login" ? "Giriş Yap" : "Kaydol"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3 border-b border-white/10 pb-2">
                    <button
                      onClick={() => setTab("cuzdan")}
                      className={`text-xs tracking-wider cursor-pointer ${tab === "cuzdan" ? "text-copper" : "text-moon-cream/40"}`}
                    >
                      Cüzdan
                    </button>
                    <button
                      onClick={() => { setTab("siralama"); loadSiralama(siralamaTip); }}
                      className={`text-xs tracking-wider cursor-pointer ${tab === "siralama" ? "text-copper" : "text-moon-cream/40"}`}
                    >
                      Sıralama
                    </button>
                    <button
                      onClick={() => { setTab("madalya"); loadMadalyonlar(madalyaTip); }}
                      className={`text-xs tracking-wider cursor-pointer ${tab === "madalya" ? "text-copper" : "text-moon-cream/40"}`}
                    >
                      🏅 Madalya
                    </button>
                    <button
                      onClick={() => setTab("yagmur")}
                      className={`text-xs tracking-wider cursor-pointer ${tab === "yagmur" ? "text-copper" : "text-moon-cream/40"}`}
                    >
                      🌧 Yağmur
                    </button>
                    <button
                      onClick={handleLogout}
                      className="ml-auto text-xs text-moon-cream/30 hover:text-moon-cream/60 flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" /> Çıkış
                    </button>
                  </div>

                  {tab === "cuzdan" && (
                    <>
                      <div className="flex items-center gap-3 py-3 px-4 bg-white/5 border border-white/10 rounded-sm">
                        <span className="text-2xl text-copper font-serif">§</span>
                        <div>
                          <p className="text-xs text-moon-cream/40">SOM BAKİYE</p>
                          <p className="text-lg font-serif text-copper">{((cuzdan?.som ?? 0)).toFixed(2)} §</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 py-2 px-4 bg-white/5 border border-white/10 rounded-sm">
                        <span className="flex items-center gap-1.5 text-sm" title="Altın Madalya">
                          <span className="text-lg">🥇</span>
                          <span className="text-copper font-serif">{cuzdan?.madalyalar?.altin ?? 0}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-sm" title="Gümüş Madalya">
                          <span className="text-lg">🥈</span>
                          <span className="text-copper font-serif">{cuzdan?.madalyalar?.gumus ?? 0}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-sm" title="Bronz Madalya">
                          <span className="text-lg">🥉</span>
                          <span className="text-copper font-serif">{cuzdan?.madalyalar?.bronz ?? 0}</span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTakas("bronz")}
                          disabled={loading || (cuzdan?.madalyalar?.bronz ?? 0) < 10}
                          className="flex-1 py-2 border border-amber-700/40 text-amber-700 text-xs rounded-sm hover:bg-amber-700/20 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all text-center"
                        >
                          10 🥉 → 1 🥈
                        </button>
                        <button
                          onClick={() => handleTakas("gumus")}
                          disabled={loading || (cuzdan?.madalyalar?.gumus ?? 0) < 10}
                          className="flex-1 py-2 border border-gray-400/40 text-gray-300 text-xs rounded-sm hover:bg-gray-400/20 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all text-center"
                        >
                          10 🥈 → 1 🥇
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 py-2 px-4 bg-white/5 border border-white/10 rounded-sm">
                        <p className="text-xs text-moon-cream/40">
                          Günlük hak: <span className="text-copper">{cuzdan?.hak ?? 0}</span>/10
                          {(cuzdan?.bonus_hak ?? 0) > 0 && (
                            <span className="text-moon-cream/30"> (+{cuzdan?.bonus_hak} bonus)</span>
                          )}
                        </p>
                        {cuzdan && cuzdan.bonus_hak < 10 && (
                          <button
                            onClick={handleYukselt}
                            disabled={loading || (cuzdan?.som ?? 0) < 10}
                            className="flex items-center gap-1 px-3 py-1 border border-copper/30 text-copper text-[10px] rounded-sm hover:bg-copper/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                          >
                            <ArrowUp className="w-3 h-3" /> 10§
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 py-2 px-4 bg-white/5 border border-white/10 rounded-sm">
                        <p className="text-xs text-moon-cream/40">
                          Geri sayım: <span className="text-copper">{cuzdan?.sure ?? 300}s</span>
                          {(cuzdan?.sohre_buyuklugu ?? 0) > 0 && (
                            <span className="text-moon-cream/30"> (-{cuzdan?.sohre_buyuklugu * 5}%)</span>
                          )}
                        </p>
                        {cuzdan && (cuzdan.sohre_buyuklugu ?? 0) < 10 && (
                          <button
                            onClick={handleYukseltTimer}
                            disabled={loading || (cuzdan?.som ?? 0) < 10}
                            className="flex items-center gap-1 px-3 py-1 border border-copper/30 text-copper text-[10px] rounded-sm hover:bg-copper/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                          >
                            <ArrowUp className="w-3 h-3" /> 10§ -5%
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-moon-cream/40 uppercase tracking-wider">Deyiş Gir</p>
                        <div className="flex gap-2">
                          <input
                            value={deyis}
                            onChange={(e) => setDeyis(e.target.value)}
                            placeholder="ör: alaca_düşmek"
                            disabled={countdown > 0}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 lowercase disabled:opacity-30"
                            onKeyDown={(e) => e.key === "Enter" && handleSubmitDeyis()}
                          />
                          <button
                            onClick={handleSubmitDeyis}
                            disabled={loading || !deyis.trim() || countdown > 0}
                            className="px-4 py-2 bg-copper/20 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all whitespace-nowrap"
                          >
                            {countdown > 0 ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")}` : "Kazan"}
                          </button>
                        </div>

                        {countdown > 0 && (
                          <div className="py-3 text-center">
                            <div className="w-12 h-12 mx-auto border-2 border-copper/40 rounded-full flex items-center justify-center text-copper font-serif text-lg animate-pulse">
                              {countdown}
                            </div>
                            <p className="text-xs text-moon-cream/40 mt-2">
                              "{bekleyenDeyis}" kontrol ediliyor...
                            </p>
                          </div>
                        )}

                        {countdown === 0 && sonuc && (
                          <div className={`py-3 px-4 bg-white/5 border border-white/10 rounded-sm text-center text-sm ${sonucMesaji(sonuc).renk}`}>
                            {sonucMesaji(sonuc).text}
                          </div>
                        )}

                        {hata && <p className="text-red-400/80 text-xs">{hata}</p>}
                      </div>

                      {cuzdan && cuzdan.kazanilan.length > 0 && (
                        <div>
                          <p className="text-xs text-moon-cream/40 uppercase tracking-wider mb-2">
                            Kazanılanlar ({cuzdan.kazanilan.length})
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {cuzdan.kazanilan.map((k, idx) => {
                              const deyis = typeof k === "string" ? k : k.deyis;
                              return (
                                <div key={idx} className="text-xs text-moon-cream/60 px-2 py-1 bg-white/5 rounded-sm">
                                  {deyis}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {tab === "siralama" && (
                    <div className="space-y-2">
                      <div className="flex gap-2 border-b border-white/10 pb-2 items-end">
                        {[
                          { key: "gunluk", label: "Günlük" },
                          { key: "haftalik", label: "Haftalık" },
                          { key: "aylik", label: "Aylık" },
                          { key: "genel", label: "Genel" },
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => { setSiralamaTip(t.key); loadSiralama(t.key); }}
                            className={`text-[10px] tracking-wider cursor-pointer pb-1 ${siralamaTip === t.key ? "text-copper border-b-2 border-copper" : "text-moon-cream/40"}`}
                          >
                            {t.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setShowInfo(!showInfo)}
                          className="ml-auto text-[10px] w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-moon-cream/30 hover:text-moon-cream/60 cursor-pointer"
                          title="Nasıl hesaplanır?"
                        >?</button>
                      </div>

                      {showInfo && (
                        <div className="text-[10px] text-moon-cream/50 leading-relaxed p-3 bg-white/5 border border-white/10 rounded-sm space-y-1">
                          <p><b className="text-moon-cream/70">Günlük:</b> Bugün saat 00:00'dan itibaren kazanılan deyişler</p>
                          <p><b className="text-moon-cream/70">Haftalık:</b> Bu Pazartesi 00:00'dan itibaren kazanılan deyişler</p>
                          <p><b className="text-moon-cream/70">Aylık:</b> Bu ayın 1'i 00:00'dan itibaren kazanılan deyişler</p>
                          <p><b className="text-moon-cream/70">Genel:</b> Tüm zamanlar boyunca kazanılan deyişler</p>
                        </div>
                      )}
                      <div className="space-y-1 max-h-52 overflow-y-auto">
                        {siralama.length === 0 && (
                          <p className="text-xs text-moon-cream/40">Henüz veri yok.</p>
                        )}
                        {siralama.map((u, i) => (
                          <div
                            key={u.username}
                            className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-moon-cream/40 w-5">{i + 1}.</span>
                              <span className={u.username === somUser ? "text-copper" : "text-moon-cream/80"}>
                                {u.username}
                              </span>
                            </span>
                            <span className="text-copper font-serif">{u.adet} deyiş</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === "madalya" && (
                    <div className="space-y-2">
                      <div className="flex gap-2 border-b border-white/10 pb-2">
                        {[
                          { key: "bronz", label: "🥉 Bronz" },
                          { key: "gumus", label: "🥈 Gümüş" },
                          { key: "altin", label: "🥇 Altın" },
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => { setMadalyaTip(t.key); loadMadalyonlar(t.key); }}
                            className={`text-[10px] tracking-wider cursor-pointer pb-1 ${madalyaTip === t.key ? "text-copper border-b-2 border-copper" : "text-moon-cream/40"}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1 max-h-52 overflow-y-auto">
                        {madalyalarListe.length === 0 && (
                          <p className="text-xs text-moon-cream/40">Henüz madalya yok.</p>
                        )}
                        {madalyalarListe.map((u, i) => (
                          <div
                            key={u.username}
                            className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-moon-cream/40 w-5">{i + 1}.</span>
                              <span className={u.username === somUser ? "text-copper" : "text-moon-cream/80"}>
                                {u.username}
                              </span>
                            </span>
                            <span className="text-copper font-serif">{u.adet} {madalyaTip === "altin" ? "🥇" : madalyaTip === "gumus" ? "🥈" : "🥉"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {tab === "yagmur" && (
                    <div className="space-y-2">
                      {cuzdan ? (
                        <Yagmur
                          token={token}
                          som={cuzdan.som}
                          hak={cuzdan.hak}
                          yaprakSayaci={cuzdan.yaprak_sayaci || 0}
                          kitapSayaci={cuzdan.kitap_sayaci || 0}
                          saatIndirim={cuzdan.saat_indirim || 0}
                          onUpdate={handleYagmurUpdate}
                        />
                      ) : (
                        <p className="text-xs text-moon-cream/40">Yükleniyor...</p>
                      )}
                    </div>
                  )}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-moon-cream/30 leading-relaxed space-y-1">
                  <p><b className="text-moon-cream/50">Kurallar:</b></p>
                  <p>• "Yerköyce - İç Anadolu'dan Deyişler" kitabındaki deyişleri yazmalısınız.</p>
                  <p>• Son 7 gün içinde aynı deyiş daha önce kullanılmışsa geçersiz sayılır.</p>
                  <p>• Günlük 10 hak (10§ ile +1 bonus, max 10, her ay sıfırlanır). Geri sayım 5dk (10§ ile %5 kısalır, max 10, her ay sıfırlanır).</p>
                  <p>• Madalyalar dönem sonunda birinciye verilir: gün→bronz, hafta→gümüş, ay→altın.</p>
                  <p className="text-yellow-400/70 font-serif">🥇 Altın sıralamasında birinci olan oyuncuya, yazar tarafından imzalı "Yerköyce - İç Anadolu'dan Deyişler" kitabı hediye edilecektir!</p>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
