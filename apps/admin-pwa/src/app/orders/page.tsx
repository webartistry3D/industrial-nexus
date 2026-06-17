'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Order, PaginatedResponse } from '@/types';
import { Package, Search, Filter, ChevronRight, AlertCircle, Plus, RefreshCw, X } from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<Order> = await api.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setOrders(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleNewOrder = () => {
    router.push('/orders/new');
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      KITTING: 'bg-yellow-100 text-yellow-800',
      DISPATCH_READY: 'bg-purple-100 text-purple-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      IN_TRANSIT: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'text-gray-600',
      NORMAL: 'text-blue-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600 font-bold',
    };
    return colors[priority] || 'text-gray-600';
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    order.cargoDescription?.toLowerCase().includes(search.toLowerCase())
  );

  const userRole = (user?.role?.toLowerCase() as 'admin' | 'client' | 'driver') || 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage industrial orders</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleNewOrder}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="KITTING">Kitting</option>
              <option value="DISPATCH_READY">Dispatch Ready</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          {/* Active Filters */}
          {(search || statusFilter) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                  Search: &quot;{search}&quot;
                  <button onClick={() => setSearch('')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button 
                onClick={clearFilters}
                className="text-xs text-red-600 dark:text-red-400 hover:underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
              <button
                onClick={fetchOrders}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="p-4 space-y-3">
          {loading ? (
            // Skeleton Loading State
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full" />
                  </div>
                  <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
                      <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="dark:text-gray-400 mb-2">No orders found</p>
              {(search || statusFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.client?.firstName} {order.client?.lastName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{order.cargoDescription || 'No description'}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">{order.totalWeight || 0} kg</span>
                    {order.trip?.eta && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ETA: {new Date(order.trip.eta).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <span className="text-xs">{order.kittingStatus?.replace('_', ' ') || 'N/A'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {order.handlingTags && order.handlingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {order.handlingTags.map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        {typeof tag === 'string' ? tag.replace('_', ' ') : String(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Mobile FAB for New Order */}
      <button
        onClick={handleNewOrder}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all md:hidden z-50"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
