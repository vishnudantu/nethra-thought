/**
 * Designation-Based Module Registry
 * Single source of truth for module visibility
 * 
 * Usage: 
 *   const { resolveModules, MODULE_REGISTRY, SIDEBAR_GROUPS } = await import('../config/moduleRegistry.js');
 *   const modules = resolveModules('mla', 'state_minister');
 */

// ═══════════════════════════════════════════════════════════════
// MODULE REGISTRY
// Each module defines which roles can access it
// ═══════════════════════════════════════════════════════════════

export const MODULE_REGISTRY = {
  // ── CORE MODULES ─────────────────────────────────────────────
  dashboard:              { roles: ['all'] },
  morning_brief:          { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor', 'district_president'] },
  grievances:             { roles: ['all'] },
  appointments:           { roles: ['all'] },
  events:                 { roles: ['all'] },
  
  // ── POLITICAL MODULES ────────────────────────────────────────
  constituency:           { roles: ['mp_lok_sabha', 'mla', 'mlc', 'mayor', 'councillor'] },
  voter_database:         { roles: ['mp_lok_sabha', 'mla', 'mayor', 'councillor', 'district_president', 'party_worker'] },
  booth_management:       { roles: ['mp_lok_sabha', 'mla', 'district_president', 'party_worker'] },
  polls_surveys:          { roles: ['mp_lok_sabha', 'mla', 'mlc', 'mayor', 'councillor', 'district_president'] },
  party_integration:      { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'district_president', 'party_worker'] },
  coalition_forecast:     { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'district_president'] },
  election_war_room:      { roles: ['mp_lok_sabha', 'mla', 'mayor', 'councillor', 'district_president', 'party_worker'] },
  
  // ── LEGISLATIVE MODULES ─────────────────────────────────────
  parliamentary:          { roles: ['mp_lok_sabha', 'mp_rajya_sabha'] },
  legislative:            { roles: ['mla', 'mlc'] },
  mplads:                 { roles: ['mp_lok_sabha', 'mp_rajya_sabha'] },
  projects:               { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mayor'] },
  promises_tracker:       { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor'] },
  financial_compliance:   { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor', 'councillor'] },
  
  // ── CONSTITUENCY MODULES ────────────────────────────────────
  citizen_services:       { roles: ['mp_lok_sabha', 'mla', 'mayor', 'councillor'] },
  smart_visit_planner:    { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor', 'district_president'] },
  darshan_management:     { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc'] },
  
  // ── INTELLIGENCE MODULES ────────────────────────────────────
  sentiment_dashboard:    { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor', 'district_president'] },
  opposition_tracker:     { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'district_president'] },
  media_intelligence:     { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor', 'district_president'] },
  relationship_graph:     { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'district_president'] },
  crisis_war_room:        { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor', 'district_president', 'party_worker'] },
  predictive_crisis:      { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'district_president'] },
  
  // ── COMMUNICATION MODULES ───────────────────────────────────
  content_factory:        { roles: ['all'] },
  whatsapp_intelligence:  { roles: ['all'] },
  voice_intelligence:     { roles: ['all'] },
  
  // ── ADVANCED MODULES ────────────────────────────────────────
  agent_system:           { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'mlc', 'mayor'] },
  digital_twin:           { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'district_president'] },
  deepfake_shield:        { roles: ['mp_lok_sabha', 'mp_rajya_sabha', 'mla', 'district_president'] },
  
  // ── MINISTER MODULES (secondary_role only) ─────────────────
  ministry_dashboard:     { roles: [], secondary_roles: ['central_minister', 'state_minister', 'cm', 'deputy_cm'] },
  ministry_portfolio:     { roles: [], secondary_roles: ['central_minister', 'state_minister', 'cm', 'deputy_cm'] },
  policy_tracker:         { roles: [], secondary_roles: ['central_minister', 'state_minister', 'cm', 'deputy_cm'] },
  budget_schemes:         { roles: [], secondary_roles: ['central_minister', 'state_minister', 'cm', 'deputy_cm'] },
  department_intelligence:{ roles: [], secondary_roles: ['central_minister', 'state_minister', 'cm', 'deputy_cm'] },
};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR GROUPS
// Groups only render if at least one module in them is active
// ═══════════════════════════════════════════════════════════════

export const SIDEBAR_GROUPS = [
  {
    group: 'CORE',
    label: 'Core',
    items: ['dashboard', 'morning_brief', 'grievances', 'appointments', 'events']
  },
  {
    group: 'POLITICAL',
    label: 'Political',
    items: ['voter_database', 'polls_surveys', 'booth_management', 'party_integration', 'coalition_forecast', 'election_war_room']
  },
  {
    group: 'LEGISLATIVE',
    label: 'Legislative',
    items: ['parliamentary', 'legislative', 'mplads', 'projects', 'promises_tracker', 'financial_compliance']
  },
  {
    group: 'CONSTITUENCY',
    label: 'Constituency',
    items: ['constituency', 'citizen_services', 'smart_visit_planner', 'darshan_management']
  },
  {
    group: 'INTELLIGENCE',
    label: 'Intelligence',
    items: ['sentiment_dashboard', 'opposition_tracker', 'media_intelligence', 'relationship_graph', 'crisis_war_room', 'predictive_crisis']
  },
  {
    group: 'COMMUNICATIONS',
    label: 'Communications',
    items: ['content_factory', 'whatsapp_intelligence', 'voice_intelligence']
  },
  {
    group: 'MINISTRY',
    label: 'Ministry',
    items: ['ministry_dashboard', 'ministry_portfolio', 'policy_tracker', 'budget_schemes', 'department_intelligence']
  },
  {
    group: 'ADVANCED',
    label: 'Advanced',
    items: ['agent_system', 'digital_twin', 'deepfake_shield']
  }
];

// ═══════════════════════════════════════════════════════════════
// RESOLVE MODULES FUNCTION
// Returns array of module keys user has access to
// ═══════════════════════════════════════════════════════════════

export function resolveModules(primaryRole, secondaryRole = 'none') {
  const activeModules = [];
  
  for (const [moduleKey, config] of Object.entries(MODULE_REGISTRY)) {
    const roleMatch = config.roles.includes('all') || config.roles.includes(primaryRole);
    const secondaryMatch = config.secondary_roles?.includes(secondaryRole);
    
    if (roleMatch || secondaryMatch) {
      activeModules.push(moduleKey);
    }
  }
  
  return activeModules;
}

// ═══════════════════════════════════════════════════════════════
// DESIGNATION LABEL HELPER
// Returns human-readable designation string
// ═══════════════════════════════════════════════════════════════

export function getDesignationLabel(primaryRole, secondaryRole = 'none', portfolio = null) {
  const primaryLabels = {
    'mp_lok_sabha':      'MP (Lok Sabha)',
    'mp_rajya_sabha':    'MP (Rajya Sabha)',
    'mla':               'MLA',
    'mlc':               'MLC',
    'mayor':             'Mayor',
    'councillor':        'Councillor',
    'district_president':'District President',
    'party_worker':      'Party Worker',
    'other':             'Other'
  };
  
  const secondaryLabels = {
    'central_minister':  'Union Minister',
    'state_minister':    'Cabinet Minister',
    'cm':                'Chief Minister',
    'deputy_cm':         'Deputy CM',
    'speaker':           'Speaker',
    'deputy_speaker':    'Deputy Speaker'
  };
  
  let label = primaryLabels[primaryRole] || primaryRole;
  
  if (secondaryRole && secondaryRole !== 'none') {
    label += ` · ${secondaryLabels[secondaryRole]}`;
  }
  
  if (portfolio) {
    label += ` (${portfolio})`;
  }
  
  return label;
}

export default { MODULE_REGISTRY, SIDEBAR_GROUPS, resolveModules, getDesignationLabel };
