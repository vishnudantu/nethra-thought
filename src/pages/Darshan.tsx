import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Star, Users, Calendar, CheckCircle, Clock,
  CreditCard as Edit2, Trash2, ListOrdered, Ban, ArrowUpCircle,
  Info, ShieldCheck, ThumbsUp, ThumbsDown, MessageSquare, Send,
  Bell, Lock
} from 'lucide-react';
import { api } from '../lib/api';

interface DarshanBooking {
  id: string;
  booking_number: string;
  pilgrim_name: string;
  pilgrim_contact: string;
  pilgrim_email: string;
  pilgrim_aadhar_last4: string;
  group_size: number;
  darshan_type: string;
  darshan_date: string;
  darshan_time: string;
  accommodation_required: boolean;
  accommodation_type: string;
  accommodation_nights: number;
  transport_required: boolean;
  transport_type: string;
  departure_location: string;
  mandal: string;
  village: string;
  special_requests: string;
  status: string;
  is_waitlisted: boolean;
  waitlist_position: number | null;
  cooldown_until: string | null;
  promoted_from_waitlist: boolean;
  coordinator_name: string;
  notes: string;
  approval_status: string;
  approved_at: string | null;
  approved_by: string;
  rejection_reason: string;
  sms_sent: boolean;
  sms_sent_at: string | null;
  contact_person: string;
  contact_phone: string;
  approval_notes: string;
  ticket_pickup_point: string;
  shrine_contact_numbers: string;
  created_at: string;
}

interface DateSlot {
  id: string;
  slot_date: string;
  is_filled: boolean;
  confirmed_booking_id: string | null;
  waitlist_count: number;
}

const DARSHAN_TYPES = ['Standard Darshan', 'Seegra Darshan', 'VIP Break Darshan', 'Arjitha Seva', 'Special Entry Darshan (SED)', 'Divya Darshan'];

const STATUS_COLORS: Record<string, string> = {
  'Booked': '#1e88e5',
  'Confirmed': '#00bcd4',
  'Departed': '#ffa726',
  'Completed': '#00c864',
  'Cancelled': '#ff5555',
  'No Show': '#8899bb',
  'Waitlisted': '#f06292',
};

type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string; cooldown_until?: string };

async function checkEligibility(contact: string, currentBookingId?: string): Promise<EligibilityResult> {
  if (!contact) return { eligible: true };
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const allBookings = await api.list('darshan_bookings', { order: 'darshan_date', dir: 'DESC', limit: '2000' }) as DarshanBooking[];
  const data = allBookings.filter(b => b.pilgrim_contact === contact && b.status !== 'Cancelled' && !b.is_waitlisted);

  if (!data || data.length === 0) return { eligible: true };
  const relevant = data.filter(b => !currentBookingId || b.id !== currentBookingId);
  if (relevant.length === 0) return { eligible: true };

  const latest = relevant[0];
  if (latest.cooldown_until) {
    const cooldownDate = new Date(latest.cooldown_until);
    if (cooldownDate > new Date()) {
      return {
        eligible: false,
        reason: `This person already received darshan on ${new Date(latest.darshan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Eligible again after ${cooldownDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        cooldown_until: latest.cooldown_until,
      };
    }
  } else {
    const darshanDate = new Date(latest.darshan_date);
    if (darshanDate > sixMonthsAgo) {
      const eligibleDate = new Date(darshanDate);
      eligibleDate.setMonth(eligibleDate.getMonth() + 6);
      return {
        eligible: false,
        reason: `This person already received darshan on ${darshanDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Eligible again after ${eligibleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        cooldown_until: eligibleDate.toISOString().split('T')[0],
      };
    }
  }
  return { eligible: true };
}

async function checkDateAvailability(date: string, currentBookingId?: string): Promise<{ available: boolean; waitlistCount: number; slot: DateSlot | null }> {
  const slots = await api.list('darshan_date_slots') as DateSlot[];
  const slot = slots.find(s => s.slot_date === date) || null;
  if (!slot) return { available: true, waitlistCount: 0, slot: null };
  const isCurrentlyFilled = slot.is_filled && slot.confirmed_booking_id !== currentBookingId;
  return { available: !isCurrentlyFilled, waitlistCount: slot.waitlist_count, slot };
}

function BookingModal({ booking, onClose, onSave }: { booking: Partial<DarshanBooking> | null; onClose: () => void; onSave: () => void }) {
  const isEdit = !!booking?.id;
  const [form, setForm] = useState({
    pilgrim_name: booking?.pilgrim_name || '',
    pilgrim_contact: booking?.pilgrim_contact || '',
    pilgrim_email: booking?.pilgrim_email || '',
    pilgrim_aadhar_last4: booking?.pilgrim_aadhar_last4 || '',
    group_size: booking?.group_size || 1,
    darshan_type: booking?.darshan_type || 'Standard Darshan',
    darshan_date: booking?.darshan_date || '',
    darshan_time: booking?.darshan_time || '06:00',
    accommodation_required: booking?.accommodation_required || false,
    accommodation_type: booking?.accommodation_type || 'None',
    accommodation_nights: booking?.accommodation_nights || 0,
    transport_required: booking?.transport_required || false,
    transport_type: booking?.transport_type || 'None',
    departure_location: booking?.departure_location || '',
    mandal: booking?.mandal || '',
    village: booking?.village || '',
    special_requests: booking?.special_requests || '',
    coordinator_name: booking?.coordinator_name || '',
    notes: booking?.notes || '',
    status: booking?.status || 'Booked',
  });
  const [saving, setSaving] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<{ available: boolean; waitlistCount: number; slot: DateSlot | null } | null>(null);
  const [checkingDate, setCheckingDate] = useState(false);

  const willBeWaitlisted = !!(dateAvailability && !dateAvailability.available && !isEdit);

  useEffect(() => {
    if (form.pilgrim_contact.length >= 10) {
      setCheckingEligibility(true);
      checkEligibility(form.pilgrim_contact, booking?.id).then(r => { setEligibility(r); setCheckingEligibility(false); });
    } else { setEligibility(null); }
  }, [form.pilgrim_contact, booking?.id]);

  useEffect(() => {
    if (form.darshan_date && !isEdit) {
      setCheckingDate(true);
      checkDateAvailability(form.darshan_date, booking?.id).then(r => { setDateAvailability(r); setCheckingDate(false); });
    } else { setDateAvailability(null); }
  }, [form.darshan_date, booking?.id, isEdit]);

  async function handleSave() {
    if (!form.pilgrim_name || !form.pilgrim_contact || !form.darshan_date) return;
    if (eligibility && !eligibility.eligible && !willBeWaitlisted) return;
    setSaving(true);
    const isWaitlisted = willBeWaitlisted;
    if (isEdit && booking?.id) {
      await api.update('darshan_bookings', booking.id, form);
    } else {
      const bookingNumber = `TTD-${Date.now().toString().slice(-8)}`;
      const cooldownDate = new Date(form.darshan_date);
      cooldownDate.setMonth(cooldownDate.getMonth() + 6);
      let waitlistPos: number | null = null;
      if (isWaitlisted && dateAvailability?.slot) waitlistPos = (dateAvailability.slot.waitlist_count || 0) + 1;

      const newBooking = await api.create('darshan_bookings', {
        ...form,
        booking_number: bookingNumber,
        is_waitlisted: isWaitlisted,
        waitlist_position: waitlistPos,
        cooldown_until: isWaitlisted ? null : cooldownDate.toISOString().split('T')[0],
        status: isWaitlisted ? 'Waitlisted' : 'Booked',
        promoted_from_waitlist: false,
        approval_status: 'pending',
      });

      if (newBooking) {
        if (!isWaitlisted) {
          await api.post('/api/darshan_date_slots/upsert', {
            slot_date: form.darshan_date, is_filled: true, confirmed_booking_id: newBooking.id,
            waitlist_count: dateAvailability?.slot?.waitlist_count || 0,
          }).catch(() => api.create('darshan_date_slots', { slot_date: form.darshan_date, is_filled: true, confirmed_booking_id: newBooking.id, waitlist_count: 0 }));
        } else if (dateAvailability?.slot) {
          if (dateAvailability?.slot?.id) await api.update('darshan_date_slots', dateAvailability.slot.id, { waitlist_count: waitlistPos });
        } else {
          await api.create('darshan_date_slots', { slot_date: form.darshan_date, is_filled: false, waitlist_count: 1 });
        }
      }
    }
    setSaving(false);
    onSave();
    onClose();
  }

  const canSubmit = form.pilgrim_name && form.pilgrim_contact && form.darshan_date &&
    (eligibility?.eligible || willBeWaitlisted) && !checkingEligibility;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[92vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
              {isEdit ? 'Edit Booking' : 'New Darshan Request'}
            </h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Sri Venkateswara Swamy Devasthanam — MP Quota</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.2)' }}>
            <Info size={16} style={{ color: '#ffa726', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#ffa726', lineHeight: 1.7 }}>
              <strong>Rules:</strong> 1 darshan per day. 6-month cooldown after receiving darshan. All requests require the politician's approval before confirmation. No money collected.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Pilgrim Name *</label>
              <input className="input-field" placeholder="Full name" value={form.pilgrim_name} onChange={e => setForm({ ...form, pilgrim_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Contact Number *</label>
              <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.pilgrim_contact} onChange={e => setForm({ ...form, pilgrim_contact: e.target.value })} />
            </div>
          </div>

          <AnimatePresence>
            {checkingEligibility && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: '#8899bb', borderTopColor: 'transparent' }} />
                <span style={{ fontSize: 12, color: '#8899bb' }}>Checking eligibility...</span>
              </motion.div>
            )}
            {!checkingEligibility && eligibility && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: eligibility.eligible ? 'rgba(0,200,100,0.08)' : 'rgba(255,85,85,0.08)', border: `1px solid ${eligibility.eligible ? 'rgba(0,200,100,0.25)' : 'rgba(255,85,85,0.25)'}` }}>
                {eligibility.eligible
                  ? <ShieldCheck size={16} style={{ color: '#00c864', flexShrink: 0, marginTop: 1 }} />
                  : <Ban size={16} style={{ color: '#ff5555', flexShrink: 0, marginTop: 1 }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: eligibility.eligible ? '#00c864' : '#ff5555' }}>
                    {eligibility.eligible ? 'Eligible for Darshan' : '6-Month Restriction Active'}
                  </div>
                  {!eligibility.eligible && <div style={{ fontSize: 12, color: '#8899bb', marginTop: 3, lineHeight: 1.6 }}>{eligibility.reason}</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Aadhaar Last 4 Digits</label>
              <input className="input-field" placeholder="XXXX" maxLength={4} value={form.pilgrim_aadhar_last4}
                onChange={e => setForm({ ...form, pilgrim_aadhar_last4: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Group Size</label>
              <input type="number" min={1} max={10} className="input-field" value={form.group_size} onChange={e => setForm({ ...form, group_size: parseInt(e.target.value) || 1 })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Mandal</label>
              <input className="input-field" placeholder="Mandal name" value={form.mandal} onChange={e => setForm({ ...form, mandal: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Village</label>
              <input className="input-field" placeholder="Village name" value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Darshan Type *</label>
              <select className="input-field" value={form.darshan_type} onChange={e => setForm({ ...form, darshan_type: e.target.value })}>
                {DARSHAN_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Time Slot</label>
              <select className="input-field" value={form.darshan_time} onChange={e => setForm({ ...form, darshan_time: e.target.value })}>
                {['03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Darshan Date * {checkingDate && <span style={{ color: '#8899bb' }}>(checking...)</span>}
            </label>
            <input type="date" className="input-field" value={form.darshan_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm({ ...form, darshan_date: e.target.value })} />
          </div>

          <AnimatePresence>
            {!checkingDate && dateAvailability && form.darshan_date && !isEdit && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-xl"
                style={{ background: dateAvailability.available ? 'rgba(0,200,100,0.08)' : 'rgba(240,98,146,0.08)', border: `1px solid ${dateAvailability.available ? 'rgba(0,200,100,0.25)' : 'rgba(240,98,146,0.3)'}` }}>
                {dateAvailability.available ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} style={{ color: '#00c864' }} />
                    <span style={{ fontSize: 13, color: '#00c864', fontWeight: 600 }}>Date Available — Will go to pending approval queue</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ListOrdered size={15} style={{ color: '#f06292' }} />
                      <span style={{ fontSize: 13, color: '#f06292', fontWeight: 600 }}>Date Booked — Will be added to Waitlist (#{(dateAvailability.slot?.waitlist_count || 0) + 1})</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.6 }}>The 6-month restriction applies only once promoted from waitlist.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>Accommodation</span>
                <button onClick={() => setForm({ ...form, accommodation_required: !form.accommodation_required })}
                  className="w-10 h-5 rounded-full transition-all" style={{ background: form.accommodation_required ? '#00d4aa' : 'rgba(255,255,255,0.15)', position: 'relative' }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: form.accommodation_required ? '22px' : '2px' }} />
                </button>
              </div>
              {form.accommodation_required && (
                <div className="space-y-3">
                  <select className="input-field" style={{ fontSize: 12 }} value={form.accommodation_type} onChange={e => setForm({ ...form, accommodation_type: e.target.value })}>
                    {['TTD Cottages', 'Choultries', 'Bhakta Niwas', 'Guest House', 'Private Hotel'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input type="number" className="input-field" style={{ fontSize: 12 }} placeholder="Nights" min={1}
                    value={form.accommodation_nights} onChange={e => setForm({ ...form, accommodation_nights: parseInt(e.target.value) || 1 })} />
                </div>
              )}
            </div>
            <div className="p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>Transport Needed</span>
                <button onClick={() => setForm({ ...form, transport_required: !form.transport_required })}
                  className="w-10 h-5 rounded-full transition-all" style={{ background: form.transport_required ? '#1e88e5' : 'rgba(255,255,255,0.15)', position: 'relative' }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: form.transport_required ? '22px' : '2px' }} />
                </button>
              </div>
              {form.transport_required && (
                <div className="space-y-3">
                  <select className="input-field" style={{ fontSize: 12 }} value={form.transport_type} onChange={e => setForm({ ...form, transport_type: e.target.value })}>
                    {['Bus (AC)', 'Bus (Non-AC)', 'Train', 'Private Vehicle', 'Shared Taxi'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input className="input-field" style={{ fontSize: 12 }} placeholder="Departure location" value={form.departure_location} onChange={e => setForm({ ...form, departure_location: e.target.value })} />
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Coordinator</label>
            <input className="input-field" placeholder="Staff coordinator name" value={form.coordinator_name} onChange={e => setForm({ ...form, coordinator_name: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Special Requests / Notes</label>
            <textarea className="input-field" rows={2} placeholder="Accessibility needs, senior citizens, prasadam preferences..."
              value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })} style={{ resize: 'none' }} />
          </div>

          {!isEdit && eligibility && !eligibility.eligible && !willBeWaitlisted && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.3)' }}>
              <Ban size={16} style={{ color: '#ff5555', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#ff5555' }}>Booking cannot be created. This person is within the 6-month cooldown period.</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving || !canSubmit}>
            {saving ? 'Saving...' : isEdit ? 'Update Booking' : willBeWaitlisted ? 'Add to Waitlist' : 'Submit for Approval'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ApprovalModal({ booking, onClose, onDone }: { booking: DarshanBooking; onClose: () => void; onDone: () => void }) {
  const [approvedBy, setApprovedBy] = useState('');
  const [contactPerson, setContactPerson] = useState(booking.contact_person || '');
  const [contactPhone, setContactPhone] = useState(booking.contact_phone || '');
  const [ticketPickupPoint, setTicketPickupPoint] = useState(booking.ticket_pickup_point || 'TTD Ticket Counter, Tirumala');
  const [shrineContacts, setShrineContacts] = useState(booking.shrine_contact_numbers || 'TTD Helpline: 155257');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [smsPreview, setSmsPreview] = useState(false);

  const darshanDate = booking.darshan_date
    ? new Date(booking.darshan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const smsMessage = `Dear ${booking.pilgrim_name}, your Tirupati Darshan is CONFIRMED by ${approvedBy || '[Politician Name]'}. Date: ${darshanDate} (${booking.darshan_type}). Ticket pickup: ${ticketPickupPoint}. Shrine contacts: ${shrineContacts}. ${contactPerson && contactPhone ? `Queries: ${contactPerson} - ${contactPhone}.` : ''} Carry this message and a valid ID. - MP Office`;

  async function handleApprove() {
    if (!approvedBy.trim()) return;
    setProcessing(true);
    try {
      await fetch('/api/darshan-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nethra_token') || ''}`,
        },
        body: JSON.stringify({
          booking_id: booking.id,
          approved_by: approvedBy,
          approval_notes: approvalNotes,
          contact_person: contactPerson,
          contact_phone: contactPhone,
          ticket_pickup_point: ticketPickupPoint,
          shrine_contact_numbers: shrineContacts,
        }),
      });
    } catch (err) {
      console.error('[darshan-sms]', err);
    }
    setProcessing(false);
    onDone();
    onClose();
  }

  async function handleReject() {
    if (!approvedBy.trim()) return;
    setProcessing(true);
    await api.update('darshan_bookings', booking.id, { approval_status: 'rejected', approved_by: approvedBy, rejection_reason: rejectionReason, status: 'Cancelled' });
    setProcessing(false);
    onDone();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-lg overflow-y-auto max-h-[92vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>Politician Approval</h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Review and approve or reject this darshan request</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Request summary */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: '#8899bb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Request Summary</span>
              <span style={{ fontSize: 11, color: '#00d4aa', fontFamily: 'monospace' }}>{booking.booking_number}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Pilgrim', value: booking.pilgrim_name },
                { label: 'Contact', value: booking.pilgrim_contact },
                { label: 'Date', value: darshanDate },
                { label: 'Darshan Type', value: booking.darshan_type },
                { label: 'Group Size', value: String(booking.group_size) },
                { label: 'Location', value: [booking.mandal, booking.village].filter(Boolean).join(', ') || '—' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 500 }}>{item.value || '—'}</div>
                </div>
              ))}
            </div>
            {booking.special_requests && (
              <div>
                <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 2 }}>Special Requests</div>
                <div style={{ fontSize: 12, color: '#8899bb' }}>{booking.special_requests}</div>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Approved / Reviewed By * <span style={{ color: '#ffa726' }}>(Politician's name)</span>
            </label>
            <input className="input-field" placeholder="Enter your name to authenticate this action"
              value={approvedBy} onChange={e => setApprovedBy(e.target.value)} />
          </div>

          {/* Action selector */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setAction('approve')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl font-semibold transition-all"
              style={{
                background: action === 'approve' ? 'rgba(0,200,100,0.2)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${action === 'approve' ? '#00c864' : 'rgba(255,255,255,0.1)'}`,
                color: action === 'approve' ? '#00c864' : '#8899bb',
              }}>
              <ThumbsUp size={16} /> Approve
            </button>
            <button onClick={() => setAction('reject')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl font-semibold transition-all"
              style={{
                background: action === 'reject' ? 'rgba(255,85,85,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${action === 'reject' ? '#ff5555' : 'rgba(255,255,255,0.1)'}`,
                color: action === 'reject' ? '#ff5555' : '#8899bb',
              }}>
              <ThumbsDown size={16} /> Reject
            </button>
          </div>

          <AnimatePresence>
            {action === 'approve' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Office Contact Person</label>
                    <input className="input-field" placeholder="Name to relay in SMS" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Contact Phone</label>
                    <input className="input-field" placeholder="Phone number" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Ticket Pickup Point</label>
                    <input className="input-field" placeholder="TTD Ticket Counter, Tirumala" value={ticketPickupPoint} onChange={e => setTicketPickupPoint(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Shrine Contact Numbers</label>
                    <input className="input-field" placeholder="TTD Helpline: 155257" value={shrineContacts} onChange={e => setShrineContacts(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Approval Notes (optional)</label>
                  <input className="input-field" placeholder="Any instructions for the pilgrim" value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} />
                </div>

                {/* SMS preview */}
                <div>
                  <button onClick={() => setSmsPreview(!smsPreview)}
                    className="flex items-center gap-2 text-sm mb-2"
                    style={{ color: '#8899bb' }}>
                    <MessageSquare size={13} />
                    {smsPreview ? 'Hide' : 'Preview'} SMS that will be sent
                  </button>
                  <AnimatePresence>
                    {smsPreview && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl" style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Send size={12} style={{ color: '#00c864' }} />
                          <span style={{ fontSize: 11, color: '#00c864', fontWeight: 600 }}>SMS to {booking.pilgrim_contact}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.7 }}>{smsMessage}</p>
                        <p style={{ fontSize: 11, color: '#4a5568', marginTop: 8 }}>
                          {smsMessage.length} characters — {Math.ceil(smsMessage.length / 160)} SMS unit(s)
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
            {action === 'reject' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6, fontWeight: 500 }}>Reason for Rejection</label>
                <textarea className="input-field" rows={3} placeholder="Explain why this request is being rejected..."
                  value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} style={{ resize: 'none' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          {action === 'approve' && (
            <button onClick={handleApprove} disabled={processing || !approvedBy.trim()}
              className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #00c864, #00d4aa)', color: '#060b18', opacity: (!approvedBy.trim() || processing) ? 0.5 : 1 }}>
              <ThumbsUp size={15} />
              {processing ? 'Approving & Sending SMS...' : 'Approve & Send SMS'}
            </button>
          )}
          {action === 'reject' && (
            <button onClick={handleReject} disabled={processing || !approvedBy.trim()}
              className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #ff5555, #ff3333)', color: '#fff', opacity: (!approvedBy.trim() || processing) ? 0.5 : 1 }}>
              <ThumbsDown size={15} />
              {processing ? 'Rejecting...' : 'Reject Request'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Darshan() {
  const [bookings, setBookings] = useState<DarshanBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<DarshanBooking> | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<DarshanBooking | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'waitlist'>('pending');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    const data = await api.list('darshan_bookings') as DarshanBooking[];
    setBookings(data || []);
    setLoading(false);
  }

  async function deleteBooking(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (booking && !booking.is_waitlisted) {
      const slots = await api.list('darshan_date_slots') as DateSlot[];
      const slot = slots.find(s => s.slot_date === booking.darshan_date);
      if (slot) await api.update('darshan_date_slots', slot.id, { is_filled: false, confirmed_booking_id: null });
    }
    await api.remove('darshan_bookings', id);
    setConfirmDelete(null);
    fetchData();
  }

  async function promoteFromWaitlist(bookingId: string) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const cooldownDate = new Date(booking.darshan_date);
    cooldownDate.setMonth(cooldownDate.getMonth() + 6);
    await api.update('darshan_bookings', bookingId, { is_waitlisted: false, waitlist_position: null, status: 'Booked', promoted_from_waitlist: true, cooldown_until: cooldownDate.toISOString().split('T')[0], approval_status: 'pending' });
    const slots = await api.list('darshan_date_slots') as DateSlot[];
    const slot = slots.find(s => s.slot_date === booking.darshan_date);
    if (slot) await api.update('darshan_date_slots', slot.id, { is_filled: true, confirmed_booking_id: bookingId });
    else await api.create('darshan_date_slots', { slot_date: booking.darshan_date, is_filled: true, confirmed_booking_id: bookingId, waitlist_count: 0 });
    setTab('pending');
    fetchData();
  }

  useEffect(() => { fetchData(); }, []);

  const filterSearch = (b: DarshanBooking) =>
    !search || b.pilgrim_name.toLowerCase().includes(search.toLowerCase()) ||
    b.booking_number?.includes(search) || b.pilgrim_contact?.includes(search);

  const pending = bookings.filter(b => !b.is_waitlisted && b.approval_status === 'pending' && b.status !== 'Cancelled' && filterSearch(b));
  const confirmed = bookings.filter(b => !b.is_waitlisted && b.approval_status === 'approved' && filterSearch(b));
  const waitlist = bookings.filter(b => b.is_waitlisted && filterSearch(b));

  const today = new Date().toISOString().split('T')[0];
  const todayBooked = bookings.some(b => b.darshan_date === today && !b.is_waitlisted && b.approval_status === 'approved' && b.status !== 'Cancelled');

  const tabs = [
    { id: 'pending', label: 'Pending Approval', count: pending.length, color: '#ffa726' },
    { id: 'confirmed', label: 'Approved', count: confirmed.length, color: '#00c864' },
    { id: 'waitlist', label: 'Waitlist', count: waitlist.length, color: '#f06292' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,167,38,0.15), rgba(255,100,0,0.1))', border: '1px solid rgba(255,167,38,0.25)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Star size={22} style={{ color: '#ffa726' }} fill="#ffa726" />
          <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>Tirupati Darshan Coordination</h2>
        </div>
        <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.7 }}>
          Sri Venkateswara Swamy Devasthanam — MP Quota. Staff registers requests; only the politician can approve. SMS confirmation sent to pilgrim on approval.
        </p>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: todayBooked ? 'rgba(255,85,85,0.1)' : 'rgba(0,200,100,0.1)', border: `1px solid ${todayBooked ? 'rgba(255,85,85,0.25)' : 'rgba(0,200,100,0.25)'}` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: todayBooked ? '#ff5555' : '#00c864' }} />
            <span style={{ fontSize: 12, color: todayBooked ? '#ff5555' : '#00c864', fontWeight: 600 }}>
              Today: {todayBooked ? 'Slot Filled' : 'Slot Available'}
            </span>
          </div>
          {pending.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,167,38,0.1)', border: '1px solid rgba(255,167,38,0.25)' }}>
              <Bell size={12} style={{ color: '#ffa726' }} />
              <span style={{ fontSize: 12, color: '#ffa726', fontWeight: 600 }}>{pending.length} request{pending.length > 1 ? 's' : ''} awaiting your approval</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(240,98,146,0.08)', border: '1px solid rgba(240,98,146,0.2)' }}>
            <Lock size={12} style={{ color: '#f06292' }} />
            <span style={{ fontSize: 12, color: '#f06292', fontWeight: 600 }}>Approval-gated • No money collected</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Clock, label: 'Pending Approval', value: pending.length, color: '#ffa726' },
          { icon: CheckCircle, label: 'Approved', value: confirmed.length, color: '#00c864' },
          { icon: Users, label: 'Total Pilgrims', value: confirmed.reduce((s, b) => s + b.group_size, 0), color: '#00d4aa' },
          { icon: ListOrdered, label: 'Waitlisted', value: waitlist.length, color: '#f06292' },
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

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'pending' | 'confirmed' | 'waitlist')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: tab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.05)',
                color: tab === t.id ? t.color : '#8899bb',
                border: `1px solid ${tab === t.id ? `${t.color}40` : 'rgba(255,255,255,0.08)'}`,
              }}>
              {t.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: tab === t.id ? `${t.color}25` : 'rgba(255,255,255,0.08)', color: tab === t.id ? t.color : '#6677aa' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="bg-transparent text-sm border-none outline-none text-white placeholder-gray-500 w-44"
              placeholder="Search name, contact..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'pending' && (
          <motion.div key="pending" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {pending.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <CheckCircle size={40} style={{ color: '#00c864', margin: '0 auto 12px' }} />
                <p style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No Pending Requests</p>
                <p style={{ color: '#8899bb', fontSize: 13 }}>All requests have been reviewed. New requests from staff will appear here for your approval.</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl flex items-start gap-3"
                  style={{ background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.2)' }}>
                  <Lock size={15} style={{ color: '#ffa726', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.7 }}>
                    These requests were submitted by office staff and are awaiting your personal approval. On approval, an SMS is automatically sent to the pilgrim with the darshan confirmation and contact details.
                  </p>
                </div>
                {pending.map((b, i) => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,167,38,0.12)', border: '1px solid rgba(255,167,38,0.2)' }}>
                          <Star size={20} style={{ color: '#ffa726' }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{b.pilgrim_name}</span>
                            <span style={{ fontSize: 11, color: '#00d4aa', fontFamily: 'monospace' }}>{b.booking_number}</span>
                            {b.promoted_from_waitlist && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(240,98,146,0.15)', color: '#f06292' }}>Promoted from Waitlist</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            <span style={{ fontSize: 13, color: '#8899bb' }}>{b.pilgrim_contact}</span>
                            {b.mandal && <span style={{ fontSize: 13, color: '#8899bb' }}>{b.mandal}{b.village ? ` • ${b.village}` : ''}</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} style={{ color: '#ffa726' }} />
                              <span style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 600 }}>
                                {new Date(b.darshan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <span style={{ fontSize: 12, color: '#8899bb' }}>{b.darshan_type}</span>
                            <span style={{ fontSize: 12, color: '#8899bb' }}>Group: {b.group_size}</span>
                          </div>
                          {b.special_requests && (
                            <div className="mt-2 text-xs px-2 py-1 rounded-lg inline-block" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                              {b.special_requests}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setApprovalTarget(b)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                          style={{ background: 'linear-gradient(135deg, rgba(0,200,100,0.2), rgba(0,212,170,0.15))', color: '#00c864', border: '1px solid rgba(0,200,100,0.3)' }}>
                          <ThumbsUp size={14} /> Review & Approve
                        </button>
                        {confirmDelete === b.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteBooking(b.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={13} /></button>
                            <button onClick={() => setConfirmDelete(null)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={13} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(b.id)} className="p-2 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}

        {tab === 'confirmed' && (
          <motion.div key="confirmed" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['Booking', 'Pilgrim', 'Date', 'Type', 'Mandal/Village', 'Group', 'SMS', 'Approved By', 'Cooldown Until', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>{Array(11).fill(0).map((_, j) => (<td key={j} style={{ padding: '12px 14px' }}><div className="shimmer h-4 rounded w-16" /></td>))}</tr>
                  )) : confirmed.map((b, i) => (
                    <motion.tr key={b.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600, fontFamily: 'monospace' }}>{b.booking_number}</div>
                        {b.promoted_from_waitlist && <span style={{ fontSize: 10, color: '#f06292' }}>Promoted</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{b.pilgrim_name}</div>
                        <div style={{ fontSize: 11, color: '#8899bb' }}>{b.pilgrim_contact}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>
                          {new Date(b.darshan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 11, color: '#8899bb' }}>{b.darshan_time}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#f0f4ff' }}>{b.darshan_type?.replace(' Darshan', '')}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {b.mandal && <div style={{ fontSize: 12, color: '#f0f4ff' }}>{b.mandal}</div>}
                        {b.village && <div style={{ fontSize: 11, color: '#8899bb' }}>{b.village}</div>}
                        {!b.mandal && !b.village && <span style={{ color: '#4a5568' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#f0f4ff', textAlign: 'center' }}>{b.group_size}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: b.sms_sent ? 'rgba(0,200,100,0.12)' : 'rgba(255,85,85,0.1)', color: b.sms_sent ? '#00c864' : '#ff5555' }}>
                          {b.sms_sent ? 'Sent' : 'Not Sent'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{b.approved_by || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {b.cooldown_until
                          ? <div style={{ fontSize: 11, color: '#ffa726' }}>{new Date(b.cooldown_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          : <span style={{ color: '#4a5568' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="text-xs px-2 py-1 rounded-lg font-medium"
                          style={{ background: `${STATUS_COLORS[b.status] || '#8899bb'}22`, color: STATUS_COLORS[b.status] || '#8899bb' }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setSelected(b); setModalOpen(true); }} className="p-1.5 rounded-lg" style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5' }}><Edit2 size={13} /></button>
                          {confirmDelete === b.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => deleteBooking(b.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={12} /></button>
                              <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={12} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(b.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {!loading && confirmed.length === 0 && (
                <div className="text-center py-14">
                  <Star size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                  <p style={{ color: '#8899bb', fontSize: 14 }}>No approved bookings yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'waitlist' && (
          <motion.div key="waitlist" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(240,98,146,0.08)', border: '1px solid rgba(240,98,146,0.2)' }}>
              <Info size={15} style={{ color: '#f06292', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.7 }}>
                When promoted, the booking moves to the <strong style={{ color: '#ffa726' }}>Pending Approval</strong> tab for the politician to review before the SMS is sent.
              </p>
            </div>
            {waitlist.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <ListOrdered size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
                <p style={{ color: '#f0f4ff', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Waitlist is Empty</p>
                <p style={{ color: '#8899bb', fontSize: 13 }}>People are added when they apply for a date that is already filled.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {['Position', 'Pilgrim', 'Requested Date', 'Darshan Type', 'Mandal/Village', 'Group', 'Applied On', ''].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.sort((a, b) => (a.waitlist_position || 99) - (b.waitlist_position || 99)).map((b, i) => (
                      <motion.tr key={b.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                            style={{ background: 'rgba(240,98,146,0.15)', color: '#f06292', fontSize: 14, fontFamily: 'Space Grotesk' }}>
                            #{b.waitlist_position || i + 1}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{b.pilgrim_name}</div>
                          <div style={{ fontSize: 11, color: '#8899bb' }}>{b.pilgrim_contact}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>
                            {new Date(b.darshan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 11, color: '#8899bb' }}>{b.darshan_time}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#f0f4ff' }}>{b.darshan_type?.replace(' Darshan', '')}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {b.mandal && <div style={{ fontSize: 12, color: '#f0f4ff' }}>{b.mandal}</div>}
                          {b.village && <div style={{ fontSize: 11, color: '#8899bb' }}>{b.village}</div>}
                          {!b.mandal && !b.village && <span style={{ color: '#4a5568', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#f0f4ff', textAlign: 'center' }}>{b.group_size}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>
                          {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => promoteFromWaitlist(b.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(0,200,100,0.15)', color: '#00c864', border: '1px solid rgba(0,200,100,0.25)' }}>
                              <ArrowUpCircle size={12} /> Promote
                            </button>
                            {confirmDelete === b.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => deleteBooking(b.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}><CheckCircle size={12} /></button>
                                <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}><X size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(b.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555' }}><Trash2 size={13} /></button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <BookingModal booking={selected} onClose={() => { setModalOpen(false); setSelected(null); }} onSave={fetchData} />
        )}
        {approvalTarget && (
          <ApprovalModal booking={approvalTarget} onClose={() => setApprovalTarget(null)} onDone={fetchData} />
        )}
      </AnimatePresence>
    </div>
  );
}
