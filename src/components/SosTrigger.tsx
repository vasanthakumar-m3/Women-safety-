/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, X, Flame, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { SOSAlert } from '../types';

interface SosTriggerProps {
  latitude: number;
  longitude: number;
  address: string;
  onAlertTriggered: (alert: SOSAlert, simulatedLogs: any[]) => void;
  contactsCount: number;
}

export default function SosTrigger({
  latitude,
  longitude,
  address,
  onAlertTriggered,
  contactsCount,
}: SosTriggerProps) {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [latestAlert, setLatestAlert] = useState<SOSAlert | null>(null);

  // Handle countdown logic
  useEffect(() => {
    let timer: any;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      fireSOS();
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown]);

  const handleSOSClick = () => {
    if (isProcessing) return;
    setTriggerStatus('idle');
    setErrorMessage('');
    
    // Start standard safety countdown
    setIsCountingDown(true);
    setCountdown(3);
  };

  const cancelSOS = () => {
    setIsCountingDown(false);
    setCountdown(3);
  };

  const fireSOS = async () => {
    setIsProcessing(true);
    setTriggerStatus('idle');

    // Prepare simulated telemetry streams for the Logger
    const logTimestamp = () => new Date().toLocaleTimeString();
    const mockLogs: { timestamp: string; type: 'info' | 'success' | 'warn' | 'error'; message: string }[] = [
      { timestamp: logTimestamp(), type: 'info', message: 'Initiating SOS emergency sequence...' },
      { timestamp: logTimestamp(), type: 'info', message: `Establishing GPS handshake...` },
    ];

    let precisionLat = latitude;
    let precisionLng = longitude;

    // Use Web API Geolocation standard if framing permission exists
    try {
      mockLogs.push({ timestamp: logTimestamp(), type: 'info' as const, message: 'Requesting device location permissions...' });
      
      const geoPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
        });
      });
      
      precisionLat = geoPosition.coords.latitude;
      precisionLng = geoPosition.coords.longitude;
      mockLogs.push({
        timestamp: logTimestamp(),
        type: 'success' as const,
        message: `High-precision GPS acquired: Lat ${precisionLat.toFixed(6)}, Lng ${precisionLng.toFixed(6)}`
      });
    } catch (e: any) {
      // Graceful fallback to map simulation coordinates
      mockLogs.push({
        timestamp: logTimestamp(),
        type: 'warn' as const,
        message: `Direct iframe GPS blocked or timed out. Falling back to targeted map simulation coordinates.`
      });
      mockLogs.push({
        timestamp: logTimestamp(),
        type: 'info' as const,
        message: `Active Coordinates: Lat ${precisionLat.toFixed(6)}, Lng ${precisionLng.toFixed(6)}`
      });
    }

    mockLogs.push({ timestamp: logTimestamp(), type: 'info' as const, message: 'Sending localized alert dispatch payloads to Express backplane...' });

    try {
      const response = await api.triggerSOS(precisionLat, precisionLng);
      setLatestAlert(response.alert);
      setTriggerStatus('success');

      mockLogs.push({ timestamp: logTimestamp(), type: 'success' as const, message: 'Central database updated. Emergency Alert is now ACTIVE.' });
      
      if (contactsCount === 0) {
        mockLogs.push({
          timestamp: logTimestamp(),
          type: 'warn' as const,
          message: 'Notification warning: No emergency contacts configured in profile. Unable to dispatch automated emails/SMS.'
        });
      } else {
        mockLogs.push({
          timestamp: logTimestamp(),
          type: 'info' as const,
          message: `Attempting automated notification dispatches to ${contactsCount} listed contacts...`
        });

        // Add details of each individual sent notification
        response.alert.notifications_sent?.forEach((notif: any) => {
          mockLogs.push({
            timestamp: logTimestamp(),
            type: 'success' as const,
            message: `SMTP DISPATCHED: Alert email queued dynamically for [${notif.contact_name}] -> Status: OK`
          });
          mockLogs.push({
            timestamp: logTimestamp(),
            type: 'success' as const,
            message: `SMS DISPATCHED: Distress safety beacon sent to [${notif.contact_phone}]`
          });
        });
      }
      
      mockLogs.push({ timestamp: logTimestamp(), type: 'success' as const, message: 'SOS protocol completion. Tracking enabled on admin dashboard monitors.' });
      
      onAlertTriggered(response.alert, mockLogs);
    } catch (err: any) {
      setTriggerStatus('error');
      setErrorMessage(err.message || 'Verification token failed or network interrupted.');
      mockLogs.push({
        timestamp: logTimestamp(),
        type: 'error' as const,
        message: `SOS Protocol FAULT: ${err.message || 'Network unavailable'}`
      });
      onAlertTriggered(null as any, mockLogs);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="sos-trigger-module">
      
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          Emergency SOS Activator
        </h2>
        <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
          Press the button below during a confrontation or dangerous situation. Browser coordinates will be broadcast instantly.
        </p>

        {/* SOS Toggle Button Stage */}
        <div className="my-8 relative flex items-center justify-center h-48 w-48 bg-black/25 rounded-full border border-white/5">
          
          {/* Glowing rings */}
          {!isCountingDown && !isProcessing && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping opacity-75"></div>
              <div className="absolute inset-4 rounded-full bg-red-600/20 animate-pulse"></div>
            </>
          )}

          {isCountingDown && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-emerald-500 animate-spin"></div>
          )}

          {/* Core Clickable Button with Motion animations simulated using classes */}
          <button
            onClick={handleSOSClick}
            disabled={isCountingDown || isProcessing}
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center font-bold text-lg transition-all duration-200 select-none shadow-2xl ${
              isCountingDown
                ? 'bg-amber-600 text-white cursor-pointer border-4 border-amber-500 scale-95'
                : isProcessing
                ? 'bg-[#0a0a0a] text-slate-500 border-4 border-white/5'
                : 'bg-red-600 hover:bg-red-500 text-white cursor-pointer border-4 border-red-700 active:scale-95 shadow-[0_0_25px_rgba(220,38,38,0.35)]'
            }`}
          >
            {isCountingDown ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl animate-bounce font-display font-medium">{countdown}</span>
                <span className="text-[9px] tracking-widest uppercase opacity-85 mt-2 font-mono">Initializing</span>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-1">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-[9px] tracking-widest uppercase mt-1 font-mono">Dispatched</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ShieldAlert className="w-8 h-8 animate-pulse text-white mt-1" />
                <span className="text-2xl tracking-widest font-black font-display text-white">SOS</span>
                <span className="text-[8px] uppercase tracking-widest opacity-80 font-mono">Click to Arm</span>
              </div>
            )}
          </button>
        </div>

        {/* Cancel actions or current GPS position summary */}
        {isCountingDown && (
          <button
            onClick={cancelSOS}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-950/50 hover:bg-red-900 border border-red-500/20 text-red-200 text-xs rounded-full transition cursor-pointer mb-6 animate-pulse"
          >
            <X className="w-3.5 h-3.5" />
            <span className="font-mono uppercase text-[10px] tracking-wider">Cancel Alert</span>
          </button>
        )}

        {/* Location display overlay */}
        <div className="bg-[#0a0a0a] rounded-xl p-3.5 w-full border border-white/5 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-medium tracking-wide text-xs">Telemetry Posture</span>
          </div>
          <div className="text-left bg-black/40 p-2.5 rounded-lg text-[10px] font-mono text-slate-400 flex flex-col gap-1">
            <span className="truncate"><strong className="text-slate-500">ADDR:</strong> {address}</span>
            <span><strong className="text-slate-500">LATI:</strong> {latitude.toFixed(6)}</span>
            <span><strong className="text-slate-500">LONG:</strong> {longitude.toFixed(6)}</span>
          </div>
        </div>

        {/* SOS STATUS NOTIFIER */}
        {triggerStatus === 'success' && latestAlert && (
          <div className="mt-4 p-3.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex gap-2.5 text-left">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-white">Alert Triggered</h4>
              <p className="text-[10px] opacity-90 mt-1 leading-relaxed text-slate-300 font-sans">
                Beacon #{latestAlert.id} registered. Safety channels are aligned, and dispatch telemetry has been deployed to {contactsCount} emergency contacts.
              </p>
            </div>
          </div>
        )}

        {triggerStatus === 'error' && (
          <div className="mt-4 p-3.5 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl text-xs flex gap-2.5 text-left">
            <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-white">Alert Interrupted</h4>
              <p className="text-[10px] opacity-90 mt-1 leading-relaxed text-slate-300 font-sans">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
