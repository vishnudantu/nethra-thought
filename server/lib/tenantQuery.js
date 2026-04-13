/**
 * Multi-Tenant Query Helper
 * 
 * Usage in route handlers:
 * const { tq, tqAll } = await import('../lib/tenantQuery.js');
 * 
 * For platform_admin (sees all tenants):
 *   const [rows] = await pool.query('SELECT * FROM table WHERE id = ?', [id]);
 * 
 * For party_admin/politician (tenant-scoped):
 *   const { sql, params } = tq('SELECT * FROM table WHERE id = ?', [id], req.tenantId);
 *   const [rows] = await pool.query(sql, params);
 */

/**
 * Appends tenant_id filter to SQL query
 * @param {string} sql - Base SQL query
 * @param {Array} params - Query parameters
 * @param {number|null} tenantId - Tenant ID (null for platform_admin)
 * @returns {{sql: string, params: Array}} - Modified SQL and params
 */
export function tq(sql, params, tenantId) {
  // Platform admin sees all data (tenantId is null or 0)
  if (!tenantId || tenantId === 0) {
    return { sql, params };
  }
  
  // Add tenant_id filter
  return {
    sql: sql + ' AND tenant_id = ?',
    params: [...params, tenantId]
  };
}

/**
 * For queries without WHERE clause (adds WHERE tenant_id = ?)
 * @param {string} sql - Base SQL query  
 * @param {number|null} tenantId - Tenant ID
 * @returns {{sql: string, params: Array}}
 */
export function tqAll(sql, tenantId) {
  if (!tenantId || tenantId === 0) {
    return { sql, params: [] };
  }
  
  // Check if query already has WHERE
  const hasWhere = sql.toLowerCase().includes('where');
  const separator = hasWhere ? ' AND ' : ' WHERE ';
  
  return {
    sql: sql + separator + 'tenant_id = ?',
    params: [tenantId]
  };
}

/**
 * For INSERT statements (adds tenant_id column)
 * @param {string} table - Table name
 * @param {object} data - Data object to insert
 * @param {number} tenantId - Tenant ID
 * @returns {{sql: string, params: Array}}
 */
export function tqInsert(table, data, tenantId) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  
  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}, tenant_id) VALUES (${columns.map(() => '?').join(', ')}, ?)`,
    params: [...values, tenantId]
  };
}

export default { tq, tqAll, tqInsert };
