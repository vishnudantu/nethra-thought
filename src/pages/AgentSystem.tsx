import { Bot } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'agent_type', label: 'Agent Type', required: true },
  { key: 'task_type', label: 'Task Type' },
  { key: 'description', label: 'Task Description', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed', 'failed'] },
  { key: 'result', label: 'Result Summary', type: 'textarea' },
  { key: 'assigned_to', label: 'Assigned To' },
];

export default function AgentSystem() {
  return (
    <CrudPage
      table="agent_tasks"
      title="Autonomous Agent System"
      subtitle="Monitor AI agent tasks and outcomes"
      icon={Bot}
      fields={fields}
      searchFields={['agent_type', 'task_type', 'status']}
    />
  );
}
