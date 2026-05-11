import { AuthorizationError, WorkflowError } from '../utils/errors';
import { UserRole, ApplicationState } from '../generated/prisma/enums';
import { isTerminalState } from '../workflow/applicationWorkflow';

type ApplicationEntity = {
  userId: string;
  state: ApplicationState;
  reviewedBy?: string | null;
};

type UserEntity = {
  id: string;
  role: UserRole;
};

// Centralized authorization rules of application workflow
 
export const ApplicationPolicy = {
  assertCanViewApplication(user: UserEntity, application: ApplicationEntity) {
    if (user.role === UserRole.APPLICANT && application.userId !== user.id) {
      throw new AuthorizationError('Applicants can only view their own applications');
    }
  },

  assertCanSubmitApplication(user: UserEntity, application: ApplicationEntity) {
    if (user.role !== UserRole.APPLICANT) {
      throw new AuthorizationError('Only applicants can submit applications');
    }

    if (application.userId !== user.id) {
      throw new AuthorizationError('Applicants can only submit their own applications');
    }

    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot submit application in terminal state: ${application.state}`);
    }
  },

  assertCanReviewApplication(user: UserEntity, application: ApplicationEntity) {
    if (user.role !== UserRole.REVIEWER) {
      throw new AuthorizationError('Only reviewers can review applications');
    }

    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot review application in terminal state: ${application.state}`);
    }
  },

  assertCanRequestMoreInfo(user: UserEntity, application: ApplicationEntity) {
    if (user.role !== UserRole.REVIEWER) {
      throw new AuthorizationError('Only reviewers can request more information');
    }

    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot request more information from terminal state: ${application.state}`);
    }
  },

  assertCanApproveApplication(user: UserEntity, application: ApplicationEntity) {
    if (user.role !== UserRole.APPROVER) {
      throw new AuthorizationError('Only approvers can approve applications');
    }

    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot approve application in terminal state: ${application.state}`);
    }

    if (application.reviewedBy && application.reviewedBy === user.id) {
      throw new AuthorizationError('Approver cannot approve an application they reviewed');
    }
  },

  assertCanRejectApplication(user: UserEntity, application: ApplicationEntity) {
    if (user.role !== UserRole.APPROVER) {
      throw new AuthorizationError('Only approvers can reject applications');
    }

    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot reject application in terminal state: ${application.state}`);
    }

    if (application.reviewedBy && application.reviewedBy === user.id) {
      throw new AuthorizationError('Approver cannot reject an application they reviewed');
    }
  },
};
