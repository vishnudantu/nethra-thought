import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, Users, Clock, X } from 'lucide-react';
import { api } from '../lib/api';
import Badge, { statusBadge } from '../components/ui/Badge';
import type { Event } from '../lib/types';

const eventTypes = ['Meeting', 'Rally', 'Inauguration', 'Campaign', 'Official Visit', 'Press Conference', 'Public Hearing', 'Party Event', 'Other'];
const typeColors: Record<string, string> = {
  Meeting: '#42a5f5', Rally: '#ef5350', Inauguration: '#00c864',
  Campaign: '#ffa726', 'Official Visit': '#00d4aa', 'Press Conference': '#ab47bc',
  'Public Hearing': '#26c6da', 'Party Event': '#ff7043', Other: '#8899bb',
};

function EventModal({ event, onClose, onSave }: {
  event: Partial<Event> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_type: event?.event_type || 'Meeting',
    location: event?.location || '',
    start_date: event?.start_date ? event.start_date.substring(0, 16) : '',
    attendees: event?.attendees || 0,
    organizer: event?.organizer || '',
    status: event?.status || 'Upcoming',
    notes: event?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title || !form.start_date) return;
    setSaving(true);
    if (event?.id) {
      await api.update('events', event.id, form);
    } else {
      await api.create('events', form);
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
            {event?.id ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Event Title *</label>
            <input className="input-field" placeholder="Event name"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Type</label>
              <select className="input-field" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {eventTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Date & Time *</label>
            <input type="datetime-local" className="input-field"
              value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Location</label>
            <input className="input-field" placeholder="Venue, city"
              value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Expected Attendees</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.attendees} onChange={e => setForm({ ...form, attendees: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Organizer</label>
              <input className="input-field" placeholder="Organizing body"
                value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea className="input-field" rows={2} placeholder="Additional notes"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : event?.id ? 'Update' : 'Add Event'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<Event> | null>(null);
  const [filter, setFilter] = useState('All');

  async function fetchEvents() {
    setLoading(true);
    const data = await api.list('events', { order: 'start_date', dir: 'ASC' });
    setEvents(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, []);

  const filtered = filter === 'All' ? events : events.filter(e => e.status === filter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Upcoming', count: events.filter(e => e.status === 'Upcoming').length, color: '#ffa726' },
          { label: 'Ongoing', count: events.filter(e => e.status === 'Ongoing').length, color: '#00d4aa' },
          { label: 'Completed', count: events.filter(e => e.status === 'Completed').length, color: '#00c864' },
          { label: 'Cancelled', count: events.filter(e => e.status === 'Cancelled').length, color: '#ff5555' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card rounded-2xl p-4 text-center cursor-pointer"
            onClick={() => setFilter(s.label)}
            style={{ border: filter === s.label ? `1px solid ${s.color}40` : undefined }}
            whileHover={{ scale: 1.02 }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#8899bb' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map(f => (
            <button key={f}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === f ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#00d4aa' : '#8899bb',
                border: `1px solid ${filter === f ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-4 w-2/3 rounded mb-3" />
            <div className="shimmer h-3 w-full rounded mb-2" />
            <div className="shimmer h-3 w-1/2 rounded" />
          </div>
        )) : filtered.map((event, i) => {
          const d = new Date(event.start_date);
          const color = typeColors[event.event_type] || '#8899bb';
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card-hover rounded-2xl p-5 cursor-pointer"
              onClick={() => { setSelected(event); setModalOpen(true); }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: color + '20', color }}>
                  {event.event_type}
                </div>
                <Badge variant={statusBadge(event.status)}>{event.status}</Badge>
              </div>
              <h3 className="font-semibold mb-2 leading-snug" style={{ color: '#f0f4ff', fontSize: 14 }}>{event.title}</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={12} style={{ color: '#8899bb' }} />
                  <span style={{ fontSize: 12, color: '#8899bb' }}>
                    {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} style={{ color: '#8899bb' }} />
                    <span style={{ fontSize: 12, color: '#8899bb' }} className="truncate">{event.location}</span>
                  </div>
                )}
                {event.attendees > 0 && (
                  <div className="flex items-center gap-2">
                    <Users size={12} style={{ color: '#8899bb' }} />
                    <span style={{ fontSize: 12, color: '#8899bb' }}>{event.attendees.toLocaleString()} attendees</span>
                  </div>
                )}
              </div>
              {event.organizer && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span style={{ fontSize: 11, color: '#8899bb' }}>Organized by: {event.organizer}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Calendar size={48} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <p style={{ color: '#8899bb', fontSize: 14 }}>No events found</p>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <EventModal
            event={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchEvents}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
