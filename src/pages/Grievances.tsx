import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, X, CheckCircle, Clock, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';
import { statusBadge, priorityBadge } from '../components/ui/badgeUtils';
import type { Grievance } from '../lib/types';

const categories = ['All', 'Infrastructure', 'Water Supply', 'Education', 'Healthcare', 'Agriculture', 'Electricity', 'Social Welfare', 'General'];
const statuses = ['All', 'Pending', 'In Progress', 'Resolved', 'Escalated', 'Closed'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];

function Modal({ grievance, onClose, onSave }: {
  grievance: Partial<Grievance> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    petitioner_name: grievance?.petitioner_name || '',
    contact: grievance?.contact || '',
    category: grievance?.category || 'General',
    subject: grievance?.subject || '',
    description: grievance?.description || '',
    location: grievance?.location || '',
    priority: grievance?.priority || 'Medium',
    status: grievance?.status || 'Pending',
    assigned_to: grievance?.assigned_to || '',
    resolution_notes: grievance?.resolution_notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.petitioner_name || !form.subject) return;
    setSaving(true);
    if (grievance?.id) {
      await api.update('grievances', grievance.id, { ...form, updated_at: new Date().toISOString() });
    } else {
      await api.create('grievances', form);
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
        transition={{ duration: 0.2 }}
        className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {grievance?.id ? 'Edit Grievance' : 'New Grievance'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Petitioner Name *</label>
              <input className="input-field" placeholder="Full name"
                value={form.petitioner_name} onChange={e => setForm({ ...form, petitioner_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Contact</label>
              <input className="input-field" placeholder="Phone number"
                value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Subject *</label>
            <input className="input-field" placeholder="Brief description of the issue"
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Grievance['priority'] })}>
                {priorities.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Grievance['status'] })}>
                {statuses.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Location</label>
            <input className="input-field" placeholder="Village/Ward/Area"
              value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea className="input-field" placeholder="Detailed description" rows={3}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Assigned To</label>
            <input className="input-field" placeholder="Department or officer name"
              value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
          </div>
          {grievance?.id && (
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Resolution Notes</label>
              <textarea className="input-field" placeholder="Resolution details" rows={2}
                value={form.resolution_notes} onChange={e => setForm({ ...form, resolution_notes: e.target.value })} />
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : grievance?.id ? 'Update' : 'Submit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Grievances() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<Grievance> | null>(null);

  async function fetchGrievances() {
    setLoading(true);
    const data = await api.list('grievances');
    setGrievances(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchGrievances(); }, []);

  const filtered = grievances.filter(g => {
    if (catFilter !== 'All' && g.category !== catFilter) return false;
    if (statusFilter !== 'All' && g.status !== statusFilter) return false;
    if (search && !g.petitioner_name.toLowerCase().includes(search.toLowerCase()) &&
        !g.subject.toLowerCase().includes(search.toLowerCase()) &&
        !g.ticket_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total: grievances.length,
    pending: grievances.filter(g => g.status === 'Pending').length,
    inProgress: grievances.filter(g => g.status === 'In Progress').length,
    resolved: grievances.filter(g => g.status === 'Resolved').length,
    escalated: grievances.filter(g => g.status === 'Escalated').length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: counts.total, color: '#42a5f5', icon: FileText },
          { label: 'Pending', value: counts.pending, color: '#ffa726', icon: Clock },
          { label: 'In Progress', value: counts.inProgress, color: '#00d4aa', icon: TrendingUp },
          { label: 'Resolved', value: counts.resolved, color: '#00c864', icon: CheckCircle },
          { label: 'Escalated', value: counts.escalated, color: '#ff5555', icon: AlertCircle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.color + '20' }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#8899bb' }}>{s.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 200 }}>
              <Search size={14} style={{ color: '#8899bb' }} />
              <input className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                placeholder="Search by name, subject, ticket..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: '#8899bb' }} />
              <select className="input-field" style={{ width: 'auto', padding: '8px 12px' }}
                value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <select className="input-field" style={{ width: 'auto', padding: '8px 12px' }}
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} /> New Grievance
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Ticket', 'Petitioner', 'Category', 'Subject', 'Priority', 'Status', 'Assigned To', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(9).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}>
                      <div className="shimmer h-4 rounded" style={{ width: j === 0 ? 80 : j === 3 ? 160 : 80 }} />
                    </td>
                  ))}
                </tr>
              )) : filtered.map((g, i) => (
                <motion.tr
                  key={g.id}
                  className="table-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#00d4aa', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {g.ticket_number?.substring(0, 12)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#f0f4ff' }}>{g.petitioner_name}</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>{g.contact}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{g.category}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#f0f4ff', maxWidth: 200 }}>
                    <div className="truncate">{g.subject}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge variant={priorityBadge(g.priority)}>{g.priority}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge variant={statusBadge(g.status)}>{g.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{g.assigned_to || '-'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: '#8899bb', whiteSpace: 'nowrap' }}>
                    {new Date(g.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.2)', cursor: 'pointer' }}
                      onClick={() => { setSelected(g); setModalOpen(true); }}
                    >
                      Edit
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
              <p style={{ color: '#8899bb', fontSize: 14 }}>No grievances found</p>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <Modal
            grievance={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchGrievances}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
