import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface UserRole {
  id: string;
  role: 'super_admin' | 'politician_admin' | 'staff';
  politician_id: string | null;
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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  setActivePolitician: (p: PoliticianProfile) => void;
  refreshPoliticians: () => Promise<void>;
  session: { access_token: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRole | null>(null);
  const [activePolitician, setActivePoliticianState] = useState<PoliticianProfile | null>(null);
  const [allPoliticians, setAllPoliticians] = useState<PoliticianProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

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
        }).finally(() => setLoading(false));
      }).catch(() => {
        localStorage.removeItem('nethra_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const data = await api.login(email, password);
      localStorage.setItem('nethra_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setAllPoliticians(data.allPoliticians || []);
      setActivePoliticianState(data.politician || data.allPoliticians?.[0] || null);
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
  }

  function setActivePolitician(p: PoliticianProfile) {
    setActivePoliticianState(p);
    localStorage.setItem('nethra_active_politician', p.id);
  }

  async function refreshPoliticians() {
    const pols = await api.list('politicians') as PoliticianProfile[];
    setAllPoliticians(pols);
  }

  return (
    <AuthContext.Provider value={{
      user, userRole: user, activePolitician, allPoliticians, loading,
      signIn, signOut, setActivePolitician, refreshPoliticians,
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
