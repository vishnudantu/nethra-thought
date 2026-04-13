import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Users, TrendingUp, AlertTriangle, Plus, Zap, MapPin, Loader2, User } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../../hooks/useResponsive';

interface Booth { id: string; booth_number: string; booth_name?: string; location?: string; mandal?: string; total_voters?: number; expected_turnout?: number; agent_name?: string; historical_vote_percentage?: any; }

export default function BoothManagement() {
  const w = useW();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('booths', { order: 'booth_number', dir: 'ASC', limit: '200' });
      setBooths((data as Booth[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyseBooths() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Analyse my booth data and identify: 1) WEAK BOOTHS that need immediate karyakarta attention, 2) STRONG BOOTHS to protect, 3) SWING BOOTHS to target. Here is the booth data: ${JSON.stringify(booths.slice(0, 20))}. Be specific with booth numbers and actions.` }] }),
      });
      const text = await r.text();
      setAnalysis(text);
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const totalVoters = booths.reduce((s, b) => s + (b.total_voters || 0), 0);
  const withAgent = booths.filter(b => b.agent_name).length;
  const filtered = search ? booths.filter(b => `${b.booth_number} ${b.booth_name} ${b.mandal} ${b.location}`.toLowerCase().includes(search.toLowerCase())) : booths;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Total Booths" value={booths.length} color="#42a5f5" icon={Box} />
        <Stat label="Total Voters" value={totalVoters.toLocaleString('en-IN')} color="#00d4aa" icon={Users} />
        <Stat label="Agents Assigned" value={withAgent} color="#00c864" icon={User} />
        <Stat label="Unassigned Booths" value={booths.length - withAgent} color="#ffa726" icon={AlertTriangle} />
      </div>

      {(analysis || analyzing) && (
        <AIPanel title="Booth Intelligence Analysis" content={analysis} loading={analyzing} onClose={() => setAnalysis('')} />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search booth number, name, mandal..." style={{ ...T.input, flex: 1, minWidth: 180 }} />
        <button onClick={analyseBooths} disabled={analyzing || booths.length === 0}
          style={{ ...T.primary, flexShrink: 0, opacity: analyzing || booths.length === 0 ? 0.5 : 1 }}>
          {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Booth Analysis</>}
        </button>
        <button onClick={() => setShowForm(true)} style={{ ...T.ghost, flexShrink: 0 }}><Plus size={13} />Add Booth</button>
      </div>

      {loading ? <Loading text="Loading booth data..." />
        : filtered.length === 0 ? (
          <Empty icon={Box} title="No booths configured" sub="Add polling booths to track voters, agents and turnout predictions." action="Add First Booth" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : `repeat(${w < 900 ? 2 : 3}, 1fr)`, gap: 10 }}>
            {filtered.map(b => {
              const hist = b.historical_vote_percentage;
              const lastPct = typeof hist === 'object' ? Object.values(hist).pop() as number : null;
              const color = lastPct ? (lastPct >= 55 ? '#00c864' : lastPct >= 40 ? '#ffa726' : '#ff5555') : '#8899bb';
              return (
                <motion.div key={b.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ ...T.card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color }}>#{b.booth_number}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{b.booth_name || `Booth ${b.booth_number}`}</div>
                        {b.mandal && <div style={{ fontSize: 11, color: '#8899bb' }}>{b.mandal}</div>}
                      </div>
                    </div>
                    {lastPct && <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'Space Grotesk' }}>{lastPct}%</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#8899bb', flexWrap: 'wrap' }}>
                    {b.total_voters && <span><Users size={10} style={{ display: 'inline', marginRight: 3 }} />{b.total_voters.toLocaleString('en-IN')} voters</span>}
                    {b.location && <span><MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{b.location}</span>}
                  </div>
                  {b.agent_name
                    ? <div style={{ marginTop: 8, fontSize: 11, color: '#00c864', display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} />Agent: {b.agent_name}</div>
                    : <div style={{ marginTop: 8, fontSize: 11, color: '#ffa726' }}>⚠ No agent assigned</div>}
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Booth">
          <BoothForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function BoothForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ booth_number: '', booth_name: '', location: '', mandal: '', total_voters: '', expected_turnout: '', agent_name: '' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.booth_number) return;
    setBusy(true);
    await api.create('booths', { ...form, total_voters: form.total_voters ? Number(form.total_voters) : null, expected_turnout: form.expected_turnout ? Number(form.expected_turnout) : null });
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={T.label}>Booth Number *</label><input value={form.booth_number} onChange={e => f('booth_number', e.target.value)} placeholder="e.g. 42" style={T.input} /></div>
        <div><label style={T.label}>Booth Name</label><input value={form.booth_name} onChange={e => f('booth_name', e.target.value)} placeholder="e.g. Town Hall" style={T.input} /></div>
        <div><label style={T.label}>Mandal</label><input value={form.mandal} onChange={e => f('mandal', e.target.value)} placeholder="Mandal" style={T.input} /></div>
        <div><label style={T.label}>Location</label><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Specific location" style={T.input} /></div>
        <div><label style={T.label}>Total Voters</label><input type="number" value={form.total_voters} onChange={e => f('total_voters', e.target.value)} placeholder="Voter count" style={T.input} /></div>
        <div><label style={T.label}>Expected Turnout</label><input type="number" value={form.expected_turnout} onChange={e => f('expected_turnout', e.target.value)} placeholder="Expected turnout" style={T.input} /></div>
      </div>
      <div><label style={T.label}>Booth Agent</label><input value={form.agent_name} onChange={e => f('agent_name', e.target.value)} placeholder="Assigned agent name" style={T.input} /></div>
      <button onClick={save} disabled={busy || !form.booth_number} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.booth_number ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Add Booth'}
      </button>
    </div>
  );
}
