import { Post, IPostDocument, PostStatus } from '../models/post-model.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { PaginationMeta } from '../utils/api-response.js';
import { CreatePostInput } from '../validations/post-validation.js';
import { AppError } from '../utils/app-error.js';
import { Types } from 'mongoose';

export interface PaginatedPostsResult {
  posts: IPostDocument[];
  pagination: PaginationMeta;
}

export class PostService {
  static async createPost(
    authorId: string,
    input: CreatePostInput,
    userRole = 'user'
  ): Promise<IPostDocument> {
    // Business rule: Admin-created posts can be auto-approved, standard users are 'pending'
    const initialStatus: PostStatus = userRole === 'admin' ? 'approved' : 'pending';

    const post = await Post.create({
      title: input.title,
      content: input.content,
      authorId,
      status: initialStatus,
      ...(userRole === 'admin'
        ? { approvedBy: new Types.ObjectId(authorId), approvedAt: new Date() }
        : {}),
    });
    return post;
  }

  static async updatePostStatus(
    postId: string,
    status: PostStatus,
    adminId: string
  ): Promise<IPostDocument> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new AppError('Invalid post ID format', 400);
    }

    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    post.status = status;
    post.approvedBy = new Types.ObjectId(adminId);
    post.approvedAt = new Date();
    await post.save();

    await post.populate([
      { path: 'authorId', select: 'name email role' },
      { path: 'approvedBy', select: 'name email' },
    ]);

    return post;
  }

  static async getPaginatedPosts(
    queryPage?: unknown,
    queryLimit?: unknown,
    statusFilter?: string,
    currentUserId?: string,
    isAdmin = false
  ): Promise<PaginatedPostsResult> {
    const { page, limit, skip } = parsePagination(queryPage, queryLimit);

    // Build filter based on role and status
    const filter: Record<string, unknown> = {};

    if (isAdmin) {
      if (statusFilter && statusFilter !== 'all') {
        filter.status = statusFilter;
      }
    } else {
      // Standard users only see approved posts OR their own pending/submitted posts
      if (currentUserId) {
        filter.$or = [{ status: 'approved' }, { authorId: currentUserId }];
      } else {
        filter.status = 'approved';
      }
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email role')
        .populate('approvedBy', 'name email'),
      Post.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);

    return { posts, pagination };
  }

  static async deletePost(postId: string, userId: string, isAdmin = false): Promise<void> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new AppError('Invalid post ID format', 400);
    }

    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Only author or admin can delete post
    if (!isAdmin && post.authorId.toString() !== userId) {
      throw new AppError('Forbidden: You can only delete your own posts', 403);
    }

    await Post.findByIdAndDelete(postId);
  }
}

