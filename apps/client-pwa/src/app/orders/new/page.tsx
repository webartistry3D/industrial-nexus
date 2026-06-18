'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { geocodeAddress } from '@/lib/geocoding';
import { Package, ArrowLeft, MapPin, Check } from 'lucide-react';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { SuccessModal } from '@/components/success-modal';

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [useManualCoords, setUseManualCoords] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    cargoDescription: '',
    pickupAddress: '',
    deliveryAddress: '',
    pickupLat: 0,
    pickupLng: 0,
    deliveryLat: 0,
    deliveryLng: 0,
    handlingTags: [] as string[],
    notes: '',
    totalWeight: 0,
  });

  const handlingTagOptions = ['HEAVY', 'FRAGILE', 'HAZARDOUS', 'CHEMICAL', 'VERTICAL_STORAGE_REQUIRED', 'TEMPERATURE_SENSITIVE'];

  // Clear invalid tags from state
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      handlingTags: prev.handlingTags.filter(tag => handlingTagOptions.includes(tag)),
    }));
  }, []);

  const getHandlingTagColor = (tag: string) => {
    const upperTag = tag.toUpperCase();
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

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      handlingTags: prev.handlingTags.includes(tag)
        ? prev.handlingTags.filter(t => t !== tag)
        : [...prev.handlingTags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Form data before geocoding:', formData);
      
      // Skip geocoding if manual coordinates are provided
      const shouldSkipGeocoding = useManualCoords && 
        formData.pickupLat !== 0 && formData.pickupLng !== 0 && 
        formData.deliveryLat !== 0 && formData.deliveryLng !== 0;
      
      // If using manual entry or coordinates not set (and not using manual coords), use fallback geocoding
      if (!shouldSkipGeocoding && (useManualEntry || !formData.pickupLat || !formData.pickupLng || !formData.deliveryLat || !formData.deliveryLng)) {
        setGeocoding(true);
        setError(null);

        console.log('Starting geocoding process...');
        console.log('Pickup address:', formData.pickupAddress);
        console.log('Delivery address:', formData.deliveryAddress);

        // Create a local copy of form data to update
        let updatedFormData = { ...formData };

        // Geocode pickup address if needed
        if (!formData.pickupLat || !formData.pickupLng) {
          const pickupResult = await geocodeAddress(formData.pickupAddress);
          console.log('Pickup geocoding result:', pickupResult);
          
          if (pickupResult) {
            updatedFormData.pickupLat = pickupResult.lat;
            updatedFormData.pickupLng = pickupResult.lng;
          } else {
            throw new Error(`Unable to geocode pickup address: "${formData.pickupAddress}". Please try a more specific address, use autocomplete, or enter coordinates manually.`);
          }
        }

        // Geocode delivery address if needed
        if (!formData.deliveryLat || !formData.deliveryLng) {
          const deliveryResult = await geocodeAddress(formData.deliveryAddress);
          console.log('Delivery geocoding result:', deliveryResult);
          
          if (deliveryResult) {
            updatedFormData.deliveryLat = deliveryResult.lat;
            updatedFormData.deliveryLng = deliveryResult.lng;
          } else {
            throw new Error(`Unable to geocode delivery address: "${formData.deliveryAddress}". Please try a more specific address, use autocomplete, or enter coordinates manually.`);
          }
        }

        // Update state with the new coordinates
        setFormData(updatedFormData);
        setGeocoding(false);

        // Final validation using the updated data
        if (!updatedFormData.pickupLat || !updatedFormData.pickupLng || !updatedFormData.deliveryLat || !updatedFormData.deliveryLng) {
          setError('Unable to get coordinates for addresses. Please try more specific addresses or use manual coordinate entry.');
          setLoading(false);
          return;
        }

        // Transform data to match backend DTO structure
        const orderData = {
          totalWeight: updatedFormData.totalWeight,
          cargoDescription: updatedFormData.cargoDescription,
          pickupLocation: {
            lat: updatedFormData.pickupLat,
            lng: updatedFormData.pickupLng,
            address: updatedFormData.pickupAddress,
          },
          deliveryLocation: {
            lat: updatedFormData.deliveryLat,
            lng: updatedFormData.deliveryLng,
            address: updatedFormData.deliveryAddress,
          },
          handlingTags: updatedFormData.handlingTags,
          deliveryInstructions: updatedFormData.notes,
        };

        console.log('Sending order data:', JSON.stringify(orderData, null, 2));
        await api.createOrder(orderData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        // If coordinates are already set or manual coords are provided, proceed directly
        // Transform data to match backend DTO structure
        const orderData = {
          totalWeight: formData.totalWeight,
          cargoDescription: formData.cargoDescription,
          pickupLocation: {
            lat: formData.pickupLat,
            lng: formData.pickupLng,
            address: formData.pickupAddress,
          },
          deliveryLocation: {
            lat: formData.deliveryLat,
            lng: formData.deliveryLng,
            address: formData.deliveryAddress,
          },
          handlingTags: formData.handlingTags,
          deliveryInstructions: formData.notes,
        };

        console.log('Sending order data (direct path):', JSON.stringify(orderData, null, 2));
        await api.createOrder(orderData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
      setGeocoding(false);
    }
  };

  const handleModalClose = () => {
    setSuccess(false);
    router.push('/orders');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-4 flex items-center gap-2">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Create New Order</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Cargo Description */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Cargo Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.totalWeight || ''}
                onChange={(e) => setFormData({ ...formData, totalWeight: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo Description
              </label>
              <textarea
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Handling Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {handlingTagOptions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      formData.handlingTags.includes(tag)
                        ? getHandlingTagColor(tag)
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Pickup Location
              </h3>
              <div className="flex gap-2">
                {!useManualCoords && (
                  <button
                    type="button"
                    onClick={() => setUseManualEntry(!useManualEntry)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {useManualEntry ? 'Use Autocomplete' : 'Manual Entry'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setUseManualCoords(!useManualCoords)}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  {useManualCoords ? 'Hide Coordinates' : 'Manual Coords'}
                </button>
              </div>
            </div>
            
            {useManualCoords ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pickup Address
                  </label>
                  <input
                    type="text"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter pickup address"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLat || ''}
                      onChange={(e) => setFormData({ ...formData, pickupLat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="6.4698"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pickupLng || ''}
                      onChange={(e) => setFormData({ ...formData, pickupLng: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="3.5852"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter coordinates manually if geocoding fails
                </p>
              </div>
            ) : useManualEntry ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pickup Address
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter pickup address (e.g., 123 Main Street, Lagos)"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Address will be automatically geocoded using OpenStreetMap
                </p>
              </div>
            ) : (
              <PlacesAutocomplete
                value={formData.pickupAddress}
                onChange={(address, lat, lng) => setFormData({ ...formData, pickupAddress: address, pickupLat: lat, pickupLng: lng })}
                placeholder="Enter pickup address"
                label="Address"
                iconColor="text-orange-600 dark:text-orange-400"
              />
            )}
          </div>

          {/* Delivery Location */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              Delivery Location
            </h3>
            
            {useManualCoords ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter delivery address"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.deliveryLat || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryLat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="6.4698"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.deliveryLng || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryLng: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="3.5852"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter coordinates manually if geocoding fails
                </p>
              </div>
            ) : useManualEntry ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter delivery address (e.g., 456 Market Street, Lagos)"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Address will be automatically geocoded using OpenStreetMap
                </p>
              </div>
            ) : (
              <PlacesAutocomplete
                value={formData.deliveryAddress}
                onChange={(address, lat, lng) => setFormData({ ...formData, deliveryAddress: address, deliveryLat: lat, deliveryLng: lng })}
                placeholder="Enter delivery address"
                label="Address"
                iconColor="text-green-600 dark:text-green-400"
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || geocoding}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {geocoding ? 'Geocoding addresses...' : loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>
      </div>
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={success}
        onClose={handleModalClose}
        title="Order Created Successfully!"
        message="Your order has been created and is being processed."
      />
    </div>
  );
}
