import React, { useState } from 'react';
import { PaypalTopupButton } from './PaypalTopupButton'; // سنستخدمه كجزء من الخيارات
import { CreditCard, Wallet, Clock } from 'lucide-react';

export function PaymentOptions({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#1E3A8A] text-white p-6 pt-20">
      <button onClick={onBack} className="mb-6 mb-6 font-bold">{"<- عودة"}</button>
      <h2 className="text-2xl font-black mb-8">اختر وسيلة الدفع</h2>
      
      <div className="space-y-4">
        {/* Active Option */}
        <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="text-yellow-400" />
            <h3 className="font-bold">PayPal</h3>
          </div>
          <PaypalTopupButton amount={10} onCapture={onBack} />
        </div>

        {/* Coming Soon Options */}
        {[
          { name: 'Visa / Mastercard', icon: CreditCard },
          { name: 'eFAWATEERcom', icon: Clock }
        ].map((option) => (
          <div key={option.name} className="p-4 bg-white/5 rounded-2xl border border-white/10 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <option.icon className="text-gray-400" />
                <h3 className="font-bold">{option.name}</h3>
              </div>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">قريباً</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
