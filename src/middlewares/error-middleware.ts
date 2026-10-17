import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      issue: e.message,
    }));
  } else if ('code' in err && (err as { code: unknown }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    details = (err as { keyValue?: unknown }).keyValue;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Authorization denied';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID resource identifier';
  } else {
    message = err.message || message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
