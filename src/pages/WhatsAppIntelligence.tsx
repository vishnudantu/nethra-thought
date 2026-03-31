import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, AlertTriangle, TrendingUp, Shield, Zap, Radio,
  RefreshCw, Send, Filter, Search, Eye, CheckCircle2, XCircle,
  Phone, Clock, BarChart3, Flame, Info, ChevronDown, Plus,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface WaMessage {
  id: string;
  politician_id: string;
  received_at: string;
  sender_phone: string;
  message_type: string;
  content: string;
  classification: string;
  sentiment: string;
  urgency_score: number;
  is_viral: number;
  viral_count: number;
  is_misinformation: number;
  routed_to: string;
  action_taken: string;
  created_at: string;
}

const CLASS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  grievance:       { label: 'Grievance',       color: '#ff7777', bg: 'rgba(255,85,85,0.12)',   icon: AlertTriangle },
  emergency:       { label: 'Emergency',       color: '#ff3333', bg: 'rgba(255,50,50,0.15)',    icon: Zap },
  misinformation:  { label: 'Misinfo',         color: '#ffa726', bg: 'rgba(255,167,38,0.12)',  icon: Shield },
  opposition:      { label: 'Opposition',      color: '#a78bfa', bg: 'rgba(124,58,237,0.12)',  icon: Radio },
  praise:          { label: 'Praise',          color: '#00c864', bg: 'rgba(0,200,100,0.12)',   icon: TrendingUp },
  project:         { label: 'Project',         color: '#64b5f6', bg: 'rgba(30,136,229,0.12)',  icon: BarChart3 },
  darshan:         { label: 'Darshan',         color: '#ffa726', bg: 'rgba(255,167,38,0.12)',  icon: Info },
  volunteer:       { label: 'Volunteer',       color: '#00d4aa', bg: 'rgba(0,212,170,0.12)',   icon: CheckCircle2 },
  general:         { label: 'General',         color: '#8899bb', bg: 'rgba(136,153,187,0.1)',  icon: MessageSquare },
};

const SENTIMENT_COLOR: Record<string, string> = {
  positive: '#00c864', negative: '#ff5555', neutral: '#8899bb',
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

export default function WhatsAppIntelligence() {
  const { activePolitician } = useAuth();
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WaMessage | null>(null);
  const [showInject, setShowInject] = useState(false);
  const [injectPhone, setInjectPhone] = useState('');
  const [injectContent, setInjectContent] = useState('');
  const [injecting, setInjecting] = useState(false);
  const [injectStatus, setInjectStatus] = useState('');

  const BASE = (import.meta as any).env?.VITE_API_URL || '';

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list('whatsapp_intelligence', { order: 'created_at', dir: 'DESC' }) as WaMessage[];
      setMessages(data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => {
    const t = setInterval(fetchMessages, 30000);
    return () => clearInterval(t);
  }, [fetchMessages]);

  const filtered = messages.filter(m => {
    if (filter !== 'all' && m.classification !== filter) return false;
    if (search && !m.content?.toLowerCase().includes(search.toLowerCase()) &&
        !m.sender_phone?.includes(search)) return false;
    return true;
  });

  const stats = {
    total: messages.length,
    viral: messages.filter(m => m.is_viral).length,
    misinfo: messages.filter(m => m.is_misinformation).length,
    emergency: messages.filter(m => m.classification === 'emergency').length,
    grievances: messages.filter(m => m.classification === 'grievance').length,
    urgent: messages.filter(m => m.urgency_score >= 7).length,
  };

  async function injectMessage() {
    if (!injectContent.trim()) return;
    setInjecting(true);
    setInjectStatus('');
    try {
      await api.post('/api/whatsapp/inject', {
        sender_phone: injectPhone || '+91TEST',
        content: injectContent,
        politician_id: activePolitician?.id,
      });
      setInjectStatus('Message injected successfully');
      setInjectContent('');
      setInjectPhone('');
      await fetchMessages();
      setTimeout(() => { setShowInject(false); setInjectStatus(''); }, 1500);
    } catch (e: any) {
      setInjectStatus('Error: ' + e.message);
    }
    setInjecting(false);
  }

  const webhookUrl = `${BASE}/api/whatsapp/webhook?politician_id=${activePolitician?.id || 'YOUR_ID'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>
            WhatsApp Intelligence
          </h1>
          <p style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>
            Live feed from all forwarded messages — classified, scored, and routed automatically
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInject(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: '#00d4aa' }}>
            <Plus size={14} /> Inject Test Message
          </button>
          <button onClick={fetchMessages}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899bb' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Messages', value: stats.total,     color: '#00d4aa', icon: MessageSquare },
          { label: 'Viral',          value: stats.viral,     color: '#ff5555', icon: Flame },
          { label: 'Misinformation', value: stats.misinfo,   color: '#ffa726', icon: Shield },
          { label: 'Emergency',      value: stats.emergency, color: '#ff3333', icon: Zap },
          { label: 'Grievances',     value: stats.grievances,color: '#ff7777', icon: AlertTriangle },
          { label: 'High Urgency',   value: stats.urgent,    color: '#a78bfa', icon: TrendingUp },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={15} style={{ color: s.color }} />
                {s.label === 'Viral' && stats.viral > 0 && (
                  <span style={{ fontSize: 9, color: '#ff5555', fontWeight: 700 }}>LIVE</span>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Webhook Config Banner */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
        <div className="flex items-start gap-3 flex-wrap">
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', marginBottom: 4 }}>⚡ WEBHOOK URL — Configure in AiSensy / Wati</div>
            <code style={{ fontSize: 11, color: '#8899bb', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {webhookUrl}
            </code>
          </div>
          <button onClick={() => navigator.clipboard.writeText(webhookUrl)}
            style={{ marginLeft: 'auto', fontSize: 11, color: '#00d4aa', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            Copy URL
          </button>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..."
            className="pl-9 pr-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', outline: 'none', width: 220 }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'emergency', 'grievance', 'misinformation', 'opposition', 'praise', 'viral'].map(f => (
            <button key={f} onClick={() => setFilter(f === 'viral' ? 'all' : f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === f ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#00d4aa' : '#8899bb',
                border: `1px solid ${filter === f ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {f === 'all' ? 'All' : f === 'viral' ? '🔴 Viral' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8899bb' }}>
          {filtered.length} messages
        </div>
      </div>

      {/* Message Feed */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl p-4 shimmer" style={{ background: 'rgba(255,255,255,0.04)', height: 90 }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center" style={{ color: '#8899bb' }}>
            <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
            <p style={{ fontSize: 14 }}>No messages yet. Configure the webhook URL in AiSensy or Wati to start receiving messages.</p>
          </div>
        ) : (
          filtered.map((msg, i) => {
            const meta = CLASS_META[msg.classification] || CLASS_META.general;
            const Icon = meta.icon;
            const isUrgent = msg.urgency_score >= 8;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelected(msg === selected ? null : msg)}
                className="rounded-2xl p-4 cursor-pointer transition-all"
                style={{
                  background: isUrgent ? 'rgba(255,50,50,0.06)' : msg.is_viral ? 'rgba(255,85,85,0.04)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isUrgent ? 'rgba(255,80,80,0.25)' : msg.is_viral ? 'rgba(255,85,85,0.15)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg }}>
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: SENTIMENT_COLOR[msg.sentiment] }}>
                        {msg.sentiment}
                      </span>
                      {msg.is_viral ? (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#ff5555', background: 'rgba(255,85,85,0.12)', padding: '2px 7px', borderRadius: 100 }}>
                          🔴 VIRAL ({msg.viral_count}x)
                        </span>
                      ) : null}
                      {msg.is_misinformation ? (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#ffa726', background: 'rgba(255,167,38,0.12)', padding: '2px 7px', borderRadius: 100 }}>
                          ⚠️ MISINFO
                        </span>
                      ) : null}
                      {isUrgent && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#ff3333', background: 'rgba(255,50,50,0.12)', padding: '2px 7px', borderRadius: 100 }}>
                          🚨 URGENT
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(136,153,187,0.5)' }}>
                        {timeAgo(msg.created_at)}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: '#e0e8ff', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: selected === msg ? undefined : 2, WebkitBoxOrient: 'vertical' }}>
                      {msg.content}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#8899bb' }}>
                        <Phone size={11} />{msg.sender_phone || 'Unknown'}
                      </span>
                      <span style={{ fontSize: 11, color: '#8899bb' }}>
                        Score: <strong style={{ color: msg.urgency_score >= 7 ? '#ff5555' : '#f0f4ff' }}>{msg.urgency_score}/10</strong>
                      </span>
                    </div>
                  </div>

                  <ChevronDown size={14} style={{ color: '#8899bb', transform: selected === msg ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0, marginTop: 4 }} />
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {selected === msg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: 'Received', value: new Date(msg.received_at).toLocaleString('en-IN') },
                          { label: 'Type', value: msg.message_type },
                          { label: 'Routed To', value: msg.routed_to || '—' },
                          { label: 'Action Taken', value: msg.action_taken || 'Pending' },
                        ].map(d => (
                          <div key={d.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: 10, color: '#8899bb', marginBottom: 3 }}>{d.label}</div>
                            <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 600 }}>{d.value}</div>
                          </div>
                        ))}
                      </div>
                      {msg.is_misinformation ? (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.2)' }}>
                          <div style={{ fontSize: 11, color: '#ffa726', fontWeight: 700, marginBottom: 4 }}>⚠️ Misinformation Detected — Suggested Action</div>
                          <p style={{ fontSize: 12, color: '#8899bb' }}>Draft a rebuttal and broadcast to party workers immediately. Document evidence before the claim spreads further.</p>
                        </div>
                      ) : null}
                      {msg.classification === 'grievance' && (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,85,85,0.06)', border: '1px solid rgba(255,85,85,0.15)' }}>
                          <div style={{ fontSize: 11, color: '#ff7777', fontWeight: 700, marginBottom: 4 }}>📋 Auto-created as Grievance</div>
                          <p style={{ fontSize: 12, color: '#8899bb' }}>This message has been automatically logged as a constituent grievance and is visible in the Grievances module.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Inject Modal */}
      <AnimatePresence>
        {showInject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowInject(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Inject Test Message</h3>
              <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 16 }}>Simulate an incoming WhatsApp message for testing classification.</p>
              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 6 }}>Sender Phone (optional)</label>
                  <input value={injectPhone} onChange={e => setInjectPhone(e.target.value)} placeholder="+91 98765 43210"
                    className="input-field w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 6 }}>Message Content *</label>
                  <textarea value={injectContent} onChange={e => setInjectContent(e.target.value)}
                    placeholder="Try: 'Road in our village is broken, please fix it' or 'This is fake news about the minister'"
                    rows={4} className="input-field w-full" style={{ resize: 'none' }} />
                </div>
                {injectStatus && (
                  <div style={{ fontSize: 12, color: injectStatus.includes('Error') ? '#ff7777' : '#00d4aa', padding: '8px 12px', borderRadius: 8, background: injectStatus.includes('Error') ? 'rgba(255,85,85,0.1)' : 'rgba(0,212,170,0.1)' }}>
                    {injectStatus}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowInject(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={injectMessage} disabled={injecting || !injectContent.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {injecting ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: '#060b18' }} /> : <Send size={14} />}
                    {injecting ? 'Injecting...' : 'Inject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
