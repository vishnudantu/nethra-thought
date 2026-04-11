import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Activity, CheckCircle, Loader2, Zap, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, getToken, useW, isMob } from '../components/ui/ModuleLayout';

export default function AgentSystem() {
  const w = useW();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [reporting, setReporting] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await api.get('/api/agent-system/metrics'); setMetrics(d); } catch (_) {}
    setLoading(false);
  }

  async function run() {
    setRunning(true);
    try { await api.post('/api/agent-system/run', {}); await load(); } catch (_) {}
    setRunning(false);
  }

  async function getReport() {
    setReporting(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Summarise what the AI agents have done, what was most valuable, and what should run next. Metrics: ${JSON.stringify(metrics)}` }] }),
      });
      setAiReport(await r.text());
    } catch (_) {}
    setReporting(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Agent System</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Autonomous AI agents running constituency intelligence tasks</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={getReport} disabled={reporting} style={{ ...T.primary, opacity: reporting ? 0.65 : 1 }}>
            {reporting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Generating...</> : <><Zap size={13} />Agent Report</>}
          </button>
          <button onClick={run} disabled={running} style={T.ghost}>
            {running ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Running...</> : <><Play size={13} />Run Agents</>}
          </button>
        </div>
      </div>

      {(aiReport || reporting) && <AIPanel title="Agent Activity Report" content={aiReport} loading={reporting} onClose={() => setAiReport('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Tasks Completed" value={metrics?.completed || 0} color="#00c864" icon={CheckCircle} />
        <Stat label="Running Now" value={metrics?.running || 0} color="#42a5f5" icon={Activity} />
        <Stat label="Queued" value={metrics?.queued || 0} color="#ffa726" icon={Clock} />
      </div>

      {loading ? <Loading text="Loading agent data..." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics?.recent_tasks?.map((t: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              style={{ ...T.card, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: t.status === 'completed' ? 'rgba(0,200,100,0.1)' : 'rgba(66,165,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} style={{ color: t.status === 'completed' ? '#00c864' : '#42a5f5' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{t.task_name || t.name}</div>
                {t.result_summary && <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.result_summary}</div>}
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: t.status === 'completed' ? 'rgba(0,200,100,0.1)' : 'rgba(66,165,245,0.1)', color: t.status === 'completed' ? '#00c864' : '#42a5f5', fontWeight: 700 }}>{t.status}</span>
            </motion.div>
          )) || (
            <div style={{ ...T.card, padding: 40, textAlign: 'center' }}>
              <Bot size={36} style={{ color: '#8899bb', opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No agent activity yet</div>
              <div style={{ fontSize: 13, color: '#8899bb', marginBottom: 18 }}>Run the agents to start autonomous intelligence gathering</div>
              <button onClick={run} style={T.primary}><Play size={13} />Run Agents</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
