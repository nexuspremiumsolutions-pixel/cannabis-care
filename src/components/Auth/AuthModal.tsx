import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Shield, Sparkles, Check, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { login, loginWithSocial, switchDemoPersona, register } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  // Consents for registration
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [healthDisclaimerAccepted, setHealthDisclaimerAccepted] = useState(true);
  const [gdprConsent, setGdprConsent] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants invalides');
      }
    } else {
      if (!termsAccepted || !healthDisclaimerAccepted || !gdprConsent) {
        setErrorMsg('Veuillez accepter les conditions et l’avertissement sanitaire pour continuer.');
        setIsLoading(false);
        return;
      }
      const res = await register(email, password, nickname, {
        termsAccepted,
        healthDisclaimerAccepted,
        gdprConsent,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Erreur lors de l'inscription");
      }
    }
    setIsLoading(false);
  };

  const fillQuickAccount = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsLogin(true);
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    // Identify persona
    let persona: 'thc' | 'cbd' | 'admin' | 'shop' = 'thc';
    if (quickEmail.includes('cbd')) persona = 'cbd';
    else if (quickEmail.includes('admin')) persona = 'admin';
    else if (quickEmail.includes('shop')) persona = 'shop';

    try {
      await switchDemoPersona(persona);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error switching demo persona:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    // If Supabase is configured, try Supabase OAuth
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          // If provider not configured in Supabase, fallback smoothly
          if (
            error.message.includes('not enabled') ||
            error.message.includes('Unsupported provider') ||
            error.message.includes('provider is disabled')
          ) {
            // Offer instant direct login with Google / Microsoft email
            const defaultSocialEmail = provider === 'google' ? 'mhzonesante@gmail.com' : 'utilisateur@outlook.fr';
            setInfoMsg(
              `Le SSO Supabase pour ${provider === 'google' ? 'Google' : 'Outlook'} n'est pas activé dans votre tableau de bord Supabase. Connexion directe en 1-clic avec ${defaultSocialEmail}...`
            );
            const res = await loginWithSocial(defaultSocialEmail, provider === 'google' ? 'Compte Google' : 'Compte Outlook', provider);
            if (!res.success) {
              setErrorMsg(res.error || 'Erreur lors de la connexion directe.');
            }
            return;
          } else {
            setErrorMsg(error.message);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur de connexion sociale';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Direct login fallback
      const defaultSocialEmail = provider === 'google' ? 'mhzonesante@gmail.com' : 'utilisateur@outlook.fr';
      const res = await loginWithSocial(defaultSocialEmail, provider === 'google' ? 'Compte Google' : 'Compte Outlook', provider);
      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de la connexion');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-6 border-b border-slate-800 text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#042416] shadow-lg border border-amber-400/50 mb-3 overflow-hidden">
            <img
              src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
              alt="Logo officiel CANNABIS CARE — Suivez, Équilibrez, Prenez Soin"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs uppercase tracking-widest text-teal-400 font-bold block mb-1">Nexus Premium Solutions</span>
          <h2 className="text-xl font-bold tracking-tight uppercase">CANNABIS CARE</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Plateforme sanitaire & bienveillante d&apos;accompagnement et de réduction des risques
          </p>

          {/* Quick Instant Free Access Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-2">
              ⚡ Démonstration Directe Sans Mot de Passe :
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('shop');
                  if (onClose) onClose();
                }}
                className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="text-base">🏪</span>
                <div>
                  <div className="text-amber-300 leading-tight">Espace Boutique</div>
                  <div className="text-[9px] text-amber-200/70 font-normal">Pour vos commerçants</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('admin');
                  if (onClose) onClose();
                }}
                className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="text-base">⚡</span>
                <div>
                  <div className="text-purple-300 leading-tight">Super Admin</div>
                  <div className="text-[9px] text-purple-200/70 font-normal">Supervision globale</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('cbd');
                  if (onClose) onClose();
                }}
                className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="text-base">🌸</span>
                <div>
                  <div className="text-emerald-300 leading-tight">Client CBD</div>
                  <div className="text-[9px] text-emerald-200/70 font-normal">Catalogue & Bien-être</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('thc');
                  if (onClose) onClose();
                }}
                className="p-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="text-base">🌿</span>
                <div>
                  <div className="text-teal-300 leading-tight">Client THC</div>
                  <div className="text-[9px] text-teal-200/70 font-normal">Suivi RDR & Journal</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              !isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 pb-2 space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('google')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('azure')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>Outlook / MS</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2.5 text-[11px] font-medium text-slate-400">
              ou avec votre mot de passe
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Pseudonyme / Prénom</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ex: Alex"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Adresse Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.fr"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* RGPD & Sanitary Checkboxes on Registration */}
          {!isLogin && (
            <div className="space-y-2.5 pt-2 text-xs text-slate-600">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={healthDisclaimerAccepted}
                  onChange={(e) => setHealthDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <span>
                  Je reconnais que CANNABIS CARE est un outil d&apos;accompagnement non médical et ne remplace pas un médecin.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-0.5 rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <span>
                  J&apos;accepte le traitement de mes données dans le respect strict du RGPD (données hébergées en sécurité).
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm py-3 rounded-xl transition shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? 'Traitement en cours...' : isLogin ? 'Se connecter à mon espace' : 'Créer mon compte sécurisé'}
          </button>

          {/* Demo test account helper */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-2">
              Comptes Démo (Connexion 1-clic) :
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fillQuickAccount('demo.thc@cannabiscare.fr', 'DemoCare2026!')}
                className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-left border border-teal-200 transition font-medium cursor-pointer shadow-2xs"
              >
                <div className="font-bold flex items-center gap-1">🌿 Parcours THC</div>
                <div className="text-[10px] text-teal-700">Julien (Sevrage/Réduction)</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fillQuickAccount('demo.cbd@cannabiscare.fr', 'DemoCare2026!')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-left border border-emerald-200 transition font-medium cursor-pointer shadow-2xs"
              >
                <div className="font-bold flex items-center gap-1">🌸 Parcours CBD</div>
                <div className="text-[10px] text-emerald-700">Claire (Bien-être/Sommeil)</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fillQuickAccount('admin@nexus.fr', 'AdminCare2026!')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-left border border-slate-300 transition font-medium cursor-pointer shadow-2xs"
              >
                <div className="font-bold flex items-center gap-1">⚡ Super Admin</div>
                <div className="text-[10px] text-slate-600">Back-office & Supervision</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fillQuickAccount('shop@nexus.fr', 'ShopCare2026!')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-left border border-amber-200 transition font-medium cursor-pointer shadow-2xs"
              >
                <div className="font-bold flex items-center gap-1">🏪 Commerçant</div>
                <div className="text-[10px] text-amber-700">Boutique Nexus Paris</div>
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              Mots de passe démo : <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">DemoCare2026!</code> ou <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">demo</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">AdminCare2026!</code> ou <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">admin</code>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
