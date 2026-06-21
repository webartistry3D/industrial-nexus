'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { MapPin, Package, CheckCircle, Camera, Pen, Navigation, Clock, Truck, Calendar, Play, Send } from 'lucide-react';

const sopChecklist = [
  { id: 'vehicleInspected', label: 'Vehicle inspected', completed: false },
  { id: 'cargoSecured', label: 'Cargo secured properly', completed: false },
  { id: 'handlingTagsVerified', label: 'Handling tags verified', completed: false },
  { id: 'safetyComplianceConfirmed', label: 'Safety compliance confirmed', completed: false },
];

export default function TripDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState(sopChecklist);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTrip();
    }
  }, [user, params.id]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const response = await api.getTrip(params.id);
      setTrip(response);
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleStartTrip = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      if (trip?.order) {
        await api.startOrderTrip(trip.order.id);
      }
      await api.startTrip(params.id);
      await fetchTrip();
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const allCompleted = checklist.every(item => item.completed);

  const startTrip = async () => {
    if (!allCompleted) {
      alert('Please complete all SOP checklist items');
      return;
    }
    try {
      setSubmitting(true);
      const checklistData = checklist.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.completed,
      }), {} as any);
      await api.submitChecklist(params.id, checklistData);
      await api.startTrip(params.id);
      await fetchTrip();
    } catch (error) {
      console.error('Failed to start trip:', error);
      alert('Failed to start trip');
    } finally {
      setSubmitting(false);
    }
  };

  const completeTrip = async () => {
    try {
      setSubmitting(true);
      await api.completeTrip(params.id);
      await fetchTrip();
    } catch (error) {
      console.error('Failed to complete trip:', error);
      alert('Failed to complete trip');
    } finally {
      setSubmitting(false);
    }
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

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Trip not found</p>
      </div>
    );
  }

  const isSOPPending = trip.status === 'ASSIGNED' || trip.status === 'SOP_COMPLETED';
  const isInTransit = trip.status === 'IN_TRANSIT';

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-white hover:text-blue-200 transition-colors">
            ← Back
          </button>
          <h1 className="text-lg font-semibold ml-2">Trip <span className="font-mono">{trip.order?.orderNumber}</span></h1>
        </div>

        {/* Action Messages */}
        <div className="mt-3 space-y-2">
          {actionSuccess && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-100 text-sm flex items-center gap-2 backdrop-blur-sm">
              <CheckCircle className="w-4 h-4" />
              Trip started successfully
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100 text-sm backdrop-blur-sm">
              {actionError}
            </div>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Start Trip Button for ASSIGNED status */}
        {trip.status === 'ASSIGNED' && trip.order?.status === 'ASSIGNED' && (
          <button
            onClick={handleStartTrip}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {actionLoading ? 'Starting...' : 'Start Trip'}
          </button>
        )}
        {/* Trip Status */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              trip.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              trip.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              trip.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {trip.status.replace(/_/g, ' ')}
            </span>
          </div>
          {trip.eta && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                  {new Date(trip.eta).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Tracking Button */}
        {(trip.status === 'IN_TRANSIT' || trip.status === 'ASSIGNED') && (
          <button
            onClick={() => router.push('/tracking')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 text-white rounded-xl p-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 border border-blue-500/30 dark:border-blue-400/30"
          >
            <Navigation className="w-5 h-5" />
            <span className="font-semibold">View Live Tracking</span>
          </button>
        )}

        {/* Trip Details */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Order Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                <MapPin className="w-4 h-4 text-white mt-0.5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.pickupLocation?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                <MapPin className="w-4 h-4 text-white mt-0.5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.deliveryLocation?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                <Package className="w-4 h-4 text-white mt-0.5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cargo</p>
                <p className="text-gray-600 dark:text-gray-400 font-mono">{trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Timeline</h2>
          <div className="space-y-3 text-sm">
            {trip.startedAt && (
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                  <Clock className="w-4 h-4 text-white mt-0.5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Started</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">
                    {new Date(trip.startedAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
            {trip.completedAt && (
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white mt-0.5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Completed</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">
                    {new Date(trip.completedAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SOP Checklist */}
        {isSOPPending && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">SOP Checklist</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Complete all items before starting trip</p>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-gray-200/50 dark:border-slate-700/50 rounded-xl cursor-pointer active:bg-gray-50 dark:active:bg-slate-700 hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-all duration-300"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className={`${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isSOPPending && (
            <button
              onClick={startTrip}
              disabled={!allCompleted || submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Starting...' : 'Start Trip'}
            </button>
          )}
          {isInTransit && (
            <>
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300">
                <Camera className="w-5 h-5" />
                Capture POD
              </button>
              <button className="w-full bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300">
                <Pen className="w-5 h-5" />
                Get Signature
              </button>
              <button
                onClick={completeTrip}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Completing...' : 'Complete Delivery'}
              </button>
            </>
          )}
          {trip.status === 'DELIVERED' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-600 font-semibold">✓ Trip Completed</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
