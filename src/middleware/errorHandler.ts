import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { ApiError, ValidationError } from '../utils/errors';

// Global error handling middleware

export const errorHandler = (
  err: any,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_SERVER_ERROR';
  let errors: Record<string, string[]> | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'ERROR';
    errors = err instanceof ValidationError ? err.details : undefined;
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    code,
    message,
    ...(isDevelopment && err instanceof Error ? { stack: err.stack } : {}),
  });

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors && { errors }),
  });
};