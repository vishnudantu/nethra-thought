import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Eye, EyeOff, Copy, CheckCheck, Shield, UserCheck, AlertCircle, X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface StaffUser {
  id: string;
  email: string;
  role: string;
  politician_id: string;
  is_active: number;
  created_at: string;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function StaffManagement() {
  const { activePolitician, userRole } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';
  const isSuperAdmin = userRole?.role === 'super_admin';

  useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/users');
      setStaff((data || []).filter((u: StaffUser) => u.role === 'staff'));
    } catch (e) {
      setStaff([]);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/api/admin/users', {
        email: form.email,
        password: form.password,
        role: 'staff',
        politician_id: activePolitician?.id,
      });
      setSuccess(`Staff account created: ${form.email}`);
      setForm({ email: '', password: '' });
      setShowForm(false);
      await fetchStaff();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/users/${id}`);
      setStaff(prev => prev.filter(s => s.id !== id));
      setConfirmDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate account');
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
            Staff Management
          </h2>
          <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>
            Create and manage login accounts for your constituency office staff
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); setForm({ email: '', password: generatePassword() }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#060b18', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Access Info */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
        <div className="flex items-start gap-3">
          <Shield size={16} style={{ color: primaryColor, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>Staff Access Level</div>
            <div style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.6 }}>
              Staff can <strong style={{ color: '#f0f4ff' }}>add and edit</strong> records across all modules except Finance and Voter Database.
              Staff <strong style={{ color: '#f0f4ff' }}>cannot delete</strong> any records. Only you (politician admin) can delete data.
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error messages */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>
          <CheckCheck size={15} />
          <span style={{ fontSize: 13 }}>{success}</span>
        </motion.div>
      )}

      {/* Create Staff Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between p-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14 }}>Create Staff Login</h3>
              <button onClick={() => setShowForm(false)} style={{ color: '#8899bb' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777', fontSize: 13 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', display: 'block', marginBottom: 6 }}>
                  Staff Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="staff@example.com"
                  className="w-full px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', display: 'block', marginBottom: 6 }}>
                  Password *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 8 characters"
                      className="w-full px-4 py-2.5 rounded-xl pr-10"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#8899bb' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#8899bb', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <RefreshCw size={12} /> Generate
                  </button>
                  <button type="button"
                    onClick={() => copyToClipboard(form.password, 'new-pwd')}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.08)', color: copied === 'new-pwd' ? primaryColor : '#8899bb', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {copied === 'new-pwd' ? <CheckCheck size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>
                  Share these credentials securely with the staff member. Ask them to change password after first login.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: saving ? 'rgba(0,212,170,0.4)' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#060b18', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Creating...' : 'Create Staff Account'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${primaryColor}20` }}>
              <Users size={16} style={{ color: primaryColor }} />
            </div>
            <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Space Grotesk' }}>
              Your Staff ({staff.length})
            </h3>
          </div>
          <button onClick={fetchStaff} style={{ color: '#8899bb' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: '#8899bb', fontSize: 13 }}>Loading...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck size={36} className="mx-auto mb-3" style={{ color: 'rgba(136,153,187,0.3)' }} />
            <p style={{ color: '#8899bb', fontSize: 13 }}>No staff accounts yet.</p>
            <p style={{ color: 'rgba(136,153,187,0.5)', fontSize: 12, marginTop: 4 }}>
              Click "Add Staff" to create login credentials for your team.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {staff.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${primaryColor}15`, color: primaryColor }}>
                  <UserCheck size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate" style={{ color: '#f0f4ff', fontSize: 13 }}>{u.email}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                      style={{ background: 'rgba(0,212,170,0.12)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.2)' }}>
                      Staff
                    </span>
                    {!u.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(255,85,85,0.12)', color: '#ff5555' }}>Deactivated</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>
                    Created {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => copyToClipboard(u.email, u.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)', color: copied === u.id ? primaryColor : '#8899bb' }}
                    title="Copy email">
                    {copied === u.id ? <CheckCheck size={13} /> : <Copy size={13} />}
                  </button>
                  {confirmDelete === u.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(u.id)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555' }}>Confirm</button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(u.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,85,85,0.08)', color: '#ff5555' }}
                      title="Deactivate account">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
