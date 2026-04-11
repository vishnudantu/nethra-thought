# ThoughtFirst / Nethra — Complete Antigravity Build Handoff

**Date:** April 2026  
**Repo:** https://github.com/vishnudantu/nethra-thought  
**Live:** https://thoughtfirst.in  
**Server:** root@47.82.211.183

---

## 1. WHAT THIS PRODUCT IS

A full-stack political management SaaS for Indian politicians. Each politician gets a private command centre. A super admin (the founder) deploys and manages all accounts.

**Core value:** AI is the engine for everything — grievance triage, constituency briefings, content generation, opposition analysis, WhatsApp intelligence, sentiment tracking. No module should be a static CRUD form. Every module must have an AI layer.

**Current paying use case:** Tirupati Darshan booking management for TDP politicians in Andhra Pradesh.

---

## 2. TECH STACK — READ BEFORE TOUCHING ANYTHING

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Single page app — routing is **React state** (`activePage`), NOT URL-based
- Auth token in `localStorage` key `nethra_token`

### Backend
- Node.js + Express — **ES Modules only** (`"type":"module"` in package.json)
- **NEVER use `require()`** — all imports must be `import`
- MariaDB via `mysql2` pool
- PM2 on port 3002
- Nginx reverse proxy → 443

### Files NEVER to modify
```
server/auth.js
server/db.js  
server/queues.js
server/services/secretStore.js
package.json → the "type":"module" field
.env
```

### DB pattern — always use this
```js
// In route handlers:
const pool = req.app.locals.pool;
// NOT: import pool from './db.js' inside route files
```

### Auth pattern
```js
// Frontend
const token = session?.access_token || localStorage.getItem('nethra_token') || '';

// Backend
// req.user = { id, email, role, politician_id }
// Super admin check:
const polId = req.user.role === 'super_admin' 
  ? (req.body.politician_id || req.user.politician_id) 
  : req.user.politician_id;
```

### AI pattern — use this for every AI feature
```js
import { aiComplete, aiJSON, aiStream, aiChat } from './services/ai.js';

// Simple text response
const result = await aiComplete({ 
  prompt, system, politicianId, endpoint: 'module.action', maxTokens: 500 
});

// JSON response  
const data = await aiJSON({ prompt, system, politicianId, endpoint, maxTokens: 800 });

// Streaming (for chat)
await aiStream({ messages, system, politicianId, endpoint, res });
```

Provider chain (auto-fallback): Groq → Gemini → Mistral → OpenRouter → Nvidia

### Deploy command
```bash
cd /var/www/thoughtfirst-api && git pull origin main && npm run build && cp -r dist/. /var/www/thoughtfirst-frontend/ && pm2 restart thoughtfirst-api --update-env
```

---

## 3. DESIGNATION-BASED SYSTEM RULES

**This is the most important business logic rule.**

When a politician is deployed, their designation determines which modules and fields appear. The system must auto-configure based on designation.

### Designation Types and Their Module Rules

| Designation | MPLADS | Assembly Questions | Lok Sabha | Rajya Sabha | State Assembly | Municipal |
|---|---|---|---|---|---|---|
| MP (Lok Sabha) | ✅ 5Cr/year | ✅ Starred/Unstarred | ✅ | ❌ | ❌ | ❌ |
| MP (Rajya Sabha) | ✅ 5Cr/year | ✅ Starred/Unstarred | ❌ | ✅ | ❌ | ❌ |
| MLA | ❌ (MLALADS/LADS varies by state) | ❌ | ❌ | ❌ | ✅ | ❌ |
| MLC | ❌ | ✅ State Council | ❌ | ❌ | ✅ | ❌ |
| Mayor | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Councillor | ❌ | ❌ | ❌ | ❌ | ❌ ✅ |
| State Party President | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (party ops only) |

### Implementation Required

In `server/index.js`, when deploying a politician via `POST /api/founder/politicians`, auto-configure modules:

```js
const DESIGNATION_MODULES = {
  'mp_lok_sabha': ['dashboard','grievances','events','appointments','voters','projects',
    'media','darshan','parliamentary','mplads','legislative','voice-intelligence',
    'morning-brief','sentiment','opposition','content-factory','ai-studio',
    'omni-scan','whatsapp-intel','citizen-engagement','smart-visit-planner'],
  'mp_rajya_sabha': ['dashboard','grievances','events','appointments','voters','projects',
    'media','darshan','parliamentary','mplads','legislative','voice-intelligence',
    'morning-brief','sentiment','opposition','content-factory','ai-studio'],
  'mla': ['dashboard','grievances','events','appointments','voters','projects',
    'media','darshan','legislative','voice-intelligence','morning-brief',
    'sentiment','opposition','content-factory','ai-studio','booth-management',
    'election-command','omni-scan','whatsapp-intel','citizen-engagement'],
  'mlc': ['dashboard','grievances','events','appointments','voters','projects',
    'media','legislative','voice-intelligence','morning-brief','sentiment',
    'opposition','content-factory','ai-studio'],
  'mayor': ['dashboard','grievances','events','appointments','voters','projects',
    'media','voice-intelligence','morning-brief','sentiment','content-factory',
    'citizen-engagement','citizen-services'],
  'councillor': ['dashboard','grievances','events','appointments','voters',
    'media','morning-brief','content-factory','citizen-services'],
  'state_president': ['dashboard','grievances','events','appointments',
    'media','morning-brief','sentiment','opposition','content-factory',
    'coalition-forecast','party-integration','ai-studio'],
};
```

The Finance module shows MPLADS fields only for MPs. For MLAs show state-specific development funds.

---

## 4. MODULE STATUS — WHAT WORKS, WHAT NEEDS BUILDING

### ✅ WORKING (keep as-is, minor polish only)
| Module | Status | Notes |
|---|---|---|
| Login / Auth | Working | JWT, 2FA, role-based |
| Super Admin Dashboard | Working | 11 politicians, metrics, photo upload |
| Politician Profile | Working | Full edit, photo upload |
| Grievances | Working | CRUD, AI triage endpoint exists |
| Darshan (Tirupati) | Working | 3-col form, Aadhaar validation, election fields |
| Events | Working | CRUD |
| Appointments | Working | CRUD |
| Dashboard | Working | Metrics, live data |
| Settings | Working | AI model switcher |
| AI Model Switcher | Working | 5 providers, 22 languages |

### 🔧 NEEDS AI LAYER (API exists, UI needs AI wired in)
| Module | What to build |
|---|---|
| Grievances | Wire `/api/grievances/ai-triage` button in UI. Wire `/api/grievances/:id/ai-response` per grievance. |
| Morning Brief | Wire `/api/briefing/ai-generate` — show generated brief, refresh button |
| Content Factory | Wire `/api/content-factory/ai-generate` — all 5 types, language selector |
| Sentiment Dashboard | Wire `/api/sentiment/ai-summary` — show trend analysis |
| Opposition Tracker | Wire `/api/opposition/ai-analysis` — threat assessment panel |
| WhatsApp Intel | Wire `/api/whatsapp/ai-analysis` — 24h batch analysis panel |
| Projects | Wire `/api/projects/ai-risk` — risk assessment per project |
| Voice Intelligence | Wire `/api/voice/ai-summary` — field report synthesis |
| Parliamentary | Wire `/api/parliamentary/ai-question` — question drafter |

### 🔴 NEEDS FULL BUILD (stubs or dead)
These modules exist as minimal CrudPage wrappers with no real functionality:

#### OmniScan (HIGH PRIORITY)
**What it should do:** Automated intelligence scan — scrapes news, social media, opposition activities for the politician's constituency. Runs on schedule or on-demand.  
**Current state:** Has `POST /api/omniscan/trigger` endpoint and queue system but UI does nothing visible.  
**Build:** Dashboard showing last scan results — news mentions, social signals, threat alerts, sentiment spikes. Run now button. Auto-runs every 6 hours.  
**AI layer:** After scan, AI summarizes: "3 concerning signals in your constituency this week" with recommended actions.

#### MPLADS / Development Funds (HIGH PRIORITY for MPs)
**What it should do:** Track ₹5Cr annual MPLADS allocation — sanctioned works, utilization, pending recommendations.  
**Current state:** Does not exist.  
**Build:** Fund tracker with works list, district-wise allocation, utilization bar, pending recommendations, upcoming deadlines.  
**AI layer:** AI suggests which works to prioritize based on constituency needs and electoral calendar.  
**ONLY show for:** `mp_lok_sabha` and `mp_rajya_sabha` designations.

#### Smart Visit Planner (HIGH PRIORITY)
**What it should do:** AI recommends which mandals/villages to visit next based on grievance density, sentiment scores, last visit date, and electoral proximity.  
**Current state:** Basic CrudPage stub.  
**Build:** Map view with mandals colored by priority score. AI generates visit plan: "Visit Kuppam Mandal this week — 12 pending grievances, sentiment down 8 points, last visited 3 months ago."  
**AI layer:** Full AI-driven visit schedule with reasoning per location.

#### Booth Management (HIGH PRIORITY for MLAs)
**What it should do:** Constituency divided into polling booths — track booth agent, voter count, turnout history, sentiment per booth.  
**Current state:** Basic CrudPage.  
**Build:** Booth grid view, booth detail with voter composition, agent contact, historical turnout chart, vulnerable booth alerts.  
**AI layer:** AI identifies weak booths: "Booth 47 lost 340 votes since 2019 — recommend immediate karyakarta deployment."

#### Voter Database
**What it should do:** Searchable voter list with tags — party supporter, fence-sitter, opposition, influenced. Import from CSV.  
**Current state:** Has basic CRUD but no intelligence layer.  
**Build:** Search with filters (mandal, booth, tag, age group), bulk import, voter profile with interaction history.  
**AI layer:** AI segments voters and recommends outreach: "Focus on 2,400 fence-sitters in Kuppam Mandal."

#### WhatsApp Intelligence
**What it should do:** Monitor incoming WhatsApp messages from constituents and party workers — classify urgency, detect misinformation, flag viral content.  
**Current state:** Has schema and API but UI shows empty CRUD.  
**Build:** Message feed with urgency tags, viral alert banner, misinformation counter-narrative generator.  
**AI layer:** Wire `/api/whatsapp/ai-analysis` — show 24h intel summary prominently.

#### Voice Intelligence
**What it should do:** Field workers submit voice reports via WhatsApp/app → transcribed → classified → fed to morning brief.  
**Current state:** Has basic form.  
**Build:** Voice recorder in browser, transcription display, field report feed by location, karyakarta activity tracker.  
**AI layer:** Wire `/api/voice/ai-summary` — synthesize field reports into actionable intelligence.

#### Promises Tracker
**What it should do:** Track every public promise made by the politician — location, date, deadline, completion status, media coverage.  
**Current state:** Basic CrudPage.  
**Build:** Timeline view, completion percentage, overdue alerts, media verification links.  
**AI layer:** AI drafts update announcements when promise is completed: "Generate press release: Road from Kuppam to Gudupalle completed 3 months ahead of deadline."

#### Parliamentary Module (MPs only)
**What it should do:** Track parliamentary questions asked, bills introduced, committee memberships, attendance, speeches.  
**Current state:** Large file (790 lines) but many stubs inside.  
**Build:** Question tracker with AI drafter, bill tracking, attendance record, Lok Sabha/Rajya Sabha session calendar.  
**AI layer:** Wire `/api/parliamentary/ai-question` — generate starred/unstarred questions based on constituency issues.

#### Legislative Module (MLAs only)  
**What it should do:** Same as Parliamentary but for State Assembly — questions, bills, committee work, session attendance.  
**Current state:** Has basic structure but needs AI.  
**Build:** Mirror Parliamentary but for state assembly. Questions in Telugu/English.

#### Election Command Center
**What it should do:** On election day — booth-level turnout monitoring, issue reporting, agent communication, real-time vote tracking.  
**Current state:** Basic CrudPage stub.  
**Build:** Live dashboard with booth grid, turnout %, issue feed, agent status.  
**AI layer:** AI identifies problem booths in real-time and recommends interventions.

#### Predictive Crisis
**What it should do:** AI scans signals (media, WhatsApp, grievances, sentiment) to predict political crises 7-14 days before they happen.  
**Current state:** Basic CrudPage stub.  
**Build:** Alert feed with probability scores, trigger signals listed, recommended actions.  
**AI layer:** Full AI — this IS the AI, no non-AI version exists.

#### Relationship Graph
**What it should do:** Map key political relationships — allies, opponents, influencers, journalists, bureaucrats — with strength and alignment scores.  
**Current state:** Basic CrudPage stub.  
**Build:** Network visualization (D3 or similar), relationship cards with last contact date, influence score.  
**AI layer:** AI recommends relationship actions: "Haven't contacted District Collector in 45 days — 3 pending works require their signature."

#### Coalition Forecast
**What it should do:** Model election outcome scenarios — alliance options, seat projections, swing analysis.  
**Current state:** Has 5 API calls but unclear what they do.  
**Build:** Scenario builder — pick alliance partners, see projected seat count. Historical comparison.  
**AI layer:** AI-driven scenario analysis: "Alliance with Party X adds 23K votes from Rayalaseema but risks losing 8K TDP base voters."

#### Digital Twin
**What it should do:** AI persona simulation — test how constituency will react to a policy announcement before making it.  
**Current state:** Basic CrudPage stub.  
**Build:** Scenario input form → AI simulates 5 voter segment reactions → shows approval/rejection breakdown.  
**AI layer:** This IS AI-only — feeds constituency data into simulation.

#### Economic Intelligence
**What it should do:** Track key economic indicators for the constituency — employment, crop prices, factory output, infrastructure spend.  
**Current state:** Basic CrudPage stub.  
**Build:** Indicator dashboard with charts, mandal-level breakdown, stress alerts.  
**AI layer:** AI flags economic stress: "Groundnut prices down 18% in Kuppam — farmer distress likely, recommend intervention before harvest."

#### Communication / Letter Factory
**What it should do:** AI-drafted official letters, press releases, speeches, WhatsApp broadcasts in multiple languages.  
**Current state:** Has basic form.  
**Build:** Template system — select type (grievance response, press release, speech, WhatsApp), enter context, AI generates in chosen language.  
**AI layer:** Wire `/api/content-factory/ai-generate` with all 5 types. Wire `/api/grievances/:id/ai-response` for auto-drafting grievance responses.

---

## 5. AI ENDPOINTS ALREADY BUILT (use these)

All in `server/index.js`. All require `authMiddleware`. All respect politician context.

```
POST /api/grievances/ai-triage          → rank pending grievances by urgency
POST /api/grievances/:id/ai-response    → draft official response letter
POST /api/opposition/ai-analysis        → threat analysis + counter-strategy
POST /api/sentiment/ai-summary          → trend direction + recommendations
POST /api/content-factory/ai-generate   → 5 content types, any language
POST /api/parliamentary/ai-question     → starred/unstarred question drafter
POST /api/briefing/ai-generate          → on-demand morning brief
POST /api/voice/ai-summary              → field intelligence synthesis
POST /api/projects/ai-risk              → project risk assessment
POST /api/whatsapp/ai-analysis          → 24h batch WhatsApp analysis
POST /api/ai-assistant                  → streaming chat (all providers)
POST /api/ai-debug                      → test all AI providers (super_admin only)
```

Body for all: `{ politician_id: number }` (super admin) or empty (auto-uses logged-in politician).

---

## 6. DATABASE SCHEMA REFERENCE

Main tables (all in `/database/nethra_mysql_schema.sql`):

```
users                    → auth, roles, politician_id FK
politician_profiles      → full politician data, designation, metrics
grievances               → constituent complaints
events                   → calendar events  
appointments             → meetings
voters                   → voter database
projects                 → constituency projects + MPLADS
media_mentions           → press coverage
sentiment_scores         → daily sentiment 0-100
ai_briefings             → morning briefs (generated)
opposition_intelligence  → opponent activity tracking
voice_reports            → karyakarta field reports
whatsapp_intelligence    → WhatsApp message intelligence
parliamentary_questions  → MP/MLA questions in legislature
darshan_bookings         → Tirupati darshan bookings
darshan_pilgrims         → individual pilgrim records (with election fields)
darshan_daily_quota      → 6 pilgrims/day per politician
platform_settings        → AI provider/model/language preferences
politician_module_access → which modules each politician can see
feature_modules          → module registry
```

Designation stored as: `mp_lok_sabha`, `mp_rajya_sabha`, `mla`, `mlc`, `mayor`, `councillor`, `state_president`

---

## 7. DEMO ACCOUNTS

All politicians: **Demo@1234**  
Super Admin: **Admin@1234**

| Email | Role | Politician | Region |
|---|---|---|---|
| admin@thoughtfirst.in | super_admin | Platform Admin | — |
| cbn@tdp.com | politician_admin | N. Chandrababu Naidu (CM, Kuppam) | Rayalaseema |
| balakrishna@tdp.com | politician_admin | Nandamuri Balakrishna (Hindupur) | Rayalaseema |
| lokesh@tdp.com | politician_admin | Nara Lokesh (Mangalagiri) | Coastal Andhra |
| nimmala@tdp.com | politician_admin | Dr. Nimmala Ramanaidu (Palacole) | Coastal Andhra |
| kolusu@tdp.com | politician_admin | Kolusu Partha Sarathy (Nuzvid) | Coastal Andhra |
| kondababu@tdp.com | politician_admin | Kondababu (Kakinada City) | Coastal Andhra |
| harish@tdp.com | politician_admin | G.M. Harish Balayogi (Amalapuram MP) | Coastal Andhra |
| ganta@tdp.com | politician_admin | Ganta Srinivasa Rao (Bhimli) | North Andhra |
| aditi@tdp.com | politician_admin | Aditi Vijayalakshmi (Vizianagaram) | North Andhra |
| rammohan@tdp.com | politician_admin | Kinjarapu Rammohan Naidu (Srikakulam MP) | North Andhra |
| kimidi@tdp.com | politician_admin | Kimidi Kala Venkata Rao (Cheepurupalle) | North Andhra |
| sathish@sana.com | politician_admin | Sana Sathish Babu (Kakinada, ex-MP) | Coastal Andhra |

---

## 8. BUILD PRIORITY ORDER

### Sprint 1 — Fix Broken, Wire AI (Week 1)
1. Wire all 10 AI endpoints into their respective module UIs
2. Fix OmniScan — make trigger button work, show results
3. Designation-based module auto-configuration on deploy
4. Morning Brief — auto-generate on login, show with refresh
5. Fix Parliamentary 404 (rename endpoint)

### Sprint 2 — Core Intelligence Modules (Week 2)
6. MPLADS module (MPs only) — fund tracker + AI prioritization
7. Booth Management — real booth grid with AI weak-booth detection
8. Smart Visit Planner — AI-driven itinerary
9. Voter Database — search, filters, AI segmentation
10. Promises Tracker — timeline + AI announcement drafter

### Sprint 3 — Advanced Intelligence (Week 3)
11. WhatsApp Intelligence — full message feed, AI analysis wired
12. Voice Intelligence — recorder, transcription, field report feed
13. Predictive Crisis — full AI alert system
14. Relationship Graph — network viz + AI recommendations
15. Communication/Letter Factory — full template system

### Sprint 4 — Election Readiness (Week 4)
16. Election Command Center — live booth dashboard
17. Coalition Forecast — scenario builder
18. Digital Twin — voter sentiment simulation
19. Economic Intelligence — indicator dashboard
20. Billing/Subscription system for Super Admin

---

## 9. ENVIRONMENT VARIABLES (.env — never commit)

```
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=thoughtfirst
DB_PASSWORD=Q4Mz2s7Y[bAs777
DB_NAME=thoughtfirst
JWT_SECRET=9794beea0a4885cc65f24b97d93a9755d2a53ba17dfec889536c87a882d9cea3
API_KEYS_MASTER_KEY=f79c335be7d567810fa16f7fa6ac749cd1fe4ceb42841fd16ff1ea4a7442ca68
NODE_ENV=production
MISTRAL_API_KEY=6z87gOvz3u4TTVmLqTIUbP3QoL2c7GOT
FRONTEND_URL=https://thoughtfirst.in
```

API keys (AI providers) are stored in the DB via Super Admin → API Keys panel. Not in .env.

---

## 10. KEY ARCHITECTURAL DECISIONS TO PRESERVE

**1. Every module must have a working AI button.** No module should be a static list without AI.

**2. Language-first.** Every AI output respects the `ai_language` setting saved in `platform_settings`. When a politician sets Telugu, all AI responses come in Telugu — grievance responses, briefings, content, everything.

**3. Politician context propagation.** Super admin can switch between politicians. Every API call must check `req.user.role === 'super_admin'` and use `politician_id` from the request body when it is.

**4. Service imports are async.** All optional services (briefing, whatsapp, sentiment etc.) load asynchronously at startup. This ensures login never fails even if a service has a bug.

**5. Photo uploads go to `/var/www/thoughtfirst-frontend/uploads/`** — served as static files by Nginx. No S3, no Cloudinary.

**6. Module access is per-politician.** The `politician_module_access` table controls what each politician sees. Super admin can enable/disable modules per account via Access Control tab.

---

## 11. WHAT "AI IS THE CORE" MEANS IN PRACTICE

For every module, the AI should:

1. **Proactively brief** — on page load, run a quick AI analysis and show it at the top. Don't make the user click to ask for it.

2. **Suggest the next action** — after showing data, AI says "3 urgent grievances from Kuppam Mandal — click to draft responses."

3. **Generate in the politician's language** — if language is Telugu, all AI text comes in Telugu. Override per-session if needed.

4. **Use real constituency data** — AI prompts should include actual grievances, sentiment scores, recent events, opposition intel. Not generic political advice.

5. **Remember context** — the `ai_briefings` table stores generated briefs. The system should build on previous context, not start fresh every time.

The AI assistant chat (`/api/ai-assistant`) is already fully streaming. Use this for the conversational layer in every module.
