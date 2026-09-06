import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  address: string;
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly mapboxToken: string;
  private readonly baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private readonly config: ConfigService) {
    this.mapboxToken = this.config.get<string>('MAPBOX_TOKEN', '');
  }

  async search(query: string, countryCode = 'ng', limit = 5): Promise<GeocodingResult[]> {
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_TOKEN not set — geocoding disabled');
      return [];
    }

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            limit,
            country: countryCode,
            autocomplete: true,
          },
          timeout: 8000,
        },
      );

      return (data.features as any[]).map((feature) => ({
        placeId: feature.id,
        displayName: feature.place_name,
        address: feature.place_name,
        lat: feature.center[1],
        lng: feature.center[0],
      }));
    } catch (err: any) {
      this.logger.warn(`Mapbox geocoding failed: ${err.message}`);
      return [];
    }
  }

  async reverse(lat: number, lng: number): Promise<GeocodingResult | null> {
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_TOKEN not set — reverse geocoding disabled');
      return null;
    }

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/${lng},${lat}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            limit: 1,
          },
          timeout: 8000,
        },
      );

      const feature = data.features?.[0];
      if (!feature) return null;

      return {
        placeId: feature.id,
        displayName: feature.place_name,
        address: feature.place_name,
        lat: feature.center[1],
        lng: feature.center[0],
      };
    } catch (err: any) {
      this.logger.warn(`Mapbox reverse geocoding failed: ${err.message}`);
      return null;
    }
  }
}
