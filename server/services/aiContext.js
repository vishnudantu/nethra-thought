/**
 * AI Context Injection System
 * Fetches party + politician training context and prepends to every AI call
 * Layer order: platform → party → politician (most specific wins/appends last)
 */
import pool from '../db.js';

// Cache context for 5 minutes to avoid DB hits on every call
const contextCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(scope, scopeId) {
  return `${scope}:${scopeId || 'null'}`;
}

async function fetchContextRows(scope, scopeId) {
  const key = cacheKey(scope, scopeId);
  const cached = contextCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rows;

  try {
    const [rows] = await pool.query(
      `SELECT context_type, title, content
       FROM ai_context_profiles
       WHERE scope = ? AND (scope_id = ? OR (scope = 'platform' AND scope_id IS NULL))
         AND is_active = 1
       ORDER BY context_type`,
      [scope, scopeId]
    );
    contextCache.set(key, { rows, ts: Date.now() });
    return rows;
  } catch (_) {
    return [];
  }
}

// Clear cache for a politician/party when context is updated
export function clearContextCache(scope, scopeId) {
  contextCache.delete(cacheKey(scope, scopeId));
  contextCache.delete(cacheKey('platform', null));
}

// Get politician's party name
async function getPartyName(politicianId) {
  if (!politicianId) return null;
  try {
    const [[row]] = await pool.query(
      'SELECT party FROM politician_profiles WHERE id = ?',
      [politicianId]
    );
    return row?.party || null;
  } catch (_) { return null; }
}

// Get positive feedback examples for a politician + endpoint
async function getPositiveExamples(politicianId, endpoint) {
  if (!politicianId) return [];
  try {
    const [rows] = await pool.query(
      `SELECT ai_output FROM ai_feedback
       WHERE politician_id = ? AND endpoint = ? AND feedback = 'positive'
       ORDER BY created_at DESC LIMIT 3`,
      [politicianId, endpoint]
    );
    return rows.map(r => r.ai_output);
  } catch (_) { return []; }
}

// Get negative feedback examples to avoid
async function getNegativeExamples(politicianId, endpoint) {
  if (!politicianId) return [];
  try {
    const [rows] = await pool.query(
      `SELECT ai_output, feedback_note FROM ai_feedback
       WHERE politician_id = ? AND endpoint = ? AND feedback = 'negative'
       ORDER BY created_at DESC LIMIT 3`,
      [politicianId, endpoint]
    );
    return rows.map(r => ({ output: r.ai_output, note: r.feedback_note }));
  } catch (_) { return []; }
}

// Format a block of context rows into a system prompt section
function formatContextBlock(rows, heading) {
  if (!rows.length) return '';
  const parts = rows.map(r => `[${r.title}]\n${r.content}`).join('\n\n');
  return `\n\n--- ${heading} ---\n${parts}`;
}

/**
 * Main function: build the full injected system prompt for a politician
 * Returns enriched system string with platform + party + politician context
 */
export async function buildContextualSystem(baseSystem, politicianId, endpoint = 'general') {
  try {
    // Fetch all three layers in parallel
    const [platformRows, partyName] = await Promise.all([
      fetchContextRows('platform', null),
      getPartyName(politicianId),
    ]);

    const [partyRows, polRows, positiveExamples, negativeExamples] = await Promise.all([
      partyName ? fetchContextRows('party', partyName) : Promise.resolve([]),
      politicianId ? fetchContextRows('politician', String(politicianId)) : Promise.resolve([]),
      getPositiveExamples(politicianId, endpoint),
      getNegativeExamples(politicianId, endpoint),
    ]);

    let system = baseSystem || 'You are a helpful political intelligence assistant for an Indian politician.';

    // Layer 1: Platform context
    if (platformRows.length) {
      system += formatContextBlock(platformRows, 'PLATFORM CONTEXT');
    }

    // Layer 2: Party context
    if (partyRows.length) {
      system += formatContextBlock(partyRows, `PARTY CONTEXT: ${partyName}`);
    }

    // Layer 3: Politician-specific context
    if (polRows.length) {
      system += formatContextBlock(polRows, 'POLITICIAN-SPECIFIC CONTEXT');
    }

    // Layer 4: Feedback-based learning
    if (positiveExamples.length) {
      system += `\n\n--- APPROVED STYLE EXAMPLES (match this quality and tone) ---\n`;
      positiveExamples.forEach((ex, i) => {
        system += `Example ${i + 1}:\n${ex.slice(0, 400)}\n\n`;
      });
    }

    if (negativeExamples.length) {
      system += `\n\n--- AVOID THESE PATTERNS ---\n`;
      negativeExamples.forEach(ex => {
        system += `Avoid: ${ex.output.slice(0, 200)}${ex.note ? ` (Reason: ${ex.note})` : ''}\n`;
      });
    }

    return system;
  } catch (e) {
    console.warn('[aiContext] Failed to build context:', e.message);
    return baseSystem || 'You are a helpful political intelligence assistant for an Indian politician.';
  }
}

/**
 * Save AI feedback (thumbs up/down)
 */
export async function saveAiFeedback({ politicianId, endpoint, promptSummary, aiOutput, feedback, feedbackNote, reviewedBy }) {
  try {
    await pool.query(
      `INSERT INTO ai_feedback (politician_id, endpoint, prompt_summary, ai_output, feedback, feedback_note, reviewed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [politicianId, endpoint, promptSummary?.slice(0, 500), aiOutput, feedback, feedbackNote, reviewedBy]
    );
    return true;
  } catch (e) {
    console.error('[aiContext] Failed to save feedback:', e.message);
    return false;
  }
}

/**
 * Get context summary for a politician (used in Training UI)
 */
export async function getContextSummary(politicianId) {
  try {
    const partyName = await getPartyName(politicianId);
    const [platformRows, partyRows, polRows, feedbackStats] = await Promise.all([
      fetchContextRows('platform', null),
      partyName ? fetchContextRows('party', partyName) : Promise.resolve([]),
      politicianId ? fetchContextRows('politician', String(politicianId)) : Promise.resolve([]),
      pool.query(
        `SELECT feedback, COUNT(*) as count FROM ai_feedback
         WHERE politician_id = ? GROUP BY feedback`,
        [politicianId]
      ).then(([rows]) => rows).catch(() => []),
    ]);

    return {
      party_name: partyName,
      layers: {
        platform: platformRows.length,
        party: partyRows.length,
        politician: polRows.length,
      },
      total_context_blocks: platformRows.length + partyRows.length + polRows.length,
      feedback: {
        positive: feedbackStats.find(r => r.feedback === 'positive')?.count || 0,
        negative: feedbackStats.find(r => r.feedback === 'negative')?.count || 0,
      },
    };
  } catch (e) {
    return { error: e.message };
  }
}
