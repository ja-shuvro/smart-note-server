import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/ai-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AiController {
  static async suggestTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, content } = req.body;
      const result = await AiService.suggestTags(title, content);
      ApiResponse.success(res, 'AI topic classification and tags generated successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
