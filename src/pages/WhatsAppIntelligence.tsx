import { MessageCircleWarning } from 'lucide-react';
import CrudPage, { type CrudField } from '../components/ui/CrudPage';

const fields: CrudField[] = [
  { key: 'sender_phone', label: 'Sender Phone' },
  { key: 'message_type', label: 'Message Type', type: 'select', options: ['text', 'image', 'video', 'audio', 'document'] },
  { key: 'content', label: 'Content', type: 'textarea' },
  { key: 'classification', label: 'Classification' },
  { key: 'sentiment', label: 'Sentiment', type: 'select', options: ['positive', 'neutral', 'negative'] },
  { key: 'urgency_score', label: 'Urgency Score', type: 'number' },
  { key: 'is_viral', label: 'Viral', type: 'select', options: ['0', '1'] },
  { key: 'viral_count', label: 'Viral Count', type: 'number' },
  { key: 'is_misinformation', label: 'Misinformation', type: 'select', options: ['0', '1'] },
  { key: 'routed_to', label: 'Routed To' },
  { key: 'action_taken', label: 'Action Taken' },
  { key: 'processed_at', label: 'Processed At', type: 'datetime' },
];

export default function WhatsAppIntelligence() {
  return (
    <CrudPage
      table="whatsapp_intelligence"
      title="WhatsApp Intelligence"
      subtitle="Monitor WhatsApp forwards, alerts, and misinfo signals"
      icon={MessageCircleWarning}
      fields={fields}
      searchFields={['sender_phone', 'classification', 'content']}
      order="received_at"
    />
  );
}
