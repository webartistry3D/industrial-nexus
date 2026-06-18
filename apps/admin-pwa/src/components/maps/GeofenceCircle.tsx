'use client';

import { Circle } from '@react-google-maps/api';

interface GeofenceCircleProps {
  center: { lat: number; lng: number };
  radius: number; // meters
  color?: string;
  fillOpacity?: number;
  label?: string;
}

const getRadiusColor = (radius: number): string => {
  if (radius <= 100) return '#22c55e'; // Green for arrival zone (100m)
  if (radius <= 1000) return '#f97316'; // Orange for approaching (1km)
  if (radius <= 5000) return '#eab308'; // Yellow for early awareness (5km)
  return '#3b82f6'; // Blue for custom zones
};

export function GeofenceCircle({ center, radius, color, fillOpacity = 0.1, label }: GeofenceCircleProps) {
  const circleColor = color || getRadiusColor(radius);

  return (
    <>
      <Circle
        center={center}
        radius={radius}
        options={{
          strokeColor: circleColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: circleColor,
          fillOpacity,
        }}
      />
      {/* Label could be added using InfoWindow if needed */}
    </>
  );
}
