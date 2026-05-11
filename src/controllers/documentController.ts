import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { DocumentService } from '../services/documentService';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';

export const DocumentController = {
  uploadDocument: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    if (!req.file) {
      throw new ValidationError('No file provided');
    }

    const { id: applicationId } = req.params;
    const document = await DocumentService.uploadDocument(
      req.user.userId,
      applicationId as string,
      req.file
    );

    res.status(201).json({
      success: true,
      data: document,
    });
  }),

  getDocument: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { documentId } = req.params;
    const document = await DocumentService.getDocument(req.user.userId, documentId as string);

    res.status(200).json({
      success: true,
      data: document,
    });
  }),

  getApplicationDocuments: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id: applicationId } = req.params;
    const documents = await DocumentService.getApplicationDocuments(req.user.userId, applicationId as string);

    res.status(200).json({
      success: true,
      data: documents,
    });
  }),
};
