'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { Truck, Package, MapPin, CheckCircle, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { pendingCount, isOnline } = useOfflineQueue();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.getMyTrips();
      setTrips(response.data || []);
      
      // Count completed today
      const today = new Date().toDateString();
      const completed = response.data?.filter((t: Trip) => 
        t.status === 'DELIVERED' && 
        new Date(t.completedAt || '').toDateString() === today
      ).length || 0;
      setCompletedToday(completed);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_TRANSIT: 'bg-orange-100 text-orange-800',
      ARRIVED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6" />
            <h1 className="text-lg font-semibold text-white">Driver Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : trips.filter(t => t.status !== 'DELIVERED').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Trips</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : completedToday}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed Today</div>
          </div>
        </div>

        {/* Active Trips */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Active Trips</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="dark:text-gray-400">No trips assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.filter(t => t.status !== 'DELIVERED').map((trip) => (
                <div key={trip.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900 dark:text-white">{trip.order?.orderNumber}</span>
                    <span className={`status-badge ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">From: {trip.order?.pickupLocation?.address}</p>
                        <p className="text-gray-600 dark:text-gray-400">To: {trip.order?.deliveryLocation?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{trip.order?.cargoDescription} ({trip.order?.totalWeight} kg)</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      className="flex-1 btn-primary text-center text-sm"
                    >
                      {trip.status === 'ASSIGNED' ? 'Start Trip' : 'Continue'}
                    </button>
                    <button className="btn-secondary text-sm">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 p-2 text-blue-600">
            <Truck className="w-5 h-5" />
            <span className="text-xs font-medium">Trips</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-gray-500 dark:text-gray-400">
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-medium">Tracking</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-medium">POD</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
