import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  ShieldCheck,
  Download,
  Calendar,
  CheckCircle2,
  Receipt,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const CustomerPaymentsView: React.FC = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/finance/customer/payments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (e) {
        console.error('Error fetching customer payments:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [token]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mes Paiements & Factures Simplifiées</h2>
            <p className="text-xs text-slate-500">
              Retrouvez l&apos;ensemble de vos règlements sécurisés, reçus de transaction et attestations de conformité.
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Historique des Règlements ({payments.length})
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Paiement sécurisé 3D Secure v2 & Chiffrement SSL 256-bit</span>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Vous n&apos;avez effectué aucun achat sur la marketplace pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.orderId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-slate-700" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">{p.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                        Payé & Certifié
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(p.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>Réf : {p.paymentTransactionId}</span>
                      <span>•</span>
                      <span>{p.shopsSummary?.length || 1} boutique(s) partenaire(s)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">
                      {p.grandTotal.toFixed(2)} {p.currency}
                    </p>
                    {p.refundedAmount > 0 && (
                      <span className="text-[10px] font-bold text-rose-700 block">
                        Remboursé : -{p.refundedAmount.toFixed(2)} €
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      // Generate and download a simple printable receipt
                      const receiptText = `REÇU DE PAIEMENT CANNABIS CARE MARKETPLACE\n=========================================\nCommande : ${p.orderNumber}\nDate : ${new Date(p.date).toLocaleString('fr-FR')}\nTransaction : ${p.paymentTransactionId}\nMontant : ${p.grandTotal.toFixed(2)} ${p.currency}\nStatut : PAYÉ (3DS v2)\n=========================================\nMerci de votre confiance.`;
                      const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `recu-${p.orderNumber}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title="Télécharger le reçu"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
