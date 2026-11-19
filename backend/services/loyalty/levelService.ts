import { db } from '../../db/database';
import { LoyaltyLevel } from '../../../src/types/entities';

export interface LevelProgressInfo {
  currentLevel: LoyaltyLevel;
  nextLevel: LoyaltyLevel | null;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
}

export class LevelService {
  /**
   * Retrieves all active levels ordered by ascending requirement.
   */
  public static getAllLevels(): LoyaltyLevel[] {
    const levels = db.get('loyaltyLevels') || [];
    return levels
      .filter((l) => l.status === 'ACTIVE')
      .sort((a, b) => a.order - b.order);
  }

  public static getLevelById(id: string): LoyaltyLevel | undefined {
    const levels = this.getAllLevels();
    return levels.find((l) => l.id === id);
  }

  /**
   * Calculates which level an account belongs to based on lifetimePoints and computes percentage progress.
   */
  public static calculateLevelProgress(lifetimePoints: number): LevelProgressInfo {
    const levels = this.getAllLevels();
    if (levels.length === 0) {
      const fallback: LoyaltyLevel = {
        id: 'lvl_1',
        name: 'Découverte',
        description: 'Niveau initial',
        minimumPoints: 0,
        maximumPoints: 99,
        icon: 'Sparkles',
        order: 1,
        benefits: [],
        status: 'ACTIVE',
      };
      return {
        currentLevel: fallback,
        nextLevel: null,
        pointsInCurrentLevel: lifetimePoints,
        pointsNeededForNextLevel: 0,
        progressPercentage: 100,
      };
    }

    // Find the highest level where lifetimePoints >= minimumPoints
    let currentLevel = levels[0];
    let nextLevel: LoyaltyLevel | null = null;

    for (let i = 0; i < levels.length; i++) {
      if (lifetimePoints >= levels[i].minimumPoints) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1] || null;
      } else {
        break;
      }
    }

    if (!nextLevel) {
      // Reached maximum tier
      return {
        currentLevel,
        nextLevel: null,
        pointsInCurrentLevel: lifetimePoints - currentLevel.minimumPoints,
        pointsNeededForNextLevel: 0,
        progressPercentage: 100,
      };
    }

    const currentSpan = nextLevel.minimumPoints - currentLevel.minimumPoints;
    const progressInSpan = Math.max(0, lifetimePoints - currentLevel.minimumPoints);
    const progressPercentage = Math.min(
      100,
      Math.max(0, Math.round((progressInSpan / currentSpan) * 100))
    );
    const pointsNeededForNextLevel = Math.max(0, nextLevel.minimumPoints - lifetimePoints);

    return {
      currentLevel,
      nextLevel,
      pointsInCurrentLevel: progressInSpan,
      pointsNeededForNextLevel,
      progressPercentage,
    };
  }
}
