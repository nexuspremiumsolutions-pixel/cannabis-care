import { db } from '../../db/database';
import {
  UserCommunicationPreference,
  MarketingConsentRecord,
  MarketingConsentPurpose,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
} from '../../../src/types/entities';

export class PreferenceService {
  /**
   * Retrieves or initializes communication preferences for a user
   */
  public static getUserPreferences(userId: string): UserCommunicationPreference {
    const prefs = db.get('userCommunicationPreferences') || [];
    let userPref = prefs.find((p) => p.userId === userId);

    if (!userPref) {
      userPref = {
        userId,
        transactionalEmail: true,
        securityEmail: true,
        orderUpdatesPush: true,
        deliveryUpdatesPush: true,
        educationalPush: true,
        wellnessRemindersPush: true,
        marketingEmail: false, // Default opt-in strictly false (RGPD)
        marketingPush: false,
        marketingSms: false,
        marketingWhatsapp: false,
        partnerOffers: false,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Europe/Paris',
        frequencyLimitPerDay: 5,
        updatedAt: new Date().toISOString(),
      };
      prefs.push(userPref);
      db.set('userCommunicationPreferences', prefs);
      db.save();
    }

    return userPref;
  }

  /**
   * Updates user communication preferences
   */
  public static updateUserPreferences(
    userId: string,
    updates: Partial<UserCommunicationPreference>
  ): UserCommunicationPreference {
    const prefs = db.get('userCommunicationPreferences') || [];
    let index = prefs.findIndex((p) => p.userId === userId);

    if (index === -1) {
      this.getUserPreferences(userId);
      return this.updateUserPreferences(userId, updates);
    }

    // Force mandatory protections: transactional and security emails cannot be deactivated
    const sanitizedUpdates: Partial<UserCommunicationPreference> = {
      ...updates,
      transactionalEmail: true,
      securityEmail: true,
      updatedAt: new Date().toISOString(),
    };

    prefs[index] = {
      ...prefs[index],
      ...sanitizedUpdates,
    };

    db.set('userCommunicationPreferences', prefs);
    db.save();
    return prefs[index];
  }

  /**
   * Retrieves marketing consents for a user
   */
  public static getUserConsents(userId: string): MarketingConsentRecord[] {
    const records = db.get('marketingConsentRecords') || [];
    return records.filter((r) => r.userId === userId);
  }

  /**
   * Records an explicit marketing consent grant
   */
  public static recordConsent(params: {
    userId: string;
    purpose: MarketingConsentPurpose;
    channel: NotificationChannel;
    granted: boolean;
    source: 'REGISTRATION' | 'ONBOARDING' | 'SETTINGS' | 'CHECKOUT' | 'BANNER';
    version?: string;
    ipAddress?: string;
    userAgent?: string;
  }): MarketingConsentRecord {
    const records = db.get('marketingConsentRecords') || [];
    const now = new Date().toISOString();

    const record: MarketingConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      purpose: params.purpose,
      channel: params.channel,
      granted: params.granted,
      source: params.source,
      version: params.version || '2026.1',
      timestamp: now,
      withdrawnAt: params.granted ? undefined : now,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    };

    records.push(record);
    db.set('marketingConsentRecords', records);

    // Synchronize boolean switches in user preferences
    const prefs = this.getUserPreferences(params.userId);
    if (params.channel === 'EMAIL' && params.purpose === 'MARKETING_NEWSLETTER') {
      this.updateUserPreferences(params.userId, { marketingEmail: params.granted });
    } else if (params.channel === 'PUSH' && params.purpose === 'MARKETING_NEWSLETTER') {
      this.updateUserPreferences(params.userId, { marketingPush: params.granted });
    } else if (params.channel === 'SMS') {
      this.updateUserPreferences(params.userId, { marketingSms: params.granted });
    } else if (params.channel === 'WHATSAPP') {
      this.updateUserPreferences(params.userId, { marketingWhatsapp: params.granted });
    } else if (params.purpose === 'PARTNER_PROMOTIONS') {
      this.updateUserPreferences(params.userId, { partnerOffers: params.granted });
    }

    db.save();
    return record;
  }

  /**
   * Withdraws a marketing consent
   */
  public static withdrawConsent(userId: string, purpose: MarketingConsentPurpose): boolean {
    const records = db.get('marketingConsentRecords') || [];
    const existing = records.filter((r) => r.userId === userId && r.purpose === purpose && r.granted);

    if (existing.length === 0) return false;

    const now = new Date().toISOString();
    existing.forEach((r) => {
      r.granted = false;
      r.withdrawnAt = now;
    });

    db.set('marketingConsentRecords', records);

    // Update preferences accordingly
    if (purpose === 'MARKETING_NEWSLETTER') {
      this.updateUserPreferences(userId, { marketingEmail: false, marketingPush: false });
    } else if (purpose === 'PARTNER_PROMOTIONS') {
      this.updateUserPreferences(userId, { partnerOffers: false });
    }

    db.save();
    return true;
  }

  /**
   * Determines if a communication can legally and technically be delivered to the user
   */
  public static canDeliver(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
    priority: NotificationPriority = 'MEDIUM'
  ): { allowed: boolean; reason?: string } {
    // 1. IN_APP is always allowed for in-platform notifications
    if (channel === 'IN_APP') {
      return { allowed: true };
    }

    // 2. Transactional & Security communications:
    // Strictly mandated by law and platform contract. Cannot be unsubscribed.
    const isMandatory = ['SECURITY', 'PAYMENT', 'ORDER', 'DELIVERY', 'ACCOUNT'].includes(category);
    if (isMandatory) {
      if (channel === 'EMAIL') {
        return { allowed: true };
      }
      // For push / sms on mandatory orders, check if user hasn't explicitly disabled the push category
      const prefs = this.getUserPreferences(userId);
      if (category === 'DELIVERY' && channel === 'PUSH' && !prefs.deliveryUpdatesPush) {
        return { allowed: false, reason: 'Delivery push notifications disabled in preferences' };
      }
      if (category === 'ORDER' && channel === 'PUSH' && !prefs.orderUpdatesPush) {
        return { allowed: false, reason: 'Order push notifications disabled in preferences' };
      }
      return { allowed: true };
    }

    const prefs = this.getUserPreferences(userId);

    // 3. Marketing communications strictly require explicit consent
    if (category === 'MARKETING') {
      if (channel === 'EMAIL' && !prefs.marketingEmail) {
        return { allowed: false, reason: 'Marketing email consent not granted or opted-out' };
      }
      if (channel === 'PUSH' && !prefs.marketingPush) {
        return { allowed: false, reason: 'Marketing push notifications disabled in preferences' };
      }
      if (channel === 'SMS' && !prefs.marketingSms) {
        return { allowed: false, reason: 'Marketing SMS consent not granted' };
      }
      if (channel === 'WHATSAPP' && !prefs.marketingWhatsapp) {
        return { allowed: false, reason: 'Marketing WhatsApp consent not granted' };
      }
    }

    // 4. Educational & Wellness checks
    if (category === 'EDUCATION' && channel === 'PUSH' && !prefs.educationalPush) {
      return { allowed: false, reason: 'Educational push notifications disabled' };
    }
    if (category === 'WELLNESS' && channel === 'PUSH' && !prefs.wellnessRemindersPush) {
      return { allowed: false, reason: 'Wellness reminders push notifications disabled' };
    }

    // 5. Quiet Hours check (for non-urgent messages)
    if (priority !== 'URGENT' && priority !== 'HIGH' && prefs.quietHoursEnabled) {
      if (this.isWithinQuietHours(prefs)) {
        return { allowed: false, reason: 'Recipient currently in configured quiet hours' };
      }
    }

    return { allowed: true };
  }

  /**
   * Checks if current time is inside the user's quiet hours window
   */
  private static isWithinQuietHours(prefs: UserCommunicationPreference): boolean {
    try {
      const now = new Date();
      // Format local hour:min in user's timezone
      const timeStr = now.toLocaleTimeString('fr-FR', {
        timeZone: prefs.timezone || 'Europe/Paris',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const [curH, curM] = timeStr.split(':').map(Number);
      const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
      const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);

      const curVal = curH * 60 + curM;
      const startVal = startH * 60 + startM;
      const endVal = endH * 60 + endM;

      if (startVal <= endVal) {
        return curVal >= startVal && curVal <= endVal;
      } else {
        // Crosses midnight, e.g. 22:00 to 08:00
        return curVal >= startVal || curVal <= endVal;
      }
    } catch {
      return false;
    }
  }
}
