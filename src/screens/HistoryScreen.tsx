import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { Calendar, MapPin, ChevronLeft, History as HistoryIcon, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export default function HistoryScreen({ onBack }: { onBack: () => void }) {
  const { user, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*, driver_details(*)')
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setRides(data);
      setIsLoading(false);
    };

    fetchHistory();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col overscroll-none">
      {/* Header */}
      <div className="p-8 pb-10 bg-primary text-white flex items-center justify-between rounded-b-[3rem] shadow-xl">
        <button onClick={onBack} className={cn("w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all", isRTL && "rotate-180")}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          {t('history.title')}
        </h1>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 -mt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <HistoryIcon size={48} />
            </motion.div>
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center p-20 text-gray-400 font-bold">
            {t('history.noTrips')}
          </div>
        ) : (
          rides.map((ride) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              key={ride.id}
              className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                      <Calendar size={14} className="text-primary" />
                   </div>
                   <span className="text-xs font-black text-gray-400">
                     {new Date(ride.created_at).toLocaleDateString()}
                   </span>
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  ride.status === 'completed' ? "bg-green-100 text-green-600" : "bg-secondary/10 text-secondary"
                )}>
                  {ride.status}
                </div>
              </div>

              <div className="space-y-4 relative">
                <div className={cn("absolute top-3 bottom-3 w-0.5 bg-gray-100", isRTL ? "right-[0.45rem]" : "left-[0.45rem]")} />
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full border-2 border-primary bg-white mt-1 z-10 flex-shrink-0" />
                  <p className="text-gray-500 font-bold text-sm line-clamp-1">{ride.pickup_address}</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-[4px] bg-secondary mt-1 z-10 flex-shrink-0" />
                  <p className="text-gray-800 font-black text-sm line-clamp-1">{ride.destination_address || ride.dropoff_address}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-2">
                <div className="flex items-center gap-3">
                   {ride.driver_details && (
                     <>
                        <img 
                          src={ride.driver_details.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ride.driver_details.driver_id}`} 
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                           <div className="text-sm font-black text-gray-800">سائق #{ride.driver_details.driver_number}</div>
                           <div className="text-[10px] font-bold text-gray-400" dir="ltr">{ride.driver_details.car_plate}</div>
                        </div>
                     </>
                   )}
                </div>
                <div className="text-xl font-black text-primary">
                  {ride.fare !== null && ride.fare !== undefined ? parseFloat(ride.fare).toFixed(2) : '0.00'} JOD
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
