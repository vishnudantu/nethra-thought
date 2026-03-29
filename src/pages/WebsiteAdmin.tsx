import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe } from 'lucide-react';
import { api } from '../lib/api';

interface WebsiteContentItem {
  id?: string;
  page: string;
  section: string;
  content: Record<string, unknown>;
}

export default function WebsiteAdmin() {
  const [items, setItems] = useState<WebsiteContentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/api/admin/website-content').then(data => {
      setItems(data as WebsiteContentItem[]);
    });
  }, []);

  function updateItem(index: number, value: string) {
    try {
      const parsed = JSON.parse(value);
      setItems(prev => prev.map((item, i) => i === index ? { ...item, content: parsed } : item));
    } catch {
      // ignore invalid JSON until save
    }
  }

  async function saveAll() {
    setSaving(true);
    setStatus('');
    try {
      for (const item of items) {
        await api.put('/api/admin/website-content', item);
      }
      setStatus('Website content saved.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setStatus(message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Globe size={18} style={{ color: '#060b18' }} />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Website CMS</h2>
            <p style={{ fontSize: 12, color: '#8899bb' }}>Edit website content blocks (JSON)</p>
          </div>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {status && (
        <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 12 }}>
          {status}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div key={`${item.page}-${item.section}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 space-y-2">
            <div className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>
              {item.page} / {item.section}
            </div>
            <textarea
              className="input-field"
              rows={6}
              defaultValue={JSON.stringify(item.content, null, 2)}
              onChange={e => updateItem(index, e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
