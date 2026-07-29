import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      return accessToken;
    } catch (refreshError) {
      const refreshStatus = (refreshError as AxiosError).response?.status;
      if (refreshStatus === 401 || refreshStatus === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
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

        if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/')) {
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async requestPasswordReset(email: string) {
    const response = await this.client.post('/auth/password-reset/request', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post('/auth/password-reset/confirm', { token, newPassword });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/users/me');
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

  // Trips - Driver specific
  async getMyTrips(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/trips/my-trips', { params });
    return response.data;
  }

  async getTrip(id: string) {
    const response = await this.client.get(`/trips/${id}`);
    return response.data;
  }

  async startTrip(id: string) {
    const response = await this.client.post(`/trips/${id}/start`);
    return response.data;
  }

  async startOrderTrip(orderId: string) {
    const response = await this.client.post(`/orders/${orderId}/start-trip`);
    return response.data;
  }

  async completeTrip(id: string) {
    const response = await this.client.post(`/trips/${id}/complete`);
    return response.data;
  }

  // GPS Tracking
  async updateLocation(tripId: string, lat: number, lng: number, accuracy: number) {
    const response = await this.client.post(`/tracking/trips/${tripId}/location`, {
      lat,
      lng,
      accuracy,
    });
    return response.data;
  }

  // POD — presigned upload
  async getPodUploadUrl(tripId: string, filename: string, mimeType: string, type?: string): Promise<{
    uploadUrl: string;
    finalUrl: string;
    key: string;
  }> {
    const response = await this.client.get(`/trips/${tripId}/pod/upload-url`, {
      params: { filename, mimeType, type },
    });
    return response.data;
  }

  async uploadFileToPresignedUrl(uploadUrl: string, file: File | Blob, contentType?: string): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': contentType || (file instanceof File ? file.type : 'application/octet-stream') },
    });
  }

  // POD
  async submitPOD(tripId: string, podData: {
    photoUrl?: string;
    signatureUrl?: string;
    receiverName?: string;
    receiverPhone?: string;
    notes?: string;
    lat?: number;
    lng?: number;
    damageReported?: boolean;
    damageDescription?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/pod`, podData);
    return response.data;
  }

  // SOP Checklist
  async submitChecklist(tripId: string, checklist: {
    vehicleInspected: boolean;
    cargoSecured: boolean;
    handlingTagsVerified: boolean;
    safetyComplianceConfirmed: boolean;
  }) {
    const response = await this.client.post(`/trips/${tripId}/checklist`, checklist);
    return response.data;
  }

  // Tracking
  async getTripRoute(tripId: string) {
    const response = await this.client.get(`/tracking/trips/${tripId}/route`);
    return response.data;
  }

  async getTripTrackingHistory(tripId: string, limit?: number) {
    const response = await this.client.get(`/tracking/trips/${tripId}/history`, {
      params: { limit },
    });
    return response.data;
  }

  // KYC Documents
  async getMyKycDocuments() {
    const response = await this.client.get('/drivers/me/kyc/documents');
    return response.data;
  }

  async uploadKycDocument(file: File, documentType: string) {
    // Get current driver profile to get driver ID
    const profile = await this.getProfile();
    const driverId = profile.driver?.id;
    if (!driverId) throw new Error('Driver profile not found');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await this.client.post(`/drivers/${driverId}/kyc/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteKycDocument(documentId: string) {
    const response = await this.client.delete(`/drivers/kyc/documents/${documentId}`);
    return response.data;
  }

  // Vehicle Documents
  async getMyVehicleDocuments() {
    const profile = await this.getProfile();
    const vehicleId = profile.driver?.vehicle?.id;
    if (!vehicleId) return [];
    const response = await this.client.get(`/vehicles/${vehicleId}/documents`);
    return response.data;
  }

  async uploadVehicleDocument(file: File, documentType: string, expiresAt?: string) {
    const profile = await this.getProfile();
    const vehicleId = profile.driver?.vehicle?.id;
    if (!vehicleId) throw new Error('No vehicle assigned');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (expiresAt) formData.append('expiresAt', expiresAt);

    const response = await this.client.post(`/vehicles/${vehicleId}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteVehicleDocument(documentId: string) {
    const response = await this.client.delete(`/vehicles/documents/${documentId}`);
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

  async triggerDocumentExpiryCheck() {
    const response = await this.client.post('/notifications/trigger-expiry-check');
    return response.data;
  }

  // Analytics
  async getSmartKpis() {
    const response = await this.client.get('/analytics/smart-kpis');
    return response.data;
  }
}

export const api = new ApiClient();
