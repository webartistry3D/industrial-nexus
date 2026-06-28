export interface LatLng {
  lat: number;
  lng: number;
}

export interface LatLngAddress extends LatLng {
  address: string;
}

export type MarkerType =
  | 'vehicle'
  | 'pickup'
  | 'delivery'
  | 'package'
  | 'current'
  | 'default';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Route {
  waypoints: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

export type ValhallaCosting = 'auto' | 'truck' | 'motorcycle' | 'pedestrian';

export interface GeofenceZone {
  radius: number;
  color: string;
  label: string;
  fillOpacity: number;
  strokeOpacity: number;
}
