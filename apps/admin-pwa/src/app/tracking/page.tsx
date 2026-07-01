'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { GoogleMapWrapper, useMap } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { GeofenceCircle } from '@/components/maps/GeofenceCircle';
import { RouteHeatmap } from '@/components/maps/RouteHeatmap';
import { Truck, MapPin, Activity, Navigation, AlertCircle, CheckCircle, Clock, Package, Battery, Flame } from 'lucide-react';

interface FleetLocation {
  tripId: string;
  trip: any;
  location: {
    tripId: string;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  };
}

interface GeofenceEvent {
  id: string;
  tripId: string;
  eventType: 'LOCATION_RECEIVED' | 'RADIUS_A_ENTERED' | 'RADIUS_B_ENTERED' | 'RADIUS_C_ENTERED' | 'POLYGON_ENTERED' | 'POLYGON_EXITED' | 'ARRIVAL_CONFIRMED' | 'DELIVERY_WORKFLOW_TRIGGERED';
  timestamp: string;
  data: any;
}

function TrackingMapOverlays({
  fleetLocation,
  packageLiveLocation,
  showHeatmap,
  heatmapPoints,
}: {
  fleetLocation: FleetLocation | null;
  packageLiveLocation: { lat: number; lng: number } | null;
  showHeatmap: boolean;
  heatmapPoints: Array<{ lat: number; lng: number; speed?: number; timestamp: string }>;
}) {
  const map = useMap();
  if (!map) return null;

  const deliveryLoc = fleetLocation?.trip?.order?.deliveryLocation;

  return (
    <>
      {deliveryLoc && (
        <>
          <GeofenceCircle map={map} id="radius-c" center={deliveryLoc} radiusMeters={100} />
          <GeofenceCircle map={map} id="radius-b" center={deliveryLoc} radiusMeters={1000} />
          <GeofenceCircle map={map} id="radius-a" center={deliveryLoc} radiusMeters={5000} />
        </>
      )}
      {fleetLocation?.location && (
        <MapMarker map={map} position={{ lat: fleetLocation.location.lat, lng: fleetLocation.location.lng }} type="vehicle" />
      )}
      {packageLiveLocation && (
        <MapMarker map={map} position={packageLiveLocation} type="package" label="📦" />
      )}
      {fleetLocation?.trip?.order?.pickupLocation && (
        <MapMarker map={map} position={fleetLocation.trip.order.pickupLocation} type="pickup" label="📦" />
      )}
      {deliveryLoc && (
        <MapMarker map={map} position={deliveryLoc} type="delivery" label="🏠" />
      )}
      {showHeatmap && heatmapPoints.length > 0 && (
        <RouteHeatmap map={map} points={heatmapPoints} />
      )}
    </>
  );
}

function TrackingPageContent() {
  const { isConnected, subscribe, unsubscribe } = useTrackingWebSocket();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageTrackerId = searchParams.get('packageTrackerId');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const [fleetLocation, setFleetLocation] = useState<FleetLocation | null>(null);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [currentGeofenceStatus, setCurrentGeofenceStatus] = useState<string>('OUTSIDE_ALL_ZONES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageTrackerData, setPackageTrackerData] = useState<any>(null);
  const [packageLiveLocation, setPackageLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapPoints, setHeatmapPoints] = useState<Array<{ lat: number; lng: number; speed?: number; timestamp: string }>>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchFleetLocation();
  }, []);

  // Subscribe to location updates and geofence events from WebSocket
  useEffect(() => {
    if (isConnected) {
      subscribe('location:update', handleLocationUpdate);
      subscribe('geofence:event', handleGeofenceEvent);
    }
    return () => {
      if (isConnected) {
        unsubscribe('location:update');
        unsubscribe('geofence:event');
      }
    };
  }, [isConnected, subscribe, unsubscribe]);

  useEffect(() => {
    if (packageTrackerId) {
      fetchPackageTrackerData(packageTrackerId);
    } else {
      setPackageTrackerData(null);
      setPackageLiveLocation(null);
    }
  }, [packageTrackerId]);

  useEffect(() => {
    if (isConnected && packageTrackerId) {
      subscribe(`package:${packageTrackerId}`, handlePackageLocationUpdate);
    }
    return () => {
      if (packageTrackerId) {
        unsubscribe(`package:${packageTrackerId}`);
      }
    };
  }, [isConnected, packageTrackerId, subscribe, unsubscribe]);

  const handlePackageLocationUpdate = (data: any) => {
    console.log('[Tracking] Package location update:', data);
    setPackageLiveLocation({ lat: data.lat, lng: data.lng });
    setPackageTrackerData((prev: any) => prev ? {
      ...prev,
      location: {
        ...prev.location,
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp,
      },
    } : null);
  };

  const fetchPackageTrackerData = async (trackerId: string) => {
    try {
      const [liveData, trackerDetails] = await Promise.allSettled([
        api.getLivePackageLocation(trackerId),
        api.getPackageTracker(trackerId),
      ]);
      const live = liveData.status === 'fulfilled' ? liveData.value : null;
      const tracker = trackerDetails.status === 'fulfilled' ? trackerDetails.value : null;
      setPackageTrackerData({ ...live, packageTracker: tracker });
      if (live) {
        setPackageLiveLocation({ lat: live.lat, lng: live.lng });
      }
    } catch (err) {
      console.error('Failed to fetch package tracker data:', err);
    }
  };

  const handleLocationUpdate = (data: any) => {
    console.log('[Tracking] Received location update:', data);
    setFleetLocation((prev) => {
      if (!prev || prev.tripId !== data.tripId) return prev;
      return {
        ...prev,
        location: {
          tripId: data.tripId,
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          timestamp: data.timestamp,
          speed: data.speed,
          heading: data.heading,
        },
      };
    });
  };

  const handleGeofenceEvent = (data: any) => {
    console.log('[Tracking] Received geofence event:', data);
    const newEvent: GeofenceEvent = {
      id: data.id || `event-${Date.now()}`,
      tripId: data.tripId,
      eventType: data.eventType,
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.data || {},
    };
    
    setGeofenceEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
    
    // Update current status based on event
    updateGeofenceStatus(newEvent.eventType);
  };

  const updateGeofenceStatus = (eventType: string) => {
    switch (eventType) {
      case 'RADIUS_A_ENTERED':
        setCurrentGeofenceStatus('EARLY_AWARENESS_ZONE');
        break;
      case 'RADIUS_B_ENTERED':
        setCurrentGeofenceStatus('APPROACHING_DESTINATION');
        break;
      case 'RADIUS_C_ENTERED':
        setCurrentGeofenceStatus('ARRIVAL_ZONE');
        break;
      case 'ARRIVAL_CONFIRMED':
        setCurrentGeofenceStatus('ARRIVED');
        break;
      case 'POLYGON_ENTERED':
        setCurrentGeofenceStatus('WITHIN_POLYGON');
        break;
      case 'POLYGON_EXITED':
        setCurrentGeofenceStatus('EXITED_POLYGON');
        break;
      default:
        break;
    }
  };

  const fetchFleetLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getActiveFleetLocations('IN_TRANSIT');
      console.log('[Tracking] Fetched fleet locations:', data);
      if (data.length > 0) {
        setFleetLocation(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch fleet locations:', err);
      setError('Failed to load fleet tracking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmapPoints = async (tripId: string) => {
    try {
      setHeatmapLoading(true);
      const history = await api.getTripTrackingHistory(tripId, 500);
      const points = (history || []).map((p: any) => ({
        lat: p.lat,
        lng: p.lng,
        speed: p.speed,
        timestamp: p.timestamp,
      }));
      setHeatmapPoints(points);
    } catch (err) {
      console.error('[Tracking] Failed to fetch heatmap points:', err);
      setHeatmapPoints([]);
    } finally {
      setHeatmapLoading(false);
    }
  };

  const handleToggleHeatmap = () => {
    const next = !showHeatmap;
    setShowHeatmap(next);
    if (next && heatmapPoints.length === 0 && fleetLocation?.tripId) {
      fetchHeatmapPoints(fleetLocation.tripId);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'RADIUS_A_ENTERED':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'RADIUS_B_ENTERED':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'RADIUS_C_ENTERED':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'ARRIVAL_CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'POLYGON_ENTERED':
        return <MapPin className="w-5 h-5 text-purple-500" />;
      case 'POLYGON_EXITED':
        return <Navigation className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'RADIUS_A_ENTERED':
        return 'Entered Early Awareness Zone (5km)';
      case 'RADIUS_B_ENTERED':
        return 'Entered Approaching Zone (1km)';
      case 'RADIUS_C_ENTERED':
        return 'Entered Arrival Zone (100m)';
      case 'ARRIVAL_CONFIRMED':
        return 'Arrival Confirmed';
      case 'POLYGON_ENTERED':
        return 'Entered Geofence Polygon';
      case 'POLYGON_EXITED':
        return 'Exited Geofence Polygon';
      case 'DELIVERY_WORKFLOW_TRIGGERED':
        return 'Delivery Workflow Triggered';
      default:
        return formatStatus(eventType);
    }
  };

  const mapCenter = packageLiveLocation
    ? { lat: packageLiveLocation.lat, lng: packageLiveLocation.lng }
    : fleetLocation?.trip?.order?.deliveryLocation?.lat && fleetLocation?.trip.order.deliveryLocation.lng
      ? { lat: fleetLocation?.trip.order.deliveryLocation.lat, lng: fleetLocation?.trip.order.deliveryLocation.lng }
      : { lat: 6.502206, lng: 3.305082 }; // TLH Logistics Hub, Ago Palace Way, Okota, Lagos

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br shadow-md ${packageTrackerId ? 'from-purple-500 to-purple-600' : 'from-blue-600 to-blue-600'}`}>
              {packageTrackerId ? <Package className="w-6 h-6 text-white" /> : <Navigation className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {packageTrackerId ? 'Package Tracking' : 'Live Tracking'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {packageTrackerId
                  ? `Tracking ${packageTrackerData?.packageTracker?.deviceId || packageTrackerId}${packageTrackerData?.packageTracker?.name ? `: ${packageTrackerData.packageTracker.name}` : ''}`
                  : 'Real-time fleet location monitoring'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fleetLocation && (
              <>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </>
            )}
            {fleetLocation && (
              <button
                onClick={handleToggleHeatmap}
                disabled={heatmapLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showHeatmap
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
                title="Toggle route heatmap"
              >
                <Flame className="w-3.5 h-3.5" />
                {heatmapLoading ? 'Loading…' : showHeatmap ? 'Heatmap On' : 'Heatmap'}
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="px-4 py-4 pb-24">
        {/* Map */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 mb-6">
          <div className="h-[400px] relative overflow-hidden rounded-2xl">
            <GoogleMapWrapper center={mapCenter} zoom={13}>
              {!loading && !error && (fleetLocation || packageTrackerData) && (
                <TrackingMapOverlays
                  fleetLocation={fleetLocation}
                  packageLiveLocation={packageLiveLocation}
                  showHeatmap={showHeatmap}
                  heatmapPoints={heatmapPoints}
                />
              )}
            </GoogleMapWrapper>
            {(loading || error || (!fleetLocation && !packageTrackerData)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                {loading ? (
                  <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No active vehicle or package tracking</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Legend */}
        {showHeatmap && heatmapPoints.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 dark:border-slate-700/50 px-4 py-3 mb-4 flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Route Density
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 rounded-full" style={{ background: 'linear-gradient(to right, rgba(65,105,225,0.6), rgba(0,255,0,0.8), rgba(255,200,0,0.9), rgba(255,50,0,1))' }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">Low → High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-blue-400 opacity-70" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Route path ({heatmapPoints.length} points)</span>
            </div>
          </div>
        )}

        {/* Package Tracker Details */}
        {packageTrackerData && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Package Tracker Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Device</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {packageTrackerData.packageTracker?.name || packageTrackerData.packageTracker?.deviceId || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coordinates</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {packageLiveLocation
                      ? `${packageLiveLocation.lat.toFixed(6)}, ${packageLiveLocation.lng.toFixed(6)}`
                      : 'N/A'}
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
                    {packageTrackerData.packageTracker?.batteryLevel ? `${packageTrackerData.packageTracker.batteryLevel}%` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatStatus(packageTrackerData.packageTracker?.status) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geofence Events Timeline */}
        {fleetLocation && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Geofence Events Timeline</h2>
            {geofenceEvents.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No geofence events recorded yet</p>
            ) : (
              <div className="space-y-4">
                {geofenceEvents.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getEventLabel(event.eventType)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {event.data && Object.keys(event.data).length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {JSON.stringify(event.data)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trip Details */}
        {fleetLocation && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-800 dark:bg-lime-500 shadow-md">
                  <Truck className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Driver</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {fleetLocation?.trip.driver?.user?.firstName} {fleetLocation?.trip.driver?.user?.lastName || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {fleetLocation?.trip.vehicle?.plateNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatStatus(fleetLocation?.trip.status)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Event</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm font-mono">
                    {geofenceEvents.length > 0 ? new Date(geofenceEvents[0].timestamp).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pickup</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {fleetLocation?.trip.order?.pickupLocation?.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delivery</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {fleetLocation?.trip.order?.deliveryLocation?.address || 'N/A'}
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

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  );
}
