/**
 * Party Management Routes
 * Platform Admin only - Create/Edit parties (TDP, YSRCP, BJP, etc.)
 */
import express from 'express';
import { authMiddleware } from '../auth.js';

const router = express.Router();

// Helper to check super admin (without modifying auth.js)
const requireSuperAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden - Super Admin only' });
  }
  return true;
};

/**
 * GET /api/parties - List all parties (Platform Admin only)
 */
router.get('/', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT id, name, slug, logo_url, primary_color, secondary_color, is_active, created_at FROM parties ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('[parties-list]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/parties/:id - Get single tenant
 */
router.get('/:id', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM parties WHERE id = ?',
      [req.params.id]
    );
    rows.length ? res.json(rows[0]) : res.status(404).json({ error: 'Party not found' });
  } catch (err) {
    console.error('[parties-get]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/parties - Create new tenant (party)
 */
router.post('/', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  
  const { name, slug, logo_url, primary_color, secondary_color } = req.body;
  
  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug required' });
  }
  
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'INSERT INTO parties (name, slug, logo_url, primary_color, secondary_color, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name, slug, logo_url || null, primary_color || '#00d4aa', secondary_color || '#1e88e5']
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Party created successfully'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error('[parties-create]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/parties/:id - Update tenant
 */
router.put('/:id', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  
  const { name, slug, logo_url, primary_color, secondary_color, is_active } = req.body;
  
  try {
    const pool = req.app.locals.pool;
    await pool.query(
      'UPDATE parties SET name = ?, slug = ?, logo_url = ?, primary_color = ?, secondary_color = ?, is_active = ? WHERE id = ?',
      [name, slug, logo_url, primary_color, secondary_color, is_active ? 1 : 0, req.params.id]
    );
    
    res.json({ success: true, message: 'Party updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error('[parties-update]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/parties/:id - Delete tenant (soft delete - set is_active = 0)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  
  try {
    const pool = req.app.locals.pool;
    await pool.query(
      'UPDATE parties SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'Party deactivated' });
  } catch (err) {
    console.error('[parties-delete]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
