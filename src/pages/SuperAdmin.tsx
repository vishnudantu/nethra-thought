import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Check, X, AlertCircle, UserCheck, Shield, Building2, Search, ToggleLeft, ToggleRight, Key, RefreshCw, Eye, EyeOff, Copy, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Badge from '../components/ui/Badge';

interface Politician {
  id: string;
  full_name: string;
  display_name: string | null;
  party: string | null;
  designation: string | null;
  constituency_name: string | null;
  state: string | null;
  slug: string | null;
  subscription_status: string | null;
  is_active: boolean;
  deployed_at: string | null;
  auth_user_id: string | null;
  color_primary: string | null;
  color_secondary: string | null;
}

interface ManagedUser {
  id: string;
  user_id: string;
  role: string;
  politician_id: string | null;
  created_at: string;
  email?: string;
  politician_name?: string;
}

interface DeployForm {
  full_name: string;
  party: string;
  designation: string;
  constituency_name: string;
  state: string;
  email: string;
  password: string;
  slug: string;
  color_primary: string;
  color_secondary: string;
}

const defaultForm: DeployForm = {
  full_name: '', party: '', designation: 'Member of Parliament',
  constituency_name: '', state: '', email: '', password: '',
  slug: '', color_primary: '#00d4aa', color_secondary: '#1e88e5',
};

interface AutofillExtra {
  constituency_name?: string;
  state?: string;
  constituency_stats?: {
    total_voters?: number;
    registered_voters?: number;
    area_sqkm?: number;
    population?: number;
    total_mandals?: number;
    total_villages?: number;
    total_booths?: number;
    literacy_rate?: number;
    sex_ratio?: number;
  };
  confidence?: string;
}

type AutofillWindow = Window & { __autofill_extra?: AutofillExtra };

interface ApiKeyRecord {
  key_name: string;
  key_hint?: string;
  is_active: number;
  updated_at?: string;
}

const API_KEY_ITEMS = [
  { key_name: 'GEMINI_API_KEY', label: 'Gemini API Key' },
  { key_name: 'YOUTUBE_API_KEY', label: 'YouTube Data API Key' },
  { key_name: 'TWITTER_BEARER_TOKEN', label: 'X (Twitter) Bearer Token' },
  { key_name: 'WHATSAPP_WEBHOOK_SECRET', label: 'WhatsApp Webhook Secret' },
  { key_name: 'OPENAI_API_KEY', label: 'OpenAI API Key' },
  { key_name: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
];

export default function SuperAdmin() {
  const { refreshPoliticians } = useAuth();
  const [tab, setTab] = useState<'politicians' | 'users' | 'api-keys'>('politicians');
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [masterKeyConfigured, setMasterKeyConfigured] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeploy, setShowDeploy] = useState(false);
  const [form, setForm] = useState<DeployForm>(defaultForm);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deploySuccess, setDeploySuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState('');
  const [autofilling, setAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState('');
  const [politicianType, setPoliticianType] = useState<'MP' | 'MLA'>('MP');
  const [autofillSuccess, setAutofillSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [polDataRaw, usersDataRaw] = await Promise.all([
      api.list('politician_profiles'),
      api.get('/api/admin/users'),
    ]);
    const polData = polDataRaw as Politician[];
    const usersData = usersDataRaw as ManagedUser[];
    const enriched = usersData.map(r => ({
      ...r,
      politician_name: polData?.find(p => p.id === r.politician_id)?.full_name,
    }));
    setPoliticians(polData || []);
    setUsers(enriched || []);
    try {
      const keyRes = await api.get('/api/admin/api-keys') as { keys: ApiKeyRecord[]; masterKeyConfigured: boolean };
      setApiKeys(keyRes?.keys || []);
      setMasterKeyConfigured(!!keyRes?.masterKeyConfigured);
    } catch {
      setApiKeys([]);
      setMasterKeyConfigured(false);
    }
    setLoading(false);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async function saveApiKey(name: string) {
    const value = keyInputs[name];
    if (!value) return;
    try {
      await api.post('/api/admin/api-keys', { key_name: name, value });
      setApiKeyStatus(`Saved ${name}`);
      setKeyInputs(prev => ({ ...prev, [name]: '' }));
      await fetchData();
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch {
      setApiKeyStatus(`Failed to save ${name}`);
    }
  }

  async function deleteApiKey(name: string) {
    try {
      await api.delete(`/api/admin/api-keys/${name}`);
      setApiKeyStatus(`Removed ${name}`);
      await fetchData();
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch {
      setApiKeyStatus(`Failed to remove ${name}`);
    }
  }

  async function handleAutoFill() {
    if (!form.full_name.trim()) {
      setAutofillError('Enter the politician name first');
      return;
    }
    setAutofilling(true);
    setAutofillError('');
    setAutofillSuccess('');
    try {
      const data = await api.post('/api/politician-autofill', { name: form.full_name, type: politicianType });
      const slug = generateSlug(data.full_name || form.full_name);
      setForm(prev => ({
        ...prev,
        full_name: data.full_name || prev.full_name,
        party: data.party || prev.party,
        designation: data.designation || prev.designation,
        constituency_name: data.constituency_name || prev.constituency_name,
        state: data.state || prev.state,
        slug: slug,
        color_primary: prev.color_primary,
        color_secondary: prev.color_secondary,
      }));
      // Store extra data for after profile creation
      (window as AutofillWindow).__autofill_extra = data;
      setAutofillSuccess(`Auto-filled from AI${data.confidence ? ' (confidence: ' + data.confidence + ')' : ''}. Review and adjust before saving.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not find politician data. Fill manually.';
      setAutofillError(message);
    }
    setAutofilling(false);
  }

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.constituency_name) {
      setDeployError('Please fill in all required fields.');
      return;
    }
    setDeploying(true);
    setDeployError('');
    setDeploySuccess('');

    try {
      const slug = form.slug || generateSlug(form.full_name);
      const polData = await api.create('politician_profiles', {
        full_name: form.full_name,
        party: form.party,
        designation: form.designation,
        constituency_name: form.constituency_name,
        state: form.state,
        slug,
        subscription_status: 'active',
        is_active: true,
        color_primary: form.color_primary,
        color_secondary: form.color_secondary,
        role: 'politician',
        email: form.email,
        deployed_at: new Date().toISOString(),
      });
      if (!polData?.id) throw new Error('Failed to create politician profile');

      await api.post('/api/admin/users', {
        email: form.email,
        password: form.password,
        role: 'politician_admin',
        politician_id: polData.id,
      });

      // Save constituency stats if autofill data available
      const extra = (window as AutofillWindow).__autofill_extra;
      if (extra?.constituency_stats && polData?.id) {
        const cs = extra.constituency_stats;
        await api.create('constituency_profiles', {
          politician_id: polData.id,
          constituency_name: extra.constituency_name || form.constituency_name,
          state: extra.state || form.state,
          total_voters: cs.total_voters ?? 0,
          registered_voters: cs.registered_voters ?? 0,
          area_sqkm: cs.area_sqkm ?? 0,
          population: cs.population ?? 0,
          total_mandals: cs.total_mandals ?? 0,
          total_villages: cs.total_villages ?? 0,
          total_booths: cs.total_booths ?? 0,
          literacy_rate: cs.literacy_rate ?? 0,
          sex_ratio: cs.sex_ratio ?? 0,
        }).catch(() => {});
        delete (window as AutofillWindow).__autofill_extra;
      }
      setDeploySuccess(`${form.full_name} has been deployed successfully! Login: ${form.email}`);
      setForm(defaultForm);
      setShowDeploy(false);
      await fetchData();
      await refreshPoliticians();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deployment failed. Please try again.';
      setDeployError(message);
    }
    setDeploying(false);
  }

  async function togglePoliticianStatus(politician: Politician) {
    await api.update('politician_profiles', politician.id, { subscription_status: politician.subscription_status === 'active' ? 'suspended' : 'active', is_active: !politician.is_active });
    setPoliticians(prev => prev.map(p => p.id === politician.id ? { ...p, is_active: !p.is_active, subscription_status: p.is_active ? 'suspended' : 'active' } : p));
    refreshPoliticians();
  }

  async function deletePolitician(id: string) {
    if (!window.confirm('Are you sure? This will permanently delete the politician and all their data.')) return;
    await api.remove('politician_profiles', id);
    setPoliticians(prev => prev.filter(p => p.id !== id));
    refreshPoliticians();
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  const filteredPoliticians = politicians.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.constituency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.party?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: politicians.length,
    active: politicians.filter(p => p.is_active).length,
    suspended: politicians.filter(p => !p.is_active).length,
    totalUsers: users.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>
            Platform Administration
          </h1>
          <p style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>
            Deploy and manage politician accounts across the platform
          </p>
        </div>
        <button
          onClick={() => { setShowDeploy(true); setDeployError(''); setDeploySuccess(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)', color: '#060b18', fontSize: 13 }}
        >
          <Plus size={16} />
          Deploy Politician
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Deployed', value: stats.total, color: '#00d4aa', icon: Building2 },
          { label: 'Active Accounts', value: stats.active, color: '#4caf90', icon: UserCheck },
          { label: 'Suspended', value: stats.suspended, color: '#ff9800', icon: Shield },
          { label: 'Platform Users', value: stats.totalUsers, color: '#1e88e5', icon: Users },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                  <Icon size={17} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#8899bb' }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {deploySuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: '#00d4aa' }}
        >
          <Check size={18} />
          <span style={{ fontSize: 14 }}>{deploySuccess}</span>
          <button onClick={() => setDeploySuccess('')} className="ml-auto"><X size={16} /></button>
        </motion.div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-0 p-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {(['politicians', 'users', 'api-keys'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg font-medium transition-all"
              style={{
                fontSize: 13,
                background: tab === t ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: tab === t ? '#00d4aa' : '#8899bb',
              }}
            >
              {t === 'politicians'
                ? `Deployed Politicians (${politicians.length})`
                : t === 'users'
                ? `Platform Users (${users.length})`
                : 'API Keys'}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 mr-3">
            <Search size={14} style={{ color: '#8899bb' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="py-1 px-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff', fontSize: 12, outline: 'none', width: 160 }}
            />
          </div>
          <button onClick={fetchData} className="w-8 h-8 flex items-center justify-center rounded-lg mr-2 transition-all" style={{ color: '#8899bb' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center" style={{ color: '#8899bb' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: 'rgba(0,212,170,0.2)', borderTopColor: '#00d4aa' }} />
            Loading...
          </div>
        ) : tab === 'api-keys' ? (
          <div className="p-5 space-y-4">
            {!masterKeyConfigured && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777' }}>
                <AlertCircle size={15} />
                <span style={{ fontSize: 13 }}>API_KEYS_MASTER_KEY is not configured on the server.</span>
              </div>
            )}
            {apiKeyStatus && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>
                <Check size={14} />
                <span style={{ fontSize: 13 }}>{apiKeyStatus}</span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {API_KEY_ITEMS.map(item => {
                const existing = apiKeys.find(k => k.key_name === item.key_name);
                return (
                  <div key={item.key_name} className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: '#8899bb' }}>{item.key_name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={existing?.is_active ? 'success' : 'neutral'}>
                          {existing?.is_active ? 'Active' : 'Not Set'}
                        </Badge>
                        {existing?.key_hint && (
                          <span style={{ fontSize: 11, color: '#8899bb' }}>{existing.key_hint}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Paste new key"
                        value={keyInputs[item.key_name] || ''}
                        onChange={e => setKeyInputs(prev => ({ ...prev, [item.key_name]: e.target.value }))}
                      />
                      <button
                        onClick={() => saveApiKey(item.key_name)}
                        className="btn-primary"
                        disabled={!masterKeyConfigured || !(keyInputs[item.key_name] || '').trim()}
                      >
                        Save
                      </button>
                      {existing?.is_active && (
                        <button
                          onClick={() => deleteApiKey(item.key_name)}
                          className="btn-secondary"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {existing?.updated_at && (
                      <div style={{ fontSize: 11, color: '#6677aa', marginTop: 6 }}>
                        Updated: {new Date(existing.updated_at).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : tab === 'politicians' ? (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {filteredPoliticians.length === 0 ? (
              <div className="py-16 text-center" style={{ color: '#8899bb' }}>
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>No politicians deployed yet. Click "Deploy Politician" to get started.</p>
              </div>
            ) : filteredPoliticians.map(politician => (
              <div key={politician.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${politician.color_primary || '#00d4aa'}, ${politician.color_secondary || '#1e88e5'})`, color: '#060b18' }}>
                  {politician.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14 }}>{politician.full_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                      background: politician.is_active ? 'rgba(0,212,170,0.12)' : 'rgba(255,85,85,0.12)',
                      color: politician.is_active ? '#00d4aa' : '#ff5555',
                      border: `1px solid ${politician.is_active ? 'rgba(0,212,170,0.2)' : 'rgba(255,85,85,0.2)'}`,
                    }}>
                      {politician.subscription_status || 'active'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>
                    {politician.party} • {politician.constituency_name}, {politician.state}
                  </div>
                  {politician.slug && (
                    <div className="flex items-center gap-1 mt-1">
                      <span style={{ fontSize: 11, color: 'rgba(136,153,187,0.5)', fontFamily: 'monospace' }}>/{politician.slug}</span>
                      <button onClick={() => copyToClipboard(politician.slug!, politician.id)} style={{ color: '#8899bb' }}>
                        {copied === politician.id ? <CheckCheck size={11} style={{ color: '#00d4aa' }} /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePoliticianStatus(politician)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 12 }}
                  >
                    {politician.is_active ? <ToggleRight size={15} style={{ color: '#00d4aa' }} /> : <ToggleLeft size={15} />}
                    {politician.is_active ? 'Active' : 'Suspended'}
                  </button>
                  <button
                    onClick={() => deletePolitician(politician.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,85,85,0.08)', color: '#ff5555' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {users.length === 0 ? (
              <div className="py-16 text-center" style={{ color: '#8899bb' }}>
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>No platform users yet.</p>
              </div>
            ) : users.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}>
                  <UserCheck size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: '#f0f4ff', fontSize: 13 }}>{u.email || u.user_id.slice(0, 8) + '...'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                      background: u.role === 'super_admin' ? 'rgba(255,152,0,0.12)' : 'rgba(0,212,170,0.12)',
                      color: u.role === 'super_admin' ? '#ff9800' : '#00d4aa',
                    }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  {u.politician_name && (
                    <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Manages: {u.politician_name}</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(136,153,187,0.5)' }}>
                  {new Date(u.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeploy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowDeploy(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>Deploy New Politician</h2>
                  <p style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Create a new politician account on the platform</p>
                </div>
                <button onClick={() => setShowDeploy(false)} style={{ color: '#8899bb' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleDeploy} className="p-6 space-y-5">
                {deployError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777' }}>
                    <AlertCircle size={15} />
                    <span style={{ fontSize: 13 }}>{deployError}</span>
                  </div>
                )}

                {/* ── AUTO-FILL SECTION ── */}
                <div className="rounded-xl p-4 mb-2" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#00d4aa' }}>⚡ AI Auto-Fill</span>
                    <span style={{ fontSize: 11, color: '#8899bb' }}>— Enter name below, select type, click Auto-Fill</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setPoliticianType('MP')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: politicianType === 'MP' ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)', color: politicianType === 'MP' ? '#00d4aa' : '#8899bb', border: `1px solid ${politicianType === 'MP' ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                      MP (Lok Sabha)
                    </button>
                    <button type="button" onClick={() => setPoliticianType('MLA')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: politicianType === 'MLA' ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)', color: politicianType === 'MLA' ? '#00d4aa' : '#8899bb', border: `1px solid ${politicianType === 'MLA' ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                      MLA (State Assembly)
                    </button>
                  </div>
                  {autofillError && <div style={{ fontSize: 11, color: '#ff7777', marginBottom: 6 }}>⚠ {autofillError}</div>}
                  {autofillSuccess && <div style={{ fontSize: 11, color: '#00d4aa', marginBottom: 6 }}>✓ {autofillSuccess}</div>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Full Name *</label>
                    <div className="flex gap-2">
                      <input
                        value={form.full_name}
                        onChange={e => {
                          const name = e.target.value;
                          setForm(f => ({ ...f, full_name: name, slug: generateSlug(name) }));
                          setAutofillError('');
                          setAutofillSuccess('');
                        }}
                        placeholder="e.g. GM Harish Balayogi"
                        className="flex-1 px-4 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        disabled={autofilling || !form.full_name.trim()}
                        className="px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 flex-shrink-0"
                        style={{
                          background: autofilling ? 'rgba(0,212,170,0.3)' : 'linear-gradient(135deg, #00d4aa, #1e88e5)',
                          color: '#060b18',
                          cursor: autofilling || !form.full_name.trim() ? 'not-allowed' : 'pointer',
                          opacity: !form.full_name.trim() ? 0.5 : 1,
                          border: 'none',
                          minWidth: 100,
                        }}
                      >
                        {autofilling ? (
                          <><div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> Searching...</>
                        ) : (
                          <>⚡ Auto-Fill</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Political Party *</label>
                    <input
                      value={form.party}
                      onChange={e => setForm(f => ({ ...f, party: e.target.value }))}
                      placeholder="e.g. Telugu Desam Party"
                      className="w-full px-4 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Designation</label>
                    <input
                      value={form.designation}
                      onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                      placeholder="e.g. Member of Parliament"
                      className="w-full px-4 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Constituency *</label>
                    <input
                      value={form.constituency_name}
                      onChange={e => setForm(f => ({ ...f, constituency_name: e.target.value }))}
                      placeholder="e.g. Guntur"
                      className="w-full px-4 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>State</label>
                    <input
                      value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                      placeholder="e.g. Andhra Pradesh"
                      className="w-full px-4 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Primary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.color_primary} onChange={e => setForm(f => ({ ...f, color_primary: e.target.value }))}
                        className="h-10 w-12 rounded-lg cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <input value={form.color_primary} onChange={e => setForm(f => ({ ...f, color_primary: e.target.value }))}
                        className="flex-1 px-4 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.color_secondary} onChange={e => setForm(f => ({ ...f, color_secondary: e.target.value }))}
                        className="h-10 w-12 rounded-lg cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <input value={form.color_secondary} onChange={e => setForm(f => ({ ...f, color_secondary: e.target.value }))}
                        className="flex-1 px-4 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  <div className="sm:col-span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: '#8899bb', letterSpacing: '0.5px' }}>LOGIN CREDENTIALS</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Login Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="politician@example.com"
                      className="w-full px-4 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Password *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Min 8 characters"
                          className="w-full px-4 py-2.5 pr-10 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                        className="px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                        style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 12 }}
                      >
                        <Key size={13} />
                        Generate
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(136,153,187,0.5)', marginTop: 5 }}>
                      Share these credentials securely with the politician.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowDeploy(false)}
                    className="flex-1 py-2.5 rounded-xl font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 13 }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deploying}
                    className="flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    style={{ background: deploying ? 'rgba(0,212,170,0.4)' : 'linear-gradient(135deg, #00d4aa, #1e88e5)', color: '#060b18', fontSize: 13, cursor: deploying ? 'not-allowed' : 'pointer' }}
                  >
                    {deploying ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        Deploy Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
