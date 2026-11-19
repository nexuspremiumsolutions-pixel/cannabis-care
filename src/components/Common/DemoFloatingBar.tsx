import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, ProfileType } from '../../types/entities';
import {
  Sparkles,
  Shield,
  Store,
  ChevronDown,
  Eye,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface DemoFloatingBarProps {
  onSelectTab: (tab: string) => void;
  activeTab: string;
}

export const DemoFloatingBar: React.FC<DemoFloatingBarProps> = ({ onSelectTab, activeTab }) => {
  const { user, profile, switchDemoPersona, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine current active profile/persona
  const isTHC = profile?.profileType === ProfileType.THC && user?.role === UserRole.USER;
  const isCBD = profile?.profileType === ProfileType.CBD && user?.role === UserRole.USER;
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isShop = user?.role === UserRole.SHOP_OWNER || user?.role === UserRole.STORE_ADMIN;

  return (
    <aside aria-label="Sélecteur de Démonstration en Direct" className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end">
      {/* Expanded Quick Switcher Menu */}
      {isExpanded && (
        <div className="mb-2 bg-slate-900/95 text-white border border-slate-700/80 backdrop-blur-xl rounded-2xl p-3 shadow-2xl w-80 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Accès Libre • Présentation Pro</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              1-Clic
            </span>
          </div>

          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
            Passez instantanément d&apos;un profil à l&apos;autre pour montrer aux boutiques et partenaires l&apos;ensemble de la solution :
          </p>

          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            {/* 1. Client Parcours THC */}
            <button
              onClick={() => {
                switchDemoPersona('thc');
                onSelectTab('dashboard');
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                isTHC
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-teal-400">🌿 Client THC</div>
              <div className="text-[10px] text-slate-400 truncate">Sevrage & Réduction</div>
            </button>

            {/* 2. Client Parcours CBD */}
            <button
              onClick={() => {
                switchDemoPersona('cbd');
                onSelectTab('dashboard');
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                isCBD
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-emerald-400">🌸 Client CBD</div>
              <div className="text-[10px] text-slate-400 truncate">Bien-être & Boutique</div>
            </button>

            {/* 3. Espace Commerçant / Boutique */}
            <button
              onClick={() => {
                switchDemoPersona('shop');
                onSelectTab('partner_dashboard');
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                isShop
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-amber-400">🏪 Espace Boutique</div>
              <div className="text-[10px] text-slate-400 truncate">Stocks, QR & Ventes</div>
            </button>

            {/* 4. Super Admin */}
            <button
              onClick={() => {
                switchDemoPersona('admin');
                onSelectTab('admin');
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                isAdmin
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-purple-400">⚡ Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">Pilotage centralisé</div>
            </button>
          </div>

          {/* Quick Tab Jump for Demos */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium block w-full mb-1">Accès directs utiles en rendez-vous :</span>
            <button
              onClick={() => onSelectTab('stores')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                activeTab === 'stores' ? 'bg-white text-slate-900 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Catalogue Boutiques CBD
            </button>
            <button
              onClick={() => onSelectTab('education')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                activeTab === 'education' ? 'bg-white text-slate-900 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Sciences & RDR
            </button>
            <button
              onClick={() => onSelectTab('loyalty')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                activeTab === 'loyalty' ? 'bg-white text-slate-900 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Club Fidélité
            </button>
            <button
              onClick={() => onSelectTab('subscription')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                activeTab === 'subscription' ? 'bg-white text-slate-900 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Abonnements
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-slate-900/95 hover:bg-black text-white border border-slate-700/80 px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-xl transition hover:scale-105 active:scale-95 cursor-pointer"
        title="Ouvrir le sélecteur de démonstration 1-clic"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-xs font-bold font-body">
          {isShop
            ? 'Boutique (Nexus Paris)'
            : isAdmin
            ? 'Super Admin'
            : isCBD
            ? 'Client CBD'
            : 'Client THC'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>
    </aside>
  );
};
