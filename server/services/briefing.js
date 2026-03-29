import pool from '../db.js';
import { getApiKey } from './secretStore.js';

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function safeInsert(table, data) {
  const keys = Object.keys(data);
  const cols = keys.map(k => `\`${k}\``).join(',');
  const ph = keys.map(() => '?').join(',');
  const values = keys.map(k => data[k]);
  try {
    const [r] = await pool.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${ph})`, values);
    return r?.insertId;
  } catch (err) {
    if (err?.code === 'ER_BAD_FIELD_ERROR' && 'politician_id' in data) {
      const { politician_id, ...rest } = data;
      const restKeys = Object.keys(rest);
      const restCols = restKeys.map(k => `\`${k}\``).join(',');
      const restPh = restKeys.map(() => '?').join(',');
      const restValues = restKeys.map(k => rest[k]);
      const [r] = await pool.query(`INSERT INTO \`${table}\` (${restCols}) VALUES (${restPh})`, restValues);
      return r?.insertId;
    }
    throw err;
  }
}

async function fetchPolitician(politicianId) {
  if (!politicianId) return null;
  const [rows] = await pool.query(
    'SELECT id, full_name, constituency_name, state, party, designation FROM politician_profiles WHERE id = ? LIMIT 1',
    [politicianId]
  );
  return rows?.[0] || null;
}

async function fetchMentions(since) {
  const [rows] = await pool.query(
    'SELECT headline, source, sentiment, published_at FROM media_mentions WHERE published_at >= ? ORDER BY published_at DESC LIMIT 20',
    [since]
  );
  return rows || [];
}

async function fetchGrievances() {
  const [rows] = await pool.query(
    "SELECT subject, category, priority, status, created_at FROM grievances WHERE status IN ('Pending','Escalated') ORDER BY created_at DESC LIMIT 10"
  );
  return rows || [];
}

async function fetchEvents() {
  const [rows] = await pool.query(
    "SELECT title, location, start_date, status FROM events WHERE start_date >= NOW() ORDER BY start_date ASC LIMIT 5"
  );
  return rows || [];
}

async function generateWithGemini(prompt) {
  const apiKey = await getApiKey('GEMINI_API_KEY');
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1200, temperature: 0.4 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

export async function generateMorningBrief({ politicianId, force = false } = {}) {
  const briefingDate = formatDate();
  if (!force) {
    const [rows] = await pool.query(
      'SELECT * FROM ai_briefings WHERE briefing_date = ? ORDER BY created_at DESC LIMIT 1',
      [briefingDate]
    );
    if (rows?.[0]) return rows[0];
  }

  const politician = await fetchPolitician(politicianId);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const mentions = await fetchMentions(since.toISOString().slice(0, 19).replace('T', ' '));
  const grievances = await fetchGrievances();
  const events = await fetchEvents();

  const sentimentCounts = mentions.reduce((acc, m) => {
    acc[m.sentiment] = (acc[m.sentiment] || 0) + 1;
    return acc;
  }, {});

  const topMention = mentions[0];
  const summary = `Media: ${mentions.length} mentions (Pos ${sentimentCounts.Positive || 0}, Neg ${sentimentCounts.Negative || 0}). ` +
    `Pending grievances: ${grievances.length}. Upcoming events: ${events.length}.`;

  const prompt = `Generate a concise Morning Intelligence Brief for ${politician?.full_name || 'the politician'}.\n` +
    `Constituency: ${politician?.constituency_name || 'N/A'}, ${politician?.state || 'N/A'}.\n` +
    `Top media mention: ${topMention?.headline || 'None'} (${topMention?.source || ''}).\n` +
    `Media counts: ${JSON.stringify(sentimentCounts)}.\n` +
    `Pending grievances (up to 5): ${grievances.slice(0, 5).map(g => `${g.subject} (${g.category}, ${g.priority})`).join('; ')}.\n` +
    `Upcoming events (up to 3): ${events.slice(0, 3).map(e => `${e.title} at ${e.location} on ${e.start_date}`).join('; ')}.\n` +
    `Format: Executive Summary, Alerts, Media Summary, Grievances Snapshot, Today's Priorities.`;

  const aiContent = await generateWithGemini(prompt);
  const content = aiContent || [
    'Executive Summary',
    `- ${summary}`,
    '',
    'Alerts',
    grievances.slice(0, 3).map(g => `- ${g.subject} (${g.priority})`).join('\n') || '- No critical alerts',
    '',
    'Media Summary',
    mentions.slice(0, 3).map(m => `- ${m.headline} — ${m.source}`).join('\n') || '- No notable mentions',
    '',
    'Grievances Snapshot',
    grievances.slice(0, 5).map(g => `- ${g.subject} (${g.category})`).join('\n') || '- No pending grievances',
    '',
    "Today's Priorities",
    events.slice(0, 3).map(e => `- ${e.title} (${e.location})`).join('\n') || '- Review pending grievances',
  ].join('\n');

  const title = `Morning Brief — ${briefingDate}`;
  const data = {
    briefing_date: briefingDate,
    briefing_type: 'Daily Digest',
    title,
    summary,
    content,
    priority: (sentimentCounts.Negative || 0) > 3 ? 'High' : 'Medium',
    is_read: 0,
    tags: JSON.stringify(['morning-brief', 'omniscan']),
    ...(politicianId ? { politician_id: politicianId } : {}),
  };

  const insertId = await safeInsert('ai_briefings', data);
  if (insertId) {
    const [rows] = await pool.query('SELECT * FROM ai_briefings WHERE id = ? LIMIT 1', [insertId]);
    return rows?.[0] || data;
  }
  return data;
}
