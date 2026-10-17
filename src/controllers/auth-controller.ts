import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      ApiResponse.created(res, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      ApiResponse.success(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      ApiResponse.success(res, 'Current user profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }
}
