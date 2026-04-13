import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, AlertTriangle, CheckCircle, Clock, Radio, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { T, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../hooks/useResponsive';

interface Update { id: string; booth_id?: string; update_type: string; description: string; status: string; reported_at: string; }

const TYPE_COLOR: Record<string, string> = { 'voter_issue': '#ffa726', 'booth_problem': '#ff5555', 'turnout_update': '#42a5f5', 'agent_report': '#00c864', 'misinformation': '#ff5555', 'general': '#8899bb' };

export default function ElectionCommandCenter() {
  const w = useW();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [liveMode, setLiveMode] = useState(false);

  async function load() {
    const data = await api.list('election_updates', { order: 'reported_at', dir: 'DESC', limit: '100' });
    setUpdates((data as Update[]) || []);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // Live mode auto-refresh every 30s
    if (liveMode) {
      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [liveMode]);

  const filtered = filter === 'all' ? updates : updates.filter(u => u.status === filter || u.update_type === filter);
  const open = updates.filter(u => u.status === 'open').length;
  const resolved = updates.filter(u => u.status === 'resolved').length;
  const critical = updates.filter(u => ['voter_issue', 'booth_problem', 'misinformation'].includes(u.update_type) && u.status === 'open').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Election Command Center</h1>
            {liveMode && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, background: 'rgba(255,85,85,0.15)', color: '#ff5555', fontWeight: 700, animation: 'pulse 2s infinite' }}>● LIVE</span>}
          </div>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Real-time booth updates and issue tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setLiveMode(v => !v)}
            style={{ ...T.ghost, borderColor: liveMode ? 'rgba(255,85,85,0.3)' : undefined, color: liveMode ? '#ff5555' : undefined }}>
            <Radio size={13} />{liveMode ? 'Stop Live' : 'Go Live'}
          </button>
          <button onClick={load} style={{ ...T.ghost, padding: '9px' }}><RefreshCw size={13} /></button>
          <button onClick={() => setShowForm(true)} style={T.primary}><Plus size={13} />Report Issue</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Open Issues" value={open} color="#ffa726" icon={Clock} />
        <Stat label="Critical" value={critical} color="#ff5555" icon={AlertTriangle} />
        <Stat label="Resolved" value={resolved} color="#00c864" icon={CheckCircle} />
        <Stat label="Total Reports" value={updates.length} color="#42a5f5" icon={Target} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'open', 'in_progress', 'resolved', 'voter_issue', 'booth_problem', 'misinformation'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={T.pill(filter === f)}>
            {f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <Loading text="Loading updates..." />
        : filtered.length === 0 ? (
          <Empty icon={Target} title="No updates yet" sub="Report booth issues, turnout updates, and agent reports here." action="Report Issue" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {filtered.map(u => {
              const tc = TYPE_COLOR[u.update_type] || '#8899bb';
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '13px 16px', borderLeft: u.status === 'open' && critical > 0 ? `3px solid ${tc}` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${tc}15`, color: tc, fontWeight: 700, textTransform: 'uppercase' }}>{u.update_type.replace('_', ' ')}</span>
                        {u.booth_id && <span style={{ fontSize: 11, color: '#8899bb' }}>Booth #{u.booth_id}</span>}
                        <span style={{ fontSize: 11, color: '#8899bb', marginLeft: 'auto' }}>{new Date(u.reported_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#d0d8ee', margin: 0, lineHeight: 1.5 }}>{u.description}</p>
                    </div>
                    {u.status === 'open' && (
                      <button onClick={async () => { await api.update('election_updates', u.id, { status: 'resolved' }); load(); }}
                        style={{ ...T.ghost, padding: '5px 10px', fontSize: 11, flexShrink: 0 }}>
                        <CheckCircle size={11} />Resolve
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Report Booth Update">
          <UpdateForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function UpdateForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ booth_id: '', update_type: 'general', description: '', status: 'open' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.description) return;
    setBusy(true);
    await api.create('election_updates', { ...form, reported_at: new Date().toISOString() });
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={T.label}>Booth Number</label><input value={form.booth_id} onChange={e => f('booth_id', e.target.value)} placeholder="Booth #" style={T.input} /></div>
        <div><label style={T.label}>Type</label>
          <select value={form.update_type} onChange={e => f('update_type', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
            {['voter_issue', 'booth_problem', 'turnout_update', 'agent_report', 'misinformation', 'general'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>
      <div><label style={T.label}>Description *</label><textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="What happened?" rows={3} style={{ ...T.input, resize: 'vertical' }} /></div>
      <button onClick={save} disabled={busy || !form.description} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.description ? 0.5 : 1 }}>
        {busy ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  );
}
