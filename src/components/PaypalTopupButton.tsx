import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export function PaypalTopupButton({ amount, onCapture }: { amount: number, onCapture: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [{ isPending }] = usePayPalScriptReducer();

  const handleCapture = async (orderId: string) => {
    try {
      const response = await fetch('/api/capture-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderID: orderId,
          userId: user?.id
        }),
      });
      
      const result = await response.json();
      
      if (result.status === "success") {
        // Log transaction in Supabase
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: user?.id,
            amount: amount,
            type: 'إيداع',
            description: 'PayPal Top-up (Real)'
          });

        alert('تم شحن المحفظة بنجاح!');
        await refreshProfile();
        onCapture();
      } else {
        alert('فشلت عملية التحقق من الدفع');
      }
    } catch (error) {
      console.error('Capture Error:', error);
      alert('حدث خطأ أثناء تأكيد الدفعة');
    }
  };

  if (!user) return null;

  return (
    <div className="w-full min-h-[50px] mt-4">
      {isPending && <div className="p-4 bg-gray-100 rounded-xl text-center animate-pulse text-gray-400">جاري تحميل أزرار بايبال...</div>}
      <PayPalButtons 
        style={{ layout: "horizontal", color: "blue", shape: "pill", label: "pay", height: 45 }}
        createOrder={async () => {
          const response = await fetch('/api/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
          });
          const order = await response.json();
          return order.id;
        }}
        onApprove={async (data) => {
          await handleCapture(data.orderID);
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
        }}
      />
    </div>
  );
}
