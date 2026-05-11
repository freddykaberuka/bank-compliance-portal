import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository';
import { blacklistToken, generateToken } from '../utils/jwt';
import { AuthenticationError } from '../utils/errors';
import { JWTPayload } from '../types';


export const AuthService = {
//   user login - validate credentials and return JWT token
  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Create JWT payload with essential user info
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  async logout(token: string) {
    blacklistToken(token);
    return {
      success: true,
    };
  },

  async getProfile(userId: string) {
    const user = await UserRepository.getProfile(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
};
