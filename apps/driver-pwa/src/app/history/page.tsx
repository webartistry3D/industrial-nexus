'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { Truck, Package, MapPin, CheckCircle, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

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
      console.error('Failed to fetch trip history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    if (filter === 'completed') return trip.status === 'DELIVERED';
    if (filter === 'cancelled') return trip.status === 'CANCELLED';
    return true;
  });

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      <main className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              filter === 'cancelled'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {loading ? '...' : trips.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {loading ? '...' : trips.filter(t => t.status === 'DELIVERED').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {loading ? '...' : trips.filter(t => t.status === 'CANCELLED').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Cancelled</div>
          </div>
        </div>

        {/* Trip List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No trips found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-blue-500 dark:border-blue-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">
                    {trip.order?.orderNumber}
                  </span>
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
                      <p className="text-gray-600 dark:text-gray-400">
                        {trip.order?.pickupLocation?.address}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        → {trip.order?.deliveryLocation?.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-mono">
                      {trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="font-mono">{formatDate(trip.completedAt || trip.startedAt)}</span>
                  </div>
                  {trip.status === 'DELIVERED' && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
