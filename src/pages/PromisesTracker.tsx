import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Plus, CheckCircle, Clock, AlertTriangle, Sparkles, X, Loader2, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { card, label, inputStyle, btnPrimary, aiPanel, useBreakpoint } from '../lib/responsive';

interface Promise { id: string; promise_text: string; category: string; status: string; made_at: string; deadline?: string; location?: string; source?: string; notes?: string; completion_date?: string; }

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  not_started: { color: '#8899bb', icon: Clock },
  in_progress: { color: '#42a5f5', icon: Clock },
  completed: { color: '#00c864', icon: CheckCircle },
  cancelled: { color: '#ff5555', icon: X },
};
const CATEGORIES = ['Infrastructure', 'Agriculture', 'Education', 'Healthcare', 'Employment', 'Water', 'Electricity', 'Welfare', 'Development'];

export default function PromisesTracker() {
  const { session } = useAuth();
  const { isMobile } = useBreakpoint();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [promises, setPromises] = useState<Promise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const data = await api.list('promises', { order: 'created_at', dir: 'DESC', limit: '100' });
    setPromises((data as Promise[]) || []);
    setLoading(false);
  }

  async function draftAnnouncement(p: Promise) {
    setDrafting(p.id);
    try {
      const r = await fetch('/api/content-factory/ai-generate', {
        method: 'POST', headers: h,
        body: JSON.stringify({ content_type: 'press_release', context: `Promise fulfilled: ${p.promise_text}. Location: ${p.location || 'constituency'}. Category: ${p.category}.` }),
      });
      const d = await r.json();
      setDrafts(prev => ({ ...prev, [p.id]: d.content || '' }));
    } catch (_) {}
    setDrafting(null);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? promises : promises.filter(p => p.status === filter);
  const stats = { total: promises.length, completed: promises.filter(p => p.status === 'completed').length, inProgress: promises.filter(p => p.status === 'in_progress').length, overdue: promises.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed').length };
  const completionPct = stats.total ? Math.round(stats.completed / stats.total * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Promises', value: stats.total, color: '#42a5f5' },
          { label: 'Completed', value: `${stats.completed} (${completionPct}%)`, color: '#00c864' },
          { label: 'In Progress', value: stats.inProgress, color: '#ffa726' },
          { label: 'Overdue', value: stats.overdue, color: '#ff5555' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
            {s.label === 'Completed' && stats.total > 0 && (
              <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                <div style={{ height: '100%', width: `${completionPct}%`, background: '#00c864', borderRadius: 2, transition: 'width 0.6s' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {['all', 'not_started', 'in_progress', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filter === s ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filter === s ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: filter === s ? '#00d4aa' : '#8899bb' }}>
              {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, flexShrink: 0 }}>
          <Plus size={13} /> Add Promise
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} /><div>Loading...</div></div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Flag size={32} style={{ color: '#8899bb', margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 6 }}>No promises logged</div>
          <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, margin: '0 auto', display: 'inline-flex' }}><Plus size={13} />Add First Promise</button>
        </div>
      ) : filtered.map(p => {
        const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.not_started;
        const Icon = sc.icon;
        const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
        return (
          <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...card, padding: '16px', borderLeft: `3px solid ${sc.color}`, borderRadius: '0 14px 14px 0', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Icon size={16} style={{ color: sc.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', margin: '0 0 6px', lineHeight: 1.5 }}>{p.promise_text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>{p.category}</span>
                  {p.location && <span style={{ color: '#8899bb' }}>📍 {p.location}</span>}
                  {p.deadline && <span style={{ color: isOverdue ? '#ff5555' : '#8899bb' }}><Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />{isOverdue ? 'OVERDUE · ' : ''}{p.deadline}</span>}
                </div>
                {/* Draft announcement for completed */}
                {p.status === 'completed' && (
                  <div style={{ marginTop: 10 }}>
                    {drafts[p.id] ? (
                      <div style={aiPanel}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', marginBottom: 8 }}>AI PRESS RELEASE DRAFT</div>
                        <p style={{ fontSize: 12, color: '#d0d8ee', margin: 0, lineHeight: 1.6 }}>{drafts[p.id]}</p>
                      </div>
                    ) : (
                      <button onClick={() => draftAnnouncement(p)} disabled={drafting === p.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {drafting === p.id ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />Drafting...</> : <><Sparkles size={11} />Draft Press Release</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {p.status !== 'completed' && (
                <button onClick={async () => { await api.update('promises', p.id, { status: 'completed', completion_date: new Date().toISOString().slice(0, 10) }); load(); }}
                  style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)', color: '#00c864', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  ✓ Mark Done
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,11,24,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Add Promise</div>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <AddPromiseForm onSave={() => { setShowForm(false); load(); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddPromiseForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ promise_text: '', category: 'Infrastructure', location: '', deadline: '', source: '', status: 'not_started' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.promise_text) return;
    setSaving(true);
    await api.create('promises', { ...form, made_at: new Date().toISOString() });
    setSaving(false);
    onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={label}>Promise / Commitment *</label><textarea value={form.promise_text} onChange={e => f('promise_text', e.target.value)} placeholder="What was promised to the constituency?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={label}>Category</label><select value={form.category} onChange={e => f('category', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label style={label}>Deadline</label><input type="date" value={form.deadline} onChange={e => f('deadline', e.target.value)} style={inputStyle} /></div>
      </div>
      <div><label style={label}>Location</label><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Where was this promised?" style={inputStyle} /></div>
      <div><label style={label}>Source</label><input value={form.source} onChange={e => f('source', e.target.value)} placeholder="Rally, interview, official announcement..." style={inputStyle} /></div>
      <button onClick={save} disabled={saving || !form.promise_text} style={{ ...btnPrimary, justifyContent: 'center', width: '100%', opacity: saving ? 0.7 : 1 }}>
        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Save Promise'}
      </button>
    </div>
  );
}
