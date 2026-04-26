import { verifyToken } from '../utils/jwt.js';

export const protect = async (req, res, next) => {
  try {
    // Check for token in Authorization header or Cookies
    let token = req.cookies.auth_token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

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
