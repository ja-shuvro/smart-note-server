import { Post, IPostDocument } from '../models/post-model.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { PaginationMeta } from '../utils/api-response.js';
import { CreatePostInput } from '../validations/post-validation.js';

export interface PaginatedPostsResult {
  posts: IPostDocument[];
  pagination: PaginationMeta;
}

export class PostService {
  static async createPost(authorId: string, input: CreatePostInput): Promise<IPostDocument> {
    const post = await Post.create({
      title: input.title,
      content: input.content,
      authorId,
    });
    return post;
  }

  static async getPaginatedPosts(
    queryPage?: unknown,
    queryLimit?: unknown
  ): Promise<PaginatedPostsResult> {
    const { page, limit, skip } = parsePagination(queryPage, queryLimit);

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email role'),
      Post.countDocuments(),
    ]);

    const pagination = createPaginationMeta(total, page, limit);

    return { posts, pagination };
  }
}
