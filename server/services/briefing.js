import nodemailer from 'nodemailer';
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
    "SELECT id, full_name, constituency_name, state, party, designation FROM politician_profiles WHERE id = ? AND (role = 'politician' OR role IS NULL) LIMIT 1",
    [politicianId]
  );
  return rows?.[0] || null;
}

async function fetchMentions(since, politicianId) {
  const params = [since];
  let sql = 'SELECT headline, source, sentiment, published_at FROM media_mentions WHERE published_at >= ?';
  if (politicianId) { sql += ' AND politician_id = ?'; params.push(politicianId); }
  sql += ' ORDER BY published_at DESC LIMIT 20';
  const [rows] = await pool.query(sql, params);
  return rows || [];
}

async function fetchGrievances(politicianId) {
  const params = [];
  let sql = "SELECT subject, category, priority, status, created_at FROM grievances WHERE status IN ('Pending','Escalated')";
  if (politicianId) { sql += ' AND politician_id = ?'; params.push(politicianId); }
  sql += ' ORDER BY created_at DESC LIMIT 10';
  const [rows] = await pool.query(sql, params);
  return rows || [];
}

async function fetchEvents(politicianId) {
  const params = [];
  let sql = 'SELECT title, location, start_date, status FROM events WHERE start_date >= NOW()';
  if (politicianId) { sql += ' AND politician_id = ?'; params.push(politicianId); }
  sql += ' ORDER BY start_date ASC LIMIT 5';
  const [rows] = await pool.query(sql, params);
  return rows || [];
}

async function fetchOpposition(politicianId) {
  const params = [];
  let sql = 'SELECT opponent_name, activity_type, detected_at FROM opposition_intelligence WHERE 1=1';
  if (politicianId) { sql += ' AND politician_id = ?'; params.push(politicianId); }
  sql += ' ORDER BY detected_at DESC LIMIT 5';
  const [rows] = await pool.query(sql, params);
  return rows || [];
}

async function fetchApprovals(politicianId) {
  const params = [];
  let darshanSql = "SELECT COUNT(*) as pending_darshan FROM darshan_bookings WHERE approval_status = 'pending'";
  let contentSql = "SELECT COUNT(*) as pending_content FROM ai_generated_content WHERE is_saved = 0";
  let grievanceSql = "SELECT COUNT(*) as urgent_grievances FROM grievances WHERE status IN ('Pending','Escalated') AND priority IN ('High','Urgent')";
  if (politicianId) {
    darshanSql += ' AND politician_id = ?';
    contentSql += ' AND politician_id = ?';
    grievanceSql += ' AND politician_id = ?';
    params.push(politicianId);
  }
  const [darshanRows] = await pool.query(darshanSql, params);
  const [contentRows] = await pool.query(contentSql, params);
  const [grievanceRows] = await pool.query(grievanceSql, params);
  return {
    pending_darshan: darshanRows?.[0]?.pending_darshan || 0,
    pending_content: contentRows?.[0]?.pending_content || 0,
    urgent_grievances: grievanceRows?.[0]?.urgent_grievances || 0,
  };
}

async function generateWithGemini(prompt, politicianId) {
  const apiKey = await getApiKey('GEMINI_API_KEY', { politicianId, endpoint: 'briefing.generate' });
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

async function sendBriefEmail(subject, body, politicianId) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const from = process.env.SMTP_FROM || 'no-reply@nethra.ai';
  if (!host || !user || !pass) return false;
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const [rows] = await pool.query('SELECT email FROM users WHERE politician_id = ? AND is_active = 1', [politicianId]);
  const recipients = rows.map(r => r.email).filter(Boolean);
  if (!recipients.length) return false;
  await transporter.sendMail({ from, to: recipients.join(','), subject, text: body });
  return true;
}

async function sendBriefSms(summary) {
  const numbers = (process.env.BRIEF_SMS_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean);
  if (!numbers.length || !process.env.FAST2SMS_API_KEY) return false;
  const msg = `NETHRA Brief: ${summary.slice(0, 140)}`;
  const r = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: process.env.FAST2SMS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'q', message: msg, language: 'english', flash: 0, numbers: numbers.join(',') }),
  });
  const d = await r.json();
  return d.return === true;
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
  const mentions = await fetchMentions(since.toISOString().slice(0, 19).replace('T', ' '), politicianId);
  const grievances = await fetchGrievances(politicianId);
  const events = await fetchEvents(politicianId);
  const opposition = await fetchOpposition(politicianId);
  const approvals = await fetchApprovals(politicianId);

  const sentimentCounts = mentions.reduce((acc, m) => {
    acc[m.sentiment] = (acc[m.sentiment] || 0) + 1;
    return acc;
  }, {});

  const topMention = mentions[0];
  const summary = `Media: ${mentions.length} mentions (Pos ${sentimentCounts.Positive || 0}, Neg ${sentimentCounts.Negative || 0}). ` +
    `Pending grievances: ${grievances.length}. Upcoming events: ${events.length}. Pending approvals: Darshan ${approvals.pending_darshan}, Content ${approvals.pending_content}.`;

  const prompt = `Generate NETHRA DAILY INTELLIGENCE BRIEF with sections:\n` +
    `Overnight Alerts, Constituency Pulse (Mood + trend), Media Summary, Social Summary, Opposition Watch, Today's Priorities, Pending Approvals, Your Schedule Today, Parliamentary Alerts, Weekly Performance.\n` +
    `Politician: ${politician?.full_name || 'the politician'} (${politician?.designation || ''}), Constituency: ${politician?.constituency_name || 'N/A'} ${politician?.state || ''}.\n` +
    `Top media mention: ${topMention?.headline || 'None'} (${topMention?.source || ''}).\n` +
    `Media counts: ${JSON.stringify(sentimentCounts)}.\n` +
    `Pending grievances (up to 5): ${grievances.slice(0, 5).map(g => `${g.subject} (${g.category}, ${g.priority})`).join('; ')}.\n` +
    `Upcoming events (up to 3): ${events.slice(0, 3).map(e => `${e.title} at ${e.location} on ${e.start_date}`).join('; ')}.\n` +
    `Opposition activity: ${opposition.slice(0, 3).map(o => `${o.opponent_name} - ${o.activity_type}`).join('; ')}.\n` +
    `Pending approvals: darshan ${approvals.pending_darshan}, content ${approvals.pending_content}, urgent grievances ${approvals.urgent_grievances}.\n` +
    `Return crisp bullet points.`;

  const aiContent = await generateWithGemini(prompt, politicianId);
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
  if (politicianId) {
    await safeInsert('notifications', {
      politician_id: politicianId,
      title,
      message: summary,
      link: 'morning-brief',
    });
    await sendBriefEmail(title, content, politicianId).catch(() => {});
    await sendBriefSms(summary).catch(() => {});
  }
  if (insertId) {
    const [rows] = await pool.query('SELECT * FROM ai_briefings WHERE id = ? LIMIT 1', [insertId]);
    return rows?.[0] || data;
  }
  return data;
}
