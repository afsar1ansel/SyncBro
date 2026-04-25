import cookie from 'cookie';
import { verifyToken } from '../utils/jwt.js';

export const socketAuthMiddleware = (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    
    if (!cookies) {
      return next(new Error('Authentication error: No cookies found'));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.auth_token;

    if (!token) {
      return next(new Error('Authentication error: No token found'));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user ID to socket data
    socket.data.user = { id: decoded.id };
    next();
  } catch (error) {
    next(new Error('Authentication error: ' + error.message));
  }
};
