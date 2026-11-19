import React from 'react';
import { Invoice } from '../../types/entities';
import { FileText, Download, Printer, CheckCircle, ShieldCheck, X } from 'lucide-react';

interface SubscriptionInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const SubscriptionInvoiceModal: React.FC<SubscriptionInvoiceModalProps> = ({
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.status === 'PAID';
  const isRefunded = invoice.status === 'REFUNDED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Facture d’Abonnement</h3>
              <p className="text-xs text-slate-500 font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              title="Imprimer / Télécharger en PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (printable) */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-xs text-slate-700">
          {/* Company & Billing Info */}
          <div className="grid grid-cols-2 gap-6 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-700">Émetteur</span>
              <p className="font-extrabold text-slate-900 text-sm">Nexus Premium Solutions SAS</p>
              <p className="text-slate-500">Plateforme CANNABIS CARE & Bien-être</p>
              <p className="text-slate-500">45 Rue de la Paix, 75002 Paris, France</p>
              <p className="text-slate-500">TVA Intra : FR 84 928374821</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails Facturation</span>
              <p className="font-bold text-slate-900">
                Date : {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-slate-500">
                Statut :{' '}
                <span
                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRefunded
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {isPaid && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                  {isPaid ? 'PAYÉE' : isRefunded ? 'REMBOURSÉE' : invoice.status}
                </span>
              </p>
              {invoice.paidAt && (
                <p className="text-slate-500">Règlement le : {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5">Désignation</th>
                  <th className="py-2.5 text-center">Période</th>
                  <th className="py-2.5 text-right">Taux TVA</th>
                  <th className="py-2.5 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-semibold text-slate-900">
                    Abonnement {invoice.metadata?.planName || 'Nexus Équilibre'}
                    <span className="block text-[10px] font-normal text-slate-500">
                      Formule {invoice.metadata?.priceInterval === 'YEAR' ? 'Annuelle' : 'Mensuelle'}
                      {invoice.metadata?.isTrial ? ' (Période d’essai)' : ''}
                    </span>
                  </td>
                  <td className="py-3 text-center text-slate-600 font-medium">
                    {invoice.metadata?.priceInterval === 'YEAR' ? '12 mois' : '1 mois'}
                  </td>
                  <td className="py-3 text-right text-slate-600 font-medium">
                    {invoice.metadata?.taxRate ? `${(invoice.metadata.taxRate * 100).toFixed(1)}%` : '20.0%'}
                  </td>
                  <td className="py-3 text-right font-extrabold text-slate-900">
                    {invoice.totalAmount.toFixed(2)} {invoice.currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="border-t border-slate-200 pt-4 flex justify-end">
            <div className="w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-semibold">
                  {invoice.amountSubtotal.toFixed(2)} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA ({invoice.metadata?.country || 'FR'}) :</span>
                <span className="font-semibold">
                  {invoice.taxAmount.toFixed(2)} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Total Règlement TTC :</span>
                <span className="text-teal-800">
                  {invoice.totalAmount.toFixed(2)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Regulatory Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-teal-800 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Conformité Fiscale Européenne & Suisse</span>
            </div>
            <p>
              TVA acquittée selon les règles du guichet unique OSS pour les pays de l’UE et dispositions fédérales suisses.
              En cas de question sur votre facturation, contactez facturation@cannabiscare.nexus.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Imprimer / Télécharger</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
