import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronLeft, Languages, Bell, ShieldCheck, ChevronRight, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t, isRTL, setLanguage, language } = useLanguage();
  
  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col">
      <div className="p-8 pb-10 bg-primary text-white flex items-center justify-between rounded-b-[3rem] shadow-xl">
        <button onClick={onBack} className={cn("w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all", isRTL && "rotate-180")}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Settings size={28} />
          <h1 className="text-2xl font-black">{t('common.settings.title')}</h1>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages size={24} className="text-primary" />
              <span className="font-bold">{t('common.settings.language')}</span>
            </div>
            <select 
              className="bg-gray-50 p-2 rounded-lg font-bold text-sm"
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              value={language}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={24} className="text-primary" />
              <span className="font-bold">{t('common.settings.notifications')}</span>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full relative">
               <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-primary" />
              <span className="font-bold">{t('common.settings.privacy')}</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
