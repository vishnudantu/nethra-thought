import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';
import { statusBadge } from '../components/ui/badgeUtils';
import type { Finance as FinanceType } from '../lib/types';

const incomeCategories = ['MPLADS Fund', 'Party Funds', 'Donation', 'Grant', 'Other'];
const expenseCategories = ['Infrastructure', 'Healthcare', 'Education', 'Agriculture', 'Event', 'Water Supply', 'Social Welfare', 'Office', 'Travel', 'Salary', 'Other'];

function FinanceModal({ transaction, onClose, onSave }: {
  transaction: Partial<FinanceType> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    transaction_type: transaction?.transaction_type || 'Expense',
    category: transaction?.category || 'Infrastructure',
    description: transaction?.description || '',
    amount: transaction?.amount || 0,
    date: transaction?.date || new Date().toISOString().substring(0, 10),
    payment_mode: transaction?.payment_mode || 'Bank Transfer',
    reference_number: transaction?.reference_number || '',
    status: transaction?.status || 'Completed',
    notes: transaction?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const cats = form.transaction_type === 'Income' ? incomeCategories : expenseCategories;

  async function handleSave() {
    if (!form.amount) return;
    setSaving(true);
    if (transaction?.id) {
      await api.update('finances', transaction.id, form);
    } else {
      await api.create('finances', form);
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
            {transaction?.id ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: '#8899bb' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            {['Income', 'Expense'].map(t => (
              <button
                key={t}
                onClick={() => setForm({ ...form, transaction_type: t as FinanceType['transaction_type'], category: t === 'Income' ? 'MPLADS Fund' : 'Infrastructure' })}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: form.transaction_type === t
                    ? (t === 'Income' ? 'rgba(0,200,100,0.2)' : 'rgba(255,85,85,0.2)')
                    : 'rgba(255,255,255,0.05)',
                  color: form.transaction_type === t
                    ? (t === 'Income' ? '#00c864' : '#ff5555')
                    : '#8899bb',
                  border: `1px solid ${form.transaction_type === t ? (t === 'Income' ? 'rgba(0,200,100,0.3)' : 'rgba(255,85,85,0.3)') : 'rgba(255,255,255,0.08)'}`,
                }}
              >{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Amount (₹) *</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Description</label>
            <input className="input-field" placeholder="Transaction description"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Payment Mode</label>
              <select className="input-field" value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                {['Bank Transfer', 'Cheque', 'Cash', 'Government Transfer', 'DD'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8899bb', display: 'block', marginBottom: 6 }}>Reference Number</label>
            <input className="input-field" placeholder="UTR/Cheque/Ref number"
              value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : transaction?.id ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Finance() {
  const [transactions, setTransactions] = useState<FinanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<FinanceType> | null>(null);
  const [filter, setFilter] = useState('All');

  async function fetchFinances() {
    setLoading(true);
    const data = await api.list('finances', { order: 'created_at', dir: 'DESC' }) as FinanceType[];
    setTransactions(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchFinances(); }, []);

  const filtered = filter === 'All' ? transactions : transactions.filter(t => t.transaction_type === filter);
  const totalIncome = transactions.filter(t => t.transaction_type === 'Income').reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const totalExpense = transactions.filter(t => t.transaction_type === 'Expense').reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Income', value: totalIncome, color: '#00c864', icon: TrendingUp },
          { label: 'Total Expenditure', value: totalExpense, color: '#ff5555', icon: TrendingDown },
          { label: 'Net Balance', value: balance, color: balance >= 0 ? '#00d4aa' : '#ff5555', icon: Wallet },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: s.color + '20' }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <span style={{ fontSize: 11, color: '#8899bb' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>
                ₹{(Math.abs(s.value) / 10000000).toFixed(2)} Cr
              </div>
              <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>
                ₹{Math.abs(s.value).toLocaleString('en-IN')}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Income', 'Expense'].map(f => (
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
        <button className="btn-primary" onClick={() => { setSelected(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Date', 'Type', 'Category', 'Description', 'Amount', 'Mode', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8899bb', whiteSpace: 'nowrap', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(8).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}>
                      <div className="shimmer h-4 w-20 rounded" />
                    </td>
                  ))}
                </tr>
              )) : filtered.map((t, i) => (
                <motion.tr
                  key={t.id}
                  className="table-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb', whiteSpace: 'nowrap' }}>
                    {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                      background: t.transaction_type === 'Income' ? 'rgba(0,200,100,0.15)' : 'rgba(255,85,85,0.15)',
                      color: t.transaction_type === 'Income' ? '#00c864' : '#ff5555',
                    }}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{t.category}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#f0f4ff', maxWidth: 200 }}>
                    <div className="truncate">{t.description || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                    color: t.transaction_type === 'Income' ? '#00c864' : '#ff5555' }}>
                    {t.transaction_type === 'Income' ? '+' : '-'}₹{Number(t.amount ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#8899bb' }}>{t.payment_mode}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge variant={statusBadge(t.status)}>{t.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.2)', cursor: 'pointer' }}
                      onClick={() => { setSelected(t); setModalOpen(true); }}
                    >Edit</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <Wallet size={40} style={{ color: '#8899bb', margin: '0 auto 12px' }} />
              <p style={{ color: '#8899bb', fontSize: 14 }}>No transactions found</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <FinanceModal
            transaction={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSave={fetchFinances}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
