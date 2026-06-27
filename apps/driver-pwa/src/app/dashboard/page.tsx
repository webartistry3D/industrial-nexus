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
import { StatCard } from '@/components/stat-card';

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
      <main className="pt-20 px-4 pb-4 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-lime-500 dark:bg-none">{user?.firstName || user?.email?.split('@')[0] || 'Driver'}</span>
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
              <div className="p-2 rounded-xl bg-blue-900">
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
            <StatCard icon={Truck} label="Active" value={loading ? '...' : activeTrips.length.toString()} color="blue" />
            <StatCard icon={CheckCircle} label="Today" value={loading ? '...' : completedToday.toString()} color="green" />
            <StatCard icon={TrendingUp} label={dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'last_7_days' ? '7 Days' : '30 Days'} value={loading ? '...' : thisWeekCompleted.toString()} color="purple" />
            <StatCard icon={Award} label="Total" value={loading ? '...' : totalCompleted.toString()} color="yellow" />
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-900">
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
              <div className="p-2 sm:p-2.5 rounded-xl bg-green-500">
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
            className="bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-2xl p-5 flex flex-col items-center gap-3 active:bg-gray-50 dark:active:bg-slate-700 border border-gray-200 dark:border-slate-700"
          >
            <div className="p-2 bg-blue-500 rounded-xl text-white">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold">View All Trips</span>
          </button>
          <button
            onClick={() => router.push('/tracking')}
            className="bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-2xl p-5 flex flex-col items-center gap-3 active:bg-gray-50 dark:active:bg-slate-700 border border-gray-200 dark:border-slate-700"
          >
            <div className="p-2 bg-slate-500 rounded-xl text-white">
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
                <div className="p-1.5 rounded-lg bg-blue-600 text-white dark:bg-lime-500 dark:text-black">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-gray-800 dark:text-white">Priority Trip</h2>
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">Highest Priority</div>
            </div>

            <div className="bg-blue-600 dark:bg-blue-800 rounded-2xl shadow-sm border-l-4 border-lime-500 p-5 text-white">
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
                className="w-full bg-white dark:bg-blue-50 text-blue-900 dark:text-blue-700 py-3 rounded-xl text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-100"
              >
                {activeTrips[0].status === 'ASSIGNED' ? 'Start Trip' : 'Continue Trip'}
              </button>
            </div>
          </div>
        )}

        {/* Active Trips List */}
        {activeTrips.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                Active Trips
              </h2>
              <button
                onClick={() => router.push('/trips')}
                className="text-blue-500 dark:text-blue-800 text-sm font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {activeTrips.slice(0, 3).map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 border-l-4 border-blue-500 dark:border-blue-400"
                  onClick={() => router.push(`/trips/${trip.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-900">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{trip.order?.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {trip.order?.cargoDescription}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
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
            <div className="p-4 bg-blue-900 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">No Active Trips</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You're all caught up! Great work today.</p>
            <button
              onClick={() => router.push('/trips')}
              className="bg-blue-900 text-white px-6 py-2 rounded-xl text-sm font-semibold active:bg-blue-900"
            >
              View History
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
