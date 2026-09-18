import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export interface SimpleMarkerProps {
  map: mapboxgl.Map;
  lng: number;
  lat: number;
  label?: string;
}

export function SimpleMarker({ map, lng, lat, label }: SimpleMarkerProps) {
  useEffect(() => {
    if (!map) return;
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
    el.textContent = label ?? '•';

    const marker = new (mapboxgl as any).Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

    return () => {
      try { marker.remove(); } catch {}
      try { el.remove(); } catch {}
    };
  }, [map, lng, lat, label]);

  return null;
}

export default SimpleMarker;
