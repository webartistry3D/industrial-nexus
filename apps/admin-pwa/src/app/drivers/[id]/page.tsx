'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Driver, Vehicle } from '@/types';
import { 
  ArrowLeft, Users, Mail, Shield, Truck, MapPin, 
  CheckCircle, XCircle, AlertCircle, Clock, UserCheck
} from 'lucide-react';

export default function DriverDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const driverId = params.id as string;
  
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (driverId) {
      fetchDriver();
      fetchVehicles();
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

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      setUpdating(true);
      await api.updateDriverStatus(driverId, newStatus);
      fetchDriver();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update driver status');
    } finally {
      setUpdating(false);
    }
  };

  const handleKycChange = async (newKycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED') => {
    try {
      setUpdating(true);
      await api.updateDriverKyc(driverId, newKycStatus);
      fetchDriver();
    } catch (err) {
      console.error('Failed to update KYC:', err);
      alert('Failed to update KYC status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvailabilityChange = async (newAvailability: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY') => {
    try {
      setUpdating(true);
      await api.updateDriverAvailability(driverId, newAvailability);
      fetchDriver();
    } catch (err) {
      console.error('Failed to update availability:', err);
      alert('Failed to update availability');
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-pulse p-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p>{error || 'Driver not found'}</p>
          <button
            onClick={() => router.push('/drivers')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Drivers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4">
          <button
            onClick={() => router.push('/drivers')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Drivers</span>
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">
                {driver.user?.firstName?.[0]}{driver.user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {driver.user?.firstName} {driver.user?.lastName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{driver.licenseNumber}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                  {driver.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycColor(driver.kycStatus)}`}>
                  KYC: {driver.kycStatus}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(driver.availability)}`}>
                  {driver.availability.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-4 py-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h2>
            <div className="space-y-2">
              {driver.user?.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">{driver.user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">License: {driver.licenseNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Status Management</h2>
            
            {updating && (
              <div className="mb-3 text-sm text-blue-600">Updating...</div>
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
                      disabled={updating || driver.status === status}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        driver.status === status
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {status}
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
                      disabled={updating || driver.kycStatus === kycStatus}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        driver.kycStatus === kycStatus
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {kycStatus}
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
                      disabled={updating || driver.availability === availability}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        driver.availability === availability
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {availability.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Assignment */}
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Vehicle Assignment</h2>
            
            {driver.vehicle ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{driver.vehicle.plateNumber}</p>
                  <p className="text-sm text-gray-500">{driver.vehicle.category} • {driver.vehicle.capacityKg}kg</p>
                </div>
                <button
                  onClick={() => handleVehicleAssign(null)}
                  disabled={updating}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
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
    </div>
  );
}
