import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { User, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProfileSetupScreen() {
  const { user, refreshProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        phone: user.phone || '',
        full_name: name,
        email,
        role: 'passenger',
      });

    if (upsertError) {
      // 23505 is the PostgreSQL code for unique constraint violation
      if (upsertError.code === '23505') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: name,
            phone: user.phone || '',
          })
          .eq('id', user.id);
        
        if (updateError) {
          setError(updateError.message);
        } else {
          await refreshProfile();
        }
      } else {
        setError(upsertError.message);
      }
    } else {
      await refreshProfile();
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 items-center justify-center">
      <div className="w-full max-w-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
        >
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-primary mb-2">
              {t('profile.setup')}
            </h2>
            <p className="text-gray-400 text-sm font-medium">
              {user?.phone}
            </p>
          </div>

          <form onSubmit={handleCompleteSetup} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 px-1">
                {t('profile.nameLabel')}
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute inset-y-0 flex items-center px-4 pointer-events-none text-gray-400",
                  isRTL ? "right-0" : "left-0"
                )}>
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('profile.namePlaceholder')}
                  className={cn(
                    "input-field pl-12",
                    isRTL && "pr-12 pl-4"
                  )}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 px-1">
                {t('profile.emailLabel')}
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute inset-y-0 flex items-center px-4 pointer-events-none text-gray-400",
                  isRTL ? "right-0" : "left-0"
                )}>
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('profile.emailPlaceholder')}
                  className={cn(
                    "input-field pl-12",
                    isRTL && "pr-12 pl-4"
                  )}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium px-1 italic">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>{t('profile.complete')}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
