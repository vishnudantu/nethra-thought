import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  FileText, Calendar, Users, TrendingUp, ArrowUp, ArrowDown,
  AlertCircle, CheckCircle2, Clock, Newspaper, Wallet,
  Activity, Target, MapPin, ChevronRight, Zap, Star, X
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Badge from '../components/ui/Badge';
import { statusBadge, priorityBadge } from '../components/ui/badgeUtils';
import type { Grievance, Event, Finance, MediaMention, Project, TeamMember } from '../lib/types';

interface ConstituencyProfile {
  id: string;
  politician_id: string;
  constituency_name: string;
  state: string;
  total_voters: number;
  registered_voters: number;
  area_sqkm: number;
  population: number;
  total_mandals: number;
  total_villages: number;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }),
};

function StatCard({ icon: Icon, label, value, change, color, bg, index }: {
  icon: React.ElementType; label: string; value: string; change?: string;
  color: string; bg: string; index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10"
        style={{ background: bg }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bg + '25', border: `1px solid ${color}30` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change && (
          <span className="text-xs font-semibold flex items-center gap-1"
            style={{ color: change.startsWith('+') ? '#00c864' : '#ff5555' }}>
            {change.startsWith('+') ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {change.replace(/[+-]/, '')}
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>{label}</div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="shimmer h-10 w-10 rounded-xl mb-4" />
      <div className="shimmer h-8 w-24 rounded mb-2" />
      <div className="shimmer h-4 w-32 rounded" />
    </div>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { activePolitician, userRole } = useAuth();
  const role = userRole?.role || '';
  const isSuperAdmin = role === 'super_admin';
  const isFieldWorker = role === 'field_worker';
  const isStaff = role === 'staff';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [media, setMedia] = useState<MediaMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [constProfile, setConstProfile] = useState<ConstituencyProfile | null>(null);
  const [constForm, setConstForm] = useState<Partial<ConstituencyProfile>>({});
  const [constModalOpen, setConstModalOpen] = useState(false);
  const [constSaving, setConstSaving] = useState(false);
  const [stats, setStats] = useState({
    totalGrievances: 0, pendingGrievances: 0, resolvedGrievances: 0,
    totalProjects: 0, totalTeam: 0, upcomingEvents: 0,
    positiveMedia: 0, totalBudget: 0,
  });

  useEffect(() => {
    async function fetchAll() {
      if (isSuperAdmin || isFieldWorker) {
        setLoading(false);
        return;
      }
      const [grievanceDataRaw, eventsDataRaw, projectsDataRaw, mediaDataRaw, teamDataRaw, finDataRaw] = await Promise.all([
        api.list('grievances', { order: 'created_at', dir: 'DESC', limit: '50' }),
        api.list('events', { order: 'start_date', dir: 'ASC', limit: '5' }),
        api.list('projects', { order: 'created_at', dir: 'DESC', limit: '5' }),
        api.list('media_mentions', { order: 'created_at', dir: 'DESC', limit: '5' }),
        api.list('team_members'),
        isStaff ? Promise.resolve([]) : api.list('finances'),
      ]);

      const grievanceData = grievanceDataRaw as Grievance[];
      const eventsData = eventsDataRaw as Event[];
      const projectsData = projectsDataRaw as Project[];
      const mediaData = mediaDataRaw as MediaMention[];
      const teamData = teamDataRaw as TeamMember[];
      const finData = finDataRaw as Finance[];

      const income = finData
        .filter(f => f.transaction_type === 'Income')
        .reduce((s, f) => s + Number(f.amount ?? 0), 0);

      setGrievances(grievanceData);
      setEvents(eventsData);
      setProjects(projectsData);
      setMedia(mediaData);
      setStats({
        totalGrievances: grievanceData.length,
        pendingGrievances: grievanceData.filter(g => g.status === 'Pending' || g.status === 'Escalated').length,
        resolvedGrievances: grievanceData.filter(g => g.status === 'Resolved').length,
        totalProjects: projectsData.length,
        totalTeam: teamData.filter(t => t.status === 'Active').length,
        upcomingEvents: eventsData.filter(e => e.status === 'Upcoming').length,
        positiveMedia: mediaData.filter(m => m.sentiment === 'Positive').length,
        totalBudget: income,
      });
      setLoading(false);
    }
    fetchAll();
  }, [isSuperAdmin, isFieldWorker, isStaff]);

  const fetchConstituency = useCallback(async () => {
    if (isSuperAdmin || isFieldWorker) return;
    if (!activePolitician?.id) return;
    const all = await api.list('constituency_profiles') as ConstituencyProfile[];
    const match = all.find(cp => cp.politician_id === activePolitician.id) || null;
    setConstProfile(match);
    setConstForm(match || {});
  }, [activePolitician?.id, isSuperAdmin, isFieldWorker]);

  useEffect(() => {
    fetchConstituency();
  }, [fetchConstituency]);

  async function saveConstituencyStats() {
    if (isSuperAdmin || isFieldWorker) return;
    if (!activePolitician?.id) return;
    setConstSaving(true);
    const payload = {
      ...constForm,
      politician_id: activePolitician.id,
      constituency_name: constForm.constituency_name || activePolitician.constituency_name || '',
      state: constForm.state || activePolitician.state || '',
    };
    if (constProfile?.id) {
      await api.update('constituency_profiles', constProfile.id, payload);
    } else {
      await api.create('constituency_profiles', payload);
    }
    setConstSaving(false);
    setConstModalOpen(false);
    fetchConstituency();
  }

  const statCards = [
    { icon: FileText, label: 'Total Grievances', value: loading ? '...' : stats.totalGrievances.toString(), change: '+12%', color: '#42a5f5', bg: '#1e88e5' },
    { icon: AlertCircle, label: 'Pending Action', value: loading ? '...' : stats.pendingGrievances.toString(), change: '-8%', color: '#ffa726', bg: '#ff8c00' },
    { icon: CheckCircle2, label: 'Resolved', value: loading ? '...' : stats.resolvedGrievances.toString(), change: '+18%', color: '#00c864', bg: '#00c864' },
    { icon: TrendingUp, label: 'Active Projects', value: loading ? '...' : stats.totalProjects.toString(), change: '+2%', color: '#00d4aa', bg: '#00d4aa' },
    { icon: Users, label: 'Team Members', value: loading ? '...' : stats.totalTeam.toString(), color: '#e0e0e0', bg: '#9e9e9e' },
    { icon: Calendar, label: 'Upcoming Events', value: loading ? '...' : stats.upcomingEvents.toString(), color: '#ab47bc', bg: '#ab47bc' },
    { icon: Newspaper, label: 'Positive Coverage', value: loading ? '...' : stats.positiveMedia.toString(), change: '+5%', color: '#26c6da', bg: '#26c6da' },
    ...(isStaff ? [] : [{ icon: Wallet, label: 'MPLADS Funds (Cr)', value: loading ? '...' : (stats.totalBudget / 10000000).toFixed(1), change: '+0%', color: '#ef5350', bg: '#ef5350' }]),
  ];

  const urgentGrievances = grievances.filter(g => g.priority === 'Urgent' || g.status === 'Escalated').slice(0, 4);
  const pulseScore = stats.totalGrievances ? Math.min(100, Math.round((stats.resolvedGrievances / stats.totalGrievances) * 100)) : 0;

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            Platform Command Center
          </h2>
          <p style={{ color: '#8899bb', fontSize: 14, marginTop: 6 }}>
            Super Admin is a founder role. Use Platform Admin to manage politicians, access controls, reports, and platform health.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('superadmin')} className="btn-primary">Open Platform Admin</button>
            <button onClick={() => onNavigate('website-admin')} className="btn-secondary">Website CMS</button>
          </div>
        </div>
      </div>
    );
  }

  if (isFieldWorker) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            Field Ops Console
          </h2>
          <p style={{ color: '#8899bb', fontSize: 14, marginTop: 6 }}>
            Submit on-ground intelligence, voice reports, and capture grievances assigned to your beat.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('quick-capture')} className="btn-primary">Quick Capture</button>
            <button onClick={() => onNavigate('voice-intelligence')} className="btn-secondary">Voice Reports</button>
            <button onClick={() => onNavigate('grievances')} className="btn-secondary">Grievance Log</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
            {greeting}, <span className="gradient-text">
              {userRole?.role === 'super_admin' ? 'Super Admin' :
               userRole?.role === 'politician_admin' ? (activePolitician?.display_name || activePolitician?.full_name?.split(' ')[0] || 'Admin') + ' Ji' :
               userRole?.role === 'staff' ? 'Staff' :
               userRole?.role === 'field_worker' ? 'Field Team' :
               'Welcome'}
            </span>
          </h2>
          <p style={{ color: '#8899bb', fontSize: 14, marginTop: 4 }}>
            Here's what's happening in {activePolitician?.constituency_name || 'your'} constituency today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl"
          style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <Zap size={16} style={{ color: '#00d4aa' }} />
          <span style={{ fontSize: 13, color: '#00d4aa', fontWeight: 600 }}>System Active</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          loading ? <LoadingSkeleton key={i} /> : <StatCard key={i} {...card} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at top right, rgba(0,212,170,0.35), transparent 55%)' }} />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="text-sm font-semibold" style={{ color: '#00d4aa' }}>Constituency Pulse</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
              {loading ? '...' : `${pulseScore}/100`}
            </div>
            <div style={{ fontSize: 12, color: '#8899bb' }}>Resolution momentum and media positivity</div>
          </div>
          <div className="flex-1 min-w-[200px] max-w-[320px]">
            <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pulseScore}%` }}
                transition={{ duration: 1.2 }}
                className="h-3 rounded-full"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #1e88e5)' }}
              />
            </div>
            <div className="flex justify-between mt-2" style={{ fontSize: 10, color: '#8899bb' }}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
                Active Projects Overview
              </h3>
              <p style={{ fontSize: 12, color: '#8899bb' }}>Budget utilization and progress</p>
            </div>
            <button onClick={() => onNavigate('projects')} className="text-xs flex items-center gap-1"
              style={{ color: '#00d4aa' }}>
              View all <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? [1,2,3].map(i => (
              <div key={i} className="shimmer h-16 rounded-xl" />
            )) : projects.slice(0, 4).map((p, i) => {
              const spent = Number(p.budget_spent ?? 0);
              const allocated = Number(p.budget_allocated ?? 0);
              const utilization = allocated ? Math.round((spent / allocated) * 100) : 0;
              const colors = ['#00d4aa', '#42a5f5', '#ffa726', '#ef5350', '#ab47bc', '#26c6da'];
              const color = colors[i % colors.length];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} style={{ color }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#f0f4ff' }}>{p.project_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusBadge(p.status)}>{p.status}</Badge>
                      <span style={{ fontSize: 12, color: '#8899bb' }}>{p.progress_percent}%</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress_percent}%` }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: 11, color: '#8899bb' }}>{p.mandal}</span>
                    <span style={{ fontSize: 11, color: '#8899bb' }}>
                      ₹{(spent / 100000).toFixed(1)}L / ₹{(allocated / 100000).toFixed(1)}L ({utilization}%)
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
                Upcoming Events
              </h3>
              <p style={{ fontSize: 12, color: '#8899bb' }}>Next 7 days</p>
            </div>
            <button onClick={() => onNavigate('events')} className="text-xs flex items-center gap-1"
              style={{ color: '#00d4aa' }}>
              All <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? [1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />) :
              events.filter(e => e.status === 'Upcoming').slice(0, 4).map((event, i) => {
                const d = new Date(event.start_date);
                const colors = ['#00d4aa', '#42a5f5', '#ffa726', '#ef5350'];
                const color = colors[i % colors.length];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex-shrink-0 text-center w-10">
                      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Space Grotesk' }}>{d.getDate()}</div>
                      <div style={{ fontSize: 10, color: '#8899bb', textTransform: 'uppercase' }}>
                        {d.toLocaleString('en', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }} className="truncate">{event.title}</div>
                      <div style={{ fontSize: 11, color: '#8899bb' }} className="truncate">{event.location}</div>
                      <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>
                        <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                        {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
                Urgent Grievances
              </h3>
              <p style={{ fontSize: 12, color: '#8899bb' }}>Require immediate attention</p>
            </div>
            <button onClick={() => onNavigate('grievances')} className="text-xs flex items-center gap-1"
              style={{ color: '#00d4aa' }}>
              Manage <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? [1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-xl" />) :
              urgentGrievances.length ? urgentGrievances.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(255,85,85,0.05)', border: '1px solid rgba(255,85,85,0.1)' }}
                  whileHover={{ scale: 1.01 }}
                >
                  <AlertCircle size={16} style={{ color: '#ff5555', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }} className="truncate">{g.subject}</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>{g.petitioner_name} · {g.category}</div>
                  </div>
                  <Badge variant={priorityBadge(g.priority)}>{g.priority}</Badge>
                </motion.div>
              )) : (
                <div className="text-center py-6">
                  <CheckCircle2 size={32} style={{ color: '#00c864', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#8899bb' }}>No urgent grievances</p>
                </div>
              )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
                Media Coverage
              </h3>
              <p style={{ fontSize: 12, color: '#8899bb' }}>Latest press mentions</p>
            </div>
            <button onClick={() => onNavigate('media')} className="text-xs flex items-center gap-1"
              style={{ color: '#00d4aa' }}>
              All <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? [1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-xl" />) :
              media.slice(0, 4).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex-shrink-0">
                    <Badge variant={m.sentiment === 'Positive' ? 'success' : m.sentiment === 'Negative' ? 'danger' : 'neutral'}>
                      {m.sentiment === 'Positive' ? '▲' : m.sentiment === 'Negative' ? '▼' : '●'}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#f0f4ff' }} className="line-clamp-2 leading-snug">
                      {m.headline}
                    </div>
                    <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>
                      {m.source} · {m.source_type} · {new Date(m.published_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity size={18} style={{ color: '#00d4aa' }} />
            <h3 className="font-semibold text-base" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
              Constituency Quick Stats
            </h3>
          </div>
          <button onClick={() => setConstModalOpen(true)} className="btn-secondary text-xs">Update Stats</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Total Voters', value: constProfile?.total_voters ? constProfile.total_voters.toLocaleString('en-IN') : '—', icon: Users, color: '#42a5f5' },
            { label: 'Mandals', value: constProfile?.total_mandals?.toString() || '—', icon: MapPin, color: '#00d4aa' },
            { label: 'Villages', value: constProfile?.total_villages?.toString() || '—', icon: MapPin, color: '#ffa726' },
            { label: 'Area (sq km)', value: constProfile?.area_sqkm ? constProfile.area_sqkm.toLocaleString('en-IN') : '—', icon: Target, color: '#ef5350' },
            { label: 'Party', value: activePolitician?.party || '—', icon: Star, color: '#ab47bc' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.07 }}
                className="text-center p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Icon size={20} style={{ color: item.color, margin: '0 auto 8px' }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>{item.value}</div>
                <div style={{ fontSize: 11, color: '#8899bb', marginTop: 2 }}>{item.label}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {constModalOpen && (
          <div className="modal-overlay" onClick={() => setConstModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-2xl w-full max-w-xl overflow-y-auto max-h-[90vh]"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#f0f4ff' }}>
                  Update Constituency Stats
                </h2>
                <button onClick={() => setConstModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={16} style={{ color: '#8899bb' }} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Constituency Name</label>
                    <input className="input-field" value={constForm.constituency_name || ''}
                      onChange={e => setConstForm(prev => ({ ...prev, constituency_name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>State</label>
                    <input className="input-field" value={constForm.state || ''}
                      onChange={e => setConstForm(prev => ({ ...prev, state: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Voters</label>
                    <input type="number" className="input-field" value={constForm.total_voters ?? ''}
                      onChange={e => setConstForm(prev => ({ ...prev, total_voters: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Registered Voters</label>
                    <input type="number" className="input-field" value={constForm.registered_voters ?? ''}
                      onChange={e => setConstForm(prev => ({ ...prev, registered_voters: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Mandals</label>
                    <input type="number" className="input-field" value={constForm.total_mandals ?? ''}
                      onChange={e => setConstForm(prev => ({ ...prev, total_mandals: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Total Villages</label>
                    <input type="number" className="input-field" value={constForm.total_villages ?? ''}
                      onChange={e => setConstForm(prev => ({ ...prev, total_villages: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Area (sq km)</label>
                    <input type="number" className="input-field" value={constForm.area_sqkm ?? ''}
                      onChange={e => setConstForm(prev => ({ ...prev, area_sqkm: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#8899bb', marginBottom: 6, display: 'block' }}>Population</label>
                    <input type="number" className="input-field" value={constForm.population ?? ''}
                      onChange={e => setConstForm(prev => ({ ...prev, population: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-white/10">
                <button onClick={() => setConstModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveConstituencyStats} className="btn-primary flex-1" disabled={constSaving}>
                  {constSaving ? 'Saving...' : 'Save Stats'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
