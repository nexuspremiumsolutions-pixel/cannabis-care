import { db } from '../../db/database';
import {
  Notification,
  Achievement,
  Challenge,
  LoyaltyLevel,
  Reward,
} from '../../../src/types/entities';

export class LoyaltyNotificationService {
  private static createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'milestone' | 'info' | 'reminder' | 'system' = 'milestone'
  ): Notification {
    const notifications = db.get('notifications') || [];
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title,
      body: message,
      message,
      type,
      category: 'LOYALTY',
      priority: 'MEDIUM',
      status: 'UNREAD',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(notif);
    db.set('notifications', [...notifications]);
    return notif;
  }

  public static notifyPointsEarned(userId: string, points: number, reason: string): void {
    this.createNotification(
      userId,
      `+${points} points d’engagement`,
      `Bravo ! Vous venez d’obtenir ${points} points : ${reason}.`,
      'info'
    );
  }

  public static notifyLevelUp(userId: string, newLevel: LoyaltyLevel): void {
    this.createNotification(
      userId,
      `Nouveau palier atteint : ${newLevel.name} !`,
      `Félicitations pour votre régularité. Vous accédez aux privilèges du niveau ${newLevel.name}.`,
      'milestone'
    );
  }

  public static notifyBadgeUnlocked(userId: string, achievement: Achievement): void {
    this.createNotification(
      userId,
      `Insigne débloqué : ${achievement.name} !`,
      `${achievement.description} (+${achievement.pointsReward} points)`,
      'milestone'
    );
  }

  public static notifyStreakMilestone(userId: string, streakType: string, count: number): void {
    this.createNotification(
      userId,
      `Cap des ${count} jours franchi !`,
      `Votre engagement quotidien porte ses fruits. Continuez à votre propre rythme.`,
      'milestone'
    );
  }

  public static notifyChallengeCompleted(userId: string, challenge: Challenge): void {
    this.createNotification(
      userId,
      `Défi réussi : ${challenge.title} !`,
      `Vous avez complété ce challenge bien-être avec succès (+${challenge.pointsReward} points).`,
      'milestone'
    );
  }

  public static notifyRewardRedeemed(userId: string, reward: Reward, code: string): void {
    this.createNotification(
      userId,
      `Récompense débloquée : ${reward.title}`,
      `Votre bon est disponible dans votre espace avec le code unique ${code}.`,
      'info'
    );
  }

  public static notifyReferralQualified(userId: string, rewardPoints: number): void {
    this.createNotification(
      userId,
      `Parrainage bienveillant récompensé !`,
      `L'un de vos proches a validé ses premières étapes d’observation. Vous recevez ${rewardPoints} points.`,
      'milestone'
    );
  }
}
