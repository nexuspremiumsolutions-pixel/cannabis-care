import { db } from '../../db/database';
import {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyTransactionType,
  LoyaltyTransactionStatus,
} from '../../../src/types/entities';
import { LevelService } from './levelService';

// In-memory mutex map to guarantee strict serial execution per user/account
const userLocks = new Map<string, Promise<any>>();

function withUserLock<T>(userId: string, fn: () => Promise<T> | T): Promise<T> {
  const prev = userLocks.get(userId) || Promise.resolve();
  let resolveCurrent!: (val: T) => void;
  let rejectCurrent!: (err: any) => void;
  const current = new Promise<T>((res, rej) => {
    resolveCurrent = res;
    rejectCurrent = rej;
  });

  const nextInChain = current.catch(() => {});
  userLocks.set(userId, nextInChain);

  (async () => {
    try {
      await prev;
    } catch {
      // ignore previous errors
    }
    try {
      const res = await fn();
      resolveCurrent(res);
    } catch (err) {
      rejectCurrent(err);
    } finally {
      if (userLocks.get(userId) === nextInChain) {
        userLocks.delete(userId);
      }
    }
  })();

  return current;
}

export interface ModifyPointsParams {
  userId: string;
  points: number; // positive for gain, negative for spend
  type: LoyaltyTransactionType;
  sourceType: string;
  sourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export class LoyaltyPointsService {
  /**
   * Retrieves or creates a LoyaltyAccount for a given userId.
   */
  public static getOrCreateAccount(userId: string): LoyaltyAccount {
    const accounts = db.get('loyaltyAccounts');
    let account = accounts.find((a) => a.userId === userId);

    if (!account) {
      const levels = db.get('loyaltyLevels').sort((a, b) => a.order - b.order);
      const initialLevel = levels[0] || { id: 'lvl_1', minimumPoints: 0 };

      account = {
        id: `lac_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        pointsBalance: 0,
        lifetimePoints: 0,
        currentLevelId: initialLevel.id,
        currentLevelProgress: 0,
        totalEarned: 0,
        totalSpent: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      accounts.push(account);
      db.set('loyaltyAccounts', [...accounts]);
    }

    return account;
  }

  /**
   * Modifies user points with atomic guarantee, idempotency check, and Level recalculation.
   */
  public static async modifyPoints(params: ModifyPointsParams): Promise<{
    account: LoyaltyAccount;
    transaction: LoyaltyTransaction;
    levelUp?: boolean;
    previousLevelId?: string;
    newLevelId?: string;
  }> {
    return withUserLock(params.userId, async () => {
      const {
        userId,
        points,
        type,
        sourceType,
        sourceId,
        description,
        metadata = {},
        idempotencyKey,
      } = params;

      // 1. Check idempotency if key provided
      const transactions = db.get('loyaltyTransactions');
      if (idempotencyKey) {
        const existingTx = transactions.find(
          (tx) => tx.idempotencyKey === idempotencyKey && tx.userId === userId
        );
        if (existingTx) {
          const acc = this.getOrCreateAccount(userId);
          return { account: acc, transaction: existingTx };
        }
      }

      // 2. Fetch or initialize account
      const account = this.getOrCreateAccount(userId);

      if (account.status !== 'ACTIVE') {
        throw new Error(`Le compte de fidélité est actuellement ${account.status.toLowerCase()}.`);
      }

      // 3. Balance verification for point spending
      if (points < 0 && account.pointsBalance + points < 0) {
        throw new Error(
          `Solde de points insuffisant (${account.pointsBalance} disponible, ${Math.abs(points)} requis).`
        );
      }

      // 4. Calculate new balances
      const previousBalance = account.pointsBalance;
      const previousLifetime = account.lifetimePoints;
      const previousLevelId = account.currentLevelId;

      const newBalance = previousBalance + points;
      const newLifetime = points > 0 ? previousLifetime + points : previousLifetime;
      const totalEarned = points > 0 ? account.totalEarned + points : account.totalEarned;
      const totalSpent = points < 0 ? account.totalSpent + Math.abs(points) : account.totalSpent;

      // 5. Create transaction record
      const transactionId = `ltx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newTransaction: LoyaltyTransaction = {
        id: transactionId,
        userId,
        accountId: account.id,
        type,
        points,
        sourceType,
        sourceId,
        description,
        metadata: {
          ...metadata,
          previousBalance,
          newBalance,
        },
        status: 'COMPLETED',
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };

      // 6. Recalculate Level based on lifetime points
      const levelProgressInfo = LevelService.calculateLevelProgress(newLifetime);

      // 7. Update account state
      account.pointsBalance = newBalance;
      account.lifetimePoints = newLifetime;
      account.totalEarned = totalEarned;
      account.totalSpent = totalSpent;
      account.currentLevelId = levelProgressInfo.currentLevel.id;
      account.currentLevelProgress = levelProgressInfo.progressPercentage;
      account.updatedAt = new Date().toISOString();

      // 8. Persist atomically
      transactions.unshift(newTransaction);
      db.set('loyaltyTransactions', [...transactions]);

      const accounts = db.get('loyaltyAccounts');
      const accIndex = accounts.findIndex((a) => a.id === account.id);
      if (accIndex >= 0) {
        accounts[accIndex] = { ...account };
      } else {
        accounts.push({ ...account });
      }
      db.set('loyaltyAccounts', [...accounts]);

      const levelUp = previousLevelId !== levelProgressInfo.currentLevel.id;

      return {
        account: { ...account },
        transaction: newTransaction,
        levelUp,
        previousLevelId,
        newLevelId: levelProgressInfo.currentLevel.id,
      };
    });
  }

  /**
   * Retrieves transaction history for a user, sorted by date descending.
   */
  public static getUserTransactions(userId: string, limit = 50): LoyaltyTransaction[] {
    const transactions = db.get('loyaltyTransactions');
    return transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}
