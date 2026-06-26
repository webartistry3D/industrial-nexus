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
    console.log('Geocoding address:', address);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Industrial-Nexus-Admin-Portal', // Required by Nominatim API
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed with status:', response.status);
      throw new Error(`Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates returned:', result);
        return null;
      }
      
      console.log('Geocoding successful:', { lat, lng, address: result.display_name });
      return {
        lat,
        lng,
        address: result.display_name || address,
      };
    }

    console.log('No results found for address:', address);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
