import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, X, MapPin, FileAudio, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { VoiceReport } from '../lib/types';

const CLASSIFICATIONS = ['Grievance', 'Project Update', 'Media Report', 'Field Intel', 'General'];

function VoiceModal({ report, onClose, onSave }: {
  report: Partial<VoiceReport> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    reporter_name: report?.reporter_name || '',
    reporter_role: report?.reporter_role || '',
    transcript: report?.transcript || '',
    classification: report?.classification || 'General',
    language: report?.language || 'Telugu',
    location: report?.location || '',
    gps_lat: report?.gps_lat || '',
    gps_lng: report?.gps_lng || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.transcript) return;
    setSaving(true);
    const payload = {
      ...form,
      gps_lat: form.gps_lat ? parseFloat(String(form.gps_lat)) : null,
      gps_lng: form.gps_lng ? parseFloat(String(form.gps_lng)) : null,
    };
    if (report?.id) await api.update('voice_reports', report.id, payload);
    else await api.create('voice_reports', payload);
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
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {report?.id ? 'Edit Voice Report' : 'Add Voice Report'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Reporter Name</label>
              <input className="input-field" value={form.reporter_name} onChange={e => setForm({ ...form, reporter_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Reporter Role</label>
              <input className="input-field" value={form.reporter_role} onChange={e => setForm({ ...form, reporter_role: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Classification</label>
              <select className="input-field" value={form.classification} onChange={e => setForm({ ...form, classification: e.target.value })}>
                {CLASSIFICATIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Language</label>
              <select className="input-field" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {['Telugu', 'English', 'Hindi', 'Urdu'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Transcript *</label>
            <textarea className="input-field" rows={4} value={form.transcript} onChange={e => setForm({ ...form, transcript: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Location</label>
            <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>GPS Lat</label>
              <input className="input-field" value={form.gps_lat} onChange={e => setForm({ ...form, gps_lat: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>GPS Lng</label>
              <input className="input-field" value={form.gps_lng} onChange={e => setForm({ ...form, gps_lng: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : report?.id ? 'Update' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VoiceIntelligence() {
  const [reports, setReports] = useState<VoiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<VoiceReport> | null>(null);

  async function fetchReports() {
    setLoading(true);
    const data = await api.list('voice_reports', { order: 'created_at', dir: 'DESC', limit: '50' }) as VoiceReport[];
    setReports(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #42a5f5)' }}>
            <Mic size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Voice Intelligence</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Capture field voice reports and classify them instantly</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={14} /> Add Voice Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, icon: FileAudio, color: '#42a5f5' },
          { label: 'Grievance Reports', value: reports.filter(r => r.classification === 'Grievance').length, icon: Sparkles, color: '#ffa726' },
          { label: 'Field Intel', value: reports.filter(r => r.classification === 'Field Intel').length, icon: MapPin, color: '#00d4aa' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color, fontFamily: 'Space Grotesk' }}>
              {loading ? '—' : card.value}
            </div>
            <div style={{ fontSize: 11, color: '#8899bb' }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? Array(3).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-4 w-2/3 rounded mb-2" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        )) : reports.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card-hover rounded-2xl p-5 cursor-pointer"
            onClick={() => { setSelected(r); setModalOpen(true); }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(66,165,245,0.15)', border: '1px solid rgba(66,165,245,0.25)' }}>
                <Mic size={16} style={{ color: '#42a5f5' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{r.reporter_name || 'Unknown Reporter'}</div>
                  <span style={{ fontSize: 11, color: '#8899bb' }}>{r.reporter_role || 'Field Worker'}</span>
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa' }}>
                    {r.classification}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }} className="line-clamp-2">
                  {r.transcript}
                </div>
                <div className="flex items-center gap-2 mt-2" style={{ fontSize: 11, color: '#6677aa' }}>
                  <MapPin size={12} /> {r.location || 'No location'}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <VoiceModal
            report={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchReports}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
