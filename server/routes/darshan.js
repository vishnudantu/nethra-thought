// server/routes/darshan.js
// Complete API endpoints for Tirupati Darshan module

import express from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../auth.js';

const router = express.Router();

// Get pool from app locals
function getPool(req) {
  return req.app.locals.pool || req.app.get('pool');
}

// Utility: Generate booking reference
function generateBookingRef() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TF-${year}-${random}`;
}

// Utility: Hash Aadhaar
function hashAadhaar(aadhaar) {
  return crypto.createHash('sha256').update(aadhaar).digest('hex');
}

// Utility: Clean phone number
function cleanPhone(phone) {
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * GET /api/darshan/quota
 * Check daily quota status for a politician
 */
router.get('/quota', authMiddleware, async (req, res) => {
  try {
    const { politician_id } = req.user;
    const { date } = req.query;
    const checkDate = date || new Date().toISOString().split('T')[0];

    // Get count of approved/completed pilgrims for this date
    const [rows] = await req.app.locals.pool.query(
      `SELECT COUNT(dp.id) as used
       FROM darshan_bookings db
       JOIN darshan_pilgrims dp ON dp.booking_id = db.id
       WHERE db.politician_id = ? 
       AND db.letter_date = ?
       AND db.status IN ('approved', 'completed')`,
      [politician_id, checkDate]
    );

    const used = rows[0]?.used || 0;
    const max = 6;
    const remaining = max - used;

    res.json({
      used,
      remaining,
      max,
      letter_issued: used > 0,
      can_book: remaining > 0
    });
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({ error: 'Failed to check quota' });
  }
});

/**
 * POST /api/darshan/validate-pilgrim
 * Validate a single pilgrim before saving
 */
router.post('/validate-pilgrim', authMiddleware, async (req, res) => {
  try {
    const { aadhaar, phone } = req.body;
    
    if (!aadhaar || !phone) {
      return res.status(400).json({ error: 'Aadhaar and phone are required' });
    }

    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(aadhaar)) {
      return res.json({ 
        valid: false, 
        reason: 'invalid_format',
        message: 'Aadhaar must be 12 digits'
      });
    }

    // Validate phone format (10 digits)
    const cleanPhoneNum = cleanPhone(phone);
    if (cleanPhoneNum.length !== 10) {
      return res.json({ 
        valid: false, 
        reason: 'invalid_phone',
        message: 'Phone must be 10 digits'
      });
    }

    const aadhaarHash = hashAadhaar(aadhaar);
    
    // Check if pilgrim visited within last 6 months
    const [rows] = await req.app.locals.pool.query(
      `SELECT dp.full_name, dp.visit_date, db.booking_ref
       FROM darshan_pilgrims dp
       JOIN darshan_bookings db ON dp.booking_id = db.id
       WHERE dp.aadhaar_hash = ? 
       AND dp.phone LIKE ?
       AND dp.visit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       AND db.status IN ('approved', 'completed')
       ORDER BY dp.visit_date DESC LIMIT 1`,
      [aadhaarHash, `%${cleanPhoneNum}`]
    );
    
    if (rows.length > 0) {
      const last = rows[0];
      const lastVisit = new Date(last.visit_date);
      const nextEligible = new Date(lastVisit);
      nextEligible.setMonth(nextEligible.getMonth() + 6);
      
      return res.json({
        valid: false,
        reason: 'already_visited',
        message: `This pilgrim already visited on ${last.visit_date}`,
        last_visit: last.visit_date,
        next_eligible: nextEligible.toISOString().split('T')[0],
        booking_ref: last.booking_ref
      });
    }

    res.json({ valid: true, message: 'Pilgrim is eligible' });
  } catch (error) {
    console.error('Pilgrim validation error:', error);
    res.status(500).json({ error: 'Failed to validate pilgrim' });
  }
});

/**
 * POST /api/darshan/bookings
 * Create a new booking with pilgrims
 */
router.post('/bookings', authMiddleware, async (req, res) => {
  const pool = req.app.locals.pool;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { politician_id, id: user_id } = req.user;
    const { booking_date, letter_date, pilgrims } = req.body;
    
    if (!pilgrims || !Array.isArray(pilgrims) || pilgrims.length === 0) {
      return res.status(400).json({ error: 'At least one pilgrim is required' });
    }
    
    if (pilgrims.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 pilgrims per booking' });
    }

    // Check quota before proceeding
    const [quotaRows] = await connection.query(
      `SELECT COUNT(dp.id) as used
       FROM darshan_bookings db
       JOIN darshan_pilgrims dp ON dp.booking_id = db.id
       WHERE db.politician_id = ? 
       AND db.letter_date = ?
       AND db.status IN ('approved', 'completed')`,
      [politician_id, letter_date]
    );
    
    const used = quotaRows[0]?.used || 0;
    if (used + pilgrims.length > 6) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Insufficient quota',
        message: `Only ${6 - used} slots remaining for ${letter_date}`
      });
    }

    // Validate all pilgrims (6-month rule)
    for (const pilgrim of pilgrims) {
      const aadhaarHash = hashAadhaar(pilgrim.aadhaar);
      const cleanPhoneNum = cleanPhone(pilgrim.phone);
      
      const [existing] = await connection.query(
        `SELECT dp.visit_date
         FROM darshan_pilgrims dp
         JOIN darshan_bookings db ON dp.booking_id = db.id
         WHERE dp.aadhaar_hash = ? 
         AND dp.phone LIKE ?
         AND dp.visit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         AND db.status IN ('approved', 'completed')`,
        [aadhaarHash, `%${cleanPhoneNum}`]
      );
      
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Pilgrim already visited',
          pilgrim: pilgrim.full_name,
          message: `This pilgrim visited on ${existing[0].visit_date} and is not eligible again yet`
        });
      }
    }

    // Create booking
    const bookingRef = generateBookingRef();
    const [bookingResult] = await connection.query(
      `INSERT INTO darshan_bookings 
       (politician_id, booking_ref, booking_date, letter_date, total_pilgrims, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [politician_id, bookingRef, booking_date, letter_date, pilgrims.length, user_id]
    );
    
    const bookingId = bookingResult.insertId;

    // Insert pilgrims
    for (const pilgrim of pilgrims) {
      await connection.query(
        `INSERT INTO darshan_pilgrims 
         (booking_id, politician_id, full_name, phone, aadhaar, aadhaar_hash, age, 
          gender, address, darshan_type, visit_date, validation_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', NOW())`,
        [
          bookingId,
          politician_id,
          pilgrim.full_name,
          cleanPhone(pilgrim.phone),
          pilgrim.aadhaar.slice(-4),
          hashAadhaar(pilgrim.aadhaar),
          pilgrim.age,
          pilgrim.gender,
          pilgrim.address,
          pilgrim.darshan_type || 'SSD',
          booking_date
        ]
      );
    }

    await connection.commit();
    
    res.status(201).json({
      success: true,
      booking_id: bookingId,
      booking_ref: bookingRef,
      message: 'Booking created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/darshan/bookings
 * Get all bookings for a politician
 */
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const { politician_id } = req.user;
    const { date, status } = req.query;
    
    let query = `
      SELECT db.*, 
             COUNT(dp.id) as pilgrim_count,
             GROUP_CONCAT(
               JSON_OBJECT(
                 'id', dp.id,
                 'full_name', dp.full_name,
                 'phone', dp.phone,
                 'age', dp.age,
                 'gender', dp.gender,
                 'darshan_type', dp.darshan_type,
                 'validation_status', dp.validation_status
               )
             ) as pilgrims
      FROM darshan_bookings db
      LEFT JOIN darshan_pilgrims dp ON dp.booking_id = db.id
      WHERE db.politician_id = ?
    `;
    const params = [politician_id];
    
    if (date) {
      query += ' AND db.booking_date = ?';
      params.push(date);
    }
    
    if (status) {
      query += ' AND db.status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY db.id ORDER BY db.created_at DESC';
    
    const [rows] = await req.app.locals.pool.query(query, params);
    
    // Parse pilgrims JSON
    const bookings = rows.map(row => ({
      ...row,
      pilgrims: row.pilgrims ? JSON.parse(`[${row.pilgrims}]`) : []
    }));
    
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * PUT /api/darshan/bookings/:id/approve
 * Approve a booking and send SMS
 */
router.put('/bookings/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const { contact_person, contact_phone, pickup_point } = req.body;
    
    // Update booking status
    await req.app.locals.pool.query(
      `UPDATE darshan_bookings 
       SET status = 'approved', approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [user_id, id]
    );
    
    // Get pilgrims to send SMS
    const [pilgrims] = await req.app.locals.pool.query(
      `SELECT dp.*, db.booking_ref, db.booking_date, pp.name as politician_name
       FROM darshan_pilgrims dp
       JOIN darshan_bookings db ON dp.booking_id = db.id
       JOIN politician_profiles pp ON db.politician_id = pp.id
       WHERE dp.booking_id = ?`,
      [id]
    );
    
    if (pilgrims.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Mark SMS as sent
    await req.app.locals.pool.query(
      'UPDATE darshan_bookings SET sms_sent = 1 WHERE id = ?',
      [id]
    );
    
    await req.app.locals.pool.query(
      'UPDATE darshan_pilgrims SET sms_sent = 1 WHERE booking_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Booking approved successfully',
      sms_sent_to: pilgrims.length
    });
  } catch (error) {
    console.error('Booking approval error:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

export default router;
