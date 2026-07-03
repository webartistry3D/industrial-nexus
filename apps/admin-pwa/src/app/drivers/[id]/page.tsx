'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Driver, Vehicle, KycDocument, KycDocumentType, KycDocumentTypeValue, KycDocumentStatus } from '@/types';
import { 
  ArrowLeft, Users, Mail, Shield, Truck, MapPin, 
  CheckCircle, XCircle, AlertCircle, Clock, UserCheck,
  FileText, CalendarClock, BadgeCheck, AlertTriangle, Upload, Trash2
} from 'lucide-react';

interface ConfirmAction {
  type: 'status' | 'kyc' | 'availability';
  value: string;
  title: string;
  message: string;
}

function DriverAvatar({ user, size = 'md' }: { user?: Driver['user']; size?: 'sm' | 'md' | 'lg' }) {
  const [error, setError] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-xl',
  };
  const textClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  if (user?.profileImageUrl && !error) {
    const src = user.profileImageUrl.startsWith('http')
      ? user.profileImageUrl
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${user.profileImageUrl}`;
    return (
      <img
        src={src}
        alt={`${user?.firstName} ${user?.lastName}`}
        className={`${sizeClasses[size]} object-cover border border-gray-200 dark:border-slate-600 shadow-md`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center`}>
      <span className={`${textClasses[size]} font-semibold text-white`}>{initials}</span>
    </div>
  );
}

export default function DriverDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const params = useParams();
  const driverId = params.id as string;
  
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<KycDocumentTypeValue>(KycDocumentType.GOVERNMENT_ID);
  const [docExpiry, setDocExpiry] = useState('');

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (driverId) {
      fetchDriver();
      fetchVehicles();
      fetchKycDocuments();
    }
  }, [driverId]);

  const fetchDriver = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDriver(driverId);
      setDriver(data);
    } catch (err) {
      console.error('Failed to fetch driver:', err);
      setError('Failed to load driver details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.getVehicles({ status: 'ACTIVE' });
      setVehicles(response.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchKycDocuments = async () => {
    try {
      const docs = await api.getDriverKycDocuments(driverId);
      setKycDocuments(Array.isArray(docs) ? docs : docs.data || []);
    } catch (err) {
      console.error('Failed to fetch KYC documents:', err);
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      GOVERNMENT_ID: 'Government ID',
      DRIVERS_LICENSE: "Driver's License",
      PROOF_OF_ADDRESS: 'Proof of Address',
      VEHICLE_REGISTRATION: 'Vehicle Registration',
      INSURANCE_CERTIFICATE: 'Insurance Certificate',
      VEHICLE_INSURANCE: 'Vehicle Insurance',
      PROFESSIONAL_CERTIFICATION: 'Professional Certification',
    };
    return labels[type] || type;
  };

  const getExpiryState = (expiresAt?: string): 'valid' | 'expiring' | 'expired' | 'unknown' => {
    if (!expiresAt) return 'unknown';
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'valid';
  };

  const formatExpiry = (expiresAt?: string) => {
    if (!expiresAt) return 'No expiry date';
    return new Date(expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleStatusChange = (newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    setConfirmAction({
      type: 'status',
      value: newStatus,
      title: 'Change Driver Status',
      message: `Are you sure you want to set this driver's status to ${formatStatus(newStatus)}?`,
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await api.uploadDriverKycDocument(driverId, selectedFile, selectedDocType, docExpiry || undefined);
      await fetchKycDocuments();
      setSelectedFile(null);
      setDocExpiry('');
      setShowUploadForm(false);
      showSuccess('KYC document uploaded successfully');
    } catch (err: any) {
      console.error('Failed to upload KYC document:', err);
      setError(err.response?.data?.message || 'Failed to upload KYC document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this KYC document?')) return;
    try {
      await api.deleteKycDocument(documentId);
      await fetchKycDocuments();
      showSuccess('KYC document deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete KYC document:', err);
      setError(err.response?.data?.message || 'Failed to delete KYC document.');
    }
  };

  const handleKycChange = (newKycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED') => {
    setConfirmAction({
      type: 'kyc',
      value: newKycStatus,
      title: 'Change KYC Status',
      message: `This will update the driver's KYC verification status to ${formatStatus(newKycStatus)}. Continue?`,
    });
  };

  const handleAvailabilityChange = (newAvailability: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY') => {
    setConfirmAction({
      type: 'availability',
      value: newAvailability,
      title: 'Change Availability',
      message: `Are you sure you want to set availability to ${formatStatus(newAvailability)}?`,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, value } = confirmAction;
    setConfirmAction(null);
    try {
      setUpdating(true);
      if (type === 'status') {
        await api.updateDriverStatus(driverId, value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED');
        showSuccess(`Driver status updated to ${formatStatus(value)}`);
      } else if (type === 'kyc') {
        await api.updateDriverKyc(driverId, value as 'PENDING' | 'VERIFIED' | 'REJECTED');
        showSuccess(`KYC status updated to ${formatStatus(value)}`);
      } else if (type === 'availability') {
        await api.updateDriverAvailability(driverId, value as 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY');
        showSuccess(`Availability updated to ${formatStatus(value)}`);
      }
      fetchDriver();
    } catch (err) {
      console.error('Failed to update driver:', err);
      alert('Failed to update driver status');
    } finally {
      setUpdating(false);
    }
  };

  const handleVehicleAssign = async (vehicleId: string | null) => {
    try {
      setUpdating(true);
      console.log('[Vehicle Assignment] Assigning vehicle:', vehicleId, 'to driver:', driverId);
      await api.updateDriver(driverId, { vehicleId });
      fetchDriver();
    } catch (err: any) {
      console.error('[Vehicle Assignment] Failed to assign vehicle:', err);
      const message = err.response?.data?.message || err.message || 'Failed to assign vehicle';
      alert(message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getKycColor = (kycStatus: string) => {
    const colors: Record<string, string> = {
      VERIFIED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[kycStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getAvailabilityColor = (availability: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      ON_TRIP: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      OFF_DUTY: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[availability] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  if (error || !driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 p-4">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-red-500 font-medium">{error || 'Driver not found'}</p>
          <button
            onClick={() => router.push('/drivers')}
            className="mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
          >
            Back to Drivers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-4">
          <button
            onClick={() => router.push('/drivers')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Drivers</span>
          </button>

          <div className="flex items-start gap-4">
            <DriverAvatar user={driver.user} size="lg" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {driver.user?.firstName} {driver.user?.lastName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{driver.licenseNumber}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                  {formatStatus(driver.status)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycColor(driver.kycStatus)}`}>
                  KYC: {formatStatus(driver.kycStatus)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(driver.availability)}`}>
                  {formatStatus(driver.availability)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-4 py-4">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 shadow-lg">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h2>
            <div className="space-y-2">
              {driver.user?.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-blue-900 dark:bg-lime-500 shadow-sm">
                    <Mail className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">{driver.user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-blue-900 dark:bg-lime-500 shadow-sm">
                  <Shield className="w-4 h-4 text-white dark:text-black" />
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-mono">License: {driver.licenseNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Documentation */}
        <div className="px-4 pb-4">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-900 dark:bg-lime-500 shadow-sm">
                  <FileText className="w-4 h-4 text-white dark:text-black" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Driver Documentation</h2>
              </div>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-800 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-300"
              >
                <Upload className="w-4 h-4" />
                {showUploadForm ? 'Cancel' : 'Upload Document'}
              </button>
            </div>

            {showUploadForm && (
              <form onSubmit={handleUpload} className="mb-4 p-4 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value as KycDocumentTypeValue)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-900"
                  >
                    <option value={KycDocumentType.GOVERNMENT_ID}>Government ID</option>
                    <option value={KycDocumentType.DRIVERS_LICENSE}>Driver's License</option>
                    <option value={KycDocumentType.PROOF_OF_ADDRESS}>Proof of Address</option>
                    <option value={KycDocumentType.VEHICLE_REGISTRATION}>Vehicle Registration</option>
                    <option value={KycDocumentType.INSURANCE_CERTIFICATE}>Insurance Certificate</option>
                    <option value={KycDocumentType.PROFESSIONAL_CERTIFICATION}>Professional Certification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select File (PDF, JPG, PNG - Max 10MB)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-800 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}

            {kycDocuments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No documents on file</p>
            ) : (
              <div className="space-y-3">
                {kycDocuments.map((doc) => {
                  const expiryState = getExpiryState(doc.expiresAt);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shadow-sm flex-shrink-0 ${
                          doc.status === KycDocumentStatus.VERIFIED
                            ? 'bg-gradient-to-br from-green-500 to-green-600'
                            : doc.status === KycDocumentStatus.REJECTED
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                        }`}>
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getDocTypeLabel(doc.documentType)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.status === KycDocumentStatus.VERIFIED
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : doc.status === KycDocumentStatus.REJECTED
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {doc.status === KycDocumentStatus.VERIFIED && <BadgeCheck className="w-3 h-3" />}
                          {doc.status === KycDocumentStatus.REJECTED && <XCircle className="w-3 h-3" />}
                          {doc.status !== KycDocumentStatus.VERIFIED && doc.status !== KycDocumentStatus.REJECTED && <Clock className="w-3 h-3" />}
                          {formatStatus(doc.status)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                          expiryState === 'expired' ? 'text-red-500 dark:text-red-400' :
                          expiryState === 'expiring' ? 'text-orange-500 dark:text-orange-400' :
                          expiryState === 'valid' ? 'text-green-600 dark:text-green-400' :
                          'text-gray-400 dark:text-gray-500'
                        }`}>
                          {expiryState === 'expired' && <AlertTriangle className="w-3 h-3" />}
                          {expiryState === 'expiring' && <AlertTriangle className="w-3 h-3" />}
                          {expiryState === 'valid' && <CalendarClock className="w-3 h-3" />}
                          {expiryState === 'unknown' && <CalendarClock className="w-3 h-3" />}
                          {expiryState === 'expired' ? 'Expired' : expiryState === 'expiring' ? 'Expiring soon' : ''}
                          {' '}{formatExpiry(doc.expiresAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Status Management */}
        <div className="px-4 pb-4">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 shadow-lg">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Status Management</h2>
            
            {successMessage && (
              <div className="mb-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {updating && (
              <div className="mb-3 text-sm text-blue-600 font-medium">Updating...</div>
            )}

            <div className="space-y-4">
              {/* Driver Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Driver Status
                </label>
                <div className="flex gap-2">
                  {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        driver.status === status
                          ? 'bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {formatStatus(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* KYC Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  KYC Status
                </label>
                <div className="flex gap-2">
                  {(['PENDING', 'VERIFIED', 'REJECTED'] as const).map((kycStatus) => (
                    <button
                      key={kycStatus}
                      onClick={() => handleKycChange(kycStatus)}
                      disabled={updating}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        driver.kycStatus === kycStatus
                          ? 'bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {formatStatus(kycStatus)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Availability
                </label>
                <div className="flex gap-2">
                  {(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY'] as const).map((availability) => (
                    <button
                      key={availability}
                      onClick={() => handleAvailabilityChange(availability)}
                      disabled={updating}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        driver.availability === availability
                          ? 'bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {formatStatus(availability)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Assignment */}
        <div className="px-4 pb-4">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 shadow-lg">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Vehicle Assignment</h2>
            
            {driver.vehicle ? (
              <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="p-2 rounded-lg bg-blue-900 dark:bg-lime-500 shadow-sm">
                  <Truck className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white font-mono">{driver.vehicle.plateNumber}</p>
                  <p className="text-sm text-gray-500 font-mono">{driver.vehicle.category} • {driver.vehicle.capacityKg}kg</p>
                </div>
                <button
                  onClick={() => handleVehicleAssign(null)}
                  disabled={updating}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50 transition-all duration-300"
                >
                  Unassign
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No vehicle assigned</p>
                <select
                  onChange={(e) => e.target.value && handleVehicleAssign(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                >
                  <option value="">Select a vehicle to assign...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.category} ({vehicle.capacityKg}kg)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-900 dark:bg-lime-500 shadow-md">
                <AlertTriangle className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{confirmAction.title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 transition-all duration-300"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
