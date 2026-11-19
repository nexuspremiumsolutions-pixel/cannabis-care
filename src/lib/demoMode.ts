const DEMO_SESSION_KEY = 'cannabis_care_demo_mode';

/**
 * Retourne true uniquement si le mode démonstration a été explicitement activé
 * via `?demo=1` dans l'URL ou `VITE_ENABLE_DEMO_MODE=true`.
 * En production publique par défaut, retourne `false`.
 */
export function isDemoModeEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('demo');
    if (param === '1' || param === 'true') {
      sessionStorage.setItem(DEMO_SESSION_KEY, '1');
      return true;
    }
    if (param === '0' || param === 'false') {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      return false;
    }
    return sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
