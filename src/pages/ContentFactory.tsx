import { Sparkles, CalendarClock, Zap } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';
import { api } from '../lib/api';

const contentFields: CrudField[] = [
  { key: 'content_type', label: 'Content Type', type: 'select', options: ['social_post', 'press_statement', 'speech', 'letter', 'whatsapp'] },
  { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
  { key: 'content', label: 'Generated Content', type: 'textarea', required: true },
  { key: 'is_saved', label: 'Saved', type: 'select', options: ['0', '1'] },
  { key: 'tags', label: 'Tags (JSON)', type: 'json' },
];

const calendarFields: CrudField[] = [
  { key: 'content_id', label: 'Content ID' },
  { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
  { key: 'platform', label: 'Platform', type: 'select', options: ['twitter', 'facebook', 'instagram', 'youtube', 'whatsapp', 'print'] },
  { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'draft', 'sent', 'cancelled'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function ContentFactory() {
  async function generatePack() {
    await api.post('/api/content-factory/generate', {});
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <button onClick={generatePack} className="btn-primary flex items-center gap-2 text-xs">
          <Zap size={12} /> Generate Daily Pack
        </button>
      </div>
      <CrudPage
        table="ai_generated_content"
        title="Content Factory"
        subtitle="Generate and manage political content packs"
        icon={Sparkles}
        fields={contentFields}
        searchFields={['content_type', 'prompt', 'content']}
        order="created_at"
      />

      <CrudPage
        table="content_calendar"
        title="Content Calendar"
        subtitle="Schedule auto-generated content across platforms"
        icon={CalendarClock}
        fields={calendarFields}
        searchFields={['platform', 'status']}
        order="scheduled_date"
        dir="ASC"
        variant="section"
      />
    </div>
  );
}
