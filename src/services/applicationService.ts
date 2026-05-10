import { ApplicationRepository } from '../repositories/applicationRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { UserRole } from '../generated/prisma/enums';


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
};