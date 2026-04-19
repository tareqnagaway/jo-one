import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Star, Car, Phone, MessageSquare, Share2, AlertTriangle } from 'lucide-react';

interface DriverCardProps {
  driver: any;
  ride: any;
}

export default function DriverCard({ driver, ride }: DriverCardProps) {
  const { t, isRTL } = useLanguage();

  if (!driver) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-0 left-0 right-0 p-4 z-40"
    >
      <div className="bg-white rounded-[2.5rem] shadow-[0_-20px_50px_rgba(30,58,138,0.1)] p-8 border border-gray-100">
        {/* Status Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-black uppercase tracking-widest mb-2 border border-secondary/10">
            {ride.status === 'accepted' ? t('ride.driverArriving') : 
             ride.status === 'arrived' ? t('ride.driverArrived') : t('ride.tripStarted')}
          </div>
        </div>

        {/* Driver Main Info */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <img 
              src={driver.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.id}`} 
              alt={driver?.name || 'Driver'}
              className="w-16 h-16 rounded-[1.5rem] object-cover bg-gray-100"
            />
            <div className="absolute -bottom-2 -right-2 bg-secondary text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border-2 border-white">
              <Star size={10} fill="currentColor" />
              {driver?.rating || '5.0'}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-black text-xl text-gray-800 leading-tight">
              {driver?.name || 'Driver'}
            </h3>
            <p className="text-gray-400 text-sm font-bold">
              {driver?.vehicle_color} {driver?.vehicle_type}
            </p>
          </div>

          <div className="text-end">
            <div className="text-lg font-black text-primary bg-primary/5 px-4 py-1 rounded-[1rem]">
              {driver?.vehicle_number}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button className="flex items-center justify-center gap-2 p-5 bg-gray-50 rounded-full text-primary hover:bg-gray-100 transition-colors active:scale-95">
            <Phone size={20} />
            <span className="font-black text-sm uppercase tracking-wider">{isRTL ? 'اتصال' : 'Call'}</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-5 bg-secondary text-white rounded-full shadow-lg shadow-secondary/20 hover:opacity-90 transition-all active:scale-95">
            <MessageSquare size={20} />
            <span className="font-black text-sm uppercase tracking-wider">{isRTL ? 'رسالة' : 'Chat'}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'مشاركة الرحلة',
                  text: `أنا في طريقي مع السائق ${driver.name}, لوحة المركبة: ${driver.vehicle_number}`,
                  url: window.location.href
                });
              }
            }}
            className="flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Share2 size={18} />
            <span className="font-bold text-xs uppercase">{isRTL ? 'مشاركة' : 'Share'}</span>
          </button>
          <button 
            onClick={() => window.location.href = 'tel:911'}
            className="flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors border border-red-100"
          >
            <AlertTriangle size={18} />
            <span className="font-bold text-xs uppercase">SOS</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
