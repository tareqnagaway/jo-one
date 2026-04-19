import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWalletBalance } from '../services/walletService';
import { fetchActivities } from '../services/activityService';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useDashboardData = () => {
  const { profile } = useAuth();
  const [wallet, setWallet] = useState<{balance: number} | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const channels = useRef<{ wallet?: RealtimeChannel, activity?: RealtimeChannel }>({});

  useEffect(() => {
    if (!profile?.id) return;

    const setup = async () => {
      // 1. Fetch initial essential data only
      const walletData = await getWalletBalance(profile.id);
      setWallet(walletData);

      // 2. Setup real-time listeners - Selective Enterprise Pattern
      if (!channels.current.wallet) {
        const walletChan = supabase
          .channel(`wallet:${profile.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'wallets', 
            filter: `user_id=eq.${profile.id}` 
          }, (payload) => {
            if (payload.new) setWallet(payload.new as any);
          })
          .subscribe();
        channels.current.wallet = walletChan;
      }

      // We DON'T listen to activities real-time here. 
      // Activities list is historical. High-performance apps only refresh on demand.
    }

    setup();

    return () => {
      if (channels.current.wallet) {
        supabase.removeChannel(channels.current.wallet);
        channels.current.wallet = undefined;
      }
      if (channels.current.activity) {
        supabase.removeChannel(channels.current.activity);
        channels.current.activity = undefined;
      }
    };
  }, [profile?.id]);

  return { wallet, activities };
};
