'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { GoogleMapWrapper } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { MapPolyline } from '@/components/maps/MapPolyline';
import { Truck, Package, MapPin, Clock, ArrowRight } from 'lucide-react';

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
      vehicle: { plateNumber: string };
    };
  };
}

export default function TrackingPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (selectedShipment?.trip?.id) {
      fetchTrackingData(selectedShipment.trip.id);
      // Poll every 30 seconds for updates
      const interval = setInterval(() => {
        if (selectedShipment?.trip?.id) {
          fetchTrackingData(selectedShipment.trip.id);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedShipment]);

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
  const mapCenter = trackingData?.location
    ? { lat: trackingData.location.lat, lng: trackingData.location.lng }
    : { lat: 6.5244, lng: 3.3792 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Track Shipments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your shipments in real-time</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Shipments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeShipments}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{shipments.length}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Package className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipments List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Shipments</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                  Loading shipments...
                </div>
              ) : shipments.length === 0 ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                  No shipments found
                </div>
              ) : (
                shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                      selectedShipment?.id === shipment.id ? 'bg-blue-50 dark:bg-slate-700' : ''
                    }`}
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{shipment.orderNumber}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {shipment.deliveryLocation.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
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
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="h-[400px]">
                    {trackingData ? (
                      <GoogleMapWrapper center={mapCenter} zoom={12}>
                        {trackingData.location && (
                          <MapMarker
                            position={{ lat: trackingData.location.lat, lng: trackingData.location.lng }}
                            type="vehicle"
                          />
                        )}
                        {trackingData.route?.polyline && (
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
                        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedShipment.orderNumber}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <Package className="w-5 h-5 text-orange-600 dark:text-orange-300" />
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
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Delivery</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedShipment.deliveryLocation.address}
                        </p>
                      </div>
                    </div>

                    {selectedShipment.trip?.driver && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Driver</p>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedShipment.trip.driver.user.firstName} {selectedShipment.trip.driver.user.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedShipment.trip.driver.vehicle?.plateNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {trackingData?.location && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          Last updated: {new Date(trackingData.location.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Select a shipment to view tracking details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
