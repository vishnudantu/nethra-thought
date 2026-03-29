import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, FileText, Activity, Target, Zap } from 'lucide-react';
import { api } from '../lib/api';

interface Stats {
  grievances: { total: number; resolved: number; pending: number; categories: Record<string, number> };
  projects: { total: number; inProgress: number; completed: number; totalBudget: number; totalSpent: number };
  media: { positive: number; negative: number; neutral: number; total: number };
  team: { active: number; total: number };
  finance: { income: number; expense: number };
}

function DonutChart({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const total = positive + negative + neutral;
  if (total === 0) return null;
  const pPos = (positive / total) * 100;
  const pNeg = (negative / total) * 100;
  const pNeu = (neutral / total) * 100;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#00c864" strokeWidth="3"
            strokeDasharray={`${pPos} ${100 - pPos}`}
            strokeDashoffset="0"
            initial={{ strokeDasharray: '0 100' }}
            animate={{ strokeDasharray: `${pPos} ${100 - pPos}` }}
            transition={{ duration: 1.5, delay: 0.3 }} />
          <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#ff5555" strokeWidth="3"
            strokeDasharray={`${pNeg} ${100 - pNeg}`}
            strokeDashoffset={`${-(pPos)}`}
            initial={{ strokeDasharray: '0 100' }}
            animate={{ strokeDasharray: `${pNeg} ${100 - pNeg}` }}
            transition={{ duration: 1.5, delay: 0.5 }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Positive', value: positive, color: '#00c864' },
          { label: 'Negative', value: negative, color: '#ff5555' },
          { label: 'Neutral', value: neutral, color: '#8899bb' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span style={{ fontSize: 12, color: '#8899bb' }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.color, marginLeft: 4 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChartComponent({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, i) => (
        <div key={item.label} className="flex flex-col items-center gap-1 flex-1">
          <span style={{ fontSize: 10, color: '#8899bb' }}>{item.value}</span>
          <div className="w-full rounded-t-md relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', height: '100%' }}>
            <motion.div
              className="absolute bottom-0 w-full rounded-t-md"
              style={{ background: `linear-gradient(180deg, ${color}, ${color}60)` }}
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / max) * 100}%` }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <span style={{ fontSize: 9, color: '#8899bb', textAlign: 'center' }} className="truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats>({
    grievances: { total: 0, resolved: 0, pending: 0, categories: {} },
    projects: { total: 0, inProgress: 0, completed: 0, totalBudget: 0, totalSpent: 0 },
    media: { positive: 0, negative: 0, neutral: 0, total: 0 },
    team: { active: 0, total: 0 },
    finance: { income: 0, expense: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [gData, pData, mData, tData, fData] = await Promise.all([
        api.list('grievances'),
        api.list('projects'),
        api.list('media_mentions'),
        api.list('team_members'),
        api.list('finances'),
      ]);

      const catCounts = gData.reduce((acc: Record<string,number>, g: any) => ({ ...acc, [g.category]: (acc[g.category] || 0) + 1 }), {} as Record<string, number>);

      setStats({
        grievances: {
          total: gData.length,
          resolved: gData.filter(g => g.status === 'Resolved').length,
          pending: gData.filter(g => g.status === 'Pending').length,
          categories: catCounts,
        },
        projects: {
          total: pData.length,
          inProgress: pData.filter(p => p.status === 'In Progress').length,
          completed: pData.filter(p => p.status === 'Completed').length,
          totalBudget: pData.reduce((s: number, p: any) => s + parseFloat(p.budget_allocated || 0), 0),
          totalSpent: pData.reduce((s: number, p: any) => s + parseFloat(p.budget_spent || 0), 0),
        },
        media: {
          positive: mData.filter(m => m.sentiment === 'Positive').length,
          negative: mData.filter(m => m.sentiment === 'Negative').length,
          neutral: mData.filter(m => m.sentiment === 'Neutral').length,
          total: mData.length,
        },
        team: {
          active: tData.filter(t => t.status === 'Active').length,
          total: tData.length,
        },
        finance: {
          income: fData.filter(f => f.transaction_type === 'Income').reduce((s: number, f: any) => s + parseFloat(f.amount || 0), 0),
          expense: fData.filter(f => f.transaction_type === 'Expense').reduce((s: number, f: any) => s + parseFloat(f.amount || 0), 0),
        },
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const gResolutionRate = stats.grievances.total ? Math.round((stats.grievances.resolved / stats.grievances.total) * 100) : 0;
  const pCompletionRate = stats.projects.total ? Math.round((stats.projects.completed / stats.projects.total) * 100) : 0;
  const budgetUtil = stats.projects.totalBudget ? Math.round((stats.projects.totalSpent / stats.projects.totalBudget) * 100) : 0;
  const sentimentScore = stats.media.total ? Math.round(((stats.media.positive - stats.media.negative) / stats.media.total) * 100) : 0;

  const grievanceCats = Object.entries(stats.grievances.categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([label, value]) => ({ label: label.substring(0, 8), value }));

  const kpis = [
    { label: 'Grievance Resolution Rate', value: gResolutionRate, unit: '%', target: 80, color: '#00c864', icon: FileText },
    { label: 'Project Completion Rate', value: pCompletionRate, unit: '%', target: 70, color: '#42a5f5', icon: TrendingUp },
    { label: 'Budget Utilization', value: budgetUtil, unit: '%', target: 75, color: '#ffa726', icon: Target },
    { label: 'Sentiment Score', value: Math.abs(sentimentScore), unit: '%', target: 60, color: sentimentScore >= 0 ? '#00d4aa' : '#ff5555', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={18} style={{ color: kpi.color }} />
                <span style={{ fontSize: 11, color: '#8899bb' }}>Target: {kpi.target}%</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, fontFamily: 'Space Grotesk' }}>
                {loading ? '...' : `${kpi.value}${kpi.unit}`}
              </div>
              <div style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>{kpi.label}</div>
              {!loading && (
                <div className="progress-bar mt-3">
                  <motion.div
                    className="progress-fill"
                    style={{ background: kpi.value >= kpi.target ? kpi.color : `${kpi.color}80` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(kpi.value, 100)}%` }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.8 }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-5" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
            Grievances by Category
          </h3>
          {loading ? <div className="shimmer h-32 rounded-xl" /> : (
            grievanceCats.length > 0 ? <BarChartComponent data={grievanceCats} color="#42a5f5" /> :
            <p style={{ color: '#8899bb', fontSize: 13 }}>No data available</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-5" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
            Media Sentiment Analysis
          </h3>
          {loading ? <div className="shimmer h-32 rounded-xl" /> : (
            <DonutChart
              positive={stats.media.positive}
              negative={stats.media.negative}
              neutral={stats.media.neutral}
            />
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} style={{ color: '#42a5f5' }} />
            <h3 className="font-semibold text-sm" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Grievance Summary</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Filed', value: stats.grievances.total, color: '#f0f4ff' },
              { label: 'Resolved', value: stats.grievances.resolved, color: '#00c864' },
              { label: 'Pending', value: stats.grievances.pending, color: '#ffa726' },
              { label: 'Resolution Rate', value: `${gResolutionRate}%`, color: '#42a5f5' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span style={{ fontSize: 12, color: '#8899bb' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#00d4aa' }} />
            <h3 className="font-semibold text-sm" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Project Overview</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Projects', value: stats.projects.total, color: '#f0f4ff' },
              { label: 'In Progress', value: stats.projects.inProgress, color: '#00d4aa' },
              { label: 'Completed', value: stats.projects.completed, color: '#00c864' },
              { label: 'Budget Used', value: `${budgetUtil}%`, color: '#ffa726' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span style={{ fontSize: 12, color: '#8899bb' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: '#ffa726' }} />
            <h3 className="font-semibold text-sm" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>Finance Summary</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Income', value: `₹${(stats.finance.income / 10000000).toFixed(2)} Cr`, color: '#00c864' },
              { label: 'Total Expense', value: `₹${(stats.finance.expense / 10000000).toFixed(2)} Cr`, color: '#ff5555' },
              { label: 'Net Balance', value: `₹${((stats.finance.income - stats.finance.expense) / 10000000).toFixed(2)} Cr`, color: '#00d4aa' },
              { label: 'Team Size', value: `${stats.team.active}/${stats.team.total} active`, color: '#42a5f5' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span style={{ fontSize: 12, color: '#8899bb' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
