/**
 * Designation-Based Module Configuration
 * Automatically enables/disables modules based on politician's designation
 */

export const DESIGNATION_MODULES = {
  // ── CENTRAL GOVERNMENT ──────────────────────────────────────
  'prime_minister': {
    label: 'Prime Minister',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'parliamentary','legislative','morning-brief','sentiment','opposition','content-factory',
      'ai-studio','omni-scan','whatsapp-intel','voice-intelligence','citizen-engagement',
      'relationship-graph','coalition-forecast','economic-intelligence','digital-twin',
      'predictive-crisis','election-command','party-integration','deepfake-shield'],
    special: ['pmo-integration','national-security','cabinet-tracking']
  },
  
  'mp_lok_sabha': {
    label: 'MP (Lok Sabha)',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'darshan','parliamentary','mplads','legislative','voice-intelligence','morning-brief',
      'sentiment','opposition','content-factory','ai-studio','omni-scan','whatsapp-intel',
      'citizen-engagement','smart-visit-planner','promises-tracker'],
    special: ['mplads','lok-sabha-questions','parliamentary-committees']
  },
  
  'mp_rajya_sabha': {
    label: 'MP (Rajya Sabha)',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'darshan','parliamentary','mplads','legislative','voice-intelligence','morning-brief',
      'sentiment','opposition','content-factory','ai-studio','omni-scan','whatsapp-intel',
      'citizen-engagement','smart-visit-planner','promises-tracker'],
    special: ['mplads','rajya-sabha-questions','parliamentary-committees']
  },
  
  'cabinet_minister_central': {
    label: 'Union Cabinet Minister',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'parliamentary','legislative','morning-brief','sentiment','opposition','content-factory',
      'ai-studio','omni-scan','whatsapp-intel','voice-intelligence','citizen-engagement',
      'relationship-graph','economic-intelligence','ministry-tracking','scheme-monitoring'],
    special: ['ministry-dashboard','cabinet-decisions','central-schemes']
  },
  
  'minister_of_state_central': {
    label: 'Minister of State (Central)',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'parliamentary','legislative','morning-brief','sentiment','content-factory','ai-studio',
      'omni-scan','citizen-engagement','scheme-monitoring'],
    special: ['ministry-tracking']
  },
  
  // ── STATE GOVERNMENT ────────────────────────────────────────
  'chief_minister': {
    label: 'Chief Minister',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'legislative','morning-brief','sentiment','opposition','content-factory','ai-studio',
      'omni-scan','whatsapp-intel','voice-intelligence','citizen-engagement',
      'relationship-graph','coalition-forecast','economic-intelligence','digital-twin',
      'predictive-crisis','election-command','party-integration','deepfake-shield',
      'cabinet-tracking','cmo-integration','state-schemes'],
    special: ['cmo-dashboard','cabinet-meetings','state-monitoring']
  },
  
  'mla': {
    label: 'MLA',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'darshan','legislative','voice-intelligence','morning-brief','sentiment','opposition',
      'content-factory','ai-studio','booth-management','election-command','omni-scan',
      'whatsapp-intel','citizen-engagement','smart-visit-planner','promises-tracker'],
    special: ['mla-funds','assembly-questions','constituency-development']
  },
  
  'mla_minister': {
    label: 'MLA + State Minister',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'legislative','voice-intelligence','morning-brief','sentiment','opposition',
      'content-factory','ai-studio','booth-management','omni-scan','whatsapp-intel',
      'citizen-engagement','economic-intelligence','ministry-tracking','scheme-monitoring'],
    special: ['mla-funds','assembly-questions','ministry-dashboard','state-schemes']
  },
  
  'mlc': {
    label: 'MLC (Legislative Council)',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'legislative','voice-intelligence','morning-brief','sentiment','opposition',
      'content-factory','ai-studio','omni-scan','citizen-engagement','promises-tracker'],
    special: ['mlc-funds','council-questions']
  },
  
  'speaker_assembly': {
    label: 'Speaker (Assembly)',
    modules: ['dashboard','events','appointments','media','legislative','morning-brief',
      'content-factory','ai-studio','relationship-graph'],
    special: ['assembly-proceedings','question-hour','speaker-rulings']
  },
  
  'leader_of_opposition': {
    label: 'Leader of Opposition',
    modules: ['dashboard','grievances','events','appointments','media','legislative',
      'morning-brief','opposition','sentiment','content-factory','ai-studio','omni-scan',
      'whatsapp-intel','relationship-graph','coalition-forecast'],
    special: ['opposition-strategy','assembly-monitoring']
  },
  
  // ── LOCAL GOVERNMENT ────────────────────────────────────────
  'mayor': {
    label: 'Mayor',
    modules: ['dashboard','grievances','events','appointments','voters','projects','media',
      'voice-intelligence','morning-brief','sentiment','content-factory','citizen-engagement',
      'citizen-services','omni-scan'],
    special: ['municipal-projects','ward-management','civic-issues']
  },
  
  'deputy_mayor': {
    label: 'Deputy Mayor',
    modules: ['dashboard','grievances','events','appointments','projects','media',
      'morning-brief','content-factory','citizen-engagement','citizen-services'],
    special: ['municipal-projects']
  },
  
  'councillor': {
    label: 'Councillor / Corporator',
    modules: ['dashboard','grievances','events','appointments','voters','media',
      'morning-brief','content-factory','citizen-services','citizen-engagement'],
    special: ['ward-issues','local-development']
  },
  
  'sarpanch': {
    label: 'Sarpanch (Village)',
    modules: ['dashboard','grievances','events','appointments','voters','projects',
      'citizen-services','citizen-engagement','morning-brief'],
    special: ['village-development','panchayat-funds','rural-schemes']
  },
  
  'zptc_member': {
    label: 'ZPTC Member',
    modules: ['dashboard','grievances','events','appointments','projects','media',
      'citizen-services','morning-brief'],
    special: ['zilla-parishad','district-development']
  },
  
  'mptc_member': {
    label: 'MPTC Member',
    modules: ['dashboard','grievances','events','appointments','citizen-services'],
    special: ['mandal-development']
  },
  
  // ── PARTY POSITIONS ─────────────────────────────────────────
  'state_president': {
    label: 'State Party President',
    modules: ['dashboard','grievances','events','appointments','media','morning-brief',
      'sentiment','opposition','content-factory','coalition-forecast','party-integration',
      'ai-studio','omni-scan','whatsapp-intel','relationship-graph','election-command',
      'predictive-crisis','digital-twin'],
    special: ['party-organization','election-strategy','candidate-tracking']
  },
  
  'district_president': {
    label: 'District Party President',
    modules: ['dashboard','events','appointments','media','morning-brief','sentiment',
      'content-factory','party-integration','election-command','omni-scan'],
    special: ['district-organization','booth-management']
  },
  
  'general_secretary': {
    label: 'General Secretary',
    modules: ['dashboard','events','appointments','media','party-integration',
      'content-factory','relationship-graph'],
    special: ['party-communications']
  },
  
  'spokesperson': {
    label: 'Party Spokesperson',
    modules: ['dashboard','media','opposition','sentiment','content-factory','ai-studio',
      'omni-scan','whatsapp-intel','morning-brief'],
    special: ['media-briefings','press-releases','debate-prep']
  },
  
  'constituency_incharge': {
    label: 'Constituency In-charge',
    modules: ['dashboard','grievances','events','appointments','voters','booth-management',
      'election-command','content-factory','omni-scan','whatsapp-intel'],
    special: ['constituency-management','booth-tracking']
  },
  
  // ── DEFAULT / FALLBACK ──────────────────────────────────────
  'default': {
    label: 'Default',
    modules: ['dashboard','grievances','events','appointments','media','morning-brief',
      'content-factory','citizen-engagement'],
    special: []
  }
};

/**
 * Get modules for a designation
 * @param {string} designation - Politician's designation
 * @returns {object} - { modules: [], special: [], label: '' }
 */
export function getModulesForDesignation(designation) {
  const normalized = designation.toLowerCase().replace(/[_-]/g, '_').trim();
  
  // Direct match
  if (DESIGNATION_MODULES[normalized]) {
    return DESIGNATION_MODULES[normalized];
  }
  
  // Partial matches
  const designKey = Object.keys(DESIGNATION_MODULES).find(key => 
    normalized.includes(key) || key.includes(normalized)
  );
  
  if (designKey) {
    return DESIGNATION_MODULES[designKey];
  }
  
  // Fallback to default
  return DESIGNATION_MODULES.default;
}

/**
 * Check if designation should have MPLADS
 * @param {string} designation 
 * @returns {boolean}
 */
export function hasMPLADS(designation) {
  const normalized = designation.toLowerCase();
  return normalized.includes('mp') || 
         normalized.includes('lok sabha') || 
         normalized.includes('rajya sabha');
}

/**
 * Check if designation is a minister
 * @param {string} designation 
 * @returns {boolean}
 */
export function isMinister(designation) {
  const normalized = designation.toLowerCase();
  return normalized.includes('minister') || 
         normalized.includes('cm') ||
         normalized.includes('chief minister');
}

/**
 * Get all available designations
 * @returns {Array} - Array of designation keys
 */
export function getAllDesignations() {
  return Object.keys(DESIGNATION_MODULES).map(key => ({
    key,
    label: DESIGNATION_MODULES[key].label
  }));
}
