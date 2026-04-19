import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRide } from '../contexts/RideContext';
import { motion } from 'motion/react';
import { Loader2, X } from 'lucide-react';

export default function RideMatchingScreen() {
  const { t } = useLanguage();
  const { cancelRide } = useRide();

  return (
    <div className="absolute inset-0 bg-primary/95 flex flex-col items-center justify-center p-8 z-30 overflow-hidden text-center text-white">
      {/* Animated Radar Effect */}
      <div className="relative mb-12">
        <motion.div 
          animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 bg-secondary/30 rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
          transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 bg-secondary/20 rounded-full"
        />
        <div className="relative z-10 w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(197,160,89,0.3)] border-4 border-secondary/20">
          <Loader2 className="text-secondary animate-spin" size={48} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-4xl font-black mb-6 tracking-tight">
          {t('home.searching')}
        </h2>
        <p className="text-white/60 mb-12 max-w-xs font-medium text-lg">
          {t('home.findingDriver')}
        </p>

        <button 
          onClick={cancelRide}
          className="flex items-center gap-2 px-10 py-5 rounded-[2.5rem] border-2 border-white/10 hover:bg-white/5 transition-colors font-black text-sm uppercase tracking-widest"
        >
          <X size={20} />
          {t('common.cancel')}
        </button>
      </motion.div>
    </div>
  );
}
