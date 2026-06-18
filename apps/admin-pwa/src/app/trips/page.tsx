'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip, PaginatedResponse, WeightAlert } from '@/types';
import { 
  Truck, Search, MapPin, Clock, ChevronRight, Navigation, AlertTriangle, Scale, X, Plus
} from 'lucide-react';

export default function TripsPage() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                onClick={() => handleTripClick(trip.id)}
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
        {!loading && filteredTrips.length > 0 && (
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
