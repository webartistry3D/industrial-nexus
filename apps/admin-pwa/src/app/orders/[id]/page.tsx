'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { 
  Package, ArrowLeft, MapPin, Clock, User, Truck, 
  AlertCircle, CheckCircle2, XCircle, Calendar, Weight,
  Tag, FileText, ChevronRight, Play, Check, Wrench,
  UserPlus, Send
} from 'lucide-react';

export default function OrderDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    status: string;
    timestamp: Date;
    description: string;
  }>>([]);
  const [showKittingModal, setShowKittingModal] = useState(false);
  const [kittingStep, setKittingStep] = useState(0);
  const [kittingData, setKittingData] = useState({
    materialsPrepared: false,
    packagingComplete: false,
    qualityCheckPassed: false,
    finalInspectionPassed: false,
    notes: '',
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const response = await api.getOrder(orderId);
      setOrder(response);
      
      // Build timeline history based on order status
      const events = [
        {
          status: 'Created',
          timestamp: new Date(response.createdAt),
          description: 'Order created',
        },
      ];
      
      // Add status change events based on current status
      const statusOrder = ['DRAFT', 'SUBMITTED', 'APPROVED', 'KITTING', 'DISPATCH_READY', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'REJECTED', 'CANCELLED'];
      const currentIndex = statusOrder.indexOf(response.status);
      
      if (currentIndex > 0) {
        for (let i = 1; i <= currentIndex; i++) {
          const status = statusOrder[i];
          const description = getStatusDescription(status);
          events.push({
            status,
            timestamp: new Date(response.updatedAt), // Using updatedAt for subsequent events
            description,
          });
        }
      }
      
      setTimelineEvents(events);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Order drafted';
      case 'SUBMITTED':
        return 'Order submitted for processing';
      case 'APPROVED':
        return 'Order approved by Superadmin';
      case 'KITTING':
        return 'Kitting process started';
      case 'DISPATCH_READY':
        return 'Kitting completed, ready for dispatch';
      case 'ASSIGNED':
        return 'Driver assigned to order';
      case 'IN_TRANSIT':
        return 'Trip started by driver';
      case 'DELIVERED':
        return 'Package received by client';
      case 'REJECTED':
        return 'Order rejected';
      case 'CANCELLED':
        return 'Order cancelled';
      default:
        return status;
    }
  };

  const getTimelineDotColor = (status: string) => {
    switch (status) {
      case 'Created':
        return 'bg-blue-500';
      case 'DRAFT':
        return 'bg-gray-500';
      case 'SUBMITTED':
        return 'bg-blue-500';
      case 'APPROVED':
        return 'bg-green-500';
      case 'KITTING':
        return 'bg-yellow-500';
      case 'DISPATCH_READY':
        return 'bg-purple-500';
      case 'ASSIGNED':
        return 'bg-indigo-500';
      case 'IN_TRANSIT':
        return 'bg-orange-500';
      case 'DELIVERED':
        return 'bg-green-500';
      case 'REJECTED':
        return 'bg-red-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const handleSubmitOrder = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await api.submitOrder(orderId);
      await fetchOrder(true);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await api.rejectOrder(orderId, rejectReason);
      await fetchOrder(true);
      setShowRejectModal(false);
      setRejectReason('');
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveOrder = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await api.approveOrder(orderId);
      await fetchOrder(true);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartKitting = async () => {
    if (order?.status === 'APPROVED') {
      try {
        setActionLoading(true);
        setActionError(null);
        await api.startKitting(orderId);
        await fetchOrder(true);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Failed to start kitting';
        setActionError(message);
        setActionLoading(false);
        return;
      } finally {
        setActionLoading(false);
      }
    }
    setShowKittingModal(true);
    setKittingStep(0);
  };

  const handleKittingNext = () => {
    setKittingStep(prev => prev + 1);
  };

  const handleKittingBack = () => {
    setKittingStep(prev => prev - 1);
  };

  const kittingSteps = [
    {
      title: 'Material Preparation',
      description: 'Prepare all required materials and components for the order',
      icon: <Package className="w-6 h-6" />,
    },
    {
      title: 'Technical Packaging',
      description: 'Apply technical packaging procedures and safety measures',
      icon: <Wrench className="w-6 h-6" />,
    },
    {
      title: 'Quality Check',
      description: 'Perform quality assurance checks on packaged items',
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      title: 'Final Inspection',
      description: 'Final inspection before dispatch approval',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: 'Ready for Dispatch',
      description: 'Confirm kitting completion and approve for dispatch',
      icon: <Truck className="w-6 h-6" />,
    },
  ];

  const handleFinishKittingProcess = async () => {
    if (order?.status !== 'KITTING') {
      setShowKittingModal(false);
      setKittingStep(0);
      await fetchOrder(true);
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await api.finishKitting(orderId);
      await fetchOrder(true);
      setShowKittingModal(false);
      setKittingStep(0);
      setKittingData({
        materialsPrepared: false,
        packagingComplete: false,
        qualityCheckPassed: false,
        finalInspectionPassed: false,
        notes: '',
      });
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to finish kitting';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishKitting = async () => {
    if (order?.status !== 'KITTING') {
      await fetchOrder(true);
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await api.finishKitting(orderId);
      await fetchOrder(true);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to finish kitting';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    console.log('[Order Detail] Assign Driver - Starting');
    console.log('[Order Detail] Assign Driver - Order ID:', orderId);
    console.log('[Order Detail] Assign Driver - Selected Driver:', selectedDriver);
    
    if (!selectedDriver) {
      console.error('[Order Detail] Assign Driver - No driver selected');
      setActionError('Please select a driver');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      console.log('[Order Detail] Assign Driver - Calling API');
      await api.assignDriver(orderId, selectedDriver);
      console.log('[Order Detail] Assign Driver - API call successful');
      await fetchOrder(true);
      setShowDriverModal(false);
      setSelectedDriver('');
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Order Detail] Assign Driver - Error:', err);
      console.error('[Order Detail] Assign Driver - Error Details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setActionError(err.message || 'Failed to assign driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFetchDrivers = async () => {
    try {
      const drivers = await api.getUsers({ role: 'DRIVER', status: 'ACTIVE' });
      setAvailableDrivers(drivers.data || []);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  useEffect(() => {
    if (showDriverModal) {
      handleFetchDrivers();
    }
  }, [showDriverModal]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'REJECTED':
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
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
        <div className="p-4">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-5 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-red-700 dark:text-red-400 font-medium">{error || 'Order not found'}</p>
              </div>
            </div>
            <button
              onClick={() => fetchOrder()}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            {getStatusIcon(order.status)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{order.orderNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                {String(order.status || '').replace('_', ' ')}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                {String(order.priority || '')} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {actionSuccess && (
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 border border-green-200/50 dark:border-green-700/50 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Action completed successfully
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {actionError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {order.status === 'DRAFT' && (
              <>
                <button
                  onClick={handleSubmitOrder}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {actionLoading ? 'Submitting...' : 'Submit Order'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Order
                </button>
              </>
            )}

            {order.status === 'SUBMITTED' && user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={handleApproveOrder}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {actionLoading ? 'Approving...' : 'Approve Order'}
              </button>
            )}

            {order.status === 'APPROVED' && (
              <button
                onClick={handleStartKitting}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 dark:from-yellow-600 dark:to-yellow-700 dark:hover:from-yellow-700 dark:hover:to-yellow-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {actionLoading ? 'Starting...' : 'Start Kitting'}
              </button>
            )}

            {order.status === 'DISPATCH_READY' && (
              <button
                onClick={() => setShowDriverModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Assign Driver
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-4">
        {/* Kitting Section */}
        {order.status === 'KITTING' && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 dark:from-yellow-500/20 dark:to-yellow-600/10 border border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl shadow-lg shadow-yellow-500/10 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-md">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              Kitting in Progress
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete the kitting process step by step to prepare the order for dispatch.
            </p>
            <button
              onClick={handleStartKitting}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 dark:from-yellow-600 dark:to-yellow-700 dark:hover:from-yellow-700 dark:hover:to-yellow-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wrench className="w-4 h-4" />
              Continue Kitting Process
            </button>
          </div>
        )}

        {/* Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cargo Info */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            Cargo Information
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{order.cargoDescription || 'No description'}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{order.totalWeight || 0} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                {String(order.priority || 'NORMAL')} Priority
              </span>
            </div>
          </div>

          {order.deliveryInstructions && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery Instructions:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryInstructions}</p>
            </div>
          )}

          {order.handlingTags && order.handlingTags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Handling Tags:</p>
              <div className="flex flex-wrap gap-1">
                {order.handlingTags.map((tag, index) => {
                  // handlingTags from API is OrderHandlingTag[] with nested tag object
                  let tagText: string;

                  if (typeof tag === 'string') {
                    tagText = tag;
                  } else if (tag && typeof tag === 'object') {
                    const tagObj = tag as Record<string, unknown>;
                    // The backend returns { ..., tag: { name: 'HEAVY', ... } }
                    const nestedTag = tagObj.tag;
                    if (nestedTag && typeof nestedTag === 'object') {
                      const nestedTagObj = nestedTag as Record<string, unknown>;
                      tagText = String(nestedTagObj.name || nestedTagObj.type || nestedTagObj.value || nestedTagObj.label || '');
                    } else {
                      tagText = String(tagObj.name || tagObj.type || tagObj.value || tagObj.label || '');
                    }
                  } else {
                    tagText = String(tag);
                  }

                  // Skip empty or invalid results
                  if (!tagText || tagText === '[object Object]') return null;

                  // Format: replace underscores with spaces
                  tagText = tagText.replace(/_/g, ' ');

                  return (
                    <span key={index} className={`px-2 py-1 text-xs rounded ${getHandlingTagColor(tagText)}`}>
                      {tagText}
                    </span>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            Locations
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pickup Location</p>
                <p className="text-sm text-gray-900 dark:text-white">{typeof order.pickupLocation === 'string' ? order.pickupLocation : (order.pickupLocation?.address || 'N/A')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Location</p>
                <p className="text-sm text-gray-900 dark:text-white">{typeof order.deliveryLocation === 'string' ? order.deliveryLocation : (order.deliveryLocation?.address || 'N/A')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            Client Information
          </h2>
          <p className="text-gray-900 dark:text-white font-medium">
            {order.client?.firstName || ''} {order.client?.lastName || ''}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{order.client?.email || 'N/A'}</p>
        </div>

        {/* Trip Info (if assigned) */}
        {order?.trip && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              Trip Assignment
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.trip?.status)}`}>
                  {String(order.trip?.status || '').replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Driver</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {order.trip?.driver?.user?.firstName || ''} {order.trip?.driver?.user?.lastName || ''}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Vehicle</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {order.trip?.vehicle?.plateNumber || 'N/A'} ({order.trip?.vehicle?.category || ''})
                </span>
              </div>

              {order.trip?.eta && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">ETA</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">
                    {new Date(order.trip.eta).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* View Trip Button */}
            <button
              onClick={() => router.push('/trips')}
              className="mt-4 w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border border-blue-200/50 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 rounded-xl hover:from-blue-500/20 hover:to-blue-600/10 dark:hover:from-blue-500/30 dark:hover:to-blue-600/20 transition-all duration-300"
            >
              View Trip Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        </div>

        {/* Timeline */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Order Timeline
          </h2>
          
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="space-y-3">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${getTimelineDotColor(event.status)} flex-shrink-0`} />
                    <span className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">{event.status}</span>
                    <span className="text-gray-900 dark:text-white flex-1 min-w-0">{event.description}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap flex-shrink-0">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Assignment Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assign Driver</h3>
              
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {actionError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Driver
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white transition-all"
                  >
                    <option value="">Select a driver...</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName} ({driver.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDriverModal(false);
                      setSelectedDriver('');
                      setActionError(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignDriver}
                    disabled={actionLoading || !selectedDriver}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Assigning...' : 'Assign Driver'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Order</h3>
              
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {actionError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white transition-all"
                    rows={4}
                    placeholder="Please provide a reason for rejecting this order..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                      setActionError(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectOrder}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kitting Process Modal */}
      {showKittingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kitting Process</h3>
              
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {actionError}
                </div>
              )}

              {/* Progress Steps */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  {kittingSteps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                        index <= kittingStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                      }`}>
                        {index < kittingStep ? <Check className="w-3 h-3 sm:w-5 sm:h-5" /> : <span className="text-xs sm:text-sm">{step.icon}</span>}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center truncate w-full ${
                        index <= kittingStep
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.title.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Step Content */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                    kittingStep <= kittingSteps.length - 1
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}>
                    <span className="text-sm sm:text-base">{kittingSteps[kittingStep]?.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                      {kittingSteps[kittingStep]?.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {kittingSteps[kittingStep]?.description}
                    </p>
                  </div>
                </div>

                {/* Step-specific content */}
                {kittingStep === 0 && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={kittingData.materialsPrepared}
                        onChange={(e) => setKittingData({...kittingData, materialsPrepared: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      Materials prepared and ready
                    </label>
                  </div>
                )}

                {kittingStep === 1 && (
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 dark:from-yellow-500/20 dark:to-yellow-600/10 rounded-xl p-3 sm:p-4 border border-yellow-200/50 dark:border-yellow-700/50">
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={kittingData.packagingComplete}
                        onChange={(e) => setKittingData({...kittingData, packagingComplete: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      Technical packaging completed
                    </label>
                  </div>
                )}

                {kittingStep === 2 && (
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 rounded-xl p-3 sm:p-4 border border-green-200/50 dark:border-green-700/50">
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={kittingData.qualityCheckPassed}
                        onChange={(e) => setKittingData({...kittingData, qualityCheckPassed: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      Quality check passed
                    </label>
                  </div>
                )}

                {kittingStep === 3 && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-700/50">
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={kittingData.finalInspectionPassed}
                        onChange={(e) => setKittingData({...kittingData, finalInspectionPassed: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      Final inspection passed
                    </label>
                  </div>
                )}

                {kittingStep === 4 && (
                  <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10 rounded-xl p-3 sm:p-4 space-y-4 border border-indigo-200/50 dark:border-indigo-700/50">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={kittingData.notes}
                        onChange={(e) => setKittingData({...kittingData, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-xs sm:text-sm transition-all"
                        rows={3}
                        placeholder="Add any additional notes about the kitting process..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowKittingModal(false);
                    setKittingStep(0);
                    setKittingData({
                      materialsPrepared: false,
                      packagingComplete: false,
                      qualityCheckPassed: false,
                      finalInspectionPassed: false,
                      notes: '',
                    });
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                {kittingStep > 0 && (
                  <button
                    onClick={handleKittingBack}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
                  >
                    Back
                  </button>
                )}
                {kittingStep < kittingSteps.length - 1 ? (
                  <button
                    onClick={handleKittingNext}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleFinishKittingProcess}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Finishing...' : 'Finish Kitting'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
