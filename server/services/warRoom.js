import pool from '../db.js';

async function insertNotification(politicianId, title, message) {
  if (!politicianId) return;
  await pool.query(
    'INSERT INTO notifications (politician_id,title,message,link) VALUES (?,?,?,?)',
    [politicianId, title, message, 'crisis-war-room']
  );
}

export async function runWarRoomScan({ politicianId } = {}) {
  const params = [];
  let sql = "SELECT * FROM predictive_alerts WHERE status IN ('active','watch') AND probability >= 70";
  if (politicianId) {
    sql += ' AND politician_id = ?';
    params.push(politicianId);
  }
  const [alerts] = await pool.query(sql, params);
  let created = 0;

  for (const alert of alerts) {
    const polId = alert.politician_id || politicianId;
    if (!polId) continue;
    const [existing] = await pool.query(
      'SELECT id FROM crisis_incidents WHERE source_alert_id = ? AND status != ? LIMIT 1',
      [alert.id, 'resolved']
    );
    if (existing[0]) continue;
    const severity = Math.min(10, Math.max(3, Math.round(Number(alert.probability || 0) / 10)));
    const title = `${alert.alert_type || 'Crisis'} escalation risk`;
    const [r] = await pool.query(
      `INSERT INTO crisis_incidents (politician_id,source_alert_id,title,crisis_type,severity,status,location,detected_at,summary,impact_score,owner,response_plan)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        polId,
        alert.id,
        title,
        alert.alert_type || '',
        severity,
        'open',
        '',
        new Date(),
        alert.description || '',
        alert.probability || 0,
        'NETHRA',
        alert.recommended_action || 'Assemble war room and verify situation.',
      ]
    );
    await pool.query(
      `INSERT INTO warroom_actions (politician_id,incident_id,action_type,description,owner,status,due_at)
       VALUES (?,?,?,?,?,?,DATE_ADD(NOW(), INTERVAL 6 HOUR))`,
      [polId, r.insertId, 'Rapid Assessment', 'Verify the incident and prepare response brief.', 'NETHRA', 'pending']
    );
    await insertNotification(polId, 'Crisis war room activated', title);
    created += 1;
  }

  return { created };
}

export async function warRoomMetrics(politicianId) {
  const params = [];
  const scope = politicianId ? 'WHERE politician_id = ?' : '';
  if (politicianId) params.push(politicianId);
  const openClause = politicianId ? "WHERE politician_id = ? AND status = 'open'" : "WHERE status = 'open'";
  const highClause = politicianId ? "WHERE politician_id = ? AND severity >= 8 AND status != 'resolved'" : "WHERE severity >= 8 AND status != 'resolved'";
  const actionsClause = politicianId ? "WHERE politician_id = ? AND status != 'completed'" : "WHERE status != 'completed'";
  const [[{ open }]] = await pool.query(`SELECT COUNT(*) as open FROM crisis_incidents ${openClause}`, params);
  const [[{ high }]] = await pool.query(`SELECT COUNT(*) as high FROM crisis_incidents ${highClause}`, params);
  const [[{ actions }]] = await pool.query(`SELECT COUNT(*) as actions FROM warroom_actions ${actionsClause}`, params);
  return { open, high, actions };
}
