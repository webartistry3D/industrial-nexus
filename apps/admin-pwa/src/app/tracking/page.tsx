'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { Truck, MapPin, Activity, Navigation, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Circle } from '@react-google-maps/api';

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

export default function TrackingPage() {
  const { isConnected, subscribe, unsubscribe } = useTrackingWebSocket();
  const { user } = useAuth();
  const [fleetLocation, setFleetLocation] = useState<FleetLocation | null>(null);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [currentGeofenceStatus, setCurrentGeofenceStatus] = useState<string>('OUTSIDE_ALL_ZONES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleLocationUpdate = (data: any) => {
    console.log('[Tracking] Received location update:', data);
    if (fleetLocation && fleetLocation.tripId === data.tripId) {
      setFleetLocation((prev) => prev ? {
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
      } : null);
    }
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
      // Specifically fetch trip-7 (Festac Town shipment)
      const trip7Location = data.find((loc: FleetLocation) => loc.tripId === 'trip-7');
      if (trip7Location) {
        setFleetLocation(trip7Location);
      } else if (data.length > 0) {
        setFleetLocation(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch fleet locations:', err);
      setError('Failed to load fleet tracking data');
    } finally {
      setLoading(false);
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
        return eventType.replace(/_/g, ' ');
    }
  };

  const mapCenter = fleetLocation?.trip?.order?.deliveryLocation?.lat && fleetLocation.trip.order.deliveryLocation.lng
    ? { lat: fleetLocation.trip.order.deliveryLocation.lat, lng: fleetLocation.trip.order.deliveryLocation.lng }
    : { lat: 6.5244, lng: 3.3792 }; // Default center: Lagos, Nigeria

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Geofence Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                {currentGeofenceStatus === 'ARRIVED' ? (
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-300" />
                ) : (
                  <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Geofence Status</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentGeofenceStatus.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            {fleetLocation && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )}
          </div>
          
          {/* Geofence Zone Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Radius A (5km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">Radius B (1km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-600 dark:text-gray-400">Radius C (100m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">Polygon Zone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            ) : !fleetLocation ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-400">No active vehicle tracking</p>
              </div>
            ) : (
              <GoogleMapWrapper center={mapCenter} zoom={13}>
                {/* Geofence Radius C - 100m (Arrival Zone) */}
                {fleetLocation.trip?.order?.deliveryLocation && (
                  <Circle
                    center={{
                      lat: fleetLocation.trip.order.deliveryLocation.lat,
                      lng: fleetLocation.trip.order.deliveryLocation.lng,
                    }}
                    radius={100}
                    options={{
                      strokeColor: '#f97316',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: '#f97316',
                      fillOpacity: 0.1,
                    }}
                  />
                )}
                
                {/* Geofence Radius B - 1km (Approaching Zone) */}
                {fleetLocation.trip?.order?.deliveryLocation && (
                  <Circle
                    center={{
                      lat: fleetLocation.trip.order.deliveryLocation.lat,
                      lng: fleetLocation.trip.order.deliveryLocation.lng,
                    }}
                    radius={1000}
                    options={{
                      strokeColor: '#eab308',
                      strokeOpacity: 0.6,
                      strokeWeight: 2,
                      fillColor: '#eab308',
                      fillOpacity: 0.05,
                    }}
                  />
                )}
                
                {/* Geofence Radius A - 5km (Early Awareness Zone) */}
                {fleetLocation.trip?.order?.deliveryLocation && (
                  <Circle
                    center={{
                      lat: fleetLocation.trip.order.deliveryLocation.lat,
                      lng: fleetLocation.trip.order.deliveryLocation.lng,
                    }}
                    radius={5000}
                    options={{
                      strokeColor: '#3b82f6',
                      strokeOpacity: 0.4,
                      strokeWeight: 2,
                      fillColor: '#3b82f6',
                      fillOpacity: 0.05,
                    }}
                  />
                )}
                
                {/* Current vehicle location */}
                {fleetLocation.location && (
                  <MapMarker
                    position={{ lat: fleetLocation.location.lat, lng: fleetLocation.location.lng }}
                    type="current"
                  />
                )}
                
                {/* Pickup location */}
                {fleetLocation.trip?.order?.pickupLocation && (
                  <MapMarker
                    position={{
                      lat: fleetLocation.trip.order.pickupLocation.lat,
                      lng: fleetLocation.trip.order.pickupLocation.lng,
                    }}
                    type="pickup"
                  />
                )}
                
                {/* Delivery location */}
                {fleetLocation.trip?.order?.deliveryLocation && (
                  <MapMarker
                    position={{
                      lat: fleetLocation.trip.order.deliveryLocation.lat,
                      lng: fleetLocation.trip.order.deliveryLocation.lng,
                    }}
                    type="delivery"
                  />
                )}
              </GoogleMapWrapper>
            )}
          </div>
        </div>

        {/* Geofence Events Timeline */}
        {fleetLocation && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Driver</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {fleetLocation.trip.driver?.user?.firstName} {fleetLocation.trip.driver?.user?.lastName || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Navigation className="w-5 h-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {fleetLocation.trip.vehicle?.plateNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {fleetLocation.trip.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Event</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
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
                    {fleetLocation.trip.order?.pickupLocation?.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delivery</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {fleetLocation.trip.order?.deliveryLocation?.address || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
