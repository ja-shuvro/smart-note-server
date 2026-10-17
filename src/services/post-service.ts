import { Post, IPostDocument, PostStatus } from '../models/post-model.js';
import { User } from '../models/user-model.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { PaginationMeta } from '../utils/api-response.js';
import { CreatePostInput } from '../validations/post-validation.js';
import { AppError } from '../utils/app-error.js';
import { Types, PipelineStage } from 'mongoose';

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
      tags: input.tags || [],
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
    const userObjectId =
      currentUserId && Types.ObjectId.isValid(currentUserId)
        ? new Types.ObjectId(currentUserId)
        : null;

    if (isAdmin) {
      if (statusFilter && statusFilter !== 'all') {
        filter.status = statusFilter;
      }
    } else {
      // Standard users only see approved posts OR their own pending/submitted posts
      if (userObjectId) {
        filter.$or = [{ status: 'approved' }, { authorId: userObjectId }];
      } else {
        filter.status = 'approved';
      }
    }

    // Retrieve user interests for personalized ranking
    let userInterests: string[] = [];
    if (userObjectId) {
      const currentUserDoc = await User.findById(userObjectId).select('interests').lean();
      if (currentUserDoc?.interests && Array.isArray(currentUserDoc.interests)) {
        userInterests = currentUserDoc.interests
          .map((i: string) => (typeof i === 'string' ? i.trim().toLowerCase() : ''))
          .filter(Boolean);
      }
    }

    // Aggregation pipeline: prioritize approved posts matching user's interests, followed by recency
    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $addFields: {
          matchScore:
            userInterests.length > 0
              ? {
                  $size: {
                    $setIntersection: [
                      {
                        $map: {
                          input: { $ifNull: ['$tags', []] },
                          as: 't',
                          in: { $toLower: { $trim: { input: '$$t' } } },
                        },
                      },
                      userInterests,
                    ],
                  },
                }
              : 0,
        },
      },
      {
        $sort: {
          matchScore: -1,
          createdAt: -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'authorId',
          pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
        },
      },
      { $unwind: { path: '$authorId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'approvedBy',
          foreignField: '_id',
          as: 'approvedBy',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$approvedBy', preserveNullAndEmptyArrays: true } },
    ];

    const [posts, total] = await Promise.all([
      Post.aggregate(pipeline),
      Post.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);

    return { posts: posts as unknown as IPostDocument[], pagination };
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

