import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class PostController {
  static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await PostService.createPost(req.user!.id, req.body, req.user!.role);
      ApiResponse.created(res, 'Post submitted successfully', post);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const post = await PostService.updatePostStatus(id, status, req.user!.id);
      ApiResponse.success(res, `Post status updated to ${status}`, post);
    } catch (error) {
      next(error);
    }
  }

  static async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status } = req.query;
      const isAdmin = req.user?.role === 'admin';
      const result = await PostService.getPaginatedPosts(
        page,
        limit,
        status as string | undefined,
        req.user?.id,
        isAdmin
      );
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

  static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === 'admin';
      await PostService.deletePost(id, req.user!.id, isAdmin);
      ApiResponse.success(res, 'Post deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }
}

