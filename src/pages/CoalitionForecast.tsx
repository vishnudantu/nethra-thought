import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users2, Zap, TrendingUp, RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../hooks/useResponsive';

export default function CoalitionForecast() {
  const w = useW();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await api.get('/api/coalition-forecast/overview'); setData(d); } catch (_) {}
    setLoading(false);
  }

  async function run() {
    setRunning(true);
    try { await api.post('/api/coalition-forecast/run', {}); await load(); } catch (_) {}
    setRunning(false);
  }

  async function getInsight() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Based on this coalition data, what alliance strategy would maximise seat count in the next election? What are the risks of each option? Data: ${JSON.stringify(data)}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Coalition Forecast</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>AI-powered seat projection and alliance analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={getInsight} disabled={analyzing} style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Strategy</>}
          </button>
          <button onClick={run} disabled={running} style={T.ghost}>
            {running ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Running...</> : <><RefreshCw size={13} />Run Forecast</>}
          </button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Coalition Strategy" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      {loading ? <Loading text="Loading coalition data..." /> : !data ? (
        <div style={{ ...T.card, padding: 40, textAlign: 'center' }}>
          <Users2 size={36} style={{ color: '#8899bb', opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No forecast data yet</div>
          <div style={{ fontSize: 13, color: '#8899bb', marginBottom: 18 }}>Run the forecast engine to generate alliance projections</div>
          <button onClick={run} style={T.primary}><Zap size={13} />Run Forecast</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : '1fr 1fr', gap: 14 }}>
          {data.scenarios?.map((s: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ ...T.card, padding: 18, borderColor: i === 0 ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? '#00d4aa' : '#42a5f5', fontFamily: 'Space Grotesk', marginBottom: 4 }}>{s.projected_seats}</div>
              <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 8 }}>projected seats</div>
              <p style={{ fontSize: 12, color: '#d0d8ee', margin: 0, lineHeight: 1.6 }}>{s.analysis}</p>
            </motion.div>
          )) || (
            <div style={{ ...T.card, padding: 18, gridColumn: '1/-1' }}>
              <pre style={{ fontSize: 12, color: '#d0d8ee', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
