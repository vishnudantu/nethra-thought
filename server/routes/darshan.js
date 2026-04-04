// server/routes/darshan.js
// Complete Tirupati Darshan Management Module
// Production-ready implementation

import express from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../auth.js';

const router = express.Router();

// Utility: Generate booking reference (TF-YYYYMMDD-XXX)
function generateBookingRef() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(100 + Math.random() * 900);
  return `TF-${year}${month}${day}-${random}`;
}

// Utility: Hash Aadhaar with SHA256
function hashAadhaar(aadhaar) {
  return crypto.createHash('sha256').update(aadhaar).digest('hex');
}

// Utility: Clean phone number (extract last 10 digits)
function cleanPhone(phone) {
  return phone.replace(/\D/g, '').slice(-10);
}

// Utility: Format Aadhaar for display (####-####-####)
function formatAadhaarDisplay(aadhaar) {
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length !== 12) return aadhaar;
  return `${clean.slice(0,4)}-${clean.slice(4,8)}-${clean.slice(8,12)}`;
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

    // Get count of pilgrims already booked for this date
    const [rows] = await req.app.locals.pool.query(
      `SELECT COALESCE(SUM(total_pilgrims), 0) as used
       FROM darshan_bookings
       WHERE politician_id = ? 
       AND letter_date = ?
       AND status != 'rejected'`,
      [politician_id, checkDate]
    );

    const used = parseInt(rows[0]?.used || 0);
    const max = 6;
    const remaining = Math.max(0, max - used);

    res.json({
      used,
      remaining,
      max,
      letter_issued: used > 0,
      can_book: remaining > 0,
      date: checkDate
    });
  } catch (error) {
    console.error('[darshan/quota] Error:', error);
    res.status(500).json({ error: 'Failed to check quota' });
  }
});

/**
 * POST /api/darshan/validate-pilgrim
 * Validate a single pilgrim before saving
 * Checks: Aadhaar format, phone format, 6-month duplicate check
 */
router.post('/validate-pilgrim', authMiddleware, async (req, res) => {
  try {
    const { aadhaar, phone } = req.body;
    
    if (!aadhaar || !phone) {
      return res.status(400).json({ 
        valid: false,
        error: 'Aadhaar and phone are required' 
      });
    }

    // Validate Aadhaar format (12 digits)
    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      return res.json({ 
        valid: false, 
        reason: 'invalid_format',
        message: 'Aadhaar must be exactly 12 digits'
      });
    }

    // Validate phone format (10 digits)
    const cleanPhoneNum = cleanPhone(phone);
    if (cleanPhoneNum.length !== 10) {
      return res.json({ 
        valid: false, 
        reason: 'invalid_phone',
        message: 'Phone must be exactly 10 digits'
      });
    }

    const aadhaarHash = hashAadhaar(cleanAadhaar);
    
    // Check if pilgrim visited within last 6 months
    const [rows] = await req.app.locals.pool.query(
      `SELECT dp.full_name, dp.visit_date, db.booking_ref
       FROM darshan_pilgrims dp
       JOIN darshan_bookings db ON dp.booking_id = db.id
       WHERE dp.aadhaar_hash = ? 
       AND dp.phone = ?
       AND dp.visit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       AND db.status IN ('approved', 'completed')
       ORDER BY dp.visit_date DESC LIMIT 1`,
      [aadhaarHash, cleanPhoneNum]
    );
    
    if (rows.length > 0) {
      const last = rows[0];
      const lastVisit = new Date(last.visit_date);
      const nextEligible = new Date(lastVisit);
      nextEligible.setMonth(nextEligible.getMonth() + 6);
      
      return res.json({
        valid: false,
        reason: 'already_visited',
        message: `This pilgrim visited on ${last.visit_date}`,
        last_visit: last.visit_date,
        next_eligible: nextEligible.toISOString().split('T')[0],
        booking_ref: last.booking_ref
      });
    }

    res.json({ 
      valid: true, 
      message: 'Eligible for Darshan',
      aadhaar_display: formatAadhaarDisplay(cleanAadhaar)
    });
  } catch (error) {
    console.error('[darshan/validate-pilgrim] Error:', error);
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
    const { visit_date, letter_date, pilgrims } = req.body;
    
    if (!pilgrims || !Array.isArray(pilgrims) || pilgrims.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'At least one pilgrim is required' });
    }
    
    if (pilgrims.length > 6) {
      await connection.rollback();
      return res.status(400).json({ error: 'Maximum 6 pilgrims per booking' });
    }

    const today = new Date().toISOString().split('T')[0];
    const bookingLetterDate = letter_date || today;

    // Check quota before proceeding
    const [quotaRows] = await connection.query(
      `SELECT COALESCE(SUM(total_pilgrims), 0) as used
       FROM darshan_bookings
       WHERE politician_id = ? 
       AND letter_date = ?
       AND status != 'rejected'`,
      [politician_id, bookingLetterDate]
    );
    
    const used = parseInt(quotaRows[0]?.used || 0);
    if (used + pilgrims.length > 6) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Insufficient quota',
        message: `Only ${6 - used} slots remaining for ${bookingLetterDate}`
      });
    }

    // Validate all pilgrims (6-month rule)
    for (const pilgrim of pilgrims) {
      const cleanAadhaar = pilgrim.aadhaar.replace(/\D/g, '');
      const aadhaarHash = hashAadhaar(cleanAadhaar);
      const cleanPhoneNum = cleanPhone(pilgrim.phone);
      
      const [existing] = await connection.query(
        `SELECT dp.visit_date
         FROM darshan_pilgrims dp
         JOIN darshan_bookings db ON dp.booking_id = db.id
         WHERE dp.aadhaar_hash = ? 
         AND dp.phone = ?
         AND dp.visit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         AND db.status IN ('approved', 'completed')`,
        [aadhaarHash, cleanPhoneNum]
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
       (politician_id, booking_ref, letter_date, visit_date, total_pilgrims, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [politician_id, bookingRef, bookingLetterDate, visit_date, pilgrims.length, user_id]
    );
    
    const bookingId = bookingResult.insertId;

    // Insert pilgrims
    for (const pilgrim of pilgrims) {
      const cleanAadhaar = pilgrim.aadhaar.replace(/\D/g, '');
      await connection.query(
        `INSERT INTO darshan_pilgrims 
         (booking_id, politician_id, full_name, phone, aadhaar_hash, aadhaar_last4, age, 
          gender, darshan_type, address, visit_date, validation_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', NOW())`,
        [
          bookingId,
          politician_id,
          pilgrim.full_name,
          cleanPhone(pilgrim.phone),
          hashAadhaar(cleanAadhaar),
          cleanAadhaar.slice(-4),
          pilgrim.age,
          pilgrim.gender,
          pilgrim.darshan_type || 'SSD Darshan',
          pilgrim.address || '',
          visit_date
        ]
      );
    }

    // Update daily quota
    await connection.query(
      `INSERT INTO darshan_daily_quota (politician_id, letter_date, pilgrims_booked, max_pilgrims)
       VALUES (?, ?, ?, 6)
       ON DUPLICATE KEY UPDATE pilgrims_booked = pilgrims_booked + ?`,
      [politician_id, bookingLetterDate, pilgrims.length, pilgrims.length]
    );

    await connection.commit();
    
    res.status(201).json({
      success: true,
      booking_id: bookingId,
      booking_ref: bookingRef,
      message: 'Booking created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[darshan/bookings POST] Error:', error);
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
    const { date, status, limit = 50 } = req.query;
    
    let query = `
      SELECT db.*, 
             u.display_name as created_by_name,
             au.display_name as approved_by_name,
             (SELECT COUNT(*) FROM darshan_pilgrims WHERE booking_id = db.id) as pilgrim_count
      FROM darshan_bookings db
      LEFT JOIN users u ON db.created_by = u.id
      LEFT JOIN users au ON db.approved_by = au.id
      WHERE db.politician_id = ?
    `;
    const params = [politician_id];
    
    if (date) {
      query += ' AND db.letter_date = ?';
      params.push(date);
    }
    
    if (status) {
      query += ' AND db.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY db.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [rows] = await req.app.locals.pool.query(query, params);
    
    res.json(rows);
  } catch (error) {
    console.error('[darshan/bookings GET] Error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * GET /api/darshan/bookings/:id
 * Get single booking with pilgrim details
 */
router.get('/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { politician_id } = req.user;
    
    // Get booking
    const [bookingRows] = await req.app.locals.pool.query(
      `SELECT db.*, 
              u.display_name as created_by_name,
              au.display_name as approved_by_name
       FROM darshan_bookings db
       LEFT JOIN users u ON db.created_by = u.id
       LEFT JOIN users au ON db.approved_by = au.id
       WHERE db.id = ? AND db.politician_id = ?`,
      [id, politician_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Get pilgrims
    const [pilgrimRows] = await req.app.locals.pool.query(
      `SELECT * FROM darshan_pilgrims WHERE booking_id = ? ORDER BY id`,
      [id]
    );
    
    res.json({
      ...bookingRows[0],
      pilgrims: pilgrimRows
    });
  } catch (error) {
    console.error('[darshan/bookings/:id GET] Error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
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
    const { contact_person, contact_phone, pickup_point, shrine_contacts } = req.body;
    
    // Update booking status
    await req.app.locals.pool.query(
      `UPDATE darshan_bookings 
       SET status = 'approved', 
           approved_by = ?, 
           approved_at = NOW(),
           contact_person = ?,
           contact_phone = ?,
           pickup_point = ?,
           shrine_contacts = ?
       WHERE id = ?`,
      [user_id, contact_person || '', contact_phone || '', pickup_point || '', shrine_contacts || '', id]
    );
    
    // Get booking with pilgrims for SMS
    const [bookingRows] = await req.app.locals.pool.query(
      `SELECT db.*, pp.full_name as politician_name, pp.display_name as politician_display
       FROM darshan_bookings db
       JOIN politician_profiles pp ON db.politician_id = pp.id
       WHERE db.id = ?`,
      [id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingRows[0];
    
    // Get pilgrims
    const [pilgrims] = await req.app.locals.pool.query(
      `SELECT * FROM darshan_pilgrims WHERE booking_id = ?`,
      [id]
    );
    
    // Send SMS to each pilgrim (if Fast2SMS is configured)
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    let smsSentCount = 0;
    
    if (fast2smsKey) {
      for (const pilgrim of pilgrims) {
        const phone = pilgrim.phone.replace(/\D/g, '').slice(-10);
        if (phone.length === 10) {
          const smsText = `Dear ${pilgrim.full_name}, your Tirupati Darshan is CONFIRMED. Date: ${booking.visit_date}. Type: ${pilgrim.darshan_type}. Ref: ${booking.booking_ref}. Pickup: ${pickup_point || 'TTD Office, Tirumala'}. Carry original Aadhaar. Contact: ${contact_person || 'Office'} - ${contact_phone || 'N/A'}. - ${booking.politician_display || booking.politician_name} Office`;
          
          try {
            const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
              method: 'POST',
              headers: {
                'authorization': fast2smsKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                route: 'q',
                message: smsText,
                language: 'english',
                flash: 0,
                numbers: phone
              })
            });
            
            const smsData = await smsRes.json();
            if (smsData.return === true) {
              smsSentCount++;
              await req.app.locals.pool.query(
                'UPDATE darshan_pilgrims SET sms_sent = 1, sms_sent_at = NOW() WHERE id = ?',
                [pilgrim.id]
              );
            }
          } catch (smsError) {
            console.error('[darshan/sms] Error sending SMS:', smsError);
          }
        }
      }
    }
    
    // Mark booking SMS as sent
    await req.app.locals.pool.query(
      'UPDATE darshan_bookings SET sms_sent = ? WHERE id = ?',
      [smsSentCount > 0 ? 1 : 0, id]
    );
    
    res.json({
      success: true,
      message: 'Booking approved successfully',
      sms_sent: smsSentCount,
      total_pilgrims: pilgrims.length
    });
  } catch (error) {
    console.error('[darshan/bookings/:id/approve] Error:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

/**
 * PUT /api/darshan/bookings/:id/reject
 * Reject a booking
 */
router.put('/bookings/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const { reason } = req.body;
    
    await req.app.locals.pool.query(
      `UPDATE darshan_bookings 
       SET status = 'rejected', 
           approved_by = ?, 
           approved_at = NOW(),
           notes = ?
       WHERE id = ?`,
      [user_id, reason || 'Rejected by admin', id]
    );
    
    res.json({
      success: true,
      message: 'Booking rejected'
    });
  } catch (error) {
    console.error('[darshan/bookings/:id/reject] Error:', error);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

export default router;
