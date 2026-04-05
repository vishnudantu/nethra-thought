import crypto from 'crypto';
import pool from '../db.js';

function decodeMasterKey() {
  const raw = process.env.API_KEYS_MASTER_KEY;
  if (!raw) return null;
  const isHex = /^[0-9a-fA-F]+$/.test(raw) && raw.length >= 64;
  const buf = Buffer.from(raw, isHex ? 'hex' : 'base64');
  if (buf.length !== 32) return null;
  return buf;
}

export function hasMasterKey() {
  return !!decodeMasterKey();
}

function encrypt(value) {
  const key = decodeMasterKey();
  if (!key) throw new Error('API_KEYS_MASTER_KEY is missing or invalid');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted_value: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: tag.toString('base64'),
  };
}

function decrypt(row) {
  const key = decodeMasterKey();
  if (!key) throw new Error('API_KEYS_MASTER_KEY is missing or invalid');
  const iv = Buffer.from(row.iv, 'base64');
  const tag = Buffer.from(row.auth_tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(row.encrypted_value, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

function maskHint(value) {
  const clean = value.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return last4 ? `••••${last4}` : '';
}

export async function listApiKeys() {
  const [rows] = await pool.query('SELECT key_name, key_hint, is_active, updated_at FROM api_keys ORDER BY key_name');
  return rows || [];
}

export async function listPoliticianApiKeys(politicianId) {
  const [rows] = await pool.query(
    'SELECT key_name, key_hint, is_active, is_paused, monthly_limit, usage_count, usage_month, updated_at FROM politician_api_keys WHERE politician_id = ? ORDER BY key_name',
    [politicianId],
  );
  return rows || [];
}

export async function upsertApiKey(key_name, value) {
  if (!value) throw new Error('Key value required');
  const encrypted = encrypt(value);
  const key_hint = maskHint(value);
  const sql = `INSERT INTO api_keys (key_name, encrypted_value, iv, auth_tag, key_hint, is_active)
               VALUES (?, ?, ?, ?, ?, 1)
               ON DUPLICATE KEY UPDATE encrypted_value=VALUES(encrypted_value), iv=VALUES(iv), auth_tag=VALUES(auth_tag),
               key_hint=VALUES(key_hint), is_active=1`;
  await pool.query(sql, [key_name, encrypted.encrypted_value, encrypted.iv, encrypted.auth_tag, key_hint]);
  return { key_name, key_hint, is_active: 1 };
}

export async function upsertPoliticianApiKey({ politicianId, key_name, value, monthly_limit = 0, is_active = 1 }) {
  if (!politicianId || !key_name) throw new Error('politicianId and key_name required');
  if (!value) throw new Error('Key value required');
  const encrypted = encrypt(value);
  const key_hint = maskHint(value);
  const sql = `INSERT INTO politician_api_keys (politician_id, key_name, encrypted_value, iv, auth_tag, key_hint, is_active, is_paused, monthly_limit, usage_count, usage_month)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, DATE_FORMAT(NOW(), '%Y-%m'))
               ON DUPLICATE KEY UPDATE encrypted_value=VALUES(encrypted_value), iv=VALUES(iv), auth_tag=VALUES(auth_tag),
               key_hint=VALUES(key_hint), is_active=VALUES(is_active), monthly_limit=VALUES(monthly_limit)`;
  await pool.query(sql, [politicianId, key_name, encrypted.encrypted_value, encrypted.iv, encrypted.auth_tag, key_hint, is_active ? 1 : 0, monthly_limit]);
  return { key_name, key_hint, is_active: is_active ? 1 : 0, monthly_limit };
}

export async function deactivateApiKey(key_name) {
  await pool.query('UPDATE api_keys SET is_active = 0 WHERE key_name = ?', [key_name]);
}

export async function deactivatePoliticianApiKey({ politicianId, key_name }) {
  await pool.query('UPDATE politician_api_keys SET is_active = 0 WHERE politician_id = ? AND key_name = ?', [politicianId, key_name]);
}

async function recordApiUsage({ politicianId, key_name, endpoint, status_code }) {
  if (!politicianId || !key_name) return;
  const usageMonth = new Date().toISOString().slice(0, 7);
  await pool.query(
    'INSERT INTO api_key_usage (politician_id, key_name, endpoint, status_code) VALUES (?,?,?,?)',
    [politicianId, key_name, endpoint || '', status_code || null],
  );
  await pool.query(
    `UPDATE politician_api_keys
       SET usage_count = CASE WHEN usage_month = ? THEN usage_count + 1 ELSE 1 END,
           usage_month = ?
     WHERE politician_id = ? AND key_name = ?`,
    [usageMonth, usageMonth, politicianId, key_name],
  );
}

export async function getApiKey(key_name, options = {}) {
  const { politicianId, endpoint } = options;
  if (politicianId) {
    const [rows] = await pool.query(
      'SELECT * FROM politician_api_keys WHERE politician_id = ? AND key_name = ? AND is_active = 1 LIMIT 1',
      [politicianId, key_name],
    );
    const row = rows?.[0];
    if (row) {
      if (row.is_paused) return null;
      if (row.monthly_limit && row.usage_month === new Date().toISOString().slice(0, 7) && row.usage_count >= row.monthly_limit) {
        await pool.query('UPDATE politician_api_keys SET is_paused = 1 WHERE id = ?', [row.id]);
        return null;
      }
      const key = decrypt(row);
      await recordApiUsage({ politicianId, key_name, endpoint });
      return key;
    }
  }
  if (process.env[key_name]) return process.env[key_name];
  const [rows] = await pool.query('SELECT * FROM api_keys WHERE key_name = ? AND is_active = 1 LIMIT 1', [key_name]);
  if (!rows?.[0]) return null;
  return decrypt(rows[0]);
}
