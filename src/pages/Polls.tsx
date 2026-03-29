import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, BarChart2, PieChart, Users, CreditCard as Edit2, Trash2, ThumbsUp, ThumbsDown, Minus, Target, Activity } from 'lucide-react';
import { api } from '../lib/api';

interface Poll {
  id: string;
  title: string;
  description: string;
  category: string;
  target_audience: string;
  questions: PollQuestion[];
  start_date: string;
  end_date: string | null;
  status: string;
  total_responses: number;
  target_responses: number;
  is_anonymous: boolean;
  geographic_scope: string;
  tags: string[];
  created_by: string;
  created_at: string;
}

interface PollQuestion {
  id: string;
  type: 'single' | 'multiple' | 'rating' | 'text' | 'yesno';
  question: string;
  options?: string[];
  required: boolean;
}

interface PollResponse {
  id: string;
  poll_id: string;
  respondent_name: string;
  respondent_gender: string;
  respondent_mandal: string;
  answers: Record<string, unknown>;
  sentiment: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': '#8899bb',
  'Active': '#00c864',
  'Closed': '#ffa726',
  'Archived': '#ff5555',
};

const CATEGORIES = ['Governance', 'Infrastructure', 'Education', 'Health', 'Agriculture', 'Employment', 'Social Welfare', 'Transport', 'Water Supply', 'Election Survey', 'General'];

function PollModal({ poll, onClose, onSave }: { poll: Partial<Poll> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: poll?.title || '',
    description: poll?.description || '',
    category: poll?.category || 'General',
    target_audience: poll?.target_audience || 'All',
    start_date: poll?.start_date ? poll.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
    end_date: poll?.end_date ? poll.end_date.split('T')[0] : '',
    target_responses: poll?.target_responses || 1000,
    is_anonymous: poll?.is_anonymous ?? true,
    geographic_scope: poll?.geographic_scope || 'Constituency',
    status: poll?.status || 'Draft',
  });
  const [questions, setQuestions] = useState<PollQuestion[]>(poll?.questions || []);
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions([...questions, {
      id: `q${Date.now()}`,
      type: 'single',
      question: '',
      options: ['Option 1', 'Option 2'],
      required: true
    }]);
  }

  function updateQuestion(idx: number, updates: Partial<PollQuestion>) {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, ...updates } : q));
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!form.title || questions.length === 0) return;
    setSaving(true);
    const payload = { ...form, questions, updated_at: new Date().toISOString() };
    if (poll?.id) {
      await api.update('polls', poll.id, payload);
    } else {
      await api.create('polls', payload);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-3xl overflow-y-auto max-h-[92vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
              {poll?.id ? 'Edit Poll' : 'Create New Poll'}
            </h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Create surveys for constituent engagement</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Poll Title *</label>
              <input className="input-field" placeholder="What is your poll about?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Target Audience</label>
              <select className="input-field" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}>
                {['All', 'Farmers', 'Youth (18-35)', 'Women', 'Senior Citizens', 'Urban', 'Rural', 'BPL Families'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Start Date</label>
              <input type="date" className="input-field" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>End Date</label>
              <input type="date" className="input-field" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Target Responses</label>
              <input type="number" className="input-field" value={form.target_responses} onChange={e => setForm({ ...form, target_responses: parseInt(e.target.value) || 1000 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Draft', 'Active', 'Closed', 'Archived'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Description</label>
            <textarea className="input-field" rows={2} placeholder="Describe the purpose of this poll..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'none' }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 600 }}>Questions ({questions.length})</label>
              <button onClick={addQuestion} className="btn-secondary text-xs" style={{ padding: '6px 12px' }}>
                <Plus size={12} /> Add Question
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 11, color: '#8899bb', fontWeight: 600 }}>Q{idx + 1}</span>
                    <button onClick={() => removeQuestion(idx)} className="p-1 rounded" style={{ color: '#ff5555' }}><X size={12} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="col-span-2">
                      <input className="input-field" placeholder="Question text..." value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })} style={{ fontSize: 13 }} />
                    </div>
                    <select className="input-field" style={{ fontSize: 13 }} value={q.type} onChange={e => updateQuestion(idx, { type: e.target.value as PollQuestion['type'] })}>
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                      <option value="rating">Rating (1-5)</option>
                      <option value="text">Open Text</option>
                      <option value="yesno">Yes / No</option>
                    </select>
                  </div>
                  {(q.type === 'single' || q.type === 'multiple') && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input className="input-field flex-1" style={{ fontSize: 12, padding: '7px 10px' }} value={opt}
                            onChange={e => {
                              const newOpts = [...(q.options || [])];
                              newOpts[oi] = e.target.value;
                              updateQuestion(idx, { options: newOpts });
                            }} />
                          <button onClick={() => updateQuestion(idx, { options: q.options?.filter((_, i) => i !== oi) })} style={{ color: '#ff5555' }}><X size={12} /></button>
                        </div>
                      ))}
                      <button onClick={() => updateQuestion(idx, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                        className="text-xs" style={{ color: '#00d4aa' }}>+ Add option</button>
                    </div>
                  )}
                </div>
              ))}
              {questions.length === 0 && (
                <div className="text-center py-6 rounded-xl" style={{ border: '2px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: 13, color: '#8899bb' }}>No questions added. Click "Add Question" to start.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : poll?.id ? 'Update Poll' : 'Create Poll'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PollResultsModal({ poll, onClose }: { poll: Poll; onClose: () => void }) {
  const [responses, setResponses] = useState<PollResponse[]>([]);

  useEffect(() => {
    api.list('poll_responses').then(data => {
      const responsesData = data as PollResponse[];
      setResponses((responsesData || []).filter(r => r.poll_id === poll.id));
    });
  }, [poll.id]);

  const progress = poll.target_responses > 0 ? Math.min(100, (poll.total_responses / poll.target_responses) * 100) : 0;

  const sentimentCounts = responses.reduce((acc, r) => {
    acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>{poll.title}</h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Poll Results & Analytics</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#00d4aa' }}>{poll.total_responses}</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Total Responses</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.2)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e88e5' }}>{progress.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Target Achieved</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.2)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ffa726' }}>{poll.target_responses}</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Target Responses</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 13, color: '#8899bb' }}>Response Progress</span>
              <span style={{ fontSize: 13, color: '#00d4aa', fontWeight: 600 }}>{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                style={{ background: 'linear-gradient(90deg, #00d4aa, #1e88e5)' }} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 12 }}>Sentiment Analysis</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Positive', icon: ThumbsUp, color: '#00c864', count: sentimentCounts['Positive'] || 0 },
                { label: 'Neutral', icon: Minus, color: '#8899bb', count: sentimentCounts['Neutral'] || 0 },
                { label: 'Negative', icon: ThumbsDown, color: '#ff5555', count: sentimentCounts['Negative'] || 0 },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: `${s.color}11`, border: `1px solid ${s.color}33` }}>
                  <s.icon size={20} style={{ color: s.color, margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {responses.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 12 }}>Recent Responses</h3>
              <div className="space-y-2">
                {responses.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#f0f4ff' }}>{r.respondent_name || 'Anonymous'}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{r.respondent_mandal} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: r.sentiment === 'Positive' ? 'rgba(0,200,100,0.15)' : r.sentiment === 'Negative' ? 'rgba(255,85,85,0.15)' : 'rgba(136,153,187,0.15)', color: r.sentiment === 'Positive' ? '#00c864' : r.sentiment === 'Negative' ? '#ff5555' : '#8899bb' }}>
                      {r.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resultsModal, setResultsModal] = useState<Poll | null>(null);
  const [selected, setSelected] = useState<Partial<Poll> | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  async function fetchPolls() {
    setLoading(true);
    const data = await api.list('polls');
    setPolls(data || []);
    setLoading(false);
  }

  async function deletePoll(id: string) {
    await api.remove('polls', id);
    fetchPolls();
  }

  async function toggleStatus(poll: Poll) {
    const newStatus = poll.status === 'Active' ? 'Closed' : 'Active';
    await api.update('polls', poll.id, { status: newStatus });
    fetchPolls();
  }

  useEffect(() => { fetchPolls(); }, []);

  const filtered = polls.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activePolls = polls.filter(p => p.status === 'Active');
  const totalResponses = polls.reduce((s, p) => s + (p.total_responses || 0), 0);
  const avgCompletion = polls.length > 0 ? polls.reduce((s, p) => s + Math.min(100, ((p.total_responses || 0) / (p.target_responses || 1)) * 100), 0) / polls.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: PieChart, label: 'Total Polls', value: polls.length, color: '#1e88e5' },
          { icon: Activity, label: 'Active Polls', value: activePolls.length, color: '#00c864' },
          { icon: Users, label: 'Total Responses', value: totalResponses.toLocaleString(), color: '#00d4aa' },
          { icon: Target, label: 'Avg. Completion', value: `${avgCompletion.toFixed(0)}%`, color: '#ffa726' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-5" style={{ border: `1px solid ${s.color}22` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}22` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={14} style={{ color: '#8899bb' }} />
          <input className="bg-transparent text-sm border-none outline-none text-white placeholder-gray-500 w-44"
            placeholder="Search polls..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} /> Create Poll
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-4 rounded w-3/4 mb-3" />
            <div className="shimmer h-3 rounded w-1/2 mb-5" />
            <div className="shimmer h-2 rounded mb-2" />
            <div className="shimmer h-8 rounded" />
          </div>
        )) : filtered.map((poll, i) => {
          const progress = poll.target_responses > 0 ? Math.min(100, ((poll.total_responses || 0) / poll.target_responses) * 100) : 0;
          return (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: `${STATUS_COLORS[poll.status]}22`, color: STATUS_COLORS[poll.status] }}>
                  {poll.status}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setResultsModal(poll)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#8899bb' }}>
                    <BarChart2 size={13} />
                  </button>
                  <button onClick={() => { setSelected(poll); setModalOpen(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deletePoll(poll.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold mb-1" style={{ fontSize: 15, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{poll.title}</h3>
              <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 12, lineHeight: 1.4 }}>{poll.category} · {poll.target_audience}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: '#8899bb' }}>Responses</span>
                  <span style={{ fontSize: 11, color: '#00d4aa', fontWeight: 600 }}>{poll.total_responses || 0} / {poll.target_responses}</span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: i * 0.05 }}
                    style={{ background: 'linear-gradient(90deg, #00d4aa, #1e88e5)' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 11, color: '#8899bb' }}>{poll.questions?.length || 0} questions</span>
                  {poll.is_anonymous && <span style={{ fontSize: 11, color: '#8899bb' }}>Anonymous</span>}
                </div>
                <button onClick={() => toggleStatus(poll)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: poll.status === 'Active' ? 'rgba(255,85,85,0.15)' : 'rgba(0,200,100,0.15)', color: poll.status === 'Active' ? '#ff5555' : '#00c864', border: `1px solid ${poll.status === 'Active' ? 'rgba(255,85,85,0.3)' : 'rgba(0,200,100,0.3)'}` }}>
                  {poll.status === 'Active' ? 'Close Poll' : 'Activate'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-14">
          <PieChart size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <p style={{ color: '#8899bb', fontSize: 14 }}>No polls found. Create your first poll.</p>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <PollModal poll={selected} onClose={() => { setModalOpen(false); setSelected(null); }} onSave={fetchPolls} />}
        {resultsModal && <PollResultsModal poll={resultsModal} onClose={() => setResultsModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
