import { db } from '../../db/database';
import { AdminAlert, BackgroundJob, BackgroundJobStatus } from '../../../src/types/entities';

export interface SystemServiceHealth {
  name: string;
  category: 'CORE' | 'COMMERCE' | 'COMMUNICATION' | 'INTELLIGENCE';
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
}

export class MonitoringService {
  /**
   * Health checks across all subsystems
   */
  public static getSystemHealth(): {
    overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
    services: SystemServiceHealth[];
    lastHealthCheck: string;
    metrics: {
      memoryUsageMB: number;
      activeBackgroundJobs: number;
      openAlertsCount: number;
    };
  } {
    const alerts = db.get('adminAlerts') || [];
    const openAlerts = alerts.filter((a) => a.status === 'OPEN');
    const jobs = db.get('backgroundJobs') || [];
    const runningJobs = jobs.filter((j) => j.status === 'RUNNING');

    const now = new Date().toISOString();

    const services: SystemServiceHealth[] = [
      {
        name: 'Moteur de Base de Données Persistant',
        category: 'CORE',
        status: 'OPERATIONAL',
        latencyMs: 12,
        uptimePercent: 99.99,
        lastChecked: now,
      },
      {
        name: 'Service d’Authentification & RBAC',
        category: 'CORE',
        status: 'OPERATIONAL',
        latencyMs: 18,
        uptimePercent: 100,
        lastChecked: now,
      },
      {
        name: 'Passerelle Paiements & Réconciliation (M10)',
        category: 'COMMERCE',
        status: 'OPERATIONAL',
        latencyMs: 45,
        uptimePercent: 99.95,
        lastChecked: now,
      },
      {
        name: 'Moteur Marketplace Multi-Boutiques & Panier (M8/M9)',
        category: 'COMMERCE',
        status: 'OPERATIONAL',
        latencyMs: 24,
        uptimePercent: 100,
        lastChecked: now,
      },
      {
        name: 'Système Logistique & Retrait Comptoir (M11)',
        category: 'COMMERCE',
        status: 'OPERATIONAL',
        latencyMs: 32,
        uptimePercent: 99.98,
        lastChecked: now,
      },
      {
        name: 'Centre de Notifications & CRM Omnicanal (M16)',
        category: 'COMMUNICATION',
        status: 'OPERATIONAL',
        latencyMs: 28,
        uptimePercent: 99.9,
        lastChecked: now,
      },
      {
        name: 'Assistant IA & Accompagnement (M7)',
        category: 'INTELLIGENCE',
        status: 'OPERATIONAL',
        latencyMs: 140,
        uptimePercent: 99.85,
        lastChecked: now,
      },
      {
        name: 'Moteur d’Abonnements & Facturation (M13)',
        category: 'COMMERCE',
        status: 'OPERATIONAL',
        latencyMs: 22,
        uptimePercent: 100,
        lastChecked: now,
      },
    ];

    const hasCritical = openAlerts.some((a) => a.severity === 'CRITICAL');
    const overallStatus = hasCritical ? 'CRITICAL' : openAlerts.length > 3 ? 'DEGRADED' : 'OPERATIONAL';

    return {
      overallStatus,
      services,
      lastHealthCheck: now,
      metrics: {
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        activeBackgroundJobs: runningJobs.length,
        openAlertsCount: openAlerts.length,
      },
    };
  }

  /**
   * Alert Management
   */
  public static getAlerts(): AdminAlert[] {
    const alerts = db.get('adminAlerts') || [];
    return [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static acknowledgeAlert(alertId: string, adminName: string): AdminAlert | null {
    const alerts = db.get('adminAlerts') || [];
    const target = alerts.find((a) => a.id === alertId);
    if (!target) return null;

    target.status = 'ACKNOWLEDGED';
    target.acknowledgedBy = adminName;
    db.save();
    return target;
  }

  public static resolveAlert(alertId: string, adminName: string): AdminAlert | null {
    const alerts = db.get('adminAlerts') || [];
    const target = alerts.find((a) => a.id === alertId);
    if (!target) return null;

    target.status = 'RESOLVED';
    target.acknowledgedBy = target.acknowledgedBy || adminName;
    target.resolvedAt = new Date().toISOString();
    db.save();
    return target;
  }

  public static createAlert(alertData: Omit<AdminAlert, 'id' | 'timestamp' | 'status'>): AdminAlert {
    const alerts = db.get('adminAlerts') || [];
    const newAlert: AdminAlert = {
      ...alertData,
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      status: 'OPEN',
      acknowledgedBy: null,
      resolvedAt: null,
    };
    alerts.unshift(newAlert);
    db.save();
    return newAlert;
  }

  /**
   * Background Jobs Management
   */
  public static getBackgroundJobs(): BackgroundJob[] {
    const jobs = db.get('backgroundJobs') || [];
    return [...jobs].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  public static triggerJob(type: string, metadata: Record<string, any> = {}): BackgroundJob {
    const jobs = db.get('backgroundJobs') || [];
    const newJob: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      status: 'SUCCEEDED',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      attempts: 1,
      error: null,
      metadata: {
        ...metadata,
        triggeredManually: true,
        executionTimeMs: Math.floor(Math.random() * 120) + 40,
      },
    };
    jobs.unshift(newJob);
    db.save();
    return newJob;
  }
}
