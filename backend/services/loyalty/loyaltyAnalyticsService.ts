import { db } from '../../db/database';
import { LevelService } from './levelService';

export interface LoyaltyMetrics {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeAccountsCount: number;
  totalBadgesUnlocked: number;
  totalChallengesCompleted: number;
  totalRedemptionsIssued: number;
  totalRedemptionsUsed: number;
  totalReferralsCount: number;
  qualifiedReferralsCount: number;
  levelDistribution: Array<{ levelId: string; levelName: string; count: number }>;
}

export class LoyaltyAnalyticsService {
  /**
   * Generates global KPIs and metrics for the loyalty and rewards program.
   */
  public static getOverviewMetrics(): LoyaltyMetrics {
    const accounts = db.get('loyaltyAccounts') || [];
    const transactions = db.get('loyaltyTransactions') || [];
    const achievements = db.get('userAchievements') || [];
    const userChallenges = db.get('userChallenges') || [];
    const redemptions = db.get('rewardRedemptions') || [];
    const referrals = db.get('referrals') || [];
    const levels = LevelService.getAllLevels();

    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;

    for (const tx of transactions) {
      if (tx.points > 0) {
        totalPointsIssued += tx.points;
      } else {
        totalPointsRedeemed += Math.abs(tx.points);
      }
    }

    const levelCounts: Record<string, number> = {};
    levels.forEach((l) => (levelCounts[l.id] = 0));

    accounts.forEach((acc) => {
      if (levelCounts[acc.currentLevelId] !== undefined) {
        levelCounts[acc.currentLevelId]++;
      }
    });

    const levelDistribution = levels.map((l) => ({
      levelId: l.id,
      levelName: l.name,
      count: levelCounts[l.id] || 0,
    }));

    const totalChallengesCompleted = userChallenges.filter(
      (c) => c.status === 'COMPLETED'
    ).length;
    const totalRedemptionsIssued = redemptions.length;
    const totalRedemptionsUsed = redemptions.filter((r) => r.status === 'USED').length;
    const qualifiedReferralsCount = referrals.filter(
      (r) => r.status === 'QUALIFIED' || r.status === 'REWARDED'
    ).length;

    return {
      totalPointsIssued,
      totalPointsRedeemed,
      activeAccountsCount: accounts.filter((a) => a.status === 'ACTIVE').length,
      totalBadgesUnlocked: achievements.length,
      totalChallengesCompleted,
      totalRedemptionsIssued,
      totalRedemptionsUsed,
      totalReferralsCount: referrals.length,
      qualifiedReferralsCount,
      levelDistribution,
    };
  }
}
