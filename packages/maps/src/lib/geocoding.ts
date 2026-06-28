import type { GeocodingResult } from '../types';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

const buildHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function searchAddress(
  query: string,
  country?: string,
): Promise<GeocodingResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const c = country ?? process.env.NEXT_PUBLIC_GEOCODE_COUNTRY ?? 'ng';
  const url = `${baseUrl}/geocoding/search?q=${encodeURIComponent(query)}&country=${c}`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const url = `${baseUrl}/geocoding/reverse?lat=${lat}&lng=${lng}`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) return '';
  const data = await res.json();
  return data.address ?? '';
}
