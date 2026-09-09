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

/** Mapbox Standard light presets for time-of-day styling */
export type LightPreset = 'day' | 'night' | 'dusk' | 'dawn';

/** Mapbox Standard configuration properties */
export interface StandardConfig {
  lightPreset?: LightPreset;
  show3dBuildings?: boolean;
  show3dTrees?: boolean;
  show3dLandmarks?: boolean;
  showRoadLabels?: boolean;
  showPointOfInterestLabels?: boolean;
  showPlaceLabels?: boolean;
  showTransitLabels?: boolean;
  showPedestrianRoads?: boolean;
}

/** Building to highlight using Standard featuresets */
export interface BuildingHighlight {
  lat: number;
  lng: number;
  /** 'highlight' for hover effect, 'select' for persistent */
  state?: 'highlight' | 'select';
}
