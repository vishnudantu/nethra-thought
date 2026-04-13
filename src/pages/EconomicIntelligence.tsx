import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart as LineChartIcon, Plus, TrendingUp, TrendingDown, Minus, Zap, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api';
import { T, AIPanel, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../hooks/useResponsive';

interface Indicator { id: string; indicator_type: string; mandal?: string; value: number; unit?: string; trend: string; recorded_date: string; source?: string; notes?: string; }

export default function EconomicIntelligence() {
  const w = useW();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('economic_indicators', { order: 'recorded_date', dir: 'DESC', limit: '100' });
      setIndicators((data as Indicator[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Analyse these economic indicators for my constituency. What are the biggest stress signals? What interventions should I push for? Data: ${JSON.stringify(indicators.slice(0, 20))}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const declining = indicators.filter(i => i.trend === 'declining').length;
  const types = [...new Set(indicators.map(i => i.indicator_type))];
  const filtered = filter === 'all' ? indicators : indicators.filter(i => i.indicator_type === filter || i.mandal === filter);

  const trendIcon = (t: string) => t === 'improving' ? TrendingUp : t === 'declining' ? TrendingDown : Minus;
  const trendColor = (t: string) => t === 'improving' ? '#00c864' : t === 'declining' ? '#ff5555' : '#8899bb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Economic Intelligence</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Track economic stress signals in your constituency</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={analyse} disabled={analyzing || indicators.length === 0} style={{ ...T.primary, opacity: analyzing || indicators.length === 0 ? 0.5 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Analysis</>}
          </button>
          <button onClick={() => setShowForm(true)} style={T.ghost}><Plus size={13} />Add Data</button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Economic Analysis" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Indicators Tracked', value: indicators.length, color: '#42a5f5' },
          { label: 'Declining Signals', value: declining, color: '#ff5555' },
          { label: 'Indicator Types', value: types.length, color: '#00d4aa' },
        ].map(s => (
          <div key={s.label} style={{ ...T.card, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', ...types.slice(0, 8)].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={T.pill(filter === f)}>{f.replace('_', ' ')}</button>
        ))}
      </div>

      {loading ? <Loading text="Loading economic data..." />
        : filtered.length === 0 ? (
          <Empty icon={LineChartIcon} title="No economic data yet" sub="Track crop prices, employment rates, infrastructure spend and more." action="Add First Indicator" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(ind => {
              const TIcon = trendIcon(ind.trend);
              const tc = trendColor(ind.trend);
              return (
                <motion.div key={ind.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <TIcon size={18} style={{ color: tc, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{ind.indicator_type.replace('_', ' ')}</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>{ind.mandal && `${ind.mandal} · `}{ind.recorded_date}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: tc, fontFamily: 'Space Grotesk' }}>{ind.value}{ind.unit ? ` ${ind.unit}` : ''}</div>
                    <div style={{ fontSize: 10, color: tc, textTransform: 'uppercase', fontWeight: 700 }}>{ind.trend}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Economic Indicator">
          <EconForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function EconForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ indicator_type: 'Crop Prices', mandal: '', value: '', unit: '', trend: 'stable', recorded_date: new Date().toISOString().slice(0, 10), source: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.indicator_type || !form.value) return;
    setBusy(true);
    await api.create('economic_indicators', { ...form, value: Number(form.value) });
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Indicator Type *</label><input value={form.indicator_type} onChange={e => f('indicator_type', e.target.value)} placeholder="e.g. Groundnut Prices, Unemployment Rate" style={T.input} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={T.label}>Value *</label><input type="number" value={form.value} onChange={e => f('value', e.target.value)} placeholder="Numeric value" style={T.input} /></div>
        <div><label style={T.label}>Unit</label><input value={form.unit} onChange={e => f('unit', e.target.value)} placeholder="₹/quintal, %, etc." style={T.input} /></div>
        <div><label style={T.label}>Mandal</label><input value={form.mandal} onChange={e => f('mandal', e.target.value)} placeholder="Mandal" style={T.input} /></div>
        <div><label style={T.label}>Trend</label>
          <select value={form.trend} onChange={e => f('trend', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
            {['improving', 'stable', 'declining'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <button onClick={save} disabled={busy || !form.indicator_type || !form.value} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.indicator_type || !form.value ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Add Indicator'}
      </button>
    </div>
  );
}
