'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Order, PaginatedResponse } from '@/types';
import { Package, Search, Filter, ChevronRight, AlertCircle, Plus, RefreshCw, X, Scale } from 'lucide-react';

const CARGO_TYPES = [
  { value: '', label: 'All Cargo Types' },
  { value: 'HEAVY', label: 'Heavy' },
  { value: 'CHEMICAL', label: 'Chemical' },
  { value: 'HAZARDOUS', label: 'Hazardous' },
  { value: 'VERTICAL_STORAGE_REQUIRED', label: 'Vertical Storage' },
  { value: 'TECHNICAL_PACKAGING', label: 'Technical Packaging' },
  { value: 'FRAGILE', label: 'Fragile' },
  { value: 'PERISHABLE', label: 'Perishable' },
];

const KITTING_STATUS_OPTIONS = [
  { value: '', label: 'All Flags' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'AGGREGATION', label: 'Aggregation' },
  { value: 'TECHNICAL_PACKAGING', label: 'Technical Packaging' },
  { value: 'QUALITY_CHECK', label: 'Quality Check' },
  { value: 'DISPATCH_READY', label: 'Dispatch Ready' },
];

function OrdersPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cargoTypeParam = searchParams.get('cargoType');
  const statusParam = searchParams.get('status');
  const kittingStatusParam = searchParams.get('kittingStatus');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || '');
  const [cargoTypeFilter, setCargoTypeFilter] = useState(cargoTypeParam || '');
  const [kittingStatusFilter, setKittingStatusFilter] = useState(kittingStatusParam || '');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    setCargoTypeFilter('');
    setKittingStatusFilter('');
    setPage(1);
    // Clear URL params if present
    if (cargoTypeParam || statusParam || kittingStatusParam) {
      router.push('/orders');
    }
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

  // Apply client-side filtering
  const filteredOrders = useMemo(() => {
    let result = orders;
    
    // Apply kitting status filter
    if (kittingStatusFilter) {
      result = result.filter(order => order.kittingStatus === kittingStatusFilter);
    }
    
    // Apply cargo type filter
    if (cargoTypeFilter || cargoTypeParam) {
      const filterValue = (cargoTypeFilter || cargoTypeParam || '').toUpperCase();
      result = result.filter(order => {
        // Check in handlingTags (array of strings or objects)
        if (order.handlingTags && order.handlingTags.length > 0) {
          return order.handlingTags.some(tag => {
            const tagStr = typeof tag === 'string' ? tag : JSON.stringify(tag);
            return tagStr.toUpperCase().includes(filterValue);
          });
        }
        // Check in cargoDescription as fallback
        if (order.cargoDescription) {
          return order.cargoDescription.toUpperCase().includes(filterValue);
        }
        return false;
      });
    }
    
    // Apply search filter
    if (search) {
      result = result.filter(order =>
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.cargoDescription?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [orders, kittingStatusFilter, cargoTypeFilter, cargoTypeParam, search]);

  const userRole = (user?.role?.toLowerCase() as 'admin' | 'client' | 'driver') || 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {(cargoTypeFilter || cargoTypeParam) ? `${cargoTypeFilter || cargoTypeParam} Orders` : 
                   (statusFilter || statusParam) ? `${statusFilter || statusParam} Orders` : 
                   (kittingStatusFilter || kittingStatusParam) ? `${KITTING_STATUS_OPTIONS.find(opt => opt.value === (kittingStatusFilter || kittingStatusParam))?.label} Orders` :
                   'Orders'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(cargoTypeFilter || cargoTypeParam) ? `Filtered by cargo type` :
                   (statusFilter || statusParam) ? `Filtered by status` :
                   (kittingStatusFilter || kittingStatusParam) ? `Filtered by flag` :
                   // 'Manage industrial orders'
                   ''}
                </p>
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
              {/* <button
                onClick={handleNewOrder}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                New
              </button> */}
            </div>
          </div>

          {/* Search & Filters - Responsive Layout */}
          <div className="flex flex-col md:flex-row gap-2">
            {/* Search - Full width on mobile, flex-1 on desktop */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all"
              />
            </div>
            
            {/* Filters Row - Stack vertically on mobile, inline on desktop */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {/* Cargo Type Filter */}
              <div className="relative w-full md:flex-none md:w-auto md:min-w-[160px]">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={cargoTypeFilter || cargoTypeParam || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCargoTypeFilter(value);
                    setPage(1);
                    // Clear URL param when using dropdown
                    if (cargoTypeParam && value) {
                      router.push('/orders');
                    }
                  }}
                  className="w-full md:w-auto md:min-w-[160px] pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                >
                  {CARGO_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value);
                  setPage(1);
                  // Clear URL param when using dropdown
                  if (statusParam && value) {
                    router.push('/orders');
                  }
                }}
                className="w-full md:flex-none md:w-auto md:min-w-[140px] px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all"
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
              
              {/* Kitting Status Filter (Flags) */}
              <select
                value={kittingStatusFilter}
                onChange={(e) => {
                  setKittingStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full md:flex-none md:w-auto md:min-w-[160px] px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all"
              >
                {KITTING_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active Filters */}
          {(search || statusFilter || statusParam || cargoTypeFilter || cargoTypeParam || kittingStatusFilter) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                  Search: &quot;{search}&quot;
                  <button onClick={() => setSearch('')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(statusFilter || statusParam) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                  Status: {statusFilter || statusParam}
                  <button 
                    onClick={() => {
                      setStatusFilter('');
                      if (statusParam) router.push('/orders');
                    }} 
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(cargoTypeFilter || cargoTypeParam) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                  <Scale className="w-3 h-3" />
                  Cargo: {cargoTypeFilter || cargoTypeParam}
                  <button 
                    onClick={() => {
                      setCargoTypeFilter('');
                      if (cargoTypeParam) router.push('/orders');
                    }} 
                    className="hover:text-amber-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {kittingStatusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                  Flag: {KITTING_STATUS_OPTIONS.find(opt => opt.value === kittingStatusFilter)?.label || kittingStatusFilter}
                  <button 
                    onClick={() => setKittingStatusFilter('')}
                    className="hover:text-purple-900"
                  >
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
          <div className="mx-4 mt-4 bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-5 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-xl font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300"
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
                <div key={i} className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 animate-pulse">
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
            <div className="text-center py-12 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold mb-2">No orders found</p>
              {(search || statusFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
                className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 cursor-pointer hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white font-mono">{order.orderNumber || `Order ${String(order.id).slice(0, 8)}`}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.client?.firstName || ''} {order.client?.lastName || ''}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status?.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{order.cargoDescription || 'No description'}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono">{order.totalWeight || 0} kg</span>
                    {order.trip?.eta && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
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
                    {order.handlingTags.map((tag, index) => {
                      // Robust tag extraction to prevent [object Object]
                      let tagText: string;
                      if (typeof tag === 'string') {
                        tagText = tag;
                      } else if (tag && typeof tag === 'object') {
                        const tagObj = tag as Record<string, unknown>;
                        const rawValue = tagObj.type || tagObj.name || tagObj.value || tagObj.label || tagObj.handlingTag || tagObj.tag;
                        if (rawValue !== undefined && rawValue !== null) {
                          tagText = String(rawValue);
                        } else {
                          const firstStringProp = Object.values(tagObj).find(v => typeof v === 'string');
                          tagText = firstStringProp ? String(firstStringProp) : JSON.stringify(tagObj);
                        }
                      } else {
                        tagText = String(tag);
                      }
                      return (
                        <span key={index} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                          {tagText.replace(/_/g, ' ')}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && meta.totalPages > 1 && (
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
      </main>

      {/* Mobile FAB for New Order */}
      {/* <button
        onClick={handleNewOrder}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-300 md:hidden z-50"
      >
        <Plus className="w-6 h-6" />
      </button> */}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
