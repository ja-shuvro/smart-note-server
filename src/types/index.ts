import { Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INote {
  _id: Types.ObjectId;
  title: string;
  content: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost {
  _id: Types.ObjectId;
  title: string;
  content: string;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}
