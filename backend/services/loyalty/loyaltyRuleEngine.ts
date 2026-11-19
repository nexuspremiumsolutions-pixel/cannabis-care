import { db } from '../../db/database';
import { LoyaltyRule, LoyaltyTransaction } from '../../../src/types/entities';
import { LoyaltyPointsService } from './loyaltyPointsService';
import { StreakService } from './streakService';
import { AchievementService } from './achievementService';
import { ReferralService } from './referralService';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

export class LoyaltyRuleEngine {
  /**
   * Evaluates limits and cooldowns for a given rule and user.
   */
  public static canTriggerRule(userId: string, rule: LoyaltyRule): boolean {
    if (rule.status !== 'ACTIVE') return false;

    const txs = db.get('loyaltyTransactions') || [];
    const ruleTxs = txs.filter(
      (t) => t.userId === userId && t.sourceType === 'RULE_EVENT' && t.sourceId === rule.id
    );

    if (rule.maxFrequency === 'ONCE') {
      return ruleTxs.length === 0;
    }

    const now = Date.now();

    // Check cooldown hours
    if (rule.cooldownHours && rule.cooldownHours > 0 && ruleTxs.length > 0) {
      const lastTxTime = new Date(ruleTxs[0].createdAt).getTime();
      const hoursSince = (now - lastTxTime) / (1000 * 60 * 60);
      if (hoursSince < rule.cooldownHours) {
        return false;
      }
    }

    // Check daily limit
    if (rule.dailyLimit && rule.dailyLimit > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = ruleTxs.filter(
        (t) => new Date(t.createdAt).getTime() >= startOfDay.getTime()
      ).length;
      if (todayCount >= rule.dailyLimit) {
        return false;
      }
    }

    // Check weekly limit
    if (rule.weeklyLimit && rule.weeklyLimit > 0) {
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const weeklyCount = ruleTxs.filter(
        (t) => new Date(t.createdAt).getTime() >= oneWeekAgo
      ).length;
      if (weeklyCount >= rule.weeklyLimit) {
        return false;
      }
    }

    // Check monthly limit
    if (rule.monthlyLimit && rule.monthlyLimit > 0) {
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
      const monthlyCount = ruleTxs.filter(
        (t) => new Date(t.createdAt).getTime() >= oneMonthAgo
      ).length;
      if (monthlyCount >= rule.monthlyLimit) {
        return false;
      }
    }

    return true;
  }

  /**
   * Processes a business event through the loyalty rule engine.
   */
  public static async processEvent(
    userId: string,
    eventCode: string,
    payload: Record<string, any> = {}
  ): Promise<{ pointsEarned: number; ruleApplied?: LoyaltyRule; streakResult?: any }> {
    const rules = db.get('loyaltyRules') || [];
    const rule = rules.find((r) => r.code === eventCode);

    let pointsEarned = 0;
    let ruleApplied: LoyaltyRule | undefined;

    if (rule && this.canTriggerRule(userId, rule)) {
      const result = await LoyaltyPointsService.modifyPoints({
        userId,
        points: rule.points,
        type: 'EARN',
        sourceType: 'RULE_EVENT',
        sourceId: rule.id,
        description: rule.name,
        metadata: { ...payload, ruleCode: rule.code },
      });

      pointsEarned = rule.points;
      ruleApplied = rule;

      // In-app notification for points earned
      LoyaltyNotificationService.notifyPointsEarned(userId, rule.points, rule.name);

      // In-app notification for level up
      if (result.levelUp && result.newLevelId) {
        const levels = db.get('loyaltyLevels') || [];
        const lvl = levels.find((l) => l.id === result.newLevelId);
        if (lvl) {
          LoyaltyNotificationService.notifyLevelUp(userId, lvl);
        }
      }
    }

    // Side effects on streaks & badges based on eventCode
    let streakResult: any;

    if (['FIRST_JOURNAL', 'DAILY_JOURNAL'].includes(eventCode)) {
      streakResult = StreakService.recordActivity(userId, 'JOURNAL');
      if (streakResult.milestoneReached) {
        LoyaltyNotificationService.notifyStreakMilestone(userId, 'JOURNAL', streakResult.milestoneReached);
      }
      // Check journal badges
      const consumptions = db.get('consumptionEntries') || [];
      const wellness = db.get('wellnessEntries') || [];
      const totalEntries =
        consumptions.filter((c) => c.userId === userId).length +
        wellness.filter((w) => w.userId === userId).length;

      await AchievementService.evaluateCriteria(userId, 'JOURNAL_COUNT', totalEntries);
      if (streakResult.streak) {
        await AchievementService.evaluateCriteria(
          userId,
          'JOURNAL_STREAK',
          streakResult.streak.currentCount
        );
      }

      // Referral qualification check
      await ReferralService.checkAndQualify(userId);
    } else if (eventCode === 'LESSON_COMPLETED') {
      streakResult = StreakService.recordActivity(userId, 'EDUCATION');
      const eduProgress = db.get('educationalProgress') || [];
      const completedLessons = eduProgress.filter(
        (ep) => ep.userId === userId && ep.status === 'completed'
      ).length;
      await AchievementService.evaluateCriteria(userId, 'LESSON_COUNT', completedLessons);
      await ReferralService.checkAndQualify(userId);
    } else if (eventCode === 'PATH_COMPLETED') {
      const eduProgress = db.get('educationalProgress') || [];
      const completedPaths = eduProgress.filter(
        (ep) => ep.userId === userId && ep.targetType === 'path' && ep.status === 'completed'
      ).length;
      await AchievementService.evaluateCriteria(userId, 'PATH_COMPLETED', Math.max(1, completedPaths));
    } else if (['WELLNESS_ACTIVITY', 'RELAXATION_ROUTINE'].includes(eventCode)) {
      streakResult = StreakService.recordActivity(userId, 'WELLNESS');
      const wellnessList = db.get('wellnessEntries') || [];
      const totalWellness = wellnessList.filter((w) => w.userId === userId).length;
      await AchievementService.evaluateCriteria(userId, 'WELLNESS_COUNT', totalWellness);
    } else if (eventCode === 'THC_ABSTINENCE_DAY') {
      streakResult = StreakService.recordActivity(userId, 'THC_ABSTINENCE');
      if (streakResult.streak) {
        await AchievementService.evaluateCriteria(
          userId,
          'THC_ABSTINENCE_STREAK',
          streakResult.streak.currentCount
        );
      }
    } else if (eventCode === 'FIRST_MARKETPLACE_ORDER') {
      const orders = db.get('globalOrders') || [];
      const orderCount = orders.filter((o) => o.userId === userId).length;
      await AchievementService.evaluateCriteria(userId, 'ORDER_COUNT', Math.max(1, orderCount));
    }

    return { pointsEarned, ruleApplied, streakResult };
  }
}
