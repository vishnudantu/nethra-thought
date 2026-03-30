import { Box } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'booth_number', label: 'Booth Number', required: true, placeholder: 'e.g., 42' },
  { key: 'booth_name', label: 'Booth Name', placeholder: 'Kakinada Urban Booth' },
  { key: 'location', label: 'Location', placeholder: 'Town Hall, Ward 12' },
  { key: 'mandal', label: 'Mandal', placeholder: 'Kakinada' },
  { key: 'total_voters', label: 'Total Voters', type: 'number', placeholder: '3200' },
  { key: 'expected_turnout', label: 'Expected Turnout', type: 'number', placeholder: '2400' },
  { key: 'agent_name', label: 'Booth Agent', placeholder: 'Agent name' },
  { key: 'historical_vote_percentage', label: 'Historical Vote % (JSON)', type: 'json', placeholder: '{"2019":48,"2024":52}' },
  { key: 'coordinates', label: 'Coordinates (JSON)', type: 'json', placeholder: '{"lat":16.989,"lng":82.247}' },
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
