import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../assets/logo-1.png';

export default function AuthScreen() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const formattedPhone = phone.startsWith('+') ? phone : `+962${phone}`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setStep('otp');
    }
    setIsLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent, isRegister: boolean) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError('');

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        if (signUpError) throw signUpError;
        setError('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (authError: any) {
      setError(authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formattedPhone = phone.startsWith('+') ? phone : `+962${phone}`;

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (verifyError) {
      setError(t('auth.invalidOtp'));
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col p-6 items-center justify-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />

      <div className="w-full max-w-sm flex flex-col items-center z-10">
        <div className="mb-2 text-center">
          <motion.img 
            src={logo}
            alt="Jo One Logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-40 mx-auto mb-2 drop-shadow-2xl"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/70 font-medium text-xs"
          >
          </motion.p>
        </div>

        <div className="w-full bg-white rounded-3xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-gray-800">{t('auth.login')}</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">{t('auth.enterPhone')}</p>
                </div>

                <div className="relative">
                  <div className={cn(
                    "absolute inset-y-0 flex items-center px-4 pointer-events-none text-gray-400",
                    isRTL ? "right-0" : "left-0"
                  )}>
                    <Phone size={20} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    className={cn(
                      "input-field pl-12 h-14",
                      isRTL && "pr-12 pl-4"
                    )}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-medium italic text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full h-14 flex items-center justify-center gap-2 text-lg"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>{t('auth.sendCode')}</span>}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold tracking-widest">{t('auth.or')}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-full h-full" alt="Google" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700">GOOGLE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-8 h-8 mb-2 flex items-center justify-center bg-primary/5 rounded-lg group-hover:scale-110 transition-transform">
                      <Mail size={20} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase">{t('auth.emailLogin')}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div>
                  <button 
                    type="button" 
                    onClick={() => setStep('phone')}
                    className="text-primary text-sm font-bold mb-4 flex items-center gap-2 hover:underline"
                  >
                    {isRTL ? '←' : '→'} {phone}
                  </button>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-gray-800">{t('auth.enterOtp')}</h2>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder={t('auth.otpPlaceholder')}
                    className="input-field text-center text-3xl font-black tracking-[0.5em] h-16"
                    maxLength={6}
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-medium italic text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="btn-primary w-full h-14 text-lg">
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('auth.verifyCode')}
                </button>
              </motion.form>
            )}

            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                className="space-y-4"
              >
                <button 
                  type="button" 
                  onClick={() => setStep('phone')}
                  className="text-primary text-sm font-bold mb-4 flex items-center gap-2 hover:underline"
                >
                  {isRTL ? '←' : '→'} {t('common.back')}
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-gray-800">{t('auth.emailLogin')}</h2>
                </div>
                
                <div className="relative">
                  <div className={cn("absolute inset-y-0 flex items-center px-4 pointer-events-none text-gray-400", isRTL ? "right-0" : "left-0")}><Mail size={18} /></div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className={cn("input-field pl-12 h-14", isRTL && "pr-12 pl-4")}
                    required
                  />
                </div>

                <div className="relative">
                  <div className={cn("absolute inset-y-0 flex items-center px-4 pointer-events-none text-gray-400", isRTL ? "right-0" : "left-0")}><Lock size={18} /></div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className={cn("input-field pl-12 h-14", isRTL && "pr-12 pl-4")}
                    required
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-medium italic text-center">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={(e) => handleEmailAuth(e, false)} 
                    disabled={isLoading}
                    className="btn-primary flex-2 h-14"
                  >
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('auth.login')}
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => handleEmailAuth(e, true)} 
                    disabled={isLoading}
                    className="flex-1 h-14 border-2 border-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                  >
                    {t('auth.register')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-400 font-bold px-4 leading-relaxed">
              {isRTL ? "بتسجيل دخولك، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا" : "By logging in, you agree to our Terms of Service & Privacy Policy"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
