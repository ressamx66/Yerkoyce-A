import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import heroBg from "../assets/images/abstract_steppe_night_1781578947510.jpg";

export function Hero() {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <section className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-steppe-dark">
      {/* Cinematic Background Image */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <img src={heroBg} alt="İç Anadolu Manzarası" className="w-full h-full object-cover" />
        {/* Gradient overlays to blend it into the cinematic dark theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-steppe-dark via-steppe-dark/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-steppe-dark/80 via-transparent to-transparent" />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 text-center flex flex-col items-center px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
      >
        <h1 className="font-serif text-7xl md:text-[8rem] text-moon-cream font-light tracking-tight mb-2">Yerköyce</h1>
        <h2 className="font-serif text-3xl md:text-4xl text-copper italic mb-10 font-light opacity-90">İç Anadolu'dan Deyişler</h2>
        <div className="flex flex-col items-center">
          <p className="font-sans text-xs md:text-sm uppercase tracking-[0.3em] opacity-50 mb-2">Kelimelerin Peşinde, Hikayelerin İzinde</p>
          <div className="w-12 h-px bg-copper opacity-40"></div>
        </div>
      </motion.div>

      {/* Arrow Down */}
      <motion.button 
        onClick={scrollToContent}
        className="absolute bottom-[10vh] z-20 text-moon-cream/40 hover:text-copper transition-colors duration-500 cursor-pointer p-4 group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        aria-label="Aşağı kaydır"
      >
        <motion.div
           animate={{ y: [0, 10, 0] }}
           transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-8 h-8 font-light stroke-[1.5]" />
        </motion.div>
      </motion.button>
    </section>
  );
}
