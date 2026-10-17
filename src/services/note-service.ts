import { Note, INoteDocument } from '../models/note-model.js';
import { JwtPayload } from '../types/index.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination, createPaginationMeta } from '../utils/pagination.js';
import { PaginationMeta } from '../utils/api-response.js';
import { CreateNoteInput, UpdateNoteInput } from '../validations/note-validation.js';

export interface PaginatedNotesResult {
  notes: INoteDocument[];
  pagination: PaginationMeta;
}

export class NoteService {
  static async createNote(userId: string, input: CreateNoteInput): Promise<INoteDocument> {
    const note = await Note.create({
      title: input.title,
      content: input.content,
      user: userId,
    });
    return note;
  }

  static async getPaginatedNotes(
    userContext: JwtPayload,
    queryPage?: unknown,
    queryLimit?: unknown,
    all?: string
  ): Promise<PaginatedNotesResult> {
    const { page, limit, skip } = parsePagination(queryPage, queryLimit);

    const isAllNotesRequested = all === 'true';

    // RBAC check: only admins can request system-wide notes view
    if (isAllNotesRequested && userContext.role !== 'admin') {
      throw new AppError('Forbidden: Only administrators can view all system notes', 403);
    }

    const filter = isAllNotesRequested ? {} : { user: userContext.id };

    // Query 1: Find matching notes using the respective indexes
    // - Regular user uses compound index: { user: 1, createdAt: -1 }
    // - Admin global view uses index: { createdAt: -1 }
    const query = Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (isAllNotesRequested) {
      query.populate('user', 'name email role');
    }

    const [notes, total] = await Promise.all([
      query.exec(),
      Note.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);

    return { notes, pagination };
  }

  static async getNoteById(noteId: string, userContext: JwtPayload): Promise<INoteDocument> {
    const note = await Note.findById(noteId).populate('user', 'name email role');
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // RBAC: regular user can only access own note; admin can access any
    const rawUser = note.user as unknown;
    const ownerId =
      rawUser && typeof rawUser === 'object' && '_id' in rawUser
        ? String((rawUser as { _id: unknown })._id)
        : String(rawUser);

    if (userContext.role !== 'admin' && ownerId !== userContext.id) {
      throw new AppError('Forbidden: You do not have permission to view this note', 403);
    }

    return note;
  }

  static async updateNote(
    noteId: string,
    userContext: JwtPayload,
    input: UpdateNoteInput
  ): Promise<INoteDocument> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Ownership check
    if (userContext.role !== 'admin' && note.user.toString() !== userContext.id) {
      throw new AppError('Forbidden: You do not have permission to modify this note', 403);
    }

    if (input.title !== undefined) note.title = input.title;
    if (input.content !== undefined) note.content = input.content;

    await note.save();
    return note;
  }

  static async deleteNote(noteId: string, userContext: JwtPayload): Promise<void> {
    const note = await Note.findById(noteId);
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Ownership check (admin can delete any note)
    if (userContext.role !== 'admin' && note.user.toString() !== userContext.id) {
      throw new AppError('Forbidden: You do not have permission to delete this note', 403);
    }

    await Note.findByIdAndDelete(noteId);
  }
}
