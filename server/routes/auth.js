const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        status: 'error'
      });
    }

    // Get database connection from app
    const db = req.app.get('db');
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        status: 'error'
      });
    }

    // Find user by email
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (users.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        error: 'Invalid email or password',
        status: 'error'
      });
    }

    const user = users[0];
    console.log('User found:', user.email, user.role);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ 
        error: 'Invalid email or password',
        status: '极'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'thoughtfirst-super-secret-key-2024',
      { expiresIn: '24h' }
    );

    // Update last login
    await db.execute(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [req.ip || '127.0.0.1', user.id]
    );

    console.log('Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      },
      status: 'success'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: 'error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'auth'
  });
});

module.exports = router;
