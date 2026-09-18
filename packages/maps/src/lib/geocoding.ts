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

const PUBLIC_MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

async function callMapboxDirect(query: string, country: string, limit = 5): Promise<GeocodingResult[]> {
  if (!PUBLIC_MAPBOX) return [];
  const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(PUBLIC_MAPBOX)}&autocomplete=true&limit=${limit}&country=${encodeURIComponent(country)}`;
  try {
    const r = await fetch(mbUrl);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.features as any[]).map((feature) => ({
      placeId: feature.id,
      displayName: feature.place_name,
      address: feature.place_name,
      lat: feature.center[1],
      lng: feature.center[0],
    }));
  } catch {
    return [];
  }
}

export async function searchAddress(
  query: string,
  country?: string,
  token?: string | null,
): Promise<GeocodingResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const c = country ?? process.env.NEXT_PUBLIC_GEOCODE_COUNTRY ?? 'ng';

  // If we have an access token (JWT), prefer the backend proxy so the server-side MAPBOX_TOKEN is used.
  const resolvedToken = token ?? getToken();
  if (resolvedToken) {
    const url = `${baseUrl}/maps/geocode?q=${encodeURIComponent(query)}&country=${c}`;
    try {
      const res = await fetch(url, { headers: buildHeaders(token) });
      if (res.status === 401) {
        // Backend requires auth but token rejected — fallback to direct Mapbox
        return callMapboxDirect(query, c);
      }
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  // No JWT available — fall back to calling Mapbox directly from the browser if public token exists
  return callMapboxDirect(query, c);
}

export async function reverseGeocode(lat: number, lng: number, token?: string | null): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const resolvedToken = token ?? getToken();

  if (resolvedToken) {
    const url = `${baseUrl}/maps/reverse-geocode?lat=${lat}&lng=${lng}`;
    try {
      const res = await fetch(url, { headers: buildHeaders(token) });
      if (!res.ok) return '';
      const data = await res.json();
      return data.address ?? '';
    } catch {
      return '';
    }
  }

  // Fallback to Mapbox direct reverse geocode when no JWT
  if (!PUBLIC_MAPBOX) return '';
  const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(PUBLIC_MAPBOX)}&limit=1`;
  try {
    const r = await fetch(mbUrl);
    if (!r.ok) return '';
    const data = await r.json();
    const feature = data.features?.[0];
    if (!feature) return '';
    return feature.place_name ?? '';
  } catch {
    return '';
  }
}
