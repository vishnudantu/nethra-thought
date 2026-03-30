import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Bell, Search, Menu, X, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
  onNavigate: (page: string) => void;
}

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back, overview of your constituency' },
  'quick-capture': { title: 'Quick Capture', subtitle: 'Voice-first capture for field workers' },
  profile: { title: 'Politician Profile', subtitle: 'Manage your public profile and bio' },
  constituency: { title: 'Constituency', subtitle: 'Constituency details and demographics' },
  grievances: { title: 'Grievances', subtitle: 'Citizen petitions and complaint management' },
  appointments: { title: 'Appointments', subtitle: 'Schedule and appointment management' },
  events: { title: 'Events & Schedule', subtitle: 'Calendar and event management' },
  team: { title: 'Team Management', subtitle: 'Staff and team member directory' },
  voters: { title: 'Voter Database', subtitle: 'Constituent records and voter data' },
  polls: { title: 'Polls & Surveys', subtitle: 'Opinion polls and constituency surveys' },
  booths: { title: 'Booth Management', subtitle: 'Booth-level data and election agents' },
  legislative: { title: 'Legislative', subtitle: 'Bills, acts and legislative activities' },
  citizen: { title: 'Citizen Engagement', subtitle: 'Community outreach and engagement' },
  darshan: { title: 'Tirupati Darshan', subtitle: 'Darshan booking and management' },
  darshans: { title: 'Darshans', subtitle: 'Multi-temple darshan requests' },
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
  promises: { title: 'Promises Tracker', subtitle: 'Track public commitments and fulfillment' },
  'content-factory': { title: 'Content Factory', subtitle: 'Automated political content generation' },
  'whatsapp-intelligence': { title: 'WhatsApp Intelligence', subtitle: 'WhatsApp signals, alerts, and routing' },
  'smart-visit': { title: 'Smart Visit Planner', subtitle: 'AI-recommended constituency visits' },
  'predictive-crisis': { title: 'Predictive Crisis Intelligence', subtitle: 'Early warning risk signals' },
  'agent-system': { title: 'Autonomous Agent System', subtitle: 'AI agent task orchestration' },
  'deepfake-shield': { title: 'Deepfake Shield', subtitle: 'Disinformation and deepfake defense' },
  'coalition-forecast': { title: 'Coalition Forecasting', subtitle: 'Alliance modeling and coalition viability' },
  'crisis-war-room': { title: 'Crisis War Room', subtitle: 'Incident response and war room playbooks' },
  'relationship-graph': { title: 'Relationship Graph', subtitle: 'Political relationship intelligence' },
  'economic-intelligence': { title: 'Economic Intelligence', subtitle: 'Local economic signals and stress' },
  'citizen-services': { title: 'Citizen Services', subtitle: 'Constituent service request hub' },
  'election-command': { title: 'Election Command Center', subtitle: 'Election day operations and updates' },
  'finance-compliance': { title: 'Financial Compliance', subtitle: 'Expense compliance and audit readiness' },
  'party-integration': { title: 'Party Integration', subtitle: 'Party-level coordination and sync' },
  'digital-twin': { title: 'Digital Twin', subtitle: 'Scenario simulation and persona outputs' },
  'staff-management': { title: 'Staff Management', subtitle: 'Create and manage login accounts for your team' },
  'website-admin': { title: 'Website CMS', subtitle: 'Manage website content blocks' },
};

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  page: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string;
  is_read: number;
  created_at: string;
}

export default function Header({ title, sidebarCollapsed, onToggleSidebar, isMobile, mobileMenuOpen, onNavigate }: HeaderProps) {
  const { activePolitician, signOut } = useAuth();
  const { t, languages, language, setLanguage } = useI18n();
  const info = pageInfo[title] || { title, subtitle: '' };
  const translatedTitle = (() => {
    const label = t(`nav.${title}`);
    return label.startsWith('nav.') ? info.title : label;
  })();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';
  const initials = activePolitician?.full_name
    ? activePolitician.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'NA';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    if (searchQuery.trim()) {
      setLoadingSearch(true);
      timer = window.setTimeout(async () => {
        try {
          const data = await api.get(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`) as SearchResult[];
          setSearchResults(data || []);
        } catch {
          setSearchResults([]);
        }
        setLoadingSearch(false);
      }, 300);
    } else {
      setSearchResults([]);
      setLoadingSearch(false);
    }
    return () => { if (timer) window.clearTimeout(timer); };
  }, [searchQuery]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await api.get('/api/notifications?limit=10') as NotificationItem[];
        setNotifications(data || []);
      } catch {
        setNotifications([]);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  async function markNotificationRead(id: string) {
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {
      // ignore
    }
  }

  function handleSignOut() {
    signOut();
    window.location.href = '/';
  }

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
            {translatedTitle}
          </h1>
          <p className="hidden sm:block truncate" style={{ fontSize: 12, color: '#8899bb' }}>{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div ref={searchRef} className="relative">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 220 }}>
            <Search size={15} style={{ color: '#8899bb' }} />
            <input
              type="text"
              placeholder={t('header.search')}
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f0f4ff', fontSize: 13, width: '100%' }}
            />
          </div>

          <button className="hidden md:flex lg:hidden w-9 h-9 rounded-xl items-center justify-center"
            onClick={() => setSearchOpen(o => !o)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899bb' }}>
            <Search size={16} />
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-xl overflow-hidden z-40"
              style={{ background: 'rgba(8,14,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="p-3 border-b border-white/10 lg:hidden">
                <input
                  type="text"
                  placeholder={t('header.search')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                />
              </div>
              {loadingSearch ? (
                <div className="p-4 text-sm" style={{ color: '#8899bb' }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm" style={{ color: '#8899bb' }}>No results.</div>
              ) : (
                searchResults.map(result => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => { onNavigate(result.page); setSearchOpen(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 600 }}>{result.title}</div>
                    <div style={{ fontSize: 11, color: '#8899bb' }}>{result.subtitle}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="hidden xl:block text-right">
          <div style={{ fontSize: 11, color: '#8899bb' }}>{dateStr}</div>
          <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600 }}>
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div ref={notifRef} className="relative">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            onClick={() => setNotificationsOpen(o => !o)}
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899bb' }}>
            <Bell size={17} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#ff5555', color: '#fff', fontSize: 9 }}>{unreadCount}</span>
          )}
          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-xl overflow-hidden z-40"
              style={{ background: 'rgba(8,14,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 text-xs font-semibold" style={{ color: '#8899bb' }}>
                {t('header.notifications')}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 pb-4 text-sm" style={{ color: '#8899bb' }}>No notifications yet.</div>
              ) : notifications.map(note => (
                <button
                  key={note.id}
                  onClick={() => { if (note.link) onNavigate(note.link); markNotificationRead(note.id); setNotificationsOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 600 }}>{note.title}</div>
                  <div style={{ fontSize: 11, color: '#8899bb' }}>{note.message}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center flex-shrink-0"
            onClick={() => setProfileOpen(o => !o)}
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#060b18' }}>{initials}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl overflow-hidden z-40"
              style={{ background: 'rgba(8,14,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => { onNavigate('profile'); setProfileOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-2">
                <User size={14} /> <span>{t('header.profile')}</span>
              </button>
              <button onClick={() => { onNavigate('settings'); setProfileOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-2">
                <Settings size={14} /> <span>{t('header.settings')}</span>
              </button>
              <div className="px-4 py-3 border-t border-white/10">
                <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 8 }}>Language</div>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as typeof language)}
                  className="w-full rounded-lg px-2 py-1.5 text-xs"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                >
                  {languages.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleSignOut}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-white/10">
                <LogOut size={14} /> <span>{t('header.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
