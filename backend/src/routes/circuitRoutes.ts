import { Router } from 'express';
import { createCircuit, getCircuits } from '../controllers/circuitController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createCircuit);
router.get('/', getCircuits);

export default router;
