import type { LatLng, Route, ValhallaCosting } from '../types';

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

export async function getRoute(
  origin: LatLng,
  destination: LatLng,
  costing: ValhallaCosting = 'auto',
): Promise<Route> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}/routing/route`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ origin, destination, costing }),
  });

  if (!res.ok) {
    throw new Error(`Routing request failed: ${res.status}`);
  }

  return res.json();
}

export async function getETA(origin: LatLng, destination: LatLng): Promise<number> {
  const route = await getRoute(origin, destination);
  return route.durationSeconds;
}
