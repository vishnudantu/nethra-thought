import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Scale, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Minus, FileText, CreditCard as Edit2, Trash2, Eye, Sparkles, Loader2 } from 'lucide-react';
import { T, AIPanel, getToken } from '../components/ui/ModuleLayout';
import { api } from '../lib/api';

interface Bill {
  id: string;
  bill_number: string;
  bill_name: string;
  description: string;
  category: string;
  ministry: string;
  introduced_by: string;
  introduced_date: string;
  house: string;
  status: string;
  current_stage: string;
  vote_date: string | null;
  member_vote: string;
  vote_explanation: string;
  impact_level: string;
  constituency_impact: string;
  tags: string[];
  notes: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Introduced': '#1e88e5',
  'Committee Review': '#9c27b0',
  'Debated': '#ffa726',
  'Passed (Lok Sabha)': '#00bcd4',
  'Passed (Both Houses)': '#00d4aa',
  'Presidential Assent': '#00c864',
  'Enacted': '#00c864',
  'Lapsed': '#8899bb',
  'Withdrawn': '#ff5555',
  'Referred': '#ffa726',
};

const VOTE_COLORS: Record<string, string> = {
  'Aye': '#00c864',
  'Nay': '#ff5555',
  'Abstain': '#8899bb',
  'Present': '#ffa726',
  'Not Voted': '#444',
};

const CATEGORIES = ['Constitutional', 'Finance', 'Defence', 'Agriculture', 'Health', 'Education', 'Infrastructure', 'Environment', 'Labour', 'Social Welfare', 'Technology', 'Foreign Affairs', 'Law & Order', 'General'];
const MINISTRIES = ['Finance', 'Home Affairs', 'Agriculture', 'Health & Family Welfare', 'Education', 'Road Transport', 'Railways', 'Defence', 'External Affairs', 'Environment', 'Jal Shakti', 'Rural Development', 'Law & Justice'];

function BillModal({ bill, onClose, onSave }: { bill: Partial<Bill> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    bill_number: bill?.bill_number || '',
    bill_name: bill?.bill_name || '',
    description: bill?.description || '',
    category: bill?.category || 'General',
    ministry: bill?.ministry || 'Finance',
    introduced_by: bill?.introduced_by || '',
    introduced_date: bill?.introduced_date || '',
    house: bill?.house || 'Lok Sabha',
    status: bill?.status || 'Introduced',
    current_stage: bill?.current_stage || '',
    vote_date: bill?.vote_date || '',
    member_vote: bill?.member_vote || 'Not Voted',
    vote_explanation: bill?.vote_explanation || '',
    impact_level: bill?.impact_level || 'Medium',
    constituency_impact: bill?.constituency_impact || '',
    notes: bill?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.bill_number || !form.bill_name) return;
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (bill?.id) {
      await api.update('bills', bill.id, payload);
    } else {
      await api.create('bills', payload);
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
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[92vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>{bill?.id ? 'Edit Bill' : 'Add Bill'}</h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Track parliamentary bills and voting records</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}><X size={16} style={{ color: '#8899bb' }} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Bill Number *</label>
              <input className="input-field" placeholder="e.g., Bill No. 12 of 2024" value={form.bill_number} onChange={e => setForm({ ...form, bill_number: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>House</label>
              <select className="input-field" value={form.house} onChange={e => setForm({ ...form, house: e.target.value })}>
                {['Lok Sabha', 'Rajya Sabha', 'Both Houses', 'Joint Session'].map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Bill Name *</label>
            <input className="input-field" placeholder="Full name of the bill" value={form.bill_name} onChange={e => setForm({ ...form, bill_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Ministry</label>
              <select className="input-field" value={form.ministry} onChange={e => setForm({ ...form, ministry: e.target.value })}>
                {MINISTRIES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Introduced By</label>
              <input className="input-field" placeholder="Name of minister/member" value={form.introduced_by} onChange={e => setForm({ ...form, introduced_by: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Introduction Date</label>
              <input type="date" className="input-field" value={form.introduced_date} onChange={e => setForm({ ...form, introduced_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Current Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Impact Level</label>
              <select className="input-field" value={form.impact_level} onChange={e => setForm({ ...form, impact_level: e.target.value })}>
                {['Low', 'Medium', 'High', 'Critical'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 12 }}>Voting Record</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Your Vote</label>
                <select className="input-field" value={form.member_vote} onChange={e => setForm({ ...form, member_vote: e.target.value })}>
                  {['Aye', 'Nay', 'Abstain', 'Present', 'Not Voted'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Vote Date</label>
                <input type="date" className="input-field" value={form.vote_date || ''} onChange={e => setForm({ ...form, vote_date: e.target.value })} />
              </div>
              <div className="col-span-3">
                <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Vote Explanation</label>
                <textarea className="input-field" rows={2} placeholder="Explain your position on this bill..." value={form.vote_explanation} onChange={e => setForm({ ...form, vote_explanation: e.target.value })} style={{ resize: 'none' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Constituency Impact</label>
            <textarea className="input-field" rows={2} placeholder="How does this bill affect your constituency?" value={form.constituency_impact} onChange={e => setForm({ ...form, constituency_impact: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Description</label>
            <textarea className="input-field" rows={3} placeholder="Brief description of the bill's objectives..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'none' }} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : bill?.id ? 'Update Bill' : 'Add Bill'}</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Legislative() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function getDraftQuestion() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/parliamentary/ai-question', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'key constituency issues', ministry: 'relevant state ministry', question_type: 'starred' }),
      });
      const d = await r.json();
      setAiInsight(d.question || '');
    } catch (_) {}
    setAnalyzing(false);
  }
  const [selected, setSelected] = useState<Partial<Bill> | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [voteFilter, setVoteFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchBills() {
    setLoading(true);
    const data = await api.list('bills');
    setBills(data || []);
    setLoading(false);
  }

  async function deleteBill(id: string) {
    await api.remove('bills', id);
    fetchBills();
  }

  useEffect(() => { fetchBills(); }, []);

  const filtered = bills.filter(b => {
    const matchSearch = !search || b.bill_name.toLowerCase().includes(search.toLowerCase()) || b.bill_number.toLowerCase().includes(search.toLowerCase()) || b.ministry.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchVote = voteFilter === 'All' || b.member_vote === voteFilter;
    return matchSearch && matchStatus && matchVote;
  });

  const enacted = bills.filter(b => b.status === 'Enacted' || b.status === 'Presidential Assent');
  const ayeVotes = bills.filter(b => b.member_vote === 'Aye');
  const highImpact = bills.filter(b => b.impact_level === 'High' || b.impact_level === 'Critical');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: FileText, label: 'Total Bills Tracked', value: bills.length, color: '#1e88e5' },
          { icon: CheckCircle, label: 'Enacted', value: enacted.length, color: '#00c864' },
          { icon: ThumbsUp, label: 'Aye Votes', value: ayeVotes.length, color: '#00d4aa' },
          { icon: AlertCircle, label: 'High Impact', value: highImpact.length, color: '#ff5555' },
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
          <input className="bg-transparent text-sm border-none outline-none text-white placeholder-gray-500 w-52"
            placeholder="Search bills, ministry..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }} value={voteFilter} onChange={e => setVoteFilter(e.target.value)}>
            <option value="All">All Votes</option>
            {['Aye', 'Nay', 'Abstain', 'Present', 'Not Voted'].map(v => <option key={v}>{v}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}><Plus size={16} /> Track Bill</button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? Array(5).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-5 rounded w-1/3 mb-2" /><div className="shimmer h-4 rounded w-2/3" />
          </div>
        )) : filtered.map((bill, i) => (
          <motion.div key={bill.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span style={{ fontSize: 12, color: '#8899bb', fontFamily: 'monospace', fontWeight: 600 }}>{bill.bill_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: `${STATUS_COLORS[bill.status] || '#8899bb'}22`, color: STATUS_COLORS[bill.status] || '#8899bb' }}>{bill.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: bill.impact_level === 'Critical' ? 'rgba(255,85,85,0.15)' : bill.impact_level === 'High' ? 'rgba(255,167,38,0.15)' : 'rgba(136,153,187,0.1)', color: bill.impact_level === 'Critical' ? '#ff5555' : bill.impact_level === 'High' ? '#ffa726' : '#8899bb' }}>
                      {bill.impact_level} Impact
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk', marginBottom: 4 }}>{bill.bill_name}</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span style={{ fontSize: 12, color: '#8899bb' }}>{bill.ministry}</span>
                    <span style={{ fontSize: 12, color: '#8899bb' }}>{bill.house}</span>
                    {bill.introduced_date && <span style={{ fontSize: 12, color: '#8899bb' }}>{new Date(bill.introduced_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-center">
                    <div className="px-3 py-1.5 rounded-xl" style={{ background: `${VOTE_COLORS[bill.member_vote] || '#444'}22`, border: `1px solid ${VOTE_COLORS[bill.member_vote] || '#444'}44` }}>
                      {bill.member_vote === 'Aye' && <ThumbsUp size={16} style={{ color: VOTE_COLORS[bill.member_vote] }} />}
                      {bill.member_vote === 'Nay' && <ThumbsDown size={16} style={{ color: VOTE_COLORS[bill.member_vote] }} />}
                      {bill.member_vote === 'Abstain' && <Minus size={16} style={{ color: VOTE_COLORS[bill.member_vote] }} />}
                      {(bill.member_vote === 'Not Voted' || bill.member_vote === 'Present') && <span style={{ fontSize: 10, color: VOTE_COLORS[bill.member_vote] }}>{bill.member_vote}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: '#8899bb', marginTop: 3 }}>{bill.member_vote}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#8899bb' }}>
                      <Eye size={13} />
                    </button>
                    <button onClick={() => { setSelected(bill); setModalOpen(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteBill(bill.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === bill.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/08 overflow-hidden">
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bill.description && (
                      <div>
                        <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                        <p style={{ fontSize: 13, color: '#f0f4ff', lineHeight: 1.6 }}>{bill.description}</p>
                      </div>
                    )}
                    {bill.constituency_impact && (
                      <div>
                        <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Constituency Impact</div>
                        <p style={{ fontSize: 13, color: '#f0f4ff', lineHeight: 1.6 }}>{bill.constituency_impact}</p>
                      </div>
                    )}
                    {bill.vote_explanation && (
                      <div className="col-span-full">
                        <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vote Explanation</div>
                        <p style={{ fontSize: 13, color: '#f0f4ff', lineHeight: 1.6, padding: '10px 14px', borderRadius: 8, background: `${VOTE_COLORS[bill.member_vote] || '#444'}11`, border: `1px solid ${VOTE_COLORS[bill.member_vote] || '#444'}22` }}>
                          {bill.vote_explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-14">
            <Scale size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
            <p style={{ color: '#8899bb', fontSize: 14 }}>No bills tracked yet. Start tracking parliamentary bills.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && <BillModal bill={selected} onClose={() => { setModalOpen(false); setSelected(null); }} onSave={fetchBills} />}
      </AnimatePresence>
    </div>
  );
}
