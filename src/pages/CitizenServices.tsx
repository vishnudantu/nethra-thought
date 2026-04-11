import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Handshake, Plus, Zap, Loader2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken, useW, isMob } from '../components/ui/ModuleLayout';

interface Request { id: string; requester_name: string; request_type: string; status: string; description?: string; source?: string; created_at: string; }

const STATUS_COLOR: Record<string, string> = { open: '#ffa726', in_progress: '#42a5f5', resolved: '#00c864', closed: '#8899bb' };

export default function CitizenServices() {
  const w = useW();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('citizen_service_requests', { order: 'created_at', dir: 'DESC', limit: '100' });
      setRequests((data as Request[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Analyse my citizen service requests. What are the top service gaps? Which request types need process improvements? Data: ${JSON.stringify(requests.slice(0, 20))}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const open = requests.filter(r => r.status === 'open').length;
  const resolved = requests.filter(r => r.status === 'resolved').length;
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Citizen Services</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Service requests from constituents via app, WhatsApp and walk-ins</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={analyse} disabled={analyzing} style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Analysis</>}
          </button>
          <button onClick={() => setShowForm(true)} style={T.ghost}><Plus size={13} />Add Request</button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Service Gap Analysis" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Open Requests" value={open} color="#ffa726" icon={Clock} />
        <Stat label="Resolved" value={resolved} color="#00c864" icon={CheckCircle} />
        <Stat label="Total" value={requests.length} color="#42a5f5" icon={Handshake} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'open', 'in_progress', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={T.pill(filter === f)}>
            {f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <Loading text="Loading requests..." />
        : filtered.length === 0 ? (
          <Empty icon={Handshake} title="No service requests yet" sub="Track citizen service requests from your constituency app and walk-ins." action="Add Request" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {filtered.map(req => {
              const sc = STATUS_COLOR[req.status] || '#8899bb';
              return (
                <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ ...T.card, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{req.requester_name}</span>
                      <span style={{ fontSize: 11, color: '#8899bb' }}>· {req.request_type}</span>
                      {req.source && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(66,165,245,0.1)', color: '#42a5f5', fontWeight: 600 }}>{req.source}</span>}
                    </div>
                    {req.description && <p style={{ fontSize: 12, color: '#8899bb', margin: 0, lineHeight: 1.4 }}>{req.description}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700 }}>{req.status}</span>
                    {req.status === 'open' && (
                      <button onClick={async () => { await api.update('citizen_service_requests', req.id, { status: 'in_progress' }); load(); }}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(66,165,245,0.08)', border: '1px solid rgba(66,165,245,0.2)', color: '#42a5f5', cursor: 'pointer' }}>
                        Start
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Service Request">
          <CSForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function CSForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ requester_name: '', request_type: '', description: '', source: 'walk_in', status: 'open' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.requester_name || !form.request_type) return;
    setBusy(true);
    await api.create('citizen_service_requests', form);
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Requester Name *</label><input value={form.requester_name} onChange={e => f('requester_name', e.target.value)} placeholder="Citizen name" style={T.input} /></div>
      <div><label style={T.label}>Request Type *</label><input value={form.request_type} onChange={e => f('request_type', e.target.value)} placeholder="e.g. Pension, Ration Card, Road, Hospital" style={T.input} /></div>
      <div><label style={T.label}>Description</label><textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} style={{ ...T.input, resize: 'vertical' }} /></div>
      <div><label style={T.label}>Source</label>
        <select value={form.source} onChange={e => f('source', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
          {['walk_in', 'app', 'whatsapp', 'web', 'phone'].map(s => <option key={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>
      <button onClick={save} disabled={busy || !form.requester_name || !form.request_type} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.requester_name || !form.request_type ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Add Request'}
      </button>
    </div>
  );
}
