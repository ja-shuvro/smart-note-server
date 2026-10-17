import { Request, Response, NextFunction } from 'express';
import { AggregationService } from '../services/aggregation-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AggregationController {
  /**
   * Scenario 1: Group by Interests
   */
  static async getUsersByInterests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AggregationService.groupByInterests();
      ApiResponse.success(res, 'Users grouped by interests successfully (Scenario 1)', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scenario 2: User Posts ($lookup)
   */
  static async getUserPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const data = await AggregationService.getUserPostsViaLookup(userId);
      ApiResponse.success(res, 'User posts retrieved via $lookup successfully (Scenario 2)', data);
    } catch (error) {
      next(error);
    }
  }
}
