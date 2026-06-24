'use client';

import { Marker } from '@react-google-maps/api';

interface MapMarkerProps {
  position: { lat: number; lng: number };
  type?: 'vehicle' | 'pickup' | 'delivery' | 'package' | 'current' | 'default';
  label?: string;
  onClick?: () => void;
}

const getMarkerIcon = (type: string = 'default') => {
  const icons: Record<string, string> = {
    vehicle: '🚛',
    pickup: '📦',
    delivery: '🏠',
    package: '📦',
    current: '📍',
    default: '📍',
  };
  return icons[type] || icons.default;
};

export function MapMarker({ position, type = 'default', label, onClick }: MapMarkerProps) {
  return (
    <Marker
      position={position}
      onClick={onClick}
      label={{
        text: label || getMarkerIcon(type),
        className: 'text-2xl',
        color: type === 'current' ? '#22c55e' : '#3b82f6',
      }}
      options={{
        animation: type === 'current' ? google.maps.Animation.DROP : undefined,
      }}
    />
  );
}
