import { db } from '../../db/database';
import { AdminAuditLogRecord } from '../../../src/types/entities';

export class AuditService {
  public static logAction(params: {
    adminId: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: any;
    after?: any;
    ip?: string;
    userAgent?: string;
  }): AdminAuditLogRecord {
    const logs = db.get('adminAuditLogs') || [];
    const newLog: AdminAuditLogRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      timestamp: new Date().toISOString(),
      ip: params.ip || '127.0.0.1',
      userAgent: params.userAgent || 'Nexus Admin Web Console',
    };

    logs.unshift(newLog);
    db.save();
    return newLog;
  }

  public static getLogs(filters: {
    action?: string;
    entityType?: string;
    adminEmail?: string;
    search?: string;
  } = {}): AdminAuditLogRecord[] {
    const logs = db.get('adminAuditLogs') || [];
    let result = [...logs];

    if (filters.action) {
      result = result.filter((l) => l.action.toLowerCase() === filters.action?.toLowerCase());
    }
    if (filters.entityType) {
      result = result.filter((l) => l.entityType.toLowerCase() === filters.entityType?.toLowerCase());
    }
    if (filters.adminEmail) {
      result = result.filter((l) => l.adminEmail.toLowerCase().includes(filters.adminEmail!.toLowerCase()));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.adminEmail.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          l.entityType.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
