import React from 'react';
import { motion } from 'motion/react';

export default function RadarScreen() {
  return (
    <div className="absolute inset-0 z-40 bg-gray-900/90 flex flex-col items-center justify-center text-white">
      <div className="relative flex items-center justify-center">
        {/* Animated Ripple Effects */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/20"
            initial={{ width: 64, height: 64, opacity: 0.8 }}
            animate={{ 
              width: 256, 
              height: 256, 
              opacity: 0,
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 1,
              ease: "linear" 
            }}
          />
        ))}
        
        {/* Center Logo */}
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center z-10 shadow-lg shadow-primary/50">
          <span className="font-black text-2xl text-white">JO</span>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-black mb-2">جاري البحث عن كابتن...</h3>
        <p className="text-white/60 font-bold">يرجى الانتظار، نحن نحدد أقرب سائق إليك</p>
      </div>
    </div>
  );
}
