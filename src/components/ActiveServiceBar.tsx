import React from 'react';
import { Car, Clock, CheckCircle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRide } from '../contexts/RideContext';

export default function ActiveServiceBar() {
  const { currentRide } = useRide();

  if (!currentRide) return null;

  const getStatusDisplay = () => {
    switch (currentRide.status) {
      case 'searching':
        return { text: 'جاري البحث عن كابتن...', icon: Clock, color: 'bg-amber-500' };
      case 'accepted':
        return { text: 'تم قبول طلبك، الكابتن في الطريق', icon: Car, color: 'bg-blue-500' };
      case 'arrived':
        return { text: 'وصل الكابتن، بانتظارك', icon: MapPin, color: 'bg-green-500' };
      case 'ongoing':
        return { text: 'أنت الآن في رحلة نشطة', icon: Car, color: 'bg-primary' };
      case 'completed':
        return { text: 'تمت الرحلة بنجاح', icon: CheckCircle, color: 'bg-emerald-500' };
      default:
        return { text: 'حالة غير معروفة', icon: Clock, color: 'bg-gray-500' };
    }
  };

  const { text, icon: Icon, color } = getStatusDisplay();

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 p-4 pt-12"
      >
        <div className={cn("rounded-2xl shadow-xl p-4 flex items-center gap-4 text-white", color)}>
          <div className="bg-white/20 p-2 rounded-full">
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm tracking-tight">{text}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Utility for merging classes used in the code above implicitly
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
