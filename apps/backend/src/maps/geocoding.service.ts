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
  private readonly nominatimUrl: string;

  constructor(private readonly config: ConfigService) {
    this.nominatimUrl = this.config.get<string>('NOMINATIM_URL', 'https://nominatim.openstreetmap.org');
  }

  async search(query: string, countryCode = 'ng', limit = 5): Promise<GeocodingResult[]> {
    try {
      const { data } = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: query,
          format: 'jsonv2',
          addressdetails: 1,
          limit,
          countrycodes: countryCode,
        },
        headers: { 'User-Agent': 'IndustrialNexus/1.0' },
        timeout: 8000,
      });

      return (data as any[]).map((item) => ({
        placeId: String(item.place_id),
        displayName: item.display_name,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    } catch (err: any) {
      this.logger.warn(`Nominatim search failed: ${err.message}`);
      return [];
    }
  }

  async reverse(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const { data } = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: { lat, lon: lng, format: 'jsonv2' },
        headers: { 'User-Agent': 'IndustrialNexus/1.0' },
        timeout: 8000,
      });

      return {
        placeId: String(data.place_id),
        displayName: data.display_name,
        address: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
      };
    } catch (err: any) {
      this.logger.warn(`Nominatim reverse failed: ${err.message}`);
      return null;
    }
  }
}
