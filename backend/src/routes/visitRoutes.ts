import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createVisitSchema } from '../validators/visitSchemas';
import { createVisit, getVisitsByLocation } from '../controllers/visitController';

const router = Router();

// POST /api/visits - Create a visit (supports multiple images via multer array)
router.post('/', authenticate, upload.array('images', 10), validate(createVisitSchema), createVisit);

// GET /api/locations/:id/visits - Get visits for a location
router.get('/locations/:id/visits', authenticate, getVisitsByLocation);

export default router;
