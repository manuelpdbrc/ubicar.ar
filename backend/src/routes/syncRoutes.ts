import { Router } from 'express';
import { syncOfflineData } from '../controllers/syncController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticateToken);

// Accepts an array of files under the 'images' field
router.post('/', upload.array('images', 10), syncOfflineData);

export default router;
