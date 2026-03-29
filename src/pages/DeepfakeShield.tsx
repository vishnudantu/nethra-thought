import { ShieldAlert } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'platform', label: 'Platform', required: true },
  { key: 'content_url', label: 'Content URL', type: 'textarea' },
  { key: 'detected_at', label: 'Detected At', type: 'datetime' },
  { key: 'confidence', label: 'Confidence (%)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'takedown', 'resolved'] },
  { key: 'response_plan', label: 'Response Plan', type: 'textarea' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function DeepfakeShield() {
  return (
    <CrudPage
      table="deepfake_incidents"
      title="Deepfake & Disinformation Shield"
      subtitle="Track suspected deepfakes and response workflows"
      icon={ShieldAlert}
      fields={fields}
      searchFields={['platform', 'status', 'content_url']}
      order="detected_at"
    />
  );
}
