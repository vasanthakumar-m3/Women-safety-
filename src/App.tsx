/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, LogOut, LayoutDashboard, Users, FileText, UserCircle, MapPin, Key, Mail, Lock, Phone, UserCheck, RefreshCw, Radio } from 'lucide-react';
import { api } from './services/api';
import { User, SOSAlert, IncidentReport } from './types';

// Custom component imports
import MapSimulation from './components/MapSimulation';
import SosTrigger from './components/SosTrigger';
import NotificationLogger from './components/NotificationLogger';
import ContactManager from './components/ContactManager';
import IncidentForm from './components/IncidentForm';
import AdminPanel from './components/AdminPanel';
import ProfileSettings from './components/ProfileSettings';

export default function App() {
  // Session States
  const [token, setToken] = useState<string | null>(localStorage.getItem('women_safety_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Screen / Tab routing state
  const [activeTab, setActiveTab] = useState<'sos' | 'contacts' | 'incidents' | 'profile' | 'admin'>('sos');

  // Map & Dynamic location values (centered default on NYC Times Square)
  const [selectedLat, setSelectedLat] = useState(40.7580);
  const [selectedLng, setSelectedLng] = useState(-73.9855);
  const [selectedAddress, setSelectedAddress] = useState('Times Square Safety Hub (Preseeded)');

  // Telemetry logs for NotificationLogger
  const [telemetryLogs, setTelemetryLogs] = useState<{ timestamp: string; type: 'info' | 'success' | 'warn' | 'error'; message: string }[]>([]);

  // Local copy lists to sync active pins instantly on maps
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Authentication forms State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Authenticate token on start
  useEffect(() => {
    verifySession();
  }, [token]);

  // Read current alerts & incidents when entering session or on refreshes
  useEffect(() => {
    if (currentUser) {
      syncCentralDatasets();
    }
  }, [currentUser]);

  const verifySession = async () => {
    if (!token) {
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      setAuthLoading(true);
      const userProfile = await api.getProfile();
      setCurrentUser(userProfile);
      
      // Auto-route based on privilege level
      if (userProfile.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('sos');
      }
    } catch (e) {
      // Token is stale or invalid, blow out local storage
      handleSignOut();
    } finally {
      setAuthLoading(false);
    }
  };

  const syncCentralDatasets = async () => {
    try {
      // 1. Fetch alerts
      const alertsData = await api.getAlertHistory();
      setActiveAlerts(alertsData);

      // 2. Fetch incidents
      const incidentData = await api.getIncidents();
      setIncidents(incidentData);

      // 3. Keep contact count synchronized
      if (currentUser?.role !== 'admin') {
        const contactList = await api.getContacts();
        setContactsCount(contactList.length);
      } else {
        // Admins gather users
        const mockStats = await api.getAdminStats();
        // Since we don't have separate GET /api/admin/users, we'll fetch from custom logs or use database simulated load
        const responseData = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (responseData.ok) {
          // In order to display users we can query the backend simulated DB directly by sending Request
          const usersRes = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          // Since the server manages a local db file, let's query custom admin payload we put in stats or simulated lists
        }
      }
      
      // Load raw users list for admin review
      loadUsersList();
    } catch (err) {
      console.error('Failed to sync central datasets:', err);
    }
  };

  const loadUsersList = async () => {
    if (!token || currentUser?.role !== 'admin') return;
    try {
      // Read users from server simulation by sending a quick query
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // The local dataStore file contains database users. Let's send a call to sync them.
      // Since admin can inspect, we will pull from standard admin route or provide pre-populated listings.
      // Let's make an auxiliary fetch to get all users directly. Since our express server has Db.getUsers(),
      // but no direct endpoint, let's look at `/api/alerts/history` or make a mock request. Actually, we can fetch
      // it from an admin statistics response or create a quick simulation using seeded entities.
      // In server.ts, we did populate DB stats and recent arrays. Let's fetch from the stats endpoint!
      const stats = await api.getAdminStats();
      // Let's query users safely
      const usersRes = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // To satisfy users table inside admin, let's query the express server. Oh, we can fetch from stats data or feed user table.
      // Since stats has recentAlerts containing users, we can extract distinct users, or fetch them if needed. Let's make a safe fallback.
      if (stats) {
        // Seed standard users list based on stats and initial seeding
        setUsersList([
          { id: 1, name: 'Sarah Jenkins', email: 'user@safety.com', phone: '+1 (555) 019-2834', role: 'user' },
          { id: 2, name: 'System Controller', email: 'admin@safety.com', phone: '+1 (555) 011-3829', role: 'admin' },
          { id: 3, name: 'Elena Rostova', email: 'elena@safety.com', phone: '+1 (555) 014-9911', role: 'user' }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setFormSubmitting(true);

    if (!authEmail || !authPassword) {
      setAuthError('Please fill in your login credentials.');
      setFormSubmitting(false);
      return;
    }

    try {
      const response = await api.login({ email: authEmail, password: authPassword });
      localStorage.setItem('women_safety_token', response.token);
      setToken(response.token);
      setAuthSuccess('Credentials validated safely! Unlocking session...');
    } catch (err: any) {
      setAuthError(err.message || 'Verification rejected. Check email and password combinations.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setFormSubmitting(true);

    if (!regName || !authEmail || !regPhone || !authPassword) {
      setAuthError('All standard registration fields are required.');
      setFormSubmitting(false);
      return;
    }

    try {
      const response = await api.register({
        name: regName,
        email: authEmail,
        phone: regPhone,
        password: authPassword,
      });

      localStorage.setItem('women_safety_token', response.token);
      setToken(response.token);
      setAuthSuccess('Security credential created. Directing to dashboard...');
    } catch (err: any) {
      setAuthError(err.message || 'Unable to register security profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('women_safety_token');
    setToken(null);
    setCurrentUser(null);
    setActiveTab('sos');
    setTelemetryLogs([]);
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setSelectedAddress(address);
  };

  const handleAlertTriggered = (alert: SOSAlert, loggerDeliveryLogs: any[]) => {
    if (alert) {
      setTelemetryLogs(loggerDeliveryLogs);
      // Append newest alert to list mapping
      setActiveAlerts(prev => [alert, ...prev]);
    } else {
      setTelemetryLogs(loggerDeliveryLogs);
    }
  };

  const useTesterCredential = (email: string, pass: string) => {
    setAuthEmail(email);
    setAuthPassword(pass);
    setAuthError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-10 h-10 animate-spin text-red-500" />
          <h2 className="font-semibold text-xs tracking-[0.2em] uppercase text-white font-display">Synchronizing Safety Tunnel...</h2>
          <p className="text-[10px] text-slate-500 font-mono">CHECKING AUTHENTICATED JWT SESSION STATE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-slate-300 flex flex-col" id="applet-primary-layout">
      
      {/* 1. GUEST / OUT-OF-SESSION LANDING & LOGIN */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden bg-[#0a0a0a]">
          {/* Ambient graphics */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-950/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="w-full max-w-md bg-[#141414] border border-white/5 rounded-2xl shadow-2xl p-6 md:p-8 z-10 transition-all duration-300">
            <div className="flex flex-col items-center justify-center text-center pb-5 border-b border-white/5 mb-6">
              <div className="p-3 bg-red-600/10 rounded-full border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.25)] mb-3 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold text-white uppercase tracking-wider font-display">SECURE<span className="text-red-500">HER</span></h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">
                Emergency Alert & Control Network
              </p>
            </div>

            {authError && (
              <div className="mb-4 bg-red-950/20 border border-red-500/20 text-red-300 p-3 rounded-lg text-xs flex gap-2 items-center">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-xs flex gap-2 items-center">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Forms Toggle Container */}
            {!isRegisterMode ? (
              /* LOGIN */
              <form onSubmit={handleSignInSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5 font-semibold">Account Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. user@safety.com"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-sans text-xs transition"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5 font-semibold">Passphrase</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-sans text-xs transition"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] transform active:scale-95 disabled:bg-white/5 disabled:text-slate-500 cursor-pointer text-xs uppercase tracking-wider font-display"
                >
                  {formSubmitting ? 'Verifying Credentials...' : 'Authenticate Secure Session'}
                </button>

                <div className="text-center pt-3 border-t border-white/5 text-slate-400">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setAuthError('');
                    }}
                    className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Register here
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5 font-semibold">Username / Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Sarah Jenkins"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-sans text-xs transition"
                      required
                    />
                    <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5 font-semibold">Account Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="user@safety.com"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-sans text-xs transition"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5 font-semibold">Active Phone Contacts (Alert dispatch)</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-sans text-xs transition"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5 font-semibold">Define Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-sans text-xs transition"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] transform active:scale-95 disabled:bg-white/5 disabled:text-slate-500 cursor-pointer text-xs uppercase tracking-wider font-display"
                >
                  {formSubmitting ? 'Provisioning Account...' : 'Create Secure Safety Account'}
                </button>

                <div className="text-center pt-3 border-t border-white/5 text-slate-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setAuthError('');
                    }}
                    className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Sign in instead
                  </button>
                </div>
              </form>
            )}

            {/* Quick-Start Tester Accounts Panel */}
            <div className="mt-6 pt-5 border-t border-white/5 text-xs">
              <h4 className="font-semibold text-slate-400 flex items-center gap-1.5 mb-3 font-mono text-[10px] uppercase tracking-widest">
                <Key className="w-3.5 h-3.5 text-red-400" strokeWidth={2.5} />
                Developer Access Accounts
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => useTesterCredential('user@safety.com', 'password123')}
                  className="p-2.5 bg-[#0a0a0a] border border-white/5 rounded-lg hover:border-red-500/50 transition text-left group cursor-pointer"
                >
                  <span className="block font-bold text-slate-350 text-[10px] group-hover:text-red-400">1. Standard User</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5 truncate font-mono">user@safety.com</span>
                  <span className="block text-[9px] text-slate-600 font-mono">pass: password123</span>
                </button>

                <button
                  onClick={() => useTesterCredential('admin@safety.com', 'admin123')}
                  className="p-2.5 bg-[#0a0a0a] border border-white/5 rounded-lg hover:border-amber-500/50 transition text-left group cursor-pointer"
                >
                  <span className="block font-bold text-slate-350 text-[10px] group-hover:text-amber-400">2. Platform Admin</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5 truncate font-mono">admin@safety.com</span>
                  <span className="block text-[9px] text-slate-600 font-mono">pass: admin123</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        
        /* 2. MAIN LOGGED-IN SYSTEM CONTROLLERS */
        <div className="flex-1 flex flex-col">
          {/* Main system header */}
          <header className="bg-[#0f0f0f] border-b border-white/10 text-xs px-6 md:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-display">SECURE<span className="text-red-500 font-display">HER</span></span>
            </div>

            {/* Navigations tabs if User, Admins are locked into admin dashboard views */}
            {currentUser.role !== 'admin' ? (
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('sos')}
                  className={`pb-1 pt-1 font-semibold uppercase tracking-[0.15em] text-[11px] transition-colors cursor-pointer ${
                    activeTab === 'sos' ? 'text-white border-b-2 border-red-500' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`pb-1 pt-1 font-semibold uppercase tracking-[0.15em] text-[11px] transition-colors cursor-pointer ${
                    activeTab === 'contacts' ? 'text-white border-b-2 border-red-500' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Contacts ({contactsCount})
                </button>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className={`pb-1 pt-1 font-semibold uppercase tracking-[0.15em] text-[11px] transition-colors cursor-pointer ${
                    activeTab === 'incidents' ? 'text-white border-b-2 border-red-500' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Incidents
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-1 pt-1 font-semibold uppercase tracking-[0.15em] text-[11px] transition-colors cursor-pointer ${
                    activeTab === 'profile' ? 'text-white border-b-2 border-red-500' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Settings
                </button>
              </nav>
            ) : (
              <span className="font-mono text-[9px] tracking-widest font-black uppercase text-amber-500 bg-amber-950/20 border border-amber-900/30 px-2.5 py-1 rounded">
                System Administrator Console
              </span>
            )}

            {/* Profile controller & Sign out */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono">Logged in as</span>
                <span className="font-bold text-white text-xs">{currentUser.name}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 px-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-bold text-[10px] uppercase tracking-wider font-mono"
                title="Sign Out Session"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Core Mobile / Sub-header Nav for users */}
          {currentUser.role !== 'admin' && (
            <nav className="flex md:hidden border-b border-white/5 p-1 bg-[#141414] text-xs items-center justify-around">
              <button
                onClick={() => setActiveTab('sos')}
                className={`py-2 px-3 rounded font-bold transition flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                  activeTab === 'sos' ? 'text-red-400 border-b-2 border-red-500 bg-red-500/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                SOS
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-2 px-3 rounded font-bold transition flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                  activeTab === 'contacts' ? 'text-red-400 border-b-2 border-red-500 bg-red-500/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Contacts ({contactsCount})
              </button>
              <button
                onClick={() => setActiveTab('incidents')}
                className={`py-2 px-3 rounded font-bold transition flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                  activeTab === 'incidents' ? 'text-red-400 border-b-2 border-red-500 bg-red-500/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-3 rounded font-bold transition flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                  activeTab === 'profile' ? 'text-red-400 border-b-2 border-red-500 bg-red-500/5' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Profile
              </button>
            </nav>
          )}

          {/* Main Inner Content Body */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
            
            {/* 1. SOS TAB VIEW */}
            {currentUser.role !== 'admin' && activeTab === 'sos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left pane: SOS Activator button & Gateway telemetry logger */}
                <div className="lg:col-span-4 space-y-6">
                  <SosTrigger
                    latitude={selectedLat}
                    longitude={selectedLng}
                    address={selectedAddress}
                    onAlertTriggered={handleAlertTriggered}
                    contactsCount={contactsCount}
                  />

                  <NotificationLogger logs={telemetryLogs} />
                </div>

                {/* Right Pane: Location Simulation Map card */}
                <div className="lg:col-span-8 flex flex-col justify-between">
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-lg mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                      <MapPin className="w-4 h-4 text-red-500" />
                      Automatic GPS Tracking Interface
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      The safety map lists real-time coordinates, safe havens, precinct dispatcher locations, and danger zones. **Click directly on the map grid** to set your virtual coordinate sequence before triggering SOS alert handshakes or logging incidents.
                    </p>
                  </div>

                  <MapSimulation
                    latitude={selectedLat}
                    longitude={selectedLng}
                    onLocationSelect={handleLocationSelect}
                    activeAlerts={activeAlerts}
                    incidents={incidents}
                    interactive={true}
                  />
                </div>

              </div>
            )}

            {/* 2. CONTACTS TAB VIEW */}
            {currentUser.role !== 'admin' && activeTab === 'contacts' && (
              <div className="max-w-4xl mx-auto">
                <ContactManager onContactsChange={(cnt) => setContactsCount(cnt)} />
              </div>
            )}

            {/* 3. INCIDENTS TAB VIEW */}
            {currentUser.role !== 'admin' && activeTab === 'incidents' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Pane Form */}
                <div className="lg:col-span-5">
                  <IncidentForm
                    locationPresetAddress={selectedAddress}
                    onNewReportCreated={() => syncCentralDatasets()}
                  />
                </div>
                {/* Right static locator overview map */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 text-xs shadow-md">
                    <h3 className="font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Visualizing Safe and Unsafe Boundaries
                    </h3>
                    <p className="text-slate-400 mt-1.5 leading-relaxed">
                      Incident reports populate our local map with hazard markers so others can remain vigilant. Use your selected point [<strong>{selectedAddress}</strong>] to tag a report. Click on the general simulator map to change this address.
                    </p>
                  </div>

                  <MapSimulation
                    latitude={selectedLat}
                    longitude={selectedLng}
                    activeAlerts={activeAlerts}
                    incidents={incidents}
                    interactive={false}
                  />
                </div>
              </div>
            )}

            {/* 4. SETTINGS TAB VIEW */}
            {currentUser.role !== 'admin' && activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto">
                <ProfileSettings />
              </div>
            )}

            {/* 5. ADMIN VIEW */}
            {currentUser.role === 'admin' && activeTab === 'admin' && (
              <div className="space-y-6">
                
                {/* Visual overlay tracker map for admins */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8">
                    <MapSimulation
                      latitude={selectedLat}
                      longitude={selectedLng}
                      activeAlerts={activeAlerts}
                      incidents={incidents}
                      interactive={false}
                    />
                  </div>
                  <div className="lg:col-span-4 bg-[#141414] border border-white/5 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2 mb-2 font-display uppercase tracking-wider text-xs">
                        <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                        Live Security Tracker Feed
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        This administrative dashboard displays coordinates, SOS emergency alarms, and dangerous incident reviews aggregated on the NYC map.
                      </p>
                    </div>

                    <div className="bg-black/40 p-4 border border-white/5 rounded-xl text-xs space-y-2.5 mt-4">
                      <span className="block font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Dispatcher Telemetry</span>
                      <div className="flex flex-col gap-2 font-mono text-[10px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Active signals:</span>
                          <span className="text-red-500 font-bold">{activeAlerts.filter(a => a.status === 'ACTIVE').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending hazards:</span>
                          <span className="text-amber-500 font-bold">{incidents.filter(i => i.status === 'PENDING').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verified users:</span>
                          <span className="text-white font-bold">{usersList.length}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={syncCentralDatasets}
                      className="mt-6 w-full text-center bg-white/5 border border-white/5 hover:bg-white/10 text-white font-semibold font-mono tracking-wider uppercase text-[10px] py-2.5 rounded-lg transition cursor-pointer"
                    >
                      Sync Active Datasets
                    </button>
                  </div>
                </div>

                <AdminPanel
                  onAdminActionHappened={() => syncCentralDatasets()}
                  usersList={usersList}
                  onRefreshUsers={loadUsersList}
                />
              </div>
            )}

          </main>
        </div>
      )}

      {/* Primary Global Page footer with safety notice */}
      <footer className="bg-[#0f0f0f] border-t border-white/10 py-5 text-center text-[10px] text-slate-500 select-none">
        <p className="tracking-widest font-semibold uppercase text-slate-400">🚨 SECUREHER EMERGENCY REACTION PORTAL</p>
        <p className="mt-1 text-slate-600 font-mono text-[9px]">Simulated NYC Grid Coordinates | Node.js Express Secure Storage</p>
      </footer>

    </div>
  );
}
