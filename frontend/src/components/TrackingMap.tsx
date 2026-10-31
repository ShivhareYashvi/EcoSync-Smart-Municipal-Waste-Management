import { useEffect, useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { ExternalLink } from 'lucide-react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { Coordinates } from '../lib/types';

type TrackingMapProps = {
  pickupLocation?: Coordinates | { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
  driverLocation?: Coordinates | { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
  heightClassName?: string;
  focusMode?: 'driver' | 'pickup' | 'both';
};

// Default center: Bhopal municipal coordinates (23.2599° N, 77.4126° E)
const DEFAULT_CENTER: [number, number] = [23.2599, 77.4126];

export function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function toTuple(coordinates: unknown): [number, number] | null {
  if (!coordinates) return null;
  let raw = coordinates;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw) && raw.length >= 2) {
    const lat = Number(raw[0]);
    const lng = Number(raw[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }
  if (typeof raw === 'object' && raw !== null) {
    const rec = raw as Record<string, unknown>;
    const lat = Number(rec.latitude ?? rec.lat);
    const lng = Number(rec.longitude ?? rec.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
  }
  return null;
}

const pickupMarkerIcon = divIcon({
  html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#059669;border:3px solid #ffffff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:16px;">🗑️</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const driverCarIcon = divIcon({
  html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#0284c7;border:3px solid #ffffff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:16px;">🚗</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

function MapUpdater({
  pickup,
  driver,
  focusMode
}: {
  pickup: [number, number] | null;
  driver: [number, number] | null;
  focusMode: 'driver' | 'pickup' | 'both';
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after mount so Leaflet container fills accurately
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    if (focusMode === 'both' && pickup && driver) {
      const bounds: [[number, number], [number, number]] = [pickup, driver];
      if (pickup[0] === driver[0] && pickup[1] === driver[1]) {
        map.setView(driver, 15);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
      }
      return () => clearTimeout(timer);
    }

    if (focusMode === 'pickup' && pickup) {
      map.setView(pickup, 15);
      return () => clearTimeout(timer);
    }

    if (driver && focusMode === 'driver') {
      map.setView(driver, 15);
      return () => clearTimeout(timer);
    }

    if (pickup) {
      map.setView(pickup, 15);
      return () => clearTimeout(timer);
    }

    if (driver) {
      map.setView(driver, 15);
      return () => clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [map, pickup, driver, focusMode]);

  return null;
}

export function TrackingMap({
  pickupLocation,
  driverLocation,
  heightClassName = 'h-80',
  focusMode = 'both'
}: TrackingMapProps) {
  const pickup = useMemo(() => toTuple(pickupLocation), [pickupLocation]);
  const driver = useMemo(() => toTuple(driverLocation), [driverLocation]);
  const center = driver ?? pickup ?? DEFAULT_CENTER;
  const [routedPath, setRoutedPath] = useState<[number, number][]>([]);

  const distanceMeters = useMemo(() => {
    if (!pickup || !driver) return null;
    return calculateHaversineMeters(driver[0], driver[1], pickup[0], pickup[1]);
  }, [pickup, driver]);

  const etaMinutes = useMemo(() => {
    if (distanceMeters === null) return null;
    // Average municipal collection speed ~18 km/h = 300 m/min
    return Math.max(1, Math.round(distanceMeters / 300));
  }, [distanceMeters]);

  const routeQuery = useMemo(() => {
    if (!pickup || !driver) return null;
    return {
      driver,
      pickup,
      url: `https://router.project-osrm.org/route/v1/driving/${driver[1]},${driver[0]};${pickup[1]},${pickup[0]}?overview=full&geometries=geojson`
    };
  }, [pickup, driver]);

  useEffect(() => {
    let active = true;
    async function loadRoute() {
      if (!routeQuery) {
        setRoutedPath([]);
        return;
      }
      try {
        const response = await fetch(routeQuery.url);
        if (!response.ok) {
          setRoutedPath([]);
          return;
        }
        const data = (await response.json()) as {
          routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
        };
        const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
        const nextPath = coordinates
          .map(([lng, lat]) => [lat, lng] as [number, number])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
        if (active) {
          setRoutedPath(nextPath);
        }
      } catch {
        if (active) {
          setRoutedPath([]);
        }
      }
    }
    void loadRoute();
    return () => {
      active = false;
    };
  }, [routeQuery]);

  const fallbackGuidePath = pickup && driver ? [driver, pickup] : [];

  return (
    <div className={`relative ${heightClassName} overflow-hidden rounded-[1.5rem] border border-slate-200/80 shadow-xs`}>
      {/* Live Distance & ETA Pill Overlay */}
      {pickup && driver && distanceMeters !== null && (
        <div className="absolute top-3 left-3 right-3 z-1000 flex items-center justify-between rounded-xl bg-white/95 backdrop-blur-md px-3.5 py-2 text-xs shadow-md border border-slate-200">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${distanceMeters < 300 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="font-bold text-slate-900">
              {distanceMeters < 300 ? '🚨 Vehicle Arriving!' : 'Collection Vehicle En Route'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>{distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`}</span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              ~{etaMinutes} min
            </span>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={pickup || driver ? 15 : 12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater pickup={pickup} driver={driver} focusMode={focusMode} />

        {pickup ? (
          <Marker position={pickup} icon={pickupMarkerIcon}>
            <Tooltip permanent direction="top" offset={[0, -16]}>
              <span className="font-semibold text-xs">Pickup point</span>
            </Tooltip>
            <Popup>
              <div className="text-xs p-1 grid gap-1.5 min-w-[160px]">
                <p className="font-bold text-emerald-800">Citizen Waste Pickup Point</p>
                <p className="text-slate-500">Lat: {pickup[0].toFixed(5)}, Lng: {pickup[1].toFixed(5)}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pickup[0]},${pickup[1]}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" /> Navigate in Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {driver ? (
          <Marker position={driver} icon={driverCarIcon}>
            <Tooltip permanent direction="top" offset={[0, -16]}>
              <span className="font-semibold text-xs">Collection Vehicle</span>
            </Tooltip>
            <Popup>
              <div className="text-xs p-1 grid gap-1.5 min-w-[160px]">
                <p className="font-bold text-sky-800">Driver Live Location</p>
                <p className="text-slate-500">Lat: {driver[0].toFixed(5)}, Lng: {driver[1].toFixed(5)}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${driver[0]},${driver[1]}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" /> View on Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {routedPath.length > 1 ? (
          <Polyline positions={routedPath} pathOptions={{ color: '#0284c7', weight: 5, opacity: 0.85 }} />
        ) : null}

        {routedPath.length <= 1 && fallbackGuidePath.length === 2 ? (
          <Polyline positions={fallbackGuidePath} pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '8 8', opacity: 0.9 }} />
        ) : null}
      </MapContainer>

      {!pickup && !driver && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-1000 rounded-xl bg-white/90 backdrop-blur-xs px-4 py-2 text-center text-xs font-semibold text-slate-700 shadow-sm border border-slate-200/60">
          Showing Municipal Map (Bhopal). Schedule a pickup with GPS to view your live pin.
        </div>
      )}
    </div>
  );
}
