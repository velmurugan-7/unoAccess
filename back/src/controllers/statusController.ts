import { Request, Response } from 'express';
import { Incident } from '../models/Incident';
import { AppError } from '../middleware/errorHandler';

const COMPONENTS = [
  { id: 'api', name: 'Authentication API' },
  { id: 'oauth', name: 'OAuth / OpenID Connect' },
  { id: 'dashboard', name: 'User Dashboard' },
  { id: 'monitoring', name: 'Performance Monitoring' },
  { id: 'email', name: 'Email Delivery' },
  { id: 'webhooks', name: 'Webhooks' },
];

export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  // Fetch active (unresolved) incidents
  const activeIncidents = await Incident.find({ status: { $ne: 'resolved' } }).sort({ createdAt: -1 });
  // Fetch recent resolved incidents (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentResolved = await Incident.find({ status: 'resolved', resolvedAt: { $gte: since } }).sort({ resolvedAt: -1 }).limit(10);

  // Compute component statuses based on active incidents
  const componentStatus = COMPONENTS.map(comp => {
    const affected = activeIncidents.find(i => i.affectedComponents.includes(comp.id));
    return {
      ...comp,
      status: affected
        ? (affected.impact === 'critical' ? 'major_outage' : affected.impact === 'major' ? 'partial_outage' : 'degraded')
        : 'operational',
    };
  });

  const overallStatus = activeIncidents.length === 0 ? 'operational' :
    activeIncidents.some(i => i.impact === 'critical') ? 'major_outage' :
    activeIncidents.some(i => i.impact === 'major') ? 'partial_outage' : 'degraded';

  res.json({
    success: true,
    overallStatus,
    components: componentStatus,
    activeIncidents,
    recentIncidents: recentResolved,
  });
};

// Admin-only: create incident
export const createIncident = async (req: Request, res: Response): Promise<void> => {
  const { title, impact, affectedComponents, message } = req.body;
  const incident = await Incident.create({
    title, impact: impact || 'minor',
    affectedComponents: affectedComponents || [],
    updates: [{ status: 'investigating', message: message || title }],
  });
  res.status(201).json({ success: true, incident });
};

// Admin-only: add update to incident
export const updateIncident = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, message } = req.body;
  const incident = await Incident.findById(id);
  if (!incident) throw new AppError('Incident not found', 404);

  incident.status = status;
  incident.updates.push({ status, message, createdAt: new Date() });
  if (status === 'resolved') incident.resolvedAt = new Date();
  await incident.save();
  res.json({ success: true, incident });
};

export const listIncidents = async (_req: Request, res: Response): Promise<void> => {
  const incidents = await Incident.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, incidents });
};
