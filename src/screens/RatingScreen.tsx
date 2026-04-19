import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Star, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function RatingScreen({ ride, onComplete }: { ride: any, onComplete: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !ride) return;
    setIsSubmitting(true);

    await supabase.from('ratings').insert({
      passenger_id: user.id,
      driver_id: ride.driver_id,
      ride_id: ride.id,
      rating,
      comment
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm"
      >
        <h2 className="text-2xl font-black text-center mb-6">كيف كانت رحلتك؟</h2>
        
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={40}
              className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أخبرنا عن تجربتك..."
          className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-6 focus:outline-none"
          rows={3}
        />

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-full bg-primary text-white font-black flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'جاري الإرسال...' : (
            <>
              إرسال التقييم <Send size={20} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
