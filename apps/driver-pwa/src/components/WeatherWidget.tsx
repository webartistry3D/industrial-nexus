'use client';

import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 28,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    location: 'Lagos',
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set current date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, []);

  useEffect(() => {
    // Fetch real weather data from Open-Meteo API
    const fetchWeather = async () => {
      try {
        // Lagos coordinates: 6.5244° N, 3.3792° E
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=6.5244&longitude=3.3792&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto'
        );
        const data = await response.json();
        
        if (data.current) {
          const weatherCode = data.current.weather_code;
          const condition = getWeatherCondition(weatherCode);
          
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            condition: condition,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            location: 'Lagos',
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        // Fallback to default values if API fails
        setWeather({
          temp: 28,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          location: 'Lagos',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherCondition = (code: number): string => {
    // WMO weather code mapping
    if (code === 0) return 'Sunny';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Cloudy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Rainy';
    if (code >= 80 && code <= 82) return 'Rainy';
    if (code >= 95 && code <= 99) return 'Rainy';
    return 'Partly Cloudy';
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-400" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case 'partly cloudy':
        return <Cloud className="w-8 h-8 text-gray-300" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-md p-3 sm:p-4 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-2"></div>
          <div className="h-6 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-md p-3 sm:p-4 text-white">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getWeatherIcon(weather.condition)}
            <span className="text-xl sm:text-2xl font-bold">{weather.temp}°C</span>
          </div>
          <div className="text-xs sm:text-sm text-blue-100 dark:text-blue-200">{weather.condition}</div>
        </div>
        <div className="text-right ml-2">
          <div className="text-[10px] sm:text-xs text-blue-100 dark:text-blue-200">{weather.location}</div>
          <div className="text-[10px] sm:text-xs text-blue-200 dark:text-blue-300">Lagos, Nigeria</div>
        </div>
      </div>
      <div className="text-[10px] sm:text-xs text-blue-100 dark:text-blue-200 mb-2 sm:mb-3 font-medium">
        {currentDate}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 sm:pt-3 border-t border-white/20 dark:border-white/30">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200 dark:text-blue-300" />
          <div>
            <div className="text-[10px] sm:text-xs text-blue-100 dark:text-blue-200">Humidity</div>
            <div className="text-xs sm:text-sm font-semibold">{weather.humidity}%</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200 dark:text-blue-300" />
          <div>
            <div className="text-[10px] sm:text-xs text-blue-100 dark:text-blue-200">Wind</div>
            <div className="text-xs sm:text-sm font-semibold">{weather.windSpeed} km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
