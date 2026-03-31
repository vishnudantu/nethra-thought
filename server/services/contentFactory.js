/**
 * Content Factory — generates social media, speeches, press releases
 * Uses central AI — auto-fallback across all providers
 */
import pool from '../db.js';
import { aiComplete } from './ai.js';

const CONTENT_TYPES = {
  social_post: { label: 'Social Media Post', maxTokens: 300, system: 'You write punchy, shareable social media posts for Indian politicians. Telugu and Hindi friendly.' },
  speech:      { label: 'Speech Excerpt',    maxTokens: 800, system: 'You write powerful political speeches for Indian politicians. Emotional, local-context aware.' },
  press_release: { label: 'Press Release',  maxTokens: 600, system: 'You write professional press releases for Indian politician offices.' },
  whatsapp_broadcast: { label: 'WhatsApp Broadcast', maxTokens: 350, system: 'You write concise, impactful WhatsApp broadcast messages for political communication.' },
  grievance_response: { label: 'Grievance Response',  maxTokens: 300, system: 'You write empathetic, official responses to constituent grievances.' },
  project_update: { label: 'Project Update', maxTokens: 400, system: 'You write clear project progress updates for constituency communications.' },
};

export async function generateContent(politicianId, contentType = 'social_post', context = '') {
  const [[pol]] = await pool.query("SELECT full_name, designation, constituency_name, state, party FROM politician_profiles WHERE id = ?", [politicianId]);
  if (!pol) throw new Error('Politician not found');

  const cfg = CONTENT_TYPES[contentType] || CONTENT_TYPES.social_post;

  const [recentGrievances] = await pool.query("SELECT subject, category, location FROM grievances WHERE politician_id = ? ORDER BY created_at DESC LIMIT 5", [politicianId]);
  const [recentProjects]   = await pool.query("SELECT project_name, status, location FROM projects WHERE politician_id = ? ORDER BY updated_at DESC LIMIT 3", [politicianId]);

  const prompt = `Generate a ${cfg.label} for ${pol.full_name}, ${pol.designation} from ${pol.constituency_name}, ${pol.state} (${pol.party}).

${context ? `SPECIFIC CONTEXT: ${context}\n` : ''}
RECENT GRIEVANCE THEMES: ${recentGrievances.map(g => `${g.subject} (${g.location})`).join(', ') || 'None'}
ACTIVE PROJECTS: ${recentProjects.map(p => `${p.project_name} — ${p.status}`).join(', ') || 'None'}

Generate ONLY the content, no explanations. Make it authentic and locally relevant.`;

  const content = await aiComplete({ prompt, system: cfg.system, politicianId, endpoint: `content.${contentType}`, maxTokens: cfg.maxTokens });

  const [r] = await pool.query(
    "INSERT INTO ai_generated_content (politician_id, content_type, prompt, content, is_saved) VALUES (?,?,?,?,0)",
    [politicianId, contentType, (context || 'auto-generated').slice(0, 500), content]
  );

  return { id: r.insertId, content_type: contentType, content, label: cfg.label };
}

export async function generateContentPack(politicianId) {
  const types = ['social_post', 'whatsapp_broadcast', 'press_release'];
  const results = [];
  for (const type of types) {
    try {
      const r = await generateContent(politicianId, type);
      results.push(r);
    } catch (e) {
      console.error(`Content pack ${type} failed:`, e.message);
    }
  }
  return results;
}
