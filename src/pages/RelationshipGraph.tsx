import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Plus, Phone, Calendar, Zap, Loader2, User, Star, TrendingDown, Minus } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../../hooks/useResponsive';

interface Relationship { id: string; entity_name: string; entity_type: string; relationship_type: string; influence_score?: number; alignment: string; last_contact_at?: string; notes?: string; }

const ALIGN_CONFIG: Record<string, { color: string; icon: any }> = {
  warm: { color: '#00c864', icon: Star },
  neutral: { color: '#8899bb', icon: Minus },
  cold: { color: '#ff5555', icon: TrendingDown },
};

export default function RelationshipGraph() {
  const w = useW();
  const [relations, setRelations] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('relationships', { order: 'influence_score', dir: 'DESC', limit: '100' });
      setRelations((data as Relationship[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Analyse my political relationship network. Who should I prioritise contacting this week? Any cold relationships that risk turning into opposition? Relationships: ${JSON.stringify(relations.slice(0, 20))}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? relations : relations.filter(r => r.alignment === filter || r.entity_type === filter);
  const warm = relations.filter(r => r.alignment === 'warm').length;
  const cold = relations.filter(r => r.alignment === 'cold').length;
  const overdue = relations.filter(r => r.last_contact_at && (Date.now() - new Date(r.last_contact_at).getTime()) > 30 * 24 * 60 * 60 * 1000).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Relationship Graph</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Track political allies, influencers and stakeholders</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={analyse} disabled={analyzing || relations.length === 0} style={{ ...T.primary, opacity: analyzing || relations.length === 0 ? 0.5 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Analysis</>}
          </button>
          <button onClick={() => setShowForm(true)} style={T.ghost}><Plus size={13} />Add Contact</button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Relationship Intelligence" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Contacts', value: relations.length, color: '#42a5f5' },
          { label: 'Warm Allies', value: warm, color: '#00c864' },
          { label: 'Cold Relations', value: cold, color: '#ff5555' },
          { label: 'Need Follow-up', value: overdue, color: '#ffa726' },
        ].map(s => (
          <div key={s.label} style={{ ...T.card, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'warm', 'neutral', 'cold', 'politician', 'bureaucrat', 'journalist', 'business', 'party_worker'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={T.pill(filter === f)}>
            {f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <Loading text="Loading relationships..." />
        : filtered.length === 0 ? (
          <Empty icon={Network} title="No relationships tracked" sub="Build your political network by adding allies, officials and influencers." action="Add First Contact" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : `repeat(${w < 900 ? 2 : 3}, 1fr)`, gap: 10 }}>
            {filtered.map(r => {
              const ac = ALIGN_CONFIG[r.alignment] || ALIGN_CONFIG.neutral;
              const Icon = ac.icon;
              const daysSince = r.last_contact_at ? Math.floor((Date.now() - new Date(r.last_contact_at).getTime()) / 86400000) : null;
              const overdue = daysSince !== null && daysSince > 30;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ ...T.card, padding: '14px 16px', borderColor: overdue ? 'rgba(255,167,38,0.3)' : 'rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ac.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color: ac.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 2 }}>{r.entity_name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: '#8899bb' }}>{r.entity_type}</span>
                        {r.relationship_type && <span style={{ fontSize: 10, color: '#8899bb' }}>· {r.relationship_type}</span>}
                        {r.influence_score && <span style={{ fontSize: 10, color: '#ffa726', marginLeft: 'auto' }}>Influence: {r.influence_score}/10</span>}
                      </div>
                      {r.notes && <p style={{ fontSize: 12, color: '#8899bb', margin: '0 0 4px', lineHeight: 1.4 }}>{r.notes}</p>}
                      {daysSince !== null && (
                        <div style={{ fontSize: 11, color: overdue ? '#ffa726' : '#8899bb' }}>
                          <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />
                          {overdue ? `⚠ ${daysSince} days since contact` : `Last contact: ${daysSince} days ago`}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Contact">
          <RelationForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function RelationForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ entity_name: '', entity_type: 'politician', relationship_type: '', influence_score: '5', alignment: 'neutral', last_contact_at: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.entity_name) return;
    setBusy(true);
    await api.create('relationships', { ...form, influence_score: Number(form.influence_score) });
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Name *</label><input value={form.entity_name} onChange={e => f('entity_name', e.target.value)} placeholder="Full name" style={T.input} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={T.label}>Type</label>
          <select value={form.entity_type} onChange={e => f('entity_type', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
            {['politician', 'bureaucrat', 'journalist', 'business', 'party_worker', 'activist', 'academic', 'other'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label style={T.label}>Alignment</label>
          <select value={form.alignment} onChange={e => f('alignment', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
            {['warm', 'neutral', 'cold'].map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div><label style={T.label}>Relationship Type</label><input value={form.relationship_type} onChange={e => f('relationship_type', e.target.value)} placeholder="e.g. District Collector, MLA Colleague, Media Contact" style={T.input} /></div>
      <div><label style={{ ...T.label, marginBottom: 8 }}>Influence Score: <span style={{ color: '#00d4aa' }}>{form.influence_score}/10</span></label>
        <input type="range" min={1} max={10} value={form.influence_score} onChange={e => f('influence_score', e.target.value)} style={{ width: '100%', accentColor: '#00d4aa' }} /></div>
      <div><label style={T.label}>Last Contact Date</label><input type="date" value={form.last_contact_at} onChange={e => f('last_contact_at', e.target.value)} style={T.input} /></div>
      <div><label style={T.label}>Notes</label><textarea value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Context, history, mutual interests..." rows={2} style={{ ...T.input, resize: 'vertical' }} /></div>
      <button onClick={save} disabled={busy || !form.entity_name} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.entity_name ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Add Contact'}
      </button>
    </div>
  );
}
