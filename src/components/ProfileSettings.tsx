/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Phone, Mail, User, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadProfileDetails();
  }, []);

  const loadProfileDetails = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setName(data.name);
      setPhone(data.phone);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to scan profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Full name and active contact number are required.');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      setIsSaving(true);
      
      const response = await api.updateProfile({ name, phone });
      setProfile(response.user);
      setSuccessMessage('Profile information synchronized successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Profile save discarded.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="profile-settings-module">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
        <UserCheck className="w-4 h-4 text-red-500 animate-pulse" />
        <h2 className="text-xs font-bold text-white font-display uppercase tracking-wider">Personal Safety Profile Settings</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8 text-slate-550 text-xs font-mono uppercase tracking-widest gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
          <span>Synchronizing security profile...</span>
        </div>
      ) : (
        <form onSubmit={handleProfileUpdateSubmit} className="space-y-4.5 text-xs">
          {errorMessage && (
            <div className="bg-red-950/20 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs font-sans animate-fade-in">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-[#14532d]/25 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2 font-sans animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Profile Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
                <User className="w-3.5 h-3.5 text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Mobile Contact */}
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Active Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
                <Phone className="w-3.5 h-3.5 text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Address (Disabled) */}
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Account Email (Static)</label>
              <div className="relative">
                <div className="w-full bg-[#0c0c0c] border border-white/5 text-slate-500 rounded-xl pl-9 pr-3.5 py-2.5 select-none flex items-center h-[38px] text-xs font-mono">
                  {profile?.email}
                </div>
                <Mail className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* System Role Privilege */}
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Assigned Privileges</label>
              <div className="relative">
                <div className="w-full bg-[#0c0c0c] border border-white/5 rounded-xl pl-9 pr-3.5 py-2.5 text-red-400 select-none flex items-center h-[38px] text-[9px] font-mono font-bold uppercase tracking-wider">
                  {profile?.role.toUpperCase()} LEVEL ACCESS
                </div>
                <Shield className="w-3.5 h-3.5 text-red-500/70 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="bg-[#0c0c0c] p-4 rounded-xl border border-white/5 flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-400">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <p>
              Your contact details are integrated with automatic emergency notification systems. Check that your active phone is formatted correctly to guarantee uninterrupted localized tracking broadcasts.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-red-650 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition disabled:bg-zinc-850 disabled:text-zinc-650 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? 'Verifying stats...' : 'Synchronize Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
