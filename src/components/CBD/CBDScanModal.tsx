import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CBDProduct } from '../../types/entities';
import {
  X,
  QrCode,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Eye,
  Camera,
} from 'lucide-react';

interface CBDScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: CBDProduct) => void;
  onCreateProductFromCode: (code: string) => void;
}

export const CBDScanModal: React.FC<CBDScanModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
  onCreateProductFromCode,
}) => {
  const { token } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'searching' | 'found' | 'not_found';
    product?: CBDProduct | null;
    message?: string;
  }>({ status: 'idle' });

  if (!isOpen) return null;

  const handleLookup = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setScanResult({ status: 'searching' });

    try {
      const res = await fetch('/api/cbd/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: codeToSearch.trim(), scanType: 'barcode' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.matchedProduct) {
          setScanResult({
            status: 'found',
            product: data.matchedProduct,
            message: 'Produit certifié et référencé trouvé !',
          });
        } else {
          setScanResult({
            status: 'not_found',
            message: 'Aucun produit certifié trouvé pour ce code.',
          });
        }
      } else {
        setScanResult({
          status: 'not_found',
          message: 'Erreur lors de la recherche du code.',
        });
      }
    } catch (err) {
      setScanResult({
        status: 'not_found',
        message: 'Erreur réseau lors de la recherche.',
      });
    }
  };

  const sampleCodes = [
    { code: '3760345678901', label: 'Huile CBD 10% Broad Spectrum' },
    { code: '3760345678902', label: 'Infusion Sommeil & Détente' },
    { code: '3760345678903', label: 'Baume Récupération Musculaire' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Scanner un Produit CBD</h3>
              <p className="text-xs text-slate-500">Vérification de conformité et ajout rapide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Visual Scanner Target Viewfinder */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-dashed border-teal-500/40 flex flex-col items-center justify-center text-white overflow-hidden p-6 text-center space-y-3">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
            
            {/* Animated Laser line */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] animate-pulse" />

            <div className="relative z-10 flex flex-col items-center space-y-2">
              <div className="p-3 rounded-2xl bg-slate-800/90 text-teal-400 border border-teal-500/30">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Pointez l&apos;objectif vers le code-barres (EAN) ou le QR Code
              </p>
              <p className="text-[11px] text-slate-400">
                Recherche automatique dans le registre des analyses de laboratoire
              </p>
            </div>
          </div>

          {/* Manual Input Form */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-slate-500" />
              <span>Saisir manuellement le numéro de code-barres (EAN-13) :</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 3760345678901"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleLookup(manualCode)}
                disabled={!manualCode.trim() || scanResult.status === 'searching'}
                className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>Vérifier</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Codes */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Codes de test rapides :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleCodes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setManualCode(item.code);
                    handleLookup(item.code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono cursor-pointer transition"
                >
                  {item.code} ({item.label})
                </button>
              ))}
            </div>
          </div>

          {/* Scan Results View */}
          {scanResult.status === 'searching' && (
            <div className="p-4 rounded-2xl bg-teal-50 text-teal-800 text-xs flex items-center gap-2 animate-pulse">
              <Search className="w-4 h-4 animate-spin" />
              <span>Interrogation de la base de données certifiée...</span>
            </div>
          )}

          {scanResult.status === 'found' && scanResult.product && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">{scanResult.product.name}</h4>
                    <p className="text-[11px] text-emerald-700">{scanResult.product.brand} • {scanResult.product.category}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  THC &le; 0.3%
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onProductFound(scanResult.product!);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Consulter la fiche & Analyses</span>
                </button>
              </div>
            </div>
          )}

          {scanResult.status === 'not_found' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Produit non répertorié</h4>
                  <p className="text-[11px] text-amber-800">
                    Ce code ({manualCode}) n&apos;est pas encore dans le catalogue certifié. Vous pouvez l&apos;ajouter à votre armoire personnelle.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateProductFromCode(manualCode);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer la fiche de ce produit</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
