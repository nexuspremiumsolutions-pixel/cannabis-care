import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { AuthModal } from './components/Auth/AuthModal';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { THCDashboard } from './components/Dashboard/THCDashboard';
import { CBDDashboard } from './components/Dashboard/CBDDashboard';
import { JournalView } from './components/Journal/JournalView';
import { GoalsView } from './components/Goals/GoalsView';
import { EducationView } from './components/Education/EducationView';
import { AICoachView } from './components/AI/AICoachView';
import { StoreCatalogView } from './components/Store/StoreCatalogView';
import { AdminView } from './components/Admin/AdminView';
import { CustomerTrackingView } from './components/Logistics/CustomerTrackingView';
import { LoyaltyView } from './components/Loyalty/LoyaltyView';
import { SubscriptionView } from './components/Subscription/SubscriptionView';
import { MarketingView } from './components/Marketing/MarketingView';
import { NotificationsView } from './components/Notifications/NotificationsView';
import { NotificationCenterModal } from './components/Notifications/NotificationCenterModal';
import { CommunicationPreferencesModal } from './components/Notifications/CommunicationPreferencesModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { EntryModal } from './components/Journal/EntryModal';
import { CartDrawer } from './components/Store/CartDrawer';
import { CheckoutModal } from './components/Store/CheckoutModal';
import { OfflineIndicator, PWAInstallButton } from './components/Common/PWAControls';
import { MobileBottomNav } from './components/Layout/MobileBottomNav';
import { BotanicalHeroBanner } from './components/Common/BotanicalHeroBanner';
import { DemoFloatingBar } from './components/Common/DemoFloatingBar';
import { PartnerDashboardView } from './components/PartnerStorefront/PartnerDashboardView';
import { PartnerStorefrontView } from './components/PartnerStorefront/PartnerStorefrontView';
import { ProfileType } from './types/entities';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading, profile, token, refreshMe, switchDemoPersona } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isCommPreferencesOpen, setIsCommPreferencesOpen] = useState(false);
  const [isOnboardingManualOpen, setIsOnboardingManualOpen] = useState(false);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [previewShopId, setPreviewShopId] = useState<string | null>(null);

  // Auto-init to default demo persona if not authenticated yet so user/shops have immediate free access
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Initialize with shop or THC profile for immediate presentation
      switchDemoPersona('shop');
    }
  }, [isLoading, isAuthenticated, switchDemoPersona]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-24 h-24 rounded-2xl bg-[#042416] flex items-center justify-center animate-bounce shadow-xl shadow-emerald-950/60 border border-amber-400/50 overflow-hidden">
          <img
            src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
            alt="Logo officiel CANNABIS CARE"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">CANNABIS CARE</h2>
          <p className="text-xs text-emerald-200/60">Nexus Premium Solutions • Chargement sécurisé...</p>
        </div>
      </div>
    );
  }

  // Need Onboarding?
  const needsOnboarding = (profile && !profile?.isOnboarded) || isOnboardingManualOpen;

  return (
    <div className="min-h-screen bg-[#fbfdfa] text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-200 selection:text-emerald-950 pb-16 lg:pb-0">
      
      {/* Top Navbar with 4 Core Pillars & Sub-Navigation */}
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setPreviewShopId(null);
            setActiveTab(tab);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenOnboarding={() => setIsOnboardingManualOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* PWA Banner Reminder on Mobile */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:hidden">
          <PWAInstallButton variant="banner" />
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          {/* Botanical Cannabis Flower Decorative Hero Banner */}
          <BotanicalHeroBanner activeTab={activeTab} />

          {previewShopId ? (
            <PartnerStorefrontView
              shopIdOrSlug={previewShopId}
              onBack={() => setPreviewShopId(null)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                profile?.profileType === ProfileType.CBD ? (
                  <CBDDashboard
                    onOpenNewEntry={() => setIsNewEntryModalOpen(true)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                ) : (
                  <THCDashboard
                    onOpenNewEntry={() => setIsNewEntryModalOpen(true)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )
              )}

              {activeTab === 'partner_dashboard' && (
                <PartnerDashboardView
                  onPreviewStorefront={(shopId) => setPreviewShopId(shopId)}
                />
              )}

              {activeTab === 'journal' && <JournalView />}
              {activeTab === 'goals' && <GoalsView />}
              {activeTab === 'education' && <EducationView />}
              {activeTab === 'coach' && <AICoachView />}
              {activeTab === 'stores' && <StoreCatalogView />}
              {activeTab === 'loyalty' && <LoyaltyView />}
              {activeTab === 'subscription' && <SubscriptionView />}
              {activeTab === 'marketing' && <MarketingView />}
              {activeTab === 'notifications' && (
                <NotificationsView onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'tracking' && <CustomerTrackingView />}
              {activeTab === 'admin' && <AdminView />}
            </>
          )}
        </main>
      </div>

      {/* Floating Demo Persona Switcher Bar for Live Partner Demos */}
      <DemoFloatingBar
        onSelectTab={(tab) => {
          setPreviewShopId(null);
          setActiveTab(tab);
        }}
        activeTab={activeTab}
      />

      {/* Footer */}
      <Footer onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setPreviewShopId(null);
          setActiveTab(tab);
        }}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Optional AuthModal if opened manually */}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {/* Modals & Flow */}
      {needsOnboarding && (
        <OnboardingFlow
          onFinished={() => {
            setIsOnboardingManualOpen(false);
            refreshMe();
          }}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRestartOnboarding={() => setIsOnboardingManualOpen(true)}
        onOpenCommPreferences={() => setIsCommPreferencesOpen(true)}
      />

      <EntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        onSaved={() => {
          refreshMe();
        }}
        token={token}
      />

      {/* Module 16: Notifications Drawer & RGPD Preferences */}
      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onOpenPreferences={() => setIsCommPreferencesOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <CommunicationPreferencesModal
        isOpen={isCommPreferencesOpen}
        onClose={() => setIsCommPreferencesOpen(false)}
      />

      {/* Module 8 & 9: Marketplace Cart & Checkout */}
      <CartDrawer />
      <CheckoutModal />

      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
