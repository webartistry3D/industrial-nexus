'use client';

import { useRef, useEffect, createContext, useContext, useState, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../lib/constants';
import type { LatLng } from '../types';

// Fallback OSM raster style (used when no Mapbox token is configured)
const OSM_RASTER_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// Mapbox public token (pk.*)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Set the access token once at module load
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export const MapContext = createContext<mapboxgl.Map | null>(null);

export function useMap(): mapboxgl.Map | null {
  return useContext(MapContext);
}

export interface MapContainerProps {
  center?: LatLng;
  zoom?: number;
  styleUrl?: string;
  children?: ReactNode;
  onLoad?: (map: mapboxgl.Map) => void;
  className?: string;
}

export function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl,
  children,
  onLoad,
  className = 'w-full h-full',
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const centerRef = useRef(center);
  const onLoadRef = useRef(onLoad);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  // Keep refs in sync without causing map rebuild
  useEffect(() => { centerRef.current = center; }, [center]);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);

  useEffect(() => {
    if (!containerRef.current) return;

    const envStyleUrl = process.env.NEXT_PUBLIC_MAP_TILE_STYLE_URL || undefined;
    const rawStyleUrl = styleUrl ?? envStyleUrl ?? undefined;

    // If we have a Mapbox token and a mapbox:// style URL, use it directly.
    // mapbox-gl handles mapbox:// URLs natively.
    // Otherwise fall back to OSM raster tiles.
    const style: mapboxgl.StyleSpecification | string =
      rawStyleUrl && MAPBOX_TOKEN ? rawStyleUrl : OSM_RASTER_STYLE;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [centerRef.current.lng, centerRef.current.lat],
      zoom,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right',
    );
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.once('load', () => {
      mapReadyRef.current = true;
      map.resize();
      setMapInstance(map);
      onLoadRef.current?.(map);
    });

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return;
    mapRef.current.easeTo({ center: [center.lng, center.lat], duration: 600 });
  }, [center.lat, center.lng]);

  return (
    <MapContext.Provider value={mapInstance}>
      <div className="relative w-full h-full" style={{ width: '100%', height: '100%' }}>
        <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0 }} />
        {children}
      </div>
    </MapContext.Provider>
  );
}
