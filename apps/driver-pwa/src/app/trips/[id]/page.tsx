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
  const { user } = useAuth();
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading trip...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Trip not found</div>
      </div>
    );
  }

  const isSOPPending = trip.status === 'ASSIGNED' || trip.status === 'SOP_COMPLETED';
  const isInTransit = trip.status === 'IN_TRANSIT';

  return (
    <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-white">
            ← Back
          </button>
          <h1 className="text-lg font-semibold ml-2">Trip {trip.order?.orderNumber}</h1>
        </div>

        {/* Action Messages */}
        <div className="mt-3 space-y-2">
          {actionSuccess && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-100 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Trip started successfully
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-100 text-sm">
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
            className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {actionLoading ? 'Starting...' : 'Start Trip'}
          </button>
        )}
        {/* Trip Status */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
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
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-lg p-4 flex items-center justify-center gap-2 shadow-lg border border-blue-500/30 dark:border-blue-400/30"
          >
            <Navigation className="w-5 h-5" />
            <span className="font-semibold">View Live Tracking</span>
          </button>
        )}

        {/* Trip Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Order Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.pickupLocation?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.deliveryLocation?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cargo</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Timeline</h2>
          <div className="space-y-3 text-sm">
            {trip.startedAt && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Started</p>
                  <p className="text-gray-600 dark:text-gray-400">
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
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Completed</p>
                  <p className="text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-3">SOP Checklist</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Complete all items before starting trip</p>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer active:bg-gray-50 dark:active:bg-slate-700"
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
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Starting...' : 'Start Trip'}
            </button>
          )}
          {isInTransit && (
            <>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Capture POD
              </button>
              <button className="w-full bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <Pen className="w-5 h-5" />
                Get Signature
              </button>
              <button
                onClick={completeTrip}
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Completing...' : 'Complete Delivery'}
              </button>
            </>
          )}
          {trip.status === 'DELIVERED' && (
            <div className="text-center py-8 text-green-600 font-semibold">
              ✓ Trip Completed
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
