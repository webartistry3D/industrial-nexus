'use client';

import { useState, useRef, useEffect } from 'react';
import { searchAddress } from '../lib/geocoding';
import type { GeocodingResult } from '../types';

export interface AddressSearchProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder: string;
  label: string;
  iconColor?: string;
  country?: string;
}

export function AddressSearch({
  value,
  onChange,
  placeholder,
  label,
  iconColor = 'text-gray-400',
  country,
}: AddressSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<GeocodingResult[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (v.length > 2) {
      debounceRef.current = setTimeout(async () => {
        const results = await searchAddress(v, country);
        setPredictions(results);
        setShowPredictions(results.length > 0);
      }, 300);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSelect = (result: GeocodingResult) => {
    setInputValue(result.address);
    onChange(result.address, result.lat, result.lng);
    setPredictions([]);
    setShowPredictions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowPredictions(false), 200);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => inputValue.length > 2 && setShowPredictions(predictions.length > 0)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required
        />
        {showPredictions && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {predictions.map(p => (
              <button
                key={p.placeId}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-sm"
              >
                <div className="font-medium">{p.displayName}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{p.address}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
