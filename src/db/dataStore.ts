/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, EmergencyContact, SOSAlert, IncidentReport } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Constant salt for encryption
const SALT = 'womens_safety_secure_pbkdf2_salt_9988';

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

interface DatabaseSchema {
  users: User[];
  emergency_contacts: EmergencyContact[];
  alerts: SOSAlert[];
  incident_reports: IncidentReport[];
}

// Initial seeded data
const initialData: DatabaseSchema = {
  users: [
    {
      id: 1,
      name: 'Sarah Jenkins',
      email: 'user@safety.com',
      phone: '+1 (555) 019-2834',
      password: hashPassword('password123'),
      role: 'user',
    },
    {
      id: 2,
      name: 'System Controller',
      email: 'admin@safety.com',
      phone: '+1 (555) 011-3829',
      password: hashPassword('admin123'),
      role: 'admin',
    },
    {
      id: 3,
      name: 'Elena Rostova',
      email: 'elena@safety.com',
      phone: '+1 (555) 014-9911',
      password: hashPassword('elena123'),
      role: 'user',
    },
  ],
  emergency_contacts: [
    {
      id: 1,
      user_id: 1,
      contact_name: 'Robert Jenkins (Father)',
      contact_phone: '+1 (555) 019-3388',
      relationship: 'Father',
    },
    {
      id: 2,
      user_id: 1,
      contact_name: 'Maya Lin (Friend)',
      contact_phone: '+1 (555) 012-7744',
      relationship: 'Friend',
    },
    {
      id: 3,
      user_id: 3,
      contact_name: 'Alexander Petrov (Spouse)',
      contact_phone: '+1 (555) 017-1122',
      relationship: 'Husband',
    },
  ],
  alerts: [
    {
      id: 1,
      user_id: 3,
      user_name: 'Elena Rostova',
      user_phone: '+1 (555) 014-9911',
      latitude: 40.7580,
      longitude: -73.9855,
      alert_time: new Date(Date.now() - 45 * 60000).toISOString(), // 45 mins ago
      status: 'ACTIVE',
      notifications_sent: [
        { contact_name: 'Alexander Petrov (Spouse)', contact_phone: '+1 (555) 017-1122', status: 'SENT' }
      ]
    },
    {
      id: 2,
      user_id: 1,
      user_name: 'Sarah Jenkins',
      user_phone: '+1 (555) 019-2834',
      latitude: 40.7128,
      longitude: -74.0060,
      alert_time: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
      status: 'RESOLVED',
      notifications_sent: [
        { contact_name: 'Robert Jenkins (Father)', contact_phone: '+1 (555) 019-3388', status: 'SENT' },
        { contact_name: 'Maya Lin (Friend)', contact_phone: '+1 (555) 012-7744', status: 'SENT' }
      ]
    },
  ],
  incident_reports: [
    {
      id: 1,
      user_id: 1,
      user_name: 'Sarah Jenkins',
      user_phone: '+1 (555) 019-2834',
      incident_type: 'Unsafe Area',
      description: 'Streetlights are completely out near the subway transit block. Plagued by suspicious loitering groups, felt highly unsafe walking home.',
      location: '8th Ave & W 34th St, New York',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
      status: 'PENDING',
    },
    {
      id: 2,
      user_id: 3,
      user_name: 'Elena Rostova',
      user_phone: '+1 (555) 014-9911',
      incident_type: 'Harassment',
      description: 'A pedestrian repeatedly catcalled and stalked me for two blocks near Central Park East before I entered a local shop to lose them.',
      location: 'Central Park East & E 72nd St, New York',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
      status: 'RESOLVED',
    },
  ],
};

// Thread-safe wrapper to load database
export function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error loading database, returning initial structure:', err);
    return initialData;
  }
}

// Thread-safe wrapper to save database
export function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Global functions matching our REST operations
export const Db = {
  // Users
  getUsers: () => loadDb().users,
  getUserById: (id: number) => loadDb().users.find(u => u.id === id),
  getUserByEmail: (email: string) => loadDb().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user: Omit<User, 'id'>) => {
    const db = loadDb();
    const nextId = db.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const newUser: User = { ...user, id: nextId };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  },
  updateUser: (id: number, fields: Partial<Omit<User, 'id' | 'role'>>) => {
    const db = loadDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    db.users[index] = { ...db.users[index], ...fields };
    saveDb(db);
    return db.users[index];
  },

  // Emergency Contacts
  getContacts: (userId: number) => {
    return loadDb().emergency_contacts.filter(c => c.user_id === userId);
  },
  addContact: (contact: Omit<EmergencyContact, 'id'>) => {
    const db = loadDb();
    const nextId = db.emergency_contacts.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newContact: EmergencyContact = { ...contact, id: nextId };
    db.emergency_contacts.push(newContact);
    saveDb(db);
    return newContact;
  },
  updateContact: (id: number, userId: number, fields: Partial<Omit<EmergencyContact, 'id' | 'user_id'>>) => {
    const db = loadDb();
    const index = db.emergency_contacts.findIndex(c => c.id === id && c.user_id === userId);
    if (index === -1) return null;
    db.emergency_contacts[index] = { ...db.emergency_contacts[index], ...fields };
    saveDb(db);
    return db.emergency_contacts[index];
  },
  deleteContact: (id: number, userId: number) => {
    const db = loadDb();
    const initialLen = db.emergency_contacts.length;
    db.emergency_contacts = db.emergency_contacts.filter(c => !(c.id === id && c.user_id === userId));
    saveDb(db);
    return db.emergency_contacts.length < initialLen;
  },

  // SOS Alerts
  getAlerts: () => loadDb().alerts,
  getAlertsByUserId: (userId: number) => loadDb().alerts.filter(a => a.user_id === userId),
  createAlert: (alert: Omit<SOSAlert, 'id' | 'alert_time' | 'status'>) => {
    const db = loadDb();
    const nextId = db.alerts.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newAlert: SOSAlert = {
      ...alert,
      id: nextId,
      alert_time: new Date().toISOString(),
      status: 'ACTIVE',
    };
    db.alerts.unshift(newAlert); // Newest first
    saveDb(db);
    return newAlert;
  },
  updateAlertStatus: (id: number, status: 'ACTIVE' | 'RESOLVED') => {
    const db = loadDb();
    const index = db.alerts.findIndex(a => a.id === id);
    if (index === -1) return null;
    db.alerts[index].status = status;
    saveDb(db);
    return db.alerts[index];
  },

  // Incident Reports
  getIncidents: () => loadDb().incident_reports,
  getIncidentsByUserId: (userId: number) => loadDb().incident_reports.filter(i => i.user_id === userId),
  createIncident: (incident: Omit<IncidentReport, 'id' | 'created_at' | 'status'>) => {
    const db = loadDb();
    const nextId = db.incident_reports.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const newIncident: IncidentReport = {
      ...incident,
      id: nextId,
      created_at: new Date().toISOString(),
      status: 'PENDING',
    };
    db.incident_reports.unshift(newIncident); // Newest first
    saveDb(db);
    return newIncident;
  },
  updateIncidentStatus: (id: number, status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED') => {
    const db = loadDb();
    const index = db.incident_reports.findIndex(i => i.id === id);
    if (index === -1) return null;
    db.incident_reports[index].status = status;
    saveDb(db);
    return db.incident_reports[index];
  },
};
