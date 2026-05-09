import { Request, Response, NextFunction } from 'express';

/**
 * Async error handler wrapper
 * Eliminates boilerplate try-catch blocks in controllers
 * Automatically catches errors and passes to error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
