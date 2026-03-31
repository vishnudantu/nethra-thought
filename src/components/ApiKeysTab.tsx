import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Trash2, Eye, EyeOff, Check, X, AlertCircle,
  Sparkles, Send, RefreshCw, ChevronDown, Copy, ExternalLink,
  Shield, Zap, Bot
} from 'lucide-react';
import { api } from '../lib/api';
import Badge from './ui/Badge';

interface ApiKeyRecord {
  key_name: string;
  key_hint?: string;
  is_active: number;
  updated_at?: string;
  usage_count?: number;
  monthly_limit?: number;
}

interface Politician { id: string; full_name: string; }

interface Props {
  apiKeys: ApiKeyRecord[];
  politicians: Politician[];
  masterKeyConfigured: boolean;
  apiKeyStatus: string;
  setApiKeyStatus: (s: string) => void;
  onRefresh: () => void;
  orModel: string;
  setOrModel: (m: string) => void;
  orTestPrompt: string;
  setOrTestPrompt: (s: string) => void;
  orTestResponse: string;
  setOrTestResponse: (s: string) => void;
  orTesting: boolean;
  setOrTesting: (b: boolean) => void;
  orTestStatus: string;
  setOrTestStatus: (s: string) => void;
  testOpenRouter: () => void;
}

const OPENROUTER_FREE_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B', provider: 'Meta', speed: 'Fast', quality: 'Excellent' },
  { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1', provider: 'DeepSeek', speed: 'Medium', quality: 'Excellent' },
  { id: 'deepseek/deepseek-chat:free', label: 'DeepSeek Chat', provider: 'DeepSeek', speed: 'Fast', quality: 'Very Good' },
  { id: 'google/gemma-3-12b-it:free', label: 'Gemma 3 12B', provider: 'Google', speed: 'Fast', quality: 'Very Good' },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B', provider: 'Google', speed: 'Fast', quality: 'Good' },
  { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B', provider: 'Mistral', speed: 'Very Fast', quality: 'Good' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B', provider: 'Meta', speed: 'Very Fast', quality: 'Good' },
  { id: 'qwen/qwen-2-7b-instruct:free', label: 'Qwen 2 7B', provider: 'Alibaba', speed: 'Fast', quality: 'Good' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini', provider: 'Microsoft', speed: 'Very Fast', quality: 'Good' },
  { id: 'nousresearch/hermes-3-llama-3.1-70b:free', label: 'Hermes 3 70B', provider: 'NousResearch', speed: 'Medium', quality: 'Excellent' },
];

const SUGGESTED_KEYS = [
  { key_name: 'OPENROUTER_API_KEY', label: 'OpenRouter', desc: '100+ free AI models', url: 'https://openrouter.ai/keys', color: '#00d4aa' },
  { key_name: 'GROQ_API_KEY', label: 'Groq', desc: 'Fast free Llama 3.3', url: 'https://console.groq.com/keys', color: '#f97316' },
  { key_name: 'GEMINI_API_KEY', label: 'Gemini', desc: 'Google Gemini Flash', url: 'https://aistudio.google.com/apikey', color: '#4285f4' },
  { key_name: 'ANTHROPIC_API_KEY', label: 'Anthropic', desc: 'Claude Haiku/Sonnet', url: 'https://console.anthropic.com/', color: '#d97706' },
  { key_name: 'OPENAI_API_KEY', label: 'OpenAI', desc: 'GPT-4o Mini', url: 'https://platform.openai.com/api-keys', color: '#10b981' },
  { key_name: 'GROQ_MODEL', label: 'Groq Model', desc: 'e.g. llama-3.3-70b-versatile', url: '', color: '#f97316' },
  { key_name: 'FAST2SMS_API_KEY', label: 'Fast2SMS', desc: 'SMS for darshan', url: 'https://www.fast2sms.com/', color: '#6366f1' },
  { key_name: 'YOUTUBE_API_KEY', label: 'YouTube API', desc: 'Video monitoring', url: 'https://console.cloud.google.com/', color: '#ef4444' },
  { key_name: 'TWITTER_BEARER_TOKEN', label: 'X/Twitter', desc: 'Social monitoring', url: 'https://developer.x.com/', color: '#1d9bf0' },
  { key_name: 'WHATSAPP_WEBHOOK_SECRET', label: 'WA Webhook Secret', desc: 'AiSensy/Wati verify', url: '', color: '#25d366' },
];

export default function ApiKeysTab({
  apiKeys, politicians, masterKeyConfigured, apiKeyStatus,
  setApiKeyStatus, onRefresh, orModel, setOrModel,
  orTestPrompt, setOrTestPrompt, orTestResponse, setOrTestResponse,
  orTesting, setOrTesting, orTestStatus, setOrTestStatus, testOpenRouter
}: Props) {
  // Platform keys state
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Custom key adder
  const [customName, setCustomName] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [showCustomValue, setShowCustomValue] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);

  // Politician keys state
  const [selectedPolId, setSelectedPolId] = useState(politicians[0]?.id || '');
  const [polKeys, setPolKeys] = useState<ApiKeyRecord[]>([]);
  const [polKeyInputs, setPolKeyInputs] = useState<Record<string, string>>({});
  const [polKeyLimits, setPolKeyLimits] = useState<Record<string, string>>({});
  const [polCustomName, setPolCustomName] = useState('');
  const [polCustomValue, setPolCustomValue] = useState('');
  const [polCustomLimit, setPolCustomLimit] = useState('');
  const [polAddingCustom, setPolAddingCustom] = useState(false);
  const [polSaving, setPolSaving] = useState<Record<string, boolean>>({});

  // Settings
  const [savedModel, setSavedModel] = useState('');
  const [savingModel, setSavingModel] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (selectedPolId) fetchPolKeys(selectedPolId);
  }, [selectedPolId]);

  useEffect(() => {
    // Load saved model preference
    api.get('/api/founder/settings').then((s: any) => {
      if (s?.openrouter_model) { setSavedModel(s.openrouter_model); setOrModel(s.openrouter_model); }
    }).catch(() => {});
  }, []);

  async function fetchPolKeys(polId: string) {
    try {
      const keys = await api.get(`/api/founder/politicians/${polId}/api-keys`) as ApiKeyRecord[];
      setPolKeys(keys || []);
    } catch { setPolKeys([]); }
  }

  async function savePlatformKey(name: string) {
    const value = keyInputs[name];
    if (!value?.trim()) return;
    setSaving(p => ({ ...p, [name]: true }));
    try {
      await api.post('/api/founder/api-keys', { key_name: name, value });
      setApiKeyStatus(`✓ ${name} saved`);
      setKeyInputs(p => ({ ...p, [name]: '' }));
      onRefresh();
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
    setSaving(p => ({ ...p, [name]: false }));
  }

  async function deletePlatformKey(name: string) {
    try {
      await api.delete(`/api/founder/api-keys/${name}`);
      setApiKeyStatus(`${name} removed`);
      onRefresh();
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
  }

  async function addCustomKey() {
    if (!customName.trim() || !customValue.trim()) return;
    setAddingCustom(true);
    try {
      await api.post('/api/founder/api-keys', { key_name: customName.trim().toUpperCase().replace(/\s+/g, '_'), value: customValue });
      setApiKeyStatus(`✓ ${customName} saved`);
      setCustomName(''); setCustomValue('');
      onRefresh();
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
    setAddingCustom(false);
  }

  async function savePolKey(name: string) {
    const value = polKeyInputs[name];
    if (!value?.trim() || !selectedPolId) return;
    setPolSaving(p => ({ ...p, [name]: true }));
    try {
      await api.put(`/api/founder/politicians/${selectedPolId}/api-keys`, {
        key_name: name, value, monthly_limit: Number(polKeyLimits[name] || 0)
      });
      setApiKeyStatus(`✓ ${name} saved for politician`);
      setPolKeyInputs(p => ({ ...p, [name]: '' }));
      fetchPolKeys(selectedPolId);
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
    setPolSaving(p => ({ ...p, [name]: false }));
  }

  async function deletePolKey(name: string) {
    try {
      await api.delete(`/api/founder/politicians/${selectedPolId}/api-keys/${name}`);
      fetchPolKeys(selectedPolId);
      setApiKeyStatus(`${name} removed`);
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
  }

  async function addPolCustomKey() {
    if (!polCustomName.trim() || !polCustomValue.trim() || !selectedPolId) return;
    setPolAddingCustom(true);
    try {
      await api.put(`/api/founder/politicians/${selectedPolId}/api-keys`, {
        key_name: polCustomName.trim().toUpperCase().replace(/\s+/g, '_'),
        value: polCustomValue,
        monthly_limit: Number(polCustomLimit || 0)
      });
      setApiKeyStatus(`✓ Custom key saved for politician`);
      setPolCustomName(''); setPolCustomValue(''); setPolCustomLimit('');
      fetchPolKeys(selectedPolId);
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
    setPolAddingCustom(false);
  }

  async function saveModel() {
    setSavingModel(true);
    try {
      await api.post('/api/founder/settings', { key: 'openrouter_model', value: orModel });
      setSavedModel(orModel);
      setApiKeyStatus('✓ Model saved: ' + (OPENROUTER_FREE_MODELS.find(m => m.id === orModel)?.label || orModel));
      setTimeout(() => setApiKeyStatus(''), 3000);
    } catch (e: any) { setApiKeyStatus('Error: ' + e.message); }
    setSavingModel(false);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  // Merge suggested keys with saved keys - show all saved + fill from suggestions
  const allKeyNames = [
    ...new Set([
      ...SUGGESTED_KEYS.map(s => s.key_name),
      ...apiKeys.map(k => k.key_name),
    ])
  ];

  const polAllKeyNames = [
    ...new Set([
      ...SUGGESTED_KEYS.filter(s => ['OPENROUTER_API_KEY','GROQ_API_KEY','GEMINI_API_KEY','ANTHROPIC_API_KEY','OPENAI_API_KEY'].includes(s.key_name)).map(s => s.key_name),
      ...polKeys.map(k => k.key_name),
    ])
  ];

  return (
    <div className="p-5 space-y-5">

      {/* Status bar */}
      {!masterKeyConfigured && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777' }}>
          <AlertCircle size={15} />
          <span style={{ fontSize: 13 }}>API_KEYS_MASTER_KEY not set on server — keys cannot be encrypted. Contact your server admin.</span>
        </div>
      )}
      {apiKeyStatus && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: apiKeyStatus.startsWith('Error') ? 'rgba(255,85,85,0.1)' : 'rgba(0,212,170,0.1)', border: `1px solid ${apiKeyStatus.startsWith('Error') ? 'rgba(255,85,85,0.2)' : 'rgba(0,212,170,0.2)'}`, color: apiKeyStatus.startsWith('Error') ? '#ff7777' : '#00d4aa' }}>
          {apiKeyStatus.startsWith('Error') ? <AlertCircle size={14} /> : <Check size={14} />}
          <span style={{ fontSize: 13 }}>{apiKeyStatus}</span>
        </motion.div>
      )}

      {/* ── PLATFORM API KEYS ── */}
      <div className="rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="font-semibold" style={{ color: '#f0f4ff', fontSize: 15 }}>Platform API Keys</div>
            <div style={{ fontSize: 11, color: '#8899bb' }}>Global keys for all AI features, SMS, and integrations</div>
          </div>
          <button onClick={onRefresh} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Saved keys list */}
        <div className="p-4 space-y-2">
          {allKeyNames.map(keyName => {
            const existing = apiKeys.find(k => k.key_name === keyName);
            const suggested = SUGGESTED_KEYS.find(s => s.key_name === keyName);
            const isActive = existing?.is_active === 1;
            return (
              <div key={keyName} className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Key icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? `${suggested?.color || '#00d4aa'}18` : 'rgba(255,255,255,0.06)' }}>
                    <Key size={14} style={{ color: isActive ? (suggested?.color || '#00d4aa') : '#8899bb' }} />
                  </div>

                  {/* Name + hint */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{suggested?.label || keyName}</span>
                      {suggested?.url && (
                        <a href={suggested.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, color: '#8899bb' }}>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <Badge variant={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Not Set'}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code style={{ fontSize: 10, color: '#6677aa', fontFamily: 'monospace' }}>{keyName}</code>
                      {existing?.key_hint && (
                        <span style={{ fontSize: 11, color: '#8899bb' }}>{existing.key_hint}</span>
                      )}
                      {suggested?.desc && (
                        <span style={{ fontSize: 10, color: 'rgba(136,153,187,0.5)' }}>· {suggested.desc}</span>
                      )}
                    </div>
                  </div>

                  {/* Input + buttons */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type={showValues[keyName] ? 'text' : 'password'}
                        className="input-field"
                        placeholder={isActive ? 'Replace key...' : 'Paste key or value...'}
                        value={keyInputs[keyName] || ''}
                        onChange={e => setKeyInputs(p => ({ ...p, [keyName]: e.target.value }))}
                        style={{ width: 220, paddingRight: 32, fontSize: 12 }}
                        onKeyDown={e => { if (e.key === 'Enter') savePlatformKey(keyName); }}
                      />
                      <button type="button"
                        onClick={() => setShowValues(p => ({ ...p, [keyName]: !p[keyName] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        style={{ color: '#8899bb' }}>
                        {showValues[keyName] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <button
                      onClick={() => savePlatformKey(keyName)}
                      disabled={saving[keyName] || !masterKeyConfigured || !(keyInputs[keyName] || '').trim()}
                      className="btn-primary text-xs flex items-center gap-1 flex-shrink-0"
                      style={{ opacity: !masterKeyConfigured || !(keyInputs[keyName] || '').trim() ? 0.4 : 1 }}>
                      {saving[keyName] ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> : <Check size={12} />}
                      Save
                    </button>
                    {isActive && (
                      <button onClick={() => deletePlatformKey(keyName)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(255,85,85,0.08)', color: '#ff5555' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {existing?.updated_at && (
                  <div style={{ fontSize: 10, color: 'rgba(136,153,187,0.4)', marginTop: 6, paddingLeft: 44 }}>
                    Updated {new Date(existing.updated_at).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add custom key */}
        <div className="mx-4 mb-4 p-4 rounded-xl" style={{ background: 'rgba(0,212,170,0.04)', border: '1px dashed rgba(0,212,170,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            + Add Any Custom Key
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Key name  e.g. MY_CUSTOM_KEY"
              className="input-field"
              style={{ width: 200, fontSize: 12 }}
            />
            <div className="relative">
              <input
                type={showCustomValue ? 'text' : 'password'}
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                placeholder="Key value / API key"
                className="input-field"
                style={{ width: 260, paddingRight: 32, fontSize: 12 }}
                onKeyDown={e => { if (e.key === 'Enter') addCustomKey(); }}
              />
              <button type="button" onClick={() => setShowCustomValue(p => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }}>
                {showCustomValue ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <button onClick={addCustomKey}
              disabled={addingCustom || !customName.trim() || !customValue.trim() || !masterKeyConfigured}
              className="btn-primary flex items-center gap-1.5 text-xs"
              style={{ opacity: !customName.trim() || !customValue.trim() || !masterKeyConfigured ? 0.4 : 1 }}>
              {addingCustom ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> : <Plus size={12} />}
              Add Key
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(136,153,187,0.45)', marginTop: 6 }}>
            Key name will be uppercased automatically. Works for any provider — OpenRouter, custom LLMs, webhooks, etc.
          </p>
        </div>
      </div>

      {/* ── OPENROUTER MODEL PICKER ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(0,212,170,0.04)', border: '1px solid rgba(0,212,170,0.15)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(30,136,229,0.2))' }}>
              <Bot size={18} style={{ color: '#00d4aa' }} />
            </div>
            <div>
              <div className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14 }}>Active AI Model — OpenRouter</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>
                {savedModel ? `Currently: ${OPENROUTER_FREE_MODELS.find(m => m.id === savedModel)?.label || savedModel}` : 'No model saved yet — select and save below'}
              </div>
            </div>
          </div>
          <a href="https://openrouter.ai/models?order=newest&supported_parameters=free" target="_blank" rel="noopener noreferrer"
            className="text-xs flex items-center gap-1"
            style={{ color: '#00d4aa', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', padding: '6px 12px', borderRadius: 8 }}>
            Browse All Free Models <ExternalLink size={10} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 mb-4">
          {OPENROUTER_FREE_MODELS.map(m => (
            <button key={m.id} onClick={() => setOrModel(m.id)}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                background: orModel === m.id ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${orModel === m.id ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: orModel === m.id ? '#00d4aa' : '#f0f4ff', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 9, color: '#8899bb' }}>{m.provider}</div>
              <div style={{ fontSize: 9, color: 'rgba(136,153,187,0.5)', marginTop: 2 }}>{m.speed} · {m.quality}</div>
              <span style={{ fontSize: 8, background: 'rgba(0,200,100,0.12)', color: '#00c864', padding: '1px 5px', borderRadius: 100, marginTop: 4, display: 'inline-block' }}>FREE</span>
            </button>
          ))}
        </div>

        {/* Custom model input */}
        <div className="mb-4 flex items-center gap-2">
          <div style={{ fontSize: 11, color: '#8899bb', flexShrink: 0 }}>Or type any model ID:</div>
          <input
            value={orModel}
            onChange={e => setOrModel(e.target.value)}
            placeholder="e.g. anthropic/claude-3-haiku"
            className="input-field flex-1"
            style={{ fontSize: 12, fontFamily: 'monospace' }}
          />
          <button onClick={saveModel} disabled={savingModel || !orModel.trim()}
            className="btn-primary text-xs flex items-center gap-1.5 flex-shrink-0">
            {savingModel ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> : <Check size={12} />}
            Save Model
          </button>
        </div>

        {/* Live test */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Live Test — runs directly against OpenRouter API
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={orTestPrompt}
              onChange={e => setOrTestPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); testOpenRouter(); } }}
              placeholder="Ask anything — e.g. Write a 1-line campaign slogan for a farmer-focused politician"
              className="input-field flex-1"
              style={{ fontSize: 12 }}
            />
            <button onClick={testOpenRouter} disabled={orTesting || !orTestPrompt.trim()}
              className="btn-primary flex items-center gap-2 flex-shrink-0"
              style={{ opacity: orTesting || !orTestPrompt.trim() ? 0.5 : 1 }}>
              {orTesting
                ? <><div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} />Testing...</>
                : <><Send size={14} />Test</>}
            </button>
          </div>
          <AnimatePresence>
            {orTestStatus && orTestStatus !== 'success' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 py-2 rounded-lg mb-3"
                style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777', fontSize: 12 }}>
                {orTestStatus}
              </motion.div>
            )}
            {orTestResponse && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00d4aa,#1e88e5)' }}>
                      <Sparkles size={11} color="#060b18" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa' }}>
                      {OPENROUTER_FREE_MODELS.find(m => m.id === orModel)?.label || orModel}
                    </span>
                    <span style={{ fontSize: 10, color: '#8899bb' }}>via OpenRouter</span>
                  </div>
                  <button onClick={() => copyText(orTestResponse, 'or-response')}
                    style={{ fontSize: 11, color: '#8899bb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {copied === 'or-response' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#e0e8ff', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{orTestResponse}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── PER-POLITICIAN API KEYS ── */}
      <div className="rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="font-semibold" style={{ color: '#f0f4ff', fontSize: 15 }}>Per-Politician API Keys</div>
            <div style={{ fontSize: 11, color: '#8899bb' }}>Override any key for a specific politician. Overrides platform keys. Useful for billing per-client.</div>
          </div>
          <select value={selectedPolId} onChange={e => setSelectedPolId(e.target.value)} className="input-field" style={{ minWidth: 200 }}>
            {politicians.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <div className="p-4 space-y-2">
          {polAllKeyNames.map(keyName => {
            const existing = polKeys.find(k => k.key_name === keyName);
            const suggested = SUGGESTED_KEYS.find(s => s.key_name === keyName);
            const isActive = existing?.is_active === 1;
            const usage = existing ? `${existing.usage_count || 0} / ${existing.monthly_limit || '∞'}` : '0 / ∞';
            return (
              <div key={keyName} className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(30,136,229,0.18)' : 'rgba(255,255,255,0.06)'}` }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? `${suggested?.color || '#1e88e5'}18` : 'rgba(255,255,255,0.06)' }}>
                    <Key size={14} style={{ color: isActive ? (suggested?.color || '#1e88e5') : '#8899bb' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{suggested?.label || keyName}</span>
                      <Badge variant={isActive ? 'info' : 'neutral'}>{isActive ? 'Active' : 'Not Set'}</Badge>
                      {isActive && <span style={{ fontSize: 10, color: '#8899bb' }}>Usage: {usage}</span>}
                    </div>
                    <code style={{ fontSize: 10, color: '#6677aa', fontFamily: 'monospace' }}>{keyName}</code>
                    {existing?.key_hint && <span style={{ fontSize: 11, color: '#8899bb', marginLeft: 8 }}>{existing.key_hint}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="password" className="input-field" placeholder={isActive ? 'Replace...' : 'Paste key...'}
                      value={polKeyInputs[keyName] || ''}
                      onChange={e => setPolKeyInputs(p => ({ ...p, [keyName]: e.target.value }))}
                      style={{ width: 180, fontSize: 12 }} />
                    <input className="input-field" placeholder="Monthly limit"
                      value={polKeyLimits[keyName] || ''}
                      onChange={e => setPolKeyLimits(p => ({ ...p, [keyName]: e.target.value }))}
                      style={{ width: 110, fontSize: 12 }} />
                    <button onClick={() => savePolKey(keyName)}
                      disabled={polSaving[keyName] || !masterKeyConfigured || !(polKeyInputs[keyName] || '').trim()}
                      className="btn-primary text-xs flex items-center gap-1 flex-shrink-0"
                      style={{ opacity: !masterKeyConfigured || !(polKeyInputs[keyName] || '').trim() ? 0.4 : 1 }}>
                      {polSaving[keyName] ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> : <Check size={12} />}
                      Save
                    </button>
                    {isActive && (
                      <button onClick={() => deletePolKey(keyName)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(255,85,85,0.08)', color: '#ff5555' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom key for politician */}
        <div className="mx-4 mb-4 p-4 rounded-xl" style={{ background: 'rgba(30,136,229,0.04)', border: '1px dashed rgba(30,136,229,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#42a5f5', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            + Add Any Custom Key for This Politician
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input value={polCustomName} onChange={e => setPolCustomName(e.target.value)}
              placeholder="Key name  e.g. CUSTOM_MODEL"
              className="input-field" style={{ width: 180, fontSize: 12 }} />
            <input type="password" value={polCustomValue} onChange={e => setPolCustomValue(e.target.value)}
              placeholder="Key value"
              className="input-field" style={{ width: 220, fontSize: 12 }} />
            <input value={polCustomLimit} onChange={e => setPolCustomLimit(e.target.value)}
              placeholder="Monthly limit (0=∞)"
              className="input-field" style={{ width: 140, fontSize: 12 }} />
            <button onClick={addPolCustomKey}
              disabled={polAddingCustom || !polCustomName.trim() || !polCustomValue.trim() || !masterKeyConfigured}
              className="btn-primary flex items-center gap-1.5 text-xs"
              style={{ opacity: !polCustomName.trim() || !polCustomValue.trim() || !masterKeyConfigured ? 0.4 : 1 }}>
              {polAddingCustom ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> : <Plus size={12} />}
              Add Key
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
