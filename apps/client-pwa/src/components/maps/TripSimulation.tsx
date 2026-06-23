'use client';

import { useState, useEffect, useRef } from 'react';
import { Circle } from '@react-google-maps/api';
import { MapMarker } from './MapMarker';
import { MapPolyline } from './MapPolyline';

const RADIUS_A = 5000;  // 5km - Early awareness
const RADIUS_B = 1000;  // 1km - Approaching
const RADIUS_C = 100;   // 100m - Arrival zone

const GEOFENCE_ZONES = [
  { radius: RADIUS_A, color: '#f59e0b', label: 'Radius A', fillOpacity: 0.04, strokeOpacity: 0.4 },
  { radius: RADIUS_B, color: '#f97316', label: 'Radius B', fillOpacity: 0.07, strokeOpacity: 0.6 },
  { radius: RADIUS_C, color: '#22c55e', label: 'Radius C', fillOpacity: 0.15, strokeOpacity: 0.9 },
];

interface TripSimulationProps {
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  isSimulating: boolean;
  onSimulationComplete?: () => void;
  onVehiclePositionChange?: (position: { lat: number; lng: number }) => void;
}

export function TripSimulation({
  pickupLocation,
  deliveryLocation,
  isSimulating,
  onSimulationComplete,
  onVehiclePositionChange,
}: TripSimulationProps) {
  // Only render state — never updated inside rAF
  const [vehiclePosition, setVehiclePosition] = useState<{ lat: number; lng: number }>(pickupLocation);
  const [trailPath, setTrailPath] = useState<{ lat: number; lng: number }[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const routeRef = useRef<{ lat: number; lng: number }[]>([]);
  const onCompleteRef = useRef(onSimulationComplete);
  const onPositionChangeRef = useRef(onVehiclePositionChange);

  useEffect(() => { onCompleteRef.current = onSimulationComplete; }, [onSimulationComplete]);
  useEffect(() => { onPositionChangeRef.current = onVehiclePositionChange; }, [onVehiclePositionChange]);

  // Build route once when locations are available
  useEffect(() => {
    if (!pickupLocation?.lat || !deliveryLocation?.lat) return;
    routeRef.current = generateRouteWaypoints(pickupLocation, deliveryLocation);
  }, [pickupLocation, deliveryLocation]);

  // Start/stop animation based on isSimulating
  useEffect(() => {
    if (!isSimulating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      setVehiclePosition(pickupLocation);
      setTrailPath([]);
      setActiveZone(null);
      return;
    }

    // Ensure route is built before starting
    if (!pickupLocation?.lat || !deliveryLocation?.lat) return;
    if (routeRef.current.length < 2) {
      routeRef.current = generateRouteWaypoints(pickupLocation, deliveryLocation);
    }

    if (routeRef.current.length < 2) return;

    const DURATION = 15000; // 15 seconds
    const startTime = performance.now();

    const tick = (now: number) => {
      const r = routeRef.current;
      if (!r || r.length < 2) return;

      const t = Math.min((now - startTime) / DURATION, 1);
      const rawIdx = t * (r.length - 1);
      const idx = Math.max(0, Math.min(Math.floor(rawIdx), r.length - 2));
      const frac = rawIdx - idx;

      const a = r[idx];
      const b = r[idx + 1];
      if (!a || !b) return;

      const pos = {
        lat: a.lat + (b.lat - a.lat) * frac,
        lng: a.lng + (b.lng - a.lng) * frac,
      };

      // Calculate distance to delivery for geofence zone detection
      const distToDelivery = haversineDistance(pos, deliveryLocation);
      if (distToDelivery <= RADIUS_C) setActiveZone('C');
      else if (distToDelivery <= RADIUS_B) setActiveZone('B');
      else if (distToDelivery <= RADIUS_A) setActiveZone('A');
      else setActiveZone(null);

      setVehiclePosition(pos);
      setTrailPath(r.slice(0, idx + 2));
      onPositionChangeRef.current?.(pos);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
        onCompleteRef.current?.();
      }
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating]);

  if (!pickupLocation?.lat || !deliveryLocation?.lat) return null;

  return (
    <>
      {/* Geofence radius circles around delivery location */}
      {GEOFENCE_ZONES.map((zone) => (
        <Circle
          key={zone.label}
          center={deliveryLocation}
          radius={zone.radius}
          options={{
            strokeColor: zone.color,
            strokeOpacity: zone.strokeOpacity,
            strokeWeight: activeZone === zone.label.slice(-1) ? 3 : 1.5,
            fillColor: zone.color,
            fillOpacity: activeZone === zone.label.slice(-1) ? zone.fillOpacity * 2.5 : zone.fillOpacity,
          }}
        />
      ))}

      <MapMarker position={vehiclePosition} type="vehicle" label="🚚" />
      <MapPolyline path={trailPath} color="#3b82f6" strokeWeight={4} />
      <MapMarker position={pickupLocation} type="pickup" label="📦" />
      <MapMarker position={deliveryLocation} type="delivery" label="🏠" />
    </>
  );
}

// Haversine distance between two lat/lng points in meters
function haversineDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371e3;
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate smooth waypoints between two points
function generateRouteWaypoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): { lat: number; lng: number }[] {
  const waypoints: { lat: number; lng: number }[] = [];
  const numWaypoints = 50; // Number of intermediate points

  // Add some curve to make it look more realistic
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  
  // Add a slight offset to create a curve
  const curveOffset = 0.005;
  const curveLat = midLat + curveOffset;
  const curveLng = midLng + curveOffset;

  for (let i = 0; i <= numWaypoints; i++) {
    const t = i / numWaypoints;
    
    // Quadratic Bezier curve for smooth path
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * curveLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * curveLng + t * t * end.lng;
    
    waypoints.push({ lat, lng });
  }

  return waypoints;
}
