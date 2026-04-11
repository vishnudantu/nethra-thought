import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, X } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';
import type { MediaMention } from '../lib/types';

const sources = ['Eenadu', 'Sakshi', 'The Hindu', 'Times of India', 'Deccan Chronicle', 'ABN Andhra Jyothy', 'TV9', 'ZEE News', 'Twitter', 'Facebook'];

function MediaModal({ mention, onClose, onSave }: {
  mention: Partial<MediaMention> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    headline: mention?.headline || '',
    source: mention?.source || 'Eenadu',
    source_type: mention?.source_type || 'Newspaper',
    sentiment: mention?.sentiment || 'Neutral',
    language: mention?.language || 'Telugu',
    url: mention?.url || '',
    summary: mention?.summary || '',
    reach: mention?.reach || 0,
    published_at: mention?.published_at ? mention.published_at.substring(0, 16) : new Date().toISOString().substring(0, 16),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.headline) return;
    setSaving(true);
    if (mention?.id) {
      await api.update('media_mentions', mention.id, form);
    } else {
      await api.create('media_mentions', form);
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
        className="glass-card rounded-2xl w-full max-w-xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {mention?.id ? 'Edit Coverage' : 'Add Media Coverage'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Headline *</label>
            <input className="input-field" placeholder="News headline"
              value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Source</label>
              <select className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                {sources.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Source Type</label>
              <select className="input-field" value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value })}>
                {['Newspaper', 'TV', 'Online', 'Social Media', 'Radio', 'Magazine'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Sentiment</label>
              <select className="input-field" value={form.sentiment} onChange={e => setForm({ ...form, sentiment: e.target.value as MediaMention['sentiment'] })}>
                {['Positive', 'Negative', 'Neutral'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Language</label>
              <select className="input-field" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {['Telugu', 'English', 'Hindi', 'Urdu'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Reach</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.reach} onChange={e => setForm({ ...form, reach: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Published Date</label>
            <input type="datetime-local" className="input-field" value={form.published_at}
              onChange={e => setForm({ ...form, published_at: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>URL</label>
            <input className="input-field" placeholder="Article URL"
              value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Summary</label>
            <textarea className="input-field" rows={3} placeholder="Brief summary"
              value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : mention?.id ? 'Update' : 'Add Coverage'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Media() {
  const [mentions, setMentions] = useState<MediaMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<MediaMention> | null>(null);
  const [filter, setFilter] = useState('All');

  async function fetchMedia() {
    setLoading(true);
    const data = await api.list('media_mentions', { order: 'created_at', dir: 'DESC' });
    setMentions(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchMedia(); }, []);

  const filtered = filter === 'All' ? mentions : mentions.filter(m => m.sentiment === filter);
  const pos = mentions.filter(m => m.sentiment === 'Positive').length;
  const neg = mentions.filter(m => m.sentiment === 'Negative').length;
  const sentimentScore = mentions.length ? Math.round(((pos - neg) / mentions.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Coverage', value: mentions.length, color: '#42a5f5', icon: Newspaper },
          { label: 'Positive', value: pos, color: '#00c864', icon: TrendingUp },
          { label: 'Negative', value: neg, color: '#ff5555', icon: TrendingDown },
          { label: 'Sentiment Score', value: `${sentimentScore > 0 ? '+' : ''}${sentimentScore}`, color: sentimentScore >= 0 ? '#00d4aa' : '#ff5555', icon: Minus },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: s.color + '20' }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#8899bb' }}>{s.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Positive', 'Negative', 'Neutral'].map(f => (
            <button key={f}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: filter === f ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#00d4aa' : '#8899bb',
                border: `1px solid ${filter === f ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Coverage
        </button>
      </div>

      <div className="space-y-3">
        {loading ? Array(5).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="shimmer h-4 w-3/4 rounded mb-2" />
            <div className="shimmer h-3 w-1/3 rounded" />
          </div>
        )) : filtered.map((m, i) => {
          const sentColors = { Positive: '#00c864', Negative: '#ff5555', Neutral: '#8899bb' };
          const color = sentColors[m.sentiment];
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card-hover rounded-2xl p-4 cursor-pointer"
              onClick={() => { setSelected(m); setModalOpen(true); }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '20', border: `1px solid ${color}30` }}>
                  {m.sentiment === 'Positive' ? <TrendingUp size={16} style={{ color }} />
                    : m.sentiment === 'Negative' ? <TrendingDown size={16} style={{ color }} />
                    : <Minus size={16} style={{ color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 style={{ fontSize: 14, fontWeight: 500, color: '#f0f4ff', lineHeight: 1.4 }}>{m.headline}</h3>
                    {m.url && <ExternalLink size={14} style={{ color: '#8899bb', flexShrink: 0, marginTop: 2 }} />}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>{m.source}</span>
                    <Badge variant={m.source_type === 'TV' ? 'danger' : m.source_type === 'Newspaper' ? 'info' : 'neutral'}>
                      {m.source_type}
                    </Badge>
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{m.language}</span>
                    {m.reach > 0 && <span style={{ fontSize: 11, color: '#8899bb' }}>{m.reach.toLocaleString()} reach</span>}
                    <span style={{ fontSize: 11, color: '#8899bb' }}>
                      {new Date(m.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {m.summary && <p style={{ fontSize: 12, color: '#8899bb', marginTop: 6 }} className="line-clamp-2">{m.summary}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <MediaModal
            mention={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchMedia}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
