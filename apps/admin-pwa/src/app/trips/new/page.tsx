'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { Order, Driver, Vehicle } from '@/types';
import { ArrowLeft, Truck, CheckCircle, AlertCircle, Package, Users } from 'lucide-react';

export default function NewTripPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  
  const [formData, setFormData] = useState({
    orderId: '',
    driverId: '',
    vehicleId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const [ordersRes, driversRes, vehiclesRes] = await Promise.all([
        api.getOrders({ status: 'DISPATCH_READY', limit: 50 }),
        api.getDrivers({ status: 'ACTIVE', availability: 'AVAILABLE', limit: 50 }),
        api.getVehicles({ status: 'ACTIVE' }),
      ]);
      
      setOrders(ordersRes.data || []);
      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load required data. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.driverId || !formData.vehicleId) {
      setError('Please select an order, driver, and vehicle');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.createTrip({
        orderId: formData.orderId,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/trips');
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to create trip:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const selectedOrder = orders.find(o => o.id === formData.orderId);
  const selectedDriver = drivers.find(d => d.id === formData.driverId);
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="pb-24">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-5">
          <button
            onClick={() => router.push('/trips')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Trips</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create New Trip</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assign a driver and vehicle to an order
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 py-4">
          {success ? (
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 border border-green-200/50 dark:border-green-700/50 rounded-2xl p-6 text-center shadow-lg shadow-green-500/10">
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                Trip Created Successfully!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Redirecting to trips list...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 rounded-xl p-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm shadow-lg shadow-red-500/10">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Order Selection */}
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Select Order *</h2>
                </div>
                
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No dispatch-ready orders available. Orders must be in &quot;Dispatch Ready&quot; status.
                  </p>
                ) : (
                  <select
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                  >
                    <option value="">Select an order...</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.cargoDescription?.substring(0, 30)}... ({order.totalWeight}kg)
                      </option>
                    ))}
                  </select>
                )}

                {selectedOrder && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl text-sm border border-blue-200/50 dark:border-blue-700/50">
                    <p className="font-medium text-gray-900 dark:text-white font-mono">{selectedOrder.orderNumber}</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOrder.cargoDescription}</p>
                    <p className="text-gray-500 font-mono">Weight: {selectedOrder.totalWeight}kg</p>
                    <p className="text-gray-500">Pickup: {selectedOrder.pickupLocation?.address}</p>
                    <p className="text-gray-500">Delivery: {selectedOrder.deliveryLocation?.address}</p>
                  </div>
                )}
              </div>

              {/* Driver Selection */}
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Select Driver *</h2>
                </div>
                
                {drivers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No available drivers. Drivers must be Active and Available.
                  </p>
                ) : (
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                  >
                    <option value="">Select a driver...</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.user?.firstName} {driver.user?.lastName} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                )}

                {selectedDriver && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 rounded-xl text-sm border border-green-200/50 dark:border-green-700/50">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDriver.user?.firstName} {selectedDriver.user?.lastName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 font-mono">License: {selectedDriver.licenseNumber}</p>
                    <p className="text-gray-500">KYC: {formatStatus(selectedDriver.kycStatus)}</p>
                  </div>
                )}
              </div>

              {/* Vehicle Selection */}
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Select Vehicle *</h2>
                </div>
                
                {vehicles.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active vehicles available.
                  </p>
                ) : (
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                  >
                    <option value="">Select a vehicle...</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.category} ({vehicle.capacityKg}kg)
                      </option>
                    ))}
                  </select>
                )}

                {selectedVehicle && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 rounded-xl text-sm border border-orange-200/50 dark:border-orange-700/50">
                    <p className="font-medium text-gray-900 dark:text-white font-mono">{selectedVehicle.plateNumber}</p>
                    <p className="text-gray-600 dark:text-gray-400">Category: {selectedVehicle.category}</p>
                    <p className="text-gray-500 font-mono">Capacity: {selectedVehicle.capacityKg}kg</p>
                    <p className="text-gray-500">Partitioned: {selectedVehicle.isPartitioned ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/trips')}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.orderId || !formData.driverId || !formData.vehicleId}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
