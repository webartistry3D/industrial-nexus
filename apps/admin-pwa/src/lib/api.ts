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
        
        if (error.response?.status === 401 && originalRequest) {
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });
              
              const { accessToken } = response.data;
              localStorage.setItem('accessToken', accessToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
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
  async getOrders(params?: { status?: string; page?: number; limit?: number }) {
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
  async getDrivers(params?: { status?: string; availability?: string }) {
    const response = await this.client.get('/drivers', { params });
    return response.data;
  }

  async getDriver(id: string) {
    const response = await this.client.get(`/drivers/${id}`);
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
}

export const api = new ApiClient();
