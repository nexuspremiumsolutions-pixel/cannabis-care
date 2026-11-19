import { db } from '../backend/db/database';
import { LoyaltyPointsService } from '../backend/services/loyalty/loyaltyPointsService';
import { LevelService } from '../backend/services/loyalty/levelService';
import { StreakService } from '../backend/services/loyalty/streakService';
import { AchievementService } from '../backend/services/loyalty/achievementService';
import { ChallengeService } from '../backend/services/loyalty/challengeService';
import { RewardService } from '../backend/services/loyalty/rewardService';
import { RewardRedemptionService } from '../backend/services/loyalty/rewardRedemptionService';
import { ReferralService } from '../backend/services/loyalty/referralService';
import { ReferralRiskService } from '../backend/services/loyalty/referralRiskService';
import { LoyaltyRuleEngine } from '../backend/services/loyalty/loyaltyRuleEngine';
import { LoyaltyAnalyticsService } from '../backend/services/loyalty/loyaltyAnalyticsService';
import { LoyaltyService } from '../backend/services/loyalty/loyaltyService';

async function runModule12Tests() {
  console.log('🧪 [MODULE 12 TESTS] Starting Comprehensive Loyalty & Rewards Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  const testUserId = `test_user_m12_${Date.now()}`;
  const testReferrerId = `test_referrer_${Date.now()}`;

  // 1. DATA SEEDS & LEVELS
  console.log('▶ Test Suite 1: Loyalty Seeds, Levels & Rules');
  const levels = LevelService.getAllLevels();
  assert(levels.length === 5, 'All 5 loyalty tiers loaded', `Count: ${levels.length}`);
  assert(levels[0].name === 'Découverte', 'Level 1 is Découverte');
  assert(levels[4].name === 'Ambassadeur', 'Level 5 is Ambassadeur');

  const rules = db.get('loyaltyRules');
  assert(rules.length >= 10, 'Rich loyalty rules catalog present', `Count: ${rules.length}`);

  const achievements = AchievementService.getAllAchievements();
  assert(achievements.length >= 10, 'Achievements catalog populated', `Count: ${achievements.length}`);

  const challenges = ChallengeService.getAllChallenges();
  assert(challenges.length >= 6, 'Challenges catalog populated', `Count: ${challenges.length}`);

  const rewards = RewardService.getAllRewards();
  assert(rewards.length >= 5, 'Rewards catalog populated', `Count: ${rewards.length}`);

  // 2. POINTS & IDEMPOTENCY
  console.log('\n▶ Test Suite 2: Atomic Points, Balance & Idempotency');
  const initAccount = LoyaltyPointsService.getOrCreateAccount(testUserId);
  assert(initAccount.pointsBalance === 0, 'New account initializes with 0 points');
  assert(initAccount.currentLevelId === 'lvl_1', 'New account starts at level 1');

  // Earn points
  const earnRes = await LoyaltyPointsService.modifyPoints({
    userId: testUserId,
    points: 150,
    type: 'EARN',
    sourceType: 'TEST_SEED',
    description: 'Crédit initial de test',
    idempotencyKey: `idem_test_${testUserId}_1`,
  });
  assert(earnRes.account.pointsBalance === 150, 'Points balance credited to 150');
  assert(earnRes.account.lifetimePoints === 150, 'Lifetime points set to 150');
  assert(earnRes.levelUp === true, 'Level up detected (150 pts unlocks Niveau 2 Engagement)');
  assert(earnRes.newLevelId === 'lvl_2', 'Promoted to lvl_2');

  // Idempotency verification: replay same key
  const replayRes = await LoyaltyPointsService.modifyPoints({
    userId: testUserId,
    points: 150,
    type: 'EARN',
    sourceType: 'TEST_SEED',
    description: 'Crédit initial replay',
    idempotencyKey: `idem_test_${testUserId}_1`,
  });
  assert(replayRes.account.pointsBalance === 150, 'Idempotency key prevents double credit');

  // Insufficient balance check
  let spendErrorThrown = false;
  try {
    await LoyaltyPointsService.modifyPoints({
      userId: testUserId,
      points: -500,
      type: 'SPEND',
      sourceType: 'TEST_SPEND',
      description: 'Tentative de dépense excessive',
    });
  } catch (err: any) {
    spendErrorThrown = true;
    assert(err.message.includes('insuffisant'), 'Threw proper insufficient points error');
  }
  assert(spendErrorThrown, 'Spending more points than balance was rejected');

  // 3. STREAKS
  console.log('\n▶ Test Suite 3: Streak Engine & Single Daily Validation');
  const streak1 = StreakService.recordActivity(testUserId, 'JOURNAL', '2026-03-01');
  assert(streak1.isNewDay === true, 'Day 1 streak recorded');
  assert(streak1.streak.currentCount === 1, 'Current streak is 1');

  // Re-validating on same day: should NOT increment
  const streakSameDay = StreakService.recordActivity(testUserId, 'JOURNAL', '2026-03-01');
  assert(streakSameDay.isNewDay === false, 'Same day activity flagged as already counted');
  assert(streakSameDay.streak.currentCount === 1, 'Streak remains 1 on same day');

  // Day 2 (consecutive)
  const streak2 = StreakService.recordActivity(testUserId, 'JOURNAL', '2026-03-02');
  assert(streak2.streak.currentCount === 2, 'Consecutive day increments streak to 2');

  // Day 4 (gap of 2 days -> gentle restart to 1 without punishment)
  const streakGap = StreakService.recordActivity(testUserId, 'JOURNAL', '2026-03-04');
  assert(streakGap.streak.currentCount === 1, 'Streak gently restarts to 1 after gap');
  assert(streakGap.streak.longestCount === 2, 'Longest streak remains preserved at 2');

  // 4. ACHIEVEMENTS & CRITERIA EVALUATION
  console.log('\n▶ Test Suite 4: Achievements & Duplicate Prevention');
  const unlockRes1 = await AchievementService.checkAndUnlock(testUserId, 'FIRST_STEP');
  assert(unlockRes1.unlocked === true, 'First Step badge unlocked');
  assert(unlockRes1.pointsAwarded === 30, 'Points awarded for badge (30 pts)');

  // Attempt duplicate unlock
  const unlockRes2 = await AchievementService.checkAndUnlock(testUserId, 'FIRST_STEP');
  assert(unlockRes2.unlocked === false && unlockRes2.alreadyUnlocked === true, 'Badge not unlocked twice');

  // Criteria evaluator
  const autoUnlocked = await AchievementService.evaluateCriteria(testUserId, 'PATH_COMPLETED', 1);
  assert(autoUnlocked.length > 0, 'Achievement unlocked automatically via criteria evaluation');

  // 5. CHALLENGES
  console.log('\n▶ Test Suite 5: Challenges (Join, Progress, Complete, Abandon)');
  const challenge = challenges[0];
  const joinRes = ChallengeService.joinChallenge(testUserId, challenge.id);
  assert(joinRes.status === 'IN_PROGRESS', 'User successfully joined challenge');

  // Progress to completion
  const targetVal = challenge.targetValue || 7;
  const progressRes = await ChallengeService.recordProgress(testUserId, challenge.id, targetVal);
  assert(progressRes.completed === true, 'Challenge completed when target reached');
  assert(progressRes.userChallenge.status === 'COMPLETED', 'Status transitioned to COMPLETED');
  assert((progressRes.pointsAwarded || 0) > 0, 'Points awarded upon challenge completion');

  // Abandon another challenge without penalty
  const challenge2 = challenges[1];
  ChallengeService.joinChallenge(testUserId, challenge2.id);
  const abandonRes = ChallengeService.abandonChallenge(testUserId, challenge2.id);
  assert(abandonRes.status === 'ABANDONED', 'Challenge abandoned smoothly without penalty');

  // 6. REWARDS & REDEMPTIONS
  console.log('\n▶ Test Suite 6: Rewards Redemption, Stock & Partner Verification');
  // Credit extra points for reward testing
  await LoyaltyPointsService.modifyPoints({
    userId: testUserId,
    points: 500,
    type: 'BONUS',
    sourceType: 'TEST',
    description: 'Points bonus test',
  });

  const couponReward = rewards.find((r) => r.type === 'COUPON') || rewards[0];
  const initialStock = couponReward.stock;

  const redeemRes = await RewardRedemptionService.redeemReward(testUserId, couponReward.id);
  assert(!!redeemRes.redemption.redemptionCode, 'Unique redemption code generated');
  assert(redeemRes.redemption.redemptionCode.startsWith('NEXUS-'), 'Code format is NEXUS-XXXX-XXXX');
  assert(redeemRes.redemption.status === 'ISSUED', 'Voucher status is ISSUED');

  if (initialStock > 0) {
    const updatedReward = RewardService.getRewardById(couponReward.id);
    assert(updatedReward?.stock === initialStock - 1, 'Stock properly decremented');
  }

  // Cashier / partner validation
  const useRes = RewardRedemptionService.markAsUsed(
    redeemRes.redemption.redemptionCode,
    redeemRes.redemption.partnerShopId
  );
  assert(useRes.success === true && useRes.redemption.status === 'USED', 'Voucher marked as USED by partner');

  // Double use attempt rejected
  let doubleUseThrown = false;
  try {
    RewardRedemptionService.markAsUsed(redeemRes.redemption.redemptionCode);
  } catch (err: any) {
    doubleUseThrown = true;
  }
  assert(doubleUseThrown, 'Double voucher usage blocked');

  // 7. REFERRAL & RISK ASSESSMENT
  console.log('\n▶ Test Suite 7: Referral Codes, Qualification & Anti-Fraud');
  LoyaltyPointsService.getOrCreateAccount(testReferrerId);
  const code = ReferralService.getUserReferralCode(testReferrerId);
  assert(code.startsWith('REF-'), 'User referral code generated properly');

  // Self referral blocked
  const selfRisk = ReferralRiskService.assessRisk(testReferrerId, testReferrerId);
  assert(selfRisk.riskLevel === 'CRITICAL' && selfRisk.status === 'REJECTED', 'Self-referral flagged as CRITICAL and REJECTED');

  // Valid referral registration
  const refereeUserId = `referee_${Date.now()}`;
  const applyRes = ReferralService.applyReferralCode(refereeUserId, code);
  assert(applyRes.success === true, 'Referral relationship registered');

  // 8. RULE ENGINE & AUTOMATION
  console.log('\n▶ Test Suite 8: Loyalty Rule Engine');
  const ruleRes = await LoyaltyRuleEngine.processEvent(testUserId, 'DAILY_JOURNAL');
  assert(ruleRes.pointsEarned === 10, 'DAILY_JOURNAL event awarded 10 points');
  assert(!!ruleRes.ruleApplied, 'Rule DAILY_JOURNAL applied');

  // 9. FULL SUMMARY & ANALYTICS
  console.log('\n▶ Test Suite 9: Summary & Analytics Service');
  const summary = LoyaltyService.getUserLoyaltySummary(testUserId);
  assert(summary.account.pointsBalance > 0, 'Summary returns active balance');
  assert(summary.badges.totalUnlocked > 0, 'Summary returns unlocked badges');
  assert(summary.levelInfo.currentLevel.order >= 2, 'Summary reflects calculated level');

  const metrics = LoyaltyAnalyticsService.getOverviewMetrics();
  assert(metrics.totalPointsIssued > 0, 'Metrics track total points issued');
  assert(metrics.levelDistribution.length === 5, 'Metrics track 5 level distribution');

  console.log('\n=============================================');
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runModule12Tests().catch((err) => {
  console.error('Module 12 Tests Failed:', err);
  process.exit(1);
});
