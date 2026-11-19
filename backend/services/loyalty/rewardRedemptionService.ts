import crypto from 'crypto';
import { db } from '../../db/database';
import {
  Reward,
  RewardRedemption,
  RewardRedemptionStatus,
} from '../../../src/types/entities';
import { LoyaltyPointsService } from './loyaltyPointsService';
import { LevelService } from './levelService';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

export class RewardRedemptionService {
  /**
   * Generates a unique voucher code in the format NEXUS-XXXX-XXXX
   */
  public static generateRedemptionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `NEXUS-${part1}-${part2}`;
  }

  /**
   * Retrieves all redemptions for a user.
   */
  public static getUserRedemptions(userId: string): RewardRedemption[] {
    const redemptions = db.get('rewardRedemptions') || [];
    return redemptions
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
  }

  /**
   * Redeems a reward for a user: verifies eligibility, limits, points balance, stock, decrements points atomically, and generates a redemption voucher.
   */
  public static async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<{ redemption: RewardRedemption; remainingBalance: number }> {
    const rewards = db.get('rewards') || [];
    const rewardIndex = rewards.findIndex((r) => r.id === rewardId);

    if (rewardIndex === -1) {
      throw new Error('Récompense introuvable dans le catalogue.');
    }

    const reward = rewards[rewardIndex];

    if (reward.status !== 'ACTIVE') {
      throw new Error('Cette récompense n’est plus disponible.');
    }

    // Check stock
    if (reward.stock === 0) {
      throw new Error('Cette récompense est en rupture de stock.');
    }

    // Check user usage limit
    const redemptions = db.get('rewardRedemptions') || [];
    const previousRedemptions = redemptions.filter(
      (r) =>
        r.userId === userId &&
        r.rewardId === rewardId &&
        ['RESERVED', 'ISSUED', 'USED'].includes(r.status)
    );

    if (reward.usageLimit && previousRedemptions.length >= reward.usageLimit) {
      throw new Error(
        `Limite d’utilisation atteinte pour cette récompense (${reward.usageLimit} maximum par membre).`
      );
    }

    // Check eligibility rules (level, country, etc.)
    const account = LoyaltyPointsService.getOrCreateAccount(userId);
    const levelInfo = LevelService.calculateLevelProgress(account.lifetimePoints);

    if (reward.eligibilityRules?.minLevel) {
      if (levelInfo.currentLevel.order < reward.eligibilityRules.minLevel) {
        throw new Error(
          `Niveau insuffisant. Cette récompense requiert le niveau ${reward.eligibilityRules.minLevel} ou supérieur.`
        );
      }
    }

    // Deduct points atomically
    const pointResult = await LoyaltyPointsService.modifyPoints({
      userId,
      points: -reward.pointsCost,
      type: 'REWARD_REDEMPTION',
      sourceType: 'REWARD_PURCHASE',
      sourceId: reward.id,
      description: `Échange de récompense : ${reward.title}`,
      metadata: { rewardId: reward.id, rewardType: reward.type },
    });

    // Decrement stock if finite
    if (reward.stock > 0) {
      reward.stock -= 1;
      if (reward.stock === 0) {
        reward.status = 'OUT_OF_STOCK';
      }
      rewards[rewardIndex] = reward;
      db.set('rewards', [...rewards]);
    }

    // Calculate expiration date (e.g. 60 days default for coupons)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    const redemption: RewardRedemption = {
      id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      rewardId: reward.id,
      rewardTitleSnapshot: reward.title,
      partnerShopId: reward.partnerShopId,
      pointsSpent: reward.pointsCost,
      status: 'ISSUED',
      redemptionCode: this.generateRedemptionCode(),
      redeemedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata: {
        rewardType: reward.type,
        rewardValue: reward.rewardValue,
        currency: reward.currency,
        partnerShopName: reward.partnerShopName,
        terms: reward.terms,
      },
    };

    redemptions.unshift(redemption);
    db.set('rewardRedemptions', [...redemptions]);

    // Send notification
    LoyaltyNotificationService.notifyRewardRedeemed(userId, reward, redemption.redemptionCode);

    return {
      redemption,
      remainingBalance: pointResult.account.pointsBalance,
    };
  }

  /**
   * Verifies and uses a redemption voucher (partner / cashier validation).
   */
  public static markAsUsed(
    redemptionCode: string,
    shopId?: string
  ): { success: boolean; redemption: RewardRedemption } {
    const redemptions = db.get('rewardRedemptions') || [];
    const item = redemptions.find(
      (r) => r.redemptionCode.toUpperCase() === redemptionCode.trim().toUpperCase()
    );

    if (!item) {
      throw new Error('Code de récompense invalide ou introuvable.');
    }

    if (item.status === 'USED') {
      throw new Error(
        `Ce code a déjà été utilisé le ${new Date(item.usedAt || '').toLocaleDateString('fr-FR')}.`
      );
    }

    if (item.status === 'EXPIRED') {
      throw new Error('Ce bon de récompense a expiré.');
    }

    if (item.status === 'CANCELED' || item.status === 'REFUNDED') {
      throw new Error('Ce bon a été annulé.');
    }

    // Check expiration if set
    if (item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()) {
      item.status = 'EXPIRED';
      db.set('rewardRedemptions', [...redemptions]);
      throw new Error('Ce bon de récompense a expiré.');
    }

    // Check shop affinity
    if (item.partnerShopId && shopId && item.partnerShopId !== shopId) {
      throw new Error('Ce bon est affilié à une autre boutique partenaire.');
    }

    item.status = 'USED';
    item.usedAt = new Date().toISOString();
    item.usedByShopId = shopId;

    db.set('rewardRedemptions', [...redemptions]);

    return { success: true, redemption: item };
  }

  /**
   * Cancels/refunds a redemption if not yet used, restoring points.
   */
  public static async cancelRedemption(
    redemptionId: string,
    reason = 'Annulation demandée'
  ): Promise<RewardRedemption> {
    const redemptions = db.get('rewardRedemptions') || [];
    const item = redemptions.find((r) => r.id === redemptionId);

    if (!item) {
      throw new Error('Bon introuvable.');
    }

    if (item.status === 'USED') {
      throw new Error('Impossible d’annuler un bon déjà utilisé.');
    }

    if (item.status === 'REFUNDED' || item.status === 'CANCELED') {
      return item;
    }

    item.status = 'REFUNDED';
    db.set('rewardRedemptions', [...redemptions]);

    // Refund points
    await LoyaltyPointsService.modifyPoints({
      userId: item.userId,
      points: item.pointsSpent,
      type: 'REVERSAL',
      sourceType: 'REDEMPTION_REFUND',
      sourceId: item.id,
      description: `Remboursement bon annulé : ${item.rewardTitleSnapshot} (${reason})`,
    });

    // Restore stock if finite
    const rewards = db.get('rewards') || [];
    const rew = rewards.find((r) => r.id === item.rewardId);
    if (rew && rew.stock >= 0) {
      rew.stock += 1;
      if (rew.status === 'OUT_OF_STOCK') rew.status = 'ACTIVE';
      db.set('rewards', [...rewards]);
    }

    return item;
  }
}
