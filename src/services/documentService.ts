import { DocumentRepository } from '../repositories/documentRepository';
import { ApplicationRepository } from '../repositories/applicationRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { UserRole } from '../generated/prisma/enums';

export const DocumentService = {
  async uploadDocument(
    userId: string,
    applicationId: string,
    file: Express.Multer.File
  ) {
    const user = await UserRepository.getOrThrow(userId);
    const application = await ApplicationRepository.getOrThrow(applicationId);

    // Only applicants can upload to their own applications
    if (user.role === UserRole.APPLICANT && application.userId !== userId) {
      throw new AuthorizationError('Applicants can only upload documents to their own applications');
    }

    // Get the latest version for this file name
    const latestVersion = await DocumentRepository.getLatestVersion(applicationId, file.originalname);
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    const document = await DocumentRepository.create({
      applicationId,
      uploadedById: userId,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      version: nextVersion,
    });

    return {
      id: document.id,
      fileName: document.fileName,
      filePath: document.filePath,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      version: document.version,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt,
    };
  },

  async getDocument(userId: string, documentId: string) {
    const document = await DocumentRepository.getOrThrow(documentId);
    const application = await ApplicationRepository.getOrThrow(document.applicationId);
    const user = await UserRepository.getOrThrow(userId);

    // Authorization check
    if (user.role === UserRole.APPLICANT && application.userId !== userId) {
      throw new AuthorizationError('Applicants can only view documents of their own applications');
    }

    return {
      id: document.id,
      fileName: document.fileName,
      filePath: document.filePath,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      version: document.version,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt,
    };
  },

  async getApplicationDocuments(userId: string, applicationId: string) {
    const application = await ApplicationRepository.getOrThrow(applicationId);
    const user = await UserRepository.getOrThrow(userId);

    // Authorization check
    if (user.role === UserRole.APPLICANT && application.userId !== userId) {
      throw new AuthorizationError('Applicants can only view documents of their own applications');
    }

    const documents = await DocumentRepository.findByApplicationId(applicationId);

    return documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      version: doc.version,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt,
    }));
  },
};
