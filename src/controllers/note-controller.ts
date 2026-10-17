import { Request, Response, NextFunction } from 'express';
import { NoteService } from '../services/note-service.js';
import { ApiResponse } from '../utils/api-response.js';

export class NoteController {
  static async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await NoteService.createNote(req.user!.id, req.body);
      ApiResponse.created(res, 'Note created successfully', note);
    } catch (error) {
      next(error);
    }
  }

  static async getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, all } = req.query;
      const result = await NoteService.getPaginatedNotes(
        req.user!,
        page,
        limit,
        typeof all === 'string' ? all : undefined
      );

      ApiResponse.success(
        res,
        'Notes retrieved successfully',
        result.notes,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  static async getNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await NoteService.getNoteById(req.params.id, req.user!);
      ApiResponse.success(res, 'Note retrieved successfully', note);
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await NoteService.updateNote(req.params.id, req.user!, req.body);
      ApiResponse.success(res, 'Note updated successfully', note);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NoteService.deleteNote(req.params.id, req.user!);
      ApiResponse.success(res, 'Note deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
