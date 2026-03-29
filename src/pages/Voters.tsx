import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Search, X, Star, Upload, Download, Filter, UserCheck, AlertCircle, TrendingUp, ChevronDown, FileText, CreditCard as Edit2, Trash2, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Voter } from '../lib/types';

function VoterModal({ voter, onClose, onSave }: {
  voter: Partial<Voter> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    voter_id: voter?.voter_id || `AP${Date.now().toString().slice(-8)}`,
    name: voter?.name || '',
    age: voter?.age || 30,
    gender: voter?.gender || 'Male',
    phone: voter?.phone || '',
    email: voter?.email || '',
    address: voter?.address || '',
    mandal: voter?.mandal || '',
    village: voter?.village || '',
    booth_number: voter?.booth_number || '',
    party_affiliation: voter?.party_affiliation || 'TDP',
    support_level: voter?.support_level || 3,
    notes: voter?.notes || '',
    caste: (voter as Voter & { caste?: string })?.caste || '',
    caste_category: (voter as Voter & { caste_category?: string })?.caste_category || 'General',
    religion: (voter as Voter & { religion?: string })?.religion || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name || !form.voter_id) return;
    setSaving(true);
    if (voter?.id) {
      await api.update('voters', voter.id, form);
    } else {
      await api.create('voters', form);
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
            {voter?.id ? 'Edit Voter' : 'Add Voter'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Voter ID *</label>
              <input className="input-field" placeholder="e.g., AP12345678"
                value={form.voter_id} onChange={e => setForm({ ...form, voter_id: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Full Name *</label>
              <input className="input-field" placeholder="Voter name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Age</label>
              <input type="number" className="input-field" min={18} max={120}
                value={form.age} onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 18 })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Phone</label>
              <input className="input-field" placeholder="Mobile"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input-field" placeholder="email@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Mandal</label>
              <input className="input-field" placeholder="Mandal"
                value={form.mandal} onChange={e => setForm({ ...form, mandal: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Village</label>
              <input className="input-field" placeholder="Village"
                value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Booth No.</label>
              <input className="input-field" placeholder="Booth"
                value={form.booth_number} onChange={e => setForm({ ...form, booth_number: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Caste / Community</label>
              <input className="input-field" placeholder="e.g., Kamma, Reddy..."
                value={form.caste} onChange={e => setForm({ ...form, caste: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input-field" value={form.caste_category} onChange={e => setForm({ ...form, caste_category: e.target.value })}>
                {['SC', 'ST', 'OBC', 'General', 'Minority', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Religion</label>
              <select className="input-field" value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })}>
                {['', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'].map(r => <option key={r} value={r}>{r || 'Select...'}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Party Affiliation</label>
              <select className="input-field" value={form.party_affiliation} onChange={e => setForm({ ...form, party_affiliation: e.target.value })}>
                {['TDP', 'YSRCP', 'BJP', 'Congress', 'JSP', 'Neutral', 'Unknown'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>
                Support Level ({form.support_level}/5)
              </label>
              <input type="range" min={1} max={5} className="w-full" style={{ accentColor: '#00d4aa', marginTop: 8 }}
                value={form.support_level} onChange={e => setForm({ ...form, support_level: parseInt(e.target.value) })} />
              <div className="flex justify-between" style={{ fontSize: 10, color: '#8899bb', marginTop: 2 }}>
                <span>Opponent</span><span>Neutral</span><span>Strong</span>
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Address</label>
            <input className="input-field" placeholder="Full address"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea className="input-field" rows={2} placeholder="Additional notes..." style={{ resize: 'none' }}
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : voter?.id ? 'Update' : 'Add Voter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

function CSVImportModal({ onClose, onImport }: { onClose: () => void; onImport: (result: ImportResult) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      let success = 0, failed = 0;
      const errors: string[] = [];

      for (const row of rows) {
        if (!row.name || !row.voter_id) {
          failed++;
          errors.push(`Row skipped: missing name or voter_id`);
          continue;
        }
        const voterData = {
          voter_id: row.voter_id,
          name: row.name,
          age: parseInt(row.age) || 30,
          gender: row.gender || 'Male',
          phone: row.phone || '',
          email: row.email || '',
          address: row.address || '',
          mandal: row.mandal || '',
          village: row.village || '',
          booth_number: row.booth_number || '',
          party_affiliation: row.party_affiliation || 'Unknown',
          support_level: parseInt(row.support_level) || 3,
          notes: row.notes || '',
          caste: row.caste || '',
          caste_category: row.caste_category || 'General',
          religion: row.religion || '',
          is_active: true,
          tags: [],
        };
        try {
          // Try update first, fall back to create (upsert by voter_id)
          const existing = await api.list('voters', { search: voterData.voter_id });
          const match = existing.find((v: any) => v.voter_id === voterData.voter_id);
          if (match) { await api.update('voters', match.id, voterData); }
          else { await api.create('voters', voterData); }
          success++;
        } catch (err: any) {
          failed++;
          errors.push(`Failed to import ${row.name}: ${err.message}`);
        }
      }

      const r: ImportResult = { success, failed, errors };
      setResult(r);
      setImporting(false);
      onImport(r);
    };
    reader.readAsText(file);
  }

  function downloadSample() {
    const a = document.createElement('a');
    a.href = '/sample_voters.csv';
    a.download = 'sample_voters.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>Import Voters from CSV</h2>
            <p style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>Bulk import voter data from a CSV file</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.2)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle size={18} style={{ color: '#1e88e5', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 500, marginBottom: 6 }}>CSV Format Requirements</p>
                <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.6 }}>
                  Required columns: <strong style={{ color: '#f0f4ff' }}>voter_id, name</strong><br />
                  Optional: age, gender, phone, email, address, mandal, village, booth_number, party_affiliation, support_level (1-5), caste, caste_category (SC/ST/OBC/General/Minority/Other), religion, notes
                </p>
              </div>
            </div>
          </div>

          <button onClick={downloadSample} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl w-full"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>
            <Download size={16} />
            Download Sample CSV Template
          </button>

          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 10, fontWeight: 500 }}>Upload CSV File</label>
            <div
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer"
              style={{ border: '2px dashed rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.04)' }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,212,170,0.15)' }}>
                <Upload size={22} style={{ color: '#00d4aa' }} />
              </div>
              {file ? (
                <div className="text-center">
                  <p style={{ fontSize: 14, color: '#f0f4ff', fontWeight: 600 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB · {preview.length}+ rows detected</p>
                </div>
              ) : (
                <div className="text-center">
                  <p style={{ fontSize: 14, color: '#f0f4ff' }}>Click to upload CSV</p>
                  <p style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>Supports .csv files only</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {preview.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 8, fontWeight: 500 }}>Preview (first 5 rows):</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {['voter_id', 'name', 'age', 'gender', 'mandal', 'party_affiliation', 'support_level'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', fontSize: 10, color: '#8899bb', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {['voter_id', 'name', 'age', 'gender', 'mandal', 'party_affiliation', 'support_level'].map(col => (
                            <td key={col} style={{ padding: '8px 10px', fontSize: 11, color: '#f0f4ff', whiteSpace: 'nowrap' }}>{row[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl" style={{ background: result.failed === 0 ? 'rgba(0,200,100,0.1)' : 'rgba(255,167,38,0.1)', border: `1px solid ${result.failed === 0 ? 'rgba(0,200,100,0.3)' : 'rgba(255,167,38,0.3)'}` }}>
              <div className="flex items-center gap-2 mb-2">
                {result.failed === 0 ? <CheckCircle size={16} style={{ color: '#00c864' }} /> : <AlertCircle size={16} style={{ color: '#ffa726' }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>Import Complete</span>
              </div>
              <p style={{ fontSize: 13, color: '#8899bb' }}>
                <span style={{ color: '#00c864' }}>{result.success} voters imported</span>
                {result.failed > 0 && <span style={{ color: '#ff5555' }}> · {result.failed} failed</span>}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.errors.slice(0, 3).map((e, i) => <p key={i} style={{ fontSize: 11, color: '#ff5555' }}>{e}</p>)}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">{result ? 'Close' : 'Cancel'}</button>
          {!result && (
            <button onClick={handleImport} className="btn-primary flex-1" disabled={!file || importing}>
              {importing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(6,11,24,0.3)', borderTopColor: 'transparent' }} />
                  Importing...
                </span>
              ) : 'Import Voters'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const supportColors = ['', '#ff5555', '#ffa726', '#ffa726', '#00d4aa', '#00c864'];

export default function Voters() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [selected, setSelected] = useState<Partial<Voter> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [partyFilter, setPartyFilter] = useState('All');
  const [supportFilter, setSupportFilter] = useState('All');
  const [casteFilter, setCasteFilter] = useState('All');
  const [totalCount, setTotalCount] = useState(0);
  const [importToast, setImportToast] = useState('');
  const PAGE_SIZE = 20;

  async function fetchVoters() {
    setLoading(true);
    const allVoters = await api.list('voters', { order: 'created_at', dir: 'DESC', limit: '2000' });
    let filtered = allVoters || [];
    if (partyFilter !== 'All') filtered = filtered.filter((v: any) => v.party_affiliation === partyFilter);
    if (supportFilter !== 'All') filtered = filtered.filter((v: any) => String(v.support_level) === supportFilter);
    if (casteFilter !== 'All') filtered = filtered.filter((v: any) => v.caste_category === casteFilter);
    setTotalCount(filtered.length);
    setVoters(filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
    setLoading(false);
  }

  useEffect(() => { fetchVoters(); }, [page, partyFilter, supportFilter, casteFilter]);

  const filtered = voters.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.voter_id.toLowerCase().includes(search.toLowerCase()) ||
    v.mandal?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search)
  );

  function handleImportDone(result: ImportResult) {
    setImportToast(`Imported ${result.success} voters successfully!`);
    fetchVoters();
    setTimeout(() => setImportToast(''), 4000);
  }

  async function deleteVoter(id: string) {
    await api.remove('voters', id);
    fetchVoters();
  }

  const strongSupporters = voters.filter(v => v.support_level >= 4).length;
  const undecided = voters.filter(v => v.support_level === 3).length;
  const opposition = voters.filter(v => v.support_level <= 2).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Users, label: 'Total Records', value: totalCount.toLocaleString(), color: '#1e88e5' },
          { icon: UserCheck, label: 'Strong Supporters', value: strongSupporters, color: '#00c864' },
          { icon: BarChart2, label: 'Undecided', value: undecided, color: '#ffa726' },
          { icon: AlertCircle, label: 'Opposition', value: opposition, color: '#ff5555' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5" style={{ border: `1px solid ${s.color}22` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}22` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 250 }}>
            <Search size={14} style={{ color: '#8899bb' }} />
            <input className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
              placeholder="Search by name, voter ID, mandal, phone..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={partyFilter} onChange={e => { setPartyFilter(e.target.value); setPage(0); }}>
            <option value="All">All Parties</option>
            {['TDP', 'YSRCP', 'BJP', 'Congress', 'JSP', 'Neutral', 'Unknown'].map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={supportFilter} onChange={e => { setSupportFilter(e.target.value); setPage(0); }}>
            <option value="All">All Support Levels</option>
            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
          </select>
          <select className="input-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            value={casteFilter} onChange={e => { setCasteFilter(e.target.value); setPage(0); }}>
            <option value="All">All Categories</option>
            {['SC', 'ST', 'OBC', 'General', 'Minority', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setImportModal(true)}>
            <Upload size={16} /> Import CSV
          </button>
          <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
            <Plus size={16} /> Add Voter
          </button>
        </div>
      </div>

      {importToast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,200,100,0.15)', border: '1px solid rgba(0,200,100,0.3)' }}>
          <CheckCircle size={16} style={{ color: '#00c864' }} />
          <span style={{ fontSize: 13, color: '#00c864' }}>{importToast}</span>
        </motion.div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Voter ID', 'Name', 'Age/Gender', 'Phone', 'Mandal/Village', 'Booth', 'Caste/Category', 'Party', 'Support', 'Notes', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(10).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}>
                      <div className="shimmer h-4 w-16 rounded" />
                    </td>
                  ))}
                </tr>
              )) : filtered.map((v, i) => (
                <motion.tr
                  key={v.id}
                  className="table-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#00d4aa', fontWeight: 600, fontFamily: 'monospace' }}>{v.voter_id}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500, color: '#f0f4ff' }}>{v.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{v.age} / {v.gender?.[0] || '-'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{v.phone || '-'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, color: '#f0f4ff' }}>{v.mandal}</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>{v.village}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{v.booth_number || '-'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {(v as Voter & { caste?: string; caste_category?: string }).caste && (
                      <div style={{ fontSize: 12, color: '#f0f4ff' }}>{(v as Voter & { caste?: string }).caste}</div>
                    )}
                    {(v as Voter & { caste_category?: string }).caste_category && (v as Voter & { caste_category?: string }).caste_category !== 'General' && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa', fontSize: 10 }}>
                        {(v as Voter & { caste_category?: string }).caste_category}
                      </span>
                    )}
                    {!(v as Voter & { caste?: string }).caste && <span style={{ color: '#4a5568', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{
                        background: v.party_affiliation === 'TDP' ? 'rgba(255,215,0,0.15)' : v.party_affiliation === 'YSRCP' ? 'rgba(255,85,85,0.15)' : 'rgba(136,153,187,0.15)',
                        color: v.party_affiliation === 'TDP' ? '#ffd700' : v.party_affiliation === 'YSRCP' ? '#ff5555' : '#8899bb'
                      }}>
                      {v.party_affiliation}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={12}
                          style={{ color: j < v.support_level ? supportColors[v.support_level] : 'rgba(255,255,255,0.15)' }}
                          fill={j < v.support_level ? supportColors[v.support_level] : 'transparent'}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: 150 }}>
                    <p style={{ fontSize: 11, color: '#8899bb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.notes || '-'}</p>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 rounded-lg"
                        style={{ background: 'rgba(30,136,229,0.15)', color: '#1e88e5', cursor: 'pointer' }}
                        onClick={() => { setSelected(v); setModalOpen(true); }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg"
                        style={{ background: 'rgba(255,85,85,0.15)', color: '#ff5555', cursor: 'pointer' }}
                        onClick={() => deleteVoter(v.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <Users size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
              <p style={{ color: '#8899bb', fontSize: 14 }}>No voters found</p>
              <button onClick={() => setImportModal(true)} className="btn-primary mt-4" style={{ margin: '16px auto 0' }}>
                <Upload size={14} /> Import CSV to get started
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <button className="btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </button>
          <span style={{ fontSize: 12, color: '#8899bb' }}>Page {page + 1} · {totalCount} total voters</span>
          <button className="btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setPage(p => p + 1)} disabled={voters.length < PAGE_SIZE}>
            Next
          </button>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <VoterModal
            voter={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchVoters}
          />
        )}
        {importModal && (
          <CSVImportModal
            onClose={() => setImportModal(false)}
            onImport={handleImportDone}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
