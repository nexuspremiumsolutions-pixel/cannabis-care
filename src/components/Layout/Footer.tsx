import React from 'react';
import { Shield, HeartHandshake, PhoneCall, Lock, AlertTriangle } from 'lucide-react';
import { BotanicalLeafIcon, BotanicalWatermark } from '../Common/BotanicalDecor';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-[#032017] text-slate-400 text-xs border-t border-emerald-900/40 mt-16 overflow-hidden">
      {/* Decorative Botanical Watermark in Footer */}
      <BotanicalWatermark position="bottom-right" size={280} className="text-emerald-500/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
        
        {/* Top Section: Health & Safety Hotlines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#021d15]/90 border border-emerald-800/40 text-slate-300 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700/40 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>Drogues Info Service</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </h4>
              <p className="text-[11px] text-emerald-200/70">{t('badge_safe_listening')}</p>
              <a href="tel:0800231313" className="text-amber-300 font-extrabold hover:underline mt-1 inline-block text-xs">
                0 800 23 13 13
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-700/40 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Fil Santé Jeunes</h4>
              <p className="text-[11px] text-slate-400">Accompagnement 12-25 ans anonyme & bienveillant</p>
              <a href="tel:0800235236" className="text-indigo-400 font-bold hover:underline mt-1 inline-block text-xs">
                0 800 235 236
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-700/40 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t('footer_emergency')}</h4>
              <p className="text-[11px] text-slate-400">En cas d&apos;urgence vitale ou de malaise aigu</p>
              <span className="text-rose-400 font-extrabold mt-1 inline-block text-xs">
                15 (SAMU) ou 112 (Europe)
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Strict Legal & Sanitary Disclaimer */}
        <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 text-[11px] leading-relaxed text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <BotanicalLeafIcon size={14} className="text-emerald-400" variant="minimal" />
            <span>{t('edu_disclaimer_title')}</span>
          </div>
          <p>
            {t('edu_disclaimer_body')}
          </p>
        </div>

        {/* Bottom Section: Copyright & Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-emerald-900/40 text-[11px]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#042416] flex items-center justify-center border border-amber-400/40 overflow-hidden shrink-0">
              <img
                src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
                alt="Logo officiel CANNABIS CARE"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-extrabold text-white uppercase tracking-wide">CANNABIS CARE</span>
            <span>—</span>
            <span>Un produit certifié de <strong>NEXUS PREMIUM SOLUTIONS</strong></span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSettings}
              className="text-amber-300 hover:text-amber-200 transition flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('badge_security')}</span>
            </button>
            <span>•</span>
            <span>© {new Date().getFullYear()} {t('footer_rights')}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
