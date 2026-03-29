import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'nethra-secret-change-this-in-production';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
