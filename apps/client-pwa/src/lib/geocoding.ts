interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
}

/**
 * Geocode an address using OpenStreetMap/Nominatim API (free, no API key required)
 * This is used as a fallback when Google Maps autocomplete is not available
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Industrial-Nexus-Client-Portal', // Required by Nominatim API
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }
      
      return {
        lat,
        lng,
        address: result.display_name || address,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
