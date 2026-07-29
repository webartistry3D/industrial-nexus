'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { geocodeAddress } from '@/lib/geocoding';
import { Package, ArrowLeft, MapPin, Check, User } from 'lucide-react';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { GoogleMapWrapper, useMap } from '@/components/maps/GoogleMap';
import { MapMarker } from '@/components/maps/MapMarker';
import { SuccessModal } from '@/components/success-modal';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [useManualCoords, setUseManualCoords] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [formData, setFormData] = useState({
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
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [manualGeocode, setManualGeocode] = useState<{
    pickup: { loading: boolean; error: string | null };
    delivery: { loading: boolean; error: string | null };
  }>({
    pickup: { loading: false, error: null },
    delivery: { loading: false, error: null },
  });

  // Fetch handling tags from backend
  useEffect(() => {
    const fetchHandlingTags = async () => {
      try {
        setTagsLoading(true);
        const tags = await api.getHandlingTags();
        setHandlingTagOptions(tags.map((tag: any) => tag.name));
      } catch (err) {
        console.error('Failed to fetch handling tags:', err);
        // Fallback to default tags if fetch fails
        setHandlingTagOptions(['HEAVY', 'FRAGILE', 'HAZARDOUS', 'CHEMICAL', 'VERTICAL_STORAGE_REQUIRED', 'TEMPERATURE_SENSITIVE']);
      } finally {
        setTagsLoading(false);
      }
    };

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

  // Fetch cost estimate when all required fields are filled
  useEffect(() => {
    const hasCoords =
      formData.pickupLat !== 0 &&
      formData.pickupLng !== 0 &&
      formData.deliveryLat !== 0 &&
      formData.deliveryLng !== 0;
    const hasWeight = formData.totalWeight > 0;

    if (!hasCoords || !hasWeight) {
      setEstimate(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setEstimateLoading(true);
        const result = await api.getBillingEstimate({
          pickupLat: formData.pickupLat,
          pickupLng: formData.pickupLng,
          deliveryLat: formData.deliveryLat,
          deliveryLng: formData.deliveryLng,
          totalWeight: formData.totalWeight,
          priority: formData.priority,
          handlingTags: formData.handlingTags,
          declaredCargoValue: formData.declaredCargoValue,
        });
        setEstimate(result);
      } catch (err) {
        console.error('Failed to fetch estimate:', err);
        setEstimate(null);
      } finally {
        setEstimateLoading(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [
    formData.pickupLat,
    formData.pickupLng,
    formData.deliveryLat,
    formData.deliveryLng,
    formData.totalWeight,
    formData.priority,
    formData.handlingTags,
    formData.declaredCargoValue,
  ]);

  // Live geocode pickup address when manual entry is active
  useEffect(() => {
    if (!useManualEntry || useManualCoords) return;
    if (formData.pickupAddress.length < 3) {
      setManualGeocode(prev => ({ ...prev, pickup: { loading: false, error: null } }));
      return;
    }

    const timeout = setTimeout(async () => {
      setManualGeocode(prev => ({ ...prev, pickup: { loading: true, error: null } }));
      const result = await geocodeAddress(formData.pickupAddress);
      if (result) {
        setFormData(prev => ({ ...prev, pickupLat: result.lat, pickupLng: result.lng }));
        setManualGeocode(prev => ({ ...prev, pickup: { loading: false, error: null } }));
      } else {
        setManualGeocode(prev => ({ ...prev, pickup: { loading: false, error: 'Could not find coordinates' } }));
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.pickupAddress, useManualEntry, useManualCoords]);

  // Live geocode delivery address when manual entry is active
  useEffect(() => {
    if (!useManualEntry || useManualCoords) return;
    if (formData.deliveryAddress.length < 3) {
      setManualGeocode(prev => ({ ...prev, delivery: { loading: false, error: null } }));
      return;
    }

    const timeout = setTimeout(async () => {
      setManualGeocode(prev => ({ ...prev, delivery: { loading: true, error: null } }));
      const result = await geocodeAddress(formData.deliveryAddress);
      if (result) {
        setFormData(prev => ({ ...prev, deliveryLat: result.lat, deliveryLng: result.lng }));
        setManualGeocode(prev => ({ ...prev, delivery: { loading: false, error: null } }));
      } else {
        setManualGeocode(prev => ({ ...prev, delivery: { loading: false, error: 'Could not find coordinates' } }));
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.deliveryAddress, useManualEntry, useManualCoords]);

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
      // Skip geocoding if manual coordinates are provided
      const shouldSkipGeocoding = useManualCoords && 
        formData.pickupLat !== 0 && formData.pickupLng !== 0 && 
        formData.deliveryLat !== 0 && formData.deliveryLng !== 0;
      
      // If using manual entry or coordinates not set (and not using manual coords), use fallback geocoding
      if (!shouldSkipGeocoding && (useManualEntry || !formData.pickupLat || !formData.pickupLng || !formData.deliveryLat || !formData.deliveryLng)) {
        setGeocoding(true);
        setError(null);

        // Create a local copy of form data to update
        let updatedFormData = { ...formData };

        // Geocode pickup address if needed
        if (!formData.pickupLat || !formData.pickupLng) {
          const pickupResult = await geocodeAddress(formData.pickupAddress);
          
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
          requesterName: updatedFormData.requesterName,
          requesterPhone: updatedFormData.requesterPhone,
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
          priority: updatedFormData.priority,
          declaredCargoValue: updatedFormData.declaredCargoValue,
        };

        await api.createOrder(orderData);
        setSuccess(true);
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        // If coordinates are already set or manual coords are provided, proceed directly
        // Transform data to match backend DTO structure
        const orderData = {
          requesterName: formData.requesterName,
          requesterPhone: formData.requesterPhone,
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
          priority: formData.priority,
          declaredCargoValue: formData.declaredCargoValue,
        };

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

          {/* Requester Details */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              Requester Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requester Name
                </label>
                <input
                  type="text"
                  value={formData.requesterName}
                  onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  placeholder="Person requesting this order"
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
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">LOW:</span>
                  <span className="text-gray-600 dark:text-gray-400">Non-urgent, 5-7 day delivery window, routine restocking</span>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">NORMAL:</span>
                  <span className="text-blue-600 dark:text-blue-400">Standard 2-3 day delivery, most orders</span>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">HIGH:</span>
                  <span className="text-orange-600 dark:text-orange-400">Time-sensitive, 24-48 hours, important commitments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-600 dark:text-red-400">URGENT:</span>
                  <span className="text-red-600 dark:text-red-400">Same-day/overnight, critical operations, emergencies</span>
                </div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
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
                {/* <button
                  type="button"
                  onClick={() => setUseManualCoords(!useManualCoords)}
                  className="text-sm px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all duration-300"
                >
                  {useManualCoords ? 'Hide Coordinates' : 'Manual Coords'}
                </button> */}
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
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.pickupAddress}
                        onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm"
                        placeholder="Enter pickup address"
                        required
                      />
                      {manualGeocode.pickup.loading ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Locating coordinates...</p>
                      ) : manualGeocode.pickup.error ? (
                        <p className="text-xs text-red-500 dark:text-red-400">{manualGeocode.pickup.error}</p>
                      ) : formData.pickupLat !== 0 && formData.pickupLng !== 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          Lat: {formData.pickupLat.toFixed(6)}, Lng: {formData.pickupLng.toFixed(6)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <PlacesAutocomplete
                      value={formData.pickupAddress}
                      onChange={(address, lat, lng) => setFormData({ ...formData, pickupAddress: address, pickupLat: lat, pickupLng: lng })}
                      placeholder="Enter pickup address"
                      label="Pickup Address"
                      iconColor="text-orange-600 dark:text-orange-400"
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
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 text-sm"
                        placeholder="Enter delivery address"
                        required
                      />
                      {manualGeocode.delivery.loading ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Locating coordinates...</p>
                      ) : manualGeocode.delivery.error ? (
                        <p className="text-xs text-red-500 dark:text-red-400">{manualGeocode.delivery.error}</p>
                      ) : formData.deliveryLat !== 0 && formData.deliveryLng !== 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          Lat: {formData.deliveryLat.toFixed(6)}, Lng: {formData.deliveryLng.toFixed(6)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <PlacesAutocomplete
                      value={formData.deliveryAddress}
                      onChange={(address, lat, lng) => setFormData({ ...formData, deliveryAddress: address, deliveryLat: lat, deliveryLng: lng })}
                      placeholder="Enter delivery address"
                      label="Delivery Address"
                      iconColor="text-green-600 dark:text-green-400"
                    />
                  )}
                </div>

                {/* useManualCoords && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter coordinates manually if geocoding fails
                  </p>
                ) */}
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

          {/* Cost Estimate Preview */}
          {(estimate || estimateLoading) && (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estimated Cost
              </h3>
              {estimateLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Calculating estimate...</p>
              ) : estimate ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Freight</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{estimate.baseFreightCharge?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weight Charge</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{estimate.weightCharge?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {estimate.handlingSurcharges && Object.entries(estimate.handlingSurcharges).map(([tag, amount]) => (
                    <div key={tag} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Handling ({tag})</span>
                      <span className="font-medium text-gray-900 dark:text-white">₦{(amount as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority Multiplier</span>
                    <span className="font-medium text-gray-900 dark:text-white">×{estimate.priorityMultiplier}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{estimate.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Insurance Premium</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{estimate.insurancePremium?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">VAT</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{estimate.vatAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-900 dark:text-white">Estimated Total</span>
                    <span className="text-blue-600 dark:text-blue-400">₦{estimate.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Estimate — final invoice generated on approval.
                  </p>
                </div>
              ) : null}
            </div>
          )}

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
