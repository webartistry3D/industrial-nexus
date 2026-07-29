export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'OPERATIONS' | 'CLIENT' | 'DRIVER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  profileImageUrl?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
  user?: User;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  client?: User;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'KITTING' | 'DISPATCH_READY' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  kittingStatus: 'PENDING' | 'AGGREGATION' | 'TECHNICAL_PACKAGING' | 'QUALITY_CHECK' | 'PACKAGE_TRACKER_ASSIGNMENT' | 'DISPATCH_READY';
  totalWeight: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  pickupLocation: Location;
  deliveryLocation: Location;
  cargoDescription?: string;
  deliveryInstructions?: string;
  declaredCargoValue?: number;
  requesterName?: string;
  requesterPhone?: string;
  handlingTags: string[];
  createdAt: string;
  updatedAt: string;
  trip?: Trip;
  packageTrackerId?: string;
  packageTracker?: PackageTracker;
  invoice?: Invoice;
  statusHistory?: AuditLog[];
}

export interface PackageTracker {
  id: string;
  deviceId: string;
  name?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'BROKEN';
  batteryLevel?: number;
  lastLat?: number;
  lastLng?: number;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
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

export const VehicleDocumentType = {
  VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
  ROAD_WORTHINESS: 'ROAD_WORTHINESS',
  INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
  VEHICLE_LICENSE: 'VEHICLE_LICENSE',
  HAULAGE_PERMIT: 'HAULAGE_PERMIT',
  TEMPERATURE_CONTROL_CERTIFICATION: 'TEMPERATURE_CONTROL_CERTIFICATION',
  HAZARDOUS_MATERIAL_CERTIFICATION: 'HAZARDOUS_MATERIAL_CERTIFICATION',
} as const;

export type VehicleDocumentTypeValue = typeof VehicleDocumentType[keyof typeof VehicleDocumentType];

export const VehicleDocumentStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type VehicleDocumentStatusValue = typeof VehicleDocumentStatus[keyof typeof VehicleDocumentStatus];

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
  expiresAt?: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: VehicleDocumentTypeValue;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: VehicleDocumentStatusValue;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  expiresAt?: string;
}

export interface POD {
  id: string;
  tripId: string;
  imageUrl?: string;
  signatureUrl?: string;
  receiverName?: string;
  receiverPhone?: string;
  notes?: string;
  damageReported?: boolean;
  damageDescription?: string;
  capturedAt: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
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
  pod?: POD;
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
  vehicleDocuments?: VehicleDocument[];
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

export interface RateCard {
  id: string;
  name: string;
  isActive: boolean;
  baseRatePerKm: number;
  baseRatePerKg: number;
  minimumCharge: number;
  priorityMultipliers: Record<string, number>;
  heavySurcharge: number;
  fragileSurcharge: number;
  hazardousSurcharge: number;
  chemicalSurcharge: number;
  temperatureSensitiveSurcharge: number;
  verticalStorageSurcharge: number;
  insuranceRatePercent: number;
  vatPercent: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: User;
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  order?: Order;
  rateCardId: string;
  rateCard?: RateCard;
  distanceKm: number;
  baseFreightCharge: number;
  weightCharge: number;
  handlingSurcharges: Record<string, number>;
  priorityMultiplier: number;
  subtotal: number;
  insurancePremium: number;
  vatAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issuedAt?: string;
  paidAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
