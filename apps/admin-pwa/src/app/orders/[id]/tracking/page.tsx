'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { Navigation, MapPin, Battery, Activity, ArrowLeft } from 'lucide-react';
import { Order } from '@/types';

interface PackageTrackerData {
  orderId: string;
  packageTrackerId: string;
  packageTracker?: {
    id: string;
    deviceId: string;
    name?: string;
    status: string;
    batteryLevel?: number;
    lastLat?: number;
    lastLng?: number;
    lastSeenAt?: string;
  };
  location?: {
    packageTrackerId: string;
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp: string;
  };
}

export default function PackageTrackingPage() {
  const { isConnected, subscribe, unsubscribe } = useTrackingWebSocket();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [trackerData, setTrackerData] = useState<PackageTrackerData | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trail, setTrail] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchTrackerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderData, tracker] = await Promise.all([
        api.getOrder(orderId),
        api.getPackageLocationByOrderId(orderId),
      ]);
      setOrder(orderData);
      if (!tracker?.packageTrackerId) {
        setError('No package tracker assigned to this order');
        return;
      }
      setTrackerData(tracker);
      if (tracker.location) {
        setTrail(prev => [...prev, { lat: tracker.location.lat, lng: tracker.location.lng }]);
      }
    } catch (err) {
      console.error('Failed to fetch package tracker data:', err);
      setError('Failed to load package tracking data');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTrackerData();
  }, [fetchTrackerData]);

  const handleLocationUpdate = useCallback((data: any) => {
    console.log('[Package Tracking] Received location update:', data);
    setTrackerData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        location: {
          packageTrackerId: data.packageTrackerId,
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp,
        },
      };
    });
    setTrail((prev) => [...prev, { lat: data.lat, lng: data.lng }]);
  }, []);

  useEffect(() => {
    if (isConnected && trackerData?.packageTrackerId) {
      subscribe(`package:${trackerData.packageTrackerId}`, handleLocationUpdate);
    }
    return () => {
      if (trackerData?.packageTrackerId) {
        unsubscribe(`package:${trackerData.packageTrackerId}`);
      }
    };
  }, [isConnected, trackerData?.packageTrackerId, subscribe, unsubscribe, handleLocationUpdate]);

  const mapCenter = trackerData?.location
    ? { lat: trackerData.location.lat, lng: trackerData.location.lng }
    : trackerData?.packageTracker?.lastLat && trackerData?.packageTracker?.lastLng
      ? { lat: trackerData.packageTracker.lastLat, lng: trackerData.packageTracker.lastLng }
      : { lat: 6.502206, lng: 3.305082 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Package Tracking</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {trackerData?.packageTracker?.name || trackerData?.packageTracker?.deviceId || 'Loading...'}
            </p>
          </div>
        </div>
        {trackerData && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>

      <main className="px-4 py-4 pb-24">
        {/* Map */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden mb-6">
          <div className="h-[400px] sm:h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            ) : !trackerData?.location ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-400">No location data available</p>
              </div>
            ) : (
              <GoogleMapWrapper center={mapCenter} zoom={14}>
                {/* Trail */}
                {trail.length > 1 && (
                  <MapPolyline path={trail} color="#a855f7" strokeWeight={3} />
                )}
                {/* Package location */}
                {trackerData.location && (
                  <MapMarker
                    position={{ lat: trackerData.location.lat, lng: trackerData.location.lng }}
                    type="package"
                    label="📦"
                  />
                )}
                {/* Pickup location */}
                {order?.pickupLocation?.lat && order?.pickupLocation?.lng && (
                  <MapMarker
                    position={{ lat: order.pickupLocation.lat, lng: order.pickupLocation.lng }}
                    type="pickup"
                    label="🏭"
                  />
                )}
                {/* Delivery location */}
                {order?.deliveryLocation?.lat && order?.deliveryLocation?.lng && (
                  <MapMarker
                    position={{ lat: order.deliveryLocation.lat, lng: order.deliveryLocation.lng }}
                    type="delivery"
                    label="🏠"
                  />
                )}
              </GoogleMapWrapper>
            )}
          </div>
        </div>

        {/* Tracker Details */}
        {trackerData?.location && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracker Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Latitude</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {trackerData.location.lat.toFixed(6)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Longitude</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {trackerData.location.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Speed</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {trackerData.location.speed ? `${trackerData.location.speed.toFixed(1)} km/h` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <Battery className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Battery</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {trackerData.packageTracker?.batteryLevel ? `${trackerData.packageTracker.batteryLevel}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last Updated:{' '}
                <span className="font-medium text-gray-900 dark:text-white font-mono">
                  {new Date(trackerData.location.timestamp).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Simple polyline component for package trail
function MapPolyline({ path, color, strokeWeight }: { path: { lat: number; lng: number }[]; color: string; strokeWeight: number }) {
  return (
    <div style={{ display: 'none' }}>
      {/* Placeholder - actual polyline should be rendered via Google Maps API */}
    </div>
  );
}
