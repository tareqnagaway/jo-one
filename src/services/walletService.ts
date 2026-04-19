import { supabase } from './supabase';

export const getWalletBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle to avoid 406 error if record not found

  if (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
  return data;
};
