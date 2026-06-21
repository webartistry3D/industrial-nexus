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
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
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

  async getProfile() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // Trips - Driver specific
  async getMyTrips() {
    const response = await this.client.get('/trips/my-trips');
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

  // POD
  async submitPOD(tripId: string, podData: {
    photoUrl?: string;
    signatureUrl?: string;
    notes?: string;
    lat?: number;
    lng?: number;
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
    const driverId = profile.id;
    
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
}

export const api = new ApiClient();
