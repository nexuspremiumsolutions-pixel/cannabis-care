import React from 'react';
import { LayoutDashboard, BookOpen, HeartHandshake, GraduationCap, Store, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/entities';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PLATFORM_ADMIN;

  const navItems = [
    { id: 'dashboard', label: t('sub_overview', 'Accueil'), icon: LayoutDashboard },
    { id: 'journal', label: t('sub_journal', 'Journal'), icon: BookOpen },
    { id: 'coach', label: 'Care', icon: HeartHandshake },
    { id: 'education', label: t('sub_education', 'Savoir'), icon: GraduationCap },
    { id: 'stores', label: t('sub_catalog', 'Boutique'), icon: Store },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
  ];

  const gridColsClass = isAdmin ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e17]/95 text-slate-300 backdrop-blur-2xl border-t border-slate-800 px-2 py-1.5 shadow-2xl">
      {/* Delicate top separator glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent pointer-events-none" />

      <div className={`grid ${gridColsClass} items-center justify-around max-w-md mx-auto`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === 'stores'
              ? ['stores', 'tracking', 'loyalty', 'marketing'].includes(activeTab)
              : activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isActive ? 'bg-white text-slate-950 shadow-xs' : ''
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.6} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[65px] font-body">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

