import { FileCheck2 } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'report_type', label: 'Report Type', required: true },
  { key: 'summary', label: 'Summary', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'review', 'submitted', 'closed'] },
  { key: 'alerts', label: 'Alerts (JSON)', type: 'json' },
];

export default function FinancialCompliance() {
  return (
    <CrudPage
      table="finance_compliance_reports"
      title="Financial Intelligence & Compliance"
      subtitle="Election expense compliance and audit readiness"
      icon={FileCheck2}
      fields={fields}
      searchFields={['report_type', 'status']}
    />
  );
}
