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

        const reqRecord = originalRequest as unknown as Record<string, unknown>;
        if (error.response?.status === 401 && originalRequest && !reqRecord['_retry'] && !originalRequest.url?.includes('/auth/')) {
          reqRecord['_retry'] = true;

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

  // Orders
  async getMyOrders(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/orders', { params });
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(orderData: {
    totalWeight: number;
    cargoDescription: string;
    pickupLocation: {
      lat: number;
      lng: number;
      address: string;
    };
    deliveryLocation: {
      lat: number;
      lng: number;
      address: string;
    };
    handlingTags?: string[];
    deliveryInstructions?: string;
  }) {
    const response = await this.client.post('/orders', orderData);
    return response.data;
  }

  async confirmDelivery(orderId: string) {
    const response = await this.client.post(`/orders/${orderId}/confirm-delivery`);
    return response.data;
  }

  // Tracking
  async getShipmentTracking(shipmentId: string) {
    const response = await this.client.get(`/tracking/trips/${shipmentId}/live`);
    return response.data;
  }

  async getShipmentRoute(shipmentId: string) {
    const response = await this.client.get(`/tracking/trips/${shipmentId}/route`);
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

  async getHandlingTags() {
    const response = await this.client.get('/settings/handling-tags');
    return response.data;
  }
}

export const api = new ApiClient();
