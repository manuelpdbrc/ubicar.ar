import { Router } from 'express';
import { createLocation, getLocations } from '../controllers/locationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', upload.single('image'), createLocation);
router.get('/', getLocations);

export default router;
