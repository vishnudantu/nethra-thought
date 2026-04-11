import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, AlertTriangle, Flame, ShieldAlert, Plus, Loader2, X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken, useW, isMob } from '../components/ui/ModuleLayout';

interface WMsg { id: string; content: string; sender_name?: string; classification: string; sentiment: string; urgency_score: number; is_viral: number; is_misinformation: number; created_at: string; }

const CLASS_COLOR: Record<string, string> = { complaint: '#ffa726', request: '#42a5f5', support: '#00c864', feedback: '#ab47bc', threat: '#ff5555', misinformation: '#ff5555', general: '#8899bb' };

export default function WhatsAppIntelligence() {
  const w = useW();
  const [msgs, setMsgs] = useState<WMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showInject, setShowInject] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('whatsapp_intelligence', { order: 'created_at', dir: 'DESC', limit: '60' });
      setMsgs((data as WMsg[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/whatsapp/ai-analysis', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      setAnalysis(d.analysis || '');
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const viral = msgs.filter(m => m.is_viral).length;
  const misinfo = msgs.filter(m => m.is_misinformation).length;
  const urgent = msgs.filter(m => m.urgency_score >= 7).length;

  const filtered = filter === 'all' ? msgs
    : filter === 'viral' ? msgs.filter(m => m.is_viral)
    : filter === 'misinfo' ? msgs.filter(m => m.is_misinformation)
    : filter === 'urgent' ? msgs.filter(m => m.urgency_score >= 7)
    : msgs.filter(m => m.classification === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Total Messages" value={msgs.length} color="#42a5f5" icon={MessageSquare} />
        <Stat label="Urgent" value={urgent} color="#ff5555" icon={AlertTriangle} />
        <Stat label="Viral Content" value={viral} color="#ffa726" icon={Flame} />
        <Stat label="Misinformation" value={misinfo} color="#ff5555" icon={ShieldAlert} />
      </div>

      {(analysis || analyzing) && (
        <AIPanel title="WhatsApp Intelligence Analysis" content={analysis} loading={analyzing} onClose={() => setAnalysis('')} />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
          {['all', 'urgent', 'viral', 'misinfo', 'complaint', 'request', 'support'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={T.pill(filter === f)}>
              {f === 'misinfo' ? 'Misinformation' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={analyse} disabled={analyzing} style={{ ...T.primary, flexShrink: 0, opacity: analyzing ? 0.65 : 1 }}>
          {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Analysis</>}
        </button>
        <button onClick={() => setShowInject(true)} style={{ ...T.ghost, flexShrink: 0 }}><Plus size={13} />Add Message</button>
        <button onClick={load} style={{ ...T.ghost, flexShrink: 0, padding: '9px' }}><RefreshCw size={13} /></button>
      </div>

      {loading ? <Loading text="Loading messages..." />
        : filtered.length === 0 ? (
          <Empty icon={MessageSquare} title="No messages found"
            sub="Messages come in via webhook. You can also manually add messages to test." action="Add Test Message" onAction={() => setShowInject(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {filtered.map(m => {
              const cc = CLASS_COLOR[m.classification] || '#8899bb';
              const urgC = m.urgency_score >= 7 ? '#ff5555' : m.urgency_score >= 4 ? '#ffa726' : '#8899bb';
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '13px 16px', borderLeft: m.is_misinformation || m.urgency_score >= 8 ? `3px solid ${urgC}` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: `${cc}18`, color: cc, fontWeight: 700, textTransform: 'uppercase' }}>{m.classification}</span>
                      {m.is_viral ? <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,167,38,0.12)', color: '#ffa726', fontWeight: 700 }}>VIRAL</span> : null}
                      {m.is_misinformation ? <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,85,85,0.12)', color: '#ff5555', fontWeight: 700 }}>MISINFO</span> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {m.sender_name && <div style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', marginBottom: 4 }}>{m.sender_name}</div>}
                      <p style={{ fontSize: 13, color: '#d0d8ee', margin: 0, lineHeight: 1.55 }}>{m.content}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#8899bb' }}>
                        <span style={{ color: urgC }}>Urgency {m.urgency_score}/10</span>
                        <span>{new Date(m.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showInject && (
        <Modal onClose={() => setShowInject(false)} title="Add Test Message" maxW={440}>
          <InjectForm onSave={() => { setShowInject(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function InjectForm({ onSave }: { onSave: () => void }) {
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      await fetch('/api/whatsapp/inject', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sender_name: sender }),
      });
      onSave();
    } catch (_) { setBusy(false); }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={T.label}>Sender Name</label><input value={sender} onChange={e => setSender(e.target.value)} placeholder="Constituent name (optional)" style={T.input} /></div>
      <div><label style={T.label}>Message Content *</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Type the WhatsApp message..." rows={4} style={{ ...T.input, resize: 'vertical' }} /></div>
      <button onClick={save} disabled={busy || !content.trim()} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !content.trim() ? 0.5 : 1 }}>
        {busy ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Add Message'}
      </button>
    </div>
  );
}
