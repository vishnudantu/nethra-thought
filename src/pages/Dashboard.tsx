import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  FileText, Calendar, Users, TrendingUp, ArrowUp, ArrowDown,
  AlertCircle, CheckCircle2, Clock, Newspaper, Wallet,
  Activity, Target, MapPin, ChevronRight, Zap, Star
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Badge from '../components/ui/Badge';
import { statusBadge, priorityBadge } from '../components/ui/badgeUtils';
import type { Grievance, Event, Finance, MediaMention, Project, TeamMember } from '../lib/types';

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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [media, setMedia] = useState<MediaMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGrievances: 0, pendingGrievances: 0, resolvedGrievances: 0,
    totalProjects: 0, totalTeam: 0, upcomingEvents: 0,
    positiveMedia: 0, totalBudget: 0,
  });

  useEffect(() => {
    async function fetchAll() {
      const [grievanceDataRaw, eventsDataRaw, projectsDataRaw, mediaDataRaw, teamDataRaw, finDataRaw] = await Promise.all([
        api.list('grievances', { order: 'created_at', dir: 'DESC', limit: '50' }),
        api.list('events', { order: 'start_date', dir: 'ASC', limit: '5' }),
        api.list('projects', { order: 'created_at', dir: 'DESC', limit: '5' }),
        api.list('media_mentions', { order: 'created_at', dir: 'DESC', limit: '5' }),
        api.list('team_members'),
        api.list('finances'),
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
  }, []);

  const statCards = [
    { icon: FileText, label: 'Total Grievances', value: loading ? '...' : stats.totalGrievances.toString(), change: '+12%', color: '#42a5f5', bg: '#1e88e5' },
    { icon: AlertCircle, label: 'Pending Action', value: loading ? '...' : stats.pendingGrievances.toString(), change: '-8%', color: '#ffa726', bg: '#ff8c00' },
    { icon: CheckCircle2, label: 'Resolved', value: loading ? '...' : stats.resolvedGrievances.toString(), change: '+18%', color: '#00c864', bg: '#00c864' },
    { icon: TrendingUp, label: 'Active Projects', value: loading ? '...' : stats.totalProjects.toString(), change: '+2%', color: '#00d4aa', bg: '#00d4aa' },
    { icon: Users, label: 'Team Members', value: loading ? '...' : stats.totalTeam.toString(), color: '#e0e0e0', bg: '#9e9e9e' },
    { icon: Calendar, label: 'Upcoming Events', value: loading ? '...' : stats.upcomingEvents.toString(), color: '#ab47bc', bg: '#ab47bc' },
    { icon: Newspaper, label: 'Positive Coverage', value: loading ? '...' : stats.positiveMedia.toString(), change: '+5%', color: '#26c6da', bg: '#26c6da' },
    { icon: Wallet, label: 'MPLADS Funds (Cr)', value: loading ? '...' : (stats.totalBudget / 10000000).toFixed(1), change: '+0%', color: '#ef5350', bg: '#ef5350' },
  ];

  const urgentGrievances = grievances.filter(g => g.priority === 'Urgent' || g.status === 'Escalated').slice(0, 4);

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
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} style={{ color: '#00d4aa' }} />
          <h3 className="font-semibold text-base" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk' }}>
            Constituency Quick Stats
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Total Voters', value: '18.5L', icon: Users, color: '#42a5f5' },
            { label: 'Mandals', value: '57', icon: MapPin, color: '#00d4aa' },
            { label: 'Villages', value: '684', icon: MapPin, color: '#ffa726' },
            { label: 'Area (sq km)', value: '1,542', icon: Target, color: '#ef5350' },
            { label: 'Party', value: 'TDP', icon: Star, color: '#ab47bc' },
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
    </div>
  );
}
