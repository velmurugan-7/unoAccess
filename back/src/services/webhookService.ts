import crypto from 'crypto';
import { Webhook, WebhookEvent } from '../models/Webhook';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

export async function dispatchWebhook(
  clientId: string | undefined,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  if (!clientId) return;
  try {
    const hooks = await Webhook.find({ clientId, events: event, isActive: true });
    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
    for (const hook of hooks) {
      const secret = decrypt(hook.secret);
      const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-UnoAccess-Signature': `sha256=${sig}`,
            'X-UnoAccess-Event': event,
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        await Webhook.findByIdAndUpdate(hook._id, {
          lastDeliveryAt: new Date(),
          lastStatus: res.status,
          failureCount: res.ok ? 0 : hook.failureCount + 1,
          isActive: hook.failureCount + 1 < 10,
        });
      } catch {
        await Webhook.findByIdAndUpdate(hook._id, {
          failureCount: hook.failureCount + 1,
          lastStatus: 0,
          isActive: hook.failureCount + 1 < 10,
        });
      }
    }
  } catch (err) {
    logger.error('Webhook dispatch error:', err);
  }
}
