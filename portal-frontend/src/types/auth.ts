export type AuthRole = 'APPLICANT' | 'REVIEWER' | 'APPROVER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  role: AuthRole | null;
  loading: boolean;
  error: string | null;
}
