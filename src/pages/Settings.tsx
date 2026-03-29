import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Database, Key, LogOut, ChevronRight, Zap, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-10 h-6 rounded-full transition-all duration-300 flex-shrink-0"
      style={{ background: enabled ? 'rgba(0,212,170,0.5)' : 'rgba(255,255,255,0.1)' }}
    >
      <motion.div
        animate={{ x: enabled ? 16 : 2 }}
        transition={{ duration: 0.2 }}
        className="absolute top-1 w-4 h-4 rounded-full"
        style={{ background: enabled ? '#00d4aa' : '#8899bb' }}
      />
    </button>
  );
}

export default function Settings() {
  const { activePolitician, user, signOut } = useAuth();
  const { language, setLanguage, languages } = useI18n();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    urgentGrievances: true,
    newMedia: true,
    eventReminders: true,
    financeUpdates: false,
    projectMilestones: true,
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    loginNotifications: true,
  });

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';
  const initials = activePolitician?.full_name
    ? activePolitician.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'NA';

  function handleSignOut() {
    signOut();
    window.location.href = '/';
  }

  useEffect(() => {
    if (user?.two_factor_enabled !== undefined) {
      setSecurity(s => ({ ...s, twoFactor: !!user.two_factor_enabled }));
    }
  }, [user?.two_factor_enabled]);

  async function handleToggle2fa(enabled: boolean) {
    setSecurity(s => ({ ...s, twoFactor: enabled }));
    try {
      await api.post('/api/auth/2fa/toggle', { enabled });
    } catch {
      setSecurity(s => ({ ...s, twoFactor: !enabled }));
    }
  }

  async function handleSaveNotifications() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500)); // simulate save
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/api/auth/change-password', {
        current_password: passwordForm.current,
        new_password: passwordForm.newPass,
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(message);
    }
    setChangingPassword(false);
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#060b18' }}>
          {initials}
        </div>
        <div>
          <div className="font-bold text-lg" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
            {activePolitician?.full_name || 'Loading...'}
          </div>
          <div style={{ fontSize: 13, color: '#8899bb' }}>
            {activePolitician?.designation || ''} • {activePolitician?.constituency_name || ''}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: primaryColor }} />
            <span style={{ fontSize: 11, color: primaryColor }}>Active Session</span>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#42a5f520' }}>
            <User size={16} style={{ color: '#42a5f5' }} />
          </div>
          <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Space Grotesk' }}>Profile Settings</h3>
        </div>
        <div className="p-2">
          {[
            { label: 'Display Name', value: activePolitician?.display_name || activePolitician?.full_name || '—' },
            { label: 'Constituency', value: activePolitician?.constituency_name ? `${activePolitician.constituency_name}, ${activePolitician.state}` : '—' },
            { label: 'Party', value: activePolitician?.party || '—' },
            { label: 'Designation', value: activePolitician?.designation || '—' },
            { label: 'Login Email', value: user?.email || '—' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 13, color: '#f0f4ff' }}>{item.label}</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, color: '#8899bb' }}>{item.value}</span>
                <ChevronRight size={14} style={{ color: '#8899bb' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#ffa72620' }}>
              <Bell size={16} style={{ color: '#ffa726' }} />
            </div>
            <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Space Grotesk' }}>Notifications</h3>
          </div>
          <button onClick={handleSaveNotifications} disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            style={{ background: saved ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.08)', color: saved ? '#00d4aa' : '#8899bb' }}>
            {saved ? <><Check size={11} /> Saved</> : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="p-2">
          {[
            { label: 'Urgent Grievances Alert', key: 'urgentGrievances' },
            { label: 'New Media Mentions', key: 'newMedia' },
            { label: 'Event Reminders', key: 'eventReminders' },
            { label: 'Finance Updates', key: 'financeUpdates' },
            { label: 'Project Milestones', key: 'projectMilestones' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded-xl"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 13, color: '#f0f4ff' }}>{item.label}</span>
              <ToggleSwitch
                enabled={notifications[item.key as keyof typeof notifications]}
                onChange={v => setNotifications(n => ({ ...n, [item.key]: v }))}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#00c86420' }}>
            <Shield size={16} style={{ color: '#00c864' }} />
          </div>
          <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Space Grotesk' }}>Security</h3>
        </div>
        <div className="p-2">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ fontSize: 13, color: '#f0f4ff' }}>Login Notifications</span>
            <ToggleSwitch enabled={security.loginNotifications} onChange={v => setSecurity(s => ({ ...s, loginNotifications: v }))} />
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ fontSize: 13, color: '#f0f4ff' }}>Two-Factor Authentication (Email OTP)</span>
            <ToggleSwitch enabled={security.twoFactor} onChange={handleToggle2fa} />
          </div>
          <div className="px-4 py-3">
            <button onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center gap-2 text-sm transition-all"
              style={{ color: primaryColor, fontWeight: 600 }}>
              <Key size={14} /> Change Password
            </button>
            {showPasswordForm && (
              <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                onSubmit={handleChangePassword} className="mt-3 space-y-3">
                {passwordError && <div style={{ fontSize: 12, color: '#ff7777' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ fontSize: 12, color: '#00d4aa' }}>{passwordSuccess}</div>}
                {[
                  { label: 'Current Password', key: 'current' },
                  { label: 'New Password', key: 'newPass' },
                  { label: 'Confirm New Password', key: 'confirm' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input type="password" value={passwordForm[f.key as keyof typeof passwordForm]}
                      onChange={e => setPasswordForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 13, outline: 'none' }} />
                  </div>
                ))}
                <button type="submit" disabled={changingPassword}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#060b18', border: 'none', cursor: 'pointer' }}>
                  {changingPassword ? 'Changing...' : 'Update Password'}
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#00d4aa20' }}>
            <Palette size={16} style={{ color: '#00d4aa' }} />
          </div>
          <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Space Grotesk' }}>Appearance</h3>
        </div>
        <div className="p-2">
          {[
            { label: 'Theme', value: 'Dark' },
            { label: 'Date Format', value: 'DD/MM/YYYY' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 13, color: '#f0f4ff' }}>{item.label}</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, color: '#8899bb' }}>{item.value}</span>
                <ChevronRight size={14} style={{ color: '#8899bb' }} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ fontSize: 13, color: '#f0f4ff' }}>Language</span>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as typeof language)}
              className="rounded-lg px-2 py-1.5 text-xs"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
            >
              {languages.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold mb-3" style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Space Grotesk' }}>System Info</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Version', value: 'NETHRA v2.0.0', icon: Zap },
            { label: 'Database', value: 'MySQL (Self-hosted)', icon: Database },
            { label: 'Security', value: 'JWT + bcrypt', icon: Key },
            { label: 'Region', value: 'Singapore VPS', icon: Globe },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Icon size={14} style={{ color: '#8899bb' }} />
                <div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>{item.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#f0f4ff' }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff5555', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,85,85,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,85,85,0.08)')}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </motion.div>

    </div>
  );
}
