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

  useEffect(() => {
    // Simulate weather data (in production, integrate with real weather API)
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 10) + 25;
    
    setTimeout(() => {
      setWeather({
        temp: randomTemp,
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        location: 'Lagos',
      });
      setLoading(false);
    }, 500);
  }, []);

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
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-md p-4 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-2"></div>
          <div className="h-6 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-md p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {getWeatherIcon(weather.condition)}
            <span className="text-2xl font-bold">{weather.temp}°C</span>
          </div>
          <div className="text-sm text-blue-100 dark:text-blue-200">{weather.condition}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-blue-100 dark:text-blue-200">{weather.location}</div>
          <div className="text-xs text-blue-200 dark:text-blue-300">Lagos, Nigeria</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/20 dark:border-white/30">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-200 dark:text-blue-300" />
          <div>
            <div className="text-xs text-blue-100 dark:text-blue-200">Humidity</div>
            <div className="text-sm font-semibold">{weather.humidity}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-200 dark:text-blue-300" />
          <div>
            <div className="text-xs text-blue-100 dark:text-blue-200">Wind</div>
            <div className="text-sm font-semibold">{weather.windSpeed} km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
