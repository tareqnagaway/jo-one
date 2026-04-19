import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function WalletScreen({ onBack }: { onBack: () => void }) {
  const { wallet, user, refreshProfile } = useAuth();
  const [isTopingUp, setIsTopingUp] = useState(false);
  const [topupAmount, setTopupAmount] = useState('10');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Use the env variable or fallback to sandbox 'test' client ID
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setTransactions(data);
      setIsLoadingHistory(false);
    };
    fetchTransactions();
  }, [user]);

  // Processes the top-up after PayPal confirms the successful transaction
  const processTopUpSuccess = async (amount: number) => {
    if (!user) return;
    setIsTopingUp(true);
    
    try {
      // إيداع حقيقي في قاعدة البيانات
      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + amount;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'إيداع',
          description: 'شحن رصيد إلكتروني (PayPal)'
        });

      if (txError) throw txError;

      alert('تم إتمام الدفع عبر بايبال وشحن المحفظة بنجاح! 💸');
      await refreshProfile(); 
      setTopupAmount('10'); // reset
      
      const { data } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if(data) setTransactions(data);

    } catch (err) {
      console.error('Wallet Error:', err);
      alert('تم الدفع ولكن حدث خطأ أثناء تحديث الرصيد، يرجى مراسلة الدعم الفني');
    } finally {
      setIsTopingUp(false);
    }
  };

  const handleTopUpValidation = () => {
    if (!user || !topupAmount || isNaN(parseFloat(topupAmount)) || parseFloat(topupAmount) <= 0) {
      alert("الرجاء إدخال مبلغ صحيح فوق الـ 0");
      return false;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col" dir="rtl">
      <div className="bg-[#1E3A8A] p-6 pb-8 text-white rounded-b-[2rem] shadow-lg relative z-10">
          <button onClick={onBack} className="mb-4 bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
            <ArrowLeft size={24} className="transform rotate-180" />
          </button>
          <h1 className="text-2xl font-black">المحفظة</h1>
          <p className="text-blue-100 mt-1 opacity-80 text-sm">أدر رصيدك وحركاتك المالية</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 -mt-4 relative z-0">
          
          <div className="bg-white p-6 rounded-3xl text-center shadow-lg border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <WalletIcon size={32} className="text-[#1E3A8A]" />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">الرصيد الحالي</p>
            <div className="flex items-baseline gap-1 text-[#1E3A8A]">
              <h2 className="text-4xl font-black">
                {wallet?.balance?.toFixed(3) || '0.000'}
              </h2>
              <span className="font-bold">JOD</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 space-y-4">
             <h3 className="font-bold text-gray-800">شحن الرصيد الآمن (PayPal) 1001%</h3>
             <div className="flex flex-col gap-4">
               <input 
                 type="number"
                 className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 outline-none focus:border-[#1E3A8A] text-left font-bold"
                 placeholder="المبلغ (USD) لتجربة البايبال"
                 value={topupAmount}
                 onChange={(e) => setTopupAmount(e.target.value)}
                 disabled={isTopingUp}
               />
               
               {/* 1001% Real PayPal Button Injection */}
               <div className="w-full min-h-[45px] relative z-0" dir="ltr">
                  <PayPalButtons 
                    style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                    createOrder={(data, actions) => {
                      if (!handleTopUpValidation()) {
                         throw new Error("Invalid amount");
                      }
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              currency_code: "USD",
                              value: parseFloat(topupAmount).toFixed(2),
                            },
                            description: "JO ONE - شحن محفظة",
                          },
                        ],
                      });
                    }}
                    onApprove={async (data) => {
                      try {
                        const response = await fetch('/api/capture-paypal-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            orderID: data.orderID,
                            userId: user?.id
                          }),
                        });
                        
                        const result = await response.json();
                        
                        if (result.status === "success") {
                          // Log locally for UI feedback
                          await supabase
                            .from('wallet_transactions')
                            .insert({
                              user_id: user?.id,
                              amount: parseFloat(topupAmount),
                              type: 'إيداع',
                              description: 'شحن رصيد (بايبال - حقيقي)'
                            });

                          alert('تم شحن المحفظة بنجاح! الرصيد الجديد تم تحديثه.');
                          await refreshProfile(); 
                          setTopupAmount('10');
                          
                          const { data: txData } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                          if(txData) setTransactions(txData);
                        } else {
                          alert('فشل التحقق من العملية من جهة بايبال');
                        }
                      } catch (error) {
                        console.error("PayPal Capture Error", error);
                        alert("حدث خطأ أثناء إتمام استلام الدفعة من بايبال");
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error Button:", err);
                      // Don't alert aggressively on minor UI exits
                    }}
                  />
               </div>

             </div>
          </div>
          
          <div className="pb-8">
             <h3 className="font-bold text-gray-800 mb-4 px-2">الحركات السابقة</h3>
             {isLoadingHistory ? (
               <div className="text-center p-8 text-gray-400">جاري تحميل الحركات...</div>
             ) : transactions.length === 0 ? (
               <div className="text-center p-8 text-gray-400 font-bold bg-white rounded-3xl border border-gray-100">
                 لا يوجد حركات مالية
               </div>
             ) : (
               <div className="space-y-3">
                 {transactions.map((tx) => (
                   <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'إيداع' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {tx.type === 'إيداع' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{tx.description || tx.type}</div>
                          <div className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleString('ar-JO')}</div>
                        </div>
                     </div>
                     <div className={`font-black ${tx.type === 'إيداع' ? 'text-green-600' : 'text-gray-800'}`}>
                       {tx.type === 'إيداع' ? '+' : ''}{tx.amount} JOD
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>
      </div>
  );
}
