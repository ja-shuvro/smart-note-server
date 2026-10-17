import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth-service.js';
import { AppError } from '../utils/app-error.js';

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Invalid Bearer token structure', 401));
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
