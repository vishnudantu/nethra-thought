import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Users, MessageSquare, Heart, Calendar, CheckCircle, Clock, CreditCard as Edit2, Trash2, MapPin, ThumbsUp, Megaphone, Handshake, Star, ChevronRight, Activity, Lightbulb, UserPlus, Video, Tag, ArrowUp } from 'lucide-react';
import { api } from '../lib/api';

interface Engagement {
  id: string;
  title: string;
  engagement_type: string;
  description: string;
  location: string;
  mandal: string;
  event_date: string;
  duration_hours: number;
  expected_attendance: number;
  actual_attendance: number;
  rsvp_count: number;
  status: string;
  organizer: string;
  contact: string;
  agenda: string;
  outcome: string;
  is_recorded: boolean;
  tags: string[];
  created_at: string;
}

interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  mandal: string;
  village: string;
  skills: string[];
  availability: string;
  status: string;
  joined_date: string;
  total_hours: number;
  events_attended: number;
  created_at: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  submitter_name: string;
  submitter_contact: string;
  is_anonymous: boolean;
  mandal: string;
  status: string;
  priority: string;
  admin_response: string;
  upvotes: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Planning': '#8899bb', 'Confirmed': '#1e88e5', 'Ongoing': '#ffa726',
  'Completed': '#00c864', 'Cancelled': '#ff5555', 'Postponed': '#9c27b0'
};
const TYPE_COLORS: Record<string, string> = {
  'Town Hall': '#1e88e5', 'Ward Sabha': '#00d4aa', 'Youth Meeting': '#ffa726',
  'Women\'s Group': '#e040fb', 'Farmers Meeting': '#00c864', 'Press Conference': '#ff5555',
  'Cultural Event': '#9c27b0', 'Sports Event': '#00bcd4', 'Awareness Camp': '#ffa726'
};

function EngagementModal({ ev, onClose, onSave }: { ev: Partial<Engagement> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: ev?.title || '',
    engagement_type: ev?.engagement_type || 'Town Hall',
    description: ev?.description || '',
    location: ev?.location || '',
    mandal: ev?.mandal || '',
    event_date: ev?.event_date ? new Date(ev.event_date).toISOString().slice(0, 16) : '',
    duration_hours: ev?.duration_hours || 2,
    expected_attendance: ev?.expected_attendance || 100,
    organizer: ev?.organizer || '',
    contact: ev?.contact || '',
    agenda: ev?.agenda || '',
    status: ev?.status || 'Planning',
    is_recorded: ev?.is_recorded || false,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    const payload = { ...form, event_date: new Date(form.event_date).toISOString() };
    if (ev?.id) {
      await api.update('citizen_engagements', ev.id, payload);
    } else {
      await api.create('citizen_engagements', payload);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[92vh]" style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>{ev?.id ? 'Edit Event' : 'Schedule Engagement'}</h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Citizen engagement events and town halls</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}><X size={16} style={{ color: '#8899bb' }} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Event Title *</label>
              <input className="input-field" placeholder="e.g., Kurnool Town Hall Meeting 2024" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Event Type</label>
              <select className="input-field" value={form.engagement_type} onChange={e => setForm({ ...form, engagement_type: e.target.value })}>
                {Object.keys(TYPE_COLORS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Date & Time *</label>
              <input type="datetime-local" className="input-field" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Duration (hours)</label>
              <input type="number" step={0.5} min={0.5} className="input-field" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: parseFloat(e.target.value) || 1 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Location</label>
              <input className="input-field" placeholder="Venue name" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Mandal</label>
              <input className="input-field" placeholder="Mandal" value={form.mandal} onChange={e => setForm({ ...form, mandal: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Expected Attendance</label>
              <input type="number" className="input-field" value={form.expected_attendance} onChange={e => setForm({ ...form, expected_attendance: parseInt(e.target.value) || 100 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Organizer</label>
              <input className="input-field" placeholder="Organizer name" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Agenda</label>
            <textarea className="input-field" rows={3} placeholder="Meeting agenda points..." value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm({ ...form, is_recorded: !form.is_recorded })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: form.is_recorded ? 'rgba(255,85,85,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${form.is_recorded ? 'rgba(255,85,85,0.3)' : 'rgba(255,255,255,0.1)'}`, color: form.is_recorded ? '#ff5555' : '#8899bb' }}>
              <Video size={14} />
              {form.is_recorded ? 'Recording Enabled' : 'Enable Recording'}
            </button>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : ev?.id ? 'Update' : 'Schedule Event'}</button>
        </div>
      </motion.div>
    </div>
  );
}

function VolunteerModal({ vol, onClose, onSave }: { vol: Partial<Volunteer> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: vol?.name || '', phone: vol?.phone || '', email: vol?.email || '',
    age: vol?.age || 25, gender: vol?.gender || 'Male', mandal: vol?.mandal || '',
    village: vol?.village || '', availability: vol?.availability || 'Weekends',
    status: vol?.status || 'Active',
  });
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(vol?.skills || []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    const payload = { ...form, skills, joined_date: new Date().toISOString().split('T')[0] };
    if (vol?.id) {
      await api.update('volunteers', vol.id, payload);
    } else {
      await api.create('volunteers', payload);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]" style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>{vol?.id ? 'Edit Volunteer' : 'Register Volunteer'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}><X size={16} style={{ color: '#8899bb' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Name *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Phone *</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Age</label><input type="number" className="input-field" value={form.age} onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 18 })} /></div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Mandal</label><input className="input-field" value={form.mandal} onChange={e => setForm({ ...form, mandal: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Availability</label>
              <select className="input-field" value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}>
                {['Full Time', 'Part Time', 'Weekends', 'Evenings', 'On Call'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Skills</label>
            <div className="flex gap-2 mb-2">
              <input className="input-field flex-1" placeholder="Add skill (e.g., Social Media)" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput(''); } }} />
              <button onClick={() => { if (skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput(''); } }} className="btn-secondary" style={{ padding: '10px 14px' }}>Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)' }}>
                  {s}
                  <button onClick={() => setSkills(skills.filter((_, j) => j !== i))}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save Volunteer'}</button>
        </div>
      </motion.div>
    </div>
  );
}

function SuggestionModal({ sug, onClose, onSave }: { sug: Partial<Suggestion> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: sug?.title || '', description: sug?.description || '', category: sug?.category || 'General',
    submitter_name: sug?.submitter_name || 'Anonymous', submitter_contact: sug?.submitter_contact || '',
    is_anonymous: sug?.is_anonymous ?? true, mandal: sug?.mandal || '',
    status: sug?.status || 'New', priority: sug?.priority || 'Medium', admin_response: sug?.admin_response || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title || !form.description) return;
    setSaving(true);
    if (sug?.id) {
      await api.update('suggestions', sug.id, { ...form, updated_at: new Date().toISOString() });
    } else {
      await api.create('suggestions', form);
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]" style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>{sug?.id ? 'Edit Suggestion' : 'New Suggestion'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}><X size={16} style={{ color: '#8899bb' }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Title *</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Description *</label><textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'none' }} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['Infrastructure', 'Education', 'Health', 'Agriculture', 'Employment', 'Environment', 'Governance', 'General'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Submitter Name</label><input className="input-field" value={form.submitter_name} onChange={e => setForm({ ...form, submitter_name: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Mandal</label><input className="input-field" value={form.mandal} onChange={e => setForm({ ...form, mandal: e.target.value })} /></div>
          </div>
          {sug?.id && (
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Admin Response</label>
              <textarea className="input-field" rows={2} placeholder="Official response to this suggestion..." value={form.admin_response} onChange={e => setForm({ ...form, admin_response: e.target.value })} style={{ resize: 'none' }} />
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CitizenEngagement() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'events' | 'volunteers' | 'suggestions'>('events');
  const [evModal, setEvModal] = useState(false);
  const [volModal, setVolModal] = useState(false);
  const [sugModal, setSugModal] = useState(false);
  const [selectedEv, setSelectedEv] = useState<Partial<Engagement> | null>(null);
  const [selectedVol, setSelectedVol] = useState<Partial<Volunteer> | null>(null);
  const [selectedSug, setSelectedSug] = useState<Partial<Suggestion> | null>(null);
  const [search, setSearch] = useState('');

  async function fetchAll() {
    setLoading(true);
    const [{ data: ev }, { data: vol }, { data: sug }] = await Promise.all([
      api.list('citizen_engagements', { order: 'event_date', dir: 'DESC' }),
      api.list('volunteers'),
      api.list('suggestions'),
    ]);
    setEngagements(ev || []);
    setVolunteers(vol || []);
    setSuggestions(sug || []);
    setLoading(false);
  }

  async function upvoteSuggestion(sug: Suggestion) {
    await api.update('suggestions', sug.id, { upvotes: (sug.upvotes || 0) + 1 });
    fetchAll();
  }

  useEffect(() => { fetchAll(); }, []);

  const totalAttendance = engagements.reduce((s, e) => s + (e.actual_attendance || 0), 0);
  const activeVolunteers = volunteers.filter(v => v.status === 'Active').length;
  const pendingSuggestions = suggestions.filter(s => s.status === 'New' || s.status === 'Under Review').length;

  const filteredEngagements = engagements.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()));
  const filteredVolunteers = volunteers.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.mandal.toLowerCase().includes(search.toLowerCase()));
  const filteredSuggestions = suggestions.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Calendar, label: 'Events Organized', value: engagements.length, color: '#1e88e5' },
          { icon: Users, label: 'Total Attendance', value: totalAttendance.toLocaleString(), color: '#00d4aa' },
          { icon: Heart, label: 'Active Volunteers', value: activeVolunteers, color: '#e040fb' },
          { icon: Lightbulb, label: 'Pending Suggestions', value: pendingSuggestions, color: '#ffa726' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-5" style={{ border: `1px solid ${s.color}22` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}22` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'events', label: 'Events', icon: Megaphone },
            { id: 'volunteers', label: 'Volunteers', icon: Heart },
            { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: tab === t.id ? 'linear-gradient(135deg, #00d4aa, #00bcd4)' : 'rgba(255,255,255,0.06)', color: tab === t.id ? '#060b18' : '#8899bb' }}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="bg-transparent text-sm border-none outline-none text-white placeholder-gray-500 w-40"
              placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === 'events' && <button className="btn-primary" onClick={() => { setSelectedEv(null); setEvModal(true); }}><Plus size={16} /> Schedule Event</button>}
          {tab === 'volunteers' && <button className="btn-primary" onClick={() => { setSelectedVol(null); setVolModal(true); }}><Plus size={16} /> Add Volunteer</button>}
          {tab === 'suggestions' && <button className="btn-primary" onClick={() => { setSelectedSug(null); setSugModal(true); }}><Plus size={16} /> Add Suggestion</button>}
        </div>
      </div>

      {tab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEngagements.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: `${TYPE_COLORS[ev.engagement_type] || '#8899bb'}22`, color: TYPE_COLORS[ev.engagement_type] || '#8899bb' }}>
                  {ev.engagement_type}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setSelectedEv(ev); setEvModal(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}><Edit2 size={13} /></button>
                  <button onClick={async () => { await api.remove('citizen_engagements', ev.id); fetchAll(); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-bold mb-2" style={{ fontSize: 15, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{ev.title}</h3>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2"><Calendar size={12} style={{ color: '#8899bb' }} /><span style={{ fontSize: 12, color: '#8899bb' }}>{new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                <div className="flex items-center gap-2"><MapPin size={12} style={{ color: '#8899bb' }} /><span style={{ fontSize: 12, color: '#8899bb' }}>{ev.location || ev.mandal || 'TBD'}</span></div>
                <div className="flex items-center gap-2"><Users size={12} style={{ color: '#8899bb' }} /><span style={{ fontSize: 12, color: '#8899bb' }}>{ev.actual_attendance || 0} / {ev.expected_attendance} attended</span></div>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: `${STATUS_COLORS[ev.status] || '#8899bb'}22`, color: STATUS_COLORS[ev.status] || '#8899bb' }}>{ev.status}</span>
            </motion.div>
          ))}
          {filteredEngagements.length === 0 && !loading && (
            <div className="col-span-3 text-center py-14">
              <Megaphone size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
              <p style={{ color: '#8899bb', fontSize: 14 }}>No events found. Schedule your first engagement.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'volunteers' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Name', 'Contact', 'Location', 'Skills', 'Availability', 'Hours', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.map((vol, i) => (
                  <motion.tr key={vol.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{vol.name}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{vol.gender} · {vol.age}y</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{vol.phone}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: '#f0f4ff' }}>{vol.mandal || '-'}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }}>{vol.village}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex flex-wrap gap-1">
                        {(vol.skills || []).slice(0, 2).map((s, j) => (
                          <span key={j} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa' }}>{s}</span>
                        ))}
                        {(vol.skills || []).length > 2 && <span className="text-xs" style={{ color: '#8899bb' }}>+{vol.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{vol.availability}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#f0f4ff', fontWeight: 600 }}>{vol.total_hours || 0}h</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: vol.status === 'Active' ? 'rgba(0,200,100,0.15)' : 'rgba(136,153,187,0.15)', color: vol.status === 'Active' ? '#00c864' : '#8899bb' }}>{vol.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedVol(vol); setVolModal(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}><Edit2 size={13} /></button>
                        <button onClick={async () => { await api.remove('volunteers', vol.id); fetchAll(); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredVolunteers.length === 0 && !loading && (
              <div className="text-center py-14"><Heart size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} /><p style={{ color: '#8899bb', fontSize: 14 }}>No volunteers found.</p></div>
            )}
          </div>
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-3">
          {filteredSuggestions.map((sug, i) => (
            <motion.div key={sug.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#8899bb' }}>{sug.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: sug.status === 'New' ? 'rgba(255,167,38,0.15)' : 'rgba(0,200,100,0.15)', color: sug.status === 'New' ? '#ffa726' : '#00c864' }}>{sug.status}</span>
                    {sug.priority === 'High' || sug.priority === 'Urgent' ? <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}>{sug.priority}</span> : null}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>{sug.title}</h3>
                  <p style={{ fontSize: 13, color: '#8899bb', marginBottom: 8, lineHeight: 1.5 }}>{sug.description}</p>
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize: 12, color: '#8899bb' }}>{sug.is_anonymous ? 'Anonymous' : sug.submitter_name}</span>
                    {sug.mandal && <span style={{ fontSize: 12, color: '#8899bb' }}>{sug.mandal}</span>}
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{new Date(sug.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  {sug.admin_response && (
                    <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
                      <div style={{ fontSize: 11, color: '#00d4aa', fontWeight: 600, marginBottom: 4 }}>Official Response</div>
                      <p style={{ fontSize: 12, color: '#f0f4ff' }}>{sug.admin_response}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3 ml-4">
                  <button onClick={() => upvoteSuggestion(sug)} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ background: 'rgba(0,200,100,0.1)', border: '1px solid rgba(0,200,100,0.2)' }}>
                    <ArrowUp size={16} style={{ color: '#00c864' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00c864' }}>{sug.upvotes || 0}</span>
                  </button>
                  <button onClick={() => { setSelectedSug(sug); setSugModal(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}><Edit2 size={13} /></button>
                  <button onClick={async () => { await api.remove('suggestions', sug.id); fetchAll(); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555' }}><Trash2 size={13} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredSuggestions.length === 0 && !loading && (
            <div className="text-center py-14"><Lightbulb size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} /><p style={{ color: '#8899bb', fontSize: 14 }}>No suggestions yet.</p></div>
          )}
        </div>
      )}

      <AnimatePresence>
        {evModal && <EngagementModal ev={selectedEv} onClose={() => { setEvModal(false); setSelectedEv(null); }} onSave={fetchAll} />}
        {volModal && <VolunteerModal vol={selectedVol} onClose={() => { setVolModal(false); setSelectedVol(null); }} onSave={fetchAll} />}
        {sugModal && <SuggestionModal sug={selectedSug} onClose={() => { setSugModal(false); setSelectedSug(null); }} onSave={fetchAll} />}
      </AnimatePresence>
    </div>
  );
}
