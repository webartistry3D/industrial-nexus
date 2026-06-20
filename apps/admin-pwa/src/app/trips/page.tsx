'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip, PaginatedResponse, WeightAlert } from '@/types';
import { 
  Truck, Search, MapPin, Clock, ChevronRight, Navigation, AlertTriangle, Scale, X, Plus
} from 'lucide-react';

function TripsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const statusParam = searchParams.get('status');
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [weightAlerts, setWeightAlerts] = useState<WeightAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || '');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchTrips();
    if (filterParam === 'weight-alerts') {
      fetchWeightAlerts();
    }
  }, [page, statusFilter, filterParam]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Trip> = await api.getTrips({
        page,
        limit: 100, // Fetch more for client-side filtering
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

  const fetchWeightAlerts = async () => {
    try {
      const alerts = await api.getWeightAlerts();
      setWeightAlerts(alerts);
    } catch (error) {
      console.error('Failed to fetch weight alerts:', error);
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

  const handleTripClick = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  // Apply client-side filtering based on query params, status filter, and search
  const filteredTrips = useMemo(() => {
    let result = trips;
    
    // Helper function: Check if trip is delayed (In Transit but ETA passed)
    const isDelayed = (trip: Trip) => {
      if (!trip.eta) return false;
      const eta = new Date(trip.eta);
      const now = new Date();
      // Delayed = In Transit + ETA has passed
      return trip.status === 'IN_TRANSIT' && eta < now;
    };
    
    // Apply status filter (from dropdown or query param)
    if (statusFilter === 'DELAYED') {
      result = result.filter(isDelayed);
    } else if (statusFilter) {
      // Backend status filter
      result = result.filter(trip => trip.status === statusFilter);
    }
    
    // Apply filter query param (from dashboard cards)
    if (filterParam === 'weight-alerts') {
      // Get trip IDs that have weight alerts
      const alertTripIds = new Set(weightAlerts.map(alert => alert.tripId));
      result = result.filter(trip => alertTripIds.has(trip.id));
    }
    
    // Apply search filter
    if (search) {
      result = result.filter(trip =>
        trip.order?.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        trip.driver?.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        trip.vehicle?.plateNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [trips, filterParam, weightAlerts, search, statusFilter]);

  const userRole = (user?.role?.toLowerCase() as 'admin' | 'client' | 'driver') || 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trips</h1>
                {(filterParam || statusFilter) && (
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      router.push('/trips');
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    title="Clear filter"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filterParam === 'weight-alerts' ? 'Trips with weight capacity issues' : 
                 'Track active shipments'}
              </p>
            </div>
            <button
              onClick={() => router.push('/trips/new')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Create Trip
            </button>
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value);
                // Clear query param filter when using dropdown
                if ((filterParam || statusParam) && value) {
                  router.push('/trips');
                }
              }}
              className="px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
            >
              <option value="">All Status</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed (Past ETA)</option>
            </select>
          </div>
        </div>

        {/* Trips List */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">Loading trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold mb-2">No trips found</p>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip.id)}
                className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 cursor-pointer hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {trip.driver?.user?.firstName} {trip.driver?.user?.lastName}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {trip.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1 dark:text-gray-300">{trip.order?.deliveryLocation?.address}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-mono">{trip.vehicle?.plateNumber}</span>
                    {trip.eta && (
                      <span className="flex items-center gap-1 text-blue-600 font-mono">
                        <Clock className="w-3 h-3" />
                        ETA: {new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>

                {trip.status === 'IN_TRANSIT' && (
                  <div className="mt-3 p-2 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border border-blue-200/50 dark:border-blue-700/50 rounded-xl flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Live Tracking Active</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredTrips.length > 0 && (
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

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <TripsPageContent />
    </Suspense>
  );
}
