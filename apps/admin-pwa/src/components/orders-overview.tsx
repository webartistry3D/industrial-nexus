'use client';

import { Order } from '@/types';
import { Package, MapPin, Clock, Scale } from 'lucide-react';

interface OrdersOverviewProps {
  orders: Order[];
  loading?: boolean;
  onOrderClick?: (orderId: string) => void;
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    case 'APPROVED':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'DISPATCH_READY':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'ASSIGNED':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    case 'IN_TRANSIT':
      return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
    default:
      return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
  }
}

function getKittingStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
    case 'AGGREGATION':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'TECHNICAL_PACKAGING':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    case 'QUALITY_CHECK':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    case 'DISPATCH_READY':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    default:
      return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
  }
}

export function OrdersOverview({ orders, loading = false, onOrderClick }: OrdersOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Active Orders</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-white">Active Orders</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{orders.length} orders</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active orders</p>
        </div>
      ) : (
        <div className="max-h-[180px] overflow-y-auto space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => onOrderClick?.(order.id)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-700/30 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-900 dark:text-white font-mono">{order.orderNumber}</span>
                <span className={`status-badge ${getStatusColor(order.status)}`}>
                  {order.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Package className="w-4 h-4" />
                  <span>{order.cargoDescription || 'No description'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Scale className="w-4 h-4" />
                  <span>{order.totalWeight} kg</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{order.pickupLocation?.address || 'No pickup address'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(order.createdAt)}</span>
                </div>
              </div>

              {order.kittingStatus && (
                <div className="mt-2">
                  <span className={`status-badge ${getKittingStatusColor(order.kittingStatus)}`}>
                    {order.kittingStatus === 'DISPATCH_READY'
                      ? 'DISPATCH READY'
                      : `Kitting: ${order.kittingStatus?.replace('_', ' ')}`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
