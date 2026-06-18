'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Order, Driver, Vehicle } from '@/types';
import { ArrowLeft, Truck, CheckCircle, AlertCircle, Package, Users } from 'lucide-react';

export default function NewTripPage() {
  const router = useRouter();
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
    } catch (err: any) {
      console.error('Failed to create trip:', err);
      setError(err.response?.data?.message || 'Failed to create trip. Please try again.');
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Truck className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Loading...</p>
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
            onClick={() => router.push('/trips')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Trips</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
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
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Order Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.orderNumber}</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOrder.cargoDescription}</p>
                    <p className="text-gray-500">Weight: {selectedOrder.totalWeight}kg</p>
                    <p className="text-gray-500">Pickup: {selectedOrder.pickupLocation?.address}</p>
                    <p className="text-gray-500">Delivery: {selectedOrder.deliveryLocation?.address}</p>
                  </div>
                )}
              </div>

              {/* Driver Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-green-600" />
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDriver.user?.firstName} {selectedDriver.user?.lastName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">License: {selectedDriver.licenseNumber}</p>
                    <p className="text-gray-500">KYC: {selectedDriver.kycStatus}</p>
                  </div>
                )}
              </div>

              {/* Vehicle Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-orange-600" />
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{selectedVehicle.plateNumber}</p>
                    <p className="text-gray-600 dark:text-gray-400">Category: {selectedVehicle.category}</p>
                    <p className="text-gray-500">Capacity: {selectedVehicle.capacityKg}kg</p>
                    <p className="text-gray-500">Partitioned: {selectedVehicle.isPartitioned ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/trips')}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.orderId || !formData.driverId || !formData.vehicleId}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
