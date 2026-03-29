import { Users2 } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'party_name', label: 'Party Name', required: true },
  { key: 'integration_type', label: 'Integration Type' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'active', 'paused', 'disabled'] },
  { key: 'last_sync_at', label: 'Last Sync', type: 'datetime' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function PartyIntegration() {
  return (
    <CrudPage
      table="party_integrations"
      title="Party Integration Layer"
      subtitle="Coordinate party-level intelligence sharing"
      icon={Users2}
      fields={fields}
      searchFields={['party_name', 'integration_type', 'status']}
    />
  );
}
