import { createContext, useContext, useEffect, useState } from 'react';
/* eslint-disable react-refresh/only-export-components */
import { api } from './api';

export interface UserRole {
  id: string;
  email?: string;
  role: 'super_admin' | 'politician_admin' | 'staff';
  politician_id: string | null;
  two_factor_enabled?: boolean;
}

export interface PoliticianProfile {
  id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
  party: string | null;
  designation: string | null;
  constituency_name: string | null;
  state: string | null;
  slug: string | null;
  subscription_status: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: UserRole | null;
  userRole: UserRole | null;
  activePolitician: PoliticianProfile | null;
  allPoliticians: PoliticianProfile[];
  loading: boolean;
  moduleAccess: Record<string, boolean>;
  featureAccess: Record<string, boolean>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requires2fa?: boolean; email?: string }>;
  verify2fa: (email: string, code: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  setActivePolitician: (p: PoliticianProfile) => void;
  refreshPoliticians: () => Promise<void>;
  refreshAccess: () => Promise<void>;
  hasModule: (key: string) => boolean;
  hasFeature: (key: string) => boolean;
  session: { access_token: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRole | null>(null);
  const [activePolitician, setActivePoliticianState] = useState<PoliticianProfile | null>(null);
  const [allPoliticians, setAllPoliticians] = useState<PoliticianProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [featureAccess, setFeatureAccess] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem('nethra_token');
    if (stored) {
      setToken(stored);
      api.me().then(u => {
        setUser(u);
        api.list('politicians').then((pols: PoliticianProfile[]) => {
          setAllPoliticians(pols);
          const storedPol = localStorage.getItem('nethra_active_politician');
          const found = storedPol ? pols.find(p => p.id === storedPol) : null;
          setActivePoliticianState(found || pols[0] || null);
        }).then(() => refreshAccess()).finally(() => setLoading(false));
      }).catch(() => {
        localStorage.removeItem('nethra_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyLogin(data: { token: string; user: UserRole; politician?: PoliticianProfile | null; allPoliticians?: PoliticianProfile[] }) {
    localStorage.setItem('nethra_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAllPoliticians(data.allPoliticians || []);
    setActivePoliticianState(data.politician || data.allPoliticians?.[0] || null);
    await refreshAccess();
  }

  async function signIn(email: string, password: string) {
    try {
      const data = await api.login(email, password) as { requires_2fa?: boolean; email?: string; token?: string; user?: UserRole; politician?: PoliticianProfile; allPoliticians?: PoliticianProfile[] };
      if (data.requires_2fa) return { error: null, requires2fa: true, email: data.email };
      if (data.token && data.user) {
        await applyLogin(data as { token: string; user: UserRole; politician?: PoliticianProfile; allPoliticians?: PoliticianProfile[] });
      }
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  }

  async function verify2fa(email: string, code: string) {
    try {
      const data = await api.post('/api/auth/2fa/verify', { email, code }) as { token: string; user: UserRole; politician?: PoliticianProfile; allPoliticians?: PoliticianProfile[] };
      await applyLogin(data);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  }

  function signOut() {
    localStorage.removeItem('nethra_token');
    localStorage.removeItem('nethra_active_politician');
    setUser(null);
    setActivePoliticianState(null);
    setAllPoliticians([]);
    setToken(null);
    setModuleAccess({});
    setFeatureAccess({});
  }

  function setActivePolitician(p: PoliticianProfile) {
    setActivePoliticianState(p);
    localStorage.setItem('nethra_active_politician', p.id);
  }

  async function refreshPoliticians() {
    const pols = await api.list('politicians') as PoliticianProfile[];
    setAllPoliticians(pols);
  }

  async function refreshAccess() {
    const current = token || localStorage.getItem('nethra_token');
    if (!current) return;
    try {
      const data = await api.get('/api/access/summary') as {
        modules: string[];
        features: string[];
        moduleAccess?: Record<string, boolean>;
        featureAccess?: Record<string, boolean>;
      };
      if (data?.moduleAccess && Object.keys(data.moduleAccess).length) {
        setModuleAccess(data.moduleAccess);
      } else {
        const fallback = Object.fromEntries((data?.modules || []).map(key => [key, true]));
        setModuleAccess(fallback);
      }
      if (data?.featureAccess && Object.keys(data.featureAccess).length) {
        setFeatureAccess(data.featureAccess);
      } else {
        const fallback = Object.fromEntries((data?.features || []).map(key => [key, true]));
        setFeatureAccess(fallback);
      }
    } catch {
      setModuleAccess({});
      setFeatureAccess({});
    }
  }

  function hasModule(key: string) {
    if (user?.role === 'super_admin') return true;
    if (key in moduleAccess) return !!moduleAccess[key];
    return true;
  }

  function hasFeature(key: string) {
    if (user?.role === 'super_admin') return true;
    if (key in featureAccess) return !!featureAccess[key];
    return true;
  }

  return (
    <AuthContext.Provider value={{
      user, userRole: user, activePolitician, allPoliticians, loading,
      signIn, verify2fa, signOut, setActivePolitician, refreshPoliticians,
      refreshAccess, moduleAccess, featureAccess, hasModule, hasFeature,
      session: token ? { access_token: token } : null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
