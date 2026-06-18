'use client';

import { Polygon } from '@react-google-maps/api';

interface GeofencePolygonProps {
  path: { lat: number; lng: number }[];
  color?: string;
  fillOpacity?: number;
}

export function GeofencePolygon({ path, color = '#3b82f6', fillOpacity = 0.1 }: GeofencePolygonProps) {
  return (
    <Polygon
      path={path}
      options={{
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity,
      }}
    />
  );
}
