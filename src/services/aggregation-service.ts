import { Types } from 'mongoose';
import { User } from '../models/user-model.js';
import { AppError } from '../utils/app-error.js';

export interface InterestGroupResult {
  interest: string;
  count: number;
  users: Array<{
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
  }>;
}

export class AggregationService {
  /**
   * Scenario 1: Group Users by Interests
   * Constraint: Exactly one collection.aggregate() call.
   * Index: Supported by userSchema.index({ interests: 1 })
   */
  static async groupByInterests(): Promise<InterestGroupResult[]> {
    const results = await User.aggregate<InterestGroupResult>([
      // Stage 1: Filter documents with non-empty interests array (uses { interests: 1 } index)
      {
        $match: {
          interests: { $exists: true, $type: 'array', $ne: [] },
        },
      },
      // Stage 2: Deconstruct interests array so each interest creates an individual document
      {
        $unwind: '$interests',
      },
      // Stage 3: Normalize interest casing and project minimal user payload
      {
        $project: {
          interest: { $toLower: { $trim: { input: '$interests' } } },
          user: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            role: '$role',
          },
        },
      },
      // Stage 4: Group by the normalized interest string and collect users
      {
        $group: {
          _id: '$interest',
          count: { $sum: 1 },
          users: { $push: '$user' },
        },
      },
      // Stage 5: Sort by popularity (highest count first), then alphabetically
      {
        $sort: { count: -1, _id: 1 },
      },
      // Stage 6: Format final response projection
      {
        $project: {
          _id: 0,
          interest: '$_id',
          count: 1,
          users: 1,
        },
      },
    ]);

    return results;
  }

  /**
   * Scenario 2: Retrieve all posts belonging to a particular user
   * Constraint: Single aggregation pipeline with a $lookup stage.
   * Index: Supported by postSchema.index({ authorId: 1, createdAt: -1 })
   */
  static async getUserPostsViaLookup(targetUserId: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('Invalid user ID format', 400);
    }

    const objectId = new Types.ObjectId(targetUserId);

    const pipelineResults = await User.aggregate([
      // Stage 1: Match the specific target user by _id (uses primary key index)
      {
        $match: { _id: objectId },
      },
      // Stage 2: Single $lookup stage joining posts collection
      // uses { authorId: 1, createdAt: -1 } index on posts
      {
        $lookup: {
          from: 'posts',
          let: { currentUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$authorId', '$$currentUserId'] },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
          ],
          as: 'posts',
        },
      },
      // Stage 3: Project safe fields excluding password and internal versions
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          createdAt: 1,
          updatedAt: 1,
          totalPosts: { $size: '$posts' },
          posts: 1,
        },
      },
    ]);

    if (!pipelineResults || pipelineResults.length === 0) {
      throw new AppError('User not found', 404);
    }

    return pipelineResults[0];
  }
}
