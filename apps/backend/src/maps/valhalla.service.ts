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

  constructor(private readonly config: ConfigService) {
    this.mapboxToken = this.config.get<string>('MAPBOX_TOKEN', '');
  }

  async getRoute(origin: LatLng, destination: LatLng): Promise<ValhallaRoute | null> {
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_TOKEN not set — routing disabled');
      return null;
    }

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
      return null;
    }
  }

  async getEta(origin: LatLng, destination: LatLng): Promise<number | null> {
    const route = await this.getRoute(origin, destination);
    return route ? route.durationSeconds : null;
  }
}
