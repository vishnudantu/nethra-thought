import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle, Loader2, Trash2, Phone, CreditCard, User, MapPin, Calendar, Send, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/auth';

// ── Types ──────────────────────────────────────────────────────
interface Pilgrim {
  id: string;
  full_name: string;
  aadhaar: string;
  phone: string;
  age: string;
  gender: string;
  darshan_type: string;
  address: string;
  validation: 'idle' | 'checking' | 'valid' | 'invalid' | 'error';
  validation_msg: string;
  aadhaar_last4: string;
}

interface Quota { used: number; remaining: number; max: number; date: string; }
interface BookingRecord {
  id: number; booking_ref: string; full_name: string; phone: string;
  aadhaar_last4: string; darshan_type: string; visit_date: string;
  status: string; sms_sent: number; age: number; gender: string;
  letter_date?: string;
}

// ── Constants ──────────────────────────────────────────────────
const DARSHAN_TYPES = ['SSD Darshan', 'VIP Break Darshan', 'Special Entry Darshan', 'Arjitha Seva'];
const BASE = '';
const mkPilgrim = (): Pilgrim => ({
  id: Math.random().toString(36).slice(2),
  full_name: '', aadhaar: '', phone: '', age: '', gender: 'Male',
  darshan_type: 'SSD Darshan', address: '',
  validation: 'idle', validation_msg: '', aadhaar_last4: '',
});
const fmtAadhaar = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 12);
  return d.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
};

// ── Styles ─────────────────────────────────────────────────────
const S = {
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 } as React.CSSProperties,
  label: { fontSize: 10, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 } as React.CSSProperties,
  input: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#f0f4ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  pill: (active: boolean) => ({ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: active ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#00d4aa' : '#8899bb' }) as React.CSSProperties,
  btnPrimary: { background: 'linear-gradient(135deg,#00d4aa,#1e88e5)', border: 'none', borderRadius: 10, padding: '9px 20px', color: '#060b18', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  btnSecondary: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#8899bb', fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
};

// ── Main Component ─────────────────────────────────────────────
export default function Darshan() {
  const { session } = useAuth();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const [quota, setQuota] = useState<Quota>({ used: 0, remaining: 6, max: 6, date: '' });
  const [todayBookings, setTodayBookings] = useState<Record<string, BookingRecord[]>>({});
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([mkPilgrim()]);
  const [visitDate, setVisitDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ref: string; count: number } | null>(null);
  const [selectedRef, setSelectedRef] = useState('');
  const [approvalForm, setApprovalForm] = useState({ contact_person: '', contact_phone: '', pickup_point: 'TTD Ticket Counter, Tirumala', shrine_contacts: '155257' });
  const [approving, setApproving] = useState(false);
  const [approvalMsg, setApprovalMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [validationFeed, setValidationFeed] = useState<{ id: string; text: string; color: string }[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchQuota = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/darshan/quota?date=${today}`, { headers: authH });
      if (r.ok) { const d = await r.json(); setQuota({ used: d.used||0, remaining: d.remaining??6, max: d.max||6, date: d.date||today }); }
    } catch (_) {}
  }, [today]);

  const fetchBookings = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/darshan/bookings?date=${today}`, { headers: authH });
      if (r.ok) {
        const data = await r.json();
        const groups: Record<string, BookingRecord[]> = {};
        (Array.isArray(data) ? data : data.bookings || []).forEach((b: BookingRecord) => {
          if (!b.booking_ref) return;
          if (!groups[b.booking_ref]) groups[b.booking_ref] = [];
          groups[b.booking_ref].push(b);
        });
        setTodayBookings(groups);
      }
    } catch (_) {}
    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchQuota();
    fetchBookings();
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    setVisitDate(tm.toISOString().slice(0, 10));
  }, []);

  function updatePilgrim(id: string, patch: Partial<Pilgrim>) {
    setPilgrims(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  async function validatePilgrim(id: string) {
    const p = pilgrims.find(x => x.id === id);
    if (!p) return;
    const ca = p.aadhaar.replace(/\s/g, '');
    const cp = p.phone.replace(/\D/g, '').slice(-10);
    if (ca.length !== 12 || cp.length !== 10) return;
    if (p.validation === 'checking') return;

    updatePilgrim(id, { validation: 'checking', validation_msg: '' });
    addFeed(id, `Checking Pilgrim ${pilgrims.findIndex(x=>x.id===id)+1}...`, '#64b5f6');

    try {
      const r = await fetch(`${BASE}/api/darshan/validate-pilgrim`, {
        method: 'POST', headers: authH,
        body: JSON.stringify({ aadhaar: ca, phone: cp }),
      });
      const d = await r.json();
      if (d.valid) {
        updatePilgrim(id, { validation: 'valid', validation_msg: 'Eligible for Darshan ✓', aadhaar_last4: d.aadhaar_display?.slice(-4) || ca.slice(-4) });
        addFeed(id, `Pilgrim ${pilgrims.findIndex(x=>x.id===id)+1}${p.full_name?' — '+p.full_name:''} — Eligible ✓`, '#00d4aa');
      } else {
        const msg = d.reason === 'already_visited'
          ? `Not eligible · Last visit: ${d.last_visit} · Next: ${d.next_eligible}`
          : (d.message || 'Not eligible');
        updatePilgrim(id, { validation: 'invalid', validation_msg: msg });
        addFeed(id, `Pilgrim ${pilgrims.findIndex(x=>x.id===id)+1}${p.full_name?' — '+p.full_name:''} — ${msg}`, '#ff5555');
      }
    } catch (_) {
      updatePilgrim(id, { validation: 'error', validation_msg: 'Could not verify — proceed with caution' });
      addFeed(id, `Pilgrim ${pilgrims.findIndex(x=>x.id===id)+1} — Check failed (network error)`, '#ffa726');
    }
  }

  function addFeed(id: string, text: string, color: string) {
    setValidationFeed(f => [{ id: id + Date.now(), text, color }, ...f].slice(0, 10));
  }

  function onAadhaarChange(id: string, v: string) {
    updatePilgrim(id, { aadhaar: fmtAadhaar(v), validation: 'idle', validation_msg: '', aadhaar_last4: '' });
  }

  function onPhoneChange(id: string, v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10);
    updatePilgrim(id, { phone: d, validation: 'idle', validation_msg: '' });
    const p = pilgrims.find(x => x.id === id);
    if (p && p.aadhaar.replace(/\s/g, '').length === 12 && d.length === 10) {
      setTimeout(() => validatePilgrim(id), 400);
    }
  }

  function onAadhaarBlur(id: string) {
    const p = pilgrims.find(x => x.id === id);
    if (p && p.aadhaar.replace(/\s/g, '').length === 12 && p.phone.length === 10) validatePilgrim(id);
  }

  function setCount(n: number) {
    if (n > quota.remaining || n < 1) return;
    setPilgrims(prev => n > prev.length
      ? [...prev, ...Array(n - prev.length).fill(null).map(mkPilgrim)]
      : prev.slice(0, n)
    );
  }

  const allValid = pilgrims.length > 0 && pilgrims.every(p => p.validation === 'valid' || p.validation === 'error');
  const validCount = pilgrims.filter(p => p.validation === 'valid').length;

  async function submitBooking() {
    if (!allValid || !visitDate) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/darshan/bookings`, {
        method: 'POST', headers: authH,
        body: JSON.stringify({
          visit_date: visitDate,
          pilgrims: pilgrims.map(p => ({
            full_name: p.full_name, aadhaar: p.aadhaar.replace(/\s/g, ''),
            phone: p.phone, age: parseInt(p.age) || null,
            gender: p.gender, darshan_type: p.darshan_type, address: p.address,
          })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || 'Booking failed');
      setSubmitResult({ ref: d.booking_ref, count: d.total_pilgrims || pilgrims.length });
      setPilgrims([mkPilgrim()]);
      setValidationFeed([]);
      await fetchQuota();
      await fetchBookings();
    } catch (e: any) { alert('Booking failed: ' + e.message); }
    setSubmitting(false);
  }

  async function approveBooking() {
    if (!selectedRef) return;
    setApproving(true);
    try {
      // Find booking id from the selected ref
      const group = todayBookings[selectedRef];
      const bookingId = group?.[0]?.id;
      const r = await fetch(`${BASE}/api/darshan/bookings/${bookingId}/approve`, {
        method: 'PUT', headers: authH,
        body: JSON.stringify({ approved_by: 'Politician', approval_notes: '', ...approvalForm }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Approval failed');
      setApprovalMsg(`✓ Approved ${group?.length || 0} pilgrims. SMS sent.`);
      setSelectedRef('');
      await fetchBookings();
      setTimeout(() => setApprovalMsg(''), 5000);
    } catch (e: any) { setApprovalMsg('Error: ' + e.message); }
    setApproving(false);
  }

  // Quota ring
  const pct = Math.min((quota.used / quota.max) * 100, 100);
  const qColor = quota.remaining === 0 ? '#ff5555' : quota.remaining <= 2 ? '#ffa726' : '#00d4aa';
  const r = 50, circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 16, height: 'calc(100vh - 80px)', overflow: 'hidden', padding: '0 4px' }}>

      {/* ── COL 1: QUOTA + BOOKINGS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Quota Ring */}
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Daily Quota</div>
          <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 12px' }}>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle cx="55" cy="55" r={r} fill="none" stroke={qColor} strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: qColor, fontFamily: 'Space Grotesk' }}>{quota.remaining}</div>
              <div style={{ fontSize: 9, color: '#8899bb' }}>remaining</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#8899bb' }}>{quota.used} of {quota.max} used today</div>
          {quota.remaining === 0 && (
            <div style={{ marginTop: 8, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', fontSize: 10, color: '#ff7777' }}>Daily limit reached</div>
          )}
        </div>

        {/* Bookings list */}
        <div style={{ ...S.card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>Today's Bookings</span>
            <button onClick={() => { fetchQuota(); fetchBookings(); }} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer', padding: 2 }}><RefreshCw size={12} /></button>
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#8899bb', fontSize: 11 }}>Loading...</div>
            ) : Object.keys(todayBookings).length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Star size={24} style={{ margin: '0 auto 8px', color: '#8899bb', opacity: 0.3 }} />
                <div style={{ fontSize: 11, color: '#8899bb' }}>No bookings today</div>
              </div>
            ) : Object.entries(todayBookings).map(([ref, group]) => {
              const status = group[0]?.status || 'pending';
              const isExp = expandedRef === ref;
              return (
                <div key={ref} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <button onClick={() => setExpandedRef(isExp ? null : ref)}
                    style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#f0f4ff', fontFamily: 'monospace' }}>{ref}</div>
                        <div style={{ fontSize: 9, color: '#8899bb', marginTop: 2 }}>{group.length} pilgrim{group.length > 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 100, fontWeight: 700, background: status === 'approved' ? 'rgba(0,200,100,0.12)' : 'rgba(255,167,38,0.12)', color: status === 'approved' ? '#00c864' : '#ffa726' }}>
                          {status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                        {isExp ? <ChevronUp size={11} style={{ color: '#8899bb' }} /> : <ChevronDown size={11} style={{ color: '#8899bb' }} />}
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div style={{ padding: '0 14px 10px' }}>
                      {group.map((p, i) => (
                        <div key={i} style={{ padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontSize: 11, color: '#f0f4ff', fontWeight: 600 }}>{p.full_name}</div>
                          <div style={{ fontSize: 9, color: '#8899bb' }}>****{p.aadhaar_last4} · {p.darshan_type}</div>
                          {p.sms_sent ? <div style={{ fontSize: 9, color: '#00c864' }}>✓ SMS sent</div> : null}
                        </div>
                      ))}
                      {status !== 'approved' && (
                        <button onClick={() => { setSelectedRef(ref); setExpandedRef(null); }}
                          style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 8, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                          Approve & Send SMS →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── COL 2: BOOKING CANVAS ── */}
      <div style={{ overflow: 'auto', paddingRight: 4 }}>
        {/* Success */}
        {submitResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ ...S.card, textAlign: 'center', marginBottom: 14, border: '1px solid rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.04)' }}>
            <CheckCircle2 size={36} style={{ color: '#00d4aa', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', marginBottom: 4 }}>Booking Submitted!</div>
            <div style={{ fontSize: 13, color: '#00d4aa', fontFamily: 'monospace', marginBottom: 6 }}>{submitResult.ref}</div>
            <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 14 }}>{submitResult.count} pilgrim{submitResult.count > 1 ? 's' : ''} added · Awaiting approval</div>
            <button onClick={() => setSubmitResult(null)} style={S.btnPrimary}>Book More</button>
          </motion.div>
        )}

        {!submitResult && (
          <>
            <div style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 3 }}>New Darshan Booking</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>Max {quota.remaining} slot{quota.remaining !== 1 ? 's' : ''} available today</div>
            </div>

            {/* Count selector */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <label style={S.label}>Number of Pilgrims</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5,6].map(n => {
                  const disabled = n > quota.remaining;
                  const sel = pilgrims.length === n;
                  return (
                    <button key={n} onClick={() => !disabled && setCount(n)} disabled={disabled}
                      style={{ width: 42, height: 42, borderRadius: 10, fontWeight: 800, fontSize: 15, fontFamily: 'Space Grotesk', cursor: disabled ? 'not-allowed' : 'pointer', background: sel ? 'linear-gradient(135deg,#00d4aa,#1e88e5)' : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', color: sel ? '#060b18' : disabled ? 'rgba(136,153,187,0.25)' : '#f0f4ff', border: sel ? 'none' : '1px solid rgba(255,255,255,0.08)', transition: 'all 0.15s' }}>
                      {n}
                    </button>
                  );
                })}
              </div>
              {quota.remaining === 0 && <div style={{ fontSize: 10, color: '#ff5555', marginTop: 8 }}>Daily limit reached</div>}
            </div>

            {/* Visit date */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={9} />VISIT DATE
              </label>
              <input type="date" value={visitDate} min={today}
                onChange={e => setVisitDate(e.target.value)} style={S.input} />
            </div>

            {/* Pilgrim cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pilgrims.map((p, i) => {
                const vBorder = p.validation === 'valid' ? 'rgba(0,212,170,0.4)' : p.validation === 'invalid' ? 'rgba(255,85,85,0.4)' : p.validation === 'checking' ? 'rgba(30,136,229,0.4)' : p.validation === 'error' ? 'rgba(255,167,38,0.4)' : 'rgba(255,255,255,0.08)';
                const vBg = p.validation === 'valid' ? 'rgba(0,212,170,0.02)' : p.validation === 'invalid' ? 'rgba(255,85,85,0.02)' : 'rgba(255,255,255,0.04)';
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ background: vBg, border: `1px solid ${vBorder}`, borderRadius: 16, padding: 18, transition: 'border-color 0.3s,background 0.3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.5 }}>PILGRIM {i + 1}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.validation === 'checking' && <Loader2 size={13} style={{ color: '#1e88e5', animation: 'spin 1s linear infinite' }} />}
                        {p.validation === 'valid' && <CheckCircle2 size={13} style={{ color: '#00d4aa' }} />}
                        {p.validation === 'invalid' && <XCircle size={13} style={{ color: '#ff5555' }} />}
                        {p.validation === 'error' && <AlertTriangle size={13} style={{ color: '#ffa726' }} />}
                        {pilgrims.length > 1 && (
                          <button onClick={() => setPilgrims(prev => { const n = prev.filter(x => x.id !== p.id); return n.length ? n : [mkPilgrim()]; })}
                            style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer', padding: 2 }}><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}><User size={9} style={{ display: 'inline', marginRight: 4 }} />FULL NAME *</label>
                        <input value={p.full_name} onChange={e => updatePilgrim(p.id, { full_name: e.target.value })} placeholder="As on Aadhaar card" style={S.input} />
                      </div>
                      <div>
                        <label style={S.label}><CreditCard size={9} style={{ display: 'inline', marginRight: 4 }} />AADHAAR NUMBER *</label>
                        <input value={p.aadhaar} onChange={e => onAadhaarChange(p.id, e.target.value)} onBlur={() => onAadhaarBlur(p.id)} placeholder="0000 0000 0000" maxLength={14}
                          style={{ ...S.input, fontFamily: 'monospace', letterSpacing: 2 }} />
                      </div>
                      <div>
                        <label style={S.label}><Phone size={9} style={{ display: 'inline', marginRight: 4 }} />MOBILE NUMBER *</label>
                        <input value={p.phone} onChange={e => onPhoneChange(p.id, e.target.value)} placeholder="10-digit number" maxLength={10} type="tel" style={S.input} />
                      </div>
                      <div>
                        <label style={S.label}>AGE</label>
                        <input value={p.age} onChange={e => updatePilgrim(p.id, { age: e.target.value })} placeholder="Age" type="number" min="1" max="120" style={S.input} />
                      </div>
                      <div>
                        <label style={S.label}>GENDER</label>
                        <select value={p.gender} onChange={e => updatePilgrim(p.id, { gender: e.target.value })}
                          style={{ ...S.input, appearance: 'none' }}>
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}>DARSHAN TYPE *</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {DARSHAN_TYPES.map(t => (
                            <button key={t} onClick={() => updatePilgrim(p.id, { darshan_type: t })} style={S.pill(p.darshan_type === t)}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}><MapPin size={9} style={{ display: 'inline', marginRight: 4 }} />ADDRESS (OPTIONAL)</label>
                        <input value={p.address} onChange={e => updatePilgrim(p.id, { address: e.target.value })} placeholder="Village, Mandal, District" style={S.input} />
                      </div>
                    </div>

                    {p.validation !== 'idle' && (
                      <div style={{ marginTop: 10, padding: '7px 12px', borderRadius: 8, fontSize: 11,
                        background: p.validation === 'valid' ? 'rgba(0,212,170,0.08)' : p.validation === 'invalid' ? 'rgba(255,85,85,0.08)' : p.validation === 'checking' ? 'rgba(30,136,229,0.08)' : 'rgba(255,167,38,0.08)',
                        color: p.validation === 'valid' ? '#00d4aa' : p.validation === 'invalid' ? '#ff7777' : p.validation === 'checking' ? '#64b5f6' : '#ffa726' }}>
                        {p.validation === 'checking' ? '⚡ Verifying eligibility...' : p.validation === 'valid' ? '✓ ' + p.validation_msg : p.validation === 'invalid' ? '✗ ' + p.validation_msg : '⚠ ' + p.validation_msg}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Submit bar */}
            <AnimatePresence>
              {pilgrims.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                  style={{ ...S.card, marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, border: allValid && visitDate ? '1px solid rgba(0,212,170,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>
                      {allValid ? `✓ ${validCount} of ${pilgrims.length} validated` : `${validCount} of ${pilgrims.length} validated`}
                    </div>
                    {!visitDate && <div style={{ fontSize: 10, color: '#ffa726', marginTop: 2 }}>Select visit date</div>}
                    {pilgrims.some(p => p.validation === 'invalid') && <div style={{ fontSize: 10, color: '#ff7777', marginTop: 2 }}>Some pilgrims are not eligible</div>}
                  </div>
                  <button onClick={submitBooking} disabled={!allValid || !visitDate || submitting || quota.remaining === 0}
                    style={{ ...S.btnPrimary, opacity: (!allValid || !visitDate || quota.remaining === 0) ? 0.4 : 1 }}>
                    {submitting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Submitting...</> : <><Send size={13} />Submit for Approval</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ── COL 3: VALIDATION FEED + APPROVAL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>
            {selectedRef ? 'Approve Booking' : 'Validation Feed'}
          </div>
          <div style={{ fontSize: 10, color: '#8899bb' }}>
            {selectedRef ? `Ref: ${selectedRef}` : 'Live eligibility check results'}
          </div>
        </div>

        {approvalMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '10px 14px', borderRadius: 10, background: approvalMsg.includes('Error') ? 'rgba(255,85,85,0.1)' : 'rgba(0,212,170,0.1)', border: `1px solid ${approvalMsg.includes('Error') ? 'rgba(255,85,85,0.2)' : 'rgba(0,212,170,0.2)'}`, fontSize: 12, color: approvalMsg.includes('Error') ? '#ff7777' : '#00d4aa' }}>
            {approvalMsg}
          </motion.div>
        )}

        {/* Approval Panel */}
        {selectedRef ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ ...S.card, border: '1px solid rgba(0,212,170,0.2)' }}>
            <div style={{ marginBottom: 14 }}>
              {(todayBookings[selectedRef] || []).map((p, i) => (
                <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 }}>
                  <div style={{ color: '#f0f4ff', fontWeight: 600 }}>{p.full_name}</div>
                  <div style={{ color: '#8899bb', fontSize: 10 }}>{p.darshan_type} · ****{p.aadhaar_last4}</div>
                </div>
              ))}
            </div>

            {[
              { k: 'contact_person', l: 'CONTACT PERSON *', ph: 'Name' },
              { k: 'contact_phone', l: 'CONTACT PHONE *', ph: '10-digit number' },
              { k: 'pickup_point', l: 'PICKUP POINT *', ph: 'TTD office location' },
              { k: 'shrine_contacts', l: 'SHRINE HELPLINE', ph: '155257' },
            ].map(({ k, l, ph }) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={S.label}>{l}</label>
                <input value={(approvalForm as any)[k]} onChange={e => setApprovalForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={ph} style={S.input} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setSelectedRef('')} style={S.btnSecondary}>Cancel</button>
              <button onClick={approveBooking}
                disabled={approving || !approvalForm.contact_person || !approvalForm.pickup_point}
                style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center', opacity: approving ? 0.7 : 1 }}>
                {approving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Sending...</> : <><Send size={13} />Approve & SMS</>}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Validation feed */
          <div style={{ ...S.card, flex: 1 }}>
            {validationFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Star size={22} style={{ color: '#8899bb', opacity: 0.3, margin: '0 auto 8px' }} />
                <div style={{ fontSize: 10, color: '#8899bb' }}>Fill pilgrim details to see validation results</div>
              </div>
            ) : (
              validationFeed.map(f => (
                <motion.div key={f.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: f.color, marginRight: 8, flexShrink: 0 }} />
                  <span style={{ color: '#d0d8ee' }}>{f.text}</span>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
