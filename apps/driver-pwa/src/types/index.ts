export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DRIVER';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Driver {
  id: string;
  userId: string;
  user?: User;
  licenseNumber: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  availability: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  category: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SPECIALIZED';
  capacityKg: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  isPartitioned: boolean;
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
}

export interface Trip {
  id: string;
  orderId: string;
  order: Order;
  driverId: string;
  driver: Driver;
  vehicleId: string;
  vehicle: Vehicle;
  status: 'ASSIGNED' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED';
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
