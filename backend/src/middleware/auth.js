const jwt = require('jsonwebtoken');

/**
 * Verify JWT from Authorization: Bearer <token> header.
 * Injects req.user = { id, email, role } on success.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Access denied.' });
  }
};

/**
 * Role-based guard. Usage: requireRole('admin')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access forbidden. Required role: ${roles.join(' or ')}.` });
  }
  next();
};

module.exports = { verifyToken, requireRole };
