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
      // If Mapbox rejects the token (401) or otherwise fails, fallback to Nominatim
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        this.logger.warn('Falling back to Nominatim due to Mapbox auth failure');
        try {
          const nominatimUrl = this.config.get<string>('NOMINATIM_URL', 'https://nominatim.openstreetmap.org');
          const r = await axios.get(`${nominatimUrl}/search`, {
            params: {
              q: query,
              format: 'json',
              limit,
              countrycodes: countryCode,
              addressdetails: 1,
            },
            timeout: 8000,
            headers: { 'User-Agent': 'industrial-nexus' },
          });
          const features = r.data as any[];
          return features.map((f) => ({
            placeId: f.place_id?.toString() ?? `${f.lat},${f.lon}`,
            displayName: f.display_name,
            address: f.display_name,
            lat: parseFloat(f.lat),
            lng: parseFloat(f.lon),
          }));
        } catch (e) {
          this.logger.warn(`Nominatim fallback failed: ${e?.message ?? e}`);
        }
      }
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
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        this.logger.warn('Falling back to Nominatim reverse geocode due to Mapbox auth failure');
        try {
          const nominatimUrl = this.config.get<string>('NOMINATIM_URL', 'https://nominatim.openstreetmap.org');
          const r = await axios.get(`${nominatimUrl}/reverse`, {
            params: {
              lat,
              lon: lng,
              format: 'json',
            },
            timeout: 8000,
            headers: { 'User-Agent': 'industrial-nexus' },
          });
          const feature = r.data;
          if (!feature) return null;
          return {
            placeId: feature.place_id?.toString() ?? `${lat},${lng}`,
            displayName: feature.display_name,
            address: feature.display_name,
            lat: parseFloat(feature.lat ?? lat),
            lng: parseFloat(feature.lon ?? lng),
          };
        } catch (e) {
          this.logger.warn(`Nominatim reverse fallback failed: ${e?.message ?? e}`);
        }
      }
      return null;
    }
  }
}
