import { Cpu } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'scenario_name', label: 'Scenario Name', required: true },
  { key: 'input_summary', label: 'Input Summary', type: 'textarea' },
  { key: 'output_summary', label: 'Output Summary', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'running', 'completed', 'archived'] },
];

export default function DigitalTwin() {
  return (
    <CrudPage
      table="digital_twin_runs"
      title="Digital Twin"
      subtitle="Scenario simulations and AI persona outputs"
      icon={Cpu}
      fields={fields}
      searchFields={['scenario_name', 'status']}
    />
  );
}
