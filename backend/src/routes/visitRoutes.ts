import { Router } from 'express';
import { logVisit, getVisits } from '../controllers/visitController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/log', upload.single('image'), logVisit);
router.get('/', getVisits);

export default router;
