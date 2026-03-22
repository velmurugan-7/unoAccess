/**
 * Alert Worker — runs in the same process, checks alert rules every 60 seconds.
 * For production, move this to a separate Bull/BullMQ worker.
 */
import { AlertRule, AlertHistory, AlertMetric } from '../models/Alert';
import { PerformanceLog } from '../models/PerformanceLog';
import { User } from '../models/User';
import { sendAlertEmail } from '../utils/email';
import { logger } from '../utils/logger';

async function computeMetric(clientId: unknown, metric: AlertMetric, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  const logs = await PerformanceLog.find({ clientId, timestamp: { $gte: since } }).select('responseTime statusCode');

  if (logs.length === 0) return 0;

  if (metric === 'error_rate') {
    return (logs.filter(l => l.statusCode >= 400).length / logs.length) * 100;
  }
  if (metric === 'request_count') return logs.length;

  const times = logs.map(l => l.responseTime).sort((a, b) => a - b);
  if (metric === 'response_time_avg') return times.reduce((a, b) => a + b, 0) / times.length;
  if (metric === 'response_time_p95') return times[Math.floor(times.length * 0.95)] || 0;

  return 0;
}

async function checkRules() {
  try {
    const rules = await AlertRule.find({ status: 'active' }).populate('clientId', 'name clientId');

    for (const rule of rules) {
      try {
        const windowMs = rule.windowMinutes * 60 * 1000;
        const actualValue = await computeMetric(rule.clientId, rule.metric, windowMs);

        const breached = rule.condition === 'greater_than'
          ? actualValue > rule.threshold
          : actualValue < rule.threshold;

        if (breached) {
          // Don't spam — only fire once per windowMinutes
          const lastTriggered = rule.lastTriggeredAt?.getTime() || 0;
          const cooldown = windowMs;
          if (Date.now() - lastTriggered < cooldown) continue;

          const histEntry = await AlertHistory.create({
            ruleId: rule._id,
            userId: rule.userId,
            clientId: rule.clientId,
            metric: rule.metric,
            threshold: rule.threshold,
            actualValue,
            notificationSent: false,
          });

          rule.lastTriggeredAt = new Date();
          rule.consecutiveBreaches += 1;
          await rule.save();

          // Send notification
          if (rule.channel === 'email') {
            try {
              const user = await User.findById(rule.userId).select('email name');
              if (user) {
                await sendAlertEmail(user.email, user.name, {
                  ruleName: rule.name,
                  metric: rule.metric,
                  threshold: rule.threshold,
                  actualValue,
                  condition: rule.condition,
                });
                await AlertHistory.findByIdAndUpdate(histEntry._id, { notificationSent: true });
              }
            } catch (emailErr) {
              logger.error('Alert email send failed:', emailErr);
            }
          } else if (rule.channel === 'webhook' && rule.webhookUrl) {
            try {
              await fetch(rule.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'alert.triggered',
                  ruleName: rule.name,
                  metric: rule.metric,
                  threshold: rule.threshold,
                  actualValue,
                  condition: rule.condition,
                  timestamp: new Date().toISOString(),
                }),
                signal: AbortSignal.timeout(5000),
              });
              await AlertHistory.findByIdAndUpdate(histEntry._id, { notificationSent: true });
            } catch (wErr) {
              logger.error('Alert webhook send failed:', wErr);
            }
          }
        } else {
          // Resolve open history entries
          await AlertHistory.updateMany(
            { ruleId: rule._id, resolvedAt: null },
            { resolvedAt: new Date() }
          );
          rule.consecutiveBreaches = 0;
          await rule.save();
        }
      } catch (ruleErr) {
        logger.error(`Error checking alert rule ${rule._id}:`, ruleErr);
      }
    }
  } catch (err) {
    logger.error('Alert worker error:', err);
  }
}

export function startAlertWorker(): NodeJS.Timeout {
  logger.info('Alert worker started (60s interval)');
  return setInterval(checkRules, 60_000);
}
