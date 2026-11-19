import crypto from 'crypto';
import { User, UserRole } from '../../../src/types/entities';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
}

export class SecurityService {
  private static rateLimitStore = new Map<string, RateLimitRecord>();
  private static passwordResetTokens = new Map<string, PasswordResetToken>();

  /**
   * Sliding window rate limiter with auto-lockout for brute force prevention
   */
  public static checkRateLimit(
    key: string,
    options: {
      maxRequests: number;
      windowSeconds: number;
      lockoutSeconds?: number;
    }
  ): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
    const now = Date.now();
    const record = this.rateLimitStore.get(key);

    if (record) {
      // Check if actively locked out
      if (record.blockedUntil && record.blockedUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000),
        };
      }

      // Check if window has expired
      if (now > record.resetAt) {
        this.rateLimitStore.set(key, {
          count: 1,
          resetAt: now + options.windowSeconds * 1000,
        });
        return { allowed: true, remaining: options.maxRequests - 1 };
      }

      // Increment count
      record.count += 1;
      if (record.count > options.maxRequests) {
        if (options.lockoutSeconds) {
          record.blockedUntil = now + options.lockoutSeconds * 1000;
          return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: options.lockoutSeconds,
          };
        }
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
        };
      }

      return { allowed: true, remaining: options.maxRequests - record.count };
    }

    // New entry
    this.rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000,
    });
    return { allowed: true, remaining: options.maxRequests - 1 };
  }

  /**
   * Reset rate limit on successful authentication to prevent false positives
   */
  public static clearRateLimit(key: string): void {
    this.rateLimitStore.delete(key);
  }

  /**
   * Sanitize text against XSS, HTML injection, and control characters
   */
  public static sanitizeString(input: unknown): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .replace(/[<>'"&]/g, (match) => {
        switch (match) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#x27;';
          case '&': return '&amp;';
          default: return match;
        }
      })
      .trim();
  }

  /**
   * Sanitize an object recursively
   */
  public static sanitizePath(filePath: string): string {
    if (typeof filePath !== 'string') return '';
    return filePath.replace(/\.\./g, '').replace(/[\\/]+/g, '/').replace(/^\/+/, '');
  }

  public static sanitizeObject<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        return this.sanitizeString(obj) as unknown as T;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as unknown as T;
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized as T;
  }

  /**
   * Multi-Tenant Isolation Validator:
   * Asserts that a user has authorized access to a specific shop.
   * Shop owners/staff can ONLY access their own shop.
   * Only PLATFORM_ADMIN or SUPER_ADMIN have cross-shop read/write capability.
   */
  public static assertShopAccess(
    user: User,
    shopId: string,
    shopOwnerId?: string
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Non authentifié.' };
    }

    const isPlatformAdmin =
      user.role === UserRole.ADMIN ||
      (user.role as string) === 'PLATFORM_ADMIN' ||
      (user.role as string) === 'SUPER_ADMIN';

    if (isPlatformAdmin) {
      return { allowed: true };
    }

    // Check if user is shop owner
    if (shopOwnerId && shopOwnerId === user.id) {
      return { allowed: true };
    }

    // If role is user, customer, or another shop owner
    return {
      allowed: false,
      reason: 'Accès multi-tenant refusé : vous ne pouvez pas accéder aux données d’une autre boutique.',
    };
  }

  /**
   * IDOR Prevention Helper:
   * Asserts that a user owns the requested entity, or possesses administrative privileges.
   */
  public static assertResourceOwnership(
    user: User,
    resourceOwnerId: string,
    options?: { allowShopStaff?: boolean }
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Authentification requise.' };
    }

    const isPlatformAdmin =
      user.role === UserRole.ADMIN ||
      (user.role as string) === 'PLATFORM_ADMIN' ||
      (user.role as string) === 'SUPER_ADMIN';

    if (isPlatformAdmin) {
      return { allowed: true };
    }

    if (user.id === resourceOwnerId) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Accès non autorisé à cette ressource (IDOR protection).',
    };
  }

  /**
   * Sensitive Notification Masker:
   * Ensures that push, email, or lockscreen notifications NEVER reveal sensitive
   * health data, THC dosage, cravings, or relapse events in public device previews.
   */
  public static maskSensitiveNotification(
    title: string,
    body: string
  ): { maskedTitle: string; maskedBody: string; wasSanitized: boolean } {
    const sensitiveRegex = /(thc|cannabis|joint|craving|envie|manque|dosage|rechute|sevrage|drogue|stupéfiant|mg)/gi;

    const hadSensitive = sensitiveRegex.test(title) || sensitiveRegex.test(body);

    if (!hadSensitive) {
      return { maskedTitle: title, maskedBody: body, wasSanitized: false };
    }

    // Neutral masked phrasing respecting Privacy by Design
    const maskedTitle = 'Cannabis Care — Rappel Bien-être';
    const maskedBody = 'Vous avez une nouvelle notification d’accompagnement. Ouvrez votre application sécurisée pour la consulter.';

    return { maskedTitle, maskedBody, wasSanitized: true };
  }

  /**
   * Generate secure cryptographically random password reset token
   */
  public static createPasswordResetToken(userId: string, email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    this.passwordResetTokens.set(token, {
      token,
      userId,
      email,
      expiresAt,
    });

    return token;
  }

  /**
   * Verify and consume password reset token
   */
  public static verifyAndConsumePasswordResetToken(
    token: string
  ): { valid: boolean; userId?: string; email?: string } {
    const record = this.passwordResetTokens.get(token);
    if (!record) {
      return { valid: false };
    }

    if (Date.now() > record.expiresAt) {
      this.passwordResetTokens.delete(token);
      return { valid: false };
    }

    // One-time use: consume immediately
    this.passwordResetTokens.delete(token);
    return { valid: true, userId: record.userId, email: record.email };
  }
}
