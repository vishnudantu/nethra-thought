import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, Check, X, AlertCircle, UserCheck, Shield, Building2, Search, ToggleLeft,
  ToggleRight, Key, RefreshCw, Eye, EyeOff, LayoutDashboard, SlidersHorizontal,
  FileBarChart2, Sparkles, ClipboardCheck, Settings2, BadgeCheck, Ban
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Badge from '../components/ui/Badge';
import type { AdminReport, FeatureAccess, FeatureFlag, FeatureModule, ModuleAccess } from '../lib/types';

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

interface PoliticianOverview {
  id: string;
  full_name: string;
  party: string | null;
  designation: string | null;
  constituency_name: string | null;
  state: string | null;
  is_active: number;
  subscription_status: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  open_grievances: number | null;
  active_projects: number | null;
  upcoming_events: number | null;
  negative_mentions: number | null;
  high_threats: number | null;
  voice_reports: number | null;
  sentiment_avg: number | null;
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
  designation_type: 'mp_lok_sabha' | 'mp_rajya_sabha' | 'mla' | 'mlc' | 'mayor' | 'councillor';
  constituency_name: string;
  state: string;
  lok_sabha_seat: string;
  assembly_segment: string;
  email: string;
  password: string;
  slug: string;
  color_primary: string;
  color_secondary: string;
  election_year: string;
  term_start: string;
  previous_terms: string;
}

const DESIGNATION_CONFIG = {
  mp_lok_sabha: {
    label: 'MP — Lok Sabha',
    designation: 'Member of Parliament (Lok Sabha)',
    icon: '🏛️',
    color: '#00d4aa',
    fields: ['constituency_name','state','lok_sabha_seat','election_year','term_start','previous_terms'],
    modules: ['parliamentary_intelligence','mplads','lok_sabha_questions','lok_sabha_bills','darshan'],
    constituency_label: 'Lok Sabha Constituency',
    hint: 'Manages 543 Lok Sabha constituency. Gets MPLADS Rs.5 Cr/year. Parliamentary question tracking, darshan quota.',
  },
  mp_rajya_sabha: {
    label: 'MP — Rajya Sabha',
    designation: 'Member of Parliament (Rajya Sabha)',
    icon: '🏦',
    color: '#1e88e5',
    fields: ['state','election_year','term_start','previous_terms'],
    modules: ['parliamentary_intelligence','rajya_sabha_questions','rajya_sabha_bills'],
    constituency_label: 'State Represented',
    hint: 'Represents a state in the upper house. No constituency. No MPLADS. No darshan quota by default.',
  },
  mla: {
    label: 'MLA — State Assembly',
    designation: 'Member of Legislative Assembly',
    icon: '🏢',
    color: '#ffa726',
    fields: ['constituency_name','state','assembly_segment','election_year','term_start','previous_terms'],
    modules: ['constituency_management','mlalads','state_legislation','darshan'],
    constituency_label: 'Assembly Constituency',
    hint: 'State-level legislator. Manages Assembly constituency. Gets MLA LAD fund (varies by state). Local development focus.',
  },
  mlc: {
    label: 'MLC — State Council',
    designation: 'Member of Legislative Council',
    icon: '🏛️',
    color: '#a78bfa',
    fields: ['state','election_year','term_start'],
    modules: ['state_legislation','constituency_management'],
    constituency_label: 'State / Region',
    hint: 'Upper house of state legislature. Exists in select states (UP, Bihar, Maharashtra, Karnataka, Telangana, AP). No direct constituency.',
  },
  mayor: {
    label: 'Mayor',
    designation: 'Mayor',
    icon: '🏙️',
    color: '#00c864',
    fields: ['constituency_name','state','election_year','term_start'],
    modules: ['constituency_management','civic_infrastructure','darshan'],
    constituency_label: 'City / Municipality',
    hint: 'Urban local body head. City-level governance. Focus on civic infrastructure, sanitation, roads, water.',
  },
  councillor: {
    label: 'Councillor',
    designation: 'Municipal Councillor',
    icon: '🏘️',
    color: '#64b5f6',
    fields: ['constituency_name','state','assembly_segment','election_year'],
    modules: ['constituency_management','civic_infrastructure'],
    constituency_label: 'Ward / Division',
    hint: 'Ward-level representative. Hyper-local focus. Drainage, streetlights, parks, waste management.',
  },
};

const defaultForm: DeployForm = {
  full_name: '', party: '', designation: 'Member of Parliament (Lok Sabha)',
  designation_type: 'mp_lok_sabha',
  constituency_name: '', state: '', lok_sabha_seat: '', assembly_segment: '',
  email: '', password: '', slug: '', color_primary: '#00d4aa', color_secondary: '#1e88e5',
  election_year: '', term_start: '', previous_terms: '0',
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
  usage_count?: number;
  monthly_limit?: number;
}

const API_KEY_ITEMS = [
  { key_name: 'GEMINI_API_KEY', label: 'Gemini API Key' },
  { key_name: 'YOUTUBE_API_KEY', label: 'YouTube Data API Key' },
  { key_name: 'TWITTER_BEARER_TOKEN', label: 'X (Twitter) Bearer Token' },
  { key_name: 'WHATSAPP_WEBHOOK_SECRET', label: 'WhatsApp Webhook Secret' },
  { key_name: 'OPENAI_API_KEY', label: 'OpenAI API Key' },
  { key_name: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
];

export default function SuperAdmin({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { refreshPoliticians, user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'overview' | 'access' | 'reports' | 'users' | 'api-keys'>('overview');
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [overview, setOverview] = useState<PoliticianOverview[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [modules, setModules] = useState<FeatureModule[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [politicianModuleAccess, setPoliticianModuleAccess] = useState<ModuleAccess[]>([]);
  const [roleModuleAccess, setRoleModuleAccess] = useState<ModuleAccess[]>([]);
  const [politicianFeatureAccess, setPoliticianFeatureAccess] = useState<FeatureAccess[]>([]);
  const [roleFeatureAccess, setRoleFeatureAccess] = useState<FeatureAccess[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [founderMetrics, setFounderMetrics] = useState<{ total_politicians: number; total_users: number; open_alerts: number; recent_briefings: number; mrr: number } | null>(null);
  const [founderFeed, setFounderFeed] = useState<{ id: string; opponent_name: string; activity_type: string; description: string; created_at: string }[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [politicianKeys, setPoliticianKeys] = useState<ApiKeyRecord[]>([]);
  const [politicianKeyInputs, setPoliticianKeyInputs] = useState<Record<string, string>>({});
  const [politicianKeyLimits, setPoliticianKeyLimits] = useState<Record<string, string>>({});
  const [masterKeyConfigured, setMasterKeyConfigured] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('');
  const [presetStatus, setPresetStatus] = useState('');
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
  const [selectedAccessPolitician, setSelectedAccessPolitician] = useState<string>('');
  const [selectedApiPolitician, setSelectedApiPolitician] = useState<string>('');
  const [reportPoliticianId, setReportPoliticianId] = useState<string>('');
  const [reportStatus, setReportStatus] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [newModule, setNewModule] = useState({ module_key: '', label: '', category: '', description: '', is_future: false });
  const [newFeature, setNewFeature] = useState({ feature_key: '', label: '', module_key: '', description: '', is_future: false });
  const [showFounderProfile, setShowFounderProfile] = useState(false);
  const [founderName, setFounderName] = useState('');
  const [founderSaving, setFounderSaving] = useState(false);
  const [founderError, setFounderError] = useState('');

  useEffect(() => {
    fetchData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      setFounderName(user.display_name || '');
    }
  }, [user?.display_name, user?.role]);

  async function fetchData() {
    setLoading(true);
    try {
      const [polDataRaw, usersDataRaw, overviewData, moduleAccessData, featureAccessData, reportsData, dashboardData] = await Promise.all([
        api.get('/api/founder/politicians'),
        api.get('/api/founder/users'),
        api.get('/api/admin/politician-overview'),
        api.get('/api/founder/module-access'),
        api.get('/api/founder/feature-access'),
        api.get('/api/founder/reports'),
        api.get('/api/founder/dashboard'),
      ]);
      const polData = polDataRaw as Politician[];
      const usersData = usersDataRaw as ManagedUser[];
      const overviewRows = overviewData as PoliticianOverview[];
      const modulePayload = moduleAccessData as { modules: FeatureModule[]; politician_access: ModuleAccess[]; role_access: ModuleAccess[] };
      const featurePayload = featureAccessData as { features: FeatureFlag[]; politician_access: FeatureAccess[]; role_access: FeatureAccess[] };
      const reportRows = reportsData as AdminReport[];
      const dashboardPayload = dashboardData as { metrics?: { total_politicians: number; total_users: number; open_alerts: number; recent_briefings: number; mrr: number }; intelligence_feed?: { id: string; opponent_name: string; activity_type: string; description: string; created_at: string }[] };
      const enriched = usersData.map(r => ({
        ...r,
        politician_name: polData?.find(p => p.id === r.politician_id)?.full_name,
      }));
      setPoliticians(polData || []);
      setOverview(overviewRows || []);
      setUsers(enriched || []);
      setModules(modulePayload?.modules || []);
      setPoliticianModuleAccess(modulePayload?.politician_access || []);
      setRoleModuleAccess(modulePayload?.role_access || []);
      setFeatures(featurePayload?.features || []);
      setPoliticianFeatureAccess(featurePayload?.politician_access || []);
      setRoleFeatureAccess(featurePayload?.role_access || []);
      setReports(reportRows || []);
      setFounderMetrics(dashboardPayload?.metrics || null);
      setFounderFeed(dashboardPayload?.intelligence_feed || []);
      if (!selectedAccessPolitician && polData?.length) setSelectedAccessPolitician(polData[0].id);
      if (!selectedApiPolitician && polData?.length) setSelectedApiPolitician(polData[0].id);
      if (!reportPoliticianId && polData?.length) setReportPoliticianId(polData[0].id);
      try {
        const keyRes = await api.get('/api/founder/api-keys') as { keys: ApiKeyRecord[]; masterKeyConfigured: boolean };
        setApiKeys(keyRes?.keys || []);
        setMasterKeyConfigured(!!keyRes?.masterKeyConfigured);
      } catch {
        setApiKeys([]);
        setMasterKeyConfigured(false);
      }
    } catch (e) {
      console.error('[fetchData]', e);
    }
    setLoading(false);
  }

  async function fetchPoliticianKeys(politicianId: string) {
    if (!politicianId) return;
    try {
      const keys = await api.get(`/api/founder/politicians/${politicianId}/api-keys`) as ApiKeyRecord[];
      setPoliticianKeys(keys || []);
    } catch {
      setPoliticianKeys([]);
    }
  }

  useEffect(() => {
    if (selectedApiPolitician) {
      fetchPoliticianKeys(selectedApiPolitician);
    }
  }, [selectedApiPolitician]);

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
      await api.post('/api/founder/api-keys', { key_name: name, value });
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
      await api.delete(`/api/founder/api-keys/${name}`);
      setApiKeyStatus(`Removed ${name}`);
      await fetchData();
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch {
      setApiKeyStatus(`Failed to remove ${name}`);
    }
  }

  async function savePoliticianApiKey(name: string) {
    if (!selectedApiPolitician) return;
    const value = politicianKeyInputs[name];
    if (!value) return;
    const monthly_limit = Number(politicianKeyLimits[name] || 0);
    try {
      await api.put(`/api/founder/politicians/${selectedApiPolitician}/api-keys`, { key_name: name, value, monthly_limit });
      setApiKeyStatus(`Saved ${name} for politician`);
      setPoliticianKeyInputs(prev => ({ ...prev, [name]: '' }));
      await fetchPoliticianKeys(selectedApiPolitician);
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch {
      setApiKeyStatus(`Failed to save ${name} for politician`);
    }
  }

  async function deletePoliticianApiKey(name: string) {
    if (!selectedApiPolitician) return;
    try {
      await api.delete(`/api/founder/politicians/${selectedApiPolitician}/api-keys/${name}`);
      setApiKeyStatus(`Removed ${name} for politician`);
      await fetchPoliticianKeys(selectedApiPolitician);
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch {
      setApiKeyStatus(`Failed to remove ${name} for politician`);
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
      setDeployError('Please fill in all required fields: Name, Email, Password, Constituency.');
      return;
    }
    if (form.password.length < 8) {
      setDeployError('Password must be at least 8 characters.');
      return;
    }
    setDeploying(true);
    setDeployError('');
    setDeploySuccess('');

    try {
      const slug = form.slug || generateSlug(form.full_name);

      // Step 1 — Create politician profile
      const polData = await api.post('/api/founder/politicians', {
        full_name: form.full_name,
        party: form.party || '',
        designation: form.designation || DESIGNATION_CONFIG[form.designation_type].designation,
        constituency_name: form.constituency_name,
        state: form.state || '',
        lok_sabha_seat: form.lok_sabha_seat || '',
        slug,
        subscription_status: 'active',
        is_active: 1,
        color_primary: form.color_primary || '#00d4aa',
        color_secondary: form.color_secondary || '#1e88e5',
        role: 'politician',
        email: form.email,
        election_year: form.election_year ? parseInt(form.election_year) : null,
        term_start: form.term_start || null,
        previous_terms: parseInt(form.previous_terms) || 0,
        deployed_at: new Date().toISOString(),
      });

      if (!polData?.id) throw new Error('Server did not return a politician ID. Check server logs.');

      // Step 2 — Create login account
      const userData = await api.post('/api/founder/users', {
        email: form.email,
        password: form.password,
        role: 'politician_admin',
        politician_id: polData.id,
      });

      // Step 3 — Link auth_user_id back to politician profile
      if (userData?.id) {
        await api.put(`/api/founder/politicians/${polData.id}`, { auth_user_id: userData.id }).catch(() => {});
      }

      // Step 4 — Save constituency stats if autofill data available
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

      setDeploySuccess(`✓ ${form.full_name} deployed successfully! Login: ${form.email}`);
      setForm(defaultForm);
      setShowDeploy(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deployment failed. Please try again.';
      setDeployError(message);
    }
    setDeploying(false);

    // Refresh data separately so failures don't mask deploy success
    try {
      await fetchData();
      await refreshPoliticians();
    } catch {
      // Refresh failure is non-critical — deploy already succeeded
    }
  }

  async function togglePoliticianStatus(politician: Politician) {
    try {
      const newActive = !politician.is_active;
      const newStatus = newActive ? 'active' : 'suspended';
      await api.update('politician_profiles', politician.id, {
        subscription_status: newStatus,
        is_active: newActive ? 1 : 0,
      });
      setPoliticians(prev => prev.map(p =>
        p.id === politician.id ? { ...p, is_active: newActive, subscription_status: newStatus } : p
      ));
      refreshPoliticians();
    } catch (err: unknown) {
      console.error('Toggle failed:', err);
    }
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

  const derivedOverview = useMemo(() => overview.map((p) => {
    const openGrievances = p.open_grievances ?? 0;
    const negativeMentions = p.negative_mentions ?? 0;
    const highThreats = p.high_threats ?? 0;
    const activeProjects = p.active_projects ?? 0;
    const upcomingEvents = p.upcoming_events ?? 0;
    const voiceReports = p.voice_reports ?? 0;
    const sentiment = p.sentiment_avg ?? 50;
    const riskScore = Math.round(openGrievances * 0.6 + negativeMentions * 1.2 + highThreats * 2);
    const momentum = Math.round(activeProjects * 6 + upcomingEvents * 3 + voiceReports * 1.2);
    const performance = Math.max(0, Math.min(100, Math.round(sentiment + momentum - riskScore)));
    const winning = Math.max(0, Math.min(100, Math.round(sentiment * 0.7 + momentum * 0.4 - highThreats * 4 - negativeMentions)));
    const health = riskScore > 80 ? 'Critical' : riskScore > 40 ? 'Watch' : 'Healthy';
    const status = p.is_active === 1 && p.subscription_status === 'active' ? 'Live' : 'Offline';
    return { ...p, riskScore, momentum, performance, winning, health, status };
  }), [overview]);

  const filteredOverview = derivedOverview.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.constituency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.party?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    const total = politicians.length;
    const active = politicians.filter(p => p.is_active).length;
    const suspended = politicians.filter(p => !p.is_active).length;
    const live = derivedOverview.filter(p => p.status === 'Live').length;
    const critical = derivedOverview.filter(p => p.health === 'Critical').length;
    const avgPerf = derivedOverview.length ? Math.round(derivedOverview.reduce((sum, p) => sum + p.performance, 0) / derivedOverview.length) : 0;
    const avgWinning = derivedOverview.length ? Math.round(derivedOverview.reduce((sum, p) => sum + p.winning, 0) / derivedOverview.length) : 0;
    const openGrievances = derivedOverview.reduce((sum, p) => sum + (p.open_grievances || 0), 0);
    const highThreats = derivedOverview.reduce((sum, p) => sum + (p.high_threats || 0), 0);
    const avgSentimentRaw = derivedOverview.filter(p => p.sentiment_avg !== null).map(p => p.sentiment_avg as number);
    const avgSentiment = avgSentimentRaw.length ? Math.round(avgSentimentRaw.reduce((a, b) => a + b, 0) / avgSentimentRaw.length) : 0;
    return { total, active, suspended, live, critical, totalUsers: users.length, openGrievances, highThreats, avgSentiment, avgPerf, avgWinning };
  }, [politicians, derivedOverview, users.length]);

  const topPerformers = useMemo(() => (
    [...derivedOverview].sort((a, b) => b.performance - a.performance).slice(0, 6)
  ), [derivedOverview]);

  const riskWatch = useMemo(() => (
    [...derivedOverview].filter(p => p.health !== 'Healthy').sort((a, b) => b.riskScore - a.riskScore).slice(0, 6)
  ), [derivedOverview]);

  const futureModules = useMemo(() => modules.filter(m => m.is_future).slice(0, 6), [modules]);
  const futureFeatures = useMemo(() => features.filter(f => f.is_future).slice(0, 6), [features]);
  const activeModules = useMemo(() => modules.filter(m => m.is_active === 1).length, [modules]);
  const activeFeatures = useMemo(() => features.filter(f => f.is_active === 1).length, [features]);

  function getPoliticianModuleValue(politicianId: string, moduleKey: string) {
    const record = politicianModuleAccess.find(r => r.politician_id === politicianId && r.module_key === moduleKey);
    return record ? record.is_enabled === 1 : true;
  }

  function getRoleModuleValue(role: string, moduleKey: string) {
    const record = roleModuleAccess.find(r => r.role === role && r.module_key === moduleKey);
    return record ? record.is_enabled === 1 : true;
  }

  function getPoliticianFeatureValue(politicianId: string, featureKey: string) {
    const record = politicianFeatureAccess.find(r => r.politician_id === politicianId && r.feature_key === featureKey);
    return record ? record.is_enabled === 1 : true;
  }

  function getRoleFeatureValue(role: string, featureKey: string) {
    const record = roleFeatureAccess.find(r => r.role === role && r.feature_key === featureKey);
    return record ? record.is_enabled === 1 : true;
  }

  async function updateModuleAccess(payload: { module_key: string; politician_id?: string; role?: string; is_enabled: boolean }) {
    await api.post('/api/founder/module-access', payload);
    if (payload.politician_id) {
      setPoliticianModuleAccess(prev => {
        const filtered = prev.filter(r => !(r.politician_id === payload.politician_id && r.module_key === payload.module_key));
        return [...filtered, { id: 'temp', module_key: payload.module_key, politician_id: payload.politician_id, is_enabled: payload.is_enabled ? 1 : 0, updated_at: new Date().toISOString() }];
      });
    } else if (payload.role) {
      setRoleModuleAccess(prev => {
        const filtered = prev.filter(r => !(r.role === payload.role && r.module_key === payload.module_key));
        return [...filtered, { id: 'temp', module_key: payload.module_key, role: payload.role, is_enabled: payload.is_enabled ? 1 : 0, updated_at: new Date().toISOString() }];
      });
    }
  }

  async function updateFeatureAccess(payload: { feature_key: string; politician_id?: string; role?: string; is_enabled: boolean }) {
    await api.post('/api/founder/feature-access', payload);
    if (payload.politician_id) {
      setPoliticianFeatureAccess(prev => {
        const filtered = prev.filter(r => !(r.politician_id === payload.politician_id && r.feature_key === payload.feature_key));
        return [...filtered, { id: 'temp', feature_key: payload.feature_key, politician_id: payload.politician_id, is_enabled: payload.is_enabled ? 1 : 0, updated_at: new Date().toISOString() }];
      });
    } else if (payload.role) {
      setRoleFeatureAccess(prev => {
        const filtered = prev.filter(r => !(r.role === payload.role && r.feature_key === payload.feature_key));
        return [...filtered, { id: 'temp', feature_key: payload.feature_key, role: payload.role, is_enabled: payload.is_enabled ? 1 : 0, updated_at: new Date().toISOString() }];
      });
    }
  }

  async function applyPreset(preset: 'starter' | 'professional' | 'intelligence' | 'warroom') {
    if (!selectedAccessPolitician) return;
    try {
      await api.put(`/api/founder/politicians/${selectedAccessPolitician}/features`, { preset });
      setPresetStatus(`Applied ${preset} preset`);
      await fetchData();
      setTimeout(() => setPresetStatus(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply preset';
      setPresetStatus(message);
    }
  }

  async function updateModuleStatus(moduleKey: string, isActive: boolean) {
    const updated = await api.put(`/api/founder/feature-modules/${moduleKey}`, { is_active: isActive });
    setModules(prev => prev.map(m => m.module_key === moduleKey ? updated : m));
  }

  async function updateFeatureStatus(featureKey: string, isActive: boolean) {
    const updated = await api.put(`/api/founder/feature-flags/${featureKey}`, { is_active: isActive });
    setFeatures(prev => prev.map(f => f.feature_key === featureKey ? updated : f));
  }

  async function createModule() {
    if (!newModule.module_key || !newModule.label) return;
    await api.post('/api/founder/feature-modules', { ...newModule, is_future: newModule.is_future ? 1 : 0 });
    setNewModule({ module_key: '', label: '', category: '', description: '', is_future: false });
    setShowModuleModal(false);
    fetchData();
  }

  async function createFeature() {
    if (!newFeature.feature_key || !newFeature.label || !newFeature.module_key) return;
    await api.post('/api/founder/feature-flags', { ...newFeature, is_future: newFeature.is_future ? 1 : 0 });
    setNewFeature({ feature_key: '', label: '', module_key: '', description: '', is_future: false });
    setShowFeatureModal(false);
    fetchData();
  }

  async function generateWeeklyReport() {
    setGeneratingReport(true);
    setReportStatus('');
    try {
      await api.post('/api/founder/reports/weekly', reportPoliticianId ? { politician_id: reportPoliticianId } : {});
      setReportStatus('Weekly report generated.');
      const data = await api.get('/api/founder/reports') as AdminReport[];
      setReports(data || []);
      setTimeout(() => setReportStatus(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setReportStatus(message);
    }
    setGeneratingReport(false);
  }

  function healthVariant(health: string) {
    if (health === 'Critical') return 'danger';
    if (health === 'Watch') return 'warning';
    return 'success';
  }

  function statusVariant(status: string) {
    return status === 'Live' ? 'teal' : 'neutral';
  }

  function handleNavigate(page: string) {
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.location.href = page === 'website-admin' ? '/?page=website-admin' : '/';
    }
  }

  async function saveFounderProfile() {
    setFounderSaving(true);
    setFounderError('');
    try {
      await api.put('/api/founder/profile', { display_name: founderName.trim() });
      await refreshUser();
      setShowFounderProfile(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update founder profile';
      setFounderError(message);
    }
    setFounderSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>
            Super Admin Command Center
          </h1>
          <p style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>
            Platform intelligence, feature provisioning, and strategic oversight
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleNavigate('website-admin')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: 13 }}
          >
            <LayoutDashboard size={16} />
            Website CMS
          </button>
          <button
            onClick={() => { setFounderError(''); setShowFounderProfile(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: 13 }}
          >
            <Settings2 size={16} />
            Edit Founder Profile
          </button>
          <button
            onClick={() => { setShowDeploy(true); setDeployError(''); setDeploySuccess(''); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)', color: '#060b18', fontSize: 13 }}
          >
            <Plus size={16} />
            Deploy Politician
          </button>
        </div>
      </div>

      {founderMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Active Politicians', value: founderMetrics.total_politicians, color: '#00d4aa' },
            { label: 'Live Sessions', value: founderMetrics.total_users, color: '#42a5f5' },
            { label: 'Open Alerts', value: founderMetrics.open_alerts, color: '#ff5555' },
            { label: 'Recent Briefings', value: founderMetrics.recent_briefings, color: '#1e88e5' },
            { label: 'MRR (₹)', value: founderMetrics.mrr, color: '#00c864' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-xs font-semibold" style={{ color: '#8899bb' }}>{stat.label}</div>
              <div className="text-2xl font-bold mt-1" style={{ color: stat.color, fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Politicians', value: stats.total, color: '#00d4aa', icon: Building2 },
          { label: 'Live Now', value: stats.live, color: '#4caf90', icon: BadgeCheck },
          { label: 'At Risk', value: stats.critical, color: '#ff5555', icon: Ban },
          { label: 'Avg Performance', value: stats.avgPerf, color: '#42a5f5', icon: Sparkles },
          { label: 'Winning Index', value: stats.avgWinning, color: '#00d4aa', icon: ClipboardCheck },
          { label: 'High Threats', value: stats.highThreats, color: '#ff6b6b', icon: Shield },
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
          {([
            { key: 'overview', label: 'Overview', icon: LayoutDashboard },
            { key: 'access', label: 'Access Control', icon: SlidersHorizontal },
            { key: 'reports', label: 'Reports', icon: FileBarChart2 },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'api-keys', label: 'API Keys', icon: Key },
          ] as const).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                style={{
                  fontSize: 12,
                  background: tab === t.key ? 'rgba(0,212,170,0.12)' : 'transparent',
                  color: tab === t.key ? '#00d4aa' : '#8899bb',
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
          <div className="flex-1" />
          {tab === 'overview' && (
            <div className="flex items-center gap-2 mr-3">
              <Search size={14} style={{ color: '#8899bb' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search politicians..."
                className="py-1 px-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff', fontSize: 12, outline: 'none', width: 180 }}
              />
            </div>
          )}
          <button onClick={fetchData} className="w-8 h-8 flex items-center justify-center rounded-lg mr-2 transition-all" style={{ color: '#8899bb' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center" style={{ color: '#8899bb' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: 'rgba(0,212,170,0.2)', borderTopColor: '#00d4aa' }} />
            Loading...
          </div>
        ) : tab === 'overview' ? (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Founder Command Dashboard</div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>Live ops, performance rankings, and platform control</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setTab('reports'); setReportPoliticianId(''); }}
                  className="btn-secondary flex items-center gap-2">
                  <FileBarChart2 size={14} /> Generate Weekly Reports
                </button>
                <button onClick={() => { setTab('access'); }}
                  className="btn-primary flex items-center gap-2">
                  <Settings2 size={14} /> Manage Access
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Platform Health</div>
                  <Badge variant={stats.critical > 0 ? 'danger' : 'success'}>
                    {stats.critical > 0 ? `${stats.critical} Critical` : 'Stable'}
                  </Badge>
                </div>
                <div className="space-y-3 mt-4 text-xs" style={{ color: '#8899bb' }}>
                  <div className="flex items-center justify-between"><span>Live Politicians</span><span style={{ color: '#f0f4ff' }}>{stats.live}/{stats.total}</span></div>
                  <div className="flex items-center justify-between"><span>Active Modules</span><span style={{ color: '#f0f4ff' }}>{activeModules}</span></div>
                  <div className="flex items-center justify-between"><span>Active Features</span><span style={{ color: '#f0f4ff' }}>{activeFeatures}</span></div>
                  <div className="flex items-center justify-between"><span>Open Grievances</span><span style={{ color: '#f0f4ff' }}>{stats.openGrievances}</span></div>
                  <div className="flex items-center justify-between"><span>High Threats</span><span style={{ color: '#f0f4ff' }}>{stats.highThreats}</span></div>
                  <div className="flex items-center justify-between"><span>Avg Sentiment</span><span style={{ color: '#f0f4ff' }}>{stats.avgSentiment}</span></div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#8899bb' }}>
                    <span>Average Performance</span><span style={{ color: '#f0f4ff' }}>{stats.avgPerf}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${stats.avgPerf}%`, background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Top Performers</div>
                  <Badge variant="info">Winning Index</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {topPerformers.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${p.color_primary || '#00d4aa'}, ${p.color_secondary || '#1e88e5'})`, color: '#060b18' }}>
                        {p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm" style={{ color: '#f0f4ff' }}>{p.full_name}</div>
                        <div className="text-xs truncate" style={{ color: '#8899bb' }}>{p.constituency_name}</div>
                      </div>
                      <div className="text-xs font-semibold" style={{ color: '#00d4aa' }}>{p.performance}</div>
                    </div>
                  ))}
                  {topPerformers.length === 0 && (
                    <div className="text-xs" style={{ color: '#8899bb' }}>No performance data yet.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Risk Watch</div>
                  <Badge variant={riskWatch.length ? 'warning' : 'success'}>{riskWatch.length ? 'Needs Attention' : 'Clear'}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {riskWatch.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}>
                        !
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm" style={{ color: '#f0f4ff' }}>{p.full_name}</div>
                        <div className="text-xs truncate" style={{ color: '#8899bb' }}>{p.constituency_name}</div>
                      </div>
                      <Badge variant={healthVariant(p.health)}>{p.health}</Badge>
                    </div>
                  ))}
                  {riskWatch.length === 0 && (
                    <div className="text-xs" style={{ color: '#8899bb' }}>No high-risk profiles right now.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Platform Intelligence Feed</div>
                <Badge variant={founderFeed.length ? 'info' : 'neutral'}>{founderFeed.length ? 'Live' : 'Idle'}</Badge>
              </div>
              <div className="mt-4 space-y-3 text-xs" style={{ color: '#8899bb' }}>
                {founderFeed.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: 'rgba(0,212,170,0.7)' }} />
                    <div>
                      <div style={{ color: '#f0f4ff', fontSize: 12 }}>{item.opponent_name || 'Signal'} — {item.activity_type}</div>
                      <div style={{ color: '#8899bb' }}>{item.description}</div>
                    </div>
                  </div>
                ))}
                {!founderFeed.length && (
                  <div className="text-xs" style={{ color: '#8899bb' }}>No intelligence alerts right now.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Future Radar</div>
                  <Badge variant="warning">10-Year Vision</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...futureModules.map(m => m.label), ...futureFeatures.map(f => f.label)].slice(0, 8).map(item => (
                    <div key={item} className="rounded-xl px-3 py-2 text-xs"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#8899bb' }}>
                      {item}
                    </div>
                  ))}
                  {futureModules.length + futureFeatures.length === 0 && (
                    <div className="text-xs" style={{ color: '#8899bb' }}>No future-lab modules configured yet.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Founder Controls</div>
                <div className="text-xs mt-1" style={{ color: '#8899bb' }}>Assign modules, unlock features, and generate intelligence</div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => setTab('access')} className="btn-secondary text-xs flex items-center gap-2">
                    <SlidersHorizontal size={12} /> Module Access
                  </button>
                  <button onClick={() => setTab('reports')} className="btn-secondary text-xs flex items-center gap-2">
                    <FileBarChart2 size={12} /> Weekly Reports
                  </button>
                  <button onClick={() => setShowModuleModal(true)} className="btn-primary text-xs flex items-center gap-2">
                    <Plus size={12} /> Add Module
                  </button>
                  <button onClick={() => setShowFeatureModal(true)} className="btn-primary text-xs flex items-center gap-2">
                    <Plus size={12} /> Add Feature
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Politician Live Board</div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>Status, momentum, and winning analysis per constituency</div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredOverview.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card-hover rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold"
                        style={{ background: `linear-gradient(135deg, ${p.color_primary || '#00d4aa'}, ${p.color_secondary || '#1e88e5'})`, color: '#060b18' }}>
                        {p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: '#f0f4ff', fontSize: 15 }}>{p.full_name}</div>
                        <div style={{ fontSize: 11, color: '#8899bb' }}>{p.party} • {p.constituency_name}, {p.state}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                      <Badge variant={healthVariant(p.health)}>{p.health}</Badge>
                      <button
                        onClick={() => togglePoliticianStatus(p as unknown as Politician)}
                        className="px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 11 }}
                      >
                        {p.is_active ? <ToggleRight size={14} style={{ color: '#00d4aa' }} /> : <ToggleLeft size={14} />}
                        {p.is_active ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Performance', value: p.performance, color: '#00d4aa' },
                      { label: 'Winning Index', value: p.winning, color: '#42a5f5' },
                      { label: 'Momentum', value: p.momentum, color: '#ffa726' },
                    ].map(metric => (
                      <div key={metric.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: metric.color }}>{metric.value}</div>
                        <div style={{ fontSize: 10, color: '#8899bb' }}>{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs" style={{ color: '#8899bb' }}>
                      <span>Performance</span>
                      <span style={{ color: '#f0f4ff' }}>{p.performance}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${p.performance}%`, background: `linear-gradient(135deg, ${p.color_primary || '#00d4aa'}, ${p.color_secondary || '#1e88e5'})` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Open Grievances', value: p.open_grievances ?? 0, color: '#ff6b6b' },
                      { label: 'High Threats', value: p.high_threats ?? 0, color: '#ff7a59' },
                      { label: 'Sentiment Avg', value: p.sentiment_avg ?? 0, color: '#00d4aa' },
                    ].map(metric => (
                      <div key={metric.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: metric.color }}>{metric.value}</div>
                        <div style={{ fontSize: 10, color: '#8899bb' }}>{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => { setTab('access'); setSelectedAccessPolitician(p.id); }}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <SlidersHorizontal size={12} /> Configure Access
                    </button>
                    <button
                      onClick={() => { setTab('reports'); setReportPoliticianId(p.id); }}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <FileBarChart2 size={12} /> Generate Report
                    </button>
                    <button
                      onClick={() => deletePolitician(p.id)}
                      className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,85,85,0.08)', color: '#ff5555' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredOverview.length === 0 && (
              <div className="py-16 text-center" style={{ color: '#8899bb' }}>
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>No politicians found. Deploy a politician to get started.</p>
              </div>
            )}
          </div>
        ) : tab === 'access' ? (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Access Control & Module Provisioning</div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>Enable modules and advanced features per politician and role</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowModuleModal(true)} className="btn-secondary flex items-center gap-2">
                  <Plus size={14} /> Add Module
                </button>
                <button onClick={() => setShowFeatureModal(true)} className="btn-primary flex items-center gap-2">
                  <Plus size={14} /> Add Feature
                </button>
              </div>
            </div>

            {presetStatus && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>
                <Check size={14} />
                <span style={{ fontSize: 12 }}>{presetStatus}</span>
              </div>
            )}

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-semibold" style={{ color: '#f0f4ff' }}>Tier Presets</div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>Apply predefined access tiers per politician.</div>
                </div>
                <select
                  value={selectedAccessPolitician}
                  onChange={e => setSelectedAccessPolitician(e.target.value)}
                  className="input-field"
                  style={{ minWidth: 220 }}
                >
                  {politicians.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: 'starter', label: 'Starter' },
                  { key: 'professional', label: 'Professional' },
                  { key: 'intelligence', label: 'Intelligence' },
                  { key: 'warroom', label: 'War Room' },
                ].map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset.key as 'starter' | 'professional' | 'intelligence' | 'warroom')}
                    className="btn-secondary text-xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {modules.map(module => (
                <div key={module.module_key} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{module.label}</div>
                        {module.is_future === 1 && <Badge variant="warning">Future Lab</Badge>}
                      </div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{module.category}</div>
                      <div style={{ fontSize: 11, color: '#6677aa', marginTop: 4 }}>{module.description}</div>
                    </div>
                    <button
                      onClick={() => updateModuleStatus(module.module_key, module.is_active !== 1)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 11 }}
                    >
                      {module.is_active ? <ToggleRight size={14} style={{ color: '#00d4aa' }} /> : <ToggleLeft size={14} />}
                      {module.is_active ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-semibold" style={{ color: '#f0f4ff' }}>Politician Module Access</div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>Override access per politician</div>
                </div>
                <select
                  value={selectedAccessPolitician}
                  onChange={e => setSelectedAccessPolitician(e.target.value)}
                  className="input-field"
                  style={{ minWidth: 220 }}
                >
                  {politicians.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {modules.map(module => (
                  <div key={`${selectedAccessPolitician}-${module.module_key}`} className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#f0f4ff' }}>{module.label}</div>
                      <div style={{ fontSize: 10, color: '#8899bb' }}>{module.category}</div>
                    </div>
                    <button
                      onClick={() => updateModuleAccess({
                        module_key: module.module_key,
                        politician_id: selectedAccessPolitician,
                        is_enabled: !getPoliticianModuleValue(selectedAccessPolitician, module.module_key),
                      })}
                      className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 11 }}
                      disabled={!module.is_active}
                    >
                      {getPoliticianModuleValue(selectedAccessPolitician, module.module_key)
                        ? <ToggleRight size={14} style={{ color: '#00d4aa' }} />
                        : <ToggleLeft size={14} />}
                      {getPoliticianModuleValue(selectedAccessPolitician, module.module_key) ? 'On' : 'Off'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="font-semibold" style={{ color: '#f0f4ff' }}>Role Module Access</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Default access for each role</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {['politician_admin', 'staff', 'field_worker'].map(role => (
                  <div key={role} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: '#f0f4ff', marginBottom: 6 }}>
                      {role === 'politician_admin' ? 'Politician Admin' : role === 'staff' ? 'Staff' : 'Field Worker'}
                    </div>
                    <div className="space-y-2">
                      {modules.map(module => (
                        <div key={`${role}-${module.module_key}`} className="flex items-center justify-between">
                          <span style={{ fontSize: 11, color: '#8899bb' }}>{module.label}</span>
                          <button
                            onClick={() => updateModuleAccess({
                              module_key: module.module_key,
                              role,
                              is_enabled: !getRoleModuleValue(role, module.module_key),
                            })}
                            className="px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 10 }}
                            disabled={!module.is_active}
                          >
                            {getRoleModuleValue(role, module.module_key)
                              ? <ToggleRight size={12} style={{ color: '#00d4aa' }} />
                              : <ToggleLeft size={12} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="font-semibold" style={{ color: '#f0f4ff' }}>Feature Flags</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Enable advanced capabilities per politician and role</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {features.map(feature => (
                  <div key={feature.feature_key} className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <div style={{ fontSize: 12, color: '#f0f4ff' }}>{feature.label}</div>
                        {feature.is_future === 1 && <Badge variant="warning">Future</Badge>}
                      </div>
                      <div style={{ fontSize: 10, color: '#8899bb' }}>{feature.module_key}</div>
                      <div style={{ fontSize: 10, color: '#6677aa' }}>{feature.description}</div>
                    </div>
                    <button
                      onClick={() => updateFeatureStatus(feature.feature_key, feature.is_active !== 1)}
                      className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 11 }}
                    >
                      {feature.is_active ? <ToggleRight size={14} style={{ color: '#00d4aa' }} /> : <ToggleLeft size={14} />}
                      {feature.is_active ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#f0f4ff', marginBottom: 6 }}>Politician Feature Access</div>
                  <select
                    value={selectedAccessPolitician}
                    onChange={e => setSelectedAccessPolitician(e.target.value)}
                    className="input-field"
                    style={{ marginBottom: 10 }}
                  >
                    {politicians.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    {features.map(feature => (
                      <div key={`${selectedAccessPolitician}-${feature.feature_key}`} className="flex items-center justify-between">
                        <span style={{ fontSize: 11, color: '#8899bb' }}>{feature.label}</span>
                        <button
                          onClick={() => updateFeatureAccess({
                            feature_key: feature.feature_key,
                            politician_id: selectedAccessPolitician,
                            is_enabled: !getPoliticianFeatureValue(selectedAccessPolitician, feature.feature_key),
                          })}
                          className="px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 10 }}
                          disabled={!feature.is_active}
                        >
                          {getPoliticianFeatureValue(selectedAccessPolitician, feature.feature_key)
                            ? <ToggleRight size={12} style={{ color: '#00d4aa' }} />
                            : <ToggleLeft size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: '#f0f4ff', marginBottom: 6 }}>Role Feature Access</div>
                  <div className="space-y-3">
                    {['politician_admin', 'staff', 'field_worker'].map(role => (
                      <div key={role} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11, color: '#f0f4ff', marginBottom: 4 }}>
                          {role === 'politician_admin' ? 'Politician Admin' : role === 'staff' ? 'Staff' : 'Field Worker'}
                        </div>
                        {features.map(feature => (
                          <div key={`${role}-${feature.feature_key}`} className="flex items-center justify-between">
                            <span style={{ fontSize: 10, color: '#8899bb' }}>{feature.label}</span>
                            <button
                              onClick={() => updateFeatureAccess({
                                feature_key: feature.feature_key,
                                role,
                                is_enabled: !getRoleFeatureValue(role, feature.feature_key),
                              })}
                              className="px-2 py-1 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 10 }}
                              disabled={!feature.is_active}
                            >
                              {getRoleFeatureValue(role, feature.feature_key)
                                ? <ToggleRight size={12} style={{ color: '#00d4aa' }} />
                                : <ToggleLeft size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : tab === 'reports' ? (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Weekly Performance Reports</div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>Generate and track weekly performance snapshots</div>
              </div>
              <div className="flex items-center gap-2">
                <select className="input-field" value={reportPoliticianId} onChange={e => setReportPoliticianId(e.target.value)}>
                  <option value="">All Politicians</option>
                  {politicians.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <button onClick={generateWeeklyReport} className="btn-primary flex items-center gap-2" disabled={generatingReport}>
                  {generatingReport ? 'Generating...' : 'Generate Weekly Report'}
                </button>
              </div>
            </div>
            {reportStatus && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>
                <BadgeCheck size={14} />
                <span style={{ fontSize: 12 }}>{reportStatus}</span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reports.map(report => (
                <div key={report.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{report.title}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{new Date(report.created_at).toLocaleString('en-IN')}</div>
                    </div>
                    <Badge variant="success">Weekly</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: '#8899bb', marginTop: 8 }}>{report.summary}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setSelectedReport(report)} className="btn-secondary text-xs">View</button>
                    <button
                      onClick={() => copyToClipboard(report.content || report.summary || '', `report-${report.id}`)}
                      className="btn-primary text-xs"
                    >
                      {copied === `report-${report.id}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="py-12 text-center" style={{ color: '#8899bb' }}>
                  <FileBarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No reports yet. Generate a weekly report to get started.</p>
                </div>
              )}
            </div>
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
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="font-semibold" style={{ color: '#f0f4ff' }}>Platform API Keys</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Global keys used across the platform.</div>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold" style={{ color: '#f0f4ff' }}>Politician API Keys</div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>Assign keys per politician with monthly limits.</div>
                </div>
                <select
                  value={selectedApiPolitician}
                  onChange={e => setSelectedApiPolitician(e.target.value)}
                  className="input-field"
                  style={{ maxWidth: 240 }}
                >
                  {politicians.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {API_KEY_ITEMS.map(item => {
                  const existing = politicianKeys.find(k => k.key_name === item.key_name);
                  const usage = existing ? `${existing.usage_count || 0}/${existing.monthly_limit || 0 || '∞'}` : '0/∞';
                  return (
                    <div key={`pol-${item.key_name}`} className="glass-card rounded-2xl p-4">
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
                          placeholder="Paste key"
                          value={politicianKeyInputs[item.key_name] || ''}
                          onChange={e => setPoliticianKeyInputs(prev => ({ ...prev, [item.key_name]: e.target.value }))}
                        />
                        <input
                          className="input-field"
                          placeholder="Monthly limit"
                          value={politicianKeyLimits[item.key_name] || ''}
                          onChange={e => setPoliticianKeyLimits(prev => ({ ...prev, [item.key_name]: e.target.value }))}
                          style={{ maxWidth: 130 }}
                        />
                        <button
                          onClick={() => savePoliticianApiKey(item.key_name)}
                          className="btn-primary"
                          disabled={!masterKeyConfigured || !(politicianKeyInputs[item.key_name] || '').trim()}
                        >
                          Save
                        </button>
                        {existing?.is_active && (
                          <button
                            onClick={() => deletePoliticianApiKey(item.key_name)}
                            className="btn-secondary"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#6677aa', marginTop: 6 }}>
                        Usage: {usage}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : tab === 'users' ? (
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
        ) : null}
      </div>

      <AnimatePresence>
        {showDeploy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowDeploy(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>Deploy New Politician</h2>
                  <p style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Select designation first — fields auto-configure based on role</p>
                </div>
                <button onClick={() => setShowDeploy(false)} style={{ color: '#8899bb' }}><X size={20} /></button>
              </div>

              {/* STEP 1 — Designation Type Selector */}
              <div className="mb-6">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Designation *
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.entries(DESIGNATION_CONFIG) as [string, typeof DESIGNATION_CONFIG[keyof typeof DESIGNATION_CONFIG]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, designation_type: key as DeployForm['designation_type'], designation: cfg.designation }))}
                      className="rounded-xl p-3 text-left transition-all"
                      style={{
                        background: form.designation_type === key ? `${cfg.color}18` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.designation_type === key ? cfg.color + '55' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{cfg.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: form.designation_type === key ? cfg.color : '#f0f4ff' }}>{cfg.label}</div>
                    </button>
                  ))}
                </div>
                {/* Designation hint */}
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 11, color: '#8899bb' }}>
                    <strong style={{ color: '#00d4aa' }}>Auto-enabled modules: </strong>
                    {DESIGNATION_CONFIG[form.designation_type].modules.join(' · ')}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(136,153,187,0.6)', marginTop: 4 }}>
                    {DESIGNATION_CONFIG[form.designation_type].hint}
                  </p>
                </div>
              </div>

              <form onSubmit={handleDeploy} className="space-y-5">
                {deployError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777' }}>
                    <AlertCircle size={15} />
                    <span style={{ fontSize: 13 }}>{deployError}</span>
                  </div>
                )}

                {/* AI Auto-Fill */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', marginBottom: 8 }}>⚡ AI Auto-Fill — type name and click</div>
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
                      className="flex-1 input-field"
                    />
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      disabled={autofilling || !form.full_name.trim()}
                      className="px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 flex-shrink-0"
                      style={{
                        background: autofilling ? 'rgba(0,212,170,0.3)' : 'linear-gradient(135deg, #00d4aa, #1e88e5)',
                        color: '#060b18', cursor: autofilling || !form.full_name.trim() ? 'not-allowed' : 'pointer',
                        opacity: !form.full_name.trim() ? 0.5 : 1, border: 'none', minWidth: 100,
                      }}
                    >
                      {autofilling ? <><div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} />Filling...</> : '⚡ Auto-Fill'}
                    </button>
                  </div>
                  {autofillError && <p style={{ fontSize: 11, color: '#ff7777', marginTop: 6 }}>⚠ {autofillError}</p>}
                  {autofillSuccess && <p style={{ fontSize: 11, color: '#00d4aa', marginTop: 6 }}>✓ {autofillSuccess}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Party */}
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Political Party *</label>
                    <select value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))} className="input-field w-full">
                      <option value="">Select Party</option>
                      {['BJP','INC','TDP','YSRCP','AAP','TMC','SP','BSP','NCP','JDU','RJD','DMK','AIADMK','Shiv Sena','BRS','Independent','Other'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>State *</label>
                    <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input-field w-full">
                      <option value="">Select State</option>
                      {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Constituency — only for MP LS, MLA, Mayor, Councillor */}
                  {['mp_lok_sabha','mla','mayor','councillor'].includes(form.designation_type) && (
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>
                        {DESIGNATION_CONFIG[form.designation_type].constituency_label} *
                      </label>
                      <input value={form.constituency_name} onChange={e => setForm(f => ({ ...f, constituency_name: e.target.value }))}
                        placeholder={form.designation_type === 'mp_lok_sabha' ? 'e.g. Amalapuram' : form.designation_type === 'mla' ? 'e.g. Kakinada' : 'e.g. Hyderabad'}
                        className="input-field w-full" />
                    </div>
                  )}

                  {/* Lok Sabha Seat — MP only */}
                  {form.designation_type === 'mp_lok_sabha' && (
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Lok Sabha Seat Number</label>
                      <input value={form.lok_sabha_seat} onChange={e => setForm(f => ({ ...f, lok_sabha_seat: e.target.value }))}
                        placeholder="e.g. 7 (AP-07)" className="input-field w-full" />
                    </div>
                  )}

                  {/* Assembly Segment — MLA / Councillor */}
                  {['mla','councillor'].includes(form.designation_type) && (
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Assembly Segment</label>
                      <input value={form.assembly_segment} onChange={e => setForm(f => ({ ...f, assembly_segment: e.target.value }))}
                        placeholder="e.g. Kakinada City" className="input-field w-full" />
                    </div>
                  )}

                  {/* Election Year */}
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Election Year</label>
                    <select value={form.election_year} onChange={e => setForm(f => ({ ...f, election_year: e.target.value }))} className="input-field w-full">
                      <option value="">Select Year</option>
                      {[2024,2023,2022,2021,2020,2019,2018].map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>

                  {/* Term Start */}
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Term Start Date</label>
                    <input type="date" value={form.term_start} onChange={e => setForm(f => ({ ...f, term_start: e.target.value }))} className="input-field w-full" />
                  </div>

                  {/* Previous Terms */}
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Previous Terms</label>
                    <select value={form.previous_terms} onChange={e => setForm(f => ({ ...f, previous_terms: e.target.value }))} className="input-field w-full">
                      {[0,1,2,3,4,5].map(n => <option key={n} value={String(n)}>{n === 0 ? 'First Term' : `${n} Previous ${n === 1 ? 'Term' : 'Terms'}`}</option>)}
                    </select>
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Primary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.color_primary} onChange={e => setForm(f => ({ ...f, color_primary: e.target.value }))}
                        className="h-10 w-12 rounded-lg cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <input value={form.color_primary} onChange={e => setForm(f => ({ ...f, color_primary: e.target.value }))}
                        className="flex-1 input-field" style={{ fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.color_secondary} onChange={e => setForm(f => ({ ...f, color_secondary: e.target.value }))}
                        className="h-10 w-12 rounded-lg cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <input value={form.color_secondary} onChange={e => setForm(f => ({ ...f, color_secondary: e.target.value }))}
                        className="flex-1 input-field" style={{ fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  {/* Credentials section */}
                  <div className="sm:col-span-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Login Credentials</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Login Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="politician@example.com" className="input-field w-full" />
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
                          className="input-field w-full pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <button type="button" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                        className="px-3 py-2.5 rounded-xl flex items-center gap-1.5"
                        style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 12 }}>
                        <Key size={13} /> Generate
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(136,153,187,0.5)', marginTop: 5 }}>Share credentials securely with the politician.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowDeploy(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={deploying} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {deploying ? (
                      <><div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} />Deploying...</>
                    ) : (
                      <><Plus size={15} />Deploy {DESIGNATION_CONFIG[form.designation_type].label}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showModuleModal && (
          <motion.div className="modal-overlay" onClick={() => setShowModuleModal(false)}>
            <motion.div className="glass-card rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-white">Add New Module</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Module Key (e.g. smart-kiosk)</label>
                  <input className="input-field" value={newModule.module_key} onChange={e => setNewModule({...newModule, module_key: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Label</label>
                  <input className="input-field" value={newModule.label} onChange={e => setNewModule({...newModule, label: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category</label>
                  <input className="input-field" value={newModule.category} onChange={e => setNewModule({...newModule, category: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Description</label>
                  <textarea className="input-field" rows={2} value={newModule.description} onChange={e => setNewModule({...newModule, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={newModule.is_future} onChange={e => setNewModule({...newModule, is_future: e.target.checked})} />
                  <span className="text-sm text-gray-300">Mark as Future Lab / Experimental</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="btn-secondary flex-1" onClick={() => setShowModuleModal(false)}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={createModule}>Add Module</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showFeatureModal && (
          <motion.div className="modal-overlay" onClick={() => setShowFeatureModal(false)}>
            <motion.div className="glass-card rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-white">Add New Feature Flag</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Feature Key (e.g. auto-triage)</label>
                  <input className="input-field" value={newFeature.feature_key} onChange={e => setNewFeature({...newFeature, feature_key: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Label</label>
                  <input className="input-field" value={newFeature.label} onChange={e => setNewFeature({...newFeature, label: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Parent Module Key</label>
                  <select className="input-field" value={newFeature.module_key} onChange={e => setNewFeature({...newFeature, module_key: e.target.value})}>
                    <option value="">Select a module...</option>
                    {modules.map(m => <option key={m.module_key} value={m.module_key}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Description</label>
                  <textarea className="input-field" rows={2} value={newFeature.description} onChange={e => setNewFeature({...newFeature, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={newFeature.is_future} onChange={e => setNewFeature({...newFeature, is_future: e.target.checked})} />
                  <span className="text-sm text-gray-300">Mark as Future Lab / Experimental</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="btn-secondary flex-1" onClick={() => setShowFeatureModal(false)}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={createFeature}>Add Feature</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedReport && (
          <motion.div className="modal-overlay" onClick={() => setSelectedReport(null)}>
            <motion.div className="glass-card rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{selectedReport.title}</h2>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400"><X size={20} /></button>
              </div>
              <div className="text-sm text-gray-400 mb-6">{new Date(selectedReport.created_at).toLocaleString('en-IN')}</div>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
                  {selectedReport.content || selectedReport.summary}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFounderProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowFounderProfile(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>Founder Profile</h2>
                  <p style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Update the Super Admin display name</p>
                </div>
                <button onClick={() => setShowFounderProfile(false)} style={{ color: '#8899bb' }}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                {founderError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777' }}>
                    <AlertCircle size={15} />
                    <span style={{ fontSize: 13 }}>{founderError}</span>
                  </div>
                )}
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: '#8899bb' }}>Display Name</label>
                  <input
                    value={founderName}
                    onChange={e => setFounderName(e.target.value)}
                    placeholder="Founder name"
                    className="w-full px-4 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowFounderProfile(false)}
                    className="flex-1 py-2.5 rounded-xl font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontSize: 13 }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveFounderProfile}
                    disabled={founderSaving || !founderName.trim()}
                    className="flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    style={{ background: founderSaving || !founderName.trim() ? 'rgba(0,212,170,0.4)' : 'linear-gradient(135deg, #00d4aa, #1e88e5)', color: '#060b18', fontSize: 13, cursor: founderSaving || !founderName.trim() ? 'not-allowed' : 'pointer' }}
                  >
                    {founderSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
