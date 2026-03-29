import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Grievances from './pages/Grievances';
import Events from './pages/Events';
import Team from './pages/Team';
import Projects from './pages/Projects';
import Media from './pages/Media';
import Finance from './pages/Finance';
import Analytics from './pages/Analytics';
import Communication from './pages/Communication';
import Documents from './pages/Documents';
import Voters from './pages/Voters';
import Constituency from './pages/Constituency';
import Settings from './pages/Settings';
import Appointments from './pages/Appointments';
import Polls from './pages/Polls';
import Darshan from './pages/Darshan';
import Legislative from './pages/Legislative';
import CitizenEngagement from './pages/CitizenEngagement';
import Profile from './pages/Profile';
import Parliamentary from './pages/Parliamentary';
import PoliticalBriefing from './pages/PoliticalBriefing';
import SuperAdmin from './pages/SuperAdmin';
import AIStudio from './pages/AIStudio';
import StaffManagement from './pages/StaffManagement';

function AppContent() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060b18' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(0,212,170,0.2)', borderTopColor: '#00d4aa' }} />
          <div style={{ fontSize: 13, color: '#8899bb' }}>Loading Nethra...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'constituency': return <Constituency />;
      case 'grievances': return <Grievances />;
      case 'events': return <Events />;
      case 'team': return <Team />;
      case 'voters': return <Voters />;
      case 'projects': return <Projects />;
      case 'media': return <Media />;
      case 'communication': return <Communication />;
      case 'finance': return <Finance />;
      case 'analytics': return <Analytics />;
      case 'documents': return <Documents />;
      case 'settings': return <Settings />;
      case 'appointments': return <Appointments />;
      case 'polls': return <Polls />;
      case 'darshan': return <Darshan />;
      case 'legislative': return <Legislative />;
      case 'citizen': return <CitizenEngagement />;
      case 'profile': return <Profile />;
      case 'parliamentary': return <Parliamentary />;
      case 'briefing': return <PoliticalBriefing />;
      case 'superadmin': return <SuperAdmin />;
      case 'ai-studio': return <AIStudio />;
      case 'staff-management': return <StaffManagement />;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
