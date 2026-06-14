/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertOctagon, MapPin, ClipboardList, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { IncidentReport } from '../types';

interface IncidentFormProps {
  locationPresetAddress?: string;
  onNewReportCreated?: (incident: IncidentReport) => void;
}

export default function IncidentForm({
  locationPresetAddress = '',
  onNewReportCreated,
}: IncidentFormProps) {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [incidentType, setIncidentType] = useState<'Harassment' | 'Stalking' | 'Unsafe Area' | 'Theft' | 'Other'>('Unsafe Area');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');

  // Prefill when location preset changes
  useEffect(() => {
    if (locationPresetAddress) {
      setLocationName(locationPresetAddress);
    }
  }, [locationPresetAddress]);

  useEffect(() => {
    loadMyIncidents();
  }, []);

  const loadMyIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve historic report entries.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !locationName.trim()) {
      setErrorMessage('Please describe the situation and pinpoint a location.');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      setIsSubmitting(true);

      const response = await api.submitIncident({
        incident_type: incidentType,
        description,
        location: locationName,
      });

      setSuccessMessage('Incident details sent to administrators successfully.');
      setIncidents(prev => [response.incident, ...prev]);
      
      // Notify parent to refresh central feeds if coordinates matched
      if (onNewReportCreated) {
        onNewReportCreated(response.incident);
      }

      // Reset
      setDescription('');
      // Leave types as they are
    } catch (err: any) {
      setErrorMessage(err.message || 'Incident submission rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="incident-form-module">
      {/* 1. Report Form */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
          <AlertOctagon className="w-4 h-4 text-amber-500 animate-pulse" />
          <h2 className="text-xs font-bold text-white font-display uppercase tracking-wider">Report Community Incident / Safety Alert</h2>
        </div>

        {errorMessage && (
          <div className="mb-4 bg-red-950/20 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs flex gap-1.5 items-center font-sans animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-[#14532d]/25 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs flex gap-1.5 items-center font-sans animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Incident Category</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as any)}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Unsafe Area">Unsafe Area (Lack of light/Suspicious layout)</option>
                <option value="Harassment">Harassment / Intimidation</option>
                <option value="Stalking">Stalking / Shadowing</option>
                <option value="Theft">Deceptive Theft / Robbery</option>
                <option value="Other">Other Active Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Report Incident Area / Location</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Street intersection, building, subway line..."
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500"
                  required
                />
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                Tip: Click anywhere on the map above to select custom coordinates!
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Describe the Situation</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a constructive description of what transpired..."
              className="w-full h-24 bg-[#0a0a0a] border border-white/5 rounded-xl p-3.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-550 resize-none font-sans"
              required
            ></textarea>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition disabled:bg-zinc-850 disabled:text-zinc-650 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Transmitting report details...' : 'Transmit Community Report'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Historic Incident Reports Log */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-white font-display uppercase tracking-wider">Your Submitted Safety Logs</h2>
          </div>
          <button
            onClick={loadMyIncidents}
            className="p-2 border border-white/5 bg-[#0a0a0a] text-slate-450 hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg hover:border-white/10 transition cursor-pointer"
          >
            Refresh Logs
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 text-slate-500 text-xs font-mono uppercase tracking-widest gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Retrieving safety logs...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
            You have not submitted any incident records.
          </div>
        ) : (
          <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div key={inc.id} className="bg-[#0a0a09]/50 border border-white/5 p-4 rounded-xl text-xs space-y-3 hover:border-white/10 transition">
                <div className="flex items-center justify-between gap-2.5 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{inc.incident_type}</span>
                    <span className="text-[9px] text-slate-500 font-mono">Report #{inc.id}</span>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold font-mono tracking-wider border ${
                    inc.status === 'RESOLVED'
                      ? 'bg-emerald-950/25 text-emerald-400 border-emerald-500/10'
                      : inc.status === 'UNDER_REVIEW'
                      ? 'bg-sky-950/25 text-sky-400 border-sky-500/10'
                      : 'bg-amber-950/25 text-amber-500 border-amber-500/10'
                  }`}>
                    {inc.status?.replace('_', ' ') || 'PENDING'}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed break-words">{inc.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] text-slate-500 font-mono mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-600" />
                    <span>{inc.location}</span>
                  </div>
                  <span>{new Date(inc.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
