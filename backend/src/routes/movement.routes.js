import express from 'express';
import {
  getAllMovements,
  createMovement,
  createMultipleMovements,
  getMovementById,
  getMovementByCode,
  generateMovementCodeHandler
} from '../controllers/movement.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/generate-code', authenticate, generateMovementCodeHandler);
router.get('/', authenticate, getAllMovements);
router.get('/code/:code', authenticate, getMovementByCode);
router.get('/:id', authenticate, getMovementById);
router.post('/batch', authenticate, createMultipleMovements);
router.post('/', authenticate, createMovement);

export default router;

