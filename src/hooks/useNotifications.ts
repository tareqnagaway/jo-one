import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // جلب الإشعارات الأولية
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false });
      
      if (!error && data) setNotifications(data);
    };

    fetchNotifications();

    // الاشتراك اللحظي
    const subscription = supabase
      .channel('notifications_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as Notification;
        // فلترة الإشعارات التي تخص المستخدم أو العامة
        if (newNotif.user_id === user.id || newNotif.user_id === null) {
          setNotifications(prev => [newNotif, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return { notifications };
};
