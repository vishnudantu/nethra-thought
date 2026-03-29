import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Phone, Mail, Globe, Twitter, Facebook, Instagram, Youtube, CreditCard as Edit3, Save, X, Plus, Trash2, ChevronDown, ChevronUp, Award, BookOpen, Calendar, TrendingUp, Users, Map, Building, BarChart3, Shield, AlertTriangle, CheckCircle, Camera, Star, Layers } from 'lucide-react';
import { api } from '../lib/api';

interface PoliticianProfile {
  id: string;
  full_name: string;
  display_name: string;
  photo_url: string;
  party: string;
  designation: string;
  constituency_name: string;
  state: string;
  lok_sabha_seat: string;
  bio: string;
  phone: string;
  email: string;
  office_address: string;
  website: string;
  twitter_handle: string;
  facebook_url: string;
  instagram_handle: string;
  youtube_channel: string;
  education: string;
  dob: string | null;
  age: number | null;
  languages: string[];
  achievements: string[];
  role: string;
  is_active: boolean;
  term_start: string | null;
  term_end: string | null;
  previous_terms: number;
  election_year: number | null;
  winning_margin: number | null;
  vote_count: number | null;
  total_votes_polled: number | null;
  created_at: string;
  updated_at: string;
}

interface ConstituencyProfile {
  id: string;
  politician_id: string;
  constituency_name: string;
  state: string;
  district: string;
  lok_sabha_number: string;
  total_voters: number;
  registered_voters: number;
  area_sqkm: number;
  population: number;
  total_mandals: number;
  total_villages: number;
  total_booths: number;
  urban_population_pct: number;
  rural_population_pct: number;
  literacy_rate: number;
  sex_ratio: number;
  key_facts: { label: string; value: string; detail: string }[];
  key_industries: { name: string; desc: string }[];
  revenue_divisions: string[];
  assembly_segments: string[];
  notes: string;
}

interface CasteDemographic {
  id: string;
  constituency_profile_id: string;
  caste_name: string;
  caste_category: string;
  population_count: number;
  population_pct: number;
  voter_count: number;
  voter_pct: number;
  support_level: number;
  dominant_party: string;
  swing_potential: string;
  key_leaders: string[];
  notes: string;
  sort_order: number;
}

const TABS = ['Profile', 'Constituency', 'Caste Demographics', 'Election Stats'];

const PARTY_COLORS: Record<string, string> = {
  'TDP': '#fbbf24',
  'YSRCP': '#1d4ed8',
  'BJP': '#f97316',
  'Congress': '#22c55e',
  'JSP': '#8b5cf6',
  'BSP': '#3b82f6',
  'Other': '#6b7280',
};

const CATEGORY_COLORS: Record<string, string> = {
  'SC': '#42a5f5',
  'ST': '#ffa726',
  'OBC': '#00c864',
  'General': '#00d4aa',
  'Minority': '#f06292',
  'Other': '#8899bb',
};

const SWING_COLORS: Record<string, string> = {
  'Safe': '#00c864',
  'Leaning': '#ffa726',
  'Swing': '#ef5350',
  'Risky': '#b71c1c',
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState(0);
  const [profiles, setProfiles] = useState<PoliticianProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PoliticianProfile | null>(null);
  const [constProfile, setConstProfile] = useState<ConstituencyProfile | null>(null);
  const [casteDemographics, setCasteDemographics] = useState<CasteDemographic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingConst, setEditingConst] = useState(false);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [showCasteModal, setShowCasteModal] = useState(false);
  const [editingCaste, setEditingCaste] = useState<CasteDemographic | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<PoliticianProfile>>({});
  const [constForm, setConstForm] = useState<Partial<ConstituencyProfile>>({});
  const [casteForm, setCasteForm] = useState<Partial<CasteDemographic>>({});
  const [newLanguage, setNewLanguage] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const data = await api.list('politician_profiles', { order: 'created_at', dir: 'ASC' });
    if (data && data.length > 0) {
      setProfiles(data);
      setSelectedProfile(data[0]);
      setProfileForm(data[0]);
      await fetchConstituency(data[0].id);
    }
    setLoading(false);
  }

  async function fetchConstituency(politicianId: string) {
    const allConst = await api.list('constituency_profiles');
    const data = allConst.find((cp: any) => cp.politician_id === politicianId) || null;
    setConstProfile(data);
    setConstForm(data || {});
    if (data) await fetchCasteDemographics(data.id);
    else setCasteDemographics([]);
  }

  async function fetchCasteDemographics(constProfileId: string) {
    const allCaste = await api.list('caste_demographics');
    const data = allCaste.filter((cd: any) => cd.constituency_profile_id === constProfileId);
    setCasteDemographics(data || []);
  }

  async function saveProfile() {
    setSaving(true);
    if (selectedProfile?.id) {
      await api.update('politician_profiles', selectedProfile.id, { ...profileForm, updated_at: new Date().toISOString() });
      const updated = { ...selectedProfile, ...profileForm };
      setSelectedProfile(updated as PoliticianProfile);
      setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? updated as PoliticianProfile : p));
    }
    setSaving(false);
    setEditingProfile(false);
  }

  async function saveConstituency() {
    setSaving(true);
    if (constProfile?.id) {
      await api.update('constituency_profiles', constProfile.id, { ...constForm, updated_at: new Date().toISOString() });
      setConstProfile({ ...constProfile, ...constForm } as ConstituencyProfile);
    } else if (selectedProfile?.id) {
      const data = await api.create('constituency_profiles', { ...constForm, politician_id: selectedProfile.id });
      setConstProfile(data);
    }
    setSaving(false);
    setEditingConst(false);
  }

  async function createProfile() {
    setSaving(true);
    const data = await api.create('politician_profiles', { ...profileForm, role: 'politician', is_active: true });
    if (data) {
      setProfiles(prev => [...prev, data]);
      setSelectedProfile(data);
      setProfileForm(data);
      setConstProfile(null);
      setCasteDemographics([]);
    }
    setSaving(false);
    setShowNewProfile(false);
  }

  async function saveCaste() {
    setSaving(true);
    if (editingCaste?.id) {
      await api.update('caste_demographics', editingCaste.id, casteForm);
    } else if (constProfile?.id) {
      await api.create('caste_demographics', { ...casteForm, constituency_profile_id: constProfile.id, sort_order: casteDemographics.length });
    }
    await fetchCasteDemographics(constProfile!.id);
    setSaving(false);
    setShowCasteModal(false);
    setEditingCaste(null);
    setCasteForm({});
  }

  async function deleteCaste(id: string) {
    await api.remove('caste_demographics', id);
    setCasteDemographics(prev => prev.filter(c => c.id !== id));
  }

  function openCasteEdit(caste?: CasteDemographic) {
    setEditingCaste(caste || null);
    setCasteForm(caste || { caste_category: 'OBC', support_level: 3.0, swing_potential: 'Low' });
    setShowCasteModal(true);
  }

  function selectProfile(profile: PoliticianProfile) {
    setSelectedProfile(profile);
    setProfileForm(profile);
    setEditingProfile(false);
    fetchConstituency(profile.id);
  }

  const totalCastePct = casteDemographics.reduce((s, c) => s + (c.population_pct || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            Politician Profiles
          </h1>
          <p style={{ color: '#8899bb', fontSize: 13, marginTop: 2 }}>
            Manage politician profiles, constituency data, and demographic analytics
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => {
          setProfileForm({ role: 'politician', is_active: true, languages: [], achievements: [] });
          setShowNewProfile(true);
        }}>
          <Plus size={16} />
          New Profile
        </button>
      </motion.div>

      {/* Profile selector strip */}
      {profiles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 flex-wrap">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: selectedProfile?.id === profile.id
                  ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedProfile?.id === profile.id ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(0,212,170,0.18)', color: '#00d4aa' }}>
                {profile.display_name?.charAt(0) || profile.full_name?.charAt(0) || 'P'}
              </div>
              <div className="text-left">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{profile.full_name}</div>
                <div style={{ fontSize: 11, color: '#8899bb' }}>{profile.constituency_name} • {profile.party}</div>
              </div>
              {selectedProfile?.id === profile.id && (
                <CheckCircle size={14} style={{ color: '#00d4aa' }} />
              )}
            </button>
          ))}
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card rounded-2xl p-6 shimmer h-32" />)}
        </div>
      ) : selectedProfile ? (
        <>
          {/* Hero card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden">
            <div className="h-24 relative" style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.15) 0%, rgba(66,165,245,0.1) 50%, rgba(255,167,38,0.08) 100%)'
            }}>
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.01) 10px, rgba(255,255,255,0.01) 20px)'
              }} />
            </div>
            <div className="px-6 pb-6 -mt-10 flex items-end justify-between flex-wrap gap-4">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black border-4"
                  style={{ background: 'rgba(0,212,170,0.15)', borderColor: '#0f1629', color: '#00d4aa', fontFamily: 'Space Grotesk' }}>
                  {selectedProfile.photo_url ? (
                    <img src={selectedProfile.photo_url} alt={selectedProfile.full_name}
                      className="w-full h-full object-cover rounded-2xl" />
                  ) : (selectedProfile.display_name?.charAt(0) || selectedProfile.full_name?.charAt(0) || 'P')}
                </div>
                <div className="pb-1">
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: '#f0f4ff' }}>
                    {selectedProfile.full_name}
                  </h2>
                  <div style={{ color: '#8899bb', fontSize: 13, marginTop: 2 }}>
                    {selectedProfile.designation} • {selectedProfile.party}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      style={{ background: `${PARTY_COLORS[selectedProfile.party] || '#6b7280'}22`, color: PARTY_COLORS[selectedProfile.party] || '#6b7280', border: `1px solid ${PARTY_COLORS[selectedProfile.party] || '#6b7280'}44` }}>
                      {selectedProfile.party}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs"
                      style={{ background: 'rgba(0,200,100,0.1)', color: '#00c864', border: '1px solid rgba(0,200,100,0.2)' }}>
                      {selectedProfile.is_active ? 'Active' : 'Inactive'} • {selectedProfile.constituency_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#8899bb', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {selectedProfile.role === 'admin' ? 'Admin' : selectedProfile.role === 'politician' ? 'Politician' : 'Staff'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setEditingProfile(!editingProfile); setProfileForm(selectedProfile); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: 13 }}>
                <Edit3 size={14} />
                Edit Profile
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTab === i ? 'rgba(0,212,170,0.15)' : 'transparent',
                  color: activeTab === i ? '#00d4aa' : '#8899bb',
                  border: activeTab === i ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
                }}>
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 0 && (
              <ProfileTab
                key="profile"
                profile={selectedProfile}
                form={profileForm}
                editing={editingProfile}
                saving={saving}
                newLanguage={newLanguage}
                newAchievement={newAchievement}
                setNewLanguage={setNewLanguage}
                setNewAchievement={setNewAchievement}
                onChange={(k, v) => setProfileForm(prev => ({ ...prev, [k]: v }))}
                onSave={saveProfile}
                onCancel={() => { setEditingProfile(false); setProfileForm(selectedProfile); }}
              />
            )}
            {activeTab === 1 && (
              <ConstituencyTab
                key="constituency"
                constProfile={constProfile}
                form={constForm}
                editing={editingConst}
                saving={saving}
                onChange={(k, v) => setConstForm(prev => ({ ...prev, [k]: v }))}
                onEdit={() => { setEditingConst(true); setConstForm(constProfile || {}); }}
                onSave={saveConstituency}
                onCancel={() => { setEditingConst(false); setConstForm(constProfile || {}); }}
              />
            )}
            {activeTab === 2 && (
              <CasteDemographicsTab
                key="caste"
                demographics={casteDemographics}
                totalPct={totalCastePct}
                constProfile={constProfile}
                onAdd={() => openCasteEdit()}
                onEdit={openCasteEdit}
                onDelete={deleteCaste}
              />
            )}
            {activeTab === 3 && (
              <ElectionStatsTab
                key="election"
                profile={selectedProfile}
                form={profileForm}
                editing={editingProfile}
                saving={saving}
                onChange={(k, v) => setProfileForm(prev => ({ ...prev, [k]: v }))}
                onSave={saveProfile}
                onCancel={() => { setEditingProfile(false); setProfileForm(selectedProfile); }}
                onEdit={() => setEditingProfile(true)}
              />
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center">
          <User size={48} style={{ color: '#8899bb', margin: '0 auto 16px' }} />
          <div style={{ color: '#f0f4ff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Profiles Yet</div>
          <div style={{ color: '#8899bb', fontSize: 14, marginBottom: 24 }}>Create your first politician profile to get started</div>
          <button className="btn-primary" onClick={() => {
            setProfileForm({ role: 'politician', is_active: true, languages: [], achievements: [] });
            setShowNewProfile(true);
          }}>
            <Plus size={14} className="inline mr-1" /> Create Profile
          </button>
        </motion.div>
      )}

      {/* Caste Modal */}
      <AnimatePresence>
        {showCasteModal && (
          <CasteModal
            form={casteForm}
            editing={!!editingCaste}
            saving={saving}
            onChange={(k, v) => setCasteForm(prev => ({ ...prev, [k]: v }))}
            onSave={saveCaste}
            onClose={() => { setShowCasteModal(false); setEditingCaste(null); setCasteForm({}); }}
          />
        )}
      </AnimatePresence>

      {/* New Profile Modal */}
      <AnimatePresence>
        {showNewProfile && (
          <NewProfileModal
            form={profileForm}
            saving={saving}
            onChange={(k, v) => setProfileForm(prev => ({ ...prev, [k]: v }))}
            onSave={createProfile}
            onClose={() => { setShowNewProfile(false); setProfileForm({}); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab({ profile, form, editing, saving, newLanguage, newAchievement,
  setNewLanguage, setNewAchievement, onChange, onSave, onCancel }: {
  profile: PoliticianProfile;
  form: Partial<PoliticianProfile>;
  editing: boolean;
  saving: boolean;
  newLanguage: string;
  newAchievement: string;
  setNewLanguage: (v: string) => void;
  setNewAchievement: (v: string) => void;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div key="profile-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      className="space-y-5">
      {editing && (
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <span style={{ color: '#00d4aa', fontSize: 13 }}>Editing profile — changes will be saved to database</span>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
            <button className="btn-primary text-sm flex items-center gap-1" onClick={onSave} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            <User size={15} style={{ color: '#00d4aa' }} /> Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Full Name" value={form.full_name || ''} editing={editing}
              onChange={v => onChange('full_name', v)} />
            <Field label="Display Name" value={form.display_name || ''} editing={editing}
              onChange={v => onChange('display_name', v)} />
            <Field label="Designation" value={form.designation || ''} editing={editing}
              onChange={v => onChange('designation', v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Party" value={form.party || ''} editing={editing}
                onChange={v => onChange('party', v)} />
              <Field label="Date of Birth" value={form.dob || ''} editing={editing} type="date"
                onChange={v => onChange('dob', v)} />
            </div>
            <TextareaField label="Bio" value={form.bio || ''} editing={editing}
              onChange={v => onChange('bio', v)} rows={4} />
          </div>
        </div>

        {/* Contact & Social */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            <Phone size={15} style={{ color: '#42a5f5' }} /> Contact & Social
          </h3>
          <div className="space-y-3">
            <FieldIcon label="Phone" value={form.phone || ''} editing={editing} icon={<Phone size={13} />}
              onChange={v => onChange('phone', v)} />
            <FieldIcon label="Email" value={form.email || ''} editing={editing} icon={<Mail size={13} />}
              onChange={v => onChange('email', v)} />
            <FieldIcon label="Website" value={form.website || ''} editing={editing} icon={<Globe size={13} />}
              onChange={v => onChange('website', v)} />
            <FieldIcon label="Twitter" value={form.twitter_handle || ''} editing={editing} icon={<Twitter size={13} />}
              onChange={v => onChange('twitter_handle', v)} placeholder="@handle" />
            <FieldIcon label="Facebook" value={form.facebook_url || ''} editing={editing} icon={<Facebook size={13} />}
              onChange={v => onChange('facebook_url', v)} />
            <FieldIcon label="Instagram" value={form.instagram_handle || ''} editing={editing} icon={<Instagram size={13} />}
              onChange={v => onChange('instagram_handle', v)} placeholder="@handle" />
            <TextareaField label="Office Address" value={form.office_address || ''} editing={editing}
              onChange={v => onChange('office_address', v)} rows={2} />
          </div>
        </div>
      </div>

      {/* Languages & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            <BookOpen size={15} style={{ color: '#ffa726' }} /> Languages Known
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(form.languages || []).map((lang, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'rgba(255,167,38,0.1)', color: '#ffa726', border: '1px solid rgba(255,167,38,0.2)' }}>
                {lang}
                {editing && (
                  <button onClick={() => onChange('languages', (form.languages || []).filter((_, idx) => idx !== i))}>
                    <X size={11} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input className="input-field flex-1 text-sm" value={newLanguage}
                onChange={e => setNewLanguage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newLanguage.trim()) { onChange('languages', [...(form.languages || []), newLanguage.trim()]); setNewLanguage(''); } }}
                placeholder="Add language..." />
              <button className="btn-secondary text-sm px-3" onClick={() => { if (newLanguage.trim()) { onChange('languages', [...(form.languages || []), newLanguage.trim()]); setNewLanguage(''); } }}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            <Award size={15} style={{ color: '#00c864' }} /> Key Achievements
          </h3>
          <div className="space-y-2 mb-3">
            {(form.achievements || []).map((ach, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg"
                style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.12)' }}>
                <Star size={12} style={{ color: '#00c864', marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{ach}</span>
                {editing && (
                  <button onClick={() => onChange('achievements', (form.achievements || []).filter((_, idx) => idx !== i))}
                    className="ml-auto" style={{ color: '#8899bb' }}>
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input className="input-field flex-1 text-sm" value={newAchievement}
                onChange={e => setNewAchievement(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newAchievement.trim()) { onChange('achievements', [...(form.achievements || []), newAchievement.trim()]); setNewAchievement(''); } }}
                placeholder="Add achievement..." />
              <button className="btn-secondary text-sm px-3" onClick={() => { if (newAchievement.trim()) { onChange('achievements', [...(form.achievements || []), newAchievement.trim()]); setNewAchievement(''); } }}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Constituency Tab ────────────────────────────────────────────────────────

function ConstituencyTab({ constProfile, form, editing, saving, onChange, onEdit, onSave, onCancel }: {
  constProfile: ConstituencyProfile | null;
  form: Partial<ConstituencyProfile>;
  editing: boolean;
  saving: boolean;
  onChange: (k: string, v: unknown) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div key="const-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      className="space-y-5">
      <div className="flex justify-between items-center">
        <div />
        {!editing ? (
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff' }}
            onClick={onEdit}>
            <Edit3 size={14} /> {constProfile ? 'Edit Constituency' : 'Create Constituency Profile'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
            <button className="btn-primary text-sm flex items-center gap-1" onClick={onSave} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {!constProfile && !editing && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <MapPin size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <div style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No Constituency Data</div>
          <div style={{ color: '#8899bb', fontSize: 13, marginBottom: 16 }}>Add constituency profile to track voter stats, demographics, and more</div>
          <button className="btn-primary" onClick={onEdit}><Plus size={13} className="inline mr-1" /> Add Constituency</button>
        </div>
      )}

      {(constProfile || editing) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
                <MapPin size={15} style={{ color: '#00d4aa' }} /> Basic Details
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Constituency Name" value={form.constituency_name || ''} editing={editing}
                    onChange={v => onChange('constituency_name', v)} />
                  <Field label="State" value={form.state || ''} editing={editing}
                    onChange={v => onChange('state', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="District" value={form.district || ''} editing={editing}
                    onChange={v => onChange('district', v)} />
                  <Field label="Lok Sabha No." value={form.lok_sabha_number || ''} editing={editing}
                    onChange={v => onChange('lok_sabha_number', v)} />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
                <Users size={15} style={{ color: '#42a5f5' }} /> Voter & Population Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Total Voters" value={form.total_voters || 0} editing={editing}
                  onChange={v => onChange('total_voters', v)} />
                <NumField label="Registered Voters" value={form.registered_voters || 0} editing={editing}
                  onChange={v => onChange('registered_voters', v)} />
                <NumField label="Total Population" value={form.population || 0} editing={editing}
                  onChange={v => onChange('population', v)} />
                <NumField label="Area (sq km)" value={form.area_sqkm || 0} editing={editing}
                  onChange={v => onChange('area_sqkm', v)} />
                <NumField label="Total Mandals" value={form.total_mandals || 0} editing={editing}
                  onChange={v => onChange('total_mandals', v)} />
                <NumField label="Total Villages" value={form.total_villages || 0} editing={editing}
                  onChange={v => onChange('total_villages', v)} />
                <NumField label="Total Booths" value={form.total_booths || 0} editing={editing}
                  onChange={v => onChange('total_booths', v)} />
                <NumField label="Sex Ratio" value={form.sex_ratio || 0} editing={editing}
                  onChange={v => onChange('sex_ratio', v)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
                <TrendingUp size={15} style={{ color: '#00c864' }} /> Social Indicators
              </h3>
              <div className="space-y-3">
                <NumField label="Urban Population (%)" value={form.urban_population_pct || 0} editing={editing}
                  onChange={v => onChange('urban_population_pct', v)} step="0.01" />
                <NumField label="Rural Population (%)" value={form.rural_population_pct || 0} editing={editing}
                  onChange={v => onChange('rural_population_pct', v)} step="0.01" />
                <NumField label="Literacy Rate (%)" value={form.literacy_rate || 0} editing={editing}
                  onChange={v => onChange('literacy_rate', v)} step="0.01" />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
                <Building size={15} style={{ color: '#ffa726' }} /> Assembly Segments
              </h3>
              <ArrayTagField
                values={form.assembly_segments || []}
                editing={editing}
                color="#ffa726"
                onChange={v => onChange('assembly_segments', v)}
                placeholder="Add segment..."
              />
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
                <Map size={15} style={{ color: '#ef5350' }} /> Revenue Divisions
              </h3>
              <ArrayTagField
                values={form.revenue_divisions || []}
                editing={editing}
                color="#ef5350"
                onChange={v => onChange('revenue_divisions', v)}
                placeholder="Add division..."
              />
            </div>
          </div>

          {constProfile && !editing && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Total Voters', value: constProfile.total_voters > 100000 ? (constProfile.total_voters / 100000).toFixed(1) + 'L' : constProfile.total_voters.toLocaleString(), color: '#42a5f5' },
                { label: 'Population', value: constProfile.population > 100000 ? (constProfile.population / 100000).toFixed(1) + 'L' : constProfile.population.toLocaleString(), color: '#00d4aa' },
                { label: 'Area (km²)', value: constProfile.area_sqkm?.toLocaleString() || '0', color: '#ffa726' },
                { label: 'Mandals', value: constProfile.total_mandals || 0, color: '#00c864' },
                { label: 'Villages', value: constProfile.total_villages || 0, color: '#ef5350' },
                { label: 'Booths', value: constProfile.total_booths || 0, color: '#f06292' },
                { label: 'Literacy %', value: (constProfile.literacy_rate || 0) + '%', color: '#8899bb' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card rounded-xl p-4 text-center">
                  <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Caste Demographics Tab ──────────────────────────────────────────────────

function CasteDemographicsTab({ demographics, totalPct, constProfile, onAdd, onEdit, onDelete }: {
  demographics: CasteDemographic[];
  totalPct: number;
  constProfile: ConstituencyProfile | null;
  onAdd: () => void;
  onEdit: (c: CasteDemographic) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categoryGroups = ['SC', 'ST', 'OBC', 'General', 'Minority', 'Other'];
  const byCategory = categoryGroups.map(cat => ({
    category: cat,
    items: demographics.filter(d => d.caste_category === cat),
    total: demographics.filter(d => d.caste_category === cat).reduce((s, d) => s + (d.population_pct || 0), 0),
  })).filter(g => g.items.length > 0);

  return (
    <motion.div key="caste-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      className="space-y-5">
      <div className="flex items-center justify-between">
        <div style={{ color: '#8899bb', fontSize: 13 }}>
          {demographics.length} caste groups tracked • {totalPct.toFixed(1)}% population coverage
        </div>
        {constProfile && (
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={onAdd}>
            <Plus size={14} /> Add Caste Group
          </button>
        )}
        {!constProfile && (
          <div style={{ color: '#8899bb', fontSize: 12 }}>Create a constituency profile first to add caste data</div>
        )}
      </div>

      {/* Category overview cards */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryGroups.map(cat => {
            const items = demographics.filter(d => d.caste_category === cat);
            const total = items.reduce((s, d) => s + (d.population_pct || 0), 0);
            return (
              <div key={cat} className="glass-card rounded-xl p-4 text-center">
                <div style={{ fontSize: 18, fontWeight: 800, color: CATEGORY_COLORS[cat], fontFamily: 'Space Grotesk' }}>
                  {total.toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{cat}</div>
                <div style={{ fontSize: 10, color: '#6677aa', marginTop: 1 }}>{items.length} groups</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual breakdown bar */}
      {demographics.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            Population Distribution
          </h3>
          <div className="flex rounded-xl overflow-hidden h-8 mb-3">
            {demographics.map(d => (
              <div key={d.id} title={`${d.caste_name}: ${d.population_pct}%`}
                style={{ width: `${d.population_pct}%`, background: CATEGORY_COLORS[d.caste_category], minWidth: 2 }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {demographics.map(d => (
              <div key={d.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[d.caste_category] }} />
                <span style={{ fontSize: 11, color: '#8899bb' }}>{d.caste_name} ({d.population_pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caste table */}
      {demographics.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Caste / Community', 'Category', 'Population %', 'Voter %', 'Support', 'Swing', 'Dominant Party', ''].map(h => (
                  <th key={h} className="text-left p-4" style={{ fontSize: 11, color: '#8899bb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demographics.map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="table-row">
                  <td className="p-4">
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff' }}>{d.caste_name}</div>
                    {d.notes && <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{d.notes.substring(0, 40)}...</div>}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: `${CATEGORY_COLORS[d.caste_category]}18`, color: CATEGORY_COLORS[d.caste_category] }}>
                      {d.caste_category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)', maxWidth: 60 }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(d.population_pct, 100)}%`, background: CATEGORY_COLORS[d.caste_category] }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{d.population_pct}%</span>
                    </div>
                  </td>
                  <td className="p-4" style={{ fontSize: 13, color: '#e2e8f0' }}>{d.voter_pct}%</td>
                  <td className="p-4">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} fill={s <= d.support_level ? '#ffa726' : 'none'}
                          style={{ color: s <= d.support_level ? '#ffa726' : '#333' }} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: `${SWING_COLORS[d.swing_potential]}18`, color: SWING_COLORS[d.swing_potential] }}>
                      {d.swing_potential}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs"
                      style={{ background: `${PARTY_COLORS[d.dominant_party] || '#6b7280'}18`, color: PARTY_COLORS[d.dominant_party] || '#6b7280' }}>
                      {d.dominant_party || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => onEdit(d)} className="p-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <Edit3 size={12} style={{ color: '#8899bb' }} />
                      </button>
                      {confirmDelete === d.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(239,83,80,0.15)', color: '#ef5350' }}>
                            <CheckCircle size={12} />
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(d.id)} className="p-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <Trash2 size={12} style={{ color: '#8899bb' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center">
          <BarChart3 size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <div style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No Caste Data</div>
          <div style={{ color: '#8899bb', fontSize: 13 }}>Add caste/community-wise voter breakdown for analytics</div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Election Stats Tab ──────────────────────────────────────────────────────

function ElectionStatsTab({ profile, form, editing, saving, onChange, onSave, onCancel, onEdit }: {
  profile: PoliticianProfile;
  form: Partial<PoliticianProfile>;
  editing: boolean;
  saving: boolean;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}) {
  const winPct = form.total_votes_polled && form.vote_count
    ? ((form.vote_count / form.total_votes_polled) * 100).toFixed(1)
    : null;

  return (
    <motion.div key="election-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      className="space-y-5">
      <div className="flex justify-end">
        {!editing ? (
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff' }}
            onClick={onEdit}>
            <Edit3 size={14} /> Edit Stats
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
            <button className="btn-primary text-sm flex items-center gap-1" onClick={onSave} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {winPct && !editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Vote Share', value: winPct + '%', color: '#00c864' },
            { label: 'Total Votes', value: (profile.vote_count || 0).toLocaleString(), color: '#42a5f5' },
            { label: 'Winning Margin', value: (profile.winning_margin || 0).toLocaleString(), color: '#ffa726' },
            { label: 'Previous Terms', value: profile.previous_terms || 0, color: '#00d4aa' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-5 text-center">
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            <Calendar size={15} style={{ color: '#00d4aa' }} /> Term Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Election Year" value={form.election_year || 0} editing={editing}
              onChange={v => onChange('election_year', v)} />
            <NumField label="Previous Terms" value={form.previous_terms || 0} editing={editing}
              onChange={v => onChange('previous_terms', v)} />
            <Field label="Term Start" value={form.term_start || ''} editing={editing} type="date"
              onChange={v => onChange('term_start', v)} />
            <Field label="Term End" value={form.term_end || ''} editing={editing} type="date"
              onChange={v => onChange('term_end', v)} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 14 }}>
            <TrendingUp size={15} style={{ color: '#00c864' }} /> Election Results
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Votes Received" value={form.vote_count || 0} editing={editing}
              onChange={v => onChange('vote_count', v)} />
            <NumField label="Total Votes Polled" value={form.total_votes_polled || 0} editing={editing}
              onChange={v => onChange('total_votes_polled', v)} />
            <NumField label="Winning Margin" value={form.winning_margin || 0} editing={editing}
              onChange={v => onChange('winning_margin', v)} />
            <div />
          </div>
          {winPct && !editing && (
            <div>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 13, color: '#8899bb' }}>Vote Share</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00c864' }}>{winPct}%</span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" style={{ background: '#00c864' }}
                  initial={{ width: 0 }} animate={{ width: `${winPct}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Caste Modal ─────────────────────────────────────────────────────────────

function CasteModal({ form, editing, saving, onChange, onSave, onClose }: {
  form: Partial<CasteDemographic>;
  editing: boolean;
  saving: boolean;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>
            {editing ? 'Edit Caste Group' : 'Add Caste Group'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Caste / Community Name" value={form.caste_name || ''} editing
            onChange={v => onChange('caste_name', v)} />
          <div>
            <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
            <select className="input-field w-full text-sm" value={form.caste_category || 'OBC'}
              onChange={e => onChange('caste_category', e.target.value)}>
              {['SC', 'ST', 'OBC', 'General', 'Minority', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <NumField label="Population %" value={form.population_pct || 0} editing step="0.01"
            onChange={v => onChange('population_pct', v)} />
          <NumField label="Voter %" value={form.voter_pct || 0} editing step="0.01"
            onChange={v => onChange('voter_pct', v)} />
          <NumField label="Population Count" value={form.population_count || 0} editing
            onChange={v => onChange('population_count', v)} />
          <NumField label="Voter Count" value={form.voter_count || 0} editing
            onChange={v => onChange('voter_count', v)} />
          <div>
            <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support Level (1-5)</label>
            <input type="range" min="1" max="5" step="0.5" className="w-full" value={form.support_level || 3}
              onChange={e => onChange('support_level', parseFloat(e.target.value))} />
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 10, color: '#8899bb' }}>Opposition</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ffa726' }}>{form.support_level || 3}</span>
              <span style={{ fontSize: 10, color: '#8899bb' }}>Strong Support</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Swing Potential</label>
            <select className="input-field w-full text-sm" value={form.swing_potential || 'Low'}
              onChange={e => onChange('swing_potential', e.target.value)}>
              {['Low', 'Medium', 'High'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Dominant Party" value={form.dominant_party || ''} editing
            onChange={v => onChange('dominant_party', v)} />
        </div>
        <TextareaField label="Notes" value={form.notes || ''} editing onChange={v => onChange('notes', v)} rows={2} />

        <div className="flex gap-3 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-1" onClick={onSave} disabled={saving}>
            <Save size={13} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New Profile Modal ───────────────────────────────────────────────────────

function NewProfileModal({ form, saving, onChange, onSave, onClose }: {
  form: Partial<PoliticianProfile>;
  saving: boolean;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Create New Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Full Name" value={form.full_name || ''} editing onChange={v => onChange('full_name', v)} />
          </div>
          <Field label="Party" value={form.party || ''} editing onChange={v => onChange('party', v)} />
          <Field label="Designation" value={form.designation || ''} editing onChange={v => onChange('designation', v)} />
          <Field label="Constituency" value={form.constituency_name || ''} editing onChange={v => onChange('constituency_name', v)} />
          <Field label="State" value={form.state || ''} editing onChange={v => onChange('state', v)} />
          <div>
            <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</label>
            <select className="input-field w-full text-sm" value={form.role || 'politician'}
              onChange={e => onChange('role', e.target.value)}>
              <option value="politician">Politician</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <Field label="Phone" value={form.phone || ''} editing onChange={v => onChange('phone', v)} />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex items-center gap-1" onClick={onSave} disabled={saving || !form.full_name}>
            <Save size={13} /> {saving ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reusable Field Components ───────────────────────────────────────────────

function Field({ label, value, editing, onChange, type = 'text', placeholder }: {
  label: string; value: string; editing: boolean;
  onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {editing ? (
        <input type={type} className="input-field w-full text-sm" value={value}
          onChange={e => onChange(e.target.value)} placeholder={placeholder || label} />
      ) : (
        <div style={{ fontSize: 13, color: value ? '#f0f4ff' : '#4a5568', padding: '8px 0' }}>{value || '—'}</div>
      )}
    </div>
  );
}

function FieldIcon({ label, value, editing, icon, onChange, placeholder }: {
  label: string; value: string; editing: boolean;
  icon: React.ReactNode; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ color: '#8899bb', width: 16 }}>{icon}</div>
      <div className="flex-1">
        {editing ? (
          <input className="input-field w-full text-sm" value={value}
            onChange={e => onChange(e.target.value)} placeholder={placeholder || label} />
        ) : (
          <div style={{ fontSize: 13, color: value ? '#f0f4ff' : '#4a5568' }}>{value || `No ${label}`}</div>
        )}
      </div>
    </div>
  );
}

function TextareaField({ label, value, editing, onChange, rows = 3 }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {editing ? (
        <textarea className="input-field w-full text-sm" rows={rows} value={value}
          onChange={e => onChange(e.target.value)} />
      ) : (
        <div style={{ fontSize: 13, color: value ? '#f0f4ff' : '#4a5568', lineHeight: 1.6 }}>{value || '—'}</div>
      )}
    </div>
  );
}

function NumField({ label, value, editing, onChange, step = '1' }: {
  label: string; value: number; editing: boolean; onChange: (v: number) => void; step?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: '#8899bb', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {editing ? (
        <input type="number" step={step} className="input-field w-full text-sm" value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)} />
      ) : (
        <div style={{ fontSize: 13, color: '#f0f4ff', padding: '8px 0' }}>{(value || 0).toLocaleString()}</div>
      )}
    </div>
  );
}

function ArrayTagField({ values, editing, color, onChange, placeholder }: {
  values: string[]; editing: boolean; color: string;
  onChange: (v: string[]) => void; placeholder: string;
}) {
  const [input, setInput] = useState('');
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
            {v}
            {editing && (
              <button onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        {values.length === 0 && !editing && <span style={{ color: '#4a5568', fontSize: 12 }}>—</span>}
      </div>
      {editing && (
        <div className="flex gap-2">
          <input className="input-field flex-1 text-sm" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onChange([...values, input.trim()]); setInput(''); } }}
            placeholder={placeholder} />
          <button className="btn-secondary text-sm px-3" onClick={() => { if (input.trim()) { onChange([...values, input.trim()]); setInput(''); } }}>
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
