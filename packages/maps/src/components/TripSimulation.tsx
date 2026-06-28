'use client';

import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapMarker } from './MapMarker';
import { MapPolyline } from './MapPolyline';
import { GeofenceCircle } from './GeofenceCircle';
import { haversineDistance } from '../lib/haversine';
import { getRoute } from '../lib/routing';
import { GEOFENCE_ZONES } from '../lib/constants';
import type { LatLngAddress, LatLng } from '../types';

export interface TripSimulationProps {
  map: maplibregl.Map;
  pickupLocation: LatLngAddress;
  deliveryLocation: LatLngAddress;
  isSimulating: boolean;
  onSimulationComplete?: () => void;
  onVehiclePositionChange?: (position: LatLng) => void;
}

const DURATION_MS = 15000;

export function TripSimulation({
  map,
  pickupLocation,
  deliveryLocation,
  isSimulating,
  onSimulationComplete,
  onVehiclePositionChange,
}: TripSimulationProps) {
  const [vehiclePosition, setVehiclePosition] = useState<LatLng>(pickupLocation);
  const [trailPath, setTrailPath] = useState<LatLng[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const routeRef = useRef<LatLng[]>([]);
  const onCompleteRef = useRef(onSimulationComplete);
  const onPositionChangeRef = useRef(onVehiclePositionChange);

  useEffect(() => { onCompleteRef.current = onSimulationComplete; }, [onSimulationComplete]);
  useEffect(() => { onPositionChangeRef.current = onVehiclePositionChange; }, [onVehiclePositionChange]);

  useEffect(() => {
    if (!pickupLocation?.lat || !deliveryLocation?.lat) return;
    getRoute(pickupLocation, deliveryLocation, 'auto')
      .then(route => { routeRef.current = route.waypoints; })
      .catch(() => {
        routeRef.current = fallbackWaypoints(pickupLocation, deliveryLocation);
      });
  }, [pickupLocation, deliveryLocation]);

  useEffect(() => {
    if (!isSimulating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      setVehiclePosition(pickupLocation);
      setTrailPath([]);
      setActiveZone(null);
      return;
    }

    if (!pickupLocation?.lat || !deliveryLocation?.lat) return;

    if (routeRef.current.length < 2) {
      routeRef.current = fallbackWaypoints(pickupLocation, deliveryLocation);
    }
    if (routeRef.current.length < 2) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const r = routeRef.current;
      if (!r || r.length < 2) return;

      const t = Math.min((now - startTime) / DURATION_MS, 1);
      const rawIdx = t * (r.length - 1);
      const idx = Math.max(0, Math.min(Math.floor(rawIdx), r.length - 2));
      const frac = rawIdx - idx;

      const a = r[idx];
      const b = r[idx + 1];
      if (!a || !b) return;

      const pos: LatLng = {
        lat: a.lat + (b.lat - a.lat) * frac,
        lng: a.lng + (b.lng - a.lng) * frac,
      };

      const distToDelivery = haversineDistance(pos, deliveryLocation);
      if (distToDelivery <= 100) setActiveZone('C');
      else if (distToDelivery <= 1000) setActiveZone('B');
      else if (distToDelivery <= 5000) setActiveZone('A');
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
      {GEOFENCE_ZONES.map(zone => (
        <GeofenceCircle
          key={zone.label}
          map={map}
          id={`sim-zone-${zone.label}`}
          center={deliveryLocation}
          radiusMeters={zone.radius}
          color={zone.color}
          fillOpacity={
            activeZone === zone.label.slice(-1)
              ? zone.fillOpacity * 2.5
              : zone.fillOpacity
          }
          strokeOpacity={
            activeZone === zone.label.slice(-1) ? zone.strokeOpacity : zone.strokeOpacity * 0.5
          }
          strokeWeight={activeZone === zone.label.slice(-1) ? 3 : 1.5}
        />
      ))}
      <MapMarker map={map} position={vehiclePosition} type="vehicle" label="🚚" />
      <MapPolyline map={map} id="sim-trail" path={trailPath} color="#3b82f6" strokeWeight={4} />
      <MapMarker map={map} position={pickupLocation} type="pickup" label="📦" />
      <MapMarker map={map} position={deliveryLocation} type="delivery" label="🏠" />
    </>
  );
}

function fallbackWaypoints(start: LatLng, end: LatLng): LatLng[] {
  const waypoints: LatLng[] = [];
  const midLat = (start.lat + end.lat) / 2 + 0.005;
  const midLng = (start.lng + end.lng) / 2 + 0.005;
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    waypoints.push({
      lat: (1 - t) ** 2 * start.lat + 2 * (1 - t) * t * midLat + t ** 2 * end.lat,
      lng: (1 - t) ** 2 * start.lng + 2 * (1 - t) * t * midLng + t ** 2 * end.lng,
    });
  }
  return waypoints;
}
