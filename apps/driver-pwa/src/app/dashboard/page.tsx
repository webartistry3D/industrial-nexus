'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import { Activity, Award, AlertCircle, CheckCircle, Clock, MapPin, Package, TrendingUp, Truck, Wifi, WifiOff } from 'lucide-react';
import AnalogClock from '@/components/AnalogClock';
import WeatherWidget from '@/components/WeatherWidget';
import { PageHeader } from '@/components/PageHeader';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { pendingCount, isOnline } = useOfflineQueue();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [avgDeliveryTime, setAvgDeliveryTime] = useState(0);
  const [thisWeekCompleted, setThisWeekCompleted] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      const tripData = response.data || [];
      setTrips(tripData);
      
      // Count completed today
      const today = new Date().toDateString();
      const completedTodayCount = tripData.filter((t: Trip) => 
        t.status === 'DELIVERED' && 
        new Date(t.completedAt || '').toDateString() === today
      ).length || 0;
      setCompletedToday(completedTodayCount);

      // Count total completed
      const totalCompletedCount = tripData.filter((t: Trip) => t.status === 'DELIVERED').length || 0;
      setTotalCompleted(totalCompletedCount);

      // Calculate this week's completions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekCount = tripData.filter((t: Trip) => 
        t.status === 'DELIVERED' && 
        new Date(t.completedAt || '') >= weekAgo
      ).length || 0;
      setThisWeekCompleted(thisWeekCount);

      // Calculate average delivery time (in hours)
      const completedTrips = tripData.filter((t: Trip) => 
        t.status === 'DELIVERED' && t.startedAt && t.completedAt
      );
      if (completedTrips.length > 0) {
        const totalTime = completedTrips.reduce((sum, trip) => {
          const start = new Date(trip.startedAt || '').getTime();
          const end = new Date(trip.completedAt || '').getTime();
          return sum + (end - start);
        }, 0);
        const avgMs = totalTime / completedTrips.length;
        setAvgDeliveryTime(Math.round(avgMs / (1000 * 60 * 60) * 10) / 10);
      }

      // Calculate on-time delivery rate (assuming 12 hours SLA)
      const onTimeTrips = completedTrips.filter((t: Trip) => {
        const start = new Date(t.startedAt || '').getTime();
        const end = new Date(t.completedAt || '').getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        return hours <= 12;
      }).length;
      setOnTimeRate(completedTrips.length > 0 ? Math.round((onTimeTrips / completedTrips.length) * 100) : 0);
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

  const activeTrips = trips.filter(t => t.status !== 'DELIVERED' && t.status !== 'CANCELLED');

  return (
    <div className="min-h-screen pb-24 bg-gray-50 dark:bg-slate-900">
      <PageHeader showOnlineStatus={true} isOnline={isOnline} pendingCount={pendingCount} />

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Top Row: Clock & Weather */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center">
            <AnalogClock />
          </div>
          <WeatherWidget />
        </div>

        {/* Performance Overview */}
        <div className="bg-white dark:bg-gradient-to-r dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold">Performance Overview</h2>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-300">Last 7 Days</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg p-3 text-center border border-gray-200 dark:border-slate-600">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{loading ? '...' : activeTrips.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-200">Active</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg p-3 text-center border border-gray-200 dark:border-slate-600">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{loading ? '...' : completedToday}</div>
              <div className="text-xs text-gray-600 dark:text-gray-200">Today</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg p-3 text-center border border-gray-200 dark:border-slate-600">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{loading ? '...' : thisWeekCompleted}</div>
              <div className="text-xs text-gray-600 dark:text-gray-200">This Week</div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg p-3 text-center border border-gray-200 dark:border-slate-600">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{loading ? '...' : totalCompleted}</div>
              <div className="text-xs text-gray-600 dark:text-gray-200">Total</div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg. Delivery Time</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency Metric</div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : `${avgDeliveryTime}h`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">per trip</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">On-Time Rate</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">SLA Compliance</div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : `${onTimeRate}%`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">12h SLA</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/trips')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-lg p-4 flex flex-col items-center gap-2 active:from-blue-700 active:to-blue-800 dark:active:from-blue-800 dark:active:to-blue-900 shadow-lg border border-blue-500/30 dark:border-blue-400/30"
          >
            <Truck className="w-6 h-6" />
            <span className="text-sm font-semibold">View All Trips</span>
          </button>
          <button
            onClick={() => router.push('/tracking')}
            className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 text-white rounded-lg p-4 flex flex-col items-center gap-2 active:from-slate-700 active:to-slate-800 dark:active:from-slate-800 dark:active:to-slate-900 shadow-lg border border-slate-500/30 dark:border-slate-600/30"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-sm font-semibold">Live Tracking</span>
          </button>
        </div>

        {/* Performance Badge */}
        {!loading && totalCompleted > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${onTimeRate >= 90 ? 'bg-green-100 dark:bg-green-900/50' : onTimeRate >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                  <Award className={`w-6 h-6 ${onTimeRate >= 90 ? 'text-green-600 dark:text-green-400' : onTimeRate >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {onTimeRate >= 90 ? 'Excellent Performance' : onTimeRate >= 70 ? 'Good Performance' : 'Needs Improvement'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {onTimeRate >= 90 ? 'You\'re meeting SLA targets' : onTimeRate >= 70 ? 'Keep up the good work' : 'Focus on timely deliveries'}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-bold ${onTimeRate >= 90 ? 'text-green-600 dark:text-green-400' : onTimeRate >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {onTimeRate}%
              </div>
            </div>
          </div>
        )}

        {/* Priority Trip - Show only the most urgent/first active trip */}
        {activeTrips.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <h2 className="font-bold text-gray-800 dark:text-white">Priority Trip</h2>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Highest Priority</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 rounded-lg shadow-xl border-l-4 border-orange-400 dark:border-orange-500 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">{activeTrips[0].order?.orderNumber}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20`}>
                  {activeTrips[0].status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-200 dark:text-blue-300 mt-0.5" />
                  <div>
                    <p className="text-blue-100 dark:text-blue-200">From: {activeTrips[0].order?.pickupLocation?.address}</p>
                    <p className="text-blue-100 dark:text-blue-200">To: {activeTrips[0].order?.deliveryLocation?.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-200 dark:text-blue-300" />
                  <span className="text-blue-100 dark:text-blue-200">{activeTrips[0].order?.cargoDescription} ({activeTrips[0].order?.totalWeight} kg)</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/trips/${activeTrips[0].id}`)}
                className="w-full bg-white dark:bg-blue-50 text-blue-600 dark:text-blue-700 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-100 transition-colors shadow-md"
              >
                {activeTrips[0].status === 'ASSIGNED' ? 'Start Trip' : 'Continue Trip'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Summary - Show other active trips count */}
        {activeTrips.length > 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {activeTrips.length - 1} more active trip{activeTrips.length - 1 > 1 ? 's' : ''}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">In your queue</div>
                </div>
              </div>
              <button
                onClick={() => router.push('/trips')}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && activeTrips.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Truck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">No Active Trips</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You're all caught up! Great work today.</p>
            <button
              onClick={() => router.push('/trips')}
              className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              View History
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
