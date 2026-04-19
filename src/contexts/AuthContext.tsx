import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { User, RealtimeChannel } from '@supabase/supabase-js';
import { Profile, DriverDetails, Wallet } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  driverDetails: DriverDetails | null;
  wallet: Wallet | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialSessionProcessed = useRef(false);
  
  const channelsRef = useRef<Record<string, RealtimeChannel>>({});

  const clearChannels = useCallback(async () => {
    await Promise.all(Object.keys(channelsRef.current).map(key => {
      return supabase.removeChannel(channelsRef.current[key]);
    }));
    channelsRef.current = {};
  }, []);

  const subscribeToChanges = useCallback((userId: string) => {
      // Clean up first to avoid duplicates
      clearChannels();

      const channels = [
        { key: `dr_${userId}`, table: 'driver_details', filter: `driver_id=eq.${userId}` },
        { key: `wa_${userId}`, table: 'wallets', filter: `user_id=eq.${userId}` },
        { key: `pr_${userId}`, table: 'profiles', filter: `id=eq.${userId}` }
      ];

      channels.forEach(ch => {
        const channel = supabase.channel(ch.key);
        
        channel.on('postgres_changes', { event: '*', schema: 'public', table: ch.table, filter: ch.filter }, (payload) => {
            if (ch.table === 'driver_details') setDriverDetails(payload.new as any);
            if (ch.table === 'wallets') setWallet(payload.new as any);
            if (ch.table === 'profiles') setProfile(payload.new as any);
        });

        // Always subscribe after setting up all listeners
        channelsRef.current[ch.key] = channel.subscribe();
      });
  }, [clearChannels]);

  const fetchFullData = useCallback(async (u: User) => {
    try {
      const fullName = u.user_metadata?.full_name || u.user_metadata?.name || 'راكب جديد';

      const [{ data: profileData }, { data: driverData }, { data: walletData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', u.id).maybeSingle(),
        supabase.from('driver_details').select('*').eq('driver_id', u.id).maybeSingle(),
        supabase.from('wallets').select('*').eq('user_id', u.id).maybeSingle()
      ]);

      let p = profileData;
      if (!p) {
         const { data: newData } = await supabase.from('profiles').upsert({ id: u.id, email: u.email || '', full_name: fullName, role: 'passenger' }).select().single();
         p = newData;
      } else if (!p.full_name) {
          const { data: updatedData } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', u.id).select().single();
          p = updatedData;
      }
      setProfile(p);
      setDriverDetails(driverData);
      setWallet(walletData);

    } catch (err) {
      console.error("Data Fetch Error:", err);
    }
  }, []);

  const [needsReset, setNeedsReset] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Emergency Reset Guard
    const timer = setTimeout(() => {
      if (isLoading) setNeedsReset(true);
    }, 5000);

    // Keep track of the current session user string to prevent duplicate fetches
    let currentSessionUserId: string | null = null;
    
    // First, fetch session synchronously
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        currentSessionUserId = currentUser?.id ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchFullData(currentUser);
          subscribeToChanges(currentUser.id);
        } else {
             setIsLoading(false); // Only set false here if no user, otherwise fetchFullData sets it implicitly via not blocking
        }
      } catch(e) {
          console.error("Initial Session Error", e);
      } finally {
          setIsLoading(false);
          clearTimeout(timer);
      }
    };
    initSession();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      const newUserId = session?.user?.id ?? null;
      
      // Ignore INITIAL_SESSION if we already processed it
      if (event === 'INITIAL_SESSION') return;
      
      if (newUserId === currentSessionUserId) {
        // Skip duplicate events that don't change the user identity
        return;
      }
      
      console.log(`Auth Event Triggered: ${event} for ${newUserId}`);
      currentSessionUserId = newUserId;
      
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await clearChannels();

        if (currentUser) {
          await fetchFullData(currentUser);
          subscribeToChanges(currentUser.id);
        } else {
          setProfile(null);
          setDriverDetails(null);
          setWallet(null);
        }
      } catch (error) {
        console.error("Auth Load Error:", error);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      authSub.unsubscribe();
      clearChannels();
    };
  }, []); // <--- Empty dependency array to run ONLY ONCE!

  const value = useMemo(() => ({
    user, profile, driverDetails, wallet, isLoading,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile: async () => { if (user) await fetchFullData(user); }
  }), [user, profile, driverDetails, wallet, isLoading, fetchFullData]);

  // Remove UI for Emergency Reset - it was causing loops for users on slow connections
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
