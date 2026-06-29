import type { GeocodingResult } from '../types';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const buildHeaders = (token?: string | null): HeadersInit => {
  const resolvedToken = token ?? getToken();
  return {
    'Content-Type': 'application/json',
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
  };
};

export async function searchAddress(
  query: string,
  country?: string,
  token?: string | null,
): Promise<GeocodingResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const c = country ?? process.env.NEXT_PUBLIC_GEOCODE_COUNTRY ?? 'ng';
  const url = `${baseUrl}/maps/geocode?q=${encodeURIComponent(query)}&country=${c}`;
  const res = await fetch(url, { headers: buildHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function reverseGeocode(lat: number, lng: number, token?: string | null): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const url = `${baseUrl}/maps/reverse-geocode?lat=${lat}&lng=${lng}`;
  const res = await fetch(url, { headers: buildHeaders(token) });
  if (!res.ok) return '';
  const data = await res.json();
  return data.address ?? '';
}
