import { AuditLog, AuditAction } from '../models/AuditLog';
import { Request } from 'express';
import { logger } from '../utils/logger';

interface LogParams {
  userId?: string;
  actorId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
  success?: boolean;
}

export async function logAudit(params: LogParams): Promise<void> {
  try {
    await AuditLog.create({
      userId: params.userId,
      actorId: params.actorId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      metadata: params.metadata,
      ip: params.req?.ip || (params.req?.headers['x-forwarded-for'] as string) || '',
      userAgent: params.req?.headers['user-agent'] || '',
      success: params.success !== false,
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Audit log write failed:', err);
  }
}
