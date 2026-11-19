import { db } from '../../db/database';
import {
  PartnerFinancialAccount,
  PartnerBalance,
  TransferRecord,
  PayoutRecord,
  FinancialLedgerEntry,
  SupportedCountryCode,
} from '../../../src/types/entities';
import { PaymentProviderRegistry } from './paymentProviderAdapter';
import { FinancialEngineService } from './financialEngineService';

export class PartnerFinancialService {
  /**
   * Get or create a partner's financial account
   */
  public static async getOrCreatePartnerAccount(
    shopId: string,
    shopName: string,
    country: SupportedCountryCode = 'FR'
  ): Promise<PartnerFinancialAccount> {
    const accounts = db.get('partnerFinancialAccounts') || [];
    let acc = accounts.find((a) => a.shopId === shopId);

    if (!acc) {
      const provider = PaymentProviderRegistry.getProvider();
      const { accountId } = await provider.createConnectedAccount(shopId, shopName, country);

      acc = {
        id: `pfa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId,
        provider: provider.name,
        providerAccountId: accountId,
        country,
        currency: country === 'CH' ? 'CHF' : 'EUR',
        status: 'ONBOARDING',
        onboardingStatus: 'INCOMPLETE',
        verificationStatus: 'PENDING',
        payoutStatus: 'DISABLED',
        chargesEnabled: true,
        payoutsEnabled: false,
        requirementsStatus: {
          currentlyDue: ['company_registration_document', 'id_document_legal_rep'],
          eventuallyDue: [],
          pastDue: [],
        },
        lastSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      accounts.push(acc);
      db.set('partnerFinancialAccounts', accounts);
    }

    return acc;
  }

  /**
   * Generate hosted KYC/KYB onboarding link
   */
  public static async generateOnboardingLink(
    shopId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<{ url: string; expiresAt: string }> {
    const accounts = db.get('partnerFinancialAccounts') || [];
    const acc = accounts.find((a) => a.shopId === shopId);
    if (!acc) {
      throw new Error(`Compte financier non trouvé pour la boutique ${shopId}`);
    }

    const provider = PaymentProviderRegistry.getProvider(acc.provider);

    if (!acc.providerAccountId.startsWith('acct_1')) {
      const shop = (db.get('partnerShops') || []).find((s) => s.id === shopId);
      const { accountId } = await provider.createConnectedAccount(
        shopId,
        shop?.commercialName || 'Boutique Partenaire',
        acc.country
      );
      if (accountId.startsWith('acct_1')) {
        acc.providerAccountId = accountId;
        acc.updatedAt = new Date().toISOString();
        db.set('partnerFinancialAccounts', accounts);
      }
    }

    return await provider.createOnboardingLink({
      accountId: acc.providerAccountId,
      shopId,
      returnUrl,
      refreshUrl,
    });
  }

  /**
   * Get partner balance and transactions
   */
  public static getPartnerBalance(shopId: string): PartnerBalance {
    const balances = db.get('partnerBalances') || [];
    let balance = balances.find((b) => b.shopId === shopId);
    if (!balance) {
      balance = {
        shopId,
        currency: 'EUR',
        pendingAmount: 0,
        availableAmount: 0,
        paidAmount: 0,
        refundedAmount: 0,
        disputedAmount: 0,
        updatedAt: new Date().toISOString(),
      };
      balances.push(balance);
      db.set('partnerBalances', balances);
    }
    return balance;
  }

  /**
   * Get partner financial ledger history
   */
  public static getPartnerLedger(shopId: string): FinancialLedgerEntry[] {
    const ledger = db.get('financialLedger') || [];
    return ledger.filter((l) => l.shopId === shopId);
  }

  /**
   * Request a payout of available funds to partner bank account
   */
  public static async requestPayout(shopId: string, amount?: number): Promise<PayoutRecord> {
    const balance = this.getPartnerBalance(shopId);
    const payoutAmount = amount ? Math.min(amount, balance.availableAmount) : balance.availableAmount;

    if (payoutAmount <= 0) {
      throw new Error('Aucun solde disponible pour un reversement (disponible: 0.00 €)');
    }

    const accounts = db.get('partnerFinancialAccounts') || [];
    const acc = accounts.find((a) => a.shopId === shopId);
    if (!acc || acc.payoutStatus !== 'ENABLED') {
      throw new Error('Le compte partenaire n’est pas encore vérifié ou ses reversements sont bloqués');
    }

    const provider = PaymentProviderRegistry.getProvider(acc.provider);
    const res = await provider.createPayout({
      destinationAccountId: acc.providerAccountId,
      amount: payoutAmount,
      currency: balance.currency,
      statementDescriptor: 'NEXUS CBD MARKETPLACE',
    });

    const payout: PayoutRecord = {
      id: `po_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId,
      provider: provider.name,
      providerPayoutId: res.payoutId,
      amount: payoutAmount,
      currency: balance.currency,
      status: 'PAID',
      arrivalDate: res.arrivalDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const payouts = db.get('payoutRecords') || [];
    payouts.unshift(payout);
    db.set('payoutRecords', payouts);

    // Record in ledger
    FinancialEngineService.appendLedgerEntry({
      orderId: 'PAYOUT_ORDER',
      shopId,
      type: 'PAYOUT',
      direction: 'DEBIT',
      amount: payoutAmount,
      currency: balance.currency,
      description: `Virement sortant (Payout #${payout.id}) vers compte bancaire IBAN enregistré`,
      metadata: {
        providerPayoutId: res.payoutId,
        provider: provider.name,
      },
    });

    return payout;
  }

  /**
   * Dispatch transfers for an order to partner shops
   */
  public static async dispatchOrderTransfers(globalOrderId: string): Promise<TransferRecord[]> {
    const globalOrders = db.get('globalOrders') || [];
    const order = globalOrders.find((o) => o.id === globalOrderId);
    if (!order) {
      throw new Error('Commande globale introuvable');
    }

    const shopOrders = (db.get('shopOrders') || []).filter((so) => so.globalOrderId === globalOrderId);
    const transfers: TransferRecord[] = [];
    const existingTransfers = db.get('transferRecords') || [];

    for (const so of shopOrders) {
      // Check if already transferred
      const alreadyDone = existingTransfers.find((t) => t.shopOrderId === so.id && t.status === 'SUCCEEDED');
      if (alreadyDone) {
        transfers.push(alreadyDone);
        continue;
      }

      const acc = (db.get('partnerFinancialAccounts') || []).find((a) => a.shopId === so.shopId);
      const provider = PaymentProviderRegistry.getProvider(acc?.provider);

      try {
        const trResult = await provider.createTransfer({
          globalOrderId,
          shopOrderId: so.id,
          destinationAccountId: acc?.providerAccountId || `mock_dest_${so.shopId}`,
          amount: so.shopNetAmount,
          currency: so.currency,
          sourceTransactionId: order.paymentTransactionId,
          description: `Transfert de fonds net pour commande #${so.orderNumber}`,
        });

        const newTr: TransferRecord = {
          id: `tr_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          globalOrderId,
          shopOrderId: so.id,
          shopId: so.shopId,
          paymentTransactionId: order.paymentTransactionId,
          providerTransferId: trResult.transferId,
          amount: so.shopNetAmount,
          currency: so.currency,
          status: trResult.status,
          failureReason: trResult.failureReason,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        existingTransfers.push(newTr);
        transfers.push(newTr);

        // Record in ledger only when Connect transfer succeeded
        if (trResult.status === 'SUCCEEDED') {
          FinancialEngineService.appendLedgerEntry({
            orderId: globalOrderId,
            shopOrderId: so.id,
            shopId: so.shopId,
            type: 'TRANSFER',
            direction: 'CREDIT',
            amount: so.shopNetAmount,
            currency: so.currency,
            description: `Transfert Connect réussi #${newTr.id} vers compte boutique ${so.shopNameSnapshot}`,
            metadata: { providerTransferId: trResult.transferId },
          });
        }
      } catch (err: any) {
        const failTr: TransferRecord = {
          id: `tr_fail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          globalOrderId,
          shopOrderId: so.id,
          shopId: so.shopId,
          amount: so.shopNetAmount,
          currency: so.currency,
          status: 'FAILED',
          failureReason: err.message || 'Transfer error',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        existingTransfers.push(failTr);
        transfers.push(failTr);
      }
    }

    db.set('transferRecords', existingTransfers);
    return transfers;
  }
}
