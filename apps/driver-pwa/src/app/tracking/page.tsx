'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { ArrowLeft, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export default function TrackingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchActiveTrip();
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
        
        // Watch for location updates
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            // Update location to server if on active trip
            if (currentTrip?.status === 'IN_TRANSIT') {
              api.updateLocation(
                currentTrip.id,
                position.coords.latitude,
                position.coords.longitude,
                position.coords.accuracy
              );
            }
          },
          (err) => console.error('Geolocation watch error:', err)
        );

        return () => navigator.geolocation.clearWatch(watchId);
      }
    }
  }, [user]);

  const fetchActiveTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMyTrips();
      const activeTrip = response.data.find((t: Trip) => t.status === 'IN_TRANSIT' || t.status === 'ASSIGNED');
      if (activeTrip) {
        setCurrentTrip(activeTrip);
        await fetchTrackingHistory(activeTrip.id);
      }
    } catch (err) {
      console.error('Failed to fetch active trip:', err);
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingHistory = async (tripId: string) => {
    try {
      const history = await api.getTripTrackingHistory(tripId, 50);
      setTrackingHistory(history || []);
    } catch (err) {
      console.error('Failed to fetch tracking history:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActiveTrip();
    setRefreshing(false);
  };

  const mapCenter = currentLocation || currentTrip?.order?.deliveryLocation
    ? { 
        lat: currentLocation?.lat || currentTrip.order.deliveryLocation.lat, 
        lng: currentLocation?.lng || currentTrip.order.deliveryLocation.lng 
      }
    : { lat: 6.5244, lng: 3.3792 };

  const polyline = trackingHistory.length > 0
    ? trackingHistory.map((point: any) => ({ lat: point.lat, lng: point.lng }))
    : [];

  return (
    <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900">
      <PageHeader />

      <main className="p-4">
        {/* Back Button */}
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Map */}
        <div className="h-[50vh] bg-white dark:bg-slate-800">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : !currentTrip ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 dark:text-gray-400">No active trip to track</p>
            </div>
          ) : (
            <GoogleMapWrapper center={mapCenter} zoom={14}>
              {currentLocation && (
                <MapMarker position={currentLocation} type="current" label="📍" />
              )}
              {polyline.length > 0 && <MapPolyline path={polyline} />}
              {currentTrip.order?.pickupLocation && (
                <MapMarker position={currentTrip.order.pickupLocation} type="pickup" label="📦" />
              )}
              {currentTrip.order?.deliveryLocation && (
                <MapMarker position={currentTrip.order.deliveryLocation} type="delivery" label="🏠" />
              )}
            </GoogleMapWrapper>
          )}
        </div>

        {/* Trip Info */}
        {currentTrip && (
          <div className="p-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-3">
                Trip {currentTrip.order?.orderNumber}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentTrip.order?.pickupLocation?.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentTrip.order?.deliveryLocation?.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {currentTrip.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/trips/${currentTrip.id}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* GPS Status */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${currentLocation ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">GPS Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentLocation ? 'Active' : 'Not Available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
