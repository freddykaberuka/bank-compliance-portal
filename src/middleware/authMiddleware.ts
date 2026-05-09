import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthenticationError } from '../utils/errors';

/**
 * Authentication middleware
 * Validates JWT and attaches user to request
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Verify token and attach user info to request
    const payload = verifyToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
