import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Sparkles, Play, Loader2, X, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { T, AIPanel, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../hooks/useResponsive';

const SCENARIOS = [
  { id: 'policy', label: 'Policy Announcement', placeholder: 'e.g. Free electricity up to 200 units for farmers' },
  { id: 'rally', label: 'Rally / Event', placeholder: 'e.g. Mega rally in Kuppam on Independence Day' },
  { id: 'alliance', label: 'Alliance Change', placeholder: 'e.g. Forming pre-poll alliance with YSRCP' },
  { id: 'controversy', label: 'Controversy Response', placeholder: 'e.g. Media report about road contract irregularities' },
];

interface SimResult { segment: string; reaction: string; impact: string; color: string; }

export default function DigitalTwin() {
  const w = useW();
  const [scenario, setScenario] = useState('policy');
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SimResult[]>([]);
  const [summary, setSummary] = useState('');

  async function simulate() {
    if (!input.trim()) return;
    setRunning(true); setResults([]); setSummary('');
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Simulate how different voter segments in an Andhra Pradesh constituency would react to this ${SCENARIOS.find(s => s.id === scenario)?.label}: "${input}"\n\nSimulate reactions from 5 segments: Farmers, Women Voters, Youth (18-30), Party Workers, General Public.\nFor each provide: REACTION (positive/mixed/negative), IMPACT on votes (+/-/neutral), KEY CONCERN.\nThen give an OVERALL VERDICT.\nBe realistic and specific to Andhra Pradesh politics.` }] }),
      });
      const text = await r.text();
      setSummary(text);
    } catch (_) {}
    setRunning(false);
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Digital Twin</h1>
        <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Simulate voter reactions before making public announcements</p>
      </div>

      <div style={{ ...T.card, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Scenario Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMob(w) ? 2 : 4}, 1fr)`, gap: 8, marginBottom: 16 }}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setScenario(s.id)}
              style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: scenario === s.id ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${scenario === s.id ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: scenario === s.id ? '#00d4aa' : '#d0d8ee' }}>{s.label}</div>
            </button>
          ))}
        </div>
        <label style={{ ...T.label }}>Describe the scenario</label>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder={SCENARIOS.find(s => s.id === scenario)?.placeholder}
          rows={3} style={{ ...T.input, resize: 'vertical', marginBottom: 12 }} />
        <button onClick={simulate} disabled={running || !input.trim()}
          style={{ ...T.primary, width: '100%', justifyContent: 'center', opacity: running || !input.trim() ? 0.5 : 1 }}>
          {running ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Simulating...</> : <><Cpu size={13} />Run Simulation</>}
        </button>
      </div>

      {running && <AIPanel loading title="Simulating voter reactions..." />}

      <AnimatePresence>
        {summary && !running && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={T.ai}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={13} style={{ color: '#00d4aa' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>Simulation Results</span>
              </div>
              <button onClick={() => setSummary('')} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer' }}><X size={13} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#d0d8ee', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
