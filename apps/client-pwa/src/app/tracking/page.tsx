'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { TripSimulation } from '@/components/maps/TripSimulation';
import { Truck, Package, MapPin, Clock, ArrowRight, Play, Square } from 'lucide-react';
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedVehiclePosition, setSimulatedVehiclePosition] = useState<{ lat: number; lng: number } | null>(null);
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
  // Prefer simulated position, then live WebSocket location, then last HTTP-polled location
  const vehiclePosition = simulatedVehiclePosition || liveLocation || (trackingData?.location
    ? { lat: trackingData.location.lat, lng: trackingData.location.lng }
    : null);
  const mapCenter = vehiclePosition || { lat: 6.502206, lng: 3.305082 }; // TLH Logistics Hub, Ago Palace Way, Okota, Lagos

  // Demo locations for Festac Town simulation
  const demoPickupLocation = { lat: 6.5026, lng: 3.3515, address: 'Surulere, Lagos' };
  const demoDeliveryLocation = { lat: 6.4680, lng: 3.2920, address: '1st Avenue, Festac Town' };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulatedVehiclePosition(demoPickupLocation);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setSimulatedVehiclePosition(null);
  };

  const handleSimulationComplete = () => {
    setIsSimulating(false);
    setSimulatedVehiclePosition(demoDeliveryLocation);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Track Shipments</h1>
            </div>
          </div>
          <button
            onClick={isSimulating ? handleStopSimulation : handleStartSimulation}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg ${
              isSimulating
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-red-500/20'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white hover:shadow-purple-500/20'
            }`}
          >
            {isSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? 'Stop Demo' : 'Start Demo'}
          </button>
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg mb-4">
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
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
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
            {/* Map */}
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="h-[400px]">
                {isSimulating ? (
                  <GoogleMapWrapper center={mapCenter} zoom={12}>
                    <TripSimulation
                      pickupLocation={demoPickupLocation}
                      deliveryLocation={demoDeliveryLocation}
                      isSimulating={isSimulating}
                      onSimulationComplete={handleSimulationComplete}
                      onVehiclePositionChange={setSimulatedVehiclePosition}
                    />
                  </GoogleMapWrapper>
                ) : selectedShipment && (trackingData || vehiclePosition) ? (
                  <GoogleMapWrapper center={mapCenter} zoom={12}>
                    {vehiclePosition && (
                      <MapMarker
                        position={vehiclePosition}
                        type="vehicle"
                        label="🚚"
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
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {isSimulating ? 'Starting simulation...' : selectedShipment ? 'Loading map...' : 'Select a shipment or start simulation to view map'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            {isSimulating ? (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-mono flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Trip Simulation Demo
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pickup</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {demoPickupLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                        {demoPickupLocation.lat.toFixed(4)}, {demoPickupLocation.lng.toFixed(4)}
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
                        {demoDeliveryLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                        {demoDeliveryLocation.lat.toFixed(4)}, {demoDeliveryLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Simulation in progress - Watch the driver move on the map!</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedShipment ? (
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
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
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
            ) : (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Select a shipment to view tracking details, or start the simulation demo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
