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
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('VALHALLA_URL', 'http://localhost:8002');
  }

  async getRoute(origin: LatLng, destination: LatLng): Promise<ValhallaRoute | null> {
    try {
      const body = {
        locations: [
          { lon: origin.lng, lat: origin.lat, type: 'break' },
          { lon: destination.lng, lat: destination.lat, type: 'break' },
        ],
        costing: 'auto',
        directions_options: { units: 'kilometers' },
        shape_format: 'geojson',
      };

      const { data } = await axios.post(`${this.baseUrl}/route`, body, { timeout: 10000 });

      const leg = data?.trip?.legs?.[0];
      if (!leg) return null;

      const coords: LatLng[] = (leg.shape as [number, number][]).map(([lng, lat]) => ({ lat, lng }));

      const summary = data.trip.summary;
      return {
        polyline: coords,
        distanceMeters: Math.round((summary.length ?? 0) * 1000),
        durationSeconds: Math.round(summary.time ?? 0),
      };
    } catch (err: any) {
      this.logger.warn(`Valhalla route failed: ${err.message}`);
      return null;
    }
  }

  async getEta(origin: LatLng, destination: LatLng): Promise<number | null> {
    const route = await this.getRoute(origin, destination);
    return route ? route.durationSeconds : null;
  }
}
