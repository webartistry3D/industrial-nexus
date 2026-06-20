'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { ArrowLeft, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';

export default function TrackingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [geofenceEvents, setGeofenceEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTripRef = useRef<Trip | null>(null);
  const { subscribe, isConnected } = useTrackingWebSocket();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    currentTripRef.current = currentTrip;
  }, [currentTrip]);

  // Subscribe to WebSocket room when trip is loaded
  useEffect(() => {
    if (currentTrip?.id && isConnected) {
      subscribe(`trip:${currentTrip.id}`, () => {});
    }
  }, [currentTrip?.id, isConnected, subscribe]);

  // Listen for real-time location and geofence events from WebSocket
  useEffect(() => {
    subscribe('location:update', (data: any) => {
      if (data.tripId === currentTripRef.current?.id) {
        setCurrentLocation({ lat: data.lat, lng: data.lng });
        setTrackingHistory(prev => [...prev, { lat: data.lat, lng: data.lng, timestamp: data.timestamp }]);
      }
    });
    subscribe('geofence:event', (data: any) => {
      if (data.tripId === currentTripRef.current?.id) {
        setGeofenceEvents(prev => [data, ...prev].slice(0, 10));
      }
    });
  }, [subscribe]);

  useEffect(() => {
    if (user) {
      fetchActiveTrip();
      // Watch for location updates and send to backend
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
        
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const trip = currentTripRef.current;
            if (trip?.status === 'IN_TRANSIT') {
              api.updateLocation(
                trip.id,
                position.coords.latitude,
                position.coords.longitude,
                position.coords.accuracy
              );
            }
          },
          (err) => console.error('Geolocation watch error:', err),
          { enableHighAccuracy: true, maximumAge: 10000 }
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

  const mapCenter = currentLocation
    ? { lat: currentLocation.lat, lng: currentLocation.lng }
    : currentTrip?.order?.deliveryLocation
    ? { lat: currentTrip.order.deliveryLocation.lat, lng: currentTrip.order.deliveryLocation.lng }
    : { lat: 6.5244, lng: 3.3792 };

  const polyline = trackingHistory.length > 0
    ? trackingHistory.map((point: any) => ({ lat: point.lat, lng: point.lng }))
    : [];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      <main className="p-4">
        {/* Back Button */}
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Map */}
        <div className="h-[50vh] bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading map...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : !currentTrip ? (
            <div className="flex items-center justify-center h-full">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No active trip to track</p>
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
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 font-mono">
                Trip {currentTrip.order?.orderNumber}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentTrip.order?.pickupLocation?.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
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
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {currentTrip.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/trips/${currentTrip.id}`)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* GPS & WebSocket Status */}
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${currentLocation ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">GPS Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {currentLocation ? 'Active' : 'Not Available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{isConnected ? 'Live' : 'Connecting...'}</p>
                </div>
              </div>
            </div>

            {/* Geofence Events */}
            {geofenceEvents.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Geofence Events</h3>
                <div className="space-y-2">
                  {geofenceEvents.map((evt, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        evt.eventType === 'RADIUS_C_ENTERED' ? 'bg-green-500' :
                        evt.eventType === 'RADIUS_B_ENTERED' ? 'bg-orange-500' :
                        evt.eventType === 'RADIUS_A_ENTERED' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {evt.eventType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 ml-auto text-xs font-mono">
                        {evt.distance ? `${Math.round(evt.distance)}m` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
