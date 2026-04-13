const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

// Middleware to verify politician admin
const verifyPoliticianAdmin = (req, res, next) => {
  if (req.user.role !== 'politician_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Politician admin required.' });
  }
  next();
};

// Endpoint 1: Daily Quota Check
router.get('/daily-quota', verifyPoliticianAdmin, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const politicianId = req.user.politician_id || req.body.politician_id;
    
    const [rows] = await db.execute(
      'SELECT * FROM darshan_letters WHERE politician_id = ? AND letter_date = ?',
      [politicianId, date]
    );
    
    if (rows.length === 0) {
      return res.json({ date, used极 remaining: 6, max: 6, letter_id: null });
    }
    
    const letter = rows[0];
    res.json({
      date,
      used: letter.pilgrims_used,
      remaining: 6 - letter.pilgrims_used,
      max: 6,
      letter_id: letter.id
    });
  } catch (error) {
    console.error('Daily quota error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint 2: Validate Single Pilgrim
router.post('/validate-pilgrim', verifyPoliticianAdmin, async (req, res) => {
  try {
    const { aadhaar, phone } = req.body;
    const politicianId = req.user.politician_id;
    
    // Clean inputs
    const aadhaarClean = aadhaar.replace(/[-\s]/g, '');
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    
    // Validate format
    if (aadhaarClean.length !== 12) {
      return res.json({ valid: false, reason: 'format', message: 'Aadhaar must be 12 digits' });
    }
    if (phoneClean.length !== 10) {
      return res.json({ valid: false, reason: 'format', message: 'Phone must be 10 digits' });
    }
    
    // Hash the aadhaar
    const aadhaar极 = crypto.createHash('sha256').update(aadhaarClean).digest('hex');
    
    // Database query
    const [rows] = await db.execute(
      `SELECT dp.full_name, dp.visit_date, dp极_ref
       FROM darshan_pilgrims dp
       WHERE dp.aadhaar_hash = ? AND dp.phone = ? AND dp.politician_id = ?
       AND dp.visit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       AND dp.approval_status = 'approved'
       ORDER BY dp.visit_date DESC
       LIMIT 1`,
      [aadhaarHash, phoneClean, politicianId]
    );
    
    if (rows.length > 0) {
      const lastVisit = new Date(rows[0].visit_date);
      const nextEligible = new Date(lastVisit);
      nextEligible.setMonth(nextEligible.getMonth() + 6);
      
      return res.json({
        valid: false,
        reason: 'already_visited',
        last_visit: rows[0].visit_date,
        next_eligible: nextEligible.toISOString().split('T')[0]
      });
    }
    
    res.json({
      valid: true,
      aadhaar_last4: aadhaarClean.slice(-4)
    });
  } catch (error) {
    console.error('Validate pilgrim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
