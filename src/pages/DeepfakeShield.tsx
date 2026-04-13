import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, ScanLine, Loader2, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../../hooks/useResponsive';

export default function DeepfakeShield() {
  const w = useW();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await api.get('/api/deepfake-shield/metrics'); setMetrics(d); } catch (_) {}
    setLoading(false);
  }

  async function scan() {
    setScanning(true);
    try { await api.post('/api/deepfake-shield/scan', {}); await load(); } catch (_) {}
    setScanning(false);
  }

  async function getAdvice() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Based on this deepfake detection data, what counter-narrative strategy should I use and how should I respond publicly? Data: ${JSON.stringify(metrics)}` }] }),
      });
      setAiAdvice(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Deepfake Shield</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>AI-powered detection of manipulated media and misinformation</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={getAdvice} disabled={analyzing} style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Analysing...</> : <><Zap size={13} />AI Counter-Strategy</>}
          </button>
          <button onClick={scan} disabled={scanning} style={T.ghost}>
            {scanning ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Scanning...</> : <><ScanLine size={13} />Scan Now</>}
          </button>
        </div>
      </div>

      {(aiAdvice || analyzing) && <AIPanel title="Counter-Narrative Strategy" content={aiAdvice} loading={analyzing} onClose={() => setAiAdvice('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Incidents Detected" value={metrics?.total_incidents || 0} color="#ff5555" icon={AlertTriangle} />
        <Stat label="Active Threats" value={metrics?.active_threats || 0} color="#ffa726" icon={Eye} />
        <Stat label="Resolved" value={metrics?.resolved || 0} color="#00c864" icon={CheckCircle} />
      </div>

      {loading ? <Loading text="Loading threat data..." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics?.incidents?.length > 0 ? metrics.incidents.map((inc: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ ...T.card, padding: '14px 16px', borderLeft: inc.severity === 'high' ? '3px solid #ff5555' : undefined }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: 'rgba(255,85,85,0.12)', color: '#ff5555', fontWeight: 700, textTransform: 'uppercase' }}>{inc.type || 'DEEPFAKE'}</span>
                <span style={{ fontSize: 11, color: '#8899bb' }}>{inc.platform}</span>
              </div>
              <p style={{ fontSize: 13, color: '#f0f4ff', margin: '0 0 6px', lineHeight: 1.5 }}>{inc.description}</p>
              {inc.url && <a href={inc.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#42a5f5' }}>View original ↗</a>}
            </motion.div>
          )) : (
            <div style={{ ...T.card, padding: 40, textAlign: 'center' }}>
              <ShieldAlert size={36} style={{ color: '#00c864', opacity: 0.3, margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No incidents detected</div>
              <div style={{ fontSize: 13, color: '#8899bb' }}>Run a scan to check for manipulated media</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
