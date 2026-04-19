import React from 'react';
import { motion } from 'motion/react';
import { Car, Utensils, Zap, Receipt, Package, Truck, ShoppingBag, Coffee, Fuel, Gift, Film, Home, Plane, Building2, Landmark, Music, BookOpen, HeartPulse, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

const items = [
  { id: 'food', name: 'طعام', icon: Utensils },
  { id: 'shipping', name: 'شحن', icon: Package },
  { id: 'bills', name: 'فواتير', icon: Receipt },
  { id: 'truck', name: 'شاحنة', icon: Truck },
  { id: 'market', name: 'تسوق', icon: ShoppingBag },
  { id: 'coffee', name: 'قهوة', icon: Coffee },
  { id: 'fuel', name: 'وقود', icon: Fuel },
  { id: 'gift', name: 'هدايا', icon: Gift },
  { id: 'movie', name: 'سينما', icon: Film },
  { id: 'home', name: 'خدمات', icon: Home },
  { id: 'travel', name: 'سفر', icon: Plane },
  { id: 'hotel', name: 'فنادق', icon: Building2 },
  { id: 'culture', name: 'ثقافة', icon: Landmark },
  { id: 'music', name: 'موسيقى', icon: Music },
  { id: 'education', name: 'تعليم', icon: BookOpen },
  { id: 'health', name: 'صحة', icon: HeartPulse },
  { id: 'luxury', name: 'ترف', icon: Sparkles },
  { id: 'zap', name: 'سويفت', icon: Zap },
  { id: 'more', name: 'المزيد', icon: AlertCircle },
];

export default function ServiceGrid({ onSelectService }: { onSelectService: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Taxi Special Row */}
      <button
          onClick={() => onSelectService('taxi')}
          className="w-full flex items-center gap-4 p-4 rounded-[2rem] bg-gradient-to-tr from-yellow-300 to-yellow-400 shadow-xl shadow-yellow-400/30 border-b-4 border-yellow-500 active:border-b-0 active:translate-y-1 transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/40 flex items-center justify-center text-primary">
            <Car size={32} />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-xl font-black text-primary">تاكسي</span>
            <span className="text-primary/70 text-xs font-bold">أطلب رحلتك الآن</span>
          </div>
          <Sparkles className="text-primary animate-pulse" size={24} />
      </button>

      {/* Other Services */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-6">
        {items.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              disabled={true}
              className="flex flex-col items-center gap-2 group transition-all grayscale opacity-50"
            >
              <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all shadow-sm border border-gray-100 bg-gray-50 text-gray-500">
                <Icon size={22} />
              </div>
              <span className="text-[10px] font-bold text-center text-gray-500">
                {service.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
