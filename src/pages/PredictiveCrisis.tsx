import { Radar } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'alert_type', label: 'Alert Type', required: true },
  { key: 'probability', label: 'Probability (%)', type: 'number' },
  { key: 'description', label: 'Scenario Summary', type: 'textarea' },
  { key: 'recommended_action', label: 'Recommended Action', type: 'textarea' },
  { key: 'timeframe_days', label: 'Timeframe (days)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'watch', 'resolved'] },
];

export default function PredictiveCrisis() {
  return (
    <CrudPage
      table="predictive_alerts"
      title="Predictive Crisis Intelligence"
      subtitle="Model-driven early warning alerts and recommendations"
      icon={Radar}
      fields={fields}
      searchFields={['alert_type', 'description', 'status']}
      order="created_at"
    />
  );
}
