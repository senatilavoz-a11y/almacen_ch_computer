import express from 'express';
import {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  generateModelCode
} from '../controllers/model.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllModels);
router.get('/generate-code', authenticate, generateModelCode);
router.get('/:id', authenticate, getModelById);
router.post('/', authenticate, createModel);
router.put('/:id', authenticate, authorize('ADMIN'), updateModel);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteModel);

export default router;

