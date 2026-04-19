import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const usePassengerContent = () => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Safety Timeout: Prevent the loading screen from freezing the app infinitely
    // If the network or ServiceWorker hangs during reload, we bypass after 3 seconds.
    const failsafe = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 3000);

    // جلب البيانات الأولية
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.from('admin_content').select('key, value');
        if (error) throw error;
        
        if (!mounted) return;
        
        const contentMap: Record<string, string> = {};
        if (data) {
          data.forEach(item => {
            contentMap[item.key] = item.value;
          });
        }
        setContent(contentMap);
      } catch (e: any) {
        if (mounted) setError('تعذر تحميل إعدادات المحتوى من الخادم');
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(failsafe);
      }
    };

    fetchContent();

    // الاشتراك اللحظي في تحديثات الجداول
    const subscription = supabase
      .channel('admin_content_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_content' }, (payload: any) => {
        if (!mounted) return;
        if (payload.eventType === 'DELETE') {
          setContent(prev => {
            const next = { ...prev };
            delete next[payload.old.key];
            return next;
          });
        } else {
          const newData = payload.new as { key: string, value: string };
          setContent(prev => ({ ...prev, [newData.key]: newData.value }));
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return { content, loading, error };
};
