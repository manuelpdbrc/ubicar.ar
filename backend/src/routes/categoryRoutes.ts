import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createCategorySchema, updateCategorySchema } from '../validators/categorySchemas';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';

const router = Router();

router.get('/', authenticate, getCategories);
router.post('/', authenticate, validate(createCategorySchema), createCategory);
router.put('/:id', authenticate, validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;
