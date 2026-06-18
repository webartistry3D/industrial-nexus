'use client';

import { Polyline } from '@react-google-maps/api';

interface MapPolylineProps {
  path: { lat: number; lng: number }[];
  color?: string;
  strokeWeight?: number;
  dashed?: boolean;
}

export function MapPolyline({ path, color = '#3b82f6', strokeWeight = 3, dashed = false }: MapPolylineProps) {
  return (
    <Polyline
      path={path}
      options={{
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight,
        ...(dashed && {
          strokePattern: [10, 10],
        }),
      }}
    />
  );
}
