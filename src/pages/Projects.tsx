import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Zap, Plus, AlertTriangle, CheckCircle, Clock, TrendingUp, Loader2, X, IndianRupee } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken, useW, isMob } from '../components/ui/ModuleLayout';

interface Project { id: string; project_name: string; status: string; budget_allocated?: number; budget_spent?: number; progress_percent?: number; expected_completion?: string; mandal?: string; scheme?: string; description?: string; }

const STATUS_COLOR: Record<string, string> = { planned: '#8899bb', active: '#42a5f5', completed: '#00c864', delayed: '#ff5555', on_hold: '#ffa726' };
const STATUSES = ['planned', 'active', 'completed', 'delayed', 'on_hold'];

export default function Projects() {
  const { user, activePolitician } = useAuth();
  const w = useW();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<any>(null);
  const [assessing, setAssessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const isMp = activePolitician?.designation?.toLowerCase().includes('mp') || activePolitician?.designation?.toLowerCase().includes('member of parliament');

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('projects', { order: 'created_at', dir: 'DESC', limit: '100' });
      setProjects((data as Project[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function assessRisk() {
    setAssessing(true);
    try {
      const r = await fetch('/api/projects/ai-risk', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      setRiskData(d);
    } catch (_) {}
    setAssessing(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);
  const totalBudget = projects.reduce((s, p) => s + (p.budget_allocated || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.budget_spent || 0), 0);
  const active = projects.filter(p => p.status === 'active').length;
  const delayed = projects.filter(p => p.status === 'delayed').length;

  const fmtCr = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Total Projects" value={projects.length} color="#42a5f5" icon={FolderOpen} />
        <Stat label="Active" value={active} color="#00c864" icon={TrendingUp} />
        <Stat label="Delayed" value={delayed} color="#ff5555" icon={AlertTriangle} />
        <Stat label="Total Budget" value={totalBudget ? fmtCr(totalBudget) : '—'} color="#ffa726" icon={IndianRupee} />
      </div>

      {/* MPLADS Banner — only for MPs */}
      {isMp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ ...T.card, padding: '16px 18px', background: 'rgba(255,167,38,0.04)', borderColor: 'rgba(255,167,38,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <IndianRupee size={18} style={{ color: '#ffa726', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffa726' }}>MPLADS Fund Tracker</div>
              <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Annual allocation: ₹5 Crore · Track recommendations and utilisation</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ffa726', fontFamily: 'Space Grotesk' }}>{fmtCr(totalSpent)}</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>spent of {fmtCr(totalBudget || 50000000)}</div>
            </div>
          </div>
          {totalBudget > 0 && (
            <div style={{ marginTop: 10, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ height: '100%', width: `${Math.min(totalSpent / totalBudget * 100, 100)}%`, background: '#ffa726', borderRadius: 3, transition: 'width 0.6s' }} />
            </div>
          )}
        </motion.div>
      )}

      {/* AI Risk */}
      {riskData && (
        <div style={T.ai}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>AI Risk Assessment</div>
            <button onClick={() => setRiskData(null)} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={13} /></button>
          </div>
          {riskData.high_risk?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#ff5555', fontWeight: 700, marginBottom: 6 }}>HIGH RISK PROJECTS</div>
              {riskData.high_risk.map((p: any, i: number) => (
                <div key={i} style={{ padding: '8px 10px', background: 'rgba(255,85,85,0.06)', borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#ff7777', marginTop: 2 }}>{p.risk}</div>
                  <div style={{ fontSize: 11, color: '#00d4aa', marginTop: 2 }}>→ {p.action}</div>
                </div>
              ))}
            </div>
          )}
          {riskData.completion_forecast && <div style={{ fontSize: 12, color: '#d0d8ee' }}><strong style={{ color: '#00d4aa' }}>Forecast:</strong> {riskData.completion_forecast}</div>}
          {riskData.budget_alert && <div style={{ fontSize: 12, color: '#ffa726', marginTop: 6 }}>⚠ {riskData.budget_alert}</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={T.pill(filter === s)}>
              {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <button onClick={assessRisk} disabled={assessing} style={{ ...T.primary, flexShrink: 0, opacity: assessing ? 0.65 : 1 }}>
          {assessing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Assessing...</> : <><Zap size={13} />AI Risk Check</>}
        </button>
        <button onClick={() => setShowForm(true)} style={{ ...T.ghost, flexShrink: 0 }}><Plus size={13} />Add Project</button>
      </div>

      {loading ? <Loading text="Loading projects..." />
        : filtered.length === 0 ? (
          <Empty icon={FolderOpen} title="No projects found" sub="Track constituency development works, MPLADS recommendations and progress." action="Add First Project" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
            {filtered.map(p => {
              const sc = STATUS_COLOR[p.status] || '#8899bb';
              const prog = p.progress_percent || 0;
              const risk = riskData?.high_risk?.find((r: any) => r.name === p.project_name);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '15px 16px', borderColor: risk ? 'rgba(255,85,85,0.3)' : 'rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{p.project_name}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700, textTransform: 'uppercase' }}>{p.status?.replace('_', ' ')}</span>
                        {p.mandal && <span style={{ fontSize: 11, color: '#8899bb' }}>📍 {p.mandal}</span>}
                        {p.scheme && <span style={{ fontSize: 11, color: '#8899bb' }}>{p.scheme}</span>}
                      </div>
                    </div>
                    {p.budget_allocated && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffa726' }}>{fmtCr(p.budget_allocated)}</div>
                        {p.budget_spent && <div style={{ fontSize: 10, color: '#8899bb' }}>{fmtCr(p.budget_spent)} spent</div>}
                      </div>
                    )}
                  </div>
                  {p.description && <p style={{ fontSize: 12, color: '#8899bb', margin: '0 0 10px', lineHeight: 1.5 }}>{p.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${prog}%`, background: sc, borderRadius: 3, transition: 'width 0.6s' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sc, flexShrink: 0 }}>{prog}%</span>
                  </div>
                  {risk && <div style={{ marginTop: 8, fontSize: 11, color: '#ff7777', background: 'rgba(255,85,85,0.06)', padding: '5px 8px', borderRadius: 7 }}>⚠ {risk.risk}</div>}
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={isMp ? 'Add MPLADS / Project' : 'Add Project'} maxW={540}>
          <ProjectForm isMp={isMp} onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function ProjectForm({ isMp, onSave }: { isMp: boolean; onSave: () => void }) {
  const [form, setForm] = useState({ project_name: '', status: 'planned', budget_allocated: '', budget_spent: '', progress_percent: '0', mandal: '', expected_completion: '', scheme: isMp ? 'MPLADS' : '', description: '' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.project_name) return;
    setBusy(true);
    await api.create('projects', { ...form, budget_allocated: form.budget_allocated ? Number(form.budget_allocated) : null, budget_spent: form.budget_spent ? Number(form.budget_spent) : null, progress_percent: Number(form.progress_percent) });
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Project Name *</label><input value={form.project_name} onChange={e => f('project_name', e.target.value)} placeholder="e.g. Construction of road from X to Y" style={T.input} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={T.label}>Status</label><select value={form.status} onChange={e => f('status', e.target.value)} style={{ ...T.input, appearance: 'none' }}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={T.label}>Mandal</label><input value={form.mandal} onChange={e => f('mandal', e.target.value)} placeholder="Mandal" style={T.input} /></div>
        <div><label style={T.label}>Budget (₹)</label><input type="number" value={form.budget_allocated} onChange={e => f('budget_allocated', e.target.value)} placeholder="Amount in rupees" style={T.input} /></div>
        <div><label style={T.label}>Spent (₹)</label><input type="number" value={form.budget_spent} onChange={e => f('budget_spent', e.target.value)} placeholder="Amount spent" style={T.input} /></div>
        <div><label style={T.label}>Progress %</label><input type="number" min="0" max="100" value={form.progress_percent} onChange={e => f('progress_percent', e.target.value)} style={T.input} /></div>
        <div><label style={T.label}>Expected Completion</label><input type="date" value={form.expected_completion} onChange={e => f('expected_completion', e.target.value)} style={T.input} /></div>
      </div>
      {isMp && <div><label style={T.label}>Scheme</label><input value={form.scheme} onChange={e => f('scheme', e.target.value)} placeholder="MPLADS / PMGSY / etc." style={T.input} /></div>}
      <div><label style={T.label}>Description</label><textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Project details..." rows={2} style={{ ...T.input, resize: 'vertical' }} /></div>
      <button onClick={save} disabled={busy || !form.project_name} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.project_name ? 0.5 : 1 }}>
        {busy ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Add Project'}
      </button>
    </div>
  );
}
