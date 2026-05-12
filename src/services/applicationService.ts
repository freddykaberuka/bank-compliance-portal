import prisma from '../prisma';
import { ApplicationRepository } from '../repositories/applicationRepository';
import { AuditService } from './auditService';
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

const updateApplicationStateWithAudit = async (
  applicationId: string,
  actorId: string,
  action: string,
  previousState: ApplicationState | null,
  newState: ApplicationState,
  updateData: Record<string, unknown>,
  expectedVersion?: number
) => {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.application.updateMany({
      where: expectedVersion != null ? { id: applicationId, version: expectedVersion } : { id: applicationId },
      data: updateData,
    });

    if (updateResult.count === 0) {
      const current = await tx.application.findUnique({ where: { id: applicationId } });
      if (!current) {
        throw new NotFoundError('Application', applicationId);
      }
      throw new ConflictError(
        `Stale application version. Expected ${expectedVersion}, actual ${current.version}`
      );
    }

    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    await AuditService.logApplicationActionTransaction(tx, {
      userId: actorId,
      applicationId,
      action,
      previousState,
      newState,
    });

    return application;
  });
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

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          userId,
          ...data,
          state: ApplicationState.DRAFT,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      await AuditService.logApplicationActionTransaction(tx, {
        userId,
        applicationId: created.id,
        action: 'CREATE_APPLICATION',
        previousState: null,
        newState: created.state,
      });

      return created;
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
    const updatedApplication = await updateApplicationStateWithAudit(
      applicationId,
      userId,
      'SUBMIT_APPLICATION',
      application.state,
      ApplicationState.SUBMITTED,
      {
        state: ApplicationState.SUBMITTED,
        version: {
          increment: 1,
        },
      },
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
    const updatedApplication = await updateApplicationStateWithAudit(
      applicationId,
      userId,
      'REVIEW_APPLICATION',
      application.state,
      nextState,
      {
        state: nextState,
        version: {
          increment: 1,
        },
        ...(metadata || {}),
      },
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
    const updatedApplication = await updateApplicationStateWithAudit(
      applicationId,
      userId,
      'REQUEST_MORE_INFO',
      application.state,
      ApplicationState.NEEDS_MORE_INFO,
      {
        state: ApplicationState.NEEDS_MORE_INFO,
        version: {
          increment: 1,
        },
      },
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
    const updatedApplication = await updateApplicationStateWithAudit(
      applicationId,
      userId,
      'APPROVE_APPLICATION',
      application.state,
      ApplicationState.APPROVED,
      {
        state: ApplicationState.APPROVED,
        version: {
          increment: 1,
        },
        approvedBy: userId,
      },
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
    const updatedApplication = await updateApplicationStateWithAudit(
      applicationId,
      userId,
      'REJECT_APPLICATION',
      application.state,
      ApplicationState.REJECTED,
      {
        state: ApplicationState.REJECTED,
        version: {
          increment: 1,
        },
        approvedBy: userId,
      },
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