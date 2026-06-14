/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ClipboardList, Check, RefreshCw, Eye, UserCheck, Smartphone, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { SOSAlert, IncidentReport, DashboardStats, User } from '../types';

interface AdminPanelProps {
  onAdminActionHappened?: () => void;
  usersList: User[];
  onRefreshUsers?: () => void;
}

export default function AdminPanel({
  onAdminActionHappened,
  usersList = [],
  onRefreshUsers,
}: AdminPanelProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Active state tab inside admin panel
  const [activeTab, setActiveTab] = useState<'alerts' | 'incidents' | 'users'>('alerts');

  useEffect(() => {
    loadDashboardMetrics();
    if (onRefreshUsers) {
      onRefreshUsers();
    }
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Access denied or failed to load statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      setErrorMessage('');
      setFeedbackMessage('');
      const response = await api.resolveAlert(id);
      setFeedbackMessage(`Emergency alert #${id} status marked as RESOLVED.`);
      
      // Update local state
      if (stats) {
        const updatedAlerts = stats.recentAlerts.map(a => a.id === id ? { ...a, status: 'RESOLVED' as const } : a);
        const resolvedCount = updatedAlerts.filter(a => a.status === 'RESOLVED').length;
        const activeCount = updatedAlerts.filter(a => a.status === 'ACTIVE').length;
        
        setStats({
          ...stats,
          activeAlerts: activeCount,
          resolvedAlerts: resolvedCount,
          recentAlerts: updatedAlerts,
        });
      }

      if (onAdminActionHappened) {
        onAdminActionHappened();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authorization error resolving alert.');
    }
  };

  const handleIncidentStatusUpdate = async (id: number, nextStatus: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED') => {
    try {
      setErrorMessage('');
      setFeedbackMessage('');
      const response = await api.updateIncidentStatus(id, nextStatus);
      setFeedbackMessage(`Incident Report #${id} status changed to: ${nextStatus}.`);
      
      // Update local state
      if (stats) {
        const updatedIncidents = stats.recentIncidents.map(i => i.id === id ? response.incident : i);
        setStats({
          ...stats,
          recentIncidents: updatedIncidents,
        });
      }

      if (onAdminActionHappened) {
        onAdminActionHappened();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update incident state.');
    }
  };

  return (
    <div className="space-y-6" id="admin-panel-module">
      
      {/* Metrics Banner */}
      {isLoading ? (
        <div className="flex justify-center py-8 bg-[#141414] rounded-2xl border border-white/5 text-slate-500 text-xs font-mono uppercase tracking-widest gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
          <span>Syncing administrative data...</span>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <span className="text-[8px] uppercase tracking-widest font-mono text-slate-500 font-bold">Active SOS Triggers</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-red-500">{stats.activeAlerts}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Requiring immediate dispatcher action</p>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <span className="text-[8px] uppercase tracking-widest font-mono text-slate-500 font-bold">Resolved SOS Cases</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-emerald-500">{stats.resolvedAlerts}</span>
              <Shield className="w-4 h-4 text-emerald-555" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Marked secure by community safety experts</p>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <span className="text-[8px] uppercase tracking-widest font-mono text-slate-500 font-bold">Total Security Alerts</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-slate-100">{stats.totalAlerts}</span>
              <ShieldAlert className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">All-time emergency history registered</p>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <span className="text-[8px] uppercase tracking-widest font-mono text-slate-500 font-bold">Reported Safe-Hazards</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-amber-500">{stats.totalIncidents}</span>
              <ClipboardList className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Crowdsourced local details feed</p>
          </div>
        </div>
      ) : null}

      {errorMessage && (
        <div className="bg-red-950/20 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs font-sans animate-fade-in">
          {errorMessage}
        </div>
      )}

      {feedbackMessage && (
        <div className="bg-[#14532d]/25 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-1.5 font-sans animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Main Admin Controllers */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {/* Tab Controls */}
        <div className="bg-[#0c0c0c] border-b border-white/5 flex flex-wrap items-center justify-between p-2 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                activeTab === 'alerts' ? 'bg-red-600 text-white shadow-lg shadow-red-650/15' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Emergency Alerts ({stats?.activeAlerts || 0} Live)
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                activeTab === 'incidents' ? 'bg-amber-600 text-white shadow-lg shadow-amber-650/15' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Hazard Incidents Review
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                activeTab === 'users' ? 'bg-zinc-800 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Users Directory ({usersList.length})
            </button>
          </div>

          <button
            onClick={loadDashboardMetrics}
            className="p-2 border border-white/5 bg-[#0a0a0a] text-slate-400 hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg hover:border-white/10 transition cursor-pointer mr-1 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3 text-amber-500" />
            <span>Sync Matrix</span>
          </button>
        </div>

        {/* Content Screens */}
        <div className="p-5 min-h-[18rem] text-xs">

          {/* tab 1: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider border-b border-white/5 pb-2.5">Active & Historical SOS Broadcasts</h3>

              {!stats || stats.recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-550 italic font-mono uppercase tracking-wider text-[11px]">
                  No SOS alerts registered in the tracking ledger.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 text-[9px] uppercase font-mono tracking-wider">
                        <th className="py-2.5 font-bold">User Reference</th>
                        <th className="py-2.5 font-bold">Alert Time Date</th>
                        <th className="py-2.5 font-bold">Coordinates (Lat, Lng)</th>
                        <th className="py-2.5 font-bold">Contacts Dispatched</th>
                        <th className="py-2.5 font-bold">Tracking Status</th>
                        <th className="py-2.5 px-2 font-bold text-right font-sans">Emergency Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {stats.recentAlerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-white/[0.01] transition">
                          <td className="py-3.5 pr-2 font-medium">
                            <div>
                              <p className="text-white font-bold">{alert.user_name}</p>
                              <p className="text-slate-500 font-mono text-[9px]">{alert.user_phone}</p>
                            </div>
                          </td>
                          <td className="py-3.5 pr-2 text-slate-400 font-mono text-[10px]">
                            {new Date(alert.alert_time).toLocaleString()}
                          </td>
                          <td className="py-3.5 pr-2 font-mono text-[9px] text-slate-400">
                            COORD: {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
                          </td>
                          <td className="py-3.5 pr-2">
                            <div className="flex flex-col gap-0.5 max-h-12 overflow-y-auto">
                              {alert.notifications_sent && alert.notifications_sent.length > 0 ? (
                                alert.notifications_sent.map((n, idx) => (
                                  <div key={idx} className="text-[10px] flex items-center gap-1.5 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-slate-400 capitalize truncate max-w-[9rem]">{n.contact_name}:</span>
                                    <span className="text-emerald-450 text-[9px] font-mono font-bold select-none">SENT</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-red-500 text-[10px] italic font-mono uppercase tracking-wider text-[9px]">No contacts notified</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 pr-2">
                            <span className={`px-2.5 py-0.5 text-[8px] rounded-full font-bold font-mono tracking-wider border ${
                              alert.status === 'ACTIVE'
                                ? 'bg-red-950/20 text-red-400 border-red-550/20 animate-pulse'
                                : 'bg-zinc-900 text-slate-500 border-white/5'
                            }`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {alert.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                className="bg-emerald-600 hover:bg-emerald-555 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition cursor-pointer"
                              >
                                Resolve SOS
                              </button>
                            ) : (
                              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] pr-2">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* tab 2: INCIDENTS */}
          {activeTab === 'incidents' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider border-b border-white/5 pb-2.5">Hazard Incidents Evaluation Registry</h3>

              {!stats || stats.recentIncidents.length === 0 ? (
                <div className="text-center py-8 text-slate-550 italic font-mono uppercase tracking-wider text-[11px]">
                  No community incidents posted for review.
                </div>
              ) : (
                <div className="space-y-4.5">
                  {stats.recentIncidents.map((inc) => (
                    <div key={inc.id} className="bg-[#0a0a0a] p-5 border border-white/5 rounded-2xl space-y-3.5 hover:border-white/10 transition">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-xs">{inc.incident_type}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: #{inc.id}</span>
                          <span className="text-[10px] text-slate-550">Reported by: <strong>{inc.user_name}</strong> ({inc.user_phone})</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <p className="text-[9px] text-slate-500 font-mono mr-1">{new Date(inc.created_at).toLocaleString()}</p>
                          <select
                            value={inc.status}
                            onChange={(e) => handleIncidentStatusUpdate(inc.id, e.target.value as any)}
                            className={`px-3 py-1.5 text-[9px] font-bold tracking-wider font-mono uppercase bg-black border rounded-xl cursor-pointer focus:outline-none ${
                              inc.status === 'RESOLVED'
                                ? 'bg-emerald-950/20 border-emerald-550/20 text-emerald-400'
                                : inc.status === 'UNDER_REVIEW'
                                ? 'bg-sky-950/20 border-sky-550/20 text-sky-400'
                                : 'bg-amber-950/20 border-amber-550/20 text-amber-550'
                            }`}
                          >
                            <option value="PENDING" className="bg-black text-white">PENDING</option>
                            <option value="UNDER_REVIEW" className="bg-black text-white">UNDER REVIEW</option>
                            <option value="RESOLVED" className="bg-black text-white">RESOLVED</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed text-xs break-words font-sans">{inc.description}</p>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-520 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pinned Address: <strong className="text-white">{inc.location}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* tab 3: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider border-b border-white/5 pb-2.5">Registered Authorized Security Personnel</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 text-[9px] uppercase font-mono tracking-wider">
                      <th className="py-2.5 font-bold">Visual ID</th>
                      <th className="py-2.5 font-bold">User Name Details</th>
                      <th className="py-2.5 font-bold">Email Coordinate</th>
                      <th className="py-2.5 font-bold">Active Mobile</th>
                      <th className="py-2.5 font-bold">System Role Hierarchy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/[0.01] transition text-slate-300">
                        <td className="py-3.5 pr-2 font-mono text-[9px] text-slate-500">
                          #{usr.id}
                        </td>
                        <td className="py-3.5 pr-2 font-bold text-white">
                          {usr.name}
                        </td>
                        <td className="py-3.5 pr-2 font-mono text-slate-400">
                          {usr.email}
                        </td>
                        <td className="py-3.5 pr-2 font-mono text-slate-400">
                          {usr.phone}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold font-mono border ${
                            usr.role === 'admin'
                              ? 'bg-red-500/10 text-red-400 border-red-500/15'
                              : 'bg-zinc-900 text-slate-500 border-white/5'
                          }`}>
                            {usr.role.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
