import React, { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import AuthScreen from './screens/AuthScreen';
import AdminDashboard from './screens/AdminDashboard';
import HomeScreen from './screens/HomeScreen';
import { RideProvider } from './contexts/RideContext';
import { Shield, Users } from 'lucide-react';
import logoWhite from './assets/logo-white.png';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// Cleanup Service Worker on startup
async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
}

export default function App() {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

  useEffect(() => {
    // إجبار المتصفح على إلغاء تسجيل الـ Service Workers وتحديث الذاكرة
    unregisterServiceWorker();
    
    // إخلاء الـ Cache من المتصفح (تحديث عنيف)
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
        <RideProvider>
          <AppContent />
        </RideProvider>
      </PayPalScriptProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, profile, isLoading } = useAuth();
  const [isAdminView, setIsAdminView] = React.useState(true);
  
  // شاشة تحميل خفيفة فقط في المرة الأولى، دون تجميد كامل
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a]">
        <img 
          src={logoWhite}
          alt="Jo One Logo" 
          className="w-32 animate-pulse"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (user?.email === 'azrtareq@gmail.com') {
    return (
      <div className="w-full h-full relative">
        {isAdminView ? <AdminDashboard /> : <HomeScreen />}
        <button 
          onClick={() => setIsAdminView(!isAdminView)}
          className="fixed bottom-24 left-6 z-[9999] bg-[#1E3A8A] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-2 font-black border-2 border-white active:scale-95 transition-transform"
        >
          {isAdminView ? <><Users size={20} /> عرض كراكب</> : <><Shield size={20} /> لوحة الإدارة</>}
        </button>
      </div>
    );
  }

  return <HomeScreen />;
}
