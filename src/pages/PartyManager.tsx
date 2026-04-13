import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Building2, Users, Activity } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Badge from '../components/ui/Badge';

// ══ RESPONSIVE HOOK (inline to avoid Vite tree-shaking) ══
import { useState as _useStateW, useEffect as _useEffectW } from 'react';
function useW() {
  const [_w, _setW] = _useStateW(typeof window !== 'undefined' ? window.innerWidth : 1440);
  _useEffectW(() => { const _fn = () => _setW(window.innerWidth); window.addEventListener('resize', _fn); return () => window.removeEventListener('resize', _fn); }, []);
  return _w;
}
const isMob = (_w: number) => _w < 640;
// ════════════════════════════════════════════════════════════

interface Party {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: number;
  created_at: string;
}

export default function PartyManager() {
  const w = useW();
  const { user } = useAuth();
  const [parties, setPartys] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    primary_color: '#00d4aa',
    secondary_color: '#1e88e5',
  });

  async function fetchPartys() {
    try {
      const data = await api.get('/api/parties');
      setPartys(data || []);
    } catch (e) {
      console.error('Failed to load parties:', e);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/parties/${editingId}`, formData);
      } else {
        await api.post('/api/parties', formData);
      }
      setFormData({ name: '', slug: '', logo_url: '', primary_color: '#00d4aa', secondary_color: '#1e88e5' });
      setEditingId(null);
      setShowForm(false);
      await fetchPartys();
    } catch (err: any) {
      alert(err.message || 'Failed to save party');
    }
  }

  async function handleEdit(party: Party) {
    setEditingId(party.id);
    setFormData({
      name: party.name,
      slug: party.slug,
      logo_url: party.logo_url || '',
      primary_color: party.primary_color,
      secondary_color: party.secondary_color,
    });
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('Deactivate this party? This will not delete data, just disable access.')) return;
    try {
      await api.delete(`/api/parties/${id}`);
      await fetchPartys();
    } catch (e) {
      alert('Failed to deactivate party');
    }
  }

  async function toggleActive(party: Party) {
    try {
      await api.put(`/api/parties/${party.id}`, { ...party, is_active: party.is_active ? 0 : 1 });
      await fetchPartys();
    } catch (e) {
      alert('Failed to update party');
    }
  }

  useEffect(() => { fetchPartys(); }, []);

  // Check if super admin
  if (user?.role !== 'super_admin') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}>
        <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
        <p>Party management is only available to Platform Administrators.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMob(w) ? 12 : 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMob(w) ? 20 : 28, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>
            🏢 Party Manager
          </h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Manage political parties (parties) on this platform</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', slug: '', logo_url: '', primary_color: '#00d4aa', secondary_color: '#1e88e5' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #00d4aa, #1e88e5)', border: 'none', borderRadius: 10, color: '#060b18', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
        >
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Party'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24, padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 16 }}>{editingId ? 'Edit Party' : 'Add New Party'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Party Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Telugu Desam Party"
                required
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="e.g., tdp"
                required
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Primary Color</label>
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Secondary Color</label>
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer' }}
              />
            </div>
            <div style={{ gridColumn: isMob(w) ? '1 / -1' : 'auto' }}>
              <button type="submit" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #00d4aa, #1e88e5)', border: 'none', borderRadius: 10, color: '#060b18', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {editingId ? 'Update Party' : 'Create Party'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Partys List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}>Loading parties...</div>
        ) : parties.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8899bb' }}>
            <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No parties found. Click "Add Party" to create one.</p>
          </div>
        ) : (
          parties.map((party, i) => (
            <motion.div
              key={party.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: `1px solid ${party.is_active ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.08)'}`, opacity: party.is_active ? 1 : 0.6 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${party.primary_color}, ${party.secondary_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 18 }}>
                  {party.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff' }}>{party.name}</div>
                  <div style={{ fontSize: 12, color: '#8899bb' }}>
                    <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>{party.slug}</span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>Created {new Date(party.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant={party.is_active ? 'success' : 'neutral'}>{party.is_active ? 'Active' : 'Inactive'}</Badge>
                <button onClick={() => handleEdit(party)} style={{ padding: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8899bb', cursor: 'pointer' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => toggleActive(party)} style={{ padding: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: party.is_active ? '#00d4aa' : '#8899bb', cursor: 'pointer' }}>
                  {party.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => handleDelete(party.id)} style={{ padding: 8, background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 8, color: '#ff5555', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
