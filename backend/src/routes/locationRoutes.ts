import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import {
  getLocations,
  getLocationByCode,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController';
import { getVisitsByLocation } from '../controllers/visitController';

const router = Router();

// Public endpoint — QR scan landing (no auth required)
router.get('/code/:code', getLocationByCode);

// Protected endpoints
router.get('/', authenticate, getLocations);
router.get('/:id', authenticate, getLocationById);
router.get('/:id/visits', authenticate, getVisitsByLocation);
router.post('/', authenticate, upload.single('image'), createLocation);
router.put('/:id', authenticate, upload.single('image'), updateLocation);
router.delete('/:id', authenticate, deleteLocation);

export default router;
