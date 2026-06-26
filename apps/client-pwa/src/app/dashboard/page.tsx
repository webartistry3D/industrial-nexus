'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Package, Truck, Clock, AlertCircle, CheckCircle, TrendingUp, Plus, MapPin } from 'lucide-react';
import AnalogClock from '@/components/AnalogClock';
import WeatherWidget from '@/components/WeatherWidget';
import { StatCard } from '@/components/stat-card';

interface DashboardStats {
  activeShipments: number;
  inTransit: number;
  delayed: number;
  delivered: number;
  totalOrders: number;
}

interface Shipment {
  id: string;
  orderNumber: string;
  cargoDescription?: string;
  status: string;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  trip?: {
    id: string;
    status: string;
    eta?: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Shipment[]>([]);
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch orders data
      const ordersData = await api.getMyOrders();
      const orders = ordersData.data || [];
      
      // Calculate stats
      const activeShipmentsCount = orders.filter((o: Shipment) => 
        o.trip?.status === 'IN_TRANSIT' || o.trip?.status === 'ASSIGNED'
      ).length;
      const inTransitCount = orders.filter((o: Shipment) => o.trip?.status === 'IN_TRANSIT').length;
      const delayedCount = orders.filter((o: Shipment) => o.status === 'DELAYED').length;
      const deliveredCount = orders.filter((o: Shipment) => o.status === 'DELIVERED').length;
      
      setStats({
        activeShipments: activeShipmentsCount,
        inTransit: inTransitCount,
        delayed: delayedCount,
        delivered: deliveredCount,
        totalOrders: orders.length,
      });
      
      // Recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));
      
      // Active shipments
      setActiveShipments(orders.filter((o: Shipment) => 
        o.trip?.status === 'IN_TRANSIT' || o.trip?.status === 'ASSIGNED'
      ));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'ASSIGNED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'DELAYED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getHandlingTagColor = (tag: string) => {
    const upperTag = tag.toUpperCase();
    switch (upperTag) {
      case 'HEAVY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'FRAGILE':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'HAZARDOUS':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'OVERSIZED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'PERISHABLE':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSLAStatus = () => {
    if (!stats) return 'neutral';
    if (stats.activeShipments === 0) return 'neutral';
    const delayedRatio = stats.delayed / stats.activeShipments;
    if (delayedRatio === 0) return 'good';
    if (delayedRatio < 0.2) return 'warning';
    return 'critical';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const slaStatus = getSLAStatus();

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 pb-24">
      <main className="p-4 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-blue-400 dark:bg-none">{user?.firstName}</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">Here's your shipment update</p>
        </div>

        {/* Clock and Weather Widgets */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-blue-500/10 border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center">
            <AnalogClock />
          </div>
          <WeatherWidget />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Truck} label="Active Shipment" value={loading ? '...' : (stats?.activeShipments || 0).toString()} color="blue" onClick={() => router.push('/orders?status=ASSIGNED')} />
          <StatCard icon={Clock} label="In Transit" value={loading ? '...' : (stats?.inTransit || 0).toString()} color="green" onClick={() => router.push('/orders?status=IN_TRANSIT')} />
          <StatCard icon={AlertCircle} label="Delayed" value={loading ? '...' : (stats?.delayed || 0).toString()} color={(stats?.delayed || 0) > 0 ? 'red' : 'green'} onClick={() => router.push('/orders?status=DELAYED')} />
          <StatCard icon={CheckCircle} label="Delivered" value={loading ? '...' : (stats?.delivered || 0).toString()} color="purple" onClick={() => router.push('/orders?status=DELIVERED')} />
        </div>

        {/* SLA Status */}
        <div className={`rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-700 ${
          slaStatus === 'good'
            ? 'bg-white dark:bg-slate-800'
            : slaStatus === 'warning'
            ? 'bg-white dark:bg-slate-800'
            : 'bg-white dark:bg-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              slaStatus === 'good'
                ? 'bg-green-500 text-white'
                : slaStatus === 'warning'
                ? 'bg-amber-500 text-white'
                : slaStatus === 'neutral'
                ? 'bg-gray-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {slaStatus === 'good' && <CheckCircle className="w-6 h-6" />}
              {slaStatus === 'warning' && <AlertCircle className="w-6 h-6" />}
              {slaStatus === 'neutral' && <CheckCircle className="w-6 h-6" />}
              {slaStatus === 'critical' && <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                SLA Status: {slaStatus === 'good' ? 'Good' : slaStatus === 'warning' ? 'Warning' : slaStatus === 'neutral' ? 'Neutral' : 'Critical'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {stats?.delayed || 0} delayed out of {stats?.activeShipments || 0} active shipments
              </p>
            </div>
          </div>
        </div>

        {/* Active Shipments and Recent Orders - Side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Shipments */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Active Shipments
            </h2>
            <button
              onClick={() => router.push('/tracking')}
              className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {activeShipments.length === 0 ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                No active shipments
              </div>
            ) : (
              activeShipments.slice(0, 3).map((shipment) => (
                <div
                  key={shipment.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 border-l-4 border-blue-500 dark:border-blue-400"
                  onClick={() => router.push(`/tracking?shipment=${shipment.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{shipment.orderNumber}</p>
                      {shipment.cargoDescription && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {shipment.cargoDescription}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                        {shipment.deliveryLocation.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(shipment.trip?.status || shipment.status)}`}>
                          {shipment.trip?.status || shipment.status}
                        </span>
                        {shipment.trip?.eta && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            ETA: {new Date(shipment.trip.eta).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Recent Orders
            </h2>
            <button
              onClick={() => router.push('/orders')}
              className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {recentOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                No recent orders
              </div>
            ) : (
              recentOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 border-l-4 border-gray-400 dark:border-gray-500"
                  onClick={() => router.push(`/tracking?shipment=${order.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gray-400">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{order.orderNumber}</p>
                      {order.cargoDescription && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {order.cargoDescription}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                        {order.deliveryLocation.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/orders/new')}
              className="group flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <Plus className="w-4 h-4" />
              </div>
              <span>New Order</span>
            </button>
            <button
              onClick={() => router.push('/tracking')}
              className="group flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/50"
            >
              <div className="p-2 bg-green-500 rounded-lg text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <span>Track Order</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
