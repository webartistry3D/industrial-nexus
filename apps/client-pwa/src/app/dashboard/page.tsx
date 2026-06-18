'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Package, Truck, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
      <main className="p-4 space-y-4">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {user?.firstName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Client Portal</p>
        </div>

        {/* SLA Status Overview */}
        <div className={`rounded-lg p-4 ${
          slaStatus === 'good' 
            ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
            : slaStatus === 'warning'
            ? 'bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700'
            : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center gap-3">
            {slaStatus === 'good' && <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />}
            {slaStatus === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />}
            {slaStatus === 'critical' && <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-300" />}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                SLA Status: {slaStatus === 'good' ? 'Good' : slaStatus === 'warning' ? 'Warning' : 'Critical'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {stats?.delayed || 0} delayed out of {stats?.activeShipments || 0} active shipments
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.activeShipments || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.inTransit || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-red-500">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.delayed || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delayed</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.delivered || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Shipments */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Shipments</h2>
            <button
              onClick={() => router.push('/tracking')}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
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
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 border-l-4 border-blue-500 dark:border-blue-400"
                  onClick={() => router.push(`/tracking?shipment=${shipment.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{shipment.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {shipment.deliveryLocation.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(shipment.trip?.status || shipment.status)}`}>
                          {shipment.trip?.status || shipment.status}
                        </span>
                        {shipment.trip?.eta && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {recentOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                No recent orders
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 border-l-4 border-gray-400 dark:border-gray-500"
                  onClick={() => router.push(`/tracking?shipment=${order.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                      <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {order.deliveryLocation.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
      </main>
    </div>
  );
}
