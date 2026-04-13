import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, Zap, AlertTriangle, Eye, RefreshCw, Loader2, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../hooks/useResponsive';

interface Alert { id: string; alert_type: string; probability: number; description: string; recommended_action: string; timeframe_days: number; status: string; created_at: string; }

export default function PredictiveCrisis() {
  const w = useW();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('predictive_alerts', { order: 'created_at', dir: 'DESC', limit: '30' });
      setAlerts((data as Alert[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function runScan() {
    setScanning(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Scan my constituency data for emerging political crises in the next 7–14 days. Identify threats with probability scores and specific recommended actions. Format as numbered list with THREAT, PROBABILITY, TIMEFRAME, ACTION for each.' }] }),
      });
      const text = await r.text();
      setAiReport(text);
    } catch (_) {}
    setScanning(false);
  }

  useEffect(() => { load(); }, []);

  const active = alerts.filter(a => a.status === 'active').length;
  const highProb = alerts.filter(a => a.probability >= 70).length;

  const probColor = (p: number) => p >= 70 ? '#ff5555' : p >= 40 ? '#ffa726' : '#00c864';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Predictive Crisis Intelligence</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>AI-powered early warning for political threats</p>
        </div>
        <button onClick={runScan} disabled={scanning} style={{ ...T.primary, opacity: scanning ? 0.65 : 1 }}>
          {scanning ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Scanning...</> : <><Radar size={13} />Run AI Scan</>}
        </button>
      </div>

      {(aiReport || scanning) && <AIPanel title="Predictive Threat Scan" content={aiReport} loading={scanning} onClose={() => setAiReport('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Active Alerts" value={active} color="#ff5555" icon={AlertTriangle} />
        <Stat label="High Probability" value={highProb} color="#ffa726" icon={Eye} />
        <Stat label="Monitoring" value={alerts.filter(a => a.status === 'watch').length} color="#42a5f5" icon={Radar} />
      </div>

      {loading ? <Loading text="Loading alerts..." />
        : alerts.length === 0 ? (
          <Empty icon={Radar} title="No alerts yet" sub="Run an AI scan to detect emerging threats in your constituency." action="Run AI Scan" onAction={runScan} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(a => {
              const pc = probColor(a.probability);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...T.card, padding: '15px 16px', borderLeft: a.probability >= 70 ? `3px solid ${pc}` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: pc, fontFamily: 'Space Grotesk' }}>{a.probability}%</div>
                      <div style={{ fontSize: 9, color: '#8899bb' }}>probability</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f0f4ff' }}>{a.alert_type}</span>
                        {a.timeframe_days && <span style={{ fontSize: 11, color: '#8899bb' }}><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{a.timeframe_days} days</span>}
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${pc}15`, color: pc, fontWeight: 700, textTransform: 'uppercase', marginLeft: 'auto' }}>{a.status}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#d0d8ee', margin: '0 0 6px', lineHeight: 1.5 }}>{a.description}</p>
                      {a.recommended_action && <div style={{ fontSize: 12, color: '#00d4aa' }}>→ {a.recommended_action}</div>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}
