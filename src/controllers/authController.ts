import { Response } from 'express';
import { AuthenticatedRequest, LoginResponse, AuthMeResponse } from '../types';
import { AuthService } from '../services/authService';
import { validateLoginInput } from '../validators/auth';
import { ValidationError } from '../utils/errors';
import { extractTokenFromHeader } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';


export const AuthController = {
  login: asyncHandler(async (req: any, res: Response<LoginResponse>) => {
    let userData;
    try {
      userData = validateLoginInput(req.body);
    } catch (error: any) {
      throw new ValidationError('Invalid login credentials', error.errors);
    }

    const result = await AuthService.login(userData.email, userData.password);

    res.status(200).json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
      },
    });
  }),

  logout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const token = extractTokenFromHeader(req.headers.authorization);
    await AuthService.logout(token);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  getMe: asyncHandler(async (req: AuthenticatedRequest, res: Response<AuthMeResponse>) => {
    if (!req.user) {
      throw new Error('User not attached to request');
    }

    const user = await AuthService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),
};
