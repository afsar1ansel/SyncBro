import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Generates a JWT for a user
 * @param {string} userId - User ID to encode in token
 * @returns {string} Signed JWT
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verifies a JWT
 * @param {string} token - Token to verify
 * @returns {object|null} Decoded payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Sets the auth cookie in the response
 * @param {object} res - Express response object
 * @param {string} token - JWT to set in cookie
 */
export const setCookie = (res, token) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production', // Only send over HTTPS in production
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

/**
 * Clears the auth cookie
 * @param {object} res - Express response object
 */
export const clearCookie = (res) => {
  res.cookie('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};
