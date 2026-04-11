import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, CheckCircle, Clock, AlertCircle, Zap,
  MessageSquare, Filter, ChevronDown, Loader2, Sparkles, Send
} from 'lucide-react';
import { api } from '../lib/api';
import { useBreakpoint, card, label, inputStyle, btnPrimary, aiPanel } from '../lib/responsive';
import Badge from '../components/ui/Badge';
import { statusBadge, priorityBadge } from '../components/ui/badgeUtils';
import type { Grievance } from '../lib/types';
import { useAuth } from '../lib/auth';

const CATEGORIES = ['All','Infrastructure','Water Supply','Education','Healthcare','Agriculture','Electricity','Social Welfare','Roads & Infrastructure','Environment','Welfare & Pensions','Sanitation','General'];
const STATUSES = ['All','Pending','In Progress','Resolved','Escalated','Closed'];
const PRIORITIES = ['Low','Medium','High','Urgent'];

export default function Grievances() {
  const { isMobile, isTablet, width } = useBreakpoint();
  const { session } = useAuth();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Grievance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [aiTriage, setAiTriage] = useState<any[]>([]);
  const [triaging, setTriaging] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ [id: string]: string }>({});
  const [draftingFor, setDraftingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.list('grievances', { order: 'created_at', dir: 'DESC', limit: '200' });
    setGrievances((data as Grievance[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = grievances.filter(g => {
    if (filterCat !== 'All' && g.category !== filterCat) return false;
    if (filterStatus !== 'All' && g.status !== filterStatus) return false;
    if (filterPriority !== 'All' && g.priority !== filterPriority) return false;
    if (search && !`${g.petitioner_name} ${g.subject} ${g.location}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: grievances.length,
    pending: grievances.filter(g => g.status === 'Pending').length,
    urgent: grievances.filter(g => g.priority === 'Urgent').length,
    resolved: grievances.filter(g => g.status === 'Resolved').length,
  };

  async function runAiTriage() {
    setTriaging(true);
    try {
      const r = await fetch('/api/grievances/ai-triage', { method: 'POST', headers: h });
      const d = await r.json();
      setAiTriage(d.triage || []);
    } catch (_) {}
    setTriaging(false);
  }

  async function draftResponse(id: string) {
    setDraftingFor(id);
    try {
      const r = await fetch(`/api/grievances/${id}/ai-response`, { method: 'POST', headers: h });
      const d = await r.json();
      setAiResponse(prev => ({ ...prev, [id]: d.response || '' }));
    } catch (_) {}
    setDraftingFor(null);
  }

  const urgencyColor = (u: number) => u >= 8 ? '#ff5555' : u >= 5 ? '#ffa726' : '#00c864';

  const gridCols = isMobile ? '1fr' : isTablet ? '1fr' : '1fr 380px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 10 }}>
        {[
          { label: 'Total', value: stats.total, color: '#00d4aa', icon: MessageSquare },
          { label: 'Pending', value: stats.pending, color: '#ffa726', icon: Clock },
          { label: 'Urgent', value: stats.urgent, color: '#ff5555', icon: AlertCircle },
          { label: 'Resolved', value: stats.resolved, color: '#00c864', icon: CheckCircle },
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

      {/* AI Triage banner */}
      {aiTriage.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ ...aiPanel }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} style={{ color: '#00d4aa' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>AI Triage — Top Priority Cases</span>
            </div>
            <button onClick={() => setAiTriage([])} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aiTriage.slice(0, 5).map((t: any) => {
              const g = grievances.find(x => x.id == t.id);
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  onClick={() => g && setSelected(g)}>
                  <div style={{ minWidth: 28, height: 28, borderRadius: 8, background: `${urgencyColor(t.urgency)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: urgencyColor(t.urgency) }}>{t.urgency}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g?.subject || `Grievance #${t.id}`}</div>
                    <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{t.action}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Search + filters + AI button */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#8899bb' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search grievances..."
            style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: showFilters ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showFilters ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`, color: showFilters ? '#00d4aa' : '#8899bb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Filter size={13} /> Filters <ChevronDown size={12} />
        </button>
        <button onClick={runAiTriage} disabled={triaging}
          style={{ ...btnPrimary, opacity: triaging ? 0.7 : 1 }}>
          {triaging ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Triaging...</> : <><Zap size={13} />AI Triage</>}
        </button>
        <button onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={13} /> New
        </button>
      </div>

      {/* Filter row */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 0' }}>
              {[
                { label: 'Category', value: filterCat, set: setFilterCat, opts: CATEGORIES },
                { label: 'Status', value: filterStatus, set: setFilterStatus, opts: STATUSES },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 10, color: '#8899bb', marginBottom: 4, fontWeight: 700 }}>{f.label.toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {f.opts.map(o => (
                      <button key={o} onClick={() => f.set(o)}
                        style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: f.value === o ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${f.value === o ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: f.value === o ? '#00d4aa' : '#8899bb' }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 16, alignItems: 'start' }}>

        {/* Grievance list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13 }}>Loading grievances...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center', color: '#8899bb' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No grievances found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters or add a new one</div>
            </div>
          ) : filtered.map(g => {
            const triage = aiTriage.find((t: any) => t.id == g.id);
            const isSelected = selected?.id === g.id;
            return (
              <motion.div key={g.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(isSelected ? null : g)}
                style={{ ...card, padding: '14px 16px', cursor: 'pointer', borderColor: isSelected ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)', background: isSelected ? 'rgba(0,212,170,0.04)' : 'rgba(255,255,255,0.04)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Badge {...priorityBadge(g.priority)} />
                      <Badge {...statusBadge(g.status)} />
                      {triage && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: `${urgencyColor(triage.urgency)}15`, color: urgencyColor(triage.urgency), fontWeight: 700 }}>Urgency {triage.urgency}/10</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{g.subject}</div>
                    <div style={{ fontSize: 12, color: '#8899bb' }}>{g.petitioner_name} · {g.location || 'Location not specified'}</div>
                    {g.description && <div style={{ fontSize: 12, color: '#8899bb', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{g.description}</div>}
                    {triage && <div style={{ marginTop: 8, fontSize: 11, color: '#00d4aa', background: 'rgba(0,212,170,0.06)', padding: '5px 8px', borderRadius: 7 }}>💡 {triage.action}</div>}

                    {/* AI Response section */}
                    {isSelected && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 12, overflow: 'hidden' }}>
                        {aiResponse[g.id] ? (
                          <div style={{ ...aiPanel, marginTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', marginBottom: 8 }}>AI DRAFTED RESPONSE</div>
                            <p style={{ fontSize: 12, color: '#d0d8ee', lineHeight: 1.6, margin: 0 }}>{aiResponse[g.id]}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button style={{ ...btnPrimary, fontSize: 11, padding: '6px 14px' }}>
                                <Send size={11} /> Send Response
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setAiResponse(p => { const n = {...p}; delete n[g.id]; return n; }); }}
                                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899bb', fontSize: 11, cursor: 'pointer' }}>
                                Clear
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); draftResponse(g.id); }} disabled={draftingFor === g.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                            {draftingFor === g.id ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />Drafting...</> : <><Sparkles size={12} />Draft AI Response</>}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#8899bb', flexShrink: 0 }}>{new Date(g.created_at!).toLocaleDateString('en-IN')}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary panel - desktop only */}
        {!isMobile && !isTablet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 14 }}>Category Breakdown</div>
              {['Infrastructure','Water Supply','Education','Agriculture','Electricity','General'].map(cat => {
                const count = grievances.filter(g => g.category === cat).length;
                const pct = grievances.length ? Math.round(count / grievances.length * 100) : 0;
                if (count === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#d0d8ee' }}>{cat}</span>
                      <span style={{ color: '#8899bb' }}>{count}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#00d4aa,#1e88e5)', borderRadius: 2, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length > 0 && (
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 4 }}>{filtered.length} results · Click any grievance to expand</div>
                <div style={{ fontSize: 11, color: '#8899bb' }}>Use <span style={{ color: '#00d4aa' }}>AI Triage</span> to rank by urgency</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && <GrievanceForm onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function GrievanceForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ petitioner_name: '', contact: '', category: 'General', subject: '', description: '', location: '', priority: 'Medium', status: 'Pending' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (!form.petitioner_name || !form.subject) return;
    setSaving(true);
    await api.create('grievances', form);
    setSaving(false);
    onSave();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6,11,24,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>New Grievance</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { k: 'petitioner_name', l: 'Petitioner Name *', ph: 'Full name', full: false },
            { k: 'contact', l: 'Phone Number', ph: '10-digit number', full: false },
            { k: 'subject', l: 'Subject *', ph: 'Brief description', full: true },
            { k: 'location', l: 'Location', ph: 'Village / Town', full: false },
          ].map(({ k, l, ph, full }) => (
            <div key={k} style={{ gridColumn: full ? '1/-1' : undefined }}>
              <label style={label}>{l}</label>
              <input value={(form as any)[k]} onChange={e => f(k, e.target.value)} placeholder={ph} style={inputStyle} />
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={label}>Description</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)}
              placeholder="Detailed description of the issue..."
              rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={label}>Category</label>
            <select value={form.category} onChange={e => f('category', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Priority</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => f('priority', p)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: form.priority === p ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${form.priority === p ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: form.priority === p ? '#00d4aa' : '#8899bb' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899bb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving || !form.petitioner_name || !form.subject}
            style={{ ...btnPrimary, flex: 2, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Submit Grievance'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
