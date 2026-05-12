import { AuthRole } from '../types/auth';

export const UserRoles = {
  APPLICANT: 'APPLICANT' as AuthRole,
  REVIEWER: 'REVIEWER' as AuthRole,
  APPROVER: 'APPROVER' as AuthRole,
  ADMIN: 'ADMIN' as AuthRole,
};

export const hasRole = (userRole: AuthRole | null, requiredRoles: AuthRole | AuthRole[]): boolean => {
  if (!userRole) {
    return false;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

export const hasAnyRole = (userRole: AuthRole | null, ...roles: AuthRole[]): boolean => {
  return hasRole(userRole, roles);
};

export const isAdmin = (userRole: AuthRole | null): boolean => {
  return userRole === UserRoles.ADMIN;
};

export const isReviewer = (userRole: AuthRole | null): boolean => {
  return userRole === UserRoles.REVIEWER;
};

export const isApprover = (userRole: AuthRole | null): boolean => {
  return userRole === UserRoles.APPROVER;
};

export const isApplicant = (userRole: AuthRole | null): boolean => {
  return userRole === UserRoles.APPLICANT;
};

export const canReview = (userRole: AuthRole | null): boolean => {
  return hasAnyRole(userRole, UserRoles.REVIEWER, UserRoles.ADMIN);
};

export const canApprove = (userRole: AuthRole | null): boolean => {
  return hasAnyRole(userRole, UserRoles.APPROVER, UserRoles.ADMIN);
};

export const canSubmitApplications = (userRole: AuthRole | null): boolean => {
  return hasAnyRole(userRole, UserRoles.APPLICANT);
};
