import { authorizeRole, verifyToken } from '../logic/auth.js';

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    req.auth = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!authorizeRole(req.auth, role)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource.' });
    }
    return next();
  };
}
