'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { MapPin, Package, CheckCircle, Camera, Pen, Navigation, Clock, Truck, Calendar, Play, Send, X, RotateCcw, ImageIcon, User, Phone, StickyNote, FileCheck, Upload } from 'lucide-react';

const sopChecklist = [
  { id: 'vehicleInspected', label: 'Vehicle inspected', completed: false },
  { id: 'cargoSecured', label: 'Cargo secured properly', completed: false },
  { id: 'handlingTagsVerified', label: 'Handling tags verified', completed: false },
  { id: 'safetyComplianceConfirmed', label: 'Safety compliance confirmed', completed: false },
];

interface PODForm {
  photoUrl: string;
  signatureUrl: string;
  receiverName: string;
  receiverPhone: string;
  notes: string;
}

export default function TripDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState(sopChecklist);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  // POD state
  const [showPODForm, setShowPODForm] = useState(false);
  const [podForm, setPodForm] = useState<PODForm>({ photoUrl: '', signatureUrl: '', receiverName: '', receiverPhone: '', notes: '' });
  const [podSubmitting, setPodSubmitting] = useState(false);
  const [podError, setPodError] = useState<string | null>(null);
  const [podSuccess, setPodSuccess] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTrip();
    }
  }, [user, params.id]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const response = await api.getTrip(params.id);
      setTrip(response);
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleStartTrip = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      if (trip?.order) {
        await api.startOrderTrip(trip.order.id);
      }
      await api.startTrip(params.id);
      await fetchTrip();
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const allCompleted = checklist.every(item => item.completed);

  // POD canvas helpers
  const getCanvasPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getCanvasPos(e, canvas);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getCanvasPos(e, canvas);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  };

  const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
    if (canvasRef.current && hasSignature) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setPodForm(f => ({ ...f, signatureUrl: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setPodForm(f => ({ ...f, signatureUrl: '' }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPhotoPreview(url);
      setPodForm(f => ({ ...f, photoUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPOD = async () => {
    setPodSubmitting(true);
    setPodError(null);
    try {
      // Get GPS coordinates
      let lat: number | undefined, lng: number | undefined;
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (error) {
          console.warn('Failed to get GPS coordinates:', error);
          // Continue without GPS coordinates
        }
      }

      await api.submitPOD(params.id, {
        photoUrl: podForm.photoUrl || undefined,
        signatureUrl: podForm.signatureUrl || undefined,
        notes: [
          podForm.receiverName ? `Received by: ${podForm.receiverName}` : '',
          podForm.receiverPhone ? `Phone: ${podForm.receiverPhone}` : '',
          podForm.notes,
        ].filter(Boolean).join(' | ') || undefined,
        lat,
        lng,
      });
      setPodSuccess(true);
      setShowPODForm(false);
      await fetchTrip();
    } catch (err: any) {
      setPodError(err?.response?.data?.message || err.message || 'Failed to submit POD');
    } finally {
      setPodSubmitting(false);
    }
  };

  const startTrip = async () => {
    if (!allCompleted) {
      alert('Please complete all SOP checklist items');
      return;
    }
    try {
      setSubmitting(true);
      const checklistData = checklist.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.completed,
      }), {} as any);
      await api.submitChecklist(params.id, checklistData);
      await api.startTrip(params.id);
      await fetchTrip();
    } catch (error) {
      console.error('Failed to start trip:', error);
      alert('Failed to start trip');
    } finally {
      setSubmitting(false);
    }
  };

  const completeTrip = async () => {
    try {
      setSubmitting(true);
      await api.completeTrip(params.id);
      await fetchTrip();
    } catch (error) {
      console.error('Failed to complete trip:', error);
      alert('Failed to complete trip');
    } finally {
      setSubmitting(false);
    }
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

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Trip not found</p>
      </div>
    );
  }

  const isSOPPending = trip.status === 'ASSIGNED' || trip.status === 'SOP_COMPLETED';
  const isInTransit = trip.status === 'IN_TRANSIT';

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-white hover:text-blue-200 transition-colors">
            ← Back
          </button>
          <h1 className="text-lg font-semibold ml-2">Trip <span className="font-mono">{trip.order?.orderNumber}</span></h1>
        </div>

        {/* Action Messages */}
        <div className="mt-3 space-y-2">
          {actionSuccess && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-100 text-sm flex items-center gap-2 backdrop-blur-sm">
              <CheckCircle className="w-4 h-4" />
              Trip started successfully
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100 text-sm backdrop-blur-sm">
              {actionError}
            </div>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Start Trip Button for ASSIGNED status */}
        {trip.status === 'ASSIGNED' && trip.order?.status === 'ASSIGNED' && (
          <button
            onClick={handleStartTrip}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-xl shadow-lg active:opacity-80 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {actionLoading ? 'Starting...' : 'Start Trip'}
          </button>
        )}
        {/* Trip Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              trip.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              trip.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              trip.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {trip.status.replace(/_/g, ' ')}
            </span>
          </div>
          {trip.eta && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                  {new Date(trip.eta).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Tracking Button */}
        {(trip.status === 'IN_TRANSIT' || trip.status === 'ASSIGNED') && (
          <button
            onClick={() => router.push('/tracking')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-xl p-4 flex items-center justify-center gap-2 shadow-lg active:opacity-80 transition-opacity duration-150 border border-blue-500/30 dark:border-blue-400/30"
          >
            <Navigation className="w-5 h-5" />
            <span className="font-semibold">View Live Tracking</span>
          </button>
        )}

        {/* Trip Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Order Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                <MapPin className="w-4 h-4 text-white mt-0.5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Pickup</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.pickupLocation?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                <MapPin className="w-4 h-4 text-white mt-0.5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                <p className="text-gray-600 dark:text-gray-400">{trip.order?.deliveryLocation?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                <Package className="w-4 h-4 text-white mt-0.5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cargo</p>
                <p className="text-gray-600 dark:text-gray-400 font-mono">{trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Timeline</h2>
          <div className="space-y-3 text-sm">
            {trip.startedAt && (
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                  <Clock className="w-4 h-4 text-white mt-0.5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Started</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">
                    {new Date(trip.startedAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
            {trip.completedAt && (
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white mt-0.5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Completed</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">
                    {new Date(trip.completedAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SOP Checklist */}
        {isSOPPending && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">SOP Checklist</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Complete all items before starting trip</p>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer active:bg-gray-50 dark:active:bg-slate-700 transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-5 h-5 text-blue-900 rounded"
                  />
                  <span className={`${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isSOPPending && (
            <button
              onClick={startTrip}
              disabled={!allCompleted || submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white py-3 rounded-xl font-semibold active:opacity-80 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Starting...' : 'Start Trip'}
            </button>
          )}
          {isInTransit && (
            <>
              {/* POD success banner */}
              {podSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-green-700 dark:text-green-400 text-sm">
                  <FileCheck className="w-4 h-4" />
                  Proof of Delivery submitted successfully
                </div>
              )}

              {/* POD section — shows existing POD or capture form toggle */}
              {(trip as any).pod ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                      <FileCheck className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">POD Captured</p>
                    <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">Done</span>
                  </div>
                  {(trip as any).pod.imageUrl && (
                    <img src={(trip as any).pod.imageUrl} alt="POD" className="w-full max-h-48 object-contain rounded-xl border border-gray-200 dark:border-slate-700" />
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowPODForm(!showPODForm)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-80 transition-opacity duration-150"
                  >
                    <Camera className="w-5 h-5" />
                    {showPODForm ? 'Hide POD Form' : 'Capture Proof of Delivery'}
                  </button>

                  {showPODForm && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-900" />
                        Proof of Delivery
                      </h3>

                      {podError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                          {podError}
                        </div>
                      )}

                      {/* Photo capture */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Delivery Photo
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        {photoPreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                            <img src={photoPreview} alt="POD photo" className="w-full max-h-48 object-cover" />
                            <button
                              onClick={() => { setPhotoPreview(null); setPodForm(f => ({ ...f, photoUrl: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-gray-500 dark:text-gray-400 active:opacity-70"
                          >
                            <Upload className="w-6 h-6" />
                            <span className="text-sm">Tap to take photo or upload</span>
                          </button>
                        )}
                      </div>

                      {/* Signature pad */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                            <Pen className="w-3.5 h-3.5" /> Receiver Signature
                          </p>
                          {hasSignature && (
                            <button onClick={clearSignature} className="flex items-center gap-1 text-xs text-red-500">
                              <RotateCcw className="w-3 h-3" /> Clear
                            </button>
                          )}
                        </div>
                        <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-slate-600 bg-white touch-none" style={{ cursor: 'crosshair' }}>
                          <canvas
                            ref={canvasRef}
                            width={600}
                            height={180}
                            className="w-full"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>
                        {!hasSignature && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">Sign in the box above</p>
                        )}
                      </div>

                      {/* Receiver details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Receiver name (optional)"
                            value={podForm.receiverName}
                            onChange={e => setPodForm(f => ({ ...f, receiverName: e.target.value }))}
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="tel"
                            placeholder="Receiver phone (optional)"
                            value={podForm.receiverPhone}
                            onChange={e => setPodForm(f => ({ ...f, receiverPhone: e.target.value }))}
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none font-mono"
                          />
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <textarea
                            placeholder="Delivery notes (optional)"
                            value={podForm.notes}
                            onChange={e => setPodForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2}
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitPOD}
                        disabled={podSubmitting || (!podForm.photoUrl && !hasSignature)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:opacity-80 transition-opacity duration-150"
                      >
                        <Send className="w-4 h-4" />
                        {podSubmitting ? 'Submitting...' : 'Submit Proof of Delivery'}
                      </button>
                      <p className="text-xs text-gray-400 text-center">Requires at least a photo or signature</p>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={completeTrip}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:opacity-80 transition-opacity duration-150"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Completing...' : 'Complete Delivery'}
              </button>
            </>
          )}
          {trip.status === 'DELIVERED' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-600 font-semibold">✓ Trip Completed</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
