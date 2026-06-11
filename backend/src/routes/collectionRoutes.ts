import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { 
  getCollections, 
  getCollectionById, 
  createCollection, 
  updateCollection, 
  deleteCollection,
  addLocation,
  removeLocation,
  addInvitation,
  removePermission
} from '../controllers/collectionController';
import { collectionSchema, addLocationSchema, permissionSchema } from '../validators/collectionSchemas';

const router = Router();

router.use(authenticate);

router.get('/', getCollections);
router.get('/:id', getCollectionById);
router.post('/', validate(collectionSchema), createCollection);
router.put('/:id', validate(collectionSchema), updateCollection);
router.delete('/:id', deleteCollection);

router.post('/:id/locations', validate(addLocationSchema), addLocation);
router.delete('/:id/locations/:locationId', removeLocation);

router.post('/:id/permissions', validate(permissionSchema), addInvitation);
router.delete('/:id/permissions/:email', removePermission);

export default router;
