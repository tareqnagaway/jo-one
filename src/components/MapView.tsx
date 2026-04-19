import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useRide } from '../contexts/RideContext';
import { Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import L from 'leaflet';

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pickupMarker = useRef<L.Marker | null>(null);
  const userLocationMarker = useRef<L.CircleMarker | null>(null);
  const driverMarker = useRef<L.Marker | null>(null);
  const routePolyline = useRef<L.Polyline | null>(null);
  
  const { isRTL } = useLanguage();
  const { pickup, currentRide } = useRide();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize Leaflet Map
    map.current = L.map(mapContainer.current, {
      center: [31.9442, 35.9103],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      maxBounds: L.latLngBounds([29.0, 34.0], [33.5, 39.5]),
      minZoom: 7
    });

    // Dark Mode Tiles (Free CartoDB Voyager or OSM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map.current);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(pos);
        map.current?.setView(pos, 16);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userLocationMarker.current) {
      userLocationMarker.current = L.circleMarker(userLocation, {
        radius: 8,
        fillColor: "#3b82f6",
        color: "white",
        weight: 3,
        fillOpacity: 1,
      }).addTo(map.current);
    } else {
      userLocationMarker.current.setLatLng(userLocation);
    }
  }, [userLocation]);

  // Handle Pickup Marker
  useEffect(() => {
    if (!map.current) return;

    if (pickup) {
      if (!pickupMarker.current) {
        pickupMarker.current = L.marker([pickup.lat, pickup.lng], {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(map.current);
      } else {
        pickupMarker.current.setLatLng([pickup.lat, pickup.lng]);
      }
    } else {
      pickupMarker.current?.remove();
      pickupMarker.current = null;
    }
  }, [pickup]);

  const getPreciseLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(pos);
        map.current?.setView(pos, 18);
      }, () => {
        alert("يرجى تفعيل GPS للحصول على موقع دقيق.");
      });
    }
  };

  return (
    <div className="relative w-full h-[100vh] bg-slate-900">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Precise Location Button */}
      <button 
        onClick={getPreciseLocation}
        className={cn(
          "absolute top-1/2 bg-primary text-white p-4 rounded-full shadow-2xl z-[1000] font-bold",
          isRTL ? "right-6" : "left-6"
        )}
      >
        <Navigation size={20} />
      </button>

      {/* Map Overlay Shadow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] z-10" />
    </div>
  );
}
