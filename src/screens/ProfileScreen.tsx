import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, History, Settings, ChevronRight, LogOut, Camera, Check, Ticket, HelpCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { WalletBalance } from '../components/WalletBalance';

import SupportScreen from './SupportScreen';

export default function ProfileScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // ... (keep other logic the same)
  
  if (showSupport) {
    return <SupportScreen onBack={() => setShowSupport(false)} />
  }

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    await refreshProfile();
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

    await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    await supabase.from('profiles').update({ profile_image: publicUrl }).eq('id', user.id);
    await refreshProfile();
  };

  return (
    <div className="p-6 pt-12 pb-32 space-y-8 bg-gray-50 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Profile Header */}
      <div className="flex items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <label className="relative cursor-pointer group">
          <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center text-[#1E3A8A] overflow-hidden border-2 border-white shadow-md transition-transform group-hover:scale-105">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-[#1E3A8A] text-white rounded-xl shadow-lg border-2 border-white">
            <Camera size={16} />
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
        </label>
        
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="font-black text-2xl text-[#1E3A8A] border-b-2 border-blue-200 outline-none w-full bg-transparent"
              />
              <button onClick={handleUpdateProfile} className="text-green-500 hover:scale-110 transition-transform">
                <Check size={24} />
              </button>
            </div>
          ) : (
            <h2 onClick={() => setIsEditing(true)} className="text-2xl font-black text-[#1E3A8A] cursor-pointer flex items-center gap-2">
              {profile?.full_name || t('profile.placeholderName')}
            </h2>
          )}
          <p className="text-gray-400 font-bold mt-1 text-sm">{user?.phone}</p>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">الرصيد والمدفوعات</h3>
        {user && <WalletBalance userId={user.id} />}
      </div>

      {/* Main Actions */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">النشاطات والخدمات</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'HISTORY', label: 'تاريخ النشاطات', icon: History, color: 'text-blue-500', bg: 'bg-blue-50' },
            { id: 'PROMOS', label: 'العروض والكوبونات', icon: Ticket, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", item.bg, item.color)}>
                  <item.icon size={24} />
                </div>
                <span className="font-black text-gray-800 text-lg">{item.label}</span>
              </div>
              <ChevronRight size={20} className={cn("text-gray-300", isRTL && "rotate-180")} />
            </button>
          ))}
        </div>
      </div>

      {/* Support & Support */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">الدعم والمعلومات</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'HELP', label: 'المساعدة والدعم', icon: HelpCircle, color: 'text-green-500', bg: 'bg-green-50' },
            { id: 'SETTINGS', label: 'الإعدادات', icon: Settings, color: 'text-purple-500', bg: 'bg-purple-50' },
            { id: 'LEGAL', label: 'معلومات قانونية', icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'SETTINGS') onNavigate('SETTINGS');
                else if (item.id === 'HELP') setShowSupport(true);
                else alert('قريباً');
              }}
              className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", item.bg, item.color)}>
                  <item.icon size={24} />
                </div>
                <span className="font-black text-gray-800 text-lg">{item.label}</span>
              </div>
              <ChevronRight size={20} className={cn("text-gray-300", isRTL && "rotate-180")} />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4">
        <button 
          onClick={() => signOut()}
          className="w-full p-6 bg-red-50 rounded-2xl flex items-center justify-center gap-3 text-red-600 font-black border border-red-100 hover:bg-red-100 transition-colors"
        >
          <LogOut size={24} />
          {t('common.logout')}
        </button>
      </div>

      {/* App Version Info */}
      <p className="text-center text-gray-300 text-xs font-bold pb-4">
        JO ONE App v1.0.4 - صنع في الأردن 🇯🇴
      </p>
    </div>
  );
}
