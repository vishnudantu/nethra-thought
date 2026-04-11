import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, RefreshCw, Loader2, Shield, Radio } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, getToken, useW, isMob } from '../components/ui/ModuleLayout';

export default function CrisisWarRoom() {
  const w = useW();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await api.get('/api/crisis-war-room/overview'); setData(d); } catch (_) {}
    setLoading(false);
  }

  async function scan() {
    setScanning(true);
    try { await api.post('/api/crisis-war-room/scan', {}); await load(); } catch (_) {}
    setScanning(false);
  }

  async function getInsight() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Based on this crisis data, what is the most serious threat right now and what are the top 3 immediate actions I should take? Data: ${JSON.stringify(data)}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const critical = data?.alerts?.filter((a: any) => a.severity === 'critical')?.length || 0;
  const active = data?.alerts?.filter((a: any) => a.status === 'active')?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Crisis War Room</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Real-time threat monitoring and crisis response</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={getInsight} disabled={analyzing} style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Assessment</>}
          </button>
          <button onClick={scan} disabled={scanning} style={T.ghost}>
            {scanning ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Scanning...</> : <><Radio size={13} />Scan Now</>}
          </button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Crisis Assessment" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Critical Alerts" value={critical} color="#ff5555" icon={AlertTriangle} />
        <Stat label="Active Issues" value={active} color="#ffa726" icon={Radio} />
        <Stat label="Threats Resolved" value={(data?.resolved || 0)} color="#00c864" icon={Shield} />
      </div>

      {loading ? <Loading text="Loading crisis data..." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data?.alerts?.length > 0 ? data.alerts.map((a: any, i: number) => {
            const sc = a.severity === 'critical' ? '#ff5555' : a.severity === 'high' ? '#ffa726' : '#42a5f5';
            return (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                style={{ ...T.card, padding: '14px 16px', borderLeft: `3px solid ${sc}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700, textTransform: 'uppercase' }}>{a.severity}</span>
                  <span style={{ fontSize: 12, color: '#8899bb' }}>{a.type}</span>
                </div>
                <p style={{ fontSize: 13, color: '#f0f4ff', margin: 0, lineHeight: 1.5 }}>{a.description}</p>
                {a.recommended_action && <div style={{ fontSize: 12, color: '#00d4aa', marginTop: 6 }}>→ {a.recommended_action}</div>}
              </motion.div>
            );
          }) : (
            <div style={{ ...T.card, padding: 40, textAlign: 'center' }}>
              <Shield size={36} style={{ color: '#00c864', opacity: 0.3, margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No active crises</div>
              <div style={{ fontSize: 13, color: '#8899bb' }}>Run a scan to detect emerging threats</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
