'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { RoleGuard } from '@/components/role-guard';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Save, Bell, Shield, Database, Globe, Clock, AlertTriangle, Users, Plus, Search, Filter, Edit, Trash2, UserCheck, UserX, Tag as TagIcon, X, Check, Eye, EyeOff, CreditCard, Receipt, DollarSign, Send } from 'lucide-react';
import { RateCard, Invoice } from '@/types';

interface SystemSettings {
  general: {
    companyName: string;
    timezone: string;
    dateFormat: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    orderAlerts: boolean;
    tripAlerts: boolean;
    driverAlerts: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    twoFactorAuth: boolean;
    ipWhitelist: string;
  };
  operations: {
    autoAssignDrivers: boolean;
    requireApproval: boolean;
    maxActiveTrips: number;
    weightValidation: boolean;
    geofenceAlerts: boolean;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'tags' | 'billing'>('general');
  
  // Settings state
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      companyName: 'Industrial Nexus',
      timezone: 'Africa/Lagos',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      orderAlerts: true,
      tripAlerts: true,
      driverAlerts: true,
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 30,
      twoFactorAuth: false,
      ipWhitelist: '',
    },
    operations: {
      autoAssignDrivers: false,
      requireApproval: true,
      maxActiveTrips: 10,
      weightValidation: true,
      geofenceAlerts: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'CLIENT',
    status: 'ACTIVE',
  });

  // Tags management state
  const [handlingTags, setHandlingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editedTagValue, setEditedTagValue] = useState('');
  const [tagsLoading, setTagsLoading] = useState(false);

  // Billing state
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showRateCardForm, setShowRateCardForm] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<RateCard | null>(null);
  const [rateCardForm, setRateCardForm] = useState<Record<string, any>>({
    name: '',
    baseRatePerKm: 0,
    baseRatePerKg: 0,
    minimumCharge: 0,
    priorityMultipliers: { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 },
    heavySurcharge: 0,
    fragileSurcharge: 0,
    hazardousSurcharge: 0,
    chemicalSurcharge: 0,
    temperatureSensitiveSurcharge: 0,
    verticalStorageSurcharge: 0,
    insuranceRatePercent: 0,
    vatPercent: 0,
  });
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'tags') {
      fetchHandlingTags();
    }
    if (activeTab === 'billing') {
      fetchBilling();
    }
  }, [activeTab, searchTerm, roleFilter, statusFilter, userPage, invoiceStatusFilter, invoicePage]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getSystemSettings();
      if (response.data) {
        setSettings(response.data);
      } else {
        console.log('Using default settings');
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError('Unable to load settings. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.getUsers({
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page: userPage,
        limit: userLimit,
      });
      setUsers(response.data || []);
      setUserTotalPages(response.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFilterChange = () => {
    setUserPage(1);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      handleFilterChange();
    }
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchHandlingTags = async () => {
    try {
      setTagsLoading(true);
      const response = await api.getAllHandlingTags();
      setHandlingTags(response.map((tag: any) => tag.name));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch handling tags');
    } finally {
      setTagsLoading(false);
    }
  };

  const fetchBilling = async () => {
    try {
      setBillingLoading(true);
      const [rateCardsResponse, invoicesResponse] = await Promise.all([
        api.getRateCards(),
        api.getInvoices({
          status: invoiceStatusFilter || undefined,
          page: invoicePage,
          limit: 10,
        }),
      ]);
      setRateCards(rateCardsResponse || []);
      setInvoices(invoicesResponse.data || []);
      setInvoiceTotalPages(invoicesResponse.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch billing data');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(userFormData);
      setShowCreateUserModal(false);
      setUserFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'CLIENT',
        status: 'ACTIVE',
      });
      fetchUsers();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, {
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        phoneNumber: userFormData.phoneNumber,
        role: userFormData.role,
        status: userFormData.status,
      });
      setShowEditUserModal(false);
      setSelectedUser(null);
      setUserFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'CLIENT',
        status: 'ACTIVE',
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(userId);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const openEditUserModal = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      status: user.status,
    });
    setShowEditUserModal(true);
  };

  // Tag management functions
  const handleAddTag = async () => {
    const trimmedTag = newTag.trim().toUpperCase();
    
    if (!trimmedTag) {
      setError('Tag name cannot be empty');
      return;
    }
    
    if (trimmedTag.length < 2) {
      setError('Tag name must be at least 2 characters');
      return;
    }
    
    if (!/^[A-Z0-9_]+$/.test(trimmedTag)) {
      setError('Tag name can only contain letters, numbers, and underscores');
      return;
    }
    
    if (handlingTags.includes(trimmedTag)) {
      setError(`Tag "${trimmedTag}" already exists`);
      return;
    }
    
    try {
      await api.createHandlingTag(trimmedTag);
      setNewTag('');
      await fetchHandlingTags();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create tag';
      setError(errorMessage);
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (confirm(`Are you sure you want to delete the tag "${tagToDelete}"?`)) {
      try {
        // Find the tag object with this name to get its ID
        const response = await api.getAllHandlingTags();
        const tagToDeleteObj = response.find((tag: any) => tag.name === tagToDelete);
        if (tagToDeleteObj) {
          await api.deleteHandlingTag(tagToDeleteObj.id);
          await fetchHandlingTags();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete tag');
      }
    }
  };

  const handleStartEditTag = (tag: string) => {
    setEditingTag(tag);
    setEditedTagValue(tag);
  };

  const handleSaveEditTag = async () => {
    const trimmedValue = editedTagValue.trim().toUpperCase();
    if (trimmedValue && trimmedValue !== editingTag && !handlingTags.includes(trimmedValue)) {
      try {
        const response = await api.getAllHandlingTags();
        const tagToEdit = response.find((tag: any) => tag.name === editingTag);
        if (tagToEdit) {
          await api.updateHandlingTag(tagToEdit.id, trimmedValue);
          setEditingTag(null);
          setEditedTagValue('');
          await fetchHandlingTags();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update tag');
      }
    }
  };

  const handleCancelEditTag = () => {
    setEditingTag(null);
    setEditedTagValue('');
  };

  const handleCreateRateCard = async () => {
    try {
      await api.createRateCard(rateCardForm);
      setShowRateCardForm(false);
      resetRateCardForm();
      await fetchBilling();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create rate card');
    }
  };

  const handleUpdateRateCard = async () => {
    if (!editingRateCard) return;
    try {
      await api.updateRateCard(editingRateCard.id, rateCardForm);
      setEditingRateCard(null);
      resetRateCardForm();
      setShowRateCardForm(false);
      await fetchBilling();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update rate card');
    }
  };

  const handleActivateRateCard = async (id: string) => {
    if (!confirm('Activate this rate card? The current active rate card will be deactivated.')) return;
    try {
      await api.activateRateCard(id);
      await fetchBilling();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to activate rate card');
    }
  };

  const handleIssueInvoice = async (id: string) => {
    try {
      await api.issueInvoice(id);
      await fetchBilling();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to issue invoice');
    }
  };

  const handleMarkInvoicePaid = async (id: string) => {
    try {
      await api.markInvoicePaid(id);
      await fetchBilling();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to mark invoice as paid');
    }
  };

  const handleVoidInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to void this invoice?')) return;
    try {
      await api.voidInvoice(id);
      await fetchBilling();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to void invoice');
    }
  };

  const resetRateCardForm = () => {
    setRateCardForm({
      name: '',
      baseRatePerKm: 0,
      baseRatePerKg: 0,
      minimumCharge: 0,
      priorityMultipliers: { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 },
      heavySurcharge: 0,
      fragileSurcharge: 0,
      hazardousSurcharge: 0,
      chemicalSurcharge: 0,
      temperatureSensitiveSurcharge: 0,
      verticalStorageSurcharge: 0,
      insuranceRatePercent: 0,
      vatPercent: 0,
    });
  };

  const startEditRateCard = (rateCard: RateCard) => {
    setEditingRateCard(rateCard);
    setRateCardForm({
      name: rateCard.name,
      baseRatePerKm: rateCard.baseRatePerKm,
      baseRatePerKg: rateCard.baseRatePerKg,
      minimumCharge: rateCard.minimumCharge,
      priorityMultipliers: rateCard.priorityMultipliers,
      heavySurcharge: rateCard.heavySurcharge,
      fragileSurcharge: rateCard.fragileSurcharge,
      hazardousSurcharge: rateCard.hazardousSurcharge,
      chemicalSurcharge: rateCard.chemicalSurcharge,
      temperatureSensitiveSurcharge: rateCard.temperatureSensitiveSurcharge,
      verticalStorageSurcharge: rateCard.verticalStorageSurcharge,
      insuranceRatePercent: rateCard.insuranceRatePercent,
      vatPercent: rateCard.vatPercent,
    });
    setShowRateCardForm(true);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.updateMultipleSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSectionSave = async (section: keyof SystemSettings) => {
    try {
      setSaving(true);
      setError(null);
      await api.updateMultipleSettings({ [section]: settings[section] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard userRole={user?.role}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="animate-pulse text-blue-600 font-semibold">Loading settings...</div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard userRole={user?.role}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure system settings and manage users
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto md:overflow-x-visible -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'general'
                  ? 'bg-blue-900 dark:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'users'
                  ? 'bg-blue-900 dark:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'tags'
                  ? 'bg-blue-900 dark:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Tags Management
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'billing'
                  ? 'bg-blue-900 dark:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Billing
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-4 mt-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 text-green-800 dark:text-green-300">
            Settings saved successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'general' ? (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* General Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Basic system configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.general.companyName}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, companyName: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Africa/Abuja">Africa/Abuja</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                <select
                  value={settings.general.dateFormat}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, dateFormat: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                <select
                  value={settings.general.language}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, language: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          {/*}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure system notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive email notifications</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: !settings.notifications.emailNotifications }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Notifications</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive SMS notifications</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, smsNotifications: !settings.notifications.smsNotifications }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.smsNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive push notifications</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushNotifications: !settings.notifications.pushNotifications }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for new orders</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, orderAlerts: !settings.notifications.orderAlerts }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.orderAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.orderAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for trip updates</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, tripAlerts: !settings.notifications.tripAlerts }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.tripAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.tripAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Driver Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alerts for driver status</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, driverAlerts: !settings.notifications.driverAlerts }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.driverAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.driverAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          */}

          {/* Security Settings */}
          {/*}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure security policies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Password Length</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  placeholder="8"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
                  })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  placeholder="30"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                  })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IP Whitelist (comma-separated)</label>
                <input
                  type="text"
                  value={settings.security.ipWhitelist}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, ipWhitelist: e.target.value }
                  })}
                  placeholder="192.168.1.1, 10.0.0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Two-Factor Authentication</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require 2FA for all users</p>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  security: { ...settings.security, twoFactorAuth: !settings.security.twoFactorAuth }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.security.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          */}

          {/* Operations Settings */}
          {/*}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Operations Settings</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure operational parameters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Active Trips</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="10"
                  value={settings.operations.maxActiveTrips}
                  onChange={(e) => setSettings({
                    ...settings,
                    operations: { ...settings.operations, maxActiveTrips: parseInt(e.target.value) }
                  })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Assign Drivers</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically assign drivers to trips</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    operations: { ...settings.operations, autoAssignDrivers: !settings.operations.autoAssignDrivers }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.operations.autoAssignDrivers ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.operations.autoAssignDrivers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Approval</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Require approval for new orders</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    operations: { ...settings.operations, requireApproval: !settings.operations.requireApproval }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.operations.requireApproval ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.operations.requireApproval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Weight Validation</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable weight limit validation</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    operations: { ...settings.operations, weightValidation: !settings.operations.weightValidation }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.operations.weightValidation ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.operations.weightValidation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Geofence Alerts</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable geofence violation alerts</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    operations: { ...settings.operations, geofenceAlerts: !settings.operations.geofenceAlerts }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.operations.geofenceAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.operations.geofenceAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          */}

          {/* Warning Section */}
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Important Notice</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Changes to system settings may affect all users and operational processes. Review changes carefully before saving.
                </p>
              </div>
            </div>
          </div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage system users and permissions</p>
                </div>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="bg-blue-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  User
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="CLIENT">Client</option>
                  <option value="DRIVER">Driver</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Users List */}
              {usersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-pulse text-blue-600 font-semibold">Loading users...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No users found</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {users.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => {
                            // Store user data in localStorage for the detail page
                            localStorage.setItem('selectedUser', JSON.stringify(user));
                            router.push(`/users/${user.id}`);
                          }}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                              {user.phoneNumber && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.phoneNumber}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                              <Shield className="w-3 h-3 mr-1" />
                              {formatStatus(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status === 'ACTIVE' ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                              {formatStatus(user.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditUserModal(user);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!usersLoading && userTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Page {userPage} of {userTotalPages}
                    </span>
                    <button
                      onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                      disabled={userPage === userTotalPages}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'tags' ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <TagIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Handling Tags Management</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure cargo handling tags for orders</p>
                </div>
              </div>

              {/* Add New Tag */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add New Tag</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter tag name (e.g., FRAGILE)"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    className="bg-blue-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Tags List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Tags</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {handlingTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600"
                    >
                      {editingTag === tag ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editedTagValue}
                            onChange={(e) => setEditedTagValue(e.target.value)}
                            className="flex-1 px-2 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm min-h-[40px]"
                          />
                          <button
                            onClick={handleSaveEditTag}
                            className="text-green-600 hover:text-green-700 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEditTag}
                            className="text-red-600 hover:text-red-700 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{tag}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditTag(tag)}
                              className="text-blue-600 hover:text-blue-700 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag)}
                              className="text-red-600 hover:text-red-700 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Section */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Tag Information</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Handling tags are used to classify cargo requirements. These tags appear on order creation forms and help operations teams identify special handling requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'billing' ? (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Rate Cards Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Cards</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage pricing rules and surcharges</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingRateCard(null);
                    resetRateCardForm();
                    setShowRateCardForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-800 hover:to-blue-800 text-white rounded-lg text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Rate Card
                </button>
              </div>

              {billingLoading && rateCards.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading rate cards...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Base Rate/km</th>
                        <th className="px-3 py-2 text-left">Base Rate/kg</th>
                        <th className="px-3 py-2 text-left">Min Charge</th>
                        <th className="px-3 py-2 text-left">VAT</th>
                        <th className="px-3 py-2 text-left">Insurance</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {rateCards.map((rateCard) => (
                        <tr key={rateCard.id}>
                          <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">{rateCard.name}</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400">₦{rateCard.baseRatePerKm}</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400">₦{rateCard.baseRatePerKg}</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400">₦{rateCard.minimumCharge.toLocaleString()}</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{(rateCard.vatPercent * 100).toFixed(1)}%</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{(rateCard.insuranceRatePercent * 100).toFixed(1)}%</td>
                          <td className="px-3 py-3">
                            {rateCard.isActive ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">Active</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">Inactive</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!rateCard.isActive && (
                                <button
                                  onClick={() => handleActivateRateCard(rateCard.id)}
                                  className="text-green-600 hover:text-green-700 p-1"
                                  title="Activate"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => startEditRateCard(rateCard)}
                                disabled={rateCard.isActive}
                                className="text-blue-600 hover:text-blue-700 p-1 disabled:opacity-40"
                                title={rateCard.isActive ? 'Deactivate to edit' : 'Edit'}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Invoices Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoices</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage issued invoices</p>
                  </div>
                </div>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => { setInvoiceStatusFilter(e.target.value); setInvoicePage(1); }}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ISSUED">Issued</option>
                  <option value="PAID">Paid</option>
                  <option value="VOID">Void</option>
                </select>
              </div>

              {billingLoading && invoices.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoices...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-3 py-2 text-left">Invoice #</th>
                        <th className="px-3 py-2 text-left">Order #</th>
                        <th className="px-3 py-2 text-left">Client</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-3 py-3 font-medium text-gray-900 dark:text-white font-mono">{invoice.invoiceNumber}</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400 font-mono">{invoice.order?.orderNumber || invoice.orderId}</td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                            {invoice.order?.client ? `${invoice.order.client.firstName} ${invoice.order.client.lastName}` : 'N/A'}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'PAID'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : invoice.status === 'ISSUED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : invoice.status === 'VOID'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {formatStatus(invoice.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-gray-900 dark:text-white font-mono">₦{invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {invoice.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleIssueInvoice(invoice.id)}
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                  title="Issue"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              {invoice.status === 'ISSUED' && (
                                <button
                                  onClick={() => handleMarkInvoicePaid(invoice.id)}
                                  className="text-green-600 hover:text-green-700 p-1"
                                  title="Mark Paid"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                              {(invoice.status === 'DRAFT' || invoice.status === 'ISSUED') && (
                                <button
                                  onClick={() => handleVoidInvoice(invoice.id)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                  title="Void"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {invoiceTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                    disabled={invoicePage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page {invoicePage} of {invoiceTotalPages}</span>
                  <button
                    onClick={() => setInvoicePage(p => Math.min(invoiceTotalPages, p + 1))}
                    disabled={invoicePage === invoiceTotalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateUserModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+2348012345678"
                      value={userFormData.phoneNumber}
                      onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={userFormData.firstName}
                      onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={userFormData.lastName}
                      onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                    <select
                      required
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="OPERATIONS">Operations</option>
                      <option value="CLIENT">Client</option>
                      <option value="DRIVER">Driver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <select
                      required
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditUserModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit User</h2>
              <form onSubmit={handleUpdateUser} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={userFormData.firstName}
                      onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={userFormData.lastName}
                      onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={userFormData.phoneNumber}
                    onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                    <select
                      required
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="OPERATIONS">Operations</option>
                      <option value="CLIENT">Client</option>
                      <option value="DRIVER">Driver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <select
                      required
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rate Card Modal */}
        {showRateCardForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRateCardForm(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-4 max-h-[75vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingRateCard ? 'Edit Rate Card' : 'Add Rate Card'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={rateCardForm.name}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Rate/km (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    value={rateCardForm.baseRatePerKm || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, baseRatePerKm: parseFloat(e.target.value) || 0 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Rate/kg (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20"
                    value={rateCardForm.baseRatePerKg || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, baseRatePerKg: parseFloat(e.target.value) || 0 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Charge (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1000"
                    value={rateCardForm.minimumCharge || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, minimumCharge: parseFloat(e.target.value) || 0 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VAT %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="7.5"
                    value={(rateCardForm.vatPercent * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, vatPercent: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="1"
                    value={(rateCardForm.insuranceRatePercent * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, insuranceRatePercent: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heavy Surcharge %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="10"
                    value={(rateCardForm.heavySurcharge * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, heavySurcharge: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fragile Surcharge %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="5"
                    value={(rateCardForm.fragileSurcharge * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, fragileSurcharge: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hazardous Surcharge %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="15"
                    value={(rateCardForm.hazardousSurcharge * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, hazardousSurcharge: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chemical Surcharge %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="8"
                    value={(rateCardForm.chemicalSurcharge * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, chemicalSurcharge: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature Surcharge %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="5"
                    value={(rateCardForm.temperatureSensitiveSurcharge * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, temperatureSensitiveSurcharge: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vertical Storage Surcharge %</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="5"
                    value={(rateCardForm.verticalStorageSurcharge * 100) || ''}
                    onChange={(e) => setRateCardForm({ ...rateCardForm, verticalStorageSurcharge: (parseFloat(e.target.value) || 0) / 100 })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority Multipliers</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((key) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{key}</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="1"
                          value={rateCardForm.priorityMultipliers[key] || ''}
                          onChange={(e) => setRateCardForm({
                            ...rateCardForm,
                            priorityMultipliers: {
                              ...rateCardForm.priorityMultipliers,
                              [key]: parseFloat(e.target.value) || 0,
                            },
                          })}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowRateCardForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRateCard ? handleUpdateRateCard : handleCreateRateCard}
                  className="flex-1 px-4 py-2 bg-blue-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingRateCard ? 'Update Rate Card' : 'Create Rate Card'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
