export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'OPERATIONS' | 'CLIENT' | 'DRIVER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  client?: User;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'KITTING' | 'DISPATCH_READY' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  kittingStatus: 'PENDING' | 'AGGREGATION' | 'TECHNICAL_PACKAGING' | 'QUALITY_CHECK' | 'DISPATCH_READY';
  totalWeight: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  pickupLocation: Location;
  deliveryLocation: Location;
  cargoDescription?: string;
  deliveryInstructions?: string;
  handlingTags: string[];
  createdAt: string;
  updatedAt: string;
  trip?: Trip;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const KycDocumentType = {
  GOVERNMENT_ID: 'GOVERNMENT_ID',
  DRIVERS_LICENSE: 'DRIVERS_LICENSE',
  PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',
  VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
  INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
  PROFESSIONAL_CERTIFICATION: 'PROFESSIONAL_CERTIFICATION',
} as const;

export type KycDocumentTypeValue = typeof KycDocumentType[keyof typeof KycDocumentType];

export const KycDocumentStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type KycDocumentStatusValue = typeof KycDocumentStatus[keyof typeof KycDocumentStatus];

export interface KycDocument {
  id: string;
  driverId: string;
  documentType: KycDocumentTypeValue;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: KycDocumentStatusValue;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Trip {
  id: string;
  orderId: string;
  order?: Order;
  driverId: string;
  driver?: Driver;
  vehicleId: string;
  vehicle?: Vehicle;
  status: 'ASSIGNED' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED';
  startedAt?: string;
  completedAt?: string;
  eta?: string;
  trackingPoints?: TrackingPoint[];
  geofenceEvents?: GeofenceEvent[];
}

export interface Driver {
  id: string;
  userId: string;
  user?: User;
  licenseNumber: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  availability: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
  vehicleId?: string;
  vehicle?: Vehicle;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  category: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SPECIALIZED';
  capacityKg: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  isPartitioned: boolean;
}

export interface TrackingPoint {
  id: string;
  tripId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export interface GeofenceEvent {
  id: string;
  tripId: string;
  type: 'RADIUS_A_ENTERED' | 'RADIUS_B_ENTERED' | 'RADIUS_C_ENTERED' | 'POLYGON_ENTERED' | 'POLYGON_EXITED' | 'ARRIVAL_CONFIRMED';
  lat: number;
  lng: number;
  timestamp: string;
}

export interface WeightAlert {
  id: string;
  tripId: string;
  orderId: string;
  cargoWeight: number;
  vehicleCapacity: number;
  utilization: number;
  status: 'SAFE' | 'WARNING' | 'NEAR_CAPACITY' | 'OVERLOADED';
  checkedAt: string;
  trip?: Trip;
}

export interface DashboardStats {
  activeTrips: number;
  delayedTrips: number;
  weightAlerts: number;
  geofenceEvents: number;
  fleetUtilization: number;
  onTimeDelivery: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'RADIUS' | 'POLYGON';
  center?: { lat: number; lng: number };
  radiusA?: number;
  radiusB?: number;
  radiusC?: number;
  radiusD?: number;
  polygon?: { lat: number; lng: number }[];
  color: string;
}

export interface RouteData {
  polyline: { lat: number; lng: number }[];
  distance: number;
  estimatedDuration: number;
  pickup: { lat: number; lng: number; address: string };
  delivery: { lat: number; lng: number; address: string };
  trackingHistory: TrackingPoint[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
