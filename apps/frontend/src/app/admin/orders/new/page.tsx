'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, getAccessToken } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { geocodeAddress } from '@/lib/geocoding';
import { Package, ArrowLeft, MapPin, Check, User } from 'lucide-react';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { GoogleMapWrapper, useMap } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { SuccessModal } from '@/components/shared/success-modal';

interface Client {
  id: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
}

function OrderMapOverlays({
  pickupLat, pickupLng, deliveryLat, deliveryLng,
}: { pickupLat: number; pickupLng: number; deliveryLat: number; deliveryLng: number }) {
  const map = useMap();
  if (!map) return null;
  return (
    <>
      {pickupLat !== 0 && pickupLng !== 0 && (
        <MapMarker map={map} position={{ lat: pickupLat, lng: pickupLng }} type="pickup" label="📦" />
      )}
      {deliveryLat !== 0 && deliveryLng !== 0 && (
        <MapMarker map={map} position={{ lat: deliveryLat, lng: deliveryLng }} type="delivery" label="🏠" />
      )}
    </>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [useManualCoords, setUseManualCoords] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [formData, setFormData] = useState({
    clientId: '',
    requesterName: '',
    requesterPhone: '',
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
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    declaredCargoValue: undefined as number | undefined,
  });

  const [handlingTagOptions, setHandlingTagOptions] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const accessToken = getAccessToken();

  // Fetch clients and handling tags from backend
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const response = await api.getUsers({ role: 'CLIENT', limit: 1000 });
        setClients(response.data || []);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setClientsLoading(false);
      }
    };

    const fetchHandlingTags = async () => {
      try {
        setTagsLoading(true);
        const tags = await api.getAllHandlingTags();
        setHandlingTagOptions(tags.map((tag: any) => tag.name));
      } catch (err) {
        console.error('Failed to fetch handling tags:', err);
        // Fallback to default tags if fetch fails
        setHandlingTagOptions(['HEAVY', 'FRAGILE', 'HAZARDOUS', 'CHEMICAL', 'VERTICAL_STORAGE_REQUIRED', 'TEMPERATURE_SENSITIVE']);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchClients();
    fetchHandlingTags();
  }, []);

  // Clear invalid tags from state when tags are loaded
  useEffect(() => {
    if (handlingTagOptions.length > 0) {
      setFormData(prev => ({
        ...prev,
        handlingTags: prev.handlingTags.filter(tag => handlingTagOptions.includes(tag)),
      }));
    }
  }, [handlingTagOptions]);

  const getHandlingTagColor = (tag: string, isSelected: boolean) => {
    const upperTag = tag.toUpperCase();
    if (isSelected) {
      switch (upperTag) {
        case 'HEAVY':
          return 'bg-purple-500 text-white dark:bg-purple-600';
        case 'FRAGILE':
          return 'bg-pink-500 text-white dark:bg-pink-600';
        case 'HAZARDOUS':
          return 'bg-red-500 text-white dark:bg-red-600';
        case 'CHEMICAL':
          return 'bg-orange-500 text-white dark:bg-orange-600';
        case 'VERTICAL_STORAGE_REQUIRED':
          return 'bg-yellow-500 text-white dark:bg-yellow-600';
        case 'TEMPERATURE_SENSITIVE':
          return 'bg-cyan-500 text-white dark:bg-cyan-600';
        default:
          return 'bg-gray-500 text-white dark:bg-gray-600';
      }
    } else {
      switch (upperTag) {
        case 'HEAVY':
          return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50';
        case 'FRAGILE':
          return 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50';
        case 'HAZARDOUS':
          return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50';
        case 'CHEMICAL':
          return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50';
        case 'VERTICAL_STORAGE_REQUIRED':
          return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50';
        case 'TEMPERATURE_SENSITIVE':
          return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50';
        default:
          return 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900/50';
      }
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
      const userRole = user?.role?.toUpperCase();
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'OPERATIONS') {
        throw new Error('You do not have permission to create orders.');
      }

      if (!formData.clientId) {
        throw new Error('Please select a client for this order.');
      }

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
          clientId: updatedFormData.clientId,
          requesterName: updatedFormData.requesterName,
          requesterPhone: updatedFormData.requesterPhone,
          totalWeight: updatedFormData.totalWeight,
          cargoDescription: updatedFormData.cargoDescription,
          declaredCargoValue: updatedFormData.declaredCargoValue,
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
          priority: updatedFormData.priority,
        };

        console.log('Sending order data:', JSON.stringify(orderData, null, 2));
        await api.createOrder(orderData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/orders');
        }, 2000);
      } else {
        // If coordinates are already set or manual coords are provided, proceed directly
        // Transform data to match backend DTO structure
        const orderData = {
          clientId: formData.clientId,
          requesterName: formData.requesterName,
          requesterPhone: formData.requesterPhone,
          totalWeight: formData.totalWeight,
          cargoDescription: formData.cargoDescription,
          declaredCargoValue: formData.declaredCargoValue,
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
          priority: formData.priority,
        };

        console.log('Sending order data (direct path):', JSON.stringify(orderData, null, 2));
        await api.createOrder(orderData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/orders');
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
    router.push('/admin/orders');
  };

  // Calculate map center based on pickup and delivery locations
  const getMapCenter = () => {
    const hasPickup = formData.pickupLat !== 0 && formData.pickupLng !== 0;
    const hasDelivery = formData.deliveryLat !== 0 && formData.deliveryLng !== 0;

    if (hasPickup && hasDelivery) {
      return {
        lat: (formData.pickupLat + formData.deliveryLat) / 2,
        lng: (formData.pickupLng + formData.deliveryLng) / 2,
      };
    } else if (hasPickup) {
      return { lat: formData.pickupLat, lng: formData.pickupLng };
    } else if (hasDelivery) {
      return { lat: formData.deliveryLat, lng: formData.deliveryLng };
    }
    return { lat: 6.5244, lng: 3.3792 }; // Default: Lagos, Nigeria
  };

  const mapCenter = getMapCenter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 pb-24">
      {/* Header */}
      <div className="h-16 bg-slate-900/90 backdrop-blur-xl text-white px-4 flex items-center gap-2 border-b border-slate-700/50">
        <button onClick={() => router.back()} className="text-white hover:text-blue-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Create New Order</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-4 text-red-800 dark:text-red-300 shadow-lg">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              Client
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                required
                disabled={clientsLoading}
              >
                <option value="">{clientsLoading ? 'Loading clients...' : 'Select a client'}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} ({client.email})
                  </option>
                ))}
              </select>
              {clients.length === 0 && !clientsLoading && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  No clients found. Please create a client account first.
                </p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requester Name
                </label>
                <input
                  type="text"
                  value={formData.requesterName}
                  onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  placeholder="Person requesting on behalf of client"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requester Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.requesterPhone}
                  onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                  placeholder="+2348012345678"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Cargo Description */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <div className="mt-2 text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-600">
                      <th className="text-left py-1 px-2 font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                      <th className="text-left py-1 px-2 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <td className="py-1 px-2 font-semibold text-gray-600 dark:text-gray-400">LOW</td>
                      <td className="py-1 px-2 text-gray-600 dark:text-gray-400">Non-urgent, 5-7 day delivery window, routine restocking</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <td className="py-1 px-2 font-semibold text-blue-600 dark:text-blue-400">NORMAL</td>
                      <td className="py-1 px-2 text-blue-600 dark:text-blue-400">Standard 2-3 day delivery, most orders</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <td className="py-1 px-2 font-semibold text-orange-600 dark:text-orange-400">HIGH</td>
                      <td className="py-1 px-2 text-orange-600 dark:text-orange-400">Time-sensitive, 24-48 hours, important commitments</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-semibold text-red-600 dark:text-red-400">URGENT</td>
                      <td className="py-1 px-2 text-red-600 dark:text-red-400">Same-day/overnight, critical operations, emergencies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo Description
              </label>
              <textarea
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Declared Cargo Value (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.declaredCargoValue || ''}
                onChange={(e) => setFormData({ ...formData, declaredCargoValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Optional — used to calculate insurance premium"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                If provided, insurance is mandatory and calculated as a percentage of this value.
              </p>
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      getHandlingTagColor(tag, formData.handlingTags.includes(tag))
                    }`}
                  >
                    {formatStatus(tag)}
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
              />
            </div>
          </div>

          {/* Pickup & Delivery Locations with Map */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Locations
              </h3>
              <div className="flex gap-2">
                {!useManualCoords && (
                  <button
                    type="button"
                    onClick={() => setUseManualEntry(!useManualEntry)}
                    className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-300"
                  >
                    {useManualEntry ? 'Use Autocomplete' : 'Manual Entry'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setUseManualCoords(!useManualCoords)}
                  className="text-sm px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all duration-300"
                >
                  {useManualCoords ? 'Hide Coordinates' : 'Manual Coords'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Location Inputs */}
              <div className="space-y-6">
                {/* Pickup Location */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    Pickup Location
                  </h4>
                  {useManualCoords ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.pickupAddress}
                        onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm"
                        placeholder="Enter pickup address"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          value={formData.pickupLat || ''}
                          onChange={(e) => setFormData({ ...formData, pickupLat: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                          placeholder="Latitude"
                          required
                        />
                        <input
                          type="number"
                          step="any"
                          value={formData.pickupLng || ''}
                          onChange={(e) => setFormData({ ...formData, pickupLng: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                          placeholder="Longitude"
                          required
                        />
                      </div>
                    </div>
                  ) : useManualEntry ? (
                    <input
                      type="text"
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm"
                      placeholder="Enter pickup address"
                      required
                    />
                  ) : (
                    <PlacesAutocomplete
                      value={formData.pickupAddress}
                      onChange={(address: string, lat: number, lng: number) => setFormData({ ...formData, pickupAddress: address, pickupLat: lat, pickupLng: lng })}
                      placeholder="Enter pickup address"
                      label="Pickup Address"
                      iconColor="text-orange-600 dark:text-orange-400"
                      token={accessToken}
                    />
                  )}
                </div>

                {/* Delivery Location */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    Delivery Location
                  </h4>
                  {useManualCoords ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm"
                        placeholder="Enter delivery address"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          value={formData.deliveryLat || ''}
                          onChange={(e) => setFormData({ ...formData, deliveryLat: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                          placeholder="Latitude"
                          required
                        />
                        <input
                          type="number"
                          step="any"
                          value={formData.deliveryLng || ''}
                          onChange={(e) => setFormData({ ...formData, deliveryLng: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                          placeholder="Longitude"
                          required
                        />
                      </div>
                    </div>
                  ) : useManualEntry ? (
                    <input
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm"
                      placeholder="Enter delivery address"
                      required
                    />
                  ) : (
                    <PlacesAutocomplete
                      value={formData.deliveryAddress}
                      onChange={(address: string, lat: number, lng: number) => setFormData({ ...formData, deliveryAddress: address, deliveryLat: lat, deliveryLng: lng })}
                      placeholder="Enter delivery address"
                      label="Delivery Address"
                      iconColor="text-green-600 dark:text-green-400"
                      token={accessToken}
                    />
                  )}
                </div>

                {useManualCoords && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter coordinates manually if geocoding fails
                  </p>
                )}
                {useManualEntry && !useManualCoords && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Addresses will be automatically geocoded using OpenStreetMap
                  </p>
                )}
              </div>

              {/* Right: Map */}
              <div className="h-[400px] bg-gray-100 dark:bg-slate-700 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50">
                <GoogleMapWrapper center={mapCenter} zoom={12}>
                  <OrderMapOverlays
                    pickupLat={formData.pickupLat}
                    pickupLng={formData.pickupLng}
                    deliveryLat={formData.deliveryLat}
                    deliveryLng={formData.deliveryLng}
                  />
                </GoogleMapWrapper>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || geocoding}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 disabled:cursor-not-allowed"
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
