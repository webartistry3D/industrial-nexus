'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { LatLng } from '../types';

export interface GeofencePolygonProps {
  map: mapboxgl.Map;
  id: string;
  path: LatLng[];
  color?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
}

export function GeofencePolygon({
  map,
  id,
  path,
  color = '#3b82f6',
  fillOpacity = 0.1,
  strokeOpacity = 0.8,
}: GeofencePolygonProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  useEffect(() => { mapRef.current = map; }, [map]);

  useEffect(() => {
    if (!map || path.length < 3) return;

    const sourceId = `geofence-polygon-source-${id}`;
    const fillLayerId = `geofence-polygon-fill-${id}`;
    const lineLayerId = `geofence-polygon-line-${id}`;

    const coords: [number, number][] = path.map(p => [p.lng, p.lat]);
    coords.push(coords[0]);

    const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] },
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource(sourceId, { type: 'geojson', data: geojson });

    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: { 'fill-color': color, 'fill-opacity': fillOpacity },
    });

    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': color, 'line-opacity': strokeOpacity, 'line-width': 2 },
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
  }, [map, id, color, fillOpacity, strokeOpacity]);

  return null;
}
