import { Handshake } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'requester_name', label: 'Requester Name' },
  { key: 'request_type', label: 'Request Type', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'resolved', 'closed'] },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'source', label: 'Source', type: 'select', options: ['app', 'whatsapp', 'web', 'walk_in'] },
];

export default function CitizenServices() {
  return (
    <CrudPage
      table="citizen_service_requests"
      title="Citizen Services Super App"
      subtitle="Track requests coming from the citizen-facing app"
      icon={Handshake}
      fields={fields}
      searchFields={['requester_name', 'request_type', 'status']}
    />
  );
}
