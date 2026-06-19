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
              onClick={() => fetchOrder()}
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
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Action completed successfully
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {actionLoading ? 'Submitting...' : 'Submit Order'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                {actionLoading ? 'Approving...' : 'Approve Order'}
              </button>
            )}

            {order.status === 'APPROVED' && (
              <button
                onClick={handleStartKitting}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                {actionLoading ? 'Starting...' : 'Start Kitting'}
              </button>
            )}

            {order.status === 'DISPATCH_READY' && (
              <button
                onClick={() => setShowDriverModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Kitting in Progress
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete the kitting process step by step to prepare the order for dispatch.
            </p>
            <button
              onClick={handleStartKitting}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Continue Kitting Process
            </button>
          </div>
        )}

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
              <span className="text-sm text-gray-600 dark:text-gray-400">{String(order.kittingStatus || '').replace('_', ' ') || 'N/A'}</span>
            </div>
          </div>

          {order.handlingTags && order.handlingTags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Handling Tags:</p>
              <div className="flex flex-wrap gap-1">
                {order.handlingTags.map((tag, index) => {
                  // Handle different tag formats with robust extraction
                  let tagText: string;
                  
                  if (typeof tag === 'string') {
                    tagText = tag;
                  } else if (tag && typeof tag === 'object') {
                    const tagObj = tag as Record<string, unknown>;
                    // Try multiple possible property names for the tag value
                    const rawValue = tagObj.type || tagObj.name || tagObj.value || tagObj.label || tagObj.handlingTag || tagObj.tag;
                    if (rawValue !== undefined && rawValue !== null) {
                      tagText = String(rawValue);
                    } else {
                      // Last resort: get first string property value
                      const firstStringProp = Object.values(tagObj).find(v => typeof v === 'string');
                      tagText = firstStringProp ? String(firstStringProp) : JSON.stringify(tagObj);
                    }
                  } else {
                    tagText = String(tag);
                  }
                  
                  // Format: replace underscores with spaces
                  tagText = tagText.replace(/_/g, ' ');
                  
                  return (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                      {tagText}
                    </span>
                  );
                })}
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Client Information
          </h2>
          <p className="text-gray-900 dark:text-white font-medium">
            {order.client?.firstName || ''} {order.client?.lastName || ''}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{order.client?.email || 'N/A'}</p>
        </div>

        {/* Trip Info (if assigned) */}
        {order?.trip && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignDriver}
                    disabled={actionLoading || !selectedDriver}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectOrder}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4">
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
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4">
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
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4">
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
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4">
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
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4 space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={kittingData.notes}
                        onChange={(e) => setKittingData({...kittingData, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xs sm:text-sm"
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleFinishKittingProcess}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
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
