import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Send, Mail, Phone, X } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';
import { statusBadge } from '../components/ui/badgeUtils';
import type { Communication as CommType } from '../lib/types';

const recipientGroups = ['All Voters', 'Party Workers', 'Village Leaders', 'Mandal Heads', 'Seniors', 'Youth', 'Farmers', 'Women'];

function CommModal({ comm, onClose, onSave }: {
  comm: Partial<CommType> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    subject: comm?.subject || '',
    message: comm?.message || '',
    comm_type: comm?.comm_type || 'SMS',
    recipient_group: comm?.recipient_group || 'All Voters',
    recipient_count: comm?.recipient_count || 1000,
    status: comm?.status || 'Draft',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.subject || !form.message) return;
    setSaving(true);
    if (comm?.id) {
      await api.update('communications', comm.id, form);
    } else {
      await api.create('communications', form);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {comm?.id ? 'Edit Message' : 'New Communication'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Subject *</label>
            <input className="input-field" placeholder="Message subject"
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Channel</label>
              <select className="input-field" value={form.comm_type} onChange={e => setForm({ ...form, comm_type: e.target.value })}>
                {['SMS', 'Email', 'WhatsApp', 'Push Notification', 'Letter'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Recipient Group</label>
              <select className="input-field" value={form.recipient_group} onChange={e => setForm({ ...form, recipient_group: e.target.value })}>
                {recipientGroups.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Recipients Count</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.recipient_count} onChange={e => setForm({ ...form, recipient_count: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CommType['status'] })}>
                {['Draft', 'Scheduled', 'Sent', 'Failed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>
              Message *
              <span style={{ float: 'right', color: form.comm_type === 'SMS' && form.message.length > 160 ? '#ff5555' : '#8899bb' }}>
                {form.message.length}{form.comm_type === 'SMS' ? '/160' : ''} chars
              </span>
            </label>
            <textarea className="input-field" rows={5} placeholder="Your message..."
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : comm?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const typeIcons: Record<string, React.ElementType> = {
  SMS: Phone, Email: Mail, WhatsApp: MessageSquare,
  'Push Notification': MessageSquare, Letter: Mail,
};
const typeColors: Record<string, string> = {
  SMS: '#00d4aa', Email: '#42a5f5', WhatsApp: '#00c864',
  'Push Notification': '#ffa726', Letter: '#ab47bc',
};

export default function Communication() {
  const [comms, setComms] = useState<CommType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<CommType> | null>(null);

  async function fetchComms() {
    setLoading(true);
    const data = await api.list('communications');
    setComms(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchComms(); }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Messages', value: comms.length, color: '#42a5f5' },
          { label: 'Sent', value: comms.filter(c => c.status === 'Sent').length, color: '#00c864' },
          { label: 'Draft', value: comms.filter(c => c.status === 'Draft').length, color: '#8899bb' },
          { label: 'Total Reached', value: comms.reduce((s, c) => s + c.recipient_count, 0).toLocaleString(), color: '#00d4aa' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card rounded-2xl p-4"
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={16} /> New Message
        </button>
      </div>

      <div className="space-y-3">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-4 w-2/3 rounded mb-2" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        )) : comms.map((c, i) => {
          const Icon = typeIcons[c.comm_type] || MessageSquare;
          const color = typeColors[c.comm_type] || '#8899bb';
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-5 cursor-pointer"
              onClick={() => { setSelected(c); setModalOpen(true); }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '20', border: `1px solid ${color}30` }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff' }} className="truncate">{c.subject}</span>
                    <Badge variant={statusBadge(c.status)}>{c.status}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: '#8899bb' }} className="line-clamp-2 mb-2">{c.message}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: color + '15', color }}>
                      {c.comm_type}
                    </span>
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{c.recipient_group}</span>
                    <div className="flex items-center gap-1">
                      <Send size={11} style={{ color: '#8899bb' }} />
                      <span style={{ fontSize: 11, color: '#8899bb' }}>{c.recipient_count.toLocaleString()} recipients</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#8899bb' }}>
                      {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {!loading && comms.length === 0 && (
          <div className="glass-card rounded-2xl py-16 text-center">
            <MessageSquare size={48} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
            <p style={{ color: '#8899bb', fontSize: 14 }}>No communications yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <CommModal
            comm={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchComms}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
