import { Flag } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'promise_text', label: 'Promise Text', type: 'textarea', required: true },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status', type: 'select', options: ['not_started', 'in_progress', 'completed', 'cancelled'] },
  { key: 'made_at', label: 'Made At', type: 'datetime' },
  { key: 'location', label: 'Location' },
  { key: 'deadline', label: 'Deadline', type: 'date' },
  { key: 'completion_date', label: 'Completion Date', type: 'date' },
  { key: 'source', label: 'Source' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function PromisesTracker() {
  return (
    <CrudPage
      table="promises"
      title="Promises Tracker"
      subtitle="Track public commitments and their completion status"
      icon={Flag}
      fields={fields}
      searchFields={['promise_text', 'category', 'location', 'status']}
      order="created_at"
    />
  );
}
