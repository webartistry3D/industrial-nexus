'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MARKER_COLORS, MARKER_EMOJIS } from '../lib/constants';
import type { LatLng, MarkerType } from '../types';

export interface MapMarkerProps {
  map: maplibregl.Map;
  position: LatLng;
  type?: MarkerType;
  label?: string;
  bearing?: number;
  popup?: string;
  onClick?: () => void;
}

export function MapMarker({
  map,
  position,
  type = 'default',
  label,
  bearing = 0,
  popup,
  onClick,
}: MapMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    const color = MARKER_COLORS[type] ?? MARKER_COLORS.default;
    const emoji = label ?? MARKER_EMOJIS[type] ?? '';

    const el = document.createElement('div');
    el.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: ${onClick ? 'pointer' : 'default'};
      transform: rotate(${bearing}deg);
      transition: transform 0.3s ease;
    `;
    el.textContent = emoji;

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    if (type === 'current') {
      el.style.animation = 'none';
      el.classList.add('map-marker-pulse');
    }

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([position.lng, position.lat]);

    if (popup) {
      const p = new maplibregl.Popup({ offset: 20, closeButton: false })
        .setHTML(popup);
      marker.setPopup(p);
      popupRef.current = p;
    }

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      marker.remove();
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, type]);

  useEffect(() => {
    markerRef.current?.setLngLat([position.lng, position.lat]);
  }, [position.lat, position.lng]);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (el) el.style.transform = `rotate(${bearing}deg)`;
  }, [bearing]);

  return null;
}
