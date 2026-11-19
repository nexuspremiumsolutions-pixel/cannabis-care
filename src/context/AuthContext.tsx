import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  User,
  UserProfile,
  UserConsent,
  ConsentRecord,
  UserPreferences,
  THCProfile,
  ConsumptionProfile,
  CBDProfile,
  WellnessProfile,
  CommunicationPreferences,
  UserRole,
  ProfileType,
  PrimaryPath,
} from '../types/entities';

interface AuthContextType {
  token: string | null;
  user: Partial<User> | null;
  profile: UserProfile | null;
  consent: UserConsent | null;
  preferences: UserPreferences | null;
  thcProfile: THCProfile | null;
  consumptionProfile: ConsumptionProfile | null;
  cbdProfile: CBDProfile | null;
  wellnessProfile: WellnessProfile | null;
  communicationPreferences: CommunicationPreferences | null;
  consentRecords: ConsentRecord[];
  recommendedModules: string[];
  primaryPath: PrimaryPath;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSocial: (email: string, name?: string, provider?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    nickname: string,
    consent: { termsAccepted: boolean; healthDisclaimerAccepted: boolean; gdprConsent: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateProfile: (data: { nickname?: string; ageCategory?: '18-25' | '26-35' | '36-50' | '51+' }) => Promise<boolean>;
  updateConsent: (data: { analyticsConsent: boolean }) => Promise<boolean>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<boolean>;
  switchRole: (role: UserRole) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  saveOnboardingStep: (step: number, data: any) => Promise<boolean>;
  completeAdaptiveOnboarding: (payload: any) => Promise<{ success: boolean; error?: string }>;
  resetOnboarding: () => Promise<boolean>;
  updateAdvancedProfile: (payload: any) => Promise<boolean>;
  completeTHCOnboarding: (data: Partial<THCProfile>) => Promise<boolean>;
  completeCBDOnboarding: (data: Partial<CBDProfile>) => Promise<boolean>;
  completeNeitherOnboarding: () => Promise<boolean>;
  switchDemoPersona: (persona: 'thc' | 'cbd' | 'admin' | 'shop') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cannabis_care_jwt_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [consent, setConsent] = useState<UserConsent | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [thcProfile, setThcProfile] = useState<THCProfile | null>(null);
  const [consumptionProfile, setConsumptionProfile] = useState<ConsumptionProfile | null>(null);
  const [cbdProfile, setCbdProfile] = useState<CBDProfile | null>(null);
  const [wellnessProfile, setWellnessProfile] = useState<WellnessProfile | null>(null);
  const [communicationPreferences, setCommunicationPreferences] = useState<CommunicationPreferences | null>(null);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [recommendedModules, setRecommendedModules] = useState<string[]>([]);
  const [primaryPath, setPrimaryPath] = useState<PrimaryPath>(PrimaryPath.UNDETERMINED);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFullProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/onboarding/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        if (data.consumptionProfile) setConsumptionProfile(data.consumptionProfile);
        if (data.thcProfile) setThcProfile(data.thcProfile);
        if (data.cbdProfile) setCbdProfile(data.cbdProfile);
        if (data.wellnessProfile) setWellnessProfile(data.wellnessProfile);
        if (data.communicationPreferences) setCommunicationPreferences(data.communicationPreferences);
        if (data.consentRecords) setConsentRecords(data.consentRecords);
        if (data.recommendedModules) setRecommendedModules(data.recommendedModules);
        if (data.primaryPath) setPrimaryPath(data.primaryPath);
      }
    } catch (err) {
      console.error('Failed to fetch full onboarding profile:', err);
    }
  }, []);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setConsent(data.consent);
        setPreferences(data.preferences);
        setThcProfile(data.thcProfile || null);
        setCbdProfile(data.cbdProfile || null);

        if (data.profile?.isOnboarded) {
          fetchFullProfile(authToken);
        }
      } else {
        // Invalid or expired token
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFullProfile]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchCurrentUser]);

  // Sync Supabase OAuth (Google, Microsoft Azure) sessions into Cannabis Care backend
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Listen to Supabase auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && session.user.email && !token) {
        try {
          const res = await fetch('/api/auth/social-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              provider: session.user.app_metadata?.provider || 'oauth',
              providerId: session.user.id,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              localStorage.setItem(TOKEN_KEY, data.token);
              setToken(data.token);
              setUser(data.user);
              setProfile(data.profile);
              setConsent(data.consent);
              setPreferences(data.preferences);
              setThcProfile(data.thcProfile || null);
              setCbdProfile(data.cbdProfile || null);
            }
          }
        } catch (e) {
          console.error('Failed to sync Supabase user session with Cannabis Care:', e);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Non-JSON response from /api/auth/login:', parseErr);
      }

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `Erreur d'authentification (${res.status})`;
        return { success: false, error: errorMsg };
      }

      if (!data || !data.token) {
        return { success: false, error: 'Réponse serveur invalide (jeton manquant)' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setConsent(data.consent);
      setPreferences(data.preferences);
      setThcProfile(data.thcProfile || null);
      setCbdProfile(data.cbdProfile || null);
      if (data.profile?.isOnboarded) {
        fetchFullProfile(data.token);
      }
      return { success: true };
    } catch (err: unknown) {
      console.error('Network or client exception during login:', err);
      const detail = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Erreur de connexion : ${detail || 'Impossible de joindre le serveur'}` };
    }
  };

  const loginWithSocial = async (email: string, name?: string, provider: string = 'google') => {
    try {
      const res = await fetch('/api/auth/social-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0],
          provider,
          providerId: `social_${Date.now()}`,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Non-JSON response from /api/auth/social-sync:', parseErr);
      }

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `Erreur de synchronisation (${res.status})`;
        return { success: false, error: errorMsg };
      }

      if (!data || !data.token) {
        return { success: false, error: 'Réponse serveur invalide (jeton manquant)' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setConsent(data.consent);
      setPreferences(data.preferences);
      setThcProfile(data.thcProfile || null);
      setCbdProfile(data.cbdProfile || null);
      if (data.profile?.isOnboarded) {
        fetchFullProfile(data.token);
      }
      return { success: true };
    } catch (err: unknown) {
      console.error('Network or client exception during social sync:', err);
      const detail = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Erreur de connexion : ${detail || 'Impossible de joindre le serveur'}` };
    }
  };

  const switchDemoPersona = useCallback(async (persona: 'thc' | 'cbd' | 'admin' | 'shop') => {
    const creds: Record<string, { email: string; pass: string }> = {
      thc: { email: 'demo.thc@cannabiscare.fr', pass: 'DemoCare2026!' },
      cbd: { email: 'demo.cbd@cannabiscare.fr', pass: 'DemoCare2026!' },
      admin: { email: 'admin@nexus.fr', pass: 'AdminCare2026!' },
      shop: { email: 'shop@nexus.fr', pass: 'ShopCare2026!' },
    };

    const target = creds[persona];
    if (!target) return;

    // Try standard API login
    const res = await login(target.email, target.pass);
    if (!res.success) {
      // Direct local session mock fallback if API is not responding
      const demoRoles: Record<string, UserRole> = {
        thc: UserRole.USER,
        cbd: UserRole.USER,
        admin: UserRole.ADMIN,
        shop: UserRole.SHOP_OWNER,
      };
      const demoNicknames: Record<string, string> = {
        thc: 'Julien (Démo THC)',
        cbd: 'Claire (Démo CBD)',
        admin: 'Super Admin Nexus',
        shop: 'Marc (Boutique Paris)',
      };
      const demoProfileTypes: Record<string, ProfileType> = {
        thc: ProfileType.THC,
        cbd: ProfileType.CBD,
        admin: ProfileType.THC,
        shop: ProfileType.CBD,
      };

      const mockToken = `demo_token_${persona}_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, mockToken);
      setToken(mockToken);
      setUser({
        id: `usr_demo_${persona}`,
        email: target.email,
        role: demoRoles[persona],
        isEmailVerified: true,
      });
      setProfile({
        id: `prof_demo_${persona}`,
        userId: `usr_demo_${persona}`,
        nickname: demoNicknames[persona],
        profileType: demoProfileTypes[persona],
        primaryPath: persona === 'cbd' ? PrimaryPath.CBD : PrimaryPath.THC,
        isOnboarded: true,
        onboardingCompleted: true,
        onboardingVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setConsent({
        termsAccepted: true,
        healthDisclaimerAccepted: true,
        gdprConsent: true,
        analyticsConsent: true,
        marketingConsent: true,
        consentedAt: new Date().toISOString(),
      });
      setPreferences({
        theme: 'light',
        notificationsEnabled: true,
        language: 'fr',
        privacyLevel: 'standard',
        dailyCheckInTime: '20:00',
      });
    }
  }, []);

  const register = async (
    email: string,
    password: string,
    nickname: string,
    consentPayload: { termsAccepted: boolean; healthDisclaimerAccepted: boolean; gdprConsent: boolean }
  ) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname, consent: consentPayload }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Non-JSON response from /api/auth/register:', parseErr);
      }

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `Erreur d'inscription (${res.status})`;
        return { success: false, error: errorMsg };
      }

      if (!data || !data.token) {
        return { success: false, error: 'Réponse serveur invalide (jeton manquant)' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setConsent(data.consent);
      setPreferences(data.preferences);
      return { success: true };
    } catch (err: unknown) {
      console.error('Network or client exception during register:', err);
      const detail = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Erreur d'inscription : ${detail || 'Impossible de joindre le serveur'}` };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setProfile(null);
    setConsent(null);
    setPreferences(null);
    setThcProfile(null);
    setConsumptionProfile(null);
    setCbdProfile(null);
    setWellnessProfile(null);
    setCommunicationPreferences(null);
    setConsentRecords([]);
    setRecommendedModules([]);
    setPrimaryPath(PrimaryPath.UNDETERMINED);
  };

  const refreshMe = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const updateProfile = async (data: { nickname?: string; ageCategory?: '18-25' | '26-35' | '36-50' | '51+' }) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const body = await res.json();
        setProfile(body.profile);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const updateConsent = async (data: { analyticsConsent: boolean }) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const body = await res.json();
        setConsent(body.consent);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const updatePreferences = async (data: Partial<UserPreferences>) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const body = await res.json();
        setPreferences(body.preferences);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const switchRole = async (role: UserRole) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.token) {
          localStorage.setItem(TOKEN_KEY, body.token);
          setToken(body.token);
        }
        if (user) {
          setUser({ ...user, role });
        }
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const deleteAccount = async () => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const saveOnboardingStep = async (step: number, data: any) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step, data }),
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to save onboarding step:', e);
      return false;
    }
  };

  const completeAdaptiveOnboarding = async (payload: any) => {
    if (!token) return { success: false, error: 'Non authentifié' };
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la finalisation' };
      }
      setProfile(data.profile);
      setConsumptionProfile(data.consumptionProfile);
      setThcProfile(data.consumptionProfile);
      setCbdProfile(data.cbdProfile);
      setWellnessProfile(data.wellnessProfile);
      setCommunicationPreferences(data.communicationPreferences);
      setRecommendedModules(data.recommendedModules || []);
      setPrimaryPath(data.primaryPath || PrimaryPath.UNDETERMINED);
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur réseau lors de la finalisation' };
    }
  };

  const resetOnboarding = async () => {
    if (!token) return false;
    try {
      const res = await fetch('/api/onboarding/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (profile) {
          setProfile({ ...profile, isOnboarded: false, onboardingCompleted: false, currentStep: 1 });
        }
        return true;
      }
    } catch (e) {
      console.error('Error resetting onboarding:', e);
    }
    return false;
  };

  const updateAdvancedProfile = async (payload: any) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        if (data.recommendedModules) setRecommendedModules(data.recommendedModules);
        if (data.primaryPath) setPrimaryPath(data.primaryPath);
        await fetchFullProfile(token);
        return true;
      }
    } catch (e) {
      console.error('Error updating advanced profile:', e);
    }
    return false;
  };

  const completeTHCOnboarding = async (data: Partial<THCProfile>) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/onboarding/thc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const body = await res.json();
        setProfile(body.profile);
        setThcProfile(body.thcProfile);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const completeCBDOnboarding = async (data: Partial<CBDProfile>) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/onboarding/cbd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const body = await res.json();
        setProfile(body.profile);
        setCbdProfile(body.cbdProfile);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const completeNeitherOnboarding = async () => {
    if (!token) return false;
    try {
      const res = await fetch('/api/onboarding/neither', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const body = await res.json();
        setProfile(body.profile);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profile,
        consent,
        preferences,
        thcProfile,
        consumptionProfile,
        cbdProfile,
        wellnessProfile,
        communicationPreferences,
        consentRecords,
        recommendedModules,
        primaryPath,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        loginWithSocial,
        register,
        logout,
        refreshMe,
        updateProfile,
        updateConsent,
        updatePreferences,
        switchRole,
        deleteAccount,
        saveOnboardingStep,
        completeAdaptiveOnboarding,
        resetOnboarding,
        updateAdvancedProfile,
        completeTHCOnboarding,
        completeCBDOnboarding,
        completeNeitherOnboarding,
        switchDemoPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
