import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRide, Location } from '../contexts/RideContext';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default function RideRequest() {
  const { t, isRTL } = useLanguage();
  const { pickup, setPickup, dropoff, setDropoff, requestRide, isLoading, estimatedFare } = useRide();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);

  const searchPlacesMapTiler = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const bbox = "34.9,29.2,39.3,33.5"; // Jordan bounds
      const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
      const lang = isRTL ? 'ar' : 'en';
      const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&bbox=${bbox}&language=${lang}`);
      const data = await response.json();
      
      if (data.features) {
        setResults(data.features.map((f: any) => ({
          id: f.id,
          main_text: f.text,
          secondary_text: f.place_name.replace(f.text, '').replace(/^, /, ''),
          full_name: f.place_name,
          coords: f.center // [lng, lat]
        })));
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchPlacesMapTiler(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (feature: any) => {
    const [lng, lat] = feature.coords;
    const loc: Location = {
      lat: lat,
      lng: lng,
      address: feature.full_name
    };

    if (activeInput === 'pickup') setPickup(loc);
    else if (activeInput === 'dropoff') setDropoff(loc);

    setSearchQuery('');
    setResults([]);
    setActiveInput(null);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
      <div className="bg-white rounded-[2rem] shadow-2xl p-6 overflow-hidden border border-gray-100">
        {/* Input Fields */}
        <div className="space-y-4 relative mb-8">
          {/* Visual Connector Line */}
          <div className={cn(
            "absolute top-10 bottom-10 w-0.5 bg-gray-100",
            isRTL ? "right-[1.4rem]" : "left-[1.4rem]"
          )} />

          <button 
            onClick={() => setActiveInput('pickup')}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-gray-50 border-2 border-transparent hover:border-primary/10 transition-all",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <div className="w-6 h-6 rounded-full border-[3px] border-primary bg-white flex-shrink-0" />
            <span className={cn("flex-1 text-sm font-black truncate", pickup ? "text-gray-800" : "text-gray-400")}>
              {pickup?.address || t('home.pickup')}
            </span>
          </button>

          <button 
            onClick={() => setActiveInput('dropoff')}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-gray-50 border-2 border-transparent hover:border-primary/10 transition-all",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <div className="w-6 h-6 rounded-[4px] bg-secondary flex-shrink-0" />
            <span className={cn("flex-1 text-sm font-black truncate", dropoff ? "text-gray-800" : "text-gray-400")}>
              {dropoff?.address || t('home.destination')}
            </span>
          </button>
        </div>

        {/* Action Button */}
        {pickup && dropoff ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
                {t('ride.estimatedFare')}
              </span>
              <span className="text-primary font-black text-lg">
                {estimatedFare?.toFixed(2) || '---'} JOD
              </span>
            </div>
            <motion.button
              layoutId="action-btn"
              onClick={() => requestRide(estimatedFare || 0, 'cash')}
              disabled={isLoading}
              className="btn-gold w-full text-lg shadow-secondary/30"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : t('home.requestRide')}
            </motion.button>
          </div>
        ) : (
          <p className="text-gray-400 text-center font-bold text-xs">
            {t('home.chooseLocation')}
          </p>
        )}
      </div>

      {/* Search Modal Overlay */}
      <AnimatePresence>
        {activeInput && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 bg-white z-[100] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
          >
            <div className="p-6 flex items-center gap-4 bg-primary text-white">
              <button 
                onClick={() => setActiveInput(null)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex-1 relative">
                <Search className={cn("absolute inset-y-0 flex items-center px-4 pointer-events-none opacity-50", isRTL ? "right-0" : "left-0")} size={18} />
                <input 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeInput === 'pickup' ? t('home.pickup') : t('home.destination')}
                  className={cn(
                    "w-full bg-white/10 py-3 rounded-full border border-white/20 focus:outline-none focus:bg-white font-bold text-sm text-gray-800 placeholder:text-white/50",
                    isRTL ? "pr-12" : "pl-12"
                  )}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                  <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                  <p className="text-gray-400 font-bold text-sm">Searching...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full p-4 text-start hover:bg-gray-50 flex items-start gap-4 transition-colors rounded-[1.5rem]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                         <MapPin className="text-secondary" size={20} />
                      </div>
                      <div>
                        <div className="font-black text-gray-800 text-sm">{r.main_text}</div>
                        <div className="text-xs text-gray-400 font-bold line-clamp-1">{r.secondary_text}</div>
                      </div>
                    </button>
                  ))}
                  {searchQuery.length >= 3 && results.length === 0 && (
                    <div className="p-12 text-center text-gray-400 font-bold">
                      No locations found in Jordan
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
