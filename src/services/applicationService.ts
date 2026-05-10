import { ApplicationRepository } from '../repositories/applicationRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthorizationError, NotFoundError, WorkflowError } from '../utils/errors';
import { UserRole, ApplicationState } from '../generated/prisma/enums';
import { canTransition, isTerminalState } from '../workflow/applicationWorkflow';


export const ApplicationService = {
  async createApplication(userId: string, data: {
    institutionName: string;
    licenseType: any;
    description?: string;
  }) {
    const user = await UserRepository.getOrThrow(userId);
    if (user.role !== UserRole.APPLICANT) {
      throw new AuthorizationError('Only applicants can create applications');
    }

    const application = await ApplicationRepository.create({
      userId,
      ...data,
    });

    return {
      id: application.id,
      institutionName: application.institutionName,
      licenseType: application.licenseType,
      description: application.description,
      state: application.state,
      version: application.version,
      user: application.user,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  },

  async getApplication(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);

    const user = await UserRepository.getOrThrow(userId);
    if (user.role === UserRole.APPLICANT && application.userId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    return {
      id: application.id,
      institutionName: application.institutionName,
      licenseType: application.licenseType,
      description: application.description,
      state: application.state,
      version: application.version,
      user: application.user,
      reviewedBy: application.reviewedByUser,
      approvedBy: application.approvedByUser,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  },

  async getUserApplications(userId: string) {
    const user = await UserRepository.getOrThrow(userId);

    let applications;
    if (user.role === UserRole.APPLICANT) {
      applications = await ApplicationRepository.findByUserId(userId);
    } else {
      applications = await ApplicationRepository.findAll();
    }

    return applications.map(app => ({
      id: app.id,
      institutionName: app.institutionName,
      licenseType: app.licenseType,
      description: app.description,
      state: app.state,
      version: app.version,
      user: app.user,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));
  },

  async submitApplication(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    if (user.role !== UserRole.APPLICANT) {
      throw new AuthorizationError('Only applicants can submit applications');
    }
    if (application.userId !== userId) {
      throw new AuthorizationError('Applicants can only submit their own applications');
    }
    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot submit application in terminal state: ${application.state}`);
    }
    if (!canTransition(application.state, ApplicationState.SUBMITTED)) {
      throw new WorkflowError(`Cannot submit application from ${application.state}`);
    }

    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.SUBMITTED
    );

    return {
      id: updatedApplication.id,
      institutionName: updatedApplication.institutionName,
      licenseType: updatedApplication.licenseType,
      description: updatedApplication.description,
      state: updatedApplication.state,
      version: updatedApplication.version,
      user: updatedApplication.user,
      reviewedBy: updatedApplication.reviewedByUser,
      approvedBy: updatedApplication.approvedByUser,
      createdAt: updatedApplication.createdAt,
      updatedAt: updatedApplication.updatedAt,
    };
  },

  async reviewApplication(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    if (user.role !== UserRole.REVIEWER && user.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Only reviewers or admins can review applications');
    }
    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot review application in terminal state: ${application.state}`);
    }

    const nextState = application.state === ApplicationState.SUBMITTED
      ? ApplicationState.UNDER_REVIEW
      : ApplicationState.REVIEWED;

    if (!canTransition(application.state, nextState)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to ${nextState}`);
    }

    const metadata = application.state === ApplicationState.UNDER_REVIEW
      ? { reviewedBy: userId }
      : undefined;

    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      nextState,
      metadata
    );

    return {
      id: updatedApplication.id,
      institutionName: updatedApplication.institutionName,
      licenseType: updatedApplication.licenseType,
      description: updatedApplication.description,
      state: updatedApplication.state,
      version: updatedApplication.version,
      user: updatedApplication.user,
      reviewedBy: updatedApplication.reviewedByUser,
      approvedBy: updatedApplication.approvedByUser,
      createdAt: updatedApplication.createdAt,
      updatedAt: updatedApplication.updatedAt,
    };
  },

  async requestMoreInfo(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    if (user.role !== UserRole.REVIEWER && user.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Only reviewers or admins can request more information');
    }
    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot request more information from terminal state: ${application.state}`);
    }
    if (!canTransition(application.state, ApplicationState.NEEDS_MORE_INFO)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to NEEDS_MORE_INFO`);
    }

    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.NEEDS_MORE_INFO
    );

    return {
      id: updatedApplication.id,
      institutionName: updatedApplication.institutionName,
      licenseType: updatedApplication.licenseType,
      description: updatedApplication.description,
      state: updatedApplication.state,
      version: updatedApplication.version,
      user: updatedApplication.user,
      reviewedBy: updatedApplication.reviewedByUser,
      approvedBy: updatedApplication.approvedByUser,
      createdAt: updatedApplication.createdAt,
      updatedAt: updatedApplication.updatedAt,
    };
  },

  async approveApplication(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    if (user.role !== UserRole.APPROVER && user.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Only approvers or admins can approve applications');
    }
    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot approve application in terminal state: ${application.state}`);
    }
    if (!canTransition(application.state, ApplicationState.APPROVED)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to APPROVED`);
    }

    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.APPROVED,
      { approvedBy: userId }
    );

    return {
      id: updatedApplication.id,
      institutionName: updatedApplication.institutionName,
      licenseType: updatedApplication.licenseType,
      description: updatedApplication.description,
      state: updatedApplication.state,
      version: updatedApplication.version,
      user: updatedApplication.user,
      reviewedBy: updatedApplication.reviewedByUser,
      approvedBy: updatedApplication.approvedByUser,
      createdAt: updatedApplication.createdAt,
      updatedAt: updatedApplication.updatedAt,
    };
  },

  async rejectApplication(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    if (user.role !== UserRole.APPROVER && user.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Only approvers or admins can reject applications');
    }
    if (isTerminalState(application.state)) {
      throw new WorkflowError(`Cannot reject application in terminal state: ${application.state}`);
    }
    if (!canTransition(application.state, ApplicationState.REJECTED)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to REJECTED`);
    }

    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.REJECTED,
      { approvedBy: userId }
    );

    return {
      id: updatedApplication.id,
      institutionName: updatedApplication.institutionName,
      licenseType: updatedApplication.licenseType,
      description: updatedApplication.description,
      state: updatedApplication.state,
      version: updatedApplication.version,
      user: updatedApplication.user,
      reviewedBy: updatedApplication.reviewedByUser,
      approvedBy: updatedApplication.approvedByUser,
      createdAt: updatedApplication.createdAt,
      updatedAt: updatedApplication.updatedAt,
    };
  },
};