import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Calendar, Users, Newspaper, TrendingUp, FolderOpen,
  MessageSquare, Map, BarChart3, Settings, ChevronRight, Wallet, UserCheck, Zap,
  CalendarCheck, PieChart, Star, Scale, Megaphone, CircleUser as UserCircle,
  Building2, Sparkles, LogOut, ChevronDown, Shield, Check, BrainCircuit, Activity, Clock, Eye, Mic
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  group?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'core' },
  { id: 'profile', label: 'Politician Profile', icon: UserCircle, group: 'core' },
  { id: 'constituency', label: 'Constituency', icon: Map, group: 'core' },
  { id: 'grievances', label: 'Grievances', icon: FileText, badge: 5, group: 'core' },
  { id: 'appointments', label: 'Appointments', icon: CalendarCheck, group: 'core' },
  { id: 'events', label: 'Events', icon: Calendar, group: 'core' },
  { id: 'voters', label: 'Voter Database', icon: UserCheck, group: 'political' },
  { id: 'polls', label: 'Polls & Surveys', icon: PieChart, group: 'political' },
  { id: 'legislative', label: 'Legislative', icon: Scale, group: 'political' },
  { id: 'citizen', label: 'Citizen Engagement', icon: Megaphone, group: 'political' },
  { id: 'darshan', label: 'Tirupati Darshan', icon: Star, group: 'services' },
  { id: 'parliamentary', label: 'Parliamentary', icon: Building2, group: 'services' },
  { id: 'ai-studio', label: 'AI Studio', icon: BrainCircuit, group: 'services' },
  { id: 'omniscan', label: 'OmniScan', icon: Activity, group: 'intelligence' },
  { id: 'morning-brief', label: 'Morning Brief', icon: Clock, group: 'intelligence' },
  { id: 'sentiment', label: 'Sentiment Dashboard', icon: BarChart3, group: 'intelligence' },
  { id: 'opposition', label: 'Opposition Tracker', icon: Eye, group: 'intelligence' },
  { id: 'voice-intelligence', label: 'Voice Intelligence', icon: Mic, group: 'intelligence' },
  { id: 'briefing', label: 'Political Briefings', icon: Sparkles, group: 'intelligence' },
  { id: 'projects', label: 'Dev Projects', icon: TrendingUp, group: 'admin' },
  { id: 'media', label: 'Media Monitor', icon: Newspaper, group: 'admin' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, group: 'admin' },
  { id: 'finance', label: 'Finance', icon: Wallet, group: 'admin' },
  { id: 'team', label: 'Team', icon: Users, group: 'admin' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'admin' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'admin' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'admin' },
  { id: 'staff-management', label: 'Staff Management', icon: Users, group: 'admin', adminOnly: true },
  { id: 'superadmin', label: 'Platform Admin', icon: Shield, group: 'admin', adminOnly: true },
];

const groupLabels: Record<string, string> = {
  core: 'CORE',
  political: 'POLITICAL',
  services: 'SERVICES',
  intelligence: 'INTELLIGENCE',
  admin: 'ADMINISTRATION',
};

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
}

export default function Sidebar({ active, onNavigate, collapsed }: SidebarProps) {
  const { userRole, activePolitician, allPoliticians, setActivePolitician, signOut } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const groups = ['core', 'political', 'services', 'intelligence', 'admin'];
  const isSuperAdmin = userRole?.role === 'super_admin';

  const isPoliticianAdmin = userRole?.role === 'politician_admin';
  const visibleItems = navItems.filter(item =>
    !item.adminOnly || isSuperAdmin || (isPoliticianAdmin && item.id === 'staff-management')
  );
  // Debug: force superadmin item if role is super_admin
  const finalItems = isSuperAdmin
    ? [...visibleItems.filter(i => i.id !== 'superadmin'), navItems.find(i => i.id === 'superadmin')!]
    : visibleItems.filter(i => i.id !== 'superadmin');

  const initials = activePolitician?.full_name
    ? activePolitician.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'NA';

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';

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
                  {groupLabels[group]}
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
                        {item.label}
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
                  {activePolitician?.full_name || 'Loading...'}
                </div>
                <div className="truncate" style={{ fontSize: 10, color: '#8899bb' }}>
                  {activePolitician?.designation || userRole?.role?.replace('_', ' ')} • {activePolitician?.constituency_name || ''}
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
