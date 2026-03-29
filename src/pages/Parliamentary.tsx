import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Plus, Search, X, ExternalLink, CheckCircle, MessageSquare, Vote, Mic, ChevronDown, ChevronUp, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

type House = 'Lok Sabha' | 'Rajya Sabha';
type QType = 'Starred' | 'Unstarred' | 'Short Notice' | 'Private Member';
type QStatus = 'Scheduled' | 'Asked' | 'Answered' | 'Lapsed';
type DebateType = 'Zero Hour' | 'Question Hour' | 'Calling Attention' | 'Adjournment Motion' | 'Budget Discussion' | 'Bill Discussion' | 'Special Mention';
type BillType = 'Government Bill' | 'Private Member Bill' | 'Amendment';
type VoteType = 'Aye' | 'Noe' | 'Abstain' | 'Absent' | 'Not Applicable';
type BillStatus = 'Introduced' | 'Committee' | 'Passed' | 'Rejected' | 'Lapsed' | 'Withdrawn';

interface PQuestion {
  id: string;
  question_number: string;
  session_number: string;
  house: House;
  question_type: QType;
  subject: string;
  ministry: string;
  question_text: string;
  answer_text: string;
  date_asked: string | null;
  status: QStatus;
  sansad_url: string;
  tags: string[];
  notes: string;
  created_at: string;
}

interface PDebate {
  id: string;
  session_number: string;
  house: House;
  date_of_debate: string | null;
  debate_type: DebateType;
  topic: string;
  our_stance: string;
  speech_excerpt: string;
  duration_minutes: number;
  sansad_url: string;
  tags: string[];
  notes: string;
  created_at: string;
}

interface PBill {
  id: string;
  bill_number: string;
  bill_name: string;
  bill_type: BillType;
  ministry: string;
  introduced_by: string;
  introduced_date: string | null;
  our_vote: VoteType;
  our_stance: string;
  status: BillStatus;
  sansad_url: string;
  tags: string[];
  notes: string;
  created_at: string;
}

const VOTE_COLORS: Record<VoteType, { bg: string; color: string }> = {
  'Aye':            { bg: 'rgba(0,200,100,0.12)',   color: '#00c864' },
  'Noe':            { bg: 'rgba(255,85,85,0.12)',   color: '#ff5555' },
  'Abstain':        { bg: 'rgba(255,167,38,0.12)',  color: '#ffa726' },
  'Absent':         { bg: 'rgba(136,153,187,0.12)', color: '#8899bb' },
  'Not Applicable': { bg: 'rgba(136,153,187,0.08)', color: '#6677aa' },
};

const BILL_STATUS_COLORS: Record<BillStatus, string> = {
  'Introduced': '#1e88e5',
  'Committee':  '#ffa726',
  'Passed':     '#00c864',
  'Rejected':   '#ff5555',
  'Lapsed':     '#8899bb',
  'Withdrawn':  '#f06292',
};

const Q_TYPE_COLORS: Record<QType, string> = {
  'Starred':        '#ffa726',
  'Unstarred':      '#1e88e5',
  'Short Notice':   '#f06292',
  'Private Member': '#00d4aa',
};

function QuestionModal({ q, onClose, onSave }: { q: Partial<PQuestion> | null; onClose: () => void; onSave: () => void }) {
  const isEdit = !!q?.id;
  const [form, setForm] = useState({
    question_number: q?.question_number || '',
    session_number: q?.session_number || '',
    house: (q?.house || 'Lok Sabha') as House,
    question_type: (q?.question_type || 'Unstarred') as QType,
    subject: q?.subject || '',
    ministry: q?.ministry || '',
    question_text: q?.question_text || '',
    answer_text: q?.answer_text || '',
    date_asked: q?.date_asked || '',
    status: (q?.status || 'Scheduled') as QStatus,
    sansad_url: q?.sansad_url || '',
    notes: q?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.subject) return;
    setSaving(true);
    if (isEdit && q?.id) {
      await api.update('parliamentary_questions', q.id, { ...form, updated_at: new Date().toISOString() });
    } else {
      await api.create('parliamentary_questions', form);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {isEdit ? 'Edit Question' : 'Add Parliamentary Question'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>House</label>
              <select className="input-field" value={form.house} onChange={e => setForm({ ...form, house: e.target.value as House })}>
                <option>Lok Sabha</option><option>Rajya Sabha</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Question Type</label>
              <select className="input-field" value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value as QType })}>
                {['Starred', 'Unstarred', 'Short Notice', 'Private Member'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as QStatus })}>
                {['Scheduled', 'Asked', 'Answered', 'Lapsed'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Subject *</label>
            <input className="input-field" placeholder="Subject of the question" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Ministry Addressed To</label>
              <input className="input-field" placeholder="e.g. Ministry of Railways" value={form.ministry} onChange={e => setForm({ ...form, ministry: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Session</label>
              <input className="input-field" placeholder="e.g. Budget Session 2024" value={form.session_number} onChange={e => setForm({ ...form, session_number: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Question Number</label>
              <input className="input-field" placeholder="e.g. 1234" value={form.question_number} onChange={e => setForm({ ...form, question_number: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Date Asked</label>
              <input type="date" className="input-field" value={form.date_asked} onChange={e => setForm({ ...form, date_asked: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Question Text</label>
            <textarea className="input-field" rows={3} placeholder="Full text of the question" value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Ministry's Answer (if available)</label>
            <textarea className="input-field" rows={3} placeholder="Paste the official answer from Sansad.in" value={form.answer_text} onChange={e => setForm({ ...form, answer_text: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Sansad.in URL</label>
            <input className="input-field" placeholder="https://sansad.in/..." value={form.sansad_url} onChange={e => setForm({ ...form, sansad_url: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Internal Notes</label>
            <input className="input-field" placeholder="Follow-up actions, press release status..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving || !form.subject}>
            {saving ? 'Saving...' : isEdit ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DebateModal({ d, onClose, onSave }: { d: Partial<PDebate> | null; onClose: () => void; onSave: () => void }) {
  const isEdit = !!d?.id;
  const [form, setForm] = useState({
    session_number: d?.session_number || '',
    house: (d?.house || 'Lok Sabha') as House,
    date_of_debate: d?.date_of_debate || '',
    debate_type: (d?.debate_type || 'Zero Hour') as DebateType,
    topic: d?.topic || '',
    our_stance: d?.our_stance || '',
    speech_excerpt: d?.speech_excerpt || '',
    duration_minutes: d?.duration_minutes || 0,
    sansad_url: d?.sansad_url || '',
    notes: d?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.topic) return;
    setSaving(true);
    if (isEdit && d?.id) {
      await api.update('parliamentary_debates', d.id, form);
    } else {
      await api.create('parliamentary_debates', form);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {isEdit ? 'Edit Debate Record' : 'Add Debate / Participation'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>House</label>
              <select className="input-field" value={form.house} onChange={e => setForm({ ...form, house: e.target.value as House })}>
                <option>Lok Sabha</option><option>Rajya Sabha</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Debate Type</label>
              <select className="input-field" value={form.debate_type} onChange={e => setForm({ ...form, debate_type: e.target.value as DebateType })}>
                {['Zero Hour', 'Question Hour', 'Calling Attention', 'Adjournment Motion', 'Budget Discussion', 'Bill Discussion', 'Special Mention'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Date</label>
              <input type="date" className="input-field" value={form.date_of_debate} onChange={e => setForm({ ...form, date_of_debate: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Topic *</label>
            <input className="input-field" placeholder="Topic of debate" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Session</label>
              <input className="input-field" placeholder="e.g. Budget Session 2024" value={form.session_number} onChange={e => setForm({ ...form, session_number: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Duration (minutes)</label>
              <input type="number" min={0} className="input-field" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Our Stance / Summary</label>
            <textarea className="input-field" rows={2} placeholder="Key points raised, position taken..." value={form.our_stance} onChange={e => setForm({ ...form, our_stance: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Speech Excerpt</label>
            <textarea className="input-field" rows={3} placeholder="Key excerpt from the speech delivered..." value={form.speech_excerpt} onChange={e => setForm({ ...form, speech_excerpt: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Sansad.in URL</label>
            <input className="input-field" placeholder="https://sansad.in/..." value={form.sansad_url} onChange={e => setForm({ ...form, sansad_url: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving || !form.topic}>
            {saving ? 'Saving...' : isEdit ? 'Update Record' : 'Add Debate'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BillModal({ b, onClose, onSave }: { b: Partial<PBill> | null; onClose: () => void; onSave: () => void }) {
  const isEdit = !!b?.id;
  const [form, setForm] = useState({
    bill_number: b?.bill_number || '',
    bill_name: b?.bill_name || '',
    bill_type: (b?.bill_type || 'Government Bill') as BillType,
    ministry: b?.ministry || '',
    introduced_by: b?.introduced_by || '',
    introduced_date: b?.introduced_date || '',
    our_vote: (b?.our_vote || 'Not Applicable') as VoteType,
    our_stance: b?.our_stance || '',
    status: (b?.status || 'Introduced') as BillStatus,
    sansad_url: b?.sansad_url || '',
    notes: b?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.bill_name) return;
    setSaving(true);
    if (isEdit && b?.id) {
      await api.update('parliamentary_bills', b.id, form);
    } else {
      await api.create('parliamentary_bills', form);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {isEdit ? 'Edit Bill Record' : 'Add Bill / Voting Record'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Bill Name *</label>
            <input className="input-field" placeholder="Full official name of the bill" value={form.bill_name} onChange={e => setForm({ ...form, bill_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Bill Type</label>
              <select className="input-field" value={form.bill_type} onChange={e => setForm({ ...form, bill_type: e.target.value as BillType })}>
                {['Government Bill', 'Private Member Bill', 'Amendment'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Our Vote</label>
              <select className="input-field" value={form.our_vote} onChange={e => setForm({ ...form, our_vote: e.target.value as VoteType })}>
                {['Aye', 'Noe', 'Abstain', 'Absent', 'Not Applicable'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BillStatus })}>
                {['Introduced', 'Committee', 'Passed', 'Rejected', 'Lapsed', 'Withdrawn'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Ministry / Dept</label>
              <input className="input-field" placeholder="Sponsoring ministry" value={form.ministry} onChange={e => setForm({ ...form, ministry: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Bill Number</label>
              <input className="input-field" placeholder="e.g. Bill No. 12 of 2024" value={form.bill_number} onChange={e => setForm({ ...form, bill_number: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Introduced By</label>
              <input className="input-field" placeholder="Minister / MP name" value={form.introduced_by} onChange={e => setForm({ ...form, introduced_by: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Introduced Date</label>
              <input type="date" className="input-field" value={form.introduced_date} onChange={e => setForm({ ...form, introduced_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Our Stance</label>
            <textarea className="input-field" rows={2} placeholder="Why we voted Aye/Noe, key arguments..." value={form.our_stance} onChange={e => setForm({ ...form, our_stance: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Sansad.in URL</label>
            <input className="input-field" placeholder="https://sansad.in/..." value={form.sansad_url} onChange={e => setForm({ ...form, sansad_url: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving || !form.bill_name}>
            {saving ? 'Saving...' : isEdit ? 'Update Bill' : 'Add Bill'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type Tab = 'questions' | 'debates' | 'bills';

export default function Parliamentary() {
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<PQuestion[]>([]);
  const [debates, setDebates] = useState<PDebate[]>([]);
  const [bills, setBills] = useState<PBill[]>([]);
  const [search, setSearch] = useState('');
  const [qModal, setQModal] = useState<{ open: boolean; data: Partial<PQuestion> | null }>({ open: false, data: null });
  const [dModal, setDModal] = useState<{ open: boolean; data: Partial<PDebate> | null }>({ open: false, data: null });
  const [bModal, setBModal] = useState<{ open: boolean; data: Partial<PBill> | null }>({ open: false, data: null });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchAll() {
    const [questions, debates, bills] = await Promise.all([
      api.list('parliamentary_questions', { order: 'created_at', dir: 'DESC' }),
      api.list('parliamentary_debates', { order: 'created_at', dir: 'DESC' }),
      api.list('parliamentary_bills', { order: 'created_at', dir: 'DESC' }),
    ]);
    setQuestions(questions || []);
    setDebates(debates || []);
    setBills(bills || []);
  }

  useEffect(() => { fetchAll(); }, []);

  async function deleteQuestion(id: string) {
    await api.remove('parliamentary_questions', id);
    setConfirmDelete(null); fetchAll();
  }
  async function deleteDebate(id: string) {
    await api.remove('parliamentary_debates', id);
    setConfirmDelete(null); fetchAll();
  }
  async function deleteBill(id: string) {
    await api.remove('parliamentary_bills', id);
    setConfirmDelete(null); fetchAll();
  }

  const filteredQ = questions.filter(q => !search || q.subject.toLowerCase().includes(search.toLowerCase()) || q.ministry.toLowerCase().includes(search.toLowerCase()));
  const filteredD = debates.filter(d => !search || d.topic.toLowerCase().includes(search.toLowerCase()));
  const filteredB = bills.filter(b => !search || b.bill_name.toLowerCase().includes(search.toLowerCase()) || b.ministry.toLowerCase().includes(search.toLowerCase()));

  const totalSpeechMins = debates.reduce((s, d) => s + d.duration_minutes, 0);

  const tabs: { id: Tab; label: string; count: number; icon: React.ElementType; color: string }[] = [
    { id: 'questions', label: 'Questions', count: questions.length, icon: MessageSquare, color: '#ffa726' },
    { id: 'debates', label: 'Debates & Speeches', count: debates.length, icon: Mic, color: '#1e88e5' },
    { id: 'bills', label: 'Bills & Voting', count: bills.length, icon: Vote, color: '#00c864' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(30,136,229,0.15), rgba(0,212,170,0.08))', border: '1px solid rgba(30,136,229,0.25)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Scale size={22} style={{ color: '#1e88e5' }} />
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>Parliamentary Activity</h2>
          <a href="https://sansad.in" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5', border: '1px solid rgba(30,136,229,0.25)' }}>
            <ExternalLink size={11} /> Sansad.in
          </a>
        </div>
        <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.7 }}>
          Complete record of parliamentary questions, debate participations, and voting history. Cross-reference with Sansad.in for official records and build your accountability report card.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Questions Raised', value: questions.length, color: '#ffa726' },
            { label: 'Starred Questions', value: questions.filter(q => q.question_type === 'Starred').length, color: '#f06292' },
            { label: 'Debates Participated', value: debates.length, color: '#1e88e5' },
            { label: 'Speech Minutes', value: totalSpeechMins, color: '#00d4aa' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}22` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: tab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.05)',
                color: tab === t.id ? t.color : '#8899bb',
                border: `1px solid ${tab === t.id ? `${t.color}40` : 'rgba(255,255,255,0.08)'}`,
              }}>
              <t.icon size={14} /> {t.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: tab === t.id ? `${t.color}25` : 'rgba(255,255,255,0.08)', color: tab === t.id ? t.color : '#6677aa' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="bg-transparent text-sm border-none outline-none text-white placeholder-gray-500 w-44"
              placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === 'questions' && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setQModal({ open: true, data: null })}>
              <Plus size={16} /> Add Question
            </button>
          )}
          {tab === 'debates' && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setDModal({ open: true, data: null })}>
              <Plus size={16} /> Add Debate
            </button>
          )}
          {tab === 'bills' && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setBModal({ open: true, data: null })}>
              <Plus size={16} /> Add Bill
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Questions Tab */}
        {tab === 'questions' && (
          <motion.div key="questions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {filteredQ.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <MessageSquare size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                <p style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No Questions Recorded</p>
                <p style={{ color: '#8899bb', fontSize: 13 }}>Add questions raised in Lok Sabha or Rajya Sabha. Link to Sansad.in for official records.</p>
              </div>
            ) : filteredQ.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                          style={{ background: `${Q_TYPE_COLORS[q.question_type]}20`, color: Q_TYPE_COLORS[q.question_type] }}>
                          {q.question_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                          {q.house}
                        </span>
                        {q.question_number && (
                          <span className="text-xs font-mono" style={{ color: '#6677aa' }}>#{q.question_number}</span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ background: q.status === 'Answered' ? 'rgba(0,200,100,0.12)' : q.status === 'Lapsed' ? 'rgba(255,85,85,0.1)' : 'rgba(255,167,38,0.1)', color: q.status === 'Answered' ? '#00c864' : q.status === 'Lapsed' ? '#ff5555' : '#ffa726' }}>
                          {q.status}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4, fontFamily: 'Space Grotesk' }}>{q.subject}</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        {q.ministry && <span style={{ fontSize: 12, color: '#8899bb' }}>{q.ministry}</span>}
                        {q.session_number && <span style={{ fontSize: 12, color: '#6677aa' }}>• {q.session_number}</span>}
                        {q.date_asked && (
                          <span style={{ fontSize: 12, color: '#6677aa' }}>
                            • {new Date(q.date_asked).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.sansad_url && (
                        <a href={q.sansad_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                        {expanded === q.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button onClick={() => setQModal({ open: true, data: q })} className="p-2 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}>
                        <Edit2 size={13} />
                      </button>
                      {confirmDelete === q.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => deleteQuestion(q.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={12} /></button>
                          <button onClick={() => setConfirmDelete(null)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(q.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === q.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 border-t border-white/06 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.question_text && (
                          <div>
                            <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Question Text</div>
                            <p style={{ fontSize: 13, color: '#d0d8f0', lineHeight: 1.8 }}>{q.question_text}</p>
                          </div>
                        )}
                        {q.answer_text && (
                          <div>
                            <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Ministry's Answer</div>
                            <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.8 }}>{q.answer_text}</p>
                          </div>
                        )}
                      </div>
                      {q.notes && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 12, color: '#6677aa' }}>{q.notes}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Debates Tab */}
        {tab === 'debates' && (
          <motion.div key="debates" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {filteredD.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Mic size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                <p style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No Debate Records</p>
                <p style={{ color: '#8899bb', fontSize: 13 }}>Log all debates, Zero Hour participations, and speeches delivered in Parliament.</p>
              </div>
            ) : filteredD.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}>
                          {d.debate_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                          {d.house}
                        </span>
                        {d.duration_minutes > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa' }}>
                            {d.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4, fontFamily: 'Space Grotesk' }}>{d.topic}</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        {d.session_number && <span style={{ fontSize: 12, color: '#8899bb' }}>{d.session_number}</span>}
                        {d.date_of_debate && (
                          <span style={{ fontSize: 12, color: '#6677aa' }}>
                            • {new Date(d.date_of_debate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {d.our_stance && <p style={{ fontSize: 12, color: '#8899bb', marginTop: 8, lineHeight: 1.6 }}>{d.our_stance}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {d.sansad_url && (
                        <a href={d.sansad_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                        {expanded === d.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button onClick={() => setDModal({ open: true, data: d })} className="p-2 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}>
                        <Edit2 size={13} />
                      </button>
                      {confirmDelete === d.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => deleteDebate(d.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={12} /></button>
                          <button onClick={() => setConfirmDelete(null)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(d.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === d.id && d.speech_excerpt && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="pt-4">
                        <div style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Speech Excerpt</div>
                        <blockquote className="p-4 rounded-xl italic" style={{ background: 'rgba(30,136,229,0.06)', border: '1px solid rgba(30,136,229,0.15)', borderLeft: '3px solid #1e88e5', fontSize: 13, color: '#c0ccee', lineHeight: 1.9 }}>
                          "{d.speech_excerpt}"
                        </blockquote>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bills Tab */}
        {tab === 'bills' && (
          <motion.div key="bills" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="glass-card rounded-2xl overflow-hidden">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Bill', 'Type', 'Ministry', 'Our Vote', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredB.map((b, i) => (
                  <motion.tr key={b.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', maxWidth: 280 }}>{b.bill_name}</div>
                      {b.bill_number && <div style={{ fontSize: 11, color: '#6677aa', fontFamily: 'monospace' }}>{b.bill_number}</div>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', whiteSpace: 'nowrap' }}>{b.bill_type}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{b.ministry || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                        style={{ background: VOTE_COLORS[b.our_vote].bg, color: VOTE_COLORS[b.our_vote].color }}>
                        {b.our_vote}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: `${BILL_STATUS_COLORS[b.status]}18`, color: BILL_STATUS_COLORS[b.status] }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6677aa', whiteSpace: 'nowrap' }}>
                      {b.introduced_date ? new Date(b.introduced_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-1.5">
                        {b.sansad_url && <a href={b.sansad_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}><ExternalLink size={12} /></a>}
                        <button onClick={() => setBModal({ open: true, data: b })} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.12)', color: '#1e88e5' }}><Edit2 size={12} /></button>
                        {confirmDelete === b.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteBill(b.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={11} /></button>
                            <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={11} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(b.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={12} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredB.length === 0 && (
              <div className="text-center py-14">
                <Vote size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                <p style={{ color: '#8899bb', fontSize: 14 }}>No bills recorded yet</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qModal.open && <QuestionModal q={qModal.data} onClose={() => setQModal({ open: false, data: null })} onSave={fetchAll} />}
        {dModal.open && <DebateModal d={dModal.data} onClose={() => setDModal({ open: false, data: null })} onSave={fetchAll} />}
        {bModal.open && <BillModal b={bModal.data} onClose={() => setBModal({ open: false, data: null })} onSave={fetchAll} />}
      </AnimatePresence>
    </div>
  );
}
