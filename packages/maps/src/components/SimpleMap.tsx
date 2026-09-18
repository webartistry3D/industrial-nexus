"use client";

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SimpleMapProps {
  center?: LatLng;
  zoom?: number;
  className?: string;
  markers?: { id: string; lat: number; lng: number; label?: string }[];
  onLoad?: (map: mapboxgl.Map) => void;
  onMapClick?: (pos: LatLng) => void;
  isSelecting?: boolean;
}

export function SimpleMap({ center = { lat: 6.5244, lng: 3.3792 }, zoom = 12, className = 'w-full h-full', markers = [], onLoad, onMapClick, isSelecting = false }: SimpleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure access token is set if available
    if (!mapboxgl.accessToken && typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_MAPBOX_TOKEN) {
      mapboxgl.accessToken = (window as any).NEXT_PUBLIC_MAPBOX_TOKEN;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

    const onLoadHandler = () => {
      mapRef.current = map;
      setMapReady(true);
      onLoad?.(map);
    };

    map.on('load', onLoadHandler);

    // click handler will be added/removed by a separate effect that watches onMapClick

    return () => { try { map.remove(); } catch {} };
  }, []);

  // Register or unregister click handler when onMapClick changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handler = (e: mapboxgl.MapMouseEvent) => {
      try {
        const lng = (e.lngLat as any).lng as number;
        const lat = (e.lngLat as any).lat as number;
        onMapClick?.({ lat, lng });
      } catch (err) {
        // ignore
      }
    };

    if (onMapClick) {
      map.on('click', handler);
    }

    return () => {
      try { map.off('click', handler); } catch {};
    };
  }, [onMapClick]);

  // Update cursor when selecting mode toggles
  useEffect(() => {
    if (!mapRef.current) return;
    try {
      const canvas = mapRef.current.getCanvas();
      if (canvas && canvas.style) {
        canvas.style.cursor = isSelecting ? 'crosshair' : '';
      }
    } catch {}
  }, [isSelecting]);

  // Update center when prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    try { mapRef.current.setCenter([center.lng, center.lat]); } catch {}
  }, [center]);

  // Render markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const markerObjs: any[] = [];
    for (const m of markers) {
      const el = document.createElement('div');
      el.className = 'simple-marker';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.padding = '6px';
      el.style.borderRadius = '999px';
      el.style.background = 'rgba(59,130,246,0.9)';
      el.style.color = 'white';
      el.style.fontSize = '14px';
      el.style.lineHeight = '1';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.textContent = m.label ?? '•';
      const marker = new (mapboxgl as any).Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
      markerObjs.push(marker);
    }
    return () => { for (const mk of markerObjs) try { mk.remove(); } catch {} };
  }, [mapReady, markers]);

  return <div ref={containerRef} className={className} />;
}

export default SimpleMap;
