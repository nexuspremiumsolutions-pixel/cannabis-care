import { Router } from 'express';
import { db } from '../db/database';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  requireAuth,
  AuthenticatedRequest,
} from '../auth/auth';
import { SecurityService } from '../services/security/securityService';
import { DeliveryAdapters } from '../services/communication/deliveryAdapters';
import {
  User,
  UserProfile,
  UserConsent,
  UserPreferences,
  UserRole,
  ProfileType,
  PrimaryPath,
  Progress,
} from '../../src/types/entities';

const router = Router();

// 1. REGISTER
router.post('/register', (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const rateCheck = SecurityService.checkRateLimit(`register_${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 60,
      lockoutSeconds: 60,
    });

    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Trop de tentatives d'inscription. Veuillez patienter ${rateCheck.retryAfterSeconds} secondes.`,
      });
    }

    const { email, password, nickname, consent } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({ error: 'Email, mot de passe et pseudonyme requis.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Pour votre sécurité, le mot de passe doit comporter au moins 6 caractères.' });
    }

    const cleanEmail = SecurityService.sanitizeString(email).toLowerCase();
    const cleanNickname = SecurityService.sanitizeString(nickname);

    const users = db.get('users');
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Un compte avec cette adresse email existe déjà.' });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: UserRole.USER,
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const newProfile: UserProfile = {
      id: 'prof_' + userId,
      userId,
      nickname: cleanNickname,
      profileType: ProfileType.UNDETERMINED,
      isOnboarded: false,
      createdAt: now,
      updatedAt: now,
    };

    const newConsent: UserConsent = {
      id: 'cst_' + userId,
      userId,
      termsAccepted: consent?.termsAccepted ?? true,
      healthDisclaimerAccepted: consent?.healthDisclaimerAccepted ?? true,
      privacyPolicyAccepted: consent?.privacyPolicyAccepted ?? true,
      gdprDataProcessingConsent: consent?.gdprConsent ?? true,
      analyticsConsent: consent?.analyticsConsent ?? false,
      consentTimestamp: now,
      updatedAt: now,
    };

    const newPreferences: UserPreferences = {
      id: 'pref_' + userId,
      userId,
      notificationsEnabled: true,
      currency: 'EUR',
      language: 'fr',
      darkMode: false,
      updatedAt: now,
    };

    const newProgress: Progress = {
      id: 'prog_' + userId,
      userId,
      daysActive: 1,
      consumptionFreeDaysCount: 0,
      estimatedMoneySaved: 0,
      estimatedGramsAvoided: 0,
      lastCalculatedAt: now,
    };

    users.push(newUser);
    db.get('userProfiles').push(newProfile);
    db.get('userConsents').push(newConsent);
    db.get('userPreferences').push(newPreferences);
    db.get('progress').push(newProgress);
    db.save();

    db.logAudit('USER_REGISTERED', 'users', userId, { email: newUser.email, nickname: cleanNickname });

    const token = generateToken(newUser);
    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      profile: newProfile,
      consent: newConsent,
      preferences: newPreferences,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
});

// 1.5 SOCIAL SYNC (OAUTH via Supabase / Google / Microsoft)
router.post('/social-sync', (req, res) => {
  try {
    const { email, name, provider, providerId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Adresse email requise pour la synchronisation sociale.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const users = db.get('users');
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Determine role: if email is admin or mhzonesante, promote to ADMIN
      const isAdminEmail = cleanEmail.includes('admin') || cleanEmail.includes('mhzonesante');
      const role = isAdminEmail ? UserRole.ADMIN : UserRole.USER;

      user = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        email: cleanEmail,
        passwordHash: hashPassword(Math.random().toString(36)),
        role,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      users.push(user);
      db.save();

      const newProfile: UserProfile = {
        id: 'prof_' + user.id,
        userId: user.id,
        nickname: name || cleanEmail.split('@')[0],
        profileType: ProfileType.UNDETERMINED,
        primaryPath: PrimaryPath.UNDETERMINED,
        isOnboarded: false,
        onboardingCompleted: false,
        ageCategory: '26-35',
        recommendedModules: ['onboarding'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.get('userProfiles').push(newProfile);

      const newConsent: UserConsent = {
        id: 'cst_' + user.id,
        userId: user.id,
        termsAccepted: true,
        healthDisclaimerAccepted: true,
        privacyPolicyAccepted: true,
        gdprDataProcessingConsent: true,
        analyticsConsent: true,
        consentTimestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.get('userConsents').push(newConsent);

      const newPreferences: UserPreferences = {
        id: 'prf_' + user.id,
        userId: user.id,
        notificationsEnabled: true,
        currency: 'EUR',
        language: 'fr',
        darkMode: false,
        updatedAt: new Date().toISOString(),
      };
      db.get('userPreferences').push(newPreferences);
      db.save();

      db.logAudit('USER_SOCIAL_REGISTER', 'users', user.id, { provider, providerId });
    } else {
      user.lastLoginAt = new Date().toISOString();
      db.save();
      db.logAudit('USER_SOCIAL_LOGIN', 'users', user.id, { provider, providerId });
    }

    const profile = db.get('userProfiles').find((p) => p.userId === user.id);
    const consent = db.get('userConsents').find((c) => c.userId === user.id);
    const preferences = db.get('userPreferences').find((pr) => pr.userId === user.id);
    const thcProfile = db.get('thcProfiles').find((t) => t.userId === user.id);
    const cbdProfile = db.get('cbdProfiles').find((c) => c.userId === user.id);

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile,
      consent,
      preferences,
      thcProfile,
      cbdProfile,
    });
  } catch (err) {
    console.error('Social sync error:', err);
    return res.status(500).json({ error: 'Erreur lors de la synchronisation du compte social.' });
  }
});

// 2. LOGIN
router.post('/login', (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    // Brute-force protection: 15 attempts per 5 minutes, 15 minutes lockout
    const rateCheck = SecurityService.checkRateLimit(`login_${clientIp}`, {
      maxRequests: 15,
      windowSeconds: 300,
      lockoutSeconds: 900,
    });

    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Nombreux échecs de connexion détectés. Compte temporairement verrouillé pendant ${rateCheck.retryAfterSeconds} secondes.`,
      });
    }

    let targetEmail = email.toLowerCase().trim();
    // Support common aliases & shortcuts
    if (targetEmail === 'admin' || targetEmail === 'superadmin') targetEmail = 'admin@nexus.fr';
    if (targetEmail === 'admin@cannabiscare.nexus') targetEmail = 'admin@nexus.fr';
    if (targetEmail === 'shop' || targetEmail === 'partner' || targetEmail === 'partner@nexus.fr' || targetEmail === 'owner@nexus.fr') targetEmail = 'shop@nexus.fr';
    if (targetEmail === 'julien' || targetEmail === 'demo.thc') targetEmail = 'demo.thc@cannabiscare.fr';
    if (targetEmail === 'claire' || targetEmail === 'demo.cbd') targetEmail = 'demo.cbd@cannabiscare.fr';

    const users = db.get('users');
    let user = users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!user && (targetEmail === 'admin@nexus.fr' || targetEmail === 'admin@cannabiscare.nexus')) {
      user = users.find((u) => u.email.toLowerCase() === 'admin@cannabiscare.nexus' || u.email.toLowerCase() === 'admin@nexus.fr');
    }

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    let isPasswordValid = verifyPassword(password, user.passwordHash);
    // Support convenient demo passwords for test accounts
    if (!isPasswordValid) {
      const demoEmails = [
        'demo.thc@cannabiscare.fr',
        'demo.cbd@cannabiscare.fr',
        'admin@nexus.fr',
        'admin@cannabiscare.nexus',
        'shop@nexus.fr',
      ];
      if (demoEmails.includes(user.email.toLowerCase())) {
        const allowedDemoPasswords = [
          'democare2026!',
          'admincare2026!',
          'shopcare2026!',
          'demo',
          'admin',
          'shop',
          'password',
        ];
        if (allowedDemoPasswords.includes(password.toLowerCase().trim())) {
          isPasswordValid = true;
          user.passwordHash = hashPassword(password);
          db.save();
        }
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    // Clear rate limit on successful auth
    SecurityService.clearRateLimit(`login_${clientIp}`);

    user.lastLoginAt = new Date().toISOString();
    db.save();

    const profile = db.get('userProfiles').find((p) => p.userId === user.id);
    const consent = db.get('userConsents').find((c) => c.userId === user.id);
    const preferences = db.get('userPreferences').find((pr) => pr.userId === user.id);
    const thcProfile = db.get('thcProfiles').find((t) => t.userId === user.id);
    const cbdProfile = db.get('cbdProfiles').find((c) => c.userId === user.id);

    db.logAudit('USER_LOGIN', 'users', user.id);

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile,
      consent,
      preferences,
      thcProfile,
      cbdProfile,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
});

// 3. ME (SESSION RESTORATION)
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const profile = db.get('userProfiles').find((p) => p.userId === user.id);
    const consent = db.get('userConsents').find((c) => c.userId === user.id);
    const preferences = db.get('userPreferences').find((pr) => pr.userId === user.id);
    const thcProfile = db.get('thcProfiles').find((t) => t.userId === user.id);
    const cbdProfile = db.get('cbdProfiles').find((c) => c.userId === user.id);
    const progress = db.get('progress').find((pr) => pr.userId === user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile,
      consent,
      preferences,
      thcProfile,
      cbdProfile,
      progress,
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
});

// 4. UPDATE PROFILE
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { nickname, ageCategory } = req.body;
    const profiles = db.get('userProfiles');
    const index = profiles.findIndex((p) => p.userId === user.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Profil introuvable.' });
    }

    if (nickname) profiles[index].nickname = nickname.trim();
    if (ageCategory) profiles[index].ageCategory = ageCategory;
    profiles[index].updatedAt = new Date().toISOString();
    db.save();

    return res.json({ profile: profiles[index] });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour profil.' });
  }
});

// 5. UPDATE CONSENT (GDPR)
router.put('/consent', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { analyticsConsent } = req.body;
    const consents = db.get('userConsents');
    const index = consents.findIndex((c) => c.userId === user.id);

    if (index !== -1) {
      if (typeof analyticsConsent === 'boolean') {
        consents[index].analyticsConsent = analyticsConsent;
      }
      consents[index].updatedAt = new Date().toISOString();
      db.save();
      db.logAudit('CONSENT_UPDATED', 'userConsents', user.id, { analyticsConsent });
      return res.json({ consent: consents[index] });
    }
    return res.status(404).json({ error: 'Consentement introuvable.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour consentement.' });
  }
});

// 6. UPDATE PREFERENCES
router.put('/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { notificationsEnabled, dailyReminderTime, darkMode, language, currency } = req.body;
    const prefs = db.get('userPreferences');
    const index = prefs.findIndex((p) => p.userId === user.id);

    if (index !== -1) {
      if (typeof notificationsEnabled === 'boolean') prefs[index].notificationsEnabled = notificationsEnabled;
      if (dailyReminderTime) prefs[index].dailyReminderTime = dailyReminderTime;
      if (typeof darkMode === 'boolean') prefs[index].darkMode = darkMode;
      if (language) prefs[index].language = language;
      if (currency) prefs[index].currency = currency;
      prefs[index].updatedAt = new Date().toISOString();
      db.save();
      return res.json({ preferences: prefs[index] });
    }
    return res.status(404).json({ error: 'Préférences introuvables.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour préférences.' });
  }
});

// 7. SWITCH ROLE (TESTING & PERMISSION PREVIEW)
router.post('/switch-role', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { role } = req.body;
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide.' });
    }

    const users = db.get('users');
    const userRef = users.find((u) => u.id === user.id);
    if (userRef) {
      userRef.role = role;
      db.save();
      db.logAudit('ROLE_SWITCHED', 'users', user.id, { newRole: role });
      const token = generateToken(userRef);
      return res.json({ success: true, role, token });
    }
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur changement de rôle.' });
  }
});

// 8. GDPR EXPORT DATA
router.get('/export-data', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const exportPayload = {
      exportGeneratedAt: new Date().toISOString(),
      disclaimer: 'Archive de données personnelles conforme RGPD (Nexus Premium Solutions — Cannabis Care)',
      user: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        createdAt: req.user!.createdAt,
      },
      profile: db.get('userProfiles').find((p) => p.userId === userId),
      consent: db.get('userConsents').find((c) => c.userId === userId),
      preferences: db.get('userPreferences').find((p) => p.userId === userId),
      thcProfile: db.get('thcProfiles').find((t) => t.userId === userId),
      cbdProfile: db.get('cbdProfiles').find((c) => c.userId === userId),
      consumptionEntries: db.get('consumptionEntries').filter((e) => e.userId === userId),
      wellnessEntries: db.get('wellnessEntries').filter((w) => w.userId === userId),
      userGoals: db.get('userGoals').filter((g) => g.userId === userId),
      progress: db.get('progress').find((pr) => pr.userId === userId),
      auditLogs: db.get('auditLogs').filter((a) => a.userId === userId),
    };

    db.logAudit('DATA_EXPORT_DOWNLOADED', 'users', userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=cannabis_care_data_${userId}.json`);
    return res.json(exportPayload);
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de l'export des données." });
  }
});

// 9. GDPR DELETE ACCOUNT & CASCADE DATA
router.delete('/delete-account', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Filter out user data across all tables
    db.set('users', db.get('users').filter((u) => u.id !== userId));
    db.set('userProfiles', db.get('userProfiles').filter((p) => p.userId !== userId));
    db.set('userConsents', db.get('userConsents').filter((c) => c.userId !== userId));
    db.set('userPreferences', db.get('userPreferences').filter((p) => p.userId !== userId));
    db.set('thcProfiles', db.get('thcProfiles').filter((t) => t.userId !== userId));
    db.set('cbdProfiles', db.get('cbdProfiles').filter((c) => c.userId !== userId));
    db.set('consumptionEntries', db.get('consumptionEntries').filter((e) => e.userId !== userId));
    db.set('wellnessEntries', db.get('wellnessEntries').filter((w) => w.userId !== userId));
    db.set('userGoals', db.get('userGoals').filter((g) => g.userId !== userId));
    db.set('progress', db.get('progress').filter((pr) => pr.userId !== userId));
    db.set('notifications', db.get('notifications').filter((n) => n.userId !== userId));
    db.set('aiConversations', db.get('aiConversations').filter((ac) => ac.userId !== userId));

    db.logAudit('USER_DELETED_ACCOUNT_GDPR', 'users', undefined, { deletedUserId: userId });

    return res.json({ success: true, message: 'Compte et données associées intégralement supprimés.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
  }
});

// 10. CHANGE PASSWORD (AUTHENTICATED)
router.post('/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(403).json({ error: 'Le mot de passe actuel est incorrect.' });
    }

    const users = db.get('users');
    const userRef = users.find((u) => u.id === user.id);
    if (!userRef) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    userRef.passwordHash = hashPassword(newPassword);
    userRef.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('USER_PASSWORD_CHANGED', 'users', user.id);

    return res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
  }
});

// 11. FORGOT PASSWORD (REQUEST RESET TOKEN)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Adresse email requise.' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const rateCheck = SecurityService.checkRateLimit(`pwd_reset_${clientIp}`, {
      maxRequests: 5,
      windowSeconds: 300,
      lockoutSeconds: 600,
    });

    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Trop de demandes de réinitialisation. Réessayez dans ${rateCheck.retryAfterSeconds} secondes.`,
      });
    }

    const cleanEmail = SecurityService.sanitizeString(email).toLowerCase().trim();
    const user = db.get('users').find((u) => u.email.toLowerCase() === cleanEmail);

    // Timing-safe response: always acknowledge request to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cette adresse, un lien de réinitialisation sécurisé a été généré.',
      });
    }

    const resetToken = SecurityService.createPasswordResetToken(user.id, user.email);
    const host = req.get('host') || 'localhost:3000';
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
    const protocol = forwardedProto || (host.startsWith('localhost') ? req.protocol : 'https');
    const resetUrl = `${protocol}://${host}/?reset_token=${encodeURIComponent(resetToken)}`;

    const emailDelivery = await DeliveryAdapters.deliver('EMAIL', {
      notificationId: `pwd_reset_${Date.now()}`,
      userId: user.id,
      recipientAddress: user.email,
      subject: 'CANNABIS CARE — Réinitialisation de votre mot de passe',
      title: 'Réinitialisation de votre mot de passe CANNABIS CARE',
      body: `Vous avez demandé la réinitialisation de votre mot de passe.\nUtilisez le bouton ci-dessous ou saisissez le code sécurisé : ${resetToken}\nCe lien expire dans 30 minutes.`,
      deepLink: resetUrl,
    });

    db.logAudit('PASSWORD_RESET_REQUESTED', 'users', user.id);

    return res.json({
      success: true,
      message: 'Si un compte existe avec cette adresse, un lien de réinitialisation sécurisé a été généré.',
      emailStatus: emailDelivery.status,
      // In development/test container environment, return token for inspection
      devResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur demande de réinitialisation.' });
  }
});

// 12. RESET PASSWORD (CONFIRM TOKEN & SET NEW PASSWORD)
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' });
    }

    const verifyResult = SecurityService.verifyAndConsumePasswordResetToken(token);
    if (!verifyResult.valid || !verifyResult.userId) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const users = db.get('users');
    const userRef = users.find((u) => u.id === verifyResult.userId);
    if (!userRef) {
      return res.status(404).json({ error: 'Compte introuvable.' });
    }

    userRef.passwordHash = hashPassword(newPassword);
    userRef.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('PASSWORD_RESET_COMPLETED', 'users', userRef.id);

    return res.json({ success: true, message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur réinitialisation mot de passe.' });
  }
});

export default router;
