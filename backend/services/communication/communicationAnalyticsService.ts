import { db } from '../../db/database';
import {
  CommunicationAnalyticsOverview,
  CommunicationAttributionRecord,
  NotificationChannel,
} from '../../../src/types/entities';

export class CommunicationAnalyticsService {
  /**
   * Generates comprehensive analytics overview for communication and deliverability
   */
  public static getOverview(shopId?: string): CommunicationAnalyticsOverview {
    const notifications = db.get('notifications') || [];
    const deliveries = db.get('notificationDeliveries') || [];
    const attributions = db.get('communicationAttributions') || [];

    // Filter if partner shop view
    const filteredDeliveries = shopId
      ? deliveries.filter((d) => {
          const notif = notifications.find((n) => n.id === d.notificationId);
          return notif?.shopId === shopId;
        })
      : deliveries;

    const totalMessagesCreated = shopId
      ? notifications.filter((n) => n.shopId === shopId).length
      : notifications.length;

    const totalDelivered = filteredDeliveries.filter((d) => d.status === 'DELIVERED').length;
    const totalFailed = filteredDeliveries.filter((d) => d.status === 'FAILED').length;
    const totalOpened = filteredDeliveries.filter((d) => Boolean(d.openedAt)).length;
    const totalClicked = filteredDeliveries.filter((d) => Boolean(d.clickedAt)).length;
    const totalUnsubscribed = filteredDeliveries.filter((d) => d.status === 'UNSUBSCRIBED').length;

    const deliveryDenominator = totalDelivered + totalFailed;
    const deliveryRate = deliveryDenominator > 0 ? Number(((totalDelivered / deliveryDenominator) * 100).toFixed(1)) : 100;
    const openRate = totalDelivered > 0 ? Number(((totalOpened / totalDelivered) * 100).toFixed(1)) : 0;
    const clickRate = totalOpened > 0 ? Number(((totalClicked / totalOpened) * 100).toFixed(1)) : 0;

    // Breakdown per channel
    const channels: NotificationChannel[] = ['IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP'];
    const channelBreakdown = channels.map((channel) => {
      const channelItems = filteredDeliveries.filter((d) => d.channel === channel);
      return {
        channel,
        sent: channelItems.length,
        delivered: channelItems.filter((d) => d.status === 'DELIVERED').length,
        failed: channelItems.filter((d) => d.status === 'FAILED').length,
      };
    });

    const totalAttributedRev = attributions.reduce((sum, a) => sum + (a.revenue || 0), 0);

    return {
      totalMessagesCreated,
      totalDelivered,
      totalFailed,
      totalOpened,
      totalClicked,
      totalUnsubscribed,
      deliveryRate,
      openRate,
      clickRate,
      channelBreakdown,
      attributedConversionsCount: attributions.length,
      attributedRevenueAmount: Number(totalAttributedRev.toFixed(2)),
    };
  }

  /**
   * Records a business conversion attributed to a notification
   */
  public static recordAttribution(params: {
    notificationId: string;
    userId: string;
    channel: NotificationChannel;
    deepLink: string;
    conversionType: 'ORDER_COMPLETED' | 'SUBSCRIPTION_PURCHASED' | 'REWARD_REDEEMED';
    targetId: string;
    revenue: number;
  }): CommunicationAttributionRecord {
    const attributions = db.get('communicationAttributions') || [];
    const now = new Date().toISOString();

    const record: CommunicationAttributionRecord = {
      id: `attr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notificationId: params.notificationId,
      userId: params.userId,
      channel: params.channel,
      deepLink: params.deepLink,
      conversionType: params.conversionType,
      targetId: params.targetId,
      revenue: params.revenue,
      timestamp: now,
    };

    attributions.push(record);
    db.set('communicationAttributions', attributions);
    db.save();
    return record;
  }
}
