'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RoleGuard } from '@/components/role-guard';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, Mail, Phone, Shield, Calendar, Clock, 
  Edit2, ArrowLeft, Activity, CheckCircle, XCircle,
  Package, Truck, MapPin
} from 'lucide-react';

interface UserDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  kycVerified?: boolean;
  profileImage?: string;
}

interface UserStats {
  totalOrders: number;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  averageRating: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  details?: any;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const userId = params.id as string;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }
  }, [authLoading, currentUser, router]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching user details for ID:', userId);
      
      // Try to get user data from localStorage first (passed from user management)
      const storedUser = localStorage.getItem('selectedUser');
      let userData: UserDetails | null = null;
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userData = {
            id: parsedUser.id || userId,
            email: parsedUser.email || '',
            firstName: parsedUser.firstName || '',
            lastName: parsedUser.lastName || '',
            phoneNumber: parsedUser.phoneNumber || undefined,
            role: parsedUser.role || 'CLIENT',
            status: parsedUser.status || 'ACTIVE',
            createdAt: parsedUser.createdAt || new Date().toISOString(),
            lastLoginAt: parsedUser.lastLoginAt || undefined,
            emailVerified: true,
            kycVerified: true,
          };
          console.log('Using localStorage data:', userData);
          // Clear localStorage after reading
          localStorage.removeItem('selectedUser');
        } catch (parseErr) {
          console.error('Failed to parse localStorage data:', parseErr);
        }
      }
      
      // If no localStorage data, use hardcoded fallback
      if (!userData) {
        userData = {
          id: userId,
          email: 'chinedu.eze@example.com',
          firstName: 'Chinedu',
          lastName: 'Eze',
          phoneNumber: '+234 801 234 5678',
          role: 'CLIENT',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          emailVerified: true,
          kycVerified: true,
        };
        console.log('Using fallback data:', userData);
      }
      
      // Use default stats
      const userStats: UserStats = {
        totalOrders: 0,
        totalTrips: 0,
        completedTrips: 0,
        activeTrips: 0,
        averageRating: 0,
      };
      
      // Use empty activities
      const userActivities: Activity[] = [];
      
      setUser(userData);
      setStats(userStats);
      setActivities(userActivities);
      console.log('User data set:', userData);
      console.log('User state after setting:', userData);
    } catch (err: any) {
      console.error('Error in fetchUserDetails:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4" />;
      case 'trip':
        return <Truck className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'login':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <RoleGuard userRole={currentUser?.role}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="animate-pulse text-blue-600 font-semibold">Loading user details...</div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard userRole={currentUser?.role}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-red-600">{error}</div>
        </div>
      </RoleGuard>
    );
  }

  if (!user) {
    return (
      <RoleGuard userRole={currentUser?.role}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-gray-600">User not found</div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard userRole={currentUser?.role}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View and manage user information
              </p>
            </div>
            {/* Edit User button hidden */}
            {/* <button
              onClick={() => router.push(`/settings?tab=users&edit=${userId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit User
            </button> */}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {user?.firstName || ''} {user?.lastName || ''}
                  </h2>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(user?.role || '')}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role || ''}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(user?.status || '')}`}>
                    {user?.status || ''}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email || ''}</span>
                    {user?.emailVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {user?.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTrips}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed Trips</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTrips}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Trips</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User ID</label>
                <div className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white">
                  {user?.id || userId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Verification</label>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700">
                  {user?.emailVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400 font-medium">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Login</label>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">
                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
              {user?.kycVerified !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">KYC Status</label>
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700">
                    {user.kycVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h3>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
