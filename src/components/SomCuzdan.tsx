import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogOut } from "lucide-react";
import { login, register, submitDeyis, getCuzdan, getSiralama } from "../api";

type Tab = "login" | "register" | "cuzdan" | "siralama";

export function SomCuzdan() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => sessionStorage.getItem("som_token"));
  const [somUser, setSomUser] = useState<string | null>(() => sessionStorage.getItem("som_user"));
  const [cuzdan, setCuzdan] = useState<{ username: string; som: number; kazanilan: string[] } | null>(null);
  const [siralama, setSiralama] = useState<{ username: string; som: number }[]>([]);
  const [deyis, setDeyis] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCuzdan = async () => {
    if (!token) return;
    try {
      const data = await getCuzdan(token);
      setCuzdan(data);
    } catch { setCuzdan(null); }
  };

  const loadSiralama = async () => {
    try {
      setSiralama(await getSiralama());
    } catch {}
  };

  useEffect(() => { if (open && token) { loadCuzdan(); loadSiralama(); } }, [open, token]);

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
    if (!token || !deyis.trim()) return;
    setLoading(true);
    setMesaj("");
    setHata("");
    try {
      const data = await submitDeyis(token, deyis.trim());
      setMesaj(data.mesaj);
      setDeyis("");
      await loadCuzdan();
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
    setMesaj("");
    setHata("");
  };

  const handleOpen = () => {
    setOpen(true);
    if (token) { setTab("cuzdan"); loadSiralama(); }
    else setTab("login");
    setMesaj("");
    setHata("");
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-[152px] z-40 w-14 h-14 rounded-full bg-copper/90 text-moon-cream shadow-xl hover:bg-copper hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-xl font-serif"
        title={somUser ? `${somUser} - ${cuzdan?.som || 0} SOM` : "SOM Cüzdan"}
      >
        <span className="text-lg">{somUser ? "💰" : "🏦"}</span>
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
                  {token ? `💰 ${somUser}` : "🏦 SOM Cüzdan"}
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
                    Gizli deyişleri bularak SOM kazan, cüzdanında biriktir!
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
                  {/* tabs */}
                  <div className="flex gap-3 border-b border-white/10 pb-2">
                    <button
                      onClick={() => setTab("cuzdan")}
                      className={`text-xs tracking-wider cursor-pointer ${tab === "cuzdan" ? "text-copper" : "text-moon-cream/40"}`}
                    >
                      Cüzdan
                    </button>
                    <button
                      onClick={() => { setTab("siralama"); loadSiralama(); }}
                      className={`text-xs tracking-wider cursor-pointer ${tab === "siralama" ? "text-copper" : "text-moon-cream/40"}`}
                    >
                      Sıralama
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
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="text-xs text-moon-cream/40">BAKİYE</p>
                          <p className="text-lg font-serif text-copper">{cuzdan?.som ?? 0} SOM</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-moon-cream/40 uppercase tracking-wider">Deyiş Gir</p>
                        <div className="flex gap-2">
                          <input
                            value={deyis}
                            onChange={(e) => setDeyis(e.target.value)}
                            placeholder="ör: alaca_düşmek"
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 lowercase"
                            onKeyDown={(e) => e.key === "Enter" && handleSubmitDeyis()}
                          />
                          <button
                            onClick={handleSubmitDeyis}
                            disabled={loading || !deyis.trim()}
                            className="px-4 py-2 bg-copper/20 border border-copper/40 text-copper text-xs rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all whitespace-nowrap"
                          >
                            Kazan
                          </button>
                        </div>
                        {mesaj && <p className="text-green-400/80 text-xs">{mesaj}</p>}
                        {hata && <p className="text-red-400/80 text-xs">{hata}</p>}
                      </div>

                      {cuzdan && cuzdan.kazanilan.length > 0 && (
                        <div>
                          <p className="text-xs text-moon-cream/40 uppercase tracking-wider mb-2">
                            Kazanılanlar ({cuzdan.kazanilan.length})
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {cuzdan.kazanilan.map((k) => (
                              <div key={k} className="text-xs text-moon-cream/60 px-2 py-1 bg-white/5 rounded-sm">
                                {k}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {tab === "siralama" && (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
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
                          <span className="text-copper font-serif">{u.som} SOM</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
