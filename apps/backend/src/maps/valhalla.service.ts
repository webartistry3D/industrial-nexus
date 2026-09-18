import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ValhallaRoute {
  polyline: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

@Injectable()
export class ValhallaService {
  private readonly logger = new Logger(ValhallaService.name);
  private readonly mapboxToken: string;
  private readonly baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
  private readonly avgSpeedKmh: number;

  constructor(private readonly config: ConfigService) {
    this.mapboxToken = this.config.get<string>('MAPBOX_TOKEN', '');
    // average speed used when Mapbox directions are not available (km/h)
    this.avgSpeedKmh = Number(this.config.get<number>('MAPBOX_AVG_SPEED_KMH', 40)) || 40;
  }

  async getRoute(origin: LatLng, destination: LatLng): Promise<ValhallaRoute | null> {
    // Prefer Mapbox if token is configured
    if (this.mapboxToken) {
      try {
        const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
        const { data } = await axios.get(
          `${this.baseUrl}/driving/${coords}`,
          {
            params: {
              access_token: this.mapboxToken,
              geometries: 'geojson',
              overview: 'full',
            },
            timeout: 10000,
          },
        );

        const route = data.routes?.[0];
        if (!route) return null;

        const coordsArray = route.geometry.coordinates as [number, number][];
        const polyline: LatLng[] = coordsArray.map(([lng, lat]) => ({ lat, lng }));

        return {
          polyline,
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
        };
      } catch (err: any) {
        this.logger.warn(`Mapbox directions failed: ${err.message}`);
        // fall through to approximate fallback
      }
    } else {
      this.logger.warn('MAPBOX_TOKEN not set — using approximate ETA fallback');
    }

    // Fallback: estimate distance using Haversine and an average speed
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(destination.lat - origin.lat);
    const dLon = toRad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    const speedMps = (this.avgSpeedKmh * 1000) / 3600; // km/h -> m/s
    const durationSeconds = speedMps > 0 ? Math.max(30, Math.round(distanceMeters / speedMps)) : 0;

    const polyline: LatLng[] = [origin, destination];

    return {
      polyline,
      distanceMeters,
      durationSeconds,
    };
  }

  async getEta(origin: LatLng, destination: LatLng): Promise<number | null> {
    const route = await this.getRoute(origin, destination);
    return route ? route.durationSeconds : null;
  }
}
