// Common TypeScript types shared across all applications

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATIONS = 'OPERATIONS',
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum KycDocumentType {
  GOVERNMENT_ID = 'GOVERNMENT_ID',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  PROFESSIONAL_CERTIFICATION = 'PROFESSIONAL_CERTIFICATION',
}

export enum KycDocumentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum VehicleDocumentType {
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  ROAD_WORTHINESS = 'ROAD_WORTHINESS',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  VEHICLE_LICENSE = 'VEHICLE_LICENSE',
  HAULAGE_PERMIT = 'HAULAGE_PERMIT',
  TEMPERATURE_CONTROL_CERTIFICATION = 'TEMPERATURE_CONTROL_CERTIFICATION',
  HAZARDOUS_MATERIAL_CERTIFICATION = 'HAZARDOUS_MATERIAL_CERTIFICATION',
}

export enum VehicleDocumentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum TripStatus {
  ASSIGNED = 'ASSIGNED',
  SOP_CHECKLIST_PENDING = 'SOP_CHECKLIST_PENDING',
  SOP_COMPLETED = 'SOP_COMPLETED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  KITTING = 'KITTING',
  DISPATCH_READY = 'DISPATCH_READY',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  client: {
    id: string;
    companyName: string;
    email: string;
  };
  pickupLocation: Location;
  deliveryLocation: Location;
  cargoDescription: string;
  totalWeight: number;
  handlingTags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  order: Order;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    vehicle?: {
      plateNumber: string;
      capacity: number;
    };
  };
  status: TripStatus;
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface KycDocument {
  id: string;
  driverId: string;
  documentType: KycDocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: KycDocumentStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: VehicleDocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: VehicleDocumentStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  category: string;
  capacityKg: number;
  status: string;
  isPartitioned: boolean;
  createdAt: Date;
  updatedAt: Date;
  drivers?: Driver[];
  vehicleDocuments?: VehicleDocument[];
}

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  kycStatus: KycStatus;
  status: UserStatus;
  availability: string;
  vehicleId?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  vehicle?: Vehicle;
  kycDocuments?: KycDocument[];
}
