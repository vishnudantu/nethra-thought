import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Map, Building, Landmark, Globe, Activity, Edit2, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { ConstituencyProfile } from '../lib/types';

const defaultHighlights = [
  { label: 'Lok Sabha Seat', value: 'Guntur', detail: 'Andhra Pradesh - 16' },
  { label: 'State', value: 'Andhra Pradesh', detail: 'Southern India' },
  { label: 'Parliament Sessions', value: '3 per year', detail: 'Budget, Monsoon, Winter' },
  { label: 'MPLAD Funds', value: '₹5 Cr/year', detail: 'Development allocation' },
  { label: 'District', value: 'Guntur', detail: 'Administrative center' },
  { label: 'Revenue Division', value: '4 Divisions', detail: 'Guntur, Sattenapalle, Ponnur, Mangalagiri' },
];

const defaultDemographics = [
  { label: 'SC Population', value: '18.2%', color: '#42a5f5' },
  { label: 'ST Population', value: '4.1%', color: '#ffa726' },
  { label: 'OBC Population', value: '47.3%', color: '#00c864' },
  { label: 'General', value: '30.4%', color: '#00d4aa' },
];

const defaultIndustries = [
  { name: 'Agriculture & Farming', icon: '🌾', desc: 'Paddy, cotton, chilli cultivation' },
  { name: 'Textile Industry', icon: '🧵', desc: 'Langa voni, handloom weaving' },
  { name: 'Education Hub', icon: '📚', desc: 'Acharya Nagarjuna University, NIT' },
  { name: 'Pharmaceutical', icon: '💊', desc: 'API manufacturing, pharma parks' },
  { name: 'Tobacco Industry', icon: '🌿', desc: 'Cigarette manufacturing, ITC Guntur' },
  { name: 'Construction', icon: '🏗️', desc: 'Real estate, infrastructure growth' },
];

const emptyForm = {
  constituency_name: '',
  state: '',
  district: '',
  total_voters: '',
  registered_voters: '',
  area_sqkm: '',
  population: '',
  total_mandals: '',
  total_villages: '',
  total_booths: '',
  urban_population_pct: '',
  rural_population_pct: '',
  literacy_rate: '',
  sex_ratio: '',
  key_facts: '',
  key_industries: '',
  assembly_segments: '',
  notes: '',
};

function safeJson(value: string) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

export default function Constituency() {
  const { activePolitician } = useAuth();
  const [profile, setProfile] = useState<ConstituencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchConstituency() {
      const rows = await api.list('constituency_profiles') as ConstituencyProfile[];
      setProfile(rows?.[0] || null);
      setLoading(false);
    }
    fetchConstituency();
  }, []);

  const statCards = profile ? [
    { label: 'Total Voters', value: ((profile.total_voters || 0) / 100000).toFixed(1) + 'L', icon: Users, color: '#42a5f5' },
    { label: 'Registered', value: ((profile.registered_voters || 0) / 100000).toFixed(1) + 'L', icon: Users, color: '#00d4aa' },
    { label: 'Area (sq km)', value: Number(profile.area_sqkm || 0).toLocaleString(), icon: Map, color: '#ffa726' },
    { label: 'Population', value: ((profile.population || 0) / 100000).toFixed(1) + 'L', icon: Users, color: '#00c864' },
    { label: 'Mandals', value: profile.total_mandals || 0, icon: Building, color: '#ef5350' },
    { label: 'Villages', value: profile.total_villages || 0, icon: MapPin, color: '#ab47bc' },
  ] : [];

  const highlights = Array.isArray(profile?.key_facts) ? profile?.key_facts : defaultHighlights;
  const industries = Array.isArray(profile?.key_industries) ? profile?.key_industries : defaultIndustries;
  const demographics = profile ? [
    { label: 'Urban Population', value: `${profile.urban_population_pct || 0}%`, color: '#42a5f5', progress: Number(profile.urban_population_pct || 0) },
    { label: 'Rural Population', value: `${profile.rural_population_pct || 0}%`, color: '#ffa726', progress: Number(profile.rural_population_pct || 0) },
    { label: 'Literacy Rate', value: `${profile.literacy_rate || 0}%`, color: '#00c864', progress: Number(profile.literacy_rate || 0) },
    { label: 'Sex Ratio', value: String(profile.sex_ratio || 0), color: '#00d4aa', progress: Math.min(100, Math.round(Number(profile.sex_ratio || 0) / 10)) },
  ] : defaultDemographics;

  function openEditor() {
    const current = profile;
    setForm({
      constituency_name: current?.constituency_name || '',
      state: current?.state || '',
      district: current?.district || '',
      total_voters: String(current?.total_voters || ''),
      registered_voters: String(current?.registered_voters || ''),
      area_sqkm: String(current?.area_sqkm || ''),
      population: String(current?.population || ''),
      total_mandals: String(current?.total_mandals || ''),
      total_villages: String(current?.total_villages || ''),
      total_booths: String(current?.total_booths || ''),
      urban_population_pct: String(current?.urban_population_pct || ''),
      rural_population_pct: String(current?.rural_population_pct || ''),
      literacy_rate: String(current?.literacy_rate || ''),
      sex_ratio: String(current?.sex_ratio || ''),
      key_facts: JSON.stringify(current?.key_facts || defaultHighlights, null, 2),
      key_industries: JSON.stringify(current?.key_industries || defaultIndustries, null, 2),
      assembly_segments: JSON.stringify(current?.assembly_segments || [], null, 2),
      notes: current?.notes || '',
    });
    setFormOpen(true);
  }

  async function saveProfile() {
    if (!form.constituency_name) return;
    setSaving(true);
    const num = (value: string) => (value === '' ? 0 : Number(value));
    const payload = {
      constituency_name: form.constituency_name,
      state: form.state,
      district: form.district,
      total_voters: num(form.total_voters),
      registered_voters: num(form.registered_voters),
      area_sqkm: num(form.area_sqkm),
      population: num(form.population),
      total_mandals: num(form.total_mandals),
      total_villages: num(form.total_villages),
      total_booths: num(form.total_booths),
      urban_population_pct: num(form.urban_population_pct),
      rural_population_pct: num(form.rural_population_pct),
      literacy_rate: num(form.literacy_rate),
      sex_ratio: num(form.sex_ratio),
      key_facts: safeJson(form.key_facts),
      key_industries: safeJson(form.key_industries),
      assembly_segments: safeJson(form.assembly_segments),
      notes: form.notes,
    };
    if (profile?.id) {
      await api.update('constituency_profiles', String(profile.id), payload);
    } else {
      await api.create('constituency_profiles', payload);
    }
    const rows = await api.list('constituency_profiles') as ConstituencyProfile[];
    setProfile(rows?.[0] || null);
    setSaving(false);
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(0,212,170,0.08) 0%, transparent 60%)' }} />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Landmark size={24} style={{ color: '#00d4aa' }} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
                {loading ? 'Loading...' : profile?.constituency_name || 'Constituency'} Constituency
              </h2>
            </div>
            <p style={{ color: '#8899bb', fontSize: 14 }}>
              {loading ? '' : `${profile?.state || 'India'} | Represented by ${activePolitician?.full_name || '—'} (${activePolitician?.party || '—'})`}
            </p>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <Activity size={14} style={{ color: '#00d4aa' }} />
                <span style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600 }}>Active • Lok Sabha</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Globe size={14} style={{ color: '#8899bb' }} />
                <span style={{ fontSize: 12, color: '#8899bb' }}>18th Lok Sabha (2024-2029)</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png"
              alt="India Flag" style={{ width: 64, borderRadius: 8, opacity: 0.8 }} />
            <button onClick={openEditor} className="btn-secondary mt-4 flex items-center gap-2">
              <Edit2 size={14} /> {profile ? 'Edit Constituency' : 'Add Constituency'}
            </button>
          </div>
        </div>
        <div className="mt-4 md:hidden">
          <button onClick={openEditor} className="btn-secondary w-full flex items-center gap-2 justify-center">
            <Edit2 size={14} /> {profile ? 'Edit Constituency' : 'Add Constituency'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="shimmer h-8 w-16 rounded mb-2" />
            <div className="shimmer h-3 w-full rounded" />
          </div>
        )) : statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <Icon size={18} style={{ color: card.color, margin: '0 auto 8px' }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: 'Space Grotesk' }}>{card.value}</div>
              <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 15 }}>
            Key Facts
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {highlights.map((h, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{h.value}</div>
                <div style={{ fontSize: 11, color: '#00d4aa', marginTop: 1 }}>{h.label}</div>
                <div style={{ fontSize: 10, color: '#8899bb', marginTop: 2 }}>{h.detail}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 15 }}>
            Demographics
          </h3>
          <div className="space-y-4">
            {demographics.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.08 }}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: 13, color: '#f0f4ff' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    style={{ background: d.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d as { progress?: number }).progress ?? d.value}` }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-5"
      >
        <h3 className="font-semibold mb-4" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk', fontSize: 15 }}>
          Key Industries & Economy
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {industries.map((ind, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{ind.icon || '📌'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>{ind.name}</div>
              <div style={{ fontSize: 11, color: '#8899bb' }}>{ind.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {formOpen && (
          <div className="modal-overlay" onClick={() => setFormOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-2xl w-full max-w-3xl overflow-y-auto max-h-[92vh]"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
                    {profile ? 'Edit Constituency' : 'Create Constituency Profile'}
                  </h2>
                  <p style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Update constituency metrics and insights.</p>
                </div>
                <button onClick={() => setFormOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={16} style={{ color: '#8899bb' }} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Constituency Name *</label>
                  <input className="input-field" value={form.constituency_name} onChange={e => setForm({ ...form, constituency_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>State</label>
                  <input className="input-field" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>District</label>
                  <input className="input-field" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Voters</label>
                  <input type="number" className="input-field" value={form.total_voters} onChange={e => setForm({ ...form, total_voters: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Registered Voters</label>
                  <input type="number" className="input-field" value={form.registered_voters} onChange={e => setForm({ ...form, registered_voters: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Area (sq km)</label>
                  <input type="number" className="input-field" value={form.area_sqkm} onChange={e => setForm({ ...form, area_sqkm: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Population</label>
                  <input type="number" className="input-field" value={form.population} onChange={e => setForm({ ...form, population: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Mandals</label>
                  <input type="number" className="input-field" value={form.total_mandals} onChange={e => setForm({ ...form, total_mandals: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Villages</label>
                  <input type="number" className="input-field" value={form.total_villages} onChange={e => setForm({ ...form, total_villages: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Booths</label>
                  <input type="number" className="input-field" value={form.total_booths} onChange={e => setForm({ ...form, total_booths: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Urban Population %</label>
                  <input type="number" className="input-field" value={form.urban_population_pct} onChange={e => setForm({ ...form, urban_population_pct: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Rural Population %</label>
                  <input type="number" className="input-field" value={form.rural_population_pct} onChange={e => setForm({ ...form, rural_population_pct: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Literacy Rate %</label>
                  <input type="number" className="input-field" value={form.literacy_rate} onChange={e => setForm({ ...form, literacy_rate: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Sex Ratio</label>
                  <input type="number" className="input-field" value={form.sex_ratio} onChange={e => setForm({ ...form, sex_ratio: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Key Facts (JSON)</label>
                  <textarea className="input-field" rows={4} value={form.key_facts} onChange={e => setForm({ ...form, key_facts: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Key Industries (JSON)</label>
                  <textarea className="input-field" rows={4} value={form.key_industries} onChange={e => setForm({ ...form, key_industries: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Assembly Segments (JSON)</label>
                  <textarea className="input-field" rows={3} value={form.assembly_segments} onChange={e => setForm({ ...form, assembly_segments: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Notes</label>
                  <textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-white/10">
                <button onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveProfile} className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Constituency'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
