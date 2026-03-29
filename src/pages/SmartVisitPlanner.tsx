import { MapPin } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'mandal', label: 'Mandal', required: true },
  { key: 'village', label: 'Village' },
  { key: 'priority', label: 'Priority (1-10)', type: 'number' },
  { key: 'reasoning', label: 'Reasoning', type: 'textarea' },
  { key: 'recommended_date', label: 'Recommended Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['planned', 'completed', 'skipped'] },
  { key: 'last_visit_date', label: 'Last Visit Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function SmartVisitPlanner() {
  return (
    <CrudPage
      table="visit_plans"
      title="Smart Visit Planner"
      subtitle="AI-curated constituency visit priorities"
      icon={MapPin}
      fields={fields}
      searchFields={['mandal', 'village', 'status']}
      order="recommended_date"
      dir="ASC"
    />
  );
}
