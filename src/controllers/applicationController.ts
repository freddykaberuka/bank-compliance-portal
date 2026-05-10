import { Response } from 'express';
import { AuthenticatedRequest, CreateApplicationResponse, GetApplicationsResponse, GetApplicationResponse } from '../types';
import { ApplicationService } from '../services/applicationService';
import { validateCreateApplicationInput } from '../validators/application';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';


export const ApplicationController = {
  createApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response<CreateApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    let applicationData;
    try {
      applicationData = validateCreateApplicationInput(req.body);
    } catch (error: any) {
      throw new ValidationError('Invalid application data', error.errors);
    }

    const application = await ApplicationService.createApplication(
      req.user.userId,
      applicationData
    );

    res.status(201).json({
      success: true,
      data: application,
    });
  }),

  // Get all applications for the logedin user
  getApplications: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationsResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const applications = await ApplicationService.getUserApplications(req.user.userId);

    res.status(200).json({
      success: true,
      data: applications,
    });
  }),

  // applicationId is passed as URL param
  getApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id } = req.params;
    const application = await ApplicationService.getApplication(req.user.userId, id as string);

    res.status(200).json({
      success: true,
      data: application,
    });
  }),

  submitApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id } = req.params;
    const application = await ApplicationService.submitApplication(req.user.userId, id as string);

    res.status(200).json({
      success: true,
      data: application,
    });
  }),

  reviewApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id } = req.params;
    const application = await ApplicationService.reviewApplication(req.user.userId, id as string);

    res.status(200).json({
      success: true,
      data: application,
    });
  }),

  requestMoreInfo: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id } = req.params;
    const application = await ApplicationService.requestMoreInfo(req.user.userId, id as string);

    res.status(200).json({
      success: true,
      data: application,
    });
  }),

  approveApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id } = req.params;
    const application = await ApplicationService.approveApplication(req.user.userId, id as string);

    res.status(200).json({
      success: true,
      data: application,
    });
  }),

  rejectApplication: asyncHandler(async (req: AuthenticatedRequest, res: Response<GetApplicationResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const { id } = req.params;
    const application = await ApplicationService.rejectApplication(req.user.userId, id as string);

    res.status(200).json({
      success: true,
      data: application,
    });
  }),
};