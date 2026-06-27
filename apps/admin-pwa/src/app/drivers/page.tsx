'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Driver, PaginatedResponse, KycDocument, KycDocumentType, KycDocumentTypeValue, KycDocumentStatus, KycDocumentStatusValue } from '@/types';
import { 
  Users, Search, Plus, Mail, Shield, MapPin, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Filter, UserCheck, UserX, Truck, Edit, Trash2, List, Grid2x2, FileText
} from 'lucide-react';
import { StatCard } from '@/components/stat-card';

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

const VEHICLE_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const VEHICLE_CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HEAVY', label: 'Heavy' },
  { value: 'SPECIALIZED', label: 'Specialized' },
];

interface Vehicle {
  id: string;
  plateNumber: string;
  category: string;
  capacityKg: number;
  status: string;
  isPartitioned: boolean;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'drivers' | 'vehicles';

export default function DriversPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('drivers');
  
  // Drivers state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [driversViewMode, setDriversViewMode] = useState<'list' | 'grid'>('list');
  
  // KYC Review State
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('');
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState('');
  const [vehiclesViewMode, setVehiclesViewMode] = useState<'list' | 'grid'>('list');
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    plateNumber: '',
    category: 'MEDIUM',
    capacityKg: 5000,
    isPartitioned: false,
    status: 'ACTIVE',
  });
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleSuccess, setVehicleSuccess] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      setDriversLoading(true);
      setDriversError(null);
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
      setDriversError('Failed to load drivers. Please try again.');
    } finally {
      setDriversLoading(false);
    }
  }, [page, statusFilter, availabilityFilter, search]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setVehiclesLoading(true);
      setVehiclesError(null);
      const response = await api.getVehicles({
        status: vehicleStatusFilter || undefined,
        category: vehicleCategoryFilter || undefined,
      });
      setVehicles(response.data || response);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setVehiclesError('Failed to load vehicles. Please try again.');
    } finally {
      setVehiclesLoading(false);
    }
  }, [vehicleStatusFilter, vehicleCategoryFilter]);

  useEffect(() => {
    if (activeTab === 'vehicles') {
      fetchVehicles();
    }
  }, [activeTab, fetchVehicles]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const logs = await api.getAuditLogs({ entityType: 'VEHICLE', limit: 20 });
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, []);

  // Filter helpers
  const filteredDrivers = drivers.filter(driver => {
    if (kycFilter && driver.kycStatus !== kycFilter) return false;
    return true;
  });

  const filteredVehicles = vehicles.filter(vehicle => {
    if (vehicleSearch && !vehicle.plateNumber.toLowerCase().includes(vehicleSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const hasActiveDriverFilters = search || statusFilter || kycFilter || availabilityFilter;
  const hasActiveVehicleFilters = vehicleSearch || vehicleStatusFilter || vehicleCategoryFilter;

  const clearDriverFilters = () => {
    setSearch('');
    setStatusFilter('');
    setKycFilter('');
    setAvailabilityFilter('');
    setPage(1);
  };

  const clearVehicleFilters = () => {
    setVehicleSearch('');
    setVehicleStatusFilter('');
    setVehicleCategoryFilter('');
  };

  // Color helpers
  const getDriverStatusColor = (status: string) => {
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

  const getVehicleStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getVehicleCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      LIGHT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      MEDIUM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      HEAVY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      SPECIALIZED: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Driver actions
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

  const handleReviewKycDocument = async (documentId: string, status: KycDocumentStatusValue, rejectionReason?: string) => {
    try {
      setReviewError(null);
      await api.updateKycDocument(documentId, { status, rejectionReason });
      if (selectedDriver) {
        const docs = await api.getDriverKycDocuments(selectedDriver.id);
        setKycDocuments(docs);
      }
      fetchDrivers();
    } catch (err: any) {
      console.error('Failed to review document:', err);
      setReviewError('Failed to review document');
    }
  };

  const getDocumentTypeLabel = (type: KycDocumentTypeValue) => {
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

  // Vehicle actions
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError(null);
    try {
      setVehicleSubmitting(true);
      await api.createVehicle(vehicleFormData);
      setVehicleSuccess(true);
      setTimeout(() => {
        setShowCreateVehicleModal(false);
        setVehicleSuccess(false);
        setVehicleFormData({ plateNumber: '', category: 'MEDIUM', capacityKg: 5000, isPartitioned: false, status: 'ACTIVE' });
        fetchVehicles();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create vehicle:', err);
      const msg = err?.response?.data?.message || 'Failed to create vehicle. Please try again.';
      setVehicleError(msg);
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      setVehicleSubmitting(true);
      await api.updateVehicle(selectedVehicle.id, vehicleFormData);
      setShowEditVehicleModal(false);
      setSelectedVehicle(null);
      setVehicleFormData({ plateNumber: '', category: 'MEDIUM', capacityKg: 5000, isPartitioned: false, status: 'ACTIVE' });
      fetchVehicles();
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      alert('Failed to update vehicle. Please try again.');
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleDeactivateVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this vehicle?')) return;
    try {
      await api.deactivateVehicle(id);
      fetchVehicles();
    } catch (err) {
      console.error('Failed to deactivate vehicle:', err);
      alert('Failed to deactivate vehicle. Please try again.');
    }
  };

  const openEditVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      plateNumber: vehicle.plateNumber,
      category: vehicle.category,
      capacityKg: vehicle.capacityKg,
      isPartitioned: vehicle.isPartitioned,
      status: vehicle.status,
    });
    setShowEditVehicleModal(true);
  };

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'OPERATIONS') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">Access denied. You do not have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                {activeTab === 'drivers' ? (
                  <Users className="w-6 h-6 text-white" />
                ) : (
                  <Truck className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'drivers' ? 'Drivers' : 'Vehicles'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'drivers'
                    ? // 'Manage fleet drivers and assignments'
                      ''
                    : // 'Manage fleet vehicles and capacity'
                      ''}
                </p>
              </div>
            </div>
            {activeTab === 'drivers' ? (
              <button
                onClick={() => router.push('/drivers/new')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </button>
            ) : (
              <button
                onClick={() => setShowCreateVehicleModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Vehicle
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'drivers'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 dark:hover:from-lime-500 dark:hover:to-lime-600 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Drivers
              </div>
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'vehicles'
                  ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-lime-500 dark:to-lime-500 dark:hover:from-lime-500 dark:hover:to-lime-600 text-white dark:text-black shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                Vehicles
              </div>
            </button>
          </div>

          {/* Drivers Stats */}
          {activeTab === 'drivers' && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-md inline-flex mb-4"><Users className="w-5 h-5" /></div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{meta.total}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Total</div>
              </div>
              <div className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-md inline-flex mb-4"><CheckCircle className="w-5 h-5" /></div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{drivers.filter(d => d.status === 'ACTIVE').length}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Active</div>
              </div>
              <div className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-md inline-flex mb-4"><Truck className="w-5 h-5" /></div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{drivers.filter(d => d.availability === 'ON_TRIP').length}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">On Trip</div>
              </div>
            </div>
          )}

          {/* Vehicles Stats */}
          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-md inline-flex mb-4"><Truck className="w-5 h-5" /></div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{vehicles.length}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Total</div>
              </div>
              <div className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-md inline-flex mb-4"><CheckCircle className="w-5 h-5" /></div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{vehicles.filter(v => v.status === 'ACTIVE').length}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Active</div>
              </div>
              <div className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white dark:bg-lime-500 dark:text-black shadow-md inline-flex mb-4"><Grid2x2 className="w-5 h-5" /></div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{vehicles.filter(v => v.isPartitioned).length}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">Partitioned</div>
              </div>
            </div>
          )}

          {/* Drivers Search & Filters */}
          {activeTab === 'drivers' && (
            <div className="space-y-2">
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-1/4 min-w-[90px] px-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
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
                  className="w-1/4 min-w-[90px] px-2 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
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
                  className="flex-1 min-w-[70px] px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                >
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-center md:hidden">
                <button
                  onClick={() => setDriversViewMode('list')}
                  className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                    driversViewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setDriversViewMode('grid')}
                  className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                    driversViewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2x2 className="w-5 h-5" />
                </button>
              </div>
              <div className="hidden md:flex gap-2 justify-center">
                <button
                  onClick={() => setDriversViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    driversViewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setDriversViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    driversViewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2x2 className="w-5 h-5" />
                </button>
              </div>
              {hasActiveDriverFilters && (
                <button
                  onClick={clearDriverFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Vehicles Search & Filters */}
          {activeTab === 'vehicles' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles by plate number..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={vehicleStatusFilter}
                  onChange={(e) => setVehicleStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                >
                  {VEHICLE_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={vehicleCategoryFilter}
                  onChange={(e) => setVehicleCategoryFilter(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                >
                  {VEHICLE_CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-center md:hidden">
                <button
                  onClick={() => setVehiclesViewMode('list')}
                  className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                    vehiclesViewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setVehiclesViewMode('grid')}
                  className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
                    vehiclesViewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2x2 className="w-5 h-5" />
                </button>
              </div>
              <div className="hidden md:flex gap-2 justify-center">
                <button
                  onClick={() => setVehiclesViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    vehiclesViewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setVehiclesViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    vehiclesViewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2x2 className="w-5 h-5" />
                </button>
              </div>
              {hasActiveVehicleFilters && (
                <button
                  onClick={clearVehicleFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drivers Content */}
        {activeTab === 'drivers' && (
          <>
            {/* Drivers List */}
            <div className="px-4">
              {driversLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : driversError ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-red-500 font-medium">{driversError}</p>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No drivers found</p>
                  {hasActiveDriverFilters && (
                    <button
                      onClick={clearDriverFilters}
                      className="mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : driversViewMode === 'list' ? (
                // Table View
                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-200/50 dark:border-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">License</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">KYC</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Availability</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
                        {filteredDrivers.map((driver) => (
                          <tr
                            key={driver.id}
                            onClick={() => router.push(`/drivers/${driver.id}`)}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-white">
                                    {driver.user?.firstName?.[0]}{driver.user?.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{driver.user?.firstName} {driver.user?.lastName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{driver.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">{driver.licenseNumber}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDriverStatusColor(driver.status)}`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewKycDocuments(driver); }}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getKycColor(driver.kycStatus)} hover:opacity-80 transition-opacity`}
                              >
                                {driver.kycStatus}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(driver.availability)}`}>
                                {driver.availability.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                              {driver.vehicle ? `${driver.vehicle.plateNumber}` : 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Grid View (Cards)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center">
                          <span className="text-lg font-semibold text-white">
                            {driver.user?.firstName?.[0]}{driver.user?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {driver.user?.firstName} {driver.user?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{driver.licenseNumber}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="mb-3 text-sm">
                      {driver.user?.email && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{driver.user.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDriverStatusColor(driver.status)}`}>
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

                    {driver.vehicle && (
                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-slate-700/30 rounded-xl text-sm">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                          <Truck className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-mono">
                          {driver.vehicle.plateNumber} • {driver.vehicle.category}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 grid grid-cols-3 gap-2">
                      <select
                        value={driver.status}
                        onChange={(e) => handleStatusChange(driver.id, e.target.value as any)}
                        className="px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ACTIVE">Set Active</option>
                        <option value="INACTIVE">Set Inactive</option>
                        <option value="SUSPENDED">Suspend</option>
                      </select>
                      <select
                        value={driver.kycStatus}
                        onChange={(e) => handleKycChange(driver.id, e.target.value as any)}
                        className="px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PENDING">KYC Pending</option>
                        <option value="VERIFIED">Verify KYC</option>
                        <option value="REJECTED">Reject KYC</option>
                      </select>
                      <button
                        onClick={() => router.push(`/drivers/${driver.id}`)}
                        className="px-2 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!driversLoading && filteredDrivers.length > 0 && (
              <div className="px-4 py-4 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Vehicles Content */}
        {activeTab === 'vehicles' && (
          <>
            {/* Vehicles List */}
            <div className="px-4">
              {vehiclesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : vehiclesError ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-red-500 font-medium">{vehiclesError}</p>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No vehicles found</p>
                  {hasActiveVehicleFilters && (
                    <button
                      onClick={clearVehicleFilters}
                      className="mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : vehiclesViewMode === 'list' ? (
                // Table View
                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-200/50 dark:border-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Plate Number</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Partitioned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
                        {filteredVehicles.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white font-medium">{vehicle.plateNumber}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVehicleCategoryColor(vehicle.category)}`}>
                                {vehicle.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">{vehicle.capacityKg.toLocaleString()} kg</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.status)}`}>
                                {vehicle.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {vehicle.isPartitioned ? (
                                <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm inline-block">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-400" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Grid View (Cards)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.plateNumber}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.category}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                        <span className="text-gray-900 dark:text-white font-medium font-mono">{vehicle.capacityKg.toLocaleString()} kg</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Partitioned</span>
                        {vehicle.isPartitioned ? (
                          <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVehicleCategoryColor(vehicle.category)}`}>
                        {vehicle.category}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300"
                      >
                        <FileText className="w-4 h-4" />
                        Docs
                      </button>
                      <button
                        onClick={() => openEditVehicleModal(vehicle)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeactivateVehicle(vehicle.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* KYC Review Modal */}
      {showKycModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                KYC Documents - {selectedDriver.user?.firstName} {selectedDriver.user?.lastName}
              </h2>
              <button
                onClick={() => setShowKycModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Loading KYC documents...</p>
                </div>
              ) : kycDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No KYC documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kycDocuments.map((doc) => (
                    <div key={doc.id} className="bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {getDocumentTypeLabel(doc.documentType)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
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
                              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-medium transition-all duration-300"
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
                              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-medium transition-all duration-300"
                            >
                              Reject
                            </button>
                          </div>
                          <button
                            onClick={() => handleReviewKycDocument(doc.id, KycDocumentStatus.UNDER_REVIEW)}
                            className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-300"
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

      {/* Create Vehicle Modal */}
      {showCreateVehicleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-6">
              {vehicleSuccess ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                    Vehicle Created Successfully!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Redirecting to vehicles list...
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    Add New Vehicle
                  </h2>
                  <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.plateNumber}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, plateNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                    placeholder="e.g., ABC-123-NG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={vehicleFormData.category}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  >
                    {VEHICLE_CATEGORY_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={vehicleFormData.capacityKg}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacityKg: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={vehicleFormData.status}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  >
                    {VEHICLE_STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="createPartitioned"
                    checked={vehicleFormData.isPartitioned}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, isPartitioned: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="createPartitioned" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Partitioned
                  </label>
                </div>
                {vehicleError && (
                  <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                    {vehicleError}
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCreateVehicleModal(false); setVehicleError(null); }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={vehicleSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50"
                  >
                    {vehicleSubmitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditVehicleModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                Edit Vehicle
              </h2>
              <form onSubmit={handleEditVehicle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.plateNumber}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, plateNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={vehicleFormData.category}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  >
                    {VEHICLE_CATEGORY_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={vehicleFormData.capacityKg}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacityKg: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={vehicleFormData.status}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  >
                    {VEHICLE_STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editPartitioned"
                    checked={vehicleFormData.isPartitioned}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, isPartitioned: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="editPartitioned" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Partitioned
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditVehicleModal(false);
                      setSelectedVehicle(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={vehicleSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50"
                  >
                    {vehicleSubmitting ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLogs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200/50 dark:border-slate-700/50">
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vehicle Activity Log
              </h2>
              <button
                onClick={() => setShowAuditLogs(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg mb-4">
                    <Filter className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Vehicle: {log.newValue?.plateNumber || log.oldValue?.plateNumber || log.entityId}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {log.user && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          By: {log.user.firstName} {log.user.lastName} ({log.user.email})
                        </div>
                      )}
                      {log.oldValue && Object.keys(log.oldValue).length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          <span className="font-semibold">Old:</span> {JSON.stringify(log.oldValue, null, 2)}
                        </div>
                      )}
                      {log.newValue && Object.keys(log.newValue).length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-600 dark:text-green-400">
                          <span className="font-semibold">New:</span> {JSON.stringify(log.newValue, null, 2)}
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
