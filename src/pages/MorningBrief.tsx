import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, RefreshCw, Clock, Sparkles, CheckCircle2, AlertTriangle, TrendingUp, Zap, Activity } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Loading, getToken } from '../components/ui/ModuleLayout';;

// Responsive hook — inline to prevent module initialization order issues
import { useState as _useStateW, useEffect as _useEffectW } from 'react';
function useW() {
  const [_w, _setW] = _useStateW(typeof window !== 'undefined' ? window.innerWidth : 1440);
  _useEffectW(() => { const _fn = () => _setW(window.innerWidth); window.addEventListener('resize', _fn); return () => window.removeEventListener('resize', _fn); }, []);
  return _w;
}
const isMob = (_w: number) => _w < 640;
const isTab = (_w: number) => _w >= 640 && _w < 1024;


interface Brief { id: string; title: string; content: string; created_at: string; }

const SECTION_MAP = [
  { key: ['SITUATION'], icon: Activity, color: '#00d4aa', title: 'Situation' },
  { key: ['TOP 3','ACTION'], icon: CheckCircle2, color: '#42a5f5', title: 'Actions Today' },
  { key: ['WATCH'], icon: AlertTriangle, color: '#ffa726', title: 'Watch' },
  { key: ['SENTIMENT'], icon: TrendingUp, color: '#ab47bc', title: 'Sentiment' },
];

function parseContent(raw: string) {
  const sections: { title: string; content: string; icon: any; color: string }[] = [];
  let current: { title: string; lines: string[]; icon: any; color: string } | null = null;
  for (const line of raw.split('\n')) {
    const clean = line.replace(/\*\*/g, '').trim();
    if (!clean) continue;
    const match = SECTION_MAP.find(s => s.key.some(k => clean.toUpperCase().startsWith(k)));
    if (match) {
      if (current) sections.push({ ...current, content: current.lines.join('\n') });
      current = { title: match.title, lines: [], icon: match.icon, color: match.color };
    } else if (current) {
      current.lines.push(clean.replace(/^[-•·]\s*/, ''));
    }
  }
  if (current) sections.push({ ...current, content: current.lines.join('\n') });
  return sections.length ? sections : [{ title: 'Intelligence Brief', content: raw, icon: Sparkles, color: '#00d4aa' }];
}

export default function MorningBrief() {
  const w = useW();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [active, setActive] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('ai_briefings', { order: 'created_at', dir: 'DESC', limit: '10' });
      const list = (data as Brief[]) || [];
      setBriefs(list);
      if (list.length) setActive(list[0]);
    } catch (_) {}
    setLoading(false);
  }

  async function generate() {
    setGenerating(true);
    try {
      const r = await fetch('/api/briefing/ai-generate', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      if (d.id || d.brief) await load();
    } catch (_) {}
    setGenerating(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (loading) return;
    const today = new Date().toDateString();
    const needsGen = briefs.length === 0 || new Date(briefs[0].created_at).toDateString() !== today;
    if (needsGen) generate();
  }, [loading]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ ...T.card, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,167,38,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sun size={22} style={{ color: '#ffa726' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{greet}</div>
            <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          style={{ ...T.primary, opacity: generating ? 0.65 : 1 }}>
          {generating
            ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(6,11,24,0.3)', borderTopColor: '#060b18', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />Generating...</>
            : <><RefreshCw size={13} />New Brief</>}
        </button>
      </div>

      {/* Generating state */}
      {generating && <AIPanel loading title="Generating Morning Brief" />}

      {/* Active brief */}
      {!generating && active && (() => {
        const sections = parseContent(active.content);
        return (
          <motion.div key={active.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Sparkles size={13} style={{ color: '#00d4aa' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>AI Intelligence Brief</span>
              <span style={{ fontSize: 11, color: '#8899bb', marginLeft: 'auto' }}>
                <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                {new Date(active.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ ...T.card, padding: '16px 18px', borderLeft: `3px solid ${s.color}`, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={12} style={{ color: s.color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: 0.6 }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#d0d8ee', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{s.content}</p>
                </motion.div>
              );
            })}
          </motion.div>
        );
      })()}

      {/* No brief */}
      {!generating && !loading && !active && (
        <div style={{ ...T.card, padding: 48, textAlign: 'center' }}>
          <Zap size={36} style={{ color: '#8899bb', opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No briefs yet</div>
          <div style={{ fontSize: 13, color: '#8899bb', marginBottom: 18 }}>Your first brief is being generated automatically</div>
        </div>
      )}

      {loading && <Loading text="Loading intelligence brief..." />}

      {/* History */}
      {briefs.length > 1 && (
        <div style={{ ...T.card, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Previous Briefs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {briefs.slice(1, 7).map(b => (
              <button key={b.id} onClick={() => setActive(b)}
                style={{ ...T.ghost, justifyContent: 'flex-start', padding: '8px 12px', borderColor: active?.id === b.id ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.07)', background: active?.id === b.id ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.03)' }}>
                <Clock size={11} style={{ color: '#8899bb', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#d0d8ee', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title || new Date(b.created_at).toDateString()}</span>
                <span style={{ fontSize: 11, color: '#8899bb', flexShrink: 0 }}>{new Date(b.created_at).toLocaleDateString('en-IN')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
