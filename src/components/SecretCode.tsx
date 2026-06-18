import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const TERZI_STORY = `
<p><b>TERZİ MEHMET AMCA'NIN HİKAYESİ</b></p>
<p>Eskiyerköy'ün en tenha sokağında, çınar ağacının gölgesine sığınmış, kepenkleri her daim yarı kapalı bir dükkân vardı. Cumbalı penceresinde asılı tabela yıllar önce solmuş, rüzgârda yavaşça sallanan tahtada güçbela okunan tek bir kelime kalmıştı: "TERZİ".</p>
<p>Mehmet amca, o dükkânda yarım asrı devirmiş, kimseye bir şey dikmezdi artık. Sabah erkenden gelir, akşam ezanına kadar pencerenin önündeki eski sandalyesinde oturur, elinde bir iğne, kucağında yamalı bir kumaş parçasıyla saatlerce dikermiş gibi yapardı. Ama iğneye ip geçirdiğini gören yoktu.</p>
<p>Köylü onun deli olduğunu düşünür, çocuklar taş atar, gençler dalga geçerdi. Kimse girmezdi dükkânına. Ta ki o kış gecesine kadar...</p>
<p>Kar o kadar çok yağmıştı ki yollar kapanmış, Eskiyerköy dış dünyayla bağlantısını tamamen kesmişti. Köyün muhtarı Ali Rıza amca, o gece kapısını çaldı Terzi Mehmet'in. Elinde, dedesinden kalma bir palaskayı tutuyordu; kayışının tokası kopmuş, yılların pası üzerine sinmişti. "Mehmet," dedi, "bu palaska yadigârdır. Yarın kara gömülecek bir askerimiz var, tokasız kuşanmaz. Hakkını helal et, şu tokayı dikiver."</p>
<p>Terzi Mehmet, titreyen elleriyle palaskayı aldı. Gözlerinde bir pırıltı belirdi. Çırağı Hasan'a döndü: "Oğlum, sandığın altındaki kırmızı ipliği getir." Hasan şaşırdı, ustanın dükkânında kırmızı iplik olduğunu bilmezdi. Sandığı kaldırdığında, altından tozlu bir tahta kutu çıktı. Kutunun içinde, hiç solmamış, gün gibi parlayan kırmızı bir iplik makarası vardı.</p>
<p>Mehmet amca, o ipliği iğneye geçirdiğinde parmakları yılların yorgunluğunu silkip attı sanki. İğne kumaşta dans ediyor, her dikişte bir ömürlük tecrübe iplik olup akıyordu. Saatler süren sessizliğin ardından, tokayı palaskaya öyle bir dikti ki, anasından doğma gibiydi. Muhtar palaskayı eline aldığında gözleri doldu: "Mehmet, sen bu işi biliyorsun be!"</p>
<p>O geceden sonra köy, Terzi Mehmet'i başka gözle görmeye başladı. Meğer Mehmet amca, gençliğinde İstanbul'un en meşhur terzilerinin yanında çıraklık yapmış, paşalara, beylere elbise dikmiş biriymiş. Ama yıllar önce bir iftiraya uğramış, mesleğini bırakıp köyüne dönmüş. O günden beri iğneyi eline almamaya yemin etmiş.</p>
<p>Ta ki o gece, bir palaskanın tokası için yeminini bozana kadar.</p>
<p>Şimdi, Eskiyerköy'ün dar sokağında, çınar ağacının altındaki o dükkânda, Terzi Mehmet amca yine oturuyor. Ama bu kez iğnesinde ip var. Ve dükkânının önü, kış yaz eksik olmayan müşterilerle dolu.</p>
<p><i>"İnsanın içindeki ustayı öldürmek kolaydır; yaşatmak için bir palaskanın tokası yeter bazen."</i></p>
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
              className="bg-[#1f1b19] border border-white/10 rounded-xl w-full max-w-lg p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-moon-cream">🪄 Sihirli Deynek</h2>
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
                  className="prose prose-sm prose-invert max-w-none space-y-3 text-sm text-moon-cream/90 leading-relaxed [&_p]:mb-4 [&_i]:text-copper/70"
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
