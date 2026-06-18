'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, MapPin, Truck, Clock, ArrowLeft, CheckCircle2, PackageCheck } from 'lucide-react';

interface HandlingTag {
  id: string;
  orderId: string;
  tag: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  cargoDescription?: string;
  handlingTags?: HandlingTag[];
  trip?: {
    id: string;
    status: string;
    eta?: string;
    driver?: {
      user: { firstName: string; lastName: string };
      vehicle: { plateNumber: string };
    };
  };
  createdAt: string;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOrder(params.id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await api.confirmDelivery(params.id);
      await fetchOrder();
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading(false);
    }
  };

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

  const getHandlingTagColor = (tag: string) => {
    const upperTag = String(tag).toUpperCase();
    switch (upperTag) {
      case 'HEAVY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'FRAGILE':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'HAZARDOUS':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CHEMICAL':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'VERTICAL_STORAGE_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'TEMPERATURE_SENSITIVE':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-semibold">Loading order details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-4 flex items-center gap-2">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Order Details</h1>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 mx-4 mt-4 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Package confirmed received successfully
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mx-4 mt-4 rounded-lg text-red-700 dark:text-red-400">
          {actionError}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-300">
            {error}
          </div>
        ) : order ? (
          <>
            {/* Order Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{order.orderNumber}</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Created: {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Route</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Package className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.pickupLocation.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.deliveryLocation.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cargo Details</h3>
              {order.cargoDescription && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {order.cargoDescription}
                </p>
              )}
              {order.handlingTags && order.handlingTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {order.handlingTags.map((tagObj, index) => (
                    <span key={index} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getHandlingTagColor(tagObj.tag)}`}>
                      {tagObj.tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Trip Information */}
            {order.trip && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Truck className="w-4 h-4" />
                    <span>Status: {order.trip.status}</span>
                  </div>
                  {order.trip.eta && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>ETA: {new Date(order.trip.eta).toLocaleString()}</span>
                    </div>
                  )}
                  {order.trip.driver && (
                    <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Driver</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.trip.driver.user.firstName} {order.trip.driver.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vehicle: {order.trip.driver.vehicle.plateNumber}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/tracking?shipment=${order.id}`)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Track Shipment
                </button>
              </div>
            )}

            {/* Package Received Button for IN_TRANSIT orders */}
            {order.status === 'IN_TRANSIT' && (
              <button
                onClick={handleConfirmDelivery}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PackageCheck className="w-5 h-5" />
                {actionLoading ? 'Confirming...' : 'Package Received'}
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
