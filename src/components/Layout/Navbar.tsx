import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { PWAInstallButton } from '../Common/PWAControls';
import { BotanicalLeafIcon, BotanicalFlowerIcon } from '../Common/BotanicalDecor';
import { isDemoModeEnabled } from '../../lib/demoMode';
import {
  Shield,
  LayoutDashboard,
  BookOpen,
  Trophy,
  GraduationCap,
  HeartHandshake,
  Bot,
  Store,
  LogOut,
  Settings,
  Sparkles,
  ChevronDown,
  ShoppingBag,
  Package,
  Gift,
  Crown,
  Megaphone,
  Bell,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { UserRole, ProfileType } from '../../types/entities';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
  onOpenNotifications?: () => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenOnboarding,
  onOpenNotifications,
  onOpenAuth,
}) => {
  const { user, profile, isAuthenticated, logout, switchRole, switchDemoPersona } = useAuth();
  const demoMode = isDemoModeEnabled();
  const { totalItemsCount, openCartDrawer } = useCart();
  const { language, setLanguage, t, options, currentOption, isRTL } = useLanguage();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const marketMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (marketMenuRef.current && !marketMenuRef.current.contains(e.target as Node)) {
        setIsMarketDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?limit=1');
        const data = await res.json();
        if (data.success) {
          setUnreadNotifCount(data.unreadCount || 0);
        }
      } catch {
        // Silent catch
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Primary Direct Navigation Items
  const navItems = [
    {
      id: 'dashboard',
      label: t('sub_overview', 'Tableau de bord'),
      icon: LayoutDashboard,
    },
    {
      id: 'journal',
      label: t('sub_journal', 'Journal'),
      icon: BookOpen,
    },
    {
      id: 'goals',
      label: t('sub_goals', 'Objectifs'),
      icon: Trophy,
    },
    {
      id: 'coach',
      label: 'Care & Écoute',
      icon: HeartHandshake,
    },
    {
      id: 'education',
      label: t('sub_education', 'Sciences & RDR'),
      icon: GraduationCap,
    },
    {
      id: 'stores',
      label: t('sub_catalog', 'Boutiques'),
      icon: Store,
      hasSubmenu: true,
      subItems: [
        { id: 'stores', label: t('sub_catalog', 'Dispensaires & Boutiques CBD'), icon: Store },
        { id: 'tracking', label: t('sub_orders', 'Suivi Commandes & Colis'), icon: Package },
        { id: 'loyalty', label: t('sub_loyalty', 'Club & Récompenses'), icon: Gift },
        { id: 'marketing', label: t('sub_marketing', 'Offres Partenaires'), icon: Megaphone },
      ],
    },
    {
      id: 'subscription',
      label: t('nav_subscription', 'Abonnement'),
      icon: Crown,
    },
    ...(user?.role === UserRole.SHOP_OWNER || user?.role === UserRole.STORE_ADMIN || user?.role === UserRole.SHOP_MANAGER
      ? [
          {
            id: 'partner_dashboard',
            label: 'Espace Pro Boutique',
            icon: Store,
          },
        ]
      : []),
    ...(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PLATFORM_ADMIN
      ? [
          {
            id: 'admin',
            label: 'Administration',
            icon: Shield,
          },
        ]
      : []),
  ];

  const profileLabel =
    profile?.profileType === ProfileType.THC
      ? 'Parcours THC'
      : profile?.profileType === ProfileType.CBD
      ? 'Parcours CBD'
      : 'Espace Bien-être';

  const isMarketActive = ['stores', 'tracking', 'loyalty', 'marketing'].includes(activeTab);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e17]/95 text-slate-100 backdrop-blur-xl border-b border-slate-800 shadow-md">
      {/* Subtle visual divider line separating navbar from content */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-hidden"
              aria-label="CANNABIS CARE Accueil"
            >
              <div className="w-10 h-10 rounded-xl bg-[#042416] border border-amber-400/50 flex items-center justify-center group-hover:border-amber-300 transition-all duration-200 shadow-xs overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
                  alt="Logo officiel CANNABIS CARE"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-bold font-outfit text-base tracking-wide text-white block leading-tight uppercase">
                  CANNABIS CARE
                </span>
                <span className="text-[10px] text-slate-400 font-medium block tracking-wide">
                  {profileLabel}
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Tabs - Clean, light & intuitive with thin icons */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.hasSubmenu ? isMarketActive : activeTab === item.id;

              if (item.hasSubmenu) {
                return (
                  <div key={item.id} className="relative" ref={marketMenuRef}>
                    <button
                      onClick={() => {
                        setActiveTab('stores');
                        setIsMarketDropdownOpen(!isMarketDropdownOpen);
                      }}
                      onMouseEnter={() => setIsMarketDropdownOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-200'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={1.6} />
                      <span className="font-body">{item.label}</span>
                      <ChevronDown className={`w-3 h-3 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={1.6} />
                    </button>

                    {/* Submenu Dropdown for Boutiques */}
                    {isMarketDropdownOpen && (
                      <div
                        onMouseLeave={() => setIsMarketDropdownOpen(false)}
                        className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
                      >
                        {item.subItems?.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeTab === sub.id;

                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab(sub.id);
                                setIsMarketDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                                isSubActive
                                  ? 'bg-white text-slate-950 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={1.6} />
                              <span className="font-body">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={1.6} />
                  <span className="font-body">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2">
            
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition cursor-pointer text-xs font-semibold text-slate-300 shadow-xs"
                aria-label="Choisir la langue"
              >
                <span className="text-sm">{currentOption?.flag}</span>
                <span className="text-[11px] font-bold uppercase">{currentOption?.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" strokeWidth={1.6} />
              </button>

              {isLangDropdownOpen && (
                <div
                  className={`absolute mt-2 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}
                >
                  {options.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => {
                        setLanguage(opt.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                        language === opt.code
                          ? 'bg-white text-slate-950 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{opt.flag}</span>
                        <span>{opt.nativeName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{opt.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition cursor-pointer text-slate-300 shadow-xs"
              aria-label="Panier d'achat"
            >
              <ShoppingBag className="w-4 h-4 text-slate-300" strokeWidth={1.6} />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Notifications Bell Button */}
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  setActiveTab('notifications');
                }
              }}
              className="relative p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition cursor-pointer text-slate-300 shadow-xs"
              aria-label="Centre de Notifications"
            >
              <Bell className="w-4 h-4 text-slate-300" strokeWidth={1.6} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown Menu or Public Sign-in CTA */}
            {!isAuthenticated ? (
              <button
                onClick={() => onOpenAuth && onOpenAuth()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Connexion</span>
              </button>
            ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition cursor-pointer text-xs font-semibold text-slate-200 shadow-xs"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-slate-800 text-white border border-slate-700 flex items-center justify-center font-black text-xs">
                  {profile?.nickname ? profile.nickname[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline font-semibold text-slate-200">
                  {profile?.nickname || t('nav_account', 'Mon Compte')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs backdrop-blur-2xl">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-bold text-white">{profile?.nickname || 'Utilisateur'}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {profileLabel}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onOpenOnboarding();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>{t('nav_onboarding', 'Refaire le Bilan Initial')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setActiveTab('subscription');
                      }}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{t('nav_subscription', 'Mon Abonnement & Formules')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{t('nav_settings', 'Paramètres & RGPD')}</span>
                    </button>
                  </div>

                  {/* Switch role in dev/demo only (?demo=1) */}
                  {demoMode && (
                    <div className="px-4 py-2 border-t border-slate-800 bg-black/40">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                        <span>Démonstration Directe :</span>
                        <span className="text-[9px] bg-emerald-950 px-1 py-0.5 rounded text-emerald-300">1-clic</span>
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            switchDemoPersona('shop');
                            setActiveTab('partner_dashboard');
                          }}
                          className="p-1.5 rounded-lg text-left font-bold cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200"
                        >
                          🏪 Boutique Pro
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            switchDemoPersona('admin');
                            setActiveTab('admin');
                          }}
                          className="p-1.5 rounded-lg text-left font-bold cursor-pointer bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200"
                        >
                          ⚡ Super Admin
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            switchDemoPersona('cbd');
                            setActiveTab('dashboard');
                          }}
                          className="p-1.5 rounded-lg text-left font-bold cursor-pointer bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200"
                        >
                          🌸 Client CBD
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            switchDemoPersona('thc');
                            setActiveTab('dashboard');
                          }}
                          className="p-1.5 rounded-lg text-left font-bold cursor-pointer bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-200"
                        >
                          🌿 Client THC
                        </button>
                      </div>
                    </div>
                  )}

                  {onOpenAuth && (
                    <div className="px-4 py-1.5 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full text-left text-[11px] text-slate-300 hover:text-white py-1 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Se connecter avec un autre compte</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('nav_logout', 'Se déconnecter')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 border border-slate-800 cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-white" strokeWidth={1.6} /> : <Menu className="w-5 h-5 text-white" strokeWidth={1.6} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation (Slide-in) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-[#090d14]/98 backdrop-blur-2xl z-50 p-5 overflow-y-auto space-y-4 animate-in slide-in-from-top duration-200 border-t border-slate-800">
          
          {/* Brand Card in Mobile Drawer */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 p-4 bg-slate-900 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#042416] flex items-center justify-center border border-amber-400/50 overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
                  alt="Logo officiel CANNABIS CARE"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold font-outfit text-sm text-white uppercase tracking-wide">CANNABIS CARE</p>
                <p className="text-[11px] text-slate-400 font-medium">{profileLabel}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed font-body">
              {t('banner_flower_quote')}
            </p>
          </div>

          {/* Navigation Items List */}
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.hasSubmenu ? isMarketActive : activeTab === item.id;

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      if (!item.hasSubmenu) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-950 font-bold shadow-md'
                        : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-body">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={1.6} />
                      <span>{item.label}</span>
                    </div>
                  </button>

                  {/* Sub-items in mobile if hasSubmenu */}
                  {item.hasSubmenu && (
                    <div className="pl-4 space-y-1 border-l border-slate-800 ml-3">
                      {item.subItems?.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveTab(sub.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                              isSubActive
                                ? 'text-white bg-slate-800 font-bold border border-slate-700'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </header>
  );
};
