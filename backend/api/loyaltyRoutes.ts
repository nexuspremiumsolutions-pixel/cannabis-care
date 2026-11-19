import { Router, Request, Response } from 'express';
import { LoyaltyService } from '../services/loyalty/loyaltyService';
import { LoyaltyPointsService } from '../services/loyalty/loyaltyPointsService';
import { LevelService } from '../services/loyalty/levelService';
import { StreakService } from '../services/loyalty/streakService';
import { AchievementService } from '../services/loyalty/achievementService';
import { ChallengeService } from '../services/loyalty/challengeService';
import { RewardService } from '../services/loyalty/rewardService';
import { RewardRedemptionService } from '../services/loyalty/rewardRedemptionService';
import { ReferralService } from '../services/loyalty/referralService';
import { LoyaltyRuleEngine } from '../services/loyalty/loyaltyRuleEngine';
import { LoyaltyAnalyticsService } from '../services/loyalty/loyaltyAnalyticsService';
import { db } from '../db/database';

export const loyaltyRouter = Router();

// Helper to resolve current user (fallback to first user or demo user)
function resolveUserId(req: Request): string {
  const headerUser = req.headers['x-user-id'] as string;
  if (headerUser) return headerUser;
  const users = db.get('users') || [];
  return users[0]?.id || 'user_demo_1';
}

// --------------------------------------------------------------------------
// 1. Account & Summary
// --------------------------------------------------------------------------
loyaltyRouter.get('/summary', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const summary = LoyaltyService.getUserLoyaltySummary(userId);
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.get('/account', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const account = LoyaltyPointsService.getOrCreateAccount(userId);
    res.json({ success: true, account });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.get('/levels', (_req: Request, res: Response) => {
  try {
    const levels = LevelService.getAllLevels();
    res.json({ success: true, levels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.get('/transactions', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const transactions = LoyaltyPointsService.getUserTransactions(userId, limit);
    res.json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 2. Rules & Automated Triggers
// --------------------------------------------------------------------------
loyaltyRouter.get('/rules', (_req: Request, res: Response) => {
  try {
    const rules = db.get('loyaltyRules') || [];
    res.json({ success: true, rules: rules.filter((r) => r.status === 'ACTIVE') });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/trigger-rule', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { eventCode, payload } = req.body;

    if (!eventCode) {
      return res.status(400).json({ success: false, error: 'eventCode requis' });
    }

    const result = await LoyaltyRuleEngine.processEvent(userId, eventCode, payload || {});
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 3. Streaks
// --------------------------------------------------------------------------
loyaltyRouter.get('/streaks', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const streaks = StreakService.getUserStreaks(userId);
    res.json({ success: true, streaks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/streaks/record', (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { type, date } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, error: 'type de streak requis' });
    }

    const result = StreakService.recordActivity(userId, type, date);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 4. Badges & Achievements
// --------------------------------------------------------------------------
loyaltyRouter.get('/badges', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const badgeData = AchievementService.getEnrichedUserAchievements(userId);
    res.json({ success: true, ...badgeData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/badges/unlock', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { achievementCode } = req.body;
    if (!achievementCode) {
      return res.status(400).json({ success: false, error: 'achievementCode requis' });
    }

    const result = await AchievementService.checkAndUnlock(userId, achievementCode);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 5. Challenges
// --------------------------------------------------------------------------
loyaltyRouter.get('/challenges', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const challenges = ChallengeService.getEnrichedChallenges(userId);
    res.json({ success: true, challenges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/challenges/join', (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { challengeId } = req.body;
    if (!challengeId) {
      return res.status(400).json({ success: false, error: 'challengeId requis' });
    }

    const userChallenge = ChallengeService.joinChallenge(userId, challengeId);
    res.json({ success: true, userChallenge });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/challenges/progress', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { challengeId, increment } = req.body;
    if (!challengeId) {
      return res.status(400).json({ success: false, error: 'challengeId requis' });
    }

    const result = await ChallengeService.recordProgress(userId, challengeId, increment || 1);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/challenges/abandon', (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { challengeId } = req.body;
    if (!challengeId) {
      return res.status(400).json({ success: false, error: 'challengeId requis' });
    }

    const uc = ChallengeService.abandonChallenge(userId, challengeId);
    res.json({ success: true, userChallenge: uc });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 6. Rewards & Redemptions
// --------------------------------------------------------------------------
loyaltyRouter.get('/rewards', (req: Request, res: Response) => {
  try {
    const status = (req.query.status as any) || 'ACTIVE';
    const rewards = RewardService.getAllRewards(status);
    res.json({ success: true, rewards });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.get('/redemptions', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const redemptions = RewardRedemptionService.getUserRedemptions(userId);
    res.json({ success: true, redemptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/rewards/redeem', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { rewardId } = req.body;
    if (!rewardId) {
      return res.status(400).json({ success: false, error: 'rewardId requis' });
    }

    const result = await RewardRedemptionService.redeemReward(userId, rewardId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/redemptions/use', (req: Request, res: Response) => {
  try {
    const { redemptionCode, shopId } = req.body;
    if (!redemptionCode) {
      return res.status(400).json({ success: false, error: 'redemptionCode requis' });
    }

    const result = RewardRedemptionService.markAsUsed(redemptionCode, shopId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/redemptions/cancel', async (req: Request, res: Response) => {
  try {
    const { redemptionId, reason } = req.body;
    if (!redemptionId) {
      return res.status(400).json({ success: false, error: 'redemptionId requis' });
    }

    const redemption = await RewardRedemptionService.cancelRedemption(redemptionId, reason);
    res.json({ success: true, redemption });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 7. Referral Program
// --------------------------------------------------------------------------
loyaltyRouter.get('/referral', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const program = ReferralService.getActiveProgram();
    const referralCode = ReferralService.getUserReferralCode(userId);
    const referrals = ReferralService.getUserReferrals(userId);

    res.json({
      success: true,
      program,
      referralCode,
      referrals,
      stats: {
        totalInvited: referrals.length,
        totalQualified: referrals.filter((r) => r.status === 'QUALIFIED' || r.status === 'REWARDED').length,
        rewardPerReferral: program.referrerReward,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/referral/apply', (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || resolveUserId(req);
    const { referralCode } = req.body;
    if (!referralCode) {
      return res.status(400).json({ success: false, error: 'referralCode requis' });
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const result = ReferralService.applyReferralCode(userId, referralCode, clientIp);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------------------------------
// 8. Admin & Analytics
// --------------------------------------------------------------------------
loyaltyRouter.get('/admin/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = LoyaltyAnalyticsService.getOverviewMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/admin/adjust-points', async (req: Request, res: Response) => {
  try {
    const { targetUserId, points, reason } = req.body;
    const adminUserId = req.headers['x-admin-id'] as string || 'admin_sys';
    const adminEmail = req.headers['x-admin-email'] as string || 'admin@nexuscare.local';

    if (!targetUserId || typeof points !== 'number' || !reason) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId, points (number) et reason obligatoires.',
      });
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string);
    const result = await LoyaltyService.adminAdjustPoints({
      adminUserId,
      adminEmail,
      targetUserId,
      points,
      reason,
      clientIp,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = LoyaltyService.getAdminAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

loyaltyRouter.post('/admin/rewards', (req: Request, res: Response) => {
  try {
    const reward = req.body;
    if (!reward.title || !reward.pointsCost) {
      return res.status(400).json({ success: false, error: 'title et pointsCost requis' });
    }
    const saved = RewardService.saveReward(reward);
    res.json({ success: true, reward: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
