import type { LatLng, GeofenceZone } from '../types';

export const DEFAULT_CENTER: LatLng = {
  lat: 6.502206,
  lng: 3.305082,
};

export const DEFAULT_ZOOM = 13;

export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    radius: 5000,
    color: '#eab308',
    label: 'Radius A',
    fillOpacity: 0.04,
    strokeOpacity: 0.4,
  },
  {
    radius: 1000,
    color: '#f97316',
    label: 'Radius B',
    fillOpacity: 0.07,
    strokeOpacity: 0.6,
  },
  {
    radius: 100,
    color: '#22c55e',
    label: 'Radius C',
    fillOpacity: 0.15,
    strokeOpacity: 0.9,
  },
];

export const MARKER_COLORS: Record<string, string> = {
  vehicle: '#3b82f6',
  pickup: '#3b82f6',
  delivery: '#3b82f6',
  package: '#a855f7',
  current: '#22c55e',
  default: '#6b7280',
};

export const MARKER_EMOJIS: Record<string, string> = {
  vehicle: '🚚',
  pickup: '📦',
  delivery: '🏠',
  package: '📦',
  current: '📍',
  default: '•',
};
