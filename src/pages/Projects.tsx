import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, MapPin, X, IndianRupee } from 'lucide-react';
import { api } from '../lib/api';
import Badge, { statusBadge } from '../components/ui/Badge';
import type { Project } from '../lib/types';

const categories = ['Infrastructure', 'Water Supply', 'Healthcare', 'Education', 'Agriculture', 'Employment', 'Housing', 'Sanitation', 'Power', 'Transport'];
const schemes = ['MPLADS', 'PMKSY', 'PMGSY', 'Smart City Mission', 'State Health Mission', 'PMKVY', 'PM Surya Ghar', 'NHAI', 'AMRUT', 'Others'];

function ProjectModal({ project, onClose, onSave }: {
  project: Partial<Project> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    project_name: project?.project_name || '',
    description: project?.description || '',
    category: project?.category || 'Infrastructure',
    location: project?.location || '',
    mandal: project?.mandal || '',
    budget_allocated: project?.budget_allocated || 0,
    budget_spent: project?.budget_spent || 0,
    contractor: project?.contractor || '',
    start_date: project?.start_date || '',
    expected_completion: project?.expected_completion || '',
    status: project?.status || 'Planning',
    progress_percent: project?.progress_percent || 0,
    beneficiaries: project?.beneficiaries || 0,
    scheme: project?.scheme || 'MPLADS',
    notes: project?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.project_name) return;
    setSaving(true);
    if (project?.id) {
      await api.update('projects', project.id, { ...form, updated_at: new Date().toISOString() });
    } else {
      await api.create('projects', form);
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
        className="glass-card rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {project?.id ? 'Edit Project' : 'Add Project'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Project Name *</label>
            <input className="input-field" placeholder="Project title"
              value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Scheme</label>
              <select className="input-field" value={form.scheme} onChange={e => setForm({ ...form, scheme: e.target.value })}>
                {schemes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Location</label>
              <input className="input-field" placeholder="City/Area"
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Mandal</label>
              <input className="input-field" placeholder="Mandal name"
                value={form.mandal} onChange={e => setForm({ ...form, mandal: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Budget Allocated (₹)</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.budget_allocated} onChange={e => setForm({ ...form, budget_allocated: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Budget Spent (₹)</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.budget_spent} onChange={e => setForm({ ...form, budget_spent: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                {['Planning', 'Tendering', 'In Progress', 'Stalled', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Progress (%)</label>
              <input type="number" className="input-field" min={0} max={100} placeholder="0"
                value={form.progress_percent} onChange={e => setForm({ ...form, progress_percent: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Beneficiaries</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.beneficiaries} onChange={e => setForm({ ...form, beneficiaries: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Contractor</label>
            <input className="input-field" placeholder="Contractor name"
              value={form.contractor} onChange={e => setForm({ ...form, contractor: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Start Date</label>
              <input type="date" className="input-field"
                value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Expected Completion</label>
              <input type="date" className="input-field"
                value={form.expected_completion} onChange={e => setForm({ ...form, expected_completion: e.target.value })} />
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
            {saving ? 'Saving...' : project?.id ? 'Update' : 'Add Project'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<Project> | null>(null);
  const [filter, setFilter] = useState('All');

  async function fetchProjects() {
    setLoading(true);
    const data = await api.list('projects');
    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchProjects(); }, []);

  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter);
  const totalBudget = projects.reduce((s: number, p: any) => s + parseFloat(p.budget_allocated || 0), 0);
  const totalSpent = projects.reduce((s: number, p: any) => s + parseFloat(p.budget_spent || 0), 0);

  const progressColors: Record<string, string> = {
    Planning: '#8899bb', Tendering: '#ffa726', 'In Progress': '#00d4aa',
    Stalled: '#ff5555', Completed: '#00c864', Cancelled: '#ef5350'
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Projects', value: projects.length, color: '#42a5f5' },
          { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: '#00d4aa' },
          { label: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#00c864' },
          { label: 'Total Beneficiaries', value: projects.reduce((s: number, p: any) => s + parseInt(p.beneficiaries || 0), 0).toLocaleString(), color: '#ffa726' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card rounded-2xl p-4"
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <span style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 600 }}>Overall Budget Utilization</span>
            <span style={{ fontSize: 12, color: '#8899bb', marginLeft: 12 }}>
              ₹{(totalSpent / 10000000).toFixed(1)} Cr of ₹{(totalBudget / 10000000).toFixed(1)} Cr spent
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#00d4aa' }}>
            {totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            style={{ background: 'linear-gradient(90deg, #00d4aa, #42a5f5)' }}
            initial={{ width: 0 }}
            animate={{ width: `${totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%` }}
            transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['All', 'Planning', 'Tendering', 'In Progress', 'Stalled', 'Completed'].map(f => (
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
          <Plus size={16} /> Add Project
        </button>
      </div>

      <div className="space-y-3">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="shimmer h-5 w-1/3 rounded mb-3" />
            <div className="shimmer h-3 w-full rounded" />
          </div>
        )) : filtered.map((p, i) => {
          const color = progressColors[p.status] || '#8899bb';
          const util = p.budget_allocated ? Math.round((parseFloat(p.budget_spent) / parseFloat(p.budget_allocated)) * 100) : 0;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-5 cursor-pointer"
              onClick={() => { setSelected(p); setModalOpen(true); }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold" style={{ color: '#f0f4ff', fontSize: 14 }}>{p.project_name}</h3>
                    <Badge variant={statusBadge(p.status)}>{p.status}</Badge>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#8899bb' }}>{p.category}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} style={{ color: '#8899bb' }} />
                      <span style={{ fontSize: 12, color: '#8899bb' }}>{p.mandal}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8899bb' }}>{p.scheme}</div>
                    <div style={{ fontSize: 12, color: '#8899bb' }}>
                      {p.beneficiaries > 0 ? `${parseInt(p.beneficiaries).toLocaleString()} beneficiaries` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 11, color: '#8899bb' }}>Progress</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color }}>
                        {p.progress_percent}% complete
                      </span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress_percent}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>
                    ₹{(parseFloat(p.budget_allocated) / 10000000).toFixed(2)} Cr
                  </div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>allocated</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#00d4aa', marginTop: 4 }}>
                    ₹{(parseFloat(p.budget_spent) / 10000000).toFixed(2)} Cr spent ({util}%)
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-2xl py-16 text-center">
          <TrendingUp size={48} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <p style={{ color: '#8899bb', fontSize: 14 }}>No projects found</p>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <ProjectModal
            project={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchProjects}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
