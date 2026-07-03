'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { User, Driver, KycDocument, KycDocumentType, KycDocumentTypeValue, KycDocumentStatus, KycDocumentStatusValue, VehicleDocument, VehicleDocumentType, VehicleDocumentTypeValue, VehicleDocumentStatus, VehicleDocumentStatusValue } from '@/types';
import { User as UserIcon, Truck, Phone, Mail, LogOut, Shield, Upload, FileText, CheckCircle, XCircle, Clock, Trash2, Scale, CalendarClock, BadgeCheck, AlertTriangle, Camera, Edit2, Save, X, ScanLine, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [vehicleDocuments, setVehicleDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showKycSection, setShowKycSection] = useState(false);
  const [showVehicleDocSection, setShowVehicleDocSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVehicleFile, setSelectedVehicleFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<KycDocumentTypeValue>(KycDocumentType.GOVERNMENT_ID);
  const [selectedVehicleDocType, setSelectedVehicleDocType] = useState<VehicleDocumentTypeValue>(VehicleDocumentType.VEHICLE_REGISTRATION);
  const [vehicleDocExpiry, setVehicleDocExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycSuccess, setKycSuccess] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[Avatar] File selected:', file?.name, file?.size, file?.type);
    if (!file) return;
    try {
      setUploadingImage(true);
      setError(null);
      const updated = await api.uploadProfileImage(file);
      console.log('[Avatar] Upload response:', JSON.stringify(updated));
      console.log('[Avatar] profileImageUrl from response:', updated.profileImageUrl);
      setProfileImageUrl(updated.profileImageUrl || null);
    } catch (err: any) {
      console.error('[Avatar] Upload error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const getAvatarUrl = () => {
    if (profileImageUrl) {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const fullUrl = profileImageUrl.startsWith('http') ? profileImageUrl : `${base}${profileImageUrl}`;
      console.log('[Avatar] Resolved URL:', fullUrl);
      return fullUrl;
    }
    return null;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [authLoading, user, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      const driverData = response.driver || response;
      setDriver(driverData);
      // Set profile image URL if present
      if (response.profileImageUrl) {
        setProfileImageUrl(response.profileImageUrl);
      }
      setFormData({
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        phoneNumber: response.phoneNumber || '',
      });
      // Fetch KYC documents
      if (driverData?.id) {
        const kycDocs = await api.getMyKycDocuments();
        setKycDocuments(kycDocs);
      }
      // Fetch vehicle documents if assigned to vehicle
      if (driverData?.vehicle?.id) {
        const vehicleDocs = await api.getMyVehicleDocuments();
        setVehicleDocuments(vehicleDocs);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.updateMyProfile(formData);
      setEditingProfile(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await api.uploadKycDocument(selectedFile, selectedDocType);
      
      // Refresh KYC documents
      const kycDocs = await api.getMyKycDocuments();
      setKycDocuments(kycDocs);
      
      setSelectedFile(null);
      setShowKycSection(false);
      setKycSuccess('Document uploaded successfully');
      setTimeout(() => setKycSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.deleteKycDocument(documentId);
      // Refresh KYC documents
      const kycDocs = await api.getMyKycDocuments();
      setKycDocuments(kycDocs);
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  const handleVehicleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleFile) {
      setError('Please select a file to upload');
      return;
    }

    if (selectedVehicleFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedVehicleFile.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await api.uploadVehicleDocument(selectedVehicleFile, selectedVehicleDocType, vehicleDocExpiry || undefined);

      const vehicleDocs = await api.getMyVehicleDocuments();
      setVehicleDocuments(vehicleDocs);

      setSelectedVehicleFile(null);
      setVehicleDocExpiry('');
      setShowVehicleDocSection(false);
      setSuccess('Vehicle document uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to upload vehicle document:', err);
      setError(err.response?.data?.message || 'Failed to upload vehicle document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVehicleDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle document?')) {
      return;
    }

    try {
      await api.deleteVehicleDocument(documentId);
      const vehicleDocs = await api.getMyVehicleDocuments();
      setVehicleDocuments(vehicleDocs);
    } catch (err: any) {
      console.error('Failed to delete vehicle document:', err);
      setError('Failed to delete vehicle document. Please try again.');
    }
  };

  const getDocumentStatusIcon = (status: KycDocumentStatusValue) => {
    switch (status) {
      case KycDocumentStatus.VERIFIED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case KycDocumentStatus.REJECTED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case KycDocumentStatus.UNDER_REVIEW:
        return <Clock className="w-5 h-5 text-blue-900" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
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

  const getVehicleDocumentTypeLabel = (type: VehicleDocumentTypeValue) => {
    switch (type) {
      case VehicleDocumentType.VEHICLE_REGISTRATION:
        return 'Vehicle Registration';
      case VehicleDocumentType.ROAD_WORTHINESS:
        return 'Road Worthiness';
      case VehicleDocumentType.INSURANCE_CERTIFICATE:
        return 'Insurance Certificate';
      case VehicleDocumentType.VEHICLE_LICENSE:
        return 'Vehicle License';
      case VehicleDocumentType.HAULAGE_PERMIT:
        return 'Haulage Permit';
      case VehicleDocumentType.TEMPERATURE_CONTROL_CERTIFICATION:
        return 'Temperature Control Certification';
      case VehicleDocumentType.HAZARDOUS_MATERIAL_CERTIFICATION:
        return 'Hazardous Material Certification';
      default:
        return type;
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
        <PageHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      <main className="pt-20 px-4 pb-4">
        {success && (
          <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="max-w-6xl mx-auto mt-2 mb-0 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-3 text-green-800 dark:text-green-300 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="max-w-6xl mx-auto mt-2 mb-0 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-3 text-red-800 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-900 dark:to-blue-900 rounded-2xl p-6 text-white dark:text-lime-500 shadow-lg border border-white/10 dark:border-blue-800">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()!} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-blue-900 rounded-full flex items-center justify-center shadow-md hover:bg-blue-50 transition-colors"
                >
                  {uploadingImage ? <div className="w-3 h-3 border border-blue-900 border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
                <p className="text-blue-100 dark:text-slate-300 truncate">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  {formatStatus(user?.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Grid layout for Driver Details and Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver Details */}
            {driver && (
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 md:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Driver Information</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">License Number</p>
                      <p className="font-medium text-gray-900 dark:text-white font-mono">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Vehicle Weight</p>
                      {driver.vehicle ? (
                        <p className="font-medium text-gray-900 dark:text-white font-mono">
                          {driver.vehicle.capacityKg.toLocaleString()} kg
                        </p>
                      ) : (
                        <p className="font-medium text-gray-400 dark:text-gray-500 italic">No vehicle assigned</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">KYC Status</p>
                      <p className={`font-medium font-mono ${
                        driver.kycStatus === 'VERIFIED' ? 'text-green-600 dark:text-green-400' :
                        driver.kycStatus === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {formatStatus(driver.kycStatus)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      driver.availability === 'AVAILABLE' ? 'bg-green-500' :
                      driver.availability === 'ON_TRIP' ? 'bg-blue-900' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Availability</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatStatus(driver.availability)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>
              {editingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-blue-900 dark:bg-blue-900 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Full Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.firstName || user?.firstName} {formData.lastName || user?.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Phone Number</p>
                      <p className="font-medium text-gray-900 dark:text-white font-mono">{formData.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Email Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documentation + KYC grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Driver Documentation Section */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Driver Documentation</h3>
            </div>

            {kycDocuments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No documents on file</p>
            ) : (
              <div className="space-y-3">
                {kycDocuments.map((doc) => {
                  const expiryState = getExpiryState(doc.expiresAt);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-slate-700/50 rounded-xl border border-gray-200/50 dark:border-slate-600/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg shadow-sm flex-shrink-0 bg-blue-900 text-white dark:bg-lime-500 dark:text-black">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getDocumentTypeLabel(doc.documentType)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.status === KycDocumentStatus.VERIFIED
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : doc.status === KycDocumentStatus.REJECTED
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {doc.status === KycDocumentStatus.VERIFIED && <BadgeCheck className="w-3 h-3" />}
                          {doc.status === KycDocumentStatus.REJECTED && <XCircle className="w-3 h-3" />}
                          {doc.status !== KycDocumentStatus.VERIFIED && doc.status !== KycDocumentStatus.REJECTED && <Clock className="w-3 h-3" />}
                          {formatStatus(doc.status)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                          expiryState === 'expired' ? 'text-red-500 dark:text-red-400' :
                          expiryState === 'expiring' ? 'text-orange-500 dark:text-orange-400' :
                          expiryState === 'valid' ? 'text-green-600 dark:text-green-400' :
                          'text-gray-400 dark:text-gray-500'
                        }`}>
                          {expiryState === 'expired' && <AlertTriangle className="w-3 h-3" />}
                          {expiryState === 'expiring' && <AlertTriangle className="w-3 h-3" />}
                          {expiryState === 'valid' && <CalendarClock className="w-3 h-3" />}
                          {expiryState === 'unknown' && <CalendarClock className="w-3 h-3" />}
                          {expiryState === 'expired' ? 'Expired' : expiryState === 'expiring' ? 'Expiring soon' : ''}
                          {' '}{formatExpiry(doc.expiresAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Biometric / Liveness Check Placeholder */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                <ScanLine className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Biometric Verification</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Complete a liveness check to strengthen your KYC approval. Powered by Smile Identity / Youverify.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-3">
                  <Clock className="w-3 h-3" /> Integration coming soon
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-lime-500 text-black rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
                  >
                    <ScanLine className="w-4 h-4" />
                    Start Liveness Check
                  </button>
                  <a
                    href="https://smileidentity.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Learn more
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* KYC Documents Section */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">KYC Documents</h3>
              <button
                onClick={() => { setShowKycSection(!showKycSection); setError(null); setKycSuccess(null); }}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 dark:bg-blue-900 text-white rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            {showKycSection && (
              <form onSubmit={handleFileUpload} className="mb-4 p-4 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50 space-y-3">
                {error && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/50 rounded-xl p-3 text-red-800 dark:text-red-300 text-sm shadow-lg">
                    {error}
                  </div>
                )}
                {kycSuccess && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border border-green-200/50 dark:border-green-700/50 rounded-xl p-3 text-green-800 dark:text-green-300 text-sm shadow-lg">
                    {kycSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => { setSelectedDocType(e.target.value as KycDocumentTypeValue); setError(null); }}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  >
                    <option value={KycDocumentType.GOVERNMENT_ID}>Government ID</option>
                    <option value={KycDocumentType.DRIVERS_LICENSE}>Driver's License</option>
                    <option value={KycDocumentType.PROOF_OF_ADDRESS}>Proof of Address</option>
                    <option value={KycDocumentType.VEHICLE_REGISTRATION}>Vehicle Registration</option>
                    <option value={KycDocumentType.INSURANCE_CERTIFICATE}>Insurance Certificate</option>
                    <option value={KycDocumentType.PROFESSIONAL_CERTIFICATION}>Professional Certification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select File (PDF, JPG, PNG - Max 10MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKycSection(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}

            {kycDocuments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                No documents uploaded yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {kycDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-600/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getDocumentTypeLabel(doc.documentType)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getDocumentStatusIcon(doc.status)}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatStatus(doc.status)}
                        </span>
                      </div>
                      {doc.status !== KycDocumentStatus.VERIFIED && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Documents Section */}
          {driver?.vehicle?.id && (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Vehicle Documents</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {driver.vehicle.plateNumber}
                  </span>
                </div>
                <button
                  onClick={() => setShowVehicleDocSection(!showVehicleDocSection)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 dark:bg-blue-900 text-white rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              </div>

              {showVehicleDocSection && (
                <form onSubmit={handleVehicleFileUpload} className="mb-4 p-4 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50 space-y-3">
                  {error && (
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/50 rounded-xl p-3 text-red-800 dark:text-red-300 text-sm shadow-lg">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Type
                    </label>
                    <select
                      value={selectedVehicleDocType}
                      onChange={(e) => setSelectedVehicleDocType(e.target.value as VehicleDocumentTypeValue)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:shadow-lg focus:shadow-emerald-500/10 transition-all duration-300"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date (optional)
                    </label>
                    <input
                      type="date"
                      value={vehicleDocExpiry}
                      onChange={(e) => setVehicleDocExpiry(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:shadow-lg focus:shadow-emerald-500/10 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select File (PDF, JPG, PNG - Max 10MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedVehicleFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:shadow-lg focus:shadow-emerald-500/10 transition-all duration-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVehicleDocSection(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !selectedVehicleFile}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              )}

              {vehicleDocuments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  No vehicle documents uploaded yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicleDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-600/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getVehicleDocumentTypeLabel(doc.documentType)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className={`text-[10px] font-mono mt-0.5 ${
                            getExpiryState(doc.expiresAt) === 'expired' ? 'text-red-500 dark:text-red-400' :
                            getExpiryState(doc.expiresAt) === 'expiring' ? 'text-orange-500 dark:text-orange-400' :
                            getExpiryState(doc.expiresAt) === 'valid' ? 'text-green-600 dark:text-green-400' :
                            'text-gray-400 dark:text-gray-500'
                          }`}>
                            {getExpiryState(doc.expiresAt) === 'expired' ? 'Expired' :
                             getExpiryState(doc.expiresAt) === 'expiring' ? 'Expiring soon' :
                             getExpiryState(doc.expiresAt) === 'valid' ? 'Valid until' : 'No expiry'}
                            {' '}{formatExpiry(doc.expiresAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getDocumentStatusIcon(doc.status)}
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatStatus(doc.status)}
                          </span>
                        </div>
                        {doc.status !== VehicleDocumentStatus.VERIFIED && (
                          <button
                            onClick={() => handleDeleteVehicleDocument(doc.id)}
                            className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          </div>{/* end Documentation + KYC grid */}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-80 transition-opacity duration-150"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}
