import { db } from '../../db/database';
import {
  Referral,
  ReferralRiskAssessment,
  ReferralRiskLevel,
  ReferralRiskStatus,
} from '../../../src/types/entities';

export class ReferralRiskService {
  /**
   * Assesses fraud/abuse risk for a referral.
   */
  public static assessRisk(
    referrerUserId: string,
    referredUserId: string,
    clientIp?: string
  ): ReferralRiskAssessment {
    const signals: string[] = [];
    let riskScore = 0;

    // 1. Self referral
    if (referrerUserId === referredUserId) {
      signals.push('Auto-parrainage détecté (même compte utilisateur)');
      riskScore += 100;
    }

    const users = db.get('users') || [];
    const referrer = users.find((u) => u.id === referrerUserId);
    const referred = users.find((u) => u.id === referredUserId);

    // 2. Email similarity or exact duplicate
    if (referrer?.email && referred?.email) {
      if (referrer.email.toLowerCase() === referred.email.toLowerCase()) {
        signals.push('Même adresse e-mail utilisée');
        riskScore += 100;
      } else {
        const referrerLocal = referrer.email.split('@')[0].toLowerCase().replace(/[\.\+\d]/g, '');
        const referredLocal = referred.email.split('@')[0].toLowerCase().replace(/[\.\+\d]/g, '');
        if (referrerLocal.length > 3 && referrerLocal === referredLocal) {
          signals.push('Structure d’e-mail fortement similaire (suspicion de compte jetable)');
          riskScore += 40;
        }
      }
    }

    // 3. Frequency burst check
    const referrals = db.get('referrals') || [];
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentReferrals = referrals.filter(
      (r) =>
        r.referrerUserId === referrerUserId &&
        new Date(r.createdAt).getTime() > tenMinutesAgo
    );

    if (recentReferrals.length >= 3) {
      signals.push(`Création rapide de multiples parrainages (${recentReferrals.length} en 10 min)`);
      riskScore += 35;
    }

    // Determine risk level & status
    let riskLevel: ReferralRiskLevel = 'LOW';
    let status: ReferralRiskStatus = 'AUTO_CLEARED';

    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
      status = 'REJECTED';
    } else if (riskScore >= 50) {
      riskLevel = 'HIGH';
      status = 'PENDING';
    } else if (riskScore >= 25) {
      riskLevel = 'MEDIUM';
      status = 'PENDING';
    }

    const assessment: ReferralRiskAssessment = {
      id: `rsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      referralId: '',
      riskScore: Math.min(100, riskScore),
      riskLevel,
      signals,
      status,
      reviewedAt: new Date().toISOString(),
    };

    return assessment;
  }
}
