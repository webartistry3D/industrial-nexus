'use client';

import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
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
      <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900">
      <main className="p-4 space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Delivered</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">In Transit</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
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
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border-l-4 border-blue-500 dark:border-blue-400"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {order.cargoDescription || 'Order #' + order.id.slice(-6)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.totalWeight} kg</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pickup</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.pickupLocation?.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Delivery</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryLocation?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
