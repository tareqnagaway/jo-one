import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Search, Banknote, Navigation, ArrowRight, Wallet, Percent } from 'lucide-react';
import { getRoute, RouteInfo } from '../services/taxiMeterService';
import { useRide } from '../contexts/RideContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export default function TaxiBookingSheet({ onBook, onBack }: { onBook: () => void, onBack?: () => void }) {
  const { requestRide, setPickup, setDropoff, setDistance, pickup, dropoff, estimatedFare, distance } = useRide();
  const { wallet } = useAuth(); // جلب المحفظة من AuthContext

  const [pickupInput, setPickupInput] = useState(pickup?.address || '');
  const [destinationInput, setDestinationInput] = useState(dropoff?.address || '');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeSearch, setActiveSearch] = useState<'pickup' | 'dest' | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // حالة الكوبون وطريقة الدفع
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // حساب الأجرة النهائية الجاهزة للخصم إذا وُجد
  const baseFare = estimatedFare || 0;
  const finalFare = baseFare - (baseFare * (appliedDiscount / 100));

  // Auto-calculate fare when locations are set
  useEffect(() => {
    if (pickup && dropoff) {
      handleCalculateFare();
    }
  }, [pickup, dropoff]);

  const handleCalculateFare = async () => {
    setIsCalculating(true);
    try {
      const route = await getRoute([pickup!.lng, pickup!.lat], [dropoff!.lng, dropoff!.lat]);
      setRouteInfo(route);
      setDistance(route.distance * 1000); 
    } catch (err) {
      console.error("Fare calculation failed", err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSearch = async (query: string, type: 'pickup' | 'dest') => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      // استخدام Nominatim مع فرض اللغة العربية وتحديد الأردن فقط
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=jo&accept-language=ar&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      // توحيد شكل البيانات ليناسب واجهة التطبيق
      const formattedResults = data.map((item: any) => ({
        properties: {
          name: item.display_name.split(',')[0], // أخذ الاسم الأول كعنوان رئيسي
          city: item.display_name.split(',')[1] || '',
          full: item.display_name
        },
        geometry: {
          coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
        }
      }));

      setSearchResults(formattedResults);
      setActiveSearch(type);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const selectLocation = (feature: any) => {
    const name = feature.properties.name || "موقع محدد";
    const coords = feature.geometry.coordinates; // [lon, lat]
    const location = { lat: coords[1], lng: coords[0], address: name };

    if (activeSearch === 'pickup') {
      setPickupInput(name);
      setPickup(location);
    } else {
      setDestinationInput(name);
      setDropoff(location);
    }
    setSearchResults([]);
    setActiveSearch(null);
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    
    // 1. فحص هل الكوبون موجود ومفعل
    const { data: coupon, error } = await supabase
        .from('coupons')
        .select('discount_amount, is_active')
        .eq('code', couponCode.toUpperCase())
        .maybeSingle();

    if (error || !coupon) {
        alert('الكوبون غير صحيح أو غير موجود.');
        setAppliedDiscount(0);
        return;
    }

    if (!coupon.is_active) {
        alert('هذا الكوبون غير فعال حالياً.');
        setAppliedDiscount(0);
        return;
    }

    // 2. تطبيق الخصم 
    setAppliedDiscount(coupon.discount_amount);
    alert(`تم تطبيق خصم ${coupon.discount_amount}% بنجاح!`);
  };

  const handleBook = async () => {
    if (!pickup || !dropoff) return;
    
    // التحقق من الرصيد إذا اختار الدفع بالمحفظة
    if (paymentMethod === 'wallet') {
      const currentBalance = wallet?.balance || 0;
      if (currentBalance < finalFare) {
         alert(`عذراً، رصيد المحفظة (${currentBalance.toFixed(2)} دينار) لا يكفي لتغطية أجرة الرحلة (${finalFare.toFixed(2)} دينار). سيتم التحويل للدفع نقداً.`);
         setPaymentMethod('cash');
         return; // Require user to click again to confirm cash
      }
    }

    setIsProcessing(true);
    try {
        await requestRide(finalFare, paymentMethod);
        onBook();
    } catch(e: any) {
        alert(e.message || "حدث خطأ غير معروف أثناء الطلب");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 200 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[10000] bg-[#1E3A8A] text-white rounded-t-[2.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.5)] p-6 pb-10 max-h-[90vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black">اطلب تاكسي</h2>
        {onBack && (
            <button onClick={onBack} className="p-2 bg-white/10 rounded-full">
            <ArrowRight size={24} />
            </button>
        )}
      </div>
      
      <div className="space-y-4 relative">
        {/* Pickup Input */}
        <div className="relative">
          <input 
            className="w-full bg-white/10 p-4 rounded-2xl placeholder-white/40 border border-white/10 outline-none focus:border-yellow-400 font-medium transition-colors text-right"
            placeholder="موقع الانطلاق"
            value={pickupInput}
            onChange={(e) => { setPickupInput(e.target.value); handleSearch(e.target.value, 'pickup'); }}
          />
        </div>

        {/* Dropoff Input */}
        <div className="relative">
          <input 
            className="w-full bg-white/10 p-4 rounded-2xl placeholder-white/40 border border-white/10 outline-none focus:border-yellow-400 font-medium transition-colors text-right"
            placeholder="إلى أين؟"
            value={destinationInput}
            onChange={(e) => { setDestinationInput(e.target.value); handleSearch(e.target.value, 'dest'); }}
          />
        </div>

        {/* Floating Search Results */}
        {(activeSearch && searchResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden z-50">
            {searchResults.map((f, i) => (
              <button key={i} onClick={() => selectLocation(f)} className="w-full p-4 text-right border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50">
                <MapPin size={18} className="text-blue-600 flex-shrink-0" />
                <span className="truncate font-medium">{f.properties.name || f.properties.street} {f.properties.city ? `- ${f.properties.city}` : ''}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Route Info Overlay */}
        {routeInfo && !isCalculating && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 pt-2">
            <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-sm">
              <span className="text-[10px] block opacity-60 uppercase tracking-widest mb-1">المسافة</span>
              <span className="text-xl font-bold">{routeInfo.distance.toFixed(1)} <span className="text-sm opacity-80">كم</span></span>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-sm">
              <span className="text-[10px] block opacity-60 uppercase tracking-widest mb-1">الوقت المتوقع</span>
              <span className="text-xl font-bold">{Math.round(routeInfo.duration)} <span className="text-sm opacity-80">دقيقة</span></span>
            </div>
          </div>
        )}
      </div>

      {routeInfo && !isCalculating && (
        <div className="mt-6 space-y-4 animate-in fade-in">
            {/* Coupon System */}
            <div className="relative">
                <input 
                    className="w-full bg-white/10 p-3 pr-4 pl-24 rounded-xl placeholder-white/50 border border-white/20 outline-none focus:border-yellow-400 text-sm placeholder:text-right text-right"
                    placeholder="كود الخصم (إن وجد)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={appliedDiscount > 0}
                    dir="rtl"
                />
                {!appliedDiscount ? (
                   <button 
                       onClick={applyCoupon}
                       className="absolute left-2 top-1.5 bg-white/20 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-white/30 transition-colors"
                   >
                       تطبيق
                   </button>
                ) : (
                   <div className="absolute left-3 top-3 flex items-center gap-1 text-green-400 font-bold text-sm">
                     <Percent size={16} /> خصم مُفعل
                   </div>
                )}
            </div>

            {/* Payment Method Toggle */}
            <div className="bg-white/10 p-1.5 rounded-xl flex gap-1">
                <button 
                   onClick={() => setPaymentMethod('cash')}
                   className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${paymentMethod === 'cash' ? 'bg-white text-[#1E3A8A] shadow-md transform scale-[1.02]' : 'text-white/70 hover:bg-white/5'}`}
                >
                   <Banknote size={18} /> نقداً
                </button>
                <button 
                   onClick={() => setPaymentMethod('wallet')}
                   className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${paymentMethod === 'wallet' ? 'bg-white text-[#1E3A8A] shadow-md transform scale-[1.02]' : 'text-white/70 hover:bg-white/5'}`}
                >
                   <Wallet size={18} /> 
                   <div className="flex flex-col text-right leading-none">
                     <span>المحفظة</span>
                     {wallet && <span className="text-[9px] opacity-70 mt-0.5">{wallet.balance.toFixed(2)} JOD</span>}
                   </div>
                </button>
            </div>
        </div>
      )}

      {/* Auto-calculated Fare */}
      {estimatedFare !== null && !isCalculating && (
        <div className="mt-5 p-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#1E3A8A] rounded-3xl flex justify-between items-center shadow-xl animate-in zoom-in-95">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                {appliedDiscount > 0 ? `الأجرة بعد خصم ${appliedDiscount}%` : 'المقدار التقديري (عداد)'}
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{finalFare.toFixed(2)}</span>
                <span className="text-sm font-bold">JOD</span>
            </div>
            {appliedDiscount > 0 && <span className="text-xs line-through opacity-50 mt-1">{baseFare.toFixed(2)} JOD</span>}
          </div>
          {paymentMethod === 'wallet' ? <Wallet size={48} className="opacity-20" /> : <Banknote size={48} className="opacity-20" />}
        </div>
      )}
      
      {/* Big Action Button */}
      <button 
        onClick={handleBook}
        disabled={!routeInfo || isCalculating || isProcessing}
        className="relative w-full mt-6 bg-white text-[#1E3A8A] p-5 rounded-3xl font-black text-lg overflow-hidden group disabled:opacity-50 disabled:scale-100 active:scale-[0.98] transition-all"
      >
        <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex justify-center items-center gap-2">
            {isProcessing ? (
                <span className="animate-pulse">جاري تثبيت الطلب...</span>
            ) : isCalculating ? (
                <span className="animate-pulse">جاري الحساب...</span>
            ) : (
                <>
                <span>تأكيد {paymentMethod === 'wallet' ? 'والدفع من المحفظة' : 'الطلب الدفع نقداً'}</span>
                <ArrowRight size={20} className="transform -scale-x-100" />
                </>
            )}
        </div>
      </button>
    </motion.div>
  );
}
