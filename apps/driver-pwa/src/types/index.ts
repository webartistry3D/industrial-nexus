export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DRIVER' | 'SUPER_ADMIN' | 'OPERATIONS' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE';
  phoneNumber?: string;
}

export const KycDocumentType = {
  GOVERNMENT_ID: 'GOVERNMENT_ID',
  DRIVERS_LICENSE: 'DRIVERS_LICENSE',
  PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',
  INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
  VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
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

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  cargoDescription: string;
  totalWeight: number;
  handlingTags: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  requesterName?: string;
  requesterPhone?: string;
}

export interface Trip {
  id: string;
  orderId: string;
  order: Order;
  driverId: string;
  driver: Driver;
  vehicleId: string;
  vehicle: Vehicle;
  status: 'ASSIGNED' | 'SOP_CHECKLIST_PENDING' | 'SOP_COMPLETED' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED';
  startedAt?: string;
  completedAt?: string;
  eta?: string;
  checklist?: SOPChecklist;
  pod?: POD;
}

export interface SOPChecklist {
  vehicleInspected: boolean;
  cargoSecured: boolean;
  handlingTagsVerified: boolean;
  safetyComplianceConfirmed: boolean;
  completedAt?: string;
}

export interface POD {
  id: string;
  tripId: string;
  photoUrl?: string;
  signatureUrl?: string;
  notes?: string;
  damageReported?: boolean;
  damageDescription?: string;
  capturedAt: string;
  gpsLocation: {
    lat: number;
    lng: number;
  };
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
  type: 'RADIUS_A_ENTERED' | 'RADIUS_B_ENTERED' | 'RADIUS_C_ENTERED' | 'POLYGON_ENTERED' | 'ARRIVAL_CONFIRMED';
  lat: number;
  lng: number;
  timestamp: string;
}
