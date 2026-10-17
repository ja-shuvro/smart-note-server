import { Schema, model, Document, Types } from 'mongoose';

export interface IPostDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  authorId: Types.ObjectId;
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
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
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

export const Post = model<IPostDocument>('Post', postSchema);
