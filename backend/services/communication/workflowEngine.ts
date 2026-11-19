import { db } from '../../db/database';
import {
  NotificationEvent,
  NotificationEventType,
  CommunicationWorkflow,
} from '../../../src/types/entities';
import { CommunicationService } from './communicationService';
import { PreferenceService } from './preferenceService';

export class WorkflowEngine {
  /**
   * Dispatches a domain event and triggers matching automated communication workflows
   */
  public static async triggerEvent(
    eventType: NotificationEventType,
    userId: string,
    payload: Record<string, any> = {},
    shopId?: string,
    idempotencyKey?: string
  ): Promise<{ event: NotificationEvent; triggeredWorkflows: string[] }> {
    const now = new Date().toISOString();

    // 1. Idempotency check to avoid duplicate dispatches
    const events = db.get('notificationEvents') || [];
    if (idempotencyKey) {
      const existing = events.find((e) => e.idempotencyKey === idempotencyKey);
      if (existing) {
        return { event: existing, triggeredWorkflows: [] };
      }
    }

    // 2. Persist notification event
    const event: NotificationEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      userId,
      shopId,
      payload,
      timestamp: now,
      idempotencyKey,
    };
    events.unshift(event);
    db.set('notificationEvents', events);

    // 3. Find active workflows matching this trigger event
    const workflows = db.get('communicationWorkflows') || [];
    const matchingWorkflows = workflows.filter(
      (w) => w.triggerEvent === eventType && w.status === 'ACTIVE'
    );

    const triggeredWorkflows: string[] = [];

    for (const wf of matchingWorkflows) {
      // If workflow requires marketing consent, verify compliance before sending
      if (wf.requiresMarketingConsent) {
        const prefs = PreferenceService.getUserPreferences(userId);
        const hasConsent = prefs.marketingEmail || prefs.marketingPush;
        if (!hasConsent) {
          continue; // Opt-out respected
        }
      }

      // Dispatch through CommunicationService
      await CommunicationService.sendNotification({
        userId,
        type: 'TRANSACTIONAL',
        category: this.mapEventToCategory(eventType),
        templateKey: wf.templateKey,
        templateVariables: {
          ...payload,
          userName: payload.userName || 'Adhérent',
        },
        channels: wf.channels,
        deepLink: payload.deepLink || '/notifications',
        shopId: shopId || payload.shopId,
        metadata: { workflowId: wf.id, eventId: event.id },
      });

      wf.executionsCount = (wf.executionsCount || 0) + 1;
      triggeredWorkflows.push(wf.id);
    }

    db.set('communicationWorkflows', workflows);
    db.save();

    return { event, triggeredWorkflows };
  }

  /**
   * Retrieves all workflows
   */
  public static getAllWorkflows(): CommunicationWorkflow[] {
    return db.get('communicationWorkflows') || [];
  }

  /**
   * Maps event type to default notification category
   */
  private static mapEventToCategory(eventType: NotificationEventType): any {
    switch (eventType) {
      case 'ORDER_CREATED':
      case 'ORDER_CONFIRMED':
        return 'ORDER';
      case 'SHIPMENT_CREATED':
      case 'SHIPMENT_SHIPPED':
      case 'SHIPMENT_IN_TRANSIT':
      case 'SHIPMENT_DELIVERED':
      case 'PICKUP_READY':
      case 'PICKUP_COMPLETED':
        return 'DELIVERY';
      case 'PAYMENT_SUCCEEDED':
      case 'PAYMENT_FAILED':
        return 'PAYMENT';
      case 'SECURITY_ALERT':
        return 'SECURITY';
      case 'SUBSCRIPTION_STARTED':
      case 'SUBSCRIPTION_RENEWAL':
      case 'SUBSCRIPTION_PAYMENT_FAILED':
      case 'SUBSCRIPTION_CANCELED':
        return 'SUBSCRIPTION';
      case 'REWARD_EARNED':
      case 'REFERRAL_COMPLETED':
        return 'LOYALTY';
      case 'EDUCATIONAL_PROGRESS':
        return 'EDUCATION';
      case 'WELLNESS_REMINDER':
        return 'WELLNESS';
      case 'CAMPAIGN_STARTED':
      case 'CART_ABANDONED':
        return 'MARKETING';
      default:
        return 'SYSTEM';
    }
  }
}
