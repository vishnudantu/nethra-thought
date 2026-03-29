import { Network } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'entity_name', label: 'Entity Name', required: true },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'relationship_type', label: 'Relationship Type' },
  { key: 'influence_score', label: 'Influence Score', type: 'number' },
  { key: 'alignment', label: 'Alignment', type: 'select', options: ['warm', 'neutral', 'cold'] },
  { key: 'last_contact_at', label: 'Last Contact Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function RelationshipGraph() {
  return (
    <CrudPage
      table="relationships"
      title="Political Relationship Graph"
      subtitle="Track key relationships and influence networks"
      icon={Network}
      fields={fields}
      searchFields={['entity_name', 'entity_type', 'relationship_type']}
    />
  );
}
