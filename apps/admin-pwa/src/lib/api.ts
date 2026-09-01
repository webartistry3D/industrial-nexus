import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    if (!refreshToken) return null;

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      accessToken = newAccessToken;
      if (newRefreshToken) {
        refreshToken = newRefreshToken;
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      localStorage.setItem('accessToken', newAccessToken);
      return newAccessToken;
    } catch (refreshError) {
      const refreshStatus = (refreshError as AxiosError).response?.status;
      if (refreshStatus === 401 || refreshStatus === 403) {
        clearTokens();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (typeof window !== 'undefined' && !currentPath.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

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
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
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
          (originalRequest as unknown as Record<string, unknown>)['_retry'] = true;

          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
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
    clearTokens();
  }

  async requestPasswordReset(email: string) {
    const response = await this.client.post('/auth/password-reset/request', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post('/auth/password-reset/confirm', { token, newPassword });
    return response.data;
  }

  async getProfile(timeout?: number) {
    const response = await this.client.get('/users/me', timeout ? { timeout } : undefined);
    return response.data;
  }

  async updateMyProfile(data: { firstName?: string; lastName?: string; phoneNumber?: string }) {
    const response = await this.client.patch('/users/me', data);
    return response.data;
  }

  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.client.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getAvatarUrl() {
    const response = await this.client.get('/users/me/avatar-url');
    return response.data as { url: string; expiresAt: string };
  }

  async getPODPhotoUrl(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/pod/photo-url`);
    return response.data as { url: string; expiresAt: string };
  }

  async getPODSignatureUrl(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/pod/signature-url`);
    return response.data as { url: string; expiresAt: string };
  }

  async getKycDocumentSignedUrl(documentId: string) {
    const response = await this.client.get(`/drivers/kyc/documents/${documentId}/signed-url`);
    return response.data as { url: string; expiresAt: string };
  }

  async getVehicleDocumentSignedUrl(documentId: string) {
    const response = await this.client.get(`/vehicles/documents/${documentId}/signed-url`);
    return response.data as { url: string; expiresAt: string };
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
    const response = await this.client.post(`/kitting/${id}/complete`);
    return response.data;
  }

  async progressKitting(id: string, stage: string, barcodeVerified?: boolean, notes?: string) {
    const response = await this.client.post(`/kitting/${id}/progress`, {
      stage,
      barcodeVerified,
      notes,
    });
    return response.data;
  }

  async getKittingLogs(id: string) {
    const response = await this.client.get(`/kitting/${id}/logs`);
    return response.data;
  }

  async assignPackageTracker(orderId: string, packageTrackerId: string) {
    const response = await this.client.post(`/kitting/${orderId}/assign-package-tracker`, {
      packageTrackerId,
    });
    return response.data;
  }

  async unassignPackageTracker(orderId: string) {
    const response = await this.client.post(`/kitting/${orderId}/unassign-package-tracker`);
    return response.data;
  }

  async getAvailablePackageTrackers() {
    const response = await this.client.get('/kitting/package-trackers/available');
    return response.data;
  }

  // Package Trackers
  async getPackageTrackers(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/package-trackers', { params });
    return response.data;
  }

  async getPackageTracker(id: string) {
    const response = await this.client.get(`/package-trackers/${id}`);
    return response.data;
  }

  async createPackageTracker(data: { deviceId: string; name?: string }) {
    const response = await this.client.post('/package-trackers', data);
    return response.data;
  }

  async updatePackageTracker(id: string, data: { name?: string; status?: string; batteryLevel?: number }) {
    const response = await this.client.patch(`/package-trackers/${id}`, data);
    return response.data;
  }

  async deletePackageTracker(id: string) {
    const response = await this.client.delete(`/package-trackers/${id}`);
    return response.data;
  }

  async assignDriver(id: string, driverId: string, vehicleId?: string) {
    const url = `/orders/${id}/status`;
    const payload: Record<string, unknown> = { status: 'ASSIGNED', driverId };
    if (vehicleId) payload.vehicleId = vehicleId;
    try {
      const response = await this.client.post(url, payload);
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

  async reassignTrip(id: string, data: {
    driverId: string;
    vehicleId: string;
    reason?: string;
    isDispatchError?: boolean;
    errorType?: string;
  }) {
    const response = await this.client.post(`/trips/${id}/reassign`, data);
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
    const response = await this.client.patch(`/drivers/${id}`, { status });
    return response.data;
  }

  async updateDriverKyc(id: string, kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED') {
    const response = await this.client.patch(`/drivers/${id}`, { kycStatus });
    return response.data;
  }

  async updateDriverAvailability(id: string, availability: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY') {
    const response = await this.client.patch(`/drivers/${id}`, { availability });
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

  async uploadDriverKycDocument(driverId: string, file: File, documentType: string, expiresAt?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiresAt) formData.append('expiresAt', expiresAt);

    const response = await this.client.post(`/drivers/${driverId}/kyc/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  // Vehicle Documents
  async getVehicleDocuments(vehicleId: string, params?: { status?: string; documentType?: string }) {
    const response = await this.client.get(`/vehicles/${vehicleId}/documents`, { params });
    return response.data;
  }

  async getPendingVehicleDocuments(params?: { documentType?: string; vehicleId?: string }) {
    const response = await this.client.get('/vehicles/documents/pending', { params });
    return response.data;
  }

  async uploadVehicleDocument(vehicleId: string, file: File, documentType: string, expiresAt?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiresAt) formData.append('expiresAt', expiresAt);

    const response = await this.client.post(`/vehicles/${vehicleId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async updateVehicleDocument(documentId: string, data: { status?: string; rejectionReason?: string }) {
    const response = await this.client.patch(`/vehicles/documents/${documentId}`, data);
    return response.data;
  }

  async deleteVehicleDocument(documentId: string) {
    const response = await this.client.delete(`/vehicles/documents/${documentId}`);
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

  async getDriverPerformance(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/analytics/drivers', { params });
    return response.data;
  }

  async getDeliveryTrends(days = 30) {
    const response = await this.client.get('/analytics/trends', { params: { days } });
    return response.data;
  }

  async getSmartKpis() {
    const response = await this.client.get('/analytics/smart-kpis');
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

  async getLivePackageLocation(packageTrackerId: string) {
    const response = await this.client.get(`/tracking/packages/${packageTrackerId}/live`);
    return response.data;
  }

  async getPackageTrackingHistory(packageTrackerId: string, limit?: number) {
    const response = await this.client.get(`/tracking/packages/${packageTrackerId}/history`, {
      params: { limit },
    });
    return response.data;
  }

  async getPackageLocationByOrderId(orderId: string) {
    const response = await this.client.get(`/tracking/orders/${orderId}/package-location`);
    return response.data;
  }

  async updatePackageLocation(packageTrackerId: string, lat: number, lng: number, accuracy?: number, speed?: number, heading?: number) {
    const response = await this.client.post('/tracking/packages/location', {
      packageTrackerId,
      lat,
      lng,
      accuracy,
      speed,
      heading,
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

  // Billing - Rate Cards
  async getRateCards() {
    const response = await this.client.get('/billing/rate-cards');
    return response.data;
  }

  async createRateCard(data: any) {
    const response = await this.client.post('/billing/rate-cards', data);
    return response.data;
  }

  async updateRateCard(id: string, data: any) {
    const response = await this.client.patch(`/billing/rate-cards/${id}`, data);
    return response.data;
  }

  async activateRateCard(id: string) {
    const response = await this.client.post(`/billing/rate-cards/${id}/activate`);
    return response.data;
  }

  async deleteRateCard(id: string) {
    const response = await this.client.delete(`/billing/rate-cards/${id}`);
    return response.data;
  }

  // Billing - Invoices
  async getInvoices(params?: { status?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/billing/invoices', { params });
    return response.data;
  }

  async getInvoice(id: string) {
    const response = await this.client.get(`/billing/invoices/${id}`);
    return response.data;
  }

  async issueInvoice(id: string) {
    const response = await this.client.post(`/billing/invoices/${id}/issue`);
    return response.data;
  }

  async markInvoicePaid(id: string) {
    const response = await this.client.post(`/billing/invoices/${id}/mark-paid`);
    return response.data;
  }

  async voidInvoice(id: string) {
    const response = await this.client.post(`/billing/invoices/${id}/void`);
    return response.data;
  }

  async getOrderInvoice(orderId: string) {
    const response = await this.client.get(`/billing/orders/${orderId}/invoice`);
    return response.data;
  }

  async getBillingQuote(orderId: string) {
    const response = await this.client.get(`/billing/quote/${orderId}`);
    return response.data;
  }

  async getBillingEstimate(data: any) {
    const response = await this.client.post('/billing/estimate', data);
    return response.data;
  }
}

export const api = new ApiClient();
