import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield, Zap, AlertTriangle, TrendingDown, Eye, X, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useBreakpoint, card, label, inputStyle, btnPrimary, aiPanel } from '../lib/responsive';

interface Intel {
  id: string;
  opponent_name: string;
  activity_type: string;
  description: string;
  platform: string;
  threat_level: number;
  detected_at: string;
  source_url?: string;
}

const ACTIVITY_TYPES = ['All','Attack Ad','Misinformation','Rally','Social Media','Press Conference','Door-to-Door','Policy Announcement'];
const THREAT_COLORS = (n: number) => n >= 8 ? '#ff5555' : n >= 5 ? '#ffa726' : '#00c864';

export default function OppositionTracker() {
  const { session } = useAuth();
  const { isMobile } = useBreakpoint();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [intel, setIntel] = useState<Intel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const data = await api.list('opposition_intelligence', { order: 'detected_at', dir: 'DESC', limit: '50' });
    setIntel((data as Intel[]) || []);
    setLoading(false);
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/opposition/ai-analysis', { method: 'POST', headers: h });
      const d = await r.json();
      setAnalysis(d.analysis || '');
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? intel : intel.filter(i => i.activity_type === filter);
  const highThreats = intel.filter(i => i.threat_level >= 7).length;
  const avgThreat = intel.length ? Math.round(intel.reduce((s, i) => s + i.threat_level, 0) / intel.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`, gap: 10 }}>
        {[
          { label: 'Total Signals', value: intel.length, color: '#42a5f5', icon: Eye },
          { label: 'High Threats', value: highThreats, color: '#ff5555', icon: AlertTriangle },
          { label: 'Avg Threat Level', value: `${avgThreat}/10`, color: avgThreat >= 7 ? '#ff5555' : avgThreat >= 4 ? '#ffa726' : '#00c864', icon: Shield },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Analysis */}
      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={aiPanel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={13} style={{ color: '#00d4aa' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00d4aa' }}>AI THREAT ASSESSMENT</span>
            </div>
            <button onClick={() => setAnalysis('')} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={13} /></button>
          </div>
          <p style={{ fontSize: 13, color: '#d0d8ee', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{analysis}</p>
        </motion.div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {ACTIVITY_TYPES.slice(0, isMobile ? 4 : 8).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filter === t ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filter === t ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: filter === t ? '#00d4aa' : '#8899bb' }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={runAnalysis} disabled={analyzing}
          style={{ ...btnPrimary, flexShrink: 0, opacity: analyzing ? 0.7 : 1 }}>
          {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analyzing...</> : <><Zap size={13} />AI Analysis</>}
        </button>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Plus size={13} /> Add Intel
        </button>
      </div>

      {/* Intel feed */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13 }}>Loading intelligence...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Shield size={32} style={{ color: '#8899bb', margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 6 }}>No opposition intel logged</div>
          <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 16 }}>Track opposition activities to generate AI threat assessments</div>
          <button onClick={() => setShowForm(true)} style={btnPrimary}><Plus size={13} />Add First Intel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ ...card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${THREAT_COLORS(item.threat_level)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: THREAT_COLORS(item.threat_level), flexShrink: 0 }}>
                  {item.threat_level}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{item.opponent_name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>{item.activity_type}</span>
                    {item.platform && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(30,136,229,0.1)', color: '#42a5f5' }}>{item.platform}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#d0d8ee', margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                </div>
                <div style={{ fontSize: 11, color: '#8899bb', flexShrink: 0 }}>
                  {new Date(item.detected_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && <AddIntelForm onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function AddIntelForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ opponent_name: '', activity_type: 'Social Media', description: '', platform: '', threat_level: 5 });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (!form.opponent_name || !form.description) return;
    setSaving(true);
    await api.create('opposition_intelligence', { ...form, detected_at: new Date().toISOString() });
    setSaving(false);
    onSave();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,11,24,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Log Opposition Intel</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={label}>Opponent Name *</label><input value={form.opponent_name} onChange={e => f('opponent_name', e.target.value)} placeholder="Opponent or party name" style={inputStyle} /></div>
          <div><label style={label}>Activity Type</label>
            <select value={form.activity_type} onChange={e => f('activity_type', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              {ACTIVITY_TYPES.slice(1).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={label}>Platform</label><input value={form.platform} onChange={e => f('platform', e.target.value)} placeholder="e.g. Twitter, WhatsApp, TV" style={inputStyle} /></div>
          <div><label style={label}>Description *</label><textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="What did they do?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Threat Level: <span style={{ color: THREAT_COLORS(form.threat_level) }}>{form.threat_level}/10</span></label>
            <input type="range" min={1} max={10} value={form.threat_level} onChange={e => f('threat_level', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00d4aa' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899bb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, flex: 2, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Save Intel'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
