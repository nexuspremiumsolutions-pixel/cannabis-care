import { Router } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest, verifyPassword } from '../auth/auth';
import { UserRole } from '../../src/types/entities';
import { SystemConfigService } from '../services/security/systemConfigService';
import { BackupService } from '../services/security/backupService';
import { PrivacyService } from '../services/security/privacyService';
import { SecurityService } from '../services/security/securityService';
import { db } from '../db/database';

const router = Router();

// =============================================================
// 1. PRODUCTION READINESS SCORE & AUDIT
// =============================================================
router.get('/readiness', requireAuth, requireRole(UserRole.ADMIN), (_req, res) => {
  try {
    const report = SystemConfigService.evaluateProductionReadiness();
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de l’évaluation de préparation production.' });
  }
});

// =============================================================
// 2. SECURITY INCIDENTS
// =============================================================
router.get('/incidents', requireAuth, requireRole(UserRole.ADMIN), (_req, res) => {
  try {
    const incidents = SystemConfigService.getSecurityIncidents();
    return res.json({ incidents });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur récupération des incidents.' });
  }
});

router.post('/incidents', requireAuth, requireRole(UserRole.ADMIN), (req: AuthenticatedRequest, res) => {
  try {
    const { type, severity, source, notes } = req.body;
    if (!type || !severity || !source) {
      return res.status(400).json({ error: 'Type, sévérité et source requis.' });
    }

    const incident = SystemConfigService.createSecurityIncident({
      type: SecurityService.sanitizeString(type),
      severity,
      source: SecurityService.sanitizeString(source),
      status: 'OPEN',
      notes: SecurityService.sanitizeString(notes || ''),
      assignedTo: req.user?.email,
    });

    return res.status(201).json({ incident });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur création incident.' });
  }
});

router.patch('/incidents/:id/status', requireAuth, requireRole(UserRole.ADMIN), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Statut requis.' });
    }

    const updated = SystemConfigService.updateIncidentStatus(
      id,
      status,
      notes ? SecurityService.sanitizeString(notes) : undefined,
      req.user?.email
    );

    if (!updated) {
      return res.status(404).json({ error: 'Incident introuvable.' });
    }

    return res.json({ incident: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur mise à jour incident.' });
  }
});

// =============================================================
// 3. BACKUPS & DISASTER RECOVERY (BACKUP -> RESTORE -> VERIFY)
// =============================================================
router.get('/backups', requireAuth, requireRole(UserRole.ADMIN), (_req, res) => {
  try {
    const backups = BackupService.getBackups();
    return res.json({ backups });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur récupération des sauvegardes.' });
  }
});

router.post('/backups/trigger', requireAuth, requireRole(UserRole.ADMIN), (req: AuthenticatedRequest, res) => {
  try {
    const result = BackupService.createBackup(req.user?.email);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    return res.status(201).json({ success: true, backup: result.backup });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur déclenchement sauvegarde.' });
  }
});

router.post('/backups/:id/verify', requireAuth, requireRole(UserRole.ADMIN), (req, res) => {
  try {
    const { id } = req.params;
    const result = BackupService.verifyBackup(id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur vérification sauvegarde.' });
  }
});

// =============================================================
// 4. RGPD DATA INVENTORY & RETENTION POLICIES
// =============================================================
router.get('/privacy/inventory', (_req, res) => {
  try {
    const inventory = PrivacyService.getDataInventory();
    return res.json({ inventory });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur registre RGPD.' });
  }
});

router.post('/privacy/retention/run', requireAuth, requireRole(UserRole.ADMIN), (_req, res) => {
  try {
    const result = PrivacyService.runRetentionCleanup();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur exécution de la politique de rétention.' });
  }
});

// =============================================================
// 5. USER GDPR EXPORT & SAFE ERASURE
// =============================================================
router.get('/privacy/export', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = PrivacyService.exportUserData(userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=cannabis_care_rgpd_export_${userId}.json`);
    return res.json(result.data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur export RGPD.' });
  }
});

router.post('/privacy/delete-account', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis pour confirmer la suppression définitive.' });
    }

    // Verify current user password
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(403).json({ error: 'Mot de passe incorrect. Suppression refusée.' });
    }

    const result = PrivacyService.deleteAccountSafely(user.id);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Votre compte ainsi que toutes vos données de santé, journal et préférences ont été supprimés définitivement. Vos factures et commandes ont été pseudonymisées conformément au Code de commerce.',
      details: result.deletedRecords,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
  }
});

// =============================================================
// 6. SYSTEM CONFIGURATION & FEATURE FLAGS
// =============================================================
router.get('/system/config', requireAuth, (_req, res) => {
  try {
    const config = SystemConfigService.getSystemConfig();
    return res.json({ config });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur récupération configuration système.' });
  }
});

router.put('/system/config', requireAuth, requireRole(UserRole.ADMIN), (req: AuthenticatedRequest, res) => {
  try {
    const updates = req.body;
    const config = SystemConfigService.updateSystemConfig(updates, req.user?.email);
    return res.json({ config });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur mise à jour configuration système.' });
  }
});

router.get('/system/feature-flags', (_req, res) => {
  try {
    const flags = SystemConfigService.getFeatureFlags();
    return res.json({ flags });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur récupération feature flags.' });
  }
});

router.patch('/system/feature-flags/:key', requireAuth, requireRole(UserRole.ADMIN), (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Le champ enabled (booléen) est requis.' });
    }

    const updated = SystemConfigService.toggleFeatureFlag(key, enabled, req.user?.email);
    if (!updated) {
      return res.status(404).json({ error: 'Feature flag introuvable.' });
    }

    return res.json({ flag: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur mise à jour feature flag.' });
  }
});

export default router;
