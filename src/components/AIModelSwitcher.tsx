import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ChevronDown, Check, Zap, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface Provider {
  id: string;
  name: string;
  models: { id: string; label: string; speed: string; quality: string; free: boolean }[];
  keyName: string;
  color: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'groq', name: 'Groq', color: '#f55036', keyName: 'GROQ_API_KEY',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', speed: 'Ultra Fast', quality: 'Excellent', free: true },
      { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B',  speed: 'Instant',   quality: 'Good',      free: true },
      { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B',  speed: 'Fast',      quality: 'Very Good', free: true },
      { id: 'gemma2-9b-it',            label: 'Gemma 2 9B',    speed: 'Fast',      quality: 'Good',      free: true },
    ],
  },
  {
    id: 'gemini', name: 'Google Gemini', color: '#4285f4', keyName: 'GEMINI_API_KEY',
    models: [
      { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash', speed: 'Fast',   quality: 'Very Good', free: true },
      { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro',   speed: 'Medium', quality: 'Excellent', free: false },
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash', speed: 'Fast',   quality: 'Excellent', free: false },
    ],
  },
  {
    id: 'mistral', name: 'Mistral AI', color: '#ff7000', keyName: 'MISTRAL_API_KEY',
    models: [
      { id: 'mistral-small-latest',  label: 'Mistral Small',  speed: 'Fast',   quality: 'Very Good', free: false },
      { id: 'mistral-medium-latest', label: 'Mistral Medium', speed: 'Medium', quality: 'Excellent', free: false },
      { id: 'open-mistral-7b',       label: 'Mistral 7B',     speed: 'Fast',   quality: 'Good',      free: false },
    ],
  },
  {
    id: 'openrouter', name: 'OpenRouter', color: '#7c3aed', keyName: 'OPENROUTER_API_KEY',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)', speed: 'Medium', quality: 'Excellent', free: true },
      { id: 'mistralai/mistral-7b-instruct:free',      label: 'Mistral 7B (Free)',    speed: 'Fast',   quality: 'Good',      free: true },
      { id: 'google/gemma-2-9b-it:free',               label: 'Gemma 2 9B (Free)',    speed: 'Fast',   quality: 'Good',      free: true },
      { id: 'anthropic/claude-3.5-sonnet',             label: 'Claude 3.5 Sonnet',    speed: 'Medium', quality: 'Best',      free: false },
      { id: 'openai/gpt-4o-mini',                      label: 'GPT-4o Mini',          speed: 'Fast',   quality: 'Very Good', free: false },
    ],
  },
  {
    id: 'nvidia', name: 'Nvidia NIM', color: '#76b900', keyName: 'NVIDIA_API_KEY',
    models: [
      { id: 'meta/llama-3.3-70b-instruct',  label: 'Llama 3.3 70B',   speed: 'Fast',   quality: 'Excellent', free: false },
      { id: 'mistralai/mistral-large-2-instruct', label: 'Mistral Large', speed: 'Medium', quality: 'Excellent', free: false },
      { id: 'meta/llama-3.1-8b-instruct',   label: 'Llama 3.1 8B',    speed: 'Fast',   quality: 'Good',      free: false },
    ],
  },
];

const INDIAN_LANGUAGES = [
  { code: 'english', label: 'English', script: 'Aa' },
  { code: 'telugu',  label: 'తెలుగు',  script: 'త' },
  { code: 'hindi',   label: 'हिंदी',   script: 'ह' },
  { code: 'tamil',   label: 'தமிழ்',   script: 'த' },
  { code: 'kannada', label: 'ಕನ್ನಡ',   script: 'ಕ' },
  { code: 'malayalam', label: 'മലയാളം', script: 'മ' },
  { code: 'marathi', label: 'मराठी',   script: 'म' },
  { code: 'bengali', label: 'বাংলা',   script: 'ব' },
  { code: 'gujarati', label: 'ગુજરાતી', script: 'ગ' },
  { code: 'punjabi', label: 'ਪੰਜਾਬੀ',  script: 'ਪ' },
  { code: 'odia',    label: 'ଓଡ଼ିଆ',  script: 'ଓ' },
  { code: 'urdu',    label: 'اردو',    script: 'ا' },
  { code: 'assamese', label: 'অসমীয়া', script: 'অ' },
  { code: 'maithili', label: 'मैथिली', script: 'म' },
  { code: 'konkani',  label: 'कोंकणी', script: 'क' },
  { code: 'manipuri', label: 'মৈতৈলোন্', script: 'ম' },
  { code: 'nepali',   label: 'नेपाली',  script: 'न' },
  { code: 'sanskrit', label: 'संस्कृत', script: 'स' },
  { code: 'sindhi',   label: 'سنڌي',   script: 'س' },
  { code: 'bodo',     label: 'बड़ो',    script: 'ब' },
  { code: 'dogri',    label: 'डोगरी',  script: 'ड' },
  { code: 'kashmiri', label: 'کٲشُر',  script: 'ک' },
  { code: 'santhali', label: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'ᱥ' },
];

export default function AIModelSwitcher({ compact = false }: { compact?: boolean }) {
  const { session } = useAuth();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const w = useW();
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('groq');
  const [activeModel, setActiveModel] = useState('llama-3.3-70b-versatile');
  const [activeLanguage, setActiveLanguage] = useState('english');
  const [providerStatus, setProviderStatus] = useState<Record<string, 'ok' | 'error' | 'no_key' | 'checking'>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [tab, setTab] = useState<'model' | 'language'>('model');

  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  async function loadCurrentSettings() {
    try {
      const r = await fetch('/api/founder/settings', { headers: h });
      if (r.ok) {
        const d = await r.json();
        if (d.ai_provider) setActiveProvider(d.ai_provider);
        if (d.ai_model)    setActiveModel(d.ai_model);
        if (d.ai_language) setActiveLanguage(d.ai_language);
      }
    } catch (_) {}
  }

  async function testProvider(providerId: string) {
    setProviderStatus(s => ({ ...s, [providerId]: 'checking' }));
    try {
      const r = await fetch('/api/ai-debug', {
        method: 'POST', headers: h, body: JSON.stringify({ provider: providerId }),
      });
      if (r.ok) {
        const d = await r.json();
        const result = d.results?.[providerId.toUpperCase()];
        setProviderStatus(s => ({ ...s, [providerId]: result?.status === 'OK' ? 'ok' : result?.status === 'NO_KEY' ? 'no_key' : 'error' }));
      }
    } catch (_) {
      setProviderStatus(s => ({ ...s, [providerId]: 'error' }));
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const r = await fetch('/api/founder/settings', {
        method: 'POST', headers: h,
        body: JSON.stringify({ ai_provider: activeProvider, ai_model: activeModel, ai_language: activeLanguage }),
      });
      if (r.ok) {
        setSavedMsg('Saved ✓');
        setTimeout(() => setSavedMsg(''), 2000);
        setOpen(false);
      }
    } catch (_) {}
    setSaving(false);
  }

  const currentProvider = PROVIDERS.find(p => p.id === activeProvider);
  const currentModel = currentProvider?.models.find(m => m.id === activeModel);
  const currentLang = INDIAN_LANGUAGES.find(l => l.code === activeLanguage);

  const statusColor = (s?: string) =>
    s === 'ok' ? '#00c864' : s === 'error' ? '#ff5555' : s === 'no_key' ? '#ffa726' : s === 'checking' ? '#64b5f6' : '#8899bb';
  const statusDot = (s?: string) =>
    s === 'ok' ? '●' : s === 'error' ? '✗' : s === 'no_key' ? '○' : s === 'checking' ? '◌' : '○';

  if (compact) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#f0f4ff', fontSize: 11, fontWeight: 600 }}>
        <Cpu size={11} style={{ color: '#00d4aa' }} />
        {currentProvider?.name} · {currentModel?.label || activeModel}
        {currentLang && currentLang.code !== 'english' && <span style={{ color: '#00d4aa' }}>· {currentLang.label}</span>}
        <ChevronDown size={10} style={{ color: '#8899bb' }} />
        {open && <AIModelSwitcherModal />}
      </button>
    );
  }

  function AIModelSwitcherModal() {
    return (
      <AnimatePresence>
        {open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,11,24,0.85)' }}
            onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: 580, maxHeight: '85vh', overflow: 'hidden', background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, display: 'flex', flexDirection: 'column' }}>
              
              {/* Header */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Cpu size={16} style={{ color: '#00d4aa' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>AI Model & Language</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>Choose your AI provider, model, and response language</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, padding: '12px 22px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {(['model', 'language'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: '6px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === t ? 'rgba(0,212,170,0.1)' : 'transparent', color: tab === t ? '#00d4aa' : '#8899bb', borderBottom: tab === t ? '2px solid #00d4aa' : '2px solid transparent' }}>
                    {t === 'model' ? '🤖 AI Model' : '🌐 Language'}
                  </button>
                ))}
              </div>

              <div style={{ overflow: 'auto', flex: 1, padding: '16px 22px' }}>
                {tab === 'model' ? (
                  <>
                    {PROVIDERS.map(provider => (
                      <div key={provider.id} style={{ marginBottom: 12, border: `1px solid ${activeProvider === provider.id ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, overflow: 'hidden', background: activeProvider === provider.id ? 'rgba(0,212,170,0.03)' : 'rgba(255,255,255,0.02)' }}>
                        {/* Provider header */}
                        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: provider.color }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{provider.name}</span>
                            <span style={{ fontSize: 10, color: statusColor(providerStatus[provider.id]) }}>
                              {statusDot(providerStatus[provider.id])} {providerStatus[provider.id] || 'not tested'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => testProvider(provider.id)}
                              style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899bb', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <RefreshCw size={9} /> Test
                            </button>
                            <button onClick={() => setActiveProvider(provider.id)}
                              style={{ padding: '3px 8px', borderRadius: 6, background: activeProvider === provider.id ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeProvider === provider.id ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`, color: activeProvider === provider.id ? '#00d4aa' : '#8899bb', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                              {activeProvider === provider.id ? '✓ Active' : 'Use'}
                            </button>
                          </div>
                        </div>
                        {/* Models */}
                        <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {provider.models.map(model => {
                            const isActive = activeProvider === provider.id && activeModel === model.id;
                            return (
                              <button key={model.id}
                                onClick={() => { setActiveProvider(provider.id); setActiveModel(model.id); }}
                                style={{ padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, background: isActive ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.07)'}`, color: isActive ? '#00d4aa' : '#aabbd0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                {isActive && <Check size={9} />}
                                {model.label}
                                <span style={{ fontSize: 9, color: model.free ? '#00c864' : '#8899bb', background: model.free ? 'rgba(0,200,100,0.1)' : 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                                  {model.free ? 'FREE' : 'PAID'}
                                </span>
                                <span style={{ fontSize: 9, color: '#8899bb' }}>{model.speed}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Custom model */}
                    <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#8899bb', marginBottom: 8 }}>Or enter any model ID manually</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          defaultValue={activeModel}
                          onChange={e => setActiveModel(e.target.value)}
                          placeholder="e.g. meta/llama-3.3-70b-instruct"
                          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', color: '#f0f4ff', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Language tab */
                  <div>
                    <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 12 }}>
                      AI will respond in this language for chat, briefings, content, and SMS drafts.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMob(w) ? 3 : 4}, 1fr)`, gap: 8 }}>
                      {INDIAN_LANGUAGES.map(lang => {
                        const isActive = activeLanguage === lang.code;
                        return (
                          <button key={lang.code} onClick={() => setActiveLanguage(lang.code)}
                            style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: isActive ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.07)'}`, color: isActive ? '#00d4aa' : '#aabbd0' }}>
                            <div style={{ fontSize: 18, marginBottom: 3 }}>{lang.script}</div>
                            <div style={{ fontSize: 10, fontWeight: 600 }}>{lang.label}</div>
                            {isActive && <Check size={9} style={{ margin: '2px auto 0', color: '#00d4aa' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: '#8899bb' }}>
                  Active: <span style={{ color: '#00d4aa' }}>{currentProvider?.name} · {currentModel?.label || activeModel}</span>
                  {activeLanguage !== 'english' && <span style={{ color: '#ffa726' }}> · {currentLang?.label}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {savedMsg && <span style={{ fontSize: 11, color: '#00c864' }}>{savedMsg}</span>}
                  <button onClick={() => setOpen(false)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899bb', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveSettings} disabled={saving}
                    style={{ padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#00d4aa,#1e88e5)', border: 'none', color: '#060b18', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {saving ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : <><Zap size={11} />Apply Settings</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: '#f0f4ff', fontSize: 12, fontWeight: 600, width: '100%' }}>
        <Cpu size={13} style={{ color: '#00d4aa', flexShrink: 0 }} />
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#8899bb', lineHeight: 1 }}>AI Model</div>
          <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentProvider?.name} · {currentModel?.label || activeModel}
          </div>
        </div>
        {activeLanguage !== 'english' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#00d4aa', flexShrink: 0 }}>{currentLang?.label}</span>
        )}
        <ChevronDown size={12} style={{ color: '#8899bb', marginLeft: 'auto', flexShrink: 0 }} />
      </button>
      <AIModelSwitcherModal />
    </>
  );
}
