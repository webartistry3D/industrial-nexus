'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { DashboardStats, Trip, WeightAlert, Order } from '@/types';
import { 
  LayoutDashboard, Package, Truck, MapPin, Scale, Users, AlertTriangle,
  Plus, Route, Radio, UserPlus, ChevronRight, Navigation, Clock, CheckCircle,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { AlertsPanel } from '@/components/alerts-panel';
import { TripsOverview } from '@/components/trips-overview';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<WeightAlert[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Parallel data fetching
      const [statsData, tripsData, alertsData, ordersData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getTrips({ status: 'IN_TRANSIT', limit: 5 }).catch(() => ({ data: [] })),
        api.getWeightAlerts().catch(() => []),
        api.getOrders({ status: 'SUBMITTED', limit: 5 }).catch(() => ({ data: [] }))
      ]);
      
      setStats(statsData);
      setActiveTrips(tripsData.data || []);
      setAlerts(alertsData || []);
      setPendingOrders(ordersData.data || []);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Quick action handlers
  const handleNewOrder = () => router.push('/orders/new');
  const handleAssignTrip = () => router.push('/trips/assign');
  const handleTrackFleet = () => router.push('/trips');
  const handleManageDrivers = () => router.push('/drivers');
  const handleViewAllOrders = () => router.push('/orders');
  const handleViewAllTrips = () => router.push('/trips');
  const handleTripClick = (tripId: string) => router.push(`/trips/${tripId}`);
  const handleAlertClick = (tripId: string) => router.push(`/trips/${tripId}`);

  // Calculate derived stats
  const activeTripsCount = activeTrips.length;
  const delayedTripsCount = activeTrips.filter(t => {
    if (!t.startedAt) return false;
    const hoursElapsed = (Date.now() - new Date(t.startedAt).getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 11; // SLA breach imminent after 11 hours
  }).length;
  const weightAlertsCount = alerts.filter(a => a.status === 'WARNING' || a.status === 'OVERLOADED').length;
  const pendingOrdersCount = pendingOrders.length;

  if (authLoading || (!user && !error)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-lg font-semibold">Control Tower</h1>
          </div>
          <div className="text-sm text-gray-300">
            {user?.firstName} {user?.lastName}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Truck}
            label="Active Trips"
            value={loading ? '...' : activeTripsCount.toString()}
            trend={stats ? `${stats.onTimeDelivery}% on time` : undefined}
            color="blue"
            onClick={handleViewAllTrips}
          />
          <StatCard
            icon={AlertTriangle}
            label="Delayed"
            value={loading ? '...' : delayedTripsCount.toString()}
            trend={delayedTripsCount > 0 ? 'SLA at risk' : 'All on track'}
            color={delayedTripsCount > 0 ? 'red' : 'green'}
          />
          <StatCard
            icon={Scale}
            label="Weight Alerts"
            value={loading ? '...' : weightAlertsCount.toString()}
            trend={weightAlertsCount > 0 ? 'Requires attention' : 'All clear'}
            color={weightAlertsCount > 0 ? 'yellow' : 'green'}
          />
          <StatCard
            icon={Package}
            label="Pending Orders"
            value={loading ? '...' : pendingOrdersCount.toString()}
            trend={pendingOrdersCount > 0 ? 'Awaiting dispatch' : 'No pending'}
            color="purple"
            onClick={handleViewAllOrders}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* SLA Status */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">SLA Status Overview</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">12-hour rule</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : (stats?.activeTrips || 0) - delayedTripsCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">On Track</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {loading ? '...' : Math.max(0, delayedTripsCount - 1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">At Risk</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {loading ? '...' : (delayedTripsCount > 0 ? 1 : 0)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Breached</div>
            </div>
          </div>
        </div>

        {/* Active Trips */}
        <TripsOverview trips={activeTrips} loading={loading} onTripClick={handleTripClick} />

        {/* Weight Watch Alerts */}
        <AlertsPanel alerts={alerts} loading={loading} onAlertClick={handleAlertClick} />

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleNewOrder}
              className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
            <button 
              onClick={handleAssignTrip}
              className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Route className="w-4 h-4" />
              Assign Trip
            </button>
            <button 
              onClick={handleTrackFleet}
              className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-700 dark:text-purple-400 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Radio className="w-4 h-4" />
              Track Fleet
            </button>
            <button 
              onClick={handleManageDrivers}
              className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-700 dark:text-orange-400 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Drivers
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}
