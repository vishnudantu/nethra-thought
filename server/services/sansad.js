import pool from '../db.js';
export async function runSansadSync() {
  const feedUrl = process.env.SANSAD_FEED_URL;
  if (!feedUrl) return { skipped: true, reason: 'SANSAD_FEED_URL not configured' };
  const res = await fetch(feedUrl);
  if (!res.ok) return { skipped: true, reason: `Failed ${res.status}` };
  const data = await res.json();
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  for (const q of questions) {
    await pool.query(
      `INSERT INTO parliamentary_questions (session_number, house, question_type, ministry, subject, question_text, status, sansad_url)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), ministry=VALUES(ministry)`,
      [
        q.session_number || '',
        q.house || 'Lok Sabha',
        q.question_type || 'Unstarred',
        q.ministry || '',
        q.subject || '',
        q.question_text || '',
        q.status || 'Submitted',
        q.sansad_url || '',
      ]
    );
  }
  return { inserted: questions.length };
}
