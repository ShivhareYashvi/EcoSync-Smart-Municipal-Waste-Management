import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, type LatLng, type Marker as LeafletMarker } from 'leaflet';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string, addressDescription?: string) => void;
  heightClassName?: string;
  initialLandmark?: string;
}

// Default center: Bhopal Municipal Corporation center (23.2599° N, 77.4126° E)
const BHOPAL_CENTER: [number, number] = [23.2599, 77.4126];

// Popular Bhopal wards/localities for quick one-click jump
const BHOPAL_LOCALITIES = [
  { name: 'Arera Colony (E-1 to E-7)', lat: 23.2125, lng: 77.4328 },
  { name: 'MP Nagar (Zone I & II)', lat: 23.2332, lng: 77.4334 },
  { name: 'Kolar Road', lat: 23.1678, lng: 77.4231 },
  { name: 'TT Nagar / New Market', lat: 23.2384, lng: 77.3996 },
  { name: 'Shahpura / Chunabhatti', lat: 23.1956, lng: 77.4278 },
  { name: 'Indrapuri / BHEL', lat: 23.2483, lng: 77.4811 },
  { name: 'Bhopal Junction / Old City', lat: 23.2676, lng: 77.4116 },
  { name: 'Hoshangabad Road / Misrod', lat: 23.1624, lng: 77.4589 },
];

const pinMarkerIcon = divIcon({
  html: `<div style="
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #059669;
    border: 3px solid #ffffff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 10px rgba(0,0,0,0.35);
  ">
    <span style="transform: rotate(45deg); font-size: 16px;">🗑️</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function MapEventsHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapPanController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (target) {
      map.setView(target, Math.max(map.getZoom(), 16), { animate: true });
    }
  }, [map, target]);
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  heightClassName = 'h-64',
}: LocationPickerProps) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const [addressLabel, setAddressLabel] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);

  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);
  const hasValidCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && parsedLat !== 0 && parsedLng !== 0;

  const currentPosition: [number, number] = useMemo(
    () => (hasValidCoords ? [parsedLat, parsedLng] : BHOPAL_CENTER),
    [hasValidCoords, parsedLat, parsedLng]
  );

  // Reverse geocode when coordinates change
  useEffect(() => {
    if (!hasValidCoords) {
      setAddressLabel('');
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLng}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: { 'Accept-Language': 'en-IN,en;q=0.9' },
          }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          display_name?: string;
          address?: {
            road?: string;
            suburb?: string;
            neighbourhood?: string;
            residential?: string;
            city_district?: string;
            postcode?: string;
          };
        };

        const addr = data.address;
        if (addr) {
          const parts = [
            addr.road || addr.residential || addr.neighbourhood,
            addr.suburb || addr.city_district,
            addr.postcode ? `PIN: ${addr.postcode}` : '',
          ].filter(Boolean);
          const shortDesc = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || '';
          setAddressLabel(shortDesc);
        } else if (data.display_name) {
          setAddressLabel(data.display_name.split(',').slice(0, 3).join(','));
        }
      } catch {
        // Ignore aborts or network issues
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [hasValidCoords, parsedLat, parsedLng]);

  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const latlng = marker.getLatLng();
      const latStr = latlng.lat.toFixed(6);
      const lngStr = latlng.lng.toFixed(6);
      onLocationChange(latStr, lngStr);
    }
  };

  const handleMapClick = (latlng: LatLng) => {
    const latStr = latlng.lat.toFixed(6);
    const lngStr = latlng.lng.toFixed(6);
    setPanTarget([latlng.lat, latlng.lng]);
    onLocationChange(latStr, lngStr);
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    setLocError(null);

    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setPanTarget([pos.coords.latitude, pos.coords.longitude]);
        onLocationChange(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError('GPS permission denied. Please allow location access.');
        } else if (err.code === err.TIMEOUT) {
          setLocError('GPS request timed out. Please try again.');
        } else {
          setLocError('Unable to detect current GPS location.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  const handleQuickLocalitySelect = (lat: number, lng: number) => {
    setPanTarget([lat, lng]);
    onLocationChange(lat.toFixed(6), lng.toFixed(6));
    setSearchQuery('');
  };

  const filteredLocalities = searchQuery.trim()
    ? BHOPAL_LOCALITIES.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="grid gap-3 sm:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-emerald-600" />
          Precise Waste Pickup Point
          <span className="text-[11px] font-normal text-slate-500">(Drag pin or tap map right at your gate)</span>
        </label>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          <LocateFixed className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Locating...' : 'Use My GPS Location'}
        </button>
      </div>

      {/* Quick Search / Bhopal Localities Dropdown */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs placeholder:text-slate-400"
            placeholder="Search Bhopal locality (e.g. Arera Colony, MP Nagar, Kolar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredLocalities.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-1000 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {filteredLocalities.map((loc) => (
              <button
                key={loc.name}
                type="button"
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                onClick={() => handleQuickLocalitySelect(loc.lat, loc.lng)}
              >
                📍 {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Pin-Drop Leaflet Map */}
      <div className={`relative ${heightClassName} overflow-hidden rounded-2xl border border-slate-200 shadow-xs`}>
        <MapContainer
          center={currentPosition}
          zoom={hasValidCoords ? 16 : 13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapPanController target={panTarget} />
          <MapEventsHandler onMapClick={handleMapClick} />

          <Marker
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            position={currentPosition}
            ref={markerRef}
            icon={pinMarkerIcon}
          />
        </MapContainer>

        {/* Floating helper chip */}
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-1000 flex items-center justify-between rounded-lg bg-white/90 backdrop-blur-xs px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs border border-slate-200/80">
          <span className="truncate">
            {addressLabel ? `📍 ${addressLabel}` : '📍 Tap or drag the pin to your house gate'}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-slate-500 ml-2">
            {hasValidCoords ? `${parsedLat.toFixed(5)}, ${parsedLng.toFixed(5)}` : 'Bhopal'}
          </span>
        </div>
      </div>

      {locError && <p className="text-xs text-rose-600">{locError}</p>}
    </div>
  );
}

