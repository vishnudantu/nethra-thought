import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, Plus, CheckCircle, Clock, Loader2, Calendar, X, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { card, label, inputStyle, btnPrimary, aiPanel, useBreakpoint } from '../lib/responsive';

interface Visit { id: string; mandal: string; village?: string; priority: number; reasoning: string; recommended_date: string; status: string; last_visit_date?: string; notes?: string; }

const STATUS_COLOR: Record<string, string> = { planned: '#42a5f5', completed: '#00c864', skipped: '#8899bb' };

export default function SmartVisitPlanner() {
  const { session } = useAuth();
  const { isMobile } = useBreakpoint();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');

  async function load() {
    setLoading(true);
    const data = await api.list('visit_plans', { order: 'recommended_date', dir: 'ASC', limit: '50' });
    setVisits((data as Visit[]) || []);
    setLoading(false);
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: h,
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Based on my constituency data, suggest a visit plan for the next 2 weeks. Which mandals/villages need immediate attention? Consider pending grievances, sentiment, and time since last visit. Format as a clear numbered list with specific locations and reasons.` }],
          mode: 'constituency',
        }),
      });
      const text = await r.text();
      setAiPlan(text);
    } catch (_) {}
    setGenerating(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? visits : visits.filter(v => v.status === filter.toLowerCase());

  const priorityColor = (p: number) => p >= 8 ? '#ff5555' : p >= 5 ? '#ffa726' : '#00c864';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Smart Visit Planner</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>AI-curated constituency visit priorities</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={generatePlan} disabled={generating} style={{ ...btnPrimary, opacity: generating ? 0.7 : 1 }}>
            {generating ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Planning...</> : <><Sparkles size={13} />AI Plan</>}
          </button>
          <button onClick={() => setShowForm(true)} style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Add Visit
          </button>
        </div>
      </div>

      {aiPlan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={aiPanel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={13} style={{ color: '#00d4aa' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#00d4aa' }}>AI RECOMMENDED VISIT PLAN</span></div>
            <button onClick={() => setAiPlan('')} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={13} /></button>
          </div>
          <p style={{ fontSize: 13, color: '#d0d8ee', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{aiPlan}</p>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        {['All', 'Planned', 'Completed', 'Skipped'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filter === s ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filter === s ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: filter === s ? '#00d4aa' : '#8899bb' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} /><div>Loading visits...</div></div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <MapPin size={32} style={{ color: '#8899bb', margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 6 }}>No visits planned</div>
          <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 16 }}>Use AI Plan to get smart visit recommendations</div>
          <button onClick={generatePlan} style={btnPrimary}><Sparkles size={13} />Generate AI Plan</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
          {filtered.map(v => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${priorityColor(v.priority)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: priorityColor(v.priority) }}>{v.priority}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{v.mandal}</div>
                      {v.village && <div style={{ fontSize: 11, color: '#8899bb' }}>{v.village}</div>}
                    </div>
                  </div>
                  {v.reasoning && <p style={{ fontSize: 12, color: '#8899bb', margin: '0 0 8px', lineHeight: 1.5 }}>{v.reasoning}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                    <span style={{ color: STATUS_COLOR[v.status] || '#8899bb', fontWeight: 600 }}>● {v.status}</span>
                    {v.recommended_date && <span style={{ color: '#8899bb' }}><Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />{v.recommended_date}</span>}
                  </div>
                </div>
                {v.status === 'planned' && (
                  <button onClick={async () => { await api.update('visit_plans', v.id, { status: 'completed' }); load(); }}
                    style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)', color: '#00c864', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    <CheckCircle size={11} style={{ display: 'inline', marginRight: 3 }} />Done
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,11,24,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Add Visit Plan</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <AddVisitForm onSave={() => { setShowForm(false); load(); }} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AddVisitForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ mandal: '', village: '', priority: 5, reasoning: '', recommended_date: '', status: 'planned' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.mandal) return;
    setSaving(true);
    await api.create('visit_plans', form);
    setSaving(false);
    onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={label}>Mandal *</label><input value={form.mandal} onChange={e => f('mandal', e.target.value)} placeholder="Mandal name" style={inputStyle} /></div>
      <div><label style={label}>Village (optional)</label><input value={form.village} onChange={e => f('village', e.target.value)} placeholder="Specific village" style={inputStyle} /></div>
      <div><label style={{ ...label, marginBottom: 8 }}>Priority: <span style={{ color: '#00d4aa' }}>{form.priority}/10</span></label>
        <input type="range" min={1} max={10} value={form.priority} onChange={e => f('priority', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00d4aa' }} /></div>
      <div><label style={label}>Reasoning</label><textarea value={form.reasoning} onChange={e => f('reasoning', e.target.value)} placeholder="Why visit this location?" rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
      <div><label style={label}>Recommended Date</label><input type="date" value={form.recommended_date} onChange={e => f('recommended_date', e.target.value)} style={inputStyle} /></div>
      <button onClick={save} disabled={saving || !form.mandal} style={{ ...btnPrimary, justifyContent: 'center', width: '100%', marginTop: 4, opacity: saving ? 0.7 : 1 }}>
        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Save Visit Plan'}
      </button>
    </div>
  );
}
