import { ShieldAlert, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';
import { api } from '../lib/api';

const fields: CrudField[] = [
  { key: 'platform', label: 'Platform', required: true },
  { key: 'content_url', label: 'Content URL', type: 'textarea' },
  { key: 'detected_at', label: 'Detected At', type: 'datetime' },
  { key: 'confidence', label: 'Confidence (%)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'takedown', 'resolved'] },
  { key: 'response_plan', label: 'Response Plan', type: 'textarea' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function DeepfakeShield() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [running, setRunning] = useState(false);

  async function fetchMetrics() {
    try {
      const data = await api.get('/api/deepfake-shield/metrics') as { summary?: Record<string, number> };
      setMetrics(data?.summary || {});
    } catch {
      setMetrics({});
    }
  }

  async function runScan() {
    setRunning(true);
    try {
      await api.post('/api/deepfake-shield/scan', {});
      await fetchMetrics();
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => { fetchMetrics(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Deepfake & Disinformation Shield</h2>
          <p style={{ fontSize: 12, color: '#8899bb' }}>Scan for synthetic media and misinformation signals.</p>
        </div>
        <button onClick={runScan} className="btn-primary flex items-center gap-2" disabled={running}>
          <Play size={14} /> {running ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['open', 'investigating', 'takedown', 'resolved'].map(status => (
          <div key={status} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs uppercase" style={{ color: '#8899bb' }}>{status}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#f0f4ff' }}>{metrics[status] || 0}</div>
          </div>
        ))}
      </div>

      <CrudPage
        table="deepfake_incidents"
        title="Deepfake Incidents"
        subtitle="Track suspected deepfakes and response workflows"
        icon={ShieldAlert}
        fields={fields}
        searchFields={['platform', 'status', 'content_url']}
        order="detected_at"
      />
    </div>
  );
}
