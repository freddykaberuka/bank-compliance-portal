import { Request } from 'express';
import { UserRole, LicenseType, ApplicationState } from '../generated/prisma/enums';


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

// Application types
export interface CreateApplicationRequest {
  institutionName: string;
  licenseType: LicenseType;
  description?: string;
}

export interface BasicApplicationResponse {
  id: string;
  institutionName: string;
  licenseType: LicenseType;
  description: string | null;
  state: ApplicationState;
  version: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationResponse extends BasicApplicationResponse {
  reviewedBy: {
    id: string;
    name: string;
  } | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
}

export interface CreateApplicationResponse {
  success: boolean;
  data: BasicApplicationResponse;
}

export interface GetApplicationsResponse {
  success: boolean;
  data: BasicApplicationResponse[];
}

export interface GetApplicationResponse {
  success: boolean;
  data: ApplicationResponse;
}
