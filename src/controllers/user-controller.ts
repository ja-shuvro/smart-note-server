import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await UserService.getPaginatedUsers(page, limit);
      ApiResponse.success(
        res,
        'Users list retrieved successfully',
        result.users,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);
      ApiResponse.success(res, 'User profile retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.adminCreateUser(req.body);
      ApiResponse.created(res, 'User created successfully by admin', user);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.adminUpdateUser(req.params.id, req.body);
      ApiResponse.success(res, 'User updated successfully by admin', user);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UserService.adminDeleteUser(req.params.id, req.user!.id);
      ApiResponse.success(res, 'User and associated data deleted successfully by admin');
    } catch (error) {
      next(error);
    }
  }
}
