import { Box } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'booth_number', label: 'Booth Number', required: true },
  { key: 'booth_name', label: 'Booth Name' },
  { key: 'location', label: 'Location' },
  { key: 'mandal', label: 'Mandal' },
  { key: 'total_voters', label: 'Total Voters', type: 'number' },
  { key: 'expected_turnout', label: 'Expected Turnout', type: 'number' },
  { key: 'agent_name', label: 'Booth Agent' },
  { key: 'historical_vote_percentage', label: 'Historical Vote % (JSON)', type: 'json' },
  { key: 'coordinates', label: 'Coordinates (JSON)', type: 'json' },
];

export default function BoothManagement() {
  return (
    <CrudPage
      table="booths"
      title="Booth Management"
      subtitle="Manage booth-level intelligence and assignments"
      icon={Box}
      fields={fields}
      searchFields={['booth_number', 'booth_name', 'mandal']}
    />
  );
}
