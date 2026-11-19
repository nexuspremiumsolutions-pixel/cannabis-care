import { db } from '../../db/database';
import { DataInventoryCategory, RetentionPolicy } from '../../../src/types/entities';

export class PrivacyService {
  /**
   * Official Data Inventory per RGPD Article 30 (Registre des activités de traitement)
   */
  public static getDataInventory(): DataInventoryCategory[] {
    return [
      {
        category: 'ACCOUNT',
        label: 'Compte & Identifiants',
        fields: ['id', 'email', 'nickname', 'passwordHash (salted)', 'role', 'createdAt', 'lastLoginAt'],
        purpose: 'Authentification sécurisée, gestion de session et contrôle d’accès applicatif.',
        storageType: 'Base de données relationnelle sécurisée (chiffrée au repos)',
        sanctuaryProtected: false,
        exportable: true,
        deletableOnRequest: true,
        retentionDescription: 'Conservé pendant la durée d’activité du compte + 3 ans d’inactivité sans réponse.',
      },
      {
        category: 'MARKETPLACE',
        label: 'Achats, Commandes & Adresses',
        fields: ['orderId', 'shippingAddress', 'itemsPurchased', 'amounts', 'paymentStatus', 'trackingNumber'],
        purpose: 'Exécution du contrat de vente, expédition logistique et facturation légale.',
        storageType: 'Grand Livre & Table Commandes Marketplace',
        sanctuaryProtected: false,
        exportable: true,
        deletableOnRequest: false, // Legal exception: invoices retained 10 years
        retentionDescription: 'Obligation comptable légale de conservation des pièces justificatives pendant 10 ans (Code de commerce Art. L123-22). Données personnelles pseudonymisées lors de l’effacement.',
      },
      {
        category: 'COMMUNICATION',
        label: 'Préférences & Consentements',
        fields: ['termsAccepted', 'healthDisclaimerAccepted', 'gdprConsent', 'analyticsConsent', 'notificationsEnabled', 'optIns'],
        purpose: 'Traçabilité légale du recueil des consentements (RGPD Art. 7) et respect des choix de notification.',
        storageType: 'Table userConsents & communicationPreferences',
        sanctuaryProtected: false,
        exportable: true,
        deletableOnRequest: true,
        retentionDescription: 'Conservé pour la durée de validité du consentement + 5 ans à des fins probatoires.',
      },
      {
        category: 'ANALYTICS',
        label: 'Télémétrie & Événements Techniques',
        fields: ['eventKey', 'timestamp', 'anonymousVisitorId', 'pageViewed', 'deviceType'],
        purpose: 'Amélioration de la stabilité logicielle, détection d’erreurs et mesure d’audience agrégée.',
        storageType: 'Entrepôt d’événements anonymisés / logs serveur',
        sanctuaryProtected: false,
        exportable: false,
        deletableOnRequest: true,
        retentionDescription: 'Purge automatique après 180 jours. Aucune donnée nominative.',
      },
      {
        category: 'SENSITIVE_HEALTH',
        label: 'Sanctuaire de Santé & Suivi Personnel (THC, CBD, Bien-être, IA)',
        fields: ['thcProfile', 'consumptionEntries', 'cravings', 'reductionPlan', 'wellnessEntries (sommeil, stress, humeur)', 'notesIntimes', 'dialoguesAssistantIA'],
        purpose: 'Accompagnement personnel exclusif, réduction des risques et auto-évaluation bien-être pour l’utilisateur.',
        storageType: 'Coffre-fort Sanctuaire de Santé isolé (inaccessible aux tiers, marchands ou administrateurs)',
        sanctuaryProtected: true,
        exportable: true,
        deletableOnRequest: true,
        retentionDescription: 'Suppression immédiate et définitive sur demande de l’utilisateur ou lors de la suppression du compte.',
      },
    ];
  }

  /**
   * Structured User Data Export (RGPD Art. 20 - Droit à la portabilité)
   * Delivers an exhaustive, standardized JSON file excluding administrative secrets.
   */
  public static exportUserData(userId: string): { success: boolean; data?: any; error?: string } {
    try {
      const user = db.get('users').find((u) => u.id === userId);
      if (!user) {
        return { success: false, error: 'Utilisateur introuvable.' };
      }

      // Safe export package
      const exportPayload = {
        metadata: {
          exportType: 'PORTABILITE_RGPD_OFFICIELLE',
          platform: 'Cannabis Care — Nexus Premium Solutions',
          generatedAt: new Date().toISOString(),
          userReference: user.id,
          legalNotice: 'Ce fichier contient l’ensemble de vos données personnelles stockées sur la plateforme Cannabis Care, généré conformément au Règlement Général sur la Protection des Données (UE 2016/679).',
        },
        account: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          profile: db.get('userProfiles').find((p) => p.userId === userId) || null,
          consents: db.get('userConsents').find((c) => c.userId === userId) || null,
          preferences: db.get('userPreferences').find((pr) => pr.userId === userId) || null,
        },
        healthSanctuary: {
          thcProfile: db.get('thcProfiles').find((t) => t.userId === userId) || null,
          thcConsumptions: db.get('consumptionEntries').filter((e) => e.userId === userId),
          thcCravings: db.get('thcCravings').filter((c) => c.userId === userId),
          thcPlans: db.get('thcReductionPlans').filter((p) => p.userId === userId),
          cbdProfile: db.get('cbdProfiles').find((c) => c.userId === userId) || null,
          cbdConsumptions: db.get('cbdConsumptions').filter((c) => c.userId === userId),
          wellnessEntries: db.get('wellnessEntries').filter((w) => w.userId === userId),
          personalNotes: db.get('personalNotes').filter((n) => n.userId === userId),
          userGoals: db.get('userGoals').filter((g) => g.userId === userId),
          progressMetrics: db.get('progress').find((pr) => pr.userId === userId) || null,
          aiConversationsCount: db.get('aiConversations').filter((ac) => ac.userId === userId).length,
        },
        marketplaceAndCommerce: {
          orders: (db.get('globalOrders' as any) || [])
            .filter((o: any) => o.customerId === userId)
            .map((o: any) => ({
              orderId: o.id,
              orderNumber: o.orderNumber,
              createdAt: o.createdAt,
              totalAmount: o.totalAmount,
              currency: o.currency,
              status: o.status,
              itemsCount: o.items?.length || 0,
            })),
          subscriptions: (db.get('userSubscriptions' as any) || [])
            .filter((s: any) => s.userId === userId),
          loyaltyBalance: (db.get('userLoyaltyAccounts' as any) || [])
            .find((l: any) => l.userId === userId) || null,
        },
      };

      db.logAudit('RGPD_DATA_EXPORTED', 'users', userId);

      return { success: true, data: exportPayload };
    } catch (err: any) {
      console.error('Export error:', err);
      return { success: false, error: err.message || 'Erreur lors de l’export.' };
    }
  }

  /**
   * Secure RGPD Account Erasure (RGPD Art. 17 - Droit à l'effacement)
   * Erases all sensitive health, personal journal, and marketing data.
   * Pseudonymizes order records to comply with mandatory commercial accounting laws (10-year invoice retention).
   */
  public static deleteAccountSafely(userId: string): {
    success: boolean;
    deletedRecords: { sanctuaryCleared: boolean; ordersAnonymizedCount: number };
    error?: string;
  } {
    try {
      const user = db.get('users').find((u) => u.id === userId);
      if (!user) {
        return { success: false, error: 'Utilisateur introuvable.', deletedRecords: { sanctuaryCleared: false, ordersAnonymizedCount: 0 } };
      }

      // 1. Immediately wipe all health & sanctuary sensitive records
      db.set('thcProfiles', db.get('thcProfiles').filter((t) => t.userId !== userId));
      db.set('consumptionEntries', db.get('consumptionEntries').filter((e) => e.userId !== userId));
      db.set('thcCravings', db.get('thcCravings').filter((c) => c.userId !== userId));
      db.set('thcReductionPlans', db.get('thcReductionPlans').filter((p) => p.userId !== userId));
      db.set('thcDailyGoals', db.get('thcDailyGoals').filter((g) => g.userId !== userId));
      db.set('thcTriggers', db.get('thcTriggers').filter((t) => t.userId !== userId));
      db.set('thcJourneyEvents', db.get('thcJourneyEvents').filter((e) => e.userId !== userId));
      db.set('cbdProfiles', db.get('cbdProfiles').filter((c) => c.userId !== userId));
      db.set('cbdConsumptions', db.get('cbdConsumptions').filter((c) => c.userId !== userId));
      db.set('cbdWellnessObservations', db.get('cbdWellnessObservations').filter((o) => o.userId !== userId));
      db.set('wellnessEntries', db.get('wellnessEntries').filter((w) => w.userId !== userId));
      db.set('personalNotes', db.get('personalNotes').filter((n) => n.userId !== userId));
      db.set('userGoals', db.get('userGoals').filter((g) => g.userId !== userId));
      db.set('progress', db.get('progress').filter((pr) => pr.userId !== userId));
      db.set('aiConversations', db.get('aiConversations').filter((ac) => ac.userId !== userId));
      db.set('notifications', db.get('notifications').filter((n) => n.userId !== userId));
      db.set('userPreferences', db.get('userPreferences').filter((p) => p.userId !== userId));
      db.set('userConsents', db.get('userConsents').filter((c) => c.userId !== userId));
      db.set('userProfiles', db.get('userProfiles').filter((p) => p.userId !== userId));

      // 2. Anonymize/Pseudonymize Commerce & Billing records under legal accounting obligations
      let ordersAnonymizedCount = 0;
      const orders = db.get('globalOrders' as any) || [];
      for (const order of orders) {
        if (order.customerId === userId) {
          order.customerEmail = `anonymized_${Buffer.from(userId).toString('hex').slice(0, 10)}@rgpd-erased.invalid`;
          if (order.shippingAddress) {
            order.shippingAddress.fullName = '[DONNÉE SUPPRIMÉE RGPD]';
            order.shippingAddress.addressLine1 = '[SUPPRIMÉ]';
            order.shippingAddress.addressLine2 = undefined;
            order.shippingAddress.phoneNumber = '[SUPPRIMÉ]';
          }
          ordersAnonymizedCount++;
        }
      }

      // 3. Delete auth account
      db.set('users', db.get('users').filter((u) => u.id !== userId));
      db.save();

      db.logAudit('RGPD_USER_DELETED_ACCOUNT', 'users', undefined, {
        deletedUserId: userId,
        ordersAnonymizedCount,
        legalNotice: 'Obligations comptables Code de commerce Art. L123-22 respectées.',
      });

      return {
        success: true,
        deletedRecords: {
          sanctuaryCleared: true,
          ordersAnonymizedCount,
        },
      };
    } catch (err: any) {
      console.error('Delete account error:', err);
      return { success: false, error: err.message || 'Erreur lors de la suppression.', deletedRecords: { sanctuaryCleared: false, ordersAnonymizedCount: 0 } };
    }
  }

  /**
   * Executes scheduled data retention cleanup
   */
  public static runRetentionCleanup(): { success: boolean; purgedRecords: number; details: string[] } {
    const details: string[] = [];
    let purgedRecords = 0;

    try {
      // 1. Purge old audit logs older than 365 days
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const auditLogs = db.get('auditLogs') || [];
      const keptLogs = auditLogs.filter((l) => l.timestamp >= oneYearAgo);
      const purgedLogsCount = auditLogs.length - keptLogs.length;
      if (purgedLogsCount > 0) {
        db.set('auditLogs', keptLogs);
        purgedRecords += purgedLogsCount;
        details.push(`${purgedLogsCount} logs d’audit expirés purgés (> 365j).`);
      }

      // 2. Purge stale unconfirmed carts / temporary notifications older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const notifications = db.get('notifications') || [];
      const keptNotifs = notifications.filter((n) => n.createdAt >= ninetyDaysAgo || !n.isRead);
      const purgedNotifsCount = notifications.length - keptNotifs.length;
      if (purgedNotifsCount > 0) {
        db.set('notifications', keptNotifs);
        purgedRecords += purgedNotifsCount;
        details.push(`${purgedNotifsCount} notifications lues expirées purgées (> 90j).`);
      }

      db.save();
      db.logAudit('RETENTION_CLEANUP_EXECUTED', 'system', undefined, { purgedRecords, details });

      return { success: true, purgedRecords, details };
    } catch (err: any) {
      console.error('Retention error:', err);
      return { success: false, purgedRecords: 0, details: [err.message] };
    }
  }
}
