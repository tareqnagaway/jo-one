import { supabase } from './supabase';

export const fetchActivities = async (userId: string) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5); // ONLY fetch the 5 most recent activities to prevent crash

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
  return data || [];
};
