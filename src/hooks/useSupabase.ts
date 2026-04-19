import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Generic hook to handle Supabase real-time subscriptions
export function useSupabaseRealtime<T>(
  table: string,
  queryConditions: string = '*',
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(table).select(queryConditions);
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      
      const { data: fetchedData, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setData(fetchedData as T[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [table, queryConditions, filter]);

  useEffect(() => {
    fetchData();

    // Setup real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          console.log('Real-time change:', payload);
          fetchData(); // Simplest approach is to re-fetch on change, optimize later if needed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, table]);

  return { data, loading, error };
}
