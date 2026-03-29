import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from '../ai/AIAssistant';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const { activePolitician } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // always starts closed on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const primaryColor = activePolitician?.color_primary || '#00d4aa';
  const secondaryColor = activePolitician?.color_secondary || '#1e88e5';

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function handleNavigate(page: string) {
    onNavigate(page);
    if (isMobile) setMobileOpen(false);
  }

  const sidebarWidth = sidebarCollapsed ? 72 : 256;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={isMobile ? 'fixed left-0 top-0 h-full z-50' : ''}
        style={isMobile ? {
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          width: 256,
          maxWidth: '85vw',
        } : {}}
      >
        <Sidebar
          active={activePage}
          onNavigate={handleNavigate}
          collapsed={isMobile ? false : sidebarCollapsed}
        />
      </div>

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <Header
          title={activePage}
          sidebarCollapsed={isMobile ? false : sidebarCollapsed}
          onToggleSidebar={() => isMobile ? setMobileOpen(o => !o) : setSidebarCollapsed(c => !c)}
          isMobile={isMobile}
          mobileMenuOpen={mobileOpen}
        />

        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div style={{
          position: 'absolute', top: -200, right: -200, width: 600, height: 600,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute', bottom: -200, left: -100, width: 500, height: 500,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,136,229,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
      </div>

      <AnimatePresence>
        {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} />}
      </AnimatePresence>

      {!aiOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 8px 32px ${primaryColor}40, 0 4px 16px rgba(0,0,0,0.4)`,
          }}
          title="Open NETHRA AI"
        >
          <Sparkles size={22} color="#060b18" strokeWidth={2.5} />
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            animate={{ opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.button>
      )}
    </div>
  );
}
