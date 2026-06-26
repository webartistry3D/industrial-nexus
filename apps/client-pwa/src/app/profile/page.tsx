'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { User as UserIcon, Mail, Phone, Edit, Save, LogOut, Shield, Bell, Camera } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProfile();
      setProfile(data);
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || '',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const updated = await api.updateMyProfile(formData);
      setProfile(prev => prev ? { ...prev, ...updated } : null);
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
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
      const updated = await api.uploadProfileImage(file);
      console.log('[Avatar] Upload response:', JSON.stringify(updated));
      console.log('[Avatar] profileImageUrl from response:', updated.profileImageUrl);
      setProfile(prev => prev ? { ...prev, profileImageUrl: updated.profileImageUrl } : null);
      setSuccess('Profile image updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('[Avatar] Upload error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const getAvatarUrl = () => {
    if (profile?.profileImageUrl) {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const fullUrl = profile.profileImageUrl.startsWith('http') ? profile.profileImageUrl : `${base}${profile.profileImageUrl}`;
      console.log('[Avatar] Resolved URL:', fullUrl);
      return fullUrl;
    }
    return null;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-900 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 pb-24">
      <main className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-800 dark:to-blue-800 rounded-2xl p-6 text-white shadow-lg border border-white/10">
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
            <div>
              <h1 className="text-2xl font-bold">{profile?.firstName} {profile?.lastName}</h1>
              <p className="text-blue-100 dark:text-slate-300">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-4 text-red-800 dark:text-red-300 shadow-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border border-green-200/50 dark:border-green-700/50 rounded-2xl p-4 text-green-800 dark:text-green-300 shadow-lg">
            {success}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
          <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-900 dark:bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
                  <Mail className="w-5 h-5 text-white mt-0.5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{profile?.email}</p>
                </div>
              </div>
              {profile?.phoneNumber && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                    <Phone className="w-5 h-5 text-white mt-0.5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white font-mono">{profile.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50">
          <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Settings</h2>
          </div>
          <div className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
            <button className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-all duration-300">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-900 shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium">Security</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Change password and security settings</p>
              </div>
            </button>
            <button className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-all duration-300">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium">Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage notification preferences</p>
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </main>
    </div>
  );
}
