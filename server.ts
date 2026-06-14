/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { Db, hashPassword } from './src/db/dataStore';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'women-safety-platform-jwt-secret-key-448833';

function signJwt(payload: { id: number; email: string; name: string; role: 'user' | 'admin' }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64UrlEncode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64url');
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (24 * 3600), // Expire in 24 hours
  });
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token: string): any | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

// Extend custom Request type for authentication
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

// Auth Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }
  
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired security session.' });
  }
  
  req.user = decoded;
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // Log backend requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  // ==========================================
  // AUTHENTICATION ROUTING
  // ==========================================
  
  // POST /api/auth/register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, email, phone, password } = req.body;
      
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required for standard registration.' });
      }

      if (Db.getUserByEmail(email)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const newUser = Db.createUser({
        name,
        email,
        phone,
        password: hashPassword(password),
        role: 'user', // Default registered users are 'user'
      });

      // Issue JWT token directly
      const token = signJwt({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      });

      res.status(201).json({
        message: 'Account registered successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Database registration failure.' });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = Db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email address or password credentials.' });
      }

      const enteredHash = hashPassword(password);
      if (user.password !== enteredHash) {
        return res.status(401).json({ error: 'Invalid email address or password credentials.' });
      }

      // Generate JWT
      const token = signJwt({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Authentication error.' });
    }
  });

  // ==========================================
  // PROFILE ROUTING
  // ==========================================
  
  // GET /api/user/profile
  app.get('/api/user/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = Db.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/user/profile
  app.put('/api/user/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone fields are required.' });
      }

      const updated = Db.updateUser(req.user!.id, { name, phone });
      if (!updated) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          role: updated.role,
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // EMERGENCY CONTACTS ROUTING
  // ==========================================
  
  // GET /api/contacts
  app.get('/api/contacts', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const contacts = Db.getContacts(req.user!.id);
      res.json(contacts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/contacts
  app.post('/api/contacts', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contact_name, contact_phone, relationship } = req.body;
      if (!contact_name || !contact_phone || !relationship) {
        return res.status(400).json({ error: 'All contact fields are required.' });
      }

      const newContact = Db.addContact({
        user_id: req.user!.id,
        contact_name,
        contact_phone,
        relationship,
      });

      res.status(201).json({
        message: 'Emergency contact added successfully',
        contact: newContact,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/contacts/:id
  app.put('/api/contacts/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const contactId = parseInt(req.params.id, 10);
      const { contact_name, contact_phone, relationship } = req.body;
      
      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'Invalid contact reference ID.' });
      }

      const updated = Db.updateContact(contactId, req.user!.id, {
        contact_name,
        contact_phone,
        relationship,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Emergency contact not found or access denied.' });
      }

      res.json({
        message: 'Emergency contact updated successfully',
        contact: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/contacts/:id
  app.delete('/api/contacts/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const contactId = parseInt(req.params.id, 10);
      
      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'Invalid contact reference ID.' });
      }

      const success = Db.deleteContact(contactId, req.user!.id);
      if (!success) {
        return res.status(404).json({ error: 'Emergency contact not found or access denied.' });
      }

      res.json({ message: 'Emergency contact deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // SOS ALERTS ROUTING (The main feature)
  // ==========================================
  
  // POST /api/alerts/sos (Capture GPS, trigger SOS, simulate email notifications)
  app.post('/api/alerts/sos', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'GPS location (latitude & longitude) is required for safety alerts.' });
      }

      const user = Db.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Grab user's emergency contacts
      const contacts = Db.getContacts(user.id);
      
      // Simulate real-time dispatch and email sending
      const notifications_sent = contacts.map(c => {
        // Here, we log email simulation to server logs in full details!
        console.log(`[ALERT DISPATCH_SIM] Sending emergency alert email and SMS to:
          -------------------------------------
          Recipient Name: ${c.contact_name}
          Phone Number: ${c.contact_phone}
          Relationship: ${c.relationship}
          Alert Core: SOS TRIGGERED BY ${user.name.toUpperCase()} (Phone: ${user.phone})
          Coordinates: Latitude: ${latitude}, Longitude: ${longitude}
          Quick Tracking Link: https://maps.google.com/?q=${latitude},${longitude}
          Dispatch Time: ${new Date().toLocaleString()}
          Status: DELIVERED SUCCESSFULLY (Simulated SMTP & Twilio Route Status: 200)
          -------------------------------------`);
        
        return {
          contact_name: c.contact_name,
          contact_phone: c.contact_phone,
          status: 'SENT' as const,
        };
      });

      const newAlert = Db.createAlert({
        user_id: user.id,
        user_name: user.name,
        user_phone: user.phone || 'N/A',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        notifications_sent,
      });

      res.status(201).json({
        message: `SOS EMERGENCY ACTIVATED! Email and SMS dispatch triggered successfully for ${contacts.length} emergency contacts.`,
        alert: newAlert,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/alerts/history
  app.get('/api/alerts/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      // In compliance with safety scope, users can see history. 
      // Users see their own history, Admins see ALL history!
      if (req.user!.role === 'admin') {
        res.json(Db.getAlerts());
      } else {
        res.json(Db.getAlertsByUserId(req.user!.id));
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // INCIDENT REPORTS ROUTING
  // ==========================================
  
  // POST /api/incidents
  app.post('/api/incidents', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { incident_type, description, location } = req.body;
      
      if (!incident_type || !description || !location) {
        return res.status(400).json({ error: 'All incident fields (type, description, location) are required.' });
      }

      const validTypes = ['Harassment', 'Stalking', 'Unsafe Area', 'Theft', 'Other'];
      if (!validTypes.includes(incident_type)) {
        return res.status(400).json({ error: `Incident type must be one of: ${validTypes.join(', ')}` });
      }

      const user = Db.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User details not found.' });
      }

      const newIncident = Db.createIncident({
        user_id: user.id,
        user_name: user.name,
        user_phone: user.phone,
        incident_type: incident_type as any,
        description,
        location,
      });

      console.log(`[INCIDENT_LOG] New safe-community incident reported by ${user.name}: [${incident_type}] at ${location}`);

      res.status(201).json({
        message: 'Safety incident successfully drafted and sent to community administrators for review.',
        incident: newIncident,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/incidents
  app.get('/api/incidents', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      // Users see their own reports, Admins see ALL reports!
      if (req.user!.role === 'admin') {
        res.json(Db.getIncidents());
      } else {
        res.json(Db.getIncidentsByUserId(req.user!.id));
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ADMIN CONTROL MANAGEMENT
  // ==========================================
  
  // POST /api/admin/alerts/:id/resolve
  app.post('/api/admin/alerts/:id/resolve', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Administrator credentials required.' });
      }

      const alertId = parseInt(req.params.id, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({ error: 'Invalid alert reference ID.' });
      }

      const updated = Db.updateAlertStatus(alertId, 'RESOLVED');
      if (!updated) {
        return res.status(404).json({ error: 'Alert report not found.' });
      }

      res.json({
        message: 'Emergency alert status marked as RESOLVED.',
        alert: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/incidents/:id/status
  app.post('/api/admin/incidents/:id/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Administrator credentials required.' });
      }

      const incidentId = parseInt(req.params.id, 10);
      const { status } = req.body;
      
      if (isNaN(incidentId)) {
        return res.status(400).json({ error: 'Invalid incident reference ID.' });
      }

      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
      }

      const updated = Db.updateIncidentStatus(incidentId, status as any);
      if (!updated) {
        return res.status(404).json({ error: 'Incident report not found.' });
      }

      res.json({
        message: `Incident safety review status updated to ${status}.`,
        incident: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/stats
  app.get('/api/admin/stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin authorization required.' });
      }

      const alerts = Db.getAlerts();
      const incidents = Db.getIncidents();

      const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;
      const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED').length;

      const incByType: Record<string, number> = {
        'Harassment': 0,
        'Stalking': 0,
        'Unsafe Area': 0,
        'Theft': 0,
        'Other': 0,
      };

      incidents.forEach(inc => {
        if (incByType[inc.incident_type] !== undefined) {
          incByType[inc.incident_type]++;
        } else {
          incByType[inc.incident_type] = 1;
        }
      });

      res.json({
        totalAlerts: alerts.length,
        activeAlerts,
        resolvedAlerts,
        totalIncidents: incidents.length,
        incidentsByType: incByType,
        recentAlerts: alerts.slice(0, 5),
        recentIncidents: incidents.slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE / STATIC ASSET HOSTING
  // ==========================================
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA routing callback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Women Safety Alert System full-stack running on http://localhost:${PORT}`);
  });
}

startServer();
