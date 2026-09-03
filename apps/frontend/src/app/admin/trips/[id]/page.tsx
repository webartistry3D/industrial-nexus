'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Trip, GeofenceEvent, TrackingPoint } from '@/types';
import { 
  Truck, ArrowLeft, MapPin, Clock, Navigation, X, 
  User, Package, Route, Calendar, Activity, MapPinned, Phone,
  AlertCircle, CheckCircle2, ChevronRight, Repeat
} from 'lucide-react';

const DISPATCH_ERROR_TYPES = [
  'WRONG_DRIVER_ASSIGNED',
  'VEHICLE_MISMATCH',
  'LATE_ASSIGNMENT',
  'ADDRESS_ERROR',
  'DUPLICATE_DISPATCH',
  'OTHER',
];

export default function TripDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reassign Driver state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignDrivers, setReassignDrivers] = useState<any[]>([]);
  const [reassignVehicles, setReassignVehicles] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isDispatchError, setIsDispatchError] = useState(false);
  const [errorType, setErrorType] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  // POD signed URLs
  const [podPhotoUrl, setPodPhotoUrl] = useState<string | null>(null);
  const [podSignatureUrl, setPodSignatureUrl] = useState<string | null>(null);

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

      // Resolve POD signed URLs if POD exists
      setPodPhotoUrl(null);
      setPodSignatureUrl(null);
      if (tripData.pod) {
        try {
          if (tripData.pod.imageKey || tripData.pod.imageUrl) {
            const { url } = await api.getPODPhotoUrl(tripId);
            setPodPhotoUrl(url);
          }
          if (tripData.pod.signatureKey || tripData.pod.signatureUrl) {
            const { url } = await api.getPODSignatureUrl(tripId);
            setPodSignatureUrl(url);
          }
        } catch (e) {
          console.warn('Failed to load POD signed URLs:', e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch trip:', err);
      setError('Failed to load trip details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReassignModal = async () => {
    setReassignError(null);
    setSelectedDriver('');
    setSelectedVehicle('');
    setReassignReason('');
    setIsDispatchError(false);
    setErrorType('');
    setShowReassignModal(true);
    try {
      const [drivers, vehicles] = await Promise.all([
        api.getDrivers({ status: 'ACTIVE', availability: 'AVAILABLE' }),
        api.getVehicles({ status: 'ACTIVE' }),
      ]);
      setReassignDrivers(drivers.data || []);
      setReassignVehicles(Array.isArray(vehicles) ? vehicles : (vehicles.data || []));
    } catch (err) {
      console.error('Failed to fetch drivers/vehicles:', err);
    }
  };

  const handleReassignSubmit = async () => {
    if (!selectedDriver || !selectedVehicle) {
      setReassignError('Please select a driver and a vehicle');
      return;
    }
    if (isDispatchError && !errorType) {
      setReassignError('Please select the type of dispatch error');
      return;
    }
    try {
      setReassignLoading(true);
      setReassignError(null);
      await api.reassignTrip(tripId, {
        driverId: selectedDriver,
        vehicleId: selectedVehicle,
        reason: reassignReason || undefined,
        isDispatchError,
        errorType: isDispatchError ? errorType : undefined,
      });
      setShowReassignModal(false);
      await fetchTrip();
    } catch (err: any) {
      setReassignError(err.response?.data?.message || err.message || 'Failed to reassign driver');
    } finally {
      setReassignLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-6 h-6 text-white dark:text-black" />;
      case 'IN_TRANSIT':
        return <Navigation className="w-6 h-6 text-white dark:text-black animate-pulse" />;
      case 'ARRIVED':
        return <MapPinned className="w-6 h-6 text-white dark:text-black" />;
      default:
        return <Truck className="w-6 h-6 text-white dark:text-black" />;
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
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
        <div className="p-4 pb-24">
          <button
            onClick={() => router.push('/admin/trips')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Trips
          </button>
          
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-5 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <AlertCircle className="w-6 h-6 text-white dark:text-black" />
              </div>
              <div>
                <p className="text-red-700 dark:text-red-400 font-medium">{error || 'Trip not found'}</p>
              </div>
            </div>
            <button
              onClick={fetchTrip}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <button
          onClick={() => router.push('/admin/trips')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Trips
        </button>

        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
            {getStatusIcon(trip.status)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                {formatStatus(trip.status) || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-4">
        {/* Driver & Vehicle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <User className="w-4 h-4 text-white dark:text-black" />
              </div>
              <span className="text-xs font-medium">Driver</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {trip.driver?.user?.firstName} {trip.driver?.user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {trip.driver?.licenseNumber}
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <Truck className="w-4 h-4 text-white dark:text-black" />
              </div>
              <span className="text-xs font-medium">Vehicle</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
              {trip.vehicle?.plateNumber}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {trip.vehicle?.category}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
              {trip.vehicle?.capacityKg} kg
            </p>
          </div>
        </div>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATIONS') &&
          trip.status !== 'DELIVERED' && (
          <button
            onClick={handleOpenReassignModal}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-semibold hover:shadow-lg transition-all duration-300"
          >
            <Repeat className="w-4 h-4" />
            Reassign Driver / Vehicle
          </button>
        )}

        {/* Route Info */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
              <Route className="w-5 h-5 text-white dark:text-black" />
            </div>
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
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
              <Calendar className="w-5 h-5 text-white dark:text-black" />
            </div>
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
                <span className="text-gray-900 dark:text-white font-mono">{formatDate(trip.eta)}</span>
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
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
              <Package className="w-5 h-5 text-white dark:text-black" />
            </div>
            Cargo
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{trip.order?.cargoDescription || 'No description'}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">Weight: {trip.order?.totalWeight || 0} kg</span>
            <span>Priority: {formatStatus(trip.order?.priority)}</span>
          </div>
        </div>

        {/* Geofence Events */}
        {geofenceEvents.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <Activity className="w-5 h-5 text-white dark:text-black" />
              </div>
              Geofence Events ({geofenceEvents.length})
            </h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {geofenceEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700/30 dark:to-slate-700/50 rounded-xl">
                  {getEventIcon(event.type)}
                  <span className="text-gray-700 dark:text-gray-300">{formatStatus(event.type) || 'Event'}</span>
                  <span className="text-xs text-gray-400 ml-auto font-mono">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Tracking */}
        {trip.status === 'IN_TRANSIT' && (
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-5 shadow-lg shadow-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <Navigation className="w-5 h-5 text-white dark:text-black animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Live Tracking Active</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{trackingPoints.length} tracking points recorded</p>
              </div>
            </div>
          </div>
        )}

        {/* POD Information */}
        {trip.pod && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white dark:text-black" />
              </div>
              Proof of Delivery
            </h2>
            <div className="space-y-3">
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Captured:</span>
                <span className="text-gray-900 dark:text-white font-mono">
                  {trip.pod?.capturedAt ? new Date(trip.pod.capturedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              
              {/* Receiver Info */}
              {trip.pod?.receiverName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Receiver:</span>
                  <span className="text-gray-900 dark:text-white">
                    {trip.pod.receiverName}
                  </span>
                </div>
              )}
              {trip.pod?.receiverPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                  <span className="text-gray-900 dark:text-white font-mono">
                    {trip.pod.receiverPhone}
                  </span>
                </div>
              )}

              {/* GPS Coordinates */}
              {trip.pod?.lat && trip.pod?.lng && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Location:</span>
                  <span className="text-gray-900 dark:text-white font-mono">
                    {trip.pod.lat.toFixed(6)}, {trip.pod.lng.toFixed(6)}
                  </span>
                </div>
              )}
              
              {/* Photo */}
              {podPhotoUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Delivery Photo</p>
                  <img
                    src={podPhotoUrl}
                    alt="Delivery photo"
                    className="w-full max-h-48 object-contain rounded-xl border border-gray-200 dark:border-slate-700"
                  />
                </div>
              )}

              {/* Signature */}
              {podSignatureUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Receiver Signature</p>
                  <img
                    src={podSignatureUrl}
                    alt="Receiver signature"
                    className="w-full max-h-32 object-contain rounded-xl border border-gray-200 dark:border-slate-700 bg-white"
                  />
                </div>
              )}
              
              {/* Notes */}
              {trip.pod?.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                    {trip.pod.notes}
                  </p>
                </div>
              )}

              {/* Damage Report */}
              {trip.pod?.damageReported && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Cargo Damage Reported</p>
                    {trip.pod.damageDescription && (
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{trip.pod.damageDescription}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Order Button */}
        {trip.order && (
          <button
            onClick={() => router.push(`/admin/orders/${trip.orderId}`)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border border-blue-200/50 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 rounded-xl hover:from-blue-500/20 hover:to-blue-600/10 dark:hover:from-blue-500/30 dark:hover:to-blue-600/20 transition-all duration-300"
          >
            View Order Details
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Reassign Driver Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Reassign Driver / Vehicle</h2>
              <button onClick={() => setShowReassignModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {reassignError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
                  {reassignError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Driver</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a driver</option>
                  {reassignDrivers.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.user?.firstName} {d.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a vehicle</option>
                  {reassignVehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason (optional)</label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Driver reported a vehicle breakdown"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDispatchError}
                    onChange={(e) => setIsDispatchError(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">This reassignment was due to a dispatch error</span>
                </label>
                {isDispatchError && (
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    className="w-full mt-3 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select error type</option>
                    {DISPATCH_ERROR_TYPES.map((type) => (
                      <option key={type} value={type}>{formatStatus(type)}</option>
                    ))}
                  </select>
                )}
              </div>
              <button
                onClick={handleReassignSubmit}
                disabled={reassignLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all duration-300"
              >
                {reassignLoading ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
