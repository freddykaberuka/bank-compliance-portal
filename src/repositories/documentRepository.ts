import prisma from '../prisma';
import { NotFoundError } from '../utils/errors';

export const DocumentRepository = {
  async getLatestVersion(applicationId: string, fileName: string) {
    return prisma.document.findFirst({
      where: {
        applicationId,
        fileName,
      },
      orderBy: {
        version: 'desc',
      },
    });
  },

  async create(data: {
    applicationId: string;
    uploadedById: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    version: number;
  }) {
    return prisma.document.create({
      data,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async getOrThrow(id: string) {
    const document = await this.findById(id);
    if (!document) {
      throw new NotFoundError('Document', id);
    }
    return document;
  },

  async findByApplicationId(applicationId: string) {
    return prisma.document.findMany({
      where: { applicationId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ fileName: 'asc' }, { version: 'desc' }],
    });
  },
};
