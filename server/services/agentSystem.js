import pool from '../db.js';

const TASK_TEMPLATES = [
  {
    agent_type: 'Sentinel',
    task_type: 'sentiment-scan',
    description: 'Scan sentiment signals and highlight shifts.',
    async run(politicianId) {
      const [[row]] = await pool.query(
        'SELECT ROUND(AVG(overall_score)) as score FROM sentiment_scores WHERE politician_id = ? AND score_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
        [politicianId]
      );
      const score = row?.score ?? null;
      return { status: 'completed', result: score ? `Avg sentiment ${score}/100` : 'No recent sentiment scores' };
    },
  },
  {
    agent_type: 'Resolution',
    task_type: 'grievance-triage',
    description: 'Summarize open grievance backlog and urgency.',
    async run(politicianId) {
      const [[row]] = await pool.query(
        "SELECT COUNT(*) as total FROM grievances WHERE politician_id = ? AND status NOT IN ('Resolved','Closed')",
        [politicianId]
      );
      const total = row?.total ?? 0;
      return {
        status: 'completed',
        result: `${total} open grievances awaiting action`,
        notify: total >= 25,
      };
    },
  },
  {
    agent_type: 'Opposition Watch',
    task_type: 'opposition-scan',
    description: 'Monitor opposition threat movements.',
    async run(politicianId) {
      const [[row]] = await pool.query(
        'SELECT COUNT(*) as total FROM opposition_intelligence WHERE politician_id = ? AND threat_level >= 7 AND detected_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
        [politicianId]
      );
      const total = row?.total ?? 0;
      return { status: 'completed', result: `${total} high-threat opposition signals` };
    },
  },
  {
    agent_type: 'Media Guard',
    task_type: 'media-risk',
    description: 'Track negative media mentions that need response.',
    async run(politicianId) {
      const [[row]] = await pool.query(
        "SELECT COUNT(*) as total FROM media_mentions WHERE politician_id = ? AND sentiment = 'Negative' AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [politicianId]
      );
      const total = row?.total ?? 0;
      return { status: 'completed', result: `${total} negative media mentions this week`, notify: total >= 10 };
    },
  },
  {
    agent_type: 'WhatsApp Intel',
    task_type: 'whatsapp-misinfo',
    description: 'Detect misinformation and viral forwards.',
    async run(politicianId) {
      const [[row]] = await pool.query(
        'SELECT COUNT(*) as total FROM whatsapp_intelligence WHERE politician_id = ? AND (is_misinformation = 1 OR is_viral = 1) AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        [politicianId]
      );
      const total = row?.total ?? 0;
      return { status: 'completed', result: `${total} suspicious WhatsApp forwards flagged`, notify: total >= 5 };
    },
  },
  {
    agent_type: 'Crisis Sentinel',
    task_type: 'crisis-watch',
    description: 'Scan predictive crisis alerts and escalation risks.',
    async run(politicianId) {
      const [[row]] = await pool.query(
        "SELECT COUNT(*) as total FROM predictive_alerts WHERE politician_id = ? AND status IN ('active','watch') AND probability >= 70",
        [politicianId]
      );
      const total = row?.total ?? 0;
      return { status: 'completed', result: `${total} crisis alerts above 70% probability`, notify: total >= 3 };
    },
  },
];

async function insertNotification(politicianId, title, message, link) {
  if (!politicianId) return;
  await pool.query(
    'INSERT INTO notifications (politician_id,title,message,link) VALUES (?,?,?,?)',
    [politicianId, title, message, link || 'agent-system']
  );
}

async function fetchPoliticianIds(politicianId) {
  if (politicianId) return [politicianId];
  const [rows] = await pool.query("SELECT id FROM politician_profiles WHERE is_active = 1 AND (role = 'politician' OR role IS NULL)");
  return rows.map(r => r.id);
}

export async function runAgentSystem({ politicianId } = {}) {
  const targets = await fetchPoliticianIds(politicianId);
  let created = 0;
  let skipped = 0;

  for (const polId of targets) {
    for (const task of TASK_TEMPLATES) {
      const [[exists]] = await pool.query(
        'SELECT id FROM agent_tasks WHERE politician_id = ? AND task_type = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR) LIMIT 1',
        [polId, task.task_type]
      );
      if (exists) {
        skipped += 1;
        continue;
      }
      const outcome = await task.run(polId);
      await pool.query(
        'INSERT INTO agent_tasks (politician_id,agent_type,task_type,description,status,result,assigned_to) VALUES (?,?,?,?,?,?,?)',
        [polId, task.agent_type, task.task_type, task.description, outcome.status, outcome.result || '', 'NETHRA']
      );
      created += 1;
      if (outcome.notify) {
        await insertNotification(
          polId,
          `Agent alert: ${task.task_type.replace('-', ' ')}`,
          outcome.result || 'Agent update ready.',
          'agent-system'
        );
      }
    }
  }
  return { created, skipped, targets: targets.length };
}

export async function agentSystemMetrics(politicianId) {
  const params = [];
  const scope = politicianId ? 'WHERE politician_id = ?' : '';
  if (politicianId) params.push(politicianId);
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) as total FROM agent_tasks ${scope} GROUP BY status`,
    params
  );
  const recentScope = politicianId ? 'WHERE politician_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)' : 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  const [recent] = await pool.query(
    `SELECT agent_type, COUNT(*) as total FROM agent_tasks ${recentScope} GROUP BY agent_type`,
    params
  );
  const summary = { pending: 0, in_progress: 0, completed: 0, failed: 0 };
  rows.forEach(row => {
    summary[row.status] = row.total;
  });
  return { summary, recent };
}
