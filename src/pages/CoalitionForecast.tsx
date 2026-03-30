import { Handshake, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';
import { api } from '../lib/api';

const fields: CrudField[] = [
  { key: 'scenario_name', label: 'Scenario Name', required: true },
  { key: 'total_seats', label: 'Total Seats', type: 'number' },
  { key: 'majority_mark', label: 'Majority Mark', type: 'number' },
  { key: 'seat_projections', label: 'Seat Projections (JSON)', type: 'json' },
  { key: 'alliances', label: 'Alliances (JSON)', type: 'json' },
  { key: 'probability', label: 'Win Probability (%)', type: 'number' },
  { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'moderate', 'high', 'critical'] },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'archived'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function CoalitionForecast() {
  const [overview, setOverview] = useState<{ total?: number; active?: number; top?: { scenario_name: string; probability: number; risk_level: string } | null }>({});
  const [running, setRunning] = useState(false);

  async function fetchOverview() {
    try {
      const data = await api.get('/api/coalition-forecast/overview') as { total?: number; active?: number; top?: { scenario_name: string; probability: number; risk_level: string } | null };
      setOverview(data || {});
    } catch {
      setOverview({});
    }
  }

  async function runForecast() {
    setRunning(true);
    try {
      await api.post('/api/coalition-forecast/run', {});
      await fetchOverview();
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => { fetchOverview(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Coalition Forecasting</h2>
          <p style={{ fontSize: 12, color: '#8899bb' }}>Model alliances, seat math, and coalition viability.</p>
        </div>
        <button onClick={runForecast} className="btn-primary flex items-center gap-2" disabled={running}>
          <Play size={14} /> {running ? 'Running...' : 'Run Forecast'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Scenarios', value: overview.total ?? 0 },
          { label: 'Active', value: overview.active ?? 0 },
          { label: 'Top Scenario', value: overview.top?.scenario_name || '—' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs" style={{ color: '#8899bb' }}>{card.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: '#f0f4ff' }}>{card.value}</div>
            {card.label === 'Top Scenario' && overview.top?.probability !== undefined && (
              <div style={{ fontSize: 11, color: '#8899bb' }}>{overview.top.probability}% · {overview.top.risk_level}</div>
            )}
          </div>
        ))}
      </div>

      <CrudPage
        table="coalition_scenarios"
        title="Coalition Scenarios"
        subtitle="Manage scenarios, alliances, and seat projections"
        icon={Handshake}
        fields={fields}
        searchFields={['scenario_name', 'status', 'risk_level']}
      />
    </div>
  );
}
