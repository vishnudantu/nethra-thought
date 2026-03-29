import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Mail, Phone, X, Search } from 'lucide-react';
import { api } from '../lib/api';
import Badge, { statusBadge } from '../components/ui/Badge';
import type { TeamMember } from '../lib/types';

const departments = ['Administration', 'Communications', 'Public Relations', 'Policy', 'Outreach', 'Finance', 'Technology', 'Welfare', 'Legal'];
const roles = ['Personal Secretary', 'Media Coordinator', 'Grievance Officer', 'Research Analyst', 'Field Coordinator', 'Finance Manager', 'IT Manager', 'Social Welfare Officer', 'Legal Advisor', 'Driver'];

function TeamModal({ member, onClose, onSave }: {
  member: Partial<TeamMember> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: member?.name || '',
    role: member?.role || 'Grievance Officer',
    department: member?.department || 'Administration',
    email: member?.email || '',
    phone: member?.phone || '',
    status: member?.status || 'Active',
    joining_date: member?.joining_date || new Date().toISOString().substring(0, 10),
    notes: member?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    if (member?.id) {
      await api.update('team_members', member.id, form);
    } else {
      await api.create('team_members', form);
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
        className="glass-card rounded-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {member?.id ? 'Edit Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Full Name *</label>
            <input className="input-field" placeholder="Member name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {roles.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Department</label>
              <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" className="input-field" placeholder="Email address"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Phone</label>
              <input className="input-field" placeholder="Mobile number"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                {['Active', 'Inactive', 'On Leave'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Joining Date</label>
              <input type="date" className="input-field" value={form.joining_date}
                onChange={e => setForm({ ...form, joining_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea className="input-field" rows={2} placeholder="Additional info"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : member?.id ? 'Update' : 'Add Member'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const avatarColors = ['#00d4aa', '#42a5f5', '#ffa726', '#ef5350', '#ab47bc', '#26c6da', '#ff7043', '#8d6e63'];

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<TeamMember> | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  async function fetchTeam() {
    setLoading(true);
    const data = await api.list('team_members');
    setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchTeam(); }, []);

  const filtered = members.filter(m => {
    if (filter !== 'All' && m.status !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Members', value: members.filter(m => m.status === 'Active').length, color: '#00c864' },
          { label: 'On Leave', value: members.filter(m => m.status === 'On Leave').length, color: '#ffa726' },
          { label: 'Departments', value: new Set(members.map(m => m.department)).size, color: '#42a5f5' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card rounded-2xl p-4 text-center"
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8899bb' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 200 }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
              placeholder="Search members..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'On Leave', 'Inactive'].map(f => (
              <button key={f}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: filter === f ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#00d4aa' : '#8899bb',
                  border: `1px solid ${filter === f ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
                onClick={() => setFilter(f)}
              >{f}</button>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="shimmer w-12 h-12 rounded-xl" />
              <div className="flex-1">
                <div className="shimmer h-4 w-2/3 rounded mb-2" />
                <div className="shimmer h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        )) : filtered.map((m, i) => {
          const color = avatarColors[i % avatarColors.length];
          const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-5 cursor-pointer"
              onClick={() => { setSelected(m); setModalOpen(true); }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                  style={{ background: color + '25', color, border: `1px solid ${color}30` }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff' }} className="truncate">{m.name}</div>
                  <div style={{ fontSize: 12, color: '#8899bb' }} className="truncate">{m.role}</div>
                </div>
                <Badge variant={statusBadge(m.status)}>{m.status}</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="px-2 py-1 rounded-lg inline-block" style={{ background: 'rgba(255,255,255,0.05)', fontSize: 11, color: '#8899bb' }}>
                  {m.department}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                {m.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={11} style={{ color: '#8899bb' }} />
                    <span style={{ fontSize: 11, color: '#8899bb' }} className="truncate">{m.email}</span>
                  </div>
                )}
                {m.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={11} style={{ color: '#8899bb' }} />
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{m.phone}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Users size={48} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <p style={{ color: '#8899bb', fontSize: 14 }}>No team members found</p>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <TeamModal
            member={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchTeam}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
