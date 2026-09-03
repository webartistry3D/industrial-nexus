'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { offlineDB } from '@/lib/db';

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UseLocationTrackingOptions {
  tripId: string;
  enabled: boolean;
  interval?: number; // milliseconds
}

export function useLocationTracking({ tripId, enabled, interval = 30000 }: UseLocationTrackingOptions) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationRef = useRef<Location | null>(null);

  // Send location update to backend
  const sendLocationUpdate = useCallback(async (loc: Location) => {
    try {
      await api.updateLocation(tripId, loc.lat, loc.lng, loc.accuracy);
    } catch (error) {
      console.error('Failed to send location, queueing for sync:', error);
      // Queue for offline sync
      await offlineDB.queueAction({
        type: 'LOCATION_UPDATE',
        tripId,
        data: loc,
      });
    }
  }, [tripId]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Use watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        locationRef.current = newLocation;
        setLocation(newLocation);
        
        // Send to backend
        sendLocationUpdate(newLocation);
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // 30 seconds cache
      }
    );

    // Backup interval for battery optimization
    // Send updates even if position hasn't changed significantly
    intervalRef.current = setInterval(() => {
      if (locationRef.current) {
        sendLocationUpdate(locationRef.current);
      }
    }, interval);

  }, [interval, sendLocationUpdate]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(async (): Promise<Location | null> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          setLocation(loc);
          resolve(loc);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
