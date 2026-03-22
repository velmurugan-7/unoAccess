import { Request, Response } from 'express';
import { AlertRule, AlertHistory } from '../models/Alert';
import { OAuthClient } from '../models/OAuthClient';
import { AppError } from '../middleware/errorHandler';

/** Create a new alert rule */
export const createAlertRule = async (req: Request, res: Response): Promise<void> => {
  const { clientId, name, metric, condition, threshold, windowMinutes, channel, webhookUrl } = req.body;

  // Verify client belongs to user or user owns it
  const client = await OAuthClient.findOne({ clientId, createdBy: req.user!.userId });
  if (!client) throw new AppError('Client not found or unauthorized', 404);

  const count = await AlertRule.countDocuments({ userId: req.user!.userId });
  if (count >= 50) throw new AppError('Maximum 50 alert rules allowed', 400);

  const rule = await AlertRule.create({
    userId: req.user!.userId,
    clientId: client._id,
    name, metric, condition, threshold,
    windowMinutes: windowMinutes || 5,
    channel: channel || 'email',
    webhookUrl,
  });

  res.status(201).json({ success: true, rule });
};

/** List alert rules */
export const listAlertRules = async (req: Request, res: Response): Promise<void> => {
  const rules = await AlertRule.find({ userId: req.user!.userId })
    .populate('clientId', 'name clientId')
    .sort({ createdAt: -1 });
  res.json({ success: true, rules });
};

/** Update an alert rule */
export const updateAlertRule = async (req: Request, res: Response): Promise<void> => {
  const rule = await AlertRule.findOne({ _id: req.params.id, userId: req.user!.userId });
  if (!rule) throw new AppError('Alert rule not found', 404);

  const { name, metric, condition, threshold, windowMinutes, channel, webhookUrl, status } = req.body;
  if (name) rule.name = name;
  if (metric) rule.metric = metric;
  if (condition) rule.condition = condition;
  if (threshold !== undefined) rule.threshold = threshold;
  if (windowMinutes) rule.windowMinutes = windowMinutes;
  if (channel) rule.channel = channel;
  if (webhookUrl !== undefined) rule.webhookUrl = webhookUrl;
  if (status) rule.status = status;

  await rule.save();
  res.json({ success: true, rule });
};

/** Delete an alert rule */
export const deleteAlertRule = async (req: Request, res: Response): Promise<void> => {
  const rule = await AlertRule.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
  if (!rule) throw new AppError('Alert rule not found', 404);
  res.json({ success: true, message: 'Alert rule deleted' });
};

/** Get alert history */
export const getAlertHistory = async (req: Request, res: Response): Promise<void> => {
  const history = await AlertHistory.find({ userId: req.user!.userId })
    .populate('ruleId', 'name metric')
    .populate('clientId', 'name clientId')
    .sort({ triggeredAt: -1 })
    .limit(100);
  res.json({ success: true, history });
};
