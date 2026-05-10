import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { UserRole } from '../generated/prisma/enums';

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

// Role-based authorization middleware factory
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions for this action'));
    }

    next();
  };
};
