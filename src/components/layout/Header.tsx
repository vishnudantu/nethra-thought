import { motion } from 'framer-motion';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
}

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back, overview of your constituency' },
  profile: { title: 'Politician Profile', subtitle: 'Manage your public profile and bio' },
  constituency: { title: 'Constituency', subtitle: 'Constituency details and demographics' },
  grievances: { title: 'Grievances', subtitle: 'Citizen petitions and complaint management' },
  appointments: { title: 'Appointments', subtitle: 'Schedule and appointment management' },
  events: { title: 'Events & Schedule', subtitle: 'Calendar and event management' },
  team: { title: 'Team Management', subtitle: 'Staff and team member directory' },
  voters: { title: 'Voter Database', subtitle: 'Constituent records and voter data' },
  polls: { title: 'Polls & Surveys', subtitle: 'Opinion polls and constituency surveys' },
  legislative: { title: 'Legislative', subtitle: 'Bills, acts and legislative activities' },
  citizen: { title: 'Citizen Engagement', subtitle: 'Community outreach and engagement' },
  darshan: { title: 'Tirupati Darshan', subtitle: 'Darshan booking and management' },
  parliamentary: { title: 'Parliamentary', subtitle: 'Parliamentary activities and questions' },
  omniscan: { title: 'OmniScan', subtitle: '24/7 media and social intelligence pipeline' },
  'morning-brief': { title: 'Morning Brief', subtitle: 'Daily intelligence summary and priorities' },
  briefing: { title: 'Political Briefings', subtitle: 'AI-powered political intelligence' },
  projects: { title: 'Development Projects', subtitle: 'Infrastructure and development tracking' },
  media: { title: 'Media Monitor', subtitle: 'Press coverage and sentiment analysis' },
  communication: { title: 'Communication Hub', subtitle: 'Mass outreach and messaging' },
  finance: { title: 'Finance & Budget', subtitle: 'Fund allocation and expenditure tracking' },
  analytics: { title: 'Analytics', subtitle: 'Insights and performance metrics' },
  documents: { title: 'Documents', subtitle: 'Official documents and files' },
  settings: { title: 'Settings', subtitle: 'Application preferences' },
  superadmin: { title: 'Platform Administration', subtitle: 'Deploy and manage politician accounts' },
  'ai-studio': { title: 'AI Studio', subtitle: 'Generate speeches, briefings and political content with AI' },
  sentiment: { title: 'Sentiment Dashboard', subtitle: 'Real-time constituency mood and trends' },
  opposition: { title: 'Opposition Tracker', subtitle: 'Monitor opposition activity and threats' },
  'voice-intelligence': { title: 'Voice Intelligence', subtitle: 'Field voice reports and transcription' },
  'staff-management': { title: 'Staff Management', subtitle: 'Create and manage login accounts for your team' },
};

export default function Header({ title, sidebarCollapsed, onToggleSidebar, isMobile, mobileMenuOpen }: HeaderProps) {
  const { activePolitician } = useAuth();
  const info = pageInfo[title] || { title, subtitle: '' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';
  const initials = activePolitician?.full_name
    ? activePolitician.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'NA';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(6, 11, 24, 0.96), rgba(6, 11, 24, 0.82))',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        minHeight: 64,
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}
        >
          {(isMobile ? mobileMenuOpen : !sidebarCollapsed) ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div className="min-w-0">
          <h1 className="font-bold text-base sm:text-lg truncate" style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, sans-serif' }}>
            {info.title}
          </h1>
          <p className="hidden sm:block truncate" style={{ fontSize: 12, color: '#8899bb' }}>{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 200 }}>
          <Search size={15} style={{ color: '#8899bb' }} />
          <input
            type="text"
            placeholder="Search..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f0f4ff', fontSize: 13, width: '100%' }}
          />
        </div>

        <button className="hidden md:flex lg:hidden w-9 h-9 rounded-xl items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899bb' }}>
          <Search size={16} />
        </button>

        <div className="hidden xl:block text-right">
          <div style={{ fontSize: 11, color: '#8899bb' }}>{dateStr}</div>
          <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600 }}>
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="relative">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
            <Bell size={17} />
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#ff5555', color: '#fff', fontSize: 9 }}>3</span>
        </div>

        <div className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#060b18' }}>{initials}</span>
        </div>
      </div>
    </motion.header>
  );
}
