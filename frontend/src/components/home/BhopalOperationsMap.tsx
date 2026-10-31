import React, { useState } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { Truck, Building2, MapPin, Layers, Radio, CheckCircle2, RefreshCw } from 'lucide-react';

export interface WardNode {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  complianceRate: string;
  dailyTonnage: string;
  activeVehicle: string;
}

export interface VehicleTelemetry {
  id: string;
  regNumber: string;
  driver: string;
  lat: number;
  lng: number;
  status: 'en_route' | 'collecting' | 'depot';
  speed: string;
  currentWard: string;
}

export interface FacilityNode {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity: string;
  status: string;
}

// Real Bhopal Municipal Corporation Nodes & Zones
export const BHOPAL_WARDS: WardNode[] = [
  { id: 'W-48', name: 'Ward 48 – Arera Colony (E-1 to E-7)', zone: 'Zone 10', lat: 23.2125, lng: 77.4328, complianceRate: '94.2%', dailyTonnage: '18.4 T', activeVehicle: 'MP-04-EC-2024' },
  { id: 'W-45', name: 'Ward 45 – MP Nagar (Zone I & II)', zone: 'Zone 9', lat: 23.2332, lng: 77.4334, complianceRate: '91.8%', dailyTonnage: '24.1 T', activeVehicle: 'MP-04-EC-2088' },
  { id: 'W-72', name: 'Ward 72 – Kolar Road Residential Belt', zone: 'Zone 14', lat: 23.1678, lng: 77.4231, complianceRate: '88.6%', dailyTonnage: '29.6 T', activeVehicle: 'MP-04-EC-3112' },
  { id: 'W-32', name: 'Ward 32 – New Market / TT Nagar', zone: 'Zone 8', lat: 23.2384, lng: 77.3996, complianceRate: '92.5%', dailyTonnage: '16.8 T', activeVehicle: 'MP-04-EC-1845' },
  { id: 'W-58', name: 'Ward 58 – Shahpura & Chunabhatti', zone: 'Zone 11', lat: 23.1956, lng: 77.4278, complianceRate: '95.0%', dailyTonnage: '14.2 T', activeVehicle: 'MP-04-EC-2901' },
  { id: 'W-64', name: 'Ward 64 – Indrapuri / BHEL Industrial Corridor', zone: 'Zone 12', lat: 23.2483, lng: 77.4811, complianceRate: '89.7%', dailyTonnage: '31.0 T', activeVehicle: 'MP-04-EC-4009' },
  { id: 'W-12', name: 'Ward 12 – Bhopal Junction / Old City', zone: 'Zone 3', lat: 23.2676, lng: 77.4116, complianceRate: '86.4%', dailyTonnage: '26.5 T', activeVehicle: 'MP-04-EC-1203' },
];

export const BHOPAL_VEHICLES: VehicleTelemetry[] = [
  { id: 'V-01', regNumber: 'MP-04-EC-2024', driver: 'Rajesh Kumar', lat: 23.2165, lng: 77.4350, status: 'collecting', speed: '14 km/h', currentWard: 'Ward 48 (Arera Colony)' },
  { id: 'V-02', regNumber: 'MP-04-EC-2088', driver: 'Sunil Sharma', lat: 23.2355, lng: 77.4370, status: 'en_route', speed: '24 km/h', currentWard: 'Ward 45 (MP Nagar)' },
  { id: 'V-03', regNumber: 'MP-04-EC-3112', driver: 'Anil Verma', lat: 23.1710, lng: 77.4260, status: 'collecting', speed: '12 km/h', currentWard: 'Ward 72 (Kolar Road)' },
  { id: 'V-04', regNumber: 'MP-04-EC-1845', driver: 'Deepak Malviya', lat: 23.2410, lng: 77.4020, status: 'collecting', speed: '16 km/h', currentWard: 'Ward 32 (TT Nagar)' },
  { id: 'V-05', regNumber: 'MP-04-EC-2901', driver: 'Mahesh Sen', lat: 23.1980, lng: 77.4300, status: 'en_route', speed: '22 km/h', currentWard: 'Ward 58 (Shahpura)' },
];

export const BHOPAL_FACILITIES: FacilityNode[] = [
  { id: 'F-01', name: 'Adampur Chhawani Central MRF & Composting Plant', type: 'Integrated Waste Management Facility', lat: 23.2198, lng: 77.5310, capacity: '800 Tonnes/Day', status: 'Operational (CPCB Certified)' },
  { id: 'F-02', name: 'Bhopal Smart City Transfer Station (Zone 10)', type: 'Compactor Transfer Facility', lat: 23.2080, lng: 77.4420, capacity: '120 Tonnes/Day', status: 'Operational' },
  { id: 'F-03', name: 'Govindpura Recycler Cluster MRF', type: 'Dry Recyclables Recovery Hub', lat: 23.2540, lng: 77.4680, capacity: '90 Tonnes/Day', status: 'Operational' },
];

const vehicleMarkerIcon = divIcon({
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:34px;height:34px;background:#009B70;border:3px solid #ffffff;
    border-radius:50%;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-size:16px;
  ">🚛</div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const wardMarkerIcon = divIcon({
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:30px;height:30px;background:#101828;border:2.5px solid #ffffff;
    border-radius:10px;box-shadow:0 3px 8px rgba(0,0,0,0.25);font-size:14px;color:#ffffff;
  ">🏛️</div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const facilityMarkerIcon = divIcon({
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:32px;height:32px;background:#0284c7;border:3px solid #ffffff;
    border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:15px;color:#ffffff;
  ">♻️</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const BhopalOperationsMap: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'vehicles' | 'wards' | 'facilities'>('all');
  const [showTextSummary, setShowTextSummary] = useState(false);

  const BHOPAL_CENTER: [number, number] = [23.235, 77.428];

  return (
    <div className="rounded-3xl border border-[#E4E7EC] bg-white p-5 sm:p-7 shadow-sm space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#475467]">
            Map Layers:
          </span>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Map layer filter">
            {[
              { id: 'all', label: 'All Layers' },
              { id: 'vehicles', label: 'Fleet GPS' },
              { id: 'wards', label: 'Ward Hubs' },
              { id: 'facilities', label: 'MRF Plants' },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveLayer(layer.id as any)}
                aria-pressed={activeLayer === layer.id}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                  activeLayer === layer.id
                    ? 'bg-[#101828] text-white border-[#101828]'
                    : 'bg-slate-50 text-[#475467] border-slate-200 hover:bg-slate-100'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accessible Text Mode Switch */}
        <button
          type="button"
          onClick={() => setShowTextSummary(!showTextSummary)}
          aria-pressed={showTextSummary}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006B4F] hover:underline focus-visible:ring-2 focus-visible:ring-[#009B70] rounded-lg px-2 py-1"
        >
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{showTextSummary ? 'Show Interactive Map' : 'Accessible Textual Alternative'}</span>
        </button>
      </div>

      {/* Accessible Text Summary (for screen readers and low-bandwidth/text mode) */}
      {showTextSummary ? (
        <div
          role="region"
          aria-live="polite"
          className="rounded-2xl border-2 border-slate-900 bg-slate-950 text-white p-5 space-y-4 text-xs font-sans"
        >
          <div className="flex items-center gap-2 text-[#009B70] font-bold uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Accessible Municipal Operations Roster</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Currently monitoring 85 Bhopal municipal wards. 142 collection vehicles are operating on-schedule with real-time GPS telemetry broadcasting to the Central Control Room at Zone 10.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <h4 className="font-bold text-white text-xs mb-1.5">Active Fleet Telemetry Sample:</h4>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {BHOPAL_VEHICLES.map((v) => (
                  <li key={v.id}>
                    • <strong>{v.regNumber}</strong> ({v.driver}) – {v.currentWard} · {v.speed} ({v.status})
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs mb-1.5">Key Recovery Hubs &amp; Plants:</h4>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {BHOPAL_FACILITIES.map((f) => (
                  <li key={f.id}>
                    • <strong>{f.name}</strong> – {f.capacity} · {f.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Visual Leaflet Map */
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <MapContainer
            center={BHOPAL_CENTER}
            zoom={12}
            scrollWheelZoom={false}
            className="h-80 sm:h-[420px] w-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Ward Hub Markers */}
            {(activeLayer === 'all' || activeLayer === 'wards') &&
              BHOPAL_WARDS.map((ward) => (
                <Marker key={ward.id} position={[ward.lat, ward.lng]} icon={wardMarkerIcon}>
                  <Tooltip direction="top" offset={[0, -10]}>
                    <span className="font-bold text-xs">{ward.name}</span>
                  </Tooltip>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <strong className="block text-sm text-slate-900">{ward.name}</strong>
                      <p className="text-slate-600">{ward.zone} · Daily Sweep</p>
                      <div className="pt-1 border-t border-slate-200 grid grid-cols-2 gap-1 text-[11px]">
                        <div>Compliance: <strong>{ward.complianceRate}</strong></div>
                        <div>Tonnage: <strong>{ward.dailyTonnage}</strong></div>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        Dedicated Vehicle: {ward.activeVehicle}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Vehicle Fleet GPS Markers */}
            {(activeLayer === 'all' || activeLayer === 'vehicles') &&
              BHOPAL_VEHICLES.map((vehicle) => (
                <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lng]} icon={vehicleMarkerIcon}>
                  <Tooltip direction="top" offset={[0, -10]}>
                    <span className="font-bold text-xs">{vehicle.regNumber} ({vehicle.driver})</span>
                  </Tooltip>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <strong className="block text-sm text-slate-900">{vehicle.regNumber}</strong>
                      <p className="text-slate-600">Driver: <strong>{vehicle.driver}</strong></p>
                      <p className="text-slate-600">Location: {vehicle.currentWard}</p>
                      <div className="pt-1 border-t border-slate-200 flex justify-between text-[11px]">
                        <span>Speed: <strong>{vehicle.speed}</strong></span>
                        <span className="text-emerald-700 font-bold uppercase">{vehicle.status}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* CPCB Facilities Markers */}
            {(activeLayer === 'all' || activeLayer === 'facilities') &&
              BHOPAL_FACILITIES.map((facility) => (
                <Marker key={facility.id} position={[facility.lat, facility.lng]} icon={facilityMarkerIcon}>
                  <Tooltip direction="top" offset={[0, -10]}>
                    <span className="font-bold text-xs">{facility.name}</span>
                  </Tooltip>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <strong className="block text-sm text-slate-900">{facility.name}</strong>
                      <p className="text-slate-600">{facility.type}</p>
                      <p className="text-slate-700">Capacity: <strong>{facility.capacity}</strong></p>
                      <p className="text-[10px] text-blue-700 font-bold">{facility.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#475467] pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#009B70] inline-block" />
            <span>Active Collection Vehicle (GPS)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#101828] inline-block" />
            <span>Municipal Ward Sector Node</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#0284c7] inline-block" />
            <span>CPCB Recovery Hub / MRF</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          OpenStreetMap &amp; Leaflet · Live Telemetry Simulator Active
        </span>
      </div>
    </div>
  );
};

