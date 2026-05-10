import prisma from '../prisma';
import { NotFoundError } from '../utils/errors';
import { LicenseType, ApplicationState } from '../generated/prisma/enums';

export const ApplicationRepository = {
  async create(data: {
    userId: string;
    institutionName: string;
    licenseType: LicenseType;
    description?: string;
  }) {
    return prisma.application.create({
      data: {
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
  },

  
  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
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
  },
  async getOrThrow(id: string) {
    const application = await this.findById(id);
    if (!application) {
      throw new NotFoundError('Application', id);
    }
    return application;
  },


  async findByUserId(userId: string) {
    return prisma.application.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });
  },

  // Admins and reviewers can see all applications
  async findAll() {
    return prisma.application.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  },
};