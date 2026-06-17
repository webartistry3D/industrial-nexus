'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip, PaginatedResponse, GeofenceEvent, TrackingPoint } from '@/types';
import { 
  Truck, Search, MapPin, Clock, ChevronRight, Navigation, X, 
  User, Package, Route, Calendar, Activity, MapPinned, Phone,
  AlertCircle, CheckCircle2
} from 'lucide-react';

// Trip Detail Modal Component
interface TripDetailModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
}

function TripDetailModal({ trip, isOpen, onClose }: TripDetailModalProps) {
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trip && isOpen) {
      setGeofenceEvents(trip.geofenceEvents || []);
      setTrackingPoints(trip.trackingPoints || []);
    }
  }, [trip, isOpen]);

  if (!isOpen || !trip) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'IN_TRANSIT':
        return <Navigation className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'ARRIVED':
        return <MapPinned className="w-5 h-5 text-green-600" />;
      default:
        return <Truck className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_TRANSIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      ARRIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getEventIcon = (type: string) => {
    if (type.includes('RADIUS')) return <Activity className="w-4 h-4" />;
    if (type.includes('POLYGON')) return <MapPin className="w-4 h-4" />;
    if (type.includes('ARRIVAL')) return <CheckCircle2 className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {getStatusIcon(trip.status)}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{trip.order?.orderNumber}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                {trip.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-4">
          {/* Driver & Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium">Driver</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {trip.driver?.user?.firstName} {trip.driver?.user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {trip.driver?.licenseNumber}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Truck className="w-4 h-4" />
                <span className="text-xs font-medium">Vehicle</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {trip.vehicle?.plateNumber}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {trip.vehicle?.category}
              </p>
            </div>
          </div>

          {/* Route Info */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Route className="w-4 h-4" />
              <span className="text-xs font-medium">Route</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pickup</p>
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{trip.order?.pickupLocation?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Delivery</p>
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{trip.order?.deliveryLocation?.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Trip Timeline
            </h3>
            <div className="space-y-2">
              {trip.startedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-500 dark:text-gray-400 w-20">Started</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(trip.startedAt)}</span>
                </div>
              )}
              {trip.eta && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-gray-500 dark:text-gray-400 w-20">ETA</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(trip.eta)}</span>
                </div>
              )}
              {trip.completedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-500 dark:text-gray-400 w-20">Completed</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(trip.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cargo Info */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Cargo</span>
            </div>
            <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{trip.order?.cargoDescription || 'No description'}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Weight: {trip.order?.totalWeight || 0} kg</span>
              <span>Priority: {trip.order?.priority}</span>
            </div>
          </div>

          {/* Geofence Events */}
          {geofenceEvents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Geofence Events ({geofenceEvents.length})
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {geofenceEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-slate-700/30 rounded">
                    {getEventIcon(event.type)}
                    <span className="text-gray-700 dark:text-gray-300">{event.type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Tracking Indicator */}
          {trip.status === 'IN_TRANSIT' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Live Tracking Active</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{trackingPoints.length} tracking points recorded</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // Modal state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [page, statusFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Trip> = await api.getTrips({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setTrips(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_TRANSIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      ARRIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  };

  const filteredTrips = trips.filter(trip =>
    trip.order?.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    trip.driver?.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    trip.vehicle?.plateNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const userRole = (user?.role?.toLowerCase() as 'admin' | 'client' | 'driver') || 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trips</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track active shipments</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trips..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>

        {/* Trips List */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading trips...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="dark:text-gray-400">No trips found</p>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip)}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{trip.order?.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {trip.driver?.user?.firstName} {trip.driver?.user?.lastName}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1 dark:text-gray-300">{trip.order?.deliveryLocation?.address}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400">{trip.vehicle?.plateNumber}</span>
                    {trip.eta && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Clock className="w-3 h-3" />
                        ETA: {new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>

                {trip.status === 'IN_TRANSIT' && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">Live Tracking Active</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Trip Detail Modal */}
      <TripDetailModal
        trip={selectedTrip}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
