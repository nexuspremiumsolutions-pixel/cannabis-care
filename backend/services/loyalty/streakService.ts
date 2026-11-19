import { db } from '../../db/database';
import { UserStreak, StreakType } from '../../../src/types/entities';

export interface StreakUpdateResult {
  streak: UserStreak;
  isNewDay: boolean;
  milestoneReached?: number; // e.g. 7, 14, 30
  previousCount: number;
}

export class StreakService {
  /**
   * Helper to format date as YYYY-MM-DD
   */
  public static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Helper to calculate difference in full calendar days between two YYYY-MM-DD strings.
   */
  public static getDayDifference(dateA: string, dateB: string): number {
    const da = new Date(`${dateA}T00:00:00.000Z`);
    const dbDate = new Date(`${dateB}T00:00:00.000Z`);
    const diffMs = Math.abs(dbDate.getTime() - da.getTime());
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Retrieves all streaks for a user.
   */
  public static getUserStreaks(userId: string): UserStreak[] {
    const streaks = db.get('userStreaks') || [];
    return streaks.filter((s) => s.userId === userId);
  }

  /**
   * Retrieves a specific streak type for a user.
   */
  public static getStreak(userId: string, type: StreakType): UserStreak | undefined {
    const streaks = this.getUserStreaks(userId);
    return streaks.find((s) => s.type === type);
  }

  /**
   * Records a daily activity for a streak, enforcing single validation per day and computing consecutive days.
   */
  public static recordActivity(
    userId: string,
    type: StreakType,
    dateString?: string
  ): StreakUpdateResult {
    const today = dateString || this.getTodayString();
    const streaks = db.get('userStreaks') || [];
    let streak = streaks.find((s) => s.userId === userId && s.type === type);

    if (!streak) {
      streak = {
        id: `strk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        type,
        currentCount: 1,
        longestCount: 1,
        lastActivityDate: today,
        startedAt: today,
        status: 'ACTIVE',
      };
      streaks.push(streak);
      db.set('userStreaks', [...streaks]);

      return {
        streak: { ...streak },
        isNewDay: true,
        previousCount: 0,
      };
    }

    const previousCount = streak.currentCount;

    // Same day: already validated today, idempotent return
    if (streak.lastActivityDate === today) {
      return {
        streak: { ...streak },
        isNewDay: false,
        previousCount,
      };
    }

    const dayDiff = this.getDayDifference(streak.lastActivityDate, today);

    if (dayDiff === 1) {
      // Consecutive day: increment streak
      streak.currentCount += 1;
      streak.longestCount = Math.max(streak.longestCount, streak.currentCount);
      streak.lastActivityDate = today;
      streak.status = 'ACTIVE';
    } else {
      // Gap > 1 day: gentle restart without punishment
      streak.currentCount = 1;
      streak.startedAt = today;
      streak.lastActivityDate = today;
      streak.status = 'ACTIVE';
    }

    db.set('userStreaks', [...streaks]);

    // Check key milestones
    let milestoneReached: number | undefined;
    if ([3, 7, 14, 21, 30, 60, 90, 100].includes(streak.currentCount) && dayDiff === 1) {
      milestoneReached = streak.currentCount;
    }

    return {
      streak: { ...streak },
      isNewDay: true,
      milestoneReached,
      previousCount,
    };
  }
}
