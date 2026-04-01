import pool from '../db.js';

export async function getPlatformSetting(key) {
  try {
    const [[row]] = await pool.query(
      "SELECT setting_value FROM platform_settings WHERE politician_id IS NULL AND setting_key = ? LIMIT 1",
      [key]
    );
    return row?.setting_value || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}
