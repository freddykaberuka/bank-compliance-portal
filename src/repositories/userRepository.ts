import prisma from '../prisma';
import { NotFoundError } from '../utils/errors';

export const UserRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async getOrThrow(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  },

  // Return public profile without sensitive data
  async getProfile(id: string) {
    const user = await this.getOrThrow(id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
};
