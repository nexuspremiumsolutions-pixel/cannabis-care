import { db } from '../../db/database';
import { Reward, RewardStatus } from '../../../src/types/entities';

export class RewardService {
  /**
   * Retrieves all rewards, optionally filtered by status, category, partner, or user eligibility.
   */
  public static getAllRewards(status: RewardStatus = 'ACTIVE'): Reward[] {
    const rewards = db.get('rewards') || [];
    return rewards.filter((r) => r.status === status);
  }

  public static getRewardById(id: string): Reward | undefined {
    const rewards = db.get('rewards') || [];
    return rewards.find((r) => r.id === id);
  }

  /**
   * Returns rewards for a specific partner shop.
   */
  public static getRewardsByPartnerShop(partnerShopId: string): Reward[] {
    const rewards = db.get('rewards') || [];
    return rewards.filter((r) => r.partnerShopId === partnerShopId);
  }

  /**
   * Saves or updates a reward in catalog (admin feature).
   */
  public static saveReward(reward: Reward): Reward {
    const rewards = db.get('rewards') || [];
    const index = rewards.findIndex((r) => r.id === reward.id);
    if (index >= 0) {
      rewards[index] = { ...reward, updatedAt: new Date().toISOString() };
    } else {
      rewards.push({
        ...reward,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    db.set('rewards', [...rewards]);
    return reward;
  }
}
