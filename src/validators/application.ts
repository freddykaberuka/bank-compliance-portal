import { z } from 'zod';
import { LicenseType } from '../generated/prisma/enums';

/**
 * Application creation validation schema
 */
export const createApplicationSchema = z.object({
  institutionName: z.string()
    .min(2, 'Institution name must be at least 2 characters')
    .max(100, 'Institution name must be less than 100 characters')
    .trim(),
  licenseType: z.nativeEnum(LicenseType),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

/**
 * Validate application creation input
 */
export const validateCreateApplicationInput = (data: unknown) => {
  try {
    return createApplicationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      (error.issues as any[]).forEach((err: any) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      throw { errors };
    }
    throw error;
  }
};