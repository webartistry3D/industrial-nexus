'use client';

import { Trip } from '@/types';
import { Truck, MapPin, Clock } from 'lucide-react';

interface TripsOverviewProps {
  trips: Trip[];
  loading?: boolean;
  onTripClick?: (tripId: string) => void;
  liveLocations?: Map<string, { lat: number; lng: number; speed?: number }>;
}

function calculateProgress(trip: Trip): number {
  if (!trip.startedAt) return 0;
  if (trip.status === 'DELIVERED') return 100;
  if (trip.status === 'ARRIVED') return 90;
  
  const startTime = new Date(trip.startedAt).getTime();
  const now = Date.now();
  const elapsed = now - startTime;
  const totalEstimated = 4 * 60 * 60 * 1000; // 4 hours estimate
  
  return Math.min(Math.round((elapsed / totalEstimated) * 100), 85);
}

function calculateDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function formatDynamicETA(
  trip: Trip,
  liveLocation?: { lat: number; lng: number; speed?: number }
): string {
  if (trip.status === 'DELIVERED') return 'Completed';
  if (trip.status === 'ARRIVED') return 'At destination';
  
  // If we have live location, calculate dynamic ETA
  if (liveLocation && trip.order?.deliveryLocation) {
    const currentPos = { lat: liveLocation.lat, lng: liveLocation.lng };
    const deliveryPos = {
      lat: trip.order.deliveryLocation.lat,
      lng: trip.order.deliveryLocation.lng,
    };
    
    const remainingDistance = calculateDistance(currentPos, deliveryPos); // meters
    const speed = liveLocation.speed || 30; // Default to 30 km/h if no speed data
    const speedMetersPerMin = (speed * 1000) / 60; // Convert km/h to meters/min
    
    if (speedMetersPerMin > 0) {
      const remainingMinutes = Math.ceil(remainingDistance / speedMetersPerMin);
      
      if (remainingMinutes < 0) return 'Arriving';
      if (remainingMinutes < 1) return '< 1 min';
      if (remainingMinutes < 60) return `${remainingMinutes} min`;
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  }
  
  // Fallback to static ETA
  if (trip.eta) {
    const etaDate = new Date(trip.eta);
    const now = new Date();
    const diffMs = etaDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 0) return 'Overdue';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }
  return 'Calculating...';
}

function getDriverName(trip: Trip): string {
  if (trip.driver?.user) {
    return `${trip.driver.user.firstName} ${trip.driver.user.lastName}`;
  }
  return 'Unassigned';
}

function getVehicleInfo(trip: Trip): string {
  return trip.vehicle?.plateNumber || 'No vehicle';
}

function getLocation(trip: Trip): string {
  if (trip.status === 'ARRIVED') return 'At destination';
  if (trip.status === 'IN_TRANSIT') return 'En route';
  return 'At pickup location';
}

export function TripsOverview({ trips, loading = false, onTripClick, liveLocations }: TripsOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Active Trips</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-white">Active Trips</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{trips.length} trips</span>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active trips</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const hasValidTripId = trip.id && trip.id !== 'null' && trip.id !== 'undefined';
            const liveLocation = liveLocations?.get(trip.id);
            return (
            <div 
                key={trip.id || 'unknown'}
                onClick={() => hasValidTripId && onTripClick?.(trip.id)}
                className={`border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-700/30 ${hasValidTripId && onTripClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-900 dark:text-white">{trip.order?.orderNumber || String(trip.id)}</span>
              <span className={`status-badge ${
                trip.status === 'IN_TRANSIT' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 
                trip.status === 'ASSIGNED' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                trip.status === 'ARRIVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}>
                {trip.status?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Truck className="w-4 h-4" />
                <span>{getDriverName(trip)} • {getVehicleInfo(trip)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{getLocation(trip)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>ETA: {formatDynamicETA(trip, liveLocation)}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${calculateProgress(trip)}%` }}
                />
              </div>
            </div>
          </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
