import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, Mic, Target, Eye, Bell, Zap, ChevronDown, ChevronUp, Star, MessageSquare, BarChart3, Lightbulb, Shield, Users, CreditCard as Edit2, Trash2, BookOpen, Calendar, Radio, Flame } from 'lucide-react';
import { api } from '../lib/api';

type BriefingType = 'Daily Digest' | 'Speech Draft' | 'Talking Points' | 'Risk Alert' | 'Opportunity Alert' | 'Opposition Tracker' | 'Constituency Pulse';
type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

interface Briefing {
  id: string;
  briefing_date: string;
  briefing_type: BriefingType;
  title: string;
  summary: string;
  content: string;
  priority: Priority;
  is_read: boolean;
  tags: string[];
  source_refs: string[];
  created_at: string;
}

const TYPE_META: Record<BriefingType, { icon: React.ElementType; color: string; bg: string; desc: string }> = {
  'Daily Digest':       { icon: Radio,       color: '#1e88e5', bg: 'rgba(30,136,229,0.12)',  desc: 'Top news & events relevant to your constituency today' },
  'Speech Draft':       { icon: Mic,         color: '#00d4aa', bg: 'rgba(0,212,170,0.12)',   desc: 'Draft speeches for upcoming events and sessions' },
  'Talking Points':     { icon: MessageSquare, color: '#ffa726', bg: 'rgba(255,167,38,0.12)', desc: 'Key messages for media, press conferences, rallies' },
  'Risk Alert':         { icon: AlertTriangle, color: '#ff5555', bg: 'rgba(255,85,85,0.12)',  desc: 'Issues that could become politically sensitive' },
  'Opportunity Alert':  { icon: Lightbulb,   color: '#00c864', bg: 'rgba(0,200,100,0.12)',   desc: 'Political opportunities worth capitalising on' },
  'Opposition Tracker': { icon: Eye,         color: '#f06292', bg: 'rgba(240,98,146,0.12)',  desc: 'Track opposition moves, statements, and strategies' },
  'Constituency Pulse': { icon: BarChart3,   color: '#00d4aa', bg: 'rgba(0,212,170,0.08)',   desc: 'Ground-level mood and emerging issues in your area' },
};

const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
  'Low':      { color: '#8899bb', bg: 'rgba(136,153,187,0.1)' },
  'Medium':   { color: '#ffa726', bg: 'rgba(255,167,38,0.1)' },
  'High':     { color: '#ff8c42', bg: 'rgba(255,140,66,0.12)' },
  'Critical': { color: '#ff5555', bg: 'rgba(255,85,85,0.15)' },
};

const DIFFERENTIATORS = [
  {
    icon: FileText,
    title: 'Parliamentary Report Card',
    color: '#1e88e5',
    desc: 'Auto-generate a public-facing "Report Card" PDF showing questions raised, bills voted on, attendance, speech minutes — comparable to PRS Legislative Research. Share with constituents every session.',
    tag: 'Accountability'
  },
  {
    icon: Radio,
    title: 'Sansad.in Live Sync',
    color: '#00d4aa',
    desc: 'Pull live question listings, debate schedules, and bill status directly from Sansad.in. Never miss a session update — get notified when a question you raised gets listed or answered.',
    tag: 'Integration'
  },
  {
    icon: BarChart3,
    title: 'Constituency Sentiment Heatmap',
    color: '#ffa726',
    desc: 'Map ward/village level grievance density, project delays, and voter mood scores on an interactive map. Spot problem pockets before opposition does.',
    tag: 'Intelligence'
  },
  {
    icon: Mic,
    title: 'Speech & Press Note Generator',
    color: '#00c864',
    desc: 'Generate contextual speeches for Independence Day, Budget sessions, inaugurations, and press conferences using your past stances, local statistics, and national data — in English or Telugu.',
    tag: 'AI Drafting'
  },
  {
    icon: Users,
    title: 'Booth-Level Election Readiness Score',
    color: '#f06292',
    desc: 'Score each booth on voter database coverage, recent grievances resolved, events held, and active volunteers. Know exactly where you are weak with 6 months to election.',
    tag: 'Election Prep'
  },
  {
    icon: Shield,
    title: 'Opposition Activity Monitor',
    color: '#ff8c42',
    desc: 'Track opposition MP statements, constituency visits, and promises. Get automated alerts when opposition makes claims in your constituency that need a counter-response.',
    tag: 'Competitive Intel'
  },
  {
    icon: Star,
    title: 'Darshan Welfare Analytics',
    color: '#ffa726',
    desc: 'Unique to Andhra/Telangana constituencies — analytics on darshan beneficiaries by mandal, caste demographics, and frequency. Demonstrate welfare reach at campaign time.',
    tag: 'Welfare Tracking'
  },
  {
    icon: Zap,
    title: 'WhatsApp Blast Integration',
    color: '#25D366',
    desc: 'Send bulk messages to voter segments via WhatsApp Business API — mandal-wise, issue-wise, or by support level. Track delivery, opens, and responses directly in the platform.',
    tag: 'Communication'
  },
  {
    icon: TrendingUp,
    title: 'Project Impact Calculator',
    color: '#00bcd4',
    desc: 'Auto-calculate and publish beneficiary counts, funds released vs. targeted, and before/after comparisons for every dev project. Generate shareable impact infographics.',
    tag: 'Outcomes'
  },
  {
    icon: Target,
    title: 'Petition & Movement Radar',
    color: '#ab47bc',
    desc: 'Monitor Change.org, Twitter/X hashtags, and local news for petitions and public movements relevant to your constituency. Respond proactively before issues go viral.',
    tag: 'Early Warning'
  },
];

function BriefingModal({ b, onClose, onSave }: { b: Partial<Briefing> | null; onClose: () => void; onSave: () => void }) {
  const isEdit = !!b?.id;
  const [form, setForm] = useState({
    briefing_date: b?.briefing_date || new Date().toISOString().split('T')[0],
    briefing_type: (b?.briefing_type || 'Daily Digest') as BriefingType,
    title: b?.title || '',
    summary: b?.summary || '',
    content: b?.content || '',
    priority: (b?.priority || 'Medium') as Priority,
    is_read: b?.is_read || false,
    tags: (b?.tags || []).join(', '),
    source_refs: (b?.source_refs || []).join('\n'),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title) return;
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      source_refs: form.source_refs ? form.source_refs.split('\n').map(r => r.trim()).filter(Boolean) : [],
    };
    if (isEdit && b?.id) {
      await api.update('ai_briefings', b.id, payload);
    } else {
      await api.create('ai_briefings', payload);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  const meta = TYPE_META[form.briefing_type];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {isEdit ? 'Edit Briefing' : 'Add Briefing / Note'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Type</label>
              <select className="input-field" value={form.briefing_type} onChange={e => setForm({ ...form, briefing_type: e.target.value as BriefingType })}>
                {Object.keys(TYPE_META).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Date</label>
              <input type="date" className="input-field" value={form.briefing_date} onChange={e => setForm({ ...form, briefing_date: e.target.value })} />
            </div>
          </div>

          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: meta.bg, border: `1px solid ${meta.color}25` }}>
            <meta.icon size={15} style={{ color: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: meta.color }}>{meta.desc}</span>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Title *</label>
            <input className="input-field" placeholder="Brief descriptive title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Summary (1-2 lines)</label>
            <input className="input-field" placeholder="TL;DR of this briefing" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Full Content</label>
            <textarea className="input-field" rows={6} placeholder="Full briefing content, speech draft, talking points list..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Tags (comma separated)</label>
            <input className="input-field" placeholder="e.g. MSME, Guntur, irrigation, budget" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Source References (one per line)</label>
            <textarea className="input-field" rows={2} placeholder="URLs, newspaper articles, data sources used" value={form.source_refs} onChange={e => setForm({ ...form, source_refs: e.target.value })} style={{ resize: 'none' }} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving || !form.title}>
            {saving ? 'Saving...' : isEdit ? 'Update Briefing' : 'Save Briefing'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PoliticalBriefing() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'briefings' | 'roadmap'>('briefings');
  const [filter, setFilter] = useState<BriefingType | 'All'>('All');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<Briefing> | null }>({ open: false, data: null });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    const data = await api.list('ai_briefings', { order: 'created_at', dir: 'DESC' });
    setBriefings(data || []);
    setLoading(false);
  }

  async function markRead(id: string, val: boolean) {
    await api.update('ai_briefings', id, { is_read: val });
    setBriefings(prev => prev.map(b => b.id === id ? { ...b, is_read: val } : b));
  }

  async function deleteBriefing(id: string) {
    await api.remove('ai_briefings', id);
    setConfirmDelete(null);
    fetchData();
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = briefings.filter(b => filter === 'All' || b.briefing_type === filter);
  const unread = briefings.filter(b => !b.is_read).length;
  const critical = briefings.filter(b => b.priority === 'Critical' && !b.is_read).length;

  const typeButtons: Array<BriefingType | 'All'> = ['All', ...Object.keys(TYPE_META) as BriefingType[]];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(30,136,229,0.08))', border: '1px solid rgba(0,212,170,0.2)' }}>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Sparkles size={20} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>Political Briefings & Intelligence</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Your political nerve centre — daily digests, speech drafts, risk alerts, and opportunity tracking</p>
          </div>
          <div className="flex gap-2 ml-auto">
            {critical > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,85,85,0.12)', border: '1px solid rgba(255,85,85,0.25)' }}>
                <Flame size={13} style={{ color: '#ff5555' }} />
                <span style={{ fontSize: 12, color: '#ff5555', fontWeight: 600 }}>{critical} Critical Unread</span>
              </div>
            )}
            {unread > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,167,38,0.1)', border: '1px solid rgba(255,167,38,0.2)' }}>
                <Bell size={13} style={{ color: '#ffa726' }} />
                <span style={{ fontSize: 12, color: '#ffa726', fontWeight: 600 }}>{unread} Unread</span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Object.entries(TYPE_META).slice(0, 4).map(([type, meta]) => {
            const count = briefings.filter(b => b.briefing_type === type).length;
            return (
              <div key={type} className="p-3 rounded-xl cursor-pointer" onClick={() => { setFilter(type as BriefingType); setTab('briefings'); }}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${meta.color}22` }}>
                <meta.icon size={16} style={{ color: meta.color, marginBottom: 6 }} />
                <div style={{ fontSize: 20, fontWeight: 700, color: meta.color, fontFamily: 'Space Grotesk' }}>{count}</div>
                <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{type}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-3">
        {[
          { id: 'briefings', label: 'Briefings & Notes', icon: BookOpen },
          { id: 'roadmap', label: 'Product Differentiators', icon: Sparkles },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as 'briefings' | 'roadmap')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: tab === t.id ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.05)',
              color: tab === t.id ? '#00d4aa' : '#8899bb',
              border: `1px solid ${tab === t.id ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'briefings' && (
          <motion.div key="briefings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2 flex-wrap">
                {typeButtons.map(t => {
                  const meta = t !== 'All' ? TYPE_META[t] : null;
                  const isActive = filter === t;
                  return (
                    <button key={t} onClick={() => setFilter(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{
                        background: isActive ? (meta ? meta.bg : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
                        color: isActive ? (meta ? meta.color : '#f0f4ff') : '#8899bb',
                        border: `1px solid ${isActive ? (meta ? `${meta.color}40` : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      {meta && <meta.icon size={11} />} {t}
                    </button>
                  );
                })}
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true, data: null })}>
                <Plus size={16} /> Add Briefing
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Sparkles size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                <p style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No Briefings Yet</p>
                <p style={{ color: '#8899bb', fontSize: 13 }}>Add daily digests, speech drafts, risk alerts, or opportunity notes for your political team.</p>
              </div>
            ) : filtered.map((b, i) => {
              const meta = TYPE_META[b.briefing_type];
              const priorityMeta = PRIORITY_META[b.priority];
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${b.is_read ? 'rgba(255,255,255,0.07)' : `${meta.color}25`}`, opacity: b.is_read ? 0.8 : 1 }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                          <meta.icon size={18} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: meta.bg, color: meta.color }}>{b.briefing_type}</span>
                            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: priorityMeta.bg, color: priorityMeta.color }}>{b.priority}</span>
                            {!b.is_read && <span className="w-2 h-2 rounded-full" style={{ background: meta.color, flexShrink: 0 }} />}
                          </div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4, fontFamily: 'Space Grotesk' }}>{b.title}</h3>
                          {b.summary && <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.6 }}>{b.summary}</p>}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span style={{ fontSize: 11, color: '#6677aa' }}>
                              {new Date(b.briefing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {b.tags?.map(tag => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#6677aa' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => markRead(b.id, !b.is_read)}
                          className="p-2 rounded-lg text-xs"
                          style={{ background: b.is_read ? 'rgba(255,255,255,0.04)' : 'rgba(0,200,100,0.12)', color: b.is_read ? '#6677aa' : '#00c864' }}
                          title={b.is_read ? 'Mark unread' : 'Mark as read'}>
                          <CheckCircle size={13} />
                        </button>
                        {b.content && (
                          <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                            className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                            {expanded === b.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                        <button onClick={() => setModal({ open: true, data: b })} className="p-2 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}>
                          <Edit2 size={13} />
                        </button>
                        {confirmDelete === b.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteBriefing(b.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={12} /></button>
                            <button onClick={() => setConfirmDelete(null)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(b.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={13} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expanded === b.id && b.content && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="pt-4">
                          {b.briefing_type === 'Speech Draft' || b.briefing_type === 'Talking Points' ? (
                            <div className="p-4 rounded-xl" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                              <pre style={{ fontSize: 13, color: '#d0d8f0', lineHeight: 2, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{b.content}</pre>
                            </div>
                          ) : (
                            <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.9 }}>{b.content}</p>
                          )}
                          {b.source_refs?.length > 0 && (
                            <div className="mt-4">
                              <div style={{ fontSize: 11, color: '#6677aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Sources</div>
                              {b.source_refs.map((ref, j) => (
                                <div key={j} style={{ fontSize: 11, color: '#8899bb', lineHeight: 1.8 }}>• {ref}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {tab === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="p-4 rounded-2xl flex items-start gap-4" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <Sparkles size={20} style={{ color: '#00d4aa', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 4, fontFamily: 'Space Grotesk' }}>Key Differentiators — What Makes Nethra Unique</div>
                <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.7 }}>
                  These are the capabilities that no existing Indian political management tool offers. Each one is a concrete reason for a politician or their office to choose Nethra over generic CRMs or spreadsheets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIFFERENTIATORS.map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card rounded-2xl p-5 flex flex-col gap-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${d.color}18`, border: `1px solid ${d.color}30` }}>
                      <d.icon size={22} style={{ color: d.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{d.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ background: `${d.color}15`, color: d.color, whiteSpace: 'nowrap' }}>{d.tag}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.8 }}>{d.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-5 rounded-2xl" style={{ background: 'rgba(30,136,229,0.06)', border: '1px solid rgba(30,136,229,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: '#1e88e5' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Competitive Landscape</span>
              </div>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Feature', 'Nethra', 'Generic CRM', 'Spreadsheets', 'I-PAC Tools'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: h === 'Nethra' ? '#00d4aa' : '#8899bb', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Parliamentary Q&A Tracking', '✓', '✗', '✗', '✗'],
                      ['Sansad.in Integration', '✓', '✗', '✗', '✗'],
                      ['Tirupati Darshan (MP Quota)', '✓', '✗', '✗', '✗'],
                      ['6-month Darshan Eligibility Guard', '✓', '✗', '✗', '✗'],
                      ['Politician Approval Gate (anti-misuse)', '✓', '✗', '✗', '✗'],
                      ['Speech Draft & Talking Points', '✓', '✗', '✗', 'Partial'],
                      ['Booth-Level Readiness Score', '✓', '✗', '✗', 'Partial'],
                      ['Opposition Activity Monitor', '✓', '✗', '✗', 'Limited'],
                      ['Grievances + Projects + Finance', '✓', 'Partial', '✗', '✗'],
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{
                            padding: '8px 12px',
                            color: j === 0 ? '#d0d8f0' : cell === '✓' ? (j === 1 ? '#00c864' : '#4a5568') : cell === '✗' ? '#ff555555' : '#ffa726',
                            fontWeight: j === 1 ? 700 : 400,
                          }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal.open && <BriefingModal b={modal.data} onClose={() => setModal({ open: false, data: null })} onSave={fetchData} />}
      </AnimatePresence>
    </div>
  );
}
