import React from 'react';
import { Wallet as WalletIcon, Plus } from 'lucide-react';

export default function WalletWidget({ balance, currency }: { balance: number | null, currency: string }) {
  return (
    <div className="bg-primary/95 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between mt-4 mx-4">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-2xl">
          <WalletIcon size={24} />
        </div>
        <div>
          <p className="text-white/70 text-sm">رصيد المحفظة</p>
          <h2 className="text-2xl font-black">
            {balance !== null ? `${balance.toFixed(2)} ${currency}` : '---'}
          </h2>
        </div>
      </div>
      <button className="bg-white text-primary p-3 rounded-2xl">
        <Plus size={24} />
      </button>
    </div>
  );
}
