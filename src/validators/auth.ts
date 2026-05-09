import { z } from 'zod';

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validate login input
 */
export const validateLoginInput = (data: unknown) => {
  try {
    return loginSchema.parse(data);
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
