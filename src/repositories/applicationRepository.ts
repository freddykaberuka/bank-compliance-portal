import prisma from '../prisma';
import { ConflictError, NotFoundError } from '../utils/errors';
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

  async createWithTransaction(tx: any, data: {
    userId: string;
    institutionName: string;
    licenseType: LicenseType;
    description?: string;
  }) {
    return tx.application.create({
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


  async updateState(
    id: string,
    newState: ApplicationState,
    metadata?: {
      reviewedBy?: string;
      approvedBy?: string;
    },
    expectedVersion?: number
  ) {
    const updateData: any = {
      state: newState,
      version: {
        increment: 1,
      },
    };

    if (metadata?.reviewedBy !== undefined) {
      updateData.reviewedBy = metadata.reviewedBy;
    }
    if (metadata?.approvedBy !== undefined) {
      updateData.approvedBy = metadata.approvedBy;
    }

  if (expectedVersion == null) {
    return prisma.application.update({
      where: { id },
      data: updateData,
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
  }

    const [updateResult, refreshedApplication] = await prisma.$transaction([
      prisma.application.updateMany({
        where: {
          id,
          version: expectedVersion,
        },
        data: updateData,
      }),
      prisma.application.findUnique({
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
      }),
    ]);

    if (updateResult.count === 0) {
      if (!refreshedApplication) {
        throw new NotFoundError('Application', id);
      }
      throw new ConflictError(
        `Stale application version. Expected ${expectedVersion}, actual ${refreshedApplication.version}`
      );
    }

    if (!refreshedApplication) {
      throw new NotFoundError('Application', id);
    }

    return refreshedApplication;
  },
};