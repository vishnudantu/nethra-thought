import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Calendar, Clock, User, Phone, Star, CheckCircle, XCircle, UserCheck, AlertCircle, Filter, Download, Eye, CreditCard as Edit2, Trash2, QrCode, Bell, BarChart2, ChevronDown, MapPin } from 'lucide-react';
import { api } from '../lib/api';

interface Appointment {
  id: string;
  visitor_name: string;
  visitor_contact: string;
  visitor_email: string;
  purpose: string;
  category: string;
  priority: string;
  requested_date: string;
  requested_time: string;
  duration_minutes: number;
  status: string;
  staff_member_name: string;
  notes: string;
  is_vip: boolean;
  is_repeat_visitor: boolean;
  token_number: string;
  check_in_time: string | null;
  check_out_time: string | null;
  feedback: string;
  rating: number;
  visit_count: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': '#1e88e5',
  'Confirmed': '#00bcd4',
  'Checked In': '#ffa726',
  'In Progress': '#9c27b0',
  'Completed': '#00c864',
  'Cancelled': '#ff5555',
  'No Show': '#8899bb',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Low': '#8899bb',
  'Normal': '#1e88e5',
  'High': '#ffa726',
  'Urgent': '#ff5555',
  'VIP': '#e040fb',
};

const CATEGORIES = ['General', 'Grievance', 'Development Work', 'Employment', 'Education', 'Health', 'Agricultural', 'Legal', 'Financial Aid', 'VIP Meeting', 'Media', 'Party Worker'];

function AppointmentModal({ appt, onClose, onSave }: { appt: Partial<Appointment> | null; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({
    visitor_name: appt?.visitor_name || '',
    visitor_contact: appt?.visitor_contact || '',
    visitor_email: appt?.visitor_email || '',
    purpose: appt?.purpose || '',
    category: appt?.category || 'General',
    priority: appt?.priority || 'Normal',
    requested_date: appt?.requested_date || new Date().toISOString().split('T')[0],
    requested_time: appt?.requested_time || '10:00',
    duration_minutes: appt?.duration_minutes || 30,
    staff_member_name: appt?.staff_member_name || '',
    notes: appt?.notes || '',
    is_vip: appt?.is_vip || false,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.visitor_name || !form.visitor_contact) return;
    setSaving(true);
    const token = `TKN-${Date.now().toString().slice(-6)}`;
    if (appt?.id) {
      await api.update('appointments', appt.id, form);
    } else {
      await api.create('appointments', { ...form, token_number: token });
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
              {appt?.id ? 'Edit Appointment' : 'Schedule Appointment'}
            </h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Fill visitor details and scheduling info</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Visitor Name *</label>
              <input className="input-field" placeholder="Full name" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Contact Number *</label>
              <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.visitor_contact} onChange={e => setForm({ ...form, visitor_contact: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input className="input-field" placeholder="email@example.com" value={form.visitor_email} onChange={e => setForm({ ...form, visitor_email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Purpose of Visit *</label>
            <textarea className="input-field" rows={3} placeholder="Describe the purpose of this visit..." value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Date *</label>
              <input type="date" className="input-field" value={form.requested_date} onChange={e => setForm({ ...form, requested_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Time *</label>
              <input type="time" className="input-field" value={form.requested_time} onChange={e => setForm({ ...form, requested_time: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Duration (min)</label>
              <select className="input-field" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}>
                {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Normal', 'High', 'Urgent', 'VIP'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Assigned Staff</label>
              <input className="input-field" placeholder="Staff member name" value={form.staff_member_name} onChange={e => setForm({ ...form, staff_member_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Notes</label>
            <textarea className="input-field" rows={2} placeholder="Internal notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm({ ...form, is_vip: !form.is_vip })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: form.is_vip ? 'rgba(224,64,251,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${form.is_vip ? 'rgba(224,64,251,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: form.is_vip ? '#e040fb' : '#8899bb'
              }}
            >
              <Star size={14} fill={form.is_vip ? '#e040fb' : 'transparent'} />
              VIP Visitor
            </button>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : appt?.id ? 'Update' : 'Schedule Appointment'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
      style={{ border: `1px solid ${color}22` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<Appointment> | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'list' | 'queue'>('list');

  async function fetchAppointments() {
    setLoading(true);
    const data = await api.list('appointments', { order: 'requested_date', dir: 'DESC' });
    setAppointments(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const updateData: Record<string, unknown> = { status };
    if (status === 'Checked In') updateData.check_in_time = new Date().toISOString();
    if (status === 'Completed') updateData.check_out_time = new Date().toISOString();
    await api.update('appointments', id, updateData);
    fetchAppointments();
  }

  async function deleteAppt(id: string) {
    await api.remove('appointments', id);
    fetchAppointments();
  }

  useEffect(() => { fetchAppointments(); }, []);

  const filtered = appointments.filter(a => {
    const matchSearch = !search || a.visitor_name.toLowerCase().includes(search.toLowerCase()) || a.visitor_contact.includes(search) || a.purpose.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchDate = !dateFilter || a.requested_date === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  const todayAppts = appointments.filter(a => a.requested_date === new Date().toISOString().split('T')[0]);
  const checkedIn = appointments.filter(a => a.status === 'Checked In' || a.status === 'In Progress');
  const completed = appointments.filter(a => a.status === 'Completed');
  const scheduled = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Calendar} label="Today's Appointments" value={todayAppts.length} color="#1e88e5" sub="Scheduled for today" />
        <StatCard icon={UserCheck} label="Currently In Queue" value={checkedIn.length} color="#ffa726" sub="Checked in visitors" />
        <StatCard icon={CheckCircle} label="Completed Today" value={completed.filter(a => a.requested_date === new Date().toISOString().split('T')[0]).length} color="#00c864" sub="Meetings done" />
        <StatCard icon={Clock} label="Avg. Wait Time" value="22 min" color="#e040fb" sub="Based on today" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {['list', 'queue'].map(v => (
            <button key={v} onClick={() => setView(v as 'list' | 'queue')}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize"
              style={{
                background: view === v ? 'linear-gradient(135deg, #00d4aa, #00bcd4)' : 'rgba(255,255,255,0.06)',
                color: view === v ? '#060b18' : '#8899bb',
                border: '1px solid transparent'
              }}>
              {v} View
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="bg-transparent text-sm border-none outline-none text-white placeholder-gray-500 w-44"
              placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} /> Schedule
          </button>
        </div>
      </div>

      {view === 'queue' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Scheduled', 'Checked In', 'Completed'].map(status => (
            <div key={status} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                <h3 className="font-semibold text-sm" style={{ color: '#f0f4ff' }}>{status}</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[status]}22`, color: STATUS_COLORS[status] }}>
                  {filtered.filter(a => a.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {filtered.filter(a => a.status === status).map(appt => (
                  <motion.div key={appt.id} layout className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {appt.is_vip && <Star size={11} style={{ color: '#e040fb' }} fill="#e040fb" />}
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{appt.visitor_name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{appt.category}</div>
                        <div style={{ fontSize: 11, color: '#8899bb' }}>{appt.requested_time} · {appt.duration_minutes}min</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${PRIORITY_COLORS[appt.priority]}22`, color: PRIORITY_COLORS[appt.priority] }}>
                        {appt.priority}
                      </span>
                    </div>
                    {status === 'Scheduled' && (
                      <button onClick={() => updateStatus(appt.id, 'Checked In')} className="mt-2 w-full text-xs py-1.5 rounded-lg font-medium"
                        style={{ background: 'rgba(255,167,38,0.15)', color: '#ffa726', border: '1px solid rgba(255,167,38,0.3)' }}>
                        Check In
                      </button>
                    )}
                    {status === 'Checked In' && (
                      <button onClick={() => updateStatus(appt.id, 'Completed')} className="mt-2 w-full text-xs py-1.5 rounded-lg font-medium"
                        style={{ background: 'rgba(0,200,100,0.15)', color: '#00c864', border: '1px solid rgba(0,200,100,0.3)' }}>
                        Mark Complete
                      </button>
                    )}
                  </motion.div>
                ))}
                {filtered.filter(a => a.status === status).length === 0 && (
                  <p className="text-center text-xs py-4" style={{ color: '#8899bb' }}>No {status.toLowerCase()} appointments</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Token', 'Visitor', 'Category / Purpose', 'Date & Time', 'Priority', 'Status', 'Staff', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(6).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}><div className="shimmer h-4 rounded w-20" /></td>
                  ))}</tr>
                )) : filtered.map((a, i) => (
                  <motion.tr key={a.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-1.5">
                        {a.is_vip && <Star size={11} style={{ color: '#e040fb' }} fill="#e040fb" />}
                        <span style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600, fontFamily: 'monospace' }}>{a.token_number || '-'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{a.visitor_name}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{a.visitor_contact}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#f0f4ff' }}>{a.category}</div>
                      <div style={{ fontSize: 11, color: '#8899bb', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.purpose}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#f0f4ff' }}>{new Date(a.requested_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{a.requested_time} · {a.duration_minutes}min</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: `${PRIORITY_COLORS[a.priority] || '#8899bb'}22`, color: PRIORITY_COLORS[a.priority] || '#8899bb' }}>
                        {a.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: `${STATUS_COLORS[a.status] || '#8899bb'}22`, color: STATUS_COLORS[a.status] || '#8899bb' }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{a.staff_member_name || '-'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        {a.status === 'Scheduled' && (
                          <button onClick={() => updateStatus(a.id, 'Checked In')} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,167,38,0.15)', color: '#ffa726' }} title="Check In">
                            <UserCheck size={14} />
                          </button>
                        )}
                        {a.status === 'Checked In' && (
                          <button onClick={() => updateStatus(a.id, 'Completed')} className="p-1.5 rounded-lg" style={{ background: 'rgba(0,200,100,0.15)', color: '#00c864' }} title="Complete">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => { setSelected(a); setModalOpen(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteAppt(a.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-14">
                <Calendar size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                <p style={{ color: '#8899bb', fontSize: 14 }}>No appointments found</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <AppointmentModal appt={selected} onClose={() => { setModalOpen(false); setSelected(null); }} onSave={fetchAppointments} />
        )}
      </AnimatePresence>
    </div>
  );
}
