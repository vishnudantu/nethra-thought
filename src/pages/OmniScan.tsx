import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Zap, Globe, Newspaper, Video, MessageSquare, Activity, Clock } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';

interface OmniStatus {
  enabled: boolean;
  omni: {
    lastRun: string | null;
    lastError: string | null;
    lastDurationMs: number;
    counts: {
      rss: number;
      youtube: number;
      twitter: number;
      facebook: number;
      instagram: number;
      whatsapp: number;
      skipped: number;
    };
    sources: Record<string, number>;
  };
}

interface Mention {
  id: string;
  headline: string;
  source: string;
  source_type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  url: string;
  published_at: string;
}

export default function OmniScan() {
  const [status, setStatus] = useState<OmniStatus | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  async function fetchAll() {
    setLoading(true);
    const [s, m] = await Promise.all([
      api.get('/api/omniscan/status'),
      api.list('media_mentions', { order: 'published_at', dir: 'DESC', limit: '15' }),
    ]);
    setStatus(s as OmniStatus);
    setMentions((m as Mention[]) || []);
    setLoading(false);
  }

  async function triggerScan() {
    setTriggering(true);
    await api.post('/api/omniscan/trigger', {});
    await fetchAll();
    setTriggering(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const counts = status?.omni?.counts;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Zap size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>OmniScan Engine</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Live intelligence pipeline across news, social, video, and WhatsApp</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={triggerScan} disabled={triggering}>
          <RefreshCw size={14} /> {triggering ? 'Scanning...' : 'Run OmniScan'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'RSS / News', value: counts?.rss ?? 0, icon: Newspaper, color: '#42a5f5' },
          { label: 'YouTube', value: counts?.youtube ?? 0, icon: Video, color: '#ef5350' },
          { label: 'Social', value: (counts?.twitter ?? 0) + (counts?.facebook ?? 0) + (counts?.instagram ?? 0), icon: MessageSquare, color: '#00c864' },
          { label: 'WhatsApp', value: counts?.whatsapp ?? 0, icon: Globe, color: '#00d4aa' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
              <span style={{ fontSize: 11, color: '#8899bb' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color, fontFamily: 'Space Grotesk' }}>
              {loading ? '...' : card.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} style={{ color: '#00d4aa' }} />
              <h3 className="font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Latest Mentions</h3>
            </div>
            <span style={{ fontSize: 11, color: '#8899bb' }}>{mentions.length} items</span>
          </div>
          <div className="space-y-3">
            {loading ? [1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-xl" />) :
              mentions.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card-hover rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <Newspaper size={14} style={{ color: '#8899bb' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }} className="line-clamp-2">{m.headline}</div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span style={{ fontSize: 11, color: '#8899bb' }}>{m.source}</span>
                        <Badge variant={m.sentiment === 'Positive' ? 'success' : m.sentiment === 'Negative' ? 'danger' : 'neutral'}>
                          {m.sentiment}
                        </Badge>
                        <span style={{ fontSize: 11, color: '#6677aa' }}>{new Date(m.published_at).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: '#1e88e5' }} />
            <h3 className="font-semibold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Scan Status</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: '#8899bb' }}>Queue</span>
              <span style={{ color: status?.enabled ? '#00c864' : '#ff5555', fontWeight: 600 }}>
                {status?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#8899bb' }}>Last Run</span>
              <span style={{ color: '#f0f4ff' }}>{status?.omni?.lastRun ? new Date(status.omni.lastRun).toLocaleString('en-IN') : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#8899bb' }}>Duration</span>
              <span style={{ color: '#f0f4ff' }}>{status?.omni?.lastDurationMs ? `${Math.round(status.omni.lastDurationMs / 1000)}s` : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#8899bb' }}>Skipped</span>
              <span style={{ color: '#f0f4ff' }}>{counts?.skipped ?? 0}</span>
            </div>
            {status?.omni?.lastError && (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff5555' }}>
                {status.omni.lastError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
