import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { api } from '../../lib/api';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'datetime' | 'json';

export interface CrudField {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface CrudPageProps {
  table: string;
  title: string;
  subtitle: string;
  icon: ElementType;
  fields: CrudField[];
  order?: string;
  dir?: 'ASC' | 'DESC';
  searchFields?: string[];
  variant?: 'page' | 'section';
}

type CrudValue = string | number | boolean | null | Record<string, unknown> | Array<unknown>;
type CrudItem = Record<string, CrudValue> & { id?: string | number; created_at?: string };

function formatForInput(value: CrudValue | undefined, type?: FieldType) {
  if (!value) return '';
  if (type === 'datetime') {
    const text = String(value).replace(' ', 'T');
    return text.length >= 16 ? text.slice(0, 16) : text;
  }
  if (type === 'date') {
    return String(value).slice(0, 10);
  }
  return String(value);
}

function parseValue(value: string, type?: FieldType): CrudValue {
  if (type === 'number') return value === '' ? null : Number(value);
  if (type === 'json') {
    if (!value) return null;
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

export default function CrudPage({
  table,
  title,
  subtitle,
  icon: Icon,
  fields,
  order = 'created_at',
  dir = 'DESC',
  searchFields,
  variant = 'page',
}: CrudPageProps) {
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CrudItem | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const data = await api.list(table, { order, dir, limit: '100' }) as CrudItem[];
    setItems(data || []);
    setLoading(false);
  }, [dir, order, table]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const keys = searchFields?.length ? searchFields : fields.map(f => f.key);
    return items.filter(item =>
      keys.some(k => String(item[k] ?? '').toLowerCase().includes(search.toLowerCase()))
    );
  }, [fields, items, search, searchFields]);

  function openModal(item: CrudItem | null) {
    setSelected(item);
    const nextForm: Record<string, string> = {};
    fields.forEach(field => {
      nextForm[field.key] = formatForInput(item?.[field.key], field.type);
    });
    setForm(nextForm);
    setModalOpen(true);
  }

  async function handleSave() {
    if (fields.some(f => f.required && !String(form[f.key] || '').trim())) return;
    setSaving(true);
    const payload: Record<string, CrudValue> = {};
    fields.forEach(field => {
      payload[field.key] = parseValue(form[field.key] ?? '', field.type);
    });
    if (selected?.id !== undefined) await api.update(table, String(selected.id), payload);
    else await api.create(table, payload);
    setSaving(false);
    setModalOpen(false);
    fetchItems();
  }

  const header = (
    <div className={variant === 'page' ? 'flex items-center justify-between flex-wrap gap-3' : 'flex items-center justify-between gap-3'}>
      <div className="flex items-center gap-3">
        {variant === 'page' && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}>
            <Icon size={18} style={{ color: '#060b18' }} />
          </div>
        )}
        <div>
          <h2 className={variant === 'page' ? 'font-bold text-xl' : 'font-semibold text-base'} style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{title}</h2>
          <p style={{ fontSize: 12, color: '#8899bb' }}>{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-primary flex items-center gap-2" onClick={() => openModal(null)}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {header}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 320 }}>
        <Search size={14} style={{ color: '#8899bb' }} />
        <input className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
          placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {loading ? Array(2).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-4 w-2/3 rounded mb-2" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        )) : filtered.map((item, i) => (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card-hover rounded-2xl p-5 cursor-pointer"
            onClick={() => openModal(item)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>
                  {String(item[fields[0].key] ?? 'Untitled')}
                </div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>
                  {fields.slice(1, 3).map(f => String(item[f.key] ?? '')).filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#6677aa' }}>
                {item.created_at ? new Date(String(item.created_at)).toLocaleDateString('en-IN') : ''}
              </span>
            </div>
          </motion.div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center" style={{ color: '#8899bb' }}>
            No entries yet. Click Add to create one.
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
                  {selected?.id ? 'Edit' : 'Add'} {title}
                </h2>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={16} style={{ color: '#8899bb' }} />
                </button>
              </div>
              <div className={fields.length > 6 ? 'p-5 grid grid-cols-1 md:grid-cols-2 gap-4' : 'p-5 space-y-4'}>
                {fields.map(field => (
                  <div key={field.key} className={fields.length > 6 && (field.type === 'textarea' || field.type === 'json') ? 'md:col-span-2' : ''}>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {field.type === 'textarea' || field.type === 'json' ? (
                      <textarea
                        className="input-field"
                        rows={3}
                        value={form[field.key] ?? ''}
                        placeholder={field.placeholder}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="input-field"
                        value={form[field.key] ?? ''}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      >
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'}
                        className="input-field"
                        value={form[field.key] ?? ''}
                        placeholder={field.placeholder}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 p-5 border-t border-white/10">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : selected?.id ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
