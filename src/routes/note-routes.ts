import { Router } from 'express';
import { NoteController } from '../controllers/note-controller.js';
import { authenticateJwt } from '../middlewares/auth-middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate-middleware.js';
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesQuerySchema,
} from '../validations/note-validation.js';

const router = Router();

// All notes endpoints require a valid JWT token
router.use(authenticateJwt);

router.get('/', validateQuery(listNotesQuerySchema), NoteController.getNotes);
router.post('/', validateBody(createNoteSchema), NoteController.createNote);
router.get('/:id', NoteController.getNote);
router.put('/:id', validateBody(updateNoteSchema), NoteController.updateNote);
router.delete('/:id', NoteController.deleteNote);

export const noteRoutes = router;
