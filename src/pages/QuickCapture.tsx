import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, StopCircle, UploadCloud, CheckCircle, AlertCircle, FileText, Zap } from 'lucide-react';
import { api } from '../lib/api';

const CLASSIFICATIONS = ['Grievance', 'Project Update', 'Media Report', 'Field Intelligence', 'General'];

export default function QuickCapture() {
  const [activeTab, setActiveTab] = useState<'voice' | 'grievance'>('voice');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [classification, setClassification] = useState(CLASSIFICATIONS[0]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [grievanceForm, setGrievanceForm] = useState({ subject: '', description: '', location: '', contact: '' });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    };
  }, []);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function blobToBase64(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function enqueueOffline(payload: Record<string, unknown>) {
    const queue = JSON.parse(localStorage.getItem('nethra_quick_capture_queue') || '[]');
    queue.push(payload);
    localStorage.setItem('nethra_quick_capture_queue', JSON.stringify(queue));
  }

  async function handleVoiceSubmit() {
    setSaving(true);
    setStatus('');
    try {
      const payload: Record<string, unknown> = {
        classification,
        transcript,
      };
      if (audioBlob) {
        payload.audio_base64 = await blobToBase64(audioBlob);
        payload.filename = 'voice.webm';
        payload.mimeType = 'audio/webm';
      }
      if (!navigator.onLine) {
        enqueueOffline({ type: 'voice', payload });
        setStatus('Saved offline. Will sync when online.');
      } else {
        await api.post('/api/voice/transcribe', payload);
        setStatus('Voice report submitted.');
      }
      setTranscript('');
      setAudioBlob(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit voice report';
      setStatus(message);
    }
    setSaving(false);
  }

  async function handleGrievanceSubmit() {
    if (!grievanceForm.subject || !grievanceForm.description) return;
    setSaving(true);
    setStatus('');
    const payload = {
      ticket_number: `QC-${Date.now().toString().slice(-8)}`,
      petitioner_name: 'Quick Capture',
      contact: grievanceForm.contact,
      category: 'Quick Capture',
      subject: grievanceForm.subject,
      description: grievanceForm.description,
      location: grievanceForm.location,
      status: 'Pending',
      priority: 'Medium',
      assigned_to: '',
    };
    try {
      if (!navigator.onLine) {
        enqueueOffline({ type: 'grievance', payload });
        setStatus('Saved offline. Will sync when online.');
      } else {
        await api.create('grievances', payload);
        setStatus('Grievance submitted.');
      }
      setGrievanceForm({ subject: '', description: '', location: '', contact: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit grievance';
      setStatus(message);
    }
    setSaving(false);
  }

  async function syncOffline() {
    const queue = JSON.parse(localStorage.getItem('nethra_quick_capture_queue') || '[]');
    if (!queue.length) return;
    for (const item of queue) {
      if (item.type === 'voice') await api.post('/api/voice/transcribe', item.payload);
      if (item.type === 'grievance') await api.create('grievances', item.payload);
    }
    localStorage.removeItem('nethra_quick_capture_queue');
    setStatus('Offline items synced.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
          <Zap size={18} style={{ color: '#060b18' }} />
        </div>
        <div>
          <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Quick Capture</h2>
          <p style={{ fontSize: 12, color: '#8899bb' }}>Voice-first capture for field workers with offline sync</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'voice', label: 'Voice Report' },
          { key: 'grievance', label: 'Quick Grievance' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'voice' | 'grievance')}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: activeTab === tab.key ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.key ? '#00d4aa' : '#8899bb',
            }}
          >
            {tab.label}
          </button>
        ))}
        <button onClick={syncOffline} className="ml-auto px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#8899bb' }}>
          Sync Offline
        </button>
      </div>

      {status && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: status.includes('Failed') ? 'rgba(255,85,85,0.1)' : 'rgba(0,212,170,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {status.includes('Failed') ? <AlertCircle size={14} style={{ color: '#ff7777' }} /> : <CheckCircle size={14} style={{ color: '#00d4aa' }} />}
          <span style={{ fontSize: 12, color: '#8899bb' }}>{status}</span>
        </div>
      )}

      {activeTab === 'voice' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={recording ? stopRecording : startRecording}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: recording ? 'rgba(255,85,85,0.2)' : 'rgba(0,212,170,0.2)', color: recording ? '#ff7777' : '#00d4aa' }}
            >
              {recording ? <StopCircle size={16} /> : <Mic size={16} />}
              {recording ? 'Stop' : 'Record'}
            </button>
            {audioBlob && <span style={{ fontSize: 12, color: '#8899bb' }}>Audio ready</span>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Classification</label>
            <select className="input-field" value={classification} onChange={e => setClassification(e.target.value)}>
              {CLASSIFICATIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Transcript (optional)</label>
            <textarea className="input-field" rows={3} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Type if audio is not available" />
          </div>
          <button onClick={handleVoiceSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
            <UploadCloud size={14} /> {saving ? 'Submitting...' : 'Submit Voice Report'}
          </button>
        </motion.div>
      )}

      {activeTab === 'grievance' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Subject *</label>
            <input className="input-field" value={grievanceForm.subject} onChange={e => setGrievanceForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Description *</label>
            <textarea className="input-field" rows={3} value={grievanceForm.description} onChange={e => setGrievanceForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Location</label>
              <input className="input-field" value={grievanceForm.location} onChange={e => setGrievanceForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Contact</label>
              <input className="input-field" value={grievanceForm.contact} onChange={e => setGrievanceForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleGrievanceSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
            <FileText size={14} /> {saving ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
