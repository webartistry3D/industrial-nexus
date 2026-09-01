'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Package, MapPin, Truck, Clock, ArrowLeft, CheckCircle2, PackageCheck, FileCheck, User, Phone, StickyNote, ImageIcon } from 'lucide-react';
import { SlaIndicator } from '@/components/sla-indicator';

interface HandlingTag {
  id: string;
  orderId: string;
  tagId: string;
  tag: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface POD {
  id: string;
  imageUrl?: string;
  imageKey?: string;
  signatureUrl?: string;
  signatureKey?: string;
  receiverName?: string;
  receiverPhone?: string;
  notes?: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';
  distanceKm: number;
  baseFreightCharge: number;
  weightCharge: number;
  handlingSurcharges: Record<string, number>;
  priorityMultiplier: number;
  subtotal: number;
  insurancePremium: number;
  vatAmount: number;
  totalAmount: number;
  issuedAt?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  cargoDescription?: string;
  handlingTags?: HandlingTag[];
  declaredCargoValue?: number;
  requesterName?: string;
  requesterPhone?: string;
  trip?: {
    id: string;
    status: string;
    eta?: string;
    startedAt?: string;
    driver?: {
      user: { firstName: string; lastName: string };
      vehicle?: { plateNumber: string } | null;
    };
    vehicle?: { plateNumber: string } | null;
    pod?: POD | null;
  };
  invoice?: Invoice | null;
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
  const [podPhotoUrl, setPodPhotoUrl] = useState<string | null>(null);
  const [podSignatureUrl, setPodSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  useEffect(() => {
    const loadPodUrls = async () => {
      setPodPhotoUrl(null);
      setPodSignatureUrl(null);
      const trip = order?.trip;
      const pod = trip?.pod;
      if (!trip || !pod) return;
      try {
        if (pod.imageKey || pod.imageUrl) {
          const { url } = await api.getPODPhotoUrl(trip.id);
          setPodPhotoUrl(url);
        }
        if (pod.signatureKey || pod.signatureUrl) {
          const { url } = await api.getPODSignatureUrl(trip.id);
          setPodSignatureUrl(url);
        }
      } catch (e) {
        console.warn('Failed to load POD signed URLs:', e);
      }
    };
    loadPodUrls();
  }, [order]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg mb-4">
          <Package className="w-8 h-8 text-white" />
        </div>
        <p className="text-blue-600 font-semibold">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 pb-24">
      {/* Header */}
      <div className="h-16 bg-slate-900/90 backdrop-blur-xl text-white px-4 flex items-center gap-2 border-b border-slate-700/50">
        <button onClick={() => router.back()} className="text-white hover:text-blue-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Order Details</h1>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border border-green-200/50 dark:border-green-800/50 p-4 mx-4 mt-4 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          Package confirmed received successfully
        </div>
      )}
      {actionError && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-800/50 p-4 mx-4 mt-4 rounded-xl text-red-700 dark:text-red-400 shadow-lg">
          {actionError}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error ? (
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-4 text-red-800 dark:text-red-300 shadow-lg">
            {error}
          </div>
        ) : order ? (
          <>
            {/* Order Info */}
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-mono">{order.orderNumber}</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {formatStatus(order.status)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                Created: {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Client Information */}
            {(order.requesterName || order.requesterPhone) && (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  Client Information
                </h3>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Requester</p>
                  {order.requesterName && (
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {order.requesterName}
                    </p>
                  )}
                  {order.requesterPhone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {order.requesterPhone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Locations */}
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Route</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.pickupLocation.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
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

            {/* Invoice */}
            {order.invoice && (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    order.invoice.status === 'PAID'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : order.invoice.status === 'ISSUED'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : order.invoice.status === 'VOID'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {formatStatus(order.invoice.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-4">{order.invoice.invoiceNumber}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Freight</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{order.invoice.baseFreightCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weight Charge</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{order.invoice.weightCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {Object.entries(order.invoice.handlingSurcharges).map(([tag, amount]) => (
                    <div key={tag} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Handling ({tag})</span>
                      <span className="font-medium text-gray-900 dark:text-white">₦{(amount as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{order.invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Insurance Premium</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{order.invoice.insurancePremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">VAT</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{order.invoice.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-blue-600 dark:text-blue-400">₦{order.invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cargo Details */}
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cargo Details</h3>
              {order.cargoDescription && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {order.cargoDescription}
                </p>
              )}
              {order.handlingTags && order.handlingTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {order.handlingTags.map((tagObj, index) => {
                    // Extract tag name from nested object returned by backend
                    let tagName: string;
                    if (tagObj && typeof tagObj === 'object') {
                      const nestedTag = tagObj.tag;
                      if (nestedTag && typeof nestedTag === 'object') {
                        tagName = String(nestedTag.name || '');
                      } else {
                        tagName = String(tagObj.tag || '');
                      }
                    } else {
                      tagName = String(tagObj);
                    }
                    if (!tagName) return null;
                    return (
                      <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHandlingTagColor(tagName)}`}>
                        {formatStatus(tagName)}
                      </span>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </div>

            {/* Trip Information */}
            {order.trip && (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-900 to-blue-900 shadow-sm">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <span>Status: {formatStatus(order.trip.status)}</span>
                  </div>
                  {order.trip.startedAt && order.trip.status === 'IN_TRANSIT' && (
                    <div className="mt-1">
                      <SlaIndicator startedAt={order.trip.startedAt} />
                    </div>
                  )}
                  {order.trip.eta && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <span>ETA: <span className="font-mono">{new Date(order.trip.eta).toLocaleString()}</span></span>
                    </div>
                  )}
                  {order.trip.driver && (
                    <div className="pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Driver</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.trip.driver.user.firstName} {order.trip.driver.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        Vehicle: {(order.trip.vehicle ?? order.trip.driver.vehicle)?.plateNumber || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/tracking?shipment=${order.id}`)}
                  className="mt-4 w-full bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Track Shipment
                </button>
              </div>
            )}
            </div>

            {/* Proof of Delivery */}
            {order.trip?.pod && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proof of Delivery</h3>
                  <span className="ml-auto px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">Captured</span>
                </div>

                <div className="space-y-4">
                  {/* POD Image */}
                  {podPhotoUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Delivery Photo
                      </p>
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                        <img
                          src={podPhotoUrl}
                          alt="Proof of delivery photo"
                          className="w-full max-h-64 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Signature */}
                  {podSignatureUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" /> Receiver Signature
                      </p>
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                        <img
                          src={podSignatureUrl}
                          alt="Receiver signature"
                          className="w-full max-h-32 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Receiver Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.trip.pod.receiverName && (
                      <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Received by</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.trip.pod.receiverName}</p>
                        </div>
                      </div>
                    )}
                    {order.trip.pod.receiverPhone && (
                      <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{order.trip.pod.receiverPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {order.trip.pod.notes && (
                    <div className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.trip.pod.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Captured timestamp */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono text-right">
                    Captured: {new Date(order.trip.pod.capturedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Package Received Button for IN_TRANSIT orders */}
            {order.status === 'IN_TRANSIT' && (
              <button
                onClick={handleConfirmDelivery}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
