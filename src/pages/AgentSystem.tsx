import { Bot, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';
import { api } from '../lib/api';

const fields: CrudField[] = [
  { key: 'agent_type', label: 'Agent Type', required: true },
  { key: 'task_type', label: 'Task Type' },
  { key: 'description', label: 'Task Description', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed', 'failed'] },
  { key: 'result', label: 'Result Summary', type: 'textarea' },
  { key: 'assigned_to', label: 'Assigned To' },
];

export default function AgentSystem() {
  const [metrics, setMetrics] = useState<{ summary?: Record<string, number>; recent?: { agent_type: string; total: number }[] }>({});
  const [running, setRunning] = useState(false);

  async function fetchMetrics() {
    try {
      const data = await api.get('/api/agent-system/metrics') as { summary?: Record<string, number>; recent?: { agent_type: string; total: number }[] };
      setMetrics(data || {});
    } catch {
      setMetrics({});
    }
  }

  async function runAgents() {
    setRunning(true);
    try {
      await api.post('/api/agent-system/run', {});
      await fetchMetrics();
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => { fetchMetrics(); }, []);

  const summary = metrics.summary || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Autonomous Agent System</h2>
          <p style={{ fontSize: 12, color: '#8899bb' }}>24x7 agents triage sentiment, crisis, and misinformation signals.</p>
        </div>
        <button onClick={runAgents} className="btn-primary flex items-center gap-2" disabled={running}>
          <Play size={14} /> {running ? 'Running...' : 'Run Agents Now'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: summary.pending ?? 0, color: '#ffb74d' },
          { label: 'In Progress', value: summary.in_progress ?? 0, color: '#42a5f5' },
          { label: 'Completed', value: summary.completed ?? 0, color: '#00d4aa' },
          { label: 'Failed', value: summary.failed ?? 0, color: '#ff5555' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs" style={{ color: '#8899bb' }}>{card.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {metrics.recent?.length ? (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Recent Agent Runs (7 days)</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs" style={{ color: '#8899bb' }}>
            {metrics.recent.map(item => (
              <div key={item.agent_type} className="flex items-center justify-between">
                <span>{item.agent_type}</span>
                <span style={{ color: '#f0f4ff' }}>{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <CrudPage
        table="agent_tasks"
        title="Agent Tasks"
        subtitle="Monitor AI agent tasks and outcomes"
        icon={Bot}
        fields={fields}
        searchFields={['agent_type', 'task_type', 'status']}
      />
    </div>
  );
}
