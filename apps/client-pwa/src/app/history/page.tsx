'use client';

import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CheckCircle, Clock, XCircle, ArrowRight, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type OrderStatus = 'SUBMITTED' | 'APPROVED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

interface Order {
  id: string;
  cargoDescription: string;
  status: OrderStatus;
  totalWeight: number;
  pickupLocation: {
    address: string;
  };
  deliveryLocation: {
    address: string;
  };
  createdAt: string;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const { user } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getMyOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch order history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      APPROVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      ASSIGNED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      IN_TRANSIT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, any> = {
      SUBMITTED: Clock,
      APPROVED: CheckCircle,
      ASSIGNED: Package,
      IN_TRANSIT: ArrowRight,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle,
    };
    return icons[status] || Package;
  };

  const filteredOrders = filter === 'ALL' ? orders : orders.filter(order => order.status === filter);

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    inTransit: orders.filter(o => o.status === 'IN_TRANSIT').length,
    pending: orders.filter(o => ['SUBMITTED', 'APPROVED', 'ASSIGNED'].includes(o.status)).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">History</h1>
          </div>
        </div>
      </div>
      <main className="p-4 space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{stats.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{stats.delivered}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Delivered</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-md">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{stats.inTransit}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">In Transit</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{stats.pending}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['ALL', 'DELIVERED', 'IN_TRANSIT', 'SUBMITTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {order.cargoDescription || 'Order #' + order.id.slice(-6)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{order.totalWeight} kg</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                        <MapPin className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pickup</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.pickupLocation?.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                        <MapPin className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Delivery</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryLocation?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100/50 dark:border-slate-700/50">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
