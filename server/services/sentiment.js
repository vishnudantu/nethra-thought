import pool from '../db.js';
function normalizeSentimentScore(rows, sentimentField = 'sentiment') {
  if (!rows || rows.length === 0) return 50;
  let pos = 0, neg = 0, neutral = 0;
  rows.forEach(r => {
    const val = String(r[sentimentField] || '').toLowerCase();
    if (val.includes('positive')) pos += 1;
    else if (val.includes('negative')) neg += 1;
    else neutral += 1;
  });
  const total = pos + neg + neutral || 1;
  const raw = (pos - neg) / total;
  return Math.max(0, Math.min(100, Math.round(((raw + 1) / 2) * 100)));
}

function grievanceScore(pendingCount) {
  const score = 100 - Math.min(100, pendingCount * 2);
  return Math.max(0, score);
}

export async function updateSentimentScores() {
  const [politicians] = await pool.query('SELECT id FROM politician_profiles WHERE is_active = 1');
  const today = new Date().toISOString().slice(0, 10);

  for (const pol of politicians) {
    const politicianId = pol.id;
    let media = [];
    let social = [];
    let whatsapp = [];
    let grievances = [];
    let ground = [];
    try {
      [media] = await pool.query(
        "SELECT sentiment FROM media_mentions WHERE politician_id = ? AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [politicianId]
      );
    } catch {
      [media] = await pool.query(
        "SELECT sentiment FROM media_mentions WHERE published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
    }
    try {
      [social] = await pool.query(
        "SELECT sentiment FROM media_mentions WHERE politician_id = ? AND source_type = 'Social Media' AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [politicianId]
      );
    } catch {
      [social] = await pool.query(
        "SELECT sentiment FROM media_mentions WHERE source_type = 'Social Media' AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
    }
    try {
      [whatsapp] = await pool.query(
        "SELECT sentiment FROM whatsapp_intelligence WHERE politician_id = ? AND received_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [politicianId]
      );
    } catch {
      [whatsapp] = await pool.query(
        "SELECT sentiment FROM whatsapp_intelligence WHERE received_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
    }
    try {
      [grievances] = await pool.query(
        "SELECT COUNT(*) as cnt FROM grievances WHERE status IN ('Pending','Escalated') AND politician_id = ?",
        [politicianId]
      );
    } catch {
      [grievances] = await pool.query(
        "SELECT COUNT(*) as cnt FROM grievances WHERE status IN ('Pending','Escalated')"
      );
    }
    try {
      [ground] = await pool.query(
        "SELECT classification FROM voice_reports WHERE politician_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [politicianId]
      );
    } catch {
      [ground] = await pool.query(
        "SELECT classification FROM voice_reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
    }

    const mediaScore = normalizeSentimentScore(media);
    const socialScore = normalizeSentimentScore(social);
    const whatsappScore = normalizeSentimentScore(whatsapp);
    const grievanceScoreVal = grievanceScore(grievances?.[0]?.cnt || 0);
    const groundScore = ground?.length ? Math.max(30, 100 - (ground.length * 3)) : 60;

    const overall = Math.round(
      mediaScore * 0.25 +
      socialScore * 0.2 +
      whatsappScore * 0.2 +
      grievanceScoreVal * 0.2 +
      groundScore * 0.15
    );

    const channelBreakdown = {
      media: mediaScore,
      social: socialScore,
      whatsapp: whatsappScore,
      grievances: grievanceScoreVal,
      ground: groundScore,
    };

    await pool.query(
      `INSERT INTO sentiment_scores (politician_id, score_date, overall_score, news_score, social_score, whatsapp_score, grievance_score, ground_score, channel_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE overall_score=VALUES(overall_score), news_score=VALUES(news_score),
       social_score=VALUES(social_score), whatsapp_score=VALUES(whatsapp_score), grievance_score=VALUES(grievance_score),
       ground_score=VALUES(ground_score), channel_breakdown=VALUES(channel_breakdown)`,
      [
        politicianId,
        today,
        overall,
        mediaScore,
        socialScore,
        whatsappScore,
        grievanceScoreVal,
        groundScore,
        JSON.stringify(channelBreakdown),
      ]
    );
  }
}

export async function getCurrentSentiment(politicianId) {
  const [rows] = await pool.query(
    'SELECT * FROM sentiment_scores WHERE politician_id = ? ORDER BY score_date DESC LIMIT 1',
    [politicianId]
  );
  return rows?.[0] || null;
}

export async function getSentimentHistory(politicianId, days = 30) {
  const [rows] = await pool.query(
    'SELECT * FROM sentiment_scores WHERE politician_id = ? ORDER BY score_date DESC LIMIT ?',
    [politicianId, days]
  );
  return rows || [];
}
