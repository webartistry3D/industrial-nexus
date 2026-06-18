'use client';

import { ReactNode } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  children?: ReactNode;
  onLoad?: (map: google.maps.Map) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
};

export function GoogleMapWrapper({ center, zoom, children, onLoad }: GoogleMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-slate-800 h-full w-full">
        <p className="text-red-500 text-sm">Error loading map: {loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-slate-800 h-full w-full">
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={options}
      onLoad={onLoad}
    >
      {children}
    </GoogleMap>
  );
}
