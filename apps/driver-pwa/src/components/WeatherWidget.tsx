'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, X, Calendar, MapPin, Thermometer, LocateFixed } from 'lucide-react';

interface LocationCoords {
  lat: number;
  lon: number;
  name: string;
}

const FALLBACK_COORDS: LocationCoords = { lat: 6.502206, lon: 3.305082, name: 'Lagos, Nigeria' };
const SESSION_KEY = 'weather_location_cache';

const PRESET_LOCATIONS: LocationCoords[] = [
  { lat: 6.5244, lon: 3.3792, name: 'Lagos' },
  { lat: 7.1608, lon: 3.3471, name: 'Ogun' },
];

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

interface ForecastDay {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  precipitationProbability: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 28,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    location: FALLBACK_COORDS.name,
  });
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationName, setLocationName] = useState(FALLBACK_COORDS.name);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, []);

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.address?.state_district ||
        data.address?.state ||
        'Unknown';
      const state = data.address?.state ?? '';
      return state && state !== city ? `${city}, ${state}` : city;
    } catch {
      return FALLBACK_COORDS.name;
    }
  };

  const fetchWeatherForCoords = async (coords: LocationCoords) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto`
      );
      const data = await response.json();

      if (data.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition: getWeatherCondition(data.current.weather_code),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          location: coords.name,
        });
        setLocationName(coords.name);
      }

      if (data.daily) {
        const daily = data.daily;
        setForecast(
          daily.time.map((date: string, i: number) => ({
            date,
            dayName: formatDayName(date),
            maxTemp: Math.round(daily.temperature_2m_max[i]),
            minTemp: Math.round(daily.temperature_2m_min[i]),
            condition: getWeatherCondition(daily.weather_code[i]),
            precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initWeather = async () => {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        const coords: LocationCoords = JSON.parse(cached);
        await fetchWeatherForCoords(coords);
        return;
      }

      if (!navigator.geolocation) {
        setUsingFallback(true);
        await fetchWeatherForCoords(FALLBACK_COORDS);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          const name = await reverseGeocode(lat, lon);
          const coords: LocationCoords = { lat, lon, name };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(coords));
          await fetchWeatherForCoords(coords);
        },
        async () => {
          setUsingFallback(true);
          await fetchWeatherForCoords(FALLBACK_COORDS);
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    };

    initWeather();
  }, []);

  const switchToPreset = async (preset: LocationCoords) => {
    setIsSwitching(true);
    setActivePreset(preset.name);
    setUsingFallback(false);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(preset));
    await fetchWeatherForCoords(preset);
    setIsSwitching(false);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsModalOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, handleKeyDown]);

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Sunny';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Cloudy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Rainy';
    if (code >= 80 && code <= 82) return 'Rainy';
    if (code >= 95 && code <= 99) return 'Rainy';
    return 'Partly Cloudy';
  };

  const formatDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getWeatherIcon = (condition: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-5 h-5',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
    };
    const className = sizeClasses[size];
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className={`${className} text-yellow-400`} />;
      case 'cloudy':
        return <Cloud className={`${className} text-gray-400`} />;
      case 'rainy':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'partly cloudy':
        return <Cloud className={`${className} text-gray-300`} />;
      default:
        return <Sun className={`${className} text-yellow-400`} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-600 dark:from-blue-600 dark:to-blue-600 rounded-lg shadow-md p-3 sm:p-4 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-2"></div>
          <div className="h-6 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left bg-gradient-to-br from-blue-600 to-blue-600 dark:from-blue-600 dark:to-blue-600 rounded-lg shadow-md p-3 sm:p-4 text-white cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Open weather forecast details"
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getWeatherIcon(weather.condition)}
              <span className="text-xl sm:text-2xl font-bold">{weather.temp}°C</span>
            </div>
            <div className="text-xs sm:text-sm text-blue-100 dark:text-blue-200">{weather.condition}</div>
          </div>
        </div>
        <div className="text-[10px] sm:text-xs text-blue-100 dark:text-blue-200 mb-2 sm:mb-3 font-medium">
          {locationName}
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
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Weather forecast"
        >
          <div
            className="relative w-full max-w-4xl max-h-[80vh] md:max-h-[70vh] lg:max-h-[60vh] overflow-y-auto md:overflow-hidden lg:overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-600 p-3 text-white rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 dark:text-blue-200 text-sm mb-1">
                    <LocateFixed className="w-4 h-4" />
                    <span>{locationName}</span>
                    {usingFallback && (
                      <span className="text-[10px] text-blue-300/80 font-normal">(default)</span>
                    )}
                  </div>
                  <div className="text-xs text-blue-200 dark:text-blue-300">{currentDate}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Close weather forecast"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {isSwitching ? (
                <div className="animate-pulse mt-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20"></div>
                    <div className="space-y-2">
                      <div className="h-8 w-24 bg-white/20 rounded"></div>
                      <div className="h-4 w-20 bg-white/20 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/10 rounded-lg p-2 h-16"></div>
                    <div className="bg-white/10 rounded-lg p-2 h-16"></div>
                    <div className="bg-white/10 rounded-lg p-2 h-16"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    {getWeatherIcon(weather.condition, 'lg')}
                    <div className="text-center">
                      <div className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {weather.temp}°C
                      </div>
                      <div className="text-lg text-blue-100 dark:text-blue-200">{weather.condition}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-2 text-center">
                      <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-100 dark:text-blue-200" />
                      <div className="text-xs text-blue-100 dark:text-blue-200">Humidity</div>
                      <div className="text-sm font-semibold">{weather.humidity}%</div>
                    </div>
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-2 text-center">
                      <Wind className="w-5 h-5 mx-auto mb-1 text-blue-100 dark:text-blue-200" />
                      <div className="text-xs text-blue-100 dark:text-blue-200">Wind</div>
                      <div className="text-sm font-semibold">{weather.windSpeed} km/h</div>
                    </div>
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-2 text-center">
                      <Thermometer className="w-5 h-5 mx-auto mb-1 text-blue-100 dark:text-blue-200" />
                      <div className="text-xs text-blue-100 dark:text-blue-200">Feels Like</div>
                      <div className="text-sm font-semibold">{weather.temp}°C</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7-Day Forecast</h3>
                </div>
                <div className="flex items-center gap-2">
                  {PRESET_LOCATIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => switchToPreset(preset)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        activePreset === preset.name || locationName === preset.name
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {isSwitching ? (
                <div className="animate-pulse flex md:grid md:grid-cols-7 gap-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 md:flex-1 bg-gray-100 dark:bg-slate-800 rounded-lg min-w-[90px] md:min-w-0 h-28"></div>
                  ))}
                </div>
              ) : forecast.length > 0 ? (
                <div className="flex md:grid md:grid-cols-7 overflow-x-auto md:overflow-hidden gap-3 pb-2 md:pb-0 -mx-2 md:mx-0 px-2 md:px-0">
                  {forecast.map((day, index) => (
                    <div
                      key={day.date}
                      className={`flex-shrink-0 md:flex-1 flex flex-col items-center justify-between p-3 rounded-lg min-w-[90px] md:min-w-0 ${
                        index === 0
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'bg-gray-50 dark:bg-slate-800/50'
                      } transition-colors`}
                    >
                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        {day.dayName}
                      </div>
                      {getWeatherIcon(day.condition, 'sm')}
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 mb-2 line-clamp-1">
                        {day.condition}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {day.maxTemp}°
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {day.minTemp}°
                      </div>
                      {day.precipitationProbability > 0 && (
                        <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">
                          {day.precipitationProbability}% rain
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Forecast data unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
