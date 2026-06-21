'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { ArrowLeft, Navigation, MapPin, Truck, Clock } from 'lucide-react';

export default function NavigationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const params = useParams();
  const [routeData, setRouteData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchRouteData();
    // Get current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => console.error('Geolocation error:', err)
      );
    }
  }, []);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTripRoute(params.id as string);
      setRouteData(data);
    } catch (err) {
      console.error('Failed to fetch route:', err);
      setError('Failed to load navigation data');
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = currentLocation || routeData?.pickup
    ? { lat: currentLocation?.lat || routeData.pickup.lat, lng: currentLocation?.lng || routeData.pickup.lng }
    : { lat: 6.5244, lng: 3.3792 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-4 flex items-center gap-2 border-b border-slate-700/50">
        <button onClick={() => router.back()} className="text-white hover:text-blue-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Navigation Mode</h1>
      </div>

      {/* Map */}
      <div className="h-[60vh] bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading route...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : routeData ? (
          <GoogleMapWrapper center={mapCenter} zoom={14}>
            {currentLocation && (
              <MapMarker position={currentLocation} type="current" label="📍" />
            )}
            {routeData.polyline && <MapPolyline path={routeData.polyline} />}
            {routeData.pickup && (
              <MapMarker position={routeData.pickup} type="pickup" label="📦" />
            )}
            {routeData.delivery && (
              <MapMarker position={routeData.delivery} type="delivery" label="🏠" />
            )}
          </GoogleMapWrapper>
        ) : null}
      </div>

      {/* Navigation Info */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-4 space-y-4 pb-24">
        {routeData && (
          <>
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-slate-600/50">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono">
                  {routeData.distance ? `${(routeData.distance / 1000).toFixed(1)} km` : '--'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-slate-600/50">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Time</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono">
                  {routeData.estimatedDuration ? `${Math.round(routeData.estimatedDuration / 60)} min` : '--'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {routeData.pickup?.address || 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {routeData.delivery?.address || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Open in Google Maps Button */}
        {routeData?.pickup && routeData?.delivery && (
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&origin=${routeData.pickup.lat},${routeData.pickup.lng}&destination=${routeData.delivery.lat},${routeData.delivery.lng}&travelmode=driving`;
              window.open(url, '_blank');
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Navigation className="w-5 h-5" />
            Open in Google Maps
          </button>
        )}
      </div>
    </div>
  );
}
