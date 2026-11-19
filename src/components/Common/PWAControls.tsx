import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';
import { Download, WifiOff, X, Apple } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'button' | 'banner' }> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center justify-between gap-3 bg-teal-50 border border-teal-200 text-teal-900 px-4 py-2.5 rounded-xl shadow-xs text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Installez CANNABIS CARE sur votre écran d&apos;accueil pour un accès rapide.</span>
          </div>
          <button
            onClick={install}
            className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium transition shrink-0"
          >
            Installer
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer"
        title="Installer l'application PWA"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installer l&apos;App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-teal-300 text-teal-800 bg-teal-50/60 hover:bg-teal-100/80 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Apple className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installer sur iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">Installer sur iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed space-y-2">
                <span className="block">1. Touchez l&apos;icône <strong>Partager</strong> dans Safari (le carré avec une flèche vers le haut).</span>
                <span className="block">2. Faites défiler vers le bas et sélectionnez <strong>Sur l&apos;écran d&apos;accueil</strong>.</span>
                <span className="block">3. Confirmez pour lancer CANNABIS CARE en mode application autonome plein écran.</span>
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition"
              >
                J&apos;ai compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-medium shadow-lg animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode hors ligne actif — Consultation locale des données disponibles.</span>
    </div>
  );
};
