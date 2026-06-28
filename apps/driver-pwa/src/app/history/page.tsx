'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Trip } from '@/types';
import { Truck, Package, MapPin, CheckCircle, Calendar, Clock, List, Grid2x2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/stat-card';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, page]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.getMyTrips({ page, limit: 10 });
      setTrips(response.data || []);
      setMeta(response.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
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

      <main className="pt-20 px-4 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trip History</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Truck} label="Total Trips" value={loading ? '...' : trips.length.toString()} color="blue" />
          <StatCard icon={CheckCircle} label="Completed" value={loading ? '...' : trips.filter(t => t.status === 'DELIVERED').length.toString()} color="green" />
          <StatCard icon={Clock} label="In Transit" value={loading ? '...' : trips.filter(t => t.status === 'IN_TRANSIT').length.toString()} color="yellow" />
          <StatCard icon={XCircle} label="Cancelled" value={loading ? '...' : trips.filter(t => t.status === 'CANCELLED').length.toString()} color="red" />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filter === 'completed'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filter === 'cancelled'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
            >
              Cancelled
            </button>
          </div>
          <div className="flex gap-2 justify-center md:hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
              aria-label="Grid view"
            >
              <Grid2x2 className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
              aria-label="Grid view"
            >
              <Grid2x2 className="w-5 h-5" />
            </button>
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
            <p className="text-gray-600 dark:text-gray-400 font-medium">No trips found</p>
          </div>
        ) : viewMode === 'list' ? (
          // Table View
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-200/50 dark:border-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
                {filteredTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => router.push(`/trips/${trip.id}`)}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {trip.order?.pickupLocation?.address}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        → {trip.order?.deliveryLocation?.address}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                        {formatStatus(trip.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{formatDate(trip.completedAt || trip.startedAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          // Card View (Grid)
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 cursor-pointer active:opacity-80 transition-opacity duration-150 border-l-4 border-blue-500 dark:border-blue-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">
                    {trip.order?.orderNumber}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {formatStatus(trip.status)}
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

        {/* Pagination */}
        {!loading && (
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
