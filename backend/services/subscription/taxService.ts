import { db } from '../../db/database';
import { TaxConfiguration } from '../../../src/types/entities';

export interface CalculatedTax {
  country: string;
  taxRate: number;
  taxType: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export class TaxService {
  /**
   * Get active tax configuration for a given country code
   */
  public static getTaxForCountry(countryCode: string = 'FR'): TaxConfiguration {
    const taxes = db.get('taxConfigurations') || [];
    const normalized = countryCode.toUpperCase();
    const found = taxes.find((t) => t.country.toUpperCase() === normalized && t.status === 'ACTIVE');

    if (found) {
      return found;
    }

    // Default fallback: 20% TVA
    return {
      id: 'tax_default',
      country: normalized,
      taxRate: 0.20,
      taxType: 'TVA',
      effectiveFrom: '2024-01-01T00:00:00Z',
      status: 'ACTIVE',
    };
  }

  /**
   * Calculate taxes given a gross amount (tax-inclusive pricing, standard for EU B2C)
   */
  public static calculateInclusiveTax(grossAmount: number, countryCode: string = 'FR'): CalculatedTax {
    const config = this.getTaxForCountry(countryCode);
    const gross = Math.round(grossAmount * 100) / 100;
    // Subtotal = gross / (1 + rate)
    const subtotal = Math.round((gross / (1 + config.taxRate)) * 100) / 100;
    const taxAmount = Math.round((gross - subtotal) * 100) / 100;

    return {
      country: config.country,
      taxRate: config.taxRate,
      taxType: config.taxType,
      subtotal,
      taxAmount,
      totalAmount: gross,
    };
  }

  /**
   * Calculate taxes given an exclusive net amount (for B2B / Partner)
   */
  public static calculateExclusiveTax(netAmount: number, countryCode: string = 'FR'): CalculatedTax {
    const config = this.getTaxForCountry(countryCode);
    const subtotal = Math.round(netAmount * 100) / 100;
    const taxAmount = Math.round((subtotal * config.taxRate) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    return {
      country: config.country,
      taxRate: config.taxRate,
      taxType: config.taxType,
      subtotal,
      taxAmount,
      totalAmount,
    };
  }
}
