import { Router } from 'express';
import { createCollection, getCollections, getCollectionById } from '../controllers/collectionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createCollection);
router.get('/', getCollections);
router.get('/:id', getCollectionById);

export default router;
