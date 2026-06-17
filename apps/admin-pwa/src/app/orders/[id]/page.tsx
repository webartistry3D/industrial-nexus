'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { 
  Package, ArrowLeft, MapPin, Clock, User, Truck, 
  AlertCircle, CheckCircle2, XCircle, Calendar, Weight,
  Tag, FileText, ChevronRight
} from 'lucide-react';

export default function OrderDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getOrder(orderId);
      setOrder(response);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'IN_TRANSIT':
        return <Truck className="w-6 h-6 text-blue-600" />;
      default:
        return <Package className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      KITTING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      DISPATCH_READY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ASSIGNED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      IN_TRANSIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'text-gray-600 dark:text-gray-400',
      NORMAL: 'text-blue-600 dark:text-blue-400',
      HIGH: 'text-orange-600 dark:text-orange-400',
      URGENT: 'text-red-600 dark:text-red-400 font-bold',
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-pulse">
          <div className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700" />
          <div className="p-4 space-y-4">
            <div className="h-32 bg-white dark:bg-slate-800 rounded-lg" />
            <div className="h-48 bg-white dark:bg-slate-800 rounded-lg" />
            <div className="h-32 bg-white dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-4">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-red-700 dark:text-red-400">{error || 'Order not found'}</p>
              </div>
            </div>
            <button
              onClick={fetchOrder}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-lg ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                {order.priority} Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Cargo Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Cargo Information
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{order.cargoDescription || 'No description'}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{order.totalWeight || 0} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{order.kittingStatus?.replace('_', ' ') || 'N/A'}</span>
            </div>
          </div>

          {order.handlingTags && order.handlingTags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Handling Tags:</p>
              <div className="flex flex-wrap gap-1">
                {order.handlingTags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                    {typeof tag === 'string' ? tag.replace('_', ' ') : String(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Locations
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pickup Location</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.pickupLocation?.address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Location</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.deliveryLocation?.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Client Information
          </h2>
          <p className="text-gray-900 dark:text-white font-medium">
            {order.client?.firstName} {order.client?.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{order.client?.email}</p>
        </div>

        {/* Trip Info (if assigned) */}
        {order.trip && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Trip Assignment
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.trip.status)}`}>
                  {order.trip.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Driver</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {order.trip.driver?.user?.firstName} {order.trip.driver?.user?.lastName}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Vehicle</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {order.trip.vehicle?.plateNumber} ({order.trip.vehicle?.category})
                </span>
              </div>

              {order.trip.eta && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">ETA</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(order.trip.eta).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* View Trip Button */}
            <button
              onClick={() => router.push('/trips')}
              className="mt-4 w-full flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              View Trip Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Order Timeline
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500 dark:text-gray-400 w-20">Created</span>
              <span className="text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-500 dark:text-gray-400 w-20">Updated</span>
              <span className="text-gray-900 dark:text-white">{new Date(order.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
