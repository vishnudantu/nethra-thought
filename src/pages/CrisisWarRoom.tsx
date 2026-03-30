import { AlertTriangle, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';
import { api } from '../lib/api';

const incidentFields: CrudField[] = [
  { key: 'title', label: 'Incident Title', required: true },
  { key: 'crisis_type', label: 'Crisis Type' },
  { key: 'severity', label: 'Severity (1-10)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'contained', 'resolved'] },
  { key: 'location', label: 'Location' },
  { key: 'detected_at', label: 'Detected At', type: 'datetime' },
  { key: 'summary', label: 'Summary', type: 'textarea' },
  { key: 'impact_score', label: 'Impact Score', type: 'number' },
  { key: 'owner', label: 'Owner' },
  { key: 'response_plan', label: 'Response Plan', type: 'textarea' },
];

const actionFields: CrudField[] = [
  { key: 'incident_id', label: 'Incident ID', required: true },
  { key: 'action_type', label: 'Action Type', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed'] },
  { key: 'due_at', label: 'Due At', type: 'datetime' },
  { key: 'completed_at', label: 'Completed At', type: 'datetime' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function CrisisWarRoom() {
  const [metrics, setMetrics] = useState<{ open?: number; high?: number; actions?: number }>({});
  const [running, setRunning] = useState(false);

  async function fetchMetrics() {
    try {
      const data = await api.get('/api/crisis-war-room/overview') as { open?: number; high?: number; actions?: number };
      setMetrics(data || {});
    } catch {
      setMetrics({});
    }
  }

  async function runScan() {
    setRunning(true);
    try {
      await api.post('/api/crisis-war-room/scan', {});
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
          <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Crisis War Room</h2>
          <p style={{ fontSize: 12, color: '#8899bb' }}>Activate response playbooks and coordinate crisis actions.</p>
        </div>
        <button onClick={runScan} className="btn-primary flex items-center gap-2" disabled={running}>
          <Play size={14} /> {running ? 'Scanning...' : 'Scan Alerts'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Open Incidents', value: metrics.open ?? 0 },
          { label: 'High Severity', value: metrics.high ?? 0 },
          { label: 'Open Actions', value: metrics.actions ?? 0 },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs" style={{ color: '#8899bb' }}>{card.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#f0f4ff' }}>{card.value}</div>
          </div>
        ))}
      </div>

      <CrudPage
        table="crisis_incidents"
        title="Crisis Incidents"
        subtitle="Track incidents, severity, and response plans"
        icon={AlertTriangle}
        fields={incidentFields}
        searchFields={['title', 'crisis_type', 'status']}
        order="detected_at"
      />

      <CrudPage
        table="warroom_actions"
        title="War Room Actions"
        subtitle="Response tasks, ownership, and execution"
        icon={AlertTriangle}
        fields={actionFields}
        searchFields={['action_type', 'status', 'owner']}
        order="created_at"
        variant="section"
      />
    </div>
  );
}
