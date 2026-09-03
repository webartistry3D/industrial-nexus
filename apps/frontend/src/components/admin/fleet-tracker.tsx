'use client';

import { useEffect, useRef } from 'react';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';

interface FleetTrackerProps {
  onLocationUpdate: (data: { tripId: string; lat: number; lng: number; speed?: number }) => void;
}

export function FleetTracker({ onLocationUpdate }: FleetTrackerProps) {
  const { isConnected, subscribe, unsubscribe } = useTrackingWebSocket();
  const onUpdateRef = useRef(onLocationUpdate);

  useEffect(() => { onUpdateRef.current = onLocationUpdate; }, [onLocationUpdate]);

  useEffect(() => {
    if (!isConnected) return;
    const handleUpdate = (data: any) => {
      if (data?.tripId && data?.lat !== undefined && data?.lng !== undefined) {
        onUpdateRef.current({ tripId: data.tripId, lat: data.lat, lng: data.lng, speed: data.speed });
      }
    };
    subscribe('location:update', handleUpdate);
    return () => { unsubscribe('location:update'); };
  }, [isConnected, subscribe, unsubscribe]);

  return null;
}
