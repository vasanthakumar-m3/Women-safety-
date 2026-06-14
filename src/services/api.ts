/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple fetch-based API client for Women Safety Alert System
const BASE_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('women_safety_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication API
  async login(credentials: any) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to authenticate login.');
    }
    return res.json();
  },

  async register(details: any) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete registration.');
    }
    return res.json();
  },

  // Profile API
  async getProfile() {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load user profile details.');
    }
    return res.json();
  },

  async updateProfile(profile: { name: string; phone: string }) {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to apply profile changes.');
    }
    return res.json();
  },

  // Emergency Contacts API
  async getContacts() {
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve emergency contacts.');
    return res.json();
  },

  async addContact(contact: any) {
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(contact),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to store new contact.');
    }
    return res.json();
  },

  async updateContact(id: number, contact: any) {
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(contact),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update contact detail.');
    }
    return res.json();
  },

  async deleteContact(id: number) {
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove contact.');
    return res.json();
  },

  // SOS Alerts API
  async triggerSOS(latitude: number, longitude: number) {
    const res = await fetch(`${BASE_URL}/alerts/sos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to trigger emergency SOS broadcast.');
    }
    return res.json();
  },

  async getAlertHistory() {
    const res = await fetch(`${BASE_URL}/alerts/history`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve emergency historical feed.');
    return res.json();
  },

  // Incident Reports API
  async submitIncident(incident: any) {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(incident),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit incident report details.');
    }
    return res.json();
  },

  async getIncidents() {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch safety incidents archive.');
    return res.json();
  },

  // Admin Level API Operations
  async resolveAlert(id: number) {
    const res = await fetch(`${BASE_URL}/admin/alerts/${id}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resolve emergency alert.');
    }
    return res.json();
  },

  async updateIncidentStatus(id: number, status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED') {
    const res = await fetch(`${BASE_URL}/admin/incidents/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to change incident review status.');
    }
    return res.json();
  },

  async getAdminStats() {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch administrator statistics.');
    return res.json();
  }
};
