import pool from '../db.js';
import { getApiKey } from './secretStore.js';

async function fetchPolitician(politicianId) {
  if (!politicianId) return null;
  const [rows] = await pool.query(
    'SELECT id, full_name, constituency_name, state, party, designation FROM politician_profiles WHERE id = ? LIMIT 1',
    [politicianId]
  );
  return rows?.[0] || null;
}

async function generateWithGemini(prompt, politicianId) {
  const apiKey = await getApiKey('GEMINI_API_KEY', { politicianId, endpoint: 'content.factory' });
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1500, temperature: 0.6 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function generateDailyContentPack(politicianId) {
  if (!politicianId) {
    const [rows] = await pool.query('SELECT id FROM politician_profiles WHERE is_active = 1');
    for (const row of rows) {
      await generateDailyContentPack(row.id);
    }
    return rows.length;
  }
  const pol = await fetchPolitician(politicianId);
  const prompt = `You are a political content generator for ${pol?.full_name || 'the politician'} (${pol?.party || ''}, ${pol?.constituency_name || ''}). 
Create JSON array with 5 items: 
1) twitter post, 2) facebook post, 3) instagram post, 4) whatsapp broadcast, 5) press statement.
Each item fields: type, platform, title, content, tags. Keep twitter <= 280 chars.
Return only JSON.`;

  const raw = await generateWithGemini(prompt, politicianId);
  let items = raw ? safeJson(raw) : null;
  if (!Array.isArray(items)) {
    items = [
      { type: 'social_post', platform: 'twitter', title: 'Daily Update', content: 'Working for the constituency with focus on development and citizen services. #Nethra', tags: ['daily', 'twitter'] },
      { type: 'social_post', platform: 'facebook', title: 'Community Update', content: 'Today we reviewed key grievances and project updates. Your feedback matters.', tags: ['facebook'] },
      { type: 'social_post', platform: 'instagram', title: 'Progress Snapshot', content: 'Development work continues across the constituency. #Progress', tags: ['instagram'] },
      { type: 'whatsapp', platform: 'whatsapp', title: 'WhatsApp Broadcast', content: 'We are addressing pending grievances and monitoring local issues. Reach out for support.', tags: ['whatsapp'] },
      { type: 'press_statement', platform: 'print', title: 'Press Statement', content: 'We remain committed to timely resolution of citizen issues and transparent governance.', tags: ['press'] },
    ];
  }

  const createdIds = [];
  for (const item of items) {
    const [res] = await pool.query(
      'INSERT INTO ai_generated_content (politician_id, content_type, prompt, content, is_saved, tags) VALUES (?,?,?,?,0,?)',
      [politicianId || null, item.type || 'social_post', item.title || 'Content', item.content || '', JSON.stringify(item.tags || [])]
    );
    const contentId = res?.insertId;
    createdIds.push(contentId);
    if (contentId) {
      await pool.query(
        'INSERT INTO content_calendar (politician_id, content_id, scheduled_date, platform, status) VALUES (?,?,?,?,?)',
        [politicianId || null, contentId, new Date().toISOString().slice(0, 10), item.platform || 'whatsapp', 'scheduled']
      );
    }
  }
  return createdIds;
}
