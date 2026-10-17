import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class PostController {
  static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await PostService.createPost(req.user!.id, req.body);
      ApiResponse.created(res, 'Post published successfully', post);
    } catch (error) {
      next(error);
    }
  }

  static async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await PostService.getPaginatedPosts(page, limit);
      ApiResponse.success(
        res,
        'Posts retrieved successfully',
        result.posts,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }
}
