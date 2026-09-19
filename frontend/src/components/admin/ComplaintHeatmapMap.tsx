import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../lib/api';
import type { HeatmapPoint, HeatmapResponse } from '../../lib/types';
import { AlertCircle, Flame, Layers, RefreshCw } from 'lucide-react';

interface ComplaintHeatmapMapProps {
  selectedZoneId?: number | null;
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946]; // Bengaluru
const DEFAULT_ZOOM = 12;

export const ComplaintHeatmapMap: React.FC<ComplaintHeatmapMapProps> = ({ selectedZoneId }) => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<HeatmapResponse>({
    queryKey: ['complaint-heatmap'],
    queryFn: async () => {
      const res = await api.get<HeatmapResponse>('/complaints/heatmap');
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const points = useMemo(() => {
    const allPoints = data?.points || [];
    if (!selectedZoneId) return allPoints;
    return allPoints.filter((p) => p.zone_id === selectedZoneId);
  }, [data?.points, selectedZoneId]);

  const getColor = (weight: number): string => {
    if (weight >= 3) return '#ef4444'; // Red: Hotspot alert threshold
    if (weight === 2) return '#f97316'; // Orange: Moderate clustering
    return '#eab308'; // Yellow: Single complaint
  };

  const getRadius = (weight: number): number => {
    if (weight >= 3) return 22;
    if (weight === 2) return 16;
    return 10;
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-black text-slate-800">Municipal Complaint Heatmap</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Spatial density of citizen complaints across municipal zones (Hotspot threshold: &ge; 3 complaints within 30 days)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span> 1
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-orange-500"></span> 2
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-500"></span> &ge;3 (Hotspot)
            </span>
          </div>

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Refresh Heatmap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading geospatial heatmap data...
        </div>
      ) : isError ? (
        <div className="flex h-96 flex-col items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="text-sm font-bold">Failed to load complaint heatmap</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200" style={{ height: '420px' }}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {points.map((p, idx) => (
              <CircleMarker
                key={`${p.latitude}-${p.longitude}-${idx}`}
                center={[p.latitude, p.longitude]}
                radius={getRadius(p.weight)}
                pathOptions={{
                  fillColor: getColor(p.weight),
                  fillOpacity: 0.65,
                  color: '#ffffff',
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <span className="font-bold">{p.zone_name || `Zone #${p.zone_id || 'N/A'}`}</span>: {p.weight} complaint{p.weight > 1 ? 's' : ''}
                </Tooltip>
                <Popup>
                  <div className="text-xs">
                    <p className="font-black text-slate-800">{p.zone_name || `Zone #${p.zone_id || 'Unknown'}`}</p>
                    <p className="mt-1 text-slate-600">Complaints recorded: <strong>{p.weight}</strong></p>
                    <p className="text-slate-400 font-mono">[{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}]</p>
                    {p.weight >= 3 && (
                      <span className="mt-2 inline-block rounded-lg bg-red-100 px-2 py-0.5 font-bold text-red-700">
                        Active Hotspot Area
                      </span>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow backdrop-blur-sm">
            <Layers className="mr-1 inline h-3.5 w-3.5 text-slate-500" />
            Showing {points.length} incident node{points.length === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
};
