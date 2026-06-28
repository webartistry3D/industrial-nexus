'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { DashboardStats, Trip, WeightAlert, Order } from '@/types';
import {
  Package, Truck, Scale, AlertTriangle,
  Route, Radio, UserPlus, Plus,
} from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { AlertsPanel } from '@/components/alerts-panel';
import { TripsOverview } from '@/components/trips-overview';
import { OrdersOverview } from '@/components/orders-overview';
import AnalogClock from '@/components/AnalogClock';
import WeatherWidget from '@/components/WeatherWidget';
import { FleetTracker } from '@/components/fleet-tracker';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<WeightAlert[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLocations, setLiveLocations] = useState<Map<string, { lat: number; lng: number; speed?: number }>>(new Map());

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, tripsData, alertsData, ordersData, allOrdersData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getTrips({ status: 'IN_TRANSIT', limit: 5 }).catch(() => ({ data: [] })),
        api.getWeightAlerts().catch(() => []),
        api.getOrders({ kittingStatus: 'PENDING', limit: 5 }).catch(() => ({ data: [] })),
        api.getOrders({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      const allOrders = allOrdersData.data || [];
      const activeStatuses = ['SUBMITTED', 'APPROVED', 'DISPATCH_READY', 'ASSIGNED', 'IN_TRANSIT'];
      const activeOrders = allOrders.filter((o: Order) => activeStatuses.includes(o.status)).slice(0, 5);
      setStats(statsData);
      setActiveTrips(tripsData.data || []);
      setActiveOrders(activeOrders);
      setAlerts(alertsData || []);
      setPendingOrders(ordersData.data || []);
      const fleetLocations = await api.getActiveFleetLocations('IN_TRANSIT').catch(() => []);
      if (Array.isArray(fleetLocations)) {
        const locationsMap = new Map<string, { lat: number; lng: number; speed?: number }>();
        fleetLocations.forEach((item: any) => {
          if (item.location) locationsMap.set(item.tripId, { lat: item.location.lat, lng: item.location.lng, speed: item.location.speed });
        });
        setLiveLocations(locationsMap);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (data: { tripId: string; lat: number; lng: number; speed?: number }) => {
    setLiveLocations(prev => {
      const updated = new Map(prev);
      updated.set(data.tripId, { lat: data.lat, lng: data.lng, speed: data.speed });
      return updated;
    });
  };

  const handleTripClick = (tripId: string) => {
    if (tripId && tripId !== 'null' && tripId !== 'undefined') router.push(`/trips/${tripId}`);
  };
  const handleAlertClick = (tripId: string) => {
    if (tripId && tripId !== 'null' && tripId !== 'undefined') router.push(`/trips/${tripId}`);
  };
  const handleOrderClick = (orderId: string) => {
    if (orderId && orderId !== 'null' && orderId !== 'undefined') router.push(`/orders/${orderId}`);
  };

  const activeTripsCount = activeTrips.length;
  const delayedTripsCount = activeTrips.filter(t => t.eta && t.status === 'IN_TRANSIT' && new Date(t.eta) < new Date()).length;
  const pendingOrdersCount = pendingOrders.length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {user && <FleetTracker onLocationUpdate={handleLocationUpdate} />}
      <main className="p-4 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-lime-500 dark:bg-none">{user?.firstName}</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">Here's your operations update</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center">
            <AnalogClock />
          </div>
          <WeatherWidget />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Truck} label="Active Trips" value={loading ? '...' : activeTripsCount.toString()} trend={stats ? `${stats.onTimeDelivery}% on time` : undefined} color="blue" onClick={() => router.push('/trips?status=IN_TRANSIT')} />
          <StatCard icon={AlertTriangle} label="Delayed" value={loading ? '...' : delayedTripsCount.toString()} trend={delayedTripsCount > 0 ? 'SLA at risk' : 'All on track'} color={delayedTripsCount > 0 ? 'red' : 'green'} onClick={() => router.push('/trips?status=DELAYED')} />
          <StatCard icon={Scale} label="Weight Alerts" value={loading ? '...' : alerts.length.toString()} trend={alerts.length > 0 ? 'Requires attention' : 'All clear'} color={alerts.length > 0 ? 'yellow' : 'green'} onClick={() => router.push('/trips?filter=weight-alerts')} />
          <StatCard icon={Package} label="Pending Orders" value={loading ? '...' : pendingOrdersCount.toString()} trend={pendingOrdersCount > 0 ? 'Awaiting dispatch' : 'No pending'} color="purple" onClick={() => router.push('/orders?kittingStatus=PENDING')} />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button onClick={fetchDashboardData} className="ml-auto text-sm text-blue-600 hover:underline">Retry</button>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              SLA Status Overview
            </h2>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-3 py-1 rounded-full">12-hour rule</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{loading ? '...' : (stats?.activeTrips || 0) - delayedTripsCount}</div>
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mt-1">On Track</div>
            </div>
            <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 rounded-xl p-4 border border-lime-500/20">
              <div className="text-3xl font-bold text-lime-500 dark:text-lime-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{loading ? '...' : Math.max(0, delayedTripsCount - 1)}</div>
              <div className="text-xs font-medium text-lime-700 dark:text-lime-300 mt-1">At Risk</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-4 border border-red-500/20">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{loading ? '...' : (delayedTripsCount > 0 ? 1 : 0)}</div>
              <div className="text-xs font-medium text-red-700 dark:text-red-300 mt-1">Breached</div>
            </div>
          </div>
        </div>

        <OrdersOverview orders={activeOrders} loading={loading} onOrderClick={handleOrderClick} />
        <TripsOverview trips={activeTrips} loading={loading} onTripClick={handleTripClick} liveLocations={liveLocations} />
        <AlertsPanel alerts={alerts} loading={loading} onAlertClick={handleAlertClick} />

        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => router.push('/orders/new')} className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-blue-600 text-white dark:bg-lime-500 dark:text-black rounded-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
              <span>Create Order</span>
            </button>
            <button onClick={() => router.push('/orders')} className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-blue-600 text-white dark:bg-lime-500 dark:text-black rounded-lg group-hover:scale-110 transition-transform"><Package className="w-4 h-4" /></div>
              <span>View Orders</span>
            </button>
            <button onClick={() => router.push('/trips')} className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-blue-600 text-white dark:bg-lime-500 dark:text-black rounded-lg group-hover:scale-110 transition-transform"><Route className="w-4 h-4" /></div>
              <span>View Trips</span>
            </button>
            <button onClick={() => router.push('/drivers')} className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-blue-600 text-white dark:bg-lime-500 dark:text-black rounded-lg group-hover:scale-110 transition-transform"><UserPlus className="w-4 h-4" /></div>
              <span>View Drivers</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
