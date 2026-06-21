'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';
import { api } from '@/lib/api';
import { DashboardStats, Trip, WeightAlert, Order } from '@/types';
import {
  Package, Truck, Scale, AlertTriangle,
  Route, Radio, UserPlus,
} from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { AlertsPanel } from '@/components/alerts-panel';
import { TripsOverview } from '@/components/trips-overview';
import AnalogClock from '@/components/AnalogClock';
import WeatherWidget from '@/components/WeatherWidget';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected, subscribe, unsubscribe } = useTrackingWebSocket();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<WeightAlert[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [heavyOrdersCount, setHeavyOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLocations, setLiveLocations] = useState<Map<string, { lat: number; lng: number; speed?: number }>>(new Map());

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchDashboardData();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isConnected) subscribe('location:update', handleLocationUpdate);
    return () => { if (isConnected) unsubscribe('location:update'); };
  }, [isConnected]);

  const handleLocationUpdate = (data: any) => {
    setLiveLocations(prev => {
      const updated = new Map(prev);
      updated.set(data.tripId, { lat: data.lat, lng: data.lng, speed: data.speed });
      return updated;
    });
  };

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
      setStats(statsData);
      setActiveTrips(tripsData.data || []);
      setAlerts(alertsData || []);
      setPendingOrders(ordersData.data || []);
      setHeavyOrdersCount(allOrders.filter((o: Order) =>
        o.handlingTags?.some((tag: string | object) => {
          const tagStr = typeof tag === 'string' ? tag : JSON.stringify(tag);
          return tagStr.toUpperCase().includes('HEAVY');
        }) || o.cargoDescription?.toUpperCase().includes('HEAVY')
      ).length);
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

  const handleTripClick = (tripId: string) => {
    if (tripId && tripId !== 'null' && tripId !== 'undefined') router.push(`/trips/${tripId}`);
  };
  const handleAlertClick = (tripId: string) => {
    if (tripId && tripId !== 'null' && tripId !== 'undefined') router.push(`/trips/${tripId}`);
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

  if (!user) { router.push('/login'); return null; }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="p-4 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.firstName}</span>
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
          <StatCard icon={Scale} label="Weight Alerts" value={loading ? '...' : heavyOrdersCount.toString()} trend={heavyOrdersCount > 0 ? 'Requires attention' : 'All clear'} color={heavyOrdersCount > 0 ? 'yellow' : 'green'} onClick={() => router.push('/orders?cargoType=HEAVY')} />
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
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono">{loading ? '...' : (stats?.activeTrips || 0) - delayedTripsCount}</div>
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mt-1">On Track</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/20">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">{loading ? '...' : Math.max(0, delayedTripsCount - 1)}</div>
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-1">At Risk</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-4 border border-red-500/20">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 font-mono">{loading ? '...' : (delayedTripsCount > 0 ? 1 : 0)}</div>
              <div className="text-xs font-medium text-red-700 dark:text-red-300 mt-1">Breached</div>
            </div>
          </div>
        </div>

        <TripsOverview trips={activeTrips} loading={loading} onTripClick={handleTripClick} liveLocations={liveLocations} />
        <AlertsPanel alerts={alerts} loading={loading} onAlertClick={handleAlertClick} />

        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/orders')} className="group flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform"><Package className="w-4 h-4" /></div>
              <span>View Orders</span>
            </button>
            <button onClick={() => router.push('/trips')} className="group flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl border border-green-200/50 dark:border-green-700/50 text-green-700 dark:text-green-400 text-sm font-semibold hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-green-500 rounded-lg text-white group-hover:scale-110 transition-transform"><Route className="w-4 h-4" /></div>
              <span>View Trips</span>
            </button>
            <button onClick={() => router.push('/trips')} className="group flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-400 text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-purple-500 rounded-lg text-white group-hover:scale-110 transition-transform"><Radio className="w-4 h-4" /></div>
              <span>Track Fleet</span>
            </button>
            <button onClick={() => router.push('/drivers')} className="group flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-orange-800/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50 text-orange-700 dark:text-orange-400 text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-2 bg-orange-500 rounded-lg text-white group-hover:scale-110 transition-transform"><UserPlus className="w-4 h-4" /></div>
              <span>Drivers</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
