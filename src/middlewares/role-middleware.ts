import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';
import { AppError } from '../utils/app-error.js';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required before role check', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' lacks permission for this resource`,
          403
        )
      );
    }

    next();
  };
};
