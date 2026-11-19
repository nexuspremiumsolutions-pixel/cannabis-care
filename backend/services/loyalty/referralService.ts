import { db } from '../../db/database';
import {
  Referral,
  ReferralProgram,
  ReferralStatus,
} from '../../../src/types/entities';
import { LoyaltyPointsService } from './loyaltyPointsService';
import { AchievementService } from './achievementService';
import { ReferralRiskService } from './referralRiskService';
import { LoyaltyNotificationService } from './loyaltyNotificationService';

export class ReferralService {
  /**
   * Generates or retrieves the unique referral code for a user.
   */
  public static getUserReferralCode(userId: string): string {
    const users = db.get('users') || [];
    const profiles = db.get('userProfiles') || [];
    const user = users.find((u) => u.id === userId);
    const profile = profiles.find((p) => p.userId === userId);
    const rawName = profile?.nickname || user?.email?.split('@')[0] || 'CARE';
    const prefix = rawName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    return `REF-${prefix || 'USER'}-${cleanId}`;
  }

  /**
   * Returns referral program configuration.
   */
  public static getActiveProgram(): ReferralProgram {
    const programs = db.get('referralPrograms') || [];
    const active = programs.find((p) => p.status === 'ACTIVE');
    return (
      active || {
        id: 'ref_prog_main',
        name: 'Programme Parrainage Responsable',
        description: 'Partagez une démarche saine avec vos proches.',
        referrerReward: 100,
        referredUserReward: 50,
        conditions: { minJournalEntries: 3, minEducationLessons: 1 },
        status: 'ACTIVE',
      }
    );
  }

  /**
   * Gets all referrals where user is the referrer.
   */
  public static getUserReferrals(referrerUserId: string): Referral[] {
    const referrals = db.get('referrals') || [];
    return referrals
      .filter((r) => r.referrerUserId === referrerUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Finds the referrer by their unique code.
   */
  public static findUserByReferralCode(referralCode: string): string | null {
    const normalized = referralCode.trim().toUpperCase();
    const users = db.get('users') || [];
    for (const u of users) {
      if (this.getUserReferralCode(u.id) === normalized) {
        return u.id;
      }
    }
    const profiles = db.get('userProfiles') || [];
    for (const p of profiles) {
      if (this.getUserReferralCode(p.userId) === normalized) {
        return p.userId;
      }
    }
    const accounts = db.get('loyaltyAccounts') || [];
    for (const acc of accounts) {
      if (this.getUserReferralCode(acc.userId) === normalized) {
        return acc.userId;
      }
    }
    return null;
  }

  /**
   * Registers a new referral relationship when a new user enters a referral code.
   */
  public static applyReferralCode(
    newUserId: string,
    referralCode: string,
    clientIp?: string
  ): { success: boolean; referral: Referral; message: string } {
    const referrerId = this.findUserByReferralCode(referralCode);
    if (!referrerId) {
      throw new Error('Code de parrainage introuvable ou invalide.');
    }

    if (referrerId === newUserId) {
      throw new Error('Vous ne pouvez pas utiliser votre propre code de parrainage.');
    }

    const referrals = db.get('referrals') || [];
    const alreadyReferred = referrals.find((r) => r.referredUserId === newUserId);
    if (alreadyReferred) {
      throw new Error('Vous êtes déjà inscrit via un lien de parrainage.');
    }

    // Run risk assessment
    const assessment = ReferralRiskService.assessRisk(referrerId, newUserId, clientIp);
    const assessments = db.get('referralRiskAssessments') || [];

    const initialStatus: ReferralStatus =
      assessment.riskLevel === 'CRITICAL' ? 'FRAUD_REVIEW' : 'REGISTERED';

    const referral: Referral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      referrerUserId: referrerId,
      referredUserId: newUserId,
      referralCode: referralCode.trim().toUpperCase(),
      status: initialStatus,
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
    };

    assessment.referralId = referral.id;
    assessments.push(assessment);
    db.set('referralRiskAssessments', [...assessments]);

    referrals.push(referral);
    db.set('referrals', [...referrals]);

    return {
      success: true,
      referral,
      message: 'Code de parrainage validé avec succès ! Vos avantages seront activés après vos premiers pas de suivi.',
    };
  }

  /**
   * Checks if a referred user has met qualification conditions, and awards points to both parties.
   */
  public static async checkAndQualify(userId: string): Promise<boolean> {
    const referrals = db.get('referrals') || [];
    const referral = referrals.find(
      (r) => r.referredUserId === userId && r.status === 'REGISTERED'
    );

    if (!referral) {
      return false;
    }

    const program = this.getActiveProgram();
    const minEntries = program.conditions.minJournalEntries || 1;
    const minLessons = program.conditions.minEducationLessons || 0;

    // Check journal entries count
    const consumptions = db.get('consumptionEntries') || [];
    const wellness = db.get('wellnessEntries') || [];
    const totalEntries =
      consumptions.filter((c) => c.userId === userId).length +
      wellness.filter((w) => w.userId === userId).length;

    // Check completed lessons count
    const eduProgress = db.get('educationalProgress') || [];
    const completedLessons = eduProgress.filter(
      (ep) => ep.userId === userId && ep.status === 'completed'
    ).length;

    if (totalEntries >= minEntries && completedLessons >= minLessons) {
      referral.status = 'QUALIFIED';
      referral.qualifiedAt = new Date().toISOString();

      // Award points to referrer
      if (program.referrerReward > 0) {
        await LoyaltyPointsService.modifyPoints({
          userId: referral.referrerUserId,
          points: program.referrerReward,
          type: 'REFERRAL',
          sourceType: 'REFERRAL_QUALIFIED',
          sourceId: referral.id,
          description: 'Bonus de parrainage bienveillant (nouveau membre actif)',
          idempotencyKey: `ref_qual_referrer_${referral.id}`,
        });
      }

      // Award points to new user (referred)
      if (program.referredUserReward > 0) {
        await LoyaltyPointsService.modifyPoints({
          userId: referral.referredUserId,
          points: program.referredUserReward,
          type: 'BONUS',
          sourceType: 'WELCOME_REFERRAL',
          sourceId: referral.id,
          description: 'Cadeau de bienvenue via le parrainage',
          idempotencyKey: `ref_qual_referred_${referral.id}`,
        });
      }

      referral.status = 'REWARDED';
      referral.rewardGrantedAt = new Date().toISOString();
      db.set('referrals', [...referrals]);

      // Unlock Ambassador badge for referrer if applicable
      const qualifiedCount = referrals.filter(
        (r) => r.referrerUserId === referral.referrerUserId && ['QUALIFIED', 'REWARDED'].includes(r.status)
      ).length;
      await AchievementService.evaluateCriteria(
        referral.referrerUserId,
        'REFERRAL_QUALIFIED',
        qualifiedCount
      );

      // Notifications
      LoyaltyNotificationService.notifyReferralQualified(
        referral.referrerUserId,
        program.referrerReward
      );

      return true;
    }

    return false;
  }
}
