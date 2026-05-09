import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { AppError, ValidationError } from '../utils/errors';

// Global error handling middleware

export const errorHandler = (
  err: any,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  // Default to 500 error
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_SERVER_ERROR';
  let errors: Record<string, string[]> | undefined;

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'ERROR';

    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }
  // Handle unhandled errors
  else if (err instanceof Error) {
    message = err.message;
  }

  // Log error for debugging
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    code,
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors && { errors }),
  });
};