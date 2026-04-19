import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, ChevronLeft, Plus, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Coupon {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: 'amount' | 'percentage';
  expires_at: string;
  description: string;
}

export default function PromosScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [promoCode, setPromoCode] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchActiveCoupons = async () => {
      // Fetch public active coupons since user_coupons table does not exist globally
      const { data, error } = await supabase
        .from('coupons')
        .select(`*`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setCoupons(data);
      }
    };
    fetchActiveCoupons();
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !user) return;
    setLoading(true);
    setStatus(null);

    try {
      // Check if coupon exists and is active
      const { data: coupon, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError || !coupon) {
        setStatus({ type: 'error', message: 'عذراً، هذا الكوبون غير متاح حالياً أو غير صالح' });
        setLoading(false);
        return;
      }

      setStatus({ type: 'success', message: `الكوبون جاهز للاستخدام في رحلتك القادمة (${coupon.discount_amount}%)!` });
      setPromoCode('');
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: 'حدث خطأ أثناء فحص الكوبون' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-[70] flex flex-col overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-8 pb-10 bg-[#1E3A8A] text-white flex items-center justify-between rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <button onClick={onBack} className={cn("w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-10", isRTL && "rotate-180")}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 z-10">
          <Ticket size={28} className="text-yellow-400" />
          العروض والكوبونات
        </h1>
        <div className="w-12 h-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 -mt-6">
        {/* Promo Input Area */}
        <section className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100 flex flex-col gap-4">
          <h2 className="text-lg font-black text-[#1E3A8A]">هل لديك كود خصم؟</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="أدخل بروموكود الخصم"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none font-bold uppercase transition-all"
              />
              {promoCode && (
                <button 
                  onClick={() => setPromoCode('')}
                  className="absolute left-3 top-4 text-gray-400"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <button 
              onClick={handleApplyPromo}
              disabled={loading || !promoCode}
              className="bg-[#1E3A8A] text-white px-6 rounded-2xl font-black shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? '...' : 'تفعيل'}
            </button>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 font-bold text-sm",
                  status.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                )}
              >
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.message}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Coupons List */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-black text-gray-800">قائمة كوبوناتك</h2>
            <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {coupons.length} متاح
            </span>
          </div>

          <div className="space-y-4 pb-20">
            {coupons.map((coupon) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={coupon.id}
                className="bg-white rounded-[1.5rem] p-6 shadow-md border-2 border-dashed border-blue-100 relative overflow-hidden group"
              >
                {/* Side Tag */}
                <div className="absolute top-0 right-0 w-2 h-full bg-[#1E3A8A]"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-[#1E3A8A]">
                    <Ticket size={24} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#1E3A8A]">
                      {coupon.discount_amount}%
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">خصم مباشر</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-gray-800">{coupon.code}</h3>
                  <p className="text-sm text-gray-500 font-bold">{coupon.description || 'احصل على خصم فوري باستخدام هذا الكوبون'}</p>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-50">
                  <div className="text-[10px] font-black text-gray-400">
                    {coupon.expires_at ? `صالح لغاية: ${new Date(coupon.expires_at).toLocaleDateString('ar-JO')}` : 'صلاحية مفتوحة'}
                  </div>
                  <button className="text-[#1E3A8A] text-xs font-black hover:underline">
                    التفاصيل
                  </button>
                </div>

                {/* Decorative Circles */}
                <div className="absolute -left-3 top-1/2 -ml-2 w-6 h-6 bg-gray-50 rounded-full border border-gray-100 z-10" />
                <div className="absolute -right-3 top-1/2 -mr-2 w-6 h-6 bg-gray-50 rounded-full border border-gray-100 z-10" />
              </motion.div>
            ))}

            {coupons.length === 0 && (
              <div className="text-center p-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">لا يوجد لديك كوبونات حالياً</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
