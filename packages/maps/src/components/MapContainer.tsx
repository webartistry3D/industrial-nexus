'use client';

import { useRef, useEffect, createContext, useContext, useState, ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../lib/constants';
import type { LatLng } from '../types';

const OSM_RASTER_STYLE: maplibregl.StyleSpecification = {
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

export const MapContext = createContext<maplibregl.Map | null>(null);

export function useMap(): maplibregl.Map | null {
  return useContext(MapContext);
}

export interface MapContainerProps {
  center?: LatLng;
  zoom?: number;
  styleUrl?: string;
  children?: ReactNode;
  onLoad?: (map: maplibregl.Map) => void;
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const centerRef = useRef(center);
  const onLoadRef = useRef(onLoad);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Keep refs in sync without causing map rebuild
  useEffect(() => { centerRef.current = center; }, [center]);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);

  useEffect(() => {
    if (!containerRef.current) return;

    const envStyleUrl = process.env.NEXT_PUBLIC_MAP_TILE_STYLE_URL || undefined;
    const resolvedStyle: maplibregl.StyleSpecification | string =
      styleUrl ?? envStyleUrl ?? OSM_RASTER_STYLE;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolvedStyle,
      center: [centerRef.current.lng, centerRef.current.lat],
      zoom,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
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
