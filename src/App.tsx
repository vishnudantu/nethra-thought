import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { LanguageProvider } from './lib/i18n';
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
import Darshans from './pages/Darshans';
import Legislative from './pages/Legislative';
import CitizenEngagement from './pages/CitizenEngagement';
import Profile from './pages/Profile';
import Parliamentary from './pages/Parliamentary';
import PoliticalBriefing from './pages/PoliticalBriefing';
import SuperAdmin from './pages/SuperAdmin';
import AIStudio from './pages/AIStudio';
import StaffManagement from './pages/StaffManagement';
import OmniScan from './pages/OmniScan';
import MorningBrief from './pages/MorningBrief';
import SentimentDashboard from './pages/SentimentDashboard';
import OppositionTracker from './pages/OppositionTracker';
import VoiceIntelligence from './pages/VoiceIntelligence';
import QuickCapture from './pages/QuickCapture';
import WebsiteAdmin from './pages/WebsiteAdmin';
import BoothManagement from './pages/BoothManagement';
import PromisesTracker from './pages/PromisesTracker';
import ContentFactory from './pages/ContentFactory';
import WhatsAppIntelligence from './pages/WhatsAppIntelligence';
import SmartVisitPlanner from './pages/SmartVisitPlanner';
import PredictiveCrisis from './pages/PredictiveCrisis';
import AgentSystem from './pages/AgentSystem';
import DeepfakeShield from './pages/DeepfakeShield';
import RelationshipGraph from './pages/RelationshipGraph';
import EconomicIntelligence from './pages/EconomicIntelligence';
import CitizenServices from './pages/CitizenServices';
import ElectionCommandCenter from './pages/ElectionCommandCenter';
import FinancialCompliance from './pages/FinancialCompliance';
import PartyIntegration from './pages/PartyIntegration';
import DigitalTwin from './pages/DigitalTwin';

function AppContent() {
  const { user, loading, hasModule } = useAuth();
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
    if (!hasModule(activePage)) {
      return (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff7777' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Module Disabled</div>
          <div style={{ fontSize: 12, color: '#ff9999', marginTop: 6 }}>
            This module has been disabled by the Super Admin for your account.
          </div>
        </div>
      );
    }
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'quick-capture': return <QuickCapture />;
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
      case 'booths': return <BoothManagement />;
      case 'darshan': return <Darshan />;
      case 'darshans': return <Darshans />;
      case 'legislative': return <Legislative />;
      case 'citizen': return <CitizenEngagement />;
      case 'profile': return <Profile />;
      case 'parliamentary': return <Parliamentary />;
      case 'briefing': return <PoliticalBriefing />;
      case 'omniscan': return <OmniScan />;
      case 'morning-brief': return <MorningBrief />;
      case 'sentiment': return <SentimentDashboard />;
      case 'opposition': return <OppositionTracker />;
      case 'voice-intelligence': return <VoiceIntelligence />;
      case 'website-admin': return <WebsiteAdmin />;
      case 'promises': return <PromisesTracker />;
      case 'content-factory': return <ContentFactory />;
      case 'whatsapp-intelligence': return <WhatsAppIntelligence />;
      case 'smart-visit': return <SmartVisitPlanner />;
      case 'predictive-crisis': return <PredictiveCrisis />;
      case 'agent-system': return <AgentSystem />;
      case 'deepfake-shield': return <DeepfakeShield />;
      case 'relationship-graph': return <RelationshipGraph />;
      case 'economic-intelligence': return <EconomicIntelligence />;
      case 'citizen-services': return <CitizenServices />;
      case 'election-command': return <ElectionCommandCenter />;
      case 'finance-compliance': return <FinancialCompliance />;
      case 'party-integration': return <PartyIntegration />;
      case 'digital-twin': return <DigitalTwin />;
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
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
