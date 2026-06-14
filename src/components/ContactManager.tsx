/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ShieldAlert, Users, Phone, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { EmergencyContact } from '../types';

interface ContactManagerProps {
  onContactsChange?: (count: number) => void;
}

export default function ContactManager({ onContactsChange }: ContactManagerProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Create / Edit states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relationship, setRelationship] = useState('Parent');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getContacts();
      setContacts(data);
      if (onContactsChange) {
        onContactsChange(data.length);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to scan contact configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !relationship) {
      setErrorMessage('Please provide complete details for this safety contact.');
      return;
    }

    try {
      setErrorMessage('');
      const response = await api.addContact({
        contact_name: contactName,
        contact_phone: contactPhone,
        relationship,
      });

      setContacts(prev => [...prev, response.contact]);
      if (onContactsChange) {
        onContactsChange(contacts.length + 1);
      }
      
      // Reset
      setContactName('');
      setContactPhone('');
      setRelationship('Parent');
      setIsAdding(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Creation rejected.');
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!contactName.trim() || !contactPhone.trim() || !relationship) {
      setErrorMessage('Full contact details are required.');
      return;
    }

    try {
      setErrorMessage('');
      const response = await api.updateContact(id, {
        contact_name: contactName,
        contact_phone: contactPhone,
        relationship,
      });

      setContacts(prev => prev.map(c => c.id === id ? response.contact : c));
      setEditingId(null);
      setContactName('');
      setContactPhone('');
      setRelationship('Parent');
    } catch (err: any) {
      setErrorMessage(err.message || 'Update failed.');
    }
  };

  const handleStartEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setContactName(contact.contact_name);
    setContactPhone(contact.contact_phone);
    setRelationship(contact.relationship);
    setIsAdding(false);
  };

  const cancelActions = () => {
    setEditingId(null);
    setIsAdding(false);
    setContactName('');
    setContactPhone('');
    setRelationship('Parent');
    setErrorMessage('');
  };

  const handleDelete = async (id: number) => {
    try {
      setErrorMessage('');
      await api.deleteContact(id);
      const filtered = contacts.filter(c => c.id !== id);
      setContacts(filtered);
      if (onContactsChange) {
        onContactsChange(filtered.length);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Deletion denied.');
    }
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl" id="contact-manager-module">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white font-display uppercase tracking-wider">Emergency Contacts</h2>
        </div>
        {!isAdding && editingId === null && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] px-3.5 py-2 rounded-full font-bold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-5 bg-red-950/20 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs font-sans">
          {errorMessage}
        </div>
      )}

      {/* Adding Mode Form */}
      {(isAdding || editingId !== null) && (
        <form onSubmit={isAdding ? handleCreateSubmit : (e) => e.preventDefault()} className="bg-[#0a0a0a] p-4.5 border border-white/5 rounded-xl mb-5 space-y-4">
          <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono">
            {isAdding ? 'Configure New Emergency Recipient' : 'Update Emergency Contact'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Richard (Father)"
                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-550 focus:ring-1 focus:ring-red-550/20"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-3388"
                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-550 focus:ring-1 focus:ring-red-550/20"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono mb-1.5 font-bold tracking-wider">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-550 cursor-pointer"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse / Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Close Friend</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={cancelActions}
              className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition cursor-pointer"
            >
              Cancel
            </button>
            {isAdding ? (
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full transition cursor-pointer"
              >
                Register Recipient
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveEdit(editingId!)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full transition cursor-pointer"
              >
                Apply Changes
              </button>
            )}
          </div>
        </form>
      )}

      {/* Contacts List Grid */}
      {isLoading ? (
        <div className="flex justify-center py-8 text-slate-500 text-xs font-mono uppercase tracking-widest gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
          <span>Scanning contacts register...</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-[#0a0a0a] text-center py-8 px-6 rounded-2xl border border-dashed border-white/5 text-slate-400">
          <ShieldAlert className="w-7 h-7 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">No Contacts Defined</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Configure at least one safety recipient so broadcast alerts can be transmitted instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 bg-[#0a0a0a] border rounded-xl flex items-start justify-between gap-3 transition-all ${
                editingId === contact.id ? 'border-red-500 bg-red-950/15' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-200 truncate">{contact.contact_name}</span>
                  <span className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-slate-400 font-bold font-mono tracking-wider uppercase">
                    {contact.relationship}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono pt-1">
                  <Phone className="w-3 h-3 text-red-500" />
                  <span>{contact.contact_phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleStartEdit(contact)}
                  className="p-2 bg-[#141414] hover:bg-red-950/20 text-slate-400 hover:text-red-400 rounded-lg border border-white/5 transition cursor-pointer"
                  title="Configure"
                  disabled={editingId !== null}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 bg-[#141414] hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg border border-white/5 transition cursor-pointer"
                  title="Remove Contact"
                  disabled={editingId !== null}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
