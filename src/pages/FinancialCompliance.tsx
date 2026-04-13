import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileCheck2, Plus, AlertTriangle, CheckCircle, Clock, Zap, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { T, AIPanel, Stat, Loading, Empty, Modal, getToken } from '../components/ui/ModuleLayout';;
import { useW, isMob } from '../../hooks/useResponsive';

interface Report { id: string; report_type: string; summary?: string; status: string; alerts?: any; created_at: string; }

export default function FinancialCompliance() {
  const w = useW();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.list('finance_compliance_reports', { order: 'created_at', dir: 'DESC', limit: '30' });
      setReports((data as Report[]) || []);
    } catch (_) {}
    setLoading(false);
  }

  async function analyse() {
    setAnalyzing(true);
    try {
      const r = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Review my financial compliance reports and identify any election law violations, disclosure gaps, or audit risks. Reports: ${JSON.stringify(reports.slice(0, 10))}` }] }),
      });
      setAiInsight(await r.text());
    } catch (_) {}
    setAnalyzing(false);
  }

  useEffect(() => { load(); }, []);

  const submitted = reports.filter(r => r.status === 'submitted').length;
  const pending = reports.filter(r => r.status === 'draft' || r.status === 'review').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk', margin: 0 }}>Financial Compliance</h1>
          <p style={{ fontSize: 13, color: '#8899bb', margin: '4px 0 0' }}>Election expense compliance and audit readiness</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={analyse} disabled={analyzing} style={{ ...T.primary, opacity: analyzing ? 0.65 : 1 }}>
            {analyzing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Checking...</> : <><Zap size={13} />Compliance Check</>}
          </button>
          <button onClick={() => setShowForm(true)} style={T.ghost}><Plus size={13} />New Report</button>
        </div>
      </div>

      {(aiInsight || analyzing) && <AIPanel title="Compliance Analysis" content={aiInsight} loading={analyzing} onClose={() => setAiInsight('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: isMob(w) ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <Stat label="Total Reports" value={reports.length} color="#42a5f5" icon={FileCheck2} />
        <Stat label="Submitted" value={submitted} color="#00c864" icon={CheckCircle} />
        <Stat label="Pending Review" value={pending} color="#ffa726" icon={Clock} />
      </div>

      {loading ? <Loading text="Loading reports..." />
        : reports.length === 0 ? (
          <Empty icon={FileCheck2} title="No compliance reports" sub="Track election expenses, affidavit submissions and audit reports." action="Create First Report" onAction={() => setShowForm(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map(r => {
              const sc = r.status === 'submitted' ? '#00c864' : r.status === 'review' ? '#42a5f5' : '#ffa726';
              return (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ ...T.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileCheck2 size={18} style={{ color: sc, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{r.report_type}</div>
                    {r.summary && <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</div>}
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700, flexShrink: 0 }}>{r.status}</span>
                </motion.div>
              );
            })}
          </div>
        )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="New Compliance Report">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ComplianceForm onSave={() => { setShowForm(false); load(); }} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ComplianceForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ report_type: '', summary: '', status: 'draft' });
  const [busy, setBusy] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  async function save() {
    if (!form.report_type) return;
    setBusy(true);
    await api.create('finance_compliance_reports', form);
    setBusy(false); onSave();
  }
  return (
    <>
      <div><label style={T.label}>Report Type *</label>
        <select value={form.report_type} onChange={e => f('report_type', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
          <option value="">Select type...</option>
          {['Election Expense Declaration', 'Affidavit Submission', 'Asset Disclosure', 'Campaign Finance Report', 'Audit Report'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div><label style={T.label}>Summary</label><textarea value={form.summary} onChange={e => f('summary', e.target.value)} rows={3} placeholder="Key details..." style={{ ...T.input, resize: 'vertical' }} /></div>
      <div><label style={T.label}>Status</label>
        <select value={form.status} onChange={e => f('status', e.target.value)} style={{ ...T.input, appearance: 'none' }}>
          {['draft', 'review', 'submitted', 'closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <button onClick={save} disabled={busy || !form.report_type} style={{ ...T.primary, justifyContent: 'center', width: '100%', opacity: busy || !form.report_type ? 0.5 : 1 }}>
        {busy ? 'Saving...' : 'Create Report'}
      </button>
    </>
  );
}
