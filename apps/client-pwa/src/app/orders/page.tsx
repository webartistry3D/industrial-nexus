'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, Plus, Search } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  priority?: string;
  totalWeight?: number;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  cargoDescription?: string;
  handlingTags?: Array<string | { tag?: string | object; name?: string; type?: string; value?: string; label?: string }>;
  trip?: {
    id: string;
    status: string;
    eta?: string;
  };
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyOrders({ page, limit: 10 });
      setOrders(data.data || []);
      setMeta(data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryLocation.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ASSIGNED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'IN_TRANSIT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'DELAYED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'text-gray-600 dark:text-gray-400',
      NORMAL: 'text-blue-600 dark:text-blue-400',
      HIGH: 'text-orange-600 dark:text-orange-400',
      URGENT: 'text-red-600 dark:text-red-400 font-bold',
    };
    return colors[priority.toUpperCase()] || 'text-gray-600 dark:text-gray-400';
  };

  const getHandlingTagColor = (tagName: string) => {
    const upperTag = tagName.toUpperCase();
    const colors: Record<string, string> = {
      HEAVY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      FRAGILE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      HAZARDOUS: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      CHEMICAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      VERTICAL_STORAGE_REQUIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      TEMPERATURE_SENSITIVE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      TECHNICAL_PACKAGING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      PERISHABLE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      OVERSIZED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      URGENT: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
    };
    return colors[upperTag] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 pb-24">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            </div>
          </div>
          <button
            onClick={() => router.push('/orders/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4">
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50/50 dark:bg-slate-700/30 rounded-xl p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all duration-300"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-white font-mono">{order.orderNumber}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.cargoDescription && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {order.cargoDescription}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                        {order.deliveryLocation.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {order.priority && (
                          <span className={`font-medium ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </span>
                        )}
                        {order.totalWeight !== undefined && (
                          <span className="font-mono">{order.totalWeight} kg</span>
                        )}
                        <span className="font-mono">{new Date(order.createdAt).toLocaleDateString()}</span>
                        {order.trip?.eta && (
                          <span>• ETA: <span className="font-mono">{new Date(order.trip.eta).toLocaleDateString()}</span></span>
                        )}
                      </div>
                      {order.handlingTags && order.handlingTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {order.handlingTags.map((tag, index) => {
                            let tagText: string;
                            if (typeof tag === 'string') {
                              tagText = tag;
                            } else if (tag && typeof tag === 'object') {
                              const tagObj = tag as Record<string, unknown>;
                              const nestedTag = tagObj.tag;
                              if (nestedTag && typeof nestedTag === 'object') {
                                const nestedTagObj = nestedTag as Record<string, unknown>;
                                tagText = String(nestedTagObj.name || nestedTagObj.type || nestedTagObj.value || nestedTagObj.label || '');
                              } else {
                                tagText = String(tagObj.name || tagObj.type || tagObj.value || tagObj.label || tagObj.tag || '');
                              }
                            } else {
                              tagText = String(tag);
                            }
                            if (!tagText || tagText === '[object Object]') return null;
                            return (
                              <span key={index} className={`px-2 py-0.5 text-xs rounded ${getHandlingTagColor(tagText)}`}>
                                {tagText.replace(/_/g, ' ')}
                              </span>
                            );
                          }).filter(Boolean)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && (
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
      </div>
    </div>
  );
}
