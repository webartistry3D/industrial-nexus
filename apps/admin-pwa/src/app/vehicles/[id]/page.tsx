'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Vehicle, VehicleDocument, VehicleDocumentType, VehicleDocumentTypeValue, VehicleDocumentStatus, VehicleDocumentStatusValue } from '@/types';
import {
  ArrowLeft, Truck, CheckCircle, XCircle, Clock, FileText,
  Upload, Trash2, CalendarClock, BadgeCheck, AlertTriangle,
  Shield, AlertCircle
} from 'lucide-react';

export default function VehicleDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleDocuments, setVehicleDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<VehicleDocumentTypeValue>(VehicleDocumentType.VEHICLE_REGISTRATION);
  const [docExpiry, setDocExpiry] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
      fetchVehicleDocuments();
    }
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getVehicle(vehicleId);
      setVehicle(data);
    } catch (err) {
      console.error('Failed to fetch vehicle:', err);
      setError('Failed to load vehicle details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDocuments = async () => {
    try {
      const docs = await api.getVehicleDocuments(vehicleId);
      setVehicleDocuments(Array.isArray(docs) ? docs : docs.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicle documents:', err);
    }
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
      await api.uploadVehicleDocument(vehicleId, selectedFile, selectedDocType, docExpiry || undefined);
      await fetchVehicleDocuments();
      setSelectedFile(null);
      setDocExpiry('');
      setShowUploadForm(false);
    } catch (err: any) {
      console.error('Failed to upload vehicle document:', err);
      setError(err.response?.data?.message || 'Failed to upload vehicle document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle document?')) return;
    try {
      await api.deleteVehicleDocument(documentId);
      await fetchVehicleDocuments();
    } catch (err: any) {
      console.error('Failed to delete vehicle document:', err);
      setError(err.response?.data?.message || 'Failed to delete vehicle document.');
    }
  };

  const handleUpdateStatus = async (documentId: string, status: VehicleDocumentStatusValue) => {
    try {
      setUpdating(documentId);
      setError(null);
      const payload: { status: string; rejectionReason?: string } = { status };
      if (status === VehicleDocumentStatus.REJECTED && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }
      await api.updateVehicleDocument(documentId, payload);
      setRejectionReason('');
      await fetchVehicleDocuments();
    } catch (err: any) {
      console.error('Failed to update vehicle document:', err);
      setError(err.response?.data?.message || 'Failed to update document status.');
    } finally {
      setUpdating(null);
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      VEHICLE_REGISTRATION: 'Vehicle Registration',
      ROAD_WORTHINESS: 'Road Worthiness',
      INSURANCE_CERTIFICATE: 'Insurance Certificate',
      VEHICLE_LICENSE: 'Vehicle License',
      HAULAGE_PERMIT: 'Haulage Permit',
      TEMPERATURE_CONTROL_CERTIFICATION: 'Temperature Control Certification',
      HAZARDOUS_MATERIAL_CERTIFICATION: 'Hazardous Material Certification',
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: VehicleDocumentStatusValue) => {
    switch (status) {
      case VehicleDocumentStatus.VERIFIED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case VehicleDocumentStatus.REJECTED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case VehicleDocumentStatus.UNDER_REVIEW:
        return <Clock className="w-5 h-5 text-blue-900" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/drivers')}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage vehicle documents and compliance</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/50 rounded-xl p-3 text-red-800 dark:text-red-300 text-sm shadow-lg">
            {error}
          </div>
        )}

        {/* Vehicle Info Card */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-mono">{vehicle?.plateNumber}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Category: <span className="font-medium text-gray-900 dark:text-white">{vehicle?.category}</span></span>
                <span className="text-gray-500 dark:text-gray-400">Capacity: <span className="font-medium text-gray-900 dark:text-white font-mono">{vehicle?.capacityKg.toLocaleString()} kg</span></span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  vehicle?.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  vehicle?.status === 'INACTIVE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {formatStatus(vehicle?.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Vehicle Documents</h3>
            </div>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150"
            >
              <Upload className="w-4 h-4" />
              {showUploadForm ? 'Cancel' : 'Upload Document'}
            </button>
          </div>

          {showUploadForm && (
            <form onSubmit={handleUpload} className="mb-6 p-4 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as VehicleDocumentTypeValue)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={VehicleDocumentType.VEHICLE_REGISTRATION}>Vehicle Registration</option>
                  <option value={VehicleDocumentType.ROAD_WORTHINESS}>Road Worthiness</option>
                  <option value={VehicleDocumentType.INSURANCE_CERTIFICATE}>Insurance Certificate</option>
                  <option value={VehicleDocumentType.VEHICLE_LICENSE}>Vehicle License</option>
                  <option value={VehicleDocumentType.HAULAGE_PERMIT}>Haulage Permit</option>
                  <option value={VehicleDocumentType.TEMPERATURE_CONTROL_CERTIFICATION}>Temperature Control Certification</option>
                  <option value={VehicleDocumentType.HAZARDOUS_MATERIAL_CERTIFICATION}>Hazardous Material Certification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select File (PDF, JPG, PNG - Max 10MB)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          )}

          {vehicleDocuments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No vehicle documents on file</p>
          ) : (
            <div className="space-y-3">
              {vehicleDocuments.map((doc) => {
                const expiryState = getExpiryState(doc.expiresAt);
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/80 dark:bg-slate-700/50 rounded-xl border border-gray-200/50 dark:border-slate-600/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg shadow-sm flex-shrink-0 ${
                        doc.status === VehicleDocumentStatus.VERIFIED
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : doc.status === VehicleDocumentStatus.REJECTED
                          ? 'bg-gradient-to-br from-red-500 to-red-600'
                          : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                      }`}>
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{getDocTypeLabel(doc.documentType)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{doc.fileName}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono mt-1 ${
                          expiryState === 'expired' ? 'text-red-500 dark:text-red-400' :
                          expiryState === 'expiring' ? 'text-orange-500 dark:text-orange-400' :
                          expiryState === 'valid' ? 'text-green-600 dark:text-green-400' :
                          'text-gray-400 dark:text-gray-500'
                        }`}>
                          {expiryState === 'expired' && <AlertTriangle className="w-3 h-3" />}
                          {expiryState === 'expiring' && <AlertTriangle className="w-3 h-3" />}
                          {expiryState === 'valid' && <CalendarClock className="w-3 h-3" />}
                          {expiryState === 'expired' ? 'Expired' : expiryState === 'expiring' ? 'Expiring soon' : ''}
                          {' '}{formatExpiry(doc.expiresAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mt-3 md:mt-0 md:ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        doc.status === VehicleDocumentStatus.VERIFIED
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : doc.status === VehicleDocumentStatus.REJECTED
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {doc.status === VehicleDocumentStatus.VERIFIED && <BadgeCheck className="w-3 h-3" />}
                        {doc.status === VehicleDocumentStatus.REJECTED && <XCircle className="w-3 h-3" />}
                        {doc.status !== VehicleDocumentStatus.VERIFIED && doc.status !== VehicleDocumentStatus.REJECTED && <Clock className="w-3 h-3" />}
                        {formatStatus(doc.status)}
                      </span>
                      {doc.status === VehicleDocumentStatus.REJECTED && doc.rejectionReason && (
                        <span className="text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate" title={doc.rejectionReason}>
                          {doc.rejectionReason}
                        </span>
                      )}
                      {doc.status === VehicleDocumentStatus.PENDING || doc.status === VehicleDocumentStatus.UNDER_REVIEW ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(doc.id, VehicleDocumentStatus.VERIFIED)}
                            disabled={updating === doc.id}
                            className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-all duration-300"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason !== null) {
                                  setRejectionReason(reason);
                                  handleUpdateStatus(doc.id, VehicleDocumentStatus.REJECTED);
                                }
                              }}
                              disabled={updating === doc.id}
                              className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
