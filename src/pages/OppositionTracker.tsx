import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, X, AlertTriangle, Search } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';
import type { OppositionIntel } from '../lib/types';

const TYPES = ['Speech', 'Visit', 'Media', 'Social', 'Campaign', 'Policy', 'Other'];
const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];

function IntelModal({ intel, onClose, onSave }: { intel: Partial<OppositionIntel> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    opponent_name: intel?.opponent_name || '',
    opponent_party: intel?.opponent_party || '',
    opponent_constituency: intel?.opponent_constituency || '',
    activity_type: intel?.activity_type || 'Speech',
    description: intel?.description || '',
    source: intel?.source || '',
    detected_at: intel?.detected_at ? intel.detected_at.substring(0, 16) : new Date().toISOString().substring(0, 16),
    sentiment_toward_us: intel?.sentiment_toward_us || 'Neutral',
    threat_level: intel?.threat_level || 5,
    ai_analysis: intel?.ai_analysis || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.opponent_name || !form.description) return;
    setSaving(true);
    if (intel?.id) await api.update('opposition_intelligence', intel.id, form);
    else await api.create('opposition_intelligence', form);
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
            {intel?.id ? 'Edit Opposition Intel' : 'Add Opposition Intel'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Opponent Name *</label>
              <input className="input-field" value={form.opponent_name} onChange={e => setForm({ ...form, opponent_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Party</label>
              <input className="input-field" value={form.opponent_party} onChange={e => setForm({ ...form, opponent_party: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Constituency</label>
              <input className="input-field" value={form.opponent_constituency} onChange={e => setForm({ ...form, opponent_constituency: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Activity Type</label>
              <select className="input-field" value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value })}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Description *</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Detected At</label>
              <input type="datetime-local" className="input-field" value={form.detected_at} onChange={e => setForm({ ...form, detected_at: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Sentiment</label>
              <select className="input-field" value={form.sentiment_toward_us} onChange={e => setForm({ ...form, sentiment_toward_us: e.target.value })}>
                {SENTIMENTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Threat Level (1–10)</label>
              <input type="number" min={1} max={10} className="input-field" value={form.threat_level}
                onChange={e => setForm({ ...form, threat_level: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Source</label>
            <input className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>AI Analysis</label>
            <textarea className="input-field" rows={2} value={form.ai_analysis} onChange={e => setForm({ ...form, ai_analysis: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : intel?.id ? 'Update' : 'Add Intel'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function OppositionTracker() {
  const [items, setItems] = useState<OppositionIntel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<OppositionIntel> | null>(null);
  const [search, setSearch] = useState('');

  async function fetchItems() {
    setLoading(true);
    const data = await api.list('opposition_intelligence', { order: 'detected_at', dir: 'DESC', limit: '50' }) as OppositionIntel[];
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(i =>
    !search || i.opponent_name.toLowerCase().includes(search.toLowerCase()) ||
    i.activity_type.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  const highThreat = items.filter(i => i.threat_level >= 7).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff8c42, #ff5555)' }}>
            <Eye size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Opposition Tracker</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Monitor opposition activity, threats, and narratives</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={14} /> Add Intel
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 240 }}>
          <Search size={14} style={{ color: '#8899bb' }} />
          <input className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
            placeholder="Search opposition intel..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)' }}>
          <AlertTriangle size={13} style={{ color: '#ff5555' }} />
          <span style={{ fontSize: 12, color: '#ff7777' }}>{highThreat} high‑threat items</span>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? Array(3).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-4 w-2/3 rounded mb-2" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        )) : filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card-hover rounded-2xl p-5 cursor-pointer"
            onClick={() => { setSelected(item); setModalOpen(true); }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,85,85,0.15)', border: '1px solid rgba(255,85,85,0.25)' }}>
                <Eye size={16} style={{ color: '#ff5555' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{item.opponent_name}</div>
                  <Badge variant={item.threat_level >= 7 ? 'danger' : item.threat_level >= 4 ? 'warning' : 'neutral'}>
                    Threat {item.threat_level}
                  </Badge>
                  <Badge variant={item.sentiment_toward_us === 'Negative' ? 'danger' : item.sentiment_toward_us === 'Positive' ? 'success' : 'neutral'}>
                    {item.sentiment_toward_us}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }} className="line-clamp-2">
                  {item.description}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span style={{ fontSize: 11, color: '#6677aa' }}>{item.activity_type}</span>
                  <span style={{ fontSize: 11, color: '#6677aa' }}>{item.opponent_party}</span>
                  <span style={{ fontSize: 11, color: '#6677aa' }}>{new Date(item.detected_at).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <IntelModal
            intel={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchItems}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
