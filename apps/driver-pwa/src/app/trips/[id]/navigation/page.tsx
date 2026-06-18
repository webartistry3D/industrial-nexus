'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { ArrowLeft, Navigation, MapPin, Truck, Clock } from 'lucide-react';

export default function NavigationPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-4 flex items-center gap-2">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Navigation Mode</h1>
      </div>

      {/* Map */}
      <div className="h-[60vh] bg-white dark:bg-slate-800">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 dark:text-gray-400">Loading route...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
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
      <div className="bg-white dark:bg-slate-800 p-4 space-y-4 pb-24">
        {routeData && (
          <>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-slate-700 rounded-lg">
              <Navigation className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {routeData.distance ? `${(routeData.distance / 1000).toFixed(1)} km` : '--'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-slate-700 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Time</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {routeData.estimatedDuration ? `${Math.round(routeData.estimatedDuration / 60)} min` : '--'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {routeData.pickup?.address || 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600 dark:text-green-300" />
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            Open in Google Maps
          </button>
        )}
      </div>
    </div>
  );
}
