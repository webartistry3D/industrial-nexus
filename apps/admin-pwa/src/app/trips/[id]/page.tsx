'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip, GeofenceEvent, TrackingPoint } from '@/types';
import { 
  Truck, ArrowLeft, MapPin, Clock, Navigation, X, 
  User, Package, Route, Calendar, Activity, MapPinned, Phone,
  AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function TripDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch trip details
      const tripData = await api.getTrip(tripId);
      setTrip(tripData);
      setGeofenceEvents(tripData.geofenceEvents || []);
      setTrackingPoints(tripData.trackingPoints || []);
    } catch (err) {
      console.error('Failed to fetch trip:', err);
      setError('Failed to load trip details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'IN_TRANSIT':
        return <Navigation className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'ARRIVED':
        return <MapPinned className="w-6 h-6 text-green-600" />;
      default:
        return <Truck className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_TRANSIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      ARRIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    return `${dayName} ${date.toLocaleString()}`;
  };

  const getEventIcon = (type?: string) => {
    if (!type) return <Activity className="w-4 h-4" />;
    if (type.includes('RADIUS')) return <Activity className="w-4 h-4" />;
    if (type.includes('POLYGON')) return <MapPin className="w-4 h-4" />;
    if (type.includes('ARRIVAL')) return <CheckCircle2 className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700" />
          <div className="p-4 space-y-4">
            <div className="h-32 bg-white dark:bg-slate-800 rounded-lg" />
            <div className="h-48 bg-white dark:bg-slate-800 rounded-lg" />
            <div className="h-32 bg-white dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-4 pb-24">
          <button
            onClick={() => router.push('/trips')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Trips
          </button>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-red-700 dark:text-red-400">{error || 'Trip not found'}</p>
              </div>
            </div>
            <button
              onClick={fetchTrip}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
        <button
          onClick={() => router.push('/trips')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Trips
        </button>

        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-lg ${getStatusColor(trip.status)}`}>
            {getStatusIcon(trip.status)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{trip.order?.orderNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                {trip.status?.replace('_', ' ') || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-4">
        {/* Driver & Vehicle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Route className="w-5 h-5" />
            Route
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pickup</p>
                <p className="text-sm text-gray-900 dark:text-white">{trip.order?.pickupLocation?.address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Delivery</p>
                <p className="text-sm text-gray-900 dark:text-white">{trip.order?.deliveryLocation?.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trip Timeline
          </h2>
          <div className="space-y-3">
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Cargo
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{trip.order?.cargoDescription || 'No description'}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Weight: {trip.order?.totalWeight || 0} kg</span>
            <span>Priority: {trip.order?.priority}</span>
          </div>
        </div>

        {/* Geofence Events */}
        {geofenceEvents.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Geofence Events ({geofenceEvents.length})
            </h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {geofenceEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-slate-700/30 rounded">
                  {getEventIcon(event.type)}
                  <span className="text-gray-700 dark:text-gray-300">{event.type?.replace('_', ' ') || 'Event'}</span>
                  <span className="text-xs text-gray-400 ml-auto">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Tracking */}
        {trip.status === 'IN_TRANSIT' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Live Tracking Active</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{trackingPoints.length} tracking points recorded</p>
              </div>
            </div>
          </div>
        )}

        {/* View Order Button */}
        {trip.order && (
          <button
            onClick={() => router.push(`/orders/${trip.orderId}`)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            View Order Details
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
