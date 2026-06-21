'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { Truck, Package, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';

interface Shipment {
  id: string;
  orderNumber: string;
  status: string;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  trip?: {
    id: string;
    status: string;
    driver?: {
      user: { firstName: string; lastName: string };
      vehicle?: { plateNumber: string } | null;
    };
    vehicle?: { plateNumber: string } | null;
  };
}

export default function TrackingPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geofenceEvents, setGeofenceEvents] = useState<any[]>([]);
  const selectedShipmentRef = useRef<Shipment | null>(null);
  const { subscribe, isConnected } = useTrackingWebSocket();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchShipments();
  }, []);

  // Keep ref in sync to avoid stale closures in WS handlers
  useEffect(() => {
    selectedShipmentRef.current = selectedShipment;
  }, [selectedShipment]);

  useEffect(() => {
    if (selectedShipment?.trip?.id) {
      setLiveLocation(null);
      setGeofenceEvents([]);
      fetchTrackingData(selectedShipment.trip.id);

      // Subscribe to trip-specific WebSocket room
      subscribe(`trip:${selectedShipment.trip.id}`, () => {});

      // Poll every 30 seconds as fallback
      const interval = setInterval(() => {
        if (selectedShipmentRef.current?.trip?.id) {
          fetchTrackingData(selectedShipmentRef.current.trip.id);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedShipment]);

  // WebSocket handlers for live location and geofence events
  useEffect(() => {
    subscribe('location:update', (data: any) => {
      const sel = selectedShipmentRef.current;
      if (sel?.trip?.id === data.tripId) {
        setLiveLocation({ lat: data.lat, lng: data.lng });
      }
    });
    subscribe('geofence:event', (data: any) => {
      const sel = selectedShipmentRef.current;
      if (sel?.trip?.id === data.tripId) {
        setGeofenceEvents(prev => [data, ...prev].slice(0, 10));
      }
    });
  }, [subscribe]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyOrders();
      setShipments(data.data || []);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      setError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingData = async (tripId: string) => {
    try {
      const [location, route] = await Promise.all([
        api.getShipmentTracking(tripId),
        api.getShipmentRoute(tripId),
      ]);
      setTrackingData({ location, route });
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
    }
  };

  const activeShipments = shipments.filter(s => s.trip?.status === 'IN_TRANSIT').length;
  // Prefer live WebSocket location; fall back to last HTTP-polled location
  const vehiclePosition = liveLocation || (trackingData?.location
    ? { lat: trackingData.location.lat, lng: trackingData.location.lng }
    : null);
  const mapCenter = vehiclePosition || { lat: 6.502206, lng: 3.305082 }; // TLH Logistics Hub, Ago Palace Way, Okota, Lagos

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Track Shipments</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Shipments</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{activeShipments}</p>
              </div>
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{shipments.length}</p>
              </div>
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipments List */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Shipments</h2>
            </div>
            <div className="divide-y divide-gray-200/50 dark:divide-slate-700/50 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading shipments...</p>
                </div>
              ) : shipments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No shipments found</p>
                </div>
              ) : (
                shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-all duration-300 ${
                      selectedShipment?.id === shipment.id ? 'bg-blue-50/80 dark:bg-slate-700/50' : ''
                    }`}
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white font-mono">{shipment.orderNumber}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {shipment.deliveryLocation.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            shipment.trip?.status === 'IN_TRANSIT'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : shipment.trip?.status === 'ASSIGNED'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {shipment.trip?.status || shipment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedShipment ? (
              <>
                {/* Map */}
                <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
                  <div className="h-[400px]">
                    {trackingData || vehiclePosition ? (
                      <GoogleMapWrapper center={mapCenter} zoom={12}>
                        {vehiclePosition && (
                          <MapMarker
                            position={vehiclePosition}
                            type="vehicle"
                          />
                        )}
                        {trackingData?.route?.polyline && (
                          <MapPolyline path={trackingData.route.polyline} />
                        )}
                        <MapMarker
                          position={selectedShipment.pickupLocation}
                          type="pickup"
                          label="📦"
                        />
                        <MapMarker
                          position={selectedShipment.deliveryLocation}
                          type="delivery"
                          label="🏠"
                        />
                      </GoogleMapWrapper>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading map...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-mono">
                    {selectedShipment.orderNumber}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pickup</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedShipment.pickupLocation.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Delivery</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedShipment.deliveryLocation.address}
                        </p>
                      </div>
                    </div>

                    {selectedShipment.trip?.driver && (
                      <div className="pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Driver</p>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedShipment.trip.driver.user.firstName} {selectedShipment.trip.driver.user.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              Vehicle: {(selectedShipment.trip.vehicle ?? selectedShipment.trip.driver.vehicle)?.plateNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(trackingData?.location || liveLocation) && (
                      <div className="pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {liveLocation ? 'Live tracking active' : `Last updated: ${new Date(trackingData.location.timestamp).toLocaleString()}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{isConnected ? 'Live' : 'Polling'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {geofenceEvents.length > 0 && (
                      <div className="pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Geofence Events</p>
                        <div className="space-y-1">
                          {geofenceEvents.map((evt, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                evt.eventType === 'RADIUS_C_ENTERED' ? 'bg-green-500' :
                                evt.eventType === 'RADIUS_B_ENTERED' ? 'bg-orange-500' :
                                evt.eventType === 'RADIUS_A_ENTERED' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <span className="text-gray-700 dark:text-gray-300">{evt.eventType.replace(/_/g, ' ')}</span>
                              {evt.distance > 0 && <span className="text-gray-400 ml-auto text-xs font-mono">{Math.round(evt.distance)}m away</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Select a shipment to view tracking details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
