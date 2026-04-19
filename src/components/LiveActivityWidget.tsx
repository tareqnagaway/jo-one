import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRide } from '../contexts/RideContext';
import { Car, Clock } from 'lucide-react';

export default function LiveActivityWidget() {
  const { currentRide } = useRide();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-800 text-white p-6 rounded-[2.5rem] shadow-2xl mx-4 mb-4"
    >
      <h3 className="text-lg font-black tracking-tight mb-1">من الأردن للعالم</h3>
      <p className="text-blue-100 text-sm font-medium">كل الخدمات اللي بتحتاجها بمكان واحد</p>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary text-white p-6 rounded-[2.5rem] shadow-2xl mx-4 mb-4"
    >
      <div className="flex justify-between items-center mb-2">
         <span className="font-black text-xs uppercase tracking-[0.2em]">نشاط نشط</span>
         <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {currentRide.status}
         </span>
      </div>
      
      {currentRide.status === 'searching' && (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="font-bold text-sm">جاري البحث عن أقرب سائق...</p>
        </div>
      )}

      {(currentRide.status === 'accepted' || currentRide.status === 'ongoing') && (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Car size={24} />
            </div>
            <div>
                <p className="font-black text-lg">{currentRide.drivers?.name || 'Driver'}</p>
                <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                    <Clock size={14} />
                    <span>متوقع الوصول قريباً</span>
                </div>
            </div>
        </div>
      )}
    </motion.div>
  );
}
