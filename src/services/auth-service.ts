import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUserDocument } from '../models/user-model.js';
import { JwtPayload } from '../types/index.js';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';
import { RegisterInput, LoginInput } from '../validations/auth-validation.js';

export class AuthService {
  static signToken(user: IUserDocument): string {
    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as unknown as number,
    };

    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  }

  static async register(input: RegisterInput): Promise<{ user: Partial<IUserDocument>; token: string }> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new AppError('Email address is already registered', 409);
    }

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      interests: input.interests || [],
      role: 'user', // Default registered users are regular users
    });

    const token = this.signToken(user);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  static async login(input: LoginInput): Promise<{ user: Partial<IUserDocument>; token: string }> {
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.signToken(user);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  static async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}
