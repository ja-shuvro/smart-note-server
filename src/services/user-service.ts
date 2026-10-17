import { User, IUserDocument } from '../models/user-model.js';
import { Note } from '../models/note-model.js';
import { Post } from '../models/post-model.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { PaginationMeta } from '../utils/api-response.js';
import { AdminCreateUserInput, AdminUpdateUserInput } from '../validations/user-validation.js';

export interface PaginatedUsersResult {
  users: IUserDocument[];
  pagination: PaginationMeta;
}

export class UserService {
  /**
   * List users with pagination
   * Index: Supported by userSchema.index({ createdAt: -1 })
   */
  static async getPaginatedUsers(
    queryPage?: unknown,
    queryLimit?: unknown
  ): Promise<PaginatedUsersResult> {
    const { page, limit, skip } = parsePagination(queryPage, queryLimit);

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(),
    ]);

    const pagination = createPaginationMeta(total, page, limit);

    return { users, pagination };
  }

  /**
   * Read single user by ID
   * Index: Supported by default _id index
   */
  static async getUserById(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  /**
   * Admin provisions new user
   */
  static async adminCreateUser(input: AdminCreateUserInput): Promise<Partial<IUserDocument>> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new AppError('Email address is already registered', 409);
    }

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      interests: input.interests || [],
    });

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Admin updates existing user
   */
  static async adminUpdateUser(
    userId: string,
    input: AdminUpdateUserInput
  ): Promise<IUserDocument> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.role !== undefined) user.role = input.role;
    if (input.interests !== undefined) user.interests = input.interests;

    await user.save();
    return user;
  }

  /**
   * Admin deletes a user and cascades deletion to user notes and posts
   */
  static async adminDeleteUser(userId: string, currentAdminId: string): Promise<void> {
    if (userId === currentAdminId) {
      throw new AppError('Admin cannot delete their own active account', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Cascade delete user's personal notes and posts
    await Promise.all([
      Note.deleteMany({ user: userId }),
      Post.deleteMany({ authorId: userId }),
      User.findByIdAndDelete(userId),
    ]);
  }
}
