import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderOpen, File, Lock, Search, X, Download } from 'lucide-react';
import { api } from '../lib/api';
import type { Document } from '../lib/types';

const docTypes = ['Official', 'Legal', 'Financial', 'Policy', 'Report', 'Agreement', 'Letter', 'Other'];
const docCategories = ['General', 'Parliament', 'Constituency', 'Project', 'Legal', 'Finance', 'HR', 'Welfare'];

function DocModal({ doc, onClose, onSave }: {
  doc: Partial<Document> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: doc?.title || '',
    doc_type: doc?.doc_type || 'Official',
    category: doc?.category || 'General',
    file_name: doc?.file_name || '',
    file_size: doc?.file_size || '',
    description: doc?.description || '',
    is_confidential: doc?.is_confidential || false,
    uploaded_by: doc?.uploaded_by || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title) return;
    setSaving(true);
    if (doc?.id) {
      await api.update('documents', doc.id, form);
    } else {
      await api.create('documents', form);
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
        className="glass-card rounded-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {doc?.id ? 'Edit Document' : 'Add Document'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Document Title *</label>
            <input className="input-field" placeholder="Document name"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Type</label>
              <select className="input-field" value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })}>
                {docTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {docCategories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>File Name</label>
              <input className="input-field" placeholder="e.g., report.pdf"
                value={form.file_name} onChange={e => setForm({ ...form, file_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>File Size</label>
              <input className="input-field" placeholder="e.g., 2.4 MB"
                value={form.file_size} onChange={e => setForm({ ...form, file_size: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea className="input-field" rows={3} placeholder="Document description"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Uploaded By</label>
            <input className="input-field" placeholder="Staff name"
              value={form.uploaded_by} onChange={e => setForm({ ...form, uploaded_by: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="confidential" checked={form.is_confidential}
              onChange={e => setForm({ ...form, is_confidential: e.target.checked })}
              style={{ accentColor: '#00d4aa', width: 16, height: 16 }} />
            <label htmlFor="confidential" style={{ fontSize: 13, color: '#f0f4ff', cursor: 'pointer' }}>
              Mark as Confidential
            </label>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : doc?.id ? 'Update' : 'Add Document'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const typeColors: Record<string, string> = {
  Official: '#42a5f5', Legal: '#ef5350', Financial: '#00c864', Policy: '#ffa726',
  Report: '#00d4aa', Agreement: '#ab47bc', Letter: '#26c6da', Other: '#8899bb',
};

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<Document> | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  async function fetchDocs() {
    setLoading(true);
    const data = await api.list('documents');
    setDocs(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchDocs(); }, []);

  const filtered = docs.filter(d => {
    if (filter !== 'All' && d.doc_type !== filter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 200 }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
              placeholder="Search documents..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...docTypes.slice(0, 5)].map(f => (
              <button key={f}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: filter === f ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#00d4aa' : '#8899bb',
                  border: `1px solid ${filter === f ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
                onClick={() => setFilter(f)}
              >{f}</button>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="shimmer h-4 w-2/3 rounded mb-2" />
            <div className="shimmer h-3 w-1/3 rounded" />
          </div>
        )) : filtered.map((doc, i) => {
          const color = typeColors[doc.doc_type] || '#8899bb';
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-4 cursor-pointer"
              onClick={() => { setSelected(doc); setModalOpen(true); }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '20', border: `1px solid ${color}30` }}>
                  <File size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }} className="truncate">{doc.title}</span>
                    {doc.is_confidential && <Lock size={12} style={{ color: '#ffa726', flexShrink: 0 }} />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: color + '15', color }}>
                      {doc.doc_type}
                    </span>
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{doc.category}</span>
                    {doc.file_size && <span style={{ fontSize: 11, color: '#8899bb' }}>{doc.file_size}</span>}
                  </div>
                  {doc.description && (
                    <p style={{ fontSize: 11, color: '#8899bb', marginTop: 6 }} className="line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <span style={{ fontSize: 10, color: '#8899bb' }}>
                      {doc.uploaded_by && `by ${doc.uploaded_by} · `}
                      {new Date(doc.created_at).toLocaleDateString('en-IN')}
                    </span>
                    <button className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,212,170,0.1)' }}
                      onClick={e => e.stopPropagation()}>
                      <Download size={11} style={{ color: '#00d4aa' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-2xl py-16 text-center">
          <FolderOpen size={48} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
          <p style={{ color: '#8899bb', fontSize: 14 }}>No documents found</p>
          <button className="btn-primary mt-4" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} /> Add Document
          </button>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <DocModal
            doc={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchDocs}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
