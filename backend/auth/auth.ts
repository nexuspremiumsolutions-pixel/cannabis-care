import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { User, UserRole } from '../../src/types/entities';

const JWT_SECRET = process.env.JWT_SECRET || 'cannabis_care_secure_nexus_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { sub: string; email: string; role: UserRole } | null {
  try {
    // Support instantaneous demo tokens for live presentations
    if (token.startsWith('demo_token_')) {
      const parts = token.split('_');
      const persona = parts[2] || 'shop';
      const users = db.get('users') || [];
      const userMap: Record<string, string> = {
        thc: 'demo.thc@cannabiscare.fr',
        cbd: 'demo.cbd@cannabiscare.fr',
        admin: 'admin@nexus.fr',
        shop: 'shop@nexus.fr',
      };
      const targetEmail = userMap[persona] || 'shop@nexus.fr';
      const matched = users.find((u) => u.email === targetEmail);
      if (matched) {
        return { sub: matched.id, email: matched.email, role: matched.role };
      }
      // If user not in DB, fallback to seeded first admin or user
      const anyUser = users[0];
      if (anyUser) {
        return { sub: anyUser.id, email: anyUser.email, role: anyUser.role };
      }
    }

    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return data;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié. Token manquant ou invalide.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }

  const user = db.get('users').find((u) => u.id === decoded.sub);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable.' });
  }

  req.user = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé pour votre rôle.' });
    }
    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = db.get('users').find((u) => u.id === decoded.sub);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}
