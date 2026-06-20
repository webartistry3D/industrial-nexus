'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { User, Driver, KycDocument, KycDocumentType, KycDocumentTypeValue, KycDocumentStatus, KycDocumentStatusValue } from '@/types';
import { User as UserIcon, Truck, Phone, Mail, LogOut, Shield, Upload, FileText, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showKycSection, setShowKycSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<KycDocumentTypeValue>(KycDocumentType.GOVERNMENT_ID);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      setDriver(response);
      // Fetch KYC documents
      if (response.id) {
        const kycDocs = await api.getMyKycDocuments();
        setKycDocuments(kycDocs);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
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

  const getDocumentStatusIcon = (status: KycDocumentStatusValue) => {
    switch (status) {
      case KycDocumentStatus.VERIFIED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case KycDocumentStatus.REJECTED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case KycDocumentStatus.UNDER_REVIEW:
        return <Clock className="w-5 h-5 text-blue-500" />;
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
      case KycDocumentType.VEHICLE_INSURANCE:
        return 'Insurance Certificate';
      case KycDocumentType.PROFESSIONAL_CERTIFICATION:
        return 'Professional Certification';
      default:
        return type;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
          <UserIcon className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      <main className="pt-20 px-4 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            {/* <p className="text-sm text-gray-500 dark:text-gray-400">View and update your profile information</p> */}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                Role: <span className="font-medium text-gray-900 dark:text-white">{user?.role}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${(user as any)?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-600 dark:text-gray-400">
                Status: <span className="font-medium text-gray-900 dark:text-white">{(user as any)?.status || 'ACTIVE'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Driver Details */}
        {driver && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Driver Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">License Number</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">{driver.licenseNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">KYC Status</p>
                  <p className={`font-medium font-mono ${
                    driver.kycStatus === 'VERIFIED' ? 'text-green-600 dark:text-green-400' :
                    driver.kycStatus === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {driver.kycStatus}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  driver.availability === 'AVAILABLE' ? 'bg-green-500' :
                  driver.availability === 'ON_TRIP' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Availability</p>
                  <p className="font-medium text-gray-900 dark:text-white">{driver.availability}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-mono">{(user as any)?.phoneNumber || 'Not provided'}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* KYC Documents Section */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">KYC Documents</h3>
            <button
              onClick={() => setShowKycSection(!showKycSection)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as KycDocumentTypeValue)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300"
                >
                  <option value={KycDocumentType.GOVERNMENT_ID}>Government ID</option>
                  <option value={KycDocumentType.DRIVERS_LICENSE}>Driver's License</option>
                  <option value={KycDocumentType.PROOF_OF_ADDRESS}>Proof of Address</option>
                  <option value={KycDocumentType.VEHICLE_REGISTRATION}>Vehicle Registration</option>
                  <option value={KycDocumentType.VEHICLE_INSURANCE}>Insurance Certificate</option>
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
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5"
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
            <div className="space-y-3">
              {kycDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-600/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <FileText className="w-5 h-5 text-white" />
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
                        {doc.status}
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

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </main>

    </div>
  );
}
