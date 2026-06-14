/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'user' | 'admin';
}

export interface EmergencyContact {
  id: number;
  user_id: number;
  contact_name: string;
  contact_phone: string;
  relationship: string;
}

export interface SOSAlert {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  latitude: number;
  longitude: number;
  alert_time: string;
  status: 'ACTIVE' | 'RESOLVED';
  notifications_sent?: { contact_name: string; contact_phone: string; status: 'SENT' | 'FAILED' }[];
}

export interface IncidentReport {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  incident_type: 'Harassment' | 'Stalking' | 'Unsafe Area' | 'Theft' | 'Other';
  description: string;
  location: string;
  created_at: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED';
}

export interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  recentAlerts: SOSAlert[];
  recentIncidents: IncidentReport[];
}
