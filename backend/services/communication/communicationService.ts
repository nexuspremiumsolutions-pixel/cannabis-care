import { db } from '../../db/database';
import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  NotificationDelivery,
} from '../../../src/types/entities';
import { TemplateService } from './templateService';
import { PreferenceService } from './preferenceService';
import { DeliveryAdapters } from './deliveryAdapters';

export interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  category?: NotificationCategory;
  title?: string;
  body?: string;
  templateKey?: string;
  templateVariables?: Record<string, any>;
  channels?: NotificationChannel[];
  deepLink?: string;
  priority?: NotificationPriority;
  shopId?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, any>;
  locale?: 'fr' | 'en' | 'ar';
}

export class CommunicationService {
  /**
   * Primary dispatcher to create and send notifications across designated channels
   */
  public static async sendNotification(params: SendNotificationParams): Promise<{
    notification: Notification;
    deliveries: NotificationDelivery[];
  }> {
    const now = new Date().toISOString();
    const channels = params.channels && params.channels.length > 0 ? params.channels : (['IN_APP'] as NotificationChannel[]);
    const priority = params.priority || 'MEDIUM';
    const category: NotificationCategory = params.category || 'SYSTEM';

    // 1. Resolve content: either through template or direct strings
    let resolvedTitle = params.title || '';
    let resolvedBody = params.body || '';
    let resolvedSubject: string | undefined = undefined;

    if (params.templateKey) {
      const template = TemplateService.getTemplate(params.templateKey, params.locale || 'fr', channels[0]);
      if (template) {
        const rendered = TemplateService.renderTemplate(template, params.templateVariables || {});
        resolvedTitle = rendered.title;
        resolvedBody = rendered.body;
        resolvedSubject = rendered.subject;
      }
    }

    if (!resolvedTitle) {
      resolvedTitle = 'Notification';
    }

    // 2. Instantiate and persist in-app Notification record
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notification: Notification = {
      id: notifId,
      userId: params.userId,
      type: params.type,
      category,
      title: resolvedTitle,
      body: resolvedBody,
      message: resolvedBody, // Backward compatibility
      deepLink: params.deepLink,
      priority,
      status: 'UNREAD',
      isRead: false,
      readAt: null,
      archivedAt: null,
      createdAt: now,
      expiresAt: params.expiresAt || null,
      shopId: params.shopId || null,
      metadata: params.metadata || {},
    };

    const notifications = db.get('notifications') || [];
    notifications.unshift(notification);
    db.set('notifications', notifications);

    // 3. Dispatch to all requested channels and record delivery receipts
    const allDeliveries = db.get('notificationDeliveries') || [];
    const createdDeliveries: NotificationDelivery[] = [];

    for (const channel of channels) {
      // RGPD, Consent, and Quiet Hours verification
      const check = PreferenceService.canDeliver(params.userId, category, channel, priority);
      const deliveryId = `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (!check.allowed) {
        const failedDelivery: NotificationDelivery = {
          id: deliveryId,
          notificationId: notifId,
          userId: params.userId,
          channel,
          provider: 'POLICY_GATEWAY',
          status: 'UNSUBSCRIBED',
          attemptedAt: now,
          failedAt: now,
          errorCode: 'CONSENT_OR_PREFERENCE_BLOCKED',
          errorMessage: check.reason,
          retryCount: 0,
        };
        createdDeliveries.push(failedDelivery);
        allDeliveries.push(failedDelivery);
        continue;
      }

      // Execute actual channel delivery through adapter
      const targetUser = (db.get('users') || []).find((u) => u.id === params.userId);
      const result = await DeliveryAdapters.deliver(channel, {
        notificationId: notifId,
        userId: params.userId,
        recipientAddress: targetUser?.email,
        title: resolvedTitle,
        body: resolvedBody,
        subject: resolvedSubject,
        deepLink: params.deepLink,
        metadata: params.metadata,
      });

      const deliveryRecord: NotificationDelivery = {
        id: deliveryId,
        notificationId: notifId,
        userId: params.userId,
        channel,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        status: result.status,
        attemptedAt: now,
        deliveredAt: result.deliveredAt,
        failedAt: result.failedAt,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        retryCount: 0,
      };

      createdDeliveries.push(deliveryRecord);
      allDeliveries.push(deliveryRecord);
    }

    db.set('notificationDeliveries', allDeliveries);
    db.save();

    return {
      notification,
      deliveries: createdDeliveries,
    };
  }

  /**
   * Retrieves notifications for a specific user with filtering and pagination
   */
  public static getUserNotifications(
    userId: string,
    options: {
      status?: 'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED';
      category?: NotificationCategory;
      shopId?: string | null;
      limit?: number;
      offset?: number;
    } = {}
  ): { items: Notification[]; total: number; unreadCount: number } {
    const notifications = db.get('notifications') || [];
    let userNotifs = notifications.filter((n) => n.userId === userId);

    // Multi-tenant store isolation
    if (options.shopId) {
      userNotifs = userNotifs.filter((n) => !n.shopId || n.shopId === options.shopId);
    }

    // Category filter
    if (options.category) {
      userNotifs = userNotifs.filter((n) => n.category === options.category);
    }

    // Calculate unread count (excluding archived)
    const unreadCount = userNotifs.filter(
      (n) => (n.status === 'UNREAD' || !n.isRead) && n.status !== 'ARCHIVED'
    ).length;

    // Status filter
    if (options.status === 'UNREAD') {
      userNotifs = userNotifs.filter((n) => (n.status === 'UNREAD' || !n.isRead) && n.status !== 'ARCHIVED');
    } else if (options.status === 'READ') {
      userNotifs = userNotifs.filter((n) => (n.status === 'READ' || n.isRead) && n.status !== 'ARCHIVED');
    } else if (options.status === 'ARCHIVED') {
      userNotifs = userNotifs.filter((n) => n.status === 'ARCHIVED');
    } else {
      // By default for 'ALL', hide archived unless requested
      userNotifs = userNotifs.filter((n) => n.status !== 'ARCHIVED');
    }

    const total = userNotifs.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const items = userNotifs.slice(offset, offset + limit);

    return { items, total, unreadCount };
  }

  /**
   * Marks a notification as read
   */
  public static markAsRead(notificationId: string, userId: string): Notification | null {
    const notifications = db.get('notifications') || [];
    const notif = notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!notif) return null;

    notif.isRead = true;
    notif.status = 'READ';
    notif.readAt = new Date().toISOString();

    // Also update delivery opened timestamp if IN_APP
    const deliveries = db.get('notificationDeliveries') || [];
    const deliv = deliveries.find((d) => d.notificationId === notificationId && d.channel === 'IN_APP');
    if (deliv && !deliv.openedAt) {
      deliv.openedAt = notif.readAt;
      db.set('notificationDeliveries', deliveries);
    }

    db.set('notifications', notifications);
    db.save();
    return notif;
  }

  /**
   * Marks all notifications as read for a user
   */
  public static markAllAsRead(userId: string, shopId?: string | null): number {
    const notifications = db.get('notifications') || [];
    const now = new Date().toISOString();
    let updatedCount = 0;

    notifications.forEach((n) => {
      if (n.userId === userId && (!shopId || n.shopId === shopId) && (!n.isRead || n.status === 'UNREAD')) {
        n.isRead = true;
        n.status = 'READ';
        n.readAt = now;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      db.set('notifications', notifications);
      db.save();
    }
    return updatedCount;
  }

  /**
   * Archives a notification
   */
  public static archiveNotification(notificationId: string, userId: string): boolean {
    const notifications = db.get('notifications') || [];
    const notif = notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!notif) return false;

    notif.status = 'ARCHIVED';
    notif.archivedAt = new Date().toISOString();
    db.set('notifications', notifications);
    db.save();
    return true;
  }

  /**
   * Deletes a notification permanently
   */
  public static deleteNotification(notificationId: string, userId: string): boolean {
    const notifications = db.get('notifications') || [];
    const initialLen = notifications.length;
    const filtered = notifications.filter((n) => !(n.id === notificationId && n.userId === userId));

    if (filtered.length !== initialLen) {
      db.set('notifications', filtered);
      db.save();
      return true;
    }
    return false;
  }

  /**
   * Records an interaction/click on a notification link for analytics & attribution
   */
  public static recordInteraction(
    notificationId: string,
    userId: string,
    channel: NotificationChannel = 'IN_APP'
  ): void {
    const deliveries = db.get('notificationDeliveries') || [];
    const deliv = deliveries.find(
      (d) => d.notificationId === notificationId && d.userId === userId && d.channel === channel
    );
    if (deliv) {
      deliv.clickedAt = new Date().toISOString();
      db.set('notificationDeliveries', deliveries);
      db.save();
    }
  }
}
