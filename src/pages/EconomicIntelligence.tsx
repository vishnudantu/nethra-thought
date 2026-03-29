import { LineChart } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'indicator_type', label: 'Indicator Type', required: true },
  { key: 'mandal', label: 'Mandal' },
  { key: 'value', label: 'Value', type: 'number' },
  { key: 'unit', label: 'Unit' },
  { key: 'recorded_date', label: 'Recorded Date', type: 'date' },
  { key: 'trend', label: 'Trend', type: 'select', options: ['improving', 'stable', 'declining'] },
  { key: 'source', label: 'Source' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function EconomicIntelligence() {
  return (
    <CrudPage
      table="economic_indicators"
      title="Economic Intelligence"
      subtitle="Track local economic indicators and stress signals"
      icon={LineChart}
      fields={fields}
      searchFields={['indicator_type', 'mandal', 'trend']}
      order="recorded_date"
      dir="DESC"
    />
  );
}
