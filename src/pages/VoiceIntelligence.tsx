import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Zap, FileText, MapPin, User, Loader2, Plus, RefreshCw, Radio } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;

// Responsive hook — inline to prevent module initialization order issues
import { useState as _useStateW, useEffect as _useEffectW } from 'react';
function useW() {
  const [_w, _setW] = _useStateW(typeof window !== 'undefined' ? window.innerWidth : 1440);
  _useEffectW(() => { const _fn = () => _setW(window.innerWidth); window.addEventListener('resize', _fn); return () => window.removeEventListener('resize', _fn); }, []);
  return _w;
}
const isMob = (_w: number) => _w < 640;
const isTab = (_w: number) => _w >= 640 && _w < 1024;


interface VoiceReport { id: string; reporter_name: string; reporter_role?: string; classification: string; transcript: string; location?: string; created_at: string; }

const CLASS_COLOR: Record<string, string> = { urgent: '#ff5555', incident: '#ffa726', feedback: '#42a5f5', update: '#00c864', general: '#8899bb' };

export default function VoiceIntelligence() {
  const w = useW();
  const [reports, setReports] = useState<VoiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('voice_reports', { order: 'created_at', dir: 'DESC', limit: '50' });
      setReports((data as VoiceReport[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function getSummary() {
    setSummarizing(true);
    try {
      const r = await fetch('/api/voice/ai-summary', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      setSummary(d.summary || '');
    } catch (_) {}
    setSummarizing(false);
  }

  useEffect(() => { load(); }, []);

  const urgent = reports.filter(r => r.classification === 'urgent').length;
  const locations = [...new Set(reports.map(r => r.location).filter(Boolean))].length;
  const filtered = filter === 'all' ? reports : reports.filter(r => r.classification === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Total Reports" value={reports.length} color="#42a5f5" icon={FileText} />
        <Stat label="Urgent Reports" value={urgent} color="#ff5555" icon={Radio} />
        <Stat label="Locations Covered" value={locations} color="#00c864" icon={MapPin} />
        <Stat label="Field Workers" value={[...new Set(reports.map(r => r.reporter_name))].length} color="#ab47bc" icon={User} />
      </div>

      {(summary || summarizing) && (
        <AIPanel title="Field Intelligence Summary" content={summary} loading={summarizing} onClose={() => setSummary('')} />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
          {['all', 'urgent', 'incident', 'feedback', 'update', 'general'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={T.pill(filter === f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={getSummary} disabled={summarizing} style={{ ...T.primary, flexShrink: 0, opacity: summarizing ? 0.65 : 1 }}>
          {summarizing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Summarising...</> : <><Zap size={13} />AI Summary</>}
        </button>
        <button onClick={() => setShowForm(true)} style={{ ...T.ghost, flexShrink: 0 }}><Plus size={13} />Add Report</button>
        <button onClick={load} style={{ ...T.ghost, flexShrink: 0, padding: '9px' }}><RefreshCw size={13} /></button>
      </div>

      {loading ? <Loading text="Loading field reports..." />
        : filtered.length === 0 ? (
          <Empty icon={Mic} title="No field reports yet" sub="Karyakartas can submit voice reports via the app or you can add them manually." action="Add First Report" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(r => {
              const cc = CLASS_COLOR[r.classification] || '#8899bb';
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '14px 16px', borderLeft: r.classification === 'urgent' ? '3px solid #ff5555' : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mic size={15} style={{ color: cc }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{r.reporter_name}</span>
                        {r.reporter_role && <span style={{ fontSize: 11, color: '#8899bb' }}>{r.reporter_role}</span>}
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${cc}15`, color: cc, fontWeight: 700, textTransform: 'uppercase', marginLeft: 'auto' }}>{r.classification}</span>
                      </div>
                      {r.location && <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{r.location}</div>}
                      <p style={{ fontSize: 13, color: '#d0d8ee', margin: 0, lineHeight: 1.6 }}>{r.transcript}</p>
                      <div style={{ fontSize: 11, color: '#8899bb', marginTop: 6 }}>{new Date(r.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Field Report">
          <AddReportForm onSave={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

function AddReportForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ reporter_name: '', reporter_role: 'Karyakarta', transcript: '', location: '', classification: 'general' });
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function toggleRecord() {
    if (recording && mediaRef.current) { mediaRef.current.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setBusy(true);
          try {
            const r = await fetch('/api/voice/transcribe', {
              method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio_base64: base64, mimeType: 'audio/webm' }),
            });
            const d = await r.json();
            if (d.transcript) f('transcript', d.transcript);
          } catch (_) {}
          setBusy(false);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (_) {}
  }

  async function save() {
    if (!form.reporter_name || !form.transcript) return;
    setBusy(true);
    await api.create('voice_reports', form);
    setBusy(false);
    onSave();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={T.label}>Reporter Name *</label><input value={form.reporter_name} onChange={e => f('reporter_name', e.target.value)} placeholder="Karyakarta name" style={T.input} /></div>
        <div><label style={T.label}>Location</label><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Village / Mandal" style={T.input} /></div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...T.label, margin: 0 }}>Report / Transcript *</label>
          <button onClick={toggleRecord}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: recording ? 'rgba(255,85,85,0.12)' : 'rgba(0,212,170,0.08)', border: `1px solid ${recording ? 'rgba(255,85,85,0.3)' : 'rgba(0,212,170,0.2)'}`, color: recording ? '#ff5555' : '#00d4aa', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {recording ? <><MicOff size={11} />Stop</> : <><Mic size={11} />Record</>}
          </button>
        </div>
        <textarea value={form.transcript} onChange={e => f('transcript', e.target.value)}
          placeholder="Type the field report or use record button to transcribe voice..." rows={4}
          style={{ ...T.input, resize: 'vertical' }} />
        {busy && <div style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>Transcribing...</div>}
      </div>
      <div>
        <label style={T.label}>Classification</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['urgent', 'incident', 'feedback', 'update', 'general'].map(c => (
            <button key={c} onClick={() => f('classification', c)} style={T.pill(form.classification === c)}>{c}</button>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={busy || !form.reporter_name || !form.transcript}
        style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.reporter_name || !form.transcript ? 0.5 : 1 }}>
        {busy ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : 'Submit Report'}
      </button>
    </div>
  );
}
