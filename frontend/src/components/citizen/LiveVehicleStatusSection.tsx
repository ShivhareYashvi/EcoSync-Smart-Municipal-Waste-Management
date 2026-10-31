import React, { useState } from 'react';
import {
  Navigation,
  Truck,
  User,
  Clock,
  Radio,
  FileText,
  Map as MapIcon,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { TrackingMap } from '../TrackingMap';
import type { DriverLocation, Pickup } from '../../lib/types';
import { formatPickupCode } from '../../pages/user/UserDashboard';

interface LiveVehicleStatusSectionProps {
  trackedPickup: Pickup | null;
  latestDriverLocation: DriverLocation | null;
  pickupLocation: { latitude: number; longitude: number } | null;
  isNearDoor: boolean;
  distanceMeters: number | null;
  etaMinutes: number | null;
}

const COLLECTION_STEPS = [
  { key: 'scheduled', label: 'Scheduled', sublabel: 'Pickup Booked', icon: Calendar },
  { key: 'assigned', label: 'Assigned', sublabel: 'Driver Allocated', icon: UserCheck },
  { key: 'en_route', label: 'En Route', sublabel: 'Daily Route Started', icon: Truck },
  { key: 'near_door', label: 'Near Your Door', sublabel: 'Within 300m / Next', icon: Navigation },
  { key: 'arrived', label: 'Arrived', sublabel: 'Vehicle At Gate', icon: MapPin },
  { key: 'collected', label: 'Collected', sublabel: 'Weighed & Verified', icon: CheckCircle2 },
];

export const LiveVehicleStatusSection: React.FC<LiveVehicleStatusSectionProps> = ({
  trackedPickup,
  latestDriverLocation,
  pickupLocation,
  isNearDoor,
  distanceMeters,
  etaMinutes,
}) => {
  const [showTextAlternative, setShowTextAlternative] = useState(false);

  // Calculate current stage index based on real-time collection telemetry
  const getCurrentStepIndex = () => {
    if (!trackedPickup) return 0;
    if (trackedPickup.status === 'completed') return 5;
    if (trackedPickup.status === 'in_progress') {
      if (distanceMeters !== null && distanceMeters <= 50) return 4; // Arrived at gate
      if (isNearDoor || (distanceMeters !== null && distanceMeters <= 300)) return 3; // Within 300m
      return 2; // EnRoute
    }
    if (trackedPickup.status === 'assigned') return 1; // Assigned
    return 0; // Scheduled
  };

  const currentStepIdx = getCurrentStepIndex();

  // Extract vehicle registration & driver name from pickup notes or fallback
  const vehicleReg = trackedPickup?.notes?.match(/\[([A-Z0-9-]+)\]/)?.[1] || 'MP-04-EC-2024';
  const driverName = trackedPickup?.notes?.match(/Driver:\s*([^)]+)/)?.[1] || 'Rajesh Kumar';
  const wardName = trackedPickup?.notes?.match(/Dedicated\s*([^[]+)\s*Vehicle/)?.[1]?.trim() || 'BMC Ward 48';

  const lastUpdated = latestDriverLocation
    ? new Date(latestDriverLocation.recorded_at).toLocaleTimeString()
    : 'Waiting for stream...';

  // Construct accessible text telemetry description for screen readers and text view
  const textSummary = trackedPickup
    ? `Municipal collection status for booking [${formatPickupCode(trackedPickup.id)}]: Dedicated ${wardName} vehicle ${vehicleReg} driven by ${driverName} is currently ${
        latestDriverLocation
          ? `${distanceMeters ? (distanceMeters < 1000 ? `${distanceMeters} meters` : `${(distanceMeters / 1000).toFixed(1)} kilometers`) : 'nearby'} from your collection gate. Estimated arrival time is ${etaMinutes ? `${etaMinutes} minutes` : 'approximately 10 to 15 minutes'}. Telemetry updated at ${lastUpdated}.`
          : 'stationed at the ward depot preparing for dispatch.'
      }`
    : 'No active pickup selected for live tracking. Please select a collection from your active schedule above.';

  return (
    <section
      id="live-tracking-section"
      aria-labelledby="live-vehicle-heading"
      className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5"
    >
      {/* Header with Title and Accessible View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Live OpenStreetMap Telemetry
            </span>
          </div>
          <h2 id="live-vehicle-heading" className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
            Live Collection Vehicle Status
          </h2>
        </div>

        {/* Accessible Text Mode vs Visual Map Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTextAlternative(!showTextAlternative)}
            aria-pressed={showTextAlternative}
            aria-label={showTextAlternative ? 'Switch to interactive visual map' : 'Switch to accessible text-only telemetry summary'}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              showTextAlternative
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showTextAlternative ? (
              <>
                <MapIcon className="h-4 w-4" aria-hidden="true" />
                <span>Show Visual Map</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>Screen Reader / Text Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Dedicated Vehicle
          </span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
            <Truck className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            <span>{vehicleReg}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Assigned Driver
          </span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
            <User className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span>{driverName}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Estimated Arrival
          </span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>{etaMinutes ? `~${etaMinutes} mins` : 'Calculating...'}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Last GPS Telemetry
          </span>
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
            <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" aria-hidden="true" />
            <span>{lastUpdated}</span>
          </span>
        </div>
      </div>

      {/* 6-Stage Municipal Collection Lifecycle Stepper (Bhopal Production Protocol) */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Collection Journey Progress
          </h3>
          <span className="text-xs font-semibold text-slate-600">
            Stage {currentStepIdx + 1} of {COLLECTION_STEPS.length}:{' '}
            <strong className="text-emerald-800">{COLLECTION_STEPS[currentStepIdx].label}</strong>
          </span>
        </div>

        <ol
          aria-label="Doorstep pickup workflow stages"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
        >
          {COLLECTION_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const Icon = step.icon;

            return (
              <li
                key={step.key}
                aria-current={isCurrent ? 'step' : undefined}
                className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 shadow-sm'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-white/70 text-slate-400 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-900'
                        : isCompleted
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isCurrent ? '[Active]' : isCompleted ? '[Done]' : `[Step ${idx + 1}]`}
                  </span>
                </div>

                <div>
                  <div
                    className={`text-xs font-extrabold leading-tight ${
                      isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-950' : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">
                    {step.sublabel}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Proximity Alert Banner (When Within 300 Meters) */}
      {isNearDoor && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl bg-amber-500/10 border-2 border-amber-500 p-4 flex items-center gap-3 text-amber-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white animate-bounce">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-sm">
              Collection Vehicle is on your street! (&lt; 300 meters away)
            </h3>
            <p className="text-xs text-amber-800 mt-0.5 font-medium">
              Please ensure your segregated wet and dry waste bins are ready at the doorstep.
            </p>
          </div>
        </div>
      )}

      {/* Accessible Text Alternative (Always available to Screen Readers via aria-live) */}
      <div
        role="region"
        aria-live="polite"
        className={showTextAlternative ? 'block' : 'sr-only'}
      >
        <div className="rounded-2xl border-2 border-slate-900 bg-slate-950 text-white p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Accessible Text-Based Telemetry Feed</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-100 font-medium">
            {textSummary}
          </p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>Route: </span>
            <span className="text-white font-semibold">{wardName} Doorstep Sector Run</span>
            <span className="mx-2">&middot;</span>
            <span>Speed: </span>
            <span className="text-white font-semibold">18 km/h Municipal Sweep</span>
          </div>
        </div>
      </div>

      {/* Visual Leaflet Map View */}
      {!showTextAlternative && (
        <div
          className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner"
          aria-hidden="true"
        >
          <TrackingMap
            pickupLocation={pickupLocation}
            driverLocation={
              latestDriverLocation
                ? {
                    latitude: latestDriverLocation.latitude,
                    longitude: latestDriverLocation.longitude,
                  }
                : null
            }
            heightClassName="h-80 sm:h-96"
            focusMode="both"
          />
        </div>
      )}
    </section>
  );
};
