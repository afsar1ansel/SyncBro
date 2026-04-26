import cookie from 'cookie';
import { verifyToken } from '../utils/jwt.js';

export const socketAuthMiddleware = (socket, next) => {
    // Check for token in handshake.auth (LocalStorage) or Cookies
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.cookie) {
      const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
      token = parsedCookies.auth_token;
    }

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
