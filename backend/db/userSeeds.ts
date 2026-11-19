import {
  User,
  UserProfile,
  UserConsent,
  UserPreferences,
  THCProfile,
  CBDProfile,
  Progress,
  UserRole,
  ProfileType,
  PrimaryPath,
  THCStatus,
  CBDStatus,
} from '../../src/types/entities';
import { hashPassword } from '../auth/auth';

const NOW = new Date().toISOString();

export function getSeedUsers(): {
  users: User[];
  userProfiles: UserProfile[];
  userConsents: UserConsent[];
  userPreferences: UserPreferences[];
  thcProfiles: THCProfile[];
  cbdProfiles: CBDProfile[];
  progress: Progress[];
} {
  const users: User[] = [
    {
      id: 'usr_regular_user',
      email: 'demo.thc@cannabiscare.fr',
      passwordHash: hashPassword('DemoCare2026!'),
      role: UserRole.USER,
      isEmailVerified: true,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: NOW,
      lastLoginAt: NOW,
    },
    {
      id: 'usr_cbd_enthusiast',
      email: 'demo.cbd@cannabiscare.fr',
      passwordHash: hashPassword('DemoCare2026!'),
      role: UserRole.USER,
      isEmailVerified: true,
      createdAt: '2026-07-15T14:30:00.000Z',
      updatedAt: NOW,
      lastLoginAt: NOW,
    },
    {
      id: 'usr_admin_nexus_super',
      email: 'admin@nexus.fr',
      passwordHash: hashPassword('AdminCare2026!'),
      role: UserRole.ADMIN,
      isEmailVerified: true,
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: NOW,
      lastLoginAt: NOW,
    },
    {
      id: 'usr_admin_nexus_alias',
      email: 'admin@cannabiscare.nexus',
      passwordHash: hashPassword('AdminCare2026!'),
      role: UserRole.ADMIN,
      isEmailVerified: true,
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: NOW,
      lastLoginAt: NOW,
    },
    {
      id: 'usr_admin',
      email: 'shop@nexus.fr',
      passwordHash: hashPassword('ShopCare2026!'),
      role: UserRole.SHOP_OWNER,
      isEmailVerified: true,
      createdAt: '2026-07-01T09:00:00.000Z',
      updatedAt: NOW,
      lastLoginAt: NOW,
    },
  ];

  const userProfiles: UserProfile[] = [
    {
      id: 'prof_usr_regular_user',
      userId: 'usr_regular_user',
      nickname: 'Julien',
      profileType: ProfileType.THC,
      primaryPath: PrimaryPath.THC,
      thcStatus: THCStatus.CURRENT_USER,
      cbdStatus: CBDStatus.NEVER_USED,
      isOnboarded: true,
      onboardingCompleted: true,
      onboardingVersion: '1.0.0',
      ageCategory: '26-35',
      recommendedModules: ['thc_reduction', 'journal', 'goals', 'coach'],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: NOW,
    },
    {
      id: 'prof_usr_cbd_enthusiast',
      userId: 'usr_cbd_enthusiast',
      nickname: 'Claire',
      profileType: ProfileType.CBD,
      primaryPath: PrimaryPath.CBD,
      thcStatus: THCStatus.NEVER_USED,
      cbdStatus: CBDStatus.CURRENT_USER,
      isOnboarded: true,
      onboardingCompleted: true,
      onboardingVersion: '1.0.0',
      ageCategory: '26-35',
      recommendedModules: ['cbd_wellness', 'stores', 'journal', 'loyalty'],
      createdAt: '2026-07-15T14:30:00.000Z',
      updatedAt: NOW,
    },
    {
      id: 'prof_usr_admin_nexus_super',
      userId: 'usr_admin_nexus_super',
      nickname: 'Super Admin Nexus',
      profileType: ProfileType.THC,
      primaryPath: PrimaryPath.THC,
      isOnboarded: true,
      onboardingCompleted: true,
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: NOW,
    },
    {
      id: 'prof_usr_admin_nexus_alias',
      userId: 'usr_admin_nexus_alias',
      nickname: 'Super Admin Nexus',
      profileType: ProfileType.THC,
      primaryPath: PrimaryPath.THC,
      isOnboarded: true,
      onboardingCompleted: true,
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: NOW,
    },
    {
      id: 'prof_usr_admin',
      userId: 'usr_admin',
      nickname: 'Marc (Boutique Paris)',
      profileType: ProfileType.CBD,
      primaryPath: PrimaryPath.CBD,
      isOnboarded: true,
      onboardingCompleted: true,
      createdAt: '2026-07-01T09:00:00.000Z',
      updatedAt: NOW,
    },
  ];

  const userConsents: UserConsent[] = users.map((u) => ({
    id: 'cst_' + u.id,
    userId: u.id,
    termsAccepted: true,
    healthDisclaimerAccepted: true,
    privacyPolicyAccepted: true,
    gdprDataProcessingConsent: true,
    analyticsConsent: true,
    consentTimestamp: u.createdAt,
    updatedAt: NOW,
  }));

  const userPreferences: UserPreferences[] = users.map((u) => ({
    id: 'pref_' + u.id,
    userId: u.id,
    notificationsEnabled: true,
    currency: 'EUR',
    language: 'fr',
    darkMode: false,
    updatedAt: NOW,
  }));

  const thcProfiles: THCProfile[] = [
    {
      id: 'thc_usr_regular_user',
      userId: 'usr_regular_user',
      thcStatus: THCStatus.CURRENT_USER,
      consumptionStatus: 'reducing',
      frequency: 'daily_multiple',
      approxQuantity: '2-3 joints/jour',
      averageCostPerMonthEstimated: 140,
      contexts: ['Soirée', 'Après le travail'],
      declaredReasons: ['Détente', 'Gestion du stress'],
      habits: ['Fumer en soirée'],
      previousReductionAttemptsCount: 1,
      primaryGoal: 'reduce',
      quitWish: 'within_6_months',
      encounteredDifficulties: ['Insomnie légère', 'Envies en soirée'],
      declaredTriggers: ['stress_travail', 'ennui_soiree'],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: NOW,
    },
  ];

  const cbdProfiles: CBDProfile[] = [
    {
      id: 'cbd_usr_cbd_enthusiast',
      userId: 'usr_cbd_enthusiast',
      cbdStatus: CBDStatus.CURRENT_USER,
      currentUse: 'yes',
      consumptionMethods: ['oil_drops', 'flowers'],
      productTypesUsed: ['oil', 'infusion'],
      frequency: 'daily',
      personalGoals: ['sleep', 'stress_relief'],
      sleepQualityRating: 4,
      relaxationRating: 4,
      createdAt: '2026-07-15T14:30:00.000Z',
      updatedAt: NOW,
    },
  ];

  const progress: Progress[] = [
    {
      id: 'prog_usr_regular_user',
      userId: 'usr_regular_user',
      daysActive: 38,
      consumptionFreeDaysCount: 22,
      estimatedMoneySaved: 220,
      estimatedGramsAvoided: 18.5,
      lastCalculatedAt: NOW,
    },
    {
      id: 'prog_usr_cbd_enthusiast',
      userId: 'usr_cbd_enthusiast',
      daysActive: 45,
      consumptionFreeDaysCount: 45,
      estimatedMoneySaved: 0,
      estimatedGramsAvoided: 0,
      lastCalculatedAt: NOW,
    },
    {
      id: 'prog_usr_admin_nexus_super',
      userId: 'usr_admin_nexus_super',
      daysActive: 90,
      consumptionFreeDaysCount: 90,
      estimatedMoneySaved: 500,
      estimatedGramsAvoided: 45,
      lastCalculatedAt: NOW,
    },
    {
      id: 'prog_usr_admin',
      userId: 'usr_admin',
      daysActive: 60,
      consumptionFreeDaysCount: 60,
      estimatedMoneySaved: 300,
      estimatedGramsAvoided: 25,
      lastCalculatedAt: NOW,
    },
  ];

  return {
    users,
    userProfiles,
    userConsents,
    userPreferences,
    thcProfiles,
    cbdProfiles,
    progress,
  };
}
