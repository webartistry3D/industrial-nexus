import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Skip if no config, already retried, or is auth endpoint
        if (!originalRequest || 
            (originalRequest as unknown as Record<string, unknown>)['_retry'] ||
            originalRequest.url?.includes('/auth/')) {
          return Promise.reject(error);
        }
        
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          
          console.log(`[Auth] 401 on ${originalRequest.url}, hasRefreshToken: ${!!refreshToken}, path: ${currentPath}`);
          
          // No refresh token - only logout if not on public pages
          if (!refreshToken) {
            console.log('[Auth] No refresh token, logging out');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined' && !currentPath.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
          
          // Mark as retried to prevent loops
          (originalRequest as unknown as Record<string, unknown>)['_retry'] = true;
          
          // Try to refresh token using plain axios (bypasses this interceptor)
          try {
            console.log('[Auth] Attempting token refresh...');
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });
            
            const { accessToken } = response.data;
            console.log('[Auth] Token refresh successful');
            localStorage.setItem('accessToken', accessToken);
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            const refreshStatus = (refreshError as AxiosError).response?.status;
            console.log(`[Auth] Token refresh failed with status: ${refreshStatus}`);
            
            // Only logout if refresh token is actually invalid (401/403)
            if (refreshStatus === 401 || refreshStatus === 403) {
              console.log('[Auth] Refresh token invalid, logging out');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              if (typeof window !== 'undefined' && !currentPath.includes('/login')) {
                window.location.href = '/login';
              }
            }
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getProfile() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // Orders
  async getOrders(params?: { status?: string; kittingStatus?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/orders', { params });
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(data: any) {
    const response = await this.client.post('/orders', data);
    return response.data;
  }

  async updateOrder(id: string, data: any) {
    const response = await this.client.patch(`/orders/${id}`, data);
    return response.data;
  }

  async cancelOrder(id: string, reason: string) {
    const response = await this.client.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  }

  // Order status changes
  async submitOrder(id: string) {
    const response = await this.client.post(`/orders/${id}/submit`);
    return response.data;
  }

  async rejectOrder(id: string, reason: string) {
    const response = await this.client.post(`/orders/${id}/reject`, { reason });
    return response.data;
  }

  async approveOrder(id: string) {
    const response = await this.client.post(`/orders/${id}/approve`);
    return response.data;
  }

  async startKitting(id: string) {
    const response = await this.client.post(`/orders/${id}/start-kitting`);
    return response.data;
  }

  async finishKitting(id: string) {
    const response = await this.client.post(`/orders/${id}/finish-kitting`);
    return response.data;
  }

  async assignDriver(id: string, driverId: string) {
    const url = `/orders/${id}/status`;
    console.log('[API] Assign Driver - URL:', url);
    console.log('[API] Assign Driver - Payload:', { status: 'ASSIGNED', driverId });
    try {
      const response = await this.client.post(url, { status: 'ASSIGNED', driverId });
      console.log('[API] Assign Driver - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Assign Driver - Error:', error);
      console.error('[API] Assign Driver - Error Response:', error.response);
      throw error;
    }
  }

  async startOrderTrip(id: string) {
    const response = await this.client.post(`/orders/${id}/start-trip`);
    return response.data;
  }

  async confirmDelivery(id: string) {
    const response = await this.client.post(`/orders/${id}/confirm-delivery`);
    return response.data;
  }

  // Trips
  async getTrips(params?: { status?: string; driverId?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/trips', { params });
    return response.data;
  }

  async getTrip(id: string) {
    const response = await this.client.get(`/trips/${id}`);
    return response.data;
  }

  async createTrip(data: { orderId: string; driverId: string; vehicleId: string }) {
    const response = await this.client.post('/trips', data);
    return response.data;
  }

  async startTrip(id: string) {
    const response = await this.client.post(`/trips/${id}/start`);
    return response.data;
  }

  async completeTrip(id: string) {
    const response = await this.client.post(`/trips/${id}/complete`);
    return response.data;
  }

  // Drivers
  async getDrivers(params?: { status?: string; availability?: string; search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/drivers', { params });
    return response.data;
  }

  async getDriver(id: string) {
    const response = await this.client.get(`/drivers/${id}`);
    return response.data;
  }

  async createDriver(data: { userId?: string; email?: string; firstName?: string; lastName?: string; licenseNumber: string; phone?: string }) {
    const response = await this.client.post('/drivers', data);
    return response.data;
  }

  async createUser(data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string; role: string; status?: string }) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async getUsers(params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: { firstName?: string; lastName?: string; phoneNumber?: string; role?: string; status?: string }) {
    const response = await this.client.patch(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // System Settings
  async getSystemSettings() {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async updateSystemSetting(key: string, value: any) {
    const response = await this.client.patch('/settings', { key, value });
    return response.data;
  }

  async updateMultipleSettings(settings: Record<string, any>) {
    const response = await this.client.patch('/settings/batch', settings);
    return response.data;
  }

  async updateDriver(id: string, data: { licenseNumber?: string; status?: string; availability?: string; kycStatus?: string; vehicleId?: string | null }) {
    const response = await this.client.patch(`/drivers/${id}`, data);
    return response.data;
  }

  async updateDriverStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    const response = await this.client.patch(`/drivers/${id}/status`, { status });
    return response.data;
  }

  async updateDriverKyc(id: string, kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED') {
    const response = await this.client.patch(`/drivers/${id}/kyc`, { kycStatus });
    return response.data;
  }

  async updateDriverAvailability(id: string, availability: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY') {
    const response = await this.client.patch(`/drivers/${id}/availability`, { availability });
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }

  async updateNotificationSettings(settings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    orderAlerts: boolean;
    tripAlerts: boolean;
    systemAlerts: boolean;
  }) {
    const response = await this.client.patch('/users/notifications', settings);
    return response.data;
  }

  async getUserStats(userId: string) {
    const response = await this.client.get(`/users/${userId}/stats`);
    return response.data;
  }

  async getUserActivities(userId: string) {
    const response = await this.client.get(`/users/${userId}/activities`);
    return response.data;
  }

  // KYC Documents
  async getDriverKycDocuments(driverId: string, params?: { status?: string; documentType?: string }) {
    const response = await this.client.get(`/drivers/${driverId}/kyc/documents`, { params });
    return response.data;
  }

  async getPendingKycDocuments(params?: { documentType?: string; driverId?: string }) {
    const response = await this.client.get('/drivers/kyc/pending', { params });
    return response.data;
  }

  async updateKycDocument(documentId: string, data: { status?: string; rejectionReason?: string }) {
    const response = await this.client.patch(`/drivers/kyc/documents/${documentId}`, data);
    return response.data;
  }

  async deleteKycDocument(documentId: string) {
    const response = await this.client.delete(`/drivers/kyc/documents/${documentId}`);
    return response.data;
  }

  // Vehicles
  async getVehicles(params?: { status?: string; category?: string }) {
    const response = await this.client.get('/vehicles', { params });
    return response.data;
  }

  async getVehicle(id: string) {
    const response = await this.client.get(`/vehicles/${id}`);
    return response.data;
  }

  async createVehicle(data: { plateNumber: string; category: string; capacityKg: number; isPartitioned: boolean }) {
    const response = await this.client.post('/vehicles', data);
    return response.data;
  }

  async updateVehicle(id: string, data: { plateNumber?: string; category?: string; capacityKg?: number; status?: string; isPartitioned?: boolean }) {
    const response = await this.client.patch(`/vehicles/${id}`, data);
    return response.data;
  }

  async deactivateVehicle(id: string) {
    const response = await this.client.delete(`/vehicles/${id}`);
    return response.data;
  }

  async getAuditLogs(params?: { entityType?: string; limit?: number }) {
    const response = await this.client.get('/audit', { params });
    return response.data;
  }

  // Weight Watch
  async getWeightAlerts() {
    const response = await this.client.get('/weight-watch/alerts');
    return response.data;
  }

  async validateWeight(data: { cargoWeight: number; vehicleId: string; handlingTags: string[] }) {
    const response = await this.client.post('/weight-watch/validate', data);
    return response.data;
  }

  // Geofencing
  async getGeofenceEvents(tripId: string) {
    const response = await this.client.get(`/geofencing/trips/${tripId}/events`);
    return response.data;
  }

  // Dashboard Stats
  async getDashboardStats() {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  async getDriverPerformance() {
    const response = await this.client.get('/analytics/drivers');
    return response.data;
  }

  async getDeliveryTrends(days = 30) {
    const response = await this.client.get('/analytics/trends', { params: { days } });
    return response.data;
  }

  // Tracking
  async getLiveTripLocation(tripId: string) {
    const response = await this.client.get(`/tracking/trips/${tripId}/live`);
    return response.data;
  }

  async getTripTrackingHistory(tripId: string, limit?: number) {
    const response = await this.client.get(`/tracking/trips/${tripId}/history`, {
      params: { limit },
    });
    return response.data;
  }

  async getActiveFleetLocations(status?: string) {
    const response = await this.client.get('/tracking/fleet/active', {
      params: { status },
    });
    return response.data;
  }

  async getGeofenceZones() {
    const response = await this.client.get('/tracking/geofences');
    return response.data;
  }

  async getTripRoute(tripId: string) {
    const response = await this.client.get(`/tracking/trips/${tripId}/route`);
    return response.data;
  }

  async updateLocation(tripId: string, lat: number, lng: number, accuracy?: number) {
    const response = await this.client.post(`/tracking/trips/${tripId}/location`, {
      lat,
      lng,
      accuracy,
    });
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.patch('/notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.client.delete(`/notifications/${id}`);
    return response.data;
  }

  // Handling Tags
  async getAllHandlingTags() {
    const response = await this.client.get('/settings/handling-tags');
    return response.data;
  }

  async createHandlingTag(name: string) {
    const response = await this.client.post('/settings/handling-tags', { name });
    return response.data;
  }

  async updateHandlingTag(id: string, name: string) {
    const response = await this.client.put(`/settings/handling-tags/${id}`, { name });
    return response.data;
  }

  async deleteHandlingTag(id: string) {
    const response = await this.client.delete(`/settings/handling-tags/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();
