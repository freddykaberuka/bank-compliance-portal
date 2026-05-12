import { useAppSelector } from '../app/hooks';
import { selectAuthRole } from '../features/auth/authSelectors';
import { AuthRole } from '../types/auth';
import {
  hasRole,
  hasAnyRole,
  isAdmin,
  isReviewer,
  isApprover,
  isApplicant,
  canReview,
  canApprove,
  canSubmitApplications,
} from '../utils/roleUtils';

export const useRole = () => {
  const userRole = useAppSelector(selectAuthRole);

  return {
    userRole,
    hasRole: (requiredRoles: AuthRole | AuthRole[]) => hasRole(userRole, requiredRoles),
    hasAnyRole: (...roles: AuthRole[]) => hasAnyRole(userRole, ...roles),
    isAdmin: () => isAdmin(userRole),
    isReviewer: () => isReviewer(userRole),
    isApprover: () => isApprover(userRole),
    isApplicant: () => isApplicant(userRole),
    canReview: () => canReview(userRole),
    canApprove: () => canApprove(userRole),
    canSubmitApplications: () => canSubmitApplications(userRole),
  };
};
