import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Calendar, Users, Newspaper, TrendingUp, FolderOpen,
  MessageSquare, Map, BarChart3, Settings, ChevronRight, Wallet, UserCheck, Zap,
  CalendarCheck, PieChart, Star, Scale, Megaphone, CircleUser as UserCircle,
  Building2, Sparkles, LogOut, ChevronDown, Shield, Check, BrainCircuit, Activity, Clock, Eye, Mic,
  Box, Flag, MessageCircleWarning, Radar, Bot, ShieldAlert, Network, LineChart, Handshake, FileCheck2,
  Users2, Cpu, Target, Wand2, Globe, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  group?: string;
  adminOnly?: boolean;
  moduleKey?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'core', moduleKey: 'dashboard' },
  { id: 'quick-capture', label: 'Quick Capture', icon: Wand2, group: 'core', moduleKey: 'dashboard' },
  { id: 'profile', label: 'Politician Profile', icon: UserCircle, group: 'core', moduleKey: 'profile' },
  { id: 'constituency', label: 'Constituency', icon: Map, group: 'core', moduleKey: 'constituency' },
  { id: 'grievances', label: 'Grievances', icon: FileText, badge: 5, group: 'core', moduleKey: 'grievances' },
  { id: 'appointments', label: 'Appointments', icon: CalendarCheck, group: 'core', moduleKey: 'appointments' },
  { id: 'events', label: 'Events', icon: Calendar, group: 'core', moduleKey: 'events' },
  { id: 'voters', label: 'Voter Database', icon: UserCheck, group: 'political', moduleKey: 'voters' },
  { id: 'polls', label: 'Polls & Surveys', icon: PieChart, group: 'political', moduleKey: 'polls' },
  { id: 'booths', label: 'Booth Management', icon: Box, group: 'political', moduleKey: 'booths' },
  { id: 'legislative', label: 'Legislative', icon: Scale, group: 'political', moduleKey: 'legislative' },
  { id: 'citizen', label: 'Citizen Engagement', icon: Megaphone, group: 'political', moduleKey: 'citizen' },
  { id: 'darshan', label: 'Tirupati Darshan', icon: Star, group: 'services', moduleKey: 'darshan' },
  { id: 'darshans', label: 'Darshans', icon: Map, group: 'services', moduleKey: 'darshans' },
  { id: 'parliamentary', label: 'Parliamentary', icon: Building2, group: 'services', moduleKey: 'parliamentary' },
  { id: 'ai-studio', label: 'AI Studio', icon: BrainCircuit, group: 'services', moduleKey: 'ai-studio' },
  { id: 'omniscan', label: 'OmniScan', icon: Activity, group: 'intelligence', moduleKey: 'omniscan' },
  { id: 'morning-brief', label: 'Morning Brief', icon: Clock, group: 'intelligence', moduleKey: 'morning-brief' },
  { id: 'sentiment', label: 'Sentiment Dashboard', icon: BarChart3, group: 'intelligence', moduleKey: 'sentiment' },
  { id: 'opposition', label: 'Opposition Tracker', icon: Eye, group: 'intelligence', moduleKey: 'opposition' },
  { id: 'voice-intelligence', label: 'Voice Intelligence', icon: Mic, group: 'intelligence', moduleKey: 'voice-intelligence' },
  { id: 'promises', label: 'Promises Tracker', icon: Flag, group: 'intelligence', moduleKey: 'promises' },
  { id: 'content-factory', label: 'Content Factory', icon: Sparkles, group: 'intelligence', moduleKey: 'content-factory' },
  { id: 'whatsapp-intelligence', label: 'WhatsApp Intel', icon: MessageCircleWarning, group: 'intelligence', moduleKey: 'whatsapp-intelligence' },
  { id: 'smart-visit', label: 'Smart Visit Planner', icon: Map, group: 'intelligence', moduleKey: 'smart-visit' },
  { id: 'briefing', label: 'Political Briefings', icon: Sparkles, group: 'intelligence', moduleKey: 'briefing' },
  { id: 'predictive-crisis', label: 'Predictive Crisis', icon: Radar, group: 'future', moduleKey: 'predictive-crisis' },
  { id: 'agent-system', label: 'Agent System', icon: Bot, group: 'future', moduleKey: 'agent-system' },
  { id: 'deepfake-shield', label: 'Deepfake Shield', icon: ShieldAlert, group: 'future', moduleKey: 'deepfake-shield' },
  { id: 'coalition-forecast', label: 'Coalition Forecast', icon: Handshake, group: 'future', moduleKey: 'coalition-forecast' },
  { id: 'crisis-war-room', label: 'Crisis War Room', icon: AlertTriangle, group: 'future', moduleKey: 'crisis-war-room' },
  { id: 'relationship-graph', label: 'Relationship Graph', icon: Network, group: 'future', moduleKey: 'relationship-graph' },
  { id: 'economic-intelligence', label: 'Economic Intelligence', icon: LineChart, group: 'future', moduleKey: 'economic-intelligence' },
  { id: 'citizen-services', label: 'Citizen Services', icon: Handshake, group: 'future', moduleKey: 'citizen-services' },
  { id: 'election-command', label: 'Election Command', icon: Target, group: 'future', moduleKey: 'election-command' },
  { id: 'finance-compliance', label: 'Finance Compliance', icon: FileCheck2, group: 'future', moduleKey: 'finance-compliance' },
  { id: 'party-integration', label: 'Party Integration', icon: Users2, group: 'future', moduleKey: 'party-integration' },
  { id: 'digital-twin', label: 'Digital Twin', icon: Cpu, group: 'future', moduleKey: 'digital-twin' },
  { id: 'projects', label: 'Dev Projects', icon: TrendingUp, group: 'admin', moduleKey: 'projects' },
  { id: 'media', label: 'Media Monitor', icon: Newspaper, group: 'admin', moduleKey: 'media' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, group: 'admin', moduleKey: 'communication' },
  { id: 'finance', label: 'Finance', icon: Wallet, group: 'admin', moduleKey: 'finance' },
  { id: 'team', label: 'Team', icon: Users, group: 'admin', moduleKey: 'team' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'admin', moduleKey: 'analytics' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'admin', moduleKey: 'documents' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'admin', moduleKey: 'settings' },
  { id: 'website-admin', label: 'Website CMS', icon: Globe, group: 'admin', adminOnly: true, moduleKey: 'superadmin' },
  { id: 'staff-management', label: 'Staff Management', icon: Users, group: 'admin', adminOnly: true, moduleKey: 'staff-management' },
  { id: 'superadmin', label: 'Platform Admin', icon: Shield, group: 'admin', adminOnly: true, moduleKey: 'superadmin' },
];

const groupLabelKeys: Record<string, string> = {
  core: 'group.core',
  political: 'group.political',
  services: 'group.services',
  intelligence: 'group.intelligence',
  future: 'group.future',
  admin: 'group.admin',
};

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
}

export default function Sidebar({ active, onNavigate, collapsed }: SidebarProps) {
  const { userRole, user, activePolitician, allPoliticians, setActivePolitician, signOut, hasModule } = useAuth();
  const { t } = useI18n();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const role = (userRole?.role || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isFieldWorker = role === 'field_worker';
  const isStaff = role === 'staff';
  const groups = isSuperAdmin ? ['admin'] : isFieldWorker ? ['core', 'intelligence'] : ['core', 'political', 'services', 'intelligence', 'future', 'admin'];
  const superAdminNavIds = new Set(['superadmin', 'website-admin']);
  const fieldWorkerNavIds = new Set(['dashboard', 'quick-capture', 'voice-intelligence', 'grievances', 'appointments', 'events']);
  const staffRestrictedIds = new Set(['voters', 'finance', 'finance-compliance']);
  const isPoliticianAdmin = role === 'politician_admin';
  const visibleItems = isSuperAdmin
    ? navItems.filter(item => superAdminNavIds.has(item.id))
    : navItems.filter(item => {
      if (isFieldWorker) return fieldWorkerNavIds.has(item.id);
      if (isStaff && staffRestrictedIds.has(item.id)) return false;
      return (!item.adminOnly || isSuperAdmin || (isPoliticianAdmin && item.id === 'staff-management')) &&
        (!item.moduleKey || hasModule(item.moduleKey));
    });
  const finalItems = visibleItems.filter(i => i.id !== 'superadmin').concat(visibleItems.find(i => i.id === 'superadmin') ? [visibleItems.find(i => i.id === 'superadmin')!] : []);

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';
  const profileName = (() => {
    if (!isSuperAdmin) return activePolitician?.full_name || 'Loading...';
    if (user?.display_name) return user.display_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Super Admin';
  })();
  const initials = profileName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const profileSubtitle = isSuperAdmin
    ? 'Founder Command Center'
    : `${activePolitician?.designation || userRole?.role?.replace('_', ' ') || ''}${activePolitician?.constituency_name ? ` • ${activePolitician.constituency_name}` : ''}`;

  function handleSignOut() {
    setSigningOut(true);
    signOut();
    window.location.href = '/';
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(6, 11, 24, 0.98), rgba(10, 16, 32, 0.95))',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '10px 0 30px rgba(0,0,0,0.35)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: 72 }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          <Zap size={20} color="#060b18" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-bold text-base tracking-wide gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NETHRA</div>
            <div style={{ fontSize: 10, color: '#8899bb', letterSpacing: '0.5px', marginTop: 1 }}>POLITICAL INTELLIGENCE</div>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {groups.map(group => {
          const items = finalItems.filter(i => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {!collapsed && (
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(136,153,187,0.5)', letterSpacing: '1px', padding: '8px 10px 4px', marginTop: group !== 'core' ? 8 : 0 }}>
                  {t(groupLabelKeys[group] || group)}
                </div>
              )}
              {collapsed && group !== 'core' && <div style={{ height: 8 }} />}
              {items.map((item, index) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    onClick={() => onNavigate(item.id)}
                    className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 ${isActive ? 'active' : ''}`}
                    style={{
                      color: isActive ? primaryColor : '#8899bb',
                      background: isActive ? `linear-gradient(135deg, ${primaryColor}1a, ${secondaryColor}1a)` : undefined,
                    }}
                    whileHover={{ x: 4, boxShadow: `0 10px 24px ${primaryColor}25` }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-medium flex-1 truncate"
                      >
                        {(() => {
                          const label = t(`nav.${item.id}`);
                          return label.startsWith('nav.') ? item.label : label;
                        })()}
                      </motion.span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,85,85,0.2)', color: '#ff5555', fontSize: 10 }}>
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {isSuperAdmin && allPoliticians.length > 1 && (
            <div className="relative mb-2">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4ff' }}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#060b18', fontSize: 9 }}>
                  {initials}
                </div>
                <span className="flex-1 text-left truncate" style={{ fontSize: 11, color: '#8899bb' }}>
                  {activePolitician?.full_name || 'Select Politician'}
                </span>
                <ChevronDown size={12} style={{ color: '#8899bb', transform: switcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {switcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden"
                    style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', maxHeight: 200, overflowY: 'auto', zIndex: 100 }}
                  >
                    {allPoliticians.map(pol => (
                      <button
                        key={pol.id}
                        onClick={() => { setActivePolitician(pol); setSwitcherOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all hover:bg-white/5 text-left"
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${pol.color_primary || '#00d4aa'}, ${pol.color_secondary || '#1e88e5'})`, color: '#060b18', fontSize: 8 }}>
                          {pol.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 500 }}>{pol.full_name}</div>
                          <div className="truncate" style={{ fontSize: 10, color: '#8899bb' }}>{pol.constituency_name}</div>
                        </div>
                        {activePolitician?.id === pol.id && <Check size={12} style={{ color: primaryColor, flexShrink: 0 }} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="rounded-xl p-3" style={{ background: `${primaryColor}0d`, border: `1px solid ${primaryColor}26` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#060b18' }}>{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>
                  {profileName}
                </div>
                <div className="truncate" style={{ fontSize: 10, color: '#8899bb' }}>
                  {profileSubtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: primaryColor }}></div>
                <span style={{ fontSize: 10, color: '#8899bb' }}>
                  {isSuperAdmin ? 'Super Admin' : 'Online'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-1 transition-all"
                style={{ fontSize: 10, color: '#8899bb' }}
                title="Sign out"
              >
                <LogOut size={11} />
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleSignOut}
            className="w-full h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ color: '#8899bb' }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </motion.aside>
  );
}
