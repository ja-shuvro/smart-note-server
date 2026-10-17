import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// Explicit Indexes (as required by task)
// ==========================================

// 1. Unique email index for login lookups and registration uniqueness validation
userSchema.index({ email: 1 }, { unique: true });

// 2. Admin listing index to support paginated user directory sorted by newest first
userSchema.index({ createdAt: -1 });

// 3. Multikey index on interests array for Scenario 1 Aggregation ($unwind / $match)
userSchema.index({ interests: 1 });

// Password hashing pre-save hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password verification method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUserDocument>('User', userSchema);
