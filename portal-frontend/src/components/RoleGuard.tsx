import { ReactNode } from 'react';
import { AuthRole } from '../types/auth';
import { hasRole } from '../utils/roleUtils';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles: AuthRole | AuthRole[];
  userRole: AuthRole | null;
  fallback?: ReactNode;
}

export const RoleGuard = ({ children, requiredRoles, userRole, fallback = null }: RoleGuardProps) => {
  const isAuthorized = hasRole(userRole, requiredRoles);

  if (!isAuthorized) {
    return fallback;
  }

  return <>{children}</>;
};

interface RoleBasedButtonProps {
  requiredRoles: AuthRole | AuthRole[];
  userRole: AuthRole | null;
  onClick: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}

export const RoleBasedButton = ({
  requiredRoles,
  userRole,
  onClick,
  className = '',
  children,
  disabled = false,
}: RoleBasedButtonProps) => {
  const isAuthorized = hasRole(userRole, requiredRoles);

  if (!isAuthorized) {
    return null;
  }

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

interface RoleBasedActionProps {
  requiredRoles: AuthRole | AuthRole[];
  userRole: AuthRole | null;
  children: ReactNode;
}

export const RoleBasedAction = ({ requiredRoles, userRole, children }: RoleBasedActionProps) => {
  const isAuthorized = hasRole(userRole, requiredRoles);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
