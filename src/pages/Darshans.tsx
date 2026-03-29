import { MapPin } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'temple_name', label: 'Temple Name', required: true },
  { key: 'darshan_date', label: 'Darshan Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['Requested', 'Confirmed', 'Completed', 'Cancelled'] },
  { key: 'pilgrim_name', label: 'Pilgrim Name' },
  { key: 'pilgrim_contact', label: 'Pilgrim Contact' },
  { key: 'location', label: 'Location' },
  { key: 'group_size', label: 'Group Size', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function Darshans() {
  return (
    <CrudPage
      table="darshans"
      title="Darshans"
      subtitle="Multi-temple darshan requests across India"
      icon={MapPin}
      fields={fields}
      searchFields={['temple_name', 'pilgrim_name', 'location', 'status']}
      order="darshan_date"
      dir="DESC"
    />
  );
}
