'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Trip } from '@/types';
import { GoogleMapWrapper, useMap } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { ArrowLeft, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';

function TrackingMapOverlays({
  currentLocation,
  polyline,
  pickupLocation,
  deliveryLocation,
}: {
  currentLocation: { lat: number; lng: number } | null;
  polyline: { lat: number; lng: number }[];
  pickupLocation?: { lat: number; lng: number } | null;
  deliveryLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  if (!map) return null;
  return (
    <>
      {currentLocation && <MapMarker map={map} position={currentLocation} type="vehicle" />}
      {polyline.length > 0 && <MapPolyline map={map} id="trail" path={polyline} />}
      {pickupLocation && <MapMarker map={map} position={pickupLocation} type="pickup" label="📦" />}
      {deliveryLocation && <MapMarker map={map} position={deliveryLocation} type="delivery" label="🏠" />}
    </>
  );
}

export default function TrackingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    currentTripRef.current = currentTrip;
  }, [currentTrip]);

  // Subscribe to WebSocket room when trip is loaded
  useEffect(() => {
    if (currentTrip?.id && isConnected) {
      subscribe(`trip:${currentTrip.id}`, (data: any) => {
        if (data.tripId === currentTripRef.current?.id) {
          setCurrentLocation({ lat: data.lat, lng: data.lng });
          setTrackingHistory(prev => [...prev, { lat: data.lat, lng: data.lng, timestamp: data.timestamp }]);
        }
      });
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
    : { lat: 6.502206, lng: 3.305082 }; // TLH Logistics Hub, Ago Palace Way, Okota, Lagos

  const polyline = trackingHistory.length > 0
    ? trackingHistory.map((point: any) => ({ lat: point.lat, lng: point.lng }))
    : [];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      <main className="pt-20 px-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live Tracking</h1>
            {/* <p className="text-sm text-gray-500 dark:text-gray-400">Track your active shipments in real-time</p> */}
          </div>
        </div>

        {/* Back Button */}
        {/* <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button> */}

        {/* Map */}
        <div className="h-[50vh] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 relative overflow-hidden">
          <GoogleMapWrapper center={mapCenter} zoom={14}>
            {!loading && !error && currentTrip && (
              <TrackingMapOverlays
                currentLocation={currentLocation}
                polyline={polyline}
                pickupLocation={currentTrip.order?.pickupLocation}
                deliveryLocation={currentTrip.order?.deliveryLocation}
              />
            )}
          </GoogleMapWrapper>
          {(loading || error || !currentTrip) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm gap-3">
              {loading ? (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
              ) : error ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <Navigation className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-red-500 font-medium">{error}</p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No active trip to track</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Trip Info */}
        {currentTrip && (
          <div className="p-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatStatus(currentTrip.status)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/trips/${currentTrip.id}`)}
                  className="bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-600 dark:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* GPS & WebSocket Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Geofence Events</h3>
                <div className="space-y-2">
                  {geofenceEvents.map((evt, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        evt.eventType === 'RADIUS_C_ENTERED' ? 'bg-green-500' :
                        evt.eventType === 'RADIUS_B_ENTERED' ? 'bg-orange-500' :
                        evt.eventType === 'RADIUS_A_ENTERED' ? 'bg-yellow-500' :
                        'bg-blue-900'
                      }`} />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {formatStatus(evt.eventType)}
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
