import { Target } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'booth_id', label: 'Booth ID' },
  { key: 'update_type', label: 'Update Type', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'reported_at', label: 'Reported At', type: 'datetime' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'resolved'] },
];

export default function ElectionCommandCenter() {
  return (
    <CrudPage
      table="election_updates"
      title="Election Command Center"
      subtitle="Track booth-level election day updates"
      icon={Target}
      fields={fields}
      searchFields={['update_type', 'status', 'description']}
      order="reported_at"
      dir="DESC"
    />
  );
}
