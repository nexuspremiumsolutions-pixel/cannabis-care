import { db } from '../../db/database';
import {
  Challenge,
  UserChallenge,
  UserChallengeStatus,
} from '../../../src/types/entities';
import { LoyaltyPointsService } from './loyaltyPointsService';
import { AchievementService } from './achievementService';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

export interface EnrichedUserChallenge {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  isJoined: boolean;
  isCompleted: boolean;
  progressPercent: number;
}

export class ChallengeService {
  /**
   * Retrieves all active challenges.
   */
  public static getAllChallenges(): Challenge[] {
    const challenges = db.get('challenges') || [];
    return challenges.filter((c) => c.status === 'ACTIVE');
  }

  /**
   * Retrieves user challenge participations.
   */
  public static getUserChallenges(userId: string): UserChallenge[] {
    const userChallenges = db.get('userChallenges') || [];
    return userChallenges.filter((uc) => uc.userId === userId);
  }

  /**
   * Returns list of challenges with user status enriched.
   */
  public static getEnrichedChallenges(userId: string): EnrichedUserChallenge[] {
    const all = this.getAllChallenges();
    const userChallenges = this.getUserChallenges(userId);
    const userMap = new Map<string, UserChallenge>(
      userChallenges.map((uc) => [uc.challengeId, uc])
    );

    return all.map((ch) => {
      const uc = userMap.get(ch.id);
      const isJoined = !!uc && (uc.status === 'JOINED' || uc.status === 'IN_PROGRESS');
      const isCompleted = !!uc && uc.status === 'COMPLETED';
      const currentVal = uc ? uc.progress : 0;
      const targetVal = ch.targetValue || ch.durationDays || 1;
      const progressPercent = Math.min(100, Math.round((currentVal / targetVal) * 100));

      return {
        challenge: ch,
        userChallenge: uc,
        isJoined,
        isCompleted,
        progressPercent,
      };
    });
  }

  /**
   * Enrolls user in a challenge.
   */
  public static joinChallenge(userId: string, challengeId: string): UserChallenge {
    const challenges = this.getAllChallenges();
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      throw new Error('Défi introuvable.');
    }

    const userChallenges = db.get('userChallenges') || [];
    let uc = userChallenges.find(
      (u) => u.userId === userId && u.challengeId === challengeId
    );

    if (uc && (uc.status === 'JOINED' || uc.status === 'IN_PROGRESS')) {
      return uc;
    }

    if (uc && uc.status === 'COMPLETED') {
      throw new Error('Vous avez déjà complété ce défi avec succès !');
    }

    if (uc) {
      // Re-joining after abandonment
      uc.status = 'IN_PROGRESS';
      uc.progress = 0;
      uc.currentDay = 1;
      uc.startedAt = new Date().toISOString();
      uc.rewardGranted = false;
      uc.completedAt = undefined;
    } else {
      uc = {
        id: `uch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        challengeId,
        status: 'IN_PROGRESS',
        progress: 0,
        startedAt: new Date().toISOString(),
        currentDay: 1,
        rewardGranted: false,
      };
      userChallenges.push(uc);
    }

    db.set('userChallenges', [...userChallenges]);
    return uc;
  }

  /**
   * Records progress on a challenge and automatically triggers completion if target reached.
   */
  public static async recordProgress(
    userId: string,
    challengeId: string,
    increment = 1
  ): Promise<{
    userChallenge: UserChallenge;
    completed: boolean;
    pointsAwarded?: number;
  }> {
    const userChallenges = db.get('userChallenges') || [];
    const uc = userChallenges.find(
      (u) => u.userId === userId && u.challengeId === challengeId
    );

    if (!uc || uc.status !== 'IN_PROGRESS') {
      return { userChallenge: uc!, completed: false };
    }

    const challenge = this.getAllChallenges().find((c) => c.id === challengeId);
    if (!challenge) {
      return { userChallenge: uc, completed: false };
    }

    uc.progress += increment;
    uc.lastProgressAt = new Date().toISOString();

    const target = challenge.targetValue || challenge.durationDays;
    let completed = false;
    let pointsAwarded = 0;

    if (uc.progress >= target && !uc.rewardGranted) {
      uc.status = 'COMPLETED';
      uc.completedAt = new Date().toISOString();
      uc.rewardGranted = true;
      completed = true;

      // Award points
      if (challenge.pointsReward > 0) {
        await LoyaltyPointsService.modifyPoints({
          userId,
          points: challenge.pointsReward,
          type: 'BONUS',
          sourceType: 'CHALLENGE',
          sourceId: challenge.id,
          description: `Défi accompli : ${challenge.title}`,
          idempotencyKey: `chal_reward_${userId}_${challenge.id}`,
        });
        pointsAwarded = challenge.pointsReward;
      }

      // Check badge unlock if linked
      if (challenge.badgeCode) {
        await AchievementService.checkAndUnlock(userId, challenge.badgeCode, 100);
      }

      // Evaluate challenge count achievements
      const allCompleted = userChallenges.filter(
        (u) => u.userId === userId && u.status === 'COMPLETED'
      ).length;
      await AchievementService.evaluateCriteria(
        userId,
        'CHALLENGE_COMPLETED',
        allCompleted
      );

      // Notification
      LoyaltyNotificationService.notifyChallengeCompleted(userId, challenge);
    }

    db.set('userChallenges', [...userChallenges]);

    return {
      userChallenge: { ...uc },
      completed,
      pointsAwarded,
    };
  }

  /**
   * Abandons a challenge without penalty (as required by section 10).
   */
  public static abandonChallenge(userId: string, challengeId: string): UserChallenge {
    const userChallenges = db.get('userChallenges') || [];
    const uc = userChallenges.find(
      (u) => u.userId === userId && u.challengeId === challengeId
    );

    if (!uc) {
      throw new Error('Défi non trouvé.');
    }

    uc.status = 'ABANDONED';
    db.set('userChallenges', [...userChallenges]);
    return uc;
  }
}
