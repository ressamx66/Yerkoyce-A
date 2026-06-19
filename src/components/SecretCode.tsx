import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const TERZI_STORY = `
<p><b>Bir Hatıra: "Anne, Mehmet Amca Seni İstiyo!"</b></p>
<p>Yerköy'ün en sevilen esnaflarından biri olan Terzi Mehmet amca, dükkânının kapısını her sabah gülümseyerek açardı. Onun yanında zaman su gibi akar, kahkahalar eksik olmazdı. Normalde ağzından asla ağır bir söz çıkmazdı ama ne zaman biraz sinirlense, diline doladığı küfürlü takılmalar etraftakileri kahkahaya boğardı. Öyle ki, mahalleli sırf bu tatlı çıkışlarını duymak için onu hafifçe kızdırmaya çalışırdı.</p>
<p>Mehmet amcanın küfürleri kimseyi incitmez, bilakis sohbetin tuzu biberi olurdu. Onun diliyle söylenen söz, bir başka tat kazanır; gülüşmeler, neşeler dükkânın içinde yankılanırdı. İnsanlar işlerini bırakıp sadece bu hoş muhabbet için bile uğrar, onun yanında dertlerini unuturdu. Terzi Mehmet amca, hem diktiği elbiselerle hem de gönüllere işlediği neşeyle hatırlanan biriydi.</p>
<p>Eski zamanlarda, gecenin ilerleyen saatlerinde herkes yavaş yavaş yataklarına çekilirken, kasabanın bir köşesinde tatlı bir oyun dönmektedir. Mehmet amcayla ailecek çok yakın olan genç, annesiyle birlikte evde vakit geçirirken sıkılır. Birden aklına bir şaka gelir. Telefonu eline alır, Mehmet amcayı arar. Önce usul usul halini hatırını sorar, ardından sesini iyice kısarak, "Mehmet amca, bi küfür etsene" diye takılır.</p>
<p>Mehmet amca önce şaşırır, sonra sinirle gülümseyerek, "Oğlum, ne küfrü? Deli misin sen, git işine!" der. Ama genç pes etmez, üsteledikçe üstelemeye başlar. Bu ısrar karşısında Mehmet amcanın sabrı taşar. "Yeter lan! Senin ananı…" diyerek ağzını açar, başlar bildiği gibi küfürleri saymaya. Genç ise tam da bu anı kolluyordur. Mehmet amcanın hararetle küfretmeye başladığı anda telefonu annesine uzatır: "Anne, Mehmet amca seni istiyo."</p>
<p>Anne saf saf telefonu kulağına götürür götürmez, Mehmet amcanın gür sesi ve ardı ardına gelen küfürleri ortalığı çınlatır.</p>
<p>Küfürleri duyan anne Mehmet amcaya cevap verir: "N'oluyo sana Mehmet koskoca adamsın, kudurdun mu?"</p>
<p>Terzi Mehmet amcanın bu beklenmedik küfürlü çıkışı, ilk anda anne için büyük bir şaşkınlık yaratsa da, işin aslında bir şaka olduğu anlaşılınca o da kahkahalara katılmıştır. O anda annenin şaşkın bakışı, gencin kahkahası ve Mehmet amcanın farkında olmadan oyuna düşüşü, yıllarca dilden dile anlatılan en tatlı hatıralardan biri haline gelmiştir.</p>
<p><i>Bir Not Düşelim:</i> Terzi Mehmet amca örneğinde görüldüğü gibi, kimi zaman küfürlü sözler gerçek anlamlarını yitirerek bir şaka, bir yakınlık ifadesi hâline gelebilir. Olayın özü, Mehmet amcanın küfür etmesinden ziyade, etrafındakilerin bundan keyif alması ve onu bu noktaya özellikle teşvik etmeleridir. Bu durum bize gösteriyor ki, kimi kelimeler her zaman öfke ya da hakaret taşımaz; aksine toplumsal hafızada şakalaşma, kahkaha ve paylaşılmış neşe olarak da yer bulabilir. Burada asıl belirleyici olan, kelimenin çıplak anlamı değil; söylendiği bağlam, ilişki ve niyettir. Yine de altını çizelim: Küfürlü konuşmayı bir alışkanlık hâline getirmek doğru değildir. Mehmet amca ve onun kuşağından nice insan, niyetleri temiz, kalpleri berrak, birbirini kırmaktan özenle kaçınan insanlar oldukları için bu sözler bir incitme değil, gülüşmenin malzemesi olmuştur.</p>
`.trim();

export function SecretCode() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (code.trim().toLowerCase() === "/terziamca") {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setUnlocked(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setCode("");
          setUnlocked(false);
          setError(false);
        }}
        className="fixed bottom-6 right-[88px] z-40 w-14 h-14 rounded-full bg-copper/90 text-moon-cream shadow-xl hover:bg-copper hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-2xl"
        title="Sihirli Deynek"
      >
        🪄
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
              className="bg-[#1f1b19] border border-white/10 rounded-xl w-full max-w-5xl p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-moon-cream">KOD GİRİŞ</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-moon-cream/50 hover:text-moon-cream cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!unlocked ? (
                <div className="space-y-4">
                  <p className="text-xs text-moon-cream/50 leading-relaxed">
                    Gizli bir hikâyenin kapısını açmak için kodu gir.
                  </p>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="KOD GİR"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-moon-cream text-sm placeholder:text-moon-cream/30 focus:outline-none focus:border-copper/40 uppercase tracking-widest"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-400/80 text-xs">Yanlış kod. Tekrar dene.</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!code.trim()}
                    className="w-full py-3 bg-copper/20 border border-copper/40 text-copper text-sm rounded-sm hover:bg-copper/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    Aç
                  </button>
                </div>
              ) : (
                <div
                  className="prose prose-sm prose-invert max-w-none space-y-3 text-sm text-moon-cream/90 leading-relaxed [&_p]:mb-4 [&_i]:text-copper/70 max-h-[55vh] overflow-y-auto pr-1"
                  dangerouslySetInnerHTML={{ __html: TERZI_STORY }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
