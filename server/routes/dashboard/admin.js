const express = require('express');
const router = express.Router();

// Admin dashboard endpoint
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    // Get dashboard statistics
    const [stats] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM politician_profiles) as total_politicians,
        (SELECT COUNT(*) FROM constituencies) as total_constituencies,
        (SELECT COUNT(*) FROM darshan_requests WHERE DATE(created_at) = CURDATE()) as today_darshan_requests,
        (SELECT COUNT(*) FROM grievances WHERE status = 'pending') as pending_grievances,
        (SELECT COUNT(*) FROM news_cache WHERE DATE(created_at) = CURDATE()) as today_news_articles
    `);

    // Get recent activity
    const [recentActivity] = await db.execute(`
      SELECT 'user_login' as type, email, last_login_at as timestamp 
      FROM users 
      WHERE last_login_at IS NOT NULL 
      ORDER BY last_login_at DESC 
      LIMIT 10
      
      UNION ALL
      
      SELECT 'darshan_request' as type, pilgrim_name as email, created_at as timestamp
      FROM darshan_requests 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    res.json({
      status: 'success',
      dashboard: {
        statistics: stats[0],
        recent_activity: recentActivity
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: 'error'
    });
  }
});

module.exports = router;
