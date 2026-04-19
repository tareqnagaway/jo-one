import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRide } from '../contexts/RideContext';
import { motion } from 'motion/react';
import { Star, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface TripCompleteScreenProps {
  ride: any;
  onDone: () => void;
}

export default function TripCompleteScreen({ ride, onDone }: TripCompleteScreenProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    setIsSubmitting(true);
    await supabase.from('activities').update({
      driver_rating: rating,
      status: 'completed',
    }).eq('id', ride.id);
    
    onDone();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center overscroll-none">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="w-32 h-32 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-10 shadow-inner"
      >
        <CheckCircle2 size={64} strokeWidth={3} />
      </motion.div>

      <h1 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">
        {t('ride.tripCompleted')}
      </h1>
      <p className="text-gray-400 font-bold mb-12 text-lg">
        {t('common.hopeGreatRide')}
      </p>

      <div className="w-full max-w-sm bg-primary/5 rounded-[2.5rem] p-8 mb-12 border-2 border-primary/5">
        <div className="text-xs font-black text-primary/40 uppercase tracking-widest mb-3">
          {t('ride.finalFare')}
        </div>
        <div className="text-5xl font-black text-primary flex items-center justify-center gap-2">
          {ride.fare || ride.estimated_fare || '5.00'}
          <span className="text-lg text-primary/60 font-black">JOD</span>
        </div>
      </div>

      <div className="mb-14 w-full">
        <div className="text-xl font-black text-gray-800 mb-6 uppercase tracking-widest">
          {t('ride.rateDriver')}
        </div>
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              className="p-1 transition-all active:scale-75 hover:scale-110"
            >
              <Star 
                size={48} 
                className={cn(
                  "transition-all duration-300",
                  s <= rating ? "text-secondary fill-secondary" : "text-gray-200"
                )} 
              />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmitRating}
        disabled={isSubmitting}
        className="btn-gold w-full max-w-sm text-lg py-5 shadow-secondary/30"
      >
        {t('common.next')}
      </button>
    </div>
  );
}
