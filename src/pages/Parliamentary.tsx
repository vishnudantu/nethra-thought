import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Sparkles, Plus, FileText, Loader2, X, Scale, Mic2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../hooks/useResponsive';

interface Question { id: string; question_text: string; ministry: string; question_type: string; status: string; topic: string; session?: string; created_at: string; }

export default function Parliamentary() {
  const { activePolitician } = useAuth();
  const w = useW();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftTopic, setDraftTopic] = useState('');
  const [ministry, setMinistry] = useState('');
  const [qType, setQType] = useState('starred');
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState('');
  const [showForm, setShowForm] = useState(false);

  const desig = activePolitician?.designation?.toLowerCase() || '';
  const isMp = desig.includes('mp') || desig.includes('member of parliament') || desig.includes('lok sabha') || desig.includes('rajya sabha');
  const isRajya = desig.includes('rajya');
  const label = isMp ? (isRajya ? 'Rajya Sabha' : 'Lok Sabha') : 'Assembly';
  const questionLabel = isMp ? 'Parliamentary Question' : 'Assembly Question';

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('parliamentary_questions', { order: 'created_at', dir: 'DESC', limit: '50' });
      setQuestions((data as Question[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function draftQuestion() {
    if (!draftTopic.trim()) return;
    setDrafting(true); setDraft('');
    try {
      const r = await fetch('/api/parliamentary/ai-question', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: draftTopic, ministry: ministry || 'relevant ministry', question_type: qType }),
      });
      const d = await r.json();
      setDraft(d.question || '');
    } catch (_) {}
    setDrafting(false);
  }

  async function saveToTracker() {
    if (!draft) return;
    await api.create('parliamentary_questions', { question_text: draft, topic: draftTopic, ministry, question_type: qType, status: 'draft' });
    setDraft(''); setDraftTopic(''); setMinistry('');
    load();
  }

  useEffect(() => { load(); }, []);

  const asked = questions.filter(q => q.status === 'asked').length;
  const pending = questions.filter(q => q.status === 'draft').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Total Questions" value={questions.length} color="#42a5f5" icon={FileText} />
        <Stat label="Asked in House" value={asked} color="#00c864" icon={Building2} />
        <Stat label="Pending / Draft" value={pending} color="#ffa726" icon={Scale} />
      </div>

      {/* AI Question Drafter */}
      <div style={{ ...T.card, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sparkles size={15} style={{ color: '#00d4aa' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>AI {questionLabel} Drafter</span>
          <span style={{ fontSize: 11, color: '#8899bb', marginLeft: 4 }}>{label} format</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={T.label}>Topic / Issue *</label>
            <input value={draftTopic} onChange={e => setDraftTopic(e.target.value)}
              placeholder="e.g. Drinking water shortage in Kuppam" style={T.input} />
          </div>
          <div>
            <label style={T.label}>Ministry</label>
            <input value={ministry} onChange={e => setMinistry(e.target.value)}
              placeholder="e.g. Jal Shakti, Rural Development" style={T.input} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['starred', 'unstarred'].map(t => (
              <button key={t} onClick={() => setQType(t)} style={T.pill(qType === t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={draftQuestion} disabled={drafting || !draftTopic.trim()}
            style={{ ...T.primary, opacity: drafting || !draftTopic.trim() ? 0.5 : 1 }}>
            {drafting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Drafting...</> : <><Sparkles size={13} />Draft Question</>}
          </button>
        </div>

        <AnimatePresence>
          {draft && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginTop: 14 }}>
              <div style={T.ai}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>AI Drafted {qType} Question</span>
                  <button onClick={() => setDraft('')} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={12} /></button>
                </div>
                <pre style={{ fontSize: 13, color: '#d0d8ee', lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{draft}</pre>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveToTracker} style={{ ...T.primary, fontSize: 12, padding: '7px 14px' }}>
                    <Plus size={12} />Save to Tracker
                  </button>
                  <button onClick={draftQuestion} style={{ ...T.ghost, fontSize: 12, padding: '7px 14px' }}>
                    Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', flex: 1 }}>Question Tracker</div>
        <button onClick={() => setShowForm(true)} style={T.ghost}><Plus size={13} />Add Manually</button>
      </div>

      {loading ? <Loading text="Loading questions..." />
        : questions.length === 0 ? (
          <Empty icon={Building2} title={`No ${questionLabel}s tracked yet`}
            sub="Use the AI drafter above to generate and save questions." action="Draft First Question" onAction={() => setDraftTopic('water supply')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map(q => {
              const sc = q.status === 'asked' ? '#00c864' : q.status === 'draft' ? '#ffa726' : '#8899bb';
              return (
                <motion.div key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Mic2 size={15} style={{ color: '#42a5f5', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700, textTransform: 'uppercase' }}>{q.status}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(66,165,245,0.1)', color: '#42a5f5', fontWeight: 700 }}>{q.question_type}</span>
                        {q.ministry && <span style={{ fontSize: 11, color: '#8899bb' }}>{q.ministry}</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>{q.topic}</div>
                      {q.question_text && <p style={{ fontSize: 12, color: '#8899bb', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{q.question_text}</p>}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {q.status === 'draft' && (
                        <button onClick={async () => { await api.update('parliamentary_questions', q.id, { status: 'asked' }); load(); }}
                          style={{ ...T.ghost, padding: '5px 10px', fontSize: 11 }}>Mark Asked</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={`Add ${questionLabel}`}>
          <QuestionForm questionLabel={questionLabel} onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function QuestionForm({ questionLabel, onSave }: { questionLabel: string; onSave: () => void }) {
  const [form, setForm] = useState({ topic: '', question_text: '', ministry: '', question_type: 'starred', session: '', status: 'draft' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.topic) return;
    setBusy(true);
    await api.create('parliamentary_questions', form);
    setBusy(false); onSave();
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Topic *</label><input value={form.topic} onChange={e => f('topic', e.target.value)} placeholder="Issue or concern" style={T.input} /></div>
      <div><label style={T.label}>Ministry</label><input value={form.ministry} onChange={e => f('ministry', e.target.value)} placeholder="Ministry name" style={T.input} /></div>
      <div><label style={T.label}>Question Text</label><textarea value={form.question_text} onChange={e => f('question_text', e.target.value)} placeholder="Full question text..." rows={4} style={{ ...T.input, resize: 'vertical' }} /></div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['starred', 'unstarred'].map(t => <button key={t} onClick={() => f('question_type', t)} style={T.pill(form.question_type === t)}>{t}</button>)}
      </div>
      <button onClick={save} disabled={busy || !form.topic} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.topic ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Save Question'}
      </button>
    </div>
  );
}
