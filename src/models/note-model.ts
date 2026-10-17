import { Schema, model, Document, Types } from 'mongoose';

export interface INoteDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INoteDocument>(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// Explicit Indexes (as required by task)
// ==========================================

// 1. Compound index for regular users listing their own notes sorted by newest first.
// Matches Equality (user) + Sort (createdAt: -1).
// Also covers equality lookups on user via index prefix.
noteSchema.index({ user: 1, createdAt: -1 });

// 2. Global creation date index for Admin oversight listing of all system notes.
noteSchema.index({ createdAt: -1 });

export const Note = model<INoteDocument>('Note', noteSchema);
