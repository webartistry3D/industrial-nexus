'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { Truck, Package, MapPin, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export default function TripsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.getMyTrips();
      setTrips(response.data || []);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    if (filter === 'active') return trip.status !== 'DELIVERED' && trip.status !== 'CANCELLED';
    if (filter === 'completed') return trip.status === 'DELIVERED';
    return true;
  });

  const activeTripsCount = trips.filter(t => t.status !== 'DELIVERED' && t.status !== 'CANCELLED').length;
  const totalCompletedCount = trips.filter(t => t.status === 'DELIVERED').length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      IN_TRANSIT: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      ARRIVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900">
      <PageHeader />

      <main className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            All
          </button>
        </div>

        {/* Stats - Aligned with Dashboard */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? '...' : activeTripsCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Trips</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {loading ? '...' : totalCompletedCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Completed</div>
          </div>
        </div>

        {/* Trip List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading trips...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="dark:text-gray-400">No {filter === 'all' ? '' : filter} trips found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 cursor-pointer active:bg-gray-50 dark:active:bg-slate-700 border-l-4 border-blue-500 dark:border-blue-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white">{trip.order?.orderNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {trip.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">From: {trip.order?.pickupLocation?.address}</p>
                      <p className="text-gray-600 dark:text-gray-400">To: {trip.order?.deliveryLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors">
                    {trip.status === 'ASSIGNED' ? 'Start Trip' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
