import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import pool from './db.js';
import { signToken, authMiddleware } from './auth.js';
import {
  initQueues,
  enqueueOmniScan,
  enqueueMorningBrief,
  enqueueSentimentUpdate,
  enqueueContentPack,
  enqueueVisitPlanner,
  enqueueAgentSystem,
  enqueueDeepfakeScan,
  enqueueCoalitionForecast,
  enqueueWarRoomScan,
  getQueuesStatus,
} from './queues.js';
import { generateMorningBrief } from './services/briefing.js';
import { updateSentimentScores, getCurrentSentiment, getSentimentHistory } from './services/sentiment.js';
import { generateDailyContentPack } from './services/contentFactory.js';
import { generateVisitPlans } from './services/visitPlanner.js';
import { processWhatsappMessage, parseAiSensyWebhook, parseWatiWebhook } from './services/whatsapp.js';
import { transcribeAudio, createVoiceReport } from './services/voice.js';
import { agentSystemMetrics } from './services/agentSystem.js';
import { deepfakeMetrics } from './services/deepfakeShield.js';
import { coalitionOverview } from './services/coalitionForecast.js';
import { warRoomMetrics } from './services/warRoom.js';
import darshanRoutes from './routes/darshan.js';
import {
  listApiKeys,
  upsertApiKey,
  deactivateApiKey,
  hasMasterKey,
  getApiKey,
  listPoliticianApiKeys,
  upsertPoliticianApiKey,
  deactivatePoliticianApiKey,
} from './services/secretStore.js';
import { aiComplete, aiChat, aiJSON, aiStream } from './services/ai.js';

const app = express();
// Make pool available to all route files via req.app.locals.pool
app.locals.pool = pool;
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

try { initQueues(); } catch(e) { console.warn('[queues] Init failed, server continues:', e.message); }

const LOGIN_ATTEMPTS = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const getLoginKey = (req) => `${req.body?.email || 'unknown'}|${req.ip}`;
const getLoginRecord = (key) => LOGIN_ATTEMPTS.get(key) || { count: 0, lastAttempt: 0, lockedUntil: 0 };

const checkLoginLock = (req) => {
  const key = getLoginKey(req);
  const record = getLoginRecord(key);
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return { locked: true, retryAfter: Math.ceil((record.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false };
};

const recordLoginFailure = (req) => {
  const key = getLoginKey(req);
  const record = getLoginRecord(key);
  const now = Date.now();
  const withinWindow = now - record.lastAttempt < LOGIN_WINDOW_MS;
  const count = withinWindow ? record.count + 1 : 1;
  const lockedUntil = count >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_LOCK_MS : 0;
  LOGIN_ATTEMPTS.set(key, { count, lastAttempt: now, lockedUntil });
  return { count, lockedUntil };
};

const clearLoginFailures = (req) => {
  LOGIN_ATTEMPTS.delete(getLoginKey(req));
};

async function auditLog({ userId, politicianId, action, tableName, recordId, metadata, ip }) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, politician_id, action, table_name, record_id, metadata, ip_address) VALUES (?,?,?,?,?,?,?)',
      [userId || null, politicianId || null, action, tableName || null, recordId || null, metadata ? JSON.stringify(metadata) : null, ip || null],
    );
  } catch (err) {
    console.error('[audit-log]', err.message);
  }
}

async function sendOtpEmail(email, code) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'no-reply@nethra.ai';
  if (!host || !user || !pass) return false;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your Nethra login OTP',
    text: `Your OTP for Nethra login is ${code}. It expires in 10 minutes.`,
  });
  return true;
}

const DEFAULT_MODULES = [
  { module_key: 'dashboard', label: 'Executive Dashboard', category: 'Core', description: 'Unified command view for daily operations.' },
  { module_key: 'profile', label: 'Politician Profile', category: 'Core', description: 'Public profile and biography management.' },
  { module_key: 'constituency', label: 'Constituency Intelligence', category: 'Core', description: 'Demographics, geography, and constituency stats.' },
  { module_key: 'grievances', label: 'Grievance Command', category: 'Citizen Services', description: 'Case intake, triage, and resolution workflows.' },
  { module_key: 'appointments', label: 'Appointments', category: 'Citizen Services', description: 'Visitor scheduling and approvals.' },
  { module_key: 'events', label: 'Events & Outreach', category: 'Citizen Services', description: 'Program calendar and attendance tracking.' },
  { module_key: 'voters', label: 'Voter Database', category: 'Political Ops', description: 'Voter intelligence and segmentation.' },
  { module_key: 'polls', label: 'Polls & Surveys', category: 'Political Ops', description: 'Survey execution and sentiment capture.' },
  { module_key: 'booths', label: 'Booth Management', category: 'Political Ops', description: 'Booth-level intelligence and agent tracking.' },
  { module_key: 'legislative', label: 'Legislative Workbench', category: 'Governance', description: 'Bills, motions, and legislative planning.' },
  { module_key: 'citizen', label: 'Citizen Engagement', category: 'Citizen Services', description: 'Campaigns, outreach, and feedback loops.' },
  { module_key: 'darshan', label: 'Tirupati Darshan', category: 'Services', description: 'Darshan requests and approvals.' },
  { module_key: 'darshans', label: 'Darshans (Other Temples)', category: 'Services', description: 'Multi-temple darshan requests.' },
  { module_key: 'parliamentary', label: 'Parliamentary Desk', category: 'Governance', description: 'Parliamentary Q&A, debates, and bills.' },
  { module_key: 'projects', label: 'Development Projects', category: 'Governance', description: 'Project planning, execution, and monitoring.' },
  { module_key: 'media', label: 'Media Monitor', category: 'Communications', description: 'Press coverage, narrative tracking.' },
  { module_key: 'communication', label: 'Communications Studio', category: 'Communications', description: 'Campaign messaging and broadcast.' },
  { module_key: 'finance', label: 'Finance Ledger', category: 'Governance', description: 'Income, expense, and compliance tracking.' },
  { module_key: 'team', label: 'Team Operations', category: 'Operations', description: 'Staff and field team management.' },
  { module_key: 'analytics', label: 'Analytics', category: 'Operations', description: 'Performance, KPIs, and trends.' },
  { module_key: 'documents', label: 'Document Vault', category: 'Operations', description: 'Secure document storage and retrieval.' },
  { module_key: 'settings', label: 'Settings', category: 'Operations', description: 'System preferences and configuration.' },
  { module_key: 'staff-management', label: 'Staff Management', category: 'Operations', description: 'Role-based access and staff control.' },
  { module_key: 'ai-studio', label: 'AI Studio', category: 'AI & Automation', description: 'Speech, briefing, and narrative generation.' },
  { module_key: 'briefing', label: 'Political Briefings', category: 'AI & Automation', description: 'AI-generated political briefings.' },
  { module_key: 'omniscan', label: 'OmniScan', category: 'Intelligence', description: 'News, social, and media ingestion.' },
  { module_key: 'morning-brief', label: 'Morning Brief', category: 'Intelligence', description: 'Daily intelligence digest.' },
  { module_key: 'sentiment', label: 'Sentiment Dashboard', category: 'Intelligence', description: 'Mood tracking across channels.' },
  { module_key: 'opposition', label: 'Opposition Tracker', category: 'Intelligence', description: 'Opposition activity and threat mapping.' },
  { module_key: 'voice-intelligence', label: 'Voice Intelligence', category: 'Intelligence', description: 'Field voice reports and insights.' },
  { module_key: 'promises', label: 'Promises Tracker', category: 'Intelligence', description: 'Track commitments and fulfillment.' },
  { module_key: 'content-factory', label: 'Content Factory', category: 'Intelligence', description: 'Automated content generation pipeline.' },
  { module_key: 'whatsapp-intelligence', label: 'WhatsApp Intelligence', category: 'Intelligence', description: 'WhatsApp ingestion and alerts.' },
  { module_key: 'smart-visit', label: 'Smart Visit Planner', category: 'Intelligence', description: 'AI-driven constituency visit planning.' },
  { module_key: 'predictive-crisis', label: 'Predictive Crisis Intel', category: 'Future Lab', description: 'Early warning crisis forecasting.', is_future: 1 },
  { module_key: 'agent-system', label: 'Autonomous Agent System', category: 'Future Lab', description: '24x7 AI agent orchestration.', is_future: 1 },
  { module_key: 'deepfake-shield', label: 'Deepfake Shield', category: 'Future Lab', description: 'Deepfake and disinformation protection.', is_future: 1 },
  { module_key: 'relationship-graph', label: 'Relationship Graph', category: 'Future Lab', description: 'Political relationship intelligence.', is_future: 1 },
  { module_key: 'economic-intelligence', label: 'Economic Intelligence', category: 'Future Lab', description: 'Local economic signals and stress indices.', is_future: 1 },
  { module_key: 'citizen-services', label: 'Citizen Services Super App', category: 'Future Lab', description: 'Constituent service requests hub.', is_future: 1 },
  { module_key: 'election-command', label: 'Election Command Center', category: 'Future Lab', description: 'Election-day war room tooling.', is_future: 1 },
  { module_key: 'finance-compliance', label: 'Financial Compliance', category: 'Future Lab', description: 'Election expense compliance automation.', is_future: 1 },
  { module_key: 'party-integration', label: 'Party Integration Layer', category: 'Future Lab', description: 'Party-wide coordination and sync.', is_future: 1 },
  { module_key: 'digital-twin', label: 'Digital Twin', category: 'Future Lab', description: 'AI persona and scenario simulator.', is_future: 1 },
  { module_key: 'policy-simulator', label: 'Policy Simulator', category: 'Future Lab', description: 'Scenario forecasting with AI policy impact.', is_future: 1 },
  { module_key: 'crisis-war-room', label: 'Crisis War Room', category: 'Future Lab', description: 'Real-time crisis detection and response playbooks.', is_future: 1 },
  { module_key: 'sentiment-forecast', label: 'Sentiment Forecasting', category: 'Future Lab', description: 'Predictive sentiment model with long-range signals.', is_future: 1 },
  { module_key: 'coalition-forecast', label: 'Coalition Forecasting', category: 'Future Lab', description: 'Alliance modeling and coalition likelihood.', is_future: 1 },
  { module_key: 'narrative-lab', label: 'Narrative Lab', category: 'Future Lab', description: 'AI narrative testing and narrative resonance.', is_future: 1 },
  { module_key: 'electorate-graph', label: 'Electorate Graph', category: 'Future Lab', description: 'Relationship intelligence between communities.', is_future: 1 },
  { module_key: 'autonomous-field-ops', label: 'Autonomous Field Ops', category: 'Future Lab', description: 'Smart kiosks and automated field collection.', is_future: 1 },
];

const DEFAULT_FEATURES = [
  { feature_key: 'grievances-auto-triage', module_key: 'grievances', label: 'Auto Triage', description: 'AI auto-assigns grievances by urgency.' },
  { feature_key: 'grievances-sla-alerts', module_key: 'grievances', label: 'SLA Alerts', description: 'Escalation alerts before SLA breaches.' },
  { feature_key: 'projects-budget-risk', module_key: 'projects', label: 'Budget Risk Radar', description: 'Detects cost overruns and delays.' },
  { feature_key: 'finance-fraud-detection', module_key: 'finance', label: 'Finance Anomaly Detection', description: 'Flags unusual transactions automatically.' },
  { feature_key: 'media-realtime-alerts', module_key: 'media', label: 'Realtime Media Alerts', description: 'Instant alerts for negative coverage.' },
  { feature_key: 'communication-multichannel', module_key: 'communication', label: 'Multichannel Campaigns', description: 'SMS, WhatsApp, and social orchestration.' },
  { feature_key: 'analytics-predictive-trends', module_key: 'analytics', label: 'Predictive Trends', description: 'Forecast KPIs with AI models.' },
  { feature_key: 'omniscan-social-stream', module_key: 'omniscan', label: 'Social Stream', description: 'Live social feeds with sentiment.' },
  { feature_key: 'morning-brief-auto-priority', module_key: 'morning-brief', label: 'Auto Prioritization', description: 'AI prioritizes daily risks and wins.' },
  { feature_key: 'sentiment-issue-heatmaps', module_key: 'sentiment', label: 'Issue Heatmaps', description: 'Constituency issue clustering.' },
  { feature_key: 'opposition-threat-forecast', module_key: 'opposition', label: 'Threat Forecast', description: 'Predict opposition escalation risk.' },
  { feature_key: 'voice-auto-translation', module_key: 'voice-intelligence', label: 'Auto Translation', description: 'Instant translation of field audio.' },
  { feature_key: 'ai-studio-multilingual', module_key: 'ai-studio', label: 'Multilingual Speech Kit', description: 'Generate speeches in multiple languages.' },
  { feature_key: 'content-factory-daily', module_key: 'content-factory', label: 'Daily Auto Content', description: 'Auto-generate daily content packs.' },
  { feature_key: 'whatsapp-viral-detect', module_key: 'whatsapp-intelligence', label: 'Viral Detection', description: 'Detect viral forwards and misinformation.' },
  { feature_key: 'smart-visit-ai', module_key: 'smart-visit', label: 'AI Visit Planning', description: 'AI optimizes constituency visits.' },
  { feature_key: 'promises-extraction', module_key: 'promises', label: 'Promise Extraction', description: 'Extract promises from speeches.' },
  { feature_key: 'predictive-crisis-alerts', module_key: 'predictive-crisis', label: 'Crisis Prediction', description: 'Early warning crisis alerts.', is_future: 1 },
  { feature_key: 'deepfake-auto-response', module_key: 'deepfake-shield', label: 'Auto Response', description: 'Draft takedown responses.', is_future: 1 },
  { feature_key: 'relationship-decay-alerts', module_key: 'relationship-graph', label: 'Relationship Decay', description: 'Alert when key contacts go cold.', is_future: 1 },
  { feature_key: 'economic-stress-index', module_key: 'economic-intelligence', label: 'Stress Index', description: 'Economic stress index per mandal.', is_future: 1 },
  { feature_key: 'citizen-app-offline', module_key: 'citizen-services', label: 'Offline Sync', description: 'Citizen app offline queue.', is_future: 1 },
  { feature_key: 'election-turnout-forecast', module_key: 'election-command', label: 'Turnout Forecast', description: 'Live turnout forecasting.', is_future: 1 },
  { feature_key: 'compliance-limit-alerts', module_key: 'finance-compliance', label: 'Limit Alerts', description: 'Expense limit tracking.', is_future: 1 },
  { feature_key: 'party-central-sync', module_key: 'party-integration', label: 'Central Sync', description: 'Party-wide coordination.', is_future: 1 },
  { feature_key: 'digital-twin-voice', module_key: 'digital-twin', label: 'Voice Persona', description: 'Generate content in politician voice.', is_future: 1 },
  { feature_key: 'digital-twin-scenarios', module_key: 'digital-twin', label: 'Scenario Simulator', description: 'Run policy simulations.', is_future: 1 },
  { feature_key: 'crisis-war-room-drills', module_key: 'crisis-war-room', label: 'Crisis Drills', description: 'Run readiness drills with AI.', is_future: 1 },
  { feature_key: 'sentiment-forecast-longrange', module_key: 'sentiment-forecast', label: 'Long Range Forecast', description: '12-month sentiment forecasts.', is_future: 1 },
  { feature_key: 'narrative-lab-engine', module_key: 'narrative-lab', label: 'Narrative Engine', description: 'AI narrative experimentation.', is_future: 1 },
  { feature_key: 'autonomous-field-ops-kiosks', module_key: 'autonomous-field-ops', label: 'Smart Kiosks', description: 'Autonomous field data capture.', is_future: 1 },
];

async function ensureDefaultModules() {
  const values = DEFAULT_MODULES.map(m => [
    m.module_key, m.label, m.category, m.description || '', 1, m.is_future ? 1 : 0,
  ]);
  await pool.query(
    `INSERT INTO feature_modules (module_key,label,category,description,is_active,is_future)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       label=VALUES(label),
       category=VALUES(category),
       description=VALUES(description),
       is_future=VALUES(is_future)`,
    [values],
  );
}

async function ensureDefaultFeatures() {
  await ensureDefaultModules();
  const values = DEFAULT_FEATURES.map(f => [
    f.feature_key, f.module_key, f.label, f.description || '', 1, f.is_future ? 1 : 0,
  ]);
  await pool.query(
    `INSERT INTO feature_flags (feature_key,module_key,label,description,is_active,is_future)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       module_key=VALUES(module_key),
       label=VALUES(label),
       description=VALUES(description),
       is_future=VALUES(is_future)`,
    [values],
  );
}

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const lock = checkLoginLock(req);
    if (lock.locked) return res.status(429).json({ error: 'Too many attempts, please try later', retry_after: lock.retryAfter });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const result = recordLoginFailure(req);
      if (result.lockedUntil) {
        return res.status(429).json({ error: 'Too many attempts, please try later', retry_after: Math.ceil((result.lockedUntil - Date.now()) / 1000) });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    clearLoginFailures(req);

    if (!user.politician_id && user.role === 'politician_admin') {
      const [pols] = await pool.query('SELECT id FROM politician_profiles WHERE email = ? LIMIT 1', [user.email]);
      if (pols?.[0]?.id) {
        await pool.query('UPDATE users SET politician_id = ? WHERE id = ?', [pols[0].id, user.id]);
        user.politician_id = pols[0].id;
      }
    }

    if (user.two_factor_enabled) {
      const code = crypto.randomInt(100000, 999999).toString();
      const hash = await bcrypt.hash(code, 10);
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await pool.query('UPDATE users SET two_factor_code_hash = ?, two_factor_expires = ? WHERE id = ?', [hash, expires, user.id]);
      const sent = await sendOtpEmail(user.email, code);
      if (!sent) return res.status(500).json({ error: 'Email service not configured' });
      return res.json({ requires_2fa: true, email: user.email });
    }

    await pool.query('UPDATE users SET last_login_at = NOW(), last_login_ip = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [req.ip, user.id]);
    const token = signToken({ id: user.id, email: user.email, role: user.role, politician_id: user.politician_id });
    let politician = null, allPoliticians = [];
    if (user.role === 'super_admin') {
      const [pols] = await pool.query("SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles WHERE (role = 'politician' OR role IS NULL) AND role != 'admin' ORDER BY full_name");
      allPoliticians = pols; politician = pols[0] || null;
    } else if (user.politician_id) {
      const [pols] = await pool.query("SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles WHERE id = ? AND (role = 'politician' OR role IS NULL)", [user.politician_id]);
      politician = pols[0] || null; allPoliticians = pols;
    }
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, politician_id: user.politician_id, two_factor_enabled: user.two_factor_enabled, display_name: user.display_name }, politician, allPoliticians });
  } catch (err) { console.error('[login]', err); res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT id,email,role,politician_id,two_factor_enabled,display_name FROM users WHERE id = ?', [req.user.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/auth/2fa/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const [rows] = await pool.query('SELECT id,email,two_factor_enabled FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [email]);
  const user = rows[0];
  if (!user || !user.two_factor_enabled) return res.status(404).json({ error: '2FA not enabled for this user' });
  const code = crypto.randomInt(100000, 999999).toString();
  const hash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query('UPDATE users SET two_factor_code_hash = ?, two_factor_expires = ? WHERE id = ?', [hash, expires, user.id]);
  const sent = await sendOtpEmail(user.email, code);
  if (!sent) return res.status(500).json({ error: 'Email service not configured' });
  res.json({ success: true });
});

app.post('/api/auth/2fa/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [email]);
  const user = rows[0];
  if (!user || !user.two_factor_enabled) return res.status(401).json({ error: 'Unauthorized' });
  if (!user.two_factor_code_hash || !user.two_factor_expires) return res.status(401).json({ error: 'OTP expired' });
  if (new Date(user.two_factor_expires) < new Date()) return res.status(401).json({ error: 'OTP expired' });
  const ok = await bcrypt.compare(code, user.two_factor_code_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid code' });
  await pool.query('UPDATE users SET two_factor_code_hash = NULL, two_factor_expires = NULL WHERE id = ?', [user.id]);

  if (!user.politician_id && user.role === 'politician_admin') {
    const [pols] = await pool.query('SELECT id FROM politician_profiles WHERE email = ? LIMIT 1', [user.email]);
    if (pols?.[0]?.id) {
      await pool.query('UPDATE users SET politician_id = ? WHERE id = ?', [pols[0].id, user.id]);
      user.politician_id = pols[0].id;
    }
  }

  await pool.query('UPDATE users SET last_login_at = NOW(), last_login_ip = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [req.ip, user.id]);
  const token = signToken({ id: user.id, email: user.email, role: user.role, politician_id: user.politician_id });
  let politician = null, allPoliticians = [];
  if (user.role === 'super_admin') {
    const [pols] = await pool.query("SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles WHERE (role = 'politician' OR role IS NULL) AND role != 'admin' ORDER BY full_name");
    allPoliticians = pols; politician = pols[0] || null;
  } else if (user.politician_id) {
    const [pols] = await pool.query("SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles WHERE id = ? AND (role = 'politician' OR role IS NULL)", [user.politician_id]);
    politician = pols[0] || null; allPoliticians = pols;
  }
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, politician_id: user.politician_id, two_factor_enabled: user.two_factor_enabled, display_name: user.display_name }, politician, allPoliticians });
});

app.post('/api/auth/2fa/toggle', authMiddleware, async (req, res) => {
  const { enabled } = req.body;
  await pool.query('UPDATE users SET two_factor_enabled = ? WHERE id = ?', [enabled ? 1 : 0, req.user.id]);
  res.json({ success: true, enabled: !!enabled });
});

app.get('/api/politicians', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query("SELECT id,full_name,display_name,photo_url,party,designation,constituency_name,state,slug,color_primary,color_secondary,is_active FROM politician_profiles WHERE (role = 'politician' OR role IS NULL) AND role != 'admin' ORDER BY full_name");
  res.json(rows);
});

app.get('/api/search', authMiddleware, async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.json([]);
  if (req.user.role === 'field_worker') return res.json([]);
  const q = `%${query}%`;
  const results = [];
  const isSuperAdmin = req.user.role === 'super_admin';
  const polId = req.user.politician_id;
  const scopeWhere = isSuperAdmin || !polId ? '' : ' AND politician_id = ?';
  const scopeParams = isSuperAdmin || !polId ? [] : [polId];
  try {
    const [grievances] = await pool.query(
      `SELECT id, subject, category, status FROM grievances WHERE (subject LIKE ? OR petitioner_name LIKE ?)${scopeWhere} ORDER BY created_at DESC LIMIT 5`,
      [q, q, ...scopeParams],
    );
    grievances.forEach(r => results.push({ id: r.id, type: 'grievance', title: r.subject, subtitle: `${r.category} • ${r.status}`, page: 'grievances' }));
  } catch {}
  try {
    if (req.user.role === 'staff') throw new Error('skip');
    const [voters] = await pool.query(
      `SELECT id, name, voter_id, mandal FROM voters WHERE (name LIKE ? OR voter_id LIKE ?)${scopeWhere} ORDER BY created_at DESC LIMIT 5`,
      [q, q, ...scopeParams],
    );
    voters.forEach(r => results.push({ id: r.id, type: 'voter', title: r.name, subtitle: `${r.voter_id} • ${r.mandal || '—'}`, page: 'voters' }));
  } catch {}
  try {
    const [projects] = await pool.query(
      `SELECT id, project_name, status FROM projects WHERE project_name LIKE ?${scopeWhere} ORDER BY created_at DESC LIMIT 5`,
      [q, ...scopeParams],
    );
    projects.forEach(r => results.push({ id: r.id, type: 'project', title: r.project_name, subtitle: r.status || '—', page: 'projects' }));
  } catch {}
  try {
    const [events] = await pool.query(
      `SELECT id, title, event_type FROM events WHERE title LIKE ?${scopeWhere} ORDER BY start_date DESC LIMIT 5`,
      [q, ...scopeParams],
    );
    events.forEach(r => results.push({ id: r.id, type: 'event', title: r.title, subtitle: r.event_type || '—', page: 'events' }));
  } catch {}
  try {
    const [media] = await pool.query(
      `SELECT id, headline, source FROM media_mentions WHERE headline LIKE ?${scopeWhere} ORDER BY created_at DESC LIMIT 5`,
      [q, ...scopeParams],
    );
    media.forEach(r => results.push({ id: r.id, type: 'media', title: r.headline, subtitle: r.source || '—', page: 'media' }));
  } catch {}
  try {
    const [documents] = await pool.query(
      `SELECT id, title, category FROM documents WHERE title LIKE ?${scopeWhere} ORDER BY created_at DESC LIMIT 5`,
      [q, ...scopeParams],
    );
    documents.forEach(r => results.push({ id: r.id, type: 'document', title: r.title, subtitle: r.category || '—', page: 'documents' }));
  } catch {}
  res.json(results.slice(0, 25));
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const params = [];
  let sql = 'SELECT * FROM notifications';
  if (req.user.role !== 'super_admin') {
    if (!req.user.politician_id) return res.status(403).json({ error: 'Forbidden' });
    sql += ' WHERE politician_id = ?';
    params.push(req.user.politician_id);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin' && !req.user.politician_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user.role === 'super_admin') {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  } else {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND politician_id = ?', [req.params.id, req.user.politician_id]);
  }
  res.json({ success: true });
});

const DEFAULT_WEBSITE_CONTENT = [
  { page: 'home', section: 'hero', content: { title: 'NETHRA', subtitle: 'Political Intelligence Operating System', cta: 'Request Demo' } },
  { page: 'home', section: 'vision', content: { heading: 'The AI brain every politician needs', body: 'Nethra watches everything, knows everything, and tells you exactly what to do next.' } },
  { page: 'home', section: 'modules', content: { heading: 'Platform Modules', items: ['OmniScan', 'Morning Brief', 'Sentiment', 'Opposition', 'Voice Intelligence', 'Content Factory'] } },
  { page: 'home', section: 'intelligence', content: { heading: 'Intelligence Layer', items: ['Media monitoring', 'Social intelligence', 'WhatsApp signals', 'Ground reports', 'Predictive alerts'] } },
  { page: 'home', section: 'pricing', content: { heading: 'Plans', items: ['Starter', 'Professional', 'Intelligence', 'War Room'] } },
  { page: 'home', section: 'cta', content: { heading: 'Build your political edge', button: 'Get Started' } },
];

async function ensureWebsiteContent() {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM website_content');
  if (rows?.[0]?.count) return;
  const values = DEFAULT_WEBSITE_CONTENT.map(item => [item.page, item.section, JSON.stringify(item.content)]);
  await pool.query('INSERT INTO website_content (page, section, content) VALUES ?', [values]);
}

app.get('/api/website/content', async (req, res) => {
  await ensureWebsiteContent();
  const page = req.query.page || 'home';
  const [rows] = await pool.query('SELECT page, section, content FROM website_content WHERE page = ? ORDER BY section', [page]);
  res.json(rows || []);
});

app.get('/api/website/content/:page', async (req, res) => {
  await ensureWebsiteContent();
  const [rows] = await pool.query('SELECT page, section, content FROM website_content WHERE page = ? ORDER BY section', [req.params.page]);
  res.json(rows || []);
});

app.get('/api/admin/website-content', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await ensureWebsiteContent();
    const [rows] = await pool.query('SELECT * FROM website_content ORDER BY page, section');
    res.json(rows || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/website-content', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { page, section, content } = req.body;
    if (!page || !section) return res.status(400).json({ error: 'page and section required' });
    await pool.query(
      'INSERT INTO website_content (page, section, content) VALUES (?,?,?) ON DUPLICATE KEY UPDATE content=VALUES(content)',
      [page, section, JSON.stringify(content)]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GENERIC CRUD ──────────────────────────────────────────────
// Tables that are isolated per politician
const POLITICIAN_SCOPED_TABLES = [
  'grievances','events','team_members','voters','projects','media_mentions',
  'finances','communications','documents','appointments','polls','poll_responses',
  'darshan_bookings','darshan_date_slots','darshan_donations','bills',
  'citizen_engagements','volunteers','suggestions','parliamentary_questions',
  'parliamentary_debates','parliamentary_bills','ai_briefings','constituencies','constituency_profiles',
  'ai_generated_content','content_calendar','sentiment_scores','opposition_intelligence','voice_reports',
  'promises','whatsapp_intelligence','visit_plans','booths','predictive_alerts','agent_tasks',
  'deepfake_incidents','relationships','economic_indicators','citizen_service_requests',
  'election_updates','finance_compliance_reports','party_integrations','digital_twin_runs',
  'darshans','notifications','temple_registry','darshan_slots','darshan_quotas','darshan_waiting_list',
  'darshan_requests','politician_metrics','comm_templates','mplads_tracker','grievance_timeline','villages',
  'coalition_scenarios','crisis_incidents','warroom_actions'
];

const STAFF_DENY_TABLES = ['finances', 'voters', 'finance_compliance_reports', 'billing_records'];
const FIELD_WORKER_READ_TABLES = ['agent_tasks', 'voice_reports'];
const FIELD_WORKER_WRITE_TABLES = ['agent_tasks', 'voice_reports', 'grievances'];

function crud(table, searchCols = []) {
  const router = express.Router();
  const isScoped = POLITICIAN_SCOPED_TABLES.includes(table);
  const roleAccess = (req, res, mode) => {
    const role = req.user.role;
    if (role === 'staff' && STAFF_DENY_TABLES.includes(table)) {
      res.status(403).json({ error: 'Forbidden' });
      return false;
    }
    if (role === 'staff' && mode === 'delete') {
      res.status(403).json({ error: 'Forbidden' });
      return false;
    }
    if (role === 'field_worker') {
      if (mode === 'delete') {
        res.status(403).json({ error: 'Forbidden' });
        return false;
      }
      if (mode === 'read' && !FIELD_WORKER_READ_TABLES.includes(table)) {
        res.status(403).json({ error: 'Forbidden' });
        return false;
      }
      if (mode === 'write' && !FIELD_WORKER_WRITE_TABLES.includes(table)) {
        res.status(403).json({ error: 'Forbidden' });
        return false;
      }
    }
    return true;
  };

  const clean = (data, skipId = false) => {
    const c = {};
    for (const [k, v] of Object.entries(data)) {
      if (skipId && k === 'id') continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) {
        c[k] = JSON.stringify(v);
      } else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        c[k] = v.slice(0, 19).replace('T', ' ');
      } else {
        c[k] = v;
      }
    }
    return c;
  };

  // Parse JSON fields in rows
  const parseRows = (rows) => rows.map(row => {
    const r = {...row};
    for (const k of Object.keys(r)) {
      if (typeof r[k] === 'string' && (r[k].startsWith('[') || r[k].startsWith('{'))) {
        try { r[k] = JSON.parse(r[k]); } catch(_) {}
      }
    }
    return r;
  });

  router.get('/', authMiddleware, async (req, res) => {
    try {
      if (!roleAccess(req, res, 'read')) return;
      const { search, limit = 500, offset = 0, order = 'created_at', dir = 'DESC' } = req.query;
      const isSuperAdmin = req.user.role === 'super_admin';
      const polId = req.user.politician_id;

      let sql = `SELECT * FROM \`${table}\``, params = [];
      const conditions = [];

      // Add politician filter for scoped tables (non-super-admin)
      if (isScoped && !isSuperAdmin) {
        if (!polId) return res.status(403).json({ error: 'Forbidden' });
        conditions.push('politician_id = ?');
        params.push(polId);
      }

      if (search && searchCols.length) {
        const searchCond = searchCols.map(c => `\`${c}\` LIKE ?`).join(' OR ');
        conditions.push(`(${searchCond})`);
        searchCols.forEach(() => params.push(`%${search}%`));
      }

      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ` ORDER BY \`${order.replace(/[^a-zA-Z_]/g,'')}\` ${dir==='ASC'?'ASC':'DESC'} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(sql, params);
      res.json(parseRows(rows));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  router.get('/:id', authMiddleware, async (req, res) => {
    if (!roleAccess(req, res, 'read')) return;
    const isSuperAdmin = req.user.role === 'super_admin';
    const polId = req.user.politician_id;
    let sql = `SELECT * FROM \`${table}\` WHERE id = ?`;
    const params = [req.params.id];
    if (isScoped && !isSuperAdmin) {
      if (!polId) return res.status(403).json({ error: 'Forbidden' });
      sql += ' AND politician_id = ?';
      params.push(polId);
    }
    const [rows] = await pool.query(sql, params);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  });
  router.post('/', authMiddleware, async (req, res) => {
    try {
      if (!roleAccess(req, res, 'write')) return;
      const c = clean(req.body);
      const isSuperAdmin = req.user.role === 'super_admin';
      const polId = req.user.politician_id;
      if (isScoped && !isSuperAdmin) {
        if (!polId) return res.status(403).json({ error: 'Forbidden' });
        c.politician_id = polId;
      }
      // Convert ISO datetime strings to MySQL format
      for (const k of Object.keys(c)) {
        if (typeof c[k] === 'string' && c[k].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          c[k] = c[k].slice(0, 19).replace('T', ' ');
        }
      }
      const cols = Object.keys(c).map(k=>`\`${k}\``).join(',');
      const ph = Object.keys(c).map(()=>'?').join(',');
      const [r] = await pool.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${ph})`, Object.values(c));
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [r.insertId]);
      const row = rows[0];
      await auditLog({ userId: req.user.id, politicianId: req.user.politician_id, action: 'create', tableName: table, recordId: row?.id, metadata: { payload: c }, ip: req.ip });
      res.status(201).json(row);
    } catch (e) { console.error(`[POST ${table}]`, e); res.status(500).json({ error: e.message }); }
  });
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      if (!roleAccess(req, res, 'write')) return;
      const c = clean(req.body, true);
      const isSuperAdmin = req.user.role === 'super_admin';
      const polId = req.user.politician_id;
      if (!isSuperAdmin) delete c.politician_id;
      const sets = Object.keys(c).map(k=>`\`${k}\` = ?`).join(',');
      if (isScoped && !isSuperAdmin) {
        if (!polId) return res.status(403).json({ error: 'Forbidden' });
        await pool.query(`UPDATE \`${table}\` SET ${sets} WHERE id = ? AND politician_id = ?`, [...Object.values(c), req.params.id, polId]);
        const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ? AND politician_id = ?`, [req.params.id, polId]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        await auditLog({ userId: req.user.id, politicianId: req.user.politician_id, action: 'update', tableName: table, recordId: rows[0].id, metadata: { payload: c }, ip: req.ip });
        res.json(rows[0]);
        return;
      }
      await pool.query(`UPDATE \`${table}\` SET ${sets} WHERE id = ?`, [...Object.values(c), req.params.id]);
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      await auditLog({ userId: req.user.id, politicianId: req.user.politician_id, action: 'update', tableName: table, recordId: rows[0].id, metadata: { payload: c }, ip: req.ip });
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      if (!roleAccess(req, res, 'delete')) return;
      const isSuperAdmin = req.user.role === 'super_admin';
      const polId = req.user.politician_id;
      if (isScoped && !isSuperAdmin) {
        if (!polId) return res.status(403).json({ error: 'Forbidden' });
        const [rows] = await pool.query(`SELECT id FROM \`${table}\` WHERE id = ? AND politician_id = ?`, [req.params.id, polId]);
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        await pool.query(`DELETE FROM \`${table}\` WHERE id = ? AND politician_id = ?`, [req.params.id, polId]);
        await auditLog({ userId: req.user.id, politicianId: req.user.politician_id, action: 'delete', tableName: table, recordId: req.params.id, ip: req.ip });
        return res.json({ success: true });
      }
      await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]);
      await auditLog({ userId: req.user.id, politicianId: req.user.politician_id, action: 'delete', tableName: table, recordId: req.params.id, ip: req.ip });
      res.json({ success: true });
    }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
  return router;
}

app.use('/api/grievances',             crud('grievances',             ['petitioner_name','subject','category','location']));
app.use('/api/events',                 crud('events',                 ['title','location','organizer']));
app.use('/api/team_members',           crud('team_members',           ['name','role','department','email']));
app.use('/api/voters',                 crud('voters',                 ['name','voter_id','mandal','village','phone']));
app.use('/api/projects',              crud('projects',               ['project_name','location','mandal','contractor']));
app.use('/api/media_mentions',         crud('media_mentions',         ['headline','source','summary']));
app.use('/api/finances',              crud('finances',               ['category','description']));
app.use('/api/communications',        crud('communications',         ['subject','message']));
app.use('/api/documents',             crud('documents',              ['title','category']));
app.use('/api/appointments',          crud('appointments',           ['visitor_name','purpose','category']));
app.use('/api/polls',                 crud('polls',                  ['title','category']));
app.use('/api/poll_responses',        crud('poll_responses',         []));
app.use('/api/darshan_bookings',      crud('darshan_bookings',       ['pilgrim_name','pilgrim_contact','mandal']));
app.use('/api/darshan_date_slots',    crud('darshan_date_slots',     []));
app.use('/api/darshan_donations',     crud('darshan_donations',      ['donor_name']));
app.use('/api/bills',                 crud('bills',                  ['bill_name','bill_number','ministry']));
app.use('/api/citizen_engagements',   crud('citizen_engagements',    ['title','location','mandal']));
app.use('/api/volunteers',            crud('volunteers',             ['name','phone','mandal']));
app.use('/api/suggestions',           crud('suggestions',            ['title','category']));
app.use('/api/comm_templates',        crud('comm_templates',         ['name','channel']));
app.use('/api/mplads_tracker',        crud('mplads_tracker',         ['scheme_name','status']));
app.use('/api/grievance_timeline',    crud('grievance_timeline',     ['status','note']));
app.use('/api/villages',              crud('villages',               ['village_name','mandal_name']));
app.use('/api/temple_registry',       crud('temple_registry',        ['temple_name','location','state']));
app.use('/api/darshan_slots',         crud('darshan_slots',          []));
app.use('/api/darshan_quotas',        crud('darshan_quotas',         []));
app.use('/api/darshan_waiting_list',  crud('darshan_waiting_list',   ['pilgrim_name','status']));
app.use('/api/darshan_requests',      crud('darshan_requests',       ['pilgrim_name','status']));
app.use('/api/darshan',               darshanRoutes);
app.use('/api/predictive_alerts',     crud('predictive_alerts',      ['alert_type','description','status']));
app.use('/api/agent_tasks',           crud('agent_tasks',            ['agent_type','task_type','status']));
app.use('/api/deepfake_incidents',    crud('deepfake_incidents',     ['platform','status','content_url']));
app.use('/api/relationships',         crud('relationships',          ['entity_name','entity_type','relationship_type']));
app.use('/api/economic_indicators',   crud('economic_indicators',    ['indicator_type','mandal']));
app.use('/api/citizen_service_requests', crud('citizen_service_requests', ['requester_name','request_type','status']));
app.use('/api/election_updates',      crud('election_updates',       ['update_type','status']));
app.use('/api/finance_compliance_reports', crud('finance_compliance_reports', ['report_type','status']));
app.use('/api/party_integrations',    crud('party_integrations',     ['party_name','integration_type']));
app.use('/api/digital_twin_runs',     crud('digital_twin_runs',      ['scenario_name','status']));
app.use('/api/coalition_scenarios',   crud('coalition_scenarios',    ['scenario_name','status']));
app.use('/api/crisis_incidents',      crud('crisis_incidents',       ['title','crisis_type','status']));
app.use('/api/warroom_actions',       crud('warroom_actions',        ['action_type','status','owner']));
// politician_profiles — filtered by role
app.get('/api/politician_profiles', authMiddleware, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'super_admin') {
      // Super admin sees all politician profiles (role='politician' or NULL, NOT 'admin')
      [rows] = await pool.query("SELECT * FROM politician_profiles WHERE role = 'politician' OR role IS NULL ORDER BY full_name");
    } else if (req.user.politician_id) {
      // Politician admin sees only their own profile
      [rows] = await pool.query("SELECT * FROM politician_profiles WHERE id = ? LIMIT 1", [req.user.politician_id]);
    } else {
      // Fallback — no politician linked, return empty
      rows = [];
    }
    // Parse JSON fields
    rows = rows.map(r => {
      const p = {...r};
      for (const k of Object.keys(p)) {
        if (typeof p[k] === 'string' && (p[k].startsWith('[') || p[k].startsWith('{'))) {
          try { p[k] = JSON.parse(p[k]); } catch(_) {}
        }
      }
      return p;
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/politician_profiles/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM politician_profiles WHERE id = ? AND (role = 'politician' OR role IS NULL)", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const r = {...rows[0]};
    for (const k of Object.keys(r)) {
      if (typeof r[k] === 'string' && (r[k].startsWith('[') || r[k].startsWith('{'))) {
        try { r[k] = JSON.parse(r[k]); } catch(_) {}
      }
    }
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/politician_profiles', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const data = req.body;
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === 'id') continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) clean[k] = JSON.stringify(v);
      else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) clean[k] = v.slice(0,19).replace('T',' ');
      else clean[k] = v;
    }
    const cols = Object.keys(clean).map(k => `\`${k}\``).join(',');
    const ph = Object.keys(clean).map(() => '?').join(',');
    const [r] = await pool.query(`INSERT INTO politician_profiles (${cols}) VALUES (${ph})`, Object.values(clean));
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/politician_profiles/:id', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === 'id') continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) clean[k] = JSON.stringify(v);
      else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) clean[k] = v.slice(0,19).replace('T',' ');
      else clean[k] = v;
    }
    const sets = Object.keys(clean).map(k => `\`${k}\` = ?`).join(',');
    await pool.query(`UPDATE politician_profiles SET ${sets} WHERE id = ?`, [...Object.values(clean), req.params.id]);
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/politician_profiles/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try { await pool.query('DELETE FROM politician_profiles WHERE id = ?', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.use('/api/constituency_profiles', crud('constituency_profiles',  ['constituency_name','state']));
app.use('/api/caste_demographics',    crud('caste_demographics',     ['caste_name']));
app.use('/api/mandal_stats',          crud('mandal_stats',           ['mandal_name']));
app.use('/api/parliamentary_questions',crud('parliamentary_questions',['subject','ministry','session_number']));
app.use('/api/parliamentary_debates', crud('parliamentary_debates',  ['topic','session_number']));
app.use('/api/parliamentary_bills',   crud('parliamentary_bills',    ['bill_name','bill_number']));
app.use('/api/ai_briefings',          crud('ai_briefings',           ['title','briefing_type']));
app.use('/api/ai_generated_content',  crud('ai_generated_content',  ['content_type','prompt']));
app.use('/api/constituencies',        crud('constituencies',         ['name','state']));
app.use('/api/sentiment_scores',      crud('sentiment_scores',       []));
app.use('/api/opposition_intelligence', crud('opposition_intelligence', ['opponent_name','activity_type','description']));
app.use('/api/voice_reports',         crud('voice_reports',          ['reporter_name','classification','transcript']));

// ── TEMPLE DARSHAN API ───────────────────────────────────────
app.get('/api/temples', authMiddleware, async (req, res) => {
  const isSuperAdmin = req.user.role === 'super_admin';
  if (!isSuperAdmin && !req.user.politician_id) return res.status(403).json({ error: 'Forbidden' });
  const params = [];
  let sql = 'SELECT * FROM temple_registry';
  if (!isSuperAdmin) {
    sql += ' WHERE politician_id = ?';
    params.push(req.user.politician_id);
  }
  sql += ' ORDER BY temple_name';
  const [rows] = await pool.query(sql, params);
  res.json(rows || []);
});

app.post('/api/darshan/apply', authMiddleware, async (req, res) => {
  const isSuperAdmin = req.user.role === 'super_admin';
  const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
  if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
  const payload = req.body || {};
  if (!payload.pilgrim_name || !payload.temple_id) return res.status(400).json({ error: 'pilgrim_name and temple_id required' });
  const [r] = await pool.query(
    `INSERT INTO darshan_requests (politician_id, temple_id, pilgrim_name, pilgrim_contact, darshan_date, darshan_type, status, notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      politicianId,
      payload.temple_id,
      payload.pilgrim_name,
      payload.pilgrim_contact || '',
      payload.darshan_date || null,
      payload.darshan_type || '',
      'Pending',
      payload.notes || '',
    ],
  );
  const [rows] = await pool.query('SELECT * FROM darshan_requests WHERE id = ?', [r.insertId]);
  res.status(201).json(rows[0]);
});

app.post('/api/darshan/approve', authMiddleware, async (req, res) => {
  const { request_id, status, approval_notes } = req.body || {};
  if (!request_id || !status) return res.status(400).json({ error: 'request_id and status required' });
  const [rows] = await pool.query('SELECT * FROM darshan_requests WHERE id = ?', [request_id]);
  const reqRow = rows[0];
  if (!reqRow) return res.status(404).json({ error: 'Request not found' });
  const isSuperAdmin = req.user.role === 'super_admin';
  if (!isSuperAdmin && reqRow.politician_id !== req.user.politician_id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('UPDATE darshan_requests SET status = ?, notes = ? WHERE id = ?', [status, approval_notes || '', request_id]);
  if (reqRow.politician_id) {
    await pool.query('INSERT INTO notifications (politician_id,title,message,link) VALUES (?,?,?,?)', [
      reqRow.politician_id,
      `Darshan ${status.toLowerCase()} for ${reqRow.pilgrim_name}`,
      `Request ${status.toLowerCase()} for temple #${reqRow.temple_id}.`,
      'darshan',
    ]);
  }
  res.json({ success: true });
});

app.get('/api/darshan/quota/:temple_id', authMiddleware, async (req, res) => {
  const isSuperAdmin = req.user.role === 'super_admin';
  if (!isSuperAdmin && !req.user.politician_id) return res.status(403).json({ error: 'Forbidden' });
  const params = [req.params.temple_id];
  let sql = 'SELECT * FROM darshan_quotas WHERE temple_id = ?';
  if (!isSuperAdmin) {
    sql += ' AND politician_id = ?';
    params.push(req.user.politician_id);
  }
  sql += ' ORDER BY quota_date DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows || []);
});

// ── DARSHAN SMS ───────────────────────────────────────────────
app.post('/api/darshan-sms', authMiddleware, async (req, res) => {
  try {
    const { booking_id, approved_by, approval_notes, contact_person, contact_phone, ticket_pickup_point, shrine_contact_numbers } = req.body;
    const [rows] = await pool.query('SELECT * FROM darshan_bookings WHERE id = ?', [booking_id]);
    const bk = rows[0];
    if (!bk) return res.status(404).json({ success: false, error: 'Booking not found' });
    const pc = bk.pilgrim_contact?.replace(/\D/g,'').slice(-10);
    const dt = new Date(bk.darshan_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    const rcp = contact_person || bk.contact_person, rph = contact_phone || bk.contact_phone;
    const pickupPoint = ticket_pickup_point || bk.ticket_pickup_point || 'TTD Ticket Counter, Tirumala';
    const shrineContacts = shrine_contact_numbers || bk.shrine_contact_numbers || 'TTD Helpline: 155257';
    const cLine = rcp && rph ? `Queries: ${rcp} - ${rph}.` : '';
    const sms = `Dear ${bk.pilgrim_name}, your Tirupati Darshan is CONFIRMED. Date: ${dt} (${bk.darshan_type}). Ticket pickup: ${pickupPoint}. Shrine contacts: ${shrineContacts}. ${cLine} Carry this msg & valid ID. - MP Office`;
    let smsSent = false, smsErr = '';
    if (process.env.FAST2SMS_API_KEY && pc) {
      const r = await fetch('https://www.fast2sms.com/dev/bulkV2',{method:'POST',headers:{authorization:process.env.FAST2SMS_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({route:'q',message:sms,language:'english',flash:0,numbers:pc})});
      const d = await r.json(); smsSent = d.return === true; if (!smsSent) smsErr = JSON.stringify(d);
    }
    await pool.query(`UPDATE darshan_bookings SET approval_status='approved',approved_at=NOW(),approved_by=?,approval_notes=?,contact_person=?,contact_phone=?,ticket_pickup_point=?,shrine_contact_numbers=?,sms_sent=?,sms_sent_at=?,status='Confirmed' WHERE id=?`,
      [approved_by,approval_notes||'',rcp||'',rph||'',pickupPoint,shrineContacts,smsSent,smsSent?new Date():null,booking_id]);
    if (bk.politician_id) {
      await pool.query('INSERT INTO notifications (politician_id,title,message,link) VALUES (?,?,?,?)', [
        bk.politician_id,
        `Darshan confirmed for ${bk.pilgrim_name}`,
        `Darshan approved on ${dt} (${bk.darshan_type}).`,
        'darshan',
      ]);
    }
    res.json({ success: true, sms_sent: smsSent, sms_error: smsErr||null, message: sms });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

// ── AI ASSISTANT — GEMINI ─────────────────────────────────────
function buildPrompt(ctx, mode) {
  const n=ctx?.name||'the politician',p=ctx?.party||'their party',c=ctx?.constituency||'their constituency',s=ctx?.state||'their state',d=ctx?.designation||'Member of Parliament';
  const base=`You are NETHRA AI, a highly intelligent political assistant for ${n}, ${d} from ${c}, ${s}, representing ${p}. Deep expertise in Indian politics, parliamentary procedures, constituency management. Always professional, factual, culturally sensitive.`;
  const m={
    chat:`${base} Answer questions and offer strategic political advice.`,
    speech:`${base} Write powerful inspiring speeches with a strong hook, local issues, data points, call to action.`,
    briefing:`${base} Generate comprehensive briefings: executive summary, analysis, risks, recommended actions.`,
    grievance_reply:`${base} Draft professional empathetic official constituent replies. Sign off as ${n}.`,
    social_post:`${base} Create 3 variations: tweet under 280 chars, Facebook post, Instagram caption with hashtags.`,
    press_release:`${base} Write formal press release with headline, lead, body with quotes, boilerplate.`,
    talking_points:`${base} Generate crisp bullet-point talking points with supporting data.`,
    analysis:`${base} Deep structured analysis: situation, stakeholders, risks, opportunities, recommendations.`,
  };
  return m[mode]||m.chat;
}

app.post('/api/ai-assistant', authMiddleware, async (req, res) => {
  const { messages, politician_context, mode = 'chat', politician_id, save_content, content_type, prompt_summary } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'No messages provided' });
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const polId = isSuperAdmin ? (politician_id || req.user.politician_id) : req.user.politician_id;
    const systemPrompt = buildPrompt ? buildPrompt(politician_context, mode) : (politician_context?.system || 'You are a helpful political intelligence assistant for an Indian politician.');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    
    const full = await aiStream({ messages, system: systemPrompt, politicianId: polId, endpoint: 'ai.assistant', res });
    res.end();
    if (save_content && polId && full) {
      const up = messages.filter(m=>m.role==='user').slice(-1)[0]?.content || '';
      await pool.query('INSERT INTO ai_generated_content (politician_id,content_type,prompt,content,is_saved) VALUES (?,?,?,?,0)',
        [polId, content_type || mode, (prompt_summary || up).slice(0, 500), full]);
    }
  } catch (e) {
    console.error('[ai-assistant]', e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
    else res.end();
  }
});


// ── OMNISCAN & MORNING BRIEF ────────────────────────────────
app.post('/api/omniscan/trigger', async (req, res, next) => { req.user = { role: "super_admin", politician_id: 1 }; next(); }, async (req, res) => {
  try {
    const job = await enqueueOmniScan();
    res.json({ status: 'queued', jobId: job?.id || null, queues: getQueuesStatus() });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to trigger OmniScan' });
  }
});

app.get('/api/omniscan/status', authMiddleware, async (req, res) => {
  res.json(getQueuesStatus());
});

// MEDIA SCRAPER API
app.post('/api/media/scrape', authMiddleware, async (req, res) => {
  try {
    const { url, name } = req.body;
    
    if (!url && !name) {
      return res.status(400).json({ error: 'Either URL or politician name required' });
    }
    
    if (url) {
      // Scrape a specific URL
      // TODO: Implement URL scraping
      return res.status(200).json({ message: 'URL scraping not yet implemented', url });
    } else if (name) {
      // Scrape politician profile
      const scrapedData = await scrapePoliticianProfile(name);
      if (scrapedData.error) {
        return res.status(404).json(scrapedData);
      }
      return res.json(scrapedData);
    }
  } catch (error) {
    console.error('[media-scrape]', error);
    res.status(500).json({ error: 'Failed to scrape: ' + error.message });
  }
});

app.post('/api/sentiment/update', authMiddleware, async (req, res) => {
  try {
    const job = await enqueueSentimentUpdate();
    res.json({ status: 'queued', jobId: job?.id || null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to update sentiment' });
  }
});

app.get('/api/sentiment/current', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const data = await getCurrentSentiment(politicianId);
    res.json(data || {});
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch sentiment' });
  }
});

app.get('/api/sentiment/history', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const data = await getSentimentHistory(politicianId, days);
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch sentiment history' });
  }
});

app.get('/api/briefing/today', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const briefing = await generateMorningBrief({ politicianId, force: false });
    res.json(briefing);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch briefing' });
  }
});

app.post('/api/briefing/generate', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const job = await enqueueMorningBrief(politicianId);
    res.json({ status: 'queued', jobId: job?.id || null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to generate briefing' });
  }
});

app.post('/api/content-factory/generate', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const job = await enqueueContentPack(politicianId);
    res.json({ status: 'queued', jobId: job?.id || null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to generate content pack' });
  }
});

app.post('/api/visit-planner/generate', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const job = await enqueueVisitPlanner(politicianId);
    res.json({ status: 'queued', jobId: job?.id || null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to generate visit plan' });
  }
});

// ── FUTURE LAB PIPELINES ─────────────────────────────────────
app.post('/api/agent-system/run', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'field_worker') return res.status(403).json({ error: 'Forbidden' });
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    const job = await enqueueAgentSystem(politicianId);
    res.json({ status: job?.id ? 'queued' : 'completed', jobId: job?.id || null, result: job?.created ? job : null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to run agent system' });
  }
});

app.get('/api/agent-system/metrics', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    res.json(await agentSystemMetrics(politicianId));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load agent metrics' });
  }
});

app.post('/api/deepfake-shield/scan', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    const job = await enqueueDeepfakeScan(politicianId);
    res.json({ status: job?.id ? 'queued' : 'completed', jobId: job?.id || null, result: job?.created ? job : null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to scan deepfake incidents' });
  }
});

app.get('/api/deepfake-shield/metrics', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    res.json(await deepfakeMetrics(politicianId));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load deepfake metrics' });
  }
});

app.post('/api/coalition-forecast/run', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    const job = await enqueueCoalitionForecast(politicianId);
    res.json({ status: job?.id ? 'queued' : 'completed', jobId: job?.id || null, result: job?.updated ? job : null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to run coalition forecast' });
  }
});

app.get('/api/coalition-forecast/overview', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    res.json(await coalitionOverview(politicianId));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load coalition overview' });
  }
});

app.post('/api/crisis-war-room/scan', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.body?.politician_id || req.user.politician_id) : req.user.politician_id;
    const job = await enqueueWarRoomScan(politicianId);
    res.json({ status: job?.id ? 'queued' : 'completed', jobId: job?.id || null, result: job?.created ? job : null });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to scan crisis war room' });
  }
});

app.get('/api/crisis-war-room/overview', authMiddleware, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const politicianId = isSuperAdmin ? (req.query.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!politicianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    res.json(await warRoomMetrics(politicianId));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load war room metrics' });
  }
});

// ── WHATSAPP WEBHOOK (optional) ─────────────────────────────
// WhatsApp webhook — supports AiSensy, Wati, and generic payloads
// Webhook URL: https://thoughtfirst.in/api/whatsapp/webhook?politician_id=X
// AiSensy:  set this URL in AiSensy webhook settings, add x-webhook-secret header
// Wati:     set this URL in Wati webhook settings
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    // Always acknowledge immediately — WhatsApp providers retry if no quick 200
    res.json({ ok: true });

    const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (secret && req.headers['x-webhook-secret'] !== secret &&
        req.headers['x-hub-signature-256'] === undefined) {
      console.warn('[whatsapp] Unauthorized webhook attempt');
      return;
    }

    const payload = req.body || {};
    const politician_id = req.query.politician_id || payload.politician_id || null;

    // Detect provider and parse
    let parsed;
    const ua = req.headers['user-agent'] || '';
    if (ua.includes('AiSensy') || payload?.app_id || payload?.contact?.wa_id) {
      parsed = parseAiSensyWebhook(payload);
    } else if (payload?.waId || payload?.senderWaId) {
      parsed = parseWatiWebhook(payload);
    } else {
      // Generic / manual test
      parsed = {
        sender_phone: payload.sender || payload.from || payload.phone || '',
        message_type: payload.type || 'text',
        content: String(payload.message || payload.text || payload.content || ''),
      };
    }

    if (!parsed.content || parsed.content.trim().length < 2) return;

    await processWhatsappMessage({
      politician_id,
      sender_phone: parsed.sender_phone,
      message_type: parsed.message_type,
      content: parsed.content,
      transcription: payload.transcription || '',
    });
  } catch (e) {
    console.error('[whatsapp webhook]', e.message);
  }
});

// WhatsApp webhook GET — for verification (AiSensy/Meta challenge)
app.get('/api/whatsapp/webhook', (req, res) => {
  const challenge = req.query['hub.challenge'];
  const verify = req.query['hub.verify_token'];
  if (verify === (process.env.WHATSAPP_WEBHOOK_SECRET || 'thoughtfirst')) {
    return res.send(challenge || 'OK');
  }
  res.send('OK');
});

// Manual WhatsApp message injection (for testing)
app.post('/api/whatsapp/inject', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { sender_phone, content, message_type = 'text' } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const politician_id = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const id = await processWhatsappMessage({ politician_id, sender_phone: sender_phone || '+91TEST', message_type, content });
    res.json({ success: true, id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── VOICE INTELLIGENCE ─────────────────────────────────────
app.post('/api/voice/transcribe', authMiddleware, async (req, res) => {
  try {
    const { audio_base64, filename, mimeType, transcript, reporter_name, reporter_role, language, location, gps_lat, gps_lng, classification, politician_id } = req.body;
    let text = transcript;
    if (!text && audio_base64) {
      text = await transcribeAudio({ audioBase64: audio_base64, filename, mimeType, politicianId: assignedPoliticianId });
    }
    if (!text) return res.status(400).json({ error: 'No transcript or audio provided' });
    const isSuperAdmin = req.user.role === 'super_admin';
    const assignedPoliticianId = isSuperAdmin ? (politician_id || req.user.politician_id) : req.user.politician_id;
    if (!assignedPoliticianId && !isSuperAdmin) return res.status(403).json({ error: 'Forbidden' });
    const reportId = await createVoiceReport({
      politician_id: assignedPoliticianId,
      reporter_name,
      reporter_role,
      transcript: text,
      classification,
      language,
      location,
      gps_lat,
      gps_lng,
    });
    res.json({ success: true, transcript: text, report_id: reportId });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to transcribe' });
  }
});

// ── FOUNDER COMMAND CENTER ───────────────────────────────────
const requireSuperAdmin = (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
};

app.get('/api/founder/dashboard', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const [[{ totalPoliticians }]] = await pool.query("SELECT COUNT(*) as totalPoliticians FROM politician_profiles WHERE is_active = 1 AND (role = 'politician' OR role IS NULL)");
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE is_active = 1');
    const [[{ openAlerts }]] = await pool.query('SELECT COUNT(*) as openAlerts FROM notifications WHERE is_read = 0');
    const [[{ activeBriefings }]] = await pool.query('SELECT COUNT(*) as activeBriefings FROM ai_briefings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const [politicians] = await pool.query("SELECT id,full_name,party,designation,state,is_active,created_at FROM politician_profiles WHERE (role = 'politician' OR role IS NULL) AND role != 'admin' ORDER BY created_at DESC LIMIT 12");
    const [intelFeed] = await pool.query('SELECT id,opponent_name,activity_type,description,created_at FROM opposition_intelligence ORDER BY created_at DESC LIMIT 10');
    const [[{ mrr }]] = await pool.query("SELECT COALESCE(SUM(amount),0) as mrr FROM billing_records WHERE status = 'paid' AND billing_period = 'monthly'");
    res.json({
      metrics: { total_politicians: totalPoliticians, total_users: totalUsers, open_alerts: openAlerts, recent_briefings: activeBriefings, mrr },
      politicians,
      intelligence_feed: intelFeed,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/platform/metrics', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const [rows] = await pool.query('SELECT metric_key, metric_value, recorded_at FROM platform_metrics ORDER BY recorded_at DESC LIMIT 100');
    res.json(rows || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/politicians', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const [rows] = await pool.query("SELECT * FROM politician_profiles WHERE (role = 'politician' OR role IS NULL) AND role != 'admin' ORDER BY created_at DESC");
    res.json(rows || []);
  } catch (e) {
    console.error('[GET /api/founder/politicians]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/founder/politicians', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const payload = req.body || {};
    if (!payload.full_name) return res.status(400).json({ error: 'full_name required' });
    // Allowed columns — strip anything not in schema to avoid unknown column errors
    const ALLOWED = ['full_name','display_name','slug','photo_url','party','designation',
      'constituency_name','state','lok_sabha_seat','bio','phone','email','office_address',
      'website','twitter_handle','facebook_url','instagram_handle','youtube_channel',
      'education','dob','age','languages','achievements','role','is_active','term_start',
      'term_end','previous_terms','election_year','subscription_status','deployed_at',
      'color_primary','color_secondary','auth_user_id'];
    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      if (k === 'id') continue;
      if (!ALLOWED.includes(k)) continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) clean[k] = JSON.stringify(v);
      else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) clean[k] = v.slice(0,19).replace('T',' ');
      else clean[k] = v;
    }
    // Ensure required fields have defaults
    if (!clean.role) clean.role = 'politician';
    if (clean.is_active === undefined) clean.is_active = 1;
    if (!clean.subscription_status) clean.subscription_status = 'active';
    if (!clean.color_primary) clean.color_primary = '#00d4aa';
    if (!clean.color_secondary) clean.color_secondary = '#1e88e5';
    const cols = Object.keys(clean).map(k => `\`${k}\``).join(',');
    const ph = Object.keys(clean).map(() => '?').join(',');
    const [r] = await pool.query(`INSERT INTO politician_profiles (${cols}) VALUES (${ph})`, Object.values(clean));
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('[POST /api/founder/politicians]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/founder/politicians/:id', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const payload = req.body || {};
    const ALLOWED = ['full_name','display_name','slug','photo_url','party','designation',
      'constituency_name','state','lok_sabha_seat','bio','phone','email','office_address',
      'website','twitter_handle','facebook_url','instagram_handle','youtube_channel',
      'education','dob','age','languages','achievements','role','is_active','term_start',
      'term_end','previous_terms','election_year','subscription_status','deployed_at',
      'color_primary','color_secondary','auth_user_id'];
    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      if (k === 'id') continue;
      if (!ALLOWED.includes(k)) continue;
      if (Array.isArray(v) || (v !== null && typeof v === 'object')) clean[k] = JSON.stringify(v);
      else if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) clean[k] = v.slice(0,19).replace('T',' ');
      else clean[k] = v;
    }
    const sets = Object.keys(clean).map(k => `\`${k}\` = ?`).join(',');
    if (!sets) return res.status(400).json({ error: 'No fields to update' });
    await pool.query(`UPDATE politician_profiles SET ${sets} WHERE id = ?`, [...Object.values(clean), req.params.id]);
    const [rows] = await pool.query('SELECT * FROM politician_profiles WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('[PUT /api/founder/politicians]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/founder/politicians/:id/api-keys', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const keys = await listPoliticianApiKeys(req.params.id);
    res.json(keys || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/founder/politicians/:id/api-keys', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { key_name, value, monthly_limit = 0, is_active = 1 } = req.body || {};
  if (!key_name || !value) return res.status(400).json({ error: 'key_name and value required' });
  try {
    if (!hasMasterKey()) return res.status(500).json({ error: 'API_KEYS_MASTER_KEY not configured' });
    const key = await upsertPoliticianApiKey({ politicianId: req.params.id, key_name, value, monthly_limit, is_active });
    res.json({ success: true, key });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/founder/politicians/:id/api-keys/:name', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    await deactivatePoliticianApiKey({ politicianId: req.params.id, key_name: req.params.name });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/founder/politicians/:id/features', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { modules, features, preset } = req.body || {};
  try {
    const [moduleRows] = await pool.query('SELECT module_key FROM feature_modules');
    const [featureRows] = await pool.query('SELECT feature_key,module_key FROM feature_flags');
    let enabledModules = Array.isArray(modules) ? modules : [];
    if (preset) {
      const core = [
        'dashboard','profile','constituency','grievances','appointments','events','voters','polls','booths',
        'legislative','citizen','darshan','darshans','parliamentary','projects','media','communication',
        'finance','team','analytics','documents','settings','staff-management',
      ];
      const intelligence = [
        'ai-studio','briefing','omniscan','morning-brief','sentiment','opposition','voice-intelligence',
        'promises','content-factory','whatsapp-intelligence','smart-visit',
      ];
      const campaign = [
        'predictive-crisis','agent-system','deepfake-shield','relationship-graph','economic-intelligence',
        'citizen-services','election-command','finance-compliance','party-integration','digital-twin',
      ];
      if (preset === 'starter') enabledModules = core;
      if (preset === 'professional') enabledModules = [...core, ...intelligence];
      if (preset === 'intelligence') enabledModules = [...core, ...intelligence];
      if (preset === 'warroom') enabledModules = [...core, ...intelligence, ...campaign];
    }
    const moduleSet = new Set(enabledModules);
    for (const row of moduleRows) {
      const enabled = moduleSet.has(row.module_key);
      await pool.query(
        'INSERT INTO politician_module_access (politician_id,module_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [req.params.id, row.module_key, enabled ? 1 : 0],
      );
      await pool.query(
        'INSERT INTO feature_flag_changes (politician_id, changed_by, flag_key, change_type, new_value) VALUES (?,?,?,?,?)',
        [req.params.id, req.user.id, row.module_key, 'module_access', enabled ? 'enabled' : 'disabled'],
      );
    }
    const featureSet = new Set(Array.isArray(features) ? features : []);
    for (const row of featureRows) {
      const enabled = featureSet.size ? featureSet.has(row.feature_key) : moduleSet.has(row.module_key);
      await pool.query(
        'INSERT INTO politician_feature_access (politician_id,feature_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [req.params.id, row.feature_key, enabled ? 1 : 0],
      );
      await pool.query(
        'INSERT INTO feature_flag_changes (politician_id, changed_by, flag_key, change_type, new_value) VALUES (?,?,?,?,?)',
        [req.params.id, req.user.id, row.feature_key, 'feature_access', enabled ? 'enabled' : 'disabled'],
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/users', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const [rows] = await pool.query('SELECT id,email,display_name,role,politician_id,is_active,created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

app.get('/api/founder/profile', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const [rows] = await pool.query('SELECT id,email,display_name,role FROM users WHERE id = ?', [req.user.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/founder/profile', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { display_name } = req.body || {};
  if (!display_name) return res.status(400).json({ error: 'display_name required' });
  try {
    await pool.query('UPDATE users SET display_name = ? WHERE id = ?', [display_name.trim(), req.user.id]);
    const [rows] = await pool.query('SELECT id,email,display_name,role FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/founder/users', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { email, password, role, politician_id } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const [r] = await pool.query('INSERT INTO users (email,password_hash,role,politician_id) VALUES (?,?,?,?)', [email, hash, role, politician_id || null]);
    res.status(201).json({ id: r.insertId, email, role, politician_id: politician_id || null });
  } catch (e) {
    e.code === 'ER_DUP_ENTRY' ? res.status(409).json({ error: 'Email already exists' }) : res.status(500).json({ error: e.message });
  }
});

app.delete('/api/founder/users/:id', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

app.get('/api/founder/api-keys', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const keys = await listApiKeys();
    res.json({ keys, masterKeyConfigured: hasMasterKey() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/founder/api-keys', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { key_name, value } = req.body || {};
  if (!key_name || !value) return res.status(400).json({ error: 'key_name and value required' });
  try {
    if (!hasMasterKey()) return res.status(500).json({ error: 'API_KEYS_MASTER_KEY not configured' });
    const updated = await upsertApiKey(key_name, value);
    res.json({ success: true, key: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/founder/api-keys/:name', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    await deactivateApiKey(req.params.name);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/founder/feature-modules', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    await ensureDefaultModules();
    const [rows] = await pool.query('SELECT * FROM feature_modules ORDER BY category, label');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/founder/feature-modules', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { module_key, label, category = '', description = '', is_future = 0 } = req.body || {};
  if (!module_key || !label) return res.status(400).json({ error: 'module_key and label required' });
  try {
    await pool.query(
      'INSERT INTO feature_modules (module_key,label,category,description,is_active,is_future) VALUES (?,?,?,?,1,?)',
      [module_key, label, category, description, is_future ? 1 : 0],
    );
    const [rows] = await pool.query('SELECT * FROM feature_modules WHERE module_key = ?', [module_key]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/founder/feature-modules/:key', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { key } = req.params;
  const { label, category, description, is_active, is_future } = req.body || {};
  try {
    const updates = [];
    const params = [];
    if (label !== undefined) { updates.push('label = ?'); params.push(label); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (is_future !== undefined) { updates.push('is_future = ?'); params.push(is_future ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    await pool.query(`UPDATE feature_modules SET ${updates.join(', ')} WHERE module_key = ?`, [...params, key]);
    const [rows] = await pool.query('SELECT * FROM feature_modules WHERE module_key = ?', [key]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/feature-flags', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    await ensureDefaultFeatures();
    const [rows] = await pool.query('SELECT * FROM feature_flags ORDER BY module_key, label');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/founder/feature-flags', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { feature_key, module_key, label, description = '', is_future = 0 } = req.body || {};
  if (!feature_key || !module_key || !label) return res.status(400).json({ error: 'feature_key, module_key and label required' });
  try {
    await pool.query(
      'INSERT INTO feature_flags (feature_key,module_key,label,description,is_active,is_future) VALUES (?,?,?,?,1,?)',
      [feature_key, module_key, label, description, is_future ? 1 : 0],
    );
    const [rows] = await pool.query('SELECT * FROM feature_flags WHERE feature_key = ?', [feature_key]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/founder/feature-flags/:key', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { key } = req.params;
  const { label, description, is_active, is_future } = req.body || {};
  try {
    const updates = [];
    const params = [];
    if (label !== undefined) { updates.push('label = ?'); params.push(label); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (is_future !== undefined) { updates.push('is_future = ?'); params.push(is_future ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    await pool.query(`UPDATE feature_flags SET ${updates.join(', ')} WHERE feature_key = ?`, [...params, key]);
    const [rows] = await pool.query('SELECT * FROM feature_flags WHERE feature_key = ?', [key]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/module-access', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    await ensureDefaultModules();
    const [modules] = await pool.query('SELECT * FROM feature_modules ORDER BY category, label');
    const [politicianAccess] = await pool.query('SELECT * FROM politician_module_access');
    const [roleAccess] = await pool.query('SELECT * FROM role_module_access');
    res.json({ modules, politician_access: politicianAccess, role_access: roleAccess });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/founder/module-access', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { module_key, politician_id, role, is_enabled } = req.body || {};
  if (!module_key || (!politician_id && !role)) return res.status(400).json({ error: 'module_key and politician_id or role required' });
  try {
    if (politician_id) {
      await pool.query(
        'INSERT INTO politician_module_access (politician_id,module_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [politician_id, module_key, is_enabled ? 1 : 0],
      );
      await pool.query(
        'INSERT INTO feature_flag_changes (politician_id, changed_by, flag_key, change_type, new_value) VALUES (?,?,?,?,?)',
        [politician_id, req.user.id, module_key, 'module_access', is_enabled ? 'enabled' : 'disabled'],
      );
    } else {
      await pool.query(
        'INSERT INTO role_module_access (role,module_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [role, module_key, is_enabled ? 1 : 0],
      );
      await pool.query(
        'INSERT INTO feature_flag_changes (politician_id, changed_by, flag_key, change_type, new_value) VALUES (?,?,?,?,?)',
        [null, req.user.id, module_key, `role:${role}`, is_enabled ? 'enabled' : 'disabled'],
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/feature-access', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    await ensureDefaultFeatures();
    const [features] = await pool.query('SELECT * FROM feature_flags ORDER BY module_key, label');
    const [politicianAccess] = await pool.query('SELECT * FROM politician_feature_access');
    const [roleAccess] = await pool.query('SELECT * FROM role_feature_access');
    res.json({ features, politician_access: politicianAccess, role_access: roleAccess });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/founder/feature-access', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { feature_key, politician_id, role, is_enabled } = req.body || {};
  if (!feature_key || (!politician_id && !role)) return res.status(400).json({ error: 'feature_key and politician_id or role required' });
  try {
    if (politician_id) {
      await pool.query(
        'INSERT INTO politician_feature_access (politician_id,feature_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [politician_id, feature_key, is_enabled ? 1 : 0],
      );
      await pool.query(
        'INSERT INTO feature_flag_changes (politician_id, changed_by, flag_key, change_type, new_value) VALUES (?,?,?,?,?)',
        [politician_id, req.user.id, feature_key, 'feature_access', is_enabled ? 'enabled' : 'disabled'],
      );
    } else {
      await pool.query(
        'INSERT INTO role_feature_access (role,feature_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [role, feature_key, is_enabled ? 1 : 0],
      );
      await pool.query(
        'INSERT INTO feature_flag_changes (politician_id, changed_by, flag_key, change_type, new_value) VALUES (?,?,?,?,?)',
        [null, req.user.id, feature_key, `role:${role}`, is_enabled ? 'enabled' : 'disabled'],
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SMS TEST ENDPOINT (founder) ───────────────────────────────
app.post('/api/founder/sms/test', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { phone, politician_id, message } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const smsKey = await getApiKey('FAST2SMS_API_KEY', { politicianId: politician_id, endpoint: 'sms.test' })
      || process.env.FAST2SMS_API_KEY;
    if (!smsKey) return res.status(500).json({ error: 'FAST2SMS_API_KEY not configured. Add it in API Keys.' });
    const testMsg = message || 'ThoughtFirst SMS test message. Your political intelligence platform is configured correctly.';
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return res.status(400).json({ error: 'Invalid phone number' });
    const r = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: smsKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message: testMsg, language: 'english', flash: 0, numbers: cleanPhone }),
    });
    const d = await r.json();
    res.json({ success: d.return === true, response: d, phone: `+91${cleanPhone}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DARSHAN SMS CONFIG PER POLITICIAN (founder) ───────────────
app.get('/api/founder/politicians/:id/sms-config', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const smsKey = await getApiKey('FAST2SMS_API_KEY', { politicianId: req.params.id });
    const [settings] = await pool.query(
      "SELECT setting_key, setting_value FROM platform_settings WHERE politician_id = ? AND setting_key LIKE 'darshan_%'",
      [req.params.id]
    );
    const config = {};
    for (const row of settings) config[row.setting_key] = row.setting_value;
    res.json({ sms_configured: !!smsKey, sms_key_hint: smsKey ? '••••' + smsKey.slice(-4) : null, ...config });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/founder/politicians/:id/sms-config', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { darshan_contact_person, darshan_contact_phone, darshan_pickup_point, darshan_shrine_contacts } = req.body;
    const settings = { darshan_contact_person, darshan_contact_phone, darshan_pickup_point, darshan_shrine_contacts };
    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) continue;
      await pool.query(
        'INSERT INTO platform_settings (politician_id, setting_key, setting_value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',
        [req.params.id, key, value]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/founder/reports', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const [rows] = await pool.query('SELECT * FROM admin_reports ORDER BY created_at DESC LIMIT 50');
    res.json(rows || []);
  } catch (e) {
    console.error('[GET /api/founder/reports]', e.message);
    res.json([]);
  }
});

app.post('/api/founder/reports/weekly', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { politician_id } = req.body || {};
    const title = politician_id
      ? `Weekly Report — ${new Date().toLocaleDateString('en-IN')}`
      : `Platform Weekly Report — ${new Date().toLocaleDateString('en-IN')}`;
    await pool.query(
      'INSERT INTO admin_reports (politician_id, report_type, title, summary, content, created_by) VALUES (?,?,?,?,?,?)',
      [politician_id || null, 'weekly', title, 'Auto-generated weekly report', '{}', req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[POST /api/founder/reports/weekly]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── SUPER ADMIN — USERS ───────────────────────────────────────
app.post('/api/admin/users', authMiddleware, async (req, res) => {
  const callerRole = req.user.role;
  if (callerRole !== 'super_admin' && callerRole !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  
  const { email, password, role, politician_id } = req.body;
  
  // Politician admin can only create staff for their own politician
  if (callerRole === 'politician_admin') {
    if (role && !['staff', 'field_worker'].includes(role)) return res.status(403).json({ error: 'Politicians can only create staff or field worker accounts' });
    if (politician_id && politician_id != req.user.politician_id) return res.status(403).json({ error: 'Cannot create users for other politicians' });
  }
  
  const assignedPoliticianId = callerRole === 'politician_admin' ? req.user.politician_id : (politician_id || null);
  const assignedRole = callerRole === 'politician_admin' ? (role && ['staff','field_worker'].includes(role) ? role : 'staff') : (role || 'staff');
  
  try {
    const hash = await bcrypt.hash(password, 12);
    const [r] = await pool.query('INSERT INTO users (email,password_hash,role,politician_id) VALUES (?,?,?,?)', 
      [email, hash, assignedRole, assignedPoliticianId]);
    res.status(201).json({ id: r.insertId, email, role: assignedRole, politician_id: assignedPoliticianId });
  } catch (e) { 
    e.code==='ER_DUP_ENTRY' ? res.status(409).json({error:'Email already exists'}) : res.status(500).json({error:e.message}); 
  }
});

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  const callerRole = req.user.role;
  if (callerRole !== 'super_admin' && callerRole !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  
  let rows;
  if (callerRole === 'super_admin') {
    [rows] = await pool.query('SELECT id,email,role,politician_id,is_active,created_at FROM users ORDER BY created_at DESC');
  } else {
    // Politician can only see their own staff
    [rows] = await pool.query('SELECT id,email,role,politician_id,is_active,created_at FROM users WHERE politician_id = ? ORDER BY created_at DESC', [req.user.politician_id]);
  }
  res.json(rows);
});

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  const callerRole = req.user.role;
  if (callerRole !== 'super_admin' && callerRole !== 'politician_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    // Politician can only delete their own staff
    if (callerRole === 'politician_admin') {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!rows[0] || rows[0].politician_id != req.user.politician_id) return res.status(403).json({ error: 'Cannot delete this user' });
      if (rows[0].role !== 'staff') return res.status(403).json({ error: 'Can only delete staff accounts' });
    }
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SUPER ADMIN — API KEYS ──────────────────────────────────
app.get('/api/admin/api-keys', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const keys = await listApiKeys();
    res.json({ keys, masterKeyConfigured: hasMasterKey() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/api-keys', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { key_name, value } = req.body || {};
  if (!key_name || !value) return res.status(400).json({ error: 'key_name and value required' });
  try {
    if (!hasMasterKey()) return res.status(500).json({ error: 'API_KEYS_MASTER_KEY not configured' });
    const updated = await upsertApiKey(key_name, value);
    res.json({ success: true, key: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/api-keys/:name', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await deactivateApiKey(req.params.name);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SUPER ADMIN — FEATURE MODULES & ACCESS ────────────────────
app.get('/api/admin/feature-modules', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await ensureDefaultModules();
    const [rows] = await pool.query('SELECT * FROM feature_modules ORDER BY category, label');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/feature-modules', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { module_key, label, category = '', description = '', is_future = 0 } = req.body || {};
  if (!module_key || !label) return res.status(400).json({ error: 'module_key and label required' });
  try {
    await pool.query(
      'INSERT INTO feature_modules (module_key,label,category,description,is_active,is_future) VALUES (?,?,?,?,1,?)',
      [module_key, label, category, description, is_future ? 1 : 0],
    );
    const [rows] = await pool.query('SELECT * FROM feature_modules WHERE module_key = ?', [module_key]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/feature-modules/:key', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { key } = req.params;
  const { label, category, description, is_active, is_future } = req.body || {};
  try {
    const updates = [];
    const params = [];
    if (label !== undefined) { updates.push('label = ?'); params.push(label); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (is_future !== undefined) { updates.push('is_future = ?'); params.push(is_future ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    await pool.query(`UPDATE feature_modules SET ${updates.join(', ')} WHERE module_key = ?`, [...params, key]);
    const [rows] = await pool.query('SELECT * FROM feature_modules WHERE module_key = ?', [key]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/feature-flags', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await ensureDefaultFeatures();
    const [rows] = await pool.query('SELECT * FROM feature_flags ORDER BY module_key, label');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/feature-flags', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { feature_key, module_key, label, description = '', is_future = 0 } = req.body || {};
  if (!feature_key || !module_key || !label) return res.status(400).json({ error: 'feature_key, module_key and label required' });
  try {
    await pool.query(
      'INSERT INTO feature_flags (feature_key,module_key,label,description,is_active,is_future) VALUES (?,?,?,?,1,?)',
      [feature_key, module_key, label, description, is_future ? 1 : 0],
    );
    const [rows] = await pool.query('SELECT * FROM feature_flags WHERE feature_key = ?', [feature_key]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/feature-flags/:key', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { key } = req.params;
  const { label, description, is_active, is_future, module_key } = req.body || {};
  try {
    const updates = [];
    const params = [];
    if (label !== undefined) { updates.push('label = ?'); params.push(label); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (module_key !== undefined) { updates.push('module_key = ?'); params.push(module_key); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (is_future !== undefined) { updates.push('is_future = ?'); params.push(is_future ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    await pool.query(`UPDATE feature_flags SET ${updates.join(', ')} WHERE feature_key = ?`, [...params, key]);
    const [rows] = await pool.query('SELECT * FROM feature_flags WHERE feature_key = ?', [key]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/module-access', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await ensureDefaultModules();
    const [modules] = await pool.query('SELECT * FROM feature_modules ORDER BY category, label');
    const [politicianAccess] = await pool.query('SELECT * FROM politician_module_access');
    const [roleAccess] = await pool.query('SELECT * FROM role_module_access');
    res.json({ modules, politician_access: politicianAccess, role_access: roleAccess });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/module-access', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { module_key, politician_id, role, is_enabled } = req.body || {};
  if (!module_key || (!politician_id && !role)) return res.status(400).json({ error: 'module_key and politician_id or role required' });
  try {
    if (politician_id) {
      await pool.query(
        'INSERT INTO politician_module_access (politician_id,module_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [politician_id, module_key, is_enabled ? 1 : 0],
      );
    } else {
      await pool.query(
        'INSERT INTO role_module_access (role,module_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [role, module_key, is_enabled ? 1 : 0],
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/feature-access', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await ensureDefaultFeatures();
    const [features] = await pool.query('SELECT * FROM feature_flags ORDER BY module_key, label');
    const [politicianAccess] = await pool.query('SELECT * FROM politician_feature_access');
    const [roleAccess] = await pool.query('SELECT * FROM role_feature_access');
    res.json({ features, politician_access: politicianAccess, role_access: roleAccess });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/feature-access', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { feature_key, politician_id, role, is_enabled } = req.body || {};
  if (!feature_key || (!politician_id && !role)) return res.status(400).json({ error: 'feature_key and politician_id or role required' });
  try {
    if (politician_id) {
      await pool.query(
        'INSERT INTO politician_feature_access (politician_id,feature_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [politician_id, feature_key, is_enabled ? 1 : 0],
      );
    } else {
      await pool.query(
        'INSERT INTO role_feature_access (role,feature_key,is_enabled) VALUES (?,?,?) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)',
        [role, feature_key, is_enabled ? 1 : 0],
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/politician-overview', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.full_name, p.party, p.designation, p.constituency_name, p.state, p.is_active, p.subscription_status,
        p.color_primary, p.color_secondary,
        (SELECT COUNT(*) FROM grievances g WHERE g.politician_id = p.id AND g.status NOT IN ('Resolved','Closed')) AS open_grievances,
        (SELECT COUNT(*) FROM projects pr WHERE pr.politician_id = p.id AND pr.status IN ('In Progress','Planning','Tendering')) AS active_projects,
        (SELECT COUNT(*) FROM events e WHERE e.politician_id = p.id AND e.start_date >= CURDATE()) AS upcoming_events,
        (SELECT COUNT(*) FROM media_mentions m WHERE m.politician_id = p.id AND m.sentiment = 'Negative' AND m.published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS negative_mentions,
        (SELECT COUNT(*) FROM opposition_intelligence o WHERE o.politician_id = p.id AND o.threat_level >= 7 AND o.detected_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS high_threats,
        (SELECT COUNT(*) FROM voice_reports v WHERE v.politician_id = p.id AND v.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS voice_reports,
        (SELECT ROUND(AVG(s.overall_score)) FROM sentiment_scores s WHERE s.politician_id = p.id AND s.score_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)) AS sentiment_avg
      FROM politician_profiles p
      WHERE (p.role = 'politician' OR p.role IS NULL)
      ORDER BY p.full_name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/reports/weekly', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { politician_id } = req.body || {};
  try {
    const targets = [];
    if (politician_id) {
      targets.push(politician_id);
    } else {
      const [pols] = await pool.query("SELECT id FROM politician_profiles WHERE (role = 'politician' OR role IS NULL) AND role != 'admin' ORDER BY full_name");
      targets.push(...pols.map(p => p.id));
    }
    const results = [];
    for (const polId of targets) {
      const [[pol]] = await pool.query("SELECT full_name,constituency_name,state FROM politician_profiles WHERE id = ? AND (role = 'politician' OR role IS NULL)", [polId]);
      if (!pol) continue;
      const [[grievances]] = await pool.query(
        "SELECT COUNT(*) as total, SUM(status IN ('Resolved','Closed')) as resolved FROM grievances WHERE politician_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [polId],
      );
      const [[sentiment]] = await pool.query(
        'SELECT ROUND(AVG(overall_score)) as avg_score FROM sentiment_scores WHERE politician_id = ? AND score_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
        [polId],
      );
      const [[opposition]] = await pool.query(
        'SELECT COUNT(*) as threats FROM opposition_intelligence WHERE politician_id = ? AND threat_level >= 7 AND detected_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        [polId],
      );
      const [[projects]] = await pool.query(
        "SELECT COUNT(*) as active FROM projects WHERE politician_id = ? AND status IN ('In Progress','Planning','Tendering')",
        [polId],
      );
      const title = `Weekly Performance Report — ${pol.full_name}`;
      const summary = `Grievances: ${grievances?.total || 0} (Resolved ${grievances?.resolved || 0}). Sentiment: ${sentiment?.avg_score ?? 0}. Opposition threats: ${opposition?.threats || 0}. Active projects: ${projects?.active || 0}.`;
      const content = [
        `Politician: ${pol.full_name}`,
        `Constituency: ${pol.constituency_name || 'N/A'}, ${pol.state || 'N/A'}`,
        '',
        'Highlights:',
        `• New grievances: ${grievances?.total || 0}`,
        `• Resolved grievances: ${grievances?.resolved || 0}`,
        `• Average sentiment score: ${sentiment?.avg_score ?? 0}`,
        `• High-threat opposition activity: ${opposition?.threats || 0}`,
        `• Active projects: ${projects?.active || 0}`,
      ].join('\n');
      const [result] = await pool.query(
        'INSERT INTO admin_reports (politician_id,report_type,title,summary,content,created_by) VALUES (?,?,?,?,?,?)',
        [polId, 'weekly_performance', title, summary, content, req.user.id],
      );
      results.push({ id: result.insertId, title, summary });
    }
    res.json({ success: true, reports: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/reports', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const { politician_id } = req.query;
  try {
    const params = [];
    let sql = 'SELECT * FROM admin_reports';
    if (politician_id) {
      sql += ' WHERE politician_id = ?';
      params.push(politician_id);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ACCESS SUMMARY (ROLE + POLITICIAN) ────────────────────────
app.get('/api/access/summary', authMiddleware, async (req, res) => {
  try {
    await ensureDefaultModules();
    await ensureDefaultFeatures();
    const role = req.user.role;
    const polId = req.user.politician_id;
    const [moduleRows] = await pool.query('SELECT module_key,is_active FROM feature_modules WHERE is_active = 1');
    const [featureRows] = await pool.query('SELECT feature_key,is_active FROM feature_flags WHERE is_active = 1');
    const moduleKeys = moduleRows.map(r => r.module_key);
    const featureKeys = featureRows.map(r => r.feature_key);

    if (role === 'super_admin') {
      return res.json({ modules: moduleKeys, features: featureKeys, moduleAccess: {}, featureAccess: {} });
    }

    const [roleModules] = await pool.query('SELECT module_key,is_enabled FROM role_module_access WHERE role = ?', [role]);
    const [roleFeatures] = await pool.query('SELECT feature_key,is_enabled FROM role_feature_access WHERE role = ?', [role]);
    const [polModules] = polId
      ? await pool.query('SELECT module_key,is_enabled FROM politician_module_access WHERE politician_id = ?', [polId])
      : [[]];
    const [polFeatures] = polId
      ? await pool.query('SELECT feature_key,is_enabled FROM politician_feature_access WHERE politician_id = ?', [polId])
      : [[]];

    const roleModuleMap = new Map(roleModules.map(r => [r.module_key, !!r.is_enabled]));
    const roleFeatureMap = new Map(roleFeatures.map(r => [r.feature_key, !!r.is_enabled]));
    const polModuleMap = new Map(polModules.map(r => [r.module_key, !!r.is_enabled]));
    const polFeatureMap = new Map(polFeatures.map(r => [r.feature_key, !!r.is_enabled]));

    const moduleAccess = {};
    const featureAccess = {};
    const enabledModules = [];
    const enabledFeatures = [];

    moduleKeys.forEach(key => {
      let enabled = true;
      if (roleModuleMap.has(key)) enabled = roleModuleMap.get(key);
      if (polModuleMap.has(key)) enabled = polModuleMap.get(key);
      moduleAccess[key] = enabled;
      if (enabled) enabledModules.push(key);
    });

    featureKeys.forEach(key => {
      let enabled = true;
      if (roleFeatureMap.has(key)) enabled = roleFeatureMap.get(key);
      if (polFeatureMap.has(key)) enabled = polFeatureMap.get(key);
      featureAccess[key] = enabled;
      if (enabled) enabledFeatures.push(key);
    });

    res.json({ modules: enabledModules, features: enabledFeatures, moduleAccess, featureAccess });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUBLIC NEWS API — no auth required ────────────────────────
// Feeds the login screen live news ticker
app.get('/api/public/news', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const category = req.query.category || 'all';
    let sql = `SELECT headline, snippet, source, url, category, sentiment, published_at
               FROM news_cache
               WHERE published_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)`;
    const params = [];
    if (category !== 'all') { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY published_at DESC LIMIT ?';
    params.push(limit);
    const [rows] = await pool.query(sql, params);
    res.json(rows || []);
  } catch (e) { res.json([]); }
});

app.get('/api/public/stats', async (req, res) => {
  try {
    const [[n]] = await pool.query(
      `SELECT COUNT(*) as count FROM news_cache WHERE published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    const [headlines] = await pool.query(
      `SELECT headline FROM news_cache WHERE published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    const states = ['Andhra Pradesh','Telangana','Tamil Nadu','Karnataka','Kerala','Maharashtra',
      'Gujarat','Rajasthan','Uttar Pradesh','Bihar','West Bengal','Odisha','Punjab','Haryana',
      'Delhi','Madhya Pradesh','Chhattisgarh','Jharkhand','Assam'];
    const allText = headlines.map((r) => r.headline).join(' ');
    const statesFound = states.filter(s => allText.includes(s)).length;
    res.json({ news_today: n.count || 0, states_today: statesFound || 0, total_mps: 543 });
  } catch (e) { res.json({ news_today: 0, states_today: 0, total_mps: 543 }); }
});

app.get('/api/public/ticker', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT headline FROM news_cache WHERE published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY published_at DESC LIMIT 10`
    );
    res.json((rows || []).map((r) => r.headline.substring(0, 80)));
  } catch (e) { res.json([]); }
});

// ── NEWS CACHE TABLE (auto-create if not exists) ──────────────
pool.query(`CREATE TABLE IF NOT EXISTS news_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  headline VARCHAR(500) NOT NULL,
  snippet TEXT,
  source VARCHAR(100),
  url TEXT,
  category VARCHAR(50),
  sentiment ENUM('positive','negative','neutral') DEFAULT 'neutral',
  published_at DATETIME,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  headline_hash VARCHAR(64) UNIQUE,
  INDEX idx_published (published_at),
  INDEX idx_category (category)
) ENGINE=InnoDB`).catch(() => {});


// ═══════════════════════════════════════════════════════════════
// AI INTELLIGENCE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// Grievance AI Triage
app.post('/api/grievances/ai-triage', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const [grievances] = await pool.query(
      "SELECT id, subject, description, category, priority, location, created_at FROM grievances WHERE politician_id = ? AND status = 'Pending' ORDER BY created_at DESC LIMIT 20",
      [polId]
    );
    if (!grievances.length) return res.json({ triage: [], message: 'No pending grievances' });
    
    const prompt = `Triage these pending grievances for an Indian politician. Assign urgency 1-10 and recommended action.
Return ONLY a JSON array: [{"id":N,"urgency":N,"category":"string","action":"string","reason":"string"}]

Grievances:
${grievances.map(g => `ID:${g.id} | ${g.subject} | ${g.location} | ${(g.description||'').slice(0,80)}`).join('\n')}`;
    const result = await aiJSON({ prompt, system: 'You are a political triage system. Return only valid JSON arrays. No markdown.', politicianId: polId, endpoint: 'grievance.triage', maxTokens: 1200 });
    res.json({ triage: Array.isArray(result) ? result : (result.triage || []) });
  } catch (e) { console.error('[grievance-triage]', e.message); res.status(500).json({ error: e.message }); }
});

// Grievance AI Response Draft
app.post('/api/grievances/:id/ai-response', authMiddleware, async (req, res) => {
  try {
    const [[g]] = await pool.query('SELECT * FROM grievances WHERE id = ?', [req.params.id]);
    if (!g) return res.status(404).json({ error: 'Grievance not found' });
    const polId = req.user.role === 'super_admin' ? g.politician_id : req.user.politician_id;
    const [[pol]] = await pool.query('SELECT full_name, designation, constituency_name FROM politician_profiles WHERE id = ?', [polId]);
    
    const prompt = `Draft a compassionate official response to this constituent grievance:

Subject: ${g.subject}
Description: ${g.description || g.subject}
Location: ${g.location || 'Not specified'}
Priority: ${g.priority}
Category: ${g.category}

Response is from: Office of ${pol?.full_name || 'the Politician'}, ${pol?.designation || 'MP/MLA'} of ${pol?.constituency_name || 'the constituency'}

Keep it under 150 words. Acknowledge the issue, empathize, state the action being taken, give a timeline. Professional and compassionate.`;
    const response = await aiComplete({ prompt, system: 'You draft official empathetic grievance responses for Indian politician offices.', politicianId: polId, endpoint: 'grievance.response', maxTokens: 300 });
    res.json({ response });
  } catch (e) { console.error('[grievance-response]', e.message); res.status(500).json({ error: e.message }); }
});

// Opposition AI Analysis
app.post('/api/opposition/ai-analysis', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const [intel] = await pool.query("SELECT opponent_name, activity_type, description, platform, threat_level, detected_at FROM opposition_intelligence WHERE politician_id = ? ORDER BY detected_at DESC LIMIT 15", [polId]);
    const [[pol]] = await pool.query('SELECT full_name, party, constituency_name FROM politician_profiles WHERE id = ?', [polId]);
    
    const prompt = intel.length
      ? `Analyze this opposition intelligence for ${pol?.full_name} (${pol?.party}) from ${pol?.constituency_name}:

${intel.map(i => `[${i.activity_type}] ${i.opponent_name}: ${(i.description||'').slice(0,100)} (threat: ${i.threat_level}/10)`).join('\n')}

Provide:
1. OVERALL THREAT LEVEL (1-10)
2. TOP 3 RISKS this week
3. RECOMMENDED COUNTER-STRATEGY (3 specific actions)
4. KEY OPPONENT TO WATCH`
      : `No opposition intelligence logged yet for ${pol?.full_name}. Provide general advice on monitoring opposition activity in Indian parliamentary politics.`;
    const analysis = await aiComplete({ prompt, system: 'You are a political intelligence analyst specializing in Indian elections.', politicianId: polId, endpoint: 'opposition.analysis', maxTokens: 500 });
    res.json({ analysis });
  } catch (e) { console.error('[opposition-analysis]', e.message); res.status(500).json({ error: e.message }); }
});

// Sentiment AI Summary
app.post('/api/sentiment/ai-summary', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const [scores] = await pool.query("SELECT overall_score, score_date FROM sentiment_scores WHERE politician_id = ? ORDER BY score_date DESC LIMIT 7", [polId]);
    const [media] = await pool.query("SELECT headline, sentiment, source FROM media_mentions WHERE politician_id = ? AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY published_at DESC LIMIT 10", [polId]);
    
    const prompt = `Analyze constituency sentiment:

SCORES (last 7 days): ${scores.map(s => `${s.score_date}: ${s.overall_score}/100`).join(', ') || 'No data yet'}
MEDIA: ${media.map(m => `[${m.sentiment}] ${m.source}: ${m.headline}`).join('\n') || 'No recent media'}

Provide:
1. TREND DIRECTION (improving/stable/declining)
2. KEY CONCERN dragging sentiment
3. OPPORTUNITY to amplify
4. THIS WEEK'S PRIORITY ACTION`;
    const summary = await aiComplete({ prompt, system: 'You analyze political sentiment for Indian politicians.', politicianId: polId, endpoint: 'sentiment.summary', maxTokens: 400 });
    res.json({ summary });
  } catch (e) { console.error('[sentiment-summary]', e.message); res.status(500).json({ error: e.message }); }
});

// Content Factory AI Generate
app.post('/api/content-factory/ai-generate', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const { content_type = 'social_post', context = '', language = 'english' } = req.body;
    const [[pol]] = await pool.query('SELECT full_name, designation, constituency_name, state, party FROM politician_profiles WHERE id = ?', [polId]);
    const [grievances] = await pool.query("SELECT subject, category, location FROM grievances WHERE politician_id = ? ORDER BY created_at DESC LIMIT 3", [polId]);
    
    const typeGuide = {
      social_post: 'Write a punchy social media post (under 280 chars). No hashtag spam.',
      whatsapp_broadcast: 'Write a WhatsApp broadcast message (under 300 chars). Direct and impactful.',
      press_release: 'Write a professional press release (200-300 words). Include headline.',
      speech_excerpt: 'Write a speech excerpt (150-200 words). Emotional, locally relevant.',
      grievance_response: 'Write an official empathetic grievance response (100-150 words).',
    };
    const prompt = `Generate a ${content_type} for ${pol?.full_name}, ${pol?.designation} from ${pol?.constituency_name}, ${pol?.state} (${pol?.party}).
${context ? `TOPIC: ${context}` : `Recent issues: ${grievances.map(g=>g.subject).join(', ')}`}
${language !== 'english' ? `Write in ${language}.` : ''}
${typeGuide[content_type] || typeGuide.social_post}
Generate ONLY the content. No explanations.`;
    const content = await aiComplete({ prompt, system: 'You write political content for Indian politicians.', politicianId: polId, endpoint: `content.${content_type}`, maxTokens: 400 });
    await pool.query('INSERT INTO ai_generated_content (politician_id, content_type, prompt, content, is_saved) VALUES (?,?,?,?,0)', [polId, content_type, (context||'auto').slice(0,200), content]);
    res.json({ content, content_type, label: content_type.replace(/_/g,' ') });
  } catch (e) { console.error('[content-generate]', e.message); res.status(500).json({ error: e.message }); }
});

// Parliamentary AI Question Drafter
app.post('/api/parliamentary/ai-question', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const { topic, ministry = 'relevant ministry', question_type = 'starred' } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });
    const [[pol]] = await pool.query('SELECT full_name, designation, constituency_name, state FROM politician_profiles WHERE id = ?', [polId]);
    
    const prompt = `Draft a ${question_type} parliamentary question for ${pol?.full_name}, ${pol?.designation} from ${pol?.constituency_name}, ${pol?.state}.

TOPIC: ${topic}
MINISTRY: ${ministry}

Format exactly as:
QUESTION TYPE: ${question_type.toUpperCase()}
MINISTRY: ${ministry}

WILL THE MINISTER PLEASE STATE:
(a) [main question - specific and data-seeking]
(b) [follow-up about current status or budget]
(c) [action or timeline question]

Make it specific to ${pol?.constituency_name || pol?.state}. Sharp and politically relevant.`;
    const question = await aiComplete({ prompt, system: 'You draft sharp parliamentary questions for Indian MPs following Lok Sabha/Rajya Sabha formats.', politicianId: polId, endpoint: 'parliamentary.question', maxTokens: 400 });
    res.json({ question });
  } catch (e) { console.error('[parliamentary-question]', e.message); res.status(500).json({ error: e.message }); }
});

// Morning Brief AI Generate (on-demand)
app.post('/api/briefing/ai-generate', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    if (!polId) return res.status(403).json({ error: 'Politician context required' });
    const [[pol]] = await pool.query('SELECT full_name, designation, constituency_name, state, party FROM politician_profiles WHERE id = ?', [polId]);
    const [[griev]] = await pool.query("SELECT COUNT(*) as total, SUM(status='Pending') as pending, SUM(priority='Urgent') as urgent FROM grievances WHERE politician_id = ?", [polId]);
    const [events] = await pool.query("SELECT title, start_date FROM events WHERE politician_id = ? AND start_date >= CURDATE() ORDER BY start_date LIMIT 3", [polId]);
    const [[media]] = await pool.query("SELECT COUNT(*) as mentions, SUM(sentiment='Negative') as negative FROM media_mentions WHERE politician_id = ? AND published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)", [polId]);
    
    const prompt = `Generate a morning intelligence brief for ${pol?.full_name}, ${pol?.designation} from ${pol?.constituency_name}, ${pol?.state} (${pol?.party}).

DATA:
- Grievances: ${griev?.total||0} total, ${griev?.pending||0} pending, ${griev?.urgent||0} urgent
- Events today/upcoming: ${events.map(e=>`${e.title} on ${e.start_date}`).join('; ')||'None'}
- Media (24h): ${media?.mentions||0} mentions, ${media?.negative||0} negative

Write:
**SITUATION**: 2-sentence overall assessment.
**TOP 3 ACTIONS**: Three specific actionable tasks for today.
**WATCH**: One thing that needs monitoring.
**SENTIMENT**: One word — Stable/Caution/Alert.

Direct, political, India-context aware. No fluff.`;
    const brief = await aiComplete({ prompt, system: 'You generate concise political intelligence briefs for Indian politicians.', politicianId: polId, endpoint: 'briefing.generate', maxTokens: 600 });
    const [r] = await pool.query("INSERT INTO ai_briefings (politician_id, title, briefing_type, content, summary, status) VALUES (?,?,?,?,?,'generated')",
      [polId, `Morning Brief — ${new Date().toLocaleDateString('en-IN')}`, 'morning', brief, brief.slice(0,200)]);
    res.json({ brief, id: r.insertId, politician: pol?.full_name });
  } catch (e) { console.error('[briefing-generate]', e.message); res.status(500).json({ error: e.message }); }
});

// Voice Reports AI Summary
app.post('/api/voice/ai-summary', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const [reports] = await pool.query("SELECT reporter_name, classification, transcript, location, created_at FROM voice_reports WHERE politician_id = ? ORDER BY created_at DESC LIMIT 20", [polId]);
    if (!reports.length) return res.json({ summary: 'No voice reports submitted yet.' });
    
    const prompt = `Summarize these field intelligence voice reports:
${reports.map(r=>`[${r.classification}] ${r.reporter_name} from ${r.location||'unknown'}: ${(r.transcript||'').slice(0,120)}`).join('\n')}

Provide:
1. TOP ISSUES REPORTED (top 3 with locations)
2. GEOGRAPHIC HOTSPOTS
3. WORKER MORALE SIGNAL
4. IMMEDIATE ACTION REQUIRED`;
    const summary = await aiComplete({ prompt, system: 'You analyze field intelligence from Indian political workers.', politicianId: polId, endpoint: 'voice.summary', maxTokens: 400 });
    res.json({ summary });
  } catch (e) { console.error('[voice-summary]', e.message); res.status(500).json({ error: e.message }); }
});

// Projects AI Risk Assessment
app.post('/api/projects/ai-risk', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const [projects] = await pool.query("SELECT project_name, status, budget_allocated, budget_spent, progress_percent, expected_completion, mandal FROM projects WHERE politician_id = ? ORDER BY created_at DESC LIMIT 15", [polId]);
    if (!projects.length) return res.json({ high_risk: [], on_track: [], message: 'No projects found' });
    
    const prompt = `Assess risk for these constituency projects. Return JSON:
{"high_risk":[{"name":"...","risk":"...","action":"..."}],"on_track":["name1"],"completion_forecast":"string","budget_alert":"string or null"}

Projects:
${projects.map(p=>`${p.project_name}: ${p.status}, ${p.progress_percent||0}% done, due:${p.expected_completion||'TBD'}`).join('\n')}`;
    const result = await aiJSON({ prompt, system: 'You analyze constituency project risks. Return only valid JSON.', politicianId: polId, endpoint: 'projects.risk', maxTokens: 600 });
    res.json(result);
  } catch (e) { console.error('[projects-risk]', e.message); res.status(500).json({ error: e.message }); }
});

// WhatsApp AI Analysis
app.post('/api/whatsapp/ai-analysis', authMiddleware, async (req, res) => {
  try {
    const polId = req.user.role === 'super_admin' ? (req.body.politician_id || req.user.politician_id) : req.user.politician_id;
    const [messages] = await pool.query("SELECT content, classification, sentiment, urgency_score, is_viral, is_misinformation FROM whatsapp_intelligence WHERE politician_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY urgency_score DESC LIMIT 30", [polId]);
    if (!messages.length) return res.json({ analysis: 'No WhatsApp messages in the last 24 hours.' });
    
    const prompt = `Analyze these WhatsApp messages received in the last 24 hours:
${messages.map(m=>`[${m.classification}, urgency:${m.urgency_score}${m.is_viral?' VIRAL':''}${m.is_misinformation?' MISINFO':''}] ${(m.content||'').slice(0,100)}`).join('\n')}

Provide:
1. DOMINANT CONCERN today
2. MISINFORMATION THREAT (if any — draft counter-narrative)
3. VIRAL CONTENT ACTION
4. RECOMMENDED RESPONSE PRIORITY`;
    const analysis = await aiComplete({ prompt, system: 'You analyze political WhatsApp intelligence for Indian politicians.', politicianId: polId, endpoint: 'whatsapp.analysis', maxTokens: 400 });
    res.json({ analysis });
  } catch (e) { console.error('[whatsapp-analysis]', e.message); res.status(500).json({ error: e.message }); }
});

// AI Debug — test all providers
app.post('/api/ai-debug', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const results = {};
  const tests = [
    { name: 'GROQ',       keys: ['GROQ_API_KEY','GROQ'],       url: 'https://api.groq.com/openai/v1/chat/completions',         model: 'llama-3.3-70b-versatile' },
    { name: 'MISTRAL',    keys: ['MISTRAL_API_KEY','MISTRAL'],  url: 'https://api.mistral.ai/v1/chat/completions',              model: 'mistral-small-latest' },
    { name: 'GEMINI',     keys: ['GEMINI_API_KEY','GEMINI'],    url: null,                                                      model: 'gemini-1.5-flash' },
    { name: 'NVIDIA',     keys: ['NVIDIA_API_KEY','NVIDIA','NVIDIABUILD','NVIDIABUILD-AUTOGEN-17'], url: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.3-70b-instruct' },
    { name: 'OPENROUTER', keys: ['OPENROUTER_API_KEY'],         url: 'https://openrouter.ai/api/v1/chat/completions',          model: 'mistralai/mistral-7b-instruct:free' },
  ];
  for (const p of tests) {
    let key = null;
    for (const kn of p.keys) { key = await getApiKey(kn, {}); if (key) break; }
    if (!key) { results[p.name] = { status: 'NO_KEY' }; continue; }
    try {
      let r;
      if (p.name === 'GEMINI') {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }], generationConfig: { maxOutputTokens: 5 } }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || r.status);
        results[p.name] = { status: 'OK', response: d.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0,20) };
      } else {
        r = await fetch(p.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, ...(p.name==='OPENROUTER'?{'HTTP-Referer':'https://thoughtfirst.in'}:{}) },
          body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || d.message || r.status);
        results[p.name] = { status: 'OK', response: d.choices?.[0]?.message?.content?.slice(0,20) };
      }
    } catch (e) { results[p.name] = { status: 'ERROR', message: e.message?.slice(0,150) }; }
  }
  res.json({ results });
});

// Missing CRUD routes
app.use('/api/whatsapp_intelligence', crud('whatsapp_intelligence', ['sender_phone','classification','content']));
app.use('/api/booths',                crud('booths',                ['booth_number','polling_station_name','mandal']));
app.use('/api/promises',              crud('promises',              ['promise_text','category','status']));

app.listen(PORT, () => {
  console.log(`\n✅ Nethra API running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_HOST}/${process.env.DB_NAME} | AI: Mistral\n`);
});

// ── POLITICIAN AUTO-FILL ─────────────────────────────────────
// Uses Gemini to search public data and return structured politician profile
app.post('/api/politician-autofill', authMiddleware, async (req, res) => {
  const { name, type = 'MP' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const orKeyAutofill = await getApiKey('OPENROUTER_API_KEY', { endpoint: 'politician.autofill' });
  const geminiKey = await getApiKey('GEMINI_API_KEY', { endpoint: 'politician.autofill' });
  const mistralKeyFirst = await getApiKey('MISTRAL_API_KEY', { endpoint: 'politician.autofill' });
  const anthropicKeyFirst = await getApiKey('ANTHROPIC_API_KEY', { endpoint: 'politician.autofill' });
  const openaiKeyFirst = await getApiKey('OPENAI_API_KEY', { endpoint: 'politician.autofill' });
  if (!orKeyAutofill && !geminiKey && !mistralKeyFirst && !anthropicKeyFirst && !openaiKeyFirst) {
    return res.status(500).json({ error: 'No AI key configured. Add OPENROUTER_API_KEY or MISTRAL_API_KEY in Super Admin API Keys.' });
  }

  const prompt = `You are a political data researcher for India. Search your knowledge and return detailed information about the Indian politician: "${name}" (${type}).

Return ONLY a valid JSON object with NO markdown, NO backticks, NO explanation. Just raw JSON.

Required format:
{
  "full_name": "complete official name",
  "display_name": "commonly known name",
  "party": "party abbreviation e.g. TDP, BJP, INC, YSRCP",
  "designation": "Member of Parliament or Member of Legislative Assembly",
  "constituency_name": "exact constituency name",
  "state": "state name",
  "lok_sabha_seat": "seat name if MP",
  "bio": "2-3 sentence biography",
  "education": "educational qualifications",
  "age": null,
  "languages": ["Telugu", "English"],
  "achievements": ["achievement 1", "achievement 2"],
  "election_year": 2024,
  "previous_terms": 0,
  "winning_margin": null,
  "vote_count": null,
  "total_votes_polled": null,
  "constituency_stats": {
    "total_voters": null,
    "registered_voters": null,
    "area_sqkm": null,
    "population": null,
    "total_mandals": null,
    "total_villages": null,
    "total_booths": null,
    "literacy_rate": null,
    "sex_ratio": null
  },
  "twitter_handle": "",
  "website": "",
  "confidence": "high or medium or low"
}

If you do not know a specific numeric value use null. If you do not recognize this politician at all return {"error": "Politician not found in knowledge base"}.`;

  try {
    let text = '';
    // Try providers: OpenRouter → Grok → Gemini → Anthropic → OpenAI
    if (orKeyAutofill) {
      const orModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orKeyAutofill}`,
          'HTTP-Referer': 'https://thoughtfirst.in',
          'X-Title': 'ThoughtFirst Political Intelligence',
        },
        body: JSON.stringify({ model: orModel, messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.1 }),
      });
      if (!r.ok) throw new Error(`OpenRouter error: ${r.status}: ${await r.text()}`);
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';
    } else if (mistralKeyFirst) {
      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${'6z87gOvz3u4TTVmLqTIUbP3QoL2c7GOT'}` },
        body: JSON.stringify({ model: process.env.MISTRAL_MODEL || 'mistral-large-latest', messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.1 }),
      });
      if (!r.ok) throw new Error(`Mistral error: ${r.status}: ${await r.text()}`);
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';
    } else if (geminiKey) {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1500, temperature: 0.1 } }),
      });
      if (!r.ok) throw new Error(`Gemini error: ${r.status}: ${await r.text()}`);
      const d = await r.json();
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (anthropicKeyFirst) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKeyFirst, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!r.ok) throw new Error(`Anthropic error: ${r.status}`);
      const d = await r.json();
      text = d.content?.[0]?.text || '';
    } else if (openaiKeyFirst) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKeyFirst}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.1 }),
      });
      if (!r.ok) throw new Error(`OpenAI error: ${r.status}`);
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || '';
    }
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    if (parsed.error) return res.status(404).json({ error: parsed.error });

    res.json(parsed);
  } catch (err) {
    console.error('[politician-autofill]', err);
    res.status(500).json({ error: 'Failed to fetch politician data: ' + err.message });
  }
});

// ── CHANGE PASSWORD ───────────────────────────────────────────
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── STATE-WIDE DEPLOYMENT ENDPOINTS ─────────────────────────────

// Get all politicians in a state
app.get('/api/state/:state/politicians', authMiddleware, async (req, res) => {
  try {
    const { state } = req.params;
    const [politicians] = await pool.query(
      'SELECT id, full_name, party, designation, constituency_name, district, photo_url, is_active FROM politician_profiles WHERE state = ? AND is_active = 1 ORDER BY district, constituency_name',
      [state]
    );
    res.json(politicians);
  } catch (error) {
    console.error('[state-politicians]', error);
    res.status(500).json({ error: 'Failed to fetch state politicians' });
  }
});

// Simple state dashboard (minimal version for testing)
app.get('/api/state/:state/dashboard', authMiddleware, async (req, res) => {
  try {
    const { state } = req.params;
    res.json({ 
      state: state,
      message: "State dashboard endpoint working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[state-dashboard]', error);
    res.status(500).json({ error: 'Failed to fetch state dashboard' });
  }
});

// AI Provider Calling Function

// AI Provider Calling Function
async function callProvider(provider, apiKey, systemPrompt, messages, maxTokens = 1500, temperature = 0.7, stream = false) {
  console.log('[ai] Calling provider:', provider);
  
  try {
    switch (provider.toLowerCase()) {
      case 'mistral':
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            stream: false
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[ai] ${provider} call failed:`, error.message);
    throw error;
  }
}



