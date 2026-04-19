import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { PaymentOptions } from './PaymentOptions';

export function WalletBalance({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // ... (Keep existing fetch logic)
    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setBalance(data.balance);
      }
      setLoading(false);
    };
    fetchBalance();

    const channel = supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (showOptions) return <PaymentOptions onBack={() => setShowOptions(false)} />;
  if (loading) return <div className="p-4 bg-blue-900 text-white rounded-2xl animate-pulse">جاري تحميل المحفظة...</div>;

  return (
    <div className="p-4 bg-blue-900 text-white rounded-2xl shadow-lg border border-white/10">
      <h3 className="text-sm opacity-70 mb-1">محفظة جو ون</h3>
      <p className="text-3xl font-black">{balance.toFixed(2)} JOD</p>
      <button 
        onClick={() => setShowOptions(true)}
        className="w-full mt-4 bg-white text-blue-900 p-3 rounded-xl font-bold hover:bg-gray-100"
      >
        شحن المحفظة
      </button>
    </div>
  );
}
