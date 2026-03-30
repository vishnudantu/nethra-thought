import pool from '../db.js';

function safeJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, value));
}

function computeScenario(row) {
  const seatProjections = safeJson(row.seat_projections) || {};
  const rawAlliances = safeJson(row.alliances);
  const alliances = Array.isArray(rawAlliances) ? rawAlliances : [];
  const totalSeats = row.total_seats || Object.values(seatProjections).reduce((sum, v) => sum + Number(v || 0), 0);
  const majority = row.majority_mark || (Math.floor(totalSeats / 2) + 1);

  const computedAlliances = alliances.map(alliance => {
    let seats = Number(alliance?.seats || 0);
    if (!seats && Array.isArray(alliance?.parties)) {
      seats = alliance.parties.reduce((sum, party) => sum + Number(seatProjections?.[party] || 0), 0);
    }
    const margin = seats - majority;
    const probability = clamp(5, 95, 50 + margin * 2);
    return { ...alliance, seats, margin, probability };
  });

  const top = computedAlliances.sort((a, b) => b.seats - a.seats)[0];
  const topMargin = top ? top.seats - majority : -majority;
  const probability = top ? top.probability : 0;
  const risk_level = topMargin >= 20 ? 'low' : topMargin >= 0 ? 'moderate' : topMargin >= -10 ? 'high' : 'critical';

  return {
    totalSeats,
    majority,
    probability,
    risk_level,
    forecast: {
      majority_mark: majority,
      alliances: computedAlliances,
      top_alliance: top?.name || top?.label || '',
      updated_at: new Date().toISOString(),
    },
  };
}

export async function runCoalitionForecasts({ politicianId } = {}) {
  const params = [];
  let sql = 'SELECT * FROM coalition_scenarios';
  if (politicianId) {
    sql += ' WHERE politician_id = ?';
    params.push(politicianId);
  }
  const [rows] = await pool.query(sql, params);
  let updated = 0;
  for (const row of rows) {
    const computed = computeScenario(row);
    await pool.query(
      'UPDATE coalition_scenarios SET total_seats = ?, majority_mark = ?, probability = ?, risk_level = ?, forecast = ? WHERE id = ?',
      [
        computed.totalSeats,
        computed.majority,
        computed.probability,
        computed.risk_level,
        JSON.stringify(computed.forecast),
        row.id,
      ]
    );
    updated += 1;
  }
  return { updated };
}

export async function coalitionOverview(politicianId) {
  const params = [];
  const scope = politicianId ? 'WHERE politician_id = ?' : '';
  if (politicianId) params.push(politicianId);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM coalition_scenarios ${scope}`, params);
  const activeClause = politicianId ? 'WHERE politician_id = ? AND status = \'active\'' : "WHERE status = 'active'";
  const [[{ active }]] = await pool.query(`SELECT COUNT(*) as active FROM coalition_scenarios ${activeClause}`, params);
  const [top] = await pool.query(`SELECT scenario_name, probability, risk_level FROM coalition_scenarios ${scope} ORDER BY probability DESC LIMIT 1`, params);
  return { total, active, top: top?.[0] || null };
}
