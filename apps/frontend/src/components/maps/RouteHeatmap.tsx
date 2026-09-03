'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface TrackingPoint {
  lat: number;
  lng: number;
  speed?: number;
  timestamp: string;
}

interface RouteHeatmapProps {
  map: maplibregl.Map;
  points: TrackingPoint[];
  sourceId?: string;
}

const SOURCE_ID = 'route-heatmap-source';
const LAYER_ID  = 'route-heatmap-layer';
const LINE_LAYER_ID = 'route-heatmap-line';

export function RouteHeatmap({ map, points, sourceId = SOURCE_ID }: RouteHeatmapProps) {
  const addedRef = useRef(false);

  useEffect(() => {
    if (!map || points.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: points.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { speed: p.speed ?? 0, timestamp: p.timestamp },
      })),
    };

    const lineCoords = points.map(p => [p.lng, p.lat]);
    const lineGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: lineCoords },
        properties: {},
      }],
    };

    const addLayers = () => {
      try {
        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
        } else {
          map.addSource(sourceId, { type: 'geojson', data: geojson });
        }

        const lineSourceId = `${sourceId}-line`;
        if (map.getSource(lineSourceId)) {
          (map.getSource(lineSourceId) as maplibregl.GeoJSONSource).setData(lineGeojson);
        } else {
          map.addSource(lineSourceId, { type: 'geojson', data: lineGeojson });
        }

        if (!map.getLayer(LAYER_ID)) {
          map.addLayer({
            id: LAYER_ID,
            type: 'heatmap',
            source: sourceId,
            maxzoom: 18,
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'speed'], 0, 0.2, 80, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 15, 1.5],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0,    'rgba(0,0,255,0)',
                0.2,  'rgba(65,105,225,0.6)',
                0.4,  'rgba(0,255,255,0.7)',
                0.6,  'rgba(0,255,0,0.8)',
                0.8,  'rgba(255,200,0,0.9)',
                1,    'rgba(255,50,0,1)',
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 12, 15, 24],
              'heatmap-opacity': 0.75,
            },
          });
        }

        if (!map.getLayer(LINE_LAYER_ID)) {
          map.addLayer({
            id: LINE_LAYER_ID,
            type: 'line',
            source: lineSourceId,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 2.5,
              'line-opacity': 0.6,
              'line-dasharray': [2, 2],
            },
          });
        }

        addedRef.current = true;

        // Fit map to points
        if (points.length > 1) {
          const lngs = points.map(p => p.lng);
          const lats = points.map(p => p.lat);
          const bounds = new maplibregl.LngLatBounds(
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          );
          map.fitBounds(bounds, { padding: 60, duration: 800 });
        }
      } catch (err) {
        console.error('[RouteHeatmap] Error adding layers:', err);
      }
    };

    if (map.loaded()) {
      addLayers();
    } else {
      map.once('load', addLayers);
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID))     map.removeLayer(LAYER_ID);
        if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
        if (map.getSource(sourceId))    map.removeSource(sourceId);
        if (map.getSource(`${sourceId}-line`)) map.removeSource(`${sourceId}-line`);
      } catch { /* map may already be destroyed */ }
      addedRef.current = false;
    };
  }, [map, points, sourceId]);

  return null;
}
