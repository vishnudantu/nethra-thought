import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users2, Plus, RefreshCw, Zap, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;

// Responsive hook — inline to prevent module initialization order issues
import { useState as _useStateW, useEffect as _useEffectW } from 'react';
function useW() {
  const [_w, _setW] = _useStateW(typeof window !== 'undefined' ? window.innerWidth : 1440);
  _useEffectW(() => { const _fn = () => _setW(window.innerWidth); window.addEventListener('resize', _fn); return () => window.removeEventListener('resize', _fn); }, []);
  return _w;
}
const isMob = (_w: number) => _w < 640;
const isTab = (_w: number) => _w >= 640 && _w < 1024;


interface Integration { id: string; party_name: string; integration_type: string; status: string; last_sync_at?: string; notes?: string; }

export default function PartyIntegration() {
  const w = useW();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('party_integrations', { order: 'created_at', dir: 'DESC', limit: '30' });
      setIntegrations((data as Integration[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Review my party coordination data and suggest which alliances to strengthen or reconsider. Data: ${JSON.stringify(integrations)}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const active = integrations.filter(i => i.status === 'active').length;
  const STATUS_COLOR: Record<string, string> = { active: '#00c864', pending: '#ffa726', paused: '#8899bb', disabled: '#ff5555' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Party Integration</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Coordinate party-level intelligence and alliance management</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={analyse} disabled={analyzing} style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Strategy</>}
          </button>
          <button onClick={() => setShowForm(true)} style={T.ghost}><Plus size={13} />Add Integration</button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Alliance Strategy" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Total" value={integrations.length} color="#42a5f5" icon={Users2} />
        <Stat label="Active" value={active} color="#00c864" icon={CheckCircle} />
        <Stat label="Needs Attention" value={integrations.filter(i => i.status === 'pending' || i.status === 'paused').length} color="#ffa726" icon={AlertTriangle} />
      </div>

      {loading ? <Loading text="Loading party data..." />
        : integrations.length === 0 ? (
          <Empty icon={Users2} title="No party integrations" sub="Track coordination with allied parties, wing organisations and coalition partners." action="Add First Integration" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {integrations.map(item => {
              const sc = STATUS_COLOR[item.status] || '#8899bb';
              return (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ ...T.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${sc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users2 size={16} style={{ color: sc }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{item.party_name}</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>{item.integration_type} {item.last_sync_at ? `· Last sync: ${new Date(item.last_sync_at).toLocaleDateString('en-IN')}` : ''}</div>
                    {item.notes && <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>{item.notes}</div>}
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{item.status}</span>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Party Integration">
          <PIForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function PIForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ party_name: '', integration_type: '', status: 'pending', notes: '' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.party_name) return;
    setBusy(true);
    await api.create('party_integrations', form);
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Party Name *</label><input value={form.party_name} onChange={e => f('party_name', e.target.value)} placeholder="Allied party name" style={T.input} /></div>
      <div><label style={T.label}>Integration Type</label><input value={form.integration_type} onChange={e => f('integration_type', e.target.value)} placeholder="e.g. Pre-poll Alliance, Wing Organisation, Coalition" style={T.input} /></div>
      <div><label style={T.label}>Status</label>
        <select value={form.status} onChange={e => f('status', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
          {['pending', 'active', 'paused', 'disabled'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div><label style={T.label}>Notes</label><textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} style={{ ...T.input, resize: 'vertical' }} /></div>
      <button onClick={save} disabled={busy || !form.party_name} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.party_name ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Add Integration'}
      </button>
    </div>
  );
}
