import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { AuthenticationError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY ?? '1h';

// Validate JWT configuration on startup
export const validateJWTConfig = () => {
  if (!JWT_SECRET || JWT_SECRET === 'SECRET_KEY') {
    throw new Error('JWT_SECRET is not properly configured. Please set a strong JWT_SECRET in your environment variables.');
  }
};

const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string) => {
  tokenBlacklist.add(token);

  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresInMs = decoded?.exp ? decoded.exp * 1000 - Date.now() : undefined;

  if (expiresInMs && expiresInMs > 0) {
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, expiresInMs + 5000);
  }
};

export const isTokenBlacklisted = (token: string) => tokenBlacklist.has(token);

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256',
    } as any);
  } catch (error) {
    throw new Error('Failed to generate JWT token');
  }
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    if (isTokenBlacklisted(token)) {
      throw new AuthenticationError('Token has been logged out');
    }

    const decoded = jwt.verify(token, JWT_SECRET as string, {
      algorithms: ['HS256'],
    } as any) as unknown as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid or malformed token');
    }
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Token verification failed');
  }
};

export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader) {
    throw new AuthenticationError('Missing authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new AuthenticationError('Invalid authorization header format. Expected: Bearer <token>');
  }

  return parts[1];
};
