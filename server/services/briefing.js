/**
 * Morning Intelligence Brief generator
 * Uses central AI — auto-fallback across all providers
 */
import pool from '../db.js';
import { getApiKey } from './secretStore.js';
import { aiComplete } from './ai.js';

export async function generateMorningBrief(politicianIdOrObj, _opts) {
  const politicianId = (politicianIdOrObj && typeof politicianIdOrObj === 'object') ? politicianIdOrObj.politicianId : politicianIdOrObj;
  if (!politicianId) {
    const [rows] = await pool.query("SELECT id FROM politician_profiles WHERE is_active = 1 AND (role = 'politician' OR role IS NULL) AND role != 'admin'");
    for (const row of rows) await generateMorningBrief(row.id).catch(e => console.error(`Brief failed for ${row.id}:`, e.message));
    return rows.length;
  }

  const [[pol]] = await pool.query("SELECT full_name, designation, constituency_name, state, party FROM politician_profiles WHERE id = ?", [politicianId]);
  if (!pol) return null;

  const [grievances] = await pool.query("SELECT COUNT(*) as total, SUM(status='Pending') as pending, SUM(priority='Urgent') as urgent FROM grievances WHERE politician_id = ?", [politicianId]);
  const [events] = await pool.query("SELECT title, start_date, location FROM events WHERE politician_id = ? AND start_date >= CURDATE() ORDER BY start_date LIMIT 3", [politicianId]);
  const [projects] = await pool.query("SELECT project_name, status, progress_percent FROM projects WHERE politician_id = ? AND status IN ('In Progress','Stalled') ORDER BY progress_percent ASC LIMIT 3", [politicianId]);
  const [media] = await pool.query("SELECT COUNT(*) as mentions, SUM(sentiment='Negative') as negative FROM media_mentions WHERE politician_id = ? AND published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)", [politicianId]);
  const [opposition] = await pool.query("SELECT COUNT(*) as threats FROM opposition_intelligence WHERE politician_id = ? AND detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)", [politicianId]);
  const [whatsapp] = await pool.query("SELECT COUNT(*) as messages, SUM(urgency_score >= 8) as urgent FROM whatsapp_intelligence WHERE politician_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)", [politicianId]);

  const prompt = `You are the chief intelligence officer for ${pol.full_name}, ${pol.designation} from ${pol.constituency_name}, ${pol.state} (${pol.party}).

Generate a sharp morning intelligence brief based on this data:

GRIEVANCES: ${grievances[0]?.total || 0} total, ${grievances[0]?.pending || 0} pending, ${grievances[0]?.urgent || 0} urgent
UPCOMING EVENTS: ${events.map(e => `${e.title} on ${e.start_date}`).join('; ') || 'None'}
STALLED PROJECTS: ${projects.map(p => `${p.project_name} (${p.progress_percent}%)`).join('; ') || 'None'}
MEDIA (24h): ${media[0]?.mentions || 0} mentions, ${media[0]?.negative || 0} negative
OPPOSITION ALERTS: ${opposition[0]?.threats || 0} in last 24h
WHATSAPP MESSAGES: ${whatsapp[0]?.messages || 0} received, ${whatsapp[0]?.urgent || 0} urgent

Write in this format:
**SITUATION**: 2-sentence overall assessment of today's political standing.
**TOP 3 ACTIONS**: Three specific, actionable tasks for today.
**WATCH**: One thing that needs monitoring.
**SENTIMENT**: One word — Stable/Caution/Alert.

Be direct, political, and India-context aware. No fluff.`;

  const brief = await aiComplete({ prompt, system: 'You generate concise political intelligence briefs for Indian politicians.', politicianId, endpoint: 'briefing.generate', maxTokens: 600 });

  const briefId = await pool.query(
    "INSERT INTO ai_briefings (politician_id, title, briefing_type, content, summary, status) VALUES (?, ?, 'morning', ?, ?, 'generated')",
    [politicianId, `Morning Brief — ${new Date().toLocaleDateString('en-IN')}`, brief, brief.slice(0, 200)]
  );

  // Send WhatsApp if phone configured (best-effort)
  try { await sendBriefWhatsApp(politicianId, pol.full_name, brief); } catch (_) {}

  return { id: briefId[0]?.insertId, brief, politician: pol.full_name };
}

async function sendBriefWhatsApp(politicianId, name, brief) {
  const smsKey = await getApiKey('FAST2SMS_API_KEY', { politicianId });
  if (!smsKey) return;
  const [[polProfile]] = await pool.query("SELECT phone FROM politician_profiles WHERE id = ?", [politicianId]);
  if (!polProfile?.phone) return;
  const phone = polProfile.phone.replace(/\D/g, '').slice(-10);
  if (phone.length < 10) return;
  const msg = `ThoughtFirst Morning Brief for ${name}:\n${brief.replace(/\*\*/g, '').slice(0, 400)}`;
  await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: smsKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'q', message: msg, language: 'english', flash: 0, numbers: phone }),
  });
}

export async function getMorningBriefs(politicianId, limit = 10) {
  const [rows] = await pool.query(
    "SELECT * FROM ai_briefings WHERE politician_id = ? ORDER BY created_at DESC LIMIT ?",
    [politicianId, limit]
  );
  return rows;
}
