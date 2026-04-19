import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage, isRTL } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20",
        className
      )}
    >
      <Languages size={16} />
      <span className="text-sm font-medium">
        {language === 'ar' ? 'English' : 'العربية'}
      </span>
    </button>
  );
};
