import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, BarChart3, X } from 'lucide-react';
import { api } from '../lib/api';
import type { SentimentScore } from '../lib/types';

function SentimentModal({ score, onClose, onSave }: {
  score: Partial<SentimentScore> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    score_date: score?.score_date || new Date().toISOString().split('T')[0],
    overall_score: score?.overall_score || 60,
    news_score: score?.news_score || 60,
    social_score: score?.social_score || 60,
    whatsapp_score: score?.whatsapp_score || 60,
    grievance_score: score?.grievance_score || 60,
    ground_score: score?.ground_score || 60,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      channel_breakdown: {
        news: form.news_score,
        social: form.social_score,
        whatsapp: form.whatsapp_score,
        grievance: form.grievance_score,
        ground: form.ground_score,
      },
    };
    if (score?.id) {
      await api.update('sentiment_scores', score.id, payload);
    } else {
      await api.create('sentiment_scores', payload);
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
        className="glass-card rounded-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {score?.id ? 'Edit Sentiment Score' : 'Add Sentiment Score'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Date</label>
            <input type="date" className="input-field" value={form.score_date}
              onChange={e => setForm({ ...form, score_date: e.target.value })} />
          </div>
          {[
            ['Overall Score', 'overall_score'],
            ['News Score', 'news_score'],
            ['Social Score', 'social_score'],
            ['WhatsApp Score', 'whatsapp_score'],
            ['Grievance Score', 'grievance_score'],
            ['Ground Score', 'ground_score'],
          ].map(([label, key]) => (
            <div key={key} className="flex items-center gap-3">
              <div style={{ fontSize: 12, color: '#8899bb', width: 140 }}>{label}</div>
              <input
                type="number"
                min={0}
                max={100}
                className="input-field"
                value={form[key as keyof typeof form]}
                onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : score?.id ? 'Update' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SentimentDashboard() {
  const [scores, setScores] = useState<SentimentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<SentimentScore> | null>(null);

  async function fetchScores() {
    setLoading(true);
    const data = await api.list('sentiment_scores', { order: 'score_date', dir: 'DESC', limit: '30' }) as SentimentScore[];
    setScores(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchScores(); }, []);

  const latest = scores[0];
  const prev = scores[1];
  const delta = latest && prev ? latest.overall_score - prev.overall_score : 0;

  const trend = scores.slice(0, 14).reverse();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <BarChart3 size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Sentiment Dashboard</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Track constituency mood and trend signals</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={14} /> Add Score
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div style={{ fontSize: 12, color: '#8899bb' }}>Overall Mood Index</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
            {loading ? '—' : (latest?.overall_score ?? 0)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {delta >= 0 ? <TrendingUp size={14} style={{ color: '#00c864' }} /> : <TrendingDown size={14} style={{ color: '#ff5555' }} />}
            <span style={{ fontSize: 12, color: delta >= 0 ? '#00c864' : '#ff5555' }}>
              {delta >= 0 ? '+' : ''}{delta} vs last update
            </span>
          </div>
        </div>
        {[
          { label: 'News', value: latest?.news_score ?? 0, color: '#42a5f5' },
          { label: 'Social', value: latest?.social_score ?? 0, color: '#00d4aa' },
          { label: 'WhatsApp', value: latest?.whatsapp_score ?? 0, color: '#00c864' },
          { label: 'Grievance', value: latest?.grievance_score ?? 0, color: '#ffa726' },
          { label: 'Ground', value: latest?.ground_score ?? 0, color: '#ab47bc' },
        ].slice(0, 2).map(card => (
          <div key={card.label} className="glass-card rounded-2xl p-5">
            <div style={{ fontSize: 12, color: '#8899bb' }}>{card.label} Score</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: card.color, fontFamily: 'Space Grotesk' }}>
              {loading ? '—' : card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>14‑Day Trend</h3>
        </div>
        {loading ? (
          <div className="shimmer h-24 rounded-xl" />
        ) : (
          <div className="flex items-end gap-2 h-28">
            {trend.map((t, i) => (
              <div key={t.id} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="w-full rounded-t-md"
                    style={{ height: `${(t.overall_score / 100) * 100}%`, background: 'linear-gradient(180deg, #00d4aa, #1e88e5)' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(t.overall_score / 100) * 100}%` }}
                    transition={{ delay: i * 0.03, duration: 0.5 }}
                  />
                </div>
                <span style={{ fontSize: 9, color: '#8899bb' }}>{new Date(t.score_date).getDate()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold mb-3" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Channel Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: 'News', value: latest?.news_score ?? 0, color: '#42a5f5' },
            { label: 'Social', value: latest?.social_score ?? 0, color: '#00d4aa' },
            { label: 'WhatsApp', value: latest?.whatsapp_score ?? 0, color: '#00c864' },
            { label: 'Grievance', value: latest?.grievance_score ?? 0, color: '#ffa726' },
            { label: 'Ground', value: latest?.ground_score ?? 0, color: '#ab47bc' },
          ].map(card => (
            <div key={card.label} className="text-center p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: card.color, fontFamily: 'Space Grotesk' }}>{card.value}</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <SentimentModal
            score={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchScores}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
