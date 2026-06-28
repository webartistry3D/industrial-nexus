'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { LatLng } from '../types';

const AUTO_COLOR_MAP: [number, string][] = [
  [100, '#22c55e'],
  [1000, '#f97316'],
  [5000, '#eab308'],
];

function resolveColor(radiusMeters: number, override?: string): string {
  if (override) return override;
  for (const [threshold, color] of AUTO_COLOR_MAP) {
    if (radiusMeters <= threshold) return color;
  }
  return '#3b82f6';
}

function circleGeoJSON(
  center: LatLng,
  radiusMeters: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = (radiusMeters / 111320) * Math.cos(angle);
    const dy = (radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([center.lng + dy, center.lat + dx]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

export interface GeofenceCircleProps {
  map: maplibregl.Map;
  id: string;
  center: LatLng;
  radiusMeters: number;
  color?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
  strokeWeight?: number;
}

export function GeofenceCircle({
  map,
  id,
  center,
  radiusMeters,
  color,
  fillOpacity = 0.1,
  strokeOpacity = 0.8,
  strokeWeight = 2,
}: GeofenceCircleProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const resolvedColor = resolveColor(radiusMeters, color);
    const sourceId = `geofence-circle-source-${id}`;
    const fillLayerId = `geofence-circle-fill-${id}`;
    const lineLayerId = `geofence-circle-line-${id}`;

    const geojson = circleGeoJSON(center, radiusMeters);

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource(sourceId, { type: 'geojson', data: geojson });

    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: { 'fill-color': resolvedColor, 'fill-opacity': fillOpacity },
    });

    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': resolvedColor,
        'line-opacity': strokeOpacity,
        'line-width': strokeWeight,
      },
    });

    return () => {
      const m = mapRef.current;
      if (!m) return;
      try {
        if (m.getLayer(lineLayerId)) m.removeLayer(lineLayerId);
        if (m.getLayer(fillLayerId)) m.removeLayer(fillLayerId);
        if (m.getSource(sourceId)) m.removeSource(sourceId);
      } catch {
        // map was already destroyed — nothing to clean up
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, id, radiusMeters, color, fillOpacity, strokeOpacity, strokeWeight]);

  return null;
}
