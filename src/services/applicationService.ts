import { ApplicationRepository } from '../repositories/applicationRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthorizationError, ConflictError, NotFoundError, WorkflowError } from '../utils/errors';
import { UserRole, ApplicationState } from '../generated/prisma/enums';
import { canTransition } from '../workflow/applicationWorkflow';
import { ApplicationPolicy } from '../middleware/applicationPolicy';

const resolveExpectedVersion = (application: any, expectedVersion?: number) => {
  if (expectedVersion !== undefined && expectedVersion !== application.version) {
    throw new ConflictError(
      `Stale application version. Expected ${expectedVersion}, actual ${application.version}`
    );
  }
  return expectedVersion ?? application.version;
};

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
    ApplicationPolicy.assertCanViewApplication(user, application);

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

  async submitApplication(userId: string, applicationId: string, expectedVersion?: number) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    ApplicationPolicy.assertCanSubmitApplication(user, application);
    if (!canTransition(application.state, ApplicationState.SUBMITTED)) {
      throw new WorkflowError(`Cannot submit application from ${application.state}`);
    }

    const versionToUse = resolveExpectedVersion(application, expectedVersion);
    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.SUBMITTED,
      undefined,
      versionToUse
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

  async reviewApplication(userId: string, applicationId: string, expectedVersion?: number) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    ApplicationPolicy.assertCanReviewApplication(user, application);

    const nextState = application.state === ApplicationState.SUBMITTED
      ? ApplicationState.UNDER_REVIEW
      : ApplicationState.REVIEWED;

    if (!canTransition(application.state, nextState)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to ${nextState}`);
    }

    const metadata = application.state === ApplicationState.UNDER_REVIEW
      ? { reviewedBy: userId }
      : undefined;

    const versionToUse = resolveExpectedVersion(application, expectedVersion);
    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      nextState,
      metadata,
      versionToUse
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

  async requestMoreInfo(userId: string, applicationId: string, expectedVersion?: number) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    ApplicationPolicy.assertCanRequestMoreInfo(user, application);
    if (!canTransition(application.state, ApplicationState.NEEDS_MORE_INFO)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to NEEDS_MORE_INFO`);
    }

    const versionToUse = resolveExpectedVersion(application, expectedVersion);
    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.NEEDS_MORE_INFO,
      undefined,
      versionToUse
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

  async approveApplication(userId: string, applicationId: string, expectedVersion?: number) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    ApplicationPolicy.assertCanApproveApplication(user, application);
    if (!canTransition(application.state, ApplicationState.APPROVED)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to APPROVED`);
    }

    const versionToUse = resolveExpectedVersion(application, expectedVersion);
    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.APPROVED,
      { approvedBy: userId },
      versionToUse
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

  async rejectApplication(userId: string, applicationId: string, expectedVersion?: number) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    ApplicationPolicy.assertCanRejectApplication(user, application);
    if (!canTransition(application.state, ApplicationState.REJECTED)) {
      throw new WorkflowError(`Cannot transition from ${application.state} to REJECTED`);
    }

    const versionToUse = resolveExpectedVersion(application, expectedVersion);
    const updatedApplication = await ApplicationRepository.updateState(
      applicationId,
      ApplicationState.REJECTED,
      { approvedBy: userId },
      versionToUse
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