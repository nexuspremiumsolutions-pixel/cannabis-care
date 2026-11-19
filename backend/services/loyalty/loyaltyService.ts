import { db } from '../../db/database';
import {
  LoyaltyAccount,
  LoyaltyAdminAuditLog,
  UserStreak,
} from '../../../src/types/entities';
import { LoyaltyPointsService } from './loyaltyPointsService';
import { LevelService, LevelProgressInfo } from './levelService';
import { StreakService } from './streakService';
import { AchievementService, EnrichedUserAchievement } from './achievementService';
import { ChallengeService, EnrichedUserChallenge } from './challengeService';
import { RewardRedemptionService } from './rewardRedemptionService';
import { ReferralService } from './referralService';

export interface UserLoyaltySummary {
  account: LoyaltyAccount;
  levelInfo: LevelProgressInfo;
  streaks: UserStreak[];
  transactions: any[];
  badges: {
    unlocked: EnrichedUserAchievement[];
    totalUnlocked: number;
    totalAvailable: number;
  };
  challenges: {
    active: EnrichedUserChallenge[];
    completedCount: number;
  };
  redemptions: {
    activeVouchers: any[];
    totalRedemptions: number;
  };
  referral: {
    referralCode: string;
    totalInvited: number;
    totalQualified: number;
    rewardPerReferral: number;
  };
}

export class LoyaltyService {
  /**
   * Builds a complete, holistic loyalty & rewards summary for the user interface.
   */
  public static getUserLoyaltySummary(userId: string): UserLoyaltySummary {
    const account = LoyaltyPointsService.getOrCreateAccount(userId);
    const levelInfo = LevelService.calculateLevelProgress(account.lifetimePoints);
    const streaks = StreakService.getUserStreaks(userId);
    const transactions = LoyaltyPointsService.getUserTransactions(userId, 15);
    const badgeData = AchievementService.getEnrichedUserAchievements(userId);
    const challengeData = ChallengeService.getEnrichedChallenges(userId);
    const userRedemptions = RewardRedemptionService.getUserRedemptions(userId);
    const referralCode = ReferralService.getUserReferralCode(userId);
    const referrals = ReferralService.getUserReferrals(userId);
    const program = ReferralService.getActiveProgram();

    const activeVouchers = userRedemptions.filter(
      (r) => r.status === 'ISSUED' || r.status === 'RESERVED'
    );
    const activeChallenges = challengeData.filter((c) => c.isJoined && !c.isCompleted);
    const completedChallenges = challengeData.filter((c) => c.isCompleted);

    return {
      account,
      levelInfo,
      streaks,
      transactions,
      badges: {
        unlocked: badgeData.unlocked,
        totalUnlocked: badgeData.unlocked.length,
        totalAvailable: badgeData.unlocked.length + badgeData.locked.length,
      },
      challenges: {
        active: activeChallenges,
        completedCount: completedChallenges.length,
      },
      redemptions: {
        activeVouchers,
        totalRedemptions: userRedemptions.length,
      },
      referral: {
        referralCode,
        totalInvited: referrals.length,
        totalQualified: referrals.filter((r) => r.status === 'QUALIFIED' || r.status === 'REWARDED').length,
        rewardPerReferral: program.referrerReward,
      },
    };
  }

  /**
   * Admin-authorized point adjustment with mandatory audit logging.
   */
  public static async adminAdjustPoints(params: {
    adminUserId: string;
    adminEmail?: string;
    targetUserId: string;
    points: number; // positive or negative
    reason: string;
    clientIp?: string;
  }): Promise<{ account: LoyaltyAccount; auditLog: LoyaltyAdminAuditLog }> {
    const { adminUserId, adminEmail, targetUserId, points, reason, clientIp } = params;

    const previousAccount = LoyaltyPointsService.getOrCreateAccount(targetUserId);
    const beforeBalance = previousAccount.pointsBalance;

    const res = await LoyaltyPointsService.modifyPoints({
      userId: targetUserId,
      points,
      type: 'ADJUSTMENT',
      sourceType: 'ADMIN_ADJUSTMENT',
      sourceId: adminUserId,
      description: `Ajustement administratif : ${reason}`,
      metadata: { adminUserId, adminEmail, reason },
    });

    const auditLog: LoyaltyAdminAuditLog = {
      id: `laud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminUserId,
      adminEmail,
      action: points >= 0 ? 'ADMIN_CREDIT_POINTS' : 'ADMIN_DEBIT_POINTS',
      entityType: 'POINTS',
      entityId: targetUserId,
      before: { pointsBalance: beforeBalance },
      after: { pointsBalance: res.account.pointsBalance },
      reason,
      timestamp: new Date().toISOString(),
      ip: clientIp,
      metadata: { adjustedPoints: points },
    };

    const auditLogs = db.get('loyaltyAdminAuditLogs') || [];
    auditLogs.unshift(auditLog);
    db.set('loyaltyAdminAuditLogs', [...auditLogs]);

    return { account: res.account, auditLog };
  }

  /**
   * Returns audit logs for admin console.
   */
  public static getAdminAuditLogs(limit = 100): LoyaltyAdminAuditLog[] {
    const logs = db.get('loyaltyAdminAuditLogs') || [];
    return logs.slice(0, limit);
  }
}
