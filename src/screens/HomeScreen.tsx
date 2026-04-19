import React, { useState } from 'react';
import { 
  Home, 
  List, 
  User, 
  Car, 
  Lock, 
  ArrowLeft,
  ChevronLeft,
  Star,
  Clock,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useRide } from '../contexts/RideContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePassengerContent } from '../hooks/usePassengerContent';
import logo from '../assets/logo.png';

// Screens
import ProfileScreen from './ProfileScreen';
import HistoryScreen from './HistoryScreen';
import WalletScreen from './WalletScreen';
import RatingScreen from './RatingScreen';
import PromosScreen from './PromosScreen';

// Components for the Taxi Flow
import MapView from '../components/MapView';
import TaxiBookingSheet from '../components/TaxiBookingSheet';
import RideRequest from '../components/RideRequest';
import RadarScreen from '../components/RadarScreen';
import DriverCard from '../components/DriverCard';
import PromoCarousel from '../components/PromoCarousel';
import ActiveServiceBar from '../components/ActiveServiceBar';

/**
 * JO ONE Home Screen
 * Redesigned according to Jordanian multi-service super app requirements.
 */
export default function HomeScreen() {
  const [activeScreen, setActiveScreen] = useState<'home' | 'activities' | 'account' | 'promos'>('home');
  const [activeService, setActiveService] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Taxi Flow State
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null);

  const { user, profile } = useAuth();
  const { currentRide } = useRide();
  const { wallet } = useDashboardData();
  const { setPickup, setDropoff } = useRide();
  
  // CMS Dynamic content
  const { content, loading, error } = usePassengerContent();

  if (loading) return <div className="p-10 text-center">جاري تحميل إعدادات التطبيق...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  // If there is an active ride, show Radar/Matching screen automatically
  if (currentRide && activeService === 'taxi') {
    return <RadarScreen />;
  }

  const getSuggestions = async (input: string) => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    try {
      const bbox = "34.9,29.2,39.3,33.5";
      const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(input)}.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}&bbox=${bbox}&language=ar`);
      const data = await response.json();
      
      const filteredResults = (data.features || []).filter((f: any) => {
         const name = f.place_name || "";
         return name.includes("الأردن") || name.includes("Jordan");
      });
      
      setSuggestions(filteredResults);
    } catch (e) {
      console.error("Geocoding failed", e);
    }
  };

  const handleSelect = (feature: any) => {
    const [lng, lat] = feature.center;
    const location = { lat, lng, address: feature.place_name };
    
    if (activeField === 'pickup') {
      setPickup(location);
      setPickupInput(feature.place_name);
    } else {
      setDropoff(location);
      setDropoffInput(feature.place_name);
    }
    setSuggestions([]);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        // Precise location retrieved
      });
    }
  };

  // Handle Taxi Service View
  if (activeService === 'taxi') {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-gray-900" dir="rtl">
        <MapView />

        {/* Map Interactive Features */}
        <button 
          onClick={handleCurrentLocation}
          className="absolute top-20 left-4 z-40 p-3 bg-white rounded-full shadow-lg"
        >
          <MapPin size={20} className="text-blue-600" />
        </button>

        {/* Radar Effect on Map */}
        <div className="absolute top-1/2 left-1/2 -ml-24 -mt-24 w-48 h-48 border-4 border-blue-500/30 rounded-full animate-ping z-30 pointer-events-none"></div>

        <TaxiBookingSheet onBook={() => console.log('Booking requested')} onBack={() => setActiveService(null)} />
      </div>
    );
  }

  // Define active services here
  const allServices = [
    { name: 'تاكسي', id: 'taxi', icon: Car, active: true },
    { name: 'توصيل طلبات', id: 'delivery', icon: List, active: false },
    { name: 'تنظيف', id: 'cleaning', icon: User, active: false }
  ];

  const activeServices = allServices.filter(s => s.active);
  const filteredServices = searchQuery 
    ? activeServices.filter(service => service.name.includes(searchQuery))
    : [];

  const handleServiceClick = (serviceId: string) => {
    setActiveService(serviceId);
  };

  const renderHome = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24" dir="rtl">
      
      {/* Search Bar */}
      <div className="px-6 pt-6 bg-[#1E3A8A]">
         <div className="relative w-full">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن خدمتك..." 
              className="w-full bg-white/20 text-white placeholder-blue-100 p-4 pr-12 rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <div className="absolute right-4 top-4 text-white/70">
              <LayoutGrid size={20} />
            </div>
         </div>
         
         {/* Dynamic Search Results */}
         {searchQuery && (
           <div className="mt-4 bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
             {filteredServices.length > 0 ? (
               filteredServices.map(service => (
                 <button 
                   key={service.id}
                   onClick={() => handleServiceClick(service.id)}
                   className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                 >
                   <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#1E3A8A]">
                     <service.icon size={20} />
                   </div>
                   <span className="font-bold text-gray-800">{service.name}</span>
                 </button>
               ))
             ) : (
               <div className="p-4 text-center text-gray-500">لا توجد خدمات مطابقة</div>
             )}
           </div>
         )}
      </div>

      {/* HEADER */}
      <div className="bg-[#1E3A8A] text-white p-6 pt-4 rounded-b-[2rem] shadow-xl relative overflow-hidden">
        {/* Decor Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-24 h-24 bg-white rounded-3xl mb-4 flex items-center justify-center p-3 shadow-lg transform rotate-3 transition-transform hover:rotate-0">
            <img src={logo} alt="JO ONE" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight mb-1">{content['home_branding_title'] || 'JO ONE'}</h1>
            <p className="text-blue-100 text-sm font-medium opacity-90">{profile?.full_name ? `أهلاً بك، ${profile.full_name}` : content['home_welcome_text'] || 'أهلاً بك، راكبنا العزيز'}</p>
          </div>
        </div>

        {/* JO ONE Branding Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl relative z-10 text-center">
          <div className="flex justify-center mb-3">
             <img src="https://flagcdn.com/jo.svg" alt="Jordan Flag" className="w-12 h-8 rounded shadow-md" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">{content['home_banner_title'] || 'من الأردن للعالم'}</h2>
          <p className="text-blue-100 text-sm font-medium">{content['home_banner_desc'] || 'نحن بوابتك لخدمات ذكية وسريعة، نصنعها بأيدٍ أردنية لنقدمها بمستوى عالمي.'}</p>
        </div>
      </div>

      <div className="p-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ACTIVE SERVICES */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-black text-[#1E3A8A]">الخدمات المتوفرة</h2>
          </div>
          
          <div className="space-y-4">
            {activeServices.map(service => (
              <button 
                 key={service.id}
                 onClick={() => setActiveService(service.id)}
                 className="w-full bg-white group p-6 rounded-[1.5rem] shadow-lg shadow-blue-900/5 flex items-center gap-6 border border-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden text-right"
              >
                {/* Background Accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-[#1E3A8A]"></div>
                
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] transition-transform group-hover:scale-110">
                  <service.icon size={40} strokeWidth={2.5} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-[#1E3A8A] mb-1">احجز {service.name} الآن</h3>
                  <p className="text-gray-500 text-sm">رحلات سريعة، آمنة وموثوقة بنقرة زر.</p>
                  <div className="flex items-center gap-2 mt-3 text-[#1E3A8A] font-bold text-sm">
                    <span>اطلب الآن</span>
                    <ChevronLeft size={16} className="mt-0.5 transform -translate-x-0 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6">
            <PromoCarousel />
          </div>
        </section>

        {/* COMING SOON SERVICES GRID */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-black text-gray-400">قريباً</h2>
            <LayoutGrid size={18} className="text-gray-300" />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center aspect-square shadow-sm border border-gray-50 opacity-40 grayscale select-none"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">قريباً</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case 'activities': 
        return <HistoryScreen onBack={() => setActiveScreen('home')} />;
      case 'account': 
        return <ProfileScreen onNavigate={(screen) => {
          if (screen === 'HISTORY') setActiveScreen('activities');
          if (screen === 'PROMOS') setActiveScreen('promos');
        }} />;
      case 'promos':
        return <PromosScreen onBack={() => setActiveScreen('account')} />;
      default: 
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ActiveServiceBar />
      {renderScreen()}
      
      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 h-18 bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-around items-center z-50 px-4 pb-2">
        {[
          { id: 'home', icon: Home, label: 'الرئيسية' },
          { id: 'activities', icon: List, label: 'نشاطاتك' },
          { id: 'account', icon: User, label: 'حسابك' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveScreen(item.id as any)}
            className="relative flex flex-col items-center gap-1.5 pt-3 pb-1 flex-1 transition-all"
          >
            {activeScreen === item.id && (
              <motion.div 
                layoutId="nav-active"
                className="absolute top-0 w-8 h-1 bg-[#1E3A8A] rounded-full"
              />
            )}
            <item.icon 
              size={22} 
              className={cn(
                "transition-colors", 
                activeScreen === item.id ? "text-[#1E3A8A]" : "text-gray-400"
              )} 
            />
            <span className={cn(
              "text-[10px] font-bold transition-colors", 
              activeScreen === item.id ? "text-[#1E3A8A]" : "text-gray-400"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
