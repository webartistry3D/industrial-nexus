'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Trip, PaginatedResponse, WeightAlert } from '@/types';
import {
  Truck, Search, MapPin, Clock, ChevronRight, Navigation, AlertTriangle, Scale, X, Plus,
  BarChart2, Users, CheckCircle, TrendingUp, Trophy, ArrowRight, Minus, Calendar,
  List, Grid2x2,
} from 'lucide-react';
import { StatCard } from '@/components/stat-card';

type TabType = 'trips' | 'analytics';

// ── Delivery Trend Types ────────────────────────────────────────────────────
interface TrendPoint {
  date: string;
  delivered: number;
  delayed: number;
  cancelled: number;
}

interface DriverStat {
  driverId: string;
  name: string;
  licenseNumber: string;
  availability: string;
  totalTrips: number;
  delivered: number;
  inTransit: number;
  cancelled: number;
  delayed: number;
  onTimeRate: number | null;
  avgDurationMinutes: number | null;
}

// ── SVG Trend Chart ─────────────────────────────────────────────────────────
function DeliveryTrendChart({ data }: { data: TrendPoint[] }) {
  const W = 600, H = 160, padL = 28, padR = 8, padT = 8, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...data.map(d => d.delivered + d.delayed + d.cancelled), 1);
  const barGroupW = chartW / data.length;
  const barW = Math.max(4, Math.min(18, barGroupW * 0.6));
  const gap = barW * 0.2;
  const yTicks = Array.from(new Set([0, 0.25, 0.5, 0.75, 1].map(p => Math.round(p * maxVal))));
  const toY = (v: number) => padT + chartH - (v / maxVal) * chartH;
  const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}`; };
  const labelStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : Math.ceil(data.length / 7);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: Math.max(280, data.length * 20) }}>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} className="text-gray-500" />
            <text x={padL - 4} y={toY(v) + 4} fontSize={9} textAnchor="end" fill="currentColor" className="fill-gray-400 dark:fill-gray-500">{v}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = padL + i * barGroupW + barGroupW / 2;
          const totalBarW = 3 * barW + 2 * gap;
          const startX = cx - totalBarW / 2;
          const delivH = (d.delivered / maxVal) * chartH;
          const delayH = (d.delayed / maxVal) * chartH;
          const cancH  = (d.cancelled / maxVal) * chartH;
          return (
            <g key={`${d.date}-${i}`}>
              {delivH > 0 && <rect x={startX} y={toY(d.delivered)} width={barW} height={delivH} rx={2} fill="#22c55e" opacity={0.85} />}
              {delayH > 0 && <rect x={startX + barW + gap} y={toY(d.delayed)} width={barW} height={delayH} rx={2} fill="#f87171" opacity={0.85} />}
              {cancH  > 0 && <rect x={startX + (barW + gap) * 2} y={toY(d.cancelled)} width={barW} height={cancH}  rx={2} fill="#94a3b8" opacity={0.7} />}
              {i % labelStep === 0 && <text x={cx} y={H - 4} fontSize={9} textAnchor="middle" fill="currentColor" className="fill-gray-400 dark:fill-gray-500">{fmtDate(d.date)}</text>}
            </g>
          );
        })}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} className="text-gray-500" />
      </svg>
    </div>
  );
}

function TripsPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const statusParam = searchParams.get('status');

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('trips');

  // ── Trips state ────────────────────────────────────────────────────────────
  const [trips, setTrips] = useState<Trip[]>([]);
  const [weightAlerts, setWeightAlerts] = useState<WeightAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || '');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // ── Analytics state ────────────────────────────────────────────────────────
  const [drivers, setDrivers] = useState<DriverStat[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof DriverStat>('delivered');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [driverPage, setDriverPage] = useState(1);
  const [driverMeta, setDriverMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(30);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (filterParam === 'analytics') {
      setActiveTab('analytics');
    }
    fetchTrips();
    if (filterParam === 'weight-alerts') fetchWeightAlerts();
  }, [page, statusFilter, filterParam]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
      fetchTrends(trendDays);
    }
  }, [activeTab, driverPage]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchTrends(trendDays);
  }, [trendDays]);

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

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const response = await api.getDriverPerformance({ page: driverPage, limit: 10 });
      setDrivers(response.data || response);
      if (response.meta) {
        setDriverMeta(response.meta);
      } else {
        setDriverMeta({ page: driverPage, limit: 10, total: response.length || 0, totalPages: 1 });
      }
    } catch {
      setAnalyticsError('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchTrends = async (days: number) => {
    try {
      setTrendsLoading(true);
      const data = await api.getDeliveryTrends(days);
      setTrends(data);
    } catch {
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  };

  const handleSort = (col: keyof DriverStat) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortedDrivers = [...drivers].sort((a, b) => {
    const av = a[sortBy] ?? -1;
    const bv = b[sortBy] ?? -1;
    if (av < bv) return sortDir === 'desc' ? 1 : -1;
    if (av > bv) return sortDir === 'desc' ? -1 : 1;
    return 0;
  });

  const onTimeColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-400';
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const SortIcon = ({ col }: { col: keyof DriverStat }) => {
    if (sortBy !== col) return <Minus className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
    return sortDir === 'desc'
      ? <span className="text-blue-500 text-xs font-bold">↓</span>
      : <span className="text-blue-500 text-xs font-bold">↑</span>;
  };

  const totalDelivered = drivers.reduce((s, d) => s + d.delivered, 0);
  const totalDelayed   = drivers.reduce((s, d) => s + d.delayed, 0);
  const totalTripsAll  = drivers.reduce((s, d) => s + d.totalTrips, 0);
  const avgOnTime = drivers.filter(d => d.onTimeRate !== null).length > 0
    ? Math.round(drivers.filter(d => d.onTimeRate !== null).reduce((s, d) => s + (d.onTimeRate ?? 0), 0) / drivers.filter(d => d.onTimeRate !== null).length)
    : null;
  const topDriver = sortedDrivers.find(d => d.delivered > 0) ?? null;

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
    } else if (filterParam === 'delivered') {
      result = result.filter(trip => trip.status === 'DELIVERED');
    } else if (filterParam === 'damaged') {
      result = result.filter(trip => trip.pod?.damageReported === true);
    } else if (filterParam === 'dispatch-errors') {
      result = result.filter(trip =>
        trip.assignments?.some(a => a.isDispatchError === true),
      );
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

  const filterLabels: Record<string, string> = {
    'weight-alerts': 'Weight Alerts',
    'delivered': 'Delivered Trips',
    'damaged': 'Damaged Trips (POD)',
    'dispatch-errors': 'Dispatch Errors',
  };
  const activeFilterLabel = filterParam ? filterLabels[filterParam] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-600 shadow-md">
              {activeTab === 'trips' ? <Truck className="w-6 h-6 text-white" /> : <BarChart2 className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'trips' ? 'Trips' : 'Analytics'}
                </h1>
                {activeTab === 'trips' && activeFilterLabel && (
                  <span className="text-xs font-semibold text-blue-700 dark:text-lime-400 bg-blue-100 dark:bg-lime-900/30 px-2.5 py-1 rounded-full">
                    {activeFilterLabel}
                  </span>
                )}
                {activeTab === 'trips' && (filterParam || statusFilter) && (
                  <button
                    onClick={() => { setStatusFilter(''); router.push('/trips'); }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    title="Clear filter"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            {activeTab === 'trips' && (
              <button
                onClick={() => router.push('/trips/new')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Create Trip
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('trips')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'trips'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-600 dark:to-lime-600 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <Truck className="w-4 h-4" />
              Trips
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-600 dark:to-lime-600 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Analytics
            </button>
          </div>

          {/* Search & Filter — trips tab only */}
          {activeTab === 'trips' && (
            <div className="flex flex-col gap-2">
              {/* Search - Full width */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                />
              </div>

              {/* Filters Row */}
              <div className="flex gap-2 w-full">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStatusFilter(value);
                    if ((filterParam || statusParam) && value) router.push('/trips');
                  }}
                  className="flex-none w-auto min-w-[140px] px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                >
                  <option value="">All Status</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="ARRIVED">Arrived</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="DELAYED">Delayed (Past ETA)</option>
                </select>

                <select
                  value={filterParam || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      router.push(`/trips?filter=${value}`);
                    } else {
                      router.push('/trips');
                    }
                  }}
                  className="flex-none w-auto min-w-[140px] px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                >
                  <option value="">All Trips</option>
                  <option value="delivered">Delivered Only</option>
                  <option value="damaged">Damaged (POD)</option>
                  <option value="dispatch-errors">Dispatch Errors</option>
                  <option value="weight-alerts">Weight Alerts</option>
                </select>

                {/* View Toggle Buttons */}
                <div className="ml-auto flex gap-2">
                  <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
                  <div className="hidden md:flex gap-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-xl transition-all duration-300 ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid2x2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2 justify-center md:hidden">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid2x2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Analytics Tab Content ──────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {analyticsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {analyticsError}
                <button onClick={fetchAnalytics} className="ml-auto text-blue-600 dark:text-blue-400 underline text-xs">Retry</button>
              </div>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={TrendingUp}
                label="Total Trips"
                value={analyticsLoading ? '—' : String(totalTripsAll)}
                color="blue"
              />
              <StatCard
                icon={CheckCircle}
                label="Delivered"
                value={analyticsLoading ? '—' : String(totalDelivered)}
                color="green"
              />
              <StatCard
                icon={Trophy}
                label="Fleet On-Time"
                value={analyticsLoading ? '—' : avgOnTime !== null ? `${avgOnTime}%` : 'N/A'}
                color={avgOnTime !== null && avgOnTime >= 80 ? 'green' : 'red'}
              />
              <StatCard
                icon={AlertTriangle}
                label="Delayed"
                value={analyticsLoading ? '—' : String(totalDelayed)}
                color={totalDelayed > 0 ? 'red' : 'green'}
              />
            </div>

            {/* Top performer */}
            {!analyticsLoading && topDriver && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md flex-shrink-0">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Top Performer</p>
                  <p className="font-bold text-gray-900 dark:text-white truncate">{topDriver.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {topDriver.delivered} deliveries · {topDriver.onTimeRate !== null ? `${topDriver.onTimeRate}% on-time` : 'no rate yet'}
                  </p>
                </div>
                <button onClick={() => router.push(`/drivers/${topDriver.driverId}`)} className="flex-shrink-0 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 active:opacity-70">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Driver Performance Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 dark:from-blue-600 dark:to-blue-600 shadow-sm">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Driver Performance</h2>
                </div>
                <span className="text-xs text-gray-400 font-mono">{analyticsLoading ? '…' : `${drivers.length} drivers`}</span>
              </div>

              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No active drivers found</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {([
                            ['name', 'Driver'], ['totalTrips', 'Total'], ['delivered', 'Delivered'],
                            ['inTransit', 'Active'], ['delayed', 'Delayed'], ['onTimeRate', 'On-Time %'], ['avgDurationMinutes', 'Avg Duration'],
                          ] as [keyof DriverStat, string][]).map(([col, label]) => (
                            <th key={col} onClick={() => handleSort(col)} className="px-4 py-3 text-left cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none">
                              <span className="flex items-center gap-1">{label} <SortIcon col={col} /></span>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {sortedDrivers.map(d => (
                          <tr key={d.driverId} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{d.name.charAt(0)}</div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{d.name}</p>
                                  <p className="text-xs text-gray-400 font-mono">{d.licenseNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{d.totalTrips}</td>
                            <td className="px-4 py-3"><span className="flex items-center gap-1 font-mono text-green-600 dark:text-green-400"><CheckCircle className="w-3.5 h-3.5" />{d.delivered}</span></td>
                            <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">{d.inTransit}</td>
                            <td className="px-4 py-3">{d.delayed > 0 ? <span className="flex items-center gap-1 font-mono text-red-600 dark:text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{d.delayed}</span> : <span className="font-mono text-gray-400">0</span>}</td>
                            <td className="px-4 py-3">{d.onTimeRate !== null ? <span className={`font-bold font-mono ${onTimeColor(d.onTimeRate)}`}>{d.onTimeRate}%</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                            <td className="px-4 py-3">{d.avgDurationMinutes !== null ? <span className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-300"><Clock className="w-3.5 h-3.5" />{d.avgDurationMinutes < 60 ? `${d.avgDurationMinutes}m` : `${Math.round(d.avgDurationMinutes / 60)}h ${d.avgDurationMinutes % 60}m`}</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                            <td className="px-4 py-3"><button onClick={() => router.push(`/drivers/${d.driverId}`)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
                    {sortedDrivers.map(d => (
                      <div key={d.driverId} onClick={() => router.push(`/drivers/${d.driverId}`)} className="p-4 active:bg-gray-50 dark:active:bg-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 flex items-center justify-center text-white font-bold flex-shrink-0">{d.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{d.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{d.licenseNumber}</p>
                          </div>
                          {d.onTimeRate !== null && <span className={`text-sm font-bold font-mono ${onTimeColor(d.onTimeRate)}`}>{d.onTimeRate}%</span>}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2"><p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{d.totalTrips}</p><p className="text-xs text-gray-500">Total</p></div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2"><p className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">{d.delivered}</p><p className="text-xs text-green-700 dark:text-green-500">Done</p></div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2"><p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">{d.inTransit}</p><p className="text-xs text-blue-700 dark:text-blue-500">Active</p></div>
                          <div className={`rounded-xl p-2 ${d.delayed > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-slate-700/50'}`}><p className={`text-lg font-bold font-mono ${d.delayed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>{d.delayed}</p><p className={`text-xs ${d.delayed > 0 ? 'text-red-700 dark:text-red-500' : 'text-gray-400'}`}>Delayed</p></div>
                        </div>
                        {d.avgDurationMinutes !== null && (
                          <p className="text-xs text-gray-400 font-mono mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Avg: {d.avgDurationMinutes < 60 ? `${d.avgDurationMinutes}m` : `${Math.round(d.avgDurationMinutes / 60)}h ${d.avgDurationMinutes % 60}m`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination for Driver Performance */}
            {!analyticsLoading && drivers.length > 0 && (
              <div className="px-4 py-4 flex items-center justify-between">
                <button
                  onClick={() => setDriverPage(p => Math.max(1, p - 1))}
                  disabled={driverPage === 1}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Page {driverPage} of {driverMeta.totalPages}
                </span>
                <button
                  onClick={() => setDriverPage(p => Math.min(driverMeta.totalPages, p + 1))}
                  disabled={driverPage === driverMeta.totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Delivery Trends Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-sm"><TrendingUp className="w-4 h-4" /></div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Delivery Trends</h2>
                </div>
                <div className="flex items-center gap-1">
                  {([7, 14, 30] as const).map(d => (
                    <button key={d} onClick={() => setTrendDays(d)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${trendDays === d ? 'bg-blue-600 text-white dark:bg-lime-500 dark:text-black' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>{d}d</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> Delivered</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-400" /> Delayed</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-gray-300 dark:bg-slate-600" /> Cancelled</span>
              </div>
              {trendsLoading ? (
                <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" /></div>
              ) : trends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
                  <Calendar className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No delivery data in the last {trendDays} days</p>
                </div>
              ) : (
                <DeliveryTrendChart data={trends} />
              )}
            </div>
          </div>
        )}

        {/* ── Trips Tab Content ──────────────────────────────────────────── */}
        {activeTab === 'trips' && (
        <>
        {/* Trips List */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <div className="p-4 bg-gradient-to-br from-blue-900 to-blue-900 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">Loading trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <div className="p-4 bg-gradient-to-br from-blue-900 to-blue-900 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold mb-2">No trips found</p>
            </div>
          ) : viewMode === 'list' ? (
            // Table View
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-200/50 dark:border-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Trip #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Weight</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
                  {filteredTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      onClick={() => handleTripClick(trip.id)}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {trip.driver?.user?.firstName || ''} {trip.driver?.user?.lastName || ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{trip.vehicle?.plateNumber || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{trip.order?.deliveryLocation?.address || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{trip.order?.totalWeight || 0} kg</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                          {formatStatus(trip.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {trip.eta ? new Date(trip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Card View (Grid)
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
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
                    {formatStatus(trip.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1 dark:text-gray-300">{trip.order?.deliveryLocation?.address}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-mono">{trip.vehicle?.plateNumber}</span>
                    {trip.order?.totalWeight && (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-mono">
                        <Scale className="w-3 h-3" />
                        {trip.order.totalWeight.toLocaleString()} kg
                      </span>
                    )}
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
            ))}
            </div>
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
        </>
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
