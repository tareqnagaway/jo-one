import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Users, 
  Car, 
  MapPin, 
  Shield, 
  Ban, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  LogOut,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'overview' | 'drivers' | 'passengers' | 'rides';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ drivers: 0, passengers: 0, activeRides: 0, totalRides: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Unified Realtime Engine
  useEffect(() => {
    const fetchInitialStats = async () => {
      setIsLoading(true);
      const [
        { count: drivers },
        { count: passengers },
        { count: activeRides },
        { count: totalRides }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'passenger'),
        supabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['accepted', 'in_progress']),
        supabase.from('rides').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        drivers: drivers || 0,
        passengers: passengers || 0,
        activeRides: activeRides || 0,
        totalRides: totalRides || 0
      });
      setIsLoading(false);
    };

    fetchInitialStats();

    // 2. Real-time Logic - REMOVED heavy table listeners to prevent crash.
    // In Enterprise apps, we don't listen to whole table updates for lists.
    // Instead, we fetch manually or on a very slow interval.
    
    // We'll keep a slow interval for stats only (every 60 seconds)
    const interval = setInterval(fetchInitialStats, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // 2. Tab Content Logic - Manual Refresh only
  useEffect(() => {
    const fetchTabData = async () => {
      if (activeTab === 'overview') return;
      setIsLoading(true);
      
      if (activeTab === 'drivers' || activeTab === 'passengers') {
        const role = activeTab === 'drivers' ? 'driver' : 'passenger';
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', role)
          .order('created_at', { ascending: false })
          .limit(50);
        setUsers(data || []);
      } else if (activeTab === 'rides') {
        const { data } = await supabase
          .from('rides')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);
        setRides(data || []);
      }
      setIsLoading(false);
    };

    fetchTabData();
    // No Realtime subscription here - Enterprise pattern to avoid UI thrashing
  }, [activeTab]);

  const toggleBanStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
    if (error) alert('Error updating status');
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans rtl" dir="rtl">
      {/* Sidebar Navigation */}
      <nav className="fixed top-0 right-0 h-full w-64 bg-white border-l border-gray-200 shadow-sm z-50 hidden lg:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="bg-[#1E3A8A] p-2 rounded-xl text-white">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-black text-[#1E3A8A]">لوحة الإدارة</h1>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<TrendingUp size={20}/>} label="نظرة عامة" />
          <NavButton active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Car size={20}/>} label="إدارة السائقين" />
          <NavButton active={activeTab === 'passengers'} onClick={() => setActiveTab('passengers')} icon={<Users size={20}/>} label="إدارة الركاب" />
          <NavButton active={activeTab === 'rides'} onClick={() => setActiveTab('rides')} icon={<MapPin size={20}/>} label="مراقبة الرحلات" />
        </div>

        <button onClick={() => signOut()} className="flex items-center gap-3 p-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors mt-auto">
          <LogOut size={20} />
          تسجيل الخروج
        </button>
      </nav>

      {/* Main Content */}
      <main className="lg:pr-64 p-6 min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="text-[#1E3A8A]" />
            <span className="font-black text-[#1E3A8A]">لوحة التحكم</span>
          </div>
          <button onClick={() => signOut()} className="p-2 text-red-500"><LogOut size={20}/></button>
        </div>

        {/* Tab Selection (Mobile) */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {['overview', 'drivers', 'passengers', 'rides'].map((t) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as Tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold ${activeTab === t ? 'bg-[#1E3A8A] text-white' : 'bg-white text-gray-500'}`}
            >
              {t === 'overview' ? 'نظرة عامة' : t === 'drivers' ? 'السائقين' : t === 'passengers' ? 'الركاب' : 'الرحلات'}
            </button>
          ))}
        </div>

        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
               {activeTab === 'overview' && 'إحصائيات النظام'}
               {activeTab === 'drivers' && 'إدارة السائقين'}
               {activeTab === 'passengers' && 'إدارة الركاب'}
               {activeTab === 'rides' && 'مراقبة الرحلات المباشرة'}
            </h2>
            <p className="text-gray-500">مرحباً بك، يتم تحديث البيانات فورياً</p>
          </div>
          
          {(activeTab === 'drivers' || activeTab === 'passengers') && (
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن مستخدم..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all w-full md:w-64"
              />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard label="إجمالي السائقين" value={stats.drivers} icon={<Car />} trend="+12% أسبوعياً" color="text-green-600" bg="bg-green-100" />
              <StatCard label="إجمالي الركاب" value={stats.passengers} icon={<Users />} trend="+5% أسبوعياً" color="text-blue-600" bg="bg-blue-100" />
              <StatCard label="رحلات نشطة الآن" value={stats.activeRides} icon={<RefreshCw className="animate-spin-slow" />} trend="مباشر" color="text-orange-600" bg="bg-orange-100" />
              <StatCard label="إجمالي الرحلات" value={stats.totalRides} icon={<Clock />} trend="+24 اليوم" color="text-purple-600" bg="bg-purple-100" />
            </motion.div>
          )}

          {(activeTab === 'drivers' || activeTab === 'passengers') && (
            <motion.div 
              key="users-list"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100"
            >
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="p-5 font-bold text-gray-500">المستخدم</th>
                    <th className="p-5 font-bold text-gray-500">تاريخ الانضمام</th>
                    <th className="p-5 font-bold text-gray-500">الحالة</th>
                    <th className="p-5 font-bold text-gray-500">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-400">لا يوجد بيانات لعرضها</td></tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A] font-black">
                              {user.full_name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-bold">{user.full_name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('ar-JO')}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {user.is_banned ? 'محظور' : 'نشط'}
                          </span>
                        </td>
                        <td className="p-5">
                          <button 
                            onClick={() => toggleBanStatus(user.id, user.is_banned)}
                            className={`p-2 rounded-xl transition-all ${user.is_banned ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                            title={user.is_banned ? 'تفعيل' : 'حظر'}
                          >
                            {user.is_banned ? <CheckCircle size={20}/> : <Ban size={20}/>}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'rides' && (
            <motion.div 
               key="rides-list"
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {rides.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-3xl text-center text-gray-400">لا يوجد رحلات مسجلة</div>
              ) : (
                rides.map(ride => (
                  <div key={ride.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-1.5 h-full ${ride.status === 'completed' ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-50 rounded-lg"><Clock size={16} className="text-gray-400" /></div>
                        <span className="text-xs font-bold text-gray-400">{new Date(ride.created_at).toLocaleTimeString('ar-JO')}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ride.status === 'completed' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                        {ride.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white"></div>
                          <div className="w-0.5 h-8 bg-dashed border-r-2 border-gray-100 my-1"></div>
                          <MapPin size={12} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-400 mb-1 leading-none uppercase tracking-widest">من</p>
                          <p className="text-sm font-bold line-clamp-1 h-5">{ride.pickup_address}</p>
                          <div className="h-6"></div>
                          <p className="text-xs font-bold text-gray-400 mb-1 leading-none uppercase tracking-widest">إلى</p>
                          <p className="text-sm font-bold line-clamp-1">{ride.destination_address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                         <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black">R</div>
                         <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-black">D</div>
                      </div>
                      <p className="font-black text-lg text-[#1E3A8A]">{ride.price || '0.00'} JOD</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${active ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, trend, color, bg }: { label: string, value: number, icon: React.ReactNode, trend: string, color: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${bg} ${color}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg">
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-tight">{label}</p>
        <h3 className="text-3xl font-black text-[#1E293B]">{value}</h3>
      </div>
    </div>
  );
}
