/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Shield, AlertTriangle, Info, Map as MapIcon, Crosshair } from 'lucide-react';
import { SOSAlert, IncidentReport } from '../types';

interface MapSimulationProps {
  latitude: number;
  longitude: number;
  onLocationSelect?: (lat: number, lng: number, addressName: string) => void;
  activeAlerts?: SOSAlert[];
  incidents?: IncidentReport[];
  interactive?: boolean;
}

interface Landmark {
  name: string;
  lat: number;
  lng: number;
  x: number; // SVG X Coord (0 - 100)
  y: number; // SVG Y Coord (0 - 100)
  type: 'police' | 'safe_zone' | 'danger_zone' | 'neutral';
  description?: string;
}

export default function MapSimulation({
  latitude,
  longitude,
  onLocationSelect,
  activeAlerts = [],
  incidents = [],
  interactive = true,
}: MapSimulationProps) {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);

  // Core landmarks plotted in a styled SVG grid (New York themed grid)
  const landmarks: Landmark[] = [
    {
      name: 'Central Patrol Precinct',
      lat: 40.7850,
      lng: -73.9683,
      x: 50,
      y: 18,
      type: 'police',
      description: 'Police Department, 24/7 Protection & Patrol dispatch.',
    },
    {
      name: 'Times Square Safety Hub',
      lat: 40.7580,
      lng: -73.9855,
      x: 35,
      y: 48,
      type: 'safe_zone',
      description: 'Public Assistance Kiosk, active community patrol units.',
    },
    {
      name: 'Penn Station Transit Point',
      lat: 40.7505,
      lng: -73.9934,
      x: 25,
      y: 65,
      type: 'neutral',
      description: 'Major transit terminal. High foot traffic.',
    },
    {
      name: 'Central Park East Subway Area',
      lat: 40.7725,
      lng: -73.9620,
      x: 65,
      y: 32,
      type: 'neutral',
      description: 'Residential subway access point. Good surveillance.',
    },
    {
      name: 'Broadway Theater District',
      lat: 40.7590,
      lng: -73.9844,
      x: 38,
      y: 42,
      type: 'safe_zone',
      description: 'Safe haven retail shops, bright street lighting installed.',
    },
    {
      name: 'Greenwich Night Path',
      lat: 40.7306,
      lng: -74.0027,
      x: 18,
      y: 85,
      type: 'danger_zone',
      description: 'Construction zone reported with multiple dark alleys.',
    }
  ];

  // Helper to map a general lat/lng to SVG percentage coordinates
  // Grid coordinates map roughly around NY area: Lat 40.71 -> 40.80, Lng -74.01 -> -73.95
  const getSvgCoordinates = (lat: number, lng: number) => {
    const minLat = 40.7100;
    const maxLat = 40.8000;
    const minLng = -74.0100;
    const maxLng = -73.9500;

    // Direct linear scaling
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // SVG Y is inverted
    const y = 100 - (((lat - minLat) / (maxLat - minLat)) * 100);

    // Keep bounded within 5% to 95%
    return {
      x: Math.min(Math.max(x, 5), 95),
      y: Math.min(Math.max(y, 5), 95),
    };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onLocationSelect) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Convert SVG X / Y percentages back to rough Lat/Lng
    const minLat = 40.7100;
    const maxLat = 40.8000;
    const minLng = -74.0100;
    const maxLng = -73.9500;

    const lng = minLng + (clickX / 100) * (maxLng - minLng);
    const lat = minLat + ((100 - clickY) / 100) * (maxLat - minLat);

    // Format address name
    const addressName = `Custom Location (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`;
    onLocationSelect(
      parseFloat(lat.toFixed(6)),
      parseFloat(lng.toFixed(6)),
      addressName
    );
    setSelectedLandmark(null);
  };

  const currentPin = getSvgCoordinates(latitude, longitude);

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden shadow-2xl" id="map-simulation-container">
      {/* Map Header Controls */}
      <div className="px-5 py-3.5 bg-[#141414] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-red-500" />
          <h3 className="font-bold text-white text-xs font-display uppercase tracking-wider">Simulation Map Grid</h3>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>SOS BEACON</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>UNSAFE PATH</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SAFE HAVEN</span>
          </div>
        </div>
      </div>

      {/* Map Graphic Sandbox Wrapper */}
      <div className="relative aspect-[16/10] md:aspect-[16/9] bg-[#0a0a0a] select-none text-xs">
        
        {/* SVG Drawing of City Grid */}
        <svg
          className="absolute inset-0 w-full h-full cursor-crosshair opacity-80"
          onClick={handleMapClick}
        >
          {/* Grid lines simulating streets */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Main Simulated Hudson River */}
          <path
            d="M 0 0 Q 15 20, 10 50 T 2 100 L 0 100 Z"
            fill="#090a0d"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2"
          />

          {/* Major avenues (broad roads) */}
          <line x1="25%" y1="0%" x2="25%" y2="100%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
          <line x1="55%" y1="0%" x2="55%" y2="100%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" />
          <line x1="85%" y1="0%" x2="85%" y2="100%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
          <line x1="0%" y1="45%" x2="100%" y2="45%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" />
          <line x1="0%" y1="75%" x2="100%" y2="75%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />

          {/* Broadway Diagonal Road */}
          <line x1="0%" y1="10%" x2="100%" y2="90%" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.2" strokeDasharray="3 3" />

          {/* Central Park block (shaded green) */}
          <rect x="40%" y="5%" width="30%" height="25%" fill="#14532d" fillOpacity="0.25" rx="8" stroke="#15803d" strokeWidth="1" strokeOpacity="0.3" />
          <text x="55%" y="17%" fill="#4ade80" fontSize="9" textAnchor="middle" className="font-semibold uppercase tracking-widest opacity-60 font-mono">
            Central Park
          </text>

          {/* Hub Label */}
          <text x="85%" y="42%" fill="rgba(255, 255, 255, 0.2)" fontSize="8" className="tracking-widest uppercase font-mono">
            NYC District Grid
          </text>
        </svg>

        {/* --- DYNAMIC MAP PLOTS --- */}

        {/* 1. Plot Landmark Markers */}
        {landmarks.map((l, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLandmark(l);
              if (onLocationSelect) {
                onLocationSelect(l.lat, l.lng, l.name);
              }
            }}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-all hover:scale-110 z-10 cursor-pointer ${
              l.type === 'police'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.45)]'
                : l.type === 'safe_zone'
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.45)]'
                : l.type === 'danger_zone'
                ? 'bg-red-650/85 hover:bg-red-650 text-white shadow-[0_0_15px_rgba(220,38,38,0.45)]'
                : 'bg-zinc-800 text-zinc-300'
            } shadow-md`}
            title={l.name}
          >
            {l.type === 'police' && <Shield className="w-3.5 h-3.5" />}
            {l.type === 'safe_zone' && <Shield className="w-3.5 h-3.5" />}
            {l.type === 'danger_zone' && <AlertTriangle className="w-3.5 h-3.5" />}
            {l.type === 'neutral' && <MapPin className="w-3.5 h-3.5" />}
          </button>
        ))}

        {/* 2. Plot Active SOS Alerts from database (Flashing Indicators) */}
        {activeAlerts.map((alert) => {
          const coords = getSvgCoordinates(alert.latitude, alert.longitude);
          const isActive = alert.status === 'ACTIVE';
          return (
            <div
              key={`sos-${alert.id}`}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <>
                    <span className="absolute w-12 h-12 rounded-full bg-red-600 opacity-30 animate-ping"></span>
                    <span className="absolute w-7 h-7 rounded-full bg-red-600 opacity-55 animate-pulse"></span>
                  </>
                )}
                <div className={`p-1.5 rounded-full text-white shadow-lg ${isActive ? 'bg-red-550 animate-bounce' : 'bg-emerald-600'}`}>
                  <Shield className="w-3.5 h-3.5 text-white font-bold" />
                </div>
                {/* Tooltip */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-950/95 border border-red-500/20 text-white text-[9px] py-1 px-2.5 rounded font-mono uppercase tracking-wider shadow-xl">
                  SOS: {alert.user_name} ({alert.status})
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. Plot Incidents from database */}
        {incidents.map((inc) => {
          // Parse dynamic coords or give arbitrary offset based on ID to avoid stack overlaps
          const offsetLat = 40.7300 + ((inc.id * 13) % 7) * 0.008;
          const offsetLng = -73.9900 + ((inc.id * 17) % 11) * 0.005;
          const coords = getSvgCoordinates(offsetLat, offsetLng);
          return (
            <div
              key={`inc-${inc.id}`}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className="group relative">
                <div className={`p-1 rounded-full text-white shadow-md cursor-pointer ${
                  inc.status === 'RESOLVED' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                {/* Hover overlay text */}
                <div className="absolute hidden group-hover:block bottom-6 left-1/2 -translate-x-1/2 bg-[#141414] border border-white/5 text-slate-100 text-[10px] p-2.5 rounded-xl w-44 z-30 shadow-2xl leading-tight font-sans">
                  <p className="font-bold text-white">{inc.incident_type}</p>
                  <p className="text-slate-400 mt-0.5 line-clamp-2">{inc.description}</p>
                  <p className="text-slate-500 mt-1 text-[8px] font-mono uppercase tracking-wider">{inc.location}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* 4. CURRENT USER SELECTED PIN (for triggering SOS or Incident) */}
        <div
          style={{ left: `${currentPin.x}%`, top: `${currentPin.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center">
            <div className="p-1 px-2.5 bg-red-650 rounded text-white text-[9px] font-bold shadow-md whitespace-nowrap mb-1 uppercase font-mono tracking-wider">
              Selected Pos
            </div>
            <div className="relative">
              <span className="absolute w-6 h-6 rounded-full bg-red-500 opacity-40 animate-ping"></span>
              <Crosshair className="w-5 h-5 text-red-500 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        </div>

      </div>

      {/* Map Action / Selection Details Details */}
      <div className="p-4 bg-[#141414] border-t border-white/5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <span className="text-slate-400 text-[11px]">
            {interactive
              ? 'Click anywhere on the map grid or select a predefined Hotspot to relocate your virtual position.'
              : 'Static overview map with active coordinates feed.'}
          </span>
        </div>

        {selectedLandmark && (
          <div className="bg-[#141414] border border-white/10 p-4 rounded-xl text-white max-w-sm absolute bottom-16 right-4 z-40 shadow-2xl animate-fade-in text-xs">
            <h4 className="font-bold text-red-500 flex items-center gap-1 font-display uppercase tracking-wider text-[11px]">
              <Shield className="w-3.5 h-3.5" />
              {selectedLandmark.name}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{selectedLandmark.description}</p>
            <button
              onClick={() => setSelectedLandmark(null)}
              className="text-[9px] text-red-400 hover:text-red-300 font-bold mt-2 uppercase tracking-wide cursor-pointer font-mono"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
