import { Router } from 'express';
import { exportCollectionKMZ } from '../controllers/exportController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/:id', exportCollectionKMZ);

export default router;
