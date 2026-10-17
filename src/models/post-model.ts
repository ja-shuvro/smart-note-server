import { Schema, model, Document, Types } from 'mongoose';

export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface IPostDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  authorId: Types.ObjectId;
  status: PostStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPostDocument>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// Explicit Indexes (as required by task)
// ==========================================

// 1. Compound index on authorId and createdAt to support Scenario 2 $lookup aggregation
// and retrieving author posts sorted newest first.
postSchema.index({ authorId: 1, createdAt: -1 });

// 2. Compound index on status and createdAt to support admin approval queue filtering
postSchema.index({ status: 1, createdAt: -1 });

// 3. Multikey index on tags array to support interest-based personalized feed filtering
postSchema.index({ tags: 1 });

export const Post = model<IPostDocument>('Post', postSchema);

