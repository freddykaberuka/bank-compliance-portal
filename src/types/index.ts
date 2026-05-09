import { Request } from 'express';
import { UserRole } from '../generated/prisma/enums';


export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  };
}

export interface AuthMeResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
