import pool from '../db.js';

const KEYWORDS = [
  'deepfake',
  'fake video',
  'morphed',
  'ai-generated',
  'manipulated',
  'fabricated',
  'synthetic',
  'voice clone',
  'impersonation',
  'edited clip',
];

function matchesDeepfake(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return KEYWORDS.some(k => lower.includes(k));
}

async function insertNotification(politicianId, title, message) {
  if (!politicianId) return;
  await pool.query(
    'INSERT INTO notifications (politician_id,title,message,link) VALUES (?,?,?,?)',
    [politicianId, title, message, 'deepfake-shield']
  );
}

async function existsIncident(politicianId, contentUrl) {
  const [rows] = await pool.query(
    'SELECT id FROM deepfake_incidents WHERE politician_id <=> ? AND content_url = ? LIMIT 1',
    [politicianId, contentUrl]
  );
  return !!rows[0];
}

export async function runDeepfakeShield({ politicianId } = {}) {
  const params = [];
  let mediaSql = 'SELECT id,politician_id,headline,summary,url,published_at FROM media_mentions WHERE published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  if (politicianId) {
    mediaSql += ' AND politician_id = ?';
    params.push(politicianId);
  }
  const [mediaRows] = await pool.query(mediaSql, params);
  let created = 0;

  for (const row of mediaRows) {
    const contentText = `${row.headline || ''} ${row.summary || ''}`;
    if (!matchesDeepfake(contentText)) continue;
    const polId = row.politician_id || politicianId;
    if (!polId) continue;
    const contentUrl = row.url || `media:${row.id}`;
    if (await existsIncident(polId, contentUrl)) continue;
    const confidence = contentText.toLowerCase().includes('deepfake') ? 85 : 70;
    await pool.query(
      `INSERT INTO deepfake_incidents (politician_id,platform,content_url,detected_at,confidence,status,response_plan,notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        polId,
        row.url ? 'Media' : 'Media Mention',
        contentUrl,
        row.published_at || new Date(),
        confidence,
        'investigating',
        'Verify source, prepare takedown notice, and brief comms team.',
        row.summary || row.headline || '',
      ]
    );
    await insertNotification(polId, 'Deepfake alert detected', row.headline || 'Potential deepfake content detected.');
    created += 1;
  }

  const paramsWa = [];
  let waSql = 'SELECT id,politician_id,content,transcription,is_misinformation,is_viral,created_at FROM whatsapp_intelligence WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  if (politicianId) {
    waSql += ' AND politician_id = ?';
    paramsWa.push(politicianId);
  }
  const [waRows] = await pool.query(waSql, paramsWa);
  for (const row of waRows) {
    const text = `${row.content || ''} ${row.transcription || ''}`;
    if (!row.is_misinformation && !row.is_viral && !matchesDeepfake(text)) continue;
    const polId = row.politician_id || politicianId;
    if (!polId) continue;
    const contentUrl = `whatsapp:${row.id}`;
    if (await existsIncident(polId, contentUrl)) continue;
    const confidence = row.is_misinformation ? 80 : 65;
    await pool.query(
      `INSERT INTO deepfake_incidents (politician_id,platform,content_url,detected_at,confidence,status,response_plan,notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        polId,
        'WhatsApp',
        contentUrl,
        row.created_at || new Date(),
        confidence,
        'open',
        'Trace origin, issue clarification message, and notify field team.',
        text.slice(0, 500),
      ]
    );
    await insertNotification(polId, 'WhatsApp misinformation detected', 'Potential deepfake or manipulated content found in WhatsApp.');
    created += 1;
  }

  return { created };
}

export async function deepfakeMetrics(politicianId) {
  const params = [];
  const scope = politicianId ? 'WHERE politician_id = ?' : '';
  if (politicianId) params.push(politicianId);
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) as total FROM deepfake_incidents ${scope} GROUP BY status`,
    params
  );
  const summary = rows.reduce((acc, row) => {
    acc[row.status] = row.total;
    return acc;
  }, {});
  return { summary };
}
