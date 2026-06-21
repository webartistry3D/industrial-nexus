'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Package, Truck, Clock, AlertCircle, CheckCircle, TrendingUp, Plus, MapPin } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-semibold">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 pb-24">
      <main className="p-4 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.firstName}</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Here's your shipment update</p>
        </div>

        {/* SLA Status Overview */}
        <div className={`rounded-2xl p-5 shadow-xl backdrop-blur-xl ${
          slaStatus === 'good' 
            ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 dark:border-green-500/20'
            : slaStatus === 'warning'
            ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 dark:border-amber-500/20'
            : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 dark:border-red-500/20'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-lg ${
              slaStatus === 'good' 
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                : slaStatus === 'warning'
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
            }`}>
              {slaStatus === 'good' && <CheckCircle className="w-6 h-6" />}
              {slaStatus === 'warning' && <AlertCircle className="w-6 h-6" />}
              {slaStatus === 'critical' && <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                SLA Status: {slaStatus === 'good' ? 'Good' : slaStatus === 'warning' ? 'Warning' : 'Critical'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {stats?.delayed || 0} delayed out of {stats?.activeShipments || 0} active shipments
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{stats?.activeShipments || 0}</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Active</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 rounded-xl border border-green-200/50 dark:border-green-700/50 shadow-lg shadow-green-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{stats?.inTransit || 0}</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">In Transit</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 rounded-xl border border-red-200/50 dark:border-red-700/50 shadow-lg shadow-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{stats?.delayed || 0}</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Delayed</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/50 dark:border-purple-700/50 shadow-lg shadow-purple-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{stats?.delivered || 0}</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Shipments and Recent Orders - Side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Shipments */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
          <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
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
          <div className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
            {activeShipments.length === 0 ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                No active shipments
              </div>
            ) : (
              activeShipments.slice(0, 3).map((shipment) => (
                <div
                  key={shipment.id}
                  className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent dark:hover:from-blue-900/20 dark:hover:to-transparent border-l-4 border-blue-500 dark:border-blue-400 transition-all duration-200"
                  onClick={() => router.push(`/tracking?shipment=${shipment.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{shipment.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
          <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
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
          <div className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
            {recentOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                No recent orders
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent dark:hover:from-purple-900/20 dark:hover:to-transparent border-l-4 border-gray-400 dark:border-gray-500 transition-all duration-200"
                  onClick={() => router.push(`/tracking?shipment=${order.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-md">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span>New Order</span>
            </button>
            <button
              onClick={() => router.push('/tracking')}
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl border border-green-200/50 dark:border-green-700/50 text-green-700 dark:text-green-400 text-sm font-semibold hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="p-2 bg-green-500 rounded-lg text-white group-hover:scale-110 transition-transform">
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
