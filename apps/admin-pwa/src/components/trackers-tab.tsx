'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatStatus } from '@/lib/formatting';
import { PackageTracker } from '@/types';
import { 
  Navigation, Plus, Search, Trash2, Edit2, Battery, 
  Activity, MapPin, XCircle, CheckCircle2, Crosshair, List, Grid2x2
} from 'lucide-react';

export function TrackersTab() {
  const [trackers, setTrackers] = useState<PackageTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTracker, setNewTracker] = useState({ deviceId: '', name: '' });
  const [editingTracker, setEditingTracker] = useState<PackageTracker | null>(null);
  const [locationTracker, setLocationTracker] = useState<PackageTracker | null>(null);
  const [locationForm, setLocationForm] = useState({ lat: '', lng: '', accuracy: '5' });
  const [formData, setFormData] = useState({ name: '', status: 'ACTIVE', batteryLevel: 100 });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    fetchTrackers();
  }, [page]);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPackageTrackers({ page, limit: 10 });
      setTrackers(response.data || response);
      if (response.meta) {
        setMeta(response.meta);
      } else {
        setMeta({ page, limit: 10, total: response.length || 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch trackers:', err);
      setError('Failed to load package trackers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPackageTracker(newTracker);
      setNewTracker({ deviceId: '', name: '' });
      setShowCreateModal(false);
      await fetchTrackers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tracker');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTracker) return;
    try {
      await api.updatePackageTracker(editingTracker.id, {
        name: formData.name,
        status: formData.status,
        batteryLevel: Number(formData.batteryLevel),
      });
      setEditingTracker(null);
      await fetchTrackers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tracker');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    try {
      await api.deletePackageTracker(id);
      await fetchTrackers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete tracker');
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationTracker) return;
    try {
      await api.updatePackageLocation(
        locationTracker.id,
        Number(locationForm.lat),
        Number(locationForm.lng),
        Number(locationForm.accuracy),
      );
      setLocationTracker(null);
      setLocationForm({ lat: '', lng: '', accuracy: '5' });
      await fetchTrackers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update location');
    }
  };

  const openLocationModal = (tracker: PackageTracker) => {
    setLocationTracker(tracker);
    setLocationForm({
      lat: tracker.lastLat ? String(tracker.lastLat) : '',
      lng: tracker.lastLng ? String(tracker.lastLng) : '',
      accuracy: '5',
    });
  };

  const openEditModal = (tracker: PackageTracker) => {
    setEditingTracker(tracker);
    setFormData({
      name: tracker.name || '',
      status: tracker.status,
      batteryLevel: tracker.batteryLevel || 100,
    });
  };

  const filteredTrackers = trackers.filter((tracker) => {
    const query = searchQuery.toLowerCase();
    return (
      tracker.deviceId.toLowerCase().includes(query) ||
      (tracker.name?.toLowerCase() || '').includes(query) ||
      tracker.status.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'LOST': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'BROKEN': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search trackers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 text-sm transition-all"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Tracker
        </button>
        {/* View Toggle Buttons */}
        <div className="hidden sm:block w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-600 dark:to-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
            }`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-600 dark:to-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
            }`}
            aria-label="Grid view"
          >
            <Grid2x2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 justify-center sm:hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-600 dark:to-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
            }`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`w-12 p-2.5 rounded-xl transition-all duration-300 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-blue-900 to-blue-900 dark:from-blue-600 dark:to-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-slate-700/50'
            }`}
            aria-label="Grid view"
          >
            <Grid2x2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Trackers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredTrackers.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-8 text-center">
          <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No package trackers found</p>
        </div>
      ) : viewMode === 'list' ? (
        // Table View
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-200/50 dark:border-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Device ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Battery</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
              {filteredTrackers.map((tracker) => (
                <tr key={tracker.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono text-gray-900 dark:text-white">{tracker.deviceId}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900 dark:text-white">{tracker.name || '-'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tracker.status)}`}>
                      {formatStatus(tracker.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono text-gray-900 dark:text-white">{tracker.batteryLevel ? `${tracker.batteryLevel}%` : 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono text-gray-600 dark:text-gray-400">{tracker.lastSeenAt ? new Date(tracker.lastSeenAt).toLocaleString() : 'Never'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono text-gray-600 dark:text-gray-400">
                      {tracker.lastLat ? `${tracker.lastLat.toFixed(4)}, ${tracker.lastLng?.toFixed(4)}` : 'N/A'}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openLocationModal(tracker)}
                        className="p-2 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Update Location"
                      >
                        <Crosshair className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(tracker)}
                        className="p-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tracker.id)}
                        className="p-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
      ) : (
        // Grid View (Cards)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrackers.map((tracker) => (
            <div
              key={tracker.id}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-5 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tracker.name || tracker.deviceId}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {tracker.deviceId}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tracker.status)}`}>
                  {formatStatus(tracker.status)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Battery className="w-4 h-4" /> Battery
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white font-mono">
                    {tracker.batteryLevel ? `${tracker.batteryLevel}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Activity className="w-4 h-4" /> Last Seen
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white font-mono">
                    {tracker.lastSeenAt ? new Date(tracker.lastSeenAt).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Location</span>
                  <span className="font-medium text-gray-900 dark:text-white font-mono">
                    {tracker.lastLat ? `${tracker.lastLat.toFixed(4)}, ${tracker.lastLng?.toFixed(4)}` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openLocationModal(tracker)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                >
                  <Crosshair className="w-4 h-4" />
                  Location
                </button>
                <button
                  onClick={() => openEditModal(tracker)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tracker.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredTrackers.length > 0 && (
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Page {page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Package Tracker</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device ID</label>
                <input
                  type="text"
                  value={newTracker.deviceId}
                  onChange={(e) => setNewTracker({ ...newTracker, deviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., PT-001-IMEI"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={newTracker.name}
                  onChange={(e) => setNewTracker({ ...newTracker, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Tracker A"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTracker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Tracker</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LOST">Lost</option>
                  <option value="BROKEN">Broken</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Battery Level (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryLevel}
                  onChange={(e) => setFormData({ ...formData, batteryLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTracker(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Location Modal */}
      {locationTracker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-blue-600" />
              Update Location
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set GPS coordinates for <span className="font-mono font-medium">{locationTracker.deviceId}</span>
            </p>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={locationForm.lat}
                    onChange={(e) => setLocationForm({ ...locationForm, lat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    placeholder="6.5244"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={locationForm.lng}
                    onChange={(e) => setLocationForm({ ...locationForm, lng: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    placeholder="3.3792"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accuracy (meters)</label>
                <input
                  type="number"
                  step="any"
                  value={locationForm.accuracy}
                  onChange={(e) => setLocationForm({ ...locationForm, accuracy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLocationTracker(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
