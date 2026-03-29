import pool from '../db.js';

export async function generateVisitPlans(politicianId) {
  if (!politicianId) {
    const [rows] = await pool.query('SELECT id FROM politician_profiles WHERE is_active = 1');
    for (const row of rows) {
      await generateVisitPlans(row.id);
    }
    return rows.length;
  }
  const [grievances] = await pool.query(
    "SELECT location, priority, created_at FROM grievances WHERE status IN ('Pending','Escalated') AND (politician_id = ? OR politician_id IS NULL) ORDER BY created_at DESC LIMIT 100",
    [politicianId]
  );
  const counts = {};
  grievances.forEach(g => {
    const key = g.location || 'Unknown';
    counts[key] = (counts[key] || 0) + (g.priority === 'Urgent' ? 3 : g.priority === 'High' ? 2 : 1);
  });
  const ranked = Object.entries(counts)
    .map(([location, score]) => ({ location, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  await pool.query('DELETE FROM visit_plans WHERE politician_id = ? AND status = ?', [politicianId, 'planned']);

  for (const item of ranked) {
    await pool.query(
      'INSERT INTO visit_plans (politician_id, mandal, village, priority, reasoning, recommended_date, status) VALUES (?,?,?,?,?,?,?)',
      [politicianId, item.location, '', Math.min(10, item.score), `High grievance volume in ${item.location}`, new Date().toISOString().slice(0, 10), 'planned']
    );
  }
  return ranked.length;
}
