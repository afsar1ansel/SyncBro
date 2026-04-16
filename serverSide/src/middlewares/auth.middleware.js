import { verifyToken } from '../utils/jwt.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }

    // Attach user ID to request
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    next(error);
  }
};
