'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Driver, PaginatedResponse, KycDocument, KycDocumentType, KycDocumentStatus } from '@/types';
import { 
  Users, Search, Plus, Mail, Shield, MapPin, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Filter, UserCheck, UserX, Truck
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const KYC_OPTIONS = [
  { value: '', label: 'All KYC' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All Availability' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
];

export default function DriversPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // KYC Review State
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<Driver> = await api.getDrivers({
        page,
        limit: 10,
        status: statusFilter || undefined,
        availability: availabilityFilter || undefined,
        search: search || undefined,
      });
      setDrivers(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, availabilityFilter, search]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Client-side filtering for KYC
  const filteredDrivers = drivers.filter(driver => {
    if (kycFilter && driver.kycStatus !== kycFilter) return false;
    return true;
  });

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

  const handleStatusChange = async (driverId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      await api.updateDriverStatus(driverId, newStatus);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to update driver status:', err);
      alert('Failed to update driver status');
    }
  };

  const handleKycChange = async (driverId: string, newKycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED') => {
    try {
      await api.updateDriverKyc(driverId, newKycStatus);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to update driver KYC:', err);
      alert('Failed to update driver KYC');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setKycFilter('');
    setAvailabilityFilter('');
    setPage(1);
  };

  // KYC Review Functions
  const handleViewKycDocuments = async (driver: Driver) => {
    try {
      setSelectedDriver(driver);
      setLoadingKyc(true);
      setReviewError(null);
      const docs = await api.getDriverKycDocuments(driver.id);
      setKycDocuments(docs);
      setShowKycModal(true);
    } catch (err: any) {
      console.error('Failed to fetch KYC documents:', err);
      setReviewError('Failed to fetch KYC documents');
    } finally {
      setLoadingKyc(false);
    }
  };

  const handleReviewKycDocument = async (documentId: string, status: KycDocumentStatus, rejectionReason?: string) => {
    try {
      setReviewError(null);
      await api.updateKycDocument(documentId, { status, rejectionReason });
      // Refresh documents
      if (selectedDriver) {
        const docs = await api.getDriverKycDocuments(selectedDriver.id);
        setKycDocuments(docs);
      }
      // Refresh drivers list to update KYC status
      fetchDrivers();
    } catch (err: any) {
      console.error('Failed to review document:', err);
      setReviewError('Failed to review document');
    }
  };

  const getDocumentTypeLabel = (type: KycDocumentType) => {
    switch (type) {
      case KycDocumentType.GOVERNMENT_ID:
        return 'Government ID';
      case KycDocumentType.DRIVERS_LICENSE:
        return 'Driver\'s License';
      case KycDocumentType.PROOF_OF_ADDRESS:
        return 'Proof of Address';
      case KycDocumentType.VEHICLE_REGISTRATION:
        return 'Vehicle Registration';
      case KycDocumentType.INSURANCE_CERTIFICATE:
        return 'Insurance Certificate';
      case KycDocumentType.PROFESSIONAL_CERTIFICATION:
        return 'Professional Certification';
      default:
        return type;
    }
  };

  const hasActiveFilters = search || statusFilter || kycFilter || availabilityFilter;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Drivers</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage fleet drivers and assignments
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/drivers/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Driver
            </button>
          </div>

          {/* Search & Filters */}
          <div className="space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers by name, email, or license..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={kycFilter}
                onChange={(e) => {
                  setKycFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {KYC_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={availabilityFilter}
                onChange={(e) => {
                  setAvailabilityFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-4 py-3 grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{meta.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-lg font-bold text-green-600">
              {drivers.filter(d => d.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">On Trip</p>
            <p className="text-lg font-bold text-blue-600">
              {drivers.filter(d => d.availability === 'ON_TRIP').length}
            </p>
          </div>
        </div>

        {/* Drivers List */}
        <div className="px-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading drivers...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No drivers found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
              >
                {/* Driver Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {driver.user?.firstName?.[0]}{driver.user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {driver.user?.firstName} {driver.user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Contact Info */}
                <div className="mb-3 text-sm">
                  {driver.user?.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{driver.user.email}</span>
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </span>
                  <button
                    onClick={() => handleViewKycDocuments(driver)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getKycColor(driver.kycStatus)} hover:opacity-80 transition-opacity`}
                  >
                    KYC: {driver.kycStatus}
                  </button>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(driver.availability)}`}>
                    {driver.availability.replace('_', ' ')}
                  </span>
                </div>

                {/* Assigned Vehicle */}
                {driver.vehicle && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/30 rounded-lg text-sm">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {driver.vehicle.plateNumber} • {driver.vehicle.category}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 grid grid-cols-3 gap-2">
                  {/* Status Toggle */}
                  <select
                    value={driver.status}
                    onChange={(e) => handleStatusChange(driver.id, e.target.value as any)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                  >
                    <option value="ACTIVE">Set Active</option>
                    <option value="INACTIVE">Set Inactive</option>
                    <option value="SUSPENDED">Suspend</option>
                  </select>

                  {/* KYC Toggle */}
                  <select
                    value={driver.kycStatus}
                    onChange={(e) => handleKycChange(driver.id, e.target.value as any)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                  >
                    <option value="PENDING">KYC Pending</option>
                    <option value="VERIFIED">Verify KYC</option>
                    <option value="REJECTED">Reject KYC</option>
                  </select>

                  {/* View Details */}
                  <button
                    onClick={() => router.push(`/drivers/${driver.id}`)}
                    className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredDrivers.length > 0 && (
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* KYC Review Modal */}
      {showKycModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                KYC Documents - {selectedDriver.user?.firstName} {selectedDriver.user?.lastName}
              </h2>
              <button
                onClick={() => setShowKycModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4">
              {reviewError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
                  {reviewError}
                </div>
              )}

              {loadingKyc ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading KYC documents...
                </div>
              ) : kycDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No KYC documents uploaded
                </div>
              ) : (
                <div className="space-y-4">
                  {kycDocuments.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {getDocumentTypeLabel(doc.documentType)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Submitted: {new Date(doc.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === KycDocumentStatus.VERIFIED ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          doc.status === KycDocumentStatus.REJECTED ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          doc.status === KycDocumentStatus.UNDER_REVIEW ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      {doc.rejectionReason && (
                        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                          <strong>Rejection Reason:</strong> {doc.rejectionReason}
                        </div>
                      )}

                      {doc.status === KycDocumentStatus.PENDING || doc.status === KycDocumentStatus.UNDER_REVIEW ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewKycDocument(doc.id, KycDocumentStatus.VERIFIED)}
                              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleReviewKycDocument(doc.id, KycDocumentStatus.REJECTED, reason);
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                          <button
                            onClick={() => handleReviewKycDocument(doc.id, KycDocumentStatus.UNDER_REVIEW)}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Mark as Under Review
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Document {doc.status.toLowerCase()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
