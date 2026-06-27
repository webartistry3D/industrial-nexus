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
  const { user, isLoading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchTrips();
    }
  }, [authLoading, user, router]);

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
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      <main className="pt-20 px-4 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Trips</h1>
            {/* <p className="text-sm text-gray-500 dark:text-gray-400">View and manage your assigned trips</p> */}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'active'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            All
          </button>
        </div>

        {/* Stats - Aligned with Dashboard */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 text-center">
            <div className="text-4xl font-bold text-blue-900 dark:text-blue-800 font-mono">
              {loading ? '...' : activeTripsCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Trips</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 text-center">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {loading ? '...' : totalCompletedCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Completed</div>
          </div>
        </div>

        {/* Trip List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No {filter === 'all' ? '' : filter} trips found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 cursor-pointer active:opacity-80 transition-opacity duration-150 border-l-4 border-blue-500 dark:border-blue-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {trip.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                      <MapPin className="w-4 h-4 text-white mt-0.5" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">From: {trip.order?.pickupLocation?.address}</p>
                      <p className="text-gray-600 dark:text-gray-400">To: {trip.order?.deliveryLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-mono">{trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150">
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
