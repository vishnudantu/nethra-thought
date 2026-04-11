import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Plus, Trash2, Edit2, Check, X, Eye, EyeOff,
  ChevronDown, ChevronUp, Sparkles, ThumbsUp, ThumbsDown,
  Building2, User, Globe, Loader2, RefreshCw, AlertTriangle, Copy
} from 'lucide-react';
import { T, getToken, useW, isMob } from './ui/ModuleLayout';

interface ContextProfile {
  id: number;
  scope: 'platform' | 'party' | 'politician';
  scope_id: string | null;
  context_type: string;
  title: string;
  content: string;
  is_active: number;
  updated_at: string;
}

interface Feedback {
  id: number;
  politician_id: number;
  endpoint: string;
  ai_output: string;
  feedback: 'positive' | 'negative';
  feedback_note: string;
  created_at: string;
}

interface Politician { id: string; full_name: string; party?: string; }

interface Summary {
  party_name: string;
  layers: { platform: number; party: number; politician: number };
  total_context_blocks: number;
  feedback: { positive: number; negative: number };
}

const CONTEXT_TYPES = [
  { value: 'ideology', label: 'Ideology & Values', desc: 'Party worldview, core beliefs, founding principles' },
  { value: 'talking_points', label: 'Talking Points', desc: 'Current approved narratives and positions' },
  { value: 'communication_style', label: 'Communication Style', desc: 'Tone, formality, language preferences' },
  { value: 'avoid', label: 'Avoid List', desc: 'Topics, phrases or positions to never use' },
  { value: 'opponent_strategy', label: 'Opponent Strategy', desc: 'How to address rival parties and opponents' },
  { value: 'constituency_context', label: 'Constituency Context', desc: 'Local issues, demographics, key concerns' },
  { value: 'approved_phrases', label: 'Approved Phrases', desc: 'Phrases and language the politician actually uses' },
  { value: 'sample_content', label: 'Sample Content', desc: 'Past approved speeches/posts for tone reference' },
];

const TYPE_COLORS: Record<string, string> = {
  ideology: '#ab47bc', talking_points: '#00d4aa', communication_style: '#42a5f5',
  avoid: '#ff5555', opponent_strategy: '#ffa726', constituency_context: '#26c6da',
  approved_phrases: '#00c864', sample_content: '#8899bb',
};

const SCOPE_CONFIG = {
  platform: { label: 'Platform', icon: Globe, color: '#42a5f5', desc: 'Applies to ALL politicians on Nethra' },
  party: { label: 'Party', icon: Building2, color: '#ab47bc', desc: 'Applies to all politicians of that party' },
  politician: { label: 'Politician', icon: User, color: '#00d4aa', desc: 'Applies to one specific politician only' },
};

export default function AITrainingTab({ politicians }: { politicians: Politician[] }) {
  const w = useW();
  const h = { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };

  const [contexts, setContexts] = useState<ContextProfile[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<'platform' | 'party' | 'politician'>('platform');
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedPol, setSelectedPol] = useState(politicians[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'contexts' | 'feedback' | 'preview'>('contexts');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [preview, setPreview] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ scope: 'platform' as const, scope_id: '', context_type: 'ideology', title: '', content: '' });

  async function load() {
    setLoading(true);
    try {
      const [ctxRes, partyRes, fbRes] = await Promise.all([
        fetch('/api/ai-training/contexts', { headers: h }),
        fetch('/api/ai-training/parties', { headers: h }),
        fetch('/api/ai-training/feedback?limit=50', { headers: h }),
      ]);
      if (ctxRes.ok) setContexts(await ctxRes.json());
      if (partyRes.ok) { const p = await partyRes.json(); setParties(p); if (p.length && !selectedParty) setSelectedParty(p[0]); }
      if (fbRes.ok) setFeedback(await fbRes.json());
    } catch (_) {}
    setLoading(false);
  }

  async function loadSummary(polId: string) {
    if (summaries[polId]) return;
    try {
      const r = await fetch(`/api/ai-training/summary/${polId}`, { headers: h });
      if (r.ok) { const d = await r.json(); setSummaries(prev => ({ ...prev, [polId]: d })); }
    } catch (_) {}
  }

  async function saveContext() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        scope_id: form.scope === 'platform' ? null : form.scope === 'party' ? selectedParty : selectedPol,
      };
      if (editingId) {
        await fetch(`/api/ai-training/contexts/${editingId}`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
      } else {
        await fetch('/api/ai-training/contexts', { method: 'POST', headers: h, body: JSON.stringify(body) });
      }
      setShowForm(false); setEditingId(null);
      setForm({ scope: 'platform', scope_id: '', context_type: 'ideology', title: '', content: '' });
      await load();
    } catch (_) {}
    setSaving(false);
  }

  async function deleteContext(id: number) {
    await fetch(`/api/ai-training/contexts/${id}`, { method: 'DELETE', headers: h });
    setContexts(prev => prev.filter(c => c.id !== id));
  }

  async function runPreview() {
    if (!selectedPol) return;
    setPreviewing(true);
    try {
      const r = await fetch('/api/ai-training/preview', {
        method: 'POST', headers: h,
        body: JSON.stringify({ politician_id: parseInt(selectedPol), endpoint: 'general' }),
      });
      const d = await r.json();
      setPreview(d.system_prompt || '');
    } catch (_) {}
    setPreviewing(false);
  }

  function startEdit(ctx: ContextProfile) {
    setForm({ scope: ctx.scope, scope_id: ctx.scope_id || '', context_type: ctx.context_type, title: ctx.title, content: ctx.content });
    setEditingId(ctx.id);
    setSelectedParty(ctx.scope === 'party' ? ctx.scope_id || '' : selectedParty);
    if (ctx.scope === 'politician') setSelectedPol(ctx.scope_id || selectedPol);
    setShowForm(true);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedPol) loadSummary(selectedPol); }, [selectedPol]);

  const filteredContexts = contexts.filter(ctx => {
    if (activeScope === 'platform') return ctx.scope === 'platform';
    if (activeScope === 'party') return ctx.scope === 'party' && ctx.scope_id === selectedParty;
    return ctx.scope === 'politician' && ctx.scope_id === selectedPol;
  });

  const positiveFeedback = feedback.filter(f => f.feedback === 'positive');
  const negativeFeedback = feedback.filter(f => f.feedback === 'negative');
  const polSummary = summaries[selectedPol];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>

      {/* Header */}
      <div style={{ padding: '0 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Brain size={18} style={{ color: '#00d4aa' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>AI Training</h2>
          </div>
          <p style={{ fontSize: 12, color: '#8899bb', margin: 0 }}>
            Train Nethra's AI to speak in each politician's voice and follow party ideology
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ ...T.ghost, padding: '8px 10px' }}><RefreshCw size={13} /></button>
          <button onClick={() => { setShowForm(true); setEditingId(null); }}
            style={T.primary}>
            <Plus size={13} />Add Context
          </button>
        </div>
      </div>

      {/* Inner tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0, overflowX: 'auto' }}>
        {[
          { id: 'contexts', label: 'Context Library' },
          { id: 'feedback', label: `Feedback (${feedback.length})` },
          { id: 'preview', label: 'Preview Prompt' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', whiteSpace: 'nowrap', flexShrink: 0, color: activeTab === t.id ? '#00d4aa' : '#8899bb', borderBottom: `2px solid ${activeTab === t.id ? '#00d4aa' : 'transparent'}`, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTEXT LIBRARY TAB ── */}
      {activeTab === 'contexts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Scope selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(Object.entries(SCOPE_CONFIG) as [string, typeof SCOPE_CONFIG[keyof typeof SCOPE_CONFIG]][]).map(([scope, cfg]) => {
              const Icon = cfg.icon;
              const isActive = activeScope === scope;
              const count = contexts.filter(c => c.scope === scope).length;
              return (
                <button key={scope} onClick={() => setActiveScope(scope as any)}
                  style={{ padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: isActive ? `${cfg.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? cfg.color + '40' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.15s' }}>
                  <Icon size={16} style={{ color: isActive ? cfg.color : '#8899bb', margin: '0 auto 5px', display: 'block' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? cfg.color : '#d0d8ee' }}>{cfg.label}</div>
                  <div style={{ fontSize: 10, color: '#8899bb', marginTop: 2 }}>{count} blocks</div>
                </button>
              );
            })}
          </div>

          {/* Sub-selector for party/politician */}
          {activeScope === 'party' && parties.length > 0 && (
            <select value={selectedParty} onChange={e => setSelectedParty(e.target.value)}
              style={{ ...T.input, width: '100%' }}>
              {parties.map(p => <option key={p}>{p}</option>)}
            </select>
          )}
          {activeScope === 'politician' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={selectedPol} onChange={e => setSelectedPol(e.target.value)} style={{ ...T.input, flex: 1 }}>
                {politicians.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              {polSummary && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,200,100,0.1)', color: '#00c864', fontWeight: 700 }}>
                    {polSummary.total_context_blocks} blocks
                  </span>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,212,170,0.08)', color: '#00d4aa', fontWeight: 700 }}>
                    👍 {polSummary.feedback.positive}
                  </span>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,85,85,0.08)', color: '#ff7777', fontWeight: 700 }}>
                    👎 {polSummary.feedback.negative}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Context cards */}
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8899bb' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block', color: '#00d4aa' }} />
              <div style={{ fontSize: 12 }}>Loading context library...</div>
            </div>
          ) : filteredContexts.length === 0 ? (
            <div style={{ ...T.card, padding: 36, textAlign: 'center' }}>
              <Brain size={32} style={{ color: '#8899bb', opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No context blocks yet</div>
              <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 16 }}>
                {activeScope === 'platform' ? 'Add platform-wide AI behaviour rules' :
                  activeScope === 'party' ? `Add ${selectedParty || 'party'} ideology, talking points and strategy` :
                  'Add politician-specific voice, phrases and constituency context'}
              </div>
              <button onClick={() => setShowForm(true)} style={{ ...T.primary, margin: '0 auto', display: 'inline-flex' }}>
                <Plus size={13} />Add First Block
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredContexts.map(ctx => {
                const tc = TYPE_COLORS[ctx.context_type] || '#8899bb';
                const isExpanded = expandedId === ctx.id;
                return (
                  <motion.div key={ctx.id} layout
                    style={{ ...T.card, padding: 0, borderColor: isExpanded ? `${tc}40` : 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <button onClick={() => setExpandedId(isExpanded ? null : ctx.id)}
                      style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctx.title}</div>
                        <div style={{ fontSize: 10, color: tc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>
                          {CONTEXT_TYPES.find(t => t.value === ctx.context_type)?.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: '#8899bb' }}>{ctx.content.length} chars</span>
                        {isExpanded ? <ChevronUp size={13} style={{ color: '#8899bb' }} /> : <ChevronDown size={13} style={{ color: '#8899bb' }} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <pre style={{ fontSize: 12, color: '#d0d8ee', lineHeight: 1.7, margin: '12px 0 12px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                              {ctx.content}
                            </pre>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button onClick={() => startEdit(ctx)}
                                style={{ ...T.ghost, padding: '6px 12px', fontSize: 11, gap: 5 }}>
                                <Edit2 size={11} />Edit
                              </button>
                              <button onClick={() => { navigator.clipboard.writeText(ctx.content); }}
                                style={{ ...T.ghost, padding: '6px 12px', fontSize: 11, gap: 5 }}>
                                <Copy size={11} />Copy
                              </button>
                              <button onClick={() => deleteContext(ctx.id)}
                                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.15)', color: '#ff7777', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Trash2 size={11} />Remove
                              </button>
                              <span style={{ fontSize: 10, color: '#8899bb', marginLeft: 'auto' }}>
                                Updated {new Date(ctx.updated_at).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FEEDBACK TAB ── */}
      {activeTab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ ...T.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,200,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ThumbsUp size={16} style={{ color: '#00c864' }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#00c864', fontFamily: 'Space Grotesk' }}>{positiveFeedback.length}</div>
                <div style={{ fontSize: 11, color: '#8899bb' }}>Approved outputs</div>
              </div>
            </div>
            <div style={{ ...T.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,85,85,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ThumbsDown size={16} style={{ color: '#ff5555' }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ff5555', fontFamily: 'Space Grotesk' }}>{negativeFeedback.length}</div>
                <div style={{ fontSize: 11, color: '#8899bb' }}>Rejected outputs</div>
              </div>
            </div>
          </div>

          {feedback.length === 0 ? (
            <div style={{ ...T.card, padding: 36, textAlign: 'center' }}>
              <ThumbsUp size={32} style={{ color: '#8899bb', opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No feedback yet</div>
              <div style={{ fontSize: 12, color: '#8899bb' }}>
                Thumbs up/down buttons will appear on every AI output across all modules.
                Feedback trains the AI to improve over time.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {feedback.map(fb => {
                const isPos = fb.feedback === 'positive';
                const pol = politicians.find(p => p.id === String(fb.politician_id));
                return (
                  <div key={fb.id} style={{ ...T.card, padding: '12px 16px', borderLeft: `3px solid ${isPos ? '#00c864' : '#ff5555'}` }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isPos ? 'rgba(0,200,100,0.1)' : 'rgba(255,85,85,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isPos ? <ThumbsUp size={12} style={{ color: '#00c864' }} /> : <ThumbsDown size={12} style={{ color: '#ff5555' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#f0f4ff' }}>{pol?.full_name || `Politician #${fb.politician_id}`}</span>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', color: '#8899bb' }}>{fb.endpoint}</span>
                          <span style={{ fontSize: 10, color: '#8899bb', marginLeft: 'auto' }}>{new Date(fb.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#d0d8ee', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {fb.ai_output}
                        </p>
                        {fb.feedback_note && (
                          <div style={{ fontSize: 11, color: '#ffa726', marginTop: 5 }}>Note: {fb.feedback_note}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...T.card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 10 }}>
              Preview what context a politician's AI actually sees
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={selectedPol} onChange={e => setSelectedPol(e.target.value)} style={{ ...T.input, flex: 1 }}>
                {politicians.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <button onClick={runPreview} disabled={previewing}
                style={{ ...T.primary, flexShrink: 0, opacity: previewing ? 0.65 : 1 }}>
                {previewing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Loading...</> : <><Eye size={13} />Preview</>}
              </button>
            </div>
          </div>

          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={T.ai}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={13} style={{ color: '#00d4aa' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Full System Prompt ({preview.length.toLocaleString()} chars)
                  </span>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(preview); }}
                  style={{ ...T.ghost, padding: '5px 10px', fontSize: 11, gap: 5 }}>
                  <Copy size={11} />Copy
                </button>
              </div>
              <pre style={{ fontSize: 11, color: '#d0d8ee', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 400, overflowY: 'auto' }}>
                {preview}
              </pre>
            </motion.div>
          )}

          {!preview && !previewing && (
            <div style={{ ...T.card, padding: 36, textAlign: 'center' }}>
              <Eye size={32} style={{ color: '#8899bb', opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>System Prompt Preview</div>
              <div style={{ fontSize: 12, color: '#8899bb' }}>
                Select a politician and click Preview to see the exact prompt their AI receives — combining platform, party and politician context layers.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT FORM MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,11,24,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
                  {editingId ? 'Edit Context Block' : 'Add Context Block'}
                </div>
                <button onClick={() => { setShowForm(false); setEditingId(null); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8899bb' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Scope */}
                <div>
                  <label style={T.label}>Scope — Who does this apply to?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                    {(Object.entries(SCOPE_CONFIG) as any[]).map(([scope, cfg]) => {
                      const Icon = cfg.icon;
                      const isActive = form.scope === scope;
                      return (
                        <button key={scope} onClick={() => setForm(f => ({ ...f, scope }))}
                          style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: isActive ? `${cfg.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? cfg.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                          <Icon size={14} style={{ color: isActive ? cfg.color : '#8899bb', margin: '0 auto 4px', display: 'block' }} />
                          <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? cfg.color : '#d0d8ee' }}>{cfg.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scope ID selector */}
                {form.scope === 'party' && (
                  <div>
                    <label style={T.label}>Party</label>
                    <select value={selectedParty} onChange={e => setSelectedParty(e.target.value)} style={{ ...T.input, width: '100%' }}>
                      {parties.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                )}
                {form.scope === 'politician' && (
                  <div>
                    <label style={T.label}>Politician</label>
                    <select value={selectedPol} onChange={e => setSelectedPol(e.target.value)} style={{ ...T.input, width: '100%' }}>
                      {politicians.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                  </div>
                )}

                {/* Context type */}
                <div>
                  <label style={T.label}>Context Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 6 }}>
                    {CONTEXT_TYPES.map(t => {
                      const isActive = form.context_type === t.value;
                      const tc = TYPE_COLORS[t.value] || '#8899bb';
                      return (
                        <button key={t.value} onClick={() => setForm(f => ({ ...f, context_type: t.value }))}
                          style={{ padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', background: isActive ? `${tc}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? tc + '40' : 'rgba(255,255,255,0.07)'}` }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? tc : '#d0d8ee', lineHeight: 1.3 }}>{t.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: '#8899bb', marginTop: 6 }}>
                    {CONTEXT_TYPES.find(t => t.value === form.context_type)?.desc}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={T.label}>Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. TDP Core Ideology, CBN Communication Style, Avoid Opposition Attacks..."
                    style={T.input} />
                </div>

                {/* Content */}
                <div>
                  <label style={T.label}>Context Content *</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={
                      form.context_type === 'ideology' ? "Describe the party/politician's core values, political philosophy and worldview..." :
                      form.context_type === 'talking_points' ? "List current approved narratives:\n- Welfare schemes delivered\n- Infrastructure development\n- AP Special Category Status..." :
                      form.context_type === 'avoid' ? "Never mention:\n- Corruption allegations from 2019\n- Split with BJP\n- Internal party disputes..." :
                      form.context_type === 'approved_phrases' ? "Phrases this politician actually uses:\n- 'Development is my religion'\n- 'People's welfare is my priority'..." :
                      form.context_type === 'sample_content' ? "Paste an actual speech, post or statement for tone reference:\n\n..." :
                      "Enter the context content..."
                    }
                    rows={8} style={{ ...T.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  <div style={{ fontSize: 10, color: '#8899bb', marginTop: 4 }}>{form.content.length} characters</div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => { setShowForm(false); setEditingId(null); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899bb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={saveContext} disabled={saving || !form.title.trim() || !form.content.trim()}
                    style={{ ...T.primary, flex: 2, justifyContent: 'center', opacity: saving || !form.title.trim() || !form.content.trim() ? 0.5 : 1 }}>
                    {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : <><Check size={13} />{editingId ? 'Update Block' : 'Save Block'}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
