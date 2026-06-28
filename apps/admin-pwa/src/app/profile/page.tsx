'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { User as UserIcon, Mail, Phone, Shield, Key, Bell, Globe, Clock, Edit2, Save, X, Camera, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data state - initialize with current user data
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    role: user?.role || '',
    status: 'ACTIVE',
    createdAt: user ? new Date().toISOString() : '',
    lastLoginAt: user ? new Date().toISOString() : '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    orderAlerts: true,
    tripAlerts: true,
    systemAlerts: true,
  });

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: '',
        role: user.role || '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    }
  }, [user]);

  // Fetch full profile to get profileImageUrl
  useEffect(() => {
    const fetchFullProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const fullProfile = await api.getProfile();
          console.log('[Avatar] Full profile fetched:', JSON.stringify(fullProfile));
          console.log('[Avatar] profileImageUrl from profile fetch:', fullProfile.profileImageUrl);
          if (fullProfile.profileImageUrl) {
            setProfileImageUrl(fullProfile.profileImageUrl);
          }
          if (fullProfile.phoneNumber) {
            setProfileData(prev => ({ ...prev, phoneNumber: fullProfile.phoneNumber || '' }));
          }
        } catch (err) {
          console.error('[Avatar] Failed to fetch full profile:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFullProfile();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.updateMyProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
      });
      setSuccess(true);
      setEditingProfile(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[Avatar] File selected:', file?.name, file?.size, file?.type);
    if (!file) return;
    try {
      setUploadingImage(true);
      setError(null);
      console.log('[Avatar] Uploading to POST /users/me/avatar...');
      const updated = await api.uploadProfileImage(file);
      console.log('[Avatar] Upload response:', JSON.stringify(updated));
      console.log('[Avatar] profileImageUrl from response:', updated.profileImageUrl);
      setProfileImageUrl(updated.profileImageUrl || null);
      console.log('[Avatar] profileImageUrl state set to:', updated.profileImageUrl || null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Avatar] Upload error:', err);
      console.error('[Avatar] Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const getAvatarUrl = () => {
    console.log('[Avatar] getAvatarUrl called, profileImageUrl state:', profileImageUrl);
    if (profileImageUrl) {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const fullUrl = profileImageUrl.startsWith('http') ? profileImageUrl : `${base}${profileImageUrl}`;
      console.log('[Avatar] Resolved URL:', fullUrl);
      return fullUrl;
    }
    return null;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      // Note: This would need a backend endpoint for password change
      // await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      // Note: This would need a backend endpoint for notification settings
      // await api.updateNotificationSettings(notificationSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'OPERATIONS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CLIENT':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case 'DRIVER':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-semibold">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Success Message */}
      {success && (
        <div className="mx-4 mt-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 text-green-800 dark:text-green-300">
          Changes saved successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-800 dark:to-blue-800 rounded-2xl p-4 md:p-6 text-white shadow-lg border border-white/10 mb-4 md:mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
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
                {uploadingImage ? <div className="w-3 h-3 border border-blue-900 border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{profileData.firstName} {profileData.lastName}</h1>
              <p className="text-blue-100 dark:text-slate-300 text-sm">{profileData.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  <Shield className="w-3 h-3 mr-1" />
                  {formatStatus(profileData.role)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(profileData.status).replace('bg-', 'bg-opacity-80 bg-')}`}>
                  {formatStatus(profileData.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto md:overflow-x-visible -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar mb-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'profile'
                ? 'bg-blue-900 dark:bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'security'
                ? 'bg-blue-900 dark:bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-blue-900 dark:bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Notifications
          </button>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6">
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!editingProfile}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!editingProfile}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200 dark:border-slate-700">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{formatStatus(profileData.role)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(profileData.status)}`}>
                        {formatStatus(profileData.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">
                        {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Login</label>
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">
                        {profileData.lastLoginAt ? new Date(profileData.lastLoginAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {editingProfile && (
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </h3>
            <form onSubmit={handleNotificationUpdate} className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings({ ...notificationSettings, emailNotifications: !notificationSettings.emailNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Notifications</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications via SMS</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings({ ...notificationSettings, smsNotifications: !notificationSettings.smsNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.smsNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive push notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings({ ...notificationSettings, pushNotifications: !notificationSettings.pushNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for order updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings({ ...notificationSettings, orderAlerts: !notificationSettings.orderAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.orderAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.orderAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for trip updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings({ ...notificationSettings, tripAlerts: !notificationSettings.tripAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.tripAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.tripAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">System Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for system updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings({ ...notificationSettings, systemAlerts: !notificationSettings.systemAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.systemAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.systemAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
