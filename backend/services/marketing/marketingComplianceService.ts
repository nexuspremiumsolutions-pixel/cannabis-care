import { db } from '../../db/database';
import { MarketingCountryRule } from '../../../src/types/entities';

export interface ComplianceCheckResult {
  isCompliant: boolean;
  score: number; // 0 to 100
  violations: string[];
  flaggedKeywords: string[];
  recommendations: string[];
  checkedCountry: string;
}

export class MarketingComplianceService {
  /**
   * Scans campaign title, description, and terms for prohibited medical claims
   */
  public static verifyCompliance(
    textToAnalyze: string,
    countryCode: string = 'FR'
  ): ComplianceCheckResult {
    const rules = db.get('marketingCountryRules') || [];
    const countryRule =
      rules.find((r) => r.countryCode === countryCode) ||
      rules.find((r) => r.countryCode === 'FR') || {
        countryCode: 'FR',
        countryName: 'France',
        maxThcPercent: 0.3,
        prohibitedClaims: ['soigne', 'guérit', 'médicament', 'traitement', 'antidouleur', 'anxiolytique'],
        allowedHealthClaims: ['bien-être', 'relaxation', 'confort'],
        requireAgeGate: true,
        alcoholTobaccoBundlingAllowed: false,
        complianceNotes: 'Réglementation standard.',
      };

    const lower = textToAnalyze.toLowerCase();
    const violations: string[] = [];
    const flaggedKeywords: string[] = [];

    for (const word of countryRule.prohibitedClaims) {
      // Regex check with word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lower)) {
        flaggedKeywords.push(word);
        violations.push(
          `Le terme « ${word} » constitue une allégation médicale ou thérapeutique illégale pour les produits de bien-être en ${countryRule.countryName}.`
        );
      }
    }

    // Additional universal checks
    const universalProhibited = [
      'fumer',
      'joint',
      'défonce',
      'high',
      'stone',
      'stupéfiant',
      'remplace le cannabis récréatif',
      'ordonnance',
    ];

    for (const term of universalProhibited) {
      if (lower.includes(term) && !flaggedKeywords.includes(term)) {
        flaggedKeywords.push(term);
        violations.push(
          `L’expression « ${term} » est prohibée car elle induit une confusion avec des usages stupéfiants ou médicaux réglementés.`
        );
      }
    }

    const isCompliant = violations.length === 0;
    const score = isCompliant ? 100 : Math.max(20, 100 - violations.length * 25);

    const recommendations: string[] = isCompliant
      ? ['Texte parfaitement conforme aux directives européennes et nationales de phytothérapie bien-être.']
      : [
          'Privilégiez les notions de « rituel de relaxation », « détente aromatique », « bien-être quotidien » et « confort musculaire ».',
          'Rappelez que les produits botaniques au CBD ne sont pas destinés à diagnostiquer, traiter ou guérir une quelconque pathologie.',
          'Assurez-vous de mentionner que le taux de THC respecte strictement le seuil légal en vigueur.',
        ];

    return {
      isCompliant,
      score,
      violations,
      flaggedKeywords,
      recommendations,
      checkedCountry: countryRule.countryName,
    };
  }
}
