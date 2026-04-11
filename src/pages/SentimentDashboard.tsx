import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, RefreshCw, Loader2, Activity, Newspaper, AlertTriangle, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, getToken, useW, isMob, isTab } from '../components/ui/ModuleLayout';

export default function SentimentDashboard() {
  const w = useW();
  const [scores, setScores] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [mentions, setMentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [hist, cur, med] = await Promise.all([
        api.get('/api/sentiment/history'),
        api.get('/api/sentiment/current'),
        api.list('media_mentions', { order: 'published_at', dir: 'DESC', limit: '15' }),
      ]);
      setScores((hist as any[]) || []);
      setCurrent(cur);
      setMentions((med as any[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/sentiment/ai-summary', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      setAiSummary(d.summary || '');
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const score = current?.overall_score || 0;
  const scoreColor = score >= 70 ? '#00c864' : score >= 45 ? '#ffa726' : '#ff5555';
  const trend = scores.length >= 2 ? scores[0]?.overall_score - scores[1]?.overall_score : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? '#00c864' : trend < 0 ? '#ff5555' : '#8899bb';

  const chartData = [...scores].reverse().map(s => ({
    date: new Date(s.score_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    score: s.overall_score,
  }));

  const sentCounts = { Positive: mentions.filter(m => m.sentiment === 'Positive').length, Negative: mentions.filter(m => m.sentiment === 'Negative').length, Neutral: mentions.filter(m => m.sentiment === 'Neutral').length };

  if (loading) return <Loading text="Loading sentiment data..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <Stat label="Sentiment Score" value={`${score}/100`} color={scoreColor} icon={Activity} />
        <Stat label="Trend (vs yesterday)" value={`${trend >= 0 ? '+' : ''}${trend}`} color={trendColor} icon={TrendIcon} />
        <Stat label="Media Mentions" value={mentions.length} color="#42a5f5" icon={Newspaper} />
        <Stat label="Negative Coverage" value={sentCounts.Negative} color="#ff5555" icon={AlertTriangle} />
      </div>

      {/* AI Analysis */}
      {(aiSummary || analyzing) && (
        <AIPanel title="Sentiment Analysis" content={aiSummary} loading={analyzing} onClose={() => setAiSummary('')} />
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={analyse} disabled={analyzing}
          style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
          {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Analysis</>}
        </button>
        <button onClick={load} style={T.ghost}><RefreshCw size={13} />Refresh</button>
      </div>

      {/* Chart + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : '1fr 300px', gap: 14 }}>
        <div style={{ ...T.card, padding: '18px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 14 }}>7-Day Sentiment Trend</div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#8899bb', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#8899bb', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f0f4ff', fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#00d4aa" strokeWidth={2.5} dot={{ fill: '#00d4aa', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8899bb', fontSize: 13 }}>Not enough data yet — check back tomorrow</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Score ring */}
          <div style={{ ...T.card, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Today</div>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)', display: 'block', margin: '0 auto' }}>
              <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <circle cx="55" cy="55" r="46" fill="none" stroke={scoreColor} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 46}`} strokeDashoffset={`${2 * Math.PI * 46 * (1 - score / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div style={{ fontSize: 30, fontWeight: 900, color: scoreColor, fontFamily: 'Space Grotesk', marginTop: 8 }}>{score}</div>
            <div style={{ fontSize: 11, color: '#8899bb' }}>/ 100</div>
          </div>
          {/* Sentiment breakdown */}
          <div style={{ ...T.card, padding: 16 }}>
            {[['Positive', '#00c864', sentCounts.Positive], ['Neutral', '#8899bb', sentCounts.Neutral], ['Negative', '#ff5555', sentCounts.Negative]].map(([l, c, v]) => (
              <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, width: 55, color: '#8899bb' }}>{l}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: mentions.length ? `${(v as number) / mentions.length * 100}%` : '0%', background: c as string, transition: 'width 0.6s', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: c as string, width: 20, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Media feed */}
      <div style={{ ...T.card, padding: '14px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', padding: '0 16px', marginBottom: 10 }}>Media Feed</div>
        {mentions.length === 0
          ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#8899bb' }}>No media mentions yet. Run OmniScan to pull coverage.</div>
          : mentions.map((m, i) => {
            const sc = m.sentiment === 'Positive' ? '#00c864' : m.sentiment === 'Negative' ? '#ff5555' : '#8899bb';
            return (
              <div key={m.id || i} style={{ padding: '11px 16px', borderBottom: i < mentions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 9, padding: '3px 7px', borderRadius: 5, background: `${sc}18`, color: sc, fontWeight: 700, flexShrink: 0, marginTop: 2, textTransform: 'uppercase' }}>{m.sentiment}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.headline}</div>
                  <div style={{ fontSize: 11, color: '#8899bb', marginTop: 3 }}>{m.source} · {m.published_at ? new Date(m.published_at).toLocaleDateString('en-IN') : ''}</div>
                </div>
                {m.url && <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#42a5f5', flexShrink: 0, marginTop: 2 }}>↗</a>}
              </div>
            );
          })}
      </div>
    </div>
  );
}
