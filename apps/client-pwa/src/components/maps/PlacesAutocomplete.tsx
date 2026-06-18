'use client';

import { useState, useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

// Static libraries array to prevent unnecessary reloading
const LIBRARIES: ('places')[] = ['places'];

interface PlacesAutocompleteProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder: string;
  label: string;
  iconColor?: string;
}

export function PlacesAutocomplete({ value, onChange, placeholder, label, iconColor = 'text-gray-400' }: PlacesAutocompleteProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'NG' }, // Restrict to Nigeria, can be changed
          sessionToken: sessionToken.current,
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Suppress the deprecation warning for now as AutocompleteSuggestion is not fully available
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('AutocompleteService')) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const handlePlaceSelect = async (placeId: string) => {
    if (!sessionToken.current) return;

    try {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['formatted_address', 'geometry', 'name'],
        sessionToken: sessionToken.current,
      };

      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      
      placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const address = place.formatted_address || '';
          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;
          
          setInputValue(address);
          onChange(address, lat, lng);
          setPredictions([]);
          setShowPredictions(false);
          
          // Generate new session token for next request
          sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleBlur = () => {
    // Delay hiding predictions to allow click events to fire
    setTimeout(() => setShowPredictions(false), 200);
  };

  if (!isLoaded) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            readOnly
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white cursor-not-allowed"
            placeholder="Loading..."
          />
          <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${iconColor}`} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => inputValue.length > 2 && setShowPredictions(true)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required
        />
        {showPredictions && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handlePlaceSelect(prediction.place_id)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-sm"
              >
                <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
