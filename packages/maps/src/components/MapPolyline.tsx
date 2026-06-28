'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { LatLng } from '../types';

export interface MapPolylineProps {
  map: maplibregl.Map;
  id: string;
  path: LatLng[];
  color?: string;
  strokeWeight?: number;
  dashed?: boolean;
  opacity?: number;
}

export function MapPolyline({
  map,
  id,
  path,
  color = '#3b82f6',
  strokeWeight = 3,
  dashed = false,
  opacity = 1,
}: MapPolylineProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  useEffect(() => { mapRef.current = map; }, [map]);

  useEffect(() => {
    if (!map || path.length < 2) return;

    const sourceId = `polyline-source-${id}`;
    const layerId = `polyline-layer-${id}`;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: path.map(p => [p.lng, p.lat]),
      },
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource(sourceId, { type: 'geojson', data: geojson });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': color,
        'line-width': strokeWeight,
        'line-opacity': opacity,
        ...(dashed ? { 'line-dasharray': [4, 2] } : {}),
      },
    });

    return () => {
      const m = mapRef.current;
      if (!m) return;
      try {
        if (m.getLayer(layerId)) m.removeLayer(layerId);
        if (m.getSource(sourceId)) m.removeSource(sourceId);
      } catch {
        // map was already destroyed — nothing to clean up
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, id, color, strokeWeight, dashed, opacity]);

  useEffect(() => {
    if (!map || path.length < 2) return;
    const sourceId = `polyline-source-${id}`;
    try {
      if (!map.getSource(sourceId)) return;
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: path.map(p => [p.lng, p.lat]),
        },
      };
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } catch {
      // map was already destroyed
    }
  }, [map, id, path]);

  return null;
}
