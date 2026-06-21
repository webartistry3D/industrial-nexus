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
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'last_7_days' | 'last_30_days'>('last_7_days');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
  }, [user, dateFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.getMyTrips();
      const tripData = response.data || [];
      setTrips(tripData);
      
      // Calculate date range based on filter
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          startDate.setHours(23, 59, 59, 999);
          break;
        case 'last_7_days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last_30_days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
      }
      
      const endDate = dateFilter === 'yesterday' 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        : new Date();
      
      if (dateFilter === 'yesterday') {
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
      }
      
      // Filter trips based on date range
      const filteredTrips = tripData.filter((t: Trip) => {
        const completedAt = t.completedAt ? new Date(t.completedAt) : null;
        if (!completedAt) return false;
        
        if (dateFilter === 'today') {
          return completedAt.toDateString() === now.toDateString();
        } else if (dateFilter === 'yesterday') {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return completedAt.toDateString() === yesterday.toDateString();
        } else {
          return completedAt >= startDate && completedAt <= endDate;
        }
      });
      
      // Debug: Log active trips count
      const activeCount = tripData.filter((t: Trip) => t.status !== 'DELIVERED' && t.status !== 'CANCELLED').length;
      console.log('[Dashboard] Total trips:', tripData.length, 'Active trips:', activeCount, 'Filter:', dateFilter);
      
      // Count completed based on filter
      const completedCount = filteredTrips.length || 0;
      setThisWeekCompleted(completedCount);
      
      // Count completed today (always show today's count separately)
      const today = new Date().toDateString();
      const completedTodayCount = tripData.filter((t: Trip) => 
        t.status === 'DELIVERED' && 
        new Date(t.completedAt || '').toDateString() === today
      ).length || 0;
      setCompletedToday(completedTodayCount);

      // Count total completed
      const totalCompletedCount = tripData.filter((t: Trip) => t.status === 'DELIVERED').length || 0;
      setTotalCompleted(totalCompletedCount);

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
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <PageHeader />

      {/* Main Content */}
      <main className="pt-20 px-4 pb-4 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{user?.firstName || user?.email?.split('@')[0] || 'Driver'}</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
            Here's your performance overview for today
          </p>
        </div>

        {/* Top Row: Clock & Weather */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-center">
            <AnalogClock />
          </div>
          <WeatherWidget />
        </div>

        {/* Performance Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-5 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="font-bold text-sm sm:text-base">Performance</h2>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/50 px-2 sm:px-3 py-1 rounded-full border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl p-2 sm:p-3 text-center border border-blue-200/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/10">
              <div className="text-2xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono">{loading ? '...' : activeTrips.length}</div>
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-200 mt-1">Active</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 rounded-xl p-2 sm:p-3 text-center border border-green-200/50 dark:border-green-700/50 shadow-lg shadow-green-500/10">
              <div className="text-2xl sm:text-4xl font-bold text-green-600 dark:text-green-400 font-mono">{loading ? '...' : completedToday}</div>
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-200 mt-1">Today</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl p-2 sm:p-3 text-center border border-purple-200/50 dark:border-purple-700/50 shadow-lg shadow-purple-500/10">
              <div className="text-2xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 font-mono">{loading ? '...' : thisWeekCompleted}</div>
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-200 mt-1">{dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'last_7_days' ? '7 Days' : '30 Days'}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 dark:from-yellow-500/20 dark:to-yellow-600/10 rounded-xl p-2 sm:p-3 text-center border border-yellow-200/50 dark:border-yellow-700/50 shadow-lg shadow-yellow-500/10">
              <div className="text-2xl sm:text-4xl font-bold text-yellow-600 dark:text-yellow-400 font-mono">{loading ? '...' : totalCompleted}</div>
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-200 mt-1">Total</div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Average Time</span>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Efficiency Metric</div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-mono">
                {loading ? '...' : `${avgDeliveryTime}h`}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">per trip</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">On-Time Rate</span>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">SLA Compliance</div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-mono">
                {loading ? '...' : `${onTimeRate}%`}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">12h SLA</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/trips')}
            className="group bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-2xl p-5 flex flex-col items-center gap-3 active:opacity-80 transition-opacity duration-150 border border-blue-500/30 dark:border-blue-400/30"
          >
            <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold">View All Trips</span>
          </button>
          <button
            onClick={() => router.push('/tracking')}
            className="group bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 text-white rounded-2xl p-5 flex flex-col items-center gap-3 active:opacity-80 transition-opacity duration-150 border border-slate-500/30 dark:border-slate-600/30"
          >
            <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold">Live Tracking</span>
          </button>
        </div>

        {/* Performance Badge */}
        {!loading && totalCompleted > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {onTimeRate >= 90 ? 'Excellent Performance' : onTimeRate >= 70 ? 'Good Performance' : 'Needs Improvement'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {onTimeRate >= 90 ? 'You\'re meeting SLA targets' : onTimeRate >= 70 ? 'Keep up the good work' : 'Focus on timely deliveries'}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-bold font-mono ${onTimeRate >= 90 ? 'text-green-600 dark:text-green-400' : onTimeRate >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
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
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-gray-800 dark:text-white">Priority Trip</h2>
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">Highest Priority</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 rounded-2xl shadow-xl border-l-4 border-orange-400 dark:border-orange-500 p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg font-mono">{activeTrips[0].order?.orderNumber}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20">
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
                  <span className="text-blue-100 dark:text-blue-200 font-mono">{activeTrips[0].order?.cargoDescription} ({activeTrips[0].order?.totalWeight} kg)</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/trips/${activeTrips[0].id}`)}
                className="w-full bg-white dark:bg-blue-50 text-blue-600 dark:text-blue-700 py-3 rounded-xl text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-100 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {activeTrips[0].status === 'ASSIGNED' ? 'Start Trip' : 'Continue Trip'}
              </button>
            </div>
          </div>
        )}

        {/* Active Trips List */}
        {activeTrips.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Active Trips
              </h2>
              <button
                onClick={() => router.push('/trips')}
                className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-200/50 dark:divide-slate-700/50">
              {activeTrips.slice(0, 3).map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent dark:hover:from-blue-900/20 dark:hover:to-transparent border-l-4 border-blue-500 dark:border-blue-400 transition-all duration-200"
                  onClick={() => router.push(`/trips/${trip.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {trip.order?.deliveryLocation?.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                          {trip.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && activeTrips.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">No Active Trips</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You're all caught up! Great work today.</p>
            <button
              onClick={() => router.push('/trips')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity duration-150"
            >
              View History
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
