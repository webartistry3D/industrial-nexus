'use client';

import { useRef, useEffect, createContext, useContext, useState, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../lib/constants';
import type { LatLng, StandardConfig, BuildingHighlight, LightPreset } from '../types';

// Fallback OSM raster style (used when no Mapbox token is configured)
const OSM_RASTER_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// Mapbox public token (pk.*)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Set the access token once at module load
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// Mapbox Standard style URLs
const STANDARD_STYLE = 'mapbox://styles/mapbox/standard';
const STANDARD_SATELLITE_STYLE = 'mapbox://styles/mapbox/standard-satellite';

export const MapContext = createContext<mapboxgl.Map | null>(null);

export function useMap(): mapboxgl.Map | null {
  return useContext(MapContext);
}

export interface MapContainerProps {
  center?: LatLng;
  zoom?: number;
  styleUrl?: string;
  /** Toggle satellite imagery base layer (uses Standard Satellite style) */
  satellite?: boolean;
  /** Mapbox Standard configuration (lightPreset, 3D buildings, labels, etc.) */
  config?: StandardConfig;
  /** Buildings to highlight using Standard featuresets */
  highlightBuildings?: BuildingHighlight[];
  /** When true, disable advanced features (DEM, settings panel, building highlights) */
  minimal?: boolean;
  children?: ReactNode;
  onLoad?: (map: mapboxgl.Map) => void;
  className?: string;
}

/** Apply Mapbox Standard config properties at runtime */
function applyStandardConfig(map: mapboxgl.Map, config: StandardConfig) {
  const props: Record<string, unknown> = {
    lightPreset: config.lightPreset,
    show3dBuildings: config.show3dBuildings,
    show3dTrees: config.show3dTrees,
    show3dLandmarks: config.show3dLandmarks,
    showRoadLabels: config.showRoadLabels,
    showPointOfInterestLabels: config.showPointOfInterestLabels,
    showPlaceLabels: config.showPlaceLabels,
    showTransitLabels: config.showTransitLabels,
    showPedestrianRoads: config.showPedestrianRoads,
  };
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      try { (map as any).setConfigProperty('basemap', key, value); } catch { /* classic style */ }
    }
  }
}

/** Highlight buildings using Standard featuresets */
function highlightBuildingsOnMap(
  map: mapboxgl.Map,
  buildings: BuildingHighlight[],
  prevHighlighted: { id: string | number; state: string }[],
) {
  for (const prev of prevHighlighted) {
    try { (map as any).setFeatureState({ source: 'composite', sourceLayer: 'building', id: prev.id }, { [prev.state]: false }); } catch { /* */ }
  }
  const newHighlighted: { id: string | number; state: string }[] = [];
  for (const building of buildings) {
    const state = building.state ?? 'select';
    const features = map.queryRenderedFeatures([building.lng, building.lat], { layers: ['building'] });
    for (const feature of features) {
      const id = feature.id;
      if (id === undefined || id === null) continue;
      try {
        (map as any).setFeatureState({ source: 'composite', sourceLayer: 'building', id }, { [state]: true });
        newHighlighted.push({ id: id as string | number, state });
      } catch { /* */ }
    }
  }
  return newHighlighted;
}

// ─── Settings Panel (gear icon + toggles) ───────────────────────────

interface SettingsState {
  satellite: boolean;
  show3dView: boolean;       // 3D terrain + pitch
  show3dBuildings: boolean;
  show3dTrees: boolean;
  show3dLandmarks: boolean;
  roadLabels: boolean;
  poiLabels: boolean;
  placeLabels: boolean;
  transitLabels: boolean;
  pedestrianRoads: boolean;
  lightPreset: LightPreset;
}

function MapSettingsPanel({
  state,
  onChange,
  hasToken,
  minimal,
}: {
  state: SettingsState;
  onChange: (patch: Partial<SettingsState>) => void;
  hasToken: boolean;
  minimal?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Hide settings when no token or when in minimal mode
  if (!hasToken || minimal) return null; // no settings for OSM fallback or minimal usage

  const Toggle = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
    >
      <span>{label}</span>
      <span
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
        style={{ backgroundColor: checked ? '#3b82f6' : '#cbd5e1' }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  );

  return (
    <div className="absolute right-2 top-12 z-20">
      {/* Click-away backdrop */}
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      {/* Slide-in tray */}
      <div
        className="absolute right-0 z-20 w-48 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-2 space-y-0.5 transition-transform duration-300 ease-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(calc(100% + 8px))', pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Settings</span>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Base</div>
        <Toggle label="Satellite" checked={state.satellite} onToggle={() => onChange({ satellite: !state.satellite })} />

        <div className="px-3 py-1 mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">3D</div>
        <Toggle label="3D View" checked={state.show3dView} onToggle={() => onChange({ show3dView: !state.show3dView })} />
        <Toggle label="3D Buildings" checked={state.show3dBuildings} onToggle={() => onChange({ show3dBuildings: !state.show3dBuildings })} />
        <Toggle label="3D Trees" checked={state.show3dTrees} onToggle={() => onChange({ show3dTrees: !state.show3dTrees })} />
        <Toggle label="3D Landmarks" checked={state.show3dLandmarks} onToggle={() => onChange({ show3dLandmarks: !state.show3dLandmarks })} />

        <div className="px-3 py-1 mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Labels</div>
        <Toggle label="Road Labels" checked={state.roadLabels} onToggle={() => onChange({ roadLabels: !state.roadLabels })} />
        <Toggle label="POI Labels" checked={state.poiLabels} onToggle={() => onChange({ poiLabels: !state.poiLabels })} />
        <Toggle label="Place Labels" checked={state.placeLabels} onToggle={() => onChange({ placeLabels: !state.placeLabels })} />
        <Toggle label="Transit Labels" checked={state.transitLabels} onToggle={() => onChange({ transitLabels: !state.transitLabels })} />

        <div className="px-3 py-1 mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Other</div>
        <Toggle label="Pedestrian Roads" checked={state.pedestrianRoads} onToggle={() => onChange({ pedestrianRoads: !state.pedestrianRoads })} />

        <div className="px-3 py-2 mt-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Lighting</div>
          <div className="flex gap-1">
            {(['day', 'dusk', 'night', 'dawn'] as LightPreset[]).map(p => (
              <button
                key={p}
                onClick={() => onChange({ lightPreset: p })}
                className={`flex-1 px-1.5 py-1 rounded-md text-[10px] capitalize font-medium transition-colors ${
                  state.lightPreset === p
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center w-9 h-9 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        title="Map settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  styleUrl,
  satellite: satelliteProp = false,
  config,
  highlightBuildings,
  minimal = false,
  children,
  onLoad,
  className = 'w-full h-full',
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const centerRef = useRef(center);
  const onLoadRef = useRef(onLoad);
  const highlightedRef = useRef<{ id: string | number; state: string }[]>([]);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  // Internal settings state — initialized from props, user-controllable via gear panel
  const [settings, setSettings] = useState<SettingsState>({
    satellite: satelliteProp,
    show3dView: true,
    show3dBuildings: config?.show3dBuildings ?? true,
    show3dTrees: config?.show3dTrees ?? true,
    show3dLandmarks: config?.show3dLandmarks ?? true,
    roadLabels: config?.showRoadLabels ?? true,
    poiLabels: config?.showPointOfInterestLabels ?? true,
    placeLabels: config?.showPlaceLabels ?? true,
    transitLabels: config?.showTransitLabels ?? true,
    pedestrianRoads: config?.showPedestrianRoads ?? false,
    lightPreset: config?.lightPreset ?? 'day',
  });

  const updateSettings = (patch: Partial<SettingsState>) => setSettings(s => ({ ...s, ...patch }));

  useEffect(() => { centerRef.current = center; }, [center]);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);

  // Determine the effective style URL
  const envStyleUrl = process.env.NEXT_PUBLIC_MAP_TILE_STYLE_URL || undefined;
  const baseStyleUrl = styleUrl ?? envStyleUrl ?? undefined;
  const effectiveStyleUrl =
    baseStyleUrl && MAPBOX_TOKEN
      ? settings.satellite
        ? STANDARD_SATELLITE_STYLE
        : baseStyleUrl.startsWith('mapbox://styles/mapbox/standard')
          ? baseStyleUrl
          : STANDARD_STYLE
      : undefined;

  useEffect(() => {
    if (!containerRef.current) return;

    const style: mapboxgl.StyleSpecification | string = effectiveStyleUrl ?? OSM_RASTER_STYLE;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [centerRef.current.lng, centerRef.current.lat],
      zoom,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      map.once('load', () => {
      mapReadyRef.current = true;
      map.resize();
      setMapInstance(map);
      // Disable Mapbox telemetry/perf metrics where APIs exist, then add DEM safely
      try {
        if ((mapboxgl as any).setTelemetryEnabled) (mapboxgl as any).setTelemetryEnabled(false);
        if ((mapboxgl as any).setPerformanceMetricsEnabled) (mapboxgl as any).setPerformanceMetricsEnabled(false);
      } catch {}

      // Apply 3D terrain + pitch only when a Mapbox token is configured and not in minimal mode
      if (!minimal && settings.show3dView && MAPBOX_TOKEN) {
        try { map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 }); } catch { /* */ }
        try { (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 }); } catch { /* */ }
        try { map.easeTo({ pitch: 45 }); } catch { /* */ }
      }
      // Apply initial settings as Standard config when not in minimal mode
      if (!minimal) {
        applyStandardConfig(map, {
          show3dBuildings: settings.show3dBuildings,
          show3dTrees: settings.show3dTrees,
          show3dLandmarks: settings.show3dLandmarks,
          showRoadLabels: settings.roadLabels,
          showPointOfInterestLabels: settings.poiLabels,
          showPlaceLabels: settings.placeLabels,
          showTransitLabels: settings.transitLabels,
          showPedestrianRoads: settings.pedestrianRoads,
          lightPreset: settings.lightPreset,
        });
        // Apply initial building highlights
        if (highlightBuildings && highlightBuildings.length > 0) {
          highlightedRef.current = highlightBuildingsOnMap(map, highlightBuildings, []);
        }
      }
      onLoadRef.current?.(map);
    });

    mapRef.current = map;

    const ro = new ResizeObserver(() => { mapRef.current?.resize(); });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl, settings.satellite]); // satellite triggers full style reload

  // Apply non-satellite config changes at runtime (no map rebuild)
  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return;
    const map = mapRef.current;

    // Toggle 3D terrain + pitch when not in minimal mode
    if (!minimal) {
      if (settings.show3dView) {
        try {
          if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.terrain-dem', tileSize: 512, maxzoom: 14 });
          }
          (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          if (map.getPitch() < 1) map.easeTo({ pitch: 45 });
        } catch { /* */ }
      } else {
        try {
          (map as any).setTerrain(null);
          if (map.getPitch() > 1) map.easeTo({ pitch: 0 });
        } catch { /* */ }
      }

      applyStandardConfig(map, {
        show3dBuildings: settings.show3dBuildings,
        show3dTrees: settings.show3dTrees,
        show3dLandmarks: settings.show3dLandmarks,
        showRoadLabels: settings.roadLabels,
        showPointOfInterestLabels: settings.poiLabels,
        showPlaceLabels: settings.placeLabels,
        showTransitLabels: settings.transitLabels,
        showPedestrianRoads: settings.pedestrianRoads,
        lightPreset: settings.lightPreset,
      });
    }
  }, [settings.show3dView, settings.show3dBuildings, settings.show3dTrees,
      settings.show3dLandmarks, settings.roadLabels, settings.poiLabels,
      settings.placeLabels, settings.transitLabels, settings.pedestrianRoads,
      settings.lightPreset]);

  // Update building highlights when the prop changes
  useEffect(() => {
    if (minimal) return;
    if (!mapRef.current || !mapReadyRef.current) return;
    const buildings = highlightBuildings ?? [];
    highlightedRef.current = highlightBuildingsOnMap(mapRef.current, buildings, highlightedRef.current);
  }, [highlightBuildings]);

  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return;
    mapRef.current.easeTo({ center: [center.lng, center.lat], duration: 600 });
  }, [center.lat, center.lng]);

  return (
    <MapContext.Provider value={mapInstance}>
      <div className="relative w-full h-full" style={{ width: '100%', height: '100%' }}>
        <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0 }} />
        <MapSettingsPanel
          state={settings}
          onChange={updateSettings}
          hasToken={!!MAPBOX_TOKEN}
          minimal={minimal}
        />
        {children}
      </div>
    </MapContext.Provider>
  );
}
