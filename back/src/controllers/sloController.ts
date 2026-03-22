import { Request, Response } from 'express';
import { Slo } from '../models/Slo';
import { PerformanceLog } from '../models/PerformanceLog';
import { OAuthClient } from '../models/OAuthClient';
import { AppError } from '../middleware/errorHandler';

export const createSlo = async (req: Request, res: Response): Promise<void> => {
  const { clientId, name, description, metricType, targetValue, windowDays } = req.body;
  const client = await OAuthClient.findOne({ clientId, createdBy: req.user!.userId });
  if (!client) throw new AppError('Client not found or unauthorized', 404);

  const slo = await Slo.create({
    userId: req.user!.userId,
    clientId: client._id,
    name, description, metricType, targetValue,
    windowDays: windowDays || 30,
  });
  res.status(201).json({ success: true, slo });
};

export const listSlos = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  const slos = await Slo.find({ clientId: client._id, userId: req.user!.userId });
  res.json({ success: true, slos });
};

export const deleteSlo = async (req: Request, res: Response): Promise<void> => {
  const slo = await Slo.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
  if (!slo) throw new AppError('SLO not found', 404);
  res.json({ success: true });
};

export const getSloReport = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  const slos = await Slo.find({ clientId: client._id, userId: req.user!.userId });
  const now = new Date();

  const report = await Promise.all(slos.map(async (slo) => {
    const since = new Date(now.getTime() - slo.windowDays * 24 * 60 * 60 * 1000);
    const logs = await PerformanceLog.find({
      clientId: client._id,
      timestamp: { $gte: since },
    }).select('responseTime statusCode timestamp');

    const total = logs.length;
    if (total === 0) return { slo, compliance: null, currentValue: null, dataPoints: [] };

    let currentValue = 0;
    let compliance = 0;

    if (slo.metricType === 'error_rate') {
      const errors = logs.filter(l => l.statusCode >= 400).length;
      currentValue = (errors / total) * 100;
      compliance = currentValue <= slo.targetValue ? 100 : Math.max(0, 100 - (currentValue - slo.targetValue) * 10);
    } else if (slo.metricType === 'availability') {
      const ok = logs.filter(l => l.statusCode < 500).length;
      currentValue = (ok / total) * 100;
      compliance = currentValue >= slo.targetValue ? 100 : (currentValue / slo.targetValue) * 100;
    } else {
      const sorted = logs.map(l => l.responseTime).sort((a, b) => a - b);
      if (slo.metricType === 'p95_latency') currentValue = sorted[Math.floor(sorted.length * 0.95)] || 0;
      else if (slo.metricType === 'p99_latency') currentValue = sorted[Math.floor(sorted.length * 0.99)] || 0;
      else currentValue = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      compliance = currentValue <= slo.targetValue ? 100 : Math.max(0, 100 - ((currentValue - slo.targetValue) / slo.targetValue) * 100);
    }

    // Build daily data points
    const days = slo.windowDays;
    const dataPoints = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const day = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().slice(0, 10);
      const dayLogs = logs.filter(l => l.timestamp.toISOString().slice(0, 10) === dayStr);
      if (dayLogs.length === 0) return { date: dayStr, value: null, met: null };
      let val = 0;
      if (slo.metricType === 'error_rate') {
        val = (dayLogs.filter(l => l.statusCode >= 400).length / dayLogs.length) * 100;
      } else if (slo.metricType === 'availability') {
        val = (dayLogs.filter(l => l.statusCode < 500).length / dayLogs.length) * 100;
      } else {
        const s = dayLogs.map(l => l.responseTime).sort((a, b) => a - b);
        val = slo.metricType === 'p95_latency' ? (s[Math.floor(s.length * 0.95)] || 0) :
              slo.metricType === 'p99_latency' ? (s[Math.floor(s.length * 0.99)] || 0) :
              s.reduce((a, b) => a + b, 0) / s.length;
      }
      const met = slo.metricType === 'availability' ? val >= slo.targetValue : val <= slo.targetValue;
      return { date: dayStr, value: Math.round(val * 100) / 100, met };
    });

    return { slo, compliance: Math.round(compliance * 100) / 100, currentValue: Math.round(currentValue * 100) / 100, dataPoints };
  }));

  res.json({ success: true, client: { clientId, name: client.name }, report, generatedAt: now });
};
