import { db } from '../../db/database';
import {
  Achievement,
  UserAchievement,
  AchievementCategory,
} from '../../../src/types/entities';
import { LoyaltyPointsService } from './loyaltyPointsService';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

export interface EnrichedUserAchievement {
  achievement: Achievement;
  userAchievement: UserAchievement;
}

export class AchievementService {
  /**
   * Returns all active achievements.
   */
  public static getAllAchievements(): Achievement[] {
    const achievements = db.get('achievements') || [];
    return achievements.filter((a) => a.status === 'ACTIVE');
  }

  /**
   * Returns all achievements unlocked by a specific user.
   */
  public static getUserAchievements(userId: string): UserAchievement[] {
    const userAchievements = db.get('userAchievements') || [];
    return userAchievements.filter((ua) => ua.userId === userId);
  }

  /**
   * Returns unlocked achievements merged with catalog data.
   */
  public static getEnrichedUserAchievements(userId: string): {
    unlocked: EnrichedUserAchievement[];
    locked: Achievement[];
    totalPointsFromBadges: number;
  } {
    const all = this.getAllAchievements();
    const userAchList = this.getUserAchievements(userId);
    const unlockedMap = new Map<string, UserAchievement>(
      userAchList.map((ua) => [ua.achievementCode, ua])
    );

    const unlocked: EnrichedUserAchievement[] = [];
    const locked: Achievement[] = [];
    let totalPointsFromBadges = 0;

    for (const ach of all) {
      const userRecord = unlockedMap.get(ach.code);
      if (userRecord) {
        unlocked.push({ achievement: ach, userAchievement: userRecord });
        totalPointsFromBadges += ach.pointsReward;
      } else {
        locked.push(ach);
      }
    }

    return { unlocked, locked, totalPointsFromBadges };
  }

  /**
   * Checks if an achievement is already unlocked, and if not, unlocks it atomically and awards points.
   */
  public static async checkAndUnlock(
    userId: string,
    achievementCode: string,
    progress = 100,
    metadata: Record<string, any> = {}
  ): Promise<{
    unlocked: boolean;
    alreadyUnlocked?: boolean;
    achievement?: Achievement;
    pointsAwarded?: number;
  }> {
    const all = this.getAllAchievements();
    const achievement = all.find((a) => a.code === achievementCode);
    if (!achievement) {
      return { unlocked: false };
    }

    const userAchievements = db.get('userAchievements') || [];
    const existing = userAchievements.find(
      (ua) => ua.userId === userId && ua.achievementCode === achievementCode
    );

    if (existing) {
      return { unlocked: false, alreadyUnlocked: true, achievement };
    }

    // Unlock badge
    const newUserAchievement: UserAchievement = {
      id: `uach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      achievementId: achievement.id,
      achievementCode: achievement.code,
      unlockedAt: new Date().toISOString(),
      progress,
      metadata,
    };

    userAchievements.push(newUserAchievement);
    db.set('userAchievements', [...userAchievements]);

    // Award points
    let pointsAwarded = 0;
    if (achievement.pointsReward > 0) {
      await LoyaltyPointsService.modifyPoints({
        userId,
        points: achievement.pointsReward,
        type: 'BONUS',
        sourceType: 'ACHIEVEMENT',
        sourceId: achievement.id,
        description: `Badge débloqué : ${achievement.name}`,
        idempotencyKey: `badge_unlock_${userId}_${achievement.code}`,
      });
      pointsAwarded = achievement.pointsReward;
    }

    // Send in-app notification
    LoyaltyNotificationService.notifyBadgeUnlocked(userId, achievement);

    return {
      unlocked: true,
      achievement,
      pointsAwarded,
    };
  }

  /**
   * Evaluates criteria against all catalog achievements and unlocks any newly satisfied ones.
   */
  public static async evaluateCriteria(
    userId: string,
    criteriaType: string,
    currentValue: number
  ): Promise<Achievement[]> {
    const all = this.getAllAchievements();
    const relevant = all.filter((a) => a.criteria.type === criteriaType);
    const newlyUnlocked: Achievement[] = [];

    for (const ach of relevant) {
      if (currentValue >= ach.criteria.threshold) {
        const res = await this.checkAndUnlock(userId, ach.code, 100, {
          triggerValue: currentValue,
          threshold: ach.criteria.threshold,
        });
        if (res.unlocked && res.achievement) {
          newlyUnlocked.push(res.achievement);
        }
      }
    }

    return newlyUnlocked;
  }
}
